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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { CustodyPosition } from '../../types';
import { formatBRL, formatPercent, isPositive } from '../../engine/decimal';
import { X, CircleDollarSign, ChevronDown, TrendingUp } from 'lucide-react';

interface CustodyBreakdownChartsProps {
  positions: CustodyPosition[];
}

const PALETTE_COLORS = [
  '#60a5fa', // Azul
  '#fde047', // Amarelo
  '#4ade80', // Verde
  '#c084fc', // Lilás / Roxo
  '#f87171', // Coral / Salmão
  '#fb923c', // Laranja
  '#2dd4bf', // Turquesa
  '#818cf8', // Índigo
  '#f472b6', // Rosa
  '#a3e635', // Lima
  '#38bdf8', // Sky
  '#94a3b8', // Cinza
];

const classLabelMap: Record<string, string> = {
  AÇÃO: 'Ações',
  FII: 'FIIs',
  ETF: 'ETFs Intern.',
  BDR: 'Stocks',
  TESOURO: 'Tesouro / Renda Fixa',
  OUTROS: 'Outros',
};

export const CustodyBreakdownCharts: React.FC<CustodyBreakdownChartsProps> = ({ positions }) => {
  // --- Estados do Gráfico 1: Repartição de Custódia (Círculo Donut) ---
  const [selectedFilterType, setSelectedFilterType] = useState<string>('TODOS_ATIVOS');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSliceIndex, setSelectedSliceIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Estados do Gráfico 2: Rentabilidade Não Realizada (Colunas Verticais em Pé) ---
  const [selectedReturnIndex, setSelectedReturnIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha seleções e menus ao tocar fora
  useEffect(() => {
    const handleTouchOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
      if (containerRef.current && !containerRef.current.contains(target)) {
        setSelectedSliceIndex(null);
        setSelectedReturnIndex(null);
      }
    };

    document.addEventListener('touchstart', handleTouchOutside, { passive: true });
    document.addEventListener('mousedown', handleTouchOutside);
    return () => {
      document.removeEventListener('touchstart', handleTouchOutside);
      document.removeEventListener('mousedown', handleTouchOutside);
    };
  }, []);

  // Lista de classes disponíveis em custódia
  const availableClasses = useMemo(() => {
    const types = new Set<string>();
    positions.forEach(p => types.add(p.asset.tipo));
    return Array.from(types);
  }, [positions]);

  // Opções para o dropdown do Donut
  const filterOptions = useMemo(() => {
    const list = [
      { id: 'TODOS_ATIVOS', label: 'Todos os ativos' },
      { id: 'CLASSES', label: 'Divisão por classe' },
    ];
    availableClasses.forEach(t => {
      list.push({
        id: t,
        label: classLabelMap[t] || t,
      });
    });
    return list;
  }, [availableClasses]);

  // =========================================================================
  // 1. DADOS DO GRÁFICO CÍRCULO (DONUT) — "Repartição de Custódia"
  // =========================================================================
  const donutData = useMemo(() => {
    const totalCarteira = positions.reduce(
      (sum, p) => sum + (parseFloat(p.valorAtual) || 0),
      0
    );

    // Modo 1: Todos os Ativos individuais
    if (selectedFilterType === 'TODOS_ATIVOS') {
      const sorted = [...positions].sort(
        (a, b) => (parseFloat(b.valorAtual) || 0) - (parseFloat(a.valorAtual) || 0)
      );

      const items = sorted.map((p, idx) => {
        const val = parseFloat(p.valorAtual) || 0;
        const pct = totalCarteira > 0 ? (val / totalCarteira) * 100 : 0;
        return {
          id: p.ticker,
          name: p.ticker,
          fullName: p.asset.nome,
          tipo: p.asset.tipo,
          value: val,
          percentual: Math.round(pct * 100) / 100,
          color: PALETTE_COLORS[idx % PALETTE_COLORS.length],
        };
      });

      return {
        items,
        totalValue: totalCarteira,
        label: 'Total em Carteira',
      };
    }

    // Modo 2: Agrupado por Classe
    if (selectedFilterType === 'CLASSES') {
      const map = new Map<string, number>();
      positions.forEach(p => {
        const t = p.asset.tipo;
        const val = parseFloat(p.valorAtual) || 0;
        map.set(t, (map.get(t) || 0) + val);
      });

      const items = Array.from(map.entries())
        .map(([tipo, val], idx) => {
          const pct = totalCarteira > 0 ? (val / totalCarteira) * 100 : 0;
          return {
            id: tipo,
            name: classLabelMap[tipo] || tipo,
            fullName: `${classLabelMap[tipo] || tipo} em Custódia`,
            tipo,
            value: val,
            percentual: Math.round(pct * 100) / 100,
            color: PALETTE_COLORS[idx % PALETTE_COLORS.length],
          };
        })
        .sort((a, b) => b.value - a.value);

      return {
        items,
        totalValue: totalCarteira,
        label: 'Total por Classes',
      };
    }

    // Modo 3: Classe Específica (Drill-down: ativos daquela classe com % relativa a ela)
    const filtered = positions
      .filter(p => p.asset.tipo === selectedFilterType)
      .sort((a, b) => (parseFloat(b.valorAtual) || 0) - (parseFloat(a.valorAtual) || 0));

    const classTotal = filtered.reduce(
      (sum, p) => sum + (parseFloat(p.valorAtual) || 0),
      0
    );

    const items = filtered.map((p, idx) => {
      const val = parseFloat(p.valorAtual) || 0;
      const pct = classTotal > 0 ? (val / classTotal) * 100 : 0;
      return {
        id: p.ticker,
        name: p.ticker,
        fullName: p.asset.nome,
        tipo: p.asset.tipo,
        value: val,
        percentual: Math.round(pct * 100) / 100,
        color: PALETTE_COLORS[idx % PALETTE_COLORS.length],
      };
    });

    return {
      items,
      totalValue: classTotal,
      label: classLabelMap[selectedFilterType] || selectedFilterType,
    };
  }, [positions, selectedFilterType]);

  const activeDonutSlice =
    selectedSliceIndex !== null && donutData.items[selectedSliceIndex]
      ? donutData.items[selectedSliceIndex]
      : null;

  // =========================================================================
  // 2. DADOS DO GRÁFICO EM PÉ — "Rentabilidade Não Realizada por Ativo (%)"
  // =========================================================================
  const returnData = useMemo(() => {
    return positions
      .map(p => ({
        ticker: p.ticker,
        nome: p.asset.nome,
        tipo: p.asset.tipo,
        rentabilidadePct: Math.round(parseFloat(p.rentabilidadeNaoRealizadaPct) * 100) / 100,
        lucroValor: parseFloat(p.lucroNaoRealizado) || 0,
        isPositive: isPositive(p.lucroNaoRealizado),
      }))
      .sort((a, b) => b.rentabilidadePct - a.rentabilidadePct); // Maiores lucros à esquerda, menores/prejuízos à direita
  }, [positions]);

  if (positions.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none chart-card-container"
    >
      {/* ======================================================================= */}
      {/* GRÁFICO 1: REPARTIÇÃO DE CUSTÓDIA ➔ CÍRCULO (DONUT)                     */}
      {/* ======================================================================= */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between select-none">
        <div>
          {/* Cabeçalho com Dropdown de Filtro */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>Repartição de Custódia (Peso em %)</span>
            </h3>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                <CircleDollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {filterOptions.find(opt => opt.id === selectedFilterType)?.label ||
                    'Todos os ativos'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                  {filterOptions.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedFilterType(opt.id);
                        setSelectedSliceIndex(null);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 cursor-pointer transition-colors ${
                        selectedFilterType === opt.id
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

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Participação de cada ativo no patrimônio em custódia
          </p>

          {/* Banner de Item Selecionado */}
          {activeDonutSlice && (
            <div className="mb-2 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs animate-in fade-in">
              <div>
                <strong className="text-blue-900 dark:text-blue-300">
                  {activeDonutSlice.name}
                </strong>
                <span className="text-slate-500 ml-2">
                  Valor:{' '}
                  <strong className="font-mono text-blue-600 dark:text-blue-400">
                    {formatBRL(activeDonutSlice.value)}
                  </strong>{' '}
                  • Participação:{' '}
                  <strong className="font-mono">
                    {activeDonutSlice.percentual.toFixed(2).replace('.', ',')}%
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSliceIndex(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Fechar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Corpo do Gráfico: Donut na Esquerda + Lista com Rolagem na Direita */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
            {/* Lado Esquerdo: Donut Chart */}
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
                      setSelectedSliceIndex(prev => (prev === idx ? null : idx));
                    }}
                    cursor="pointer"
                  >
                    {donutData.items.map((entry, index) => {
                      const isSelected = selectedSliceIndex === index;
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

              {/* Informação no Centro do Donut — pointer-events-none para não bloquear as fatias */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSliceIndex(null);
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
                        {donutData.label}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono-numbers">
                        {formatBRL(donutData.totalValue)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Lado Direito: Lista de Itens com Cores e Porcentagens */}
            <div className="w-full sm:w-[52%] max-h-56 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
              {donutData.items.map((item, idx) => {
                const isSelected = selectedSliceIndex === idx;
                return (
                  <div
                    key={item.id}
                    onClick={() =>
                      setSelectedSliceIndex(prev => (prev === idx ? null : idx))
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
        </div>
      </div>

      {/* ======================================================================= */}
      {/* GRÁFICO 2: RENTABILIDADE NÃO REALIZADA ➔ BARRAS EM PÉ (VERTICAIS)       */}
      {/* ======================================================================= */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between select-none">
        <div>
          {/* Cabeçalho */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Rentabilidade Não Realizada por Ativo (%)</span>
            </h3>
            {/* Legenda visual de cor */}
            <div className="flex items-center gap-3 text-[11px] font-medium">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-xs bg-[#10b981]" />
                <span>Lucro (+)</span>
              </span>
              <span className="flex items-center gap-1 text-red-500">
                <span className="w-2 h-2 rounded-xs bg-[#ef4444]" />
                <span>Prejuízo (-)</span>
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Desempenho de cada ativo em relação ao preço médio de compra
          </p>

          {/* Banner de Ativo Selecionado */}
          {selectedReturnIndex !== null && returnData[selectedReturnIndex] && (
            <div className="mb-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs animate-in fade-in">
              <div>
                <strong className="text-slate-900 dark:text-white">
                  {returnData[selectedReturnIndex].ticker} — {returnData[selectedReturnIndex].nome}
                </strong>
                <span className="text-slate-500 ml-2">
                  Rentabilidade:{' '}
                  <strong
                    className={`font-mono ${
                      returnData[selectedReturnIndex].isPositive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-500'
                    }`}
                  >
                    {formatPercent(returnData[selectedReturnIndex].rentabilidadePct, true)}
                  </strong>{' '}
                  • Lucro Papel:{' '}
                  <strong className="font-mono">
                    {formatBRL(returnData[selectedReturnIndex].lucroValor)}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReturnIndex(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Fechar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Gráfico de Barras em Pé com Eixo Zero central e Rolagem se houver muitos ativos */}
          <div className="w-full overflow-x-auto overflow-y-hidden pb-1 touch-pan-x">
            <div
              style={{
                minWidth: `${Math.max(100, returnData.length * 48)}px`,
                height: '224px',
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={returnData}
                  margin={{ top: 20, right: 15, left: -10, bottom: 5 }}
                  onClick={e => {
                    if (e && e.activeTooltipIndex !== undefined && e.activeTooltipIndex !== null) {
                      const idx = Number(e.activeTooltipIndex);
                      setSelectedReturnIndex(prev => (prev === idx ? null : idx));
                    } else {
                      setSelectedReturnIndex(null);
                    }
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(148, 163, 184, 0.15)"
                  />
                  <XAxis
                    dataKey="ticker"
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={val => `${val}%`}
                  />
                  {/* Linha Zero de Referência */}
                  <ReferenceLine
                    y={0}
                    stroke="rgba(148, 163, 184, 0.45)"
                    strokeWidth={1.5}
                  />
                  <Tooltip
                    isAnimationActive={false}
                    wrapperStyle={{ pointerEvents: 'none', outline: 'none', zIndex: 40 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-xl shadow-lg border border-slate-700/60 text-xs space-y-1 pointer-events-none select-none">
                            <p className="font-bold">{data.ticker}</p>
                            <p
                              className={`font-mono font-bold ${
                                data.isPositive ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              Rentabilidade: {formatPercent(data.rentabilidadePct, true)}
                            </p>
                            <p className="text-slate-300 font-mono">
                              Ganho/Perda:{' '}
                              {data.lucroValor >= 0 ? '+' : ''}
                              {formatBRL(data.lucroValor)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Barras em Pé: Verdes para cima / Vermelhas para baixo */}
                  <Bar
                    dataKey="rentabilidadePct"
                    maxBarSize={32}
                    radius={4}
                    cursor="pointer"
                  >
                    {returnData.map((entry, index) => {
                      const isSelected = selectedReturnIndex === index;
                      const isPos = entry.rentabilidadePct >= 0;
                      return (
                        <Cell
                          key={`col-return-${index}`}
                          fill={isPos ? '#10b981' : '#ef4444'}
                          opacity={selectedReturnIndex === null || isSelected ? 1 : 0.35}
                          stroke="none"
                          strokeWidth={0}
                          style={{ outline: 'none' }}
                          onClick={(ev) => {
                            ev?.stopPropagation?.();
                            setSelectedReturnIndex(prev => (prev === index ? null : index));
                          }}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
