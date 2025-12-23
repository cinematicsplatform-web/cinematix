import React, { useMemo, useState, useCallback, useEffect } from 'react';
import type { Content, Ad, View } from '@/types';
import Hero from './Hero';
import ContentCarousel from './ContentCarousel';
import AdPlacement from './AdPlacement';
import SEO from './SEO';
import { LoadingDots } from '../App';

interface SoonPageProps {
  allContent: Content[];
  pinnedContent: Content[];
  onSelectContent: (content: Content) => void;
  isLoggedIn: boolean;
  myList?: string[];
  onToggleMyList: (contentId: string) => void;
  ads: Ad[];
  adsEnabled: boolean;
  isLoading?: boolean;
  isRamadanTheme?: boolean; 
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
  isNetflixRedTheme?: boolean;
  onNavigate?: (view: View, category?: string) => void;
}

const SoonPage: React.FC<SoonPageProps> = ({ 
  allContent, 
  pinnedContent, 
  onSelectContent, 
  isLoggedIn, 
  myList, 
  onToggleMyList, 
  ads, 
  adsEnabled, 
  isLoading, 
  isRamadanTheme, 
  isEidTheme, 
  isCosmicTealTheme, 
  isNetflixRedTheme 
}) => {
  
  const { allSoonContent, soonAndRamadan, soonOnly } = useMemo(() => {
    const allSoon = allContent.filter(c => c.categories.includes('قريباً'));
    const soonAndRamadan = allSoon.filter(c => c.categories.includes('رمضان'));
    const soonOnly = allSoon.filter(c => !c.categories.includes('رمضان'));
    
    return { allSoonContent: allSoon, soonAndRamadan, soonOnly };
  }, [allContent]);
  
  // 🎯 Master Hero Logic: Ensure 5 items for Infinite Loop
  const heroSoonContents = useMemo(() => {
    if (pinnedContent && pinnedContent.length > 0) {
        return pinnedContent;
    }
    // Fallback: Latest 5 sorted by date
    const sortedContent = [...allSoonContent].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    // Slice 5 items to enable slider behavior
    return sortedContent.slice(0, 5);
  }, [pinnedContent, allSoonContent]);


  const carousels = useMemo(() => {
    const sortedSoonRamadan = [...soonAndRamadan].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const sortedSoonOnly = [...soonOnly].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const definedCarousels = [
      { id: 's1', title: 'قريباً في رمضان', contents: sortedSoonRamadan, isRestricted: false },
      { id: 's2', title: 'قريباً', contents: sortedSoonOnly, isRestricted: false }, 
    ].filter(carousel => carousel.contents.length > 0);

    return definedCarousels;
  }, [soonAndRamadan, soonOnly]);

  const [showEmptyMessage, setShowEmptyMessage] = useState(false);
  
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (!isLoading && allSoonContent.length === 0) {
        timer = setTimeout(() => {
            setShowEmptyMessage(true);
        }, 750);
    } else {
        setShowEmptyMessage(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading, allSoonContent.length]);

  const currentTheme = isRamadanTheme ? 'ramadan' : isEidTheme ? 'eid' : isCosmicTealTheme ? 'cosmic-teal' : isNetflixRedTheme ? 'netflix-red' : 'default';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
        <LoadingDots theme={currentTheme} />
      </div>
    );
  }
  
  if (allSoonContent.length === 0) {
    if (!showEmptyMessage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
                <LoadingDots theme={currentTheme} />
            </div>
        );
    }
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500 animate-fade-in-up">لا يوجد محتوى قادم لعرضها حالياً.</div>
  }


  return (
    // CRITICAL FIX: Clean Container Structure - Absolutely NO overflow-x-hidden here to allow sticky/drag gestures
    <div className="relative min-h-screen bg-[var(--bg-body)]">

      <SEO 
        title="قريباً - سينماتيكس" 
        description="تعرف على أحدث الإصدارات القادمة من الأفلام والمسلسلات على سينماتيكس."
        type="website"
      />

      <div className="relative z-10">
        <Hero 
            contents={heroSoonContents} 
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
      
      <main className="relative z-30 pb-24 text-right bg-[var(--bg-body)]">
        <div className={`w-full h-px mt-0 mb-2 md:my-4 
            ${isRamadanTheme 
                ? 'bg-gradient-to-r from-transparent via-[#FFD700]/50 to-transparent opacity-80' 
                : isCosmicTealTheme
                    ? 'bg-gradient-to-r from-transparent via-[#35F18B]/50 to-transparent opacity-80'
                    : isNetflixRedTheme
                        ? 'bg-gradient-to-r from-transparent via-[#E50914]/50 to-transparent opacity-80'
                        : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'
            }`}></div>

        <AdPlacement ads={ads} placement="soon-page-top" isEnabled={adsEnabled} />
        
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
                isRamadanTheme={isRamadanTheme}
                isEidTheme={isEidTheme}
                isCosmicTealTheme={isCosmicTealTheme}
                isNetflixRedTheme={isNetflixRedTheme}
                />
            );
        })}
        
        <AdPlacement ads={ads} placement="soon-page-bottom" isEnabled={adsEnabled} />
      </main>
    </div>
  );
};

export default SoonPage;