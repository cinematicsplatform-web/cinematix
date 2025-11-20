
import React, { useState, useEffect } from 'react';
import { PlayIcon } from './icons/PlayIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CheckIcon } from './CheckIcon';

interface ActionButtonsProps {
  onWatch: () => void;
  onToggleMyList?: () => void;
  isInMyList?: boolean;
  isRamadanTheme?: boolean;
  showMyList?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onWatch, 
  onToggleMyList, 
  isInMyList, 
  showMyList = true,
  isRamadanTheme
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

  // Explicit styling for the primary button to override global class if needed
  const primaryBtnClass = isRamadanTheme
      ? "bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:brightness-110 border-none"
      : "btn-primary";

  return (
    <div className="w-full sm:w-auto flex flex-row items-stretch gap-3 mt-2 md:mt-6 z-30 relative action-buttons-container">
      {/* Watch Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onWatch(); }}
        className={`
          flex-grow sm:flex-none
          min-w-fit
          flex items-center justify-center gap-2 
          font-bold tracking-wide
          py-3.5 px-6 sm:px-8 sm:py-4 
          rounded-full 
          text-base sm:text-lg
          transform hover:scale-105 active:scale-95 
          whitespace-nowrap
          ${primaryBtnClass}
        `}
      >
        <PlayIcon className="w-5 h-5 md:w-6 md:h-6 fill-current" />
        <span>شاهد الآن</span>
      </button>
      
      {/* My List Button */}
      {showMyList && onToggleMyList && (
        <button 
          onClick={handleToggle}
          className={`
            flex-grow sm:flex-none
            min-w-fit
            flex items-center justify-center gap-2 
            font-bold tracking-wide
            py-3.5 px-6 sm:px-8 sm:py-4 
            rounded-full 
            text-sm sm:text-lg
            transition-all duration-300 transform hover:scale-105 active:scale-95 border whitespace-nowrap
            ${isInMyList 
              ? (isRamadanTheme 
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black border-transparent shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                    : 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]')
              : (isRamadanTheme 
                    ? 'bg-black/40 border-amber-500/50 text-white hover:bg-amber-500/20 backdrop-blur-md' 
                    : 'bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-md')
            }
          `}
        >
          {isInMyList ? <CheckIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
          <span>{showFeedback ? 'تمت الإضافة' : 'قائمتي'}</span>
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
