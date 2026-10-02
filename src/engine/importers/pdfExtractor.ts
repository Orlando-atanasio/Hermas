/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configura o worker do PDF.js servido localmente e de forma determinística
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  } catch (err) {
    console.warn('Worker local falhou; configurando fallback:', err);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.3.289'}/build/pdf.worker.min.mjs`;
  }
}

export interface PdfExtractionResult {
  fullText: string;
  pageCount: number;
  lines: string[];
}

/**
 * Extrai texto completo de notas de corretagem (PDF ou TXT) no próprio navegador do usuário,
 * 100% offline e privado, preservando a ordenação das linhas e dos dados da nota.
 */
export async function extractTextFromPdf(
  fileOrBuffer: File | ArrayBuffer | string,
  onProgress?: (currentPage: number, totalPages: number) => void,
  password?: string
): Promise<PdfExtractionResult> {
  // 1. Suporte a texto direto (colado pelo usuário)
  if (typeof fileOrBuffer === 'string') {
    const rawLines = fileOrBuffer.split('\n').map(l => l.trim()).filter(Boolean);
    return {
      fullText: fileOrBuffer,
      pageCount: 1,
      lines: rawLines,
    };
  }

  // 2. Suporte a arquivos de texto simples (.txt)
  if (fileOrBuffer instanceof File) {
    const fileName = fileOrBuffer.name.toLowerCase();
    if (fileName.endsWith('.txt') || fileOrBuffer.type.startsWith('text/')) {
      const text = await fileOrBuffer.text();
      const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
      return {
        fullText: text,
        pageCount: 1,
        lines: rawLines,
      };
    }
  }

  // 3. Processamento de PDF de nota de corretagem via PDF.js
  let arrayBuffer: ArrayBuffer;
  if (fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    arrayBuffer = fileOrBuffer;
  }

  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
    password: password || undefined,
  });

  (loadingTask as any).onPassword = (callback: (password: string | Error) => void, reason: number) => {
    try {
      if (password) {
        callback(password);
        return;
      }
      const promptFn = typeof window !== 'undefined' ? window.prompt : null;
      if (promptFn) {
        const userPass = promptFn(
          reason === 1
            ? 'Este PDF de nota de corretagem está protegido por senha. Digite a senha:'
            : 'Senha incorreta. Tente novamente:'
        );
        if (userPass) {
          callback(userPass);
          return;
        }
      }
      callback(new Error('Abertura do PDF cancelada: nota protegida por senha.'));
    } catch {
      callback(new Error('Nota de corretagem protegida por senha.'));
    }
  };

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const allLines: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress?.(pageNum, numPages);
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    interface TextItemWithPos {
      text: string;
      x: number;
      y: number;
    }

    const items: TextItemWithPos[] = [];
    for (const item of textContent.items) {
      if ('str' in item && typeof item.str === 'string') {
        const str = item.str.trim();
        if (!str) continue;
        const x = item.transform ? item.transform[4] : 0;
        const y = item.transform ? item.transform[5] : 0;
        items.push({ text: item.str, x, y });
      }
    }

    // Agrupa itens cujo Y seja próximo (delta <= 4.5 unidades para acomodar alinhamento de tabela)
    const lineBuckets: { y: number; items: TextItemWithPos[] }[] = [];

    items.forEach(item => {
      const bucket = lineBuckets.find(b => Math.abs(b.y - item.y) <= 4.5);
      if (bucket) {
        bucket.items.push(item);
      } else {
        lineBuckets.push({ y: item.y, items: [item] });
      }
    });

    // Ordena de cima para baixo no documento
    lineBuckets.sort((a, b) => b.y - a.y);

    // Para cada linha, ordena da esquerda para a direita e junta com espaços
    for (const bucket of lineBuckets) {
      bucket.items.sort((a, b) => a.x - b.x);
      const lineText = bucket.items.map(it => it.text.trim()).filter(Boolean).join(' ');
      if (lineText.length > 0) {
        allLines.push(lineText);
      }
    }
  }

  const fullText = allLines.join('\n');
  return {
    fullText,
    pageCount: numPages,
    lines: allLines,
  };
}
