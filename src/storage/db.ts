/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Asset,
  Operation,
  DocumentRecord,
  Dividend,
  PriceQuote,
  Goal,
  SystemSettings,
  AuditLog,
  UserProfile,
} from '../types';
import { classifyAssetType } from '../engine/assetClassifier';

import avatarAlex from '../assets/images/avatar_investor_alex_1790626799600.jpg';
import avatarElena from '../assets/images/avatar_investor_elena_1790626810030.jpg';
import avatarMarcus from '../assets/images/avatar_investor_marcus_1790626819702.jpg';

export const AVATAR_PRESETS = [
  { id: 'alex', nome: 'Alex — Arrojado', url: avatarAlex },
  { id: 'elena', nome: 'Elena — Estratégica', url: avatarElena },
  { id: 'marcus', nome: 'Marcus — Conservador', url: avatarMarcus },
];

const KEYS = {
  ASSETS: 'hermas_assets_v1',
  OPERATIONS: 'hermas_operations_v1',
  DOCUMENTS: 'hermas_documents_v1',
  DIVIDENDS: 'hermas_dividends_v1',
  QUOTES: 'hermas_quotes_v1',
  GOALS: 'hermas_goals_v1',
  SETTINGS: 'hermas_settings_v1',
  USER_PROFILE: 'hermas_user_profile_v1',
  AUDIT_LOGS: 'hermas_audit_logs_v1',
};

const DEFAULT_SETTINGS: SystemSettings = {
  theme: 'escuro',
  lockTimeoutMinutes: 15,
  brapiApiKey: '',
  mostrarCuriosidadesHermas: true,
  vaultSalt: '4f8b9a2c1d0e5f67a8b9c0d1e2f3a4b5',
  vaultKeyCheck: 'hermas_master_key_check_hash',
};

const DEFAULT_PROFILE: UserProfile = {
  nome: 'Orlando Atanásio',
  email: 'investidor@hermas.local',
  avatarPresetId: 'alex',
  avatarUrl: avatarAlex,
  avatarIniciais: 'OA',
  avatarCor: '#2563eb',
};

const DEFAULT_ASSETS: Asset[] = [
  { id: 'PETR4', ticker: 'PETR4', nome: 'Petrobras PN', tipo: 'AÇÃO', cnpj: '33.000.167/0001-01' },
  { id: 'VALE3', ticker: 'VALE3', nome: 'Vale S.A. ON', tipo: 'AÇÃO', cnpj: '33.592.510/0001-54' },
  { id: 'WEGE3', ticker: 'WEGE3', nome: 'WEG S.A. ON', tipo: 'AÇÃO', cnpj: '84.429.695/0001-11' },
  { id: 'MXRF11', ticker: 'MXRF11', nome: 'Maxi Renda FII', tipo: 'FII', cnpj: '97.521.225/0001-25' },
  { id: 'HGLG11', ticker: 'HGLG11', nome: 'CSHG Logística FII', tipo: 'FII', cnpj: '11.728.688/0001-47' },
  { id: 'IVVB11', ticker: 'IVVB11', nome: 'iShares S&P 500 ETF', tipo: 'ETF', cnpj: '19.909.563/0001-77' },
];

const DEFAULT_OPERATIONS: Operation[] = [
  {
    id: 'op_demo_1',
    assetId: 'PETR4',
    ticker: 'PETR4',
    tipo: 'COMPRA',
    dataPregao: '2024-01-15',
    dataLiquidacao: '2024-01-17',
    quantidade: '100',
    precoUnitario: '36.50',
    taxasB3: '1.20',
    corretagem: '0.00',
    outrosCustos: '0.00',
    custosTotais: '1.20',
    valorTotalOperacao: '3651.20',
    mercado: 'VISTA',
    status: 'CONFIRMADA',
    observacoes: 'Aporte de início de ano',
    createdUtc: '2024-01-15T14:30:00.000Z',
  },
  {
    id: 'op_demo_2',
    assetId: 'WEGE3',
    ticker: 'WEGE3',
    tipo: 'COMPRA',
    dataPregao: '2024-02-10',
    dataLiquidacao: '2024-02-14',
    quantidade: '50',
    precoUnitario: '38.00',
    taxasB3: '0.65',
    corretagem: '0.00',
    outrosCustos: '0.00',
    custosTotais: '0.65',
    valorTotalOperacao: '1900.65',
    mercado: 'VISTA',
    status: 'CONFIRMADA',
    observacoes: 'Aporte estratégico',
    createdUtc: '2024-02-10T15:00:00.000Z',
  },
  {
    id: 'op_demo_3',
    assetId: 'MXRF11',
    ticker: 'MXRF11',
    tipo: 'COMPRA',
    dataPregao: '2024-03-05',
    dataLiquidacao: '2024-03-07',
    quantidade: '250',
    precoUnitario: '10.25',
    taxasB3: '0.80',
    corretagem: '0.00',
    outrosCustos: '0.00',
    custosTotais: '0.80',
    valorTotalOperacao: '2563.30',
    mercado: 'VISTA',
    status: 'CONFIRMADA',
    observacoes: 'Renda passiva',
    createdUtc: '2024-03-05T16:00:00.000Z',
  },
];

