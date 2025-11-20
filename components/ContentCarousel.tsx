
import React, { useRef } from 'react';
import type { Content } from '../types';
import ContentCard from './ContentCard';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface ContentCarouselProps {
  title: React.ReactNode;
  contents: Content[];
  onSelectContent: (content: Content) => void;
  isLoggedIn: boolean;
  myList?: string[];
  onToggleMyList: (contentId: string) => void;
  isNew?: boolean;
  isRestricted?: boolean;
  containerClassName?: string;
  onSeeAll?: () => void;
  showRanking?: boolean; // New Prop for Top 10
  isRamadanTheme?: boolean; // New Prop for theming arrows
}

const ContentCarousel: React.FC<ContentCarouselProps> = ({ 
    title, 
    contents, 
    onSelectContent, 
    isLoggedIn, 
    myList, 
    onToggleMyList, 
    isNew, 
    isRestricted, 
    containerClassName,
    onSeeAll,
    showRanking,
    isRamadanTheme
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

  return (
    // COMPACT LAYOUT UPDATE: Reduced mb-6/mb-8 to mb-2/mb-4
    <div className={`mb-2 md:mb-4 relative group/carousel z-0 ${containerClassName || ''}`}>
      {/* Header - Aligned exactly with the scroll content padding (px-4 md:px-8) */}
      <div className="flex justify-between items-center mb-2 px-4 md:px-8">
        
        {/* Title Section */}
        <div className="flex items-center gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                {typeof title === 'string' ? (
                    <>
                        <div className={`w-1.5 h-6 md:h-8 rounded-full shadow-[0_0_10px_rgba(0,167,248,0.6)] ${isRamadanTheme ? 'bg-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.6)]' : 'bg-gradient-to-b from-[#00A7F8] to-[#00FFB0]'}`}></div>
                        <span>{title}</span>
                    </>
                ) : (
                    title
                )}
            </h2>
            {isNew && (
            <span className="bg-[#FFC107] text-black text-xs md:text-sm font-bold px-3 py-1 rounded-md shadow-[0_0_10px_rgba(255,193,7,0.4)] transform -skew-x-6 hover:scale-105 transition-transform">
                جديد
            </span>
            )}
        </div>

        {/* See All Button */}
        {onSeeAll && (
            <button 
                onClick={onSeeAll}
                className="
                    flex items-center gap-2 
                    bg-white/5 backdrop-blur-md 
                    border border-white/10 hover:border-white/30 
                    hover:bg-white/10
                    text-white text-xs md:text-sm font-medium
                    px-4 py-1.5 md:px-5 md:py-2
                    rounded-full 
                    transition-all duration-300
                    shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]
                "
            >
                <span>شاهد الكل</span>
                <ChevronLeftIcon className={`w-3 h-3 md:w-4 md:h-4 opacity-80 ${isRamadanTheme ? 'text-[#FFD700]' : 'text-[#00A7F8]'}`} />
            </button>
        )}
      </div>
      
      <div className="relative">
        {/* 
            Left Scroll Button
            - Positioned in the left gutter/padding area
        */}
        <button 
            onClick={() => scroll('right')} 
            className={`
                hidden md:flex absolute z-50 
                left-2 md:left-4 top-1/2 -translate-y-1/2
                w-10 h-10 lg:w-12 lg:h-12 rounded-full 
                bg-[#141b29]/90 border border-gray-600 backdrop-blur-md
                text-white 
                items-center justify-center 
                opacity-0 group-hover/carousel:opacity-100 
                transition-all duration-300 ease-out
                hover:text-black hover:scale-110 
                ${isRamadanTheme 
                    ? 'hover:bg-[#FFD700] hover:border-[#FFD700] hover:shadow-[0_0_15px_rgba(255,215,0,0.5)]' 
                    : 'hover:bg-[#00A7F8] hover:border-[#00A7F8] hover:shadow-[0_0_15px_rgba(0,167,248,0.5)]'
                }
            `}
            aria-label="Scroll Left"
        >
           <ChevronLeftIcon className="w-6 h-6" />
        </button>
        
        {/* 
            Carousel Container 
            - Used gap-3 (12px) for consistent spacing
            - Padding px-4 md:px-8 to allow items to flush with edge
            - COMPACT LAYOUT UPDATE: Reduced pb-6 to pb-2
        */}
        <div 
            ref={scrollRef} 
            className="flex overflow-x-auto gap-3 pb-2 pt-2 px-4 md:px-8 rtl-scroll scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {contents.map((content, index) => (
            <ContentCard 
              key={content.id} 
              content={content} 
              onSelectContent={onSelectContent}
              isLoggedIn={isLoggedIn}
              myList={myList}
              onToggleMyList={onToggleMyList}
              showLatestBadge={isNew}
              rank={showRanking ? index + 1 : undefined}
              isRamadanTheme={isRamadanTheme}
            />
          ))}
        </div>
        
        {/* 
            Right Scroll Button
            - Positioned in the right gutter/padding area
        */}
         <button 
            onClick={() => scroll('left')} 
            className={`
                hidden md:flex absolute z-50 
                right-2 md:right-4 top-1/2 -translate-y-1/2
                w-10 h-10 lg:w-12 lg:h-12 rounded-full 
                bg-[#141b29]/90 border border-gray-600 backdrop-blur-md
                text-white 
                items-center justify-center 
                opacity-0 group-hover/carousel:opacity-100 
                transition-all duration-300 ease-out
                hover:text-black hover:scale-110 
                ${isRamadanTheme 
                    ? 'hover:bg-[#FFD700] hover:border-[#FFD700] hover:shadow-[0_0_15px_rgba(255,215,0,0.5)]' 
                    : 'hover:bg-[#00A7F8] hover:border-[#00A7F8] hover:shadow-[0_0_15px_rgba(0,167,248,0.5)]'
                }
            `}
            aria-label="Scroll Right"
        >
           <ChevronRightIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ContentCarousel;
