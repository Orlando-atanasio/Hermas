import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  Calendar, 
  Coins, 
  Layers,
  CheckCircle2, 
  ChevronDown, 
  Info,
  Search,
  Filter,
  X,
  Landmark,
  Receipt,
  TrendingUp,
  TrendingDown,
  Scale,
  DollarSign,
  Building2,
  Copy,
  Check,
  RotateCcw,
  FileText,
  Percent,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { PortfolioSummary, calculatePortfolio } from '../../engine/portfolio';
import { 
  Operation, 
  Dividend, 
  Asset, 
  SystemSettings, 
  UserProfile, 
  AssetType, 
  OperationType, 
  DividendType 
} from '../../types';
import { 
  formatBRL, 
  formatPercent, 
  D, 
  toCanonicalString, 
  isPositive, 
  isNegative 
} from '../../engine/decimal';
import { 
  calculateMonthlyTaxes, 
  calculateRealizedSales, 
  getDarfDueDate, 
  formatCompetenciaBr,
  RealizedSaleTrade
} from '../../engine/tax';
import { exportCsvBlob, CsvDelimiter } from '../../engine/importers/csvParser';
import { AlertExplainerPopover } from '../common/AlertExplainerPopover';
import { HermasReportDocument } from './HermasReportDocument';
import { generateStandalonePrintHtml, downloadPrintableHtml } from '../../engine/printHelper';

export type ReportType = 
  | 'PATRIMONIO' 
  | 'IRPF_ANUAL' 
  | 'APURACAO_DARF' 
  | 'GANHOS_REALIZADOS' 
  | 'PROVENTOS_ANALITICO' 
  | 'EXTRATO_OP';

