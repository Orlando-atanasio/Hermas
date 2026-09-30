/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
import { X, Touchpad, CheckCircle2 } from 'lucide-react';

interface PortfolioChartsProps {
  portfolio: PortfolioSummary;
  operations: Operation[];
  dividends: Dividend[];
}

const ALLOCATION_COLORS = [
  '#2563eb', // Blue
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#64748b', // Slate
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
  // Estados para seleção/toque interativo no mobile
  const [selectedClassIndex, setSelectedClassIndex] = useState<number | null>(null);
  const [selectedTimelinePoint, setSelectedTimelinePoint] = useState<any | null>(null);
  const [selectedAssetIndex, setSelectedAssetIndex] = useState<number | null>(null);
  const [selectedDividendPoint, setSelectedDividendPoint] = useState<any | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha seleções ativas ao tocar fora do container dos gráficos
  useEffect(() => {
    const handleTouchOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelectedClassIndex(null);
        setSelectedTimelinePoint(null);
        setSelectedAssetIndex(null);
        setSelectedDividendPoint(null);
      }
    };

    document.addEventListener('touchstart', handleTouchOutside, { passive: true });
    document.addEventListener('mousedown', handleTouchOutside);
    return () => {
      document.removeEventListener('touchstart', handleTouchOutside);
      document.removeEventListener('mousedown', handleTouchOutside);
    };
  }, []);

  // 1. Dados para o gráfico de Donut de Alocação por Classe
  const allocationData = portfolio.alocacaoPercentual.map((item, idx) => ({
    name: item.tipo,
    value: parseFloat(item.total),
    percentual: parseFloat(item.percentual),
    color: ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length],
  }));

  // 2. Dados para o gráfico de Top Ativos por Peso em Carteira
  const topAssetsData = portfolio.posicoesCustodia.slice(0, 7).map((pos, idx) => ({
    name: pos.ticker,
    fullName: pos.asset.nome,
    tipo: pos.asset.tipo,
    valor: parseFloat(pos.valorAtual),
    percentual: parseFloat(pos.percentualCarteira),
    color: ASSET_COLORS[idx % ASSET_COLORS.length],
  }));

  // 3. Evolução Acumulada de Aportes vs Valor Patrimonial Atual ao longo dos meses
  const monthlyTimeline = React.useMemo(() => {
    const validOps = operations
      .filter(op => op.status === 'CONFIRMADA' || op.status === 'ARREDONDADA')
      .sort((a, b) => a.dataPregao.localeCompare(b.dataPregao));

    if (validOps.length === 0) return [];

    const monthMap = new Map<string, { aportes: number; retiradas: number; count: number }>();

    validOps.forEach(op => {
      const month = op.dataPregao.slice(0, 7);
      if (!monthMap.has(month)) {
        monthMap.set(month, { aportes: 0, retiradas: 0, count: 0 });
      }
      const data = monthMap.get(month)!;
      const val = parseFloat(op.valorTotalOperacao);

      if (op.tipo === 'COMPRA' || op.tipo === 'OPENING_POSITION' || op.tipo === 'BONIFICACAO') {
        data.aportes += val;
      } else if (op.tipo === 'VENDA' || op.tipo === 'AMORTIZACAO') {
        data.retiradas += val;
      }
      data.count++;
    });

    let acumuladoCusto = 0;
    const sortedMonths = Array.from(monthMap.keys()).sort();

    return sortedMonths.map((m, idx) => {
      const info = monthMap.get(m)!;
      acumuladoCusto += info.aportes - info.retiradas;
      if (acumuladoCusto < 0) acumuladoCusto = 0;

      const [year, monthNum] = m.split('-');
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const label = `${monthNames[parseInt(monthNum, 10) - 1]}/${year.slice(2)}`;

      const ratio = parseFloat(portfolio.patrimonioTotal) / (parseFloat(portfolio.custoTotalInvestido) || 1);
      const isLast = idx === sortedMonths.length - 1;
      const patrimonioEstimado = isLast
        ? parseFloat(portfolio.patrimonioTotal)
        : acumuladoCusto * (1 + (ratio - 1) * ((idx + 1) / sortedMonths.length));

      return {
        mes: label,
        mesRaw: m,
        custoAportado: Math.round(acumuladoCusto * 100) / 100,
        patrimonio: Math.round(patrimonioEstimado * 100) / 100,
        operacoesNoMes: info.count,
      };
    });
  }, [operations, portfolio]);

  // 4. Histórico Mensal de Proventos Recebidos
  const monthlyDividends = React.useMemo(() => {
    const map = new Map<string, number>();
    dividends.forEach(d => {
      if (d.status === 'RECEBIDO') {
        const month = (d.dataPagamento || d.dataCom).slice(0, 7);
        map.set(month, (map.get(month) || 0) + parseFloat(d.valorLiquido));
      }
    });

    const sortedMonths = Array.from(map.keys()).sort();
    return sortedMonths.map(m => {
      const [year, monthNum] = m.split('-');
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const label = `${monthNames[parseInt(monthNum, 10) - 1]}/${year.slice(2)}`;
      return {
        mes: label,
        proventos: Math.round((map.get(m) || 0) * 100) / 100,
      };
    });
  }, [dividends]);

  const selectedClass = selectedClassIndex !== null ? allocationData[selectedClassIndex] : null;

  return (
    <div ref={containerRef} className="space-y-6 select-none chart-card-container">
      {/* Grade de 2 Gráficos de Alto Nível: Evolução Histórica e Alocação por Classe */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Curva de Evolução Patrimonial */}
        <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between select-none">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span>Evolução Patrimonial: Aportes vs Patrimônio Atual</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Visualização da curva de acúmulo contínuo e ganho de capital
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-600"></span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Patrimônio Líquido</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-slate-400 dark:bg-slate-600"></span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Custo Aportado</span>
                </div>
              </div>
            </div>

            {/* Banner de Ponto Selecionado no Touch / Mobile */}
            {selectedTimelinePoint && (
              <div className="mb-3 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-blue-900 dark:text-blue-300">
                    {selectedTimelinePoint.mes}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    Patrimônio: <strong className="font-mono text-blue-600 dark:text-blue-400">{formatBRL(selectedTimelinePoint.patrimonio)}</strong>
                  </span>
                  <span className="text-slate-500">
                    Custo: <strong className="font-mono">{formatBRL(selectedTimelinePoint.custoAportado)}</strong>
                  </span>
                  <span className={selectedTimelinePoint.patrimonio >= selectedTimelinePoint.custoAportado ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-500 font-bold'}>
                    {selectedTimelinePoint.patrimonio >= selectedTimelinePoint.custoAportado ? '+' : ''}
                    {formatBRL(selectedTimelinePoint.patrimonio - selectedTimelinePoint.custoAportado)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTimelinePoint(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Fechar detalhes"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {monthlyTimeline.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                Sem histórico de aportes registrado no cofre.
              </div>
            ) : (
              <div className="h-60 sm:h-64 w-full pt-2 touch-pan-y">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyTimeline}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload.length) {
                        const payload = e.activePayload[0].payload;
                        if (selectedTimelinePoint?.mesRaw === payload.mesRaw) {
                          setSelectedTimelinePoint(null);
                        } else {
                          setSelectedTimelinePoint(payload);
                        }
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorCusto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
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
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      isAnimationActive={false}
                      wrapperStyle={{ pointerEvents: 'none', outline: 'none', zIndex: 40 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const lucro = data.patrimonio - data.custoAportado;
                          return (
                            <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-slate-700/60 text-xs space-y-1.5 pointer-events-none select-none">
                              <p className="font-bold text-slate-300 border-b border-slate-800 pb-1">
                                {data.mes}
                              </p>
                              <div className="flex justify-between gap-4">
                                <span className="text-blue-400">Patrimônio:</span>
                                <span className="font-mono font-bold">{formatBRL(data.patrimonio)}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Custo Total:</span>
                                <span className="font-mono">{formatBRL(data.custoAportado)}</span>
                              </div>
                              <div className="flex justify-between gap-4 pt-1 border-t border-slate-800/80">
                                <span className={lucro >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                  {lucro >= 0 ? 'Lucro Não Realizado:' : 'Variação Negativa:'}
                                </span>
                                <span className={`font-mono font-bold ${lucro >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {formatBRL(lucro)}
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
                      dataKey="patrimonio"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorPatrimonio)"
                      isAnimationActive={true}
                      animationDuration={300}
                    />
                    <Area
                      type="monotone"
                      dataKey="custoAportado"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#colorCusto)"
                      isAnimationActive={true}
                      animationDuration={300}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Última reconciliação contábil</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Patrimônio Líquido Atual: <strong className="text-blue-600 dark:text-blue-400 font-mono-numbers">{formatBRL(portfolio.patrimonioTotal)}</strong>
            </span>
          </div>
        </div>

        {/* Gráfico 2: Donut Interativo de Alocação por Classe de Ativos */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between select-none">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Divisão por Classe</span>
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                {allocationData.length} classes
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Toque em uma fatia para filtrar e ver detalhes
            </p>

            {allocationData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                Sem posições ativas para gerar o donut.
              </div>
            ) : (
              <div className="h-48 w-full relative touch-pan-y">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={74}
                      paddingAngle={3}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={300}
                      onClick={(_, index) => {
                        setSelectedClassIndex(prev => (prev === index ? null : index));
                      }}
                      cursor="pointer"
                    >
                      {allocationData.map((entry, index) => {
                        const isSelected = selectedClassIndex === index;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke={isSelected ? '#ffffff' : 'transparent'}
                            strokeWidth={isSelected ? 3 : 0}
                            style={{
                              transform: isSelected ? 'scale(1.05)' : 'scale(1)',
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
                                {formatBRL(data.value)} ({formatPercent(data.percentual)})
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Centro do Donut com Conteúdo Dinâmico */}
                <div 
                  onClick={() => setSelectedClassIndex(null)}
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto cursor-pointer"
                  title={selectedClass ? "Toque para voltar ao total" : undefined}
                >
                  {selectedClass ? (
                    <>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider truncate max-w-[90px]">
                        {selectedClass.name}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono-numbers">
                        {formatPercent(selectedClass.percentual)}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-0.5">toque p/ limpar</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono-numbers">
                        {formatBRL(portfolio.patrimonioTotal)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Legenda com botões de seleção rápida no toque */}
            <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {allocationData.map((item, idx) => {
                const isSelected = selectedClassIndex === idx;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedClassIndex(prev => (prev === idx ? null : idx))}
                    className={`w-full flex items-center justify-between text-xs p-1.5 rounded-xl transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500">{formatBRL(item.value)}</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono min-w-[42px] text-right">
                        {formatPercent(item.percentual)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Grade Secundária: Gráficos de Repartição por Ativo & Proventos Mensais */}
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
                    {topAssetsData[selectedAssetIndex].name} — {topAssetsData[selectedAssetIndex].fullName}
                  </strong>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Valor: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{formatBRL(topAssetsData[selectedAssetIndex].valor)}</span> • Participação: <span className="font-mono font-bold">{formatPercent(topAssetsData[selectedAssetIndex].percentual)}</span>
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
                    onClick={(e) => {
                      if (e && e.activeTooltipIndex !== undefined) {
                        const idx = Number(e.activeTooltipIndex);
                        setSelectedAssetIndex(prev => (prev === idx ? null : idx));
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148, 163, 184, 0.15)" />
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
                              <p className="font-bold">{data.name} — {data.fullName}</p>
                              <p className="text-slate-400">Classe: <span className="text-slate-200">{data.tipo}</span></p>
                              <p className="text-blue-400 font-mono font-bold">Valor Atual: {formatBRL(data.valor)}</p>
                              <p className="text-slate-300 font-mono">Participação: {formatPercent(data.percentual)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="valor" radius={[0, 6, 6, 0]} cursor="pointer">
                      {topAssetsData.map((entry, index) => {
                        const isSelected = selectedAssetIndex === index;
                        return (
                          <Cell
                            key={`bar-${index}`}
                            fill={entry.color}
                            stroke={isSelected ? '#ffffff' : 'transparent'}
                            strokeWidth={isSelected ? 2 : 0}
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
              Total de ativos: <strong className="text-slate-900 dark:text-white">{portfolio.posicoesCustodia.length}</strong>
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
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
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
                    <Bar dataKey="proventos" fill="#10b981" radius={[6, 6, 0, 0]} cursor="pointer" />
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
