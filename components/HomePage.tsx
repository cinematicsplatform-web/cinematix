import React, { useMemo } from 'react';
import type { Content, Category, Ad, SiteSettings, View, Profile, Story } from '@/types';
import { ContentType } from '@/types'; 
import Hero from './Hero';
import ContentCarousel from './ContentCarousel';
import AdPlacement from './AdPlacement';
import ShoutBarComponent from './ShoutBar';
import SEO from './SEO';
import AdZone from './AdZone';
import StoriesBar from './StoriesBar';

interface HomePageProps {
  allContent: Content[];
  pinnedContent: Content[];
  top10Content?: Content[]; 
  stories?: Story[]; 
  onSelectContent: (content: Content) => void;
  isLoggedIn: boolean;
  myList?: string[];
  onToggleMyList: (contentId: string) => void;
  ads: Ad[];
  siteSettings: SiteSettings;
  onNavigate: (view: View, category?: string) => void;
  isLoading?: boolean;
  isRamadanTheme?: boolean;
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
  isNetflixRedTheme?: boolean;
  activeProfile?: Profile | null;
}

const HomePage: React.FC<HomePageProps> = (props) => {
  const isKidMode = props.activeProfile?.isKid || false;

  const isRamadan = props.isRamadanTheme ?? props.siteSettings.isRamadanModeEnabled;
  const isEid = props.isEidTheme ?? props.siteSettings.activeTheme === 'eid';
  const isCosmicTeal = props.isCosmicTealTheme ?? props.siteSettings.activeTheme === 'cosmic-teal';
  const isNetflixRed = props.isNetflixRedTheme ?? props.siteSettings.activeTheme === 'netflix-red';

  // 1. Filter Safe Content
  const safeContent = useMemo(() => {
      if (!isKidMode) return props.allContent;
      return props.allContent.filter(c => 
          c.visibility === 'kids' || 
          c.categories.includes('افلام أنميشن') || 
          c.genres.includes('أطفال') || 
          c.genres.includes('عائلي')
      );
  }, [props.allContent, isKidMode]);

  // 2. Filter Active Stories (CRITICAL FIX: Removed inactive stories from DOM)
  const activeStories = useMemo(() => {
    if (!props.stories) return [];
    return props.stories.filter(s => s.isActive === true);
  }, [props.stories]);

  const safePinnedContent = useMemo(() => {
      if (!isKidMode) return props.pinnedContent;
      return props.pinnedContent.filter(c => 
          c.visibility === 'kids' || 
          c.categories.includes('افلام أنميشن') || 
          c.genres.includes('أطفال') || 
          c.genres.includes('عائلي')
      );
  }, [props.pinnedContent, isKidMode]);

  const heroContent = useMemo(() => {
    if (safePinnedContent && safePinnedContent.length > 0) return safePinnedContent;
    return [...safeContent]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [safePinnedContent, safeContent]);

  const carousels = useMemo(() => {
    const getLatest = (list: Content[]) => {
        return list
            .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
            .slice(0, 12);
    };

    if (isKidMode) {
        const recentKids = getLatest([...safeContent]);
        const animationMovies = getLatest(safeContent.filter(c => c.categories.includes('افلام أنميشن')));
        const familyContent = getLatest(safeContent.filter(c => c.genres.includes('عائلي')));
        const kidsSeries = getLatest(safeContent.filter(c => c.type === ContentType.Series));

        const animationTitle = (
            <div className="flex items-center gap-3">
                <div className={`w-1.5 h-6 md:h-8 rounded-full shadow-[0_0_10px_rgba(0,167,248,0.6)] ${isRamadan ? 'bg-[#FFD700]' : 'bg-gradient-to-b from-[#00A7F8] to-[#00FFB0]'}`}></div>
                <div className="flex items-center gap-2">
                    <span>افلام أنميشن</span>
                    <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f423/512.webp" alt="chick" className="w-5 h-5" />
                </div>
            </div>
        );

        const top10Source = (props.top10Content && props.top10Content.length > 0) ? props.top10Content : safePinnedContent;
        const pinnedCarousel = { id: 'h_pinned_top_kids', title: 'أفضل 10 للأطفال', contents: top10Source, showRanking: true };
        let kidsList = [];
        if (pinnedCarousel.contents.length > 0 && props.siteSettings.showTop10Home) kidsList.push(pinnedCarousel);
        kidsList.push(
            { id: 'k_new', title: 'أحدث الإضافات', contents: recentKids, isNew: true, categoryKey: 'new-kids' },
            { id: 'k_anim', title: animationTitle, contents: animationMovies, specialRoute: 'kids' },
            { id: 'k_series', title: 'مسلسلات كرتون', contents: kidsSeries },
            { id: 'k_family', title: 'أفلام عائلية', contents: familyContent }
        );
        return kidsList.filter(carousel => carousel.contents.length > 0);
    }

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
    const comedyContent = getLatest(props.allContent.filter(c => c.genres.includes('كوميديا')));

    const newArrivals = { id: 'h2', title: 'أحدث الإضافات', contents: recentAdditions, isNew: true, categoryKey: 'new-content' }; 
    const animationTitle = (
        <div className="flex items-center gap-3">
             <div className={`w-1.5 h-6 md:h-8 rounded-full shadow-[0_0_10px_rgba(0,167,248,0.6)] ${isRamadan ? 'bg-[#FFD700]' : 'bg-gradient-to-b from-[#00A7F8] to-[#00FFB0]'}`}></div>
             <div className="flex items-center gap-2"><span>افلام أنميشن</span><img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f423/512.webp" alt="chick" className="w-5 h-5" /></div>
        </div>
    );
    const ramadanTitle = (
        <div className="flex items-center gap-3">
             <div className={`w-1.5 h-6 md:h-8 rounded-full shadow-[0_0_10px_rgba(0,167,248,0.6)] ${isRamadan ? 'bg-[#FFD700]' : 'bg-gradient-to-b from-[#00A7F8] to-[#00FFB0]'}`}></div>
             <div className="flex items-center gap-2"><span>رمضان 2026</span><img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f31c/512.webp" alt="moon" className="w-6 h-6 md:w-8 md:h-8" /></div>
        </div>
    );

    const restCarousels = [
      { id: 'h_comedy_hybrid', title: 'كوميديا على طول الخط', contents: comedyContent, displayType: 'hybrid' },
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

    const top10Source = (props.top10Content && props.top10Content.length > 0) ? props.top10Content : props.pinnedContent;
    const pinnedCarousel = { id: 'h_pinned_top', title: 'أفضل 10 أعمال', contents: top10Source, showRanking: true };
    const ramadanCarousel = { id: 'h_ramadan', title: ramadanTitle, contents: ramadanContent, specialRoute: 'ramadan' };

    let finalList = [];
    if (pinnedCarousel.contents.length > 0 && props.siteSettings.showTop10Home) finalList.push(pinnedCarousel);
    if (props.siteSettings.isShowRamadanCarousel) finalList.push(ramadanCarousel);
    finalList.push(newArrivals);
    finalList.push(...restCarousels);
    return finalList.filter(carousel => carousel.contents.length > 0);
  }, [props.allContent, props.pinnedContent, props.top10Content, props.siteSettings.isShowRamadanCarousel, props.siteSettings.showTop10Home, isRamadan, isKidMode, safeContent, safePinnedContent]);

  const handleSeeAll = (carousel: any) => {
      if (carousel.specialRoute) props.onNavigate(carousel.specialRoute as View);
      else if (carousel.categoryKey) props.onNavigate('category', carousel.categoryKey);
      else props.onNavigate('movies'); 
  };

  if (isKidMode && safeContent.length === 0 && !props.isLoading) {
      return (<div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-body)] text-gray-500 animate-fade-in-up"><p className="text-xl font-bold">مرحباً يا بطل!</p><p className="text-sm mt-2">لا يوجد محتوى للأطفال حالياً. اطلب من والديك إضافة بعض الكرتون!</p></div>);
  }

  if (props.isLoading && props.allContent.length === 0) {
      return (
        <div className="relative min-h-screen bg-[var(--bg-body)]">
            <div className="h-[80vh] w-full bg-gray-900 animate-pulse"></div>
            <div className="p-8 space-y-8">
                <ContentCarousel title="Loading..." contents={[]} onSelectContent={()=>{}} isLoggedIn={false} onToggleMyList={()=>{}} isLoading={true} />
                <ContentCarousel title="Loading..." contents={[]} onSelectContent={()=>{}} isLoggedIn={false} onToggleMyList={()=>{}} isLoading={true} />
            </div>
        </div>
      )
  }

  if (props.allContent.length === 0 && !props.isLoading) {
      return (<div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-body)] text-gray-500 animate-fade-in-up"><p className="text-xl font-bold">لا يوجد محتوى في الموقع</p><p className="text-sm mt-2">يرجى إضافة محتوى من لوحة التحكم</p></div>);
  }

  return (
    <div className="relative min-h-screen bg-[var(--bg-body)]">
        <SEO title="الرئيسية" description="سينماتيكس - مشاهدة أفلام ومسلسلات اون لاين" type="website" />
        <div className="relative z-10">
             <Hero contents={heroContent} onWatchNow={props.onSelectContent} isLoggedIn={props.isLoggedIn} myList={props.myList} onToggleMyList={props.onToggleMyList} autoSlideInterval={5000} isRamadanTheme={isRamadan} isEidTheme={isEid} isCosmicTealTheme={isCosmicTeal} isNetflixRedTheme={isNetflixRed} />
        </div>
        <main className="pb-24 z-30 relative bg-[var(--bg-body)]">
          <div className={`w-full h-px mt-0 mb-2 md:my-4 ${isRamadan ? 'bg-gradient-to-r from-transparent via-[#FFD700]/50 to-transparent opacity-80' : isEid ? 'bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-80' : isCosmicTeal ? 'bg-gradient-to-r from-transparent via-[#35F18B]/50 to-transparent opacity-80' : isNetflixRed ? 'bg-gradient-to-r from-transparent via-[#E50914]/50 to-transparent opacity-80' : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'}`}></div>
          <div className="pt-2">
            {props.siteSettings.shoutBar.isVisible && (
                <div className="px-4 md:px-12 lg:px-16">
                    <ShoutBarComponent text={props.siteSettings.shoutBar.text} isRamadanTheme={isRamadan} isEidTheme={isEid} isCosmicTealTheme={isCosmicTeal} isNetflixRedTheme={isNetflixRed} />
                </div>
            )}
            {!isKidMode && activeStories.length > 0 && (
                <div className="mb-6 block md:hidden">
                    <StoriesBar stories={activeStories} />
                </div>
            )}
            {props.siteSettings.adsEnabled && <AdZone position="home-top" />}
            <AdPlacement ads={props.ads} placement="home-below-hero" isEnabled={props.siteSettings.adsEnabled}/>
            <AdPlacement ads={props.ads} placement="home-top" isEnabled={props.siteSettings.adsEnabled}/>
            {carousels.map((carousel, index) => {
                const showAd = index === 2;
                return (
                    <React.Fragment key={(carousel as any).id}>
                        <ContentCarousel title={(carousel as any).title} contents={(carousel as any).contents} onSelectContent={props.onSelectContent} isLoggedIn={props.isLoggedIn} myList={props.myList} onToggleMyList={props.onToggleMyList} isNew={(carousel as any).isNew} onSeeAll={() => handleSeeAll(carousel)} isRamadanTheme={isRamadan} isEidTheme={isEid} isCosmicTealTheme={isCosmicTeal} isNetflixRedTheme={isNetflixRed} showRanking={(carousel as any).showRanking} isLoading={props.isLoading} displayType={(carousel as any).displayType} />
                        {showAd && <AdPlacement ads={props.ads} placement="home-carousel-3-4" isEnabled={props.siteSettings.adsEnabled}/>}
                    </React.Fragment>
                );
            })}
            <AdPlacement ads={props.ads} placement="home-middle" isEnabled={props.siteSettings.adsEnabled}/>
            <AdPlacement ads={props.ads} placement="home-bottom" isEnabled={props.siteSettings.adsEnabled}/>
          </div>
        </main>
    </div>
  );
};

export default HomePage;