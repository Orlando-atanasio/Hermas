/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Decimal from 'decimal.js';

// Precisão de 40 dígitos internos determinísticos para cálculo financeiro e tributário sem arredondamento IEEE-754
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };

export function D(val: any): Decimal {
  if (val === null || val === undefined || val === '') return new Decimal(0);
  if (val instanceof Decimal) return val;
  try {
    if (typeof val === 'number') return new Decimal(val);
    if (typeof val === 'string') {
      let str = val.replace(/[R$\s\u00A0]/g, '').trim();
      if (str.includes(',')) {
        // Formato brasileiro: pontos são separadores de milhar, vírgula é decimal
        str = str.replace(/\./g, '').replace(',', '.');
      }
      return new Decimal(str || 0);
    }
    return new Decimal(val);
  } catch {
    return new Decimal(0);
  }
}

export function toCanonicalString(d: Decimal | string | number, maxDecimals = 4): string {
  const dec = D(d);
  if (dec.isNaN()) return '0.00';
  // Formato canônico interno: ponto como separador decimal, no mínimo 2 e até maxDecimals dígitos significativos
  const str = dec.toFixed(maxDecimals);
  const parts = str.split('.');
  if (parts.length === 2) {
    const intPart = parts[0];
    let decPart = parts[1].replace(/0+$/, '');
    if (decPart.length < 2) {
      decPart = decPart.padEnd(2, '0');
    }
    return `${intPart}.${decPart}`;
  }
  return `${str}.00`;
}

export function formatBRL(value: any): string {
  const dec = D(value);
  const isNeg = dec.isNegative();
  const absVal = dec.abs().toNumber();
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absVal);

  return isNeg ? `-${formatted}` : formatted;
}

export function formatPercent(
  value: any,
  decimalsOrIncludeSign: number | boolean = 2,
  includeSign = true
): string {
  const dec = D(value);
  const num = dec.toNumber();
  const decimals = typeof decimalsOrIncludeSign === 'number' ? decimalsOrIncludeSign : 2;
  const showSign = typeof decimalsOrIncludeSign === 'boolean' ? decimalsOrIncludeSign : includeSign;
  const sign = showSign && num > 0 ? '+' : '';
  return `${sign}${num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

export function formatNumber(value: any, decimals = 2): string {
  const dec = D(value);
  return dec.toNumber().toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function isPositive(value: any): boolean {
  return D(value).gt(0);
}

export function isNegative(value: any): boolean {
  return D(value).lt(0);
}

export function roundTo(value: any, decimals = 2): Decimal {
  return D(value).toDecimalPlaces(decimals);
}
