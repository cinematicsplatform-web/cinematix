
import React, { useState, useEffect, useMemo } from 'react';
import type { Content, Ad, View } from '../types';
import { ContentType } from '../types';
import Hero from './Hero';
import ContentCarousel from './ContentCarousel';
import AdPlacement from './AdPlacement';

interface MoviesPageProps {
  allContent: Content[];
  pinnedContent: Content[];
  onSelectContent: (content: Content) => void;
  isLoggedIn: boolean;
  myList?: string[];
  onToggleMyList: (contentId: string) => void;
  ads: Ad[];
  adsEnabled: boolean;
  onNavigate: (view: View, category?: string) => void;
  isLoading?: boolean;
  isRamadanTheme?: boolean;
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
}

const MoviesPage: React.FC<MoviesPageProps> = ({ 
  allContent, 
  pinnedContent, 
  onSelectContent, 
  isLoggedIn, 
  myList, 
  onToggleMyList, 
  ads, 
  adsEnabled, 
  onNavigate, 
  isLoading, 
  isRamadanTheme, 
  isEidTheme,
  isCosmicTealTheme
}) => {
  const allMovies = useMemo(() => allContent.filter(c => c.type === ContentType.Movie), [allContent]);
  
  const heroContent = useMemo(() => {
    if (pinnedContent && pinnedContent.length > 0) {
        return pinnedContent;
    }
    const sortedMovies = [...allMovies].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sortedMovies.slice(0, 1);
  }, [pinnedContent, allMovies]);

  const carousels = useMemo(() => {
    const limit = (list: Content[]) => list.slice(0, 12);

    const topRatedMovies = limit([...allMovies]
      .sort((a, b) => b.rating - a.rating));

    const recentMovies = limit([...allMovies]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    const arabicMovies = limit(allMovies.filter(c => c.categories.includes('افلام عربية')));
    const turkishMovies = limit(allMovies.filter(c => c.categories.includes('افلام تركية')));
    const foreignMovies = limit(allMovies.filter(c => c.categories.includes('افلام اجنبية')));
    const indianMovies = limit(allMovies.filter(c => c.categories.includes('افلام هندية')));
    const animationMovies = limit(allMovies.filter(c => c.categories.includes('افلام أنميشن')));

    // Top 10 Pinned (Exclusive Ranking Source)
    const pinnedMoviesCarousel = { 
        id: 'm_pinned_top', 
        title: 'أفضل 10 أفلام (اختيارنا)', 
        contents: pinnedContent, 
        showRanking: true 
    };

    const definedCarousels = [
      pinnedMoviesCarousel,
      { id: 'm4', title: 'الأعلى تقييماً', contents: topRatedMovies, isNew: false, categoryKey: 'top-rated-movies', showRanking: false }, // No rank badge
      { id: 'm_new', title: 'أحدث الأفلام', contents: recentMovies, isNew: true, categoryKey: 'new-movies' },
      { id: 'm1', title: 'أفلام عربية', contents: arabicMovies, isNew: false, categoryKey: 'افلام عربية' },
      { id: 'm2', title: 'أفلام تركية', contents: turkishMovies, isNew: false, categoryKey: 'افلام تركية' },
      { id: 'm3', title: 'أفلام أجنبية', contents: foreignMovies, isNew: false, categoryKey: 'افلام اجنبية' },
      { id: 'm5', title: 'أفلام هندية', contents: indianMovies, isNew: false, categoryKey: 'افلام هندية' },
      { id: 'm6', title: 'افلام أنميشن', contents: animationMovies, isNew: false, categoryKey: 'افلام أنميشن' },
    ].filter(carousel => carousel.contents.length > 0);

    return definedCarousels;
  }, [allMovies, pinnedContent]);

  const handleSeeAll = (categoryKey: string) => {
      onNavigate('category', categoryKey);
  };

  const [showEmptyMessage, setShowEmptyMessage] = useState(false);
  
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (!isLoading && allMovies.length === 0) {
        timer = setTimeout(() => {
            setShowEmptyMessage(true);
        }, 750); 
    } else {
        setShowEmptyMessage(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading, allMovies.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isEidTheme ? 'border-purple-500' : isCosmicTealTheme ? 'border-[#35F18B]' : 'border-[#00A7F8]'}`}></div>
      </div>
    );
  }

  if (allMovies.length === 0) {
    if (!showEmptyMessage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
                <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isEidTheme ? 'border-purple-500' : isCosmicTealTheme ? 'border-[#35F18B]' : 'border-[#00A7F8]'}`}></div>
            </div>
        );
    }
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500 animate-fade-in-up">لا يوجد أفلام لعرضها حالياً.</div>
  }

  return (
    <div className="min-h-screen bg-[var(--bg-body)] relative overflow-x-hidden">
        
        <div className="relative z-10">
            <Hero 
                contents={heroContent} 
                onWatchNow={onSelectContent} 
                isLoggedIn={isLoggedIn} 
                myList={myList} 
                onToggleMyList={onToggleMyList} 
                autoSlideInterval={4000}
                isRamadanTheme={isRamadanTheme}
                isEidTheme={isEidTheme}
                isCosmicTealTheme={isCosmicTealTheme}
            />
        </div>

        <main className="pb-24 z-30 relative bg-[var(--bg-body)]">
            <div className={`w-full h-px mt-0 mb-2 md:my-4 
                ${isRamadanTheme 
                    ? 'bg-gradient-to-r from-transparent via-[#FFD700]/50 to-transparent opacity-80' 
                    : isEidTheme
                        ? 'bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-80'
                        : isCosmicTealTheme
                            ? 'bg-gradient-to-r from-transparent via-[#35F18B]/50 to-transparent opacity-80'
                            : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'
                }`}></div>

            <AdPlacement ads={ads} placement="movies-page" isEnabled={adsEnabled} />
            
            {carousels.map((carousel) => {
            return (
                <ContentCarousel
                key={carousel.id}
                title={carousel.title}
                contents={carousel.contents}
                onSelectContent={onSelectContent}
                isLoggedIn={isLoggedIn}
                myList={myList}
                onToggleMyList={onToggleMyList}
                isNew={(carousel as any).isNew}
                onSeeAll={(carousel as any).categoryKey ? () => handleSeeAll((carousel as any).categoryKey) : undefined}
                isRamadanTheme={isRamadanTheme}
                isEidTheme={isEidTheme}
                isCosmicTealTheme={isCosmicTealTheme}
                showRanking={(carousel as any).showRanking}
                />
            );
            })}
        </main>
    </div>
  );
};

export default MoviesPage;
