import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PieChart, 
  ArrowLeftRight, 
  FileText, 
  Target, 
  Receipt, 
  BarChart3, 
  HardDriveDownload, 
  Settings,
  X,
  Plus,
  Lock,
  Sun,
  Moon,
  UploadCloud,
  Layers,
  ChevronLeft,
  ChevronRight,
  Compass,
  ShieldCheck,
  User,
  LogOut
} from 'lucide-react';
import { NavTab } from './Navigation';
import { UserProfile } from '../../types';
import { HermasLogoIcon } from '../brand/HermasLogo';

interface SidebarProps {
  currentTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  pendingDocsCount?: number;
  pendingDarfsCount?: number;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenManifesto?: () => void;
  onNewOperation?: () => void;
  onImportDocument?: () => void;
  onOpenCorporateAction?: () => void;
  onLock?: () => void;
  onLogout?: () => void;
  theme?: 'claro' | 'escuro' | 'sistema';
  onThemeChange?: (theme: 'claro' | 'escuro' | 'sistema') => void;
  userProfile?: UserProfile;
  onOpenUserProfile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onChangeTab,
  pendingDocsCount = 0,
  pendingDarfsCount = 0,
  isMobileOpen,
  onCloseMobile,
  onOpenManifesto,
  onNewOperation,
  onImportDocument,
  onOpenCorporateAction,
  onLock,
  onLogout,
  theme,
  onThemeChange,
  userProfile,
  onOpenUserProfile,
}) => {
  // Desktop collapse state (persisted locally)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hermas_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('hermas_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  const tabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number; badgeColor?: string }[] = [
    { id: 'visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'carteira', label: 'Carteira', icon: PieChart },
    { id: 'operacoes', label: 'Operações', icon: ArrowLeftRight },
    { 
      id: 'documentos', 
      label: 'Documentos', 
      icon: FileText, 
      badge: pendingDocsCount > 0 ? pendingDocsCount : undefined,
      badgeColor: 'bg-amber-500'
    },
    { id: 'metas', label: 'Metas', icon: Target },
    { 
      id: 'impostos', 
      label: 'Impostos', 
      icon: Receipt,
      badge: pendingDarfsCount > 0 ? pendingDarfsCount : undefined,
      badgeColor: 'bg-amber-600'
    },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'backup', label: 'Backup & Cofre', icon: HardDriveDownload },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  const handleSelectTab = (tabId: NavTab) => {
    onChangeTab(tabId);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  // Render navigation item button
  const renderNavItem = (
    tab: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number; badgeColor?: string },
    collapsed: boolean = false
  ) => {
    const Icon = tab.icon;
    const isActive = currentTab === tab.id;

    return (
      <button
        key={tab.id}
        onClick={() => handleSelectTab(tab.id)}
        title={collapsed ? tab.label : undefined}
        className={`w-full flex items-center gap-3 rounded-xl transition-all font-medium cursor-pointer relative group ${
          collapsed 
            ? 'justify-center p-3' 
            : 'px-3.5 py-2.5 text-xs sm:text-sm'
        } ${
          isActive
            ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70'
        }`}
      >
        <Icon className={`shrink-0 transition-transform ${collapsed ? 'w-5 h-5' : 'w-4 h-4'} ${isActive ? 'scale-105' : 'group-hover:scale-110'}`} />
        
        {!collapsed && (
          <span className="truncate flex-1 text-left">{tab.label}</span>
        )}

        {/* Badge de Pendências */}
        {tab.badge && (
          <span
            className={`${
              collapsed
                ? `absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ${tab.badgeColor || 'bg-amber-500'} ring-2 ring-white dark:ring-slate-900`
                : `px-2 py-0.5 rounded-full ${tab.badgeColor || 'bg-amber-500'} text-white text-[10px] font-bold shadow-xs`
            }`}
          >
            {!collapsed && tab.badge}
          </span>
        )}

        {/* Tooltip flutuante quando recolhido no desktop */}
        {collapsed && (
          <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs whitespace-nowrap shadow-xl z-50 animate-in fade-in">
            {tab.label}
            {tab.badge && ` (${tab.badge})`}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. GAVETA MÓVEL PARA CELULAR (ANDROID / SMARTPHONES)                       */}
      {/* ========================================================================= */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop escurecido */}
          <div 
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Painel lateral deslizante */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl z-50 animate-in slide-in-from-left duration-250">
            {/* Cabeçalho do Drawer */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div 
                onClick={() => {
                  if (onOpenManifesto) {
                    onCloseMobile();
                    onOpenManifesto();
                  }
                }}
                role="button"
                tabIndex={0}
                className="flex items-center gap-3 cursor-pointer group"
                title="HERMAS: O Mensageiro da Realidade"
              >
                <HermasLogoIcon sizeClassName="w-10 h-10" className="group-hover:scale-105 transition-transform" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-base text-slate-900 dark:text-white">Hermas</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                      Cofre
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    100% Determinístico
                  </p>
                </div>
              </div>

              <button
                onClick={onCloseMobile}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Fechar menu lateral"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Navegação Mobile (Espaçosa para o polegar no Android) */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-none">
              <p className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Módulos do Sistema
              </p>
              {tabs.map(tab => renderNavItem(tab, false))}

              {/* Ações Extras Mobile */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Atalhos Rápidos
                </p>
                {onImportDocument && (
                  <button
                    onClick={() => {
                      onCloseMobile();
                      onImportDocument();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-blue-500" />
                    <span>Importar Nota / Extrato</span>
                  </button>
                )}
                {onOpenCorporateAction && (
                  <button
                    onClick={() => {
                      onCloseMobile();
                      onOpenCorporateAction();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Evento Corporativo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Rodapé Mobile do Drawer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-2">
              {/* Botão História / Manifesto */}
              {onOpenManifesto && (
                <button
                  onClick={() => {
                    onCloseMobile();
                    onOpenManifesto();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>O Significado de Hermas (Ἑρμᾶς)</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                {/* Tema */}
                {onThemeChange && (
                  <button
                    onClick={() => onThemeChange(theme === 'escuro' ? 'claro' : 'escuro')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    {theme === 'escuro' ? (
                      <>
                        <Moon className="w-3.5 h-3.5 text-blue-400" />
                        <span>Escuro</span>
                      </>
                    ) : (
                      <>
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>Claro</span>
                      </>
                    )}
                  </button>
                )}

                {/* Sair / Encerrar Sessão */}
                {onLogout ? (
                  <button
                    onClick={() => {
                      onCloseMobile();
                      onLogout();
                    }}
                    title="Encerrar sessão e voltar para a página inicial"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs font-semibold cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair</span>
                  </button>
                ) : onLock ? (
                  <button
                    onClick={() => {
                      onCloseMobile();
                      onLock();
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs font-semibold cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Bloquear</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BARRA LATERAL FIXA NO COMPUTADOR (DESKTOP - LG+)                       */}
      {/* ========================================================================= */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-screen sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-30 select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Cabeçalho da Sidebar Desktop */}
        <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div
            onClick={onOpenManifesto}
            role="button"
            tabIndex={0}
            title="HERMAS: O Mensageiro da Realidade (Clique para ver a história e o manifesto)"
            className={`flex items-center gap-3 cursor-pointer group ${isCollapsed ? 'justify-center w-full' : ''}`}
          >
            <HermasLogoIcon sizeClassName="w-10 h-10" className="group-hover:scale-105 transition-transform" />
            {!isCollapsed && (
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                    Hermas
                  </h1>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                    Cofre
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    Local & Determinístico
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Navegação Principal */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 scrollbar-none">
          {!isCollapsed && (
            <p className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Navegação
            </p>
          )}
          {tabs.map(tab => renderNavItem(tab, isCollapsed))}
        </div>

        {/* Rodapé da Sidebar Desktop com Controle de Recolher/Expandir */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          {/* Botão de Manifesto Hermas */}
          {onOpenManifesto && !isCollapsed && (
            <button
              onClick={onOpenManifesto}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Significado de Hermas (Ἑρμᾶς)</span>
            </button>
          )}

          {/* Botão Sair no Desktop */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Encerrar sessão e voltar à tela inicial"
              className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Sair do Cofre</span>}
            </button>
          )}

          {/* Botão para Recolher/Expandir Sidebar no Desktop */}
          <button
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 text-xs transition-colors cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px] font-medium">Recolher Menu</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
