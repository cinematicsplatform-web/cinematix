import React, { useState, useEffect, useMemo } from 'react';
import type { Content, Ad, View } from '../types';
import ContentCarousel from './ContentCarousel';
import AdPlacement from './AdPlacement';
import Hero from './Hero';

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
  isRamadanTheme?: boolean; // Added prop
}

const KidsPage: React.FC<KidsPageProps> = ({ 
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
  isRamadanTheme
}) => {

  // 1. Main Filter: Animation or Kids Content
  const animationContent = useMemo(() =>
    allContent.filter(c => c.categories.includes('افلام أنميشن') || c.visibility === 'kids')
  , [allContent]);
  
  // 🎯 2. Hero Content Logic
  const heroContent = useMemo(() => {
    if (pinnedContent && pinnedContent.length > 0) {
        return pinnedContent;
    }
    // Fallback: Latest 1
    const sortedContent = [...animationContent].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sortedContent.slice(0, 1);
  }, [pinnedContent, animationContent]);


  // 3. Build Carousels
  const carousels = useMemo(() => {
    const limit = (list: Content[]) => list.slice(0, 12);
    
    const topRatedKids = limit([...animationContent]
      .sort((a, b) => b.rating - a.rating));

    const recentKids = limit([...animationContent]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    const allAnimationMovies = limit(animationContent.filter(c => c.categories.includes('افلام أنميشن')));

    const definedCarousels = [
      { id: 'k1', title: 'الأعلى تقييماً', contents: topRatedKids, isNew: false, categoryKey: 'top-rated-kids' },
      { id: 'k2', title: 'أحدث الإضافات', contents: recentKids, isNew: true, categoryKey: 'new-kids' }, 
      { id: 'k3', title: 'افلام أنميشن', contents: allAnimationMovies, isNew: false, categoryKey: 'افلام أنميشن' },
    ].filter(carousel => carousel.contents.length > 0); 

    return definedCarousels;
  }, [animationContent]); 

  const handleSeeAll = (categoryKey: string) => {
      onNavigate('category', categoryKey);
  };

  // --- Buffer Logic for Empty State ---
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A7F8]"></div>
      </div>
    );
  }

  if (animationContent.length === 0) {
    if (!showEmptyMessage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A7F8]"></div>
            </div>
        );
    }
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500 animate-fade-in-up">لا يوجد محتوى أطفال حالياً.</div>
  }

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white animate-fade-in-up relative overflow-x-hidden"> 

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
              isNew={carousel.isNew}
              onSeeAll={() => handleSeeAll(carousel.categoryKey)} 
              isRamadanTheme={isRamadanTheme}
            />
          );
        })}
        
        <AdPlacement ads={ads} placement="kids-bottom" isEnabled={adsEnabled} />
      </main>
    </div>
  );
};

export default KidsPage;