import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  Trash2, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  ChevronRight,
  Calculator,
  X
} from 'lucide-react';
import { Goal } from '../../types';
import { 
  calculateRequiredMonthlyContribution, 
  generateGoalProjections, 
  GoalMonthProjection 
} from '../../engine/goals';
import { formatBRL, formatPercent, toCanonicalString, D } from '../../engine/decimal';

interface GoalsViewProps {
  goals: Goal[];
  currentPatrimony: string;
  onSaveGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  currentPatrimony,
  onSaveGoal,
  onDeleteGoal,
}) => {
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(goals[0] || null);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  useEffect(() => {
    if (!selectedGoal && goals.length > 0) {
      setSelectedGoal(goals[0]);
    } else if (selectedGoal && !goals.some(g => g.id === selectedGoal.id)) {
      setSelectedGoal(goals[0] || null);
    }
  }, [goals, selectedGoal]);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<Goal['categoria']>('APOSENTADORIA');
  const [newTargetValue, setNewTargetValue] = useState('500000.00');
  const [newTargetDate, setNewTargetDate] = useState('2030-12-31');
  const [newRateAa, setNewRateAa] = useState('8.5');

  // Gerar projeções para a meta selecionada
  const projections: GoalMonthProjection[] = selectedGoal
    ? generateGoalProjections(selectedGoal, currentPatrimony, 60)
    : [];

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const hoje = new Date();
    const alvo = new Date(newTargetDate);
    const meses = Math.max((alvo.getFullYear() - hoje.getFullYear()) * 12 + (alvo.getMonth() - hoje.getMonth()), 1);

    const pmt = calculateRequiredMonthlyContribution(
      newTargetValue,
      currentPatrimony,
      meses,
      newRateAa
    );

    const goal: Goal = {
      id: `goal_${Date.now()}`,
      titulo: newTitle || 'Minha Meta Patrimonial',
      categoria: newCategory,
      valorAlvo: newTargetValue,
      dataAlvo: newTargetDate,
      taxaEsperadaAa: newRateAa,
      valorInicial: currentPatrimony,
      aporteMensalEstimado: pmt,
      status: 'EM_ANDAMENTO',
    };

    onSaveGoal(goal);
    setSelectedGoal(goal);
    setIsCreatingGoal(false);
    setNewTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span>Metas Patrimoniais & Modelagem Financeira (PMT)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cálculo determinístico com juros compostos canônicos e projeção 1→N
          </p>
        </div>

        <button
          onClick={() => setIsCreatingGoal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Meta</span>
        </button>
      </div>

      {/* Grid: Lista de Metas + Detalhes/Projeção */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Cartões das Metas */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Metas Cadastradas ({goals.length})
          </h3>

          {goals.map(goal => {
            const isSelected = selectedGoal?.id === goal.id;
            const fv = D(goal.valorAlvo);
            const pv = D(currentPatrimony);
            const pct = fv.gt(0) ? pv.div(fv).mul(100).toNumber() : 0;
            const clampedPct = Math.min(Math.max(pct, 0), 100);

            return (
              <div
                key={goal.id}
                onClick={() => setSelectedGoal(goal)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {goal.categoria}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                      {goal.titulo}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setGoalToDelete(goal);
                    }}
                    className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="Excluir meta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Alvo:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono-numbers">
                    {formatBRL(goal.valorAlvo)}
                  </span>
                </div>

                <div className="mt-2">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Progresso</span>
                    <span className="font-bold text-blue-600 font-mono-numbers">{clampedPct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div style={{ width: `${clampedPct}%` }} className="h-full bg-blue-600 rounded-full" />
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Aporte Sugerido:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 font-mono-numbers">
                    {formatBRL(goal.aporteMensalEstimado)}/mês
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Coluna 2 e 3: Detalhes e Tabela de Projeção Mensal 1->N */}
        <div className="lg:col-span-2 space-y-6">
          {selectedGoal ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedGoal.titulo}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data Limite: {selectedGoal.dataAlvo} • Taxa Estimada: {selectedGoal.taxaEsperadaAa}% a.a.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-right">
                  <span className="text-[11px] text-blue-600 dark:text-blue-300 font-semibold block">Aporte Mensal (PMT)</span>
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-200 font-mono-numbers">
                    {formatBRL(selectedGoal.aporteMensalEstimado)}
                  </span>
                </div>
              </div>

              {/* Tabela de Projeção Mensal 1 -> N */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Projeção Mensal de Acúmulo e Juros Compostos (1→N)</span>
                </h4>

                <div className="overflow-x-auto max-h-96 -mx-6 px-6 sm:mx-0 sm:px-0">
                  <table className="w-full text-left text-xs min-w-[650px] border-collapse">
                    <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold whitespace-nowrap text-[11px] bg-slate-50/50 dark:bg-slate-800/40">
                        <th className="px-4 py-3 text-left">Mês</th>
                        <th className="px-4 py-3 text-right">Saldo Inicial</th>
                        <th className="px-4 py-3 text-right">Rendimento (+Juros)</th>
                        <th className="px-4 py-3 text-right">Aporte (+PMT)</th>
                        <th className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">Saldo Projetado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {projections.map(p => (
                        <tr key={p.mesIndice} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 whitespace-nowrap">
                          <td className="px-4 py-3 text-left font-sans">
                            <span className="font-bold text-slate-900 dark:text-white font-mono">Mês {p.mesIndice}</span>
                            <span className="text-[11px] text-slate-400 font-mono ml-2">({p.dataPrevista})</span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono-numbers tabular-nums text-slate-700 dark:text-slate-300 font-medium">
                            {formatBRL(p.saldoInicial)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono-numbers tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                            +{formatBRL(p.rendimentoMes)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono-numbers tabular-nums text-blue-600 dark:text-blue-400 font-semibold">
                            +{formatBRL(p.aporteMes)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono-numbers tabular-nums font-bold text-slate-900 dark:text-white">
                            {formatBRL(p.saldoFinal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              Selecione uma meta ao lado para visualizar o cronograma determinístico de amortização e aportes.
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação de Meta */}
      {isCreatingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Definir Nova Meta Financeira
              </h3>
              <button
                onClick={() => setIsCreatingGoal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título da Meta
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="ex: R$ 1 Milhão em Fundos Imobiliários"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Categoria
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="APOSENTADORIA">Aposentadoria / Liberdade Financeira</option>
                  <option value="RESERVA">Reserva de Emergência / Oportunidade</option>
                  <option value="PATRIMONIO_GLOBAL">Patrimônio Global</option>
                  <option value="RENDA_PASSIVA">Renda Passiva Mensal</option>
                  <option value="OUTRO">Outro Objetivo</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valor Alvo (R$)
                  </label>
                  <input
                    type="text"
                    required
                    value={newTargetValue}
                    onChange={e => setNewTargetValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Taxa Anual Estimada (%)
                  </label>
                  <input
                    type="text"
                    required
                    value={newRateAa}
                    onChange={e => setNewRateAa(e.target.value)}
                    placeholder="8.5"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Data Limite Prevista
                </label>
                <input
                  type="date"
                  required
                  value={newTargetDate}
                  onChange={e => setNewTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingGoal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  Calcular PMT & Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Meta */}
      {goalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Excluir Meta
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tem certeza que deseja remover esta meta patrimonial?
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                {goalToDelete.titulo}
              </span>
              <span className="text-slate-500 mt-0.5 block">
                Alvo: {formatBRL(goalToDelete.valorAlvo)} • Limite: {goalToDelete.dataAlvo}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setGoalToDelete(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteGoal(goalToDelete.id);
                  if (selectedGoal?.id === goalToDelete.id) {
                    setSelectedGoal(null);
                  }
                  setGoalToDelete(null);
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
