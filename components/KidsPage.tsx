
import React, { useState, useEffect, useMemo } from 'react';
import type { Content, Ad, View } from '@/types';
import ContentCarousel from './ContentCarousel';
import AdPlacement from './AdPlacement';
import Hero from './Hero';
import SEO from './SEO';
import AdZone from './AdZone';

interface KidsPageProps {
  allContent: Content[];
  pinnedContent: Content[];
  top10Content?: Content[]; // Added prop
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
}

const KidsPage: React.FC<KidsPageProps> = ({ 
  allContent, 
  pinnedContent,
  top10Content, // Destructure prop
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
  isNetflixRedTheme
}) => {

  const animationContent = useMemo(() =>
    allContent.filter(c => c.categories.includes('افلام أنميشن') || c.visibility === 'kids')
  , [allContent]);
  
  // 🎯 Master Hero Logic: Ensure 5 items for Infinite Loop
  const heroContent = useMemo(() => {
    if (pinnedContent && pinnedContent.length > 0) {
        return pinnedContent;
    }
    // Fallback: Latest 5 animation content to enable slider behavior
    const sortedContent = [...animationContent].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    // Slice 5 items to enable slider behavior
    return sortedContent.slice(0, 5);
  }, [animationContent, pinnedContent]);


  const carousels = useMemo(() => {
    const limit = (list: Content[]) => list.slice(0, 12);
    
    const recentKids = limit([...animationContent]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    const allAnimationMovies = limit(animationContent.filter(c => c.categories.includes('افلام أنميشن')));

    // Top 10 Logic
    const top10Source = (top10Content && top10Content.length > 0) ? top10Content : [];
    
    const top10Carousel = { 
        id: 'k_top10', 
        title: 'أفضل 10 للأطفال', 
        contents: top10Source, 
        showRanking: true 
    };

    const definedCarousels = [
      top10Source.length > 0 ? top10Carousel : null,
      { id: 'k2', title: 'أحدث الإضافات', contents: recentKids, isNew: true, categoryKey: 'new-kids' }, 
      { id: 'k3', title: 'افلام أنميشن', contents: allAnimationMovies, isNew: false, categoryKey: 'افلام أنميشن' },
    ].filter(Boolean).filter(carousel => (carousel as any).contents.length > 0); 

    return definedCarousels;
  }, [animationContent, top10Content]); 

  const handleSeeAll = (categoryKey: string) => {
      onNavigate('category', categoryKey);
  };

  const [showEmptyMessage, setShowEmptyMessage] = useState(false);
  
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (!isLoading && animationContent.length === 0) {
        timer = setTimeout(() => {
            setShowEmptyMessage(true);
        }, 750); 
    } else {
        setShowEmptyMessage(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading, animationContent.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isEidTheme ? 'border-purple-500' : isCosmicTealTheme ? 'border-[#35F18B]' : isNetflixRedTheme ? 'border-[#E50914]' : 'border-[#00A7F8]'}`}></div>
      </div>
    );
  }

  if (animationContent.length === 0) {
    if (!showEmptyMessage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
                <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isEidTheme ? 'border-purple-500' : isCosmicTealTheme ? 'border-[#35F18B]' : isNetflixRedTheme ? 'border-[#E50914]' : 'border-[#00A7F8]'}`}></div>
            </div>
        );
    }
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500 animate-fade-in-up">لا يوجد محتوى أطفال حالياً.</div>
  }

  return (
    // CRITICAL FIX: Clean Container Structure - Absolutely NO overflow-x-hidden here to allow sticky/drag gestures
    <div className="relative min-h-screen bg-[var(--bg-body)] text-white"> 

      <SEO 
        title="أطفال - سينماتيكس" 
        description="عالم من المرح والتعليم، أفلام كرتون ومسلسلات أنميشن للأطفال."
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
        
        {adsEnabled && <AdZone position="page_kids_top" />}

        <AdPlacement ads={ads} placement="kids-top" isEnabled={adsEnabled} />

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
        
        <AdPlacement ads={ads} placement="kids-bottom" isEnabled={adsEnabled} />
      </main>
    </div>
  );
};

export default KidsPage;
