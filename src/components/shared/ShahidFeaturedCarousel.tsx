import React, { useState, useRef, useEffect } from 'react';
import type { Content } from '@/types';
import { PlayIcon } from '../icons/PlayIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { CloseIcon } from '../icons/CloseIcon';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../icons/ChevronRight';

interface ShahidFeaturedCarouselProps {
  title: React.ReactNode;
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
  isSoonCarousel?: boolean;
}

export const ShahidFeaturedCarousel: React.FC<ShahidFeaturedCarouselProps> = ({
  title,
  contents,
  onSelectContent,
  isLoggedIn,
  myList,
  onToggleMyList,
  containerClassName,
  onSeeAll,
  isRamadanTheme,
  isEidTheme,
  isCosmicTealTheme,
  isNetflixRedTheme,
  isSoonCarousel,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!contents || contents.length === 0) return null;

  const activeContent = contents[activeIndex] || contents[0];
  const isInMyList = !!myList?.includes(activeContent.id);

  // Fallback image selection hierarchy as requested:
  // 1) content.top10Poster (صور التوب 10 للعمل)
  // 2) Mobile vertical hero image (content.mobileBackdropUrl || verticalBackdrop || mobileImageUrl)
  // 3) content.backdrop (صورة الخلفية)
  // 4) content.poster (البوستر العمودي الأصلي)
  const getFeaturedImage = (c: Content): string => {
    if (c.top10Poster && c.top10Poster.trim() !== '') return c.top10Poster;

    const verticalGallery = c.imageGallery?.verticalBackdrop?.[0];
    if (verticalGallery && verticalGallery.trim() !== '') return verticalGallery;

    if (c.mobileBackdropUrl && c.mobileBackdropUrl.trim() !== '') return c.mobileBackdropUrl;

    const seasonMobileImg = c.seasons && c.seasons.length > 0 ? c.seasons[0].mobileImageUrl : null;
    if (seasonMobileImg && seasonMobileImg.trim() !== '') return seasonMobileImg;

    if (c.backdrop && c.backdrop.trim() !== '') return c.backdrop;

    return c.poster;
  };

  const featuredBgImage = getFeaturedImage(activeContent);

  // Calculate subtitles
  const isEpisodic = activeContent.type === 'series' || activeContent.type === 'program';
  const latestSeason = isEpisodic && activeContent.seasons && activeContent.seasons.length > 0
    ? [...activeContent.seasons].sort((a, b) => b.seasonNumber - a.seasonNumber)[0]
    : null;

  const seasonInfo = latestSeason ? `الموسم ${latestSeason.seasonNumber}` : (activeContent.seasons?.length ? `${activeContent.seasons.length} موسم` : '');
  const categoriesAndGenres = [...(activeContent.categories || []), ...(activeContent.genres || [])].slice(0, 3).join(' | ');

  const metaString = [
    activeContent.releaseYear,
    seasonInfo,
    categoriesAndGenres
  ].filter(Boolean).join(' • ');

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const detailUrl = activeContent.type === 'movie'
    ? `/watch/movie/${activeContent.slug || activeContent.id}`
    : `/series/${activeContent.slug || activeContent.id}${latestSeason ? `/الموسم${latestSeason.seasonNumber}` : ''}`;

  return (
    <div className={`mb-8 md:mb-12 relative group/shahid z-0 ${containerClassName || ''}`}>
      {/* Header */}
      {title && (
        <div className="flex justify-between items-center mb-4 px-4 md:px-8">
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3 tracking-wide">
              {typeof title === 'string' ? (
                <>
                  <div className={`w-1.5 h-6 md:h-8 rounded-full shadow-[0_0_12px_rgba(0,167,248,0.7)] 
                    ${isRamadanTheme
                      ? 'bg-[#FFD700]'
                      : isEidTheme
                        ? 'bg-purple-500'
                        : isCosmicTealTheme
                          ? 'bg-gradient-to-b from-[#35F18B] to-[#2596be]'
                          : isNetflixRedTheme
                            ? 'bg-[#E50914]'
                            : 'bg-gradient-to-b from-[#00A7F8] to-[#00FFB0]'
                    }`}></div>
                  <span>{title}</span>
                </>
              ) : (
                title
              )}
            </h2>
          </div>

          {onSeeAll && (
            <button
              onClick={onSeeAll}
              className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white text-xs md:text-sm font-medium px-4 py-1.5 md:px-5 md:py-2 rounded-full transition-all cursor-pointer"
            >
              <span>شاهد الكل</span>
              <ChevronLeftIcon className="w-3 h-3 md:w-4 md:h-4 text-[#00A7F8]" />
            </button>
          )}
        </div>
      )}

      {/* Main Carousel Track */}
      <div className="relative px-4 md:px-8">
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute z-[100] right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#141b29]/90 border border-gray-600 backdrop-blur-md text-white items-center justify-center transition-all duration-300 opacity-0 group-hover/shahid:opacity-100 hover:bg-[#00A7F8] hover:border-[#00A7F8]"
          aria-label="Scroll Right"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>

        <div
          ref={scrollRef}
          className="flex items-center gap-4 md:gap-6 overflow-x-auto py-4 px-1 rtl-scroll scroll-smooth custom-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {contents.map((content, idx) => {
            const isActive = idx === activeIndex;

            if (isActive) {
              return (
                <div
                  key={content.id}
                  className="flex-shrink-0 w-[92vw] sm:w-[680px] lg:w-[820px] h-[360px] sm:h-[420px] lg:h-[460px] rounded-2xl md:rounded-3xl border-2 border-white/90 shadow-[0_0_35px_rgba(255,255,255,0.25)] relative overflow-hidden transition-all duration-500 ease-out z-20 group/activeCard"
                >
                  {/* Backdrop Image */}
                  <img
                    src={featuredBgImage}
                    alt={activeContent.title}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover/activeCard:scale-105"
                  />

                  {/* Gradient Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent"></div>

                  {/* Top Right Close Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex((idx + 1) % contents.length);
                    }}
                    className="absolute top-4 left-4 z-40 w-8 h-8 rounded-full bg-black/50 border border-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all hover:bg-black/80 cursor-pointer"
                    title="إغلاق / العمل التالي"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>

                  {/* Content Overlay */}
                  <div className="absolute inset-0 p-5 sm:p-8 lg:p-10 flex flex-col justify-end items-start z-30 pointer-events-none">
                    <div className="pointer-events-auto max-w-2xl space-y-2 sm:space-y-3">
                      {/* Brand Logo / Badge */}
                      <div className="flex items-center gap-2">
                        {activeContent.isLogoEnabled && activeContent.logoUrl ? (
                          <img
                            src={activeContent.logoUrl}
                            alt={activeContent.title}
                            className="h-10 sm:h-14 lg:h-16 object-contain max-w-[240px] drop-shadow-xl"
                          />
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-extrabold text-xs shadow-lg">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                            أعمال أصلية
                          </span>
                        )}
                      </div>

                      {/* Main Title if logo is not shown */}
                      {(!activeContent.isLogoEnabled || !activeContent.logoUrl) && (
                        <h3 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-2xl">
                          {activeContent.title}
                        </h3>
                      )}

                      {/* Highlight Notice / Green Badge */}
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm drop-shadow-md">
                        <span className="w-3 h-3 rotate-45 bg-emerald-400 flex items-center justify-center text-[8px] text-black font-extrabold shadow-sm">
                          ◆
                        </span>
                        <span>{activeContent.bannerNote || 'حلقة واحدة متوفرة لك مجاناً'}</span>
                      </div>

                      {/* Metadata Row */}
                      <p className="text-gray-300 font-medium text-xs sm:text-sm drop-shadow">
                        {metaString}
                      </p>

                      {/* Tagline / Description */}
                      <p className="text-gray-200 text-xs sm:text-sm line-clamp-2 max-w-xl font-normal leading-relaxed drop-shadow">
                        {activeContent.description}
                      </p>

                      {/* Action Buttons Row */}
                      <div className="pt-2 flex items-center gap-3">
                        <a
                          href={detailUrl}
                          onClick={(e) => {
                            e.preventDefault();
                            onSelectContent(activeContent, undefined, undefined, isSoonCarousel);
                          }}
                          className="px-6 py-2.5 sm:px-8 sm:py-3 bg-white hover:bg-gray-200 text-black font-black text-sm sm:text-base rounded-full flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer no-underline"
                        >
                          <PlayIcon className="w-5 h-5 fill-black text-black" />
                          <span>شاهد الآن</span>
                        </a>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleMyList(activeContent.id);
                          }}
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                            isInMyList
                              ? 'bg-white border-white text-black shadow-lg scale-105'
                              : 'bg-black/40 border-gray-400/80 text-white hover:border-white hover:bg-black/70'
                          }`}
                          title="قائمتي"
                        >
                          {isInMyList ? <CheckIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsFavorite(!isFavorite);
                          }}
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                            isFavorite
                              ? 'bg-rose-600 border-rose-600 text-white shadow-lg'
                              : 'bg-black/40 border-gray-400/80 text-white hover:border-white hover:bg-black/70'
                          }`}
                          title="المفضلة"
                        >
                          <svg className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Side non-active card (vertical poster style)
            return (
              <div
                key={content.id}
                onClick={() => setActiveIndex(idx)}
                className="flex-shrink-0 w-[140px] sm:w-[170px] lg:w-[200px] h-[210px] sm:h-[260px] lg:h-[300px] rounded-xl sm:rounded-2xl overflow-hidden relative cursor-pointer opacity-75 hover:opacity-100 transition-all duration-300 transform hover:scale-105 border border-white/10 hover:border-white/40 shadow-lg group/sideCard"
              >
                <img
                  src={content.poster}
                  alt={content.title}
                  className="w-full h-full object-cover object-center group-hover/sideCard:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

                {content.bannerNote && (
                  <span className="absolute top-2 right-2 bg-emerald-500 text-black font-black text-[10px] px-2 py-0.5 rounded shadow-md">
                    {content.bannerNote}
                  </span>
                )}

                <div className="absolute bottom-3 right-3 left-3">
                  <h4 className="text-white font-bold text-xs sm:text-sm line-clamp-1 drop-shadow-md">
                    {content.title}
                  </h4>
                  <p className="text-gray-400 text-[10px] font-medium mt-0.5">
                    {content.releaseYear}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute z-[100] left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#141b29]/90 border border-gray-600 backdrop-blur-md text-white items-center justify-center transition-all duration-300 opacity-0 group-hover/shahid:opacity-100 hover:bg-[#00A7F8] hover:border-[#00A7F8]"
          aria-label="Scroll Left"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ShahidFeaturedCarousel;
