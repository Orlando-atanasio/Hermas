import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  ExternalLink, 
  Coins, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Archive, 
  RefreshCw, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight,
  X,
  Building2,
  Building,
  Globe,
  Shield,
  Check
} from 'lucide-react';
import { PortfolioSummary } from '../../engine/portfolio';
import { formatBRL, formatPercent, isPositive, isNegative, D } from '../../engine/decimal';
import { CustodyPosition, AssetType } from '../../types';
import { CustodyBreakdownCharts } from '../charts/CustodyBreakdownCharts';
import { getSubscriptionInfo, isSubscriptionTicker } from '../../engine/subscriptions';

interface PortfolioViewProps {
  portfolio: PortfolioSummary;
  onSelectAsset?: (ticker: string) => void;
  onRefreshQuotes?: () => void;
  isRefreshingQuotes?: boolean;
  onOpenCorporateAction?: (ticker?: string, type?: any) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  portfolio,
  onSelectAsset,
  onRefreshQuotes,
  isRefreshingQuotes = false,
  onOpenCorporateAction,
}) => {
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [showZeradas, setShowZeradas] = useState(false);
  const [isClassesOpen, setIsClassesOpen] = useState(false);

  // Subscrições ativas em custódia (finais 12, 13, 14, 1, 2, etc.)
  const subscriptionPositions = useMemo(() => {
    return portfolio.posicoesCustodia.filter(
      p => D(p.quantidade).gt(0) && isSubscriptionTicker(p.ticker)
    );
  }, [portfolio.posicoesCustodia]);

  // Contagem de ativos por categoria
  const countsByType = useMemo(() => {
    const counts: Record<string, number> = {
      TODOS: portfolio.posicoesCustodia.length,
      AÇÃO: 0,
      FII: 0,
      ETF: 0,
      BDR: 0,
      TESOURO: 0,
    };
    portfolio.posicoesCustodia.forEach(p => {
      const t = p.asset.tipo;
      if (counts[t] !== undefined) {
        counts[t] = (counts[t] || 0) + 1;
      }
    });
    return counts;
  }, [portfolio.posicoesCustodia]);

  // Definição rica das classes de ativos
  const classItems = [
    { id: 'TODOS', label: 'Todas as Classes', shortLabel: 'Todas', icon: Layers, count: countsByType['TODOS'] || 0 },
    { id: 'AÇÃO', label: 'Ações B3', shortLabel: 'Ações', icon: Building2, count: countsByType['AÇÃO'] || 0 },
    { id: 'FII', label: 'Fundos Imobiliários (FIIs)', shortLabel: 'FIIs', icon: Building, count: countsByType['FII'] || 0 },
    { id: 'ETF', label: 'ETFs de Renda Variável', shortLabel: 'ETFs', icon: Layers, count: countsByType['ETF'] || 0 },
    { id: 'BDR', label: 'BDRs Internacionais', shortLabel: 'BDRs', icon: Globe, count: countsByType['BDR'] || 0 },
    { id: 'TESOURO', label: 'Tesouro Direto / Renda Fixa', shortLabel: 'Tesouro', icon: Shield, count: countsByType['TESOURO'] || 0 },
  ];

  const activeClassItem = classItems.find(c => c.id === filterType) || classItems[0];

  // Filtragem das posições ativas
  const filteredActive = portfolio.posicoesCustodia.filter(pos => {
    const matchesType = filterType === 'TODOS' || pos.asset.tipo === filterType;
    const matchesSearch = 
      pos.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pos.asset.nome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const filteredZeradas = portfolio.posicoesZeradas.filter(pos => {
    const matchesType = filterType === 'TODOS' || pos.asset.tipo === filterType;
    const matchesSearch = 
      pos.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pos.asset.nome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls: Busca e Filtro de Classes com Menu Suspenso (Dropdown) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Busca por Ticker ou Nome */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por ticker ou nome da empresa..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all shadow-xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Botão com Setinha: Estende para baixo mostrando apenas os nomes das opções (sem cards) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsClassesOpen(!isClassesOpen)}
            className={`w-full sm:w-auto flex items-center justify-between gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none shrink-0 shadow-xs ${
              isClassesOpen
                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                : filterType !== 'TODOS'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
              <span>Classe: <strong>{activeClassItem.shortLabel}</strong></span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                filterType !== 'TODOS' && !isClassesOpen
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {activeClassItem.count}
              </span>
            </div>
            <div className="flex items-center gap-1 pl-1">
              {isClassesOpen ? (
                <ChevronUp className="w-4 h-4 shrink-0 transition-transform" />
              ) : (
                <ChevronDown className="w-4 h-4 shrink-0 transition-transform" />
              )}
            </div>
          </button>

          {/* Menu Suspenso que estende para baixo (sem cards, apenas nomes das opções) */}
          {isClassesOpen && (
            <>
              <div 
                className="fixed inset-0 z-20" 
                onClick={() => setIsClassesOpen(false)} 
              />
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800">
                  Filtrar por Classe
                </div>
                {classItems.map(item => {
                  const isSelected = filterType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setFilterType(item.id);
                        setIsClassesOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">
                        ({item.count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Gráficos Ilustrativos de Custódia (Peso e Rentabilidade) */}
      <CustodyBreakdownCharts positions={portfolio.posicoesCustodia} />

      {/* Banner Informativo de Subscrições Ativas */}
      {subscriptionPositions.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-xs text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <span>Ativos de Subscrição em Custódia ({subscriptionPositions.length})</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-amber-200/50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                  Etapa Transitória de Emissão
                </span>
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Você possui {subscriptionPositions.map(p => p.ticker).join(', ')}. Os códigos finais 12 (direitos), 13 (recibos) e 14 (sobras) não distribuem dividendos normais e devem ser exercidos, negociados ou homologados para conversão nas cotas definitivas (final 11).
              </p>
            </div>
          </div>

          {onOpenCorporateAction && (
            <button
              type="button"
              onClick={() => onOpenCorporateAction(subscriptionPositions[0].ticker, 'SUBSCRICAO_CONVERSAO')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Converter em Cotas Definitivas</span>
            </button>
          )}
        </div>
      )}

      {/* Tabela de Custódia Ativa */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Posições em Aberto ({filteredActive.length})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cálculo ponderado pelo custo médio de aquisição e despesas incorridas
            </p>
          </div>
          <div className="flex items-center gap-3">
            {onRefreshQuotes && (
              <button
                type="button"
                onClick={onRefreshQuotes}
                disabled={isRefreshingQuotes}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                title="Atualizar cotações de mercado via Brapi"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQuotes ? 'animate-spin text-blue-600' : ''}`} />
                <span>{isRefreshingQuotes ? 'Atualizando...' : 'Atualizar Cotações'}</span>
              </button>
            )}
            <div className="text-right text-xs">
              <span className="text-slate-400">Total em Aberto: </span>
              <span className="font-bold text-slate-900 dark:text-white font-mono-numbers">
                {formatBRL(portfolio.patrimonioTotal)}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
          <table className="w-full text-left text-xs min-w-[1100px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold whitespace-nowrap text-[11px] bg-slate-50/50 dark:bg-slate-800/40">
                <th className="px-3.5 py-3 text-left">Ticker</th>
                <th className="px-3.5 py-3 text-left">Empresa / Nome</th>
                <th className="px-3.5 py-3 text-center">Classe</th>
                <th className="px-3.5 py-3 text-right">Quantidade</th>
                <th className="px-3.5 py-3 text-right">Preço Médio</th>
                <th className="px-3.5 py-3 text-right">Custo Total</th>
                <th className="px-3.5 py-3 text-right">Cotação Atual</th>
                <th className="px-3.5 py-3 text-right">Valor de Mercado</th>
                <th className="px-3.5 py-3 text-right">Ganho Não Realizado</th>
                <th className="px-3.5 py-3 text-right">Rent. (%)</th>
                <th className="px-3.5 py-3 text-right">Proventos</th>
                <th className="px-3.5 py-3 text-right">Total Return</th>
                <th className="px-3.5 py-3 text-right">Peso</th>
                <th className="px-3 py-3 text-center">Dossiê</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredActive.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-400 text-xs">
                    Nenhum ativo encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredActive.map(pos => {
                  const isPos = isPositive(pos.lucroNaoRealizado);
                  const isNeg = isNegative(pos.lucroNaoRealizado);
                  const subInfo = getSubscriptionInfo(pos.ticker);
                  return (
                    <tr 
                      key={pos.ticker} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group whitespace-nowrap"
                    >
                      {/* Ticker */}
                      <td className="px-3.5 py-3 text-left">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectAsset?.(pos.ticker)}
                            className="font-bold text-blue-600 dark:text-blue-400 hover:underline font-mono text-xs flex items-center gap-1 cursor-pointer"
                            title="Abrir Dossiê 360° do Ativo"
                          >
                            <span>{pos.ticker}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          {subInfo.isSubscription && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${subInfo.badgeClass}`}
                              title={subInfo.guidanceText}
                            >
                              {subInfo.badgeLabel}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Empresa / Nome */}
                      <td className="px-3.5 py-3 text-left">
                        <div className="flex items-center justify-between gap-1 max-w-[170px]">
                          <span className="text-xs font-sans text-slate-700 dark:text-slate-300 truncate" title={pos.asset.nome}>
                            {pos.asset.nome}
                          </span>
                          {subInfo.isSubscription && onOpenCorporateAction && (
                            <button
                              type="button"
                              onClick={() => onOpenCorporateAction(pos.ticker, 'SUBSCRICAO_CONVERSAO')}
                              className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer shrink-0 ml-1"
                            >
                              ⚡
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Classe */}
                      <td className="px-3.5 py-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                          {pos.asset.tipo}
                        </span>
                      </td>

                      {/* Quantidade */}
                      <td className="px-3.5 py-3 text-right font-mono-numbers tabular-nums text-slate-800 dark:text-slate-200">
                        {pos.quantidade}
                      </td>

                      {/* Preço Médio */}
                      <td className="px-3.5 py-3 text-right font-mono-numbers tabular-nums text-slate-700 dark:text-slate-300">
                        {formatBRL(pos.precoMedio)}
                      </td>

                      {/* Custo Total */}
                      <td className="px-3.5 py-3 text-right font-mono-numbers tabular-nums text-slate-600 dark:text-slate-400">
                        {formatBRL(pos.custoTotal)}
                      </td>

                      {/* Cotação Atual */}
                      <td className="px-3.5 py-3 text-right font-mono-numbers tabular-nums font-medium text-slate-900 dark:text-white">
                        {formatBRL(pos.precoAtual)}
                      </td>

                      {/* Valor de Mercado */}
                      <td className="px-3.5 py-3 text-right font-mono-numbers tabular-nums font-bold text-slate-900 dark:text-white">
                        {formatBRL(pos.valorAtual)}
                      </td>

                      {/* Ganho Não Realizado */}
                      <td className={`px-3.5 py-3 text-right font-mono-numbers tabular-nums font-semibold ${
                        isPos ? 'text-emerald-600 dark:text-emerald-400' : isNeg ? 'text-red-600 dark:text-red-400' : 'text-slate-500'
                      }`}>
                        {formatBRL(pos.lucroNaoRealizado)}
                      </td>

                      {/* Rentabilidade % */}
                      <td className={`px-3.5 py-3 text-right font-mono-numbers tabular-nums font-bold ${
                        isPos ? 'text-emerald-600 dark:text-emerald-400' : isNeg ? 'text-red-600 dark:text-red-400' : 'text-slate-500'
                      }`}>
                        {formatPercent(pos.rentabilidadeNaoRealizadaPct, true)}
                      </td>

                      {/* Proventos Recebidos */}
                      <td className="px-3.5 py-3 text-right font-mono-numbers tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatBRL(pos.proventosRecebidosHistorico)}
                      </td>

                      {/* Total Return */}
                      <td className="px-3.5 py-3 text-right font-mono-numbers tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                        {formatBRL(pos.totalReturn)}
                      </td>

                      {/* Peso na Carteira */}
                      <td className="px-3.5 py-3 text-right font-mono-numbers tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                        {formatPercent(pos.percentualCarteira)}
                      </td>

                      {/* Dossiê 360° */}
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectAsset?.(pos.ticker)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          title={`Ver Dossiê 360° de ${pos.ticker}`}
                        >
                          <span>Dossiê</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Posições Zeradas / Encerradas (Realizado) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowZeradas(!showZeradas)}
            className="flex items-center gap-2 text-left cursor-pointer group"
          >
            <Archive className="w-4 h-4 text-slate-500 group-hover:text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                Posições Encerradas / Realizadas ({filteredZeradas.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ativos com saldo zero em custódia mas com histórico de lucro realizado ou proventos
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showZeradas ? 'rotate-180' : ''}`} />
          </button>

          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono-numbers">
            Lucro Realizado Total: {formatBRL(portfolio.lucroRealizadoTotal)}
          </span>
        </div>

        {showZeradas && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full text-left text-xs min-w-[850px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold whitespace-nowrap text-[11px] bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="px-3.5 py-3 text-left">Ticker</th>
                  <th className="px-3.5 py-3 text-left">Empresa</th>
                  <th className="px-3.5 py-3 text-center">Classe</th>
                  <th className="px-3.5 py-3 text-center">Status</th>
                  <th className="px-3.5 py-3 text-center">Última Operação</th>
                  <th className="px-3.5 py-3 text-right">Lucro Realizado (R$)</th>
                  <th className="px-3.5 py-3 text-right">Proventos Recebidos</th>
                  <th className="px-3.5 py-3 text-right">Retorno Total Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredZeradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400 text-xs">
                      Nenhuma posição encerrada no momento.
                    </td>
                  </tr>
                ) : (
                  filteredZeradas.map(pos => {
                    const isPos = isPositive(pos.lucroRealizadoHistorico);
                    const isNeg = isNegative(pos.lucroRealizadoHistorico);
                    return (
                      <tr key={pos.ticker} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 whitespace-nowrap">
                        <td className="px-3.5 py-3 text-left font-bold font-mono text-slate-900 dark:text-white">
                          {pos.ticker}
                        </td>
                        <td className="px-3.5 py-3 text-left font-sans text-slate-600 dark:text-slate-300 max-w-[160px] truncate" title={pos.asset.nome}>
                          {pos.asset.nome}
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                            {pos.asset.tipo}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Zerada (0 cotas)
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-center font-mono-numbers tabular-nums text-slate-500">
                          {pos.dataUltimaOperacao}
                        </td>
                        <td className={`px-3.5 py-3 text-right font-mono-numbers tabular-nums font-bold ${
                          isPos ? 'text-emerald-600 dark:text-emerald-400' : isNeg ? 'text-red-600 dark:text-red-400' : 'text-slate-500'
                        }`}>
                          {formatBRL(pos.lucroRealizadoHistorico)}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono-numbers tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                          {formatBRL(pos.proventosRecebidosHistorico)}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono-numbers tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                          {formatBRL(pos.totalReturn)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
