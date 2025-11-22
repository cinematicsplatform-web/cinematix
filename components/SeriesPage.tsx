
import React, { useState, useEffect, useMemo } from 'react';
import type { Content, Category, Ad, View, SiteSettings } from '../types';
import { ContentType } from '../types';
import Hero from './Hero';
import ContentCarousel from './ContentCarousel';
import AdPlacement from './AdPlacement';

interface SeriesPageProps {
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
  siteSettings?: SiteSettings;
}

const SeriesPage: React.FC<SeriesPageProps> = ({ 
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
  isCosmicTealTheme,
  siteSettings 
}) => {
  const allSeries = useMemo(() => allContent.filter(c => c.type === ContentType.Series), [allContent]);
  
  const heroContent = useMemo(() => {
    if (pinnedContent && pinnedContent.length > 0) {
        return pinnedContent;
    }
    const sortedSeries = [...allSeries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sortedSeries.slice(0, 1);
  }, [pinnedContent, allSeries]);


  const carousels = useMemo(() => {
    const limit = (list: Content[]) => list.slice(0, 12);

    const topRatedSeries = limit([...allSeries]
      .sort((a, b) => b.rating - a.rating));

    const recentSeries = limit([...allSeries]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    const arabicSeries = limit(allSeries.filter(c => c.categories.includes('مسلسلات عربية')));
    const turkishSeries = limit(allSeries.filter(c => c.categories.includes('مسلسلات تركية')));
    const foreignSeries = limit(allSeries.filter(c => c.categories.includes('مسلسلات اجنبية')));

    const ramadanSeriesContent = limit(allSeries.filter(c => c.categories.includes('رمضان') || c.categories.includes('مسلسلات رمضان')));

    // Auto-generated (No Rank Badge)
    const topRatedCarousel = { id: 's1', title: 'الأعلى تقييماً', contents: topRatedSeries, isNew: false, categoryKey: 'top-rated-series', showRanking: false };
    
    // Top 10 Pinned (Exclusive Ranking)
    const pinnedSeriesCarousel = { 
        id: 's_pinned_top', 
        title: 'أفضل 10 مسلسلات', 
        contents: pinnedContent, 
        showRanking: true 
    };

    const ramadanTitle = (
        <div className="flex items-center gap-3">
             <div className={`w-1.5 h-6 md:h-8 rounded-full shadow-[0_0_10px_rgba(0,167,248,0.6)] ${isRamadanTheme ? 'bg-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.6)]' : 'bg-gradient-to-b from-[#00A7F8] to-[#00FFB0]'}`}></div>
             <div className="flex items-center gap-2">
                 <span>رمضان 2026</span>
                 <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f31c/512.webp" alt="moon" className="w-6 h-6 md:w-8 md:h-8" />
             </div>
        </div>
    );

    const ramadanCarousel = { id: 's_ramadan', title: ramadanTitle, contents: ramadanSeriesContent, categoryKey: 'مسلسلات رمضان' };

    let firstCarousel;
    if (siteSettings?.isShowRamadanCarousel) {
        firstCarousel = ramadanCarousel;
    } else {
        firstCarousel = topRatedCarousel;
    }

    const definedCarousels = [
      pinnedSeriesCarousel,
      firstCarousel,
      { id: 's_new', title: 'أحدث الإضافات', contents: recentSeries, isNew: true, categoryKey: 'new-series' },
      { id: 's2', title: 'مسلسلات عربية', contents: arabicSeries, isNew: false, categoryKey: 'مسلسلات عربية' },
      { id: 's3', title: 'مسلسلات تركية', contents: turkishSeries, isNew: false, categoryKey: 'مسلسلات تركية' },
      { id: 's4', title: 'مسلسلات أجنبية', contents: foreignSeries, isNew: false, categoryKey: 'مسلسلات اجنبية' },
    ].filter(carousel => carousel.contents.length > 0);

    return definedCarousels;
  }, [allSeries, siteSettings?.isShowRamadanCarousel, isRamadanTheme, pinnedContent]); 

  const handleSeeAll = (categoryKey: string) => {
      onNavigate('category', categoryKey);
  };

  const [showEmptyMessage, setShowEmptyMessage] = useState(false);
  
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (!isLoading && allSeries.length === 0) {
        timer = setTimeout(() => {
            setShowEmptyMessage(true);
        }, 750); 
    } else {
        setShowEmptyMessage(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading, allSeries.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isEidTheme ? 'border-purple-500' : isCosmicTealTheme ? 'border-[#35F18B]' : 'border-[#00A7F8]'}`}></div>
      </div>
    );
  }

  if (allSeries.length === 0) {
    if (!showEmptyMessage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
                <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isEidTheme ? 'border-purple-500' : isCosmicTealTheme ? 'border-[#35F18B]' : 'border-[#00A7F8]'}`}></div>
            </div>
        );
    }
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500 animate-fade-in-up">لا يوجد مسلسلات لعرضها حالياً.</div>
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

            <AdPlacement ads={ads} placement="series-page" isEnabled={adsEnabled} />
            
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
                isNew={carousel.isNew}
                onSeeAll={() => handleSeeAll(carousel.categoryKey)}
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

export default SeriesPage;
