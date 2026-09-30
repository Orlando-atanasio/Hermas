import { PriceQuote } from '../types';
import { HermasDB } from '../storage/db';
import { toCanonicalString, D } from '../engine/decimal';

export async function fetchBrapiQuotes(tickers: string[], apiKey?: string): Promise<{ quotes: Record<string, PriceQuote>; success: boolean; count: number; error?: string }> {
  if (!tickers || tickers.length === 0) {
    return { quotes: HermasDB.getQuotes(), success: true, count: 0 };
  }

  const cleanTickers = tickers.map(t => t.toUpperCase().trim()).filter(Boolean);
  const tickersJoined = cleanTickers.join(',');
  const currentQuotes = HermasDB.getQuotes();
  const updated: Record<string, PriceQuote> = { ...currentQuotes };

  try {
    const url = `https://brapi.dev/api/quote/${tickersJoined}${apiKey ? `?token=${apiKey}` : ''}`;
    const response = await fetch(url, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.results && Array.isArray(data.results) && data.results.length > 0) {
      data.results.forEach((item: any) => {
        const symbol = item.symbol.toUpperCase();
        updated[symbol] = {
          ticker: symbol,
          precoAtual: toCanonicalString(D(item.regularMarketPrice || item.price || 0)),
          variacaoDia: toCanonicalString(D(item.regularMarketChangePercent || 0)),
          fechamentoAnterior: toCanonicalString(D(item.regularMarketPreviousClose || 0)),
          dataHoraUtc: new Date().toISOString(),
          fonte: 'BRAPI',
          status: 'REALTIME',
        };
      });
      HermasDB.saveQuotes(updated);
      HermasDB.logAudit('ATUALIZAR_COTACOES', 'PriceQuote', `Cotações atualizadas com sucesso via Brapi (${data.results.length} ativos).`);
      return { quotes: updated, success: true, count: data.results.length };
    } else {
      throw new Error('Nenhum dado retornado para os ativos informados.');
    }
  } catch (err: any) {
    console.warn('Brapi fetch warning (mantendo cotações locais em cache):', err.message);
    // Em caso de falha de conexão ou ausência de rede, preserva cotações existentes marcando como STALE
    cleanTickers.forEach(t => {
      const existing = currentQuotes[t];
      if (existing) {
        updated[t] = {
          ...existing,
          status: 'STALE',
        };
      }
    });
    HermasDB.saveQuotes(updated);
    return { quotes: updated, success: false, count: 0, error: err?.message || 'Falha de conexão com a API de cotações' };
  }
}
