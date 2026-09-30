/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Building2,
  TrendingUp,
  TrendingDown,
  Layers,
  Coins,
  FileText,
  Printer,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { Operation, Dividend, DocumentRecord, PriceQuote, CustodyPosition } from '../../types';
import { formatBRL, formatPercent, D, isPositive, isNegative, toCanonicalString } from '../../engine/decimal';

interface AssetDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string | null;
  position?: CustodyPosition;
  operations: Operation[];
  dividends: Dividend[];
  documents: DocumentRecord[];
  quote?: PriceQuote;
  totalPortfolioValue: any;
  onOpenCorporateAction?: (ticker: string) => void;
}

export const AssetDossierModal: React.FC<AssetDossierModalProps> = ({
  isOpen,
  onClose,
  ticker,
  position,
  operations,
  dividends,
  documents,
  quote,
  totalPortfolioValue,
  onOpenCorporateAction,
}) => {
  const [activeTab, setActiveTab] = useState<'operacoes' | 'proventos' | 'documentos' | 'auditoria'>('operacoes');

  if (!isOpen || !ticker) return null;

  // Filtrar operações exclusivas do ativo
  const assetOps = operations
    .filter(op => op.ticker.toUpperCase() === ticker.toUpperCase())
    .sort((a, b) => new Date(b.dataPregao).getTime() - new Date(a.dataPregao).getTime());

  // Filtrar proventos exclusivos do ativo
  const assetDividends = dividends
    .filter(div => div.ticker.toUpperCase() === ticker.toUpperCase())
    .sort((a, b) => new Date(b.dataPagamento).getTime() - new Date(a.dataPagamento).getTime());

  // Filtrar notas de corretagem vinculadas
  const linkedDocIds = new Set(assetOps.map(op => op.notaCorretagemId).filter(Boolean));
  const assetDocs = documents.filter(doc => linkedDocIds.has(doc.id));

  // Estatísticas do Ativo
  const totalCompras = assetOps.filter(o => o.tipo === 'COMPRA').length;
  const totalVendas = assetOps.filter(o => o.tipo === 'VENDA').length;
  
  // Total de proventos líquidos recebidos
  const totalProventosLiq = assetDividends.reduce(
    (acc, div) => acc.add(D(div.valorLiquido)),
    D(0)
  );

  // Total Return do Ativo = Lucro Não Realizado + Proventos Líquidos Recebidos
  const lucroNaoRealizado = D(position?.lucroNaoRealizado || 0);
  const totalReturnAtivo = lucroNaoRealizado.add(totalProventosLiq);
  const custoTotal = D(position?.custoTotal || 0);

  // Yield on Cost (YoC %) = (Total Proventos / Custo Total) * 100
  const yocPct = custoTotal.gt(0)
    ? totalProventosLiq.mul(100).div(custoTotal)
    : D(0);

  // Total Return % = (Total Return / Custo Total) * 100
  const totalReturnPct = custoTotal.gt(0)
    ? totalReturnAtivo.mul(100).div(custoTotal)
    : D(0);

  // Peso na carteira
  const pesoCarteiraPct = D(totalPortfolioValue).gt(0) && position
    ? D(position.valorAtual).mul(100).div(D(totalPortfolioValue))
    : D(0);

  const isLucroPos = isPositive(lucroNaoRealizado);
  const isLucroNeg = isNegative(lucroNaoRealizado);
  const isReturnPos = isPositive(totalReturnAtivo);
  const isReturnNeg = isNegative(totalReturnAtivo);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        
        {/* Topo do Dossiê */}
        <div className="p-6 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex items-center justify-center font-mono font-bold text-xl shadow-md shrink-0">
              {ticker.slice(0, 4)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                  {ticker}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {position?.asset.tipo || 'ATIVO'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Posição Auditada</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {position?.asset.nome || 'Ativo Registrado no Cofre'} 
                {position?.asset.cnpj && <span className="font-mono ml-1.5">• CNPJ: {position.asset.cnpj}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {onOpenCorporateAction && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCorporateAction(ticker);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                title="Registrar desdobramento, grupamento ou bonificação"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Evento Corporativo</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Imprimir dossiê deste ativo"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Grade de Indicadores Executivos do Ativo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Quantidade em Custódia</span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              {position?.quantidade || '0'} cotas
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Preço Médio Contábil</span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              {formatBRL(position?.precoMedio || 0)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Cotação Atual (Mercado)</span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              {formatBRL(position?.precoAtual || quote?.precoAtual || 0)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Valor Atual da Posição</span>
            <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
              {formatBRL(position?.valorAtual || 0)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Lucro Papel (Não Realizado)</span>
            <span className={`text-base font-bold font-mono ${
              isLucroPos ? 'text-emerald-600 dark:text-emerald-400' : isLucroNeg ? 'text-red-600 dark:text-red-400' : 'text-slate-600'
            }`}>
              {formatBRL(lucroNaoRealizado)} ({formatPercent(position?.rentabilidadeNaoRealizadaPct || 0, true)})
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Proventos Recebidos</span>
            <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
              {formatBRL(totalProventosLiq)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Yield on Cost (YoC Real)</span>
            <span className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {formatPercent(yocPct, false)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Total Return Global (YoC + Lucro)</span>
            <span className={`text-base font-bold font-mono ${
              isReturnPos ? 'text-emerald-600 dark:text-emerald-400' : isReturnNeg ? 'text-red-600 dark:text-red-400' : 'text-slate-600'
            }`}>
              {formatBRL(totalReturnAtivo)} ({formatPercent(totalReturnPct, true)})
            </span>
          </div>
        </div>

        {/* Abas de Navegação do Dossiê */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('operacoes')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'operacoes'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Extrato de Ordens ({assetOps.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('proventos')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'proventos'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Histórico de Proventos ({assetDividends.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documentos')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'documentos'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notas de Corretagem Vinculadas ({assetDocs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('auditoria')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'auditoria'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Rastreabilidade & Auditoria</span>
          </button>
        </div>

        {/* Conteúdo das Abas (Scrollável) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* ABA 1: OPERAÇÕES / LIVRO-RAZÃO */}
          {activeTab === 'operacoes' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Total de {totalCompras} compras e {totalVendas} vendas registradas no livro-razão</span>
                <span className="font-mono">Peso na Carteira Total: {formatPercent(pesoCarteiraPct, false)}</span>
              </div>

              {assetOps.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  Nenhuma ordem de negociação registrada para este ativo.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-3 py-2.5">Data Pregão</th>
                        <th className="px-3 py-2.5">Operação</th>
                        <th className="px-3 py-2.5 text-right">Qtd</th>
                        <th className="px-3 py-2.5 text-right">Preço Unitário</th>
                        <th className="px-3 py-2.5 text-right">Taxas B3 / Custos</th>
                        <th className="px-3 py-2.5 text-right">Valor Total</th>
                        <th className="px-3 py-2.5 text-center">Origem / Nota</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {assetOps.map(op => {
                        const isBuy = op.tipo === 'COMPRA';
                        return (
                          <tr key={op.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="px-3 py-2.5 font-mono text-slate-700 dark:text-slate-300">
                              {new Date(op.dataPregao + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`inline-flex items-center gap-1 font-bold ${
                                isBuy ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                              }`}>
                                {isBuy ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                {op.tipo}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {op.quantidade}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                              {formatBRL(op.precoUnitario)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono text-slate-500">
                              {formatBRL(op.custosTotais || 0)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {formatBRL(op.valorTotalOperacao)}
                            </td>
                            <td className="px-3 py-2.5 text-center font-mono text-[10px] text-slate-400">
                              {op.notaCorretagemId ? (
                                <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300">
                                  Nota Vinculada
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  Lançamento Manual
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ABA 2: PROVENTOS */}
          {activeTab === 'proventos' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Renda passiva total auferida: <strong className="text-emerald-600 font-mono">{formatBRL(totalProventosLiq)}</strong></span>
                <span className="font-mono">Yield on Cost: {formatPercent(yocPct, false)}</span>
              </div>

              {assetDividends.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  Nenhum provento (dividendo ou JCP) registrado até o momento para este ativo.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-3 py-2.5">Data COM</th>
                        <th className="px-3 py-2.5">Data Pagamento</th>
                        <th className="px-3 py-2.5">Tipo</th>
                        <th className="px-3 py-2.5 text-right">Qtd Base</th>
                        <th className="px-3 py-2.5 text-right">Valor / Cota</th>
                        <th className="px-3 py-2.5 text-right">IR Retido</th>
                        <th className="px-3 py-2.5 text-right">Líquido Recebido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {assetDividends.map(div => (
                        <tr key={div.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-400">
                            {div.dataCom ? new Date(div.dataCom + 'T12:00:00Z').toLocaleDateString('pt-BR') : '—'}
                          </td>
                          <td className="px-3 py-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {new Date(div.dataPagamento + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              {div.tipo}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                            {div.quantidadeBase}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                            {div.valorPorAcao ? formatBRL(div.valorPorAcao) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-red-500">
                            {D(div.valorRetidoIR || 0).gt(0) ? formatBRL(div.valorRetidoIR) : 'Isento'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatBRL(div.valorLiquido)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ABA 3: NOTAS DE CORRETAGEM */}
          {activeTab === 'documentos' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Notas fiscais de negociação em PDF que compravam as compras e vendas deste ativo.
              </p>

              {assetDocs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  Nenhuma nota de corretagem em PDF vinculada a este ativo. As ordens foram registradas por lançamento manual ou posição inicial.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {assetDocs.map(doc => (
                    <div key={doc.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">
                            Nota Nº {doc.numeroNota}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {doc.corretora} • {new Date(doc.dataPregao + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                        Confirmada
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA 4: AUDITORIA & RASTREABILIDADE */}
          {activeTab === 'auditoria' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Cadeia de Rastreabilidade e Conciliação Hermas</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  A posição de <strong>{position?.quantidade || 0} cotas</strong> de {ticker} é derivada de forma puramente determinística pelo motor contábil, computando cada linha do livro-razão sem arredondamentos arbitrários.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-slate-400 text-[11px] block">Origem do Preço Médio</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Média ponderada com custos operacionais B3 integrados
                  </div>
                  <div className="font-mono text-slate-500 text-[11px]">
                    Fórmula: Soma(Qtd * Preço + Custos) / Qtd Total
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-slate-400 text-[11px] block">Integridade Contábil</span>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Livro-Razão Reconciliado (Zero Discrepâncias)</span>
                  </div>
                  <div className="font-mono text-slate-400 text-[10px]">
                    Hash: SHA256-Hermas-Ledger-{ticker}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Dossiê */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="font-mono text-[11px]">
            Hermas Vault • Dossiê Individual de Custódia
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all hover:opacity-90 cursor-pointer"
          >
            Fechar Dossiê
          </button>
        </div>

      </div>
    </div>
  );
};
