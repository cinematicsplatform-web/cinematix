
import React, { useMemo } from 'react';
import type { Content, Category, Ad, SiteSettings, View } from '../types';
import { ContentType } from '../types'; 
import Hero from './Hero';
import ContentCarousel from './ContentCarousel';
import AdPlacement from './AdPlacement';
import ShoutBarComponent from './ShoutBar';
import SEO from './SEO';

interface HomePageProps {
  allContent: Content[];
  pinnedContent: Content[];
  onSelectContent: (content: Content) => void;
  isLoggedIn: boolean;
  myList?: string[];
  onToggleMyList: (contentId: string) => void;
  ads: Ad[];
  siteSettings: SiteSettings;
  // New props for navigation
  onNavigate: (view: View, category?: string) => void;
  // New prop for loading state management
  isLoading?: boolean;
  // Theme Props
  isRamadanTheme?: boolean;
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
}

const HomePage: React.FC<HomePageProps> = (props) => {

  // 1. Priority: Loading State
  if (props.isLoading) {
      return <div className="min-h-screen bg-[var(--bg-body)]" />;
  }

  // Themes are passed from parent now, or fallbacks calculated here if needed (but prefer props)
  const isRamadan = props.isRamadanTheme ?? props.siteSettings.isRamadanModeEnabled;
  const isEid = props.isEidTheme ?? props.siteSettings.activeTheme === 'eid';
  const isCosmicTeal = props.isCosmicTealTheme ?? props.siteSettings.activeTheme === 'cosmic-teal';

  // 🎯 Hero Content Logic:
  const heroContent = useMemo(() => {
    if (props.pinnedContent && props.pinnedContent.length > 0) {
      return props.pinnedContent;
    }
    return [...props.allContent]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [props.pinnedContent, props.allContent]);


  const carousels = useMemo(() => {
    
    // Helper to sort by date and limit to 12 items for Home Page performance
    const getLatest = (list: Content[]) => {
        return list
            .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
            .slice(0, 12);
    };

    const topRated = [...props.allContent]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 12);

    const recentAdditions = getLatest([...props.allContent]);

    const arabicSeries = getLatest(props.allContent.filter(c => c.type === ContentType.Series && c.categories.includes('مسلسلات عربية')));
    const turkishSeries = getLatest(props.allContent.filter(c => c.type === ContentType.Series && c.categories.includes('مسلسلات تركية')));
    const foreignSeries = getLatest(props.allContent.filter(c => c.type === ContentType.Series && c.categories.includes('مسلسلات اجنبية')));

    const arabicMovies = getLatest(props.allContent.filter(c => c.type === ContentType.Movie && c.categories.includes('افلام عربية')));
    const turkishMovies = getLatest(props.allContent.filter(c => c.type === ContentType.Movie && c.categories.includes('افلام تركية')));
    const foreignMovies = getLatest(props.allContent.filter(c => c.type === ContentType.Movie && c.categories.includes('افلام اجنبية')));
    const indianMovies = getLatest(props.allContent.filter(c => c.type === ContentType.Movie && c.categories.includes('افلام هندية')));

    const animationMovies = getLatest(props.allContent.filter(c => c.type === ContentType.Movie && c.categories.includes('افلام أنميشن')));
    const tvPrograms = getLatest(props.allContent.filter(c => c.categories.includes('برامج تلفزيونية')));
    const ramadanContent = getLatest(props.allContent.filter(c => c.categories.includes('رمضان')));

    // Base Carousels
    const newArrivals = { id: 'h2', title: 'أحدث الإضافات', contents: recentAdditions, isNew: true, categoryKey: 'new-content' }; 
    
    // Custom Title for Animation with Chick Emoji
    const animationTitle = (
        <div className="flex items-center gap-3">
             <div className={`w-1.5 h-6 md:h-8 rounded-full shadow-[0_0_10px_rgba(0,167,248,0.6)] ${isRamadan ? 'bg-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.6)]' : isCosmicTeal ? 'bg-gradient-to-b from-[#35F18B] to-[#2596be] shadow-[0_0_15px_rgba(53,241,139,0.6)]' : 'bg-gradient-to-b from-[#00A7F8] to-[#00FFB0]'}`}></div>
             <div className="flex items-center gap-2">
                 <span>افلام أنميشن</span>
                 <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f423/512.webp" alt="chick" className="w-6 h-6 md:w-8 md:h-8" />
             </div>
        </div>
    );
    
    // Custom Title for Ramadan with Moon Emoji
    const ramadanTitle = (
        <div className="flex items-center gap-3">
             <div className={`w-1.5 h-6 md:h-8 rounded-full shadow-[0_0_10px_rgba(0,167,248,0.6)] ${isRamadan ? 'bg-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.6)]' : 'bg-gradient-to-b from-[#00A7F8] to-[#00FFB0]'}`}></div>
             <div className="flex items-center gap-2">
                 <span>رمضان 2026</span>
                 <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f31c/512.webp" alt="moon" className="w-6 h-6 md:w-8 md:h-8" />
             </div>
        </div>
    );

    const restCarousels = [
      { id: 'h3', title: 'مسلسلات عربية', contents: arabicSeries, categoryKey: 'مسلسلات عربية' },
      { id: 'h4', title: 'مسلسلات تركية', contents: turkishSeries, categoryKey: 'مسلسلات تركية' },
      { id: 'h5', title: 'مسلسلات أجنبية', contents: foreignSeries, categoryKey: 'مسلسلات اجنبية' },
      { id: 'h6', title: 'افلام عربية', contents: arabicMovies, categoryKey: 'افلام عربية' },
      { id: 'h7', title: 'افلام تركية', contents: turkishMovies, categoryKey: 'افلام تركية' },
      { id: 'h8', title: 'أفلام أجنبية', contents: foreignMovies, categoryKey: 'افلام اجنبية' },
      { id: 'h9', title: 'افلام هندية', contents: indianMovies, categoryKey: 'افلام هندية' },
      { id: 'h10', title: animationTitle, contents: animationMovies, specialRoute: 'kids' },
      { id: 'h11', title: 'البرامج التلفزيونية', contents: tvPrograms, categoryKey: 'برامج تلفزيونية' },
    ];

    // UPDATED: Rank Logic - Exclusive to Pinned Items
    // 1. Auto-generated "Top Rated" -> No Ranking Badges
    const topRatedCarousel = { id: 'h1', title: 'الأعلى تقييماً', contents: topRated, isNew: false, categoryKey: 'top-rated-content', showRanking: false };
    
    // 2. Pinned Items -> Show Ranking Badges (TOP 1-10)
    const pinnedCarousel = { 
        id: 'h_pinned_top', 
        title: 'أفضل 10 أعمال', 
        contents: props.pinnedContent, 
        showRanking: true // Exclusive here
    };

    // Standard UI Title for Ramadan with Moon Icon
    const ramadanCarousel = { id: 'h_ramadan', title: ramadanTitle, contents: ramadanContent, specialRoute: 'ramadan' };

    let finalList = [];

    // Logic: If Pinned Content exists, it is the "TOP 10" list.
    if (pinnedCarousel.contents.length > 0) {
        finalList.push(pinnedCarousel);
    }

    // Conditional Logic: Show Ramadan Carousel OR Top Rated Carousel based on settings
    if (props.siteSettings.isShowRamadanCarousel) {
        finalList.push(ramadanCarousel);
    } else {
        finalList.push(topRatedCarousel);
    }

    finalList.push(newArrivals);
    finalList.push(...restCarousels);

    return finalList.filter(carousel => carousel.contents.length > 0);
  }, [props.allContent, props.pinnedContent, props.siteSettings.isShowRamadanCarousel, isRamadan, isCosmicTeal]);

  const handleSeeAll = (carousel: any) => {
      if (carousel.specialRoute) {
          props.onNavigate(carousel.specialRoute as View);
      } else if (carousel.categoryKey) {
          props.onNavigate('category', carousel.categoryKey);
      } else {
          props.onNavigate('movies'); 
      }
  };

  if (props.allContent.length === 0) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-body)] text-gray-500 animate-fade-in-up">
              <p className="text-xl font-bold">لا يوجد محتوى في الموقع</p>
              <p className="text-sm mt-2">يرجى إضافة محتوى من لوحة التحكم</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-body)] relative overflow-x-hidden">
        
        <SEO /> {/* Standard Home Page SEO */}

        <div className="relative z-10">
             <Hero 
                contents={heroContent} 
                onWatchNow={props.onSelectContent}
                isLoggedIn={props.isLoggedIn}
                myList={props.myList}
                onToggleMyList={props.onToggleMyList}
                autoSlideInterval={5000}
                isRamadanTheme={isRamadan}
                isEidTheme={isEid}
                isCosmicTealTheme={isCosmicTeal}
            />
        </div>

        <main className="pb-24 z-30 relative bg-[var(--bg-body)]">
          <div className={`w-full h-px mt-0 mb-2 md:my-4 
            ${isRamadan 
                ? 'bg-gradient-to-r from-transparent via-[#FFD700]/50 to-transparent opacity-80' 
                : isEid 
                    ? 'bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-80' 
                    : isCosmicTeal
                        ? 'bg-gradient-to-r from-transparent via-[#35F18B]/50 to-transparent opacity-80'
                        : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'
            }`}></div>
          
          <div className="pt-2">
            {props.siteSettings.shoutBar.isVisible && (
                <div className="px-4 md:px-12 lg:px-16">
                    <ShoutBarComponent 
                        text={props.siteSettings.shoutBar.text} 
                        isRamadanTheme={isRamadan}
                        isEidTheme={isEid}
                        isCosmicTealTheme={isCosmicTeal}
                    />
                </div>
            )}
            
            <AdPlacement ads={props.ads} placement="home-below-hero" isEnabled={props.siteSettings.adsEnabled}/>
            <AdPlacement ads={props.ads} placement="home-top" isEnabled={props.siteSettings.adsEnabled}/>

            {carousels.map((carousel, index) => {
              const middleAd = index === Math.floor(carousels.length / 2) && (
                  <AdPlacement ads={props.ads} placement="home-middle" isEnabled={props.siteSettings.adsEnabled}/>
              );
              const specificAd = index === 2 && (
                  <AdPlacement ads={props.ads} placement="home-carousel-3-4" isEnabled={props.siteSettings.adsEnabled}/>
              );

              return (
                  <React.Fragment key={carousel.id}>
                      <ContentCarousel
                        title={carousel.title}
                        contents={carousel.contents} 
                        onSelectContent={props.onSelectContent}
                        isNew={carousel.isNew}
                        isLoggedIn={props.isLoggedIn}
                        myList={props.myList}
                        onToggleMyList={props.onToggleMyList}
                        onSeeAll={ (carousel.categoryKey || carousel.specialRoute) ? () => handleSeeAll(carousel) : undefined}
                        isRamadanTheme={isRamadan}
                        isEidTheme={isEid}
                        isCosmicTealTheme={isCosmicTeal}
                        showRanking={(carousel as any).showRanking} // Only true for Pinned Carousel
                      />
                      {specificAd}
                      {middleAd}
                  </React.Fragment>
              )
            })}
          </div>
        </main>
    </div>
  );
};

export default HomePage;
