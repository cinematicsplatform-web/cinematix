import React, { useState, useEffect } from 'react';
import { PlayIcon } from './icons/PlayIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CheckIcon } from './CheckIcon';
import type { Content } from '@/types';

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
  content?: Content; // Added to generate URL
}

const CalendarIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="w-5 h-5 md:w-8 md:h-8 ml-2 inline-block text-black" 
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onWatch, 
  onToggleMyList, 
  isInMyList, 
  showMyList = true,
  isRamadanTheme,
  isEidTheme,
  isCosmicTealTheme,
  isNetflixRedTheme,
  className = "",
  content
}) => {
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
      if (!isInMyList) {
          setShowFeedback(false);
      }
  }, [isInMyList]);

  const handleToggle = (e: React.MouseEvent) => {
      e.preventDefault();
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

  const isSoon = content?.categories?.includes('قريباً');

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

  // URL Generation for SEO
  let watchUrl = "#";
  if (content) {
      const slug = content.slug || content.id;
      watchUrl = content.type === 'movie' ? `/watch/movie/${slug}` : `/series/${slug}`;
  }

  return (
    <div className={`w-full md:w-auto flex flex-row items-stretch gap-3 md:gap-4 z-30 relative action-buttons-container ${className}`}>
      {/* Watch Button - Optimized as 'a' tag for SEO */}
      <a 
        href={watchUrl}
        aria-label={content ? `شاهد ${content.title}` : "شاهد الآن"}
        onClick={(e) => { 
          e.preventDefault(); 
          e.stopPropagation(); 
          onWatch?.(); 
        }}
        className={`
          flex-1 md:flex-none
          flex items-center justify-center gap-2 md:gap-3
          font-bold 
          py-3 px-4 md:py-5 md:px-12
          rounded-full
          text-base md:text-xl
          transform transition-all duration-200
          active:scale-95
          no-underline
          whitespace-nowrap
          target-watch-btn
          shrink
          max-w-full
          ${primaryBtnClass}
        `}
      >
        {isSoon ? <CalendarIcon /> : <PlayIcon className="w-5 h-5 md:w-8 md:h-8 fill-current" />}
        <span className={isSoon ? 'text-black' : ''}>{isSoon ? 'قريباً' : 'شاهد الآن'}</span>
      </a>
      
      {/* My List Button - Optimized for Mobile */}
      {showMyList && onToggleMyList && (
        <button 
          onClick={handleToggle}
          className={`
            flex-1 md:flex-none
            flex items-center justify-center gap-2 md:gap-3
            font-bold
            py-3 px-4 md:py-5 md:px-12
            rounded-full
            text-base md:text-xl
            transition-all duration-200 transform active:scale-95 whitespace-nowrap
            shrink
            max-w-full
            ${isInMyList 
              ? myListActiveClass 
              : myListBaseClass
            }
          `}
        >
          {isInMyList ? <CheckIcon className="w-5 h-5 md:w-8 md:h-8" /> : <PlusIcon className="w-5 h-5 md:w-8 md:h-8" />}
          <span>{showFeedback ? 'تمت الإضافة' : 'قائمتي'}</span>
        </button>
      )}
    </div>
  );
};

export default ActionButtons;