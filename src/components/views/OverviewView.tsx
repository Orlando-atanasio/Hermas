/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Coins,
  ArrowRight,
  Clock,
  Layers,
  FileText,
  Target,
  Scale,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { PortfolioSummary } from '../../engine/portfolio';
import { Asset, Operation, DocumentRecord, Goal, Dividend, SystemSettings } from '../../types';
import { formatBRL, formatPercent, isPositive, isNegative, D } from '../../engine/decimal';
import { PortfolioCharts } from '../charts/PortfolioCharts';
import { NavTab } from '../layout/Navigation';

interface OverviewViewProps {
  portfolio: PortfolioSummary;
  assets: Asset[];
  operations: Operation[];
  documents: DocumentRecord[];
  goals: Goal[];
  dividends: Dividend[];
  settings: SystemSettings;
  onNavigate: (tab: NavTab) => void;
  onSelectAsset?: (ticker: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  portfolio,
  assets,
  operations,
  documents,
  goals,
  dividends,
  settings,
  onNavigate,
  onSelectAsset,
}) => {
  const isLucroPositivo = isPositive(portfolio.lucroTotalNaoRealizado);
  const isLucroNegativo = isNegative(portfolio.lucroTotalNaoRealizado);

  // Cálculos de Decomposição do Patrimônio (Aportes vs Rentabilidade vs Proventos)
  const patrimonioTotalD = D(portfolio.patrimonioTotal);
  const custoTotalD = D(portfolio.custoTotalAquisicao);
  const lucroNaoRealizadoD = D(portfolio.lucroTotalNaoRealizado);
  const proventosTotalD = D(portfolio.totalProventosRecebidos);
  const totalReturnD = D(portfolio.totalReturnGeral);

  // Percentual de origem sobre o patrimônio atual
  const pctAportado = patrimonioTotalD.gt(0)
    ? custoTotalD.mul(100).div(patrimonioTotalD)
    : D(0);
  const pctLucroMercado = patrimonioTotalD.gt(0)
    ? lucroNaoRealizadoD.mul(100).div(patrimonioTotalD)
    : D(0);

  // Percentual de Renda sobre o capital aportado (Yield on Cost da carteira)
  const yocCarteiraPct = custoTotalD.gt(0)
    ? proventosTotalD.mul(100).div(custoTotalD)
    : D(0);

  // Últimas 5 operações confirmadas
  const recentOps = [...operations]
    .sort((a, b) => b.dataPregao.localeCompare(a.dataPregao))
    .slice(0, 5);

  const pendingDocsCount = documents.filter(d => d.status === 'REVISAO_PENDENTE').length;

  return (
    <div className="space-y-6">
      {/* Banner de Boas-Vindas & Status Determinístico */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden shadow-xl border border-blue-800/40">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-mono mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              <span>Cofre Ativo • 100% Determinístico & Local</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Visão Geral do Patrimônio
            </h1>
            <p className="text-blue-200/80 text-xs sm:text-sm mt-1 max-w-xl">
              Consolidação contábil dos seus ativos em custódia, apuração fiscal sem telemetria e rentabilidade líquida real.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('carteira')}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ver Carteira Completa</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('documentos')}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Importar Nota</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Métricas Principais (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Patrimônio Total */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Patrimônio Total
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
              {formatBRL(portfolio.patrimonioTotal)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span>{portfolio.posicoesCustodia.length} ativos em custódia</span>
            </div>
          </div>
        </div>

        {/* Capital Investido */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Capital Investido
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
              {formatBRL(portfolio.custoTotalAquisicao)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Custo médio de aquisição histórico
            </div>
          </div>
        </div>

        {/* Retorno Não Realizado */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Lucro / Prejuízo Papel
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isLucroPositivo
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                : isLucroNegativo
                ? 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
            }`}>
              {isLucroPositivo ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-extrabold font-mono ${
              isLucroPositivo
                ? 'text-emerald-600 dark:text-emerald-400'
                : isLucroNegativo
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-900 dark:text-white'
            }`}>
              {formatBRL(portfolio.lucroTotalNaoRealizado)}
            </div>
            <div className="text-xs font-mono font-semibold mt-1">
              <span className={isLucroPositivo ? 'text-emerald-600 dark:text-emerald-400' : isLucroNegativo ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}>
                {formatPercent(portfolio.rentabilidadeTotalPct)}
              </span>
              <span className="text-slate-400 font-normal ml-1">sobre o capital</span>
            </div>
          </div>
        </div>

        {/* Proventos Recebidos */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Proventos Recebidos
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
              {formatBRL(portfolio.totalProventosRecebidos)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Dividendos, JCP e FIIs acumulados
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO EXECUTIVO: DECOMPOSIÇÃO E ORIGEM DO CRESCIMENTO PATRIMONIAL */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Decomposição & Origem do Crescimento Patrimonial
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Separação analítica do capital que veio do <strong>seu próprio bolso (aportes)</strong> daquele gerado pelo <strong>mercado (valorização + dividendos)</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
              Retorno Global: {formatBRL(portfolio.totalReturnGeral)}
            </span>
          </div>
        </div>

        {/* Barra Proporcional de Origem do Patrimônio */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
              <span>Capital Próprio Aportado ({formatPercent(pctAportado, false)})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full inline-block ${isLucroPositivo ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span>Valorização Não Realizada ({formatPercent(pctLucroMercado, true)})</span>
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            <div 
              style={{ width: `${Math.min(100, Math.max(0, pctAportado.toNumber()))}%` }}
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
              title={`Capital Próprio: ${formatPercent(pctAportado, false)}`}
            />
            {isLucroPositivo && (
              <div 
                style={{ width: `${Math.min(100 - pctAportado.toNumber(), Math.max(0, pctLucroMercado.toNumber()))}%` }}
                className="h-full bg-emerald-500 transition-all duration-500"
                title={`Valorização de Mercado: ${formatPercent(pctLucroMercado, false)}`}
              />
            )}
          </div>
        </div>

        {/* Grade da Equação Patrimonial Determinística */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/50">
            <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold block">1. Capital Aportado</span>
            <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
              {formatBRL(portfolio.custoTotalAquisicao)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Custo histórico de compras
            </span>
          </div>

          <div className={`p-3.5 rounded-2xl border ${
            isLucroPositivo 
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/50' 
              : 'bg-red-50/50 dark:bg-red-950/20 border-red-200/70 dark:border-red-900/50'
          }`}>
            <span className={`text-[11px] font-semibold block ${isLucroPositivo ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
              2. Lucro Papel (+/-)
            </span>
            <span className={`text-base font-bold font-mono ${isLucroPositivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatBRL(portfolio.lucroTotalNaoRealizado)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Ganho não realizado
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50">
            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold block">3. Proventos Líquidos</span>
            <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
              {formatBRL(portfolio.totalProventosRecebidos)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              YoC da Carteira: {formatPercent(yocCarteiraPct, false)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold block">= Patrimônio Líquido</span>
            <span className="text-base font-bold font-mono text-blue-600 dark:text-blue-400">
              {formatBRL(portfolio.patrimonioTotal)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Posição líquida auditada
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos de Portfólio */}
      <PortfolioCharts
        portfolio={portfolio}
        operations={operations}
        dividends={dividends}
      />

      {/* Seção Dupla: Top Posições & Operações Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Posições em Custódia */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Principais Posições em Custódia</span>
              </h3>
              <button
                onClick={() => onNavigate('carteira')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {portfolio.posicoesCustodia.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Nenhum ativo em custódia no momento.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {portfolio.posicoesCustodia.slice(0, 5).map(pos => {
                  const isPos = isPositive(pos.lucroNaoRealizado);
                  return (
                    <div 
                      key={pos.ticker} 
                      onClick={() => onSelectAsset?.(pos.ticker)}
                      className="py-3 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors cursor-pointer group"
                      title="Clique para abrir o Dossiê 360° deste ativo"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-xs flex items-center justify-center text-slate-700 dark:text-slate-300 font-mono group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {pos.ticker.slice(0, 4)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                            <span>{pos.ticker}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-600 dark:text-blue-400 transition-opacity" />
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                            {pos.asset.nome}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {formatBRL(pos.valorAtual)}
                        </div>
                        <div className="text-[11px] font-mono">
                          <span className={isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                            {formatPercent(pos.rentabilidadeNaoRealizadaPct)}
                          </span>
                          <span className="text-slate-400 ml-1.5">
                            ({pos.percentualCarteira}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Últimas Operações Registradas */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Últimas Operações Registradas</span>
              </h3>
              <button
                onClick={() => onNavigate('operacoes')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span>Ver extrato</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentOps.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Nenhuma operação registrada ainda.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentOps.map(op => {
                  const isCompra = op.tipo === 'COMPRA' || op.tipo === 'OPENING_POSITION';
                  return (
                    <div key={op.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isCompra
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {op.tipo === 'OPENING_POSITION' ? 'INÍCIO' : op.tipo}
                        </span>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">
                            {op.ticker}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {op.dataPregao} • {op.quantidade} un. @ {formatBRL(op.precoUnitario)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {formatBRL(op.valorTotalOperacao)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {op.status}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
