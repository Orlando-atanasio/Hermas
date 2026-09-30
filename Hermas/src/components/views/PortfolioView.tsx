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
  Layers,
  Archive,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  ArrowRight
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

  // Subscrições ativas em custódia (finais 12, 13, 14, 1, 2, etc.)
  const subscriptionPositions = useMemo(() => {
    return portfolio.posicoesCustodia.filter(
      p => D(p.quantidade).gt(0) && isSubscriptionTicker(p.ticker)
    );
  }, [portfolio.posicoesCustodia]);

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

  const assetTypes = ['TODOS', 'AÇÃO', 'FII', 'ETF', 'BDR', 'TESOURO'];

  return (
    <div className="space-y-6">
      {/* Top Controls: Search and Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por ticker ou nome da empresa..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {assetTypes.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterType === t
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
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
          <table className="w-full text-left text-xs min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold whitespace-nowrap">
                <th className="pb-3">Ticker / Ativo</th>
                <th className="pb-3 text-right">Qtd</th>
                <th className="pb-3 text-right">Preço Médio</th>
                <th className="pb-3 text-right">Custo Total</th>
                <th className="pb-3 text-right">Cotação Atual</th>
                <th className="pb-3 text-right">Valor de Mercado</th>
                <th className="pb-3 text-right">Não Realizado (R$)</th>
                <th className="pb-3 text-right">Rent. (%)</th>
                <th className="pb-3 text-right">Proventos</th>
                <th className="pb-3 text-right">Total Return</th>
                <th className="pb-3 text-right">Peso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredActive.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 text-xs">
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
                      <td className="py-3.5 pr-4 whitespace-normal min-w-[170px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white font-mono">
                            {pos.ticker}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-semibold">
                            {pos.asset.tipo}
                          </span>
                          {subInfo.isSubscription && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${subInfo.badgeClass}`}
                              title={subInfo.guidanceText}
                            >
                              {subInfo.badgeLabel}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px] flex items-center justify-between gap-1 mt-0.5">
                          <span className="truncate">{pos.asset.nome}</span>
                          {subInfo.isSubscription && onOpenCorporateAction && (
                            <button
                              type="button"
                              onClick={() => onOpenCorporateAction(pos.ticker, 'SUBSCRICAO_CONVERSAO')}
                              className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer shrink-0"
                            >
                              Converter ⚡
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 text-right font-mono-numbers text-slate-800 dark:text-slate-200">
                        {pos.quantidade}
                      </td>
                      <td className="py-3.5 text-right font-mono-numbers text-slate-700 dark:text-slate-300">
                        {formatBRL(pos.precoMedio)}
                      </td>
                      <td className="py-3.5 text-right font-mono-numbers text-slate-600 dark:text-slate-400">
                        {formatBRL(pos.custoTotal)}
                      </td>
                      <td className="py-3.5 text-right font-mono-numbers font-medium text-slate-900 dark:text-white">
                        {formatBRL(pos.precoAtual)}
                      </td>
                      <td className="py-3.5 text-right font-mono-numbers font-bold text-slate-900 dark:text-white">
                        {formatBRL(pos.valorAtual)}
                      </td>
                      <td className={`py-3.5 text-right font-mono-numbers font-semibold ${
                        isPos ? 'text-emerald-600 dark:text-emerald-400' : isNeg ? 'text-red-600 dark:text-red-400' : 'text-slate-500'
                      }`}>
                        {formatBRL(pos.lucroNaoRealizado)}
                      </td>
                      <td className={`py-3.5 text-right font-mono-numbers font-bold ${
                        isPos ? 'text-emerald-600 dark:text-emerald-400' : isNeg ? 'text-red-600 dark:text-red-400' : 'text-slate-500'
                      }`}>
                        {formatPercent(pos.rentabilidadeNaoRealizadaPct, true)}
                      </td>
                      <td className="py-3.5 text-right font-mono-numbers text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatBRL(pos.proventosRecebidosHistorico)}
                      </td>
                      <td className="py-3.5 text-right font-mono-numbers font-bold text-indigo-600 dark:text-indigo-400">
                        {formatBRL(pos.totalReturn)}
                      </td>
                      <td className="py-3.5 text-right font-mono-numbers font-semibold text-slate-800 dark:text-slate-200">
                        {formatPercent(pos.percentualCarteira)}
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
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold whitespace-nowrap">
                  <th className="pb-3">Ativo</th>
                  <th className="pb-3 text-right">Status</th>
                  <th className="pb-3 text-right">Última Operação</th>
                  <th className="pb-3 text-right">Lucro Realizado (R$)</th>
                  <th className="pb-3 text-right">Proventos Recebidos</th>
                  <th className="pb-3 text-right">Retorno Total Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredZeradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                      Nenhuma posição encerrada no momento.
                    </td>
                  </tr>
                ) : (
                  filteredZeradas.map(pos => {
                    const isPos = isPositive(pos.lucroRealizadoHistorico);
                    const isNeg = isNegative(pos.lucroRealizadoHistorico);
                    return (
                      <tr key={pos.ticker} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 whitespace-nowrap">
                        <td className="py-3 font-semibold text-slate-900 dark:text-white">
                          <span className="font-mono">{pos.ticker}</span>
                          <span className="text-slate-400 text-[11px] ml-2">({pos.asset.tipo})</span>
                        </td>
                        <td className="py-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Zerada (0 cotas)
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono-numbers text-slate-500">
                          {pos.dataUltimaOperacao}
                        </td>
                        <td className={`py-3 text-right font-mono-numbers font-bold ${
                          isPos ? 'text-emerald-600 dark:text-emerald-400' : isNeg ? 'text-red-600 dark:text-red-400' : 'text-slate-500'
                        }`}>
                          {formatBRL(pos.lucroRealizadoHistorico)}
                        </td>
                        <td className="py-3 text-right font-mono-numbers text-emerald-600 dark:text-emerald-400">
                          {formatBRL(pos.proventosRecebidosHistorico)}
                        </td>
                        <td className="py-3 text-right font-mono-numbers font-bold text-indigo-600 dark:text-indigo-400">
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
