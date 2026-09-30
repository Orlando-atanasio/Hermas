import { D, toCanonicalString } from './decimal';
import { Asset, Operation, MonthlyTaxSummary } from '../types';
import { classifyAssetType } from './assetClassifier';

export interface TaxRuleInfo {
  id: string;
  nome: string;
  aliquota: string;
  isencaoMensal: string;
  irrfFonte: string;
  baseLegal: string;
}

export const TAX_RULES: Record<string, TaxRuleInfo> = {
  'TAX-BR-ACOES-SWING': {
    id: 'TAX-BR-ACOES-SWING-v1',
    nome: 'Ações B3 (Operações Comuns / Swing Trade)',
    aliquota: '15%',
    isencaoMensal: 'R$ 20.000,00',
    irrfFonte: '0,005% sobre o valor de alienação (quando total IRRF > R$ 1,00)',
    baseLegal: 'Lei nº 11.033/2004, art. 3º; IN RFB nº 1.585/2015, art. 59.',
  },
  'TAX-BR-DAYTRADE': {
    id: 'TAX-BR-DAYTRADE-v1',
    nome: 'Day Trade (Qualquer Ativo B3)',
    aliquota: '20%',
    isencaoMensal: 'Sem isenção (qualquer alienação com lucro é tributável)',
    irrfFonte: '1,0% retido na fonte sobre o ganho líquido apurado no dia',
    baseLegal: 'Lei nº 9.959/2000; IN RFB nº 1.585/2015, art. 65.',
  },
  'TAX-BR-FII': {
    id: 'TAX-BR-FII-v1',
    nome: 'Fundos de Investimento Imobiliário (FII / FIAGRO / FI-Infra)',
    aliquota: '20%',
    isencaoMensal: 'Sem isenção de R$ 20k para ganho de capital na alienação de cotas',
    irrfFonte: '0,005% sobre o valor de alienação',
    baseLegal: 'Lei nº 8.668/1993, art. 16-A; Lei nº 11.033/2004.',
  },
  'TAX-BR-ETF': {
    id: 'TAX-BR-ETF-v1',
    nome: 'ETFs de Renda Variável',
    aliquota: '15%',
    isencaoMensal: 'Sem isenção de R$ 20.000,00',
    irrfFonte: '0,005% sobre alienação',
    baseLegal: 'Lei nº 13.043/2014; IN RFB nº 1.585/2015.',
  },
};

export const LEGAL_DISCLAIMERS = [
  'Este módulo possui caráter exclusivamente educativo e de apoio à organização pessoal.',
  'Não constitui consultoria tributária, contábil ou fiscal oficial.',
  'Não emite guias DARF nem substitui o preenchimento da Declaração de Ajuste Anual do IRPF.',
  'Compensações de prejuízos acumulados devem ser verificadas e validadas com contador habilitado.',
  'Regulamentações fundamentadas na Lei nº 11.033/2004 e Instrução Normativa RFB nº 1.585/2015.',
];

// Feriados bancários nacionais fixos (MM-DD) e móveis conhecidos
const NATIONAL_HOLIDAYS_FIXED = new Set([
  '01-01', // Confraternização Universal
  '04-21', // Tiradentes
  '05-01', // Dia do Trabalho
  '09-07', // Independência do Brasil
  '10-12', // Nossa Senhora Aparecida
  '11-02', // Finados
  '11-15', // Proclamação da República
  '11-20', // Dia da Consciência Negra (Lei nº 14.759/2023)
  '12-25', // Natal
  '12-31', // Último dia útil do ano (sem expediente bancário ao público - Resolução CMN/Bacen)
]);

// Feriados móveis bancários (Sexta-Feira Santa / Carnaval / Corpus Christi)
const KNOWN_MOBILE_HOLIDAYS = new Set([
  '2024-03-29', // Sexta-feira Santa 2024
  '2024-05-30', // Corpus Christi 2024
  '2025-04-18', // Sexta-feira Santa 2025
  '2025-06-19', // Corpus Christi 2025
  '2026-04-03', // Sexta-feira Santa 2026
  '2026-06-04', // Corpus Christi 2026
  '2027-03-26', // Sexta-feira Santa 2027
  '2027-05-27', // Corpus Christi 2027
]);

/**
 * Calcula a data limite de vencimento do DARF (último dia útil do mês subsequente)
 * Conforme art. 60 da IN RFB nº 1.585/2015, se o dia do vencimento recair em dia não útil (sábado, domingo ou feriado bancário),
 * o pagamento deve ser antecipado para o dia útil imediatamente anterior.
 */
