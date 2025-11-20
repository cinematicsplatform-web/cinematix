
import React from 'react';

interface ShoutBarProps {
    text: string;
    isRamadanTheme?: boolean;
}

const ShoutBar: React.FC<ShoutBarProps> = ({ text, isRamadanTheme }) => {
  const gradientClass = isRamadanTheme 
    ? 'bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] shadow-[0_0_15px_rgba(212,175,55,0.4)]' // Gold gradient
    : 'bg-gradient-to-r from-[#00A7F8] to-[#00FFB0]'; // Default gradient

  return (
    <div 
        className={`${gradientClass} text-black font-bold h-10 flex items-center overflow-hidden mb-8 rounded-lg transition-all duration-500`}
    >
      <div className="shout-bar-content whitespace-nowrap">
        <span className="px-8">{text}</span>
        <span className="px-8">{text}</span>
      </div>
    </div>
  );
};

// Inject styles into the document head only once
if (!document.getElementById('shoutbar-styles')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'shoutbar-styles';
    styleSheet.innerText = `
    .shout-bar-content {
      display: inline-block;
      animation: marquee 30s linear infinite;
    }

    @keyframes marquee {
      0% {
        transform: translateX(0%);
      }
      100% {
        transform: translateX(-50%);
      }
    }
    `;
    document.head.appendChild(styleSheet);
}

export default ShoutBar;
