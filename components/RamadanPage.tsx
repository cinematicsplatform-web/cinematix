
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Content, SiteSettings, Ad, View } from '../types';
import Hero from './Hero';
import ContentCarousel from './ContentCarousel';
import AdPlacement from './AdPlacement';
import { PlayIcon } from './icons/PlayIcon'; 
import RamadanRestrictedModal from './RamadanRestrictedModal'; 
import SEO from './SEO';
import AdZone from './AdZone';

interface RamadanPageProps {
  allContent: Content[];
  pinnedContent: Content[];
  onSelectContent: (content: Content) => void;
  siteSettings: SiteSettings;
  isLoggedIn: boolean;
  myList?: string[];
  onToggleMyList: (contentId: string) => void;
  ads: Ad[];
  adsEnabled: boolean;
  onNavigate: (view: View, category?: string) => void;
  isLoading?: boolean;
}

// Helper Component for Title
const GoldenTitle = ({text, showNewBadge, iconSrc}: {text: string, showNewBadge?: boolean, iconSrc?: string}) => (
    <div className="flex items-center gap-3 ramadan-section-title">
        {/* Vertical Accent Bar - Gold */}
        <div className="h-8 w-1.5 bg-[#D4AF37] rounded-full shadow-[0_0_15px_rgba(212,175,55,0.6)]"></div>
        {/* Title Text - White */}
        <span className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-md flex items-center gap-3">
            {text}
            {iconSrc && (
               <img src={iconSrc} alt="icon" className="w-8 h-8 object-contain" />
            )}
        </span>
    </div>
);

const CountdownTimer: React.FC<{ targetDate: string }> = ({ targetDate }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft: Record<string, number> = {};

        if (difference > 0) {
            timeLeft = {
                أيام: Math.floor(difference / (1000 * 60 * 60 * 24)),
                ساعات: Math.floor((difference / (1000 * 60 * 60)) % 24),
                دقائق: Math.floor((difference / 1000 / 60) % 60),
                ثواني: Math.floor((difference / 1000) % 60)
            };
        } else {
             timeLeft = { أيام: 0, ساعات: 0, دقائق: 0, ثواني: 0 };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        
        if (Object.values(timeLeft).every(v => v === 0)) return () => clearTimeout(timer);
        return () => clearTimeout(timer);
    }, [timeLeft, targetDate]);

    const timeComponents = Object.entries(timeLeft).reverse();

    return (
        <div className="flex flex-wrap justify-center gap-3 md:gap-6 text-center">
            {timeComponents.map(([unit, value]) => (
                <div 
                    key={unit} 
                    // FIX: Hide 'Seconds' (ثواني) on mobile (hidden), show on desktop (md:block)
                    className={`relative group ${unit === 'ثواني' ? 'hidden md:block' : ''}`}
                >
                    <div className="w-20 h-24 md:w-28 md:h-32 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl rounded-2xl border border-amber-500/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all duration-300 group-hover:border-amber-500/50 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                        <span className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 font-mono mb-1">
                            {String(value).padStart(2, '0')}
                        </span>
                        <span className="text--[10px] md:text-xs uppercase tracking-widest text-amber-100/60 font-semibold">{unit}</span>
                    </div>
                    {/* Decorative Dots */}
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-amber-500 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                </div>
            ))}
        </div>
    );
};