export function getDarfDueDate(mesAno: string): string {
  const [yearStr, monthStr] = mesAno.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month)) return '';
  
  let nextYear = year;
  let nextMonth = month + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  
  const lastDayDate = new Date(nextYear, nextMonth, 0);

  // Recua dia a dia até encontrar um dia útil bancário
  while (true) {
    const dayOfWeek = lastDayDate.getDay();
    const mmDd = `${String(lastDayDate.getMonth() + 1).padStart(2, '0')}-${String(lastDayDate.getDate()).padStart(2, '0')}`;
    const yyyyMmDd = `${lastDayDate.getFullYear()}-${mmDd}`;

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = NATIONAL_HOLIDAYS_FIXED.has(mmDd) || KNOWN_MOBILE_HOLIDAYS.has(yyyyMmDd);

    if (!isWeekend && !isHoliday) {
      break;
    }
    lastDayDate.setDate(lastDayDate.getDate() - 1);
  }
  
  const y = lastDayDate.getFullYear();
  const m = String(lastDayDate.getMonth() + 1).padStart(2, '0');
  const d = String(lastDayDate.getDate()).padStart(2, '0');
  return `${d}/${m}/${y}`;
}

/**
 * Formata competência YYYY-MM para texto legível em português (ex: "Agosto de 2024")
 */
