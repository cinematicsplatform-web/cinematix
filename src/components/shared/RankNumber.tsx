import React from 'react';

export type RankNumberStyle = 'netflix' | 'neon' | 'gold3d' | 'modern';

interface RankNumberProps {
  rank: number;
  style?: RankNumberStyle;
}

/**
 * مكون أرقام التوب 10 بتصميمات مختلفة وعصرية جداً (Netflix, Neon, 3D Gold, Modern Solid)
 */
export const RankNumber: React.FC<RankNumberProps> = ({ rank, style = 'netflix' }) => {
  const rankStr = rank.toString();
  const isDoubleDigit = rank >= 10;
  const gradId = `rank-grad-${style}-${rank}`;
  const strokeGradId = `rank-stroke-grad-${style}-${rank}`;
  const glowId = `rank-glow-${style}-${rank}`;

  // تدرجات الألوان حسب المركز والستايل
  const getGradientStops = () => {
    if (style === 'neon') {
      if (rank === 1) return { stroke: ['#FFE066', '#FFB700', '#FF8800'], glow: '#FFB700' };
      if (rank === 2) return { stroke: ['#00F0FF', '#00A7F8', '#0055FF'], glow: '#00F0FF' };
      if (rank === 3) return { stroke: ['#FF007F', '#E040FB', '#7C4DFF'], glow: '#FF007F' };
      return { stroke: ['#00F2FE', '#4FACFE', '#00C6FF'], glow: '#00F2FE' };
    }

    if (style === 'gold3d') {
      if (rank === 1) return { fill: ['#FFF59D', '#FFD700', '#FFA000', '#FF6F00'], stroke: '#FFE082' };
      if (rank === 2) return { fill: ['#FFFFFF', '#E0E0E0', '#9E9E9E', '#616161'], stroke: '#F5F5F5' };
      if (rank === 3) return { fill: ['#FFE0B2', '#FFB74D', '#E65100', '#BF360C'], stroke: '#FFCC80' };
      return { fill: ['#ECEFF1', '#CFD8DC', '#78909C', '#37474F'], stroke: '#ECEFF1' };
    }

    if (style === 'modern') {
      if (rank === 1) return { fill: ['#FFD700', '#FFA000'], stroke: '#FFF59D' };
      if (rank === 2) return { fill: ['#F5F5F5', '#9E9E9E'], stroke: '#FFFFFF' };
      if (rank === 3) return { fill: ['#FFB74D', '#E65100'], stroke: '#FFE0B2' };
      return { fill: ['#00A7F8', '#0055FF'], stroke: '#80D8FF' };
    }

    // Default: 'netflix' (Classic 3D Hollow)
    if (rank === 1) return { stroke: ['#FFE57F', '#FFC107', '#FF8F00'] };
    if (rank === 2) return { stroke: ['#FFFFFF', '#CFD8DC', '#90A4AE'] };
    if (rank === 3) return { stroke: ['#FFCC80', '#FB8C00', '#E65100'] };
    return { stroke: ['#FFFFFF', '#B0BEC5', '#546E7A'] };
  };

  const colors = getGradientStops();

  // عرض الـ ViewBox والخط والمواضع
  const viewBox = isDoubleDigit ? "0 0 116 130" : "0 0 76 130";
  const fontFam = "'Impact', 'Arial Black', 'Montserrat', sans-serif";
  const xPos = isDoubleDigit ? "58" : "38";
  const yPos = "114";
  const fontSize = "124";
  const letterSpacing = isDoubleDigit ? "-8" : "-4";

  return (
    <div 
      className="absolute bottom-0 left-0 z-0 h-[92%] md:h-[96%] pointer-events-none select-none flex items-end translate-x-0"
    >
      <svg 
        className="h-full w-auto overflow-visible"
        viewBox={viewBox}
        style={{
          transform: 'scaleX(0.82) scaleY(1.02)',
          transformOrigin: 'bottom left',
          filter: style === 'neon' ? `drop-shadow(0 0 12px ${(colors as any).glow})` : 'drop-shadow(0 12px 24px rgba(0,0,0,0.95))'
        }}
      >
        <defs>
          {/* تدرج الـ Stroke المفرغ أو التعبئة */}
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            {(colors.fill || (Array.isArray(colors.stroke) ? colors.stroke : [colors.stroke || '#FFFFFF'])).map((col, idx, arr) => (
              <stop 
                key={idx} 
                offset={`${arr.length === 1 ? 100 : (idx / (arr.length - 1)) * 100}%`} 
                stopColor={col} 
              />
            ))}
          </linearGradient>

          {/* تدرج الإطار الخارجي للستايل المجسم */}
          {colors.stroke && Array.isArray(colors.stroke) && (
            <linearGradient id={strokeGradId} x1="0%" y1="0%" x2="0%" y2="100%">
              {colors.stroke.map((col, idx, arr) => (
                <stop 
                  key={idx} 
                  offset={`${(idx / (arr.length - 1)) * 100}%`} 
                  stopColor={col} 
                />
              ))}
            </linearGradient>
          )}
        </defs>

        {/* 1. طبقة الظل الخفية للعمق 3D Offset Shadow */}
        <text
          x={isDoubleDigit ? "62" : "42"}
          y="118"
          textAnchor="middle"
          fill="#000000"
          opacity="0.9"
          fontFamily={fontFam}
          fontWeight="900"
          fontSize={fontSize}
          letterSpacing={letterSpacing}
        >
          {rankStr}
        </text>

        {/* 2. طبقة الحجب لمنع شفافية البوستر الداخلي Dark Mask Fill */}
        <text
          x={xPos}
          y={yPos}
          textAnchor="middle"
          fill="#0B0E14"
          fontFamily={fontFam}
          fontWeight="900"
          fontSize={fontSize}
          letterSpacing={letterSpacing}
        >
          {rankStr}
        </text>

        {/* 3. التعبئة الرئيسية (إن وجدت للستايل الممتلئ) */}
        {(style === 'gold3d' || style === 'modern') && (
          <text
            x={xPos}
            y={yPos}
            textAnchor="middle"
            fill={`url(#${gradId})`}
            fontFamily={fontFam}
            fontWeight="900"
            fontSize={fontSize}
            letterSpacing={letterSpacing}
          >
            {rankStr}
          </text>
        )}

        {/* 4. الإطار الخارجي المفرغ الحاد (Stroke Line) */}
        <text
          x={xPos}
          y={yPos}
          textAnchor="middle"
          fill={style === 'netflix' || style === 'neon' ? 'none' : 'none'}
          stroke={
            Array.isArray(colors.stroke) 
              ? `url(#${strokeGradId || gradId})` 
              : (colors.stroke as string || `url(#${gradId})`)
          }
          strokeWidth={style === 'neon' ? "6" : style === 'netflix' ? "5.5" : "3.5"}
          strokeLinejoin="miter"
          fontFamily={fontFam}
          fontWeight="900"
          fontSize={fontSize}
          letterSpacing={letterSpacing}
        >
          {rankStr}
        </text>
      </svg>
    </div>
  );
};

export default RankNumber;
