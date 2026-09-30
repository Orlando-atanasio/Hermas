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
  DollarSign
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
      {/* Switcher de Visão: Negociações vs Proventos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('OPERACOES')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'OPERACOES'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Operações ({operations.length})
          </button>
          <button
            onClick={() => setViewMode('PROVENTOS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'PROVENTOS'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Proventos & Renda ({dividends.length})</span>
          </button>
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenInitialPosition && (
            <button
              onClick={onOpenInitialPosition}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              title="Migre ativos antigos sem digitar cada nota"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Posição Inicial</span>
            </button>
          )}

          {onOpenNewDividend && (
            <button
              onClick={onOpenNewDividend}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Lançar Provento</span>
            </button>
          )}

          {onOpenCorporateAction && (
            <button
              onClick={onOpenCorporateAction}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Evento Corporativo</span>
            </button>
          )}

          <button
            onClick={onOpenNewModal}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Operação</span>
          </button>
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
              <table className="w-full text-left text-xs min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px] whitespace-nowrap">
                    <th className="pb-3">Ticker</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3">Data COM</th>
                    <th className="pb-3">Data Pagamento</th>
                    <th className="pb-3 text-right">Qtd Base</th>
                    <th className="pb-3 text-right">Valor / Cota</th>
                    <th className="pb-3 text-right">Bruto</th>
                    <th className="pb-3 text-right">IRRF Retido</th>
                    <th className="pb-3 text-right">Valor Líquido</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
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
                        <tr key={div.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 font-bold font-mono text-slate-900 dark:text-white">
                            {div.ticker}
                          </td>
                          <td className="py-3 font-sans">
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
                          <td className="py-3 text-slate-600 dark:text-slate-400">
                            {div.dataCom}
                          </td>
                          <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                            {div.dataPagamento}
                          </td>
                          <td className="py-3 text-right text-slate-700 dark:text-slate-300">
                            {div.quantidadeBase}
                          </td>
                          <td className="py-3 text-right text-slate-700 dark:text-slate-300">
                            {formatBRL(div.valorPorAcao)}
                          </td>
                          <td className="py-3 text-right text-slate-500">
                            {formatBRL(div.valorBruto)}
                          </td>
                          <td className="py-3 text-right text-amber-600 dark:text-amber-400">
                            {D(div.retencaoIr || '0').gt(0) ? `- ${formatBRL(div.retencaoIr)}` : 'Isento'}
                          </td>
                          <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {formatBRL(div.valorLiquido)}
                          </td>
                          <td className="py-3 text-center font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              div.status === 'RECEBIDO'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            }`}>
                              {div.status === 'RECEBIDO' ? 'Recebido' : 'Provisionado'}
                            </span>
                          </td>
                          <td className="py-3 text-right font-sans">
                            {onDeleteDividend && (
                              <button
                                onClick={() => {
                                  if (confirm(`Excluir provento de ${div.ticker} (${formatBRL(div.valorLiquido)})?`)) {
                                    onDeleteDividend(div.id);
                                  }
                                }}
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
              <table className="w-full text-left text-xs min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold whitespace-nowrap">
                    <th className="pb-3">Pregão</th>
                    <th className="pb-3">Ticker</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3">Mercado</th>
                    <th className="pb-3 text-right">Qtd</th>
                    <th className="pb-3 text-right">Preço Unit.</th>
                    <th className="pb-3 text-right">Custos (B3/Taxas)</th>
                    <th className="pb-3 text-right">Valor Total</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Ações</th>
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
                        <td className="py-3 font-mono-numbers text-slate-700 dark:text-slate-300">
                          {op.dataPregao}
                        </td>
                        <td className="py-3 font-bold font-mono text-slate-900 dark:text-white">
                          {op.ticker}
                        </td>
                        <td className="py-3">
                          {getTypeBadge(op.tipo)}
                        </td>
                        <td className="py-3 text-[11px] text-slate-500">
                          {op.mercado}
                        </td>
                        <td className="py-3 text-right font-mono-numbers text-slate-800 dark:text-slate-200">
                          {op.quantidade}
                        </td>
                        <td className="py-3 text-right font-mono-numbers text-slate-700 dark:text-slate-300">
                          {formatBRL(op.precoUnitario)}
                        </td>
                        <td className="py-3 text-right font-mono-numbers text-slate-500">
                          {formatBRL(op.custosTotais)}
                        </td>
                        <td className="py-3 text-right font-mono-numbers font-bold text-slate-900 dark:text-white">
                          {formatBRL(op.valorTotalOperacao)}
                        </td>
                        <td className="py-3 text-center">
                          {getStatusBadge(op.status)}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingOp(op)}
                              title="Editar e auditar operação"
                              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja realmente remover a operação ${op.tipo} de ${op.ticker}?`)) {
                                  onDeleteOperation(op.id);
                                }
                              }}
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
    </div>
  );
};
