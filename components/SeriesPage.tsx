import React, { useState, useEffect, useMemo } from 'react';
import type { Content, Category, Ad, View, SiteSettings } from '@/types';
import { ContentType } from '@/types';
import Hero from './Hero';
import ContentCarousel from './ContentCarousel';
import AdPlacement from './AdPlacement';
import SEO from './SEO';
import AdZone from './AdZone';
import { LoadingDots } from '../App';

interface SeriesPageProps {
  allContent: Content[];
  pinnedContent: Content[];
  top10Content?: Content[]; // Added to fix build error
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

const SeriesPage: React.FC<SeriesPageProps> = ({ 
  allContent, 
  pinnedContent,
  top10Content, // Destructured here
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
  
  // Filter for Series Type
  const allSeries = useMemo(() => allContent.filter(c => c.type === ContentType.Series), [allContent]);
  
  // 🎯 Master Hero Logic: Ensure 5 items for Infinite Loop
  const heroContent = useMemo(() => {
    // If pinned content exists for this page, use it
    if (pinnedContent && pinnedContent.length > 0) {
        return pinnedContent;
    }
    // Fallback: Latest 5 series sorted by createdAt (Newest First)
    const sortedSeries = [...allSeries].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    // Slice 5 items to enable slider behavior
    return sortedSeries.slice(0, 5);
  }, [pinnedContent, allSeries]);


  const carousels = useMemo(() => {
    const limit = (list: Content[]) => list.slice(0, 12);

    const recentSeries = limit([...allSeries]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()));

    const arabicSeries = limit(allSeries.filter(c => c.categories.includes('مسلسلات عربية')));
    const turkishSeries = limit(allSeries.filter(c => c.categories.includes('مسلسلات تركية')));
    const foreignSeries = limit(allSeries.filter(c => c.categories.includes('مسلسلات اجنبية')));

    const ramadanSeriesContent = limit(allSeries.filter(c => c.categories.includes('رمضان') || c.categories.includes('مسلسلات رمضان')));

    // Top 10 Pinned (Exclusive Ranking)
    // Use top10Content if available, otherwise fallback to pinnedContent
    const top10Source = (top10Content && top10Content.length > 0) ? top10Content : pinnedContent;

    const pinnedSeriesCarousel = { 
        id: 's_pinned_top', 
        title: 'أفضل 10 مسلسلات', 
        contents: top10Source, 
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

    const definedCarousels = [
      // Conditionally include Top 10
      siteSettings?.showTop10Series ? pinnedSeriesCarousel : null,
      siteSettings?.isShowRamadanCarousel ? ramadanCarousel : null,
      { id: 's_new', title: 'أحدث الإضافات', contents: recentSeries, isNew: true, categoryKey: 'new-series' },
      { id: 's2', title: 'مسلسلات عربية', contents: arabicSeries, isNew: false, categoryKey: 'مسلسلات عربية' },
      { id: 's3', title: 'مسلسلات تركية', contents: turkishSeries, isNew: false, categoryKey: 'مسلسلات تركية' },
      { id: 's4', title: 'مسلسلات أجنبية', contents: foreignSeries, isNew: false, categoryKey: 'مسلسلات اجنبية' },
    ]
    .filter(Boolean)
    .filter(carousel => (carousel as any).contents.length > 0);

    return definedCarousels;
  }, [allSeries, siteSettings?.isShowRamadanCarousel, siteSettings?.showTop10Series, isRamadanTheme, pinnedContent, top10Content]); 

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

  const currentTheme = isRamadanTheme ? 'ramadan' : isEidTheme ? 'eid' : isCosmicTealTheme ? 'cosmic-teal' : isNetflixRedTheme ? 'netflix-red' : 'default';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
        <LoadingDots theme={currentTheme} />
      </div>
    );
  }

  if (allSeries.length === 0) {
    if (!showEmptyMessage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
                <LoadingDots theme={currentTheme} />
            </div>
        );
    }
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500 animate-fade-in-up">لا يوجد مسلسلات لعرضها حالياً.</div>
  }

  return (
    // CRITICAL FIX: Clean Container Structure - Absolutely NO overflow-x-hidden here to allow sticky/drag gestures
    <div className="relative min-h-screen bg-[var(--bg-body)]">
        
        <SEO 
            title="مسلسلات" 
            description="تصفح أحدث المسلسلات العربية والتركية والأجنبية بجودة عالية على سينماتيكس."
            type="website"
        />

        {/* Wrapped Hero in z-10 for consistent stacking */}
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
                    {adsEnabled && <AdZone position="page_series_top" />}
                    <AdPlacement ads={ads} placement="listing-top" isEnabled={adsEnabled} />
                    <AdPlacement ads={ads} placement="series-page" isEnabled={adsEnabled} />
                    
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

export default SeriesPage;