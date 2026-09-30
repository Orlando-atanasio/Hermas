import React from 'react';
import { 
  LayoutDashboard, 
  PieChart, 
  ArrowLeftRight, 
  FileText, 
  Target, 
  Receipt, 
  BarChart3, 
  ShieldCheck,
  HardDriveDownload, 
  Settings 
} from 'lucide-react';

export type NavTab = 
  | 'visao-geral' 
  | 'carteira' 
  | 'operacoes' 
  | 'documentos' 
  | 'metas' 
  | 'impostos' 
  | 'relatorios' 
  | 'conciliacao'
  | 'backup' 
  | 'configuracoes';

interface NavigationProps {
  currentTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  pendingDocsCount?: number;
  pendingDarfsCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onChangeTab,
  pendingDocsCount = 0,
  pendingDarfsCount = 0,
}) => {
  const tabs = [
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
    { id: 'conciliacao', label: 'Conciliação', icon: ShieldCheck },
    { id: 'backup', label: 'Backup & Cofre', icon: HardDriveDownload },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <nav className="w-full bg-slate-100/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 sticky top-[5.25rem] sm:top-24 z-30 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 py-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id as NavTab)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.2 rounded-full ${tab.badgeColor || 'bg-amber-500'} text-white text-[10px] font-bold`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
