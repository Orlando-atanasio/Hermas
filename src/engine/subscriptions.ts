/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SubscriptionInfo {
  isSubscription: boolean;
  kind: 'DIREITO_FII' | 'RECIBO_FII' | 'SOBRAS_FII' | 'DIREITO_ACAO_ON' | 'DIREITO_ACAO_PN' | 'RECIBO_ACAO_ON' | 'RECIBO_ACAO_PN' | null;
  codeSuffix: string;
  badgeLabel: string;
  badgeClass: string;
  title: string;
  stageName: string;
  targetTicker: string;
  baseTicker: string;
  canExpire: boolean;
  explanation: string;
  guidanceText: string;
}

/**
 * Identifica e decodifica tickers de direitos e recibos de subscrição na B3:
 * - FIIs: Finais 12 (Direito), 13 (Recibo), 14 (Sobras), 15 (Sobras Adicionais) -> Convertem em final 11
 * - Ações:
 *   - Finais 1 (Direito ON), 9 (Recibo ON) -> Convertem em final 3 (Ação Ordinária)
 *   - Finais 2 (Direito PN), 10 (Recibo PN) -> Convertem em final 4 (Ação Preferencial)
 * - BDRs: Finais 31, 32 -> Convertem em final 34 ou 35
 */
export function getSubscriptionInfo(ticker: string): SubscriptionInfo {
  const upper = (ticker || '').trim().toUpperCase();
  const cleanTicker = upper.endsWith('F') && upper.length >= 5 ? upper.slice(0, -1) : upper;

  // 1. FIIs - Finais 12, 13, 14, 15
  if (/^[A-Z]{4}12$/.test(cleanTicker)) {
    const base = cleanTicker.slice(0, 4);
    return {
      isSubscription: true,
      kind: 'DIREITO_FII',
      codeSuffix: '12',
      badgeLabel: 'DIREITO 12',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      title: 'Direito de Subscrição de FII (Final 12)',
      stageName: 'Direito de Preferência (Fase 1)',
      targetTicker: `${base}11`,
      baseTicker: base,
      canExpire: true,
      explanation: 'Garante ao cotista a preferência para subscrever novas cotas da emissão pelo preço fixado na oferta.',
      guidanceText: 'Não distribui dividendos regulares e possui prazo de validade (vira pó se não exercido nem vendido na bolsa). Após você exercer e pagar as novas cotas, vira recibo (final 13) e posteriormente converte-se na cota final 11.',
    };
  }

  if (/^[A-Z]{4}13$/.test(cleanTicker)) {
    const base = cleanTicker.slice(0, 4);
    return {
      isSubscription: true,
      kind: 'RECIBO_FII',
      codeSuffix: '13',
      badgeLabel: 'RECIBO 13',
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800',
      title: 'Recibo de Subscrição de FII (Final 13)',
      stageName: 'Recibo Pago (Aguardando Homologação CVM)',
      targetTicker: `${base}11`,
      baseTicker: base,
      canExpire: false,
      explanation: 'Comprovante oficial emitido após você exercer o direito e realizar o pagamento das novas cotas.',
      guidanceText: 'Recebe rendimentos pro-rata durante o período da oferta. Ao término e homologação da emissão pela CVM, este recibo será convertido automaticamente na cota definitiva final 11.',
    };
  }

  if (/^[A-Z]{4}14$/.test(cleanTicker)) {
    const base = cleanTicker.slice(0, 4);
    return {
      isSubscription: true,
      kind: 'SOBRAS_FII',
      codeSuffix: '14',
      badgeLabel: 'SOBRAS 14',
      badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800',
      title: 'Recibo de Sobras de Subscrição de FII (Final 14)',
      stageName: 'Período de Sobras da Emissão',
      targetTicker: `${base}11`,
      baseTicker: base,
      canExpire: false,
      explanation: 'Representa cotas subscritas referentes ao rateio de sobras não exercidas na primeira etapa da oferta.',
      guidanceText: 'Aguardando encerramento formal da oferta para conversão automática em cotas finais 11.',
    };
  }

  // 2. Ações Ordinárias - Final 1 (Direito ON), Final 9 (Recibo ON)
  if (/^[A-Z]{4}1$/.test(cleanTicker) && !cleanTicker.endsWith('11')) {
    const base = cleanTicker.slice(0, 4);
    return {
      isSubscription: true,
      kind: 'DIREITO_ACAO_ON',
      codeSuffix: '1',
      badgeLabel: 'DIREITO ON 1',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      title: 'Direito de Subscrição de Ação ON (Final 1)',
      stageName: 'Direito de Subscrição Ordinária',
      targetTicker: `${base}3`,
      baseTicker: base,
      canExpire: true,
      explanation: 'Direito de preferência para subscrição de novas ações ordinárias (ON).',
      guidanceText: 'Converte-se em ações ordinárias final 3 (ex: PETR3, VALE3) após o exercício da subscrição.',
    };
  }

  if (/^[A-Z]{4}9$/.test(cleanTicker)) {
    const base = cleanTicker.slice(0, 4);
    return {
      isSubscription: true,
      kind: 'RECIBO_ACAO_ON',
      codeSuffix: '9',
      badgeLabel: 'RECIBO ON 9',
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800',
      title: 'Recibo de Subscrição de Ação ON (Final 9)',
      stageName: 'Recibo de Ações ON',
      targetTicker: `${base}3`,
      baseTicker: base,
      canExpire: false,
      explanation: 'Recibo gerado após o pagamento de novas ações ordinárias subscritas.',
      guidanceText: 'Converte-se automaticamente na ação final 3 após a homologação do aumento de capital.',
    };
  }

  // 3. Ações Preferenciais - Final 2 (Direito PN), Final 10 (Recibo PN)
  if (/^[A-Z]{4}2$/.test(cleanTicker)) {
    const base = cleanTicker.slice(0, 4);
    return {
      isSubscription: true,
      kind: 'DIREITO_ACAO_PN',
      codeSuffix: '2',
      badgeLabel: 'DIREITO PN 2',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      title: 'Direito de Subscrição de Ação PN (Final 2)',
      stageName: 'Direito de Subscrição Preferencial',
      targetTicker: `${base}4`,
      baseTicker: base,
      canExpire: true,
      explanation: 'Direito de preferência para subscrição de novas ações preferenciais (PN).',
      guidanceText: 'Converte-se em ações preferenciais final 4 (ex: PETR4, ITSA4) após o exercício da subscrição.',
    };
  }

  if (/^[A-Z]{4}10$/.test(cleanTicker)) {
    const base = cleanTicker.slice(0, 4);
    return {
      isSubscription: true,
      kind: 'RECIBO_ACAO_PN',
      codeSuffix: '10',
      badgeLabel: 'RECIBO PN 10',
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800',
      title: 'Recibo de Subscrição de Ação PN (Final 10)',
      stageName: 'Recibo de Ações PN',
      targetTicker: `${base}4`,
      baseTicker: base,
      canExpire: false,
      explanation: 'Recibo gerado após o pagamento de novas ações preferenciais subscritas.',
      guidanceText: 'Converte-se automaticamente na ação preferencial final 4 após homologação do aumento de capital.',
    };
  }

  return {
    isSubscription: false,
    kind: null,
    codeSuffix: '',
    badgeLabel: '',
    badgeClass: '',
    title: '',
    stageName: '',
    targetTicker: '',
    baseTicker: '',
    canExpire: false,
    explanation: '',
    guidanceText: '',
  };
}

export function isSubscriptionTicker(ticker: string): boolean {
  return getSubscriptionInfo(ticker).isSubscription;
}
