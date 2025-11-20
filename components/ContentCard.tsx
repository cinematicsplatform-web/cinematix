
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
}

const ContentCard: React.FC<ContentCardProps> = ({ content, onSelectContent, isLoggedIn, myList, onToggleMyList, showLatestBadge, isGridItem, rank, isRamadanTheme }) => {
  const isInMyList = !!myList?.includes(content.id);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    onToggleMyList(content.id);
  };

  // منطق تحديد الشارات (Badges)
  const latestSeason = content.type === 'series' && content.seasons && content.seasons.length > 0
    ? [...content.seasons].sort((a, b) => b.seasonNumber - a.seasonNumber)[0]
    : null;
  
  const showStandardBadges = !rank;

  // 1. Top Left Badge: Only Banner Note
  const topLeftBadge = content.bannerNote;
  
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
  // 3. Desktop (lg): (100vw - 64px margins) / 6.2 -> Shows 6 full items + ~20% of the 7th item.
  const carouselWidthClass = 'w-[calc((100vw-40px)/2.25)] md:w-[calc((100vw-64px)/4.2)] lg:w-[calc((100vw-64px)/6.2)] flex-shrink-0 mb-0';

  const widthClass = isGridItem 
    ? 'w-full mb-2' 
    : carouselWidthClass;

  // Determine Button Style based on Theme
  const buttonClass = isInMyList
      ? (isRamadanTheme 
          ? 'bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black shadow-[0_0_10px_rgba(212,175,55,0.5)]' // Gold gradient active
          : 'bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black') // Blue gradient active
      : (isRamadanTheme
          ? 'bg-black/60 text-white border border-amber-500/50 hover:bg-[#FFD700] hover:text-black' // Gold hover inactive
          : 'bg-black/60 text-white border border-white/30 hover:bg-white hover:text-black'); // White hover inactive

  return (
    <div 
        onClick={() => onSelectContent(content)} 
        className={`relative ${widthClass} cursor-pointer group transition-transform duration-300 ease-out transform hover:scale-105 hover:z-50 origin-center`}
    >
      <div className={`relative rounded-xl overflow-hidden bg-[#101010] border border-transparent transition-colors duration-300 ${rank ? 'border-amber-500/20' : ''}`}>
        
        <div className="aspect-[2/3] w-full relative">
            <img 
                src={content.poster} 
                alt={content.title} 
                className="w-full h-full object-cover transition-transform duration-500" 
                loading="lazy"
            />

            {/* --- RANK RIBBON (Top 10 Feature) --- */}
            {rank && (
                <div className="absolute top-0 left-2">
                   <div className="relative">
                        {/* Ribbon Shape */}
                        <div className="bg-[#FFD700] text-black w-8 md:w-10 h-10 md:h-12 flex items-center justify-center shadow-lg rounded-b-md z-20">
                             <span className="font-black text-lg md:text-xl tracking-tighter leading-none mt-1">
                                 {rank}
                             </span>
                        </div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-600/50"></div>
                   </div>
                   <div className="text-[8px] md:text-[10px] font-bold text-[#FFD700] mt-1 text-center drop-shadow-md">TOP</div>
                </div>
            )}

            {/* --- Standard Badges (Hidden if Ranked) --- */}
            {showStandardBadges && (
                <>
                    {/* Banner Note (Only if exists) */}
                    {topLeftBadge && (
                        <div className="absolute top-2 left-2 bg-[#6366f1]/90 backdrop-blur-sm text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded shadow-md z-20">
                            {topLeftBadge}
                        </div>
                    )}

                    {/* Release Year (Always visible) */}
                    <div className="absolute top-2 right-2 bg-[#fbbf24]/90 backdrop-blur-sm text-black text-[10px] md:text-xs font-extrabold px-2 py-1 rounded shadow-md z-20">
                        {content.releaseYear}
                    </div>

                    {/* Update Info (Only for 'New' carousel) */}
                    {bottomRightBadge && (
                        <div className="absolute bottom-2 right-2 bg-[#8b5cf6]/90 backdrop-blur-sm text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded shadow-md z-20">
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
