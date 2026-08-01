import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { Content } from '@/types';
import ContentCard from './ContentCard';
import SkeletonCard from './SkeletonCard';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../icons/ChevronRight';
import { RankNumberStyle } from './RankNumber';

export interface Top10CarouselProps {
  title?: React.ReactNode;
  contents: Content[];
  onSelectContent: (content: Content, seasonNumber?: number, episodeNumber?: number, isSoon?: boolean) => void;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  myList?: string[];
  onToggleMyList: (contentId: string) => void;
  containerClassName?: string;
  onSeeAll?: () => void;
  isRamadanTheme?: boolean;
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
  isNetflixRedTheme?: boolean;
  isLoading?: boolean;
  isSoonCarousel?: boolean;
  rankStyle?: RankNumberStyle;
}

/**
 * مكون كاروسيل التوب 10 المنفصل لتسهيل التطوير والصيانة
 */
const Top10Carousel: React.FC<Top10CarouselProps> = ({
  title = 'أفضل 10 أعمال',
  contents,
  onSelectContent,
  isLoggedIn,
  isAdmin = false,
  myList,
  onToggleMyList,
  containerClassName = '',
  onSeeAll,
  isRamadanTheme,
  isEidTheme,
  isCosmicTealTheme,
  isNetflixRedTheme,
  isLoading,
  isSoonCarousel,
  rankStyle = 'netflix',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const [canScrollLeft, setCanScrollLeft] = useState(true);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // تم ضبط الحسابات الرياضية بدقة متناهية لضمان عدم قص أي جزء من الكارت الأخير:
  // - الموبايل (gap-4): يعرض 2.5 كارت بالظبط
  // - التابلت (gap-4): يعرض 3.5 كارت بالظبط
  // - الشاشات الكبيرة lg وما فوق (gap-6): يعرض 5 كروت بالظبط دون أي اسكرول إضافي
  const cardWrapperClass = 
    "flex-none relative transition-all duration-300 hover:z-50 " +
    "w-[calc(48%-0.5rem)] sm:w-[calc(32%-0.6rem)] lg:w-[calc(22%-0.8rem)] " +
    "[&>*]:w-full [&>*]:h-full flex items-center";

  const checkScrollBoundaries = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const isAtStart = scrollLeft >= -5;
      const isAtEnd = Math.abs(scrollLeft) + clientWidth >= scrollWidth - 5;
      setCanScrollRight(!isAtStart);
      setCanScrollLeft(!isAtEnd);
    }
  }, []);

  useEffect(() => {
    checkScrollBoundaries();
    window.addEventListener('resize', checkScrollBoundaries);
    return () => window.removeEventListener('resize', checkScrollBoundaries);
  }, [checkScrollBoundaries, contents]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScrollBoundaries, 400);
    }
  };

  if (isLoading) {
    return (
      <div className={`mb-4 md:mb-6 relative z-0 ${containerClassName}`}>
        <div className="flex justify-between items-center mb-2 px-4 md:px-8">
          <div className="h-7 w-44 bg-gray-800/60 rounded-lg animate-pulse" />
        </div>
        {/* تم توحيد المسافات: gap-4 للموبايل والتابلت، و gap-6 للشاشات الكبيرة */}
        <div className="flex overflow-x-auto gap-4 lg:gap-6 py-4 px-4 md:px-8 rtl-scroll">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cardWrapperClass}>
              <SkeletonCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // الاكتفاء بأول 10 عناصر
  const top10Items = contents.slice(0, 10);

  if (top10Items.length === 0) return null;

  return (
    <div
      className={`mb-4 md:mb-6 relative group/top10-carousel z-0 ${containerClassName}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {title && (
        <div className="flex justify-between items-center mb-2 px-4 md:px-8">
          <div className="flex items-center gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
              {typeof title === 'string' ? (
                <>
                  <div
                    className={`w-1.5 h-6 md:h-8 rounded-full shadow-[0_0_10px_rgba(0,167,248,0.6)] ${
                      isRamadanTheme
                        ? 'bg-[#FFD700]'
                        : isEidTheme
                        ? 'bg-purple-500'
                        : isCosmicTealTheme
                        ? 'bg-gradient-to-b from-[#35F18B] to-[#2596be]'
                        : isNetflixRedTheme
                        ? 'bg-[#E50914]'
                        : 'bg-gradient-to-b from-[#00A7F8] to-[#00FFB0]'
                    }`}
                  />
                  <span>{title}</span>
                </>
              ) : (
                title
              )}
            </h2>
            <span className="bg-gradient-to-r from-amber-500 to-amber-300 text-black text-xs md:text-sm font-extrabold px-2.5 py-0.5 rounded-md shadow-[0_0_10px_rgba(245,158,11,0.4)] flex items-center gap-1">
              TOP 10
            </span>
          </div>

          {onSeeAll && (
            <button
              onClick={onSeeAll}
              className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white text-xs md:text-sm font-medium px-4 py-1.5 md:px-5 md:py-2 rounded-full transition-all cursor-pointer"
            >
              <span>شاهد الكل</span>
              <ChevronLeftIcon
                className={`w-3 h-3 md:w-4 md:h-4 opacity-80 ${
                  isRamadanTheme
                    ? 'text-[#FFD700]'
                    : isEidTheme
                    ? 'text-purple-400'
                    : isCosmicTealTheme
                    ? 'text-[#35F18B]'
                    : isNetflixRedTheme
                    ? 'text-[#E50914]'
                    : 'text-[#00A7F8]'
                }`}
              />
            </button>
          )}
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => scroll('right')}
          className={`hidden md:flex absolute z-[100] right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#141b29]/90 border border-gray-600 backdrop-blur-md text-white items-center justify-center transition-all duration-300 cursor-pointer ${
            isHovered && canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Scroll Right"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>

        {/* تم استخدام gap-4 للشاشات الصغيرة والمتوسطة، و gap-6 للشاشات الكبيرة لتتناسب مع معادلة العرض */}
        <div
          ref={scrollRef}
          onScroll={checkScrollBoundaries}
          className="flex items-stretch overflow-x-auto gap-4 lg:gap-6 py-6 md:py-8 -my-3 md:-my-4 px-6 md:px-12 rtl-scroll scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {top10Items.map((content, index) => (
            <div key={content.id} className={cardWrapperClass}>
              <ContentCard
                content={content}
                onSelectContent={(c) => onSelectContent(c, undefined, undefined, isSoonCarousel)}
                isLoggedIn={isLoggedIn}
                isAdmin={isAdmin}
                myList={myList}
                onToggleMyList={onToggleMyList}
                rank={index + 1}
                rankStyle={rankStyle}
                isRamadanTheme={isRamadanTheme}
                isEidTheme={isEidTheme}
                isCosmicTealTheme={isCosmicTealTheme}
                isNetflixRedTheme={isNetflixRedTheme}
                isSoonCarousel={isSoonCarousel}
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll('left')}
          className={`hidden md:flex absolute z-[100] left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#141b29]/90 border border-gray-600 backdrop-blur-md text-white items-center justify-center transition-all duration-300 cursor-pointer ${
            isHovered && canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Scroll Left"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default Top10Carousel;