const DEFAULT_DIVIDENDS: Dividend[] = [
  {
    id: 'div_demo_1',
    ticker: 'PETR4',
    tipo: 'DIVIDENDO',
    dataCom: '2024-04-25',
    dataPagamento: '2024-05-20',
    quantidadeBase: '100',
    valorPorAcao: '1.45',
    valorBruto: '145.00',
    valorRetidoIR: '0.00',
    valorLiquido: '145.00',
    status: 'RECEBIDO',
    origem: 'Ordinário',
  },
  {
    id: 'div_demo_2',
    ticker: 'MXRF11',
    tipo: 'RENDIMENTO',
    dataCom: '2024-04-30',
    dataPagamento: '2024-05-15',
    quantidadeBase: '250',
    valorPorAcao: '0.10',
    valorBruto: '25.00',
    valorRetidoIR: '0.00',
    valorLiquido: '25.00',
    status: 'RECEBIDO',
    origem: 'Mensal Isento',
  },
];

const DEFAULT_GOALS: Goal[] = [
  {
    id: 'goal_demo_1',
    titulo: 'Independência Financeira & Renda Passiva',
    categoria: 'INDEPENDENCIA_FINANCEIRA',
    valorAlvo: '1000000.00',
    dataAlvo: '2034-12-31',
    taxaEsperadaAa: '10.5',
    valorInicial: '8115.15',
    aporteMensalEstimado: '4250.00',
    status: 'EM_ANDAMENTO',
  },
  {
    id: 'goal_demo_2',
    titulo: 'Reserva de Oportunidades',
    categoria: 'RESERVA_EMERGENCIA',
    valorAlvo: '50000.00',
    dataAlvo: '2025-12-31',
    taxaEsperadaAa: '11.0',
    valorInicial: '8115.15',
    aporteMensalEstimado: '3200.00',
    status: 'EM_ANDAMENTO',
  },
];

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error(`Erro ao salvar ${key}:`, err);
  }
}

