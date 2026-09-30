/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Moon,
  Sun,
  Monitor,
  Clock,
  Key,
  Database,
  Trash2,
  RefreshCw,
  Sparkles,
  User,
  Scale,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  X,
} from 'lucide-react';
import { SystemSettings, UserProfile } from '../../types';

interface SettingsViewProps {
  settings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => void;
  onResetVault: () => void;
  onClearDemoData: () => void;
  onOpenManifesto: () => void;
  userProfile: UserProfile;
  onOpenUserProfile: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetVault,
  onClearDemoData,
  onOpenManifesto,
  userProfile,
  onOpenUserProfile,
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [showClearDemoConfirm, setShowClearDemoConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  // Aplica o tema imediatamente ao clicar
  const handleSelectTheme = (newTheme: 'escuro' | 'claro' | 'sistema') => {
    const root = document.documentElement;
    const body = document.body;
    
    // Aplicação imediata no DOM para resposta instantânea
    if (newTheme === 'escuro') {
      root.classList.add('dark');
      body.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else if (newTheme === 'claro') {
      root.classList.remove('dark');
      body.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
        body.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
    }

    const updated: SystemSettings = { ...formData, theme: newTheme };
    setFormData(updated);
    onUpdateSettings(updated);

    const themeLabels = { escuro: 'Modo Escuro ativado', claro: 'Modo Claro ativado', sistema: 'Tema do Sistema ativado' };
    setActionFeedback(themeLabels[newTheme]);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Aplica o tempo de bloqueio imediatamente ao selecionar
  const handleLockTimeoutChange = (newTimeoutMinutes: number) => {
    const updated: SystemSettings = { ...formData, lockTimeoutMinutes: newTimeoutMinutes };
    setFormData(updated);
    onUpdateSettings(updated);

    const feedbackText = newTimeoutMinutes === 0
      ? 'Bloqueio automático por inatividade desativado!'
      : `Bloqueio por inatividade definido para ${newTimeoutMinutes === 60 ? '1 hora' : newTimeoutMinutes + ' minutos'}!`;
    setActionFeedback(feedbackText);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExecuteClearDemo = () => {
    onClearDemoData();
    setShowClearDemoConfirm(false);
    setActionFeedback('Dados de demonstração removidos com sucesso! O cofre agora está limpo e zerado.');
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const handleExecuteResetVault = () => {
    onResetVault();
    setShowResetConfirm(false);
    setActionFeedback('Cofre redefinido para as configurações e dados de demonstração originais.');
    setTimeout(() => setActionFeedback(null), 5000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-500" />
            <span>Configurações & Parâmetros do Cofre</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personalize a segurança de bloqueio, chaves de API para cotações e parâmetros tributários.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-4 h-4" />
            <span>Configurações salvas!</span>
          </div>
        )}

        {actionFeedback && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}
      </div>

      {/* Perfil do Titular */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900">
            {userProfile.avatarUrl ? (
              <img src={userProfile.avatarUrl} alt={userProfile.nome} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-emerald-600 text-white font-bold flex items-center justify-center text-lg">
                {userProfile.avatarIniciais || 'H'}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {userProfile.nome}
            </h3>
            <p className="text-xs text-slate-400">
              {userProfile.email || 'Investidor Titular'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenUserProfile}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
        >
          Editar Perfil
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Aparência & Tema */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Moon className="w-4 h-4 text-emerald-500" />
            <span>Aparência e Tema</span>
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'escuro', label: 'Escuro', icon: Moon },
              { id: 'claro', label: 'Claro', icon: Sun },
              { id: 'sistema', label: 'Sistema', icon: Monitor },
            ].map(item => {
              const isSelected = formData.theme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTheme(item.id as any)}
                  className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/80 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  <div className="flex items-center gap-1">
                    <span>{item.label}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Segurança & Bloqueio */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Segurança e Inatividade</span>
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {formData.lockTimeoutMinutes === 0
                ? 'Bloqueio Desativado'
                : `Bloqueio: ${formData.lockTimeoutMinutes === 60 ? '1 hora' : formData.lockTimeoutMinutes + ' min'}`}
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tempo para bloqueio automático por inatividade
            </label>
            <select
              value={formData.lockTimeoutMinutes}
              onChange={e => handleLockTimeoutChange(parseInt(e.target.value, 10))}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="5">5 minutos</option>
              <option value="15">15 minutos (recomendado)</option>
              <option value="30">30 minutos</option>
              <option value="60">1 hora</option>
              <option value="0">Desativar bloqueio automático</option>
            </select>
          </div>
        </div>

        {/* Cotações & Brapi API */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-500" />
            <span>Cotações de Mercado (Brapi.dev)</span>
          </h3>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Token de API Brapi (opcional para aumentar limites)
            </label>
            <input
              type="text"
              placeholder="Cole seu token do brapi.dev aqui"
              value={formData.brapiApiKey || ''}
              onChange={e => setFormData({ ...formData, brapiApiKey: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Saldo de Prejuízos Anteriores a Compensar */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>Saldos de Prejuízos Anteriores a Compensar</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500">Ações Swing Trade (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.prejuizoAcumuladoAcoesSwingAnterior || '0'}
                onChange={e => setFormData({ ...formData, prejuizoAcumuladoAcoesSwingAnterior: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500">Day Trade (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.prejuizoAcumuladoDayTradeAnterior || '0'}
                onChange={e => setFormData({ ...formData, prejuizoAcumuladoDayTradeAnterior: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500">FIIs (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.prejuizoAcumuladoFiiAnterior || '0'}
                onChange={e => setFormData({ ...formData, prejuizoAcumuladoFiiAnterior: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          Salvar Todas as Configurações
        </button>
      </form>

      {/* Zona de Perigo / Manutenção */}
      <div className="p-6 rounded-3xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 space-y-4">
        <h3 className="font-bold text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
          <Database className="w-4 h-4" />
          <span>Manutenção do Banco de Dados Local</span>
        </h3>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowClearDemoConfirm(true)}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span>Limpar Dados de Demonstração</span>
          </button>
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Redefinir Cofre (Reset Completo)</span>
          </button>
          <button
            type="button"
            onClick={onOpenManifesto}
            className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Ver Manifesto Hermas</span>
          </button>
        </div>
      </div>

      {/* Modal de Confirmação: Limpar Demonstração */}
      {showClearDemoConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Limpar Dados de Demonstração
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ação reversível via reset do cofre
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClearDemoConfirm(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Deseja remover todas as <strong>operações fictícias</strong> (PETR4, WEGE3, MXRF11, etc.), proventos e notas de exemplo? 
              <br /><br />
              Sua carteira ficará totalmente limpa e zerada, pronta para você importar suas <strong>notas de corretagem em PDF</strong> ou cadastrar suas operações reais.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearDemoConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteClearDemo}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Limpar Demonstração</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação: Reset Completo */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-red-600 dark:text-red-400">
                    Redefinir Todo o Cofre
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ação destrutiva
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Esta ação apagará todo o armazenamento local do navegador e restaurará o estado inicial de fábrica com os dados de exemplo padrão. Deseja continuar?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteResetVault}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sim, Redefinir Cofre</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
