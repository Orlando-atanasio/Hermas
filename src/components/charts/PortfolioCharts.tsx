/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { PortfolioSummary } from '../../engine/portfolio';
import { Operation, Dividend } from '../../types';
import { formatBRL, formatPercent } from '../../engine/decimal';
import {
  X,
  CircleDollarSign,
  Calendar,
  ChevronDown,
  TrendingUp,
  Layers,
  BarChart2,
  LineChart,
} from 'lucide-react';

interface PortfolioChartsProps {
  portfolio: PortfolioSummary;
  operations: Operation[];
  dividends: Dividend[];
}

// Paleta harmoniosa e de alto contraste inspirada no design institucional dos prints
const PALETTE_COLORS = [
  '#60a5fa', // Azul (FIIs)
  '#fde047', // Amarelo (Ações)
  '#4ade80', // Verde (ETFs Intern.)
  '#c084fc', // Lilás / Roxo (Stocks)
  '#f87171', // Salmão / Coral (Reits)
  '#fb923c', // Laranja
  '#2dd4bf', // Turquesa
  '#818cf8', // Índigo
  '#f472b6', // Rosa
  '#a3e635', // Lima
  '#38bdf8', // Sky
  '#94a3b8', // Cinza ardósia
];

const ASSET_COLORS = [
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#06b6d4',
  '#ec4899',
  '#6366f1',
  '#14b8a6',
  '#f97316',
  '#64748b',
];

