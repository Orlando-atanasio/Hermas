import React from 'react';
import { 
  Building2, 
  Coins, 
  Layers, 
  Landmark, 
  Copy, 
  Check, 
  Calendar,
  Receipt,
  TrendingUp
} from 'lucide-react';
import { HermasOfficialLogo } from '../brand/HermasOfficialLogo';
import { PortfolioSummary } from '../../engine/portfolio';
import { 
  Operation, 
  Dividend, 
  Asset, 
  SystemSettings, 
  UserProfile 
} from '../../types';
import { 
  formatBRL, 
  formatPercent, 
  D, 
  isPositive, 
  isNegative 
} from '../../engine/decimal';
import { 
  getDarfDueDate, 
  formatCompetenciaBr,
  RealizedSaleTrade
} from '../../engine/tax';
import { ReportType } from './ReportsView';

export interface HermasReportDocumentProps {
  reportType: ReportType;
  irpfYear: string;
  portfolio: PortfolioSummary;
  filteredPositions: any[];
  filteredOperations: Operation[];
  filteredDividends: Dividend[];
  filteredMonthlyTaxes: any[];
  filteredRealizedSales: RealizedSaleTrade[];
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
  monthlyTaxes: any[];
  copiedId: string | null;
  onCopyText: (text: string, id: string) => void;
  userProfile?: UserProfile;
  settings?: SystemSettings;
  assetMap: Map<string, Asset>;
  isSimulation?: boolean;
}

