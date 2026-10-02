/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarketType, AssetType, Operation } from '../../types';
import { D, toCanonicalString } from '../decimal';

export function normalizeTicker(rawTicker: string): {
  ticker: string;
  mercado: MarketType;
  tipo: AssetType;
} {
  const upper = (rawTicker || '').trim().toUpperCase();

  let mercado: MarketType = 'VISTA';
  let cleanTicker = upper;

  if (cleanTicker.endsWith('F') && cleanTicker.length >= 5 && /\dF$/.test(cleanTicker)) {
    mercado = 'FRACIONARIO';
    cleanTicker = cleanTicker.slice(0, -1);
  }

  let tipo: AssetType = 'AÇÃO';

  if (
    cleanTicker.startsWith('BOVA') ||
    cleanTicker.startsWith('IVVB') ||
    cleanTicker.startsWith('SMAL') ||
    cleanTicker.startsWith('HASH') ||
    cleanTicker.startsWith('DIVO') ||
    cleanTicker.startsWith('SPXI') ||
    cleanTicker.startsWith('XINA') ||
    cleanTicker.startsWith('GOLD')
  ) {
    tipo = 'ETF';
  } else if (
    cleanTicker.endsWith('11') ||
    cleanTicker.endsWith('12') ||
    cleanTicker.endsWith('13') ||
    cleanTicker.endsWith('14')
  ) {
    // Código 11 = FII/ETF/Unit, Códigos 12, 13, 14 = Direitos e Recibos de FII
    tipo = 'FII';
  } else if (
    cleanTicker.endsWith('34') ||
    cleanTicker.endsWith('35') ||
    cleanTicker.endsWith('39') ||
    cleanTicker.endsWith('32') ||
    cleanTicker.endsWith('33') ||
    cleanTicker.endsWith('41') ||
    cleanTicker.endsWith('42')
  ) {
    tipo = 'BDR';
  } else if (
    cleanTicker.startsWith('NTNB') ||
    cleanTicker.startsWith('LFT') ||
    cleanTicker.startsWith('LTN') ||
    cleanTicker.startsWith('TESOURO')
  ) {
    tipo = 'TESOURO';
  }

  return {
    ticker: cleanTicker,
    mercado,
    tipo,
  };
}

