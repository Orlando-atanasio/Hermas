import React, { useState } from 'react';
import { X, Plus, Calculator, CheckCircle2 } from 'lucide-react';
import { Operation, OperationType, MarketType, Asset } from '../../types';
import { toCanonicalString, formatBRL, D } from '../../engine/decimal';
import { normalizeTicker } from '../../engine/importers/toroParser';

interface NewOperationModalProps {
  assets: Asset[];
  onSave: (op: Operation) => void;
  onClose: () => void;
}

export const NewOperationModal: React.FC<NewOperationModalProps> = ({
  assets,
  onSave,
  onClose,
}) => {
  const [ticker, setTicker] = useState('PETR4');
  const [tipo, setTipo] = useState<OperationType>('COMPRA');
  const [dataPregao, setDataPregao] = useState(new Date().toISOString().slice(0, 10));
  const [dataLiquidacao, setDataLiquidacao] = useState(new Date().toISOString().slice(0, 10));
  const [quantidade, setQuantidade] = useState('100');
  const [precoUnitario, setPrecoUnitario] = useState('38.50');
  const [taxasB3, setTaxasB3] = useState('1.25');
  const [corretagem, setCorretagem] = useState('0.00');
  const [outrosCustos, setOutrosCustos] = useState('0.00');
  const [mercado, setMercado] = useState<MarketType>('VISTA');
  const [observacoes, setObservacoes] = useState('');

  const handleTickerChange = (val: string) => {
    const raw = val.toUpperCase().trim();
    const normalized = normalizeTicker(raw);
    setTicker(normalized.ticker);
    setMercado(normalized.mercado);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTicker = ticker.toUpperCase().trim();
    if (!cleanTicker) return;

    const qtd = D(quantidade);
    const preco = D(precoUnitario);
    const totalSemCustos = qtd.mul(preco);
    const custosTotais = D(taxasB3).add(D(corretagem)).add(D(outrosCustos));
    const totalOperacao = tipo === 'COMPRA' ? totalSemCustos.add(custosTotais) : totalSemCustos.sub(custosTotais);

    const op: Operation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      assetId: cleanTicker,
      ticker: cleanTicker,
      tipo,
      dataPregao,
      dataLiquidacao,
      quantidade: toCanonicalString(qtd),
      precoUnitario: toCanonicalString(preco),
      taxasB3: toCanonicalString(taxasB3),
      corretagem: toCanonicalString(corretagem),
      outrosCustos: toCanonicalString(outrosCustos),
      custosTotais: toCanonicalString(custosTotais),
      valorTotalOperacao: toCanonicalString(totalOperacao),
      mercado,
      status: 'CONFIRMADA',
      observacoes: observacoes || undefined,
      createdUtc: new Date().toISOString(),
    };

    onSave(op);
    onClose();
  };

  const valorTotalPrevisto = D(quantidade).mul(D(precoUnitario));
  const custosTotaisPrevistos = D(taxasB3).add(D(corretagem)).add(D(outrosCustos));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Registrar Operação Financeira
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {/* Ticker & Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ticker do Ativo
              </label>
              <input
                type="text"
                required
                value={ticker}
                onChange={e => handleTickerChange(e.target.value)}
                placeholder="ex: PETR4, WEGE3, HGLG11"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Operação
              </label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as OperationType)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                <option value="COMPRA">COMPRA</option>
                <option value="VENDA">VENDA</option>
                <option value="OPENING_POSITION">POSIÇÃO INICIAL (Abertura)</option>
                <option value="DESDOBRAMENTO">DESDOBRAMENTO (Split)</option>
                <option value="GRUPAMENTO">GRUPAMENTO (Reverse)</option>
                <option value="BONIFICACAO">BONIFICAÇÃO</option>
                <option value="AMORTIZACAO">AMORTIZAÇÃO DE CAPITAL</option>
              </select>
            </div>
          </div>

          {/* Datas Pregão e Liquidação */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data do Pregão (Negociação)
              </label>
              <input
                type="date"
                required
                value={dataPregao}
                onChange={e => setDataPregao(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data de Liquidação Financeira
              </label>
              <input
                type="date"
                required
                value={dataLiquidacao}
                onChange={e => setDataLiquidacao(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Quantidade & Preço Unitário */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quantidade
              </label>
              <input
                type="text"
                required
                value={quantidade}
                onChange={e => setQuantidade(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preço Unitário (R$)
              </label>
              <input
                type="text"
                required
                value={precoUnitario}
                onChange={e => setPrecoUnitario(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Custos Operacionais */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Taxas B3 / Emolumentos
              </label>
              <input
                type="text"
                value={taxasB3}
                onChange={e => setTaxasB3(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Corretagem
              </label>
              <input
                type="text"
                value={corretagem}
                onChange={e => setCorretagem(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Mercado
              </label>
              <select
                value={mercado}
                onChange={e => setMercado(e.target.value as MarketType)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="VISTA">VISTA</option>
                <option value="FRACIONARIO">FRACIONÁRIO</option>
                <option value="OPCOES">OPÇÕES</option>
                <option value="TERMO">TERMO</option>
              </select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="ex: Aporte mensal recorrente, Comprovante B3"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Totalizador Financeiro */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[11px] block">Valor Operação + Custos:</span>
              <span className="font-bold text-base text-slate-900 dark:text-white font-mono-numbers">
                {formatBRL(valorTotalPrevisto.add(custosTotaisPrevistos))}
              </span>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              <p>Operação: {formatBRL(valorTotalPrevisto)}</p>
              <p>Custos: {formatBRL(custosTotaisPrevistos)}</p>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Gravar Operação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
