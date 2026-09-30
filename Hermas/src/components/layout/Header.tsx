import React, { useState, useRef } from 'react';
import { 
  Lock, 
  RefreshCw, 
  Sun, 
  Moon, 
  Menu,
  LayoutDashboard,
  PieChart,
  ArrowLeftRight,
  FileText,
  Target,
  Receipt,
  BarChart3,
  HardDriveDownload,
  Settings,
  LogOut,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { NavTab } from './Navigation';
import { UserProfile } from '../../types';
import { HermasLogoIcon } from '../brand/HermasLogo';

interface HeaderProps {
  currentTab?: NavTab;
  onOpenSidebar?: () => void;
  onLock: () => void;
  onRefreshQuotes: () => Promise<boolean> | void;
  isRefreshingQuotes: boolean;
  theme: 'claro' | 'escuro' | 'sistema';
  onThemeChange: (theme: 'claro' | 'escuro' | 'sistema') => void;
  userProfile?: UserProfile;
  onOpenUserProfile?: () => void;
  onLogout?: () => void;
}

// Saudação dinâmica conforme o horário do dia
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

// Mapeamento dos títulos e ícones das abas para o topo
const TAB_INFO: Record<NavTab, { title: string; subtitle: string; icon: React.FC<{ className?: string }> }> = {
  'visao-geral': {
    title: 'Visão Geral',
    subtitle: 'Consolidado Patrimonial & Métricas em Tempo Real',
    icon: LayoutDashboard,
  },
  'carteira': {
    title: 'Carteira & Ativos',
    subtitle: 'Posições em Custódia, Alocação & Rentabilidade',
    icon: PieChart,
  },
  'operacoes': {
    title: 'Livro de Operações',
    subtitle: 'Histórico Completo de Compras, Vendas & Dividendos',
    icon: ArrowLeftRight,
  },
  'documentos': {
    title: 'Documentos & Notas',
    subtitle: 'Importação e Conciliação de Notas Toro e B3',
    icon: FileText,
  },
  'metas': {
    title: 'Metas Financeiras',
    subtitle: 'Planejamento de Longo Prazo & Independência Financeira',
    icon: Target,
  },
  'impostos': {
    title: 'Apuração de Impostos (IR)',
    subtitle: 'Cálculo Determinístico de DARF & Prejuízos a Compensar',
    icon: Receipt,
  },
  'relatorios': {
    title: 'Relatórios & Inteligência',
    subtitle: 'Análises Gráficas, Evolução e Diversificação',
    icon: BarChart3,
  },
  'backup': {
    title: 'Cofre & Backup Local',
    subtitle: 'Exportação Criptografada, Importação & Auditoria',
    icon: HardDriveDownload,
  },
  'configuracoes': {
    title: 'Configurações do Sistema',
    subtitle: 'Preferências, Chaves de Cotação & Inteligência Hermas',
    icon: Settings,
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab = 'visao-geral',
  onOpenSidebar,
  onLock,
  onRefreshQuotes,
  isRefreshingQuotes,
  theme,
  onThemeChange,
  userProfile,
  onOpenUserProfile,
  onLogout,
}) => {
  const currentTabMeta = TAB_INFO[currentTab] || TAB_INFO['visao-geral'];
  const TabIcon = currentTabMeta.icon;
  const greeting = getGreeting();
  const firstName = userProfile?.nome ? userProfile.nome.split(' ')[0] : 'Investidor';

  // Estados locais para feedback de atualização dos ativos e cotações
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTriggerRefresh = async () => {
    if (isRefreshingQuotes) return;

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    try {
      const result = await Promise.resolve(onRefreshQuotes());
      // Se a função retornar explicitamente false, consideramos erro
      if (result === false) {
        setRefreshStatus('error');
        setToastMessage({
          text: 'Não foi possível atualizar as cotações dos seus ativos',
          type: 'error',
        });
      } else {
        setRefreshStatus('success');
        setToastMessage({
          text: 'Cotações dos seus ativos atualizadas com sucesso',
          type: 'success',
        });
      }
    } catch {
      setRefreshStatus('error');
      setToastMessage({
        text: 'Não foi possível atualizar as cotações dos seus ativos',
        type: 'error',
      });
    } finally {
      // Retorna para o estado normal e fecha a mensagem após 4.5 segundos
      toastTimeoutRef.current = setTimeout(() => {
        setRefreshStatus('idle');
        setToastMessage(null);
      }, 4500);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-slate-300/80 dark:border-slate-800 shadow-sm transition-all relative overflow-hidden">
      {/* Mensagem Toast padrão dos apps modernos (sucesso ou falha) */}
      {toastMessage && (
        <div 
          role="status" 
          aria-live="polite"
          className="absolute top-2 inset-x-0 mx-auto z-50 flex items-center justify-center pointer-events-none px-4"
        >
          <div className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-2xl shadow-lg border backdrop-blur-xl transition-all animate-in fade-in slide-in-from-top-3 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-500/95 text-white border-emerald-400/50 shadow-emerald-950/20'
              : 'bg-rose-600/95 text-white border-rose-500/50 shadow-rose-950/20'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-white" />
            )}
            <span className="text-xs sm:text-sm font-semibold tracking-tight">
              {toastMessage.text}
            </span>
          </div>
        </div>
      )}

      {/* Luz ambiente refinada e ligeiramente mais marcada no fundo do cabeçalho */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-12 left-6 w-96 h-32 bg-gradient-to-r from-blue-500/20 via-indigo-500/15 to-sky-400/20 blur-3xl rounded-full"></div>
        <div className="absolute -top-12 right-6 w-80 h-32 bg-gradient-to-l from-emerald-500/20 via-teal-500/15 to-indigo-500/20 blur-3xl rounded-full"></div>
        {/* Fina linha de brilho no topo */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent"></div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 h-[5.25rem] sm:h-24 flex items-center justify-between gap-3 sm:gap-4 relative z-10">
        {/* ======================================================================= */}
        {/* LADO ESQUERDO: MOBILE vs DESKTOP                                        */}
        {/* ======================================================================= */}

        {/* 1. Mobile (lg:hidden): Logo Oficial Hermas limpo + Saudação de Alta Linha */}
        <div className="flex items-center gap-3 lg:hidden min-w-0">
          {/* Apenas o símbolo Hermas azul limpo como acionador do menu lateral */}
          <button
            onClick={onOpenSidebar}
            title="Abrir menu de navegação Hermas"
            className="relative shrink-0 p-0.5 rounded-2xl cursor-pointer group active:scale-95 transition-transform"
            aria-label="Abrir menu lateral"
          >
            <HermasLogoIcon 
              sizeClassName="w-12 h-12" 
              className="group-hover:scale-105 transition-transform drop-shadow-md" 
            />
            {/* Indicador discreto e elegante de menu */}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center border-2 border-slate-50 dark:border-slate-900 shadow-xs">
              <Menu className="w-2.5 h-2.5" />
            </span>
          </button>

          {/* Saudação moderna, sem card pesado: Olá, Boa tarde / Bom dia, Orlando */}
          <div className="flex flex-col text-left min-w-0 justify-center">
            <div className="flex items-center gap-1.5 leading-snug">
              <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                {greeting},
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[180px] tracking-tight">
                {firstName}
              </span>
            </div>
            {/* Módulo ativo atual com ponto de status do cofre */}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-200 dark:ring-emerald-950/60 animate-pulse"></span>
              <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px] sm:max-w-[200px]">
                {currentTabMeta.title}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Desktop (hidden lg:flex): Saudação Premium + Título da Página Ativa */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
            <TabIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {greeting}, <strong className="font-semibold text-slate-800 dark:text-slate-200">{firstName}</strong> •
              </span>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                {currentTabMeta.title}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Cofre Ativo
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {currentTabMeta.subtitle}
            </p>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* LADO DIREITO: AÇÕES RÁPIDAS & CONTROLES DO COFRE                         */}
        {/* ======================================================================= */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Botão Atualizar Cotações & Ativos:
              - Afastado do avatar e mais próximo ao centro através de mr-2 sm:mr-3
              - Sem cor branca sólida: utiliza tonalidade idêntica ao fundo do cabeçalho porém ligeiramente mais firme (bg-slate-200/80 no claro e bg-slate-800/90 no escuro)
              - Fica verde esmeralda vibrante com ícone de check quando atualizado com sucesso
          */}
          <button
            onClick={handleTriggerRefresh}
            disabled={isRefreshingQuotes}
            title={
              refreshStatus === 'success' 
                ? 'Cotações dos seus ativos atualizadas com sucesso'
                : 'Atualizar cotações de mercado e patrimônio'
            }
            className={`inline-flex items-center justify-center gap-2 w-11 h-11 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-2xl border transition-all cursor-pointer disabled:opacity-60 shadow-xs active:scale-95 mr-2 sm:mr-3 ${
              refreshStatus === 'success'
                ? 'bg-emerald-500 text-white border-emerald-400 ring-2 ring-emerald-400/30 shadow-emerald-500/20'
                : refreshStatus === 'error'
                ? 'bg-rose-500 text-white border-rose-400 ring-2 ring-rose-400/30'
                : 'bg-slate-200/75 dark:bg-slate-800/90 hover:bg-slate-300/80 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
            }`}
          >
            {isRefreshingQuotes ? (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
            ) : refreshStatus === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-white shrink-0 animate-in zoom-in-50 duration-200" />
            ) : (
              <RefreshCw className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
            )}

            <span className="hidden sm:inline text-xs font-bold tracking-tight">
              {isRefreshingQuotes 
                ? 'Atualizando...' 
                : refreshStatus === 'success'
                ? 'Atualizado'
                : 'Cotações'}
            </span>
          </button>

          {/* Quick Theme Toggle Button (Desktop) */}
          <button
            onClick={() => onThemeChange(theme === 'escuro' ? 'claro' : 'escuro')}
            title={theme === 'escuro' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-300/80 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-all cursor-pointer shadow-xs active:scale-98"
          >
            {theme === 'escuro' ? (
              <>
                <Moon className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Escuro</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Claro</span>
              </>
            )}
          </button>

          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-0.5 hidden md:block"></div>

          {/* Botão Bloquear Permanente (Desktop) */}
          <button
            onClick={onLock}
            title="Bloquear cofre imediatamente"
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/90 hover:bg-red-50 dark:bg-slate-800/90 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 border border-slate-300/80 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <Lock className="w-4 h-4 text-amber-500 hover:text-red-500" />
            <span>Bloquear</span>
          </button>

          {/* Avatar do Usuário (Aumentado, com fundo elegante e bem visível) */}
          {userProfile && onOpenUserProfile && (
            <button
              onClick={onOpenUserProfile}
              title={`Perfil do Titular: ${userProfile.nome} (Toque para configurar)`}
              className="flex items-center gap-3 p-1.5 pl-1.5 sm:pr-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border border-slate-300/80 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer group shadow-xs active:scale-98"
              aria-label="Abrir perfil do usuário"
            >
              <div className="relative">
                {/* Avatar generoso (w-12 h-12 no mobile e desktop) */}
                <div 
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex items-center justify-center text-white text-sm font-bold ring-2 ring-slate-300 dark:ring-slate-700 group-hover:ring-slate-400 dark:group-hover:ring-slate-500 transition-all shadow-sm"
                  style={{ backgroundColor: userProfile.avatarUrl ? undefined : (userProfile.avatarCor || '#475569') }}
                >
                  {userProfile.avatarUrl ? (
                    <img 
                      src={userProfile.avatarUrl} 
                      alt={userProfile.nome} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{userProfile.avatarIniciais || 'IH'}</span>
                  )}
                </div>
                {/* Indicador de Status Verde do Cofre Local */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shadow-xs"></span>
              </div>

              {/* Informações Resumidas do Titular no Desktop */}
              <div className="hidden lg:flex flex-col text-left leading-none max-w-[120px]">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {userProfile.nome.split(' ')[0]}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                  {userProfile.perfilInvestidor === 'CONSERVADOR' ? 'Conservador' : userProfile.perfilInvestidor === 'ARROJADO' ? 'Arrojado' : 'Moderado'}
                </span>
              </div>
            </button>
          )}

          {/* Botão Sair da Sessão (Desktop) */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Encerrar sessão e bloquear o cofre"
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-300/80 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