export function formatCompetenciaBr(mesAno: string): string {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const [yearStr, monthStr] = mesAno.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${meses[monthIdx]} de ${yearStr}`;
  }
  return mesAno;
}

/**
 * Calcula o resumo tributário mês a mês com controle de prejuízos acumulados
 * separados rigorosamente por modalidade (Ações Swing, Day Trade, FIIs).
 */
export function calculateMonthlyTaxes(
  assets: Asset[],
  operations: Operation[],
  saldoInicialPrejuizos?: { acoes?: string; daytrade?: string; fii?: string }
): MonthlyTaxSummary[] {
  const assetMap = new Map<string, Asset>();
  assets.forEach(a => assetMap.set(a.ticker.toUpperCase(), a));

  // Apenas operações confirmadas
  const validOps = operations
    .filter(op => op.status === 'CONFIRMADA' || op.status === 'ARREDONDADA')
    .sort((a, b) => {
      const cmpDate = a.dataPregao.localeCompare(b.dataPregao);
      if (cmpDate !== 0) return cmpDate;
      return a.createdUtc.localeCompare(b.createdUtc);
    });

  // Rastreamento contínuo de custo médio por ativo
  const currentAvgCost = new Map<string, { qty: string; totalCost: string }>();

  // Agrupamento de vendas por mês (YYYY-MM)
  interface MonthBucket {
    mesAno: string;
    vendasAcoesSwing: { alienacao: string; lucroLiquido: string }[];
    vendasETFBDR: { alienacao: string; lucroLiquido: string }[];
    vendasDayTrade: { alienacao: string; lucroLiquido: string }[];
    vendasFII: { alienacao: string; lucroLiquido: string }[];
  }

  // Pré-cálculo para identificar operações que configuram Day Trade:
  // Se houver COMPRA e VENDA do mesmo ativo na mesma dataPregao, a menor quantidade comum é Day Trade.
  const dayTradeMatchMap = new Map<string, { buyQty: any; sellQty: any }>();
  for (const op of validOps) {
    if (op.tipo === 'COMPRA' || op.tipo === 'VENDA') {
      const key = `${op.ticker.toUpperCase()}_${op.dataPregao}`;
      if (!dayTradeMatchMap.has(key)) {
        dayTradeMatchMap.set(key, { buyQty: D(0), sellQty: D(0) });
      }
      const entry = dayTradeMatchMap.get(key)!;
      if (op.tipo === 'COMPRA') entry.buyQty = entry.buyQty.add(D(op.quantidade));
      if (op.tipo === 'VENDA') entry.sellQty = entry.sellQty.add(D(op.quantidade));
    }
  }

  // Quantidade de cada ticker/data já alocada como Day Trade
  const allocatedDayTradeSell = new Map<string, any>();

  const monthsMap = new Map<string, MonthBucket>();

  for (const op of validOps) {
    const t = op.ticker.toUpperCase();
    const asset = assetMap.get(t);
    const tipoAtivo = asset?.tipo || classifyAssetType(t, asset?.nome);

    if (!currentAvgCost.has(t)) {
      currentAvgCost.set(t, { qty: '0', totalCost: '0' });
    }
    const state = currentAvgCost.get(t)!;
    let qty = D(state.qty);
    let totalCost = D(state.totalCost);

    const opQty = D(op.quantidade);
    const opPrice = D(op.precoUnitario);
    const opCosts = D(op.custosTotais);

    if (op.tipo === 'OPENING_POSITION') {
      qty = opQty;
      totalCost = opQty.mul(opPrice);
      currentAvgCost.set(t, { qty: toCanonicalString(qty), totalCost: toCanonicalString(totalCost) });
    } else if (op.tipo === 'COMPRA' || op.tipo === 'BONIFICACAO') {
      const desembolso = opQty.mul(opPrice).add(opCosts);
      totalCost = totalCost.add(desembolso);
      qty = qty.add(opQty);
      currentAvgCost.set(t, { qty: toCanonicalString(qty), totalCost: toCanonicalString(totalCost) });
    } else if (op.tipo === 'DESDOBRAMENTO' && opQty.gt(0)) {
      qty = qty.mul(opQty);
      currentAvgCost.set(t, { qty: toCanonicalString(qty), totalCost: toCanonicalString(totalCost) });
    } else if (op.tipo === 'GRUPAMENTO' && opQty.gt(0)) {
      qty = qty.div(opQty);
      currentAvgCost.set(t, { qty: toCanonicalString(qty), totalCost: toCanonicalString(totalCost) });
    } else if (op.tipo === 'VENDA') {
      // Tesouro Direto é Renda Fixa tributada exclusivamente na fonte (alíquotas regressivas 22,5% a 15%).
      // Não compõe DARF mensal de Renda Variável (Código 6015) e NÃO goza de isenção de R$ 20.000,00 de ações.
      if (tipoAtivo === 'TESOURO') {
        const cmUnit = qty.gt(0) ? totalCost.div(qty) : D(0);
        const custoBaixado = cmUnit.mul(opQty);
        totalCost = totalCost.sub(custoBaixado);
        qty = qty.sub(opQty);
        if (qty.lte(0)) {
          qty = D(0);
          totalCost = D(0);
        }
        currentAvgCost.set(t, { qty: toCanonicalString(qty), totalCost: toCanonicalString(totalCost) });
        continue;
      }

      const mesAno = op.dataPregao.substring(0, 7); // "YYYY-MM"
      if (!monthsMap.has(mesAno)) {
        monthsMap.set(mesAno, {
          mesAno,
          vendasAcoesSwing: [],
          vendasETFBDR: [],
          vendasDayTrade: [],
          vendasFII: [],
        });
      }
      const bucket = monthsMap.get(mesAno)!;

      // Verifica se parte ou o total desta venda é Day Trade
      const dtKey = `${t}_${op.dataPregao}`;
      const dtPair = dayTradeMatchMap.get(dtKey);
      const matchedMax = dtPair ? (dtPair.buyQty.lt(dtPair.sellQty) ? dtPair.buyQty : dtPair.sellQty) : D(0);
      const alreadyAllocated = allocatedDayTradeSell.get(dtKey) || D(0);
      const remainingDayTradeQty = matchedMax.sub(alreadyAllocated);

      let dtQtyForThisOp = D(0);
      if (remainingDayTradeQty.gt(0)) {
        dtQtyForThisOp = opQty.lte(remainingDayTradeQty) ? opQty : remainingDayTradeQty;
        allocatedDayTradeSell.set(dtKey, alreadyAllocated.add(dtQtyForThisOp));
      }

      const swingQtyForThisOp = opQty.sub(dtQtyForThisOp);

      const cmUnit = qty.gt(0) ? totalCost.div(qty) : D(0);

      // 1. Processa parcela Day Trade (se houver)
      if (dtQtyForThisOp.gt(0)) {
        const proporcaoDT = dtQtyForThisOp.div(opQty);
        const alienacaoDT = dtQtyForThisOp.mul(opPrice);
        const custosDT = opCosts.mul(proporcaoDT);
        const lucroBrutoDT = opPrice.sub(cmUnit).mul(dtQtyForThisOp);
        const lucroLiquidoDT = lucroBrutoDT.sub(custosDT);

        bucket.vendasDayTrade.push({
          alienacao: toCanonicalString(alienacaoDT),
          lucroLiquido: toCanonicalString(lucroLiquidoDT),
        });

        const custoBaixadoDT = cmUnit.mul(dtQtyForThisOp);
        totalCost = totalCost.sub(custoBaixadoDT);
        qty = qty.sub(dtQtyForThisOp);
      }

      // 2. Processa parcela Swing Trade (se houver)
      if (swingQtyForThisOp.gt(0)) {
        const proporcaoSwing = swingQtyForThisOp.div(opQty);
        const alienacaoSwing = swingQtyForThisOp.mul(opPrice);
        const custosSwing = opCosts.mul(proporcaoSwing);
        const lucroBrutoSwing = opPrice.sub(cmUnit).mul(swingQtyForThisOp);
        const lucroLiquidoSwing = lucroBrutoSwing.sub(custosSwing);

        const custoBaixadoSwing = cmUnit.mul(swingQtyForThisOp);
        totalCost = totalCost.sub(custoBaixadoSwing);
        qty = qty.sub(swingQtyForThisOp);

        const isDerivativo = op.mercado === 'OPCOES' || op.mercado === 'TERMO' || op.mercado === 'FUTUROS';

        if (tipoAtivo === 'FII') {
          bucket.vendasFII.push({
            alienacao: toCanonicalString(alienacaoSwing),
            lucroLiquido: toCanonicalString(lucroLiquidoSwing),
          });
        } else if (tipoAtivo === 'ETF' || tipoAtivo === 'BDR' || isDerivativo) {
          // ETF, BDR e Derivativos (Opções, Termo, Futuros) são tributados a 15% em operações comuns, mas NÃO possuem isenção de 20k
          bucket.vendasETFBDR.push({
            alienacao: toCanonicalString(alienacaoSwing),
            lucroLiquido: toCanonicalString(lucroLiquidoSwing),
          });
        } else if (tipoAtivo === 'AÇÃO' && (op.mercado === 'VISTA' || op.mercado === 'FRACIONARIO')) {
          // Ações B3 comuns no mercado à vista/fracionário com isenção exclusiva da Lei 11.033/2004 até R$ 20.000,00
          bucket.vendasAcoesSwing.push({
            alienacao: toCanonicalString(alienacaoSwing),
            lucroLiquido: toCanonicalString(lucroLiquidoSwing),
          });
        } else {
          // Demais posições de renda variável sem isenção
          bucket.vendasETFBDR.push({
            alienacao: toCanonicalString(alienacaoSwing),
            lucroLiquido: toCanonicalString(lucroLiquidoSwing),
          });
        }
      }

      if (qty.lte(0)) {
        qty = D(0);
        totalCost = D(0);
      }
      currentAvgCost.set(t, { qty: toCanonicalString(qty), totalCost: toCanonicalString(totalCost) });
    }
  }

  // Ordenar meses cronologicamente
  const sortedMonths = Array.from(monthsMap.keys()).sort();

  let prejuizoAcumuladoAcoes = D(saldoInicialPrejuizos?.acoes || 0);
  let prejuizoAcumuladoDayTrade = D(saldoInicialPrejuizos?.daytrade || 0);
  let prejuizoAcumuladoFII = D(saldoInicialPrejuizos?.fii || 0);

  const summaries: MonthlyTaxSummary[] = [];

  for (const mesAno of sortedMonths) {
    const bucket = monthsMap.get(mesAno)!;

    // 1. Ações Swing Trade (Isenção de R$ 20.000,00 exclusiva da Lei 11.033/2004)
    let totalAlienacaoSwing = D(0);
    let lucroTotalSwing = D(0);
    bucket.vendasAcoesSwing.forEach(v => {
      totalAlienacaoSwing = totalAlienacaoSwing.add(D(v.alienacao));
      lucroTotalSwing = lucroTotalSwing.add(D(v.lucroLiquido));
    });

    const isentoSwing = totalAlienacaoSwing.lte(20000);
    let lucroAcoesTributavel = D(0);

    if (lucroTotalSwing.lt(0)) {
      // Prejuízo apurado no mês vai para compensação futura
      prejuizoAcumuladoAcoes = prejuizoAcumuladoAcoes.add(lucroTotalSwing.abs());
    } else if (lucroTotalSwing.gt(0)) {
      if (!isentoSwing) {
        lucroAcoesTributavel = lucroTotalSwing;
      }
    }

    // 1.1 ETFs e BDRs (Operações comuns sem isenção de 20k)
    let totalAlienacaoETFBDR = D(0);
    let lucroTotalETFBDR = D(0);
    bucket.vendasETFBDR.forEach(v => {
      totalAlienacaoETFBDR = totalAlienacaoETFBDR.add(D(v.alienacao));
      lucroTotalETFBDR = lucroTotalETFBDR.add(D(v.lucroLiquido));
    });

    if (lucroTotalETFBDR.lt(0)) {
      prejuizoAcumuladoAcoes = prejuizoAcumuladoAcoes.add(lucroTotalETFBDR.abs());
    } else if (lucroTotalETFBDR.gt(0)) {
      // Lucro de ETF/BDR é sempre tributável no mês
      lucroAcoesTributavel = lucroAcoesTributavel.add(lucroTotalETFBDR);
    }

    // Compensação na classe Ações / Operações Comuns
    let impostoAcoesSwing = D(0);
    let prejuizoCompensadoAcoes = D(0);
    const antPrejAcoes = prejuizoAcumuladoAcoes;

    if (lucroAcoesTributavel.gt(0)) {
      let baseTributavel = lucroAcoesTributavel;
      if (prejuizoAcumuladoAcoes.gt(0)) {
        if (prejuizoAcumuladoAcoes.gte(baseTributavel)) {
          prejuizoCompensadoAcoes = baseTributavel;
          prejuizoAcumuladoAcoes = prejuizoAcumuladoAcoes.sub(baseTributavel);
          baseTributavel = D(0);
        } else {
          prejuizoCompensadoAcoes = prejuizoAcumuladoAcoes;
          baseTributavel = baseTributavel.sub(prejuizoAcumuladoAcoes);
          prejuizoAcumuladoAcoes = D(0);
        }
      }
      impostoAcoesSwing = baseTributavel.mul(0.15);
    }

    // Agrupamento consolidado das operações comuns (Ações + ETFs/BDRs) para exibição consistente
    const totalAlienacaoComum = totalAlienacaoSwing.add(totalAlienacaoETFBDR);
    const lucroLiquidoComum = lucroTotalSwing.add(lucroTotalETFBDR);

    // 2. FIIs (Alíquota fixa 20%, sem isenção de 20k)
    let totalAlienacaoFII = D(0);
    let lucroTotalFII = D(0);
    bucket.vendasFII.forEach(v => {
      totalAlienacaoFII = totalAlienacaoFII.add(D(v.alienacao));
      lucroTotalFII = lucroTotalFII.add(D(v.lucroLiquido));
    });

    let impostoFII = D(0);
    let prejuizoCompensadoFII = D(0);
    const antPrejFII = prejuizoAcumuladoFII;

    if (lucroTotalFII.lt(0)) {
      prejuizoAcumuladoFII = prejuizoAcumuladoFII.add(lucroTotalFII.abs());
    } else if (lucroTotalFII.gt(0)) {
      let baseTributavel = lucroTotalFII;
      if (prejuizoAcumuladoFII.gt(0)) {
        if (prejuizoAcumuladoFII.gte(baseTributavel)) {
          prejuizoCompensadoFII = baseTributavel;
          prejuizoAcumuladoFII = prejuizoAcumuladoFII.sub(baseTributavel);
          baseTributavel = D(0);
        } else {
          prejuizoCompensadoFII = prejuizoAcumuladoFII;
          baseTributavel = baseTributavel.sub(prejuizoAcumuladoFII);
          prejuizoAcumuladoFII = D(0);
        }
      }
      impostoFII = baseTributavel.mul(0.20);
    }

    // 3. Day Trade (Alíquota 20%)
    let totalAlienacaoDT = D(0);
    let lucroTotalDT = D(0);
    bucket.vendasDayTrade.forEach(v => {
      totalAlienacaoDT = totalAlienacaoDT.add(D(v.alienacao));
      lucroTotalDT = lucroTotalDT.add(D(v.lucroLiquido));
    });

    let impostoDT = D(0);
    let prejuizoCompensadoDT = D(0);
    const antPrejDT = prejuizoAcumuladoDayTrade;

    if (lucroTotalDT.lt(0)) {
      prejuizoAcumuladoDayTrade = prejuizoAcumuladoDayTrade.add(lucroTotalDT.abs());
    } else if (lucroTotalDT.gt(0)) {
      let baseTributavel = lucroTotalDT;
      if (prejuizoAcumuladoDayTrade.gt(0)) {
        if (prejuizoAcumuladoDayTrade.gte(baseTributavel)) {
          prejuizoCompensadoDT = baseTributavel;
          prejuizoAcumuladoDayTrade = prejuizoAcumuladoDayTrade.sub(baseTributavel);
          baseTributavel = D(0);
        } else {
          prejuizoCompensadoDT = prejuizoAcumuladoDayTrade;
          baseTributavel = baseTributavel.sub(prejuizoAcumuladoDayTrade);
          prejuizoAcumuladoDayTrade = D(0);
        }
      }
      impostoDT = baseTributavel.mul(0.20);
    }

    const totalImpostoDevido = impostoAcoesSwing.add(impostoFII).add(impostoDT);

    // IRRF retido na fonte estimado (0,005% sobre alienação swing + FIIs)
    const dedoDuroSwing = totalAlienacaoSwing.add(totalAlienacaoFII).mul(0.00005);
    const dedoDuroDT = lucroTotalDT.gt(0) ? lucroTotalDT.mul(0.01) : D(0);
    const irrfDedoDuro = dedoDuroSwing.add(dedoDuroDT);

    const impostoAPagar = totalImpostoDevido.gt(irrfDedoDuro) 
      ? totalImpostoDevido.sub(irrfDedoDuro) 
      : D(0);

    // Status mensal
    let statusMensal: MonthlyTaxSummary['statusMensal'] = 'SEM_OPERACAO';
    if (totalImpostoDevido.gt(0)) {
      statusMensal = 'LUCRO_TRIBUTAVEL';
    } else if (prejuizoCompensadoAcoes.gt(0) || prejuizoCompensadoFII.gt(0) || prejuizoCompensadoDT.gt(0)) {
      statusMensal = 'COMPENSADO_TOTAL';
    } else if (lucroTotalSwing.lt(0) || lucroTotalETFBDR.lt(0) || lucroTotalFII.lt(0) || lucroTotalDT.lt(0)) {
      statusMensal = 'PREJUIZO_ACUMULADO';
    } else if (isentoSwing && totalAlienacaoSwing.gt(0) && totalAlienacaoETFBDR.isZero()) {
      statusMensal = 'ISENTO';
    }

    summaries.push({
      mesAno,
      totalVendasAcoesSwing: toCanonicalString(totalAlienacaoComum),
      lucroLiquidoAcoesSwing: toCanonicalString(lucroLiquidoComum),
      isentoAcoesSwing: isentoSwing && totalAlienacaoETFBDR.isZero(),
      impostoDevidoAcoesSwing: toCanonicalString(impostoAcoesSwing),

      totalVendasDayTrade: toCanonicalString(totalAlienacaoDT),
      lucroLiquidoDayTrade: toCanonicalString(lucroTotalDT),
      impostoDevidoDayTrade: toCanonicalString(impostoDT),

      totalVendasFII: toCanonicalString(totalAlienacaoFII),
      lucroLiquidoFII: toCanonicalString(lucroTotalFII),
      impostoDevidoFII: toCanonicalString(impostoFII),

      prejuizoAcumuladoAnteriorAcoes: toCanonicalString(antPrejAcoes),
      prejuizoAcumuladoAnteriorDayTrade: toCanonicalString(antPrejDT),
      prejuizoAcumuladoAnteriorFII: toCanonicalString(antPrejFII),

      prejuizoCompensadoAcoes: toCanonicalString(prejuizoCompensadoAcoes),
      prejuizoCompensadoDayTrade: toCanonicalString(prejuizoCompensadoDT),
      prejuizoCompensadoFII: toCanonicalString(prejuizoCompensadoFII),

      novoPrejuizoAcumuladoAcoes: toCanonicalString(prejuizoAcumuladoAcoes),
      novoPrejuizoAcumuladoDayTrade: toCanonicalString(prejuizoAcumuladoDayTrade),
      novoPrejuizoAcumuladoFII: toCanonicalString(prejuizoAcumuladoFII),

      totalImpostoDevido: toCanonicalString(totalImpostoDevido, 2),
      irrfDedoDuro: toCanonicalString(irrfDedoDuro, 2),
      impostoAPagarAposDedoDuro: toCanonicalString(impostoAPagar, 2),
      statusMensal,
    });
  }

  return summaries.reverse(); // Mais recente primeiro
}

export interface RealizedSaleTrade {
  id: string;
  dataPregao: string;
  ticker: string;
  assetNome: string;
  assetTipo: string;
  mercado: string;
  quantidade: string;
  precoVenda: string;
  valorTotalVenda: string;
  custoMedioUnitario: string;
  custoTotalBaixado: string;
  custosOperacionais: string;
  lucroLiquido: string;
  rentabilidadePct: string;
  mesAno: string;
  regimeTributario: string;
  isIsento: boolean;
}

/**
 * Reconstrói detalhadamente cada operação de VENDA individual para o Diário de Vendas
 * calculando o preço médio exato de aquisição no momento da alienação e o lucro líquido apurado.
 */
export function calculateRealizedSales(
  assets: Asset[],
  operations: Operation[]
): RealizedSaleTrade[] {
  const assetMap = new Map<string, Asset>();
  assets.forEach(a => assetMap.set(a.ticker.toUpperCase(), a));

  const validOps = operations
    .filter(op => op.status === 'CONFIRMADA' || op.status === 'ARREDONDADA')
    .sort((a, b) => {
      const cmpDate = a.dataPregao.localeCompare(b.dataPregao);
      if (cmpDate !== 0) return cmpDate;
      return a.createdUtc.localeCompare(b.createdUtc);
    });

  // Mapeamento de Day Trade idêntico ao de calculateMonthlyTaxes
  const dayTradeMatchMap = new Map<string, { buyQty: any; sellQty: any }>();
  for (const op of validOps) {
    if (op.tipo === 'COMPRA' || op.tipo === 'VENDA') {
      const key = `${op.ticker.toUpperCase()}_${op.dataPregao}`;
      if (!dayTradeMatchMap.has(key)) {
        dayTradeMatchMap.set(key, { buyQty: D(0), sellQty: D(0) });
      }
      const entry = dayTradeMatchMap.get(key)!;
      if (op.tipo === 'COMPRA') entry.buyQty = entry.buyQty.add(D(op.quantidade));
      if (op.tipo === 'VENDA') entry.sellQty = entry.sellQty.add(D(op.quantidade));
    }
  }

  const allocatedDayTradeSell = new Map<string, any>();

  // Descobre o total de alienação em ações swing de cada mês para apurar isenção <= 20k
  const totalAlienacaoAcoesPorMes = new Map<string, any>();
  for (const op of validOps) {
    if (op.tipo === 'VENDA') {
      const t = op.ticker.toUpperCase();
      const asset = assetMap.get(t);
      const tipo = asset?.tipo || classifyAssetType(t, asset?.nome);
      if (tipo === 'AÇÃO' && (op.mercado === 'VISTA' || op.mercado === 'FRACIONARIO')) {
        const mesAno = op.dataPregao.substring(0, 7);
        const valorVenda = D(op.quantidade).mul(D(op.precoUnitario));
        const prev = totalAlienacaoAcoesPorMes.get(mesAno) || D(0);
        totalAlienacaoAcoesPorMes.set(mesAno, prev.add(valorVenda));
      }
    }
  }

  const currentAvgCost = new Map<string, { qty: string; totalCost: string }>();
  const sales: RealizedSaleTrade[] = [];

  for (const op of validOps) {
    const t = op.ticker.toUpperCase();
    const asset = assetMap.get(t);
    const tipoAtivo = asset?.tipo || classifyAssetType(t, asset?.nome);
    const nomeAtivo = asset?.nome || t;

    if (!currentAvgCost.has(t)) {
      currentAvgCost.set(t, { qty: '0', totalCost: '0' });
    }
    const state = currentAvgCost.get(t)!;
    let qty = D(state.qty);
    let totalCost = D(state.totalCost);

    const opQty = D(op.quantidade);
    const opPrice = D(op.precoUnitario);
    const opCosts = D(op.custosTotais);

    if (op.tipo === 'OPENING_POSITION') {
      qty = opQty;
      totalCost = opQty.mul(opPrice);
      currentAvgCost.set(t, { qty: toCanonicalString(qty), totalCost: toCanonicalString(totalCost) });
    } else if (op.tipo === 'COMPRA' || op.tipo === 'BONIFICACAO') {
      const desembolso = opQty.mul(opPrice).add(opCosts);
      totalCost = totalCost.add(desembolso);
      qty = qty.add(opQty);
      currentAvgCost.set(t, { qty: toCanonicalString(qty), totalCost: toCanonicalString(totalCost) });
    } else if (op.tipo === 'DESDOBRAMENTO' && opQty.gt(0)) {
      qty = qty.mul(opQty);
      currentAvgCost.set(t, { qty: toCanonicalString(qty), totalCost: toCanonicalString(totalCost) });
    } else if (op.tipo === 'GRUPAMENTO' && opQty.gt(0)) {
      qty = qty.div(opQty);
      currentAvgCost.set(t, { qty: toCanonicalString(qty), totalCost: toCanonicalString(totalCost) });
    } else if (op.tipo === 'VENDA') {
      const mesAno = op.dataPregao.substring(0, 7);
      const dtKey = `${t}_${op.dataPregao}`;
      const dtPair = dayTradeMatchMap.get(dtKey);
      const matchedMax = dtPair ? (dtPair.buyQty.lt(dtPair.sellQty) ? dtPair.buyQty : dtPair.sellQty) : D(0);
      const alreadyAllocated = allocatedDayTradeSell.get(dtKey) || D(0);
      const remainingDayTradeQty = matchedMax.sub(alreadyAllocated);

      let dtQtyForThisOp = D(0);
      if (remainingDayTradeQty.gt(0)) {
        dtQtyForThisOp = opQty.lte(remainingDayTradeQty) ? opQty : remainingDayTradeQty;
        allocatedDayTradeSell.set(dtKey, alreadyAllocated.add(dtQtyForThisOp));
      }

      const swingQtyForThisOp = opQty.sub(dtQtyForThisOp);
      const cmUnit = qty.gt(0) ? totalCost.div(qty) : D(0);

      // 1. Parcela Day Trade (se houver)
      if (dtQtyForThisOp.gt(0)) {
        const proporcaoDT = dtQtyForThisOp.div(opQty);
        const valorAlienacaoDT = dtQtyForThisOp.mul(opPrice);
        const custosDT = opCosts.mul(proporcaoDT);
        const custoBaixadoDT = cmUnit.mul(dtQtyForThisOp);
        const lucroBrutoDT = opPrice.sub(cmUnit).mul(dtQtyForThisOp);
        const lucroLiquidoDT = lucroBrutoDT.sub(custosDT);
        const rentabilidadePctDT = custoBaixadoDT.gt(0) ? lucroLiquidoDT.div(custoBaixadoDT).mul(100) : D(0);

        sales.push({
          id: `${op.id}_dt`,
          dataPregao: op.dataPregao,
          ticker: t,
          assetNome: nomeAtivo,
          assetTipo: tipoAtivo,
          mercado: op.mercado || 'VISTA',
          quantidade: toCanonicalString(dtQtyForThisOp),
          precoVenda: toCanonicalString(opPrice),
          valorTotalVenda: toCanonicalString(valorAlienacaoDT),
          custoMedioUnitario: toCanonicalString(cmUnit),
          custoTotalBaixado: toCanonicalString(custoBaixadoDT),
          custosOperacionais: toCanonicalString(custosDT),
          lucroLiquido: toCanonicalString(lucroLiquidoDT),
          rentabilidadePct: toCanonicalString(rentabilidadePctDT),
          mesAno,
          regimeTributario: 'Day Trade (20% sem isenção)',
          isIsento: false,
        });

        totalCost = totalCost.sub(custoBaixadoDT);
        qty = qty.sub(dtQtyForThisOp);
      }

      // 2. Parcela Swing Trade (se houver)
      if (swingQtyForThisOp.gt(0)) {
        const proporcaoSwing = swingQtyForThisOp.div(opQty);
        const valorAlienacaoSwing = swingQtyForThisOp.mul(opPrice);
        const custosSwing = opCosts.mul(proporcaoSwing);
        const custoBaixadoSwing = cmUnit.mul(swingQtyForThisOp);
        const lucroBrutoSwing = opPrice.sub(cmUnit).mul(swingQtyForThisOp);
        const lucroLiquidoSwing = lucroBrutoSwing.sub(custosSwing);
        const rentabilidadePctSwing = custoBaixadoSwing.gt(0) ? lucroLiquidoSwing.div(custoBaixadoSwing).mul(100) : D(0);

        let regime = 'Ações Swing Trade';
        let isIsento = false;

        const isDerivativo = op.mercado === 'OPCOES' || op.mercado === 'TERMO' || op.mercado === 'FUTUROS';

        if (tipoAtivo === 'TESOURO') {
          regime = 'Tesouro Direto (Retido na Fonte)';
          isIsento = false;
        } else if (tipoAtivo === 'FII') {
          regime = 'FII (20% sem isenção)';
        } else if (tipoAtivo === 'AÇÃO' && !isDerivativo) {
          const totalMes = totalAlienacaoAcoesPorMes.get(mesAno) || D(0);
          if (totalMes.lte(20000)) {
            regime = 'Ação Swing (Isento ≤ R$ 20k)';
            isIsento = true;
          } else {
            regime = 'Ação Swing (Tributável 15%)';
          }
        } else if (tipoAtivo === 'BDR') {
          regime = 'BDR (15% sem isenção)';
        } else if (tipoAtivo === 'ETF') {
          regime = 'ETF (15% sem isenção)';
        } else {
          regime = isDerivativo ? `${op.mercado} (15% sem isenção)` : `${tipoAtivo} (Tributável 15%)`;
        }

        sales.push({
          id: dtQtyForThisOp.gt(0) ? `${op.id}_swing` : op.id,
          dataPregao: op.dataPregao,
          ticker: t,
          assetNome: nomeAtivo,
          assetTipo: tipoAtivo,
          mercado: op.mercado || 'VISTA',
          quantidade: toCanonicalString(swingQtyForThisOp),
          precoVenda: toCanonicalString(opPrice),
          valorTotalVenda: toCanonicalString(valorAlienacaoSwing),
          custoMedioUnitario: toCanonicalString(cmUnit),
          custoTotalBaixado: toCanonicalString(custoBaixadoSwing),
          custosOperacionais: toCanonicalString(custosSwing),
          lucroLiquido: toCanonicalString(lucroLiquidoSwing),
          rentabilidadePct: toCanonicalString(rentabilidadePctSwing),
          mesAno,
          regimeTributario: regime,
          isIsento,
        });

        totalCost = totalCost.sub(custoBaixadoSwing);
        qty = qty.sub(swingQtyForThisOp);
      }

      if (qty.lte(0)) {
        qty = D(0);
        totalCost = D(0);
      }
      currentAvgCost.set(t, { qty: toCanonicalString(qty), totalCost: toCanonicalString(totalCost) });
    }
  }

  return sales.reverse(); // Vendas mais recentes primeiro
}

