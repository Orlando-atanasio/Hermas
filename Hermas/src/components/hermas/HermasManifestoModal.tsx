import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  Copy, 
  Compass, 
  Layers, 
  BookOpen, 
  TrendingUp,
  Scale,
  Bell,
  BellOff,
  Coins,
  Feather,
  Info
} from 'lucide-react';
import { 
  HERMAS_INSTITUTIONAL_MANIFESTO, 
  HERMAS_COLOR_THEMES,
  HermasInsight,
  HermasCardColor,
  HermasIconType 
} from '../../engine/hermasInsights';

interface HermasManifestoModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificationsEnabled?: boolean;
  onToggleNotifications?: (enabled: boolean) => void;
  activeInsight?: HermasInsight | null;
}

export const HermasManifestoModal: React.FC<HermasManifestoModalProps> = ({
  isOpen,
  onClose,
  notificationsEnabled = true,
  onToggleNotifications,
  activeInsight,
}) => {
  const [copied, setCopied] = useState(false);
  const [notificationFeedback, setNotificationFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyManifesto = async () => {
    try {
      await navigator.clipboard.writeText(HERMAS_INSTITUTIONAL_MANIFESTO.apresentacaoOficial);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleToggle = (newState: boolean) => {
    if (onToggleNotifications) {
      onToggleNotifications(newState);
      if (newState) {
        setNotificationFeedback('✓ Notificações reativadas! Os balõezinhos coloridos voltarão a aparecer ao navegar pelas telas.');
      } else {
        setNotificationFeedback('✓ Notificações desativadas! Não exibiremos mais os balõezinhos. Para reativar depois, basta acessar a aba Configurações.');
      }
      setTimeout(() => setNotificationFeedback(null), 5000);
    }
  };

  // Helper para renderizar ícones temáticos
  const renderIcon = (type?: HermasIconType) => {
    const cls = "w-4 h-4";
    switch (type) {
      case 'trending-up': return <TrendingUp className={cls} />;
      case 'coins': return <Coins className={cls} />;
      case 'shield': return <ShieldCheck className={cls} />;
      case 'sparkles': return <Sparkles className={cls} />;
      case 'book': return <BookOpen className={cls} />;
      case 'feather': return <Feather className={cls} />;
      case 'scale': return <Scale className={cls} />;
      case 'compass':
      default: return <Compass className={cls} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-4">
        {/* Header Decorativo com Gradiente Clássico */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white overflow-hidden shrink-0">
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute right-12 bottom-0 opacity-10 text-white font-serif text-8xl select-none pointer-events-none">
            Ἑ
          </div>

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-blue-300 shadow-lg">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-[11px] font-mono font-semibold tracking-wider uppercase border border-blue-400/30">
                    Origem & Identidade
                  </span>
                  <span className="text-xs text-blue-200/80 font-mono">Ἑρμᾶς • Ἑρμῆς</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                  HERMAS — O Mensageiro da Realidade
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-4 text-xs sm:text-sm text-blue-100/90 max-w-xl font-light leading-relaxed">
            Inteligência • Controle • Transparência. Seus ativos. Seus números. A realidade do seu patrimônio comunicada com exatidão e sem ilusões.
          </p>
        </div>

        {/* Barra de Controle de Notificações Solicitada pelo Usuário */}
        <div className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80 px-6 py-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${notificationsEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Notificações de Insights:
              </span>
              <span className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                notificationsEnabled 
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' 
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {notificationsEnabled ? 'ATIVADAS (Cores Alternadas)' : 'DESATIVADAS'}
              </span>
            </div>

            {onToggleNotifications && (
              <div>
                {notificationsEnabled ? (
                  <button
                    type="button"
                    onClick={() => handleToggle(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                    title="Desativar os balõezinhos periódicos nas telas"
                  >
                    <BellOff className="w-3.5 h-3.5" />
                    <span>Desativar Notificações</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggle(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
                    title="Reativar os balõezinhos de insights coloridos nas telas"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Reativar Notificações</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Feedback de Confirmação quando o usuário clica */}
          {notificationFeedback && (
            <div className="mt-2.5 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2 animate-in fade-in">
              <Info className="w-4 h-4 shrink-0 text-blue-600" />
              <span>{notificationFeedback}</span>
            </div>
          )}
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
          {/* Se foi aberto através de um insight específico clicado pelo usuário */}
          {activeInsight && (
            <div className={`p-4 rounded-2xl border ${HERMAS_COLOR_THEMES[activeInsight.corTema].cardBg} ${HERMAS_COLOR_THEMES[activeInsight.corTema].cardBorder} space-y-2`}>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-bold border ${HERMAS_COLOR_THEMES[activeInsight.corTema].badge}`}>
                  Insight Clicado • {HERMAS_COLOR_THEMES[activeInsight.corTema].label}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {activeInsight.titulo}
                </span>
              </div>
              <p className="font-serif italic text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                &quot;{activeInsight.citacao}&quot;
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {activeInsight.detalhe}
              </p>
            </div>
          )}

          {/* 1. Origem Etimológica e Simbólica */}
          <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 space-y-2.5">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-sm">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3>1. O Significado por Trás do Nome</h3>
            </div>
            <p className="leading-relaxed text-slate-600 dark:text-slate-300">
              O nome grego <strong>Hermas (Ἑρμᾶς)</strong> é tradicionalmente relacionado a <strong>Hermes (Ἑρμῆς)</strong>, conhecido na cultura clássica como o mensageiro: aquele que transmite, interpreta e comunica as mensagens com fidelidade.
            </p>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-blue-200/60 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed">
              &quot;O Hermas não precisa ser entendido como aquele que toma decisões pelo investidor. Ele é aquele que transmite informações, revela resultados e comunica a situação real do patrimônio.&quot;
            </div>
          </div>

          {/* 2. A Analogia Funcional no Aplicativo com Cards Multicores (Azul, Verde, Amarelo, Roxo, Ciano) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>2. O que Hermas Comunica na Prática (Cores Canônicas do App)</span>
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" title="Azul (Ações / Hermas)" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Verde (FIIs / Lucro)" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" title="Amarelo (Renda Fixa / Atenção)" />
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500" title="Roxo (Histórico / Disciplina)" />
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" title="Ciano (Matemática / Precisão)" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {HERMAS_INSTITUTIONAL_MANIFESTO.analogiaFuncional.map((item, idx) => {
                const theme = HERMAS_COLOR_THEMES[item.corTema || 'blue'];
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all hover:scale-[1.01] ${theme.cardBg} ${theme.cardBorder} space-y-1.5`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-1.5 text-xs font-bold ${theme.accentText}`}>
                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center ${theme.iconBox}`}>
                          {renderIcon(item.iconeTipo)}
                        </div>
                        <span>{item.situacao}</span>
                      </div>
                      <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold border ${theme.badge}`}>
                        {theme.label.split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                      {item.comunicacao}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Identidade Conceitual da Marca */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>3. A Identidade Conceitual</span>
            </h3>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 w-1/3">Elemento</th>
                    <th className="py-2.5 px-4">Interpretação para o Investidor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {HERMAS_INSTITUTIONAL_MANIFESTO.identidadeConceitual.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {row.elemento}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                        {row.interpretacao}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Apresentação Oficial / Manifesto */}
          <div className="p-5 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Apresentação Oficial do Aplicativo</span>
              </div>
              <button
                onClick={handleCopyManifesto}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copiar Manifesto</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs leading-relaxed text-slate-300 italic whitespace-pre-line font-serif">
              {HERMAS_INSTITUTIONAL_MANIFESTO.apresentacaoOficial}
            </p>
          </div>
        </div>

        {/* Rodapé com Botão de Desativar/Reativar e Fechar */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Para gerenciar as notificações a qualquer momento, acesse <strong>Configurações</strong>.</span>
          </div>

          <div className="flex items-center gap-3">
            {onToggleNotifications && notificationsEnabled && (
              <button
                type="button"
                onClick={() => handleToggle(false)}
                className="px-3.5 py-2 rounded-xl text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition-colors cursor-pointer"
              >
                Não mostrar mais balõezinhos
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