function parseBrNumber(str: string): number {
  if (!str) return 0;
  let s = str.trim().replace(/[R$\s\u00A0]/g, '');
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes('.') && s.split('.')[1]?.length === 3) {
    s = s.replace(/\./g, '');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export interface ParsedBrokerageNote {
  numeroNota: string;
  dataPregao: string;
  dataLiquidacao: string;
  corretora: string;
  taxasB3: string;
  corretagem: string;
  outrosCustos: string;
  custosTotais: string;
  valorLiquidoNota: string;
  operations: Operation[];
  rawText: string;
}

/**
 * Parser determinístico universal para Notas de Corretagem da B3 no padrão SINACOR
 * e layouts digitais modernos (Toro, XP, Clear, Rico, BTG Pactual, NuInvest, Banco Inter,
 * Genial, Ágora, Itaú Corretora, etc.).
 */
export function parseToroNoteText(rawText: string): ParsedBrokerageNote {
  return parseBrokerageNoteText(rawText);
}

export function parseBrokerageNoteText(rawText: string): ParsedBrokerageNote {
  // Guarda estrita: rejeita extratos de proventos para não gerar operações falsas de compra/venda
  if (
    /Proventos\s*recebidos/i.test(rawText) &&
    !/NOTA\s*DE\s*(?:CORRETAGEM|NEGOCIA[ÇC][ÃA]O)/i.test(rawText)
  ) {
    throw new Error(
      'Este documento é um Extrato de Proventos Recebidos da B3 e não uma Nota de Corretagem de compras/vendas. Use a aba "Extrato de Proventos B3 / Toro".'
    );
  }

  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  let corretora = 'Corretora B3';
  let numeroNota = '';
  let dataPregao = '';
  let dataLiquidacao = '';

  // 1. Identificação de Metadados da Nota e Corretora
  for (const line of lines) {
    const lower = line.toLowerCase();

    if (lower.includes('toro') || lower.includes('toro corretora') || lower.includes('toro ctvm')) {
      corretora = 'Toro CTVM';
    } else if (lower.includes('clear') || lower.includes('clear corretora')) {
      corretora = 'Clear Corretora';
    } else if (lower.includes('xp investimentos') || lower.includes('xp cctvm')) {
      corretora = 'XP Investimentos';
    } else if (lower.includes('btg pactual') || lower.includes('btg')) {
      corretora = 'BTG Pactual';
    } else if (lower.includes('nu invest') || lower.includes('nuinvest') || lower.includes('nubank')) {
      corretora = 'NuInvest';
    } else if (lower.includes('inter dtvm') || lower.includes('banco inter')) {
      corretora = 'Banco Inter';
    } else if (lower.includes('rico investimentos') || lower.includes('rico')) {
      corretora = 'Rico Investimentos';
    } else if (lower.includes('genial')) {
      corretora = 'Genial Investimentos';
    } else if (lower.includes('agora') || lower.includes('ágora')) {
      corretora = 'Ágora Investimentos';
    } else if (lower.includes('itau') || lower.includes('itaú')) {
      corretora = 'Itaú Corretora';
    } else if (lower.includes('safra')) {
      corretora = 'Safra Corretora';
    }

    const notaMatch = line.match(
      /(?:Nr\.?\s*nota|N[uú]mero\s*(?:da\s*)?nota|Nota\s*n[ºo°]?|Nr\.?\s*Nota\s*\/\s*Folha|Nota\s*de\s*Corretagem\s*N[ºo°]?)\s*:?\s*(\d+)/i
    );
    if (notaMatch && !numeroNota) {
      numeroNota = notaMatch[1];
    }

    const dataMatch = line.match(
      /(?:Data\s*(?:do\s*)?preg[ãa]o|Preg[ãa]o)\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i
    );
    if (dataMatch && !dataPregao) {
      const [d, m, y] = dataMatch[1].split('/');
      dataPregao = `${y}-${m}-${d}`;
    }

    const liqMatch = line.match(
      /(?:Data\s*liquida[çc][ãa]o|L[íi]quido\s*para\s*|Liquida[çc][ãa]o)\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i
    );
    if (liqMatch && !dataLiquidacao) {
      const [d, m, y] = liqMatch[1].split('/');
      dataLiquidacao = `${y}-${m}-${d}`;
    }
  }

  const nowIso = new Date().toISOString().slice(0, 10);
  if (!dataPregao) dataPregao = nowIso;
  if (!dataLiquidacao) dataLiquidacao = dataPregao;
  if (!numeroNota) numeroNota = `NOTA_${Date.now().toString().slice(-6)}`;

  // 2. Extração de Despesas e Custos
  let taxaLiquidacao = 0;
  let emolumentos = 0;
  let corretagem = 0;
  let outrosCustos = 0;
  let valorLiquido = 0;

  for (const line of lines) {
    const liqM = line.match(
      /(?:Taxa\s*de\s*liquida[çc][ãa]o|Total\s*CBLC)\s*:?\s*(\d+[.,]\d{2})/i
    );
    if (liqM) taxaLiquidacao = parseBrNumber(liqM[1]);

    const emoM = line.match(
      /(?:Emolumentos|Total\s*Bovespa)\s*:?\s*(\d+[.,]\d{2})/i
    );
    if (emoM) emolumentos = parseBrNumber(emoM[1]);

    const corM = line.match(
      /(?:Taxa\s*operacional|Corretagem)\s*:?\s*(\d+[.,]\d{2})/i
    );
    if (corM) corretagem = parseBrNumber(corM[1]);

    const issM = line.match(/(?:ISS|Impostos)\s*:?\s*(\d+[.,]\d{2})/i);
    if (issM) outrosCustos += parseBrNumber(issM[1]);

    const outM = line.match(/(?:Outras?\s*despesas?|Outros\s*custos)\s*:?\s*(\d+[.,]\d{2})/i);
    if (outM) outrosCustos += parseBrNumber(outM[1]);

    const totalDespM = line.match(
      /(?:Total\s*(?:das\s*)?despesas?|Total\s*custos)\s*:?\s*(\d+[.,]\d{2})/i
    );
    if (totalDespM && taxaLiquidacao === 0 && emolumentos === 0) {
      taxaLiquidacao = parseBrNumber(totalDespM[1]);
    }

    const liqTotalM = line.match(
      /(?:L[íi]quido\s*para\s*\d{2}\/\d{2}\/\d{4}|Valor\s*l[íi]quido\s*das\s*opera[çc][õo]es)\s*:?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i
    );
    if (liqTotalM) {
      valorLiquido = parseBrNumber(liqTotalM[1]);
    }
  }

  const totalTaxasB3 = taxaLiquidacao + emolumentos;
  const custosTotaisGerais = totalTaxasB3 + corretagem + outrosCustos;

  // 3. Extração das Operações de Compra e Venda
  interface RawTrade {
    rawTicker: string;
    cleanTicker: string;
    tipo: 'COMPRA' | 'VENDA';
    quantidade: number;
    precoUnitario: number;
    valorBase: number;
    mercado: MarketType;
    observacoes?: string;
  }

  const rawTrades: RawTrade[] = [];

  // Regex universal para B3: cobre qualquer ticker de 4 letras + 1 a 2 dígitos (1 a 49),
  // como MXRF11, MXRF12, KLBN4, KLBN4F, GOAU4, B3SA3, etc.
  const tickerRegex = /\b([A-Z]{4}\d{1,2}F?|B3SA\d{1,2}F?)\b/;
  const numRegex = /\b\d{1,3}(?:\.\d{3})*(?:,\d{2})?\b|\b\d+\b/g;

  // --- ESTRATÉGIA A: Layout Toro por blocos de ativos (com resumo ou linhas de execução) ---
  const hasToroHeaders = lines.some(l => /(?:^|\b)[A-Z0-9]{4,6}\d{1,2}F?\s*-\s*[A-Z]/i.test(l));

  if (hasToroHeaders) {
    let currentTicker: { raw: string; clean: string; mercado: MarketType } | null = null;
    let currentRows: { tipo: 'COMPRA' | 'VENDA'; qtd: number; preco: number; total: number }[] = [];

    const flushTickerRows = () => {
      if (!currentTicker || currentRows.length === 0) return;
      const compras = currentRows.filter(r => r.tipo === 'COMPRA');
      const vendas = currentRows.filter(r => r.tipo === 'VENDA');

      for (const [tipo, rows] of [['COMPRA', compras], ['VENDA', vendas]] as const) {
        if (rows.length === 0) continue;
        let totalQtd = 0;
        let totalVal = 0;
        for (const r of rows) {
          totalQtd += r.qtd;
          totalVal += r.total > 0 ? r.total : r.qtd * r.preco;
        }
        const pm = totalQtd > 0 ? totalVal / totalQtd : 0;
        rawTrades.push({
          rawTicker: currentTicker.raw,
          cleanTicker: currentTicker.clean,
          tipo,
          quantidade: Math.round(totalQtd),
          precoUnitario: pm,
          valorBase: totalVal,
          mercado: currentTicker.mercado,
          observacoes: `Nota nº ${numeroNota} (${corretora})`,
        });
      }
      currentTicker = null;
      currentRows = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Cabeçalho de bloco: e.g. "KLBN4F - KLABIN S/A PN N2" ou "MXRF12 - FII MAXI REN DM 10,29"
      const headerMatch = line.match(/(?:^|\b)([A-Z]{4}\d{1,2}F?|B3SA\d{1,2}F?)\s*-\s*([^\n\r]+)/i);
      if (headerMatch) {
        flushTickerRows();
        const rawTick = headerMatch[1].toUpperCase();
        const norm = normalizeTicker(rawTick);
        currentTicker = { raw: rawTick, clean: norm.ticker, mercado: norm.mercado };
        continue;
      }

      // Linha de resumo do ativo na Toro: "Quant. total de compra: 92 Preço médio compra: R$ 4,2400"
      if (currentTicker && /Quant\.?\s*(?:total\s*de\s*)?(?:compra|venda)/i.test(line)) {
        const compraM = line.match(
          /Quant\.?\s*(?:total\s*de\s*)?compra\s*:?\s*(\d+)[\s\S]*?Pre[çc]o\s*m[ée]dio\s*(?:de\s*)?compra\s*:?\s*R?\$?\s*([\d.,]+)/i
        );
        const vendaM = line.match(
          /Quant\.?\s*(?:total\s*de\s*)?venda\s*:?\s*(\d+)[\s\S]*?Pre[çc]o\s*m[ée]dio\s*(?:de\s*)?venda\s*:?\s*R?\$?\s*([\d.,]+)/i
        );

        let consumed = false;
        if (compraM && parseBrNumber(compraM[1]) > 0) {
          const qtd = parseBrNumber(compraM[1]);
          const preco = parseBrNumber(compraM[2]);
          rawTrades.push({
            rawTicker: currentTicker.raw,
            cleanTicker: currentTicker.clean,
            tipo: 'COMPRA',
            quantidade: Math.round(qtd),
            precoUnitario: preco,
            valorBase: qtd * preco,
            mercado: currentTicker.mercado,
            observacoes: `Nota nº ${numeroNota} (${corretora})`,
          });
          consumed = true;
        }

        if (vendaM && parseBrNumber(vendaM[1]) > 0) {
          const qtd = parseBrNumber(vendaM[1]);
          const preco = parseBrNumber(vendaM[2]);
          rawTrades.push({
            rawTicker: currentTicker.raw,
            cleanTicker: currentTicker.clean,
            tipo: 'VENDA',
            quantidade: Math.round(qtd),
            precoUnitario: preco,
            valorBase: qtd * preco,
            mercado: currentTicker.mercado,
            observacoes: `Nota nº ${numeroNota} (${corretora})`,
          });
          consumed = true;
        }

        if (consumed) {
          currentTicker = null;
          currentRows = [];
          continue;
        }
      }

      // Linha de execução individual na tabela da Toro:
      // "COMPRA B3 RV LISTADO 68 R$4,24 R$288,32 FRACIONARIO"
      if (currentTicker && /(COMPRA|VENDA)\s+B3\s+RV\s+LISTADO/i.test(line)) {
        const isVenda = /VENDA/i.test(line);
        const afterMarket = line.slice(line.toUpperCase().indexOf('LISTADO') + 'LISTADO'.length);
        const numMatches = afterMarket.match(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\b\d+\b)/g) || [];
        const nums = numMatches.map(parseBrNumber).filter(n => !isNaN(n) && n > 0);
        if (nums.length >= 2) {
          const qtd = nums[0];
          const preco = nums[1];
          const total = nums.length >= 3 ? nums[2] : qtd * preco;
          currentRows.push({
            tipo: isVenda ? 'VENDA' : 'COMPRA',
            qtd,
            preco,
            total,
          });
        }
      }
    }

    flushTickerRows();
  }

  // --- ESTRATÉGIA B: Formato Padrão SINACOR / Linha por Linha (XP, Clear, NuInvest, etc.) ---
  if (rawTrades.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Ignora rodapé de resumo e totais
      if (
        /Resumo\s*(?:dos\s*neg[óo]cios|financeiro)|Total\s*CBLC|Total\s*Bovespa|L[íi]quido\s*para|NOTA\s*DE\s*CORRETAGEM|Cliente\s*:|Especifica[çc][ãa]o\s*do\s*t[íi]tulo/i.test(
          line
        )
      ) {
        continue;
      }

      const tickMatch = line.match(tickerRegex);
      if (!tickMatch) continue;

      const rawTicker = tickMatch[1].toUpperCase();
      const { ticker: cleanTicker, mercado } = normalizeTicker(rawTicker);

      const tickerIdx = line.indexOf(rawTicker);
      const beforeTicker = line.slice(0, tickerIdx);
      const afterTicker = line.slice(tickerIdx + rawTicker.length);

      const isVenda =
        /\bV\b|\bVENDA\b/i.test(beforeTicker) ||
        (/\bV\b/i.test(line) && !/\bC\b/i.test(line));
      const tipo = isVenda ? 'VENDA' : 'COMPRA';

      let matches = afterTicker.match(numRegex) || [];
      let parsed = matches.map(parseBrNumber).filter(n => !isNaN(n) && n > 0);

      // Multi-linhas
      if (parsed.length < 2 && i + 1 < lines.length) {
        const nextChunk = lines.slice(i + 1, Math.min(i + 4, lines.length)).join(' ');
        const nextMatches = nextChunk.match(numRegex) || [];
        const nextParsed = nextMatches.map(parseBrNumber).filter(n => !isNaN(n) && n > 0);
        if (nextParsed.length >= 2) {
          parsed = nextParsed;
        }
      }

      let qtd = 0;
      let preco = 0;

      if (parsed.length >= 3) {
        qtd = parsed[parsed.length - 3];
        preco = parsed[parsed.length - 2];
      } else if (parsed.length === 2) {
        qtd = parsed[0];
        preco = parsed[1];
      }

      if (qtd > 0 && preco > 0) {
        rawTrades.push({
          rawTicker,
          cleanTicker,
          tipo,
          quantidade: Math.round(qtd),
          precoUnitario: preco,
          valorBase: qtd * preco,
          mercado,
          observacoes: `Nota nº ${numeroNota} (${corretora})`,
        });
      }
    }
  }

  // 4. Rateio Determinístico das Despesas Proporcional ao Valor Base
  const sumBase = rawTrades.reduce((acc, trade) => acc + trade.valorBase, 0);

  const cleanNota = (numeroNota || '000').replace(/\D/g, '');
  const cleanCorr = (corretora || 'CORR').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const docId = `doc_${cleanCorr}_${cleanNota || Date.now()}`;

  const operations: Operation[] = rawTrades.map((trade, idx) => {
    const ratio = sumBase > 0 ? trade.valorBase / sumBase : 1 / Math.max(1, rawTrades.length);

    const opTaxasB3 = Math.round(totalTaxasB3 * ratio * 100) / 100;
    const opCorretagem = Math.round(corretagem * ratio * 100) / 100;
    const opOutros = Math.round(outrosCustos * ratio * 100) / 100;
    const opCustosTotais = Math.round((opTaxasB3 + opCorretagem + opOutros) * 100) / 100;

    const opValorTotal =
      trade.tipo === 'COMPRA'
        ? Math.round((trade.valorBase + opCustosTotais) * 100) / 100
        : Math.round((trade.valorBase - opCustosTotais) * 100) / 100;

    const opId = `op_${cleanCorr}_${cleanNota || '0'}_${trade.cleanTicker}_${trade.tipo}_${trade.quantidade}_${idx + 1}`;

    return {
      id: opId,
      assetId: trade.cleanTicker,
      ticker: trade.cleanTicker,
      tipo: trade.tipo,
      dataPregao,
      dataLiquidacao,
      quantidade: trade.quantidade.toString(),
      precoUnitario: toCanonicalString(trade.precoUnitario, 4),
      taxasB3: toCanonicalString(opTaxasB3, 2),
      corretagem: toCanonicalString(opCorretagem, 2),
      outrosCustos: toCanonicalString(opOutros, 2),
      custosTotais: toCanonicalString(opCustosTotais, 2),
      valorTotalOperacao: toCanonicalString(opValorTotal, 2),
      mercado: trade.mercado,
      status: 'CONFIRMADA',
      notaCorretagemId: docId,
      observacoes: trade.observacoes,
      createdUtc: new Date().toISOString(),
    };
  });

  return {
    numeroNota,
    dataPregao,
    dataLiquidacao,
    corretora,
    taxasB3: toCanonicalString(totalTaxasB3, 2),
    corretagem: toCanonicalString(corretagem, 2),
    outrosCustos: toCanonicalString(outrosCustos, 2),
    custosTotais: toCanonicalString(custosTotaisGerais, 2),
    valorLiquidoNota: toCanonicalString(valorLiquido > 0 ? valorLiquido : sumBase, 2),
    operations,
    rawText,
  };
}
