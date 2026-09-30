/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Operation } from '../../types';
import { formatBRL, formatPercent } from '../../engine/decimal';
import { X } from 'lucide-react';

interface OperationsChartsProps {
  operations: Operation[];
}

const TYPE_COLORS: Record<string, string> = {
  COMPRA: '#2563eb', // Blue
  VENDA: '#10b981', // Emerald
  OPENING_POSITION: '#8b5cf6', // Violet
  DESDOBRAMENTO: '#f59e0b', // Amber
  GRUPAMENTO: '#f97316', // Orange
  BONIFICACAO: '#14b8a6', // Teal
  AMORTIZACAO: '#6366f1', // Indigo
};

export const OperationsCharts: React.FC<OperationsChartsProps> = ({ operations }) => {
  const [selectedFlowMonth, setSelectedFlowMonth] = useState<any | null>(null);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleTouchOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelectedFlowMonth(null);
        setSelectedTypeIndex(null);
      }
    };

    document.addEventListener('touchstart', handleTouchOutside, { passive: true });
    document.addEventListener('mousedown', handleTouchOutside);
    return () => {
      document.removeEventListener('touchstart', handleTouchOutside);
      document.removeEventListener('mousedown', handleTouchOutside);
    };
  }, []);

  // 1. Dados de Fluxo Mensal (Compras R$ vs Vendas R$)
  const monthlyFlow = React.useMemo(() => {
    const map = new Map<string, { compras: number; vendas: number; count: number }>();

    operations
      .filter(op => op.status === 'CONFIRMADA' || op.status === 'ARREDONDADA')
      .forEach(op => {
        const month = op.dataPregao.slice(0, 7); // YYYY-MM
        if (!map.has(month)) {
          map.set(month, { compras: 0, vendas: 0, count: 0 });
        }
        const bucket = map.get(month)!;
        const total = parseFloat(op.valorTotalOperacao);

        if (op.tipo === 'COMPRA' || op.tipo === 'OPENING_POSITION') {
          bucket.compras += total;
        } else if (op.tipo === 'VENDA') {
          bucket.vendas += total;
        }
        bucket.count++;
      });

    const sortedMonths = Array.from(map.keys()).sort();
    return sortedMonths.map(m => {
      const [year, monthNum] = m.split('-');
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const label = `${monthNames[parseInt(monthNum, 10) - 1]}/${year.slice(2)}`;
      const data = map.get(m)!;

      return {
        mes: label,
        mesRaw: m,
        compras: Math.round(data.compras * 100) / 100,
        vendas: Math.round(data.vendas * 100) / 100,
        operacoes: data.count,
      };
    });
  }, [operations]);

  // 2. Repartição por Tipo de Operação (Contagem e Volume R$)
  const operationsByType = React.useMemo(() => {
    const map = new Map<string, { count: number; volume: number }>();
    let totalVol = 0;

    operations.forEach(op => {
      if (!map.has(op.tipo)) {
        map.set(op.tipo, { count: 0, volume: 0 });
      }
      const data = map.get(op.tipo)!;
      data.count++;
      const v = parseFloat(op.valorTotalOperacao);
      data.volume += v;
      totalVol += v;
    });

    return Array.from(map.entries()).map(([tipo, info]) => ({
      name: tipo,
      count: info.count,
      volume: Math.round(info.volume * 100) / 100,
      percentual: totalVol > 0 ? (info.volume / totalVol) * 100 : 0,
      color: TYPE_COLORS[tipo] || '#64748b',
    })).sort((a, b) => b.volume - a.volume);
  }, [operations]);

  if (operations.length === 0) {
    return null;
  }

  const selectedType = selectedTypeIndex !== null ? operationsByType[selectedTypeIndex] : null;

  return (
    <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none chart-card-container">
      {/* Gráfico 1: Fluxo de Volume Mensal (Compras vs Vendas) */}
      <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between select-none">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>Fluxo Financeiro de Operações (Aportes vs Desinvestimentos)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Volume financeiro negociado mês a mês
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-600"></span>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Compras (Aportes)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Vendas (Liquidações)</span>
              </div>
            </div>
          </div>

          {/* Banner de Mês Selecionado */}
          {selectedFlowMonth && (
            <div className="mb-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-bold text-blue-900 dark:text-blue-300">
                  {selectedFlowMonth.mes} ({selectedFlowMonth.operacoes} ordens):
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  Compras: <strong className="font-mono text-blue-600 dark:text-blue-400">{formatBRL(selectedFlowMonth.compras)}</strong>
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  Vendas: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatBRL(selectedFlowMonth.vendas)}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFlowMonth(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Fechar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="h-60 w-full pt-1 touch-pan-y">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyFlow}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    const payload = e.activePayload[0].payload;
                    if (selectedFlowMonth?.mesRaw === payload.mesRaw) {
                      setSelectedFlowMonth(null);
                    } else {
                      setSelectedFlowMonth(payload);
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
                            Competência: {data.mes} ({data.operacoes} ordens)
                          </p>
                          <div className="flex justify-between gap-4">
                            <span className="text-blue-400">Total Comprado:</span>
                            <span className="font-mono font-bold">{formatBRL(data.compras)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-emerald-400">Total Vendido:</span>
                            <span className="font-mono font-bold">{formatBRL(data.vendas)}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="compras" fill="#2563eb" radius={[4, 4, 0, 0]} cursor="pointer" />
                <Bar dataKey="vendas" fill="#10b981" radius={[4, 4, 0, 0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Cadência de Aportes</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Total de {operations.length} ordens registradas no livro razão
          </span>
        </div>
      </div>

      {/* Gráfico 2: Donut de Distribuição por Tipo de Operação */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between select-none">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-600"></span>
              <span>Composição por Tipo</span>
            </h3>
            <span className="text-xs text-slate-400">Volume (R$)</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Toque na fatia para destacar o tipo de ordem
          </p>

          <div className="h-44 w-full relative touch-pan-y">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={operationsByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="volume"
                  isAnimationActive={true}
                  animationDuration={300}
                  onClick={(_, index) => {
                    setSelectedTypeIndex(prev => (prev === index ? null : index));
                  }}
                  cursor="pointer"
                >
                  {operationsByType.map((entry, index) => {
                    const isSelected = selectedTypeIndex === index;
                    return (
                      <Cell
                        key={`cell-type-${index}`}
                        fill={entry.color}
                        stroke={isSelected ? '#ffffff' : 'transparent'}
                        strokeWidth={isSelected ? 3 : 0}
                        style={{
                          transform: isSelected ? 'scale(1.06)' : 'scale(1)',
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
                          <p className="text-slate-300 font-mono">{formatBRL(data.volume)}</p>
                          <p className="text-slate-400 text-[10px]">{data.count} operações ({formatPercent(data.percentual)})</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centro do Donut */}
            <div
              onClick={() => setSelectedTypeIndex(null)}
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto cursor-pointer"
              title={selectedType ? "Toque para voltar" : undefined}
            >
              {selectedType ? (
                <>
                  <span className="text-[10px] text-violet-600 dark:text-violet-400 font-bold uppercase tracking-wider truncate max-w-[80px]">
                    {selectedType.name}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white font-mono-numbers">
                    {formatPercent(selectedType.percentual)}
                  </span>
                  <span className="text-[9px] text-slate-400">toque p/ limpar</span>
                </>
              ) : (
                <>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Ordens</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white font-mono-numbers">
                    {operations.length}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Legenda com botões de toque */}
          <div className="mt-3 space-y-1 max-h-32 overflow-y-auto pr-1">
            {operationsByType.map((item, idx) => {
              const isSelected = selectedTypeIndex === idx;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setSelectedTypeIndex(prev => (prev === idx ? null : idx))}
                  className={`w-full flex items-center justify-between text-[11px] p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-violet-50 dark:bg-violet-950/60 ring-1 ring-violet-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-500 shrink-0 ml-2">
                    {formatBRL(item.volume)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
