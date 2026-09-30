import React, { useState, useEffect } from 'react';
import { 
  X, 
  Coins, 
  Calendar, 
  HelpCircle, 
  CheckCircle2, 
  DollarSign, 
  Calculator,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { Dividend, DividendType, Asset, CustodyPosition } from '../../types';
import { D, toCanonicalString, formatBRL } from '../../engine/decimal';
import { normalizeTicker } from '../../engine/importers/toroParser';

interface NewDividendModalProps {
  assets: Asset[];
  custodyPositions?: CustodyPosition[];
  onSave: (div: Dividend) => void;
  onClose: () => void;
  initialData?: Dividend | null;
}

export const NewDividendModal: React.FC<NewDividendModalProps> = ({
  assets,
  custodyPositions = [],
  onSave,
  onClose,
  initialData,
}) => {
  const [ticker, setTicker] = useState(initialData?.ticker || (custodyPositions[0]?.ticker || 'PETR4'));
  const [tipo, setTipo] = useState<DividendType>(initialData?.tipo || 'DIVIDENDO');
  const [dataCom, setDataCom] = useState(initialData?.dataCom || new Date().toISOString().slice(0, 10));
  const [dataPagamento, setDataPagamento] = useState(initialData?.dataPagamento || new Date().toISOString().slice(0, 10));
  
  // Encontrar quantidade atual em custódia para sugerir
  const initialQty = initialData?.quantidadeBase || (() => {
    const pos = custodyPositions.find(p => p.ticker.toUpperCase() === ticker.toUpperCase());
    return pos ? pos.quantidade : '100';
  })();

  const [quantidadeBase, setQuantidadeBase] = useState(initialQty);
  const [inputMode, setInputMode] = useState<'POR_ACAO' | 'TOTAL'>(initialData?.valorPorAcao ? 'POR_ACAO' : 'TOTAL');
  const [valorPorAcao, setValorPorAcao] = useState(initialData?.valorPorAcao || '0.50');
  const [valorTotalLiquido, setValorTotalLiquido] = useState(initialData?.valorLiquido || '50.00');
  const [status, setStatus] = useState<'RECEBIDO' | 'PROVISIONADO'>(initialData?.status || 'RECEBIDO');
  const [observacoes, setObservacoes] = useState(initialData?.origem || '');

  // Atualizar sugestão de quantidade quando o ticker mudar
  const handleTickerChange = (newTicker: string) => {
    const clean = newTicker.toUpperCase().trim();
    setTicker(clean);
    const pos = custodyPositions.find(p => p.ticker.toUpperCase() === clean);
    if (pos && (!initialData || initialData.ticker !== clean)) {
      setQuantidadeBase(pos.quantidade);
    }
    // Auto-detectar se é FII (final 11) para sugerir tipo RENDIMENTO
    if (clean.endsWith('11') && tipo === 'DIVIDENDO') {
      setTipo('RENDIMENTO');
    }
  };

  // Cálculos determinísticos
  const calculoValores = () => {
    const q = D(quantidadeBase);
    const isJCP = tipo === 'JCP';

    if (inputMode === 'POR_ACAO') {
      const vUnit = D(valorPorAcao);
      const bruto = q.mul(vUnit);
      const retencao = isJCP ? bruto.mul(0.15) : D(0);
      const liquido = bruto.sub(retencao);
      return {
        unit: vUnit,
        bruto,
        retencao,
        liquido,
      };
    } else {
      const liquido = D(valorTotalLiquido);
      // Se for JCP e o usuário informou o líquido, o bruto é liquido / 0.85
      const bruto = isJCP ? liquido.div(0.85) : liquido;
      const retencao = bruto.sub(liquido);
      const unit = q.gt(0) ? bruto.div(q) : D(0);
      return {
        unit,
        bruto,
        retencao,
        liquido,
      };
    }
  };

  const { unit, bruto, retencao, liquido } = calculoValores();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTicker = ticker.toUpperCase().trim();
    if (!cleanTicker) return;

    const div: Dividend = {
      id: initialData?.id || `div_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      assetId: cleanTicker,
      ticker: cleanTicker,
      tipo,
      dataCom,
      dataPagamento,
      valorPorAcao: toCanonicalString(unit),
      quantidadeBase: toCanonicalString(D(quantidadeBase)),
      valorBruto: toCanonicalString(bruto),
      valorRetidoIR: toCanonicalString(retencao),
      retencaoIr: toCanonicalString(retencao),
      valorLiquido: toCanonicalString(liquido),
      status,
      origem: observacoes.trim() || undefined,
    };

    onSave(div);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {initialData ? 'Editar Provento' : 'Lançar Provento (Dividendos / JCP)'}
              </h2>
              <p className="text-xs text-slate-500">
                Alimenta a renda passiva, Yield on Cost e retorno total da carteira
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Ticker & Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Ticker do Ativo
              </label>
              <input
                type="text"
                list="portfolio-tickers-list"
                value={ticker}
                onChange={e => handleTickerChange(e.target.value)}
                placeholder="Ex: PETR4, MXRF11, WEGE3"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <datalist id="portfolio-tickers-list">
                {custodyPositions.map(p => (
                  <option key={p.ticker} value={p.ticker}>
                    {p.asset.nome} ({p.quantidade} cotas em custódia)
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Tipo de Provento
              </label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as DividendType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="DIVIDENDO">Dividendo (Isento de IR)</option>
                <option value="JCP">Juros s/ Capital Próprio - JCP (15% IR Fonte)</option>
                <option value="RENDIMENTO">Rendimento FII (Isento de IR)</option>
                <option value="RESTITUICAO_CAPITAL">Amortização / Devolução de Capital</option>
              </select>
            </div>
          </div>

          {/* Datas COM e Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Data COM (Data de Corte)
              </label>
              <input
                type="date"
                value={dataCom}
                onChange={e => setDataCom(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Data do Pagamento
              </label>
              <input
                type="date"
                value={dataPagamento}
                onChange={e => setDataPagamento(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Quantidade Base & Seletor de Modo de Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Quantidade de Ações / Cotas
              </label>
              <input
                type="text"
                value={quantidadeBase}
                onChange={e => setQuantidadeBase(e.target.value)}
                placeholder="100"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Status do Recebimento
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatus('RECEBIDO')}
                  className={`flex-1 py-2 px-2.5 rounded-xl font-semibold transition-colors cursor-pointer text-center ${
                    status === 'RECEBIDO'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Recebido em Conta
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('PROVISIONADO')}
                  className={`flex-1 py-2 px-2.5 rounded-xl font-semibold transition-colors cursor-pointer text-center ${
                    status === 'PROVISIONADO'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Provisionado (Futuro)
                </button>
              </div>
            </div>
          </div>

          {/* Modo de inserção do valor */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/60">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Forma de Inserção do Provento:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setInputMode('POR_ACAO')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    inputMode === 'POR_ACAO'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Valor por Cota (R$)
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('TOTAL')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    inputMode === 'TOTAL'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Valor Líquido Total (R$)
                </button>
              </div>
            </div>

            {inputMode === 'POR_ACAO' ? (
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Valor Bruto por Ação / Cota (R$)
                </label>
                <input
                  type="text"
                  value={valorPorAcao}
                  onChange={e => setValorPorAcao(e.target.value)}
                  placeholder="0.45"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Valor Líquido Total Creditado no Extrato (R$)
                </label>
                <input
                  type="text"
                  value={valorTotalLiquido}
                  onChange={e => setValorTotalLiquido(e.target.value)}
                  placeholder="150.00"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Simulação Matemática Prévia */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Valor Bruto</span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                  {formatBRL(bruto)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">
                  {tipo === 'JCP' ? 'IRRF Fonte (15%)' : 'Imposto'}
                </span>
                <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                  {retencao.gt(0) ? `- ${formatBRL(retencao)}` : 'Isento'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">Valor Líquido</span>
                <span className="font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  {formatBRL(liquido)}
                </span>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Observações / Corretora (Opcional)
            </label>
            <input
              type="text"
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Ex: Provento Toro CTVM / Anúncio AGO 2024"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{initialData ? 'Atualizar Provento' : 'Confirmar e Gravar Provento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