interface ReportsViewProps {
  portfolio: PortfolioSummary;
  operations: Operation[];
  dividends: Dividend[];
  assets: Asset[];
  settings?: SystemSettings;
  userProfile?: UserProfile;
  onNavigate?: (tab: any) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  portfolio,
  operations,
  dividends,
  assets,
  settings,
  userProfile,
  onNavigate,
}) => {
  const [reportType, setReportType] = useState<ReportType>('PATRIMONIO');
  const [isCsvMenuOpen, setIsCsvMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  // Zoom da folha de simulação (padrão 75% no mobile e 85% no desktop para visualização harmônica)
  const [previewScale, setPreviewScale] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) return 0.65;
    return 0.85;
  });

  // Fecha a visualização da impressora ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPrintPreviewOpen) {
        setIsPrintPreviewOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPrintPreviewOpen]);

  // Filtros Globais e Contextuais
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('TODOS');
  const [selectedMonth, setSelectedMonth] = useState<string>('TODOS');
  const [selectedAssetType, setSelectedAssetType] = useState<string>('TODOS');
  const [selectedOpType, setSelectedOpType] = useState<string>('TODAS');
  const [selectedDividendType, setSelectedDividendType] = useState<string>('TODOS');
  const [selectedDarfStatus, setSelectedDarfStatus] = useState<string>('TODOS');

  // Ano específico para a Ficha IRPF
  const [irpfYear, setIrpfYear] = useState<string>(() => {
    return new Date().getFullYear().toString();
  });

  // Extrair anos disponíveis com base nas operações e proventos
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    const currentYr = new Date().getFullYear().toString();
    yearsSet.add(currentYr);
    yearsSet.add((Number(currentYr) - 1).toString());

    operations.forEach(op => {
      if (op.dataPregao) {
        yearsSet.add(op.dataPregao.substring(0, 4));
      }
    });

    dividends.forEach(div => {
      if (div.dataPagamento) {
        yearsSet.add(div.dataPagamento.substring(0, 4));
      }
    });

    return Array.from(yearsSet).sort().reverse();
  }, [operations, dividends]);

  // Mapa rápido de Ativos por Ticker
  const assetMap = useMemo(() => {
    const map = new Map<string, Asset>();
    assets.forEach(a => map.set(a.ticker.toUpperCase(), a));
    return map;
  }, [assets]);

  // Cálculo da Apuração Fiscal e DARFs
  const monthlyTaxes = useMemo(() => {
    return calculateMonthlyTaxes(assets, operations, {
      acoes: settings?.prejuizoAcumuladoAcoesSwingAnterior,
      daytrade: settings?.prejuizoAcumuladoDayTradeAnterior,
      fii: settings?.prejuizoAcumuladoFiiAnterior,
    });
  }, [assets, operations, settings]);

  // Cálculo do Diário de Vendas e Lucros Realizados
  const realizedSales = useMemo(() => {
    return calculateRealizedSales(assets, operations);
  }, [assets, operations]);

  // Manipulador de Cópia
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Limpar Filtros
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedYear('TODOS');
    setSelectedMonth('TODOS');
    setSelectedAssetType('TODOS');
    setSelectedOpType('TODAS');
    setSelectedDividendType('TODOS');
    setSelectedDarfStatus('TODOS');
  };

  const hasActiveFilters = 
    searchTerm !== '' || 
    selectedYear !== 'TODOS' || 
    selectedMonth !== 'TODOS' || 
    selectedAssetType !== 'TODOS' || 
    selectedOpType !== 'TODAS' || 
    selectedDividendType !== 'TODOS' || 
    selectedDarfStatus !== 'TODOS';

  // --------------------------------------------------------------------------
  // DADOS FILTRADOS POR RELATÓRIO
  // --------------------------------------------------------------------------

  // 1. Posições de Custódia Filtradas
  const filteredPositions = useMemo(() => {
    return portfolio.posicoesCustodia.filter(pos => {
      const term = searchTerm.trim().toUpperCase();
      if (term) {
        const matchesTicker = pos.ticker.toUpperCase().includes(term);
        const matchesNome = pos.asset.nome.toUpperCase().includes(term);
        if (!matchesTicker && !matchesNome) return false;
      }
      if (selectedAssetType !== 'TODOS' && pos.asset.tipo !== selectedAssetType) {
        return false;
      }
      return true;
    });
  }, [portfolio.posicoesCustodia, searchTerm, selectedAssetType]);

  // 2. Operações Filtradas
  const filteredOperations = useMemo(() => {
    return operations.filter(op => {
      const term = searchTerm.trim().toUpperCase();
      if (term) {
        const asset = assetMap.get(op.ticker.toUpperCase());
        const matchesTicker = op.ticker.toUpperCase().includes(term);
        const matchesNome = asset ? asset.nome.toUpperCase().includes(term) : false;
        if (!matchesTicker && !matchesNome) return false;
      }
      if (selectedYear !== 'TODOS' && !op.dataPregao.startsWith(selectedYear)) {
        return false;
      }
      if (selectedMonth !== 'TODOS' && op.dataPregao.substring(5, 7) !== selectedMonth) {
        return false;
      }
      if (selectedAssetType !== 'TODOS') {
        const asset = assetMap.get(op.ticker.toUpperCase());
        if (asset && asset.tipo !== selectedAssetType) return false;
      }
      if (selectedOpType !== 'TODAS' && op.tipo !== selectedOpType) {
        return false;
      }
      return true;
    });
  }, [operations, assetMap, searchTerm, selectedYear, selectedMonth, selectedAssetType, selectedOpType]);

  // 3. Proventos Filtrados
  const filteredDividends = useMemo(() => {
    return dividends.filter(div => {
      const term = searchTerm.trim().toUpperCase();
      if (term) {
        const asset = assetMap.get(div.ticker.toUpperCase());
        const matchesTicker = div.ticker.toUpperCase().includes(term);
        const matchesNome = asset ? asset.nome.toUpperCase().includes(term) : false;
        if (!matchesTicker && !matchesNome) return false;
      }
      const dateToCheck = div.dataPagamento || div.dataCom;
      if (selectedYear !== 'TODOS' && !dateToCheck.startsWith(selectedYear)) {
        return false;
      }
      if (selectedMonth !== 'TODOS' && dateToCheck.substring(5, 7) !== selectedMonth) {
        return false;
      }
      if (selectedAssetType !== 'TODOS') {
        const asset = assetMap.get(div.ticker.toUpperCase());
        if (asset && asset.tipo !== selectedAssetType) return false;
      }
      if (selectedDividendType !== 'TODOS' && div.tipo !== selectedDividendType) {
        return false;
      }
      return true;
    });
  }, [dividends, assetMap, searchTerm, selectedYear, selectedMonth, selectedAssetType, selectedDividendType]);

  // 4. Apuração de DARF Filtrada
  const filteredMonthlyTaxes = useMemo(() => {
    return monthlyTaxes.filter(tax => {
      const [ano, mes] = tax.mesAno.split('-');
      if (selectedYear !== 'TODOS' && ano !== selectedYear) return false;
      if (selectedMonth !== 'TODOS' && mes !== selectedMonth) return false;

      const isPaid = Boolean(settings?.darfsPagas?.[tax.mesAno]);
      const hasTax = D(tax.impostoAPagarAposDedoDuro).gt(0);
      const isBelow10 = hasTax && D(tax.impostoAPagarAposDedoDuro).lt(10);

      if (selectedDarfStatus === 'PENDENTE' && (!hasTax || isBelow10 || isPaid)) return false;
      if (selectedDarfStatus === 'PAGO' && !isPaid) return false;
      if (selectedDarfStatus === 'ISENTO' && tax.statusMensal !== 'ISENTO') return false;
      if (selectedDarfStatus === 'PREJUIZO' && tax.statusMensal !== 'PREJUIZO_ACUMULADO') return false;

      return true;
    });
  }, [monthlyTaxes, selectedYear, selectedMonth, selectedDarfStatus, settings]);

  // 5. Ganhos Realizados Filtrados (Trade Log)
  const filteredRealizedSales = useMemo(() => {
    return realizedSales.filter(sale => {
      const term = searchTerm.trim().toUpperCase();
      if (term) {
        const matchesTicker = sale.ticker.toUpperCase().includes(term);
        const matchesNome = sale.assetNome.toUpperCase().includes(term);
        if (!matchesTicker && !matchesNome) return false;
      }
      const [ano, mes] = sale.mesAno.split('-');
      if (selectedYear !== 'TODOS' && ano !== selectedYear) return false;
      if (selectedMonth !== 'TODOS' && mes !== selectedMonth) return false;
      if (selectedAssetType !== 'TODOS' && sale.assetTipo !== selectedAssetType) return false;
      return true;
    });
  }, [realizedSales, searchTerm, selectedYear, selectedMonth, selectedAssetType]);

  // 6. Dados Consolidados para a Declaração de IRPF Anual
  const irpfData = useMemo(() => {
    // Proventos do ano selecionado
    const proventosAno = dividends.filter(d => {
      const data = d.dataPagamento || d.dataCom;
      return data.startsWith(irpfYear);
    });

    const mapaProventos = new Map<string, { dividendos: any; jcpLiquido: any; jcpRetencao: any; rendimentosFii: any }>();
    proventosAno.forEach(d => {
      const t = d.ticker.toUpperCase();
      if (!mapaProventos.has(t)) {
        mapaProventos.set(t, { dividendos: D(0), jcpLiquido: D(0), jcpRetencao: D(0), rendimentosFii: D(0) });
      }
      const entry = mapaProventos.get(t)!;
      if (d.tipo === 'DIVIDENDO') {
        entry.dividendos = entry.dividendos.add(D(d.valorLiquido));
      } else if (d.tipo === 'JCP') {
        entry.jcpLiquido = entry.jcpLiquido.add(D(d.valorLiquido));
        entry.jcpRetencao = entry.jcpRetencao.add(D(d.retencaoIr || d.valorRetidoIR || '0'));
      } else if (d.tipo === 'RENDIMENTO') {
        entry.rendimentosFii = entry.rendimentosFii.add(D(d.valorLiquido));
      }
    });

    // Posições históricas fiéis em 31/12 do ano-calendário e 31/12 do ano anterior
    const cutDateThisYear = `${irpfYear}-12-31`;
    const cutDatePrevYear = `${Number(irpfYear) - 1}-12-31`;

    const opsAteAno = operations.filter(op => op.dataPregao <= cutDateThisYear);
    const divsAteAno = dividends.filter(d => (d.dataPagamento || d.dataCom) <= cutDateThisYear);
    const portfolioAno = calculatePortfolio(assets, opsAteAno, {}, divsAteAno);

    const opsAteAnoAnt = operations.filter(op => op.dataPregao <= cutDatePrevYear);
    const divsAteAnoAnt = dividends.filter(d => (d.dataPagamento || d.dataCom) <= cutDatePrevYear);
    const portfolioAnoAnt = calculatePortfolio(assets, opsAteAnoAnt, {}, divsAteAnoAnt);

    const posicoes31Dez = portfolioAno.posicoesCustodia;
    const mapaCustoAnoAnterior = new Map<string, string>();
    portfolioAnoAnt.posicoesCustodia.forEach(p => {
      mapaCustoAnoAnterior.set(p.ticker, p.custoTotal);
    });

    return {
      mapaProventos,
      posicoes31Dez,
      mapaCustoAnoAnterior,
    };
  }, [dividends, irpfYear, operations, assets]);

  // Totais do Proventos Analítico & Yield on Cost
  const proventosSummary = useMemo(() => {
    let totalLiquido = D(0);
    let totalDividendos = D(0);
    let totalJcp = D(0);
    let totalFii = D(0);
    const tickerTotals = new Map<string, { totalLiquido: any; qtdLancamentos: number }>();

    filteredDividends.forEach(div => {
      const val = D(div.valorLiquido);
      totalLiquido = totalLiquido.add(val);
      if (div.tipo === 'DIVIDENDO') totalDividendos = totalDividendos.add(val);
      else if (div.tipo === 'JCP') totalJcp = totalJcp.add(val);
      else if (div.tipo === 'RENDIMENTO') totalFii = totalFii.add(val);

      const t = div.ticker.toUpperCase();
      const prev = tickerTotals.get(t) || { totalLiquido: D(0), qtdLancamentos: 0 };
      tickerTotals.set(t, {
        totalLiquido: prev.totalLiquido.add(val),
        qtdLancamentos: prev.qtdLancamentos + 1,
      });
    });

    return {
      totalLiquido,
      totalDividendos,
      totalJcp,
      totalFii,
      tickerTotals,
    };
  }, [filteredDividends]);

  // Totais de Ganhos Realizados
  const realizedSalesSummary = useMemo(() => {
    let volumeTotal = D(0);
    let lucroLiquidoTotal = D(0);
    let custosTotais = D(0);
    let vendasComLucro = 0;

    filteredRealizedSales.forEach(s => {
      volumeTotal = volumeTotal.add(D(s.valorTotalVenda));
      lucroLiquidoTotal = lucroLiquidoTotal.add(D(s.lucroLiquido));
      custosTotais = custosTotais.add(D(s.custosOperacionais));
      if (D(s.lucroLiquido).gt(0)) vendasComLucro++;
    });

    const taxaAcertoPct = filteredRealizedSales.length > 0 
      ? (vendasComLucro / filteredRealizedSales.length) * 100 
      : 0;

    return {
      volumeTotal,
      lucroLiquidoTotal,
      custosTotais,
      taxaAcertoPct,
      totalTrades: filteredRealizedSales.length,
    };
  }, [filteredRealizedSales]);

  // Totais da Apuração Fiscal e DARFs
  const taxesSummary = useMemo(() => {
    let impostoApuradoTotal = D(0);
    let impostoPagoTotal = D(0);
    let impostoPendenteTotal = D(0);
    let totalAlienado = D(0);

    filteredMonthlyTaxes.forEach(t => {
      const imp = D(t.impostoAPagarAposDedoDuro);
      const vendasMes = D(t.totalVendasAcoesSwing).add(D(t.totalVendasFII)).add(D(t.totalVendasDayTrade));
      totalAlienado = totalAlienado.add(vendasMes);
      impostoApuradoTotal = impostoApuradoTotal.add(imp);

      const paid = settings?.darfsPagas?.[t.mesAno];
      if (paid) {
        impostoPagoTotal = impostoPagoTotal.add(D(paid.valorPago || imp));
      } else if (imp.gte(10)) {
        impostoPendenteTotal = impostoPendenteTotal.add(imp);
      }
    });

    return {
      impostoApuradoTotal,
      impostoPagoTotal,
      impostoPendenteTotal,
      totalAlienado,
    };
  }, [filteredMonthlyTaxes, settings]);

  // Remete para a Simulação da Impressora para visualizar o relatório antes de imprimir
  const handleOpenPrintPreview = () => {
    setIsPrintPreviewOpen(true);
  };

  // Dispara a impressão na impressora física do sistema
  const handleExecutePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('[Hermas] Falha ao acionar window.print:', err);
    }
  };

  // Baixa o documento contábil formatado em arquivo HTML/PDF para arquivamento ou impressão independente
  const handleDownloadPdf = () => {
    const html = generateStandalonePrintHtml({
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
      assetMap,
    });
    const suffix = reportType === 'IRPF_ANUAL' ? `irpf_${irpfYear}` : reportType.toLowerCase();
    const fileName = `hermas_relatorio_${suffix}_${new Date().toISOString().slice(0, 10)}.html`;
    downloadPrintableHtml(html, fileName);
  };

  // --------------------------------------------------------------------------
  // EXPORTAÇÃO CSV
  // --------------------------------------------------------------------------
  const handleExportCSV = (delimiter: CsvDelimiter = ',') => {
    setIsCsvMenuOpen(false);

    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (reportType === 'PATRIMONIO') {
      headers = [
        'Ticker', 'Nome do Ativo', 'Tipo', 'Quantidade', 'Preço Médio (R$)',
        'Custo Total (R$)', 'Cotação Atual (R$)', 'Valor de Mercado (R$)',
        'Lucro Não Realizado (R$)', 'Rentabilidade (%)', 'Proventos Recebidos (R$)', 'Total Return (R$)', 'Peso (%)'
      ];
      rows = filteredPositions.map(p => [
        p.ticker,
        p.asset.nome,
        p.asset.tipo,
        p.quantidade,
        p.precoMedio,
        p.custoTotal,
        p.precoAtual,
        p.valorAtual,
        p.lucroNaoRealizado,
        p.rentabilidadeNaoRealizadaPct,
        p.proventosRecebidosHistorico,
        p.totalReturn,
        p.percentualCarteira
      ]);
    } else if (reportType === 'IRPF_ANUAL') {
      headers = [
        'Seção IRPF', 'Grupo/Código', 'Ticker', 'Nome / Fonte Pagadora', 'CNPJ',
        'Quantidade 31/12', 'Situação em 31/12 / Rendimento Líquido (R$)', 'IRRF Fonte Retido (R$)', 'Discriminação Completa'
      ];
      // 1. Bens e Direitos
      irpfData.posicoes31Dez.forEach(pos => {
        const isAcao = pos.asset.tipo === 'AÇÃO';
        const isFii = pos.asset.tipo === 'FII';
        const codigo = isAcao ? '03 - 01 (Ações)' : isFii ? '07 - 03 (FII)' : '04 - 04 (BDR/Outros)';
        const textoDisc = `${pos.quantidade} ${isFii ? 'cotas' : 'ações'} de ${pos.asset.nome} (${pos.ticker})${pos.asset.cnpj ? `, CNPJ: ${pos.asset.cnpj}` : ''}, custodiadas na ${settings?.corretoraPadrao || 'Toro CTVM'}, adquiridas ao custo total de ${formatBRL(pos.custoTotal)} (Preço Médio de ${formatBRL(pos.precoMedio)}).`;
        rows.push([
          'Bens e Direitos',
          codigo,
          pos.ticker,
          pos.asset.nome,
          pos.asset.cnpj || '',
          pos.quantidade,
          pos.custoTotal,
          '0.00',
          textoDisc
        ]);
      });
      // 2. Rendimentos Isentos
      Array.from(irpfData.mapaProventos.entries()).forEach(([t, data]) => {
        const asset = assetMap.get(t);
        const totalIsento = data.dividendos.add(data.rendimentosFii);
        if (totalIsento.gt(0)) {
          rows.push([
            'Rendimentos Isentos (Cód. 09/26)',
            'Isentos e Não Tributáveis',
            t,
            asset?.nome || t,
            asset?.cnpj || '',
            '',
            toCanonicalString(totalIsento),
            '0.00',
            `Dividendos / Rendimentos recebidos em ${irpfYear} de ${t}`
          ]);
        }
        if (data.jcpLiquido.gt(0)) {
          rows.push([
            'Rendimentos Trib. Exclusiva (Cód. 10)',
            'Tributação Exclusiva / Definitiva',
            t,
            asset?.nome || t,
            asset?.cnpj || '',
            '',
            toCanonicalString(data.jcpLiquido),
            toCanonicalString(data.jcpRetencao),
            `Juros sobre Capital Próprio líquidos recebidos em ${irpfYear} de ${t} com IR retido na fonte`
          ]);
        }
      });
    } else if (reportType === 'APURACAO_DARF') {
      headers = [
        'Competência (Mês/Ano)', 'Alienação Ações (R$)', 'Resultado Ações (R$)', 'Isenção Ações 20k',
        'Alienação FIIs (R$)', 'Resultado FIIs (R$)', 'Prejuízo Compensado (R$)', 'Imposto Devido Total (R$)',
        'IRRF Dedo-Duro (R$)', 'Imposto Líquido a Pagar (R$)', 'Data Vencimento DARF', 'Status Pagamento'
      ];
      rows = filteredMonthlyTaxes.map(tax => {
        const paid = settings?.darfsPagas?.[tax.mesAno];
        const isPaid = Boolean(paid);
        const hasTax = D(tax.impostoAPagarAposDedoDuro).gt(0);
        const isBelow10 = hasTax && D(tax.impostoAPagarAposDedoDuro).lt(10);
        const status = isPaid 
          ? `Pago em ${paid?.pagoEm}` 
          : isBelow10 
          ? 'Acumulado (< R$ 10)' 
          : hasTax 
          ? 'Pendente de Pagamento' 
          : tax.statusMensal;

        return [
          tax.mesAno,
          tax.totalVendasAcoesSwing,
          tax.lucroLiquidoAcoesSwing,
          tax.isentoAcoesSwing ? 'SIM (≤ 20k)' : 'NÃO (> 20k)',
          tax.totalVendasFII,
          tax.lucroLiquidoFII,
          toCanonicalString(D(tax.prejuizoCompensadoAcoes).add(D(tax.prejuizoCompensadoFII))),
          tax.totalImpostoDevido,
          tax.irrfDedoDuro,
          tax.impostoAPagarAposDedoDuro,
          getDarfDueDate(tax.mesAno),
          status
        ];
      });
    } else if (reportType === 'GANHOS_REALIZADOS') {
      headers = [
        'Data do Pregão', 'Ticker', 'Ativo', 'Tipo', 'Qtd Vendida', 'Preço Venda (R$)',
        'Valor Total Venda (R$)', 'Preço Médio Unitário (R$)', 'Custo Baixado (R$)',
        'Custos Operacionais (R$)', 'Lucro/Prejuízo Líquido (R$)', 'Rentabilidade (%)', 'Regime Tributário'
      ];
      rows = filteredRealizedSales.map(s => [
        s.dataPregao,
        s.ticker,
        s.assetNome,
        s.assetTipo,
        s.quantidade,
        s.precoVenda,
        s.valorTotalVenda,
        s.custoMedioUnitario,
        s.custoTotalBaixado,
        s.custosOperacionais,
        s.lucroLiquido,
        s.rentabilidadePct,
        s.regimeTributario
      ]);
    } else if (reportType === 'PROVENTOS_ANALITICO') {
      headers = [
        'Ticker', 'Tipo Provento', 'Data COM', 'Data Pagamento', 'Valor / Cota (R$)',
        'Quantidade Base', 'Valor Bruto (R$)', 'IRRF Retido (R$)', 'Valor Líquido (R$)', 'Status'
      ];
      rows = filteredDividends.map(d => [
        d.ticker,
        d.tipo,
        d.dataCom,
        d.dataPagamento,
        d.valorPorAcao,
        d.quantidadeBase,
        d.valorBruto,
        d.retencaoIr || '0.00',
        d.valorLiquido,
        d.status
      ]);
    } else {
      // EXTRATO_OP
      headers = [
        'Data do Pregão', 'Data de Liquidação', 'Ticker', 'Tipo Operação', 'Mercado',
        'Quantidade', 'Preço Unitário (R$)', 'Custos Totais (R$)', 'Valor Total Operação (R$)', 'Status'
      ];
      rows = filteredOperations.map(op => [
        op.dataPregao,
        op.dataLiquidacao,
        op.ticker,
        op.tipo,
        op.mercado,
        op.quantidade,
        op.precoUnitario,
        op.custosTotais,
        op.valorTotalOperacao,
        op.status
      ]);
    }

    const blob = exportCsvBlob(headers, rows, delimiter);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const suffix = delimiter === ';' ? 'excel_brasil' : 'utf8_virgula';
    link.href = url;
    link.download = `hermas_${reportType.toLowerCase()}_${suffix}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* ======================================================================= */}
      {/* 1. SELETOR DE RELATÓRIOS & AÇÕES DE IMPRESSÃO / EXPORTAÇÃO              */}
      {/* ======================================================================= */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 print:hidden">
        {/* Abas dos 6 Tipos de Relatórios */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setReportType('PATRIMONIO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              reportType === 'PATRIMONIO'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Patrimônio & Custódia</span>
          </button>

          <button
            onClick={() => setReportType('IRPF_ANUAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              reportType === 'IRPF_ANUAL'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Declaração IRPF Anual</span>
          </button>

          <button
            onClick={() => setReportType('APURACAO_DARF')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              reportType === 'APURACAO_DARF'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Apuração Fiscal & DARFs</span>
          </button>

          <button
            onClick={() => setReportType('GANHOS_REALIZADOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              reportType === 'GANHOS_REALIZADOS'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ganhos Realizados (Vendas)</span>
          </button>

          <button
            onClick={() => setReportType('PROVENTOS_ANALITICO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              reportType === 'PROVENTOS_ANALITICO'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Proventos & Yield on Cost</span>
          </button>

          <button
            onClick={() => setReportType('EXTRATO_OP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              reportType === 'EXTRATO_OP'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Extrato de Operações</span>
          </button>
        </div>

        {/* Ações de Impressão, Download e Reset de Filtros */}
        <div className="flex items-center gap-2 self-end xl:self-center flex-wrap">
          {/* Botão de Resetar Filtros (Exibido com destaque quando houver filtros aplicados) */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              title="Redefinir todos os filtros da tela para o padrão"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Resetar Filtros</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                Ativo
              </span>
            </button>
          )}

          {/* Dropdown de Exportação CSV */}
          <div className="relative">
            <button
              onClick={() => setIsCsvMenuOpen(!isCsvMenuOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Exportar CSV</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isCsvMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setIsCsvMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-1.5 w-72 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-30 space-y-1.5 animate-in fade-in">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Info className="w-3 h-3 text-blue-500" />
                    <span>Escolha o formato do CSV:</span>
                  </div>

                  <button
                    onClick={() => handleExportCSV(',')}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex flex-col cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>CSV UTF-8 (delimitado por vírgulas)</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-normal">*.csv</span>
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      Padrão universal (Google Sheets, Mac, Excel moderno). Preserva acentuação com UTF-8 BOM.
                    </span>
                  </button>

                  <button
                    onClick={() => handleExportCSV(';')}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex flex-col cursor-pointer border-t border-slate-100 dark:border-slate-800/60 pt-2"
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>CSV (delimitado por ponto e vírgula)</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-normal">Excel BR</span>
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      Recomendado para Microsoft Excel no Brasil. Mantém colunas separadas e decimais intactos.
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Botão Oficial: Remete para a Simulação da Impressora para Visualizar antes de Imprimir */}
          <button
            onClick={handleOpenPrintPreview}
            title="Visualizar simulação da impressora antes de mandar imprimir ou salvar em PDF"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 2. BARRA DE FILTROS AVANÇADOS MULTIFACETADOS                            */}
      {/* ======================================================================= */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 print:hidden">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Busca por Ticker / Nome */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por ticker ou nome (ex: PETR4, XPML11, Vale)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Seletores de Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro de Ano */}
            {reportType === 'IRPF_ANUAL' ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Ano-Calendário:</span>
                <select
                  value={irpfYear}
                  onChange={(e) => setIrpfYear(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                >
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>
                      {yr} (Exercício {Number(yr) + 1})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="TODOS">Todos os Anos</option>
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>Ano {yr}</option>
                ))}
              </select>
            )}

            {/* Filtro de Mês (exceto no IRPF Anual que já possui grade de 12 meses) */}
            {reportType !== 'IRPF_ANUAL' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="TODOS">Todos os Meses</option>
                <option value="01">Janeiro</option>
                <option value="02">Fevereiro</option>
                <option value="03">Março</option>
                <option value="04">Abril</option>
                <option value="05">Maio</option>
                <option value="06">Junho</option>
                <option value="07">Julho</option>
                <option value="08">Agosto</option>
                <option value="09">Setembro</option>
                <option value="10">Outubro</option>
                <option value="11">Novembro</option>
                <option value="12">Dezembro</option>
              </select>
            )}

            {/* Filtro de Classe de Ativo */}
            {reportType !== 'IRPF_ANUAL' && reportType !== 'APURACAO_DARF' && (
              <select
                value={selectedAssetType}
                onChange={(e) => setSelectedAssetType(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="TODOS">Todas as Classes</option>
                <option value="AÇÃO">Ações (B3)</option>
                <option value="FII">Fundos Imobiliários (FII)</option>
                <option value="BDR">BDRs</option>
                <option value="ETF">ETFs</option>
                <option value="RENDA_FIXA">Renda Fixa</option>
                <option value="CRIPTO">Criptoativos</option>
              </select>
            )}

            {/* Filtro Específico para Extrato de Operações */}
            {reportType === 'EXTRATO_OP' && (
              <select
                value={selectedOpType}
                onChange={(e) => setSelectedOpType(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="TODAS">Todos os Tipos de Ordem</option>
                <option value="COMPRA">Compras</option>
                <option value="VENDA">Vendas</option>
                <option value="BONIFICACAO">Bonificações</option>
                <option value="DESDOBRAMENTO">Desdobramentos</option>
                <option value="OPENING_POSITION">Posição Inicial</option>
              </select>
            )}

            {/* Filtro Específico para Proventos */}
            {reportType === 'PROVENTOS_ANALITICO' && (
              <select
                value={selectedDividendType}
                onChange={(e) => setSelectedDividendType(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="TODOS">Todos os Proventos</option>
                <option value="DIVIDENDO">Dividendos</option>
                <option value="JCP">Juros s/ Capital Próprio (JCP)</option>
                <option value="RENDIMENTO">Rendimentos de FII</option>
              </select>
            )}

            {/* Filtro Específico para Apuração DARF */}
            {reportType === 'APURACAO_DARF' && (
              <select
                value={selectedDarfStatus}
                onChange={(e) => setSelectedDarfStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="TODOS">Todos os Status Fiscais</option>
                <option value="PENDENTE">DARFs a Pagar</option>
                <option value="PAGO">DARFs Quitadas</option>
                <option value="ISENTO">Meses Isentos (≤ R$ 20k)</option>
                <option value="PREJUIZO">Meses com Prejuízo</option>
              </select>
            )}

            {/* Botão de Limpar Filtros */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                title="Limpar todos os filtros"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>

        {/* Resumo dos Filtros Aplicados */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Filtros ativos:</span>
            {searchTerm && <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300">Termo: "{searchTerm}"</span>}
            {selectedYear !== 'TODOS' && <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Ano: {selectedYear}</span>}
            {selectedMonth !== 'TODOS' && <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Mês: {selectedMonth}</span>}
            {selectedAssetType !== 'TODOS' && <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Classe: {selectedAssetType}</span>}
            {selectedOpType !== 'TODAS' && <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Ordem: {selectedOpType}</span>}
            {selectedDividendType !== 'TODOS' && <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Provento: {selectedDividendType}</span>}
            {selectedDarfStatus !== 'TODOS' && <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Status: {selectedDarfStatus}</span>}
          </div>
        )}
      </div>

      {/* ======================================================================= */}
      {/* 3. DOCUMENTO OFICIAL FORMATADO PARA VISUALIZAÇÃO E IMPRESSÃO (PDF)       */}
      {/* ======================================================================= */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 print:p-0 print:border-none print:shadow-none">
        <HermasReportDocument
          reportType={reportType}
          irpfYear={irpfYear}
          portfolio={portfolio}
          filteredPositions={filteredPositions}
          filteredOperations={filteredOperations}
          filteredDividends={filteredDividends}
          filteredMonthlyTaxes={filteredMonthlyTaxes}
          filteredRealizedSales={filteredRealizedSales}
          taxesSummary={taxesSummary}
          realizedSalesSummary={realizedSalesSummary}
          proventosSummary={proventosSummary}
          irpfData={irpfData}
          monthlyTaxes={monthlyTaxes}
          copiedId={copiedId}
          onCopyText={handleCopyText}
          userProfile={userProfile}
          settings={settings}
          assetMap={assetMap}
          isSimulation={false}
        />
      </div>

      {/* ======================================================================= */}
      {/* 4. SIMULAÇÃO DA IMPRESSORA (VISUALIZAÇÃO PRÉVIA A4 ANTES DE IMPRIMIR)    */}
      {/* ======================================================================= */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col overflow-hidden animate-in fade-in duration-150 print:hidden">
          {/* Barra Superior de Controle da Impressora */}
          <div className="px-4 py-3 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide truncate max-w-[200px] sm:max-w-none">
                    Simulação da Impressora
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                    Padrão A4 Oficial
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Visualize o documento exatamente como sairá na folha impressa antes de enviar para a impressora
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Controles de Zoom para telas menores e celular */}
              <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
                <button
                  onClick={() => setPreviewScale(s => Math.max(0.4, Number((s - 0.1).toFixed(2))))}
                  title="Diminuir Zoom"
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold text-slate-300 px-2 select-none">
                  {Math.round(previewScale * 100)}%
                </span>
                <button
                  onClick={() => setPreviewScale(s => Math.min(1.2, Number((s + 0.1).toFixed(2))))}
                  title="Aumentar Zoom"
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Botão Salvar em PDF */}
              <button
                onClick={handleDownloadPdf}
                title="Baixar arquivo contábil pronto para salvar em PDF ou arquivamento"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Salvar em PDF</span>
              </button>

              {/* Botão Mandar Imprimir */}
              <button
                onClick={handleExecutePrint}
                title="Disparar a impressão na impressora física do sistema"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Imprimir</span>
              </button>

              {/* Botão Fechar Simulação */}
              <button
                onClick={() => setIsPrintPreviewOpen(false)}
                title="Fechar simulação (Esc)"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Área da Mesa de Impressão com a Folha A4 Realista */}
          <div className="flex-1 overflow-auto p-2 sm:p-6 lg:p-10 bg-slate-900/90 flex flex-col items-center">
            {/* Folha Física A4 Simulada escalada */}
            <div 
              style={{ 
                transform: `scale(${previewScale})`, 
                transformOrigin: 'top center',
                marginBottom: `${(1 - previewScale) * -600}px` 
              }}
              className="w-full max-w-[920px] bg-white text-slate-900 rounded-xs shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border border-slate-300 p-6 sm:p-12 sm:min-h-[1200px] relative space-y-6 print-paper-sheet transition-transform duration-150"
            >
              {/* Indicador visual de margem A4 (apenas na simulação de tela) */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 text-[10px] text-slate-400 font-mono select-none">
                <span>SIMULAÇÃO DE IMPRESSÃO • FOLHA A4 (210 × 297 mm)</span>
                <span>HERMAS VAULT REPORT • VIA OFICIAL</span>
              </div>

              {/* Conteúdo Real do Relatório na Folha */}
              <HermasReportDocument
                reportType={reportType}
                irpfYear={irpfYear}
                portfolio={portfolio}
                filteredPositions={filteredPositions}
                filteredOperations={filteredOperations}
                filteredDividends={filteredDividends}
                filteredMonthlyTaxes={filteredMonthlyTaxes}
                filteredRealizedSales={filteredRealizedSales}
                taxesSummary={taxesSummary}
                realizedSalesSummary={realizedSalesSummary}
                proventosSummary={proventosSummary}
                irpfData={irpfData}
                monthlyTaxes={monthlyTaxes}
                copiedId={copiedId}
                onCopyText={handleCopyText}
                userProfile={userProfile}
                settings={settings}
                assetMap={assetMap}
                isSimulation={true}
              />
            </div>

            {/* Aviso auxiliar de rodapé da mesa */}
            <p className="text-xs text-slate-400 mt-6 mb-2 text-center">
              Dica: Você pode clicar em <strong>"Mandar Imprimir"</strong> para enviar à impressora, ou em <strong>"Salvar em PDF"</strong> para baixar o arquivo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
