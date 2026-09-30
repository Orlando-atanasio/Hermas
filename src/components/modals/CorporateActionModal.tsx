/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle, 
  Info,
  Calendar,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { CustodyPosition, Operation } from '../../types';
import { D, toCanonicalString, formatBRL, formatNumber } from '../../engine/decimal';
import { getSubscriptionInfo, isSubscriptionTicker } from '../../engine/subscriptions';
import { HermasDB } from '../../storage/db';

interface CorporateActionModalProps {
  custodyPositions: CustodyPosition[];
  onSaveOperation: (op: Operation) => void;
  onClose: () => void;
  initialTicker?: string;
  initialEventType?: 'DESDOBRAMENTO' | 'GRUPAMENTO' | 'BONIFICACAO' | 'AMORTIZACAO' | 'SUBSCRICAO_CONVERSAO' | 'DIREITO_EXPIRADO';
}

export const CorporateActionModal: React.FC<CorporateActionModalProps> = ({
  custodyPositions,
  onSaveOperation,
  onClose,
  initialTicker,
  initialEventType,
}) => {
  const activePositions = useMemo(() => {
    return custodyPositions.filter(p => D(p.quantidade).gt(0));
  }, [custodyPositions]);

  const [selectedTicker, setSelectedTicker] = useState<string>(() => {
    if (initialTicker && activePositions.some(p => p.ticker === initialTicker)) {
      return initialTicker;
    }
    return activePositions[0]?.ticker || '';
  });

  const subInfo = useMemo(() => getSubscriptionInfo(selectedTicker), [selectedTicker]);

  const [eventType, setEventType] = useState<
    'DESDOBRAMENTO' | 'GRUPAMENTO' | 'BONIFICACAO' | 'AMORTIZACAO' | 'SUBSCRICAO_CONVERSAO' | 'DIREITO_EXPIRADO'
  >(() => {
    if (initialEventType) return initialEventType;
    if (initialTicker && isSubscriptionTicker(initialTicker)) return 'SUBSCRICAO_CONVERSAO';
    if (activePositions[0] && isSubscriptionTicker(activePositions[0].ticker)) return 'SUBSCRICAO_CONVERSAO';
    return 'DESDOBRAMENTO';
  });
  
  // Para Desdobramento / Grupamento: Razão De -> Para (ex: 1 -> 2 para split 1:2)
  const [fatorOrigem, setFatorOrigem] = useState('1');
  const [fatorDestino, setFatorDestino] = useState('2');
  
  // Para Bonificação: Percentual ou Quantidade recebida + Custo atribuído por ação
  const [bonificacaoQtd, setBonificacaoQtd] = useState('10');
  const [custoAtribuidoUnitario, setCustoAtribuidoUnitario] = useState('0.00');

  // Para Amortização: Valor por cota amortizado
  const [amortizacaoValorPorCota, setAmortizacaoValorPorCota] = useState('1.50');

  // Para Conversão de Subscrição:
  const [tickerDestino, setTickerDestino] = useState(subInfo.targetTicker || '');
  const [subscricaoQtd, setSubscricaoQtd] = useState('0');
  const [precoExercicioUnitario, setPrecoExercicioUnitario] = useState('0.00');

  const [dataEvento, setDataEvento] = useState(new Date().toISOString().slice(0, 10));
  const [observacoes, setObservacoes] = useState('');

  const currentPos = activePositions.find(p => p.ticker === selectedTicker);

  // Sincroniza campos quando o ativo selecionado muda
  useEffect(() => {
    if (currentPos) {
      setSubscricaoQtd(toCanonicalString(currentPos.quantidade));
      const info = getSubscriptionInfo(currentPos.ticker);
      if (info.isSubscription) {
        setTickerDestino(info.targetTicker);
        if (info.codeSuffix === '13' || info.codeSuffix === '9' || info.codeSuffix === '10') {
          // Recibo já teve valor quitado na emissão
          setPrecoExercicioUnitario('0.00');
        }
      }
    }
  }, [selectedTicker, currentPos]);

  // Se o usuário selecionou um ativo de subscrição, sugere automaticamente a aba de Conversão
  const handleSelectTicker = (newTicker: string) => {
    setSelectedTicker(newTicker);
    const info = getSubscriptionInfo(newTicker);
    if (info.isSubscription && eventType !== 'SUBSCRICAO_CONVERSAO' && eventType !== 'DIREITO_EXPIRADO') {
      setEventType('SUBSCRICAO_CONVERSAO');
    }
  };

  // Simulação e Preview Determinístico
  const preview = useMemo(() => {
    if (!currentPos) return null;

    const qtdAtual = D(currentPos.quantidade);
    const custoAtual = D(currentPos.custoTotal);
    const precoMedioAtual = D(currentPos.precoMedio);

    if (eventType === 'DESDOBRAMENTO') {
      const orig = D(fatorOrigem || '1');
      const dest = D(fatorDestino || '1');
      if (orig.isZero() || dest.isZero()) return null;

      const novaQtd = qtdAtual.mul(dest).div(orig);
      const deltaQtd = novaQtd.sub(qtdAtual);
      const novoCustoTotal = custoAtual; // Custo histórico estritamente preservado
      const novoPrecoMedio = novaQtd.gt(0) ? novoCustoTotal.div(novaQtd) : D(0);

      return {
        tipo: 'DESDOBRAMENTO',
        qtdAnterior: qtdAtual,
        novaQtd,
        deltaQtd,
        custoAnterior: custoAtual,
        novoCustoTotal,
        precoMedioAnterior: precoMedioAtual,
        novoPrecoMedio,
        descricao: `Desdobramento na proporção ${orig} para ${dest}: a posição passará de ${formatNumber(qtdAtual)} para ${formatNumber(novaQtd)} cotas, mantendo o custo total de ${formatBRL(custoAtual)} intacto. Preço médio unitário ajustado de ${formatBRL(precoMedioAtual)} para ${formatBRL(novoPrecoMedio)}.`,
      };
    }

    if (eventType === 'GRUPAMENTO') {
      const orig = D(fatorOrigem || '10');
      const dest = D(fatorDestino || '1');
      if (orig.isZero() || dest.isZero()) return null;

      const novaQtd = qtdAtual.mul(dest).div(orig);
      const deltaQtd = novaQtd.sub(qtdAtual);
      const novoCustoTotal = custoAtual;
      const novoPrecoMedio = novaQtd.gt(0) ? novoCustoTotal.div(novaQtd) : D(0);

      return {
        tipo: 'GRUPAMENTO',
        qtdAnterior: qtdAtual,
        novaQtd,
        deltaQtd,
        custoAnterior: custoAtual,
        novoCustoTotal,
        precoMedioAnterior: precoMedioAtual,
        novoPrecoMedio,
        descricao: `Grupamento na proporção ${orig} para ${dest}: a posição passará de ${formatNumber(qtdAtual)} para ${formatNumber(novaQtd)} cotas. O custo total contábil permanece inalterado em ${formatBRL(custoAtual)}. Preço médio unitário ajustado de ${formatBRL(precoMedioAtual)} para ${formatBRL(novoPrecoMedio)}.`,
      };
    }

    if (eventType === 'BONIFICACAO') {
      const qtdBonif = D(bonificacaoQtd || '0');
      const custoUnit = D(custoAtribuidoUnitario || '0');
      const custoAdicional = qtdBonif.mul(custoUnit);
      const novaQtd = qtdAtual.add(qtdBonif);
      const novoCustoTotal = custoAtual.add(custoAdicional);
      const novoPrecoMedio = novaQtd.gt(0) ? novoCustoTotal.div(novaQtd) : D(0);

      return {
        tipo: 'BONIFICACAO',
        qtdAnterior: qtdAtual,
        novaQtd,
        deltaQtd: qtdBonif,
        custoAnterior: custoAtual,
        novoCustoTotal,
        precoMedioAnterior: precoMedioAtual,
        novoPrecoMedio,
        descricao: `Bonificação de ${formatNumber(qtdBonif)} ações com custo atribuído de ${formatBRL(custoUnit)}/cota. Nova quantidade: ${formatNumber(novaQtd)}. Novo custo total: ${formatBRL(novoCustoTotal)}. Novo PM: ${formatBRL(novoPrecoMedio)}.`,
      };
    }

    if (eventType === 'AMORTIZACAO') {
      const valorPorCota = D(amortizacaoValorPorCota || '0');
      const valorAmortizadoTotal = qtdAtual.mul(valorPorCota);
      const diff = custoAtual.sub(valorAmortizadoTotal);
      const novoCustoTotal = diff.isNegative() ? D(0) : diff;
      const novoPrecoMedio = qtdAtual.gt(0) ? novoCustoTotal.div(qtdAtual) : D(0);

      return {
        tipo: 'AMORTIZACAO',
        qtdAnterior: qtdAtual,
        novaQtd: qtdAtual,
        deltaQtd: D(0),
        custoAnterior: custoAtual,
        novoCustoTotal,
        precoMedioAnterior: precoMedioAtual,
        novoPrecoMedio,
        descricao: `Amortização de ${formatBRL(valorPorCota)} por cota (Total amortizado: ${formatBRL(valorAmortizadoTotal)}). O custo contábil é reduzido diretamente para ${formatBRL(novoCustoTotal)}. Novo PM: ${formatBRL(novoPrecoMedio)}.`,
      };
    }

    if (eventType === 'SUBSCRICAO_CONVERSAO') {
      const qtdConv = D(subscricaoQtd || '0');
      const precoEx = D(precoExercicioUnitario || '0');
      const valorExercicioTotal = qtdConv.mul(precoEx);
      const custoDireitoTransferido = qtdAtual.gt(0) ? custoAtual.mul(qtdConv).div(qtdAtual) : D(0);
      const novoCustoTotalDestino = custoDireitoTransferido.add(valorExercicioTotal);
      const novoPrecoMedioDestino = qtdConv.gt(0) ? novoCustoTotalDestino.div(qtdConv) : D(0);
      const target = (tickerDestino || subInfo.targetTicker || 'COTAS11').toUpperCase().trim();

      return {
        tipo: 'SUBSCRICAO_CONVERSAO',
        qtdAnterior: qtdAtual,
        novaQtd: qtdAtual.sub(qtdConv),
        deltaQtd: qtdConv,
        custoAnterior: custoAtual,
        novoCustoTotal: custoAtual.sub(custoDireitoTransferido),
        precoMedioAnterior: precoMedioAtual,
        novoPrecoMedio: novoPrecoMedioDestino,
        targetTicker: target,
        valorExercicioTotal,
        custoDireitoTransferido,
        novoCustoTotalDestino,
        descricao: `Conversão de Subscrição: ${formatNumber(qtdConv)} direitos/recibos de ${selectedTicker} (custo ${formatBRL(custoDireitoTransferido)}) serão convertidos em ${formatNumber(qtdConv)} cotas definitivas de ${target}. Valor adicional pago no exercício: ${formatBRL(valorExercicioTotal)}. Custo total incorporado em ${target}: ${formatBRL(novoCustoTotalDestino)} (Preço Médio resultante: ${formatBRL(novoPrecoMedioDestino)}/cota). A posição em ${selectedTicker} será baixada em ${formatNumber(qtdConv)} unidades.`,
      };
    }

    if (eventType === 'DIREITO_EXPIRADO') {
      return {
        tipo: 'DIREITO_EXPIRADO',
        qtdAnterior: qtdAtual,
        novaQtd: D(0),
        deltaQtd: qtdAtual,
        custoAnterior: custoAtual,
        novoCustoTotal: D(0),
        precoMedioAnterior: precoMedioAtual,
        novoPrecoMedio: D(0),
        descricao: `Direito Expirado (Virou Pó): ${formatNumber(qtdAtual)} direitos de ${selectedTicker} não foram exercidos nem vendidos até a data de vencimento da oferta. A custódia em ${selectedTicker} será encerrada, reconhecendo uma perda de capital de ${formatBRL(custoAtual)}.`,
      };
    }

    return null;
  }, [
    currentPos,
    eventType,
    fatorOrigem,
    fatorDestino,
    bonificacaoQtd,
    custoAtribuidoUnitario,
    amortizacaoValorPorCota,
    subscricaoQtd,
    precoExercicioUnitario,
    tickerDestino,
    selectedTicker,
    subInfo.targetTicker
  ]);

  const handleConfirm = () => {
    if (!currentPos || !preview) return;

    if (eventType === 'SUBSCRICAO_CONVERSAO') {
      const targetTicker = (preview as any).targetTicker || 'COTAS11';
      const qtdConv = preview.deltaQtd;

      // 1. Cadastra o ativo destino no HermasDB caso não exista
      const existingAssets = HermasDB.getAssets();
      if (!existingAssets.some(a => a.ticker === targetTicker)) {
        HermasDB.saveAsset({
          id: targetTicker,
          ticker: targetTicker,
          nome: `${currentPos.asset.nome.replace(/\s*(?:DM|DIR|REC|SOBRAS|\d+).*$/i, '').trim()} Definitivo`,
          tipo: targetTicker.endsWith('11') ? 'FII' : 'AÇÃO',
        });
      }

      // 2. Operação de Baixa no ativo de subscrição original (ex: MXRF12)
      const opBaixa: Operation = {
        id: `sub_bx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        assetId: currentPos.asset.id,
        ticker: currentPos.ticker,
        tipo: 'SUBSCRICAO_BAIXA',
        dataPregao: dataEvento,
        dataLiquidacao: dataEvento,
        quantidade: toCanonicalString(qtdConv),
        precoUnitario: '0.00',
        taxasB3: '0.00',
        corretagem: '0.00',
        outrosCustos: '0.00',
        custosTotais: '0.00',
        valorTotalOperacao: '0.00',
        mercado: 'VISTA',
        status: 'CONFIRMADA',
        observacoes: `Baixa integral por conversão de subscrição para cotas de ${targetTicker}`,
        createdUtc: new Date().toISOString(),
      };
      HermasDB.saveOperation(opBaixa);

      // 3. Operação de Entrada no ativo definitivo destino (ex: MXRF11)
      const opEntrada: Operation = {
        id: `sub_ent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        assetId: targetTicker,
        ticker: targetTicker,
        tipo: 'SUBSCRICAO_CONVERSAO',
        dataPregao: dataEvento,
        dataLiquidacao: dataEvento,
        quantidade: toCanonicalString(qtdConv),
        precoUnitario: toCanonicalString(preview.novoPrecoMedio, 4),
        taxasB3: '0.00',
        corretagem: '0.00',
        outrosCustos: '0.00',
        custosTotais: '0.00',
        valorTotalOperacao: toCanonicalString((preview as any).novoCustoTotalDestino, 2),
        mercado: 'VISTA',
        status: 'CONFIRMADA',
        observacoes: observacoes || preview.descricao,
        createdUtc: new Date().toISOString(),
      };

      onSaveOperation(opEntrada);
      onClose();
      return;
    }

    if (eventType === 'DIREITO_EXPIRADO') {
      const opExpirado: Operation = {
        id: `sub_exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        assetId: currentPos.asset.id,
        ticker: currentPos.ticker,
        tipo: 'DIREITO_EXPIRADO',
        dataPregao: dataEvento,
        dataLiquidacao: dataEvento,
        quantidade: toCanonicalString(preview.deltaQtd),
        precoUnitario: '0.00',
        taxasB3: '0.00',
        corretagem: '0.00',
        outrosCustos: '0.00',
        custosTotais: '0.00',
        valorTotalOperacao: '0.00',
        mercado: 'VISTA',
        status: 'CONFIRMADA',
        observacoes: observacoes || preview.descricao,
        createdUtc: new Date().toISOString(),
      };

      onSaveOperation(opExpirado);
      onClose();
      return;
    }

    let opQtd = '0';
    let opPreco = '0';
    let opTotal = '0';

    if (eventType === 'DESDOBRAMENTO' || eventType === 'GRUPAMENTO') {
      opQtd = toCanonicalString(preview.deltaQtd);
      opPreco = '0.00';
      opTotal = '0.00';
    } else if (eventType === 'BONIFICACAO') {
      opQtd = toCanonicalString(preview.deltaQtd);
      opPreco = toCanonicalString(D(custoAtribuidoUnitario || '0'));
      opTotal = toCanonicalString(preview.deltaQtd.mul(D(custoAtribuidoUnitario || '0')));
    } else if (eventType === 'AMORTIZACAO') {
      opQtd = toCanonicalString(currentPos.quantidade);
      opPreco = toCanonicalString(D(amortizacaoValorPorCota || '0'));
      opTotal = toCanonicalString(D(currentPos.quantidade).mul(D(amortizacaoValorPorCota || '0')));
    }

    const op: Operation = {
      id: `corp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      assetId: currentPos.asset.id,
      ticker: currentPos.ticker,
      tipo: eventType,
      dataPregao: dataEvento,
      dataLiquidacao: dataEvento,
      quantidade: opQtd,
      precoUnitario: opPreco,
      taxasB3: '0.00',
      corretagem: '0.00',
      outrosCustos: '0.00',
      custosTotais: '0.00',
      valorTotalOperacao: opTotal,
      mercado: 'VISTA',
      status: 'CONFIRMADA',
      observacoes: observacoes || preview.descricao,
      createdUtc: new Date().toISOString(),
    };

    onSaveOperation(op);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Assistente de Evento Corporativo & Subscrição
              </h2>
              <p className="text-xs text-slate-500">
                Conversão de subscrições (12/13/14), desdobramentos, bonificações e amortizações B3
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {activePositions.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Nenhum ativo com custódia em aberto</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Eventos corporativos (desdobramentos, grupamentos, bonificações, amortizações ou subscrições) necessitam de uma posição de custódia ativa para serem aplicados.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-5">
              {/* Seletor de Ativo da Custódia */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ativo em Custódia com Evento:
            </label>
            <select
              value={selectedTicker}
              onChange={e => handleSelectTicker(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              {activePositions.map(pos => {
                const isSub = isSubscriptionTicker(pos.ticker);
                return (
                  <option key={pos.ticker} value={pos.ticker}>
                    {pos.ticker} — {pos.asset.nome} ({formatNumber(pos.quantidade)} cotas @ PM {formatBRL(pos.precoMedio)}) {isSub ? '⚡ [SUBSCRIÇÃO]' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Destaque Educativo se for Ativo de Subscrição (12, 13, 14, 1, 2) */}
          {subInfo.isSubscription && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-950 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <span className={`px-2 py-0.5 rounded-full text-[10px] border ${subInfo.badgeClass}`}>
                  {subInfo.badgeLabel}
                </span>
                <span>{subInfo.title}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                {subInfo.explanation}
              </p>
              <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                💡 <strong>Orientação:</strong> {subInfo.guidanceText}
              </div>
            </div>
          )}

          {/* Abas de Tipos de Eventos */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de Evento:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {([
                'SUBSCRICAO_CONVERSAO',
                'DIREITO_EXPIRADO',
                'DESDOBRAMENTO',
                'GRUPAMENTO',
                'BONIFICACAO',
                'AMORTIZACAO'
              ] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEventType(type)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    eventType === type
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {type === 'SUBSCRICAO_CONVERSAO' && '⚡ Converter Subscrição'}
                  {type === 'DIREITO_EXPIRADO' && '💨 Expirar (Virou Pó)'}
                  {type === 'DESDOBRAMENTO' && 'Desdobramento'}
                  {type === 'GRUPAMENTO' && 'Grupamento'}
                  {type === 'BONIFICACAO' && 'Bonificação'}
                  {type === 'AMORTIZACAO' && 'Amortização'}
                </button>
              ))}
            </div>
          </div>

          {/* Parâmetros Específicos por Tipo */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
            {eventType === 'SUBSCRICAO_CONVERSAO' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Ativo Destino (Cota Definitiva):
                    </label>
                    <input
                      type="text"
                      value={tickerDestino}
                      onChange={e => setTickerDestino(e.target.value.toUpperCase())}
                      placeholder={subInfo.targetTicker || 'Ex: MXRF11'}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Normalmente final 11 para FIIs ou final 3/4 para ações
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Quantidade a Converter:
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      max={currentPos ? toCanonicalString(currentPos.quantidade) : undefined}
                      value={subscricaoQtd}
                      onChange={e => setSubscricaoQtd(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Disponível em custódia: {currentPos ? formatNumber(currentPos.quantidade) : 0}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Preço de Exercício Pago por Cota (R$):
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={precoExercicioUnitario}
                    onChange={e => setPrecoExercicioUnitario(e.target.value)}
                    placeholder="0.00 se já foi pago no recibo"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {subInfo.codeSuffix === '12' || subInfo.codeSuffix === '1' || subInfo.codeSuffix === '2'
                      ? 'Informe o valor debitado na sua conta da corretora para subscrever cada cota.'
                      : 'Se o valor da subscrição já foi pago na compra/emissão do recibo, mantenha 0,00.'}
                  </span>
                </div>
              </div>
            )}

            {eventType === 'DIREITO_EXPIRADO' && (
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  Ao confirmar a expiração, a posição de{' '}
                  <strong className="text-slate-900 dark:text-white font-mono">{selectedTicker}</strong> será encerrada
                  e o custo total de aquisição ({currentPos ? formatBRL(currentPos.custoTotal) : 'R$ 0,00'}) será
                  computado como perda patrimonial realizada.
                </p>
              </div>
            )}

            {eventType === 'DESDOBRAMENTO' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Razão do Desdobramento (Ex: 1 ação vira 2, 3, etc.):
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 block mb-1">Cada (de):</span>
                    <input
                      type="number"
                      min="1"
                      value={fatorOrigem}
                      onChange={e => setFatorOrigem(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-400 mt-4">→ Vira</span>
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 block mb-1">Para (vira):</span>
                    <input
                      type="number"
                      min="1"
                      value={fatorDestino}
                      onChange={e => setFatorDestino(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {eventType === 'GRUPAMENTO' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Razão do Grupamento (Ex: 10 ações viram 1):
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 block mb-1">A cada (de):</span>
                    <input
                      type="number"
                      min="1"
                      value={fatorOrigem}
                      onChange={e => setFatorOrigem(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-400 mt-4">→ Vira</span>
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 block mb-1">Para (vira):</span>
                    <input
                      type="number"
                      min="1"
                      value={fatorDestino}
                      onChange={e => setFatorDestino(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {eventType === 'BONIFICACAO' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Qtd de Novas Ações Recebidas:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bonificacaoQtd}
                    onChange={e => setBonificacaoQtd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Custo Atribuído Unitário (R$):
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={custoAtribuidoUnitario}
                    onChange={e => setCustoAtribuidoUnitario(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {eventType === 'AMORTIZACAO' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Valor Amortizado por Cota (R$):
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={amortizacaoValorPorCota}
                  onChange={e => setAmortizacaoValorPorCota(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                />
              </div>
            )}
          </div>

          {/* Data do Evento / Homologação */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Data de Efeito / Homologação da CVM:</span>
            </label>
            <input
              type="date"
              value={dataEvento}
              onChange={e => setDataEvento(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
            />
          </div>

          {/* Preview Determinístico */}
          {preview && (
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-purple-900 dark:text-purple-300">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Simulação do Impacto Contábil:</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                {preview.descricao}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!preview}
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar e Gravar no Cofre</span>
          </button>
        </div>
      </>
    )}
      </div>
    </div>
  );
};
