import React, { useState, useEffect, useMemo } from 'react';
import type { Content, Category, Ad, View } from '../types';
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
  isRamadanTheme?: boolean; // Added prop
}

const SeriesPage: React.FC<SeriesPageProps> = ({ allContent, pinnedContent, onSelectContent, isLoggedIn, myList, onToggleMyList, ads, adsEnabled, onNavigate, isLoading, isRamadanTheme }) => {
  // 1. Filter all Series
  const allSeries = useMemo(() => allContent.filter(c => c.type === ContentType.Series), [allContent]);
  
  // 🎯 2. Hero Section Logic
  const heroContent = useMemo(() => {
    if (pinnedContent && pinnedContent.length > 0) {
        return pinnedContent;
    }
    // Fallback: Latest 1 series only
    const sortedSeries = [...allSeries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sortedSeries.slice(0, 1);
  }, [pinnedContent, allSeries]);


  // 3. Build Carousels
  const carousels = useMemo(() => {
    
    const limit = (list: Content[]) => list.slice(0, 12);

    // 1. Top Rated
    const topRatedSeries = limit([...allSeries]
      .sort((a, b) => b.rating - a.rating));

    // 2. Recently Added
    const recentSeries = limit([...allSeries]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    const arabicSeries = limit(allSeries.filter(c => c.categories.includes('مسلسلات عربية')));
    const turkishSeries = limit(allSeries.filter(c => c.categories.includes('مسلسلات تركية')));
    const foreignSeries = limit(allSeries.filter(c => c.categories.includes('مسلسلات اجنبية')));

    // Final List
    const definedCarousels = [
      { id: 's1', title: 'الأعلى تقييماً', contents: topRatedSeries, isNew: false, categoryKey: 'top-rated-series' },
      { id: 's_new', title: 'أحدث الإضافات', contents: recentSeries, isNew: true, categoryKey: 'new-series' },
      { id: 's2', title: 'مسلسلات عربية', contents: arabicSeries, isNew: false, categoryKey: 'مسلسلات عربية' },
      { id: 's3', title: 'مسلسلات تركية', contents: turkishSeries, isNew: false, categoryKey: 'مسلسلات تركية' },
      { id: 's4', title: 'مسلسلات أجنبية', contents: foreignSeries, isNew: false, categoryKey: 'مسلسلات اجنبية' },
    ].filter(carousel => carousel.contents.length > 0);

    return definedCarousels;
  }, [allSeries]); 

  const handleSeeAll = (categoryKey: string) => {
      onNavigate('category', categoryKey);
  };

  // --- Buffer Logic for Empty State ---
  const [showEmptyMessage, setShowEmptyMessage] = useState(false);
  
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (!isLoading && allSeries.length === 0) {
        timer = setTimeout(() => {
            setShowEmptyMessage(true);
        }, 750); // 750ms buffer
    } else {
        setShowEmptyMessage(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading, allSeries.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A7F8]"></div>
      </div>
    );
  }

  if (allSeries.length === 0) {
    if (!showEmptyMessage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A7F8]"></div>
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
            />
        </div>

        {/* NO Page Padding here. Components handle it internally. */}
        <main className="pb-24 z-30 relative bg-[var(--bg-body)]">
            {/* Horizontal Divider - Themed */}
            <div className={`w-full h-px mt-0 mb-2 md:my-4 ${isRamadanTheme ? 'bg-gradient-to-r from-transparent via-[#FFD700]/50 to-transparent opacity-80' : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'}`}></div>

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
                />
            );
            })}
        </main>
    </div>
  );
};

export default SeriesPage;