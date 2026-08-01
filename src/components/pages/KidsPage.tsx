
import React, { useState, useEffect, useMemo } from 'react';
import type { Content, Ad, View, SiteSettings, HomeSection } from '@/types';
import { resolveDynamicCarousels } from '@/utils/sectionUtils';
import ContentCarousel from '../shared/ContentCarousel';
import AdPlacement from '../ads/AdPlacement';
import Hero from '../home/Hero';
import SEO from '../shared/SeoMeta';
import AdZone from '../ads/AdZone';

interface KidsPageProps {
  allContent: Content[];
  pinnedContent: Content[];
  top10Content?: Content[]; 
  homeSections?: HomeSection[];
  onSelectContent: (content: Content, seasonNumber?: number) => void;
  isLoggedIn: boolean;
  isAdmin?: boolean; // تم الإضافة
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
  isShahidTheme?: boolean;
  siteSettings?: SiteSettings;
}

const KidsPage: React.FC<KidsPageProps> = ({ 
  allContent, 
  pinnedContent,
  top10Content,
  homeSections,
  onSelectContent, 
  isLoggedIn, 
  isAdmin = false,
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
  isShahidTheme,
  siteSettings
}) => {

  const animationContent = useMemo(() =>
    allContent.filter(c => 
      (c.categories as string[]).includes('أفلام أنيميشن') || 
      (c.categories as string[]).includes('افلام أنميشن') || 
      (c.categories as string[]).includes('افلام انميشن') || 
      (c.categories as string[]).includes('مسلسلات أنيميشن') || 
      (c.categories as string[]).includes('مسلسلات أنميشن') || 
      (c.categories as string[]).includes('مسلسلات انميشن') || 
      c.visibility === 'kids'
    )
  , [allContent]);
  
  const heroContent = useMemo(() => {
    if (pinnedContent && pinnedContent.length > 0) {
        return pinnedContent;
    }
    const sortedContent = [...animationContent].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sortedContent.slice(0, 5);
  }, [animationContent, pinnedContent]);


  const carousels = useMemo(() => {
    const nowTimestamp = Date.now();

    const getEffectiveUpdateDate = (c: Content) => {
        let maxDate = new Date(c.updatedAt || c.createdAt).getTime();
        
        // Check content level schedule
        if (c.scheduledAt) {
            const sched = new Date(c.scheduledAt).getTime();
            if (nowTimestamp >= sched && sched > maxDate) maxDate = sched;
        }

        // Check episode level schedules
        if (c.seasons) {
            c.seasons.forEach(s => {
                s.episodes?.forEach(ep => {
                    if (ep.scheduledAt) {
                        const epSched = new Date(ep.scheduledAt).getTime();
                        if (nowTimestamp >= epSched && epSched > maxDate) maxDate = epSched;
                    }
                });
            });
        }
        return maxDate;
    };

    const limit = (list: Content[]) => list.slice(0, 12);
    
    const recentKids = limit([...animationContent]
        .sort((a, b) => getEffectiveUpdateDate(b) - getEffectiveUpdateDate(a)));

    const allAnimationMovies = limit(animationContent.filter(c => 
      (c.categories as string[]).includes('أفلام أنيميشن') || 
      (c.categories as string[]).includes('افلام أنميشن') || 
      (c.categories as string[]).includes('افلام انميشن')
    ));

    const allAnimationSeries = limit(animationContent.filter(c => 
      (c.categories as string[]).includes('مسلسلات أنيميشن') || 
      (c.categories as string[]).includes('مسلسلات أنميشن') || 
      (c.categories as string[]).includes('مسلسلات انميشن')
    ));

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
      { id: 'k3', title: 'أفلام أنيميشن', contents: allAnimationMovies, isNew: false, categoryKey: 'أفلام أنيميشن' },
      { id: 'k_anim_series', title: 'مسلسلات أنيميشن', contents: allAnimationSeries, isNew: false, categoryKey: 'مسلسلات أنيميشن' },
    ];

    const baseList = definedCarousels.filter(Boolean).filter(carousel => (carousel as any).contents.length > 0);

    return resolveDynamicCarousels('kids', homeSections, allContent, baseList);
  }, [animationContent, top10Content, homeSections, allContent]); 

  const handleSeeAll = (carousel: any) => {
      if (typeof carousel === 'string') {
        onNavigate('category', carousel);
      } else if (carousel?.specialRoute) {
        onNavigate(carousel.specialRoute as View);
      } else if (carousel?.categoryKey) {
        onNavigate('category', carousel.categoryKey);
      } else if (carousel?.sectionId) {
        onNavigate('category', `section:${carousel.sectionId}`);
      } else if (carousel?.id) {
        onNavigate('category', `section:${carousel.id}`);
      } else if (typeof carousel?.title === 'string') {
        onNavigate('category', carousel.title);
      } else {
        onNavigate('kids');
      }
  };

  if (isLoading && animationContent.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-body)]">
        <Hero contents={[] as Content[]} onWatchNow={()=>{}} isLoggedIn={false} onToggleMyList={()=>{}} isLoading={true} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} isShahidTheme={isShahidTheme} />
        <main className="pb-24 pt-0 z-30 relative bg-[var(--bg-body)]">
            <div className={`w-full h-px mb-6 animate-pulse ${isCosmicTealTheme ? 'bg-gradient-to-r from-transparent via-[#35F18B]/50 to-transparent' : 'bg-gradient-to-r from-transparent via-white/20 to-transparent'}`}></div>
            
            <div className="space-y-4">
                <ContentCarousel isLoading={true} title="جاري التحميل" contents={[]} onSelectContent={()=>{}} isLoggedIn={false} onToggleMyList={()=>{}} />
                <ContentCarousel isLoading={true} title="جاري التحميل" contents={[]} onSelectContent={()=>{}} isLoggedIn={false} onToggleMyList={()=>{}} />
            </div>
        </main>
      </div>
    );
  }

  if (animationContent.length === 0) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500 animate-fade-in-up">لا يوجد محتوى أطفال حالياً.</div>
  }

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white"> 
      <SEO 
        title="أطفال و أنمي" 
        description="عالم من المرح والتعليم، أفلام كرتون ومسلسلات أنيميشن للأطفال على سينماتيكس (Cinematix)."
        keywords="اطفال سينماتيكس, انمي سينماتيكس, cinematix kids, cinematics kids, افلام كرتون, مسلسلات أنيميشن, محتوى اطفال"
        type="website"
      />

      <Hero 
          contents={heroContent} 
          onWatchNow={onSelectContent}
          isLoggedIn={isLoggedIn}
          isAdmin={isAdmin}
          myList={myList}
          onToggleMyList={onToggleMyList}
          autoSlideInterval={5000} 
          isRamadanTheme={isRamadanTheme}
          isEidTheme={isEidTheme}
          isCosmicTealTheme={isCosmicTealTheme}
          isNetflixRedTheme={isNetflixRedTheme}
          isShahidTheme={isShahidTheme}
      />

      <main className="pb-24 z-30 relative bg-[var(--bg-body)]">
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
              isAdmin={isAdmin}
              myList={myList}
              onToggleMyList={onToggleMyList}
              isNew={(carousel as any).isNew}
              onSeeAll={() => handleSeeAll(carousel)}
              isRamadanTheme={isRamadanTheme}
              isEidTheme={isEidTheme}
              isCosmicTealTheme={isCosmicTealTheme}
              isNetflixRedTheme={isNetflixRedTheme}
              showRanking={(carousel as any).showRanking}
              rankStyle={siteSettings?.top10NumberStyle}
            />
          );
        })}
        
        <AdPlacement ads={ads} placement="kids-bottom" isEnabled={adsEnabled} />
      </main>
    </div>
  );
};

export default KidsPage;
