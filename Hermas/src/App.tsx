/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HermasDB } from './storage/db';
import { calculatePortfolio } from './engine/portfolio';
import { calculateMonthlyTaxes } from './engine/tax';
import { D } from './engine/decimal';
import { fetchBrapiQuotes } from './services/quotes';
import { 
  Asset, 
  Operation, 
  DocumentRecord, 
  Dividend, 
  PriceQuote, 
  Goal, 
  SystemSettings, 
  AuditLog,
  UserProfile 
} from './types';

// Layout & Security
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { NavTab } from './components/layout/Navigation';
import { VaultLockScreen } from './components/security/VaultLockScreen';
import { NewOperationModal } from './components/modals/NewOperationModal';
import { CorporateActionModal } from './components/modals/CorporateActionModal';
import { NewDividendModal } from './components/modals/NewDividendModal';
import { InitialPositionModal } from './components/modals/InitialPositionModal';
import { UserProfileModal } from './components/modals/UserProfileModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { HermasInsightToast } from './components/hermas/HermasInsightToast';
import { HermasManifestoModal } from './components/hermas/HermasManifestoModal';

// Views
import { OverviewView } from './components/views/OverviewView';
import { PortfolioView } from './components/views/PortfolioView';
import { OperationsView } from './components/views/OperationsView';
import { DocumentsView } from './components/views/DocumentsView';
import { GoalsView } from './components/views/GoalsView';
import { TaxView } from './components/views/TaxView';
import { ReportsView } from './components/views/ReportsView';
import { BackupView } from './components/views/BackupView';
import { SettingsView } from './components/views/SettingsView';

