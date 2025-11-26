
import React from 'react';
import type { Content } from '../types';
import { PlayIcon } from './icons/PlayIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CheckIcon } from './CheckIcon';

interface ContentCardProps {
  content: Content;
  onSelectContent: (content: Content) => void;
  isLoggedIn: boolean;
  myList?: string[];
  onToggleMyList: (contentId: string) => void;
  showLatestBadge?: boolean;
  isGridItem?: boolean;
  rank?: number; // New prop for Top 10 ranking
  isRamadanTheme?: boolean; // New Prop for theming buttons
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
  isNetflixRedTheme?: boolean;
}

const ContentCard: React.FC<ContentCardProps> = ({ content, onSelectContent, isLoggedIn, myList, onToggleMyList, showLatestBadge, isGridItem, rank, isRamadanTheme, isEidTheme, isCosmicTealTheme, isNetflixRedTheme }) => {
  const isInMyList = !!myList?.includes(content.id);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    onToggleMyList(content.id);
  };

  // منطق تحديد الشارات (Badges)
  // Get Latest Season logic
  const latestSeason = content.type === 'series' && content.seasons && content.seasons.length > 0
    ? [...content.seasons].sort((a, b) => b.seasonNumber - a.seasonNumber)[0]
    : null;
  
  // Determine Display Poster: Use latest season poster if available, otherwise content poster
  const displayPoster = (content.type === 'series' && latestSeason?.poster) 
    ? latestSeason.poster 
    : content.poster;

  // Determine Display Year: Use latest season year if available, otherwise content year
  const displayYear = (content.type === 'series' && latestSeason?.releaseYear) 
    ? latestSeason.releaseYear 
    : content.releaseYear;

  const showStandardBadges = !rank;

  // 1. Top Left Badge: Only Banner Note
  const topLeftBadge = content.bannerNote;

  // 1.5 Season Badge (Only for multi-season series)
  const showSeasonBadge = content.type === 'series' && content.seasons && content.seasons.length > 1 && latestSeason;
  const seasonBadgeText = showSeasonBadge ? `الموسم ${latestSeason.seasonNumber}` : null;
  
  // 2. Bottom Right Badge: Only if showLatestBadge is true
  let bottomRightBadge: string | null = null;
  if (showLatestBadge) {
      if (content.type === 'series' && latestSeason && latestSeason.episodes.length > 0) {
          bottomRightBadge = `الحلقة ${latestSeason.episodes.length}`;
      } else if (content.type === 'series' && latestSeason) {
          bottomRightBadge = `الموسم ${latestSeason.seasonNumber}`;
      } else {
          bottomRightBadge = 'جديد';
      }
  }

  // --- WIDTH CALCULATION LOGIC ---
  // Updated for "Compact/Dense" layout specifications:
  // 1. Mobile: (100vw - 40px margins) / 2.25 -> Shows 2 full items + ~25% of the 3rd item.
  // 2. Tablet (md): Shows ~4.2 items.
  // 3. Desktop (lg): (100vw - 64px margins) / 6 -> Shows exactly 6 full items.
  const carouselWidthClass = 'w-[calc((100vw-40px)/2.25)] md:w-[calc((100vw-64px)/4.2)] lg:w-[calc((100vw-64px)/6)] flex-shrink-0 mb-0';

  const widthClass = isGridItem 
    ? 'w-full mb-2' 
    : carouselWidthClass;

  // Determine Button Style based on Theme
  let buttonClass = '';
  
  if (isInMyList) {
      if (isRamadanTheme) {
          buttonClass = 'bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black shadow-[0_0_10px_rgba(212,175,55,0.5)]';
      } else if (isEidTheme) {
          buttonClass = 'bg-gradient-to-r from-purple-700 to-purple-400 text-white shadow-[0_0_10px_rgba(147,112,219,0.5)]';
      } else if (isCosmicTealTheme) {
          buttonClass = 'bg-gradient-to-r from-[#35F18B] to-[#2596be] text-black shadow-[0_0_10px_rgba(53,241,139,0.5)]';
      } else if (isNetflixRedTheme) {
          buttonClass = 'bg-[#E50914] text-white shadow-[0_0_10px_rgba(229,9,20,0.5)]';
      } else {
          buttonClass = 'bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black';
      }
  } else {
      if (isRamadanTheme) {
          buttonClass = 'bg-black/60 text-white border border-amber-500/50 hover:bg-[#FFD700] hover:text-black';
      } else if (isEidTheme) {
          buttonClass = 'bg-black/60 text-white border border-purple-500/50 hover:bg-purple-600 hover:text-white';
      } else if (isCosmicTealTheme) {
          buttonClass = 'bg-black/60 text-white border border-[#35F18B]/50 hover:bg-[#35F18B] hover:text-black';
      } else if (isNetflixRedTheme) {
          buttonClass = 'bg-black/60 text-white border border-[#E50914]/50 hover:bg-[#E50914] hover:text-white';
      } else {
          buttonClass = 'bg-black/60 text-white border border-white/30 hover:bg-white hover:text-black';
      }
  }

  // --- RANK RIBBON LOGIC (Unified Golden Style) ---
  // Enforced Golden (#FFD700) style for ALL themes to signify "Management Choice".
  // Ignores active theme colors.
  const rankBgClass = 'bg-[#FFD700] text-black shadow-[0_0_15px_rgba(255,215,0,0.6)]';

  // Rank Number Color (Always Black on Gold)
  const rankNumColor = 'text-black';
  const rankLabelColor = 'text-black/80';

  return (
    <div 
        onClick={() => onSelectContent(content)} 
        className={`relative ${widthClass} cursor-pointer group transition-transform duration-300 ease-out transform hover:scale-105 hover:z-50 origin-center`}
    >
      <div className={`relative rounded-xl overflow-hidden bg-[#101010] border border-transparent transition-colors duration-300 
        ${rank 
            ? 'border-[#FFD700]/60 shadow-[0_0_10px_rgba(255,215,0,0.1)]' // Enforce Gold border if ranked
            : ''
        }
      `}>
        
        <div className="aspect-[2/3] w-full relative">
            <img 
                src={displayPoster} 
                alt={content.title} 
                className="w-full h-full object-cover transition-transform duration-500" 
                loading="lazy"
            />

            {/* --- RANK RIBBON (Top 10 Feature) --- */}
            {/* Shows only for ranks 1-10 */}
            {rank && rank <= 10 && (
                <div className="absolute top-0 left-2 md:left-3 z-40 drop-shadow-xl">
                    <div className={`flex flex-col items-center justify-center w-8 h-10 md:w-10 md:h-12 rounded-b-lg shadow-[0_4px_10px_rgba(0,0,0,0.6)] ${rankBgClass}`}>
                        <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-tight leading-none mt-1 ${rankLabelColor}`}>TOP</span>
                        <span className={`text-xl md:text-2xl font-black leading-none -mt-0.5 ${rankNumColor}`}>{rank}</span>
                    </div>
                </div>
            )}

            {/* --- Standard Badges (Hidden if Ranked) --- */}
            {showStandardBadges && (
                <>
                    {/* Top Left Container for Season Badge & Banner Note */}
                    {/* Updated: Use items-stretch to match width of widest badge, centered text */}
                    <div className="absolute top-2 left-2 z-20 flex flex-col gap-1 items-stretch pointer-events-none max-w-[80%]">
                        
                        {/* 1. Season Badge (Now on TOP) */}
                        {seasonBadgeText && (
                            <div className={`
                                backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.4)] text-[10px] md:text-xs font-bold px-2 py-1 rounded-md border border-white/10 text-center whitespace-nowrap
                                ${isRamadanTheme 
                                    ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-white border-amber-500/30' 
                                    : isCosmicTealTheme 
                                        ? 'bg-gradient-to-r from-[#0F766E] to-[#115e59] text-white border-[#2DD4BF]/30' 
                                        : isNetflixRedTheme
                                            ? 'bg-[#E50914] text-white border-[#E50914]/30'
                                            : 'bg-gradient-to-r from-pink-600 to-pink-500 text-white border-pink-400/30'
                                }
                            `}>
                                {seasonBadgeText}
                            </div>
                        )}

                        {/* 2. Banner Note / Translation Tag (Now BELOW Season Badge) */}
                        {topLeftBadge && (
                            <div className={`
                                backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.4)] text-[10px] md:text-xs font-bold px-2 py-1 rounded-md border text-center whitespace-nowrap
                                ${isCosmicTealTheme 
                                    ? 'bg-[#35F18B] text-black border-[#35F18B]/50' 
                                    : 'bg-[#6366f1] text-white border-[#6366f1]/50'
                                }
                            `}>
                                {topLeftBadge}
                            </div>
                        )}
                    </div>

                    {/* Release Year (Always visible) */}
                    <div className="absolute top-2 right-2 bg-[#fbbf24]/90 backdrop-blur-sm text-black text-[10px] md:text-xs font-extrabold px-2 py-1 rounded shadow-md z-20">
                        {displayYear}
                    </div>

                    {/* Update Info (Only for 'New' carousel) */}
                    {bottomRightBadge && (
                        <div className={`absolute bottom-2 right-2 backdrop-blur-sm text-[10px] md:text-xs font-bold px-2 py-1 rounded shadow-md z-20 ${isCosmicTealTheme ? 'bg-[#35F18B]/90 text-black' : isNetflixRedTheme ? 'bg-[#E50914]/90 text-white' : 'bg-[#8b5cf6]/90 text-white'}`}>
                            {bottomRightBadge}
                        </div>
                    )}
                </>
            )}

            {/* زر القائمة (My List) */}
            {isLoggedIn && (
                <button
                    onClick={handleToggle}
                    className={`absolute bottom-2 left-2 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all duration-200 z-30 ${buttonClass} opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0`}
                    title={isInMyList ? "إزالة من القائمة" : "إضافة للقائمة"}
                >
                    {isInMyList ? <CheckIcon className="w-4 h-4 md:w-5 md:h-5"/> : <PlusIcon className="w-4 h-4 md:w-5 md:h-5"/>}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
