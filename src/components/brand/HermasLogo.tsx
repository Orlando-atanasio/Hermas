import React from 'react';

interface HermasLogoProps {
  className?: string;
  size?: number | string;
  variant?: 'on-blue' | 'official';
  showCard?: boolean;
}

/**
 * Logomarca Hermas:
 * 
 * - 'on-blue' (padrão no app): Desenhada especificamente para o distintivo azul real de demonstração
 *   (bg-gradient azul com o "H", as 3 barras de rentabilidade e o arco dinâmico em branco e ouro reluzente).
 *   Permanece 100% visível e vibrante tanto no modo Claro quanto no modo Escuro (Dark Mode).
 * 
 * - 'official': Versão original oficial (H em azul marinho #0B1C33, 3 barras em ouro e arco branco)
 *   utilizada no ícone de instalação do Android (APK) e PWA no dispositivo.
 */
export const HermasLogo: React.FC<HermasLogoProps> = ({
  className = 'w-full h-full',
  size,
  variant = 'on-blue',
  showCard = false,
}) => {
  const isBlueVariant = variant === 'on-blue';

  return (
    <svg 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={size ? undefined : className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Hermas Logomarca"
    >
      <defs>
        {/* Gradiente Dourado dos Gráficos de Rentabilidade */}
        <linearGradient id="hermasGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Gradiente Azul Marinho Corporativo Hermas (para a versão oficial do APK) */}
        <linearGradient id="hermasNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#102542" />
          <stop offset="100%" stopColor="#0B1C33" />
        </linearGradient>
      </defs>

      {/* Fundo do Cartão se solicitado explicitamente */}
      {showCard && (
        <rect width="200" height="200" rx="36" fill={isBlueVariant ? '#1D4ED8' : '#FFFFFF'} />
      )}

      {/* 1. Coluna Esquerda do H */}
      <path 
        d="M 40 35 
           L 72 35 
           L 72 108 
           C 64 118 56 129 48 141 
           L 40 141 
           Z" 
        fill={isBlueVariant ? '#FFFFFF' : 'url(#hermasNavyGrad)'} 
      />
      <path 
        d="M 40 141 
           L 48 141 
           C 54 150 60 159 66 165 
           L 40 165 
           Z" 
        fill={isBlueVariant ? '#FFFFFF' : 'url(#hermasNavyGrad)'} 
      />

      {/* 2. Três Barras de Rentabilidade Douradas (Gráfico Ascendente) */}
      {/* Barra 1 - Inicial (Menor) */}
      <rect x="79" y="88" width="13" height="42" rx="1.5" fill="url(#hermasGoldGrad)" />
      
      {/* Barra 2 - Intermediária */}
      <rect x="96" y="68" width="13" height="58" rx="1.5" fill="url(#hermasGoldGrad)" />
      
      {/* Barra 3 - Superior (Mais Alta) */}
      <rect x="113" y="48" width="13" height="74" rx="1.5" fill="url(#hermasGoldGrad)" />

      {/* 3. Coluna Direita do H */}
      <path 
        d="M 128 35 
           L 160 35 
           L 160 165 
           L 128 165 
           L 128 112 
           C 139 104 149 97 155 92 
           L 155 96 
           C 146 102 137 108 128 116 
           Z" 
        fill={isBlueVariant ? '#FFFFFF' : 'url(#hermasNavyGrad)'} 
      />

      {/* 4. Faixa / Arco Superior (Recorte dinâmico da marca que separa o arco das barras) */}
      <path 
        d="M 47 141 
           C 66 113 96 91 156 85 
           C 158 86 157 90 154 92 
           C 98 99 70 124 48 144 
           Z" 
        fill={isBlueVariant ? '#1E3A8A' : '#FFFFFF'} 
      />

      {/* 5. Arco Inferior conectando as bases do H */}
      <path 
        d="M 48 145 
           C 70 125 98 100 154 93 
           L 154 102 
           C 104 112 76 137 66 165 
           L 54 165 
           C 51 158 49 151 48 145 
           Z" 
        fill={isBlueVariant ? '#FFFFFF' : 'url(#hermasNavyGrad)'} 
      />
    </svg>
  );
};

/**
 * Distintivo/Ícone oficial no topo da aplicação:
 * Utiliza o acabamento azul real de demonstração (bg-gradient azul vibrante),
 * esculpindo o formato exato da logomarca (H + barras douradas + arco ascendente).
 * 
 * Não some no Dark Mode e se mantém com altíssimo contraste e elegância em qualquer tema.
 */
export const HermasLogoIcon: React.FC<{ 
  className?: string; 
  sizeClassName?: string;
  variant?: 'blue-badge' | 'official-white';
}> = ({ 
  className = '',
  sizeClassName = 'w-10 h-10',
  variant = 'blue-badge'
}) => {
  if (variant === 'official-white') {
    return (
      <div 
        className={`${sizeClassName} rounded-xl bg-white border border-slate-200/90 shadow-md flex items-center justify-center p-1.5 shrink-0 overflow-hidden ${className}`}
      >
        <HermasLogo variant="official" className="w-full h-full" />
      </div>
    );
  }

  return (
    <div 
      className={`${sizeClassName} rounded-xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 text-white shadow-md shadow-blue-500/25 flex items-center justify-center p-1.5 shrink-0 overflow-hidden ring-1 ring-white/20 transition-transform ${className}`}
    >
      <HermasLogo variant="on-blue" className="w-full h-full drop-shadow-xs" />
    </div>
  );
};
