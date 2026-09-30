/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HermasIconType =
  | 'trending-up'
  | 'coins'
  | 'shield'
  | 'sparkles'
  | 'book'
  | 'feather'
  | 'scale'
  | 'compass';

export type HermasCardColor = 'blue' | 'emerald' | 'amber' | 'violet' | 'cyan';

export interface HermasInsight {
  titulo: string;
  citacao: string;
  detalhe: string;
  corTema: HermasCardColor;
  iconeTipo?: HermasIconType;
}

export interface ThemeConfig {
  cardBg: string;
  cardBorder: string;
  badge: string;
  accentText: string;
  iconBox: string;
  label: string;
  progressColor: string;
  borderAccent: string;
  glow: string;
  progressBar: string;
  link: string;
}

export const HERMAS_COLOR_THEMES: Record<HermasCardColor, ThemeConfig> = {
  blue: {
    cardBg: 'bg-blue-50/90 dark:bg-blue-950/40',
    cardBorder: 'border-blue-200 dark:border-blue-800/80',
    badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    accentText: 'text-blue-700 dark:text-blue-400',
    iconBox: 'bg-blue-100 dark:bg-blue-900/60 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400',
    label: 'Azul (Ações / Hermas)',
    progressColor: 'bg-blue-600',
    borderAccent: 'hover:border-blue-500/50',
    glow: 'hover:shadow-blue-500/10',
    progressBar: 'bg-blue-600',
    link: 'text-blue-600 dark:text-blue-400',
  },
  emerald: {
    cardBg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
    cardBorder: 'border-emerald-200 dark:border-emerald-800/80',
    badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
    accentText: 'text-emerald-700 dark:text-emerald-400',
    iconBox: 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400',
    label: 'Verde (FIIs / Lucro)',
    progressColor: 'bg-emerald-600',
    borderAccent: 'hover:border-emerald-500/50',
    glow: 'hover:shadow-emerald-500/10',
    progressBar: 'bg-emerald-600',
    link: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    cardBg: 'bg-amber-50/90 dark:bg-amber-950/40',
    cardBorder: 'border-amber-200 dark:border-amber-800/80',
    badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700',
    accentText: 'text-amber-700 dark:text-amber-400',
    iconBox: 'bg-amber-100 dark:bg-amber-900/60 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400',
    label: 'Amarelo (Renda Fixa / Atenção)',
    progressColor: 'bg-amber-500',
    borderAccent: 'hover:border-amber-500/50',
    glow: 'hover:shadow-amber-500/10',
    progressBar: 'bg-amber-500',
    link: 'text-amber-600 dark:text-amber-400',
  },
  violet: {
    cardBg: 'bg-violet-50/90 dark:bg-violet-950/40',
    cardBorder: 'border-violet-200 dark:border-violet-800/80',
    badge: 'bg-violet-100 dark:bg-violet-900/60 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-700',
    accentText: 'text-violet-700 dark:text-violet-400',
    iconBox: 'bg-violet-100 dark:bg-violet-900/60 border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400',
    label: 'Roxo (Histórico / Disciplina)',
    progressColor: 'bg-violet-600',
    borderAccent: 'hover:border-violet-500/50',
    glow: 'hover:shadow-violet-500/10',
    progressBar: 'bg-violet-600',
    link: 'text-violet-600 dark:text-violet-400',
  },
  cyan: {
    cardBg: 'bg-cyan-50/90 dark:bg-cyan-950/40',
    cardBorder: 'border-cyan-200 dark:border-cyan-800/80',
    badge: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700',
    accentText: 'text-cyan-700 dark:text-cyan-400',
    iconBox: 'bg-cyan-100 dark:bg-cyan-900/60 border-cyan-300 dark:border-cyan-700 text-cyan-600 dark:text-cyan-400',
    label: 'Ciano (Matemática / Precisão)',
    progressColor: 'bg-cyan-600',
    borderAccent: 'hover:border-cyan-500/50',
    glow: 'hover:shadow-cyan-500/10',
    progressBar: 'bg-cyan-600',
    link: 'text-cyan-600 dark:text-cyan-400',
  },
};