const RamadanPage: React.FC<RamadanPageProps> = ({ allContent, pinnedContent, onSelectContent, siteSettings, isLoggedIn, myList, onToggleMyList, ads, adsEnabled, onNavigate, isLoading }) => {
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<Content | null>(null);

  // 1. Filter all Ramadan content first
  const allRamadanContent = useMemo(() => 
    allContent.filter(c => c.categories.includes('رمضان'))
  , [allContent]);
  
  // 🎯 Master Hero Logic: Ensure 5 items for Infinite Loop
  const heroContents = useMemo(() => {
    if (pinnedContent && pinnedContent.length > 0) {
        return pinnedContent;
    }
    // Fallback: Latest 5 to enable slider
    if (allRamadanContent.length === 0) return [];
    const sorted = [...allRamadanContent].sort((a, b) => 
        new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
    return sorted.slice(0, 5);
  }, [pinnedContent, allRamadanContent]);

  // 3. Countdown Logic
  const isCountdownActive = siteSettings.isCountdownVisible && (+new Date(siteSettings.countdownDate) - +new Date()) > 0;
  
  // 4. Prepare Carousels - RESTRUCTURED AS REQUESTED
  const carousels = useMemo(() => {
    const limit = (list: Content[]) => list.slice(0, 12);
    
    // A. Latest Ramadan Content (أحدث الإضافات)
    const recentAdditions = limit([...allRamadanContent]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()));

    // B. Top 10 Ramadan (EXCLUSIVE PINNED CONTENT OR FALLBACK)
    let topRatedContent = pinnedContent;
    
    // Fallback: If no pinned content, use Top Rated logic automatically
    if (topRatedContent.length === 0) {
        topRatedContent = [...allRamadanContent]
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 10);
    } else {
        // Limit pinned to 10 just in case
        topRatedContent = topRatedContent.slice(0, 10);
    }

    // C. Ramadan Series Only
    const ramadanSeries = limit(allRamadanContent.filter(c => c.type === 'series'));
    
    // D. Ramadan Programs Only
    const ramadanPrograms = limit(allRamadanContent.filter(c => c.categories?.includes('برامج رمضان')));
    
    const definedCarousels = [
        {
            id: 'r_new',
            // Use standard title string but enable isNew badge in Carousel props
            title: <GoldenTitle text="أحدث الإضافات" />,
            contents: recentAdditions,
            isNew: true, // Enable "New" badge
            categoryKey: 'new-ramadan'
        },
        {
            id: 'r_top_10',
            title: <GoldenTitle text="أفضل 10 أعمال" iconSrc="https://fonts.gstatic.com/s/e/notoemoji/latest/1f31c/512.webp" />,
            contents: topRatedContent,
            showRanking: true, // Show badges 1-10 (Gold Ribbon)
            categoryKey: 'top-rated-ramadan'
        },
        {
            id: 'r_series',
            title: <GoldenTitle text="مسلسلات رمضان" />,
            contents: ramadanSeries,
            categoryKey: 'مسلسلات رمضان' // Special subpage logic
        },
        {
            id: 'r_programs',
            title: <GoldenTitle text="برامج رمضان" />,
            contents: ramadanPrograms,
            categoryKey: 'برامج رمضان'
        }
    ].filter(c => c.contents.length > 0);

    return definedCarousels;
  }, [allRamadanContent, pinnedContent]);

  const handleSelectContentRestricted = useCallback((content: Content) => {
    // If countdown is active, show modal. Else, navigate.
    if (isCountdownActive) {
        setModalContent(content);
        setIsModalOpen(true);
    } else {
        onSelectContent(content);
    }
  }, [isCountdownActive, onSelectContent]);

  const handleSeeAll = (categoryKey: string) => {
      onNavigate('category', categoryKey);
  };

  // --- Buffer Logic for Empty State ---
  const [showEmptyMessage, setShowEmptyMessage] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (!isLoading && heroContents.length === 0 && carousels.length === 0) {
        timer = setTimeout(() => {
            setShowEmptyMessage(true);
        }, 750);
    } else {
        setShowEmptyMessage(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading, heroContents.length, carousels.length]);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // Check if genuinely empty (both hero and carousels)
  if (heroContents.length === 0 && carousels.length === 0) {
      if (!showEmptyMessage) {
           return (
                <div className="min-h-screen flex items-center justify-center bg-black">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
                </div>
           );
      }
      return <div className="min-h-screen flex items-center justify-center text-xl text-amber-500 animate-fade-in-up">لا يوجد محتوى رمضاني حالياً.</div>;
  }

  return (
    // CRITICAL FIX: Clean Container Structure - Absolutely NO overflow-x-hidden here to allow sticky/drag gestures
    <div className="relative min-h-screen bg-black text-white font-sans selection:bg-amber-500 selection:text-black">
        
        <SEO 
            title="رمضان 2026 - سينماتيكس" 
            description="تغطية حصرية لمسلسلات وبرامج رمضان 2026. تابع أحدث الحلقات والبرامج الدينية والترفيهية."
            type="website"
        />

        {/* Ramadan Decorative Background - Fixed and low z-index */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] bg-repeat opacity-20"></div>
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[100px] animate-pulse"></div>
             <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10">
            <Hero 
                contents={heroContents} 
                onWatchNow={handleSelectContentRestricted} 
                isLoggedIn={isLoggedIn} 
                myList={myList} 
                onToggleMyList={onToggleMyList} 
                autoSlideInterval={5000}
                isRamadanTheme={true} 
            />
        </div>

        <main className="relative z-30 pb-24 bg-black">
             
            {/* Horizontal Divider - Gold Gradient (#FFD700) - COMPACT UPDATE */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#FFD700] to-transparent opacity-60 mt-0 mb-2 md:my-4"></div>
            
            {adsEnabled && <AdZone position="page_ramadan_top" />}

            <AdPlacement ads={ads} placement="ramadan-top" isEnabled={adsEnabled} />
            
            {carousels.map((carousel) => (
                <React.Fragment key={carousel.id}>
                    {/* Countdown Section: Appears only if active AND directly BEFORE the 'Latest Additions' (r_new) carousel */}
                    {carousel.id === 'r_new' && isCountdownActive && (
                        <div className="container mx-auto px-4 mb-12 mt-4 relative animate-fade-in-up">
                            <div className="text-center">
                                <p className="text-amber-200/80 text-lg mb-4 tracking-widest uppercase font-bold">يبدأ الماراثون الرمضاني خلال</p>
                                <CountdownTimer targetDate={siteSettings.countdownDate} />
                            </div>
                        </div>
                    )}

                    <ContentCarousel
                        title={carousel.title}
                        contents={carousel.contents}
                        onSelectContent={handleSelectContentRestricted}
                        isLoggedIn={isLoggedIn}
                        myList={myList}
                        onToggleMyList={onToggleMyList}
                        isNew={carousel.isNew}
                        isRestricted={isCountdownActive} // Show lock icon if restricted
                        showRanking={carousel.showRanking}
                        onSeeAll={() => carousel.categoryKey && handleSeeAll(carousel.categoryKey)}
                        isRamadanTheme={true}
                    />
                </React.Fragment>
            ))}
            
            <AdPlacement ads={ads} placement="ramadan-bottom" isEnabled={adsEnabled} />
        </main>

        {/* Modal for Restricted Content */}
        {isModalOpen && modalContent && (
            <RamadanRestrictedModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                content={modalContent} 
            />
        )}
    </div>
  );
};

export default RamadanPage;
