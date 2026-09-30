import React, { useState, useRef } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  ShieldCheck, 
  Camera, 
  Trash2, 
  Check, 
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Upload,
  Loader2,
  LogOut
} from 'lucide-react';
import { UserProfile } from '../../types';
import { AVATAR_PRESETS } from '../../storage/db';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onLogout?: () => void;
}

const COLOR_OPTIONS = [
  { label: 'Azul Real', value: '#2563eb' },
  { label: 'Índigo Profundo', value: '#4f46e5' },
  { label: 'Esmeralda', value: '#059669' },
  { label: 'Grafite', value: '#334155' },
  { label: 'Ametista', value: '#7c3aed' },
  { label: 'Âmbar Dourado', value: '#d97706' },
];

/**
 * Processa e redimensiona qualquer foto (mesmo de 10MB ou 20MB de câmeras modernas)
 * gerando um avatar quadrado centralizado em JPEG leve (~30KB), evitando quotas do localStorage.
 */
function processAndResizeAvatar(file: File, maxDimension = 320, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler arquivo da foto'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagem não reconhecido'));
      img.onload = () => {
        try {
          const minSide = Math.min(img.width, img.height);
          const startX = (img.width - minSide) / 2;
          const startY = (img.height - minSide) / 2;

          const canvas = document.createElement('canvas');
          const targetSize = Math.min(minSide, maxDimension);
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(typeof reader.result === 'string' ? reader.result : '');
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(
            img,
            startX,
            startY,
            minSide,
            minSide,
            0,
            0,
            targetSize,
            targetSize
          );

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch {
          resolve(typeof reader.result === 'string' ? reader.result : '');
        }
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      } else {
        reject(new Error('Falha ao processar arquivo'));
      }
    };
    reader.readAsDataURL(file);
  });
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onLogout,
}) => {
  const [formData, setFormData] = useState<UserProfile>({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nome = e.target.value;
    const iniciais = nome
      .split(' ')
      .map(w => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'IH';

    setFormData(prev => ({
      ...prev,
      nome,
      avatarIniciais: iniciais,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsProcessingImage(true);

    try {
      // Processa e redimensiona qualquer tamanho de foto de forma fluida
      const resizedDataUrl = await processAndResizeAvatar(file);
      setFormData(prev => ({
        ...prev,
        avatarUrl: resizedDataUrl,
        avatarPresetId: undefined,
      }));
    } catch (err: any) {
      console.error('Erro no upload de foto:', err);
      setUploadError(err.message || 'Não foi possível carregar a imagem. Tente outro formato.');
    } finally {
      setIsProcessingImage(false);
      // Reset input para permitir selecionar a mesma foto novamente se desejar
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleSelectPreset = (preset: { id: string; url: string }) => {
    setFormData(prev => ({
      ...prev,
      avatarUrl: preset.url,
      avatarPresetId: preset.id,
    }));
  };

  const handleUseInitials = () => {
    setFormData(prev => ({
      ...prev,
      avatarUrl: undefined,
      avatarPresetId: undefined,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog (Slide up on mobile, dialog on desktop) */}
      <div className="relative w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col z-10 animate-in slide-in-from-bottom-6 sm:fade-in sm:zoom-in-95 duration-200 overflow-hidden">
        
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Perfil do Investidor
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Identidade patrimonial e dados cadastrais no cofre
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Seção 1: Avatar e Foto de Perfil */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            {/* Visualização Atual do Avatar - Toque direto para trocar */}
            <div className="relative group shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Toque para escolher uma foto da galeria ou câmera"
                className="w-20 h-20 rounded-full ring-4 ring-white dark:ring-slate-900 shadow-md overflow-hidden flex items-center justify-center text-white font-bold text-2xl tracking-wider select-none relative cursor-pointer group hover:scale-102 transition-transform"
                style={{ backgroundColor: formData.avatarUrl ? undefined : (formData.avatarCor || '#2563eb') }}
              >
                {isProcessingImage ? (
                  <div className="flex flex-col items-center justify-center gap-1 text-white">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-[9px] font-medium tracking-normal">Ajustando</span>
                  </div>
                ) : formData.avatarUrl ? (
                  <img 
                    src={formData.avatarUrl} 
                    alt={formData.nome || 'Avatar'} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{formData.avatarIniciais || 'IH'}</span>
                )}

                {/* Overlay hover sutil */}
                {!isProcessingImage && (
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <Camera className="w-5 h-5 drop-shadow-md" />
                  </div>
                )}
              </button>

              {/* Botão de Câmera Rápido no Canto */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Escolher foto"
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-transform active:scale-95 cursor-pointer ring-2 ring-white dark:ring-slate-900"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,image/jpeg,image/png,image/webp,image/heic,image/gif"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Controles de Avatar */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Avatar do Titular
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Aceita qualquer foto do seu celular ou galeria (ajuste e centralização automáticos).
              </p>

              {/* Botão principal de seleção de foto */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isProcessingImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processando imagem...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Escolher Foto do Aparelho</span>
                    </>
                  )}
                </button>
              </div>

              {uploadError && (
                <p className="text-[11px] text-red-500 font-medium">
                  {uploadError}
                </p>
              )}

              {/* Presets Rápidos */}
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                {AVATAR_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    title={preset.nome}
                    className={`w-9 h-9 rounded-full overflow-hidden ring-2 transition-transform cursor-pointer hover:scale-105 ${
                      formData.avatarPresetId === preset.id
                        ? 'ring-blue-600 ring-offset-2 dark:ring-offset-slate-900 scale-105'
                        : 'ring-slate-200 dark:ring-slate-700 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={preset.url} 
                      alt={preset.nome} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer" 
                    />
                  </button>
                ))}

                {/* Opção de Iniciais */}
                <button
                  type="button"
                  onClick={handleUseInitials}
                  title="Usar Iniciais do Nome"
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white transition-transform cursor-pointer hover:scale-105 ${
                    !formData.avatarUrl
                      ? 'ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-slate-900 scale-105'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: formData.avatarCor || '#2563eb' }}
                >
                  {formData.avatarIniciais || 'IH'}
                </button>

                {formData.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleUseInitials}
                    title="Remover foto e voltar para iniciais"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors ml-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Paleta de Cores para as Iniciais */}
              {!formData.avatarUrl && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 pt-1.5">
                  <span className="text-[10px] text-slate-400 mr-1">Cor:</span>
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, avatarCor: c.value }))}
                      className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                        formData.avatarCor === c.value ? 'ring-2 ring-slate-900 dark:ring-white scale-125' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Seção 2: Dados Pessoais do Investidor */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Identificação do Titular
            </h3>

            {/* Nome Completo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome Completo / Titular da Conta
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={handleNameChange}
                  placeholder="Ex: Orlando Atanásio"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                />
              </div>
            </div>

            {/* Grid Telefone e E-mail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Telefone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={e => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="(11) 98765-4321"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs transition-all"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail de Contato
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="investidor@exemplo.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                  />
                </div>
              </div>
            </div>

            {/* CPF Fiscal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                CPF do Titular (utilizado para apuração de IR e Notas de Corretagem)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <FileText className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={formData.cpf || ''}
                  onChange={e => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                  placeholder="000.000.000-00"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs transition-all"
                />
              </div>
            </div>

            {/* Perfil de Investidor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Perfil de Investidor (Suitability)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CONSERVADOR', label: 'Conservador', icon: Shield, desc: 'Preservação' },
                  { id: 'MODERADO', label: 'Moderado', icon: TrendingUp, desc: 'Equilíbrio' },
                  { id: 'ARROJADO', label: 'Arrojado', icon: Zap, desc: 'Crescimento' },
                ].map(item => {
                  const ItemIcon = item.icon;
                  const isSelected = formData.perfilInvestidor === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, perfilInvestidor: item.id as any }))}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <ItemIcon className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">{item.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bio / Meta Pessoal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Objetivo Patrimonial / Observações
              </label>
              <textarea
                rows={2}
                value={formData.bio || ''}
                onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Ex: Foco em acumulação previdenciária de longo prazo e renda passiva de dividendos."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              />
            </div>
          </div>

          {/* Garantia de Privacidade Local */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Soberania e Privacidade:</strong> Todos os seus dados pessoais e fotos permanecem estritamente dentro do seu navegador. O Hermas não envia nem comercializa seus dados para nenhum servidor externo.
            </p>
          </div>

          {/* Ações do Rodapé */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {onLogout ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-900/50 text-xs font-semibold transition-all cursor-pointer"
                title="Encerrar sessão e bloquear o cofre"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair do Cofre</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Salvo com Sucesso!</span>
                  </>
                ) : (
                  <span>Salvar Perfil</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
