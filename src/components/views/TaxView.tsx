/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Scale,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingDown,
  Info,
  Clock,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Asset, Operation, Dividend, SystemSettings } from '../../types';
import { PortfolioSummary } from '../../engine/portfolio';
import {
  calculateMonthlyTaxes,
  calculateRealizedSales,
  getDarfDueDate,
  formatCompetenciaBr,
  TAX_RULES,
  LEGAL_DISCLAIMERS,
  RealizedSaleTrade,
} from '../../engine/tax';
import { formatBRL, formatPercent, D } from '../../engine/decimal';
import { NavTab } from '../layout/Navigation';

interface TaxViewProps {
  assets: Asset[];
  operations: Operation[];
  portfolio: PortfolioSummary;
  dividends: Dividend[];
  settings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => void;
  onNavigate: (tab: NavTab) => void;
}

export const TaxView: React.FC<TaxViewProps> = ({
  assets,
  operations,
  portfolio,
  dividends,
  settings,
  onUpdateSettings,
  onNavigate,
}) => {
  const [viewTab, setViewTab] = useState<'APURACAO' | 'VENDAS' | 'REGRAS'>('APURACAO');

  const monthlyTaxes = useMemo(() => {
    return calculateMonthlyTaxes(assets, operations, {
      acoes: settings.prejuizoAcumuladoAcoesSwingAnterior,
      daytrade: settings.prejuizoAcumuladoDayTradeAnterior,
      fii: settings.prejuizoAcumuladoFiiAnterior,
    });
  }, [assets, operations, settings]);

  const realizedSales = useMemo(() => {
    return calculateRealizedSales(assets, operations);
  }, [assets, operations]);

  const toggleDarfPaid = (mesAno: string) => {
    const darfs = { ...(settings.darfsPagas || {}) };
    darfs[mesAno] = !darfs[mesAno];
    onUpdateSettings({ ...settings, darfsPagas: darfs });
  };

  const totalDarfPendente = useMemo(() => {
    return monthlyTaxes.reduce((acc, t) => {
      const isPaid = settings.darfsPagas?.[t.mesAno];
      const val = D(t.impostoAPagarAposDedoDuro);
      if (val.gte(10) && !isPaid) {
        return acc.add(val);
      }
      return acc;
    }, D(0));
  }, [monthlyTaxes, settings.darfsPagas]);

  return (
    <div className="space-y-6">
      {/* Top Banner Tributário */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 text-xs font-mono mb-2">
              <Scale className="w-3.5 h-3.5 text-amber-500" />
              <span>Conformidade Fiscal & IN RFB 1.585/2015</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Apuração de Impostos & DARFs</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Cálculo de ganho líquido mensal, separação de prejuízos acumulados (ações, FIIs e Day Trade) e controle de DARFs pagas.
            </p>
          </div>

          <div className="text-right bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl">
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Pendente em DARF</span>
            <div className="text-2xl font-mono font-bold text-amber-500 dark:text-amber-400 mt-0.5">
              {formatBRL(totalDarfPendente)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de Seleção */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setViewTab('APURACAO')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewTab === 'APURACAO'
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Apuração Mensal (DARF)
        </button>
        <button
          onClick={() => setViewTab('VENDAS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewTab === 'VENDAS'
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Diário de Vendas & Ganho de Capital ({realizedSales.length})
        </button>
        <button
          onClick={() => setViewTab('REGRAS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewTab === 'REGRAS'
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Regras Tributárias B3
        </button>
      </div>

      {/* Tab: Apuração Mensal */}
      {viewTab === 'APURACAO' && (
        <div className="space-y-4">
          {monthlyTaxes.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              Nenhuma alienação ou mês com movimentação apurada até o momento.
            </div>
          ) : (
            <div className="space-y-4">
              {monthlyTaxes.map(tax => {
                const isPaid = Boolean(settings.darfsPagas?.[tax.mesAno]);
                const darfVal = D(tax.impostoAPagarAposDedoDuro);
                const hasDarf = darfVal.gte(10);

                return (
                  <div
                    key={tax.mesAno}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                          {formatCompetenciaBr(tax.mesAno)}
                        </span>
                        <span className="font-mono text-xs text-slate-400">({tax.mesAno})</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          tax.statusMensal === 'LUCRO_TRIBUTAVEL'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : tax.statusMensal === 'ISENTO'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {tax.statusMensal}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                        <span>Vendas Ações Swing: {formatBRL(tax.totalVendasAcoesSwing)}</span>
                        <span>Lucro Ações: {formatBRL(tax.lucroLiquidoAcoesSwing)}</span>
                        <span>Vendas FII: {formatBRL(tax.totalVendasFII)}</span>
                        <span>Lucro FII: {formatBRL(tax.lucroLiquidoFII)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">DARF a Pagar</div>
                        <div className="font-mono text-base font-bold text-slate-900 dark:text-white">
                          {formatBRL(tax.impostoAPagarAposDedoDuro)}
                        </div>
                        {hasDarf && (
                          <div className="text-[11px] text-slate-400">
                            Venc: {getDarfDueDate(tax.mesAno)}
                          </div>
                        )}
                      </div>

                      {hasDarf && (
                        <button
                          onClick={() => toggleDarfPaid(tax.mesAno)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isPaid
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isPaid ? 'Pago' : 'Marcar Pago'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Diário de Vendas */}
      {viewTab === 'VENDAS' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Vendas e Ganhos Realizados (Reconstituição Contábil)
          </h3>

          {realizedSales.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              Nenhuma operação de venda realizada até o momento.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3 text-right">Qtd</th>
                    <th className="py-2.5 px-3 text-right">Preço Venda</th>
                    <th className="py-2.5 px-3 text-right">Custo Médio</th>
                    <th className="py-2.5 px-3 text-right">Lucro Líquido</th>
                    <th className="py-2.5 px-3 text-right">Retorno %</th>
                    <th className="py-2.5 px-3">Regime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {realizedSales.map(sale => {
                    const isLucro = D(sale.lucroLiquido).gt(0);
                    return (
                      <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-slate-500">{sale.dataPregao}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white font-sans">{sale.ticker}</td>
                        <td className="py-2.5 px-3 text-right">{sale.quantidade}</td>
                        <td className="py-2.5 px-3 text-right">{formatBRL(sale.precoVenda)}</td>
                        <td className="py-2.5 px-3 text-right">{formatBRL(sale.custoMedioUnitario)}</td>
                        <td className={`py-2.5 px-3 text-right font-bold ${isLucro ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatBRL(sale.lucroLiquido)}
                        </td>
                        <td className="py-2.5 px-3 text-right">{formatPercent(sale.rentabilidadePct)}</td>
                        <td className="py-2.5 px-3 text-[11px] font-sans text-slate-400">{sale.regimeTributario}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Regras & Disclaimers */}
      {viewTab === 'REGRAS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(TAX_RULES).map(rule => (
              <div key={rule.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{rule.nome}</h4>
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    {rule.aliquota}
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div><strong>Isenção:</strong> {rule.isencaoMensal}</div>
                  <div><strong>IRRF (Dedo-duro):</strong> {rule.irrfFonte}</div>
                  <div className="text-[11px] text-slate-400 font-mono"><strong>Base:</strong> {rule.baseLegal}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-500">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-500" />
              <span>Avisos e Normas Legais</span>
            </h4>
            <ul className="list-disc pl-5 space-y-1">
              {LEGAL_DISCLAIMERS.map((disc, idx) => (
                <li key={idx}>{disc}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
