/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Goal } from '../types';
import { D, toCanonicalString } from './decimal';

export interface GoalMonthProjection {
  mesIndice: number;
  dataPrevista: string;
  saldoInicial: string;
  rendimentoMes: string;
  aporteMes: string;
  saldoFinal: string;
}

/**
 * Calcula a contribuição mensal necessária (PMT) com juros compostos
 * FV = PV*(1+i)^n + PMT * [((1+i)^n - 1) / i]
 */
export function calculateRequiredMonthlyContribution(
  targetValue: string | number,
  initialValue: string | number,
  months: number,
  annualRatePct: string | number
): string {
  const fv = D(targetValue);
  const pv = D(initialValue);
  const n = Math.max(months, 1);
  const rateAa = D(annualRatePct).div(100);

  // Taxa mensal equivalente: (1 + i_aa)^(1/12) - 1
  const monthlyRateNum = Math.pow(1 + rateAa.toNumber(), 1 / 12) - 1;
  const i = D(monthlyRateNum);

  if (i.isZero() || i.isNaN()) {
    const diff = fv.sub(pv);
    return diff.gt(0) ? toCanonicalString(diff.div(n), 2) : '0.00';
  }

  // (1 + i)^n
  const compoundFactor = Math.pow(1 + monthlyRateNum, n);
  const compound = D(compoundFactor);

  const pvFuture = pv.mul(compound);
  const shortfall = fv.sub(pvFuture);

  if (shortfall.lte(0)) {
    return '0.00';
  }

  const pmt = shortfall.mul(i).div(compound.sub(1));
  return toCanonicalString(pmt, 2);
}

/**
 * Gera a tabela de evolução mês a mês do patrimônio rumo à meta
 */
export function generateGoalProjections(
  goal: Goal,
  currentPatrimony: string | number,
  maxMonths = 60
): GoalMonthProjection[] {
  const fv = D(goal.valorAlvo);
  const pv = D(currentPatrimony || goal.valorInicial);
  const rateAa = D(goal.taxaEsperadaAa).div(100);
  const monthlyRateNum = Math.pow(1 + rateAa.toNumber(), 1 / 12) - 1;
  const i = D(monthlyRateNum);

  const hoje = new Date();
  const alvo = new Date(goal.dataAlvo);
  const diffMonths = Math.max((alvo.getFullYear() - hoje.getFullYear()) * 12 + (alvo.getMonth() - hoje.getMonth()), 1);
  const totalMonths = Math.min(diffMonths, maxMonths);

  const pmt = D(goal.aporteMensalEstimado || '0');

  const projections: GoalMonthProjection[] = [];
  let currentSaldo = pv;

  for (let m = 1; m <= totalMonths; m++) {
    const projDate = new Date(hoje.getFullYear(), hoje.getMonth() + m, 1);
    const yyyy = projDate.getFullYear();
    const mm = String(projDate.getMonth() + 1).padStart(2, '0');
    const dataPrevista = `${yyyy}-${mm}`;

    const saldoInicial = currentSaldo;
    const rendimentoMes = saldoInicial.mul(i);
    const aporteMes = pmt;
    const saldoFinal = saldoInicial.add(rendimentoMes).add(aporteMes);

    projections.push({
      mesIndice: m,
      dataPrevista,
      saldoInicial: toCanonicalString(saldoInicial, 2),
      rendimentoMes: toCanonicalString(rendimentoMes, 2),
      aporteMes: toCanonicalString(aporteMes, 2),
      saldoFinal: toCanonicalString(saldoFinal, 2),
    });

    currentSaldo = saldoFinal;
  }

  return projections;
}
