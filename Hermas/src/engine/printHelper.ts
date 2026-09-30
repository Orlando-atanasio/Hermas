import { PortfolioSummary } from './portfolio';
import { Asset, Operation, Dividend, SystemSettings, UserProfile } from '../types';
import { formatBRL, formatPercent, D, toCanonicalString, isPositive, isNegative } from './decimal';
import { getDarfDueDate, formatCompetenciaBr, RealizedSaleTrade } from './tax';

export interface ReportPrintOptions {
  reportType: 'PATRIMONIO' | 'IRPF_ANUAL' | 'APURACAO_DARF' | 'GANHOS_REALIZADOS' | 'PROVENTOS_ANALITICO' | 'EXTRATO_OP';
  irpfYear: string;
  portfolio: PortfolioSummary;
  filteredPositions: any[];
  filteredOperations: Operation[];
  filteredDividends: Dividend[];
  filteredMonthlyTaxes: any[];
  filteredRealizedSales: RealizedSaleTrade[];
  userProfile?: UserProfile;
  settings?: SystemSettings;
  taxesSummary: {
    impostoApuradoTotal: any;
    impostoPagoTotal: any;
    impostoPendenteTotal: any;
    totalAlienado: any;
  };
  realizedSalesSummary: {
    volumeTotal: any;
    lucroLiquidoTotal: any;
    custosTotais: any;
    taxaAcertoPct: number;
    totalTrades: number;
  };
  proventosSummary: {
    totalLiquido: any;
    totalDividendos: any;
    totalJcp: any;
    totalFii: any;
    tickerTotals: Map<string, { totalLiquido: any; qtdLancamentos: number }>;
  };
  irpfData: {
    mapaProventos: Map<string, { dividendos: any; jcpLiquido: any; jcpRetencao: any; rendimentosFii: any }>;
    posicoes31Dez: any[];
  };
  assetMap: Map<string, Asset>;
}

/**
 * Gera um documento HTML completo, independente e pré-formatado para impressão
 * e geração de PDF com suporte a auto-print ao ser aberto no navegador.
 */