export const HermasReportDocument: React.FC<HermasReportDocumentProps> = ({
  reportType,
  irpfYear,
  portfolio,
  filteredPositions,
  filteredOperations,
  filteredDividends,
  filteredMonthlyTaxes,
  filteredRealizedSales,
  taxesSummary,
  realizedSalesSummary,
  proventosSummary,
  irpfData,
  monthlyTaxes,
  copiedId,
  onCopyText,
  userProfile,
  settings,
  assetMap,
  isSimulation = false,
}) => {
  return (
    <div className={isSimulation ? "print-paper-sheet space-y-6" : "space-y-6"}>
      {/* Cabeçalho Institucional Oficial do Relatório com Logomarca Hermas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b-2 border-slate-900 dark:border-slate-700 print:border-slate-900 gap-6">
        {/* Lado Esquerdo: Logomarca Oficial Hermas em Destaque + Identificação do Relatório */}
        <div className="flex items-center gap-6">
          {/* Logo Oficial Proeminente: Símbolo H ampliado com HERMAS embaixo (sem slogan) */}
          <div className="shrink-0 sm:pr-6 sm:border-r sm:border-slate-200 sm:dark:border-slate-800 print:border-slate-300">
            <HermasOfficialLogo layout="vertical" size="lg" showSlogan={false} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 dark:text-slate-500 print:text-slate-600 font-mono">
                Patrimônio Contábil Pessoal • Via Oficial
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white print:text-slate-900 leading-snug tracking-tight">
              {reportType === 'PATRIMONIO' && 'Demonstrativo Contábil de Custódia & Alocação de Ativos'}
              {reportType === 'IRPF_ANUAL' && `Informe Consolidado para Declaração Anual de Ajuste do IRPF (Ano-Calendário ${irpfYear})`}
              {reportType === 'APURACAO_DARF' && 'Demonstrativo Mensal de Apuração Fiscal, Isenções e Controle de DARFs'}
              {reportType === 'GANHOS_REALIZADOS' && 'Diário de Vendas & Performance Realizada de Operações Encerradas'}
              {reportType === 'PROVENTOS_ANALITICO' && 'Relatório Analítico de Proventos Recebidos & Yield on Cost (YoC)'}
              {reportType === 'EXTRATO_OP' && 'Extrato Cronológico e Rastreabilidade de Ordens de Negociação'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600">
              Hermas Vault • Sistema Integrado de Gestão Patrimonial, Tributária e Custódia
            </p>
          </div>
        </div>

        {/* Lado Direito: Metadados do Titular, Emissão e Autenticidade */}
        <div className="text-left lg:text-right text-xs text-slate-600 dark:text-slate-400 print:text-slate-600 space-y-1 lg:self-center shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
          <p>
            Titular: <strong className="text-slate-900 dark:text-slate-100 print:text-slate-900 font-semibold">{userProfile?.nome || 'Investidor Titular'}</strong>
            {userProfile?.cpf && <span className="block lg:inline lg:before:content-['•_'] font-mono font-medium">CPF: {userProfile.cpf}</span>}
          </p>
          <p>
            Emissão: <strong className="text-slate-800 dark:text-slate-200 print:text-slate-800 font-mono-numbers">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong>
          </p>
          <p className="font-mono text-[10px] text-slate-400 print:text-slate-500">
            Autenticidade: SHA256-Hermas-Deterministic
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* RELATÓRIO 1: DEMONSTRATIVO PATRIMONIAL & ALOCAÇÃO                  */}
      {/* ------------------------------------------------------------------- */}
      {reportType === 'PATRIMONIO' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Patrimônio Líquido (Mercado):</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white font-mono-numbers">
                {formatBRL(portfolio.patrimonioTotal)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Custo Total Investido (Preço Médio):</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white font-mono-numbers">
                {formatBRL(portfolio.custoTotalInvestido)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Lucro Não Realizado:</span>
              <span className={`text-lg font-bold font-mono-numbers ${
                isPositive(portfolio.lucroNaoRealizadoTotal) ? 'text-emerald-600 dark:text-emerald-400' : isNegative(portfolio.lucroNaoRealizadoTotal) ? 'text-red-500' : 'text-slate-700'
              }`}>
                {formatBRL(portfolio.lucroNaoRealizadoTotal)} ({formatPercent(portfolio.rentabilidadeNaoRealizadaTotalPct, true)})
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Retorno Global (Total Return):</span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono-numbers">
                {formatBRL(portfolio.totalReturnGeral)}
              </span>
            </div>
          </div>

          {/* Tabela de Custódia */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left text-xs min-w-[950px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold text-[11px] whitespace-nowrap bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="px-3 py-2.5 text-left">Ticker</th>
                  <th className="px-3 py-2.5 text-left">Nome / Empresa</th>
                  <th className="px-3 py-2.5 text-center">Classe</th>
                  <th className="px-3 py-2.5 text-right">Quantidade</th>
                  <th className="px-3 py-2.5 text-right">Preço Médio</th>
                  <th className="px-3 py-2.5 text-right">Custo Total</th>
                  <th className="px-3 py-2.5 text-right">Cotação Atual</th>
                  <th className="px-3 py-2.5 text-right">Valor de Mercado</th>
                  <th className="px-3 py-2.5 text-right">Ganho Não Realizado</th>
                  <th className="px-3 py-2.5 text-right">Rent. (%)</th>
                  <th className="px-3 py-2.5 text-right">Proventos</th>
                  <th className="px-3 py-2.5 text-right">Peso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {filteredPositions.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-400 font-sans">
                      Nenhum ativo localizado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredPositions.map(p => (
                    <tr key={p.ticker} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 whitespace-nowrap">
                      <td className="px-3 py-2.5 text-left font-bold text-slate-900 dark:text-white font-mono">{p.ticker}</td>
                      <td className="px-3 py-2.5 text-left font-sans text-slate-600 dark:text-slate-300 max-w-[140px] truncate" title={p.asset.nome}>{p.asset.nome}</td>
                      <td className="px-3 py-2.5 text-center font-sans">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                          {p.asset.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-800 dark:text-slate-200">{p.quantidade}</td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-700 dark:text-slate-300">{formatBRL(p.precoMedio)}</td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-600 dark:text-slate-400">{formatBRL(p.custoTotal)}</td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums font-medium text-slate-900 dark:text-white">{formatBRL(p.precoAtual)}</td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums font-bold text-slate-900 dark:text-white">{formatBRL(p.valorAtual)}</td>
                      <td className={`px-3 py-2.5 text-right font-mono-numbers tabular-nums font-semibold ${
                        isPositive(p.lucroNaoRealizado) ? 'text-emerald-600 dark:text-emerald-400' : isNegative(p.lucroNaoRealizado) ? 'text-red-500' : 'text-slate-600'
                      }`}>
                        {formatBRL(p.lucroNaoRealizado)}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-mono-numbers tabular-nums font-bold ${
                        isPositive(p.lucroNaoRealizado) ? 'text-emerald-600 dark:text-emerald-400' : isNegative(p.lucroNaoRealizado) ? 'text-red-500' : 'text-slate-600'
                      }`}>{formatPercent(p.rentabilidadeNaoRealizadaPct, true)}</td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">{formatBRL(p.proventosRecebidosHistorico)}</td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums font-semibold text-slate-800 dark:text-slate-200">{formatPercent(p.percentualCarteira)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* RELATÓRIO 2: DECLARAÇÃO DE AJUSTE ANUAL DO IRPF                    */}
      {/* ------------------------------------------------------------------- */}
      {reportType === 'IRPF_ANUAL' && (
        <div className="space-y-6">
          {/* Aviso Institucional e Informativo */}
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
            <Landmark className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm">
                Orientações para o Programa da Receita Federal (Ano-Calendário {irpfYear} • Exercício {Number(irpfYear) + 1})
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Os valores abaixo foram calculados rigorosamente pelas regras contábeis da Receita Federal:
                o custo em <strong>Bens e Direitos</strong> é calculado pelo <strong>Preço Médio de Aquisição</strong> com taxas inclusas
                (e não pela cotação de mercado). Os dividendos e JCP estão segregados por fonte pagadora (com CNPJ) e regime de tributação.
              </p>
            </div>
          </div>

          {/* QUADRO 1: FICHA BENS E DIREITOS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>1. Ficha "Bens e Direitos" (Posições em Custódia em 31/12/{irpfYear})</span>
              </h4>
              <span className="text-xs text-slate-500 font-mono">
                {irpfData.posicoes31Dez.length} ativo(s)
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs min-w-[750px] border-collapse">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                  <tr>
                    <th className="px-3 py-2.5 text-left">Grupo / Código</th>
                    <th className="px-3 py-2.5 text-left">Ticker / Ativo</th>
                    <th className="px-3 py-2.5 text-left">CNPJ</th>
                    <th className="px-3 py-2.5 text-right">Quantidade</th>
                    <th className="px-3 py-2.5 text-right">Preço Médio</th>
                    <th className="px-3 py-2.5 text-right">Situação em 31/12/{Number(irpfYear) - 1}</th>
                    <th className="px-3 py-2.5 text-right">Situação em 31/12/{irpfYear}</th>
                    <th className="px-3 py-2.5 text-left print:hidden">Texto de Discriminação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                  {irpfData.posicoes31Dez.map(pos => {
                    const isAcao = pos.asset.tipo === 'AÇÃO';
                    const isFii = pos.asset.tipo === 'FII';
                    const grupoCodigo = isAcao ? '03 - 01 (Ações)' : isFii ? '07 - 03 (FII)' : '04 - 04 (BDR / Outros)';
                    const custoAnoAnt = (irpfData as any).mapaCustoAnoAnterior?.get(pos.ticker) || '0.00';
                    const textoDisc = `${pos.quantidade} ${isFii ? 'cotas' : 'ações'} de ${pos.asset.nome} (${pos.ticker})${pos.asset.cnpj ? `, CNPJ: ${pos.asset.cnpj}` : ''}, custodiadas na ${settings?.corretoraPadrao || 'Toro CTVM'}, adquiridas ao custo total de ${formatBRL(pos.custoTotal)} (Preço Médio de ${formatBRL(pos.precoMedio)}).`;

                    return (
                      <tr key={pos.ticker} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 whitespace-nowrap">
                        <td className="px-3 py-2.5 font-sans font-semibold text-slate-700 dark:text-slate-300">{grupoCodigo}</td>
                        <td className="px-3 py-2.5">
                          <span className="font-bold text-slate-900 dark:text-white block font-mono">{pos.ticker}</span>
                          <span className="text-[10px] text-slate-400 font-sans block truncate max-w-[140px]">{pos.asset.nome}</span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 font-sans">{pos.asset.cnpj || 'Não cadastrado'}</td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-800 dark:text-slate-200">{pos.quantidade}</td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-700 dark:text-slate-300">{formatBRL(pos.precoMedio)}</td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-500">{formatBRL(custoAnoAnt)}</td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums font-bold text-slate-900 dark:text-white">{formatBRL(pos.custoTotal)}</td>
                        <td className="px-3 py-2.5 print:hidden">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[260px] text-[10px] text-slate-500 font-sans" title={textoDisc}>
                              {textoDisc}
                            </span>
                            <button
                              onClick={() => onCopyText(textoDisc, `disc_${pos.ticker}`)}
                              className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 text-blue-600 dark:text-blue-300 text-[10px] font-semibold transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                            >
                              {copiedId === `disc_${pos.ticker}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-600">Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copiar</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* QUADRO 2: RENDIMENTOS ISENTOS E TRIBUTAÇÃO EXCLUSIVA */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-600" />
              <span>2. Fichas de Rendimentos — Dividendos (Isentos) e JCP (Tributação Exclusiva) em {irpfYear}</span>
            </h4>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs min-w-[700px] border-collapse">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                  <tr>
                    <th className="px-3 py-2.5 text-left">Fonte Pagadora</th>
                    <th className="px-3 py-2.5 text-left">CNPJ</th>
                    <th className="px-3 py-2.5 text-right">Rendimentos Isentos (Cód. 09 / 26)</th>
                    <th className="px-3 py-2.5 text-right">JCP Líquido (Cód. 10 - Exclusiva)</th>
                    <th className="px-3 py-2.5 text-right">IRRF Retido na Fonte (15% JCP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                  {irpfData.mapaProventos.size === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 font-sans">
                        Nenhum provento registrado no ano-calendário {irpfYear}.
                      </td>
                    </tr>
                  ) : (
                    Array.from(irpfData.mapaProventos.entries()).map(([t, data]) => {
                      const asset = assetMap.get(t);
                      const totalIsento = data.dividendos.add(data.rendimentosFii);

                      return (
                        <tr key={t} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 whitespace-nowrap">
                          <td className="px-3 py-2.5">
                            <span className="font-bold text-slate-900 dark:text-white block font-mono">{t}</span>
                            <span className="text-[10px] text-slate-400 font-sans block truncate max-w-[140px]">{asset?.nome || t}</span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 font-sans">{asset?.cnpj || 'Não cadastrado'}</td>
                          <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-emerald-600 font-semibold">{formatBRL(totalIsento)}</td>
                          <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums font-semibold text-slate-700 dark:text-slate-300">{formatBRL(data.jcpLiquido)}</td>
                          <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-amber-600">{formatBRL(data.jcpRetencao)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* QUADRO 3: GRADE DE RENDA VARIÁVEL MÊS A MÊS */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>3. Ficha "Renda Variável — Operações Comuns / Day-Trade" (Ano {irpfYear})</span>
            </h4>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs min-w-[700px] border-collapse">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                  <tr>
                    <th className="px-3 py-2.5 text-left">Mês</th>
                    <th className="px-3 py-2.5 text-right">Ações (Comum)</th>
                    <th className="px-3 py-2.5 text-right">FII / FIAGRO</th>
                    <th className="px-3 py-2.5 text-right">Resultado Líquido</th>
                    <th className="px-3 py-2.5 text-right">Prejuízo Compensado</th>
                    <th className="px-3 py-2.5 text-right">Imposto Devido</th>
                    <th className="px-3 py-2.5 text-right">IRRF Retido Fonte</th>
                    <th className="px-3 py-2.5 text-right">Imposto Pago (DARF)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                  {Array.from({ length: 12 }, (_, i) => {
                    const mNum = String(i + 1).padStart(2, '0');
                    const compKey = `${irpfYear}-${mNum}`;
                    const tax = monthlyTaxes.find(t => t.mesAno === compKey);
                    const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                    const darfStatus = settings?.darfsPagas?.[compKey];

                    const lucroAcoes = tax ? tax.lucroLiquidoAcoesSwing : '0.00';
                    const lucroFii = tax ? tax.lucroLiquidoFII : '0.00';
                    const resultadoMes = tax ? D(lucroAcoes).add(D(lucroFii)).toFixed(2) : '0.00';
                    const prejCompensado = tax ? D(tax.prejuizoCompensadoAcoes).add(D(tax.prejuizoCompensadoFII)).toFixed(2) : '0.00';
                    const impostoDevido = tax ? tax.totalImpostoDevido : '0.00';
                    const irrfFonte = tax ? tax.irrfDedoDuro : '0.00';
                    const impostoPago = darfStatus ? (typeof darfStatus === 'object' && darfStatus?.valorPago ? darfStatus.valorPago : tax ? tax.impostoAPagarAposDedoDuro : '0.00') : '0.00';

                    return (
                      <tr key={compKey} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 whitespace-nowrap">
                        <td className="px-3 py-2.5 font-bold font-sans text-slate-800 dark:text-slate-200">
                          {mesesNomes[i]}/{irpfYear}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono-numbers tabular-nums ${D(lucroAcoes).gt(0) ? 'text-emerald-600' : D(lucroAcoes).lt(0) ? 'text-red-500' : 'text-slate-400'}`}>
                          {formatBRL(lucroAcoes)}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono-numbers tabular-nums ${D(lucroFii).gt(0) ? 'text-emerald-600' : D(lucroFii).lt(0) ? 'text-red-500' : 'text-slate-400'}`}>
                          {formatBRL(lucroFii)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                          {formatBRL(resultadoMes)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-500">
                          {formatBRL(prejCompensado)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                          {formatBRL(impostoDevido)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-500">
                          {formatBRL(irrfFonte)}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono-numbers tabular-nums font-bold ${darfStatus ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {formatBRL(impostoPago)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* RELATÓRIO 3: DEMONSTRATIVO MENSAL DE APURAÇÃO FISCAL & DARFS       */}
      {/* ------------------------------------------------------------------- */}
      {reportType === 'APURACAO_DARF' && (
        <div className="space-y-6">
          {/* KPI Cards Fiscais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Total Alienado no Período:</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white font-mono-numbers">
                {formatBRL(taxesSummary.totalAlienado)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Imposto Apurado Total:</span>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono-numbers">
                {formatBRL(taxesSummary.impostoApuradoTotal)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">DARFs Pagas (Quitadas):</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono-numbers">
                {formatBRL(taxesSummary.impostoPagoTotal)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">DARFs Pendentes de Pagamento:</span>
              <span className={`text-lg font-bold font-mono-numbers ${
                D(taxesSummary.impostoPendenteTotal).gt(0) ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700'
              }`}>
                {formatBRL(taxesSummary.impostoPendenteTotal)}
              </span>
            </div>
          </div>

          {/* Tabela de Apuração */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left text-xs min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold text-[11px] whitespace-nowrap bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="px-3 py-2.5 text-left">Competência</th>
                  <th className="px-3 py-2.5 text-right">Vendas Ações</th>
                  <th className="px-3 py-2.5 text-center">Isenção 20k</th>
                  <th className="px-3 py-2.5 text-right">Resultado Ações</th>
                  <th className="px-3 py-2.5 text-right">Vendas FIIs</th>
                  <th className="px-3 py-2.5 text-right">Resultado FIIs</th>
                  <th className="px-3 py-2.5 text-right">Prej. Compensado</th>
                  <th className="px-3 py-2.5 text-right">Imposto Bruto</th>
                  <th className="px-3 py-2.5 text-right">IRRF Fonte</th>
                  <th className="px-3 py-2.5 text-right">DARF a Pagar</th>
                  <th className="px-3 py-2.5 text-center">Vencimento</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {filteredMonthlyTaxes.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-400 font-sans">
                      Nenhuma apuração de alienação registrada no período selecionado.
                    </td>
                  </tr>
                ) : (
                  filteredMonthlyTaxes.map(tax => {
                    const paid = settings?.darfsPagas?.[tax.mesAno];
                    const isPaid = Boolean(paid);
                    const hasTax = D(tax.impostoAPagarAposDedoDuro).gt(0);
                    const isBelow10 = hasTax && D(tax.impostoAPagarAposDedoDuro).lt(10);
                    const dueDate = getDarfDueDate(tax.mesAno);
                    const compFormatada = formatCompetenciaBr(tax.mesAno);

                    return (
                      <tr key={tax.mesAno} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 whitespace-nowrap">
                        <td className="px-3 py-2.5 font-bold font-sans text-slate-900 dark:text-white">
                          {tax.mesAno} ({compFormatada.split(' de ')[0]})
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-800 dark:text-slate-200">{formatBRL(tax.totalVendasAcoesSwing)}</td>
                        <td className="px-3 py-2.5 text-center font-sans">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            tax.isentoAcoesSwing 
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' 
                              : D(tax.totalVendasAcoesSwing).gt(0) 
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-600' 
                              : 'text-slate-400'
                          }`}>
                            {tax.isentoAcoesSwing ? 'ISENTO' : D(tax.totalVendasAcoesSwing).gt(0) ? 'TRIBUTÁVEL' : '-'}
                          </span>
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono-numbers tabular-nums ${
                          D(tax.lucroLiquidoAcoesSwing).gt(0) ? 'text-emerald-600 dark:text-emerald-400' : D(tax.lucroLiquidoAcoesSwing).lt(0) ? 'text-red-500' : 'text-slate-400'
                        }`}>
                          {formatBRL(tax.lucroLiquidoAcoesSwing)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-800 dark:text-slate-200">{formatBRL(tax.totalVendasFII)}</td>
                        <td className={`px-3 py-2.5 text-right font-mono-numbers tabular-nums ${
                          D(tax.lucroLiquidoFII).gt(0) ? 'text-emerald-600 dark:text-emerald-400' : D(tax.lucroLiquidoFII).lt(0) ? 'text-red-500' : 'text-slate-400'
                        }`}>
                          {formatBRL(tax.lucroLiquidoFII)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-500">
                          {formatBRL(D(tax.prejuizoCompensadoAcoes).add(D(tax.prejuizoCompensadoFII)))}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                          {formatBRL(tax.totalImpostoDevido)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-500">{formatBRL(tax.irrfDedoDuro)}</td>
                        <td className={`px-3 py-2.5 text-right font-mono-numbers tabular-nums font-bold ${
                          hasTax ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                        }`}>
                          {formatBRL(tax.impostoAPagarAposDedoDuro)}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono-numbers tabular-nums text-[10px] text-slate-500">{dueDate}</td>
                        <td className="px-3 py-2.5 text-center font-sans">
                          {isPaid ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" />
                              <span>Quitado</span>
                            </span>
                          ) : isBelow10 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              Acumulado &lt; R$ 10
                            </span>
                          ) : hasTax ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                              Pendente (Cód. 6015)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                              Sem Imposto
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* RELATÓRIO 4: DIÁRIO DE VENDAS & GANHOS REALIZADOS (TRADE LOG)      */}
      {/* ------------------------------------------------------------------- */}
      {reportType === 'GANHOS_REALIZADOS' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Volume Total de Vendas:</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white font-mono-numbers">
                {formatBRL(realizedSalesSummary.volumeTotal)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Lucro Líquido Realizado Total:</span>
              <span className={`text-lg font-bold font-mono-numbers ${
                isPositive(realizedSalesSummary.lucroLiquidoTotal) ? 'text-emerald-600 dark:text-emerald-400' : isNegative(realizedSalesSummary.lucroLiquidoTotal) ? 'text-red-500' : 'text-slate-700'
              }`}>
                {formatBRL(realizedSalesSummary.lucroLiquidoTotal)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Custos Operacionais B3 / Corretora:</span>
              <span className="text-lg font-bold text-slate-700 dark:text-slate-300 font-mono-numbers">
                {formatBRL(realizedSalesSummary.custosTotais)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Taxa de Acerto em Vendas:</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono-numbers">
                {realizedSalesSummary.taxaAcertoPct.toFixed(1)}% ({realizedSalesSummary.totalTrades} vendas)
              </span>
            </div>
          </div>

          {/* Tabela do Diário de Vendas */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left text-xs min-w-[950px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold text-[11px] whitespace-nowrap bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="px-3 py-2.5 text-left">Data Pregão</th>
                  <th className="px-3 py-2.5 text-left">Ticker</th>
                  <th className="px-3 py-2.5 text-center">Classe</th>
                  <th className="px-3 py-2.5 text-right">Qtd Vendida</th>
                  <th className="px-3 py-2.5 text-right">Preço Venda</th>
                  <th className="px-3 py-2.5 text-right">Total Alienado</th>
                  <th className="px-3 py-2.5 text-right">Preço Médio Aquisição</th>
                  <th className="px-3 py-2.5 text-right">Custo Baixado</th>
                  <th className="px-3 py-2.5 text-right">Custos B3</th>
                  <th className="px-3 py-2.5 text-right">Lucro/Prejuízo Líquido</th>
                  <th className="px-3 py-2.5 text-right">Rent. (%)</th>
                  <th className="px-3 py-2.5 text-center">Enquadramento Fiscal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {filteredRealizedSales.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-400 font-sans">
                      Nenhuma operação de venda localizada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredRealizedSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 whitespace-nowrap">
                      <td className="px-3 py-2.5 font-mono-numbers tabular-nums text-slate-700 dark:text-slate-300">{sale.dataPregao}</td>
                      <td className="px-3 py-2.5 font-bold font-mono text-slate-900 dark:text-white">{sale.ticker}</td>
                      <td className="px-3 py-2.5 text-center font-sans">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                          {sale.assetTipo}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-800 dark:text-slate-200">{sale.quantidade}</td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-700 dark:text-slate-300">{formatBRL(sale.precoVenda)}</td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums font-semibold text-slate-900 dark:text-white">{formatBRL(sale.valorTotalVenda)}</td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-500">{formatBRL(sale.custoMedioUnitario)}</td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-500">{formatBRL(sale.custoTotalBaixado)}</td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-400">{formatBRL(sale.custosOperacionais)}</td>
                      <td className={`px-3 py-2.5 text-right font-mono-numbers tabular-nums font-bold ${
                        isPositive(sale.lucroLiquido) ? 'text-emerald-600 dark:text-emerald-400' : isNegative(sale.lucroLiquido) ? 'text-red-500' : 'text-slate-600'
                      }`}>
                        {formatBRL(sale.lucroLiquido)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums font-bold">{formatPercent(sale.rentabilidadePct, true)}</td>
                      <td className="px-3 py-2.5 text-center font-sans">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          sale.isIsento 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}>
                          {sale.regimeTributario}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* RELATÓRIO 5: PROVENTOS ANALÍTICO & YIELD ON COST                    */}
      {/* ------------------------------------------------------------------- */}
      {reportType === 'PROVENTOS_ANALITICO' && (
        <div className="space-y-6">
          {/* KPI Cards de Proventos */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Total Líquido Recebido:</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono-numbers">
                {formatBRL(proventosSummary.totalLiquido)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Dividendos Isentos (Ações):</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white font-mono-numbers">
                {formatBRL(proventosSummary.totalDividendos)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Juros Sobre Capital Próprio (JCP):</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white font-mono-numbers">
                {formatBRL(proventosSummary.totalJcp)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Rendimentos Isentos (FIIs):</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono-numbers">
                {formatBRL(proventosSummary.totalFii)}
              </span>
            </div>
          </div>

          {/* Tabela de Yield on Cost Consolidado por Ativo */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Consolidação por Ativo & Yield on Cost Histórico
            </h4>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs min-w-[700px] border-collapse">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                  <tr>
                    <th className="px-3 py-2.5 text-left">Ticker</th>
                    <th className="px-3 py-2.5 text-left">Nome / Empresa</th>
                    <th className="px-3 py-2.5 text-right">Lançamentos</th>
                    <th className="px-3 py-2.5 text-right">Custo Investido</th>
                    <th className="px-3 py-2.5 text-right">Total Recebido (R$)</th>
                    <th className="px-3 py-2.5 text-right">Yield on Cost (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                  {Array.from(proventosSummary.tickerTotals.entries()).map(([t, data]) => {
                    const pos = portfolio.posicoesCustodia.find(p => p.ticker.toUpperCase() === t);
                    const asset = assetMap.get(t);
                    const custo = pos ? D(pos.custoTotal) : D(0);
                    const yocPct = custo.gt(0) ? data.totalLiquido.div(custo).mul(100) : D(0);

                    return (
                      <tr key={t} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 whitespace-nowrap">
                        <td className="px-3 py-2.5 font-bold font-mono text-slate-900 dark:text-white">{t}</td>
                        <td className="px-3 py-2.5 font-sans text-slate-600 dark:text-slate-300 truncate max-w-[160px]">{asset?.nome || t}</td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-800 dark:text-slate-200">{data.qtdLancamentos}</td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-700 dark:text-slate-300">{formatBRL(custo)}</td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(data.totalLiquido)}</td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums font-semibold text-blue-600 dark:text-blue-400">{formatPercent(yocPct)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Extrato Detalhado de Proventos */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Extrato Cronológico de Proventos Lançados ({filteredDividends.length})
            </h4>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-left text-xs min-w-[800px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold text-[11px] whitespace-nowrap bg-slate-50/50 dark:bg-slate-800/40">
                    <th className="px-3 py-2.5 text-left">Ticker</th>
                    <th className="px-3 py-2.5 text-center">Tipo</th>
                    <th className="px-3 py-2.5 text-center">Data COM</th>
                    <th className="px-3 py-2.5 text-center">Data Pagamento</th>
                    <th className="px-3 py-2.5 text-right">Valor / Cota</th>
                    <th className="px-3 py-2.5 text-right">Qtd Base</th>
                    <th className="px-3 py-2.5 text-right">Valor Bruto</th>
                    <th className="px-3 py-2.5 text-right">IRRF Retido</th>
                    <th className="px-3 py-2.5 text-right">Valor Líquido</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {filteredDividends.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400 font-sans">
                        Nenhum provento localizado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredDividends.map(div => (
                      <tr key={div.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 whitespace-nowrap">
                        <td className="px-3 py-2.5 font-bold font-mono text-slate-900 dark:text-white">{div.ticker}</td>
                        <td className="px-3 py-2.5 text-center font-sans font-semibold">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {div.tipo}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono-numbers tabular-nums text-slate-600 dark:text-slate-400">{div.dataCom}</td>
                        <td className="px-3 py-2.5 text-center font-mono-numbers tabular-nums text-slate-800 dark:text-slate-200">{div.dataPagamento}</td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-700 dark:text-slate-300">{formatBRL(div.valorPorAcao)}</td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-800 dark:text-slate-200">{div.quantidadeBase}</td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-slate-500">{formatBRL(div.valorBruto)}</td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums text-amber-600 dark:text-amber-400">{formatBRL(div.retencaoIr || '0.00')}</td>
                        <td className="px-3 py-2.5 text-right font-mono-numbers tabular-nums font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(div.valorLiquido)}</td>
                        <td className="px-3 py-2.5 text-center font-sans text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {div.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* RELATÓRIO 6: EXTRATO CRONOLÓGICO DE OPERAÇÕES                       */}
      {/* ------------------------------------------------------------------- */}
      {reportType === 'EXTRATO_OP' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total de operações filtradas: <strong>{filteredOperations.length}</strong></span>
          </div>

          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left text-xs min-w-[800px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold text-[11px] whitespace-nowrap bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="px-3 py-2.5 text-left">Pregão</th>
                  <th className="px-3 py-2.5 text-left">Liquidação</th>
                  <th className="px-3 py-2.5 text-left">Ticker</th>
                  <th className="px-3 py-2.5 text-left">Operação</th>
                  <th className="px-3 py-2.5 text-left">Mercado</th>
                  <th className="px-3 py-2.5 text-right">Quantidade</th>
                  <th className="px-3 py-2.5 text-right">Preço Unitário</th>
                  <th className="px-3 py-2.5 text-right">Taxas & Custos</th>
                  <th className="px-3 py-2.5 text-right">Valor Total</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {filteredOperations.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 font-sans">
                      Nenhuma operação localizada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredOperations.map(op => (
                    <tr key={op.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 whitespace-nowrap">
                      <td className="px-3 py-2 font-mono-numbers tabular-nums text-slate-700 dark:text-slate-300">{op.dataPregao}</td>
                      <td className="px-3 py-2 font-mono-numbers tabular-nums text-slate-500">{op.dataLiquidacao || '-'}</td>
                      <td className="px-3 py-2 font-bold font-mono text-slate-900 dark:text-white">{op.ticker}</td>
                      <td className="px-3 py-2 font-sans font-semibold">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          op.tipo === 'COMPRA'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            : op.tipo === 'VENDA'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {op.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-500 font-sans">{op.mercado}</td>
                      <td className="px-3 py-2 text-right font-mono-numbers tabular-nums text-slate-800 dark:text-slate-200">{op.quantidade}</td>
                      <td className="px-3 py-2 text-right font-mono-numbers tabular-nums text-slate-700 dark:text-slate-300">{formatBRL(op.precoUnitario)}</td>
                      <td className="px-3 py-2 text-right font-mono-numbers tabular-nums text-slate-500">{formatBRL(op.custosTotais)}</td>
                      <td className="px-3 py-2 text-right font-mono-numbers tabular-nums font-bold text-slate-900 dark:text-white">{formatBRL(op.valorTotalOperacao)}</td>
                      <td className="px-3 py-2 text-center font-sans text-[10px] font-bold">
                        <span className={`px-1.5 py-0.5 rounded ${
                          op.status === 'CONFIRMADA'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}>
                          {op.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rodapé Oficial do Relatório com Fundamentação Legal */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2">
          <span>Hermas — Proteção patrimonial, soberania de dados e cálculo privado offline</span>
          <span>Relatório Contábil Pessoal • Página 1 de 1</span>
        </div>
        <p className="text-[10px] text-slate-400/80 leading-relaxed font-sans border-t border-slate-100 dark:border-slate-800/60 pt-2">
          <strong>Nota Legal & Regulamentar:</strong> Este demonstrativo tem caráter estritamente educativo e de apoio à organização pessoal. 
          Não emite guias bancárias, não gera boletos de DARF nem substitui o preenchimento e a transmissão oficial da Declaração de Ajuste Anual 
          do IRPF perante a Secretaria da Receita Federal do Brasil. O recolhimento de DARFs mensais decorrentes de operações com ganho líquido 
          em bolsa deve ser efetuado diretamente pelo contribuinte via Internet Banking sob o Código de Receita 6015. Fundamentação na Lei Federal 
          nº 11.033/2004, Lei nº 8.668/1993 e Instrução Normativa RFB nº 1.585/2015.
        </p>
      </div>
    </div>
  );
};
