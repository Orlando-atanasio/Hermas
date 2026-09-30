/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import { CustodyPosition } from '../../types';
import { formatBRL, formatPercent, isPositive } from '../../engine/decimal';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface CustodyBreakdownChartsProps {
  positions: CustodyPosition[];
}

const COLORS = [
  '#2563eb', // Blue
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

export const CustodyBreakdownCharts: React.FC<CustodyBreakdownChartsProps> = ({ positions }) => {
  const [selectedWeightIndex, setSelectedWeightIndex] = useState<number | null>(null);
  const [selectedReturnIndex, setSelectedReturnIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha seleções ao tocar fora
  useEffect(() => {
    const handleTouchOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelectedWeightIndex(null);
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

  // Gráfico 1: Peso dos ativos (Barra horizontal) ordenado do maior valor para o menor
  const weightData = positions.map((p, idx) => ({
    ticker: p.ticker,
    nome: p.asset.nome,
    tipo: p.asset.tipo,
    valor: parseFloat(p.valorAtual),
    peso: parseFloat(p.percentualCarteira),
    color: COLORS[idx % COLORS.length],
  })).sort((a, b) => b.valor - a.valor);

  // Gráfico 2: Rentabilidade Não Realizada (%) por Ativo
  const returnData = positions.map(p => ({
    ticker: p.ticker,
    rentabilidadePct: Math.round(parseFloat(p.rentabilidadeNaoRealizadaPct) * 100) / 100,
    lucroValor: parseFloat(p.lucroNaoRealizado),
    isPositive: isPositive(p.lucroNaoRealizado),
  })).sort((a, b) => b.rentabilidadePct - a.rentabilidadePct);

  if (positions.length === 0) return null;

  // Cálculo da altura dinâmica proporcional à quantidade de ativos:
  // Garante ~40px de altura dedicada para cada ativo, mantendo barras e rótulos
  // sempre proporcionais e confortáveis para leitura, sem espremer a visualização.
  const ITEM_HEIGHT = 40;
  const MIN_CHART_HEIGHT = 224; // Altura padrão inicial para 1 a 4 ativos
  const totalChartHeight = Math.max(MIN_CHART_HEIGHT, positions.length * ITEM_HEIGHT + 45);
  const isLongList = positions.length > 8;
  const containerHeight = isExpanded ? totalChartHeight : (isLongList ? 460 : totalChartHeight);

  return (
    <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none chart-card-container">
      {/* Gráfico 1: Alocação Percentual em Custódia */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between select-none">
        <div>
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>Repartição de Custódia (Peso em %)</span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-semibold">
                {positions.length} {positions.length === 1 ? 'ativo' : 'ativos'}
              </span>
              {isLongList && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 transition-colors"
                  title={isExpanded ? "Recolher para área rolável" : "Expandir todos os ativos"}
                >
                  {isExpanded ? (
                    <>
                      <Minimize2 className="w-3 h-3" />
                      <span>Recolher</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3 h-3" />
                      <span>Expandir</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Participação de cada ativo no patrimônio líquido total
          </p>

          {/* Banner de Ativo Selecionado */}
          {selectedWeightIndex !== null && weightData[selectedWeightIndex] && (
            <div className="mb-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs animate-in fade-in">
              <div>
                <strong className="text-blue-900 dark:text-blue-300">
                  {weightData[selectedWeightIndex].ticker} ({weightData[selectedWeightIndex].tipo})
                </strong>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Valor: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{formatBRL(weightData[selectedWeightIndex].valor)}</span> • Peso: <span className="font-mono font-bold">{formatPercent(weightData[selectedWeightIndex].peso)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWeightIndex(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Fechar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Container com Altura Dinâmica e Rolagem Suave quando lista for longa */}
          <div 
            className={`w-full touch-pan-y ${isLongList && !isExpanded ? 'overflow-y-auto max-h-[460px] pr-1.5' : ''}`}
            style={{ height: `${containerHeight}px` }}
          >
            <div style={{ height: `${totalChartHeight}px`, minHeight: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weightData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  onClick={(e) => {
                    if (e && e.activeTooltipIndex !== undefined) {
                      const idx = Number(e.activeTooltipIndex);
                      setSelectedWeightIndex(prev => (prev === idx ? null : idx));
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={val => `${val}%`}
                    domain={[0, 'dataMax + 5']}
                  />
                  <YAxis
                    type="category"
                    dataKey="ticker"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }}
                    width={56}
                  />
                  <Tooltip
                    isAnimationActive={false}
                    wrapperStyle={{ pointerEvents: 'none', outline: 'none', zIndex: 40 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-xl shadow-lg border border-slate-700/60 text-xs space-y-1 pointer-events-none select-none">
                            <p className="font-bold">{data.ticker} ({data.tipo})</p>
                            <p className="text-slate-300 font-mono">Valor Atual: {formatBRL(data.valor)}</p>
                            <p className="text-blue-400 font-mono font-bold">Participação: {formatPercent(data.peso)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="peso" radius={[0, 6, 6, 0]} maxBarSize={20} cursor="pointer">
                    {weightData.map((entry, index) => {
                      const isSelected = selectedWeightIndex === index;
                      return (
                        <Cell
                          key={`cell-weight-${index}`}
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
          </div>
        </div>
      </div>

      {/* Gráfico 2: Desempenho / Rentabilidade % de Cada Ativo */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between select-none">
        <div>
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Rentabilidade Não Realizada por Ativo (%)</span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-semibold">
                Preço Médio vs Mercado
              </span>
              {isLongList && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 transition-colors"
                  title={isExpanded ? "Recolher para área rolável" : "Expandir todos os ativos"}
                >
                  {isExpanded ? (
                    <>
                      <Minimize2 className="w-3 h-3" />
                      <span>Recolher</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3 h-3" />
                      <span>Expandir</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Desempenho percentual de valorização de cada ativo em custódia
          </p>

          {/* Banner de Rentabilidade Selecionada */}
          {selectedReturnIndex !== null && returnData[selectedReturnIndex] && (
            <div className="mb-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs animate-in fade-in">
              <div>
                <strong className="text-slate-900 dark:text-white">
                  {returnData[selectedReturnIndex].ticker}
                </strong>:
                <span className={`ml-1.5 font-mono font-bold ${returnData[selectedReturnIndex].isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {formatPercent(returnData[selectedReturnIndex].rentabilidadePct, true)}
                </span>
                <span className="text-slate-400 ml-2 font-mono text-[11px]">
                  ({formatBRL(returnData[selectedReturnIndex].lucroValor)})
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

          {/* Container com Altura Dinâmica Harmonizada */}
          <div 
            className={`w-full touch-pan-y ${isLongList && !isExpanded ? 'overflow-y-auto max-h-[460px] pr-1.5' : ''}`}
            style={{ height: `${containerHeight}px` }}
          >
            <div style={{ height: `${totalChartHeight}px`, minHeight: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={returnData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  onClick={(e) => {
                    if (e && e.activeTooltipIndex !== undefined) {
                      const idx = Number(e.activeTooltipIndex);
                      setSelectedReturnIndex(prev => (prev === idx ? null : idx));
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={val => `${val}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="ticker"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }}
                    width={56}
                  />
                  <ReferenceLine x={0} stroke="rgba(148, 163, 184, 0.4)" strokeDasharray="3 3" />
                  <Tooltip
                    isAnimationActive={false}
                    wrapperStyle={{ pointerEvents: 'none', outline: 'none', zIndex: 40 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-xl shadow-lg border border-slate-700/60 text-xs space-y-1 pointer-events-none select-none">
                            <p className="font-bold">{data.ticker}</p>
                            <p className={`font-mono font-bold ${data.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                              Rentabilidade: {formatPercent(data.rentabilidadePct, true)}
                            </p>
                            <p className="text-slate-300 font-mono">
                              Lucro Não Realizado: {formatBRL(data.lucroValor)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="rentabilidadePct" radius={4} maxBarSize={20} cursor="pointer">
                    {returnData.map((entry, index) => {
                      const isSelected = selectedReturnIndex === index;
                      return (
                        <Cell
                          key={`cell-return-${index}`}
                          fill={entry.rentabilidadePct >= 0 ? '#10b981' : '#ef4444'}
                          stroke={isSelected ? '#ffffff' : 'transparent'}
                          strokeWidth={isSelected ? 2 : 0}
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
