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
  Shield,
  Layers,
  ArrowLeft,
  Clipboard,
  AlertTriangle,
  X,
  FileCheck,
} from 'lucide-react';
import { DocumentRecord, Operation, Dividend } from '../../types';
import { extractTextFromPdf } from '../../engine/importers/pdfExtractor';
import { parseBrokerageNoteText } from '../../engine/importers/toroParser';
import { formatBRL } from '../../engine/decimal';

interface DocumentsViewProps {
  documents: DocumentRecord[];
  onConfirmCandidatesBatch: (ops: Operation[], doc: DocumentRecord) => void;
  onConfirmDividendsBatch?: (divs: Dividend[], docRecord?: DocumentRecord) => void;
  onDeleteDocument?: (id: string) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onConfirmCandidatesBatch,
  onDeleteDocument,
}) => {
  const [importMode, setImportMode] = useState<'upload' | 'paste'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pastedText, setPastedText] = useState('');

  // Estados de Notas de Corretagem (Compras e Vendas)
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
        `Documento nº ${docToDelete.numeroNota} e seus registros associados foram removidos do cofre com sucesso.`
      );
      setDocToDelete(null);
    }
  };

  const handleDiscardCurrentDoc = () => {
    setExtractedDoc(null);
    setCandidateOps([]);
    setPastedText('');
    setErrorMsg(null);
  };

  // ----------------------------------------------------
  // PARSER DE NOTAS DE CORRETAGEM (COMPRAS E VENDAS)
  // ----------------------------------------------------
  const processBrokerageText = (text: string, fileName: string, fileSize: number) => {
    if (!text || text.trim().length === 0) {
      throw new Error('Nenhum texto encontrado no arquivo ou campo de texto.');
    }

    const parsed = parseBrokerageNoteText(text);

    const docId = `doc_${Date.now()}`;
    const docRecord: DocumentRecord = {
      id: docId,
      numeroNota: parsed.numeroNota,
      dataPregao: parsed.dataPregao,
      corretora: parsed.corretora,
      nomeArquivo: fileName,
      tamanhoBytes: fileSize,
      status: 'REVISAO_PENDENTE',
      rawText: text,
      createdUtc: new Date().toISOString(),
    };

    const taggedOps = parsed.operations.map(op => ({
      ...op,
      notaCorretagemId: docId,
      comprovante: `Nota nº ${parsed.numeroNota || 'S/N'} (${parsed.corretora || 'B3'})`,
    }));

    setExtractedDoc(docRecord);
    setCandidateOps(taggedOps);
    setMetaInfo({
      taxasB3: parsed.taxasB3,
      corretagem: parsed.corretagem,
      outrosCustos: parsed.outrosCustos,
      custosTotais: parsed.custosTotais,
    });

    if (parsed.operations.length === 0) {
      setErrorMsg(
        'A nota foi lida, mas não identificamos nenhuma operação de compra ou venda no texto.'
      );
    } else {
      setErrorMsg(null);
    }
  };

  // ----------------------------------------------------
  // UPLOAD DE NOTA DE CORRETAGEM EM PDF
  // ----------------------------------------------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { fullText } = await extractTextFromPdf(file);
      processBrokerageText(fullText, file.name, file.size);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        `Erro ao ler arquivo: ${err.message || 'Formato não suportado. Tente exportar novamente em PDF ou colar o texto.'}`
      );
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ----------------------------------------------------
  // PROCESSAMENTO DE TEXTO COLADO
  // ----------------------------------------------------
  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      setErrorMsg('Por favor, cole o texto da sua nota de corretagem antes de processar.');
      return;
    }
    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      processBrokerageText(pastedText, 'Texto Colado Manualmente.txt', pastedText.length);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao interpretar nota de corretagem colada.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ----------------------------------------------------
  // CONFIRMAÇÃO DO LOTE DE OPERAÇÕES
  // ----------------------------------------------------
  const handleConfirmBatch = () => {
    if (!extractedDoc || candidateOps.length === 0) return;

    // Vincula rigorosamente cada operação ao ID único do documento e comprovante
    const opsWithDocId: Operation[] = candidateOps.map(op => ({
      ...op,
      notaCorretagemId: extractedDoc.id,
      comprovante: `Nota nº ${extractedDoc.numeroNota || 'S/N'} (${extractedDoc.corretora || 'B3'})`,
    }));

    const finalDoc: DocumentRecord = {
      ...extractedDoc,
      status: 'CONFIRMADO',
      candidatosOperacoes: opsWithDocId,
    };

    onConfirmCandidatesBatch(opsWithDocId, finalDoc);

    setSuccessMsg(
      `Nota nº ${finalDoc.numeroNota} importada com sucesso! ${opsWithDocId.length} operações cadastradas no cofre.`
    );
    setExtractedDoc(null);
    setCandidateOps([]);
    setPastedText('');
  };

  const handleRemoveCandidateOp = (idx: number) => {
    setCandidateOps(prev => prev.filter((_, i) => i !== idx));
  };

  // =========================================================================
  // CENÁRIO 1: TELA CHEIA DE CONFERÊNCIA DA NOTA IMPORTADA (QUANDO A NOTA ABRE)
  // A caixa de upload e a lista de documentos somem e dão lugar à conferência direta.
  // =========================================================================
  if (extractedDoc) {
    return (
      <div className="space-y-6 animate-in fade-in">
        {/* Barra Superior de Navegação e Retorno */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDiscardCurrentDoc}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Voltar ao início sem gravar"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar / Cancelar</span>
            </button>

            <div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Auditoria de Nota de Corretagem
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Nota nº {extractedDoc.numeroNota || 'S/N'} • Pregão: {extractedDoc.dataPregao || 'Data desconhecida'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4" />
              <span>{candidateOps.length} operações identificadas</span>
            </span>
          </div>
        </div>

        {/* Detalhes do Documento e Corretora */}
        <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-slate-400 block text-[11px]">Corretora</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {extractedDoc.corretora || 'Corretora B3'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Arquivo Original</span>
            <span className="font-mono text-slate-600 dark:text-slate-400 max-w-xs truncate block" title={extractedDoc.nomeArquivo}>
              {extractedDoc.nomeArquivo}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Status da Auditoria</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              Aguardando Sua Confirmação
            </span>
          </div>
        </div>

        {/* Resumo de Custos B3, Corretagem e Taxas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Taxas B3 / Emolumentos</span>
            <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-sm">
              {formatBRL(metaInfo.taxasB3)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Corretagem</span>
            <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-sm">
              {formatBRL(metaInfo.corretagem)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Outros Custos / ISS</span>
            <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-sm">
              {formatBRL(metaInfo.outrosCustos)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Custos Totais da Nota</span>
            <span className="font-extrabold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
              {formatBRL(metaInfo.custosTotais)}
            </span>
          </div>
        </div>

        {/* Tabela de Operações Reconhecidas na Nota */}
        <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3.5 pl-5">Operação</th>
                <th className="p-3.5">Ativo (Ticker)</th>
                <th className="p-3.5 text-right">Quantidade</th>
                <th className="p-3.5 text-right">Preço Unitário</th>
                <th className="p-3.5 text-right">Custos Rateados</th>
                <th className="p-3.5 text-right">Valor Total da Operação</th>
                <th className="p-3.5 text-center pr-5 w-16">Remover</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {candidateOps.map((op, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-3.5 pl-5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        op.tipo === 'COMPRA'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {op.tipo}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white font-mono text-sm">
                    {op.ticker}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-700 dark:text-slate-300">
                    {op.quantidade}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-700 dark:text-slate-300">
                    {formatBRL(op.precoUnitario)}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-500">
                    {formatBRL(op.custosTotais)}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {formatBRL(op.valorTotalOperacao)}
                  </td>
                  <td className="p-3.5 text-center pr-5">
                    <button
                      type="button"
                      onClick={() => handleRemoveCandidateOp(idx)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Remover esta operação antes de gravar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Barra de Ações Inferior */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleDiscardCurrentDoc}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Descartar e Cancelar
          </button>

          <button
            type="button"
            disabled={candidateOps.length === 0}
            onClick={handleConfirmBatch}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar e Gravar {candidateOps.length} Operações no Cofre</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CENÁRIO 2: TELA INICIAL COM UPLOAD E HISTÓRICO DE DOCUMENTOS
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <span>Notas de Corretagem & Documentos</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Importe suas notas de corretagem (PDF ou texto) da B3 para cadastrar compras e vendas com cálculo automático de taxas e preço médio.
          </p>
        </div>

        {/* Status de Armazenamento Local */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Cofre Criptografado
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              {documents.length} notas arquivadas
            </span>
          </div>
        </div>
      </div>

      {/* Alertas de Sucesso / Erro */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:opacity-75 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-700 dark:text-red-400 hover:opacity-75 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Seletor de Modo: Upload de Arquivo ou Colar Texto */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setImportMode('upload')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            importMode === 'upload'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload de Arquivo (PDF)</span>
        </button>

        <button
          type="button"
          onClick={() => setImportMode('paste')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            importMode === 'paste'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Clipboard className="w-3.5 h-3.5" />
          <span>Colar Texto da Nota</span>
        </button>
      </div>

      {/* Caixa de Entrada: Upload ou Colar Texto */}
      {importMode === 'upload' ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-10 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/20 transition-all flex flex-col items-center justify-center text-center cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20">
            <Upload className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Clique para selecionar sua Nota de Corretagem (PDF)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            Compatível com o layout B3 padrão Sinacor (Toro CTVM, Clear, XP, BTG, NuInvest, etc.). O processamento é 100% privado e roda diretamente no seu navegador.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />

          {isProcessing && (
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              <Clock className="w-4 h-4 animate-spin" />
              <span>Processando nota de corretagem...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Cole o texto bruto da sua nota de corretagem:
            </label>
            <textarea
              rows={8}
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              placeholder="Cole aqui o texto copiado da sua nota de corretagem B3..."
              className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="button"
            disabled={isProcessing || !pastedText.trim()}
            onClick={handleProcessPastedText}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
          >
            {isProcessing ? (
              <Clock className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Processar Texto da Nota</span>
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* HISTÓRICO DE DOCUMENTOS IMPORTADOS NO COFRE */}
      {/* ==================================================== */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>Histórico de Notas de Corretagem Arquivadas ({documents.length})</span>
        </h3>

        {documents.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            Nenhuma nota de corretagem arquivada ainda. Faça o upload da sua primeira nota acima para cadastrar seus ativos automaticamente.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3 pl-4">Número da Nota</th>
                  <th className="p-3">Data Pregão</th>
                  <th className="p-3">Corretora</th>
                  <th className="p-3">Arquivo</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right pr-4 w-16">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 pl-4 font-mono font-bold text-slate-900 dark:text-white">
                      {doc.numeroNota || 'S/N'}
                    </td>
                    <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                      {doc.dataPregao || '-'}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {doc.corretora || 'Corretora B3'}
                    </td>
                    <td className="p-3 text-slate-500 max-w-xs truncate" title={doc.nomeArquivo}>
                      {doc.nomeArquivo}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-3 text-right pr-4">
                      {onDeleteDocument && (
                        <button
                          type="button"
                          onClick={() => setDocToDelete(doc)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Excluir documento e suas operações"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão de Documento */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Remover Nota nº {docToDelete.numeroNota}?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              A exclusão da nota removerá o documento e todas as operações de compra e venda cadastradas por ela, recalculando seu patrimônio e posições no cofre automaticamente.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDoc}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Sim, Remover Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