export function generateStandalonePrintHtml(opts: ReportPrintOptions): string {
  const {
    reportType,
    irpfYear,
    portfolio,
    filteredPositions,
    filteredOperations,
    filteredDividends,
    filteredMonthlyTaxes,
    filteredRealizedSales,
    userProfile,
    settings,
    taxesSummary,
    realizedSalesSummary,
    proventosSummary,
    irpfData,
    assetMap
  } = opts;

  const dataHoraEmissao = new Date().toLocaleString('pt-BR');
  const nomeTitular = userProfile?.nome || 'Investidor Titular';
  const cpfTitular = userProfile?.cpf ? ` • CPF: ${userProfile.cpf}` : '';
  const corretora = settings?.corretoraPadrao || 'Toro CTVM';

  let reportTitle = '';
  let reportSubtitle = '';
  let tableContent = '';

  if (reportType === 'PATRIMONIO') {
    reportTitle = 'Demonstrativo Contábil de Custódia & Alocação de Ativos';
    reportSubtitle = 'Posições em carteira, custo de aquisição, cotações de mercado e rentabilidade';
    
    tableContent = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Patrimônio Líquido:</span>
          <span class="kpi-val">${formatBRL(portfolio.patrimonioTotal)}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Custo Total Aportado:</span>
          <span class="kpi-val">${formatBRL(portfolio.custoTotalInvestido)}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Lucro Não Realizado:</span>
          <span class="kpi-val ${isPositive(portfolio.lucroNaoRealizadoTotal) ? 'text-green' : 'text-red'}">
            ${formatBRL(portfolio.lucroNaoRealizadoTotal)} (${formatPercent(portfolio.rentabilidadeNaoRealizadaTotalPct, true)})
          </span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Total Return Global:</span>
          <span class="kpi-val text-blue">${formatBRL(portfolio.totalReturnGeral)}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Ativo</th>
            <th>Nome / Empresa</th>
            <th>Classe</th>
            <th class="text-right">Qtd</th>
            <th class="text-right">Preço Médio</th>
            <th class="text-right">Custo Total</th>
            <th class="text-right">Cotação</th>
            <th class="text-right">Valor Mercado</th>
            <th class="text-right">Ganho Não Realizado</th>
            <th class="text-right">Rent. %</th>
            <th class="text-right">Proventos</th>
            <th class="text-right">Peso</th>
          </tr>
        </thead>
        <tbody>
          ${filteredPositions.map(p => `
            <tr>
              <td><strong>${p.ticker}</strong></td>
              <td>${p.asset.nome}</td>
              <td>${p.asset.tipo}</td>
              <td class="text-right font-mono">${p.quantidade}</td>
              <td class="text-right font-mono">${formatBRL(p.precoMedio)}</td>
              <td class="text-right font-mono">${formatBRL(p.custoTotal)}</td>
              <td class="text-right font-mono">${formatBRL(p.precoAtual)}</td>
              <td class="text-right font-mono font-bold">${formatBRL(p.valorAtual)}</td>
              <td class="text-right font-mono ${isPositive(p.lucroNaoRealizado) ? 'text-green' : isNegative(p.lucroNaoRealizado) ? 'text-red' : ''}">
                ${formatBRL(p.lucroNaoRealizado)}
              </td>
              <td class="text-right font-mono">${formatPercent(p.rentabilidadeNaoRealizadaPct, true)}</td>
              <td class="text-right font-mono text-green">${formatBRL(p.proventosRecebidosHistorico)}</td>
              <td class="text-right font-mono">${formatPercent(p.percentualCarteira)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (reportType === 'IRPF_ANUAL') {
    reportTitle = `Informe Consolidado para Declaração Anual de IRPF • Ano-Calendário ${irpfYear}`;
    reportSubtitle = `Dados prontos para o programa da Receita Federal (Bens e Direitos, Rendimentos e Renda Variável)`;

    // Bens e Direitos
    const bensRows = irpfData.posicoes31Dez.map(pos => {
      const isAcao = pos.asset.tipo === 'AÇÃO';
      const isFii = pos.asset.tipo === 'FII';
      const codigo = isAcao ? '03 - 01 (Ações)' : isFii ? '07 - 03 (FII)' : '04 - 04 (BDR/Outros)';
      const textoDisc = `${pos.quantidade} ${isFii ? 'cotas' : 'ações'} de ${pos.asset.nome} (${pos.ticker})${pos.asset.cnpj ? `, CNPJ: ${pos.asset.cnpj}` : ''}, custodiadas na ${corretora}, adquiridas ao custo total de ${formatBRL(pos.custoTotal)} (Preço Médio de ${formatBRL(pos.precoMedio)}).`;

      return `
        <tr>
          <td>${codigo}</td>
          <td><strong>${pos.ticker}</strong><br><small>${pos.asset.nome}</small></td>
          <td>${pos.asset.cnpj || 'Não cadastrado'}</td>
          <td class="text-right font-mono">${pos.quantidade}</td>
          <td class="text-right font-mono font-bold">${formatBRL(pos.custoTotal)}</td>
          <td class="small-text font-mono">${textoDisc}</td>
        </tr>
      `;
    }).join('');

    // Proventos
    const provRows = Array.from(irpfData.mapaProventos.entries()).map(([t, data]) => {
      const asset = assetMap.get(t);
      const totalIsento = data.dividendos.add(data.rendimentosFii);
      return `
        <tr>
          <td><strong>${t}</strong><br><small>${asset?.nome || t}</small></td>
          <td>${asset?.cnpj || 'Não cadastrado'}</td>
          <td class="text-right font-mono text-green font-bold">${formatBRL(totalIsento)}</td>
          <td class="text-right font-mono font-bold">${formatBRL(data.jcpLiquido)}</td>
          <td class="text-right font-mono text-amber">${formatBRL(data.jcpRetencao)}</td>
        </tr>
      `;
    }).join('');

    tableContent = `
      <h3 class="section-title">1. Ficha "Bens e Direitos" (Posições em Custódia em 31/12/${irpfYear})</h3>
      <table>
        <thead>
          <tr>
            <th>Grupo / Código</th>
            <th>Ativo</th>
            <th>CNPJ</th>
            <th class="text-right">Qtd</th>
            <th class="text-right">Situação 31/12</th>
            <th>Discriminação Oficial</th>
          </tr>
        </thead>
        <tbody>
          ${bensRows}
        </tbody>
      </table>

      <h3 class="section-title page-break-before">2. Fichas de Rendimentos — Isentos e Tributação Exclusiva (${irpfYear})</h3>
      <table>
        <thead>
          <tr>
            <th>Fonte Pagadora</th>
            <th>CNPJ</th>
            <th class="text-right">Isentos (Cód. 09 / 26)</th>
            <th class="text-right">JCP Líquido (Cód. 10)</th>
            <th class="text-right">IRRF Retido Fonte (15%)</th>
          </tr>
        </thead>
        <tbody>
          ${provRows.length > 0 ? provRows : '<tr><td colspan="5" class="text-center">Nenhum provento recebido no ano-calendário.</td></tr>'}
        </tbody>
      </table>
    `;
  } else if (reportType === 'APURACAO_DARF') {
    reportTitle = 'Demonstrativo Mensal de Apuração Fiscal & Controle de DARFs';
    reportSubtitle = 'Vendas, isenção de R$ 20k em ações, compensação de prejuízos e DARFs a pagar (Código 6015)';

    tableContent = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Volume Total Alienado:</span>
          <span class="kpi-val">${formatBRL(taxesSummary.totalAlienado)}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Total Imposto Apurado:</span>
          <span class="kpi-val text-amber">${formatBRL(taxesSummary.impostoApuradoTotal)}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">DARFs Quitadas:</span>
          <span class="kpi-val text-green">${formatBRL(taxesSummary.impostoPagoTotal)}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">DARFs Pendentes:</span>
          <span class="kpi-val text-amber">${formatBRL(taxesSummary.impostoPendenteTotal)}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Competência</th>
            <th class="text-right">Vendas Ações</th>
            <th class="text-center">Isenção 20k</th>
            <th class="text-right">Lucro/Prej. Ações</th>
            <th class="text-right">Vendas FIIs</th>
            <th class="text-right">Lucro/Prej. FIIs</th>
            <th class="text-right">Prej. Compensado</th>
            <th class="text-right">Imposto Bruto</th>
            <th class="text-right">IRRF Fonte</th>
            <th class="text-right">DARF Devido</th>
            <th class="text-center">Vencimento</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${filteredMonthlyTaxes.map(tax => {
            const paid = settings?.darfsPagas?.[tax.mesAno];
            const isPaid = Boolean(paid);
            const hasTax = D(tax.impostoAPagarAposDedoDuro).gt(0);
            const isBelow10 = hasTax && D(tax.impostoAPagarAposDedoDuro).lt(10);
            const status = isPaid ? 'QUITADO' : isBelow10 ? 'ACUMULADO (< R$ 10)' : hasTax ? 'PENDENTE' : tax.statusMensal;

            return `
              <tr>
                <td><strong>${tax.mesAno}</strong></td>
                <td class="text-right font-mono">${formatBRL(tax.totalVendasAcoesSwing)}</td>
                <td class="text-center">${tax.isentoAcoesSwing ? '<span class="badge badge-green">ISENTO</span>' : '<span class="badge badge-amber">TRIBUTÁVEL</span>'}</td>
                <td class="text-right font-mono ${D(tax.lucroLiquidoAcoesSwing).gt(0) ? 'text-green' : D(tax.lucroLiquidoAcoesSwing).lt(0) ? 'text-red' : ''}">${formatBRL(tax.lucroLiquidoAcoesSwing)}</td>
                <td class="text-right font-mono">${formatBRL(tax.totalVendasFII)}</td>
                <td class="text-right font-mono ${D(tax.lucroLiquidoFII).gt(0) ? 'text-green' : D(tax.lucroLiquidoFII).lt(0) ? 'text-red' : ''}">${formatBRL(tax.lucroLiquidoFII)}</td>
                <td class="text-right font-mono">${formatBRL(D(tax.prejuizoCompensadoAcoes).add(D(tax.prejuizoCompensadoFII)))}</td>
                <td class="text-right font-mono">${formatBRL(tax.totalImpostoDevido)}</td>
                <td class="text-right font-mono">${formatBRL(tax.irrfDedoDuro)}</td>
                <td class="text-right font-mono font-bold ${hasTax ? 'text-amber' : ''}">${formatBRL(tax.impostoAPagarAposDedoDuro)}</td>
                <td class="text-center font-mono">${getDarfDueDate(tax.mesAno)}</td>
                <td class="text-center font-bold">${status}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } else if (reportType === 'GANHOS_REALIZADOS') {
    reportTitle = 'Diário de Vendas & Performance Realizada de Operações';
    reportSubtitle = 'Rastreamento individual de cada venda com apuração de preço médio e lucro líquido';

    tableContent = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Volume Total de Vendas:</span>
          <span class="kpi-val">${formatBRL(realizedSalesSummary.volumeTotal)}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Lucro Líquido Realizado:</span>
          <span class="kpi-val ${isPositive(realizedSalesSummary.lucroLiquidoTotal) ? 'text-green' : 'text-red'}">
            ${formatBRL(realizedSalesSummary.lucroLiquidoTotal)}
          </span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Custos Operacionais B3:</span>
          <span class="kpi-val">${formatBRL(realizedSalesSummary.custosTotais)}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Taxa de Acerto:</span>
          <span class="kpi-val text-blue">${realizedSalesSummary.taxaAcertoPct.toFixed(1)}% (${realizedSalesSummary.totalTrades} vendas)</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Ticker</th>
            <th>Classe</th>
            <th class="text-right">Qtd</th>
            <th class="text-right">Preço Venda</th>
            <th class="text-right">Valor Alienado</th>
            <th class="text-right">Preço Médio</th>
            <th class="text-right">Custo Baixado</th>
            <th class="text-right">Custos</th>
            <th class="text-right">Lucro/Prej. Líquido</th>
            <th class="text-right">Rent. %</th>
            <th>Regime Fiscal</th>
          </tr>
        </thead>
        <tbody>
          ${filteredRealizedSales.map(s => `
            <tr>
              <td class="font-mono">${s.dataPregao}</td>
              <td><strong>${s.ticker}</strong></td>
              <td>${s.assetTipo}</td>
              <td class="text-right font-mono">${s.quantidade}</td>
              <td class="text-right font-mono">${formatBRL(s.precoVenda)}</td>
              <td class="text-right font-mono font-bold">${formatBRL(s.valorTotalVenda)}</td>
              <td class="text-right font-mono">${formatBRL(s.custoMedioUnitario)}</td>
              <td class="text-right font-mono">${formatBRL(s.custoTotalBaixado)}</td>
              <td class="text-right font-mono">${formatBRL(s.custosOperacionais)}</td>
              <td class="text-right font-mono font-bold ${isPositive(s.lucroLiquido) ? 'text-green' : isNegative(s.lucroLiquido) ? 'text-red' : ''}">
                ${formatBRL(s.lucroLiquido)}
              </td>
              <td class="text-right font-mono">${formatPercent(s.rentabilidadePct, true)}</td>
              <td>${s.regimeTributario}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (reportType === 'PROVENTOS_ANALITICO') {
    reportTitle = 'Relatório Analítico de Proventos & Yield on Cost (YoC)';
    reportSubtitle = 'Proventos recebidos, retenção de IR na fonte e rentabilidade em dividendos sobre o custo';

    tableContent = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Total Líquido Recebido:</span>
          <span class="kpi-val text-green">${formatBRL(proventosSummary.totalLiquido)}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Dividendos Isentos (Ações):</span>
          <span class="kpi-val">${formatBRL(proventosSummary.totalDividendos)}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">JCP Líquido:</span>
          <span class="kpi-val">${formatBRL(proventosSummary.totalJcp)}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Rendimentos FIIs:</span>
          <span class="kpi-val text-blue">${formatBRL(proventosSummary.totalFii)}</span>
        </div>
      </div>

      <h3 class="section-title">Consolidação por Ativo & Yield on Cost Histórico</h3>
      <table>
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Nome</th>
            <th class="text-right">Lançamentos</th>
            <th class="text-right">Custo Investido</th>
            <th class="text-right">Total Recebido</th>
            <th class="text-right">Yield on Cost (YoC)</th>
          </tr>
        </thead>
        <tbody>
          ${Array.from(proventosSummary.tickerTotals.entries()).map(([t, data]) => {
            const pos = portfolio.posicoesCustodia.find(p => p.ticker.toUpperCase() === t);
            const asset = assetMap.get(t);
            const custo = pos ? D(pos.custoTotal) : D(0);
            const yocPct = custo.gt(0) ? data.totalLiquido.div(custo).mul(100) : D(0);
            return `
              <tr>
                <td><strong>${t}</strong></td>
                <td>${asset?.nome || t}</td>
                <td class="text-right font-mono">${data.qtdLancamentos}</td>
                <td class="text-right font-mono">${formatBRL(custo)}</td>
                <td class="text-right font-mono text-green font-bold">${formatBRL(data.totalLiquido)}</td>
                <td class="text-right font-mono font-bold text-blue">${formatPercent(yocPct)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <h3 class="section-title page-break-before">Extrato Cronológico de Proventos</h3>
      <table>
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Tipo</th>
            <th>Data COM</th>
            <th>Data Pagamento</th>
            <th class="text-right">Valor / Cota</th>
            <th class="text-right">Qtd Base</th>
            <th class="text-right">Valor Bruto</th>
            <th class="text-right">IRRF Retido</th>
            <th class="text-right">Valor Líquido</th>
          </tr>
        </thead>
        <tbody>
          ${filteredDividends.map(d => `
            <tr>
              <td><strong>${d.ticker}</strong></td>
              <td>${d.tipo}</td>
              <td class="font-mono">${d.dataCom}</td>
              <td class="font-mono">${d.dataPagamento}</td>
              <td class="text-right font-mono">${formatBRL(d.valorPorAcao)}</td>
              <td class="text-right font-mono">${d.quantidadeBase}</td>
              <td class="text-right font-mono">${formatBRL(d.valorBruto)}</td>
              <td class="text-right font-mono text-amber">${formatBRL(d.retencaoIr || '0.00')}</td>
              <td class="text-right font-mono font-bold text-green">${formatBRL(d.valorLiquido)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else {
    // EXTRATO_OP
    reportTitle = 'Extrato Cronológico e Rastreabilidade de Ordens';
    reportSubtitle = 'Histórico detalhado de compras, vendas, bonificações e desdobramentos';

    tableContent = `
      <table>
        <thead>
          <tr>
            <th>Pregão</th>
            <th>Liquidação</th>
            <th>Ticker</th>
            <th>Operação</th>
            <th>Mercado</th>
            <th class="text-right">Qtd</th>
            <th class="text-right">Preço Unitário</th>
            <th class="text-right">Taxas & Custos</th>
            <th class="text-right">Valor Total</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${filteredOperations.map(op => `
            <tr>
              <td class="font-mono">${op.dataPregao}</td>
              <td class="font-mono">${op.dataLiquidacao || '-'}</td>
              <td><strong>${op.ticker}</strong></td>
              <td><strong>${op.tipo}</strong></td>
              <td>${op.mercado}</td>
              <td class="text-right font-mono">${op.quantidade}</td>
              <td class="text-right font-mono">${formatBRL(op.precoUnitario)}</td>
              <td class="text-right font-mono">${formatBRL(op.custosTotais)}</td>
              <td class="text-right font-mono font-bold">${formatBRL(op.valorTotalOperacao)}</td>
              <td class="text-center font-bold">${op.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hermas — ${reportTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 8mm 10mm 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 9px;
      line-height: 1.35;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 16px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .badge-brand {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      background: #e2e8f0;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 6px;
      text-transform: uppercase;
    }
    .title {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      margin: 4px 0 2px 0;
    }
    .subtitle {
      font-size: 10px;
      color: #64748b;
      margin: 0;
    }
    .meta {
      text-align: right;
      font-size: 9px;
      color: #64748b;
      line-height: 1.3;
    }
    .meta strong {
      color: #0f172a;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    .kpi-card {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 8px 10px;
      border-radius: 6px;
    }
    .kpi-label {
      display: block;
      font-size: 9px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }
    .kpi-val {
      font-size: 13px;
      font-weight: 700;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #0f172a;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin: 16px 0 8px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5px;
      margin-bottom: 16px;
      page-break-inside: auto;
    }
    th, td {
      padding: 5px 6px;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
      vertical-align: middle;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8px;
      letter-spacing: 0.3px;
      white-space: nowrap;
    }
    tr {
      page-break-inside: avoid;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { 
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      white-space: nowrap;
    }
    .font-bold { font-weight: 700; }
    .text-green { color: #059669; }
    .text-red { color: #dc2626; }
    .text-blue { color: #2563eb; }
    .text-amber { color: #d97706; }
    .small-text { font-size: 8px; color: #475569; line-height: 1.2; }
    .badge {
      display: inline-block;
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 8px;
      font-weight: 700;
    }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-amber { background: #fef3c7; color: #b45309; }
    .footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      margin-top: 20px;
      font-size: 8.5px;
      color: #64748b;
      line-height: 1.4;
    }
    .footer-flex {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-weight: 600;
    }
    .legal-note {
      font-size: 7.5px;
      color: #94a3b8;
      border-top: 1px dashed #e2e8f0;
      padding-top: 6px;
    }
    .page-break-before {
      page-break-before: always;
    }
    .print-actions {
      margin-bottom: 16px;
      padding: 12px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .btn-print {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
    }
    @media print {
      .print-actions { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <div>
      <strong style="color: #1e40af; font-size: 12px;">Documento Contábil Hermas — Pronto para Impressão / Salvar como PDF</strong>
      <p style="margin: 2px 0 0 0; font-size: 10px; color: #3b82f6;">
        No diálogo que abrir, selecione <strong>"Destino: Salvar como PDF"</strong> para gerar um PDF com formatação gráfica perfeita.
      </p>
    </div>
    <button class="btn-print" onclick="window.print()">
      Abrir Diálogo de Impressão / PDF
    </button>
  </div>

  <div class="header">
    <div style="display: flex; align-items: flex-start; gap: 16px;">
      <div style="text-align: center; flex-shrink: 0; width: 110px;">
        <svg viewBox="0 0 200 200" width="46" height="46" style="display: block; margin: 0 auto;" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="printGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FCD34D" />
              <stop offset="40%" stop-color="#EAB308" />
              <stop offset="80%" stop-color="#CA8A04" />
              <stop offset="100%" stop-color="#A16207" />
            </linearGradient>
            <linearGradient id="printNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#172554" />
              <stop offset="60%" stop-color="#0F172A" />
              <stop offset="100%" stop-color="#0B132B" />
            </linearGradient>
          </defs>
          <path d="M 42 35 L 72 35 L 72 108 C 64 118 56 129 48 141 L 42 141 Z" fill="url(#printNavyGrad)" />
          <path d="M 42 141 L 48 141 C 54 150 60 159 66 165 L 42 165 Z" fill="url(#printNavyGrad)" />
          <rect x="76" y="98" width="9.5" height="32" rx="1.5" fill="url(#printGoldGrad)" />
          <rect x="88.5" y="82" width="9.5" height="48" rx="1.5" fill="url(#printGoldGrad)" />
          <rect x="101" y="66" width="9.5" height="64" rx="1.5" fill="url(#printGoldGrad)" />
          <rect x="113.5" y="50" width="9.5" height="80" rx="1.5" fill="url(#printGoldGrad)" />
          <path d="M 126 35 L 156 35 L 156 165 L 126 165 L 126 112 C 137 104 147 97 153 92 L 153 96 C 144 102 135 108 126 116 Z" fill="url(#printNavyGrad)" />
          <path d="M 48 141 C 67 113 97 91 154 85 C 156 86 155 90 152 92 C 97 99 71 124 49 144 Z" fill="#FFFFFF" />
          <path d="M 49 145 C 71 125 99 100 152 93 L 152 102 C 103 112 77 137 67 165 L 55 165 C 52 158 50 151 49 145 Z" fill="url(#printNavyGrad)" />
        </svg>
        <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 13px; font-weight: 800; letter-spacing: 2.5px; color: #0F172A; margin-top: 3px; line-height: 1;">HERMAS</div>
        <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 6.5px; font-weight: 700; letter-spacing: 0.8px; color: #64748B; margin-top: 2px; text-transform: uppercase; white-space: nowrap;">CLAREZA • CONTROLE • TRANSPARÊNCIA</div>
      </div>

      <div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="badge-brand">Patrimônio & Contabilidade Pessoal</span>
          <span style="font-size: 8px; color: #94a3b8; font-family: monospace;">VIA OFICIAL</span>
        </div>
        <div class="title" style="margin-top: 3px;">${reportTitle}</div>
        <div class="subtitle">${reportSubtitle}</div>
      </div>
    </div>

    <div class="meta">
      <div>Titular: <strong>${nomeTitular}</strong>${cpfTitular}</div>
      <div>Data de Emissão: <strong>${dataHoraEmissao}</strong></div>
      <div>Custodiante Padrão: <strong>${corretora}</strong></div>
      <div>Hash de Integridade: <span class="font-mono">Hermas-Deterministic-v1</span></div>
    </div>
  </div>

  ${tableContent}

  <div class="footer">
    <div class="footer-flex">
      <span>Hermas — Proteção patrimonial, soberania de dados e memória de cálculo determinística</span>
      <span>Relatório Contábil Pessoal • Página 1 de 1</span>
    </div>
    <div class="legal-note">
      <strong>Nota Legal & Tributária:</strong> Este documento possui finalidade estritamente organizativa, contábil e de consulta pessoal. 
      Não emite guias bancárias, não gera boletos de DARF e não substitui a transmissão oficial da Declaração de Ajuste Anual perante a Receita Federal do Brasil. 
      O recolhimento de DARFs mensais sobre ganhos líquidos em operações de bolsa (código de receita 6015) deve ser efetuado pelo próprio investidor diretamente no seu Internet Banking. 
      Fundamentado na Lei Federal nº 11.033/2004, Lei nº 8.668/1993 e Instrução Normativa RFB nº 1.585/2015.
    </div>
  </div>

  <script>
    // Dispara a impressão automaticamente quando aberto em uma nova aba do navegador
    window.onload = function() {
      // Pequeno timeout para garantir renderização de fontes
      setTimeout(function() {
        try {
          window.print();
        } catch (e) {}
      }, 400);
    };
  </script>
</body>
</html>`;
}

/**
 * Tenta disparar a impressão via iframe invisível para contornar
 * eventuais bloqueios de window.print() em contêineres e iframes do navegador.
 */
export function printViaHiddenIframe(htmlContent: string): boolean {
  try {
    const existing = document.getElementById('hermas-print-iframe');
    if (existing) {
      existing.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'hermas-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.print();
        }
      }, 500);
      return true;
    }
  } catch (err) {
    console.warn('[Hermas] Fallback para window.print direto:', err);
  }
  return false;
}

/**
 * Faz o download do documento HTML auto-imprimível, permitindo que o usuário
 * abra em qualquer aba do Chrome/Edge/Firefox e salve como PDF diretamente sem restrições.
 */
export function downloadPrintableHtml(htmlContent: string, fileName: string): void {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