export const HERMAS_INSIGHTS_BY_TAB: Record<string, HermasInsight[]> = {
  'visao-geral': [
    {
      titulo: 'O Mensageiro da Realidade',
      citacao: 'Hermas não decide por você; comunica a verdade pura dos seus números.',
      detalhe: 'Acompanhe seu patrimônio consolidado com base estritamente determinística e offline.',
      corTema: 'blue',
      iconeTipo: 'compass',
    },
    {
      titulo: 'Precisão Matemática',
      citacao: 'Zero aproximações de ponto flutuante.',
      detalhe: 'Cada centavo é apurado com 40 dígitos internos de precisão decimal.',
      corTema: 'cyan',
      iconeTipo: 'scale',
    },
  ],
  carteira: [
    {
      titulo: 'Custódia Determinística',
      citacao: 'O preço médio real inclui custos operacionais legítimos.',
      detalhe: 'Emolumentos e taxas B3 compõem o custo de aquisição conforme a IN RFB 1.585.',
      corTema: 'emerald',
      iconeTipo: 'coins',
    },
    {
      titulo: 'Alocação Equilibrada',
      citacao: 'Diversificação é controle de risco, não dispersão.',
      detalhe: 'Analise o peso relativo de cada classe para manter a estratégia intacta.',
      corTema: 'blue',
      iconeTipo: 'trending-up',
    },
  ],
  operacoes: [
    {
      titulo: 'Registro Cronológico',
      citacao: 'Uma operação registrada na data do pregão é soberana.',
      detalhe: 'A apuração do preço médio segue ordem estrita de ocorrência.',
      corTema: 'violet',
      iconeTipo: 'book',
    },
    {
      titulo: 'Eventos Corporativos',
      citacao: 'Splits e grupamentos alteram quantidade, mantendo custo histórico.',
      detalhe: 'Utilize o assistente de eventos corporativos para ajustar sua custódia com exatidão.',
      corTema: 'cyan',
      iconeTipo: 'sparkles',
    },
  ],
  documentos: [
    {
      titulo: 'Privacidade Total',
      citacao: 'Seus extratos e notas nunca saem do seu dispositivo.',
      detalhe: 'O leitor de PDF roda no próprio navegador, sem envio a servidores remotos.',
      corTema: 'blue',
      iconeTipo: 'shield',
    },
  ],
  metas: [
    {
      titulo: 'Juros Compostos',
      citacao: 'A constância nos aportes supera oscilações temporárias de mercado.',
      detalhe: 'Projeções financeiras calculadas com a fórmula canônica de anuidades.',
      corTema: 'amber',
      iconeTipo: 'trending-up',
    },
  ],
  impostos: [
    {
      titulo: 'Conformidade Fiscal',
      citacao: 'Isenção de R$ 20k em ações swing é por mês de alienação.',
      detalhe: 'FIIs e Day Trade não possuem isenção; compense prejuízos passados rigorosamente.',
      corTema: 'amber',
      iconeTipo: 'scale',
    },
  ],
  relatorios: [
    {
      titulo: 'Relatórios Contábeis',
      citacao: 'Documentos prontos para o IRPF ou arquivamento perene.',
      detalhe: 'Gere extratos em papel A4 ou planilhas CSV com formatação brasileira.',
      corTema: 'violet',
      iconeTipo: 'feather',
    },
  ],
  backup: [
    {
      titulo: 'Soberania dos Seus Dados',
      citacao: 'Criptografia AES-256-GCM com derivação de chave PBKDF2.',
      detalhe: 'Exporte pacotes .ZIP auditáveis contendo manifest e payload íntegros.',
      corTema: 'emerald',
      iconeTipo: 'shield',
    },
  ],
  configuracoes: [
    {
      titulo: 'Cofre Local-First',
      citacao: 'Suas preferências e chaves residem com você.',
      detalhe: 'Personalize o tema, tempo de bloqueio automático e dados do perfil.',
      corTema: 'blue',
      iconeTipo: 'compass',
    },
  ],
};

export const HERMAS_INSTITUTIONAL_MANIFESTO = {
  analogiaFuncional: [
    {
      situacao: 'Ações e Custódia',
      comunicacao: 'Comunica o preço médio legítimo e o retorno líquido real de cada empresa.',
      corTema: 'blue' as HermasCardColor,
      iconeTipo: 'trending-up' as HermasIconType,
    },
    {
      situacao: 'Fundos Imobiliários',
      comunicacao: 'Informa os rendimentos mensais isentos e apura o ganho de capital na alienação.',
      corTema: 'emerald' as HermasCardColor,
      iconeTipo: 'coins' as HermasIconType,
    },
    {
      situacao: 'Gestão de Riscos & Alertas',
      comunicacao: 'Sinaliza vencimentos de DARFs, limites de isenção de R$ 20k e prejuízos a compensar.',
      corTema: 'amber' as HermasCardColor,
      iconeTipo: 'scale' as HermasIconType,
    },
    {
      situacao: 'Disciplina Contábil',
      comunicacao: 'Mantém trilha de auditoria e linha do tempo imutável de todas as decisões.',
      corTema: 'violet' as HermasCardColor,
      iconeTipo: 'book' as HermasIconType,
    },
    {
      situacao: 'Motor Determinístico',
      comunicacao: 'Precisão matemática absoluta de 40 dígitos, sem arredondamentos comerciais imprecisos.',
      corTema: 'cyan' as HermasCardColor,
      iconeTipo: 'sparkles' as HermasIconType,
    },
  ],
  identidadeConceitual: [
    {
      elemento: 'Nome Hermas (Ἑρμᾶς)',
      interpretacao: 'O mensageiro confiável que traduz a realidade dos fatos contábeis.',
    },
    {
      elemento: 'Arquitetura Local-First',
      interpretacao: 'Independência de servidores de terceiros; seus dados são de sua propriedade.',
    },
    {
      elemento: 'Criptografia no Navegador',
      interpretacao: 'Proteção ponta a ponta com chaves geradas e custodiadas pelo titular.',
    },
    {
      elemento: 'Determinismo Financeiro',
      interpretacao: 'O mesmo histórico de operações sempre produz exatamente o mesmo resultado patrimonial.',
    },
  ],
  apresentacaoOficial: `HERMAS — Cofre Patrimonial Pessoal e Motor Fiscal Determinístico.

O aplicativo Hermas foi concebido com uma única premissa fundamental: devolver ao investidor a soberania total sobre seus dados e a clareza absoluta sobre o seu patrimônio.

Inspirado na tradição grega do mensageiro fiel que transmite os fatos com exatidão sem distorções, o Hermas calcula cada centavo, preço médio e tributo com base exclusivamente em regras contábeis auditáveis e normas da Receita Federal do Brasil.

Sem servidores intermediários, sem telemetria e com suporte completo a operação offline (PWA).`,
};
