/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AssetType } from '../types';

// Lista exaustiva de ETFs listados na B3 que utilizam o sufixo 11
const KNOWN_B3_ETFS = new Set([
  'BOVA11', 'SMAL11', 'IVVB11', 'HASH11', 'XINA11', 'SPXI11', 'BRAX11',
  'DIVO11', 'FIND11', 'MATB11', 'GOVE11', 'ISUS11', 'PIBB11', 'BBSD11',
  'ECOO11', 'GOLD11', 'NASD11', 'TECK11', 'DNAI11', 'ACWI11', 'WRLD11',
  'EURP11', 'ASIA11', 'EMBR11', 'BITH11', 'ETHE11', 'QBTC11', 'QETH11',
  'BOVV11', 'SMAC11', 'XBOV11', 'BBSD11', 'GENB11', 'AGRI11', 'ALUG11',
  'BDOM11', 'BLOK11', 'BMMT11', 'BOVS11', 'BREW11', 'CHIN11', 'COIN11',
  'DEFI11', 'ESGE11', 'ESGD11', 'FOOD11', 'HAPV11', 'IBOB11', 'IFIX11',
  'IMBB11', 'IRFM11', 'LFTT11', 'META11', 'MILL11', 'NTNS11', 'PEVC11',
  'REVE11', 'SVAL11', 'TECB11', 'TRIG11', 'URET11', 'USAL11', 'USTK11',
  'SHOT11', 'YDRO11'
]);

/**
 * Classifica com precisão o tipo de ativo com base no ticker e razão social,
 * eliminando a falsa classificação de ETFs com final 11 como FIIs.
 */
export function classifyAssetType(ticker: string, nome?: string): AssetType {
  const t = (ticker || '').trim().toUpperCase().replace(/F$/, '');
  const n = (nome || '').toUpperCase();

  // 1. Tesouro Direto / Títulos Públicos
  if (
    t.startsWith('TD') ||
    t.startsWith('TESOURO') ||
    t.startsWith('LFT') ||
    t.startsWith('NTN') ||
    t.startsWith('LTN') ||
    n.includes('TESOURO') ||
    n.includes('TITULO PUBLICO')
  ) {
    return 'TESOURO';
  }

  // 2. ETFs (B3 e Internacionais)
  if (
    KNOWN_B3_ETFS.has(t) ||
    n.includes(' ETF') ||
    n.includes('INDEX FUND') ||
    n.includes('ISHARES') ||
    n.includes('IT NOW') ||
    n.includes('HASHDEX') ||
    n.includes('INVESTO')
  ) {
    return 'ETF';
  }

  // 3. BDRs (finais 31, 32, 33, 34, 35)
  if (
    t.endsWith('34') ||
    t.endsWith('35') ||
    t.endsWith('32') ||
    t.endsWith('33') ||
    t.endsWith('31') ||
    n.includes(' BDR')
  ) {
    return 'BDR';
  }

  // 4. Fundos Imobiliários e FIAGRO (finais 11 e subscrições 12, 13, 14)
  if (
    (t.endsWith('11') || t.endsWith('12') || t.endsWith('13') || t.endsWith('14')) &&
    !KNOWN_B3_ETFS.has(t)
  ) {
    return 'FII';
  }

  // 5. Ações (ordinárias, preferenciais, units e direitos de subscrição)
  if (
    /^[A-Z]{4}[1-8]$/.test(t) ||
    /^[A-Z]{4}(?:9|10)$/.test(t) ||
    n.includes(' S.A.') ||
    n.includes(' S/A') ||
    n.includes(' CIA ') ||
    n.includes(' ON') ||
    n.includes(' PN')
  ) {
    return 'AÇÃO';
  }

  return 'AÇÃO';
}
