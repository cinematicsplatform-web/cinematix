
import React, { useMemo } from 'react';
import type { Content, Category, Ad, SiteSettings, View } from '../types';
import { ContentType } from '../types'; 
import Hero from './Hero';
import ContentCarousel from './ContentCarousel';
import AdPlacement from './AdPlacement';
import ShoutBarComponent from './ShoutBar';

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
}

const HomePage: React.FC<HomePageProps> = (props) => {

  // 🎯 Hero Content Logic:
  // 1. Priority: Manually pinned content for 'home'
  // 2. Fallback: Latest 5 added items
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
    // UPDATED: Route Latest Additions to 'new-content' to show both movies and series
    const newArrivals = { id: 'h2', title: 'أحدث الإضافات', contents: recentAdditions, isNew: true, categoryKey: 'new-content' }; 
    
    // Custom Title for Animation with Chick Emoji
    const animationTitle = (
        <div className="flex items-center gap-3">
             <div className={`w-1.5 h-6 md:h-8 rounded-full shadow-[0_0_10px_rgba(0,167,248,0.6)] ${props.siteSettings.isRamadanModeEnabled ? 'bg-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.6)]' : 'bg-gradient-to-b from-[#00A7F8] to-[#00FFB0]'}`}></div>
             <div className="flex items-center gap-2">
                 <span>افلام أنميشن</span>
                 <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f423/512.webp" alt="chick" className="w-6 h-6 md:w-8 md:h-8" />
             </div>
        </div>
    );
    
    // Custom Title for Ramadan with Moon Emoji
    const ramadanTitle = (
        <div className="flex items-center gap-3">
             <div className={`w-1.5 h-6 md:h-8 rounded-full shadow-[0_0_10px_rgba(0,167,248,0.6)] ${props.siteSettings.isRamadanModeEnabled ? 'bg-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.6)]' : 'bg-gradient-to-b from-[#00A7F8] to-[#00FFB0]'}`}></div>
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

    // UPDATED: Route Top Rated to 'top-rated-content' to show both movies and series
    const topRatedCarousel = { id: 'h1', title: 'الأعلى تقييماً', contents: topRated, isNew: false, categoryKey: 'top-rated-content' };
    
    // Standard UI Title for Ramadan with Moon Icon
    const ramadanCarousel = { id: 'h_ramadan', title: ramadanTitle, contents: ramadanContent, specialRoute: 'ramadan' };

    let finalList = [];

    // Conditional Logic: Show Ramadan Carousel OR Top Rated Carousel based on settings
    if (props.siteSettings.isShowRamadanCarousel) {
        finalList.push(ramadanCarousel);
    } else {
        finalList.push(topRatedCarousel);
    }

    finalList.push(newArrivals);
    finalList.push(...restCarousels);

    return finalList.filter(carousel => carousel.contents.length > 0);
  }, [props.allContent, props.siteSettings.isShowRamadanCarousel, props.siteSettings.isRamadanModeEnabled]);

  const handleSeeAll = (carousel: any) => {
      if (carousel.specialRoute) {
          props.onNavigate(carousel.specialRoute as View);
      } else if (carousel.categoryKey) {
          props.onNavigate('category', carousel.categoryKey);
      } else {
          // Default fallback if no specific route defined
          props.onNavigate('movies'); 
      }
  };

  const isRamadan = props.siteSettings.isRamadanModeEnabled;

  return (
    <div className="min-h-screen bg-[var(--bg-body)] relative overflow-x-hidden">
        
        <div className="relative z-10">
             <Hero 
                contents={heroContent} 
                onWatchNow={props.onSelectContent}
                isLoggedIn={props.isLoggedIn}
                myList={props.myList}
                onToggleMyList={props.onToggleMyList}
                autoSlideInterval={5000}
                isRamadanTheme={isRamadan}
            />
        </div>

        {/* NO Page Padding here. Padding is inside components (Carousel, AdPlacement) */}
        <main className="pb-24 z-30 relative bg-[var(--bg-body)]">
          {/* Horizontal Divider - Themed */}
          <div className={`w-full h-px mt-0 mb-2 md:my-4 ${isRamadan ? 'bg-gradient-to-r from-transparent via-[#FFD700]/50 to-transparent opacity-80' : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'}`}></div>
          
          <div className="pt-2">
            {props.siteSettings.shoutBar.isVisible && (
                <div className="px-4 md:px-12 lg:px-16">
                    <ShoutBarComponent 
                        text={props.siteSettings.shoutBar.text} 
                        isRamadanTheme={isRamadan}
                    />
                </div>
            )}
            
            {/* NEW: Explicit "Below Hero" Placement */}
            <AdPlacement ads={props.ads} placement="home-below-hero" isEnabled={props.siteSettings.adsEnabled}/>
            {/* Backward compatibility for "home-top" */}
            <AdPlacement ads={props.ads} placement="home-top" isEnabled={props.siteSettings.adsEnabled}/>

            {carousels.map((carousel, index) => {
              
              // Legacy Middle Ad
              const middleAd = index === Math.floor(carousels.length / 2) && (
                  <AdPlacement ads={props.ads} placement="home-middle" isEnabled={props.siteSettings.adsEnabled}/>
              );

              // NEW: Granular "Between 3 and 4" (Index 2 is the 3rd item)
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
                        // Only pass onSeeAll if it has a route mapping
                        onSeeAll={ (carousel.categoryKey || carousel.specialRoute) ? () => handleSeeAll(carousel) : undefined}
                        isRamadanTheme={isRamadan}
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
