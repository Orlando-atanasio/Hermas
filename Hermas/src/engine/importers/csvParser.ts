/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CsvDelimiter = ';' | ',';

export function exportCsvBlob(headers: string[], rows: (string | number)[][], delimiter: CsvDelimiter = ';'): Blob {
  const escapeCell = (val: string | number): string => {
    const s = String(val ?? '');
    if (s.includes(delimiter) || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const headerLine = headers.map(escapeCell).join(delimiter);
  const dataLines = rows.map(r => r.map(escapeCell).join(delimiter));
  const fullContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');

  return new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
}
