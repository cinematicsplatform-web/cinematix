import React, { useState, useEffect, useMemo } from 'react';
import type { Content, Ad, View, SiteSettings } from '@/types';
import { ContentType } from '@/types';
import Hero from './Hero';
import ContentCarousel from './ContentCarousel';
import AdPlacement from './AdPlacement';
import SEO from './SEO';
import AdZone from './AdZone'; 

interface MoviesPageProps {
  allContent: Content[];
  pinnedContent: Content[];
  top10Content?: Content[];
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
  isNetflixRedTheme?: boolean;
  siteSettings?: SiteSettings;
}

const MoviesPage: React.FC<MoviesPageProps> = ({ 
  allContent, 
  pinnedContent, 
  top10Content,
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
  isCosmicTealTheme, 
  isNetflixRedTheme, 
  siteSettings
}) => {
  const allMovies = useMemo(() => allContent.filter(c => c.type === ContentType.Movie), [allContent]);
  
  const heroContent = useMemo(() => {
    if (pinnedContent && pinnedContent.length > 0) {
        return pinnedContent;
    }
    const sortedMovies = [...allMovies].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    // Updated to slice 5 items to enable slider behavior like Home Page
    return sortedMovies.slice(0, 5);
  }, [pinnedContent, allMovies]);

  const carousels = useMemo(() => {
    const limit = (list: Content[]) => list.slice(0, 12);

    const recentMovies = limit([...allMovies]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    const arabicMovies = limit(allMovies.filter(c => c.categories.includes('افلام عربية')));
    const turkishMovies = limit(allMovies.filter(c => c.categories.includes('افلام تركية')));
    const foreignMovies = limit(allMovies.filter(c => c.categories.includes('افلام اجنبية')));
    const indianMovies = limit(allMovies.filter(c => c.categories.includes('افلام هندية')));
    const animationMovies = limit(allMovies.filter(c => c.categories.includes('افلام أنميشن')));

    // Top 10 Pinned (Exclusive Ranking)
    // Use top10Content if available, otherwise fallback to pinnedContent
    const top10Source = (top10Content && top10Content.length > 0) ? top10Content : pinnedContent;

    const pinnedMoviesCarousel = { 
        id: 'm_pinned_top', 
        title: 'أفضل 10 أفلام', 
        contents: top10Source, 
        showRanking: true 
    };

    const definedCarousels = [
      // Conditionally include Top 10
      siteSettings?.showTop10Movies ? pinnedMoviesCarousel : null,
      { id: 'm1', title: 'أحدث الإضافات', contents: recentMovies, isNew: true, categoryKey: 'new-movies' },
      { id: 'm2', title: 'أفلام عربية', contents: arabicMovies, isNew: false, categoryKey: 'افلام عربية' },
      { id: 'm3', title: 'أفلام تركية', contents: turkishMovies, isNew: false, categoryKey: 'افلام تركية' },
      { id: 'm4', title: 'أفلام أجنبية', contents: foreignMovies, isNew: false, categoryKey: 'افلام اجنبية' },
      { id: 'm5', title: 'أفلام هندية', contents: indianMovies, isNew: false, categoryKey: 'افلام هندية' },
      { id: 'm6', title: 'افلام أنميشن', contents: animationMovies, isNew: false, categoryKey: 'افلام أنميشن' },
    ]
    .filter(Boolean)
    .filter(carousel => (carousel as any).contents.length > 0);

    return definedCarousels;
  }, [allMovies, pinnedContent, top10Content, siteSettings?.showTop10Movies]);

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
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isEidTheme ? 'border-purple-500' : isCosmicTealTheme ? 'border-[#35F18B]' : isNetflixRedTheme ? 'border-[#E50914]' : 'border-[#00A7F8]'}`}></div>
      </div>
    );
  }

  if (allMovies.length === 0) {
    if (!showEmptyMessage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
                <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isEidTheme ? 'border-purple-500' : isCosmicTealTheme ? 'border-[#35F18B]' : isNetflixRedTheme ? 'border-[#E50914]' : 'border-[#00A7F8]'}`}></div>
            </div>
        );
    }
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500 animate-fade-in-up">لا يوجد أفلام لعرضها حالياً.</div>
  }

  return (
    <div className="relative min-h-screen bg-[var(--bg-body)]">
        
        <SEO 
            title="أفلام" 
            description="مكتبة ضخمة من الأفلام العربية والأجنبية والتركية والهندية بجودة عالية."
            type="website"
        />

        <div className="relative z-10">
            <Hero 
                contents={heroContent} 
                onWatchNow={onSelectContent} 
                isLoggedIn={isLoggedIn} 
                myList={myList} 
                onToggleMyList={onToggleMyList} 
                autoSlideInterval={5000}
                isRamadanTheme={isRamadanTheme}
                isEidTheme={isEidTheme}
                isCosmicTealTheme={isCosmicTealTheme}
                isNetflixRedTheme={isNetflixRedTheme}
            />
        </div>

        <main className="relative z-30 pb-24 bg-[var(--bg-body)]">
            <div className={`w-full h-px mt-0 mb-2 md:my-4 
                ${isRamadanTheme 
                    ? 'bg-gradient-to-r from-transparent via-[#FFD700]/50 to-transparent opacity-80' 
                    : isEidTheme
                        ? 'bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-80'
                        : isCosmicTealTheme
                            ? 'bg-gradient-to-r from-transparent via-[#35F18B]/50 to-transparent opacity-80'
                            : isNetflixRedTheme
                                ? 'bg-gradient-to-r from-transparent via-[#E50914]/50 to-transparent opacity-80'
                                : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'
                }`}></div>

            <div className="flex flex-col lg:flex-row gap-6 px-0 md:px-0">
                <div className="flex-1 w-full">
                    {adsEnabled && <AdZone position="page_movies_top" />}
                    <AdPlacement ads={ads} placement="listing-top" isEnabled={adsEnabled} />
                    <AdPlacement ads={ads} placement="movies-page" isEnabled={adsEnabled} />
                    
                    {carousels.map((carousel) => {
                        return (
                            <ContentCarousel
                                key={(carousel as any).id}
                                title={(carousel as any).title}
                                contents={(carousel as any).contents}
                                onSelectContent={onSelectContent}
                                isLoggedIn={isLoggedIn}
                                myList={myList}
                                onToggleMyList={onToggleMyList}
                                isNew={(carousel as any).isNew}
                                onSeeAll={(carousel as any).categoryKey ? () => handleSeeAll((carousel as any).categoryKey) : undefined}
                                isRamadanTheme={isRamadanTheme}
                                isEidTheme={isEidTheme}
                                isCosmicTealTheme={isCosmicTealTheme}
                                isNetflixRedTheme={isNetflixRedTheme}
                                showRanking={(carousel as any).showRanking}
                            />
                        );
                    })}
                    
                    <AdPlacement ads={ads} placement="listing-bottom" isEnabled={adsEnabled} />
                </div>

                <div className="hidden lg:block w-[300px] flex-shrink-0 pt-4 pl-4 sticky top-24 h-fit">
                    <AdPlacement ads={ads} placement="listing-sidebar" isEnabled={adsEnabled} />
                </div>
            </div>
        </main>
    </div>
  );
};

export default MoviesPage;