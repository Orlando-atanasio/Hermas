import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Info,
  Calendar,
  Layers,
  HelpCircle,
  X,
  Coins,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Percent,
  DollarSign,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Operation, OperationType, OperationStatus, MarketType, Dividend } from '../../types';
import { formatBRL, toCanonicalString, D } from '../../engine/decimal';
import { OperationsCharts } from '../charts/OperationsCharts';

interface OperationsViewProps {
  operations: Operation[];
  dividends?: Dividend[];
  onSaveOperation: (op: Operation) => void;
  onDeleteOperation: (id: string) => void;
  onSaveDividend?: (div: Dividend) => void;
  onDeleteDividend?: (id: string) => void;
  onOpenNewModal: () => void;
  onOpenCorporateAction?: () => void;
  onOpenInitialPosition?: () => void;
  onOpenNewDividend?: () => void;
}

export const OperationsView: React.FC<OperationsViewProps> = ({
  operations,
  dividends = [],
  onSaveOperation,
  onDeleteOperation,
  onSaveDividend,
  onDeleteDividend,
  onOpenNewModal,
  onOpenCorporateAction,
  onOpenInitialPosition,
  onOpenNewDividend,
}) => {
  const [viewMode, setViewMode] = useState<'OPERACOES' | 'PROVENTOS'>('OPERACOES');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [editingOp, setEditingOp] = useState<Operation | null>(null);
  const [isActionsBoxOpen, setIsActionsBoxOpen] = useState(false);
  const [opToDelete, setOpToDelete] = useState<Operation | null>(null);
  const [divToDelete, setDivToDelete] = useState<Dividend | null>(null);

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Filtros de Operações
  const filteredOps = operations.filter(op => {
    const matchesSearch = 
      op.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (op.observacoes && op.observacoes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (op.comprovante && op.comprovante.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'TODOS' || op.tipo === filterType;
    const matchesStatus = filterStatus === 'TODOS' || op.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  }).sort((a, b) => {
    const cmp = b.dataPregao.localeCompare(a.dataPregao);
    if (cmp !== 0) return cmp;
    return (b.createdUtc || '').localeCompare(a.createdUtc || '');
  });

  // Filtros de Proventos
  const filteredDividends = dividends.filter(d => {
    const matchesSearch = 
      d.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.origem && d.origem.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'TODOS' || d.tipo === filterType;
    const matchesStatus = filterStatus === 'TODOS' || d.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  }).sort((a, b) => {
    const cmp = b.dataPagamento.localeCompare(a.dataPagamento);
    if (cmp !== 0) return cmp;
    return b.dataCom.localeCompare(a.dataCom);
  });

  // Totais de Proventos
  const totalProventosRecebidos = dividends
    .filter(d => d.status === 'RECEBIDO')
    .reduce((acc, d) => acc.add(D(d.valorLiquido)), D(0));

  const totalProventosProvisionados = dividends
    .filter(d => d.status === 'PROVISIONADO')
    .reduce((acc, d) => acc.add(D(d.valorLiquido)), D(0));

  const getStatusBadge = (status: OperationStatus) => {
    switch (status) {
      case 'CONFIRMADA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> Confirmada
          </span>
        );
      case 'ARREDONDADA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
            <Info className="w-3 h-3" /> Arredondada
          </span>
        );
      case 'PENDENTE_REVISAO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
            <Clock className="w-3 h-3" /> Pendente Revisão
          </span>
        );
      case 'INCONSISTENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
            <AlertCircle className="w-3 h-3" /> Inconsistente
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {status}
          </span>
        );
    }
  };

  const getTypeBadge = (tipo: OperationType) => {
    switch (tipo) {
      case 'COMPRA':
        return <span className="text-blue-600 dark:text-blue-400 font-bold">COMPRA</span>;
      case 'VENDA':
        return <span className="text-emerald-600 dark:text-emerald-400 font-bold">VENDA</span>;
      case 'OPENING_POSITION':
        return <span className="text-purple-600 dark:text-purple-400 font-bold">POSIÇÃO INICIAL</span>;
      case 'DESDOBRAMENTO':
        return <span className="text-amber-600 dark:text-amber-400 font-bold">DESDOBRAMENTO</span>;
      case 'GRUPAMENTO':
        return <span className="text-orange-600 dark:text-orange-400 font-bold">GRUPAMENTO</span>;
      case 'BONIFICACAO':
        return <span className="text-teal-600 dark:text-teal-400 font-bold">BONIFICAÇÃO</span>;
      case 'AMORTIZACAO':
        return <span className="text-indigo-600 dark:text-indigo-400 font-bold">AMORTIZAÇÃO</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Switcher de Visão & Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Switcher de Visão: Negociações vs Proventos */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-full sm:w-auto shadow-2xs border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setViewMode('OPERACOES')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
              viewMode === 'OPERACOES'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Operações ({operations.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('PROVENTOS')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === 'PROVENTOS'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5 shrink-0" />
            <span>Proventos & Renda ({dividends.length})</span>
          </button>
        </div>

        {/* Grupo de Ações: Botão Principal em Destaque + Menu Suspenso com Setinha */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Ação Primária em Destaque */}
          {viewMode === 'OPERACOES' ? (
            <button
              type="button"
              onClick={onOpenNewModal}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Operação</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenNewDividend}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Lançar Provento</span>
            </button>
          )}

          {/* Botão com Setinha: Estende para baixo mostrando apenas os nomes das opções (sem cards) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsActionsBoxOpen(!isActionsBoxOpen)}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none shrink-0 shadow-xs ${
                isActionsBoxOpen
                  ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-400 dark:border-purple-700 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Expandir mais ações"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Mais Ações</span>
              {isActionsBoxOpen ? (
                <ChevronUp className="w-4 h-4 ml-0.5 text-purple-600 dark:text-purple-400 transition-transform" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-0.5 text-slate-400 transition-transform" />
              )}
            </button>

            {/* Menu Suspenso que estende para baixo (sem cards, apenas nomes das opções) */}
            {isActionsBoxOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setIsActionsBoxOpen(false)} 
                />
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800">
                    Ações e Lançamentos
                  </div>

                  {onOpenCorporateAction && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenCorporateAction();
                        setIsActionsBoxOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>Evento Corporativo</span>
                    </button>
                  )}

                  {viewMode === 'OPERACOES' ? (
                    onOpenNewDividend && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenNewDividend();
                          setIsActionsBoxOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <span>Lançar Provento</span>
                      </button>
                    )
                  ) : (
                    onOpenNewModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenNewModal();
                          setIsActionsBoxOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <span>Nova Operação</span>
                      </button>
                    )
                  )}

                  {onOpenInitialPosition && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenInitialPosition();
                        setIsActionsBoxOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>Posição Inicial</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'PROVENTOS' ? (
        /* VISÃO DE PROVENTOS (DIVIDENDOS & JCP) */
        <div className="space-y-5 animate-in fade-in">
          {/* Cards de Resumo de Proventos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-400 block mb-1">
                Total de Proventos Recebidos
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatBRL(totalProventosRecebidos)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Crédito líquido acumulado na conta
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-400 block mb-1">
                Proventos Provisionados (A Receber)
              </span>
              <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                {formatBRL(totalProventosProvisionados)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Anunciados com data de pagamento futura
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1">
                  Lançamentos Cadastrados
                </span>
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  {dividends.length} eventos
                </span>
              </div>
              <button
                onClick={onOpenNewDividend}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer mt-2"
              >
                <span>+ Adicionar Novo Provento</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tabela de Proventos */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span>Livro Razão de Proventos ({filteredDividends.length})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Histórico de rendimentos, dividendos e juros sobre capital próprio
                </p>
              </div>

              {/* Filtro por ticker */}
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Filtrar ticker..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
              <table className="w-full text-left text-xs min-w-[850px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px] whitespace-nowrap bg-slate-50/50 dark:bg-slate-800/40">
                    <th className="px-3.5 py-3 text-left">Ticker</th>
                    <th className="px-3.5 py-3 text-left">Tipo</th>
                    <th className="px-3.5 py-3 text-center">Data COM</th>
                    <th className="px-3.5 py-3 text-center">Data Pagamento</th>
                    <th className="px-3.5 py-3 text-right">Qtd Base</th>
                    <th className="px-3.5 py-3 text-right">Valor / Cota</th>
                    <th className="px-3.5 py-3 text-right">Valor Bruto</th>
                    <th className="px-3.5 py-3 text-right">IRRF Retido</th>
                    <th className="px-3.5 py-3 text-right">Valor Líquido</th>
                    <th className="px-3.5 py-3 text-center">Status</th>
                    <th className="px-3.5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDividends.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400 text-xs font-sans">
                        Nenhum provento cadastrado. Use o botão <strong>"Lançar Provento"</strong> acima para registrar seus dividendos.
                      </td>
                    </tr>
                  ) : (
                    filteredDividends.map(div => {
                      const isJcp = div.tipo === 'JCP';
                      return (
                        <tr key={div.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors whitespace-nowrap">
                          <td className="px-3.5 py-3 text-left font-bold font-mono text-slate-900 dark:text-white">
                            {div.ticker}
                          </td>
                          <td className="px-3.5 py-3 text-left font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              div.tipo === 'DIVIDENDO'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : div.tipo === 'JCP'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                : div.tipo === 'RENDIMENTO'
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                            }`}>
                              {div.tipo}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-center font-mono tabular-nums text-slate-600 dark:text-slate-400">
                            {formatDateDisplay(div.dataCom)}
                          </td>
                          <td className="px-3.5 py-3 text-center font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                            {formatDateDisplay(div.dataPagamento)}
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono-numbers tabular-nums text-slate-700 dark:text-slate-300">
                            {div.quantidadeBase}
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono-numbers tabular-nums text-slate-700 dark:text-slate-300">
                            {formatBRL(div.valorPorAcao)}
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono-numbers tabular-nums text-slate-500">
                            {formatBRL(div.valorBruto)}
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono-numbers tabular-nums text-amber-600 dark:text-amber-400">
                            {D(div.retencaoIr || '0').gt(0) ? `- ${formatBRL(div.retencaoIr)}` : 'Isento'}
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono-numbers tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                            {formatBRL(div.valorLiquido)}
                          </td>
                          <td className="px-3.5 py-3 text-center font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              div.status === 'RECEBIDO'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            }`}>
                              {div.status === 'RECEBIDO' ? 'Recebido' : 'Provisionado'}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-right font-sans">
                            {onDeleteDividend && (
                              <button
                                type="button"
                                onClick={() => setDivToDelete(div)}
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                title="Excluir provento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        </div>
      ) : (
        /* VISÃO DE OPERAÇÕES DE NEGOCIAÇÃO */
        <>
          {/* Top Filter and Actions Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar por ticker, nota, obs..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="TODOS">Todos os Tipos</option>
                <option value="COMPRA">Compras</option>
                <option value="VENDA">Vendas</option>
                <option value="OPENING_POSITION">Posição Inicial</option>
                <option value="DESDOBRAMENTO">Desdobramentos</option>
                <option value="GRUPAMENTO">Grupamentos</option>
                <option value="BONIFICACAO">Bonificações</option>
                <option value="AMORTIZACAO">Amortizações</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="CONFIRMADA">Confirmadas</option>
                <option value="ARREDONDADA">Arredondadas</option>
                <option value="PENDENTE_REVISAO">Pendente Revisão</option>
                <option value="INCONSISTENTE">Inconsistentes</option>
              </select>
            </div>
          </div>

          {/* Gráficos Ilustrativos de Operações (Fluxo Mensal & Tipos) */}
          <OperationsCharts operations={operations} />

          {/* Tabela de Operações */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Livro Razão de Ordens ({filteredOps.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Registro imutável com preservação de origem rastreável
                </p>
              </div>
            </div>

            <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
              <table className="w-full text-left text-xs min-w-[850px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold whitespace-nowrap text-[11px] bg-slate-50/50 dark:bg-slate-800/40">
                    <th className="px-3.5 py-3 text-left">Pregão</th>
                    <th className="px-3.5 py-3 text-left">Ticker</th>
                    <th className="px-3.5 py-3 text-left">Tipo</th>
                    <th className="px-3.5 py-3 text-left">Mercado</th>
                    <th className="px-3.5 py-3 text-right">Quantidade</th>
                    <th className="px-3.5 py-3 text-right">Preço Unit.</th>
                    <th className="px-3.5 py-3 text-right">Custos (B3/Taxas)</th>
                    <th className="px-3.5 py-3 text-right">Valor Total</th>
                    <th className="px-3.5 py-3 text-center">Status</th>
                    <th className="px-3.5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredOps.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                        Nenhuma operação encontrada com os critérios informados.
                      </td>
                    </tr>
                  ) : (
                    filteredOps.map(op => (
                      <tr key={op.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors whitespace-nowrap">
                        <td className="px-3.5 py-3 text-left font-mono tabular-nums text-slate-700 dark:text-slate-300">
                          {formatDateDisplay(op.dataPregao)}
                        </td>
                        <td className="px-3.5 py-3 text-left font-bold font-mono text-slate-900 dark:text-white">
                          {op.ticker}
                        </td>
                        <td className="px-3.5 py-3 text-left">
                          {getTypeBadge(op.tipo)}
                        </td>
                        <td className="px-3.5 py-3 text-left font-sans text-xs text-slate-600 dark:text-slate-400">
                          {op.mercado}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono-numbers tabular-nums text-slate-800 dark:text-slate-200">
                          {op.quantidade}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono-numbers tabular-nums text-slate-700 dark:text-slate-300">
                          {formatBRL(op.precoUnitario)}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono-numbers tabular-nums text-slate-500">
                          {formatBRL(op.custosTotais)}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono-numbers tabular-nums font-bold text-slate-900 dark:text-white">
                          {formatBRL(op.valorTotalOperacao)}
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          {getStatusBadge(op.status)}
                        </td>
                        <td className="px-3.5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingOp(op)}
                              title="Editar e auditar operação"
                              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setOpToDelete(op)}
                              title="Excluir operação"
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal de Edição com Auditoria (Extraído vs Confirmado) */}
      {editingOp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Editar Operação com Rastreabilidade
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editingOp.ticker} • {editingOp.tipo} em {editingOp.dataPregao}
                </p>
              </div>
              <button
                onClick={() => setEditingOp(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {editingOp.extraidoOriginal && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-300">
                  <p className="font-bold mb-1">Dados Extraídos Originalmente do Comprovante:</p>
                  <p>Qtd: {editingOp.extraidoOriginal.quantidade} | Preço: {formatBRL(editingOp.extraidoOriginal.precoUnitario)} | Total: {formatBRL(editingOp.extraidoOriginal.valorTotalOperacao)}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="text"
                    value={editingOp.quantidade}
                    onChange={e => setEditingOp({ ...editingOp, quantidade: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Preço Unitário (R$)
                  </label>
                  <input
                    type="text"
                    value={editingOp.precoUnitario}
                    onChange={e => setEditingOp({ ...editingOp, precoUnitario: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Custos Totais (R$)
                </label>
                <input
                  type="text"
                  value={editingOp.custosTotais}
                  onChange={e => setEditingOp({ ...editingOp, custosTotais: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Justificativa da Auditoria / Alteração Manual
                </label>
                <textarea
                  rows={2}
                  value={editingOp.motivoAlteracao || ''}
                  onChange={e => setEditingOp({ ...editingOp, motivoAlteracao: e.target.value })}
                  placeholder="Ex: Ajuste de arredondamento de centavos conferido na nota física..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingOp(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const q = D(editingOp.quantidade);
                    const p = D(editingOp.precoUnitario);
                    const total = q.mul(p);
                    const updated: Operation = {
                      ...editingOp,
                      quantidade: toCanonicalString(q),
                      precoUnitario: toCanonicalString(p),
                      valorTotalOperacao: toCanonicalString(total),
                      status: 'CONFIRMADA',
                      updatedUtc: new Date().toISOString(),
                    };
                    onSaveOperation(updated);
                    setEditingOp(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  Salvar Alteração
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Operação */}
      {opToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Excluir Operação
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Deseja realmente remover esta operação do livro-razão?
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <span>{opToDelete.tipo} — {opToDelete.ticker}</span>
                <span className="font-mono">{formatBRL(opToDelete.valorTotalOperacao)}</span>
              </div>
              <span className="text-slate-500 mt-1 block">
                Pregão: {opToDelete.dataPregao} • {opToDelete.quantidade} cotas @ {formatBRL(opToDelete.precoUnitario)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpToDelete(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteOperation(opToDelete.id);
                  setOpToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Provento */}
      {divToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Excluir Provento
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Deseja remover este registro de rendimento do cofre?
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <span>{divToDelete.tipo} — {divToDelete.ticker}</span>
                <span className="font-mono text-emerald-600">{formatBRL(divToDelete.valorLiquido)}</span>
              </div>
              <span className="text-slate-500 mt-1 block">
                Pagamento: {divToDelete.dataPagamento} • Base: {divToDelete.quantidadeBase} cotas
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDivToDelete(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteDividend) {
                    onDeleteDividend(divToDelete.id);
                  }
                  setDivToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
