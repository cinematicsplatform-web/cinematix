import React, { useMemo, useState, useCallback, useEffect } from 'react';
import type { Content, Ad } from '../types';
import Hero from './Hero';
import ContentCarousel from './ContentCarousel';
import AdPlacement from './AdPlacement';
import SoonRestrictedModal from './SoonRestrictedModal'; 

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
  isCosmicTealTheme
}) => {
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<Content | null>(null);
  
  const { allSoonContent, soonAndRamadan, soonOnly } = useMemo(() => {
    const allSoon = allContent.filter(c => c.categories.includes('قريباً'));
    const soonAndRamadan = allSoon.filter(c => c.categories.includes('رمضان'));
    const soonOnly = allSoon.filter(c => !c.categories.includes('رمضان'));
    
    return { allSoonContent: allSoon, soonAndRamadan, soonOnly };
  }, [allContent]);
  
  const heroSoonContents = useMemo(() => {
    if (pinnedContent && pinnedContent.length > 0) {
        return pinnedContent;
    }
    const sortedContent = [...allSoonContent].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sortedContent.slice(0, 1);
  }, [pinnedContent, allSoonContent]);


  const handleSelectContentRestricted = useCallback((content: Content) => {
    setModalContent(content);
    setIsModalOpen(true);
  }, []);

  const carousels = useMemo(() => {
    const sortedSoonRamadan = [...soonAndRamadan].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const sortedSoonOnly = [...soonOnly].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const definedCarousels = [
      { id: 's1', title: 'قريباً في رمضان', contents: sortedSoonRamadan, isRestricted: true },
      { id: 's2', title: 'قريباً', contents: sortedSoonOnly, isRestricted: true }, 
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isCosmicTealTheme ? 'border-[#35F18B]' : 'border-[#00A7F8]'}`}></div>
      </div>
    );
  }
  
  if (allSoonContent.length === 0) {
    if (!showEmptyMessage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
                <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isCosmicTealTheme ? 'border-[#35F18B]' : 'border-[#00A7F8]'}`}></div>
            </div>
        );
    }
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500 animate-fade-in-up">لا يوجد محتوى قادم لعرضها حالياً.</div>
  }


  return (
    <div className="min-h-screen bg-[var(--bg-body)] relative overflow-x-hidden">

      <div className="relative z-10">
          <Hero 
              contents={heroSoonContents} 
              onWatchNow={handleSelectContentRestricted} 
              isLoggedIn={isLoggedIn} 
              myList={myList} 
              onToggleMyList={onToggleMyList} 
              autoSlideInterval={4000}
              isRamadanTheme={isRamadanTheme}
              isEidTheme={isEidTheme}
              isCosmicTealTheme={isCosmicTealTheme}
          />
      </div>
      
      <main className="pb-24 z-30 relative text-right bg-[var(--bg-body)]">
        <div className={`w-full h-px mt-0 mb-2 md:my-4 
            ${isRamadanTheme 
                ? 'bg-gradient-to-r from-transparent via-[#FFD700]/50 to-transparent opacity-80' 
                : isCosmicTealTheme
                    ? 'bg-gradient-to-r from-transparent via-[#35F18B]/50 to-transparent opacity-80'
                    : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'
            }`}></div>

        <AdPlacement ads={ads} placement="soon-page-top" isEnabled={adsEnabled} />
        
        {carousels.map((carousel) => {
            return (
                <ContentCarousel
                key={carousel.id}
                title={carousel.title}
                contents={carousel.contents}
                onSelectContent={handleSelectContentRestricted}
                isLoggedIn={isLoggedIn}
                myList={myList}
                onToggleMyList={onToggleMyList}
                isRamadanTheme={isRamadanTheme}
                isEidTheme={isEidTheme}
                isCosmicTealTheme={isCosmicTealTheme}
                />
            );
        })}
        
        <AdPlacement ads={ads} placement="soon-page-bottom" isEnabled={adsEnabled} />
      </main>
      
      {isModalOpen && modalContent && (
          <SoonRestrictedModal 
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              content={modalContent}
          />
      )}
    </div>
  );
};

export default SoonPage;