import React, { useState, useEffect, useMemo } from 'react';
import type { Content, Category, Ad, View } from '../types';
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
  isRamadanTheme?: boolean; // Added prop
}

const MoviesPage: React.FC<MoviesPageProps> = ({ allContent, pinnedContent, onSelectContent, isLoggedIn, myList, onToggleMyList, ads, adsEnabled, onNavigate, isLoading, isRamadanTheme }) => {
  // 1. Filter all Movies
  const allMovies = useMemo(() => allContent.filter(c => c.type === ContentType.Movie), [allContent]);
  
  // 🎯 2. Hero Section Logic:
  const heroContent = useMemo(() => {
    if (pinnedContent && pinnedContent.length > 0) {
        return pinnedContent;
    }
    // Fallback: Latest 1 movie only
    const sortedMovies = [...allMovies].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sortedMovies.slice(0, 1);
  }, [pinnedContent, allMovies]);


  const carousels = useMemo(() => {
    
    // Helper to limit to 12
    const limit = (list: Content[]) => list.slice(0, 12);

    // 1. Top Rated
    const topRatedMovies = limit([...allMovies]
      .sort((a, b) => b.rating - a.rating));

    // 2. Recently Added
    const recentMovies = limit([...allMovies]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    const arabicMovies = limit(allMovies.filter(c => c.categories.includes('افلام عربية'))); 
    const turkishMovies = limit(allMovies.filter(c => c.categories.includes('افلام تركية'))); 
    const foreignMovies = limit(allMovies.filter(c => c.categories.includes('افلام اجنبية'))); 
    const indianMovies = limit(allMovies.filter(c => c.categories.includes('افلام هندية'))); 
    const animationMovies = limit(allMovies.filter(c => c.categories.includes('افلام أنميشن'))); 

    const definedCarousels = [
      { id: 'm1', title: 'الأعلى تقييماً', contents: topRatedMovies, isNew: false, categoryKey: 'top-rated-movies' },
      { id: 'm_new', title: 'أحدث الإضافات', contents: recentMovies, isNew: true, categoryKey: 'new-movies' },
      { id: 'm2', title: 'افلام عربية', contents: arabicMovies, isNew: false, categoryKey: 'افلام عربية' },
      { id: 'm3', title: 'افلام تركية', contents: turkishMovies, isNew: false, categoryKey: 'افلام تركية' },
      { id: 'm4', title: 'افلام اجنبية', contents: foreignMovies, isNew: false, categoryKey: 'افلام اجنبية' },
      { id: 'm5', title: 'افلام هندية', contents: indianMovies, isNew: false, categoryKey: 'افلام هندية' },
      { id: 'm6', title: 'افلام أنميشن', contents: animationMovies, isNew: false, categoryKey: 'افلام أنميشن' },
    ].filter(carousel => carousel.contents.length > 0); 

    return definedCarousels;
  }, [allMovies]); 

  const handleSeeAll = (categoryKey: string) => {
      onNavigate('category', categoryKey);
  };

  // --- Buffer Logic for Empty State ---
  const [showEmptyMessage, setShowEmptyMessage] = useState(false);
  
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    // If not loading but list is empty, wait a bit before showing "No Content"
    if (!isLoading && allMovies.length === 0) {
        timer = setTimeout(() => {
            setShowEmptyMessage(true);
        }, 750); // 750ms buffer
    } else {
        setShowEmptyMessage(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading, allMovies.length]);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A7F8]"></div>
      </div>
    );
  }

  if (allMovies.length === 0) {
    // If strictly empty but buffer hasn't passed, keep showing loader
    if (!showEmptyMessage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A7F8]"></div>
            </div>
        );
    }
    // Show message only after buffer
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500 animate-fade-in-up">لا توجد افلام لعرضها حالياً.</div> 
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

export default MoviesPage;