export default function App() {
  // Inicialização do Banco Local
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('hermas_session_unlocked') !== 'true';
    } catch {
      return true;
    }
  });
  const [currentTab, setCurrentTab] = useState<NavTab>('visao-geral');

  // Estado Local
  const [assets, setAssets] = useState<Asset[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [quotes, setQuotes] = useState<Record<string, PriceQuote>>({});
  const [goals, setGoals] = useState<Goal[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(HermasDB.getSettings());
  const [userProfile, setUserProfile] = useState<UserProfile>(HermasDB.getUserProfile());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Estados de UI
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewOpModalOpen, setIsNewOpModalOpen] = useState(false);
  const [isCorporateActionModalOpen, setIsCorporateActionModalOpen] = useState(false);
  const [corporateActionInitialTicker, setCorporateActionInitialTicker] = useState<string | undefined>(undefined);
  const [corporateActionInitialEventType, setCorporateActionInitialEventType] = useState<any>(undefined);
  const [isNewDividendModalOpen, setIsNewDividendModalOpen] = useState(false);
  const [isInitialPositionModalOpen, setIsInitialPositionModalOpen] = useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [isManifestoModalOpen, setIsManifestoModalOpen] = useState(false);
  const [selectedHermasInsight, setSelectedHermasInsight] = useState<any>(null);
  const [isRefreshingQuotes, setIsRefreshingQuotes] = useState(false);

  const handleOpenCorporateAction = (ticker?: string, type?: any) => {
    setCorporateActionInitialTicker(ticker);
    setCorporateActionInitialEventType(type);
    setIsCorporateActionModalOpen(true);
  };

  // Carregar todos os dados do cofre
  const reloadVaultData = useCallback(() => {
    HermasDB.init();
    setAssets(HermasDB.getAssets());
    setOperations(HermasDB.getOperations());
    setDocuments(HermasDB.getDocuments());
    setDividends(HermasDB.getDividends());
    setQuotes(HermasDB.getQuotes());
    setGoals(HermasDB.getGoals());
    setSettings(HermasDB.getSettings());
    setUserProfile(HermasDB.getUserProfile());
    setAuditLogs(HermasDB.getAuditLogs());
  }, []);

  useEffect(() => {
    reloadVaultData();
    setIsInitialized(true);
  }, [reloadVaultData]);

  // Aplicação do Tema (Claro / Escuro / Sistema)
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
        body.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
    };

    if (settings.theme === 'escuro') {
      applyTheme(true);
    } else if (settings.theme === 'claro') {
      applyTheme(false);
    } else {
      // Sistema
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [settings.theme]);

  // Timer de Bloqueio por Inatividade
  useEffect(() => {
    if (isLocked || settings.lockTimeoutMinutes <= 0) return;

    let timeoutId: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsLocked(true);
        HermasDB.logAudit('BLOQUEIO_INATIVIDADE', 'Security', 'Cofre bloqueado automaticamente por tempo de inatividade.');
      }, settings.lockTimeoutMinutes * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [isLocked, settings.lockTimeoutMinutes]);

  // Cálculo Determinístico do Patrimônio e Custódia
  const portfolio = useMemo(() => {
    return calculatePortfolio(assets, operations, quotes, dividends);
  }, [assets, operations, quotes, dividends]);

  // Atualização de Cotações de Mercado
  const handleRefreshQuotes = async (): Promise<boolean> => {
    setIsRefreshingQuotes(true);
    const tickers = Array.from(new Set([
      ...assets.map(a => a.ticker),
      ...operations.map(o => o.ticker),
    ]));

    try {
      const result = await fetchBrapiQuotes(tickers, settings.brapiApiKey);
      setQuotes(result.quotes);
      setAuditLogs(HermasDB.getAuditLogs());
      return result.success;
    } catch {
      return false;
    } finally {
      setIsRefreshingQuotes(false);
    }
  };

  // Operações Handlers
  const handleSaveOperation = (op: Operation) => {
    HermasDB.saveOperation(op);
    reloadVaultData();
  };

  const handleDeleteOperation = (id: string) => {
    HermasDB.deleteOperation(id);
    reloadVaultData();
  };

  const handleConfirmCandidatesBatch = (ops: Operation[], doc: DocumentRecord) => {
    HermasDB.saveOperationsBatch(ops);
    HermasDB.saveDocument(doc);
    reloadVaultData();
  };

  const handleDeleteDocument = (id: string) => {
    HermasDB.deleteDocument(id, true);
    reloadVaultData();
  };

  // Proventos Handlers
  const handleSaveDividend = (div: Dividend) => {
    HermasDB.saveDividend(div);
    reloadVaultData();
  };

  const handleDeleteDividend = (id: string) => {
    HermasDB.deleteDividend(id);
    reloadVaultData();
  };

  // Posição Inicial / Saldo de Transição
  const handleSaveInitialPositionBatch = (ops: Operation[], newAssets: Asset[]) => {
    newAssets.forEach(a => HermasDB.saveAsset(a));
    HermasDB.saveOperationsBatch(ops);
    reloadVaultData();
  };

  // Metas Handlers
  const handleSaveGoal = (goal: Goal) => {
    HermasDB.saveGoal(goal);
    reloadVaultData();
  };

  const handleDeleteGoal = (id: string) => {
    HermasDB.deleteGoal(id);
    reloadVaultData();
  };

  // Configurações & Reset
  const handleUpdateSettings = (newSettings: SystemSettings) => {
    HermasDB.saveSettings(newSettings);
    setSettings(newSettings);
    reloadVaultData();
  };

  const handleToggleHermasNotifications = (enabled: boolean) => {
    const updated: SystemSettings = {
      ...settings,
      mostrarCuriosidadesHermas: enabled,
    };
    handleUpdateSettings(updated);
  };

  const handleResetVault = () => {
    HermasDB.resetVault();
    reloadVaultData();
  };

  const handleClearDemoData = () => {
    HermasDB.clearDemoData();
    reloadVaultData();
  };

  // Perfil do Investidor
  const handleSaveUserProfile = (profile: UserProfile) => {
    HermasDB.saveUserProfile(profile);
    setUserProfile(HermasDB.getUserProfile());
    setSettings(HermasDB.getSettings());
    reloadVaultData();
  };

  // Logout / Sair do Cofre
  const handleLogout = useCallback(() => {
    try {
      sessionStorage.removeItem('hermas_session_unlocked');
    } catch {
      // ignore
    }
    setIsLocked(true);
    setIsMobileMenuOpen(false);
    HermasDB.logAudit('LOGOUT', 'Security', 'Sessão encerrada pelo usuário.');
  }, []);

  const pendingDocsCount = useMemo(() => {
    return documents.filter(d => d.status === 'REVISAO_PENDENTE').length;
  }, [documents]);

  const pendingDarfsCount = useMemo(() => {
    if (!assets.length || !operations.length) return 0;
    try {
      const taxes = calculateMonthlyTaxes(assets, operations, {
        acoes: settings?.prejuizoAcumuladoAcoesSwingAnterior,
        daytrade: settings?.prejuizoAcumuladoDayTradeAnterior,
        fii: settings?.prejuizoAcumuladoFiiAnterior,
      });
      return taxes.filter(t => {
        const val = t.impostoAPagarAposDedoDuro;
        const isPaid = Boolean(settings?.darfsPagas?.[t.mesAno]);
        return D(val).gte(10) && !isPaid;
      }).length;
    } catch {
      return 0;
    }
  }, [assets, operations, settings]);

  if (!isInitialized) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Tela Inicial de Entrada & Bloqueio do Cofre */}
      {isLocked && (
        <VaultLockScreen 
          onUnlock={() => setIsLocked(false)} 
          userProfile={userProfile}
        />
      )}

      {/* Barra Lateral Fixa no Desktop & Gaveta Deslizante no Android/Mobile */}
      <Sidebar
        currentTab={currentTab}
        onChangeTab={(tab) => {
          setCurrentTab(tab);
          setIsMobileMenuOpen(false);
        }}
        pendingDocsCount={pendingDocsCount}
        pendingDarfsCount={pendingDarfsCount}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenManifesto={() => setIsManifestoModalOpen(true)}
        onNewOperation={() => setIsNewOpModalOpen(true)}
        onImportDocument={() => setCurrentTab('documentos')}
        onOpenCorporateAction={() => setIsCorporateActionModalOpen(true)}
        onLock={() => setIsLocked(true)}
        onLogout={handleLogout}
        theme={settings.theme}
        onThemeChange={t => handleUpdateSettings({ ...settings, theme: t })}
        userProfile={userProfile}
        onOpenUserProfile={() => setIsUserProfileModalOpen(true)}
      />

      {/* Área Principal de Conteúdo (Direita no Desktop / Completa no Mobile) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onOpenSidebar={() => setIsMobileMenuOpen(true)}
          onLock={() => setIsLocked(true)}
          onLogout={handleLogout}
          onRefreshQuotes={handleRefreshQuotes}
          isRefreshingQuotes={isRefreshingQuotes}
          theme={settings.theme}
          onThemeChange={t => handleUpdateSettings({ ...settings, theme: t })}
          userProfile={userProfile}
          onOpenUserProfile={() => setIsUserProfileModalOpen(true)}
        />

        {/* Main Content Viewport com largura expandida que aproveita toda a tela no PC */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {currentTab === 'visao-geral' && (
          <OverviewView
            portfolio={portfolio}
            assets={assets}
            operations={operations}
            documents={documents}
            goals={goals}
            dividends={dividends}
            settings={settings}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'carteira' && (
          <PortfolioView
            portfolio={portfolio}
            onRefreshQuotes={handleRefreshQuotes}
            isRefreshingQuotes={isRefreshingQuotes}
            onOpenCorporateAction={handleOpenCorporateAction}
          />
        )}

        {currentTab === 'operacoes' && (
          <OperationsView
            operations={operations}
            dividends={dividends}
            onSaveOperation={handleSaveOperation}
            onDeleteOperation={handleDeleteOperation}
            onSaveDividend={handleSaveDividend}
            onDeleteDividend={handleDeleteDividend}
            onOpenNewModal={() => setIsNewOpModalOpen(true)}
            onOpenCorporateAction={handleOpenCorporateAction}
            onOpenInitialPosition={() => setIsInitialPositionModalOpen(true)}
            onOpenNewDividend={() => setIsNewDividendModalOpen(true)}
          />
        )}

        {currentTab === 'documentos' && (
          <DocumentsView
            documents={documents}
            onConfirmCandidatesBatch={handleConfirmCandidatesBatch}
            onDeleteDocument={handleDeleteDocument}
          />
        )}

        {currentTab === 'metas' && (
          <GoalsView
            goals={goals}
            currentPatrimony={portfolio.patrimonioTotal}
            onSaveGoal={handleSaveGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {currentTab === 'impostos' && (
          <TaxView
            assets={assets}
            operations={operations}
            portfolio={portfolio}
            dividends={dividends}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'relatorios' && (
          <ReportsView
            portfolio={portfolio}
            operations={operations}
            dividends={dividends}
            assets={assets}
            settings={settings}
            userProfile={userProfile}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'backup' && (
          <BackupView
            auditLogs={auditLogs}
            onDataRestored={reloadVaultData}
          />
        )}

        {currentTab === 'configuracoes' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetVault={handleResetVault}
            onClearDemoData={handleClearDemoData}
            onOpenManifesto={() => setIsManifestoModalOpen(true)}
            userProfile={userProfile}
            onOpenUserProfile={() => setIsUserProfileModalOpen(true)}
          />
        )}
      </main>

      {/* Indicador Flutuante de Modo Offline PWA */}
      <OfflineIndicator />

      {/* Balãozinho Flutuante Discreto de Insights e Filosofia Hermas (com cores dinâmicas e rotação) */}
      <HermasInsightToast
        currentTab={currentTab}
        isEnabled={settings.mostrarCuriosidadesHermas}
        onOpenManifesto={(insight) => {
          setSelectedHermasInsight(insight || null);
          setIsManifestoModalOpen(true);
        }}
        onDisableNotifications={() => handleToggleHermasNotifications(false)}
      />

      {/* Modal de Nova Operação */}
      {isNewOpModalOpen && (
        <NewOperationModal
          assets={assets}
          onSave={handleSaveOperation}
          onClose={() => setIsNewOpModalOpen(false)}
        />
      )}

      {/* Modal do Assistente de Eventos Corporativos & Subscrições */}
      {isCorporateActionModalOpen && (
        <CorporateActionModal
          custodyPositions={portfolio.posicoesCustodia}
          onSaveOperation={handleSaveOperation}
          initialTicker={corporateActionInitialTicker}
          initialEventType={corporateActionInitialEventType}
          onClose={() => {
            setIsCorporateActionModalOpen(false);
            setCorporateActionInitialTicker(undefined);
            setCorporateActionInitialEventType(undefined);
          }}
        />
      )}

      {/* Modal de Lançamento de Proventos (Dividendos / JCP) */}
      {isNewDividendModalOpen && (
        <NewDividendModal
          assets={assets}
          custodyPositions={portfolio.posicoesCustodia}
          onSave={handleSaveDividend}
          onClose={() => setIsNewDividendModalOpen(false)}
        />
      )}

      {/* Modal de Cadastro de Posição Inicial / Saldo de Transição */}
      {isInitialPositionModalOpen && (
        <InitialPositionModal
          onSaveBatch={handleSaveInitialPositionBatch}
          onClose={() => setIsInitialPositionModalOpen(false)}
        />
      )}

      {/* Modal de Perfil e Configurações do Titular (Avatar, Nome, Telefone, E-mail) */}
      <UserProfileModal
        isOpen={isUserProfileModalOpen}
        onClose={() => setIsUserProfileModalOpen(false)}
        profile={userProfile}
        onSaveProfile={handleSaveUserProfile}
        onLogout={handleLogout}
      />

      {/* Modal Institucional: O Significado e Origem de Hermas (com botão de desativar e cards multicores) */}
      <HermasManifestoModal
        isOpen={isManifestoModalOpen}
        onClose={() => setIsManifestoModalOpen(false)}
        notificationsEnabled={settings.mostrarCuriosidadesHermas}
        onToggleNotifications={handleToggleHermasNotifications}
        activeInsight={selectedHermasInsight}
      />

      {/* Rodapé Discreto */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 py-4 text-center text-xs text-slate-400 print:hidden mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span>Hermas — Cofre Patrimonial Pessoal • Local-first & Determinístico</span>
            <button
              onClick={() => setIsManifestoModalOpen(true)}
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium inline-flex items-center gap-1"
            >
              <span>• O Significado de Hermas (Ἑρμᾶς)</span>
            </button>
          </div>
          <span className="font-mono text-[11px] text-slate-400">Precisão Decimal: 40 dígitos internos • Zero telemetria</span>
        </div>
      </footer>
    </div>
  </div>
  );
}
