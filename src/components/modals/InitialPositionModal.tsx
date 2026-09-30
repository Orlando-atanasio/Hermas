import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  HelpCircle,
  Calendar,
  Building2,
  DollarSign
} from 'lucide-react';
import { Asset, Operation, OperationType, AssetType } from '../../types';
import { D, toCanonicalString, formatBRL } from '../../engine/decimal';
import { normalizeTicker } from '../../engine/importers/toroParser';
import { HermasDB } from '../../storage/db';

interface InitialPositionRow {
  id: string;
  ticker: string;
  nome: string;
  tipo: AssetType;
  quantidade: string;
  precoMedio: string;
}

interface InitialPositionModalProps {
  onSaveBatch: (operations: Operation[], assets: Asset[]) => void;
  onClose: () => void;
}

export const InitialPositionModal: React.FC<InitialPositionModalProps> = ({
  onSaveBatch,
  onClose,
}) => {
  const [dataCorte, setDataCorte] = useState('2023-12-31');
  const [corretora, setCorretora] = useState('Toro CTVM');
  const [rows, setRows] = useState<InitialPositionRow[]>([
    { id: '1', ticker: 'PETR4', nome: 'Petrobras PN', tipo: 'AÇÃO', quantidade: '100', precoMedio: '34.20' },
    { id: '2', ticker: 'WEGE3', nome: 'WEG S.A. ON', tipo: 'AÇÃO', quantidade: '50', precoMedio: '48.50' },
    { id: '3', ticker: 'MXRF11', nome: 'Maxi Renda FII', tipo: 'FII', quantidade: '300', precoMedio: '10.35' },
  ]);

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        ticker: '',
        nome: '',
        tipo: 'AÇÃO',
        quantidade: '',
        precoMedio: '',
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length === 1) return;
    setRows(rows.filter(r => r.id !== id));
  };

  const handleRowChange = (id: string, field: keyof InitialPositionRow, val: string) => {
    setRows(rows.map(row => {
      if (row.id !== id) return row;
      if (field === 'ticker') {
        const clean = val.toUpperCase().trim();
        const detectedTipo: AssetType = clean.endsWith('11') ? 'FII' : 'AÇÃO';
        return {
          ...row,
          ticker: clean,
          tipo: row.tipo === 'AÇÃO' && clean.endsWith('11') ? detectedTipo : row.tipo,
        };
      }
      return { ...row, [field]: val };
    }));
  };

  const totalPatrimonioInicial = rows.reduce((acc, r) => {
    const q = D(r.quantidade || '0');
    const pm = D(r.precoMedio || '0');
    return acc.add(q.mul(pm));
  }, D(0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validRows = rows.filter(r => r.ticker.trim() && D(r.quantidade).gt(0) && D(r.precoMedio).gt(0));
    if (validRows.length === 0) {
      alert('Preencha ao menos um ativo com ticker, quantidade e preço médio válidos.');
      return;
    }

    const operationsToSave: Operation[] = [];
    const assetsToSave: Asset[] = [];

    validRows.forEach((r, idx) => {
      const cleanTicker = r.ticker.toUpperCase().trim();
      const qtd = D(r.quantidade);
      const pm = D(r.precoMedio);
      const totalCusto = qtd.mul(pm);

      const op: Operation = {
        id: `op_init_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`,
        assetId: cleanTicker,
        ticker: cleanTicker,
        tipo: 'OPENING_POSITION',
        dataPregao: dataCorte,
        dataLiquidacao: dataCorte,
        quantidade: toCanonicalString(qtd),
        precoUnitario: toCanonicalString(pm),
        taxasB3: '0',
        corretagem: '0',
        outrosCustos: '0',
        custosTotais: '0',
        valorTotalOperacao: toCanonicalString(totalCusto),
        mercado: cleanTicker.endsWith('F') ? 'FRACIONARIO' : 'VISTA',
        status: 'CONFIRMADA',
        observacoes: `Saldo inicial / Posição de transição migrada (${corretora})`,
        createdUtc: new Date().toISOString(),
      };

      const asset: Asset = {
        id: cleanTicker,
        ticker: cleanTicker,
        nome: r.nome.trim() || cleanTicker,
        tipo: r.tipo,
        moeda: 'BRL',
        mercado: 'B3',
        pais: 'BR',
        cnpj: '',
      };

      operationsToSave.push(op);
      assetsToSave.push(asset);
    });

    onSaveBatch(operationsToSave, assetsToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Cadastrar Posição Inicial / Saldo de Transição
              </h2>
              <p className="text-xs text-slate-500">
                Migre sua carteira existente em 2 minutos sem precisar digitar anos de notas antigas
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Informações Gerais de Corte */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Data Base de Corte (Início do Controle)
              </label>
              <input
                type="date"
                value={dataCorte}
                onChange={e => setDataCorte(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Geralmente o último dia do ano anterior (ex: 31/12/2023) ou o início deste mês.
              </span>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Corretora de Origem
              </label>
              <input
                type="text"
                value={corretora}
                onChange={e => setCorretora(e.target.value)}
                placeholder="Ex: Toro CTVM, XP, Clear, BTG"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Tabela de Posições a Importar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Ativos e Preço Médio Acumulado ({rows.length})
              </span>
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Mais Ativo</span>
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-500 font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-2.5">Ticker</th>
                    <th className="p-2.5">Nome / Empresa</th>
                    <th className="p-2.5">Classe</th>
                    <th className="p-2.5 text-right">Qtd</th>
                    <th className="p-2.5 text-right">Preço Médio (R$)</th>
                    <th className="p-2.5 text-right">Custo Total</th>
                    <th className="p-2.5 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {rows.map(row => {
                    const custo = D(row.quantidade || '0').mul(D(row.precoMedio || '0'));
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.ticker}
                            onChange={e => handleRowChange(row.id, 'ticker', e.target.value)}
                            placeholder="PETR4"
                            className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold uppercase text-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="p-2 font-sans">
                          <input
                            type="text"
                            value={row.nome}
                            onChange={e => handleRowChange(row.id, 'nome', e.target.value)}
                            placeholder="Petrobras PN"
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="p-2 font-sans">
                          <select
                            value={row.tipo}
                            onChange={e => handleRowChange(row.id, 'tipo', e.target.value)}
                            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white cursor-pointer"
                          >
                            <option value="AÇÃO">Ação</option>
                            <option value="FII">FII</option>
                            <option value="ETF">ETF</option>
                            <option value="BDR">BDR</option>
                            <option value="RENDA_FIXA">Renda Fixa</option>
                          </select>
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="text"
                            value={row.quantidade}
                            onChange={e => handleRowChange(row.id, 'quantidade', e.target.value)}
                            placeholder="100"
                            className="w-20 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-right font-mono text-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="text"
                            value={row.precoMedio}
                            onChange={e => handleRowChange(row.id, 'precoMedio', e.target.value)}
                            placeholder="34.50"
                            className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-right font-mono text-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="p-2 text-right font-bold text-slate-700 dark:text-slate-300">
                          {formatBRL(custo)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            disabled={rows.length === 1}
                            className="text-slate-400 hover:text-red-500 disabled:opacity-30 cursor-pointer p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumo do Total Inicial */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
            <div>
              <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold block">
                Total de Patrimônio Inicial Migrado:
              </span>
              <span className="text-[11px] text-slate-500">
                Será lançado com custo histórico exato, sem taxas adicionais de corretagem.
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-blue-700 dark:text-blue-300">
                {formatBRL(totalPatrimonioInicial)}
              </span>
            </div>
          </div>

          {/* Ações */}
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar e Importar Posição Inicial</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
