import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info, X, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';

export interface AlertExplainerContent {
  titulo: string;
  oQueE: string;
  porQueGerou: string;
  oQueFazer: string[];
  fundamentoLegal?: string;
  dicaExtra?: string;
}

interface AlertExplainerPopoverProps {
  content: AlertExplainerContent;
  triggerText?: string;
  badgeClassName?: string;
  variant?: 'amber' | 'blue' | 'slate';
}

export const AlertExplainerPopover: React.FC<AlertExplainerPopoverProps> = ({
  content,
  triggerText = 'Entenda este alerta',
  badgeClassName = '',
  variant = 'amber',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const variantStyles = {
    amber: {
      btn: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700/60 hover:bg-amber-200 dark:hover:bg-amber-900',
      popover: 'border-amber-300 dark:border-amber-800 shadow-amber-500/10',
      badge: 'bg-amber-500 text-white',
    },
    blue: {
      btn: 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700/60 hover:bg-blue-200 dark:hover:bg-blue-900',
      popover: 'border-blue-300 dark:border-blue-800 shadow-blue-500/10',
      badge: 'bg-blue-600 text-white',
    },
    slate: {
      btn: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700',
      popover: 'border-slate-300 dark:border-slate-700 shadow-slate-500/10',
      badge: 'bg-slate-700 text-white',
    },
  }[variant];

  return (
    <div 
      className="relative inline-block" 
      ref={containerRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Botão de disparo com suporte a toque no celular e hover no PC */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer select-none active:scale-95 ${variantStyles.btn} ${badgeClassName}`}
        aria-label="Abrir explicação do alerta"
        title="Clique para entender o que é este alerta"
      >
        <HelpCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{triggerText}</span>
      </button>

      {/* Popover / Caixinha Explicativa */}
      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 z-50 rounded-2xl bg-white dark:bg-slate-900 border shadow-2xl p-4 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150 ${variantStyles.popover}`}
          style={{ maxWidth: 'calc(100vw - 32px)' }}
        >
          {/* Cabeçalho */}
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${variantStyles.badge} shrink-0`}>
                <Info className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-tight">
                {content.titulo}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* O que é isso? */}
          <div className="space-y-1">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              📌 O que significa isso?
            </span>
            <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
              {content.oQueE}
            </p>
          </div>

          {/* Por que aconteceu? */}
          <div className="space-y-1">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              🔍 Por que este alerta foi gerado?
            </span>
            <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              {content.porQueGerou}
            </p>
          </div>

          {/* O que você deve fazer? */}
          {content.oQueFazer.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                💡 O que você deve fazer:
              </span>
              <ul className="space-y-1 pl-1 text-[11px] text-slate-700 dark:text-slate-300">
                {content.oQueFazer.map((passo, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{passo}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dica Extra / Atenção se houver */}
          {content.dicaExtra && (
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-[11px] flex items-start gap-1.5 leading-snug">
              <span className="font-bold shrink-0">⚠️ Dica:</span>
              <span>{content.dicaExtra}</span>
            </div>
          )}

          {/* Fundamento Legal */}
          {content.fundamentoLegal && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{content.fundamentoLegal}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