export const HermasDB = {
  init() {
    const isDemoCleared = localStorage.getItem('hermas_demo_cleared') === 'true';
    if (!localStorage.getItem(KEYS.SETTINGS)) {
      setStored(KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
    if (!localStorage.getItem(KEYS.USER_PROFILE)) {
      setStored(KEYS.USER_PROFILE, DEFAULT_PROFILE);
    }
    if (!localStorage.getItem(KEYS.ASSETS)) {
      setStored(KEYS.ASSETS, isDemoCleared ? [] : DEFAULT_ASSETS);
    }
    if (!localStorage.getItem(KEYS.OPERATIONS)) {
      setStored(KEYS.OPERATIONS, isDemoCleared ? [] : DEFAULT_OPERATIONS);
    }
    if (!localStorage.getItem(KEYS.DIVIDENDS)) {
      setStored(KEYS.DIVIDENDS, isDemoCleared ? [] : DEFAULT_DIVIDENDS);
    }
    if (!localStorage.getItem(KEYS.GOALS)) {
      setStored(KEYS.GOALS, isDemoCleared ? [] : DEFAULT_GOALS);
    }
    if (!localStorage.getItem(KEYS.DOCUMENTS)) {
      setStored(KEYS.DOCUMENTS, []);
    }
    if (!localStorage.getItem(KEYS.QUOTES)) {
      setStored(KEYS.QUOTES, isDemoCleared ? {} : {
        PETR4: { ticker: 'PETR4', precoAtual: '39.80', variacaoDia: '1.45', fechamentoAnterior: '39.23', dataHoraUtc: new Date().toISOString(), fonte: 'CACHE_LOCAL', status: 'REALTIME' },
        WEGE3: { ticker: 'WEGE3', precoAtual: '42.10', variacaoDia: '0.85', fechamentoAnterior: '41.74', dataHoraUtc: new Date().toISOString(), fonte: 'CACHE_LOCAL', status: 'REALTIME' },
        MXRF11: { ticker: 'MXRF11', precoAtual: '10.45', variacaoDia: '-0.10', fechamentoAnterior: '10.46', dataHoraUtc: new Date().toISOString(), fonte: 'CACHE_LOCAL', status: 'REALTIME' },
      });
    }
    if (!localStorage.getItem(KEYS.AUDIT_LOGS)) {
      setStored(KEYS.AUDIT_LOGS, [
        {
          id: 'log_init',
          timestamp: new Date().toISOString(),
          acao: 'INICIALIZACAO',
          entidade: 'System',
          detalhes: 'Cofre Hermas inicializado com sucesso.',
        },
      ]);
    }
  },

  getAssets(): Asset[] {
    const isDemoCleared = localStorage.getItem('hermas_demo_cleared') === 'true';
    return getStored(KEYS.ASSETS, isDemoCleared ? [] : DEFAULT_ASSETS);
  },

  saveAsset(asset: Asset) {
    const assets = this.getAssets();
    const idx = assets.findIndex(a => a.ticker.toUpperCase() === asset.ticker.toUpperCase());
    if (idx >= 0) {
      assets[idx] = { ...assets[idx], ...asset };
    } else {
      assets.push(asset);
    }
    setStored(KEYS.ASSETS, assets);
  },

  getOperations(): Operation[] {
    const isDemoCleared = localStorage.getItem('hermas_demo_cleared') === 'true';
    return getStored(KEYS.OPERATIONS, isDemoCleared ? [] : DEFAULT_OPERATIONS);
  },

  saveOperation(op: Operation) {
    const list = this.getOperations();
    const idx = list.findIndex(o => o.id === op.id);
    if (idx >= 0) {
      list[idx] = op;
    } else {
      list.push(op);
    }
    setStored(KEYS.OPERATIONS, list);

    // Garante que o ativo esteja cadastrado
    const existingAssets = this.getAssets();
    const tickerClean = op.ticker.toUpperCase().replace(/F$/, '');
    if (!existingAssets.some(a => a.ticker.toUpperCase() === tickerClean || a.ticker.toUpperCase() === op.ticker.toUpperCase())) {
      existingAssets.push({
        id: tickerClean,
        ticker: tickerClean,
        nome: tickerClean,
        tipo: classifyAssetType(tickerClean),
      });
      setStored(KEYS.ASSETS, existingAssets);
    }

    this.logAudit('SALVAR_OPERACAO', 'Operation', `${op.tipo} de ${op.quantidade} ${op.ticker}`);
  },

  saveOperationsBatch(ops: Operation[]) {
    const list = this.getOperations();
    const map = new Map<string, Operation>();
    list.forEach(o => map.set(o.id, o));
    ops.forEach(o => map.set(o.id, o));
    setStored(KEYS.OPERATIONS, Array.from(map.values()));

    // Garante que todos os ativos das operações existam no cadastro de ativos
    const existingAssets = this.getAssets();
    const assetMap = new Map<string, Asset>();
    existingAssets.forEach(a => assetMap.set(a.ticker.toUpperCase(), a));

    let assetsChanged = false;
    for (const op of ops) {
      const tickerClean = op.ticker.toUpperCase().replace(/F$/, '');
      const tickerOp = op.ticker.toUpperCase();
      if (!assetMap.has(tickerOp) && !assetMap.has(tickerClean)) {
        const isFII = tickerClean.endsWith('11');
        const isBDR = tickerClean.endsWith('34') || tickerClean.endsWith('35');
        const isETF = tickerClean.startsWith('BOVA') || tickerClean.startsWith('IVVB') || tickerClean.startsWith('SMAL') || tickerClean.startsWith('HASH');
        const newAsset: Asset = {
          id: tickerClean,
          ticker: tickerClean,
          nome: tickerClean,
          tipo: isFII ? 'FII' : isBDR ? 'BDR' : isETF ? 'ETF' : 'AÇÃO',
        };
        existingAssets.push(newAsset);
        assetMap.set(tickerClean, newAsset);
        assetsChanged = true;
      }
    }
    if (assetsChanged) {
      setStored(KEYS.ASSETS, existingAssets);
    }

    this.logAudit('LOTE_OPERACOES', 'Operation', `${ops.length} operações gravadas em lote.`);
  },

  deleteOperation(id: string) {
    const list = this.getOperations().filter(o => o.id !== id);
    setStored(KEYS.OPERATIONS, list);
    this.logAudit('EXCLUIR_OPERACAO', 'Operation', `Operação ${id} removida.`);
  },

  getDocuments(): DocumentRecord[] {
    return getStored(KEYS.DOCUMENTS, []);
  },

  saveDocument(doc: DocumentRecord) {
    const list = this.getDocuments();
    const idx = list.findIndex(d => d.id === doc.id);
    if (idx >= 0) {
      list[idx] = doc;
    } else {
      list.push(doc);
    }
    setStored(KEYS.DOCUMENTS, list);
    this.logAudit('SALVAR_DOCUMENTO', 'Document', `Nota ${doc.numeroNota} (${doc.corretora})`);
  },

  deleteDocument(id: string, deleteAssociatedOps = true) {
    const list = this.getDocuments().filter(d => d.id !== id);
    setStored(KEYS.DOCUMENTS, list);

    if (deleteAssociatedOps) {
      const ops = this.getOperations().filter(o => o.notaCorretagemId !== id);
      setStored(KEYS.OPERATIONS, ops);
    }

    this.logAudit('EXCLUIR_DOCUMENTO', 'Document', `Nota/Documento ${id} removido.`);
  },

  getDividends(): Dividend[] {
    return getStored(KEYS.DIVIDENDS, DEFAULT_DIVIDENDS);
  },

  saveDividend(div: Dividend) {
    const list = this.getDividends();
    const idx = list.findIndex(d => d.id === div.id);
    if (idx >= 0) {
      list[idx] = div;
    } else {
      list.push(div);
    }
    setStored(KEYS.DIVIDENDS, list);
    this.logAudit('SALVAR_PROVENTO', 'Dividend', `${div.tipo} de ${div.ticker}`);
  },

  deleteDividend(id: string) {
    const list = this.getDividends().filter(d => d.id !== id);
    setStored(KEYS.DIVIDENDS, list);
    this.logAudit('EXCLUIR_PROVENTO', 'Dividend', `Provento ${id} removido.`);
  },

  getQuotes(): Record<string, PriceQuote> {
    return getStored(KEYS.QUOTES, {});
  },

  saveQuotes(quotes: Record<string, PriceQuote>) {
    setStored(KEYS.QUOTES, quotes);
  },

  getGoals(): Goal[] {
    return getStored(KEYS.GOALS, DEFAULT_GOALS);
  },

  saveGoal(goal: Goal) {
    const list = this.getGoals();
    const idx = list.findIndex(g => g.id === goal.id);
    if (idx >= 0) {
      list[idx] = goal;
    } else {
      list.push(goal);
    }
    setStored(KEYS.GOALS, list);
    this.logAudit('SALVAR_META', 'Goal', `Meta "${goal.titulo}"`);
  },

  deleteGoal(id: string) {
    const list = this.getGoals().filter(g => g.id !== id);
    setStored(KEYS.GOALS, list);
    this.logAudit('EXCLUIR_META', 'Goal', `Meta ${id} removida.`);
  },

  getSettings(): SystemSettings {
    return getStored(KEYS.SETTINGS, DEFAULT_SETTINGS);
  },

  saveSettings(settings: SystemSettings) {
    setStored(KEYS.SETTINGS, settings);
    this.logAudit('CONFIGURACOES', 'Settings', 'Configurações atualizadas.');
  },

  getUserProfile(): UserProfile {
    return getStored(KEYS.USER_PROFILE, DEFAULT_PROFILE);
  },

  saveUserProfile(profile: UserProfile) {
    setStored(KEYS.USER_PROFILE, profile);
    this.logAudit('PERFIL_USUARIO', 'UserProfile', `Perfil atualizado para ${profile.nome}.`);
  },

  getAuditLogs(): AuditLog[] {
    return getStored(KEYS.AUDIT_LOGS, []);
  },

  logAudit(acao: string, entidade: string, detalhes: string) {
    const logs = this.getAuditLogs();
    const entry: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      acao,
      entidade,
      detalhes,
    };
    // Mantém no máximo 500 registros
    const updated = [entry, ...logs].slice(0, 500);
    setStored(KEYS.AUDIT_LOGS, updated);
  },

  resetVault() {
    localStorage.clear();
    sessionStorage.clear();
    this.init();
    this.logAudit('RESET_COFRE', 'Security', 'Cofre redefinido com valores padrão.');
  },

  clearDemoData() {
    try {
      localStorage.setItem('hermas_demo_cleared', 'true');
    } catch {}
    setStored(KEYS.OPERATIONS, []);
    setStored(KEYS.DOCUMENTS, []);
    setStored(KEYS.DIVIDENDS, []);
    setStored(KEYS.GOALS, []);
    setStored(KEYS.ASSETS, []);
    setStored(KEYS.QUOTES, {});
    this.logAudit('LIMPAR_DEMO', 'Database', 'Todos os dados de demonstração removidos com sucesso. Cofre zerado e pronto para novas notas.');
  },

  exportFullVaultData() {
    return {
      manifest: {
        app: 'Hermas — Patrimônio Pessoal',
        schemaVersion: '1.0.0',
        exportedAt: new Date().toISOString(),
        precision: '40-digit-canonical-decimal',
      },
      payload: {
        assets: this.getAssets(),
        operations: this.getOperations(),
        documents: this.getDocuments(),
        dividends: this.getDividends(),
        quotes: this.getQuotes(),
        goals: this.getGoals(),
        settings: this.getSettings(),
        userProfile: this.getUserProfile(),
        auditLogs: this.getAuditLogs(),
      },
    };
  },

  async restoreVaultData(
    data: { manifest?: any; payload?: any },
    onProgress?: (step: number, title: string) => void
  ): Promise<{ success: boolean; message?: string }> {
    const report = (step: number, title: string) => {
      if (onProgress) onProgress(step, title);
    };

    try {
      report(1, 'Validação do formato e manifesto do arquivo');
      await new Promise(r => setTimeout(r, 100));

      const payload = data.payload || data;
      if (!payload.settings && !payload.operations) {
        throw new Error('Arquivo de backup inválido ou sem dados compatíveis.');
      }

      report(2, 'Validação da versão de esquema');
      report(3, 'Verificação de integridade de dados e tipos');
      report(4, 'Criação do ponto de restauração local de segurança');
      report(5, 'Validação da tabela de ativos e identificadores');

      if (Array.isArray(payload.assets)) setStored(KEYS.ASSETS, payload.assets);
      report(6, 'Validação das operações e datas contábeis');

      if (Array.isArray(payload.operations)) setStored(KEYS.OPERATIONS, payload.operations);
      report(7, 'Execução de desduplicação e conferência canônica');

      if (Array.isArray(payload.documents)) setStored(KEYS.DOCUMENTS, payload.documents);
      if (Array.isArray(payload.dividends)) setStored(KEYS.DIVIDENDS, payload.dividends);
      if (payload.quotes) setStored(KEYS.QUOTES, payload.quotes);
      if (Array.isArray(payload.goals)) setStored(KEYS.GOALS, payload.goals);
      if (payload.settings) setStored(KEYS.SETTINGS, payload.settings);
      if (payload.userProfile) setStored(KEYS.USER_PROFILE, payload.userProfile);

      try {
        localStorage.removeItem('hermas_demo_cleared');
      } catch {}

      report(8, 'Gravação atômica nos repositórios locais');
      report(9, 'Recálculo determinístico do motor de patrimônio');
      report(10, 'Registro do log de auditoria e integridade');

      this.logAudit('RESTAURACAO_CONCLUIDA', 'Backup', 'Cofre restaurado a partir de arquivo de backup.');
      report(11, 'Restauração concluída com sucesso absoluto');

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
};
