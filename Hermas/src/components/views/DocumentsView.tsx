/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Plus,
  Shield,
  Layers,
  ArrowRight,
  Info,
  Edit2,
  RotateCcw,
  Clipboard,
  FileCode,
  Sparkles,
  AlertTriangle,
  X,
} from 'lucide-react';
import { DocumentRecord, Operation, MarketType } from '../../types';
import { extractTextFromPdf } from '../../engine/importers/pdfExtractor';
import { parseBrokerageNoteText, normalizeTicker } from '../../engine/importers/toroParser';
import { D, toCanonicalString, formatBRL } from '../../engine/decimal';
import { getSubscriptionInfo } from '../../engine/subscriptions';

interface DocumentsViewProps {
  documents: DocumentRecord[];
  onConfirmCandidatesBatch: (ops: Operation[], doc: DocumentRecord) => void;
  onDeleteDocument?: (id: string) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onConfirmCandidatesBatch,
  onDeleteDocument,
}) => {
  const [importMode, setImportMode] = useState<'upload' | 'paste'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [extractedDoc, setExtractedDoc] = useState<DocumentRecord | null>(null);
  const [candidateOps, setCandidateOps] = useState<Operation[]>([]);
  const [metaInfo, setMetaInfo] = useState<{
    taxasB3: string;
    corretagem: string;
    outrosCustos: string;
    custosTotais: string;
  }>({ taxasB3: '0.00', corretagem: '0.00', outrosCustos: '0.00', custosTotais: '0.00' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<DocumentRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConfirmDeleteDoc = () => {
    if (docToDelete && onDeleteDocument) {
      onDeleteDocument(docToDelete.id);
      setSuccessMsg(
        `Nota nº ${docToDelete.numeroNota} e todas as suas operações e ativos associados foram removidos do cofre com sucesso.`
      );
      setDocToDelete(null);
    }
  };

  const processRawText = (text: string, fileName: string, fileSize: number) => {
    if (!text || text.trim().length === 0) {
      throw new Error('Nenhum texto encontrado no arquivo ou campo de texto.');
    }

    const parsed = parseBrokerageNoteText(text);

    const docRecord: DocumentRecord = {
      id: `doc_${Date.now()}`,
      numeroNota: parsed.numeroNota,
      dataPregao: parsed.dataPregao,
      corretora: parsed.corretora,
      nomeArquivo: fileName,
      tamanhoBytes: fileSize,
      status: 'REVISAO_PENDENTE',
      rawText: text,
      createdUtc: new Date().toISOString(),
    };

    setExtractedDoc(docRecord);
    setCandidateOps(parsed.operations);
    setMetaInfo({
      taxasB3: parsed.taxasB3,
      corretagem: parsed.corretagem,
      outrosCustos: parsed.outrosCustos,
      custosTotais: parsed.custosTotais,
    });

    if (parsed.operations.length === 0) {
      setErrorMsg(
        'A nota foi lida, mas não identificamos nenhuma operação de compra ou venda no texto. Verifique se o documento é uma nota de corretagem válida ou use a aba "Colar Texto".'
      );
    } else {
      setErrorMsg(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCurrentFileName(file.name);
    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { fullText } = await extractTextFromPdf(file);
      processRawText(fullText, file.name, file.size);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        `Erro ao ler arquivo: ${err.message || 'Formato não suportado. Tente exportar a nota novamente em PDF ou colar o texto.'}`
      );
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      setErrorMsg('Cole o texto da nota de corretagem no campo antes de processar.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setCurrentFileName('Texto Colado');

    try {
      processRawText(pastedText, 'nota_manual.txt', pastedText.length);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar texto.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Alteração de tipo de uma operação candidata (COMPRA <-> VENDA)
  const handleToggleTipo = (index: number) => {
    setCandidateOps(prev => {
      const updated = [...prev];
      const op = updated[index];
      const newTipo = op.tipo === 'COMPRA' ? 'VENDA' : 'COMPRA';
      const valorBase = D(op.quantidade).mul(D(op.precoUnitario));
      const custos = D(op.custosTotais);
      const novoTotal = newTipo === 'COMPRA' ? valorBase.add(custos) : valorBase.sub(custos);

      updated[index] = {
        ...op,
        tipo: newTipo,
        valorTotalOperacao: toCanonicalString(novoTotal, 2),
      };
      return updated;
    });
  };

  // Remover uma operação candidata
  const handleRemoveCandidate = (index: number) => {
    setCandidateOps(prev => prev.filter((_, i) => i !== index));
  };

  // Confirmar e salvar todas as operações no cofre
  const handleConfirmBatch = () => {
    if (!extractedDoc) return;
    if (candidateOps.length === 0) {
      setErrorMsg('Nenhuma operação restante para confirmar.');
      return;
    }

    const confirmedOps: Operation[] = candidateOps.map(op => ({
      ...op,
      status: 'CONFIRMADA',
      notaCorretagemId: extractedDoc.id,
    }));

    const updatedDoc: DocumentRecord = {
      ...extractedDoc,
      status: 'CONFIRMADO',
      candidatosOperacoes: confirmedOps,
    };

    onConfirmCandidatesBatch(confirmedOps, updatedDoc);

    setSuccessMsg(
      `Sucesso! ${confirmedOps.length} operações da Nota nº ${extractedDoc.numeroNota} foram registradas e reconciliadas na sua carteira.`
    );
    setExtractedDoc(null);
    setCandidateOps([]);
    setCurrentFileName(null);
    setPastedText('');
  };

  const handleCancelReview = () => {
    setExtractedDoc(null);
    setCandidateOps([]);
    setCurrentFileName(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner de Importação */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            <span>Importação de Notas de Corretagem B3</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compatível com Toro, Clear, XP, BTG, NuInvest, Banco Inter, Rico, Genial, Ágora e padrão SINACOR. 100% offline e privado.
          </p>
        </div>

        {/* Alternador de Modo: Upload ou Colar Texto */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => setImportMode('upload')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              importMode === 'upload'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Arquivo PDF / TXT</span>
          </button>
          <button
            type="button"
            onClick={() => setImportMode('paste')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              importMode === 'paste'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Colar Texto</span>
          </button>
        </div>
      </div>

      {/* Banner de Sucesso */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-xs text-emerald-600 hover:underline cursor-pointer ml-4"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Banner de Erro */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-xs text-red-500 hover:underline cursor-pointer ml-4"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Área de Entrada: Upload ou Colar Texto */}
      {!extractedDoc && (
        <>
          {importMode === 'upload' ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 text-center relative overflow-hidden transition-all hover:border-blue-500 group cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,application/pdf,text/plain"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="max-w-md mx-auto space-y-3 pointer-events-none">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center border border-blue-200 dark:border-blue-800 shadow-sm group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {currentFileName ? `Processando: ${currentFileName}` : 'Clique ou Arraste sua Nota em PDF'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Formatos aceitos: <strong>PDF</strong> oficial de corretora ou arquivo <strong>TXT</strong>. Processamento 100% local.
                  </p>
                </div>
                {isProcessing && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold animate-pulse">
                    <span>Lendo texto do documento localmente...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Clipboard className="w-4 h-4 text-blue-600" />
                  <span>Colar Texto da Nota de Corretagem</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Selecione e copie o texto completo da sua nota ou extrato e cole no campo abaixo.
                </p>
              </div>

              <textarea
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder="Exemplo de Nota Toro (3 ativos):&#10;KLBN4F - KLABIN S/A PN N2&#10;Quant. total de compra: 92 Preço médio compra: R$ 4,2400&#10;&#10;MXRF12 - FII MAXI REN DM 10,29&#10;Quant. total de compra: 23 Preço médio compra: R$ 0,2100&#10;&#10;GOAU4F - GERDAU MET PN N1&#10;Quant. total de compra: 10 Preço médio compra: R$ 10,3700"
                rows={8}
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-mono text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPastedText(
                      `TORO CORRETORA DE TITULOS E VALORES MOBILIARIOS LTDA\nNúmero da nota: 104820\nData pregão: 15/01/2024\n\nKLBN4F - KLABIN S/A PN N2\nPREÇO DE EXERCÍCIO: R$0,00 Quant. total de compra: 92 Preço médio compra: R$ 4,2400 | Quant. total de venda: 0\nC/V MERCADO QUANTIDADE PREÇO VALOR OPERACAO VENCIMENTO TIPO MERCADO\nCOMPRA B3 RV LISTADO 68 R$4,24 R$288,32 FRACIONARIO\nCOMPRA B3 RV LISTADO 23 R$4,24 R$97,52 FRACIONARIO\nCOMPRA B3 RV LISTADO 1 R$4,24 R$4,24 FRACIONARIO\n\nMXRF12 - FII MAXI REN DM 10,29\nPREÇO DE EXERCÍCIO: R$0,00 Quant. total de compra: 23 Preço médio compra: R$ 0,2100 | Quant. total de venda: 0\nC/V MERCADO QUANTIDADE PREÇO VALOR OPERACAO VENCIMENTO TIPO MERCADO\nCOMPRA B3 RV LISTADO 19 R$0,21 R$3,99 VISTA\nCOMPRA B3 RV LISTADO 4 R$0,21 R$0,84 VISTA\n\nGOAU4F - GERDAU MET PN N1\nPREÇO DE EXERCÍCIO: R$0,00 Quant. total de compra: 10 Preço médio compra: R$ 10,3700 | Quant. total de venda: 0\nC/V MERCADO QUANTIDADE PREÇO VALOR OPERACAO VENCIMENTO TIPO MERCADO\nCOMPRA B3 RV LISTADO 10 R$10,37 R$103,70 FRACIONARIO\n\nResumo Financeiro:\nTaxa de liquidação: 0,98\nEmolumentos: 0,20\nTotal custos: 1,18`
                    );
                    setErrorMsg(null);
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preencher com Exemplo Toro (3 Ativos: KLBN4F, MXRF12, GOAU4F)</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing || !pastedText.trim()}
                  onClick={handleParsePastedText}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>{isProcessing ? 'Processando...' : 'Interpretar e Extrair Operações'}</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Candidatos Extraídos a Confirmar */}
      {extractedDoc && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-blue-500/50 dark:border-blue-500/40 shadow-xl space-y-5 animate-in fade-in zoom-in-98">
          {/* Cabeçalho da Nota Identificada */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    Nota nº {extractedDoc.numeroNota}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    {extractedDoc.corretora}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Data Pregão: <strong>{extractedDoc.dataPregao}</strong> • {candidateOps.length} operações identificadas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelReview}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBatch}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar & Gravar no Cofre</span>
              </button>
            </div>
          </div>

          {/* Resumo de Custos e Rateio */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs border border-slate-200/60 dark:border-slate-800">
            <div>
              <span className="text-slate-400 block text-[11px]">Taxas B3 / CBLC:</span>
              <strong className="font-mono text-slate-900 dark:text-white">{formatBRL(metaInfo.taxasB3)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Corretagem:</span>
              <strong className="font-mono text-slate-900 dark:text-white">{formatBRL(metaInfo.corretagem)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Outros Custos/ISS:</span>
              <strong className="font-mono text-slate-900 dark:text-white">{formatBRL(metaInfo.outrosCustos)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Total Custos da Nota:</span>
              <strong className="font-mono text-blue-600 dark:text-blue-400">{formatBRL(metaInfo.custosTotais)}</strong>
            </div>
          </div>

          {/* Lista de Operações Extraídas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Revise os ativos e clique em COMPRA/VENDA se desejar inverter:</span>
              <span>{candidateOps.length} posições</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
              {candidateOps.map((op, idx) => {
                const isCompra = op.tipo === 'COMPRA';
                const subInfo = getSubscriptionInfo(op.ticker);
                return (
                  <div
                    key={op.id || idx}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleTipo(idx)}
                        title="Clique para alternar entre COMPRA e VENDA"
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold cursor-pointer transition-colors shrink-0 mt-0.5 sm:mt-0 ${
                          isCompra
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-200'
                        }`}
                      >
                        {op.tipo} ⇄
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold font-mono text-sm text-slate-900 dark:text-white">
                            {op.ticker}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                            {op.mercado}
                          </span>
                          {subInfo.isSubscription && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${subInfo.badgeClass}`}>
                              {subInfo.badgeLabel}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {op.quantidade} un. @ <strong className="font-mono text-slate-700 dark:text-slate-300">{formatBRL(op.precoUnitario)}</strong>
                          {parseFloat(op.custosTotais) > 0 && (
                            <span className="text-[11px] text-slate-400 ml-2">
                              (Taxas rateadas: {formatBRL(op.custosTotais)})
                            </span>
                          )}
                        </div>
                        {subInfo.isSubscription && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                            ⚡ Subscrição transitória. Se não quiser importar este direito, clique na lixeira ao lado.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                          {formatBRL(op.valorTotalOperacao)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Total líquido
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveCandidate(idx)}
                        title="Excluir este ativo da nota antes de gravar no cofre"
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Histórico de Notas Processadas */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Histórico de Notas Processadas</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            {documents.length} {documents.length === 1 ? 'nota registrada' : 'notas registradas'}
          </span>
        </div>

        {/* Frase de Advertência Clara sobre a Exclusão de Notas e Ativos */}
        <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-bold text-amber-900 dark:text-amber-100 block">
              Advertência Importante sobre Exclusão de Notas:
            </strong>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">
              O cofre Hermas mantém vínculo estrito entre as notas fiscais e os ativos em custódia. 
              <strong> A partir do momento em que você excluir uma nota de corretagem, todos os ativos e ordens daquela nota serão automaticamente excluídos da sua carteira</strong>, recalculando seu patrimônio e preço médio.
            </p>
          </div>
        </div>

        {documents.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">
            Nenhuma nota importada no histórico do cofre ainda.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {documents.map(doc => (
              <div key={doc.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Nota nº {doc.numeroNota}</span>
                      <span className="text-[10px] text-slate-500 font-normal">({doc.corretora})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Pregão: {doc.dataPregao} • {doc.candidatosOperacoes?.length || 0} operações • {doc.nomeArquivo}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      doc.status === 'CONFIRMADO'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {doc.status}
                  </span>

                  {onDeleteDocument && (
                    <button
                      type="button"
                      onClick={() => setDocToDelete(doc)}
                      title="Excluir nota e todos os seus ativos associados"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Advertência & Confirmação de Exclusão de Nota */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Excluir Nota de Corretagem?
                  </h3>
                  <p className="text-xs text-red-600 dark:text-red-400 font-bold">
                    Aviso: Todos os ativos desta nota serão excluídos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Documento:</span>
                <strong className="text-slate-900 dark:text-white">
                  Nota nº {docToDelete.numeroNota} ({docToDelete.corretora})
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Data do Pregão:</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono">{docToDelete.dataPregao}</span>
              </div>
              {docToDelete.candidatosOperacoes && docToDelete.candidatosOperacoes.length > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/70 dark:border-slate-700">
                  <span className="text-slate-500">Ativos afetados:</span>
                  <span className="text-red-600 dark:text-red-400 font-bold font-mono">
                    {Array.from(new Set(docToDelete.candidatosOperacoes.map(o => o.ticker))).join(', ')} ({docToDelete.candidatosOperacoes.length} {docToDelete.candidatosOperacoes.length === 1 ? 'operação' : 'operações'})
                  </span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/40 text-xs text-red-900 dark:text-red-200 leading-relaxed">
              <strong>Atenção:</strong> A partir do momento em que você excluir esta nota,{' '}
              <strong>todos os ativos comprados ou vendidos nela serão automaticamente removidos da sua carteira</strong>. 
              Os saldos de custódia, preço médio e o resultado fiscal serão recalculados imediatamente.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDoc}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir Nota e Ativos</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
