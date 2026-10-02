/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Lock, 
  KeyRound, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  User, 
  ShieldCheck, 
  ArrowLeft 
} from 'lucide-react';
import { sha256 } from '../../engine/crypto';
import { HermasDB } from '../../storage/db';
import { UserProfile } from '../../types';
import { HermasLogoIcon } from '../brand/HermasLogo';
import { validateMnemonicWordCount } from '../../engine/mnemonic';

interface VaultLockScreenProps {
  onUnlock: () => void;
  userProfile?: UserProfile;
}

export const VaultLockScreen: React.FC<VaultLockScreenProps> = ({ onUnlock, userProfile }) => {
  const settings = useMemo(() => HermasDB.getSettings(), []);
  const isFirstSetup = settings.vaultKeyCheck === 'hermas_master_key_check_hash';

  // Caixinha para lembrar o titular: marcada por padrão
  const [rememberUser, setRememberUser] = useState<boolean>(() => {
    const stored = localStorage.getItem('hermas_remember_user');
    return stored !== null ? stored === 'true' : true;
  });

  // Campo do nome do usuário / titular: se salvo, preenche; senão, permite preencher
  const [nome, setNome] = useState<string>(() => {
    const savedName = localStorage.getItem('hermas_saved_username');
    if (savedName) return savedName;
    return userProfile?.nome || '';
  });

  // Estados do formulário de acesso
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Modo de recuperação de emergência
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');

  const currentAvatarUrl = userProfile?.avatarUrl;

  // Ação principal de Entrar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanNome = nome.trim();
    if (!cleanNome) {
      setErrorMsg('Por favor, preencha o nome do usuário.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Por favor, digite sua senha.');
      return;
    }

    setIsProcessing(true);

    try {
      const currentSettings = HermasDB.getSettings();

      if (isFirstSetup) {
        // Primeiro acesso: registra a chave mestra com salt
        const randomSaltBytes = new Uint8Array(16);
        crypto.getRandomValues(randomSaltBytes);
        const uniqueSaltHex = Array.from(randomSaltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const masterHash = await sha256(password + uniqueSaltHex);

        currentSettings.vaultSalt = uniqueSaltHex;
        currentSettings.vaultKeyCheck = masterHash;
        HermasDB.saveSettings(currentSettings);

        HermasDB.logAudit('SETUP_SENHA', 'Security', `Senha configurada para o titular ${cleanNome}.`);
      } else {
        // Validação da senha mestra com SHA-256
        const hash = await sha256(password + currentSettings.vaultSalt);
        if (hash !== currentSettings.vaultKeyCheck) {
          setErrorMsg('Senha incorreta. Tente novamente.');
          setIsProcessing(false);
          return;
        }
        HermasDB.logAudit('LOGIN_SUCESSO', 'Security', `Desbloqueio autenticado para ${cleanNome}.`);
      }

      // Atualiza o perfil do usuário com o nome informado
      const profile = HermasDB.getUserProfile();
      profile.nome = cleanNome;
      const parts = cleanNome.split(' ');
      profile.avatarIniciais = parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : cleanNome.slice(0, 2).toUpperCase();
      HermasDB.saveUserProfile(profile);

      // Tratamento da caixinha "Lembrar nome do titular"
      if (rememberUser) {
        localStorage.setItem('hermas_remember_user', 'true');
        localStorage.setItem('hermas_saved_username', cleanNome);
      } else {
        localStorage.setItem('hermas_remember_user', 'false');
        localStorage.removeItem('hermas_saved_username');
      }

      sessionStorage.setItem('hermas_session_unlocked', 'true');
      setIsProcessing(false);
      onUnlock();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Falha ao autenticar no cofre.');
      setIsProcessing(false);
    }
  };

  // Recuperação de emergência por frase de 24 palavras
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validateMnemonicWordCount(recoveryPhrase)) {
      setErrorMsg('A frase de recuperação deve conter 24 palavras separadas por espaço.');
      return;
    }

    if (newMasterPassword.length < 6) {
      setErrorMsg('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsProcessing(true);

    try {
      const currentSettings = HermasDB.getSettings();
      const normalizedWords = recoveryPhrase.trim().toLowerCase().split(/\s+/).filter(Boolean).join(' ');
      const testHash = await sha256(normalizedWords + currentSettings.vaultSalt);

      if (currentSettings.vaultRecoveryHash && testHash !== currentSettings.vaultRecoveryHash) {
        setErrorMsg('Frase de recuperação inválida para este cofre.');
        setIsProcessing(false);
        return;
      }

      const newHash = await sha256(newMasterPassword + currentSettings.vaultSalt);
      currentSettings.vaultKeyCheck = newHash;
      HermasDB.saveSettings(currentSettings);

      sessionStorage.setItem('hermas_session_unlocked', 'true');
      HermasDB.logAudit('RECUPERACAO_SENHA', 'Security', 'Senha redefinida com sucesso.');
      setIsProcessing(false);
      onUnlock();
    } catch {
      setErrorMsg('Erro ao processar recuperação.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-sm my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 p-6 text-white text-center relative overflow-hidden">
          <div className="relative mx-auto mb-3 flex items-center justify-center">
            {currentAvatarUrl && nome ? (
              <div className="relative w-16 h-16 rounded-full overflow-hidden ring-4 ring-white/30 shadow-lg bg-slate-800">
                <img 
                  src={currentAvatarUrl} 
                  alt={nome || 'Avatar'} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-blue-700" />
              </div>
            ) : (
              <HermasLogoIcon sizeClassName="w-14 h-14" className="rounded-2xl ring-4 ring-white/25 shadow-lg p-2.5" />
            )}
          </div>

          <h1 className="text-xl font-bold tracking-tight">
            {nome.trim() ? nome.trim() : 'Hermas — Patrimônio Pessoal'}
          </h1>
          <p className="text-xs text-blue-100/90 mt-1">
            Cofre financeiro local-first, determinístico e privado
          </p>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isRecoveryMode ? (
            /* Formulário Principal: Nome do Usuário + Senha + Lembrar Titular + Entrar */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. Campo para preencher o nome do usuário / titular */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome do Usuário / Titular da Conta
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Digite o nome do titular"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* 2. Campo para digitar a senha */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 3. Caixinha para deixar marcada para lembrar o nome do titular da conta */}
              <div className="pt-0.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberUser}
                    onChange={e => setRememberUser(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:bg-slate-800 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Lembrar o nome do titular da conta
                  </span>
                </label>
              </div>

              {/* 4. Botão de entrar */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 text-white text-sm font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{isProcessing ? 'Entrando...' : 'Entrar'}</span>
              </button>

              {/* Opção discreta de recuperação */}
              {!isFirstSetup && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecoveryMode(true);
                      setErrorMsg('');
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              )}
            </form>
          ) : (
            /* Modo de Recuperação */
            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecoveryMode(false);
                    setErrorMsg('');
                  }}
                  className="p-1 -ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                  Recuperar Acesso ao Cofre
                </h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Frase de 24 Palavras:
                </label>
                <textarea
                  rows={3}
                  required
                  value={recoveryPhrase}
                  onChange={e => setRecoveryPhrase(e.target.value)}
                  placeholder="24 palavras separadas por espaço..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nova Senha:
                </label>
                <input
                  type="password"
                  required
                  value={newMasterPassword}
                  onChange={e => setNewMasterPassword(e.target.value)}
                  placeholder="Nova senha"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isProcessing ? 'Validando...' : 'Redefinir e Entrar'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
