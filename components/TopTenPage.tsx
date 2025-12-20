
import React from 'react';
import type { Content, Ad, View } from '@/types';
import Hero from './Hero';
import ContentCarousel from './ContentCarousel';
import AdPlacement from './AdPlacement';
import SEO from './SEO';

interface TopTenPageProps {
  top10General: Content[];
  top10Movies: Content[];
  top10Series: Content[];
  top10Ramadan: Content[];
  top10Kids: Content[];
  onSelectContent: (content: Content) => void;
  isLoggedIn: boolean;
  myList?: string[];
  onToggleMyList: (contentId: string) => void;
  isRamadanTheme?: boolean;
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
  isNetflixRedTheme?: boolean;
  ads: Ad[];
  adsEnabled: boolean;
  onNavigate: (view: View, category?: string) => void;
}

const TopTenPage: React.FC<TopTenPageProps> = ({
    top10General,
    top10Movies,
    top10Series,
    top10Ramadan,
    top10Kids,
    onSelectContent,
    isLoggedIn,
    myList,
    onToggleMyList,
    isRamadanTheme,
    isEidTheme,
    isCosmicTealTheme,
    isNetflixRedTheme,
    ads,
    adsEnabled,
    onNavigate
}) => {

    // Helper to determine if any content exists at all
    const hasAnyContent = top10General.length > 0 || top10Movies.length > 0 || top10Series.length > 0 || top10Ramadan.length > 0 || top10Kids.length > 0;

    return (
        <div className="relative min-h-screen bg-[var(--bg-body)]">
            <SEO 
                title="أفضل 10 أعمال - سينماتيكس" 
                description="قائمة أفضل 10 أفلام ومسلسلات وأعمال رمضانية وللأطفال المنسقة بعناية من قبل فريق سينماتيكس."
                type="website"
            />

            {/* Hero Section: Dynamically displays the same items as the General Top 10 Carousel */}
            {top10General.length > 0 && (
                <div className="relative z-10">
                    <Hero 
                        contents={top10General} 
                        onWatchNow={onSelectContent}
                        isLoggedIn={isLoggedIn}
                        myList={myList}
                        onToggleMyList={onToggleMyList}
                        isRamadanTheme={isRamadanTheme}
                        isEidTheme={isEidTheme}
                        isCosmicTealTheme={isCosmicTealTheme}
                        isNetflixRedTheme={isNetflixRedTheme}
                    />
                </div>
            )}

            <main className={`relative z-30 pb-24 bg-[var(--bg-body)] ${top10General.length === 0 ? 'pt-24' : ''}`}>
                <div className={`w-full h-px mt-0 mb-8 md:my-4 
                    ${isRamadanTheme 
                        ? 'bg-gradient-to-r from-transparent via-[#FFD700]/50 to-transparent opacity-80' 
                        : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'
                    }`}></div>

                <div className="flex flex-col gap-10">
                    {/* General Top 10 */}
                    {top10General.length > 0 && (
                        <ContentCarousel 
                            title="أفضل 10 أعمال في سينماتيكس"
                            contents={top10General}
                            onSelectContent={onSelectContent}
                            isLoggedIn={isLoggedIn}
                            myList={myList}
                            onToggleMyList={onToggleMyList}
                            showRanking={true}
                            isRamadanTheme={isRamadanTheme}
                            isEidTheme={isEidTheme}
                            isCosmicTealTheme={isCosmicTealTheme}
                            isNetflixRedTheme={isNetflixRedTheme}
                        />
                    )}

                    <AdPlacement ads={ads} placement="home-middle" isEnabled={adsEnabled} />

                    {/* Series Top 10 - Hidden if empty */}
                    {top10Series.length > 0 && (
                        <ContentCarousel 
                            title="أفضل 10 مسلسلات"
                            contents={top10Series}
                            onSelectContent={onSelectContent}
                            isLoggedIn={isLoggedIn}
                            myList={myList}
                            onToggleMyList={onToggleMyList}
                            showRanking={true}
                            isRamadanTheme={isRamadanTheme}
                            isEidTheme={isEidTheme}
                            isCosmicTealTheme={isCosmicTealTheme}
                            isNetflixRedTheme={isNetflixRedTheme}
                        />
                    )}

                    {/* Movies Top 10 - Hidden if empty */}
                    {top10Movies.length > 0 && (
                        <ContentCarousel 
                            title="أفضل 10 أفلام"
                            contents={top10Movies}
                            onSelectContent={onSelectContent}
                            isLoggedIn={isLoggedIn}
                            myList={myList}
                            onToggleMyList={onToggleMyList}
                            showRanking={true}
                            isRamadanTheme={isRamadanTheme}
                            isEidTheme={isEidTheme}
                            isCosmicTealTheme={isCosmicTealTheme}
                            isNetflixRedTheme={isNetflixRedTheme}
                        />
                    )}

                    {/* Ramadan Top 10 - Hidden if empty */}
                    {top10Ramadan.length > 0 && (
                        <ContentCarousel 
                            title="أفضل 10 أعمال رمضانية"
                            contents={top10Ramadan}
                            onSelectContent={onSelectContent}
                            isLoggedIn={isLoggedIn}
                            myList={myList}
                            onToggleMyList={onToggleMyList}
                            showRanking={true}
                            isRamadanTheme={isRamadanTheme}
                            isEidTheme={isEidTheme}
                            isCosmicTealTheme={isCosmicTealTheme}
                            isNetflixRedTheme={isNetflixRedTheme}
                        />
                    )}

                    {/* Kids Top 10 - Hidden if empty */}
                    {top10Kids.length > 0 && (
                        <ContentCarousel 
                            title="أفضل 10 أعمال للأطفال"
                            contents={top10Kids}
                            onSelectContent={onSelectContent}
                            isLoggedIn={isLoggedIn}
                            myList={myList}
                            onToggleMyList={onToggleMyList}
                            showRanking={true}
                            isRamadanTheme={isRamadanTheme}
                            isEidTheme={isEidTheme}
                            isCosmicTealTheme={isCosmicTealTheme}
                            isNetflixRedTheme={isNetflixRedTheme}
                        />
                    )}
                    
                    {!hasAnyContent && (
                        <div className="flex flex-col items-center justify-center py-32 text-gray-500">
                            <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                                <span className="text-4xl">🏆</span>
                            </div>
                            <p className="text-xl font-bold">لا يوجد محتوى في قوائم التوب 10 حالياً</p>
                            <p className="text-sm mt-2">سيظهر المحتوى المنسق هنا قريباً.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TopTenPage;
