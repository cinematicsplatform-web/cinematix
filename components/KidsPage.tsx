
import React, { useState, useEffect, useMemo } from 'react';
import type { Content, Ad, View } from '../types';
import ContentCarousel from './ContentCarousel';
import AdPlacement from './AdPlacement';
import Hero from './Hero';
import SEO from './SEO';

interface KidsPageProps {
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

const KidsPage: React.FC<KidsPageProps> = ({ 
  allContent, 
  // pinnedContent, // unused to remove "Our Choice" logic
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

  const animationContent = useMemo(() =>
    allContent.filter(c => c.categories.includes('افلام أنميشن') || c.visibility === 'kids')
  , [allContent]);
  
  const heroContent = useMemo(() => {
    // Removed Pinned Content logic ("Our Choice") as requested
    const sortedContent = [...animationContent].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    // Updated to slice 5 items to enable slider behavior
    return sortedContent.slice(0, 5);
  }, [animationContent]);


  const carousels = useMemo(() => {
    const limit = (list: Content[]) => list.slice(0, 12);
    
    const recentKids = limit([...animationContent]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    const allAnimationMovies = limit(animationContent.filter(c => c.categories.includes('افلام أنميشن')));

    const definedCarousels = [
      { id: 'k2', title: 'أحدث الإضافات', contents: recentKids, isNew: true, categoryKey: 'new-kids' }, 
      { id: 'k3', title: 'افلام أنميشن', contents: allAnimationMovies, isNew: false, categoryKey: 'افلام أنميشن' },
    ].filter(carousel => carousel.contents.length > 0); 

    return definedCarousels;
  }, [animationContent]); 

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
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isEidTheme ? 'border-purple-500' : isCosmicTealTheme ? 'border-[#35F18B]' : 'border-[#00A7F8]'}`}></div>
      </div>
    );
  }

  if (animationContent.length === 0) {
    if (!showEmptyMessage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
                <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isEidTheme ? 'border-purple-500' : isCosmicTealTheme ? 'border-[#35F18B]' : 'border-[#00A7F8]'}`}></div>
            </div>
        );
    }
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500 animate-fade-in-up">لا يوجد محتوى أطفال حالياً.</div>
  }

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white animate-fade-in-up relative overflow-x-hidden"> 

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

        <AdPlacement ads={ads} placement="kids-top" isEnabled={adsEnabled} />

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
        
        <AdPlacement ads={ads} placement="kids-bottom" isEnabled={adsEnabled} />
      </main>
    </div>
  );
};

export default KidsPage;
