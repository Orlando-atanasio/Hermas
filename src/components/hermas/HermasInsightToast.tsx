import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  X, 
  Sparkles, 
  ChevronRight,
  TrendingUp,
  Coins,
  ShieldCheck,
  BookOpen,
  Feather,
  Scale,
  BellOff
} from 'lucide-react';
import { 
  HERMAS_INSIGHTS_BY_TAB, 
  HERMAS_COLOR_THEMES, 
  HermasInsight,
  HermasIconType
} from '../../engine/hermasInsights';

interface HermasInsightToastProps {
  currentTab: string;
  isEnabled?: boolean;
  onOpenManifesto: (insight?: HermasInsight) => void;
  onDisableNotifications?: () => void;
}

const TOAST_DURATION_MS = 8500; // Tempo em milissegundos que o balãozinho fica visível

export const HermasInsightToast: React.FC<HermasInsightToastProps> = ({
  currentTab,
  isEnabled = true,
  onOpenManifesto,
  onDisableNotifications,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentInsight, setCurrentInsight] = useState<HermasInsight | null>(null);
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);

  const tabIndexMap = useRef<Record<string, number>>({});
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const periodicTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Função para exibir um novo insight com rotação de cores e temas
  const showNextInsight = (tab: string) => {
    const list = HERMAS_INSIGHTS_BY_TAB[tab] || HERMAS_INSIGHTS_BY_TAB['visao-geral'];
    if (!list || list.length === 0) return;

    const currentIdx = tabIndexMap.current[tab] || 0;
    const insight = list[currentIdx % list.length];
    tabIndexMap.current[tab] = currentIdx + 1;

    setCurrentInsight(insight);
    setProgress(100);
    setIsVisible(true);
  };

  // Disparar balãozinho suavemente quando o usuário troca de aba
  useEffect(() => {
    if (!isEnabled) {
      setIsVisible(false);
      return;
    }

    // Limpar timers anteriores
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (periodicTimerRef.current) clearInterval(periodicTimerRef.current);

    setIsVisible(false);

    // Aguardar 1.5s após entrar na tela para não concorrer com a renderização inicial
    const initialDelay = setTimeout(() => {
      showNextInsight(currentTab);
    }, 1500);

    // Agendar novo balãozinho a cada 90 segundos caso o usuário permaneça na mesma tela
    periodicTimerRef.current = setInterval(() => {
      if (!isHovered) {
        showNextInsight(currentTab);
      }
    }, 90000);

    return () => {
      clearTimeout(initialDelay);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (periodicTimerRef.current) clearInterval(periodicTimerRef.current);
    };
  }, [currentTab, isEnabled]);

  // Controle de contagem regressiva e auto-fechamento do balãozinho
  useEffect(() => {
    if (!isVisible || isHovered) return;

    const stepMs = 50;
    const totalSteps = TOAST_DURATION_MS / stepMs;
    const decrement = 100 / totalSteps;

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          setIsVisible(false);
          return 0;
        }
        return Math.max(0, prev - decrement);
      });
    }, stepMs);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isVisible, isHovered]);

  if (!isEnabled || !currentInsight) return null;

  const theme = HERMAS_COLOR_THEMES[currentInsight.corTema] || HERMAS_COLOR_THEMES.blue;

  // Renderizar o ícone correspondente à cor/temática do card
  const renderInsightIcon = (type?: HermasIconType) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'trending-up':
        return <TrendingUp className={iconClass} />;
      case 'coins':
        return <Coins className={iconClass} />;
      case 'shield':
        return <ShieldCheck className={iconClass} />;
      case 'sparkles':
        return <Sparkles className={iconClass} />;
      case 'book':
        return <BookOpen className={iconClass} />;
      case 'feather':
        return <Feather className={iconClass} />;
      case 'scale':
        return <Scale className={iconClass} />;
      case 'compass':
      default:
        return <Compass className={iconClass} />;
    }
  };

  return (
    <div
      className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] transition-all duration-400 ease-out print:hidden ${
        isVisible
          ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto'
          : 'translate-y-6 opacity-0 scale-95 pointer-events-none'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        onClick={() => onOpenManifesto(currentInsight)}
        className={`group relative overflow-hidden rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 p-4 shadow-xl hover:shadow-2xl transition-all cursor-pointer select-none ${theme.borderAccent} ${theme.glow}`}
      >
        {/* Barra de progresso com a cor específica deste card (Azul, Verde, Amarelo, Roxo, Ciano) */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full ${theme.progressBar} transition-all duration-75 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Letra grega translúcida de fundo */}
        <div className="absolute -right-2 -bottom-4 text-slate-900/5 dark:text-white/5 font-serif text-6xl pointer-events-none select-none">
          Ἑ
        </div>

        <div className="flex items-start gap-3 relative z-10">
          {/* Ícone com cor do card e pulso sutil */}
          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs group-hover:scale-105 transition-transform ${theme.iconBox}`}>
            {renderInsightIcon(currentInsight.iconeTipo)}
          </div>

          {/* Conteúdo do Balãozinho */}
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${theme.badge}`}>
                Hermas • {theme.label.split(' ')[0]}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">•</span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {currentInsight.titulo}
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
              &quot;{currentInsight.citacao}&quot;
            </p>

            <div className={`mt-2 flex items-center gap-1 text-[11px] font-semibold ${theme.link} group-hover:translate-x-0.5 transition-transform`}>
              <span>Clique para ler a história e o significado</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Botão de Fechar discreto */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
          title="Fechar balãozinho"
          className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
