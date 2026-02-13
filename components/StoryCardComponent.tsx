import React, { useId } from 'react';
import { StoryCard } from '../types';

interface StoryCardProps {
  card: StoryCard;
  innerRef?: React.Ref<HTMLDivElement>;
}

const StoryCardComponent: React.FC<StoryCardProps> = ({ card, innerRef }) => {
  const rawId = useId(); 
  const uniqueId = rawId ? rawId.replace(/[^a-zA-Z0-9]/g, '') : Math.random().toString(36).slice(2);
  const noiseFilterId = `noise-filter-${uniqueId}`;

  const alignmentClass = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end'
  }[card.alignment];

  const bgClass = card.bgGradient.includes('from-') 
    ? `bg-gradient-to-br ${card.bgGradient}` 
    : card.bgGradient;

  // Determine if the card is "Light Mode" (Pastel/Soft) based on text color
  // Dark text (#1e293b) implies Light Background
  const isLightMode = card.textColor === '#1e293b' || card.textColor === '#000000' || !card.textColor.startsWith('#f');

  // Dynamic Font Sizing Logic
  // Prevents text from hitting the edges (Safety Zone)
  const getDynamicFontSize = (textLength: number) => {
    if (textLength < 40) return 'text-[34px] leading-[1.2]';
    if (textLength < 80) return 'text-[28px] leading-[1.3]';
    if (textLength < 140) return 'text-[22px] leading-[1.4]';
    if (textLength < 220) return 'text-[18px] leading-[1.5]';
    return 'text-[15px] leading-[1.5]';
  };

  const fontSizeClass = getDynamicFontSize(card.text.length);

  // Render logic for "Tebal Tipis" variation
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const cleanPart = part.slice(2, -2);
        return (
          <span key={index} className="relative inline-block px-1 mx-0.5 z-10 font-extrabold tracking-tight">
            <span 
              className="absolute inset-0 -skew-x-3 rounded-sm opacity-60 -z-10" 
              style={{ backgroundColor: card.highlightColor }}
            ></span>
            {cleanPart}
          </span>
        );
      }
      // Standard text is lighter/thinner
      return <span key={index} className="font-light opacity-90">{part}</span>;
    });
  };

  return (
    <div 
      ref={innerRef}
      className={`relative w-[360px] h-[640px] ${bgClass} flex flex-col justify-center p-10 overflow-hidden shadow-2xl rounded-sm transition-colors duration-500`}
      style={{ 
        color: card.textColor,
        fontFamily: "'Plus Jakarta Sans', sans-serif" 
      }}
    >
      {/* 1. TEXTURE LAYER (Noise/Grain) */}
      <div className={`absolute inset-0 z-0 pointer-events-none mix-blend-overlay ${isLightMode ? 'opacity-[0.05]' : 'opacity-[0.10]'}`}>
        <svg width="100%" height="100%">
          <defs>
            <filter id={noiseFilterId}>
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </defs>
          <rect width="100%" height="100%" filter={`url(#${noiseFilterId})`} />
        </svg>
      </div>

      {/* 2. ACCENT BLOBS */}
      <div 
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-[90px] pointer-events-none"
        style={{ backgroundColor: card.accentColor, opacity: isLightMode ? 0.4 : 0.3 }}
      ></div>
      <div 
        className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none"
        style={{ backgroundColor: card.accentColor, opacity: isLightMode ? 0.35 : 0.25 }}
      ></div>

      {/* 3. TRANSPARENT EMOJIS */}
      {card.emojis && card.emojis.length > 0 && (
        <>
          <div className={`absolute top-24 right-8 text-[80px] rotate-12 pointer-events-none select-none grayscale-[0.2] ${isLightMode ? 'opacity-[0.08]' : 'opacity-[0.06]'}`}>
            {card.emojis[0]}
          </div>
          <div className={`absolute bottom-40 left-8 text-[60px] -rotate-12 pointer-events-none select-none grayscale-[0.2] ${isLightMode ? 'opacity-[0.07]' : 'opacity-[0.05]'}`}>
            {card.emojis[1] || card.emojis[0]}
          </div>
        </>
      )}

      {/* 4. VIGNETTE LAYER */}
      <div className={`absolute inset-0 z-0 pointer-events-none bg-radial-gradient-vignette ${isLightMode ? 'opacity-0' : 'opacity-40'}`}></div>

      {/* 5. MAIN CONTENT */}
      {/* Added break-words to ensure long words don't overflow horizontally */}
      <div className={`relative z-10 flex flex-col justify-center ${alignmentClass} w-full h-full break-words`}>
        <h1 
          className={`${fontSizeClass} tracking-tight w-full`}
          style={{ textShadow: !isLightMode ? '0 4px 30px rgba(0,0,0,0.3)' : 'none' }}
        >
          {renderFormattedText(card.text)}
        </h1>
      </div>

      {/* 6. MINIMALIST FOOTER BRANDING */}
      <div className="absolute bottom-10 left-10 z-10 pointer-events-none">
        <span className={`text-[11px] font-bold tracking-[0.15em] lowercase ${isLightMode ? 'opacity-40' : 'opacity-50'}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          gusdiuma
        </span>
      </div>
      
      <style>{`
        .bg-radial-gradient-vignette {
          background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%);
        }
      `}</style>
    </div>
  );
};

export default StoryCardComponent;