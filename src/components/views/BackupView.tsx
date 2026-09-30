import React, { useState } from 'react';
import { 
  HardDriveDownload, 
  UploadCloud, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  FileArchive, 
  RefreshCw, 
  Lock, 
  History,
  FileJson
} from 'lucide-react';
import JSZip from 'jszip';
import { HermasDB } from '../../storage/db';
import { sha256, deriveKeyFromPassword, encryptData, decryptData } from '../../engine/crypto';
import { AuditLog } from '../../types';

interface BackupViewProps {
  auditLogs: AuditLog[];
  onDataRestored: () => void;
}

export const BackupView: React.FC<BackupViewProps> = ({ auditLogs, onDataRestored }) => {
  const [includeDocuments, setIncludeDocuments] = useState(true);
  const [extraPassword, setExtraPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<{
    step: number;
    title: string;
    completed: boolean;
    error?: string;
  } | null>(null);

  const handleExportBackup = async (format: 'ZIP' | 'JSON') => {
    setIsExporting(true);
    try {
      const fullData = HermasDB.exportFullVaultData();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      if (format === 'JSON') {
        const jsonStr = JSON.stringify(fullData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hermas_vault_backup_${timestamp}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Formato .ZIP oficial com manifest.json + payload.json + keys.json
        const zip = new JSZip();
        zip.file('manifest.json', JSON.stringify(fullData.manifest, null, 2));

        let isEncrypted = false;
        if (extraPassword && extraPassword.trim()) {
          const saltHex = fullData.payload.settings.vaultSalt || '0123456789abcdef0123456789abcdef';
          const cryptoKey = await deriveKeyFromPassword(extraPassword.trim(), saltHex);
          const { cipherTextHex, ivHex } = await encryptData(JSON.stringify(fullData.payload), cryptoKey);
          
          zip.file('payload.encrypted.json', JSON.stringify({ cipherTextHex, ivHex, saltHex }, null, 2));
          isEncrypted = true;
        } else {
          zip.file('payload.json', JSON.stringify(fullData.payload, null, 2));
        }

        const keysInfo = {
          cryptoVersion: isEncrypted ? 'AES-256-GCM' : 'NONE',
          kdf: isEncrypted ? 'PBKDF2-SHA256' : 'NONE',
          salt: fullData.payload.settings.vaultSalt,
          isEncrypted,
          hasExtraPassword: isEncrypted,
          createdUtc: new Date().toISOString(),
        };
        zip.file('keys.json', JSON.stringify(keysInfo, null, 2));

        if (includeDocuments && fullData.payload.documents.length > 0) {
          const docFolder = zip.folder('documents');
          fullData.payload.documents.forEach(d => {
            if (d.rawText && docFolder) {
              docFolder.file(`${d.numeroNota}_${d.nomeArquivo}.txt`, d.rawText);
            }
          });
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        const filenamePrefix = isEncrypted ? 'hermas_vault_encrypted' : 'hermas_vault_package';
        a.download = `${filenamePrefix}_${timestamp}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      }

      HermasDB.logAudit('BACKUP_EXPORTADO', 'Backup', `Backup ${format} gerado e exportado com sucesso.`);
    } catch (err: any) {
      alert(`Erro ao gerar backup: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setRestoreStatus({ step: 1, title: 'Iniciando leitura do arquivo de backup', completed: false });

      if (file.name.endsWith('.zip')) {
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        const manifestFile = loadedZip.file('manifest.json');
        const payloadFile = loadedZip.file('payload.json');
        const encryptedPayloadFile = loadedZip.file('payload.encrypted.json');

        if (!manifestFile || (!payloadFile && !encryptedPayloadFile)) {
          throw new Error('Arquivo .zip não contém a estrutura canônica Hermas (manifest.json e payload.json).');
        }

        const manifestStr = await manifestFile.async('string');
        const manifest = JSON.parse(manifestStr);

        let payload: any;
        if (encryptedPayloadFile) {
          const pass = prompt('Este pacote de backup está criptografado com senha adicional. Digite a senha para descriptografar:');
          if (!pass) {
            throw new Error('Operação cancelada: a senha é necessária para descriptografar o backup.');
          }
          const encJsonStr = await encryptedPayloadFile.async('string');
          const encData = JSON.parse(encJsonStr);
          const cryptoKey = await deriveKeyFromPassword(pass.trim(), encData.saltHex);
          const decryptedJson = await decryptData(encData.cipherTextHex, encData.ivHex, cryptoKey);
          payload = JSON.parse(decryptedJson);
        } else if (payloadFile) {
          const payloadStr = await payloadFile.async('string');
          payload = JSON.parse(payloadStr);
        }

        const result = await HermasDB.restoreVaultData({ manifest, payload }, (step, title) => {
          setRestoreStatus({ step, title, completed: false });
        });

        if (result.success) {
          setRestoreStatus({ step: 11, title: 'Restauração de 11 passos concluída com sucesso!', completed: true });
          onDataRestored();
        } else {
          setRestoreStatus({ step: 0, title: 'Falha na validação', completed: false, error: result.message });
        }
      } else {
        // Arquivo JSON
        const reader = new FileReader();
        reader.onload = async event => {
          try {
            const rawJson = event.target?.result as string;
            const data = JSON.parse(rawJson);

            const result = await HermasDB.restoreVaultData(data, (step, title) => {
              setRestoreStatus({ step, title, completed: false });
            });

            if (result.success) {
              setRestoreStatus({ step: 11, title: 'Restauração de 11 passos concluída com sucesso!', completed: true });
              onDataRestored();
            } else {
              setRestoreStatus({ step: 0, title: 'Falha na validação', completed: false, error: result.message });
            }
          } catch (err: any) {
            setRestoreStatus({ step: 0, title: 'JSON Inválido', completed: false, error: err.message });
          }
        };
        reader.readAsText(file);
      }
    } catch (err: any) {
      setRestoreStatus({ step: 0, title: 'Erro de leitura', completed: false, error: err.message });
    } finally {
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const stepsList = [
    '1. Validação do formato e manifesto do arquivo',
    '2. Validação da versão de esquema (SchemaVersion)',
    '3. Verificação de integridade de dados e tipos',
    '4. Criação do ponto de restauração local de segurança',
    '5. Validação da tabela de ativos e identificadores',
    '6. Validação das operações e datas contábeis',
    '7. Execução de desduplicação e conferência canônica',
    '8. Gravação atômica nos repositórios locais',
    '9. Recálculo determinístico do motor de patrimônio',
    '10. Registro do log de auditoria e integridade',
    '11. Restauração concluída com sucesso absoluto',
  ];

  return (
    <div className="space-y-6">
      {/* Cards de Exportação e Importação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exportar Backup */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <HardDriveDownload className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Exportar Backup do Cofre
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gere um pacote seguro contendo todas as operações, ativos, notas, metadados e configurações locais.
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDocuments}
                  onChange={e => setIncludeDocuments(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Incluir comprovantes e notas de texto extraídas</span>
              </label>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Senha Adicional de Proteção do Arquivo (Opcional):
                </label>
                <input
                  type="password"
                  value={extraPassword}
                  onChange={e => setExtraPassword(e.target.value)}
                  placeholder="Deixe em branco para usar chave padrão"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <button
              onClick={() => handleExportBackup('ZIP')}
              disabled={isExporting}
              className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileArchive className="w-4 h-4" />
              <span>Exportar Pacote .ZIP</span>
            </button>
            <button
              onClick={() => handleExportBackup('JSON')}
              disabled={isExporting}
              className="py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileJson className="w-4 h-4 text-amber-500" />
              <span>.JSON Plano</span>
            </button>
          </div>
        </div>

        {/* Restaurar Backup com 11 Passos */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <UploadCloud className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Restauração Segura em 11 Passos
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Restaure um backup prévio com verificação automática de integridade, versão do esquema e recálculo total.
            </p>

            <div className="mt-4">
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40 text-center cursor-pointer transition-colors">
                <FileArchive className="w-8 h-8 text-blue-500 mb-2" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Selecionar Arquivo de Backup (.zip ou .json)
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  Executará os 11 passos de conferência determinística
                </span>
                <input
                  type="file"
                  accept=".zip,.json"
                  onChange={handleFileRestore}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Status dos 11 Passos */}
          {restoreStatus && (
            <div className={`p-4 rounded-xl text-xs space-y-2 ${
              restoreStatus.error 
                ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300'
                : restoreStatus.completed 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300'
                : 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 text-blue-800 dark:text-blue-300'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {restoreStatus.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : restoreStatus.error ? (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                ) : (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                )}
                <span>Passo {restoreStatus.step} de 11: {restoreStatus.title}</span>
              </div>
              {restoreStatus.error && (
                <p className="text-[11px]">{restoreStatus.error}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Checklist Oficial dos 11 Passos da Especificação */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Protocolo de Restauração Determinística (11 Invariantes)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
          {stepsList.map((step, idx) => (
            <div key={idx} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                {idx + 1}
              </span>
              <span className="text-slate-700 dark:text-slate-300 text-[11px] leading-tight">
                {step.substring(3)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Trilha de Auditoria Recente */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          <span>Trilha de Auditoria do Cofre ({auditLogs.length} eventos registrados)</span>
        </h3>

        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="pb-2">Momento (UTC)</th>
                <th className="pb-2">Ação</th>
                <th className="pb-2">Entidade</th>
                <th className="pb-2">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.slice(0, 20).map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2 font-mono text-[11px] text-slate-500">{log.timestamp.slice(0, 19).replace('T', ' ')}</td>
                  <td className="py-2 font-bold font-mono text-blue-600 dark:text-blue-400">{log.acao}</td>
                  <td className="py-2 text-slate-600 dark:text-slate-400">{log.entidade}</td>
                  <td className="py-2 text-slate-800 dark:text-slate-200">{log.detalhes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
