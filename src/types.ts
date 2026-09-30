/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AssetType = 'AÇÃO' | 'FII' | 'ETF' | 'BDR' | 'TESOURO' | 'OUTROS';

export type OperationType =
  | 'COMPRA'
  | 'VENDA'
  | 'DESDOBRAMENTO'
  | 'GRUPAMENTO'
  | 'BONIFICACAO'
  | 'AMORTIZACAO'
  | 'OPENING_POSITION'
  | 'SUBSCRICAO_CONVERSAO'
  | 'SUBSCRICAO_BAIXA'
  | 'DIREITO_EXPIRADO';

export type OperationStatus =
  | 'CONFIRMADA'
  | 'ARREDONDADA'
  | 'PENDENTE'
  | 'PENDENTE_REVISAO'
  | 'INCONSISTENTE'
  | 'CANCELADA';

export type MarketType = 'VISTA' | 'FRACIONARIO' | 'OPCOES' | 'TERMO' | 'FUTUROS';

export type DividendType = 'DIVIDENDO' | 'JCP' | 'RENDIMENTO' | 'AMORTIZACAO' | 'OUTROS';

export interface Asset {
  id: string;
  ticker: string;
  nome: string;
  tipo: AssetType;
  cnpj?: string;
  moeda?: string;
  mercado?: string;
  pais?: string;
  cotacaoAtual?: string;
  variacaoDia?: string;
}

export interface Operation {
  id: string;
  assetId: string;
  ticker: string;
  tipo: OperationType;
  dataPregao: string;
  dataLiquidacao: string;
  quantidade: string;
  precoUnitario: string;
  taxasB3: string;
  corretagem: string;
  outrosCustos: string;
  custosTotais: string;
  valorTotalOperacao: string;
  mercado: MarketType;
  status: OperationStatus;
  observacoes?: string;
  createdUtc: string;
  updatedUtc?: string;
  notaCorretagemId?: string;
  comprovante?: string;
  extraidoOriginal?: any;
  motivoAlteracao?: string;
}

export interface DocumentRecord {
  id: string;
  numeroNota: string;
  dataPregao: string;
  corretora: string;
  nomeArquivo: string;
  tamanhoBytes: number;
  status: 'IMPORTADO' | 'REVISAO_PENDENTE' | 'CONFIRMADO' | 'ERRO';
  candidatosOperacoes?: Operation[];
  rawText?: string;
  createdUtc: string;
}

export interface Dividend {
  id: string;
  assetId?: string;
  ticker: string;
  tipo: DividendType;
  dataCom: string;
  dataPagamento: string;
  quantidadeBase: string;
  valorPorAcao?: string;
  valorBruto?: string;
  valorRetidoIR?: string;
  retencaoIr?: string;
  valorLiquido: string;
  status: 'RECEBIDO' | 'PROVISIONADO';
  origem?: string;
}

export interface PriceQuote {
  ticker: string;
  precoAtual: string;
  variacaoDia: string;
  fechamentoAnterior: string;
  dataHoraUtc: string;
  fonte: string;
  status: 'REALTIME' | 'STALE' | 'DELAYED';
}

export interface Goal {
  id: string;
  titulo: string;
  categoria: 'APOSENTADORIA' | 'RESERVA_EMERGENCIA' | 'IMOVEL' | 'INDEPENDENCIA_FINANCEIRA' | 'OUTROS';
  valorAlvo: string;
  dataAlvo: string;
  taxaEsperadaAa: string;
  valorInicial: string;
  aporteMensalEstimado: string;
  status: 'EM_ANDAMENTO' | 'CONCLUIDA' | 'PAUSADA';
}

export interface SystemSettings {
  theme: 'escuro' | 'claro' | 'sistema';
  lockTimeoutMinutes: number;
  brapiApiKey: string;
  mostrarCuriosidadesHermas: boolean;
  vaultSalt: string;
  vaultKeyCheck: string;
  vaultRecoveryHash?: string;
  corretoraPadrao?: string;
  prejuizoAcumuladoAcoesSwingAnterior?: string;
  prejuizoAcumuladoDayTradeAnterior?: string;
  prejuizoAcumuladoFiiAnterior?: string;
  darfsPagas?: Record<string, any>;
}

export interface UserProfile {
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  avatarUrl?: string;
  avatarPresetId?: string;
  avatarIniciais?: string;
  avatarCor?: string;
  perfilInvestidor?: string;
  bio?: string;
  notasPrivadas?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  acao: string;
  entidade: string;
  detalhes: string;
  ipHash?: string;
}

export interface CustodyPosition {
  ticker: string;
  asset: Asset;
  quantidade: string;
  precoMedio: string;
  custoTotal: string;
  cotacaoAtual: string;
  precoAtual?: string;
  valorAtual: string;
  lucroNaoRealizado: string;
  rentabilidadeNaoRealizadaPct: string;
  percentualCarteira: string;
  dataUltimaOperacao?: string;
  proventosRecebidosHistorico?: string;
  totalReturn?: string;
  lucroRealizadoHistorico?: string;
  hasMarketQuote?: boolean;
  isStaleOrEstimated?: boolean;
}

export interface MonthlyTaxSummary {
  mesAno: string;
  totalVendasAcoesSwing: string;
  lucroLiquidoAcoesSwing: string;
  isentoAcoesSwing: boolean;
  impostoDevidoAcoesSwing: string;
  totalVendasDayTrade: string;
  lucroLiquidoDayTrade: string;
  impostoDevidoDayTrade: string;
  totalVendasFII: string;
  lucroLiquidoFII: string;
  impostoDevidoFII: string;
  prejuizoAcumuladoAnteriorAcoes: string;
  prejuizoAcumuladoAnteriorDayTrade: string;
  prejuizoAcumuladoAnteriorFII: string;
  prejuizoCompensadoAcoes: string;
  prejuizoCompensadoDayTrade: string;
  prejuizoCompensadoFII: string;
  novoPrejuizoAcumuladoAcoes: string;
  novoPrejuizoAcumuladoDayTrade: string;
  novoPrejuizoAcumuladoFII: string;
  totalImpostoDevido: string;
  irrfDedoDuro: string;
  impostoAPagarAposDedoDuro: string;
  statusMensal: 'SEM_OPERACAO' | 'LUCRO_TRIBUTAVEL' | 'COMPENSADO_TOTAL' | 'PREJUIZO_ACUMULADO' | 'ISENTO';
}
