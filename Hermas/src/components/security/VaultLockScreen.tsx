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
  Check, 
  Key, 
  Copy
} from 'lucide-react';
import { sha256 } from '../../engine/crypto';
import { HermasDB } from '../../storage/db';
import { UserProfile } from '../../types';
import { HermasLogoIcon } from '../brand/HermasLogo';
import { generateSecure24Words, validateMnemonicWordCount } from '../../engine/mnemonic';

interface VaultLockScreenProps {
  onUnlock: () => void;
  userProfile?: UserProfile;
}

export const VaultLockScreen: React.FC<VaultLockScreenProps> = ({ onUnlock, userProfile }) => {
  const settings = useMemo(() => HermasDB.getSettings(), []);
  const isFirstSetup = settings.vaultKeyCheck === 'hermas_master_key_check_hash';

  const isRemembered = localStorage.getItem('hermas_remember_user') === 'true';
  const savedName = localStorage.getItem('hermas_saved_username') || '';

  const [nome, setNome] = useState(() => {
    if (isRemembered && savedName) return savedName;
    return userProfile?.nome || 'Orlando Atanásio';
  });
  const [rememberUser, setRememberUser] = useState(isRemembered);

  // Estados de formulário
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Frase mnemônica gerada para primeiro setup
  const [setupMnemonic] = useState<string[]>(() => generateSecure24Words());
  const [copiedMnemonic, setCopiedMnemonic] = useState(false);
  const [mnemonicAcknowledged, setMnemonicAcknowledged] = useState(false);

  const currentAvatarUrl = userProfile?.avatarUrl;

  // Primeiro Acesso: Configuração da Chave Mestra Inicial
  const handleInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nome.trim()) {
      setErrorMsg('Por favor, informe seu nome.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('A senha mestra deve ter no mínimo 8 caracteres para proteção do cofre.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('A confirmação da senha não confere com a senha digitada.');
      return;
    }

    if (!mnemonicAcknowledged) {
      setErrorMsg('Confirme que você copiou ou anotou sua Frase de Recuperação de 24 palavras.');
      return;
    }

    setIsProcessing(true);

    try {
      const randomSaltBytes = new Uint8Array(16);
      crypto.getRandomValues(randomSaltBytes);
      const uniqueSaltHex = Array.from(randomSaltBytes).map(b => b.toString(16).padStart(2, '0')).join('');

      const masterHash = await sha256(password + uniqueSaltHex);

      const mnemonicClean = setupMnemonic.join(' ').trim().toLowerCase();
      const recoveryHash = await sha256(mnemonicClean + uniqueSaltHex);

      const currentSettings = HermasDB.getSettings();
      currentSettings.vaultSalt = uniqueSaltHex;
      currentSettings.vaultKeyCheck = masterHash;
      currentSettings.vaultRecoveryHash = recoveryHash;
      HermasDB.saveSettings(currentSettings);

      if (rememberUser) {
        localStorage.setItem('hermas_remember_user', 'true');
        localStorage.setItem('hermas_saved_username', nome.trim());
      }

      sessionStorage.setItem('hermas_session_unlocked', 'true');
      HermasDB.logAudit('SETUP_COFRE', 'Security', `Chave mestra inicial configurada por ${nome.trim()}.`);

      setIsProcessing(false);
      onUnlock();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao inicializar o cofre seguro.');
      setIsProcessing(false);
    }
  };

  // Desbloqueio Normal com Senha Mestra
  const handleUnlockWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password.trim()) {
      setErrorMsg('Informe a senha do cofre.');
      return;
    }

    setIsProcessing(true);

    try {
      const currentSettings = HermasDB.getSettings();
      const hash = await sha256(password + currentSettings.vaultSalt);

      if (hash !== currentSettings.vaultKeyCheck) {
        setErrorMsg('Senha incorreta. Tente novamente ou use a frase de recuperação de 24 palavras.');
        setIsProcessing(false);
        return;
      }

      if (rememberUser) {
        localStorage.setItem('hermas_remember_user', 'true');
        localStorage.setItem('hermas_saved_username', nome.trim());
      } else {
        localStorage.removeItem('hermas_remember_user');
        localStorage.removeItem('hermas_saved_username');
      }

      sessionStorage.setItem('hermas_session_unlocked', 'true');
      HermasDB.logAudit('LOGIN_SUCESSO', 'Security', `Desbloqueio autenticado para ${nome.trim()}.`);

      setIsProcessing(false);
      onUnlock();
    } catch {
      setErrorMsg('Falha ao autenticar.');
      setIsProcessing(false);
    }
  };

  // Recuperação com Frase Mnemônica de 24 Palavras
  const handleUnlockWithRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validateMnemonicWordCount(recoveryPhrase)) {
      setErrorMsg('A frase de recuperação deve conter exatamente 24 palavras separadas por espaço.');
      return;
    }

    if (newMasterPassword.length < 8) {
      setErrorMsg('Defina uma nova senha mestra com pelo menos 8 caracteres.');
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
      HermasDB.logAudit('RECUPERACAO_BIP39', 'Security', 'Senha mestra redefinida com sucesso via frase mnemônica.');
      setIsProcessing(false);
      onUnlock();
    } catch {
      setErrorMsg('Erro ao processar recuperação.');
      setIsProcessing(false);
    }
  };

  const handleCopyMnemonic = () => {
    navigator.clipboard.writeText(setupMnemonic.join(' '));
    setCopiedMnemonic(true);
    setTimeout(() => setCopiedMnemonic(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-250">
        
        {/* Cabeçalho */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 p-6 sm:p-7 text-white text-center relative overflow-hidden">
          <div className="relative mx-auto mb-3 flex items-center justify-center">
            {currentAvatarUrl ? (
              <div className="relative w-16 h-16 rounded-full overflow-hidden ring-4 ring-white/30 shadow-lg bg-slate-800">
                <img 
                  src={currentAvatarUrl} 
                  alt={nome || 'Avatar'} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-blue-700" />
              </div>
            ) : (
              <HermasLogoIcon sizeClassName="w-16 h-16" className="rounded-2xl ring-4 ring-white/25 shadow-lg p-2.5" />
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {isFirstSetup ? 'Configuração Inicial do Cofre' : 'Hermas — Patrimônio Pessoal'}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-xs mx-auto leading-relaxed">
            {isFirstSetup 
              ? 'Defina sua senha mestra pessoal e guarde sua chave de recuperação'
              : 'Cofre financeiro local-first, determinístico e privado'}
          </p>

          <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/40 border border-blue-400/25 text-[11px] font-medium text-blue-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Criptografia SHA-256 no Dispositivo</span>
          </div>
        </div>

        {/* Formulários */}
        <div className="p-6 sm:p-7">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* MODO 1: PRIMEIRO SETUP */}
          {isFirstSetup ? (
            <form onSubmit={handleInitialSetup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Seu Nome / Titular
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Criar Senha Mestra (mínimo 8 caracteres)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirmar Senha Mestra
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Frase Mnemônica de 24 Palavras para Backup */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    <span>Frase de Recuperação (24 Palavras):</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyMnemonic}
                    className="px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedMnemonic ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedMnemonic ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1 p-2 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/40 text-[10px] font-mono text-slate-700 dark:text-slate-300 select-all">
                  {setupMnemonic.map((word, idx) => (
                    <span key={idx} className="truncate">
                      <span className="text-slate-400">{idx + 1}.</span> {word}
                    </span>
                  ))}
                </div>

                <label className="flex items-start gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mnemonicAcknowledged}
                    onChange={e => setMnemonicAcknowledged(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-amber-900 dark:text-amber-200 font-medium leading-tight">
                    Anotei ou copiei as 24 palavras em local seguro. Entendo que o Hermas não armazena senhas em servidores.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isProcessing || !mnemonicAcknowledged}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isProcessing ? 'Criptografando...' : 'Criar Cofre e Desbloquear'}</span>
              </button>
            </form>
          ) : !isRecoveryMode ? (
            /* MODO 2: LOGIN NORMAL */
            <form onSubmit={handleUnlockWithPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Titular do Cofre
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Senha Mestra do Cofre
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberUser}
                    onChange={e => setRememberUser(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-600 dark:text-slate-400">Lembrar titular</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setIsRecoveryMode(true);
                    setErrorMsg('');
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                >
                  Recuperar cofre
                </button>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{isProcessing ? 'Verificando...' : 'Desbloquear Cofre'}</span>
              </button>
            </form>
          ) : (
            /* MODO 3: RECUPERAÇÃO VIA 24 PALAVRAS */
            <form onSubmit={handleUnlockWithRecovery} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <strong className="text-blue-900 dark:text-blue-200 block font-bold">
                  Recuperação Criptográfica do Cofre
                </strong>
                <p className="text-[11px] leading-relaxed">
                  Digite as 24 palavras da sua frase mnemônica e defina uma nova senha mestra pessoal.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Frase de 24 Palavras:
                </label>
                <textarea
                  rows={3}
                  value={recoveryPhrase}
                  onChange={e => setRecoveryPhrase(e.target.value)}
                  placeholder="ex: abandon ability able about above absent..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nova Senha Mestra (mínimo 8 caracteres):
                </label>
                <input
                  type="password"
                  required
                  value={newMasterPassword}
                  onChange={e => setNewMasterPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecoveryMode(false);
                    setErrorMsg('');
                  }}
                  className="text-xs text-slate-500 hover:underline cursor-pointer"
                >
                  Voltar para login com senha
                </button>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {isProcessing ? 'Validando...' : 'Redefinir e Desbloquear'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
