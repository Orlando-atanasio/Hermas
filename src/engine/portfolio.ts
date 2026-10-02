/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Asset, Operation, PriceQuote, Dividend, CustodyPosition } from '../types';
import { D, toCanonicalString } from './decimal';
import { classifyAssetType } from './assetClassifier';

export interface PortfolioSummary {
  patrimonioTotal: string;
  custoTotalAquisicao: string;
  custoTotalInvestido: string;
  lucroTotalNaoRealizado: string;
  lucroNaoRealizadoTotal: string;
  rentabilidadeTotalPct: string;
  rentabilidadeNaoRealizadaTotalPct: string;
  totalReturnGeral: string;
  lucroRealizadoTotal: string;
  posicoesCustodia: CustodyPosition[];
  posicoesZeradas: CustodyPosition[];
  alocacaoPercentual: Array<{ tipo: string; total: string; percentual: string }>;
  totalProventosRecebidos: string;
  proventosRecebidosTotal: string;
  proventosPorTipo: { dividendos: string; jcp: string; rendimentos: string };
}

export function calculatePortfolio(
  assets: Asset[],
  operations: Operation[],
  quotes: Record<string, PriceQuote> = {},
  dividends: Dividend[] = []
): PortfolioSummary {
  const assetMap = new Map<string, Asset>();
  assets.forEach(a => assetMap.set(a.ticker.toUpperCase(), a));

  // Mapa de proventos efetivamente RECEBIDOS por ticker (ignora proventos provisionados futuros)
  const divByTicker = new Map<string, any>();
  dividends
    .filter(d => d.status === 'RECEBIDO')
    .forEach(d => {
      const t = d.ticker.toUpperCase();
      const prev = divByTicker.get(t) || D(0);
      divByTicker.set(t, prev.add(D(d.valorLiquido)));
    });

  // Ordenação cronológica estrita das operações confirmadas
  const validOps = operations
    .filter(op => op.status === 'CONFIRMADA' || op.status === 'ARREDONDADA')
    .sort((a, b) => {
      const cmp = a.dataPregao.localeCompare(b.dataPregao);
      if (cmp !== 0) return cmp;
      return (a.createdUtc || '').localeCompare(b.createdUtc || '');
    });

  interface PositionAccumulator {
    ticker: string;
    qty: any;
    totalCost: any;
    lastDate: string;
    hasHadTrades: boolean;
    lucroRealizado: any;
  }

  const tracker = new Map<string, PositionAccumulator>();

  for (const op of validOps) {
    const t = op.ticker.toUpperCase();
    if (!tracker.has(t)) {
      tracker.set(t, {
        ticker: t,
        qty: D(0),
        totalCost: D(0),
        lastDate: op.dataPregao,
        hasHadTrades: false,
        lucroRealizado: D(0),
      });
    }

    const state = tracker.get(t)!;
    state.lastDate = op.dataPregao;
    state.hasHadTrades = true;

    const opQty = D(op.quantidade);
    const opPrice = D(op.precoUnitario);
    const opCosts = D(op.custosTotais || 0);

    if (op.tipo === 'OPENING_POSITION') {
      state.qty = opQty;
      state.totalCost = opQty.mul(opPrice);
    } else if (op.tipo === 'COMPRA') {
      state.qty = state.qty.add(opQty);
      state.totalCost = state.totalCost.add(opQty.mul(opPrice)).add(opCosts);
    } else if (op.tipo === 'BONIFICACAO') {
      state.qty = state.qty.add(opQty);
      state.totalCost = state.totalCost.add(opQty.mul(opPrice));
    } else if (op.tipo === 'DESDOBRAMENTO' && opQty.gt(0)) {
      state.qty = state.qty.mul(opQty);
    } else if (op.tipo === 'GRUPAMENTO' && opQty.gt(0)) {
      state.qty = state.qty.div(opQty);
    } else if (op.tipo === 'AMORTIZACAO') {
      const amortTotal = opQty.mul(opPrice);
      state.totalCost = state.totalCost.sub(amortTotal);
      if (state.totalCost.lt(0)) state.totalCost = D(0);
    } else if (op.tipo === 'SUBSCRICAO_CONVERSAO') {
      // Entrada de cotas convertidas da subscrição (com custo do direito + preço de exercício incorporados)
      state.qty = state.qty.add(opQty);
      state.totalCost = state.totalCost.add(opQty.mul(opPrice)).add(opCosts);
    } else if (op.tipo === 'SUBSCRICAO_BAIXA') {
      // Baixa do direito/recibo original que foi convertido no ativo principal
      state.qty = state.qty.sub(opQty);
      if (state.qty.lte(0)) {
        state.qty = D(0);
        state.totalCost = D(0);
      }
    } else if (op.tipo === 'DIREITO_EXPIRADO') {
      // Direito que não foi exercido nem negociado e virou pó (perda contábil)
      if (state.qty.gt(0)) {
        state.lucroRealizado = state.lucroRealizado.sub(state.totalCost);
        state.qty = D(0);
        state.totalCost = D(0);
      }
    } else if (op.tipo === 'VENDA') {
      if (state.qty.gt(0)) {
        const pm = state.totalCost.div(state.qty);
        const custoBaixado = pm.mul(opQty);
        const valorVenda = opQty.mul(opPrice);
        const lucroBruto = valorVenda.sub(custoBaixado);
        const lucroLiq = lucroBruto.sub(opCosts);
        state.lucroRealizado = state.lucroRealizado.add(lucroLiq);

        state.totalCost = state.totalCost.sub(custoBaixado);
        state.qty = state.qty.sub(opQty);
        if (state.qty.lte(0)) {
          state.qty = D(0);
          state.totalCost = D(0);
        }
      }
    }
  }

  // Monta posições
  const activePositions: CustodyPosition[] = [];
  const zeroPositions: CustodyPosition[] = [];

  let sumPatrimonio = D(0);
  let sumCustoAquisicao = D(0);
  let sumLucroRealizado = D(0);

  tracker.forEach((state, ticker) => {
    let asset = assetMap.get(ticker);
    if (!asset) {
      asset = {
        id: ticker,
        ticker,
        nome: ticker,
        tipo: classifyAssetType(ticker),
      };
    }

    const qty = state.qty;
    const custo = state.totalCost;
    const precoMedio = qty.gt(0) ? custo.div(qty) : D(0);

    const quote = quotes[ticker];
    const hasMarketQuote = Boolean(quote && quote.precoAtual && D(quote.precoAtual).gt(0));
    const isStaleOrEstimated = !hasMarketQuote || quote?.status === 'STALE';
    const cotacaoAtual = hasMarketQuote ? D(quote!.precoAtual) : (precoMedio.gt(0) ? precoMedio : D(0));
    const valorAtual = qty.mul(cotacaoAtual);
    const lucroNaoRealizado = valorAtual.sub(custo);
    const rentabilidadePct = custo.gt(0) ? lucroNaoRealizado.div(custo).mul(100) : D(0);

    const proventosTicker = divByTicker.get(ticker) || D(0);
    const totalReturnTicker = lucroNaoRealizado.add(proventosTicker).add(state.lucroRealizado);

    sumLucroRealizado = sumLucroRealizado.add(state.lucroRealizado);

    const pos: CustodyPosition = {
      ticker,
      asset,
      quantidade: toCanonicalString(qty, 4),
      precoMedio: toCanonicalString(precoMedio, 2),
      custoTotal: toCanonicalString(custo, 2),
      cotacaoAtual: toCanonicalString(cotacaoAtual, 2),
      precoAtual: toCanonicalString(cotacaoAtual, 2),
      valorAtual: toCanonicalString(valorAtual, 2),
      lucroNaoRealizado: toCanonicalString(lucroNaoRealizado, 2),
      rentabilidadeNaoRealizadaPct: toCanonicalString(rentabilidadePct, 2),
      percentualCarteira: '0.00',
      dataUltimaOperacao: state.lastDate,
      proventosRecebidosHistorico: toCanonicalString(proventosTicker, 2),
      totalReturn: toCanonicalString(totalReturnTicker, 2),
      lucroRealizadoHistorico: toCanonicalString(state.lucroRealizado, 2),
      hasMarketQuote,
      isStaleOrEstimated,
    };

    if (qty.gt(0)) {
      activePositions.push(pos);
      sumPatrimonio = sumPatrimonio.add(valorAtual);
      sumCustoAquisicao = sumCustoAquisicao.add(custo);
    } else if (state.hasHadTrades) {
      zeroPositions.push(pos);
    }
  });

  // Calcula percentual de carteira
  activePositions.forEach(p => {
    const v = D(p.valorAtual);
    const pct = sumPatrimonio.gt(0) ? v.div(sumPatrimonio).mul(100) : D(0);
    p.percentualCarteira = toCanonicalString(pct, 2);
  });

  // Alocação por tipo de ativo
  const typeMap = new Map<string, any>();
  activePositions.forEach(p => {
    const t = p.asset.tipo;
    const v = D(p.valorAtual);
    typeMap.set(t, (typeMap.get(t) || D(0)).add(v));
  });

  const alocacaoPercentual = Array.from(typeMap.entries()).map(([tipo, totalDec]) => {
    const pct = sumPatrimonio.gt(0) ? totalDec.div(sumPatrimonio).mul(100) : D(0);
    return {
      tipo,
      total: toCanonicalString(totalDec, 2),
      percentual: toCanonicalString(pct, 2),
    };
  }).sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

  // Lucro total e rentabilidade
  const lucroTotal = sumPatrimonio.sub(sumCustoAquisicao);
  const rentabilidadeTotal = sumCustoAquisicao.gt(0) ? lucroTotal.div(sumCustoAquisicao).mul(100) : D(0);

  // Proventos
  let totalDiv = D(0);
  let divAcoes = D(0);
  let jcpTotal = D(0);
  let rendFii = D(0);

  dividends
    .filter(d => d.status === 'RECEBIDO')
    .forEach(d => {
      const liq = D(d.valorLiquido);
      totalDiv = totalDiv.add(liq);
      if (d.tipo === 'DIVIDENDO') divAcoes = divAcoes.add(liq);
      else if (d.tipo === 'JCP') jcpTotal = jcpTotal.add(liq);
      else if (d.tipo === 'RENDIMENTO') rendFii = rendFii.add(liq);
    });

  const totalReturnGeral = lucroTotal.add(totalDiv).add(sumLucroRealizado);
  const proventosStr = toCanonicalString(totalDiv, 2);

  return {
    patrimonioTotal: toCanonicalString(sumPatrimonio, 2),
    custoTotalAquisicao: toCanonicalString(sumCustoAquisicao, 2),
    custoTotalInvestido: toCanonicalString(sumCustoAquisicao, 2),
    lucroTotalNaoRealizado: toCanonicalString(lucroTotal, 2),
    lucroNaoRealizadoTotal: toCanonicalString(lucroTotal, 2),
    rentabilidadeTotalPct: toCanonicalString(rentabilidadeTotal, 2),
    rentabilidadeNaoRealizadaTotalPct: toCanonicalString(rentabilidadeTotal, 2),
    totalReturnGeral: toCanonicalString(totalReturnGeral, 2),
    lucroRealizadoTotal: toCanonicalString(sumLucroRealizado, 2),
    posicoesCustodia: activePositions.sort((a, b) => parseFloat(b.valorAtual) - parseFloat(a.valorAtual)),
    posicoesZeradas: zeroPositions,
    alocacaoPercentual,
    totalProventosRecebidos: proventosStr,
    proventosRecebidosTotal: proventosStr,
    proventosPorTipo: {
      dividendos: toCanonicalString(divAcoes, 2),
      jcp: toCanonicalString(jcpTotal, 2),
      rendimentos: toCanonicalString(rendFii, 2),
    },
  };
}
