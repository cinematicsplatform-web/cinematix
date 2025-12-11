
import React, { useState, useEffect } from 'react';
import { PlayIcon } from './icons/PlayIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CheckIcon } from './CheckIcon';

interface ActionButtonsProps {
  onWatch: () => void;
  onToggleMyList?: () => void;
  isInMyList?: boolean;
  isRamadanTheme?: boolean;
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
  isNetflixRedTheme?: boolean;
  showMyList?: boolean;
  className?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onWatch, 
  onToggleMyList, 
  isInMyList, 
  showMyList = true,
  isRamadanTheme,
  isEidTheme,
  isCosmicTealTheme,
  isNetflixRedTheme,
  className = ""
}) => {
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
      if (!isInMyList) {
          setShowFeedback(false);
      }
  }, [isInMyList]);

  const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onToggleMyList) {
          if (!isInMyList) {
              setShowFeedback(true);
              setTimeout(() => setShowFeedback(false), 2000);
          } else {
              setShowFeedback(false);
          }
          onToggleMyList();
      }
  };

  // Explicit styling for the primary button
  let primaryBtnClass = "btn-primary";
  if (isRamadanTheme) {
      primaryBtnClass = "bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:brightness-110 border-none";
  } else if (isEidTheme) {
      primaryBtnClass = "bg-gradient-to-r from-purple-800 to-purple-500 text-white shadow-[0_0_15px_rgba(106,13,173,0.4)] hover:brightness-110 border-none";
  } else if (isCosmicTealTheme) {
      primaryBtnClass = "bg-gradient-to-r from-[#35F18B] to-[#2596be] text-black shadow-[0_0_15px_rgba(53,241,139,0.4)] hover:brightness-110 border-none";
  } else if (isNetflixRedTheme) {
      primaryBtnClass = "bg-[#E50914] text-white hover:bg-[#b20710] border-none shadow-none";
  }

  // Standard "My List" Button Style
  let myListBaseClass = "bg-white/10 border border-white/30 text-white hover:bg-white/20 backdrop-blur-md";
  
  if (isNetflixRedTheme) {
      myListBaseClass = "bg-[rgba(109,109,110,0.7)] border-none text-white hover:bg-[rgba(109,109,110,0.4)] backdrop-blur-md";
  }
  
  const myListActiveClass = "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]";

  return (
    <div className={`w-full md:w-auto flex flex-row items-stretch gap-4 z-30 relative action-buttons-container ${className}`}>
      {/* Watch Button - Updated Style: Increased Size by ~15% */}
      <button 
        onClick={(e) => { e.stopPropagation(); onWatch?.(); }}
        className={`
          flex-grow md:flex-none
          min-w-fit
          flex items-center justify-center gap-3
          font-bold 
          py-4 px-9 md:py-5 md:px-12
          rounded-full
          text-lg md:text-xl
          transform transition-all duration-200
          active:scale-95
          whitespace-nowrap
          target-watch-btn
          ${primaryBtnClass}
        `}
      >
        <PlayIcon className="w-7 h-7 md:w-8 md:h-8 fill-current" />
        <span>شاهد الآن</span>
      </button>
      
      {/* My List Button - Updated Style: Increased Size by ~15% */}
      {showMyList && onToggleMyList && (
        <button 
          onClick={handleToggle}
          className={`
            flex-grow md:flex-none
            min-w-fit
            flex items-center justify-center gap-3
            font-bold
            py-4 px-9 md:py-5 md:px-12
            rounded-full
            text-lg md:text-xl
            transition-all duration-200 transform active:scale-95 whitespace-nowrap
            ${isInMyList 
              ? myListActiveClass 
              : myListBaseClass
            }
          `}
        >
          {isInMyList ? <CheckIcon className="w-7 h-7 md:w-8 md:h-8" /> : <PlusIcon className="w-7 h-7 md:w-8 md:h-8" />}
          <span>{showFeedback ? 'تمت الإضافة' : 'قائمتي'}</span>
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
