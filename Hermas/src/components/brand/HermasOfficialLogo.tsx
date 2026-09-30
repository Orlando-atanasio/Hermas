import React from 'react';

interface HermasOfficialLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'vertical' | 'horizontal';
}

/**
 * Logomarca Oficial Hermas baseada na identidade visual corporativa:
 * - Emblema 'H' em azul marinho profundo (#0B1C33) com 4 barras douradas ascendentes de rentabilidade
 * - Arco dinâmico de crescimento cruzando as bases
 * - Tipografia 'HERMAS' com kerning expandido
 * - Slogan oficial: 'CLAREZA • CONTROLE • TRANSPARÊNCIA'
 */
export const HermasOfficialLogo: React.FC<HermasOfficialLogoProps> = ({
  className = '',
  size = 'md',
  layout = 'vertical',
}) => {
  // Dimensões do Símbolo H de acordo com o tamanho
  const iconDimensions = {
    sm: { width: 44, height: 44, textHermas: 'text-base', textSlogan: 'text-[7.5px]' },
    md: { width: 56, height: 56, textHermas: 'text-lg', textSlogan: 'text-[8.5px]' },
    lg: { width: 72, height: 72, textHermas: 'text-xl', textSlogan: 'text-[10px]' },
  }[size];

  const iconSvg = (
    <svg 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: iconDimensions.width, height: iconDimensions.height }}
      className="shrink-0"
      aria-label="Hermas Emblema"
    >
      <defs>
        {/* Gradiente Dourado Nobre das 4 Barras de Rentabilidade */}
        <linearGradient id="hermasOfficialGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="40%" stopColor="#EAB308" />
          <stop offset="80%" stopColor="#CA8A04" />
          <stop offset="100%" stopColor="#A16207" />
        </linearGradient>

        {/* Gradiente Azul Marinho Profundo */}
        <linearGradient id="hermasOfficialNavy" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#172554" />
          <stop offset="60%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#0B132B" />
        </linearGradient>
      </defs>

      {/* 1. Coluna Esquerda do H */}
      <path 
        d="M 42 35 
           L 72 35 
           L 72 108 
           C 64 118 56 129 48 141 
           L 42 141 
           Z" 
        fill="url(#hermasOfficialNavy)" 
      />
      <path 
        d="M 42 141 
           L 48 141 
           C 54 150 60 159 66 165 
           L 42 165 
           Z" 
        fill="url(#hermasOfficialNavy)" 
      />

      {/* 2. Quatro Barras Ascendentes de Rentabilidade (Gráfico em Ouro) */}
      <rect x="76" y="98" width="9.5" height="32" rx="1.5" fill="url(#hermasOfficialGold)" />
      <rect x="88.5" y="82" width="9.5" height="48" rx="1.5" fill="url(#hermasOfficialGold)" />
      <rect x="101" y="66" width="9.5" height="64" rx="1.5" fill="url(#hermasOfficialGold)" />
      <rect x="113.5" y="50" width="9.5" height="80" rx="1.5" fill="url(#hermasOfficialGold)" />

      {/* 3. Coluna Direita do H */}
      <path 
        d="M 126 35 
           L 156 35 
           L 156 165 
           L 126 165 
           L 126 112 
           C 137 104 147 97 153 92 
           L 153 96 
           C 144 102 135 108 126 116 
           Z" 
        fill="url(#hermasOfficialNavy)" 
      />

      {/* 4. Faixa / Recorte Curvo Branco Superior */}
      <path 
        d="M 48 141 
           C 67 113 97 91 154 85 
           C 156 86 155 90 152 92 
           C 97 99 71 124 49 144 
           Z" 
        fill="#FFFFFF" 
      />

      {/* 5. Arco Inferior Azul Marinho conectando as bases */}
      <path 
        d="M 49 145 
           C 71 125 99 100 152 93 
           L 152 102 
           C 103 112 77 137 67 165 
           L 55 165 
           C 52 158 50 151 49 145 
           Z" 
        fill="url(#hermasOfficialNavy)" 
      />
    </svg>
  );

  // Layout Vertical (Exatamente como na imagem enviada pelo usuário)
  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        {/* Símbolo H */}
        <div className="flex items-center justify-center">
          {iconSvg}
        </div>

        {/* Nome HERMAS */}
        <span 
          className={`${iconDimensions.textHermas} font-extrabold tracking-[0.24em] text-[#0F172A] dark:text-white print:text-[#0F172A] leading-tight mt-1`}
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          HERMAS
        </span>

        {/* Slogan Oficial */}
        <span 
          className={`${iconDimensions.textSlogan} font-bold tracking-[0.16em] text-slate-500 dark:text-slate-400 print:text-slate-500 uppercase mt-0.5 whitespace-nowrap`}
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          CLAREZA • CONTROLE • TRANSPARÊNCIA
        </span>
      </div>
    );
  }

  // Layout Horizontal (Símbolo ao lado com texto estilizado)
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {iconSvg}
      <div className="flex flex-col">
        <span 
          className={`${iconDimensions.textHermas} font-extrabold tracking-[0.24em] text-[#0F172A] dark:text-white print:text-[#0F172A] leading-tight`}
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          HERMAS
        </span>
        <span 
          className={`${iconDimensions.textSlogan} font-bold tracking-[0.16em] text-slate-500 dark:text-slate-400 print:text-slate-500 uppercase mt-0.5 whitespace-nowrap`}
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          CLAREZA • CONTROLE • TRANSPARÊNCIA
        </span>
      </div>
    </div>
  );
};