export const PortfolioCharts: React.FC<PortfolioChartsProps> = ({
  portfolio,
  operations,
  dividends,
}) => {
  // --- Estados do Gráfico "Ativos na Carteira" (Círculo Donut) ---
  const [selectedDonutType, setSelectedDonutType] = useState<string>('TODOS');
  const [isDonutDropdownOpen, setIsDonutDropdownOpen] = useState(false);
  const [selectedDonutSliceIndex, setSelectedDonutSliceIndex] = useState<number | null>(null);
  const donutDropdownRef = useRef<HTMLDivElement>(null);

  // --- Estados do Gráfico "Evolução do Patrimônio" ---
  const [evolutionPeriod, setEvolutionPeriod] = useState<string>('12M');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [evolutionTypeFilter, setEvolutionTypeFilter] = useState<string>('TODOS');
  const [isEvolutionTypeDropdownOpen, setIsEvolutionTypeDropdownOpen] = useState(false);
  const [evolutionChartMode, setEvolutionChartMode] = useState<'stacked-bars' | 'area'>('stacked-bars');
  const [selectedTimelinePoint, setSelectedTimelinePoint] = useState<any | null>(null);
  const periodDropdownRef = useRef<HTMLDivElement>(null);
  const evolutionTypeDropdownRef = useRef<HTMLDivElement>(null);

  // --- Estados dos Gráficos Inferiores (Top Ativos e Proventos) ---
  const [selectedAssetIndex, setSelectedAssetIndex] = useState<number | null>(null);
  const [selectedDividendPoint, setSelectedDividendPoint] = useState<any | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha menus e seleções ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (donutDropdownRef.current && !donutDropdownRef.current.contains(target)) {
        setIsDonutDropdownOpen(false);
      }
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(target)) {
        setIsPeriodDropdownOpen(false);
      }
      if (evolutionTypeDropdownRef.current && !evolutionTypeDropdownRef.current.contains(target)) {
        setIsEvolutionTypeDropdownOpen(false);
      }
      if (containerRef.current && !containerRef.current.contains(target)) {
        setSelectedDonutSliceIndex(null);
        setSelectedTimelinePoint(null);
        setSelectedAssetIndex(null);
        setSelectedDividendPoint(null);
      }
    };

    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Mapeamento dinâmico de Ticker -> Tipo de Ativo
  const tickerTypeMap = useMemo(() => {
    const map = new Map<string, string>();
    portfolio.posicoesCustodia.forEach(p => map.set(p.ticker, p.asset.tipo));
    portfolio.posicoesZeradas.forEach(p => map.set(p.ticker, p.asset.tipo));
    return map;
  }, [portfolio.posicoesCustodia, portfolio.posicoesZeradas]);

  // Lista de classes disponíveis na carteira
  const availableClasses = useMemo(() => {
    const types = new Set<string>();
    portfolio.posicoesCustodia.forEach(p => types.add(p.asset.tipo));
    portfolio.posicoesZeradas.forEach(p => types.add(p.asset.tipo));
    return Array.from(types);
  }, [portfolio.posicoesCustodia, portfolio.posicoesZeradas]);

  const classLabelMap: Record<string, string> = {
    AÇÃO: 'Ações',
    FII: 'FIIs',
    ETF: 'ETFs Intern.',
    BDR: 'Stocks',
    TESOURO: 'Tesouro / Renda Fixa',
    OUTROS: 'Outros',
  };

  // Opções para os dropdowns de filtro por tipo
  const typeFilterOptions = useMemo(() => {
    const list = [{ id: 'TODOS', label: 'Todos os tipos' }];
    availableClasses.forEach(t => {
      list.push({
        id: t,
        label: classLabelMap[t] || t,
      });
    });
    return list;
  }, [availableClasses]);

  // =========================================================================
  // 1. DADOS DO GRÁFICO CÍRCULO (DONUT) — "Ativos na Carteira"
  // =========================================================================
  const donutData = useMemo(() => {
    const patrimonioTotalNum = parseFloat(portfolio.patrimonioTotal) || 0;

    // Cenário A: "Todos os tipos" (Visão Macro por Classe)
    if (selectedDonutType === 'TODOS') {
      const items = portfolio.alocacaoPercentual.map((item, idx) => ({
        id: item.tipo,
        name: classLabelMap[item.tipo] || item.tipo,
        fullName: `${classLabelMap[item.tipo] || item.tipo} em Custódia`,
        value: parseFloat(item.total) || 0,
        percentual: parseFloat(item.percentual) || 0,
        color: PALETTE_COLORS[idx % PALETTE_COLORS.length],
      }));

      return {
        items,
        totalValue: patrimonioTotalNum,
        totalLabel: 'Total',
      };
    }

    // Cenário B: Classe Específica selecionada (Drill-down: exibe os ativos dessa classe)
    const filteredPositions = portfolio.posicoesCustodia
      .filter(p => p.asset.tipo === selectedDonutType)
      .sort((a, b) => parseFloat(b.valorAtual) - parseFloat(a.valorAtual));

    const classTotal = filteredPositions.reduce((sum, p) => sum + (parseFloat(p.valorAtual) || 0), 0);

    const items = filteredPositions.map((pos, idx) => {
      const val = parseFloat(pos.valorAtual) || 0;
      const pct = classTotal > 0 ? (val / classTotal) * 100 : 0;
      return {
        id: pos.ticker,
        name: pos.ticker,
        fullName: pos.asset.nome,
        value: val,
        percentual: Math.round(pct * 100) / 100,
        color: PALETTE_COLORS[idx % PALETTE_COLORS.length],
      };
    });

    return {
      items,
      totalValue: classTotal,
      totalLabel: classLabelMap[selectedDonutType] || selectedDonutType,
    };
  }, [portfolio, selectedDonutType]);

  const activeDonutSlice =
    selectedDonutSliceIndex !== null && donutData.items[selectedDonutSliceIndex]
      ? donutData.items[selectedDonutSliceIndex]
      : null;

  // =========================================================================
  // 2. DADOS DO GRÁFICO — "Evolução do Patrimônio" (Barras Empilhadas)
  // =========================================================================
  const evolutionData = useMemo(() => {
    let validOps = operations
      .filter(op => op.status === 'CONFIRMADA' || op.status === 'ARREDONDADA')
      .sort((a, b) => a.dataPregao.localeCompare(b.dataPregao));

    // Filtra por tipo de ativo se não for "TODOS"
    if (evolutionTypeFilter !== 'TODOS') {
      validOps = validOps.filter(op => tickerTypeMap.get(op.ticker) === evolutionTypeFilter);
    }

    if (validOps.length === 0) return [];

    const monthMap = new Map<string, { aportes: number; retiradas: number; count: number }>();

    validOps.forEach(op => {
      const month = (op.dataPregao || '').slice(0, 7);
      if (!month || month.length < 7) return;
      if (!monthMap.has(month)) {
        monthMap.set(month, { aportes: 0, retiradas: 0, count: 0 });
      }
      const data = monthMap.get(month)!;
      const val = parseFloat(op.valorTotalOperacao) || 0;

      if (op.tipo === 'COMPRA' || op.tipo === 'OPENING_POSITION' || op.tipo === 'BONIFICACAO') {
        data.aportes += val;
      } else if (op.tipo === 'VENDA' || op.tipo === 'AMORTIZACAO') {
        data.retiradas += val;
      }
      data.count++;
    });

    let acumuladoCusto = 0;
    const sortedMonths = Array.from(monthMap.keys()).sort();

    const fullSeries = sortedMonths.map((m, idx) => {
      const info = monthMap.get(m)!;
      acumuladoCusto += info.aportes - info.retiradas;
      if (acumuladoCusto < 0) acumuladoCusto = 0;

      const [year, monthNum] = m.split('-');
      const monthLabel = `${monthNum}/${(year || '').slice(2)}`;

      const ratio =
        parseFloat(portfolio.patrimonioTotal) / (parseFloat(portfolio.custoTotalInvestido) || 1);
      const isLast = idx === sortedMonths.length - 1;
      const patrimonioEstimado = isLast
        ? parseFloat(portfolio.patrimonioTotal)
        : acumuladoCusto * (1 + (ratio - 1) * ((idx + 1) / sortedMonths.length));

      const custoFinal = Math.round(acumuladoCusto * 100) / 100;
      const patrimonioFinal = Math.round(patrimonioEstimado * 100) / 100;
      const ganhoCapital = Math.max(0, Math.round((patrimonioFinal - custoFinal) * 100) / 100);

      return {
        mes: monthLabel,
        mesRaw: m,
        valorAplicado: custoFinal,
        ganhoCapital: ganhoCapital,
        patrimonioTotal: patrimonioFinal,
      };
    });

    // Filtra pelo período selecionado
    if (evolutionPeriod === '12M') {
      return fullSeries.slice(-12);
    } else if (evolutionPeriod === '2Y') {
      return fullSeries.slice(-24);
    } else if (evolutionPeriod === '5Y') {
      return fullSeries.slice(-60);
    }
    return fullSeries; // 'ALL'
  }, [operations, evolutionTypeFilter, evolutionPeriod, portfolio, tickerTypeMap]);

  // 3. Top Ativos por Peso em Carteira
  const topAssetsData = useMemo(() => {
    return portfolio.posicoesCustodia.slice(0, 7).map((pos, idx) => ({
      name: pos.ticker,
      fullName: pos.asset.nome,
      tipo: pos.asset.tipo,
      valor: parseFloat(pos.valorAtual),
      percentual: parseFloat(pos.percentualCarteira),
      color: ASSET_COLORS[idx % ASSET_COLORS.length],
    }));
  }, [portfolio.posicoesCustodia]);

  // 4. Histórico Mensal de Proventos
  const monthlyDividends = useMemo(() => {
    const map = new Map<string, number>();
    dividends.forEach(d => {
      if (d.status === 'RECEBIDO') {
        const dateStr = d.dataPagamento || d.dataCom || '';
        const month = dateStr.slice(0, 7);
        if (!month || month.length < 7) return;
        map.set(month, (map.get(month) || 0) + (parseFloat(d.valorLiquido) || 0));
      }
    });

    const sortedMonths = Array.from(map.keys()).sort();
    return sortedMonths.map(m => {
      const [year, monthNum] = m.split('-');
      const monthLabel = `${monthNum}/${(year || '').slice(2)}`;
      return {
        mes: monthLabel,
        proventos: Math.round((map.get(m) || 0) * 100) / 100,
      };
    });
  }, [dividends]);

  return (
    <div ref={containerRef} className="space-y-6 select-none chart-card-container">
      {/* ========================================================================= */}
      {/* GRADE PRINCIPAL: EVOLUÇÃO DO PATRIMÔNIO + ATIVOS NA CARTEIRA (DONUT)      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ----------------------------------------------------------------------- */}
        {/* CARD 1: EVOLUÇÃO DO PATRIMÔNIO (Estilo Exato dos Prints 5, 6, 7)         */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-7 p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between select-none">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Evolução do Patrimônio</span>
                </h3>
              </div>

              {/* Controles de Filtros: Período e Tipo de Ativo */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Dropdown 1: Período (Calendário) */}
                <div className="relative" ref={periodDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPeriodDropdownOpen(!isPeriodDropdownOpen);
                      setIsEvolutionTypeDropdownOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {evolutionPeriod === '12M'
                        ? 'Últimos 12 Meses'
                        : evolutionPeriod === '2Y'
                        ? '2 Anos'
                        : evolutionPeriod === '5Y'
                        ? '5 Anos'
                        : 'Desde o início'}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                        isPeriodDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isPeriodDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                      {[
                        { id: 'ALL', label: 'Desde o início' },
                        { id: '12M', label: 'Últimos 12 Meses' },
                        { id: '2Y', label: '2 Anos' },
                        { id: '5Y', label: '5 Anos' },
                      ].map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setEvolutionPeriod(p.id);
                            setIsPeriodDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 cursor-pointer transition-colors ${
                            evolutionPeriod === p.id
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dropdown 2: Tipo de Ativo ($) */}
                <div className="relative" ref={evolutionTypeDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEvolutionTypeDropdownOpen(!isEvolutionTypeDropdownOpen);
                      setIsPeriodDropdownOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <CircleDollarSign className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {typeFilterOptions.find(t => t.id === evolutionTypeFilter)?.label ||
                        'Todos os tipos'}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                        isEvolutionTypeDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isEvolutionTypeDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                      {typeFilterOptions.map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setEvolutionTypeFilter(opt.id);
                            setIsEvolutionTypeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 cursor-pointer transition-colors ${
                            evolutionTypeFilter === opt.id
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Alternador de Modo (Barras Empilhadas vs Área) */}
                <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setEvolutionChartMode('stacked-bars')}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      evolutionChartMode === 'stacked-bars'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                    title="Visualizar em barras empilhadas"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvolutionChartMode('area')}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      evolutionChartMode === 'area'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                    title="Visualizar em curva de área contínua"
                  >
                    <LineChart className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Legenda Oficial idêntica aos Prints: Valor Aplicado & Ganho de Capital */}
            <div className="flex items-center justify-center gap-6 text-xs mb-3 py-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-[#10b981] inline-block" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  Valor aplicado
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-[#6ee7b7] inline-block" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  Ganho de Capital
                </span>
              </div>
            </div>

            {evolutionData.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-xs text-slate-400">
                Sem histórico de aportes para o filtro selecionado.
              </div>
            ) : (
              <div className="h-60 w-full touch-pan-y">
                <ResponsiveContainer width="100%" height="100%">
                  {evolutionChartMode === 'stacked-bars' ? (
                    <BarChart
                      data={evolutionData}
                      margin={{ top: 10, right: 10, left: -5, bottom: 0 }}
                      onClick={(e: any) => {
                        if (e && e.activePayload && e.activePayload.length) {
                          setSelectedTimelinePoint(e.activePayload[0].payload);
                        }
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(148, 163, 184, 0.15)"
                      />
                      <XAxis
                        dataKey="mes"
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickFormatter={val => `R$ ${(val / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        isAnimationActive={false}
                        wrapperStyle={{ pointerEvents: 'none', outline: 'none', zIndex: 40 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-xl shadow-xl border border-slate-700/60 text-xs space-y-1.5 pointer-events-none select-none">
                                <p className="font-bold text-slate-300 border-b border-slate-800 pb-1">
                                  {data.mes}
                                </p>
                                <div className="flex justify-between gap-4">
                                  <span className="text-emerald-400">Valor aplicado:</span>
                                  <span className="font-mono font-bold">
                                    {formatBRL(data.valorAplicado)}
                                  </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-teal-300">Ganho de Capital:</span>
                                  <span className="font-mono font-bold">
                                    +{formatBRL(data.ganhoCapital)}
                                  </span>
                                </div>
                                <div className="flex justify-between gap-4 pt-1 border-t border-slate-800 text-blue-300">
                                  <span>Patrimônio Total:</span>
                                  <span className="font-mono font-bold">
                                    {formatBRL(data.patrimonioTotal)}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {/* Barra 1 (Base): Valor Aplicado */}
                      <Bar
                        dataKey="valorAplicado"
                        stackId="patrimonio"
                        fill="#10b981"
                        maxBarSize={36}
                      />
                      {/* Barra 2 (Topo): Ganho de Capital */}
                      <Bar
                        dataKey="ganhoCapital"
                        stackId="patrimonio"
                        fill="#6ee7b7"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                    </BarChart>
                  ) : (
                    <AreaChart
                      data={evolutionData}
                      margin={{ top: 10, right: 10, left: -5, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(148, 163, 184, 0.15)"
                      />
                      <XAxis
                        dataKey="mes"
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickFormatter={val => `R$ ${(val / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        isAnimationActive={false}
                        wrapperStyle={{ pointerEvents: 'none', outline: 'none', zIndex: 40 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-xl shadow-xl border border-slate-700/60 text-xs space-y-1.5 pointer-events-none select-none">
                                <p className="font-bold text-slate-300 border-b border-slate-800 pb-1">
                                  {data.mes}
                                </p>
                                <div className="flex justify-between gap-4">
                                  <span className="text-emerald-400">Patrimônio:</span>
                                  <span className="font-mono font-bold">
                                    {formatBRL(data.patrimonioTotal)}
                                  </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">Valor aplicado:</span>
                                  <span className="font-mono">
                                    {formatBRL(data.valorAplicado)}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="patrimonioTotal"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#colorPatrimonio)"
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CARD 2: ATIVOS NA CARTEIRA (Donut Drill-down — Prints 1, 2, 3, 4)       */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-5 p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between select-none">
          <div>
            {/* Cabeçalho com Dropdown "Todos os tipos / Ações / FIIs / ETFs..." */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Ativos na Carteira</span>
              </h3>

              <div className="relative" ref={donutDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDonutDropdownOpen(!isDonutDropdownOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
                >
                  <CircleDollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {typeFilterOptions.find(t => t.id === selectedDonutType)?.label ||
                      'Todos os tipos'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      isDonutDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isDonutDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                    {typeFilterOptions.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedDonutType(opt.id);
                          setSelectedDonutSliceIndex(null);
                          setIsDonutDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 cursor-pointer transition-colors ${
                          selectedDonutType === opt.id
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {donutData.items.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-xs text-slate-400">
                Nenhum ativo encontrado para esta categoria.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                {/* Lado Esquerdo: Donut Chart com o anel e centro */}
                <div className="w-full sm:w-[48%] h-56 relative flex items-center justify-center shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData.items}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={donutData.items.length > 1 ? 2.5 : 0}
                        dataKey="value"
                        onClick={(_, idx) => {
                          setSelectedDonutSliceIndex(prev => (prev === idx ? null : idx));
                        }}
                        cursor="pointer"
                      >
                        {donutData.items.map((entry, index) => {
                          const isSelected = selectedDonutSliceIndex === index;
                          return (
                            <Cell
                              key={`donut-slice-${index}`}
                              fill={entry.color}
                              stroke={isSelected ? '#ffffff' : 'transparent'}
                              strokeWidth={isSelected ? 3 : 0}
                              style={{
                                transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                                transformOrigin: 'center center',
                                transition: 'transform 0.15s ease-out',
                              }}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip
                        isAnimationActive={false}
                        wrapperStyle={{ pointerEvents: 'none', outline: 'none', zIndex: 40 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-2.5 rounded-xl shadow-lg border border-slate-700/60 text-xs pointer-events-none select-none">
                                <p className="font-bold">{data.name}</p>
                                <p className="text-slate-300 font-mono">
                                  {formatBRL(data.value)} ({data.percentual.toFixed(2).replace('.', ',')}%)
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Informação Central do Donut — pointer-events-none para não bloquear as fatias */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDonutSliceIndex(null);
                      }}
                      className="w-24 h-24 rounded-full flex flex-col items-center justify-center text-center pointer-events-auto cursor-pointer"
                      title={activeDonutSlice ? 'Toque para limpar seleção' : undefined}
                    >
                      {activeDonutSlice ? (
                        <>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider truncate max-w-[80px]">
                            {activeDonutSlice.name}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white font-mono-numbers">
                            {activeDonutSlice.percentual.toFixed(2).replace('.', ',')}%
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5">limpar</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate max-w-[80px]">
                            {donutData.totalLabel}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white font-mono-numbers">
                            {formatBRL(donutData.totalValue)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Lista de Ativos/Classes com Rolagem Suave (Prints 1, 2, 3) */}
                <div className="w-full sm:w-[52%] max-h-56 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                  {donutData.items.map((item, idx) => {
                    const isSelected = selectedDonutSliceIndex === idx;
                    return (
                      <div
                        key={item.id}
                        onClick={() =>
                          setSelectedDonutSliceIndex(prev => (prev === idx ? null : idx))
                        }
                        className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-500'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span
                            className="w-3.5 h-3.5 rounded-xs shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span
                            className="font-semibold text-slate-800 dark:text-slate-200 truncate"
                            title={item.name}
                          >
                            {item.name}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                            {item.percentual.toFixed(2).replace('.', ',')}%
                          </div>
                          <div className="font-mono text-[10px] text-slate-400">
                            {formatBRL(item.value)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GRADE SECUNDÁRIA: TOP ATIVOS POR PESO & PROVENTOS MENSAIS                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 3: Repartição de Ativos (Top Holdings por Peso) */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between select-none">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <span>Top Ativos por Representatividade (Peso %)</span>
              </h3>
              <span className="text-xs text-slate-400">Maiores posições</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Toque na barra para inspecionar cada ativo
            </p>

            {/* Banner de Ativo Selecionado */}
            {selectedAssetIndex !== null && topAssetsData[selectedAssetIndex] && (
              <div className="mb-2 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs animate-in fade-in">
                <div>
                  <strong className="text-indigo-900 dark:text-indigo-300">
                    {topAssetsData[selectedAssetIndex].name} —{' '}
                    {topAssetsData[selectedAssetIndex].fullName}
                  </strong>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Valor:{' '}
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatBRL(topAssetsData[selectedAssetIndex].valor)}
                    </span>{' '}
                    • Participação:{' '}
                    <span className="font-mono font-bold">
                      {formatPercent(topAssetsData[selectedAssetIndex].percentual)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAssetIndex(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {topAssetsData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                Nenhum ativo em custódia.
              </div>
            ) : (
              <div className="h-56 w-full touch-pan-y">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topAssetsData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    onClick={e => {
                      if (e && e.activeTooltipIndex !== undefined && e.activeTooltipIndex !== null) {
                        const idx = Number(e.activeTooltipIndex);
                        setSelectedAssetIndex(prev => (prev === idx ? null : idx));
                      } else {
                        setSelectedAssetIndex(null);
                      }
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="rgba(148, 163, 184, 0.15)"
                    />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickFormatter={val => `R$ ${(val / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                    />
                    <Tooltip
                      isAnimationActive={false}
                      wrapperStyle={{ pointerEvents: 'none', outline: 'none', zIndex: 40 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-xl shadow-lg border border-slate-700/60 text-xs space-y-1 pointer-events-none select-none">
                              <p className="font-bold">
                                {data.name} — {data.fullName}
                              </p>
                              <p className="text-slate-400">
                                Classe: <span className="text-slate-200">{data.tipo}</span>
                              </p>
                              <p className="text-blue-400 font-mono font-bold">
                                Valor Atual: {formatBRL(data.valor)}
                              </p>
                              <p className="text-slate-300 font-mono">
                                Participação: {formatPercent(data.percentual)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="valor" radius={[0, 6, 6, 0]} maxBarSize={20} cursor="pointer">
                      {topAssetsData.map((entry, index) => {
                        const isSelected = selectedAssetIndex === index;
                        return (
                          <Cell
                            key={`bar-${index}`}
                            fill={entry.color}
                            opacity={selectedAssetIndex === null || isSelected ? 1 : 0.35}
                            stroke="none"
                            strokeWidth={0}
                            style={{ outline: 'none' }}
                            onClick={(ev) => {
                              ev?.stopPropagation?.();
                              setSelectedAssetIndex(prev => (prev === index ? null : index));
                            }}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex justify-between">
            <span>Diversificação da carteira</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Total de ativos:{' '}
              <strong className="text-slate-900 dark:text-white">
                {portfolio.posicoesCustodia.length}
              </strong>
            </span>
          </div>
        </div>

        {/* Gráfico 4: Proventos Recebidos por Mês (Barras) */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between select-none">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Proventos Creditados por Mês (Renda Passiva)</span>
              </h3>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono-numbers">
                Total: {formatBRL(portfolio.proventosRecebidosTotal)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Toque em uma barra para inspecionar o crédito do mês
            </p>

            {/* Banner de Mês Selecionado */}
            {selectedDividendPoint && (
              <div className="mb-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs animate-in fade-in">
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-300">
                    {selectedDividendPoint.mes}:
                  </span>{' '}
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatBRL(selectedDividendPoint.proventos)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDividendPoint(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {monthlyDividends.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                Nenhum provento creditado no histórico.
              </div>
            ) : (
              <div className="h-56 w-full touch-pan-y">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyDividends}
                    margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload.length) {
                        const payload = e.activePayload[0].payload;
                        if (selectedDividendPoint?.mes === payload.mes) {
                          setSelectedDividendPoint(null);
                        } else {
                          setSelectedDividendPoint(payload);
                        }
                      } else {
                        setSelectedDividendPoint(null);
                      }
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(148, 163, 184, 0.15)"
                    />
                    <XAxis
                      dataKey="mes"
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickFormatter={val => `R$ ${val}`}
                    />
                    <Tooltip
                      isAnimationActive={false}
                      wrapperStyle={{ pointerEvents: 'none', outline: 'none', zIndex: 40 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-2.5 rounded-xl shadow-lg border border-slate-700/60 text-xs pointer-events-none select-none">
                              <p className="font-bold text-slate-300">{data.mes}</p>
                              <p className="text-emerald-400 font-mono font-bold mt-1">
                                Renda: {formatBRL(data.proventos)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="proventos"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={28}
                      cursor="pointer"
                    >
                      {monthlyDividends.map((entry, index) => {
                        const isSelected = selectedDividendPoint?.mes === entry.mes;
                        return (
                          <Cell
                            key={`cell-div-${index}`}
                            fill="#10b981"
                            opacity={selectedDividendPoint === null || isSelected ? 1 : 0.35}
                            stroke="none"
                            strokeWidth={0}
                            style={{ outline: 'none' }}
                            onClick={(ev) => {
                              ev?.stopPropagation?.();
                              setSelectedDividendPoint(prev => (prev?.mes === entry.mes ? null : entry));
                            }}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex justify-between">
            <span>Renda passiva acumulada</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              Isenta de IR (rendimentos de FII e dividendos)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
