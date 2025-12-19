
import React, { useMemo, useState } from 'react';
import type { Content, Category, View, Ad } from '../types';
import { ContentType } from '../types';
import ContentCard from './ContentCard';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { SearchIcon } from './icons/SearchIcon';
import AdPlacement from './AdPlacement';

interface CategoryPageProps {
  categoryTitle: string;
  allContent: Content[];
  onSelectContent: (content: Content) => void;
  isLoggedIn: boolean;
  myList?: string[];
  onToggleMyList: (contentId: string) => void;
  onSetView: (view: View) => void;
  isRamadanTheme?: boolean;
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
  isNetflixRedTheme?: boolean;
  ads?: Ad[];
  adsEnabled?: boolean;
  onRequestOpen?: () => void; // Handler for request modal
}

const CategoryPage: React.FC<CategoryPageProps> = ({ 
    categoryTitle, 
    allContent, 
    onSelectContent, 
    isLoggedIn, 
    myList, 
    onToggleMyList, 
    onSetView,
    isRamadanTheme,
    isEidTheme,
    isCosmicTealTheme,
    isNetflixRedTheme,
    ads = [],
    adsEnabled = false,
    onRequestOpen
}) => {

  const [searchQuery, setSearchQuery] = useState('');

  const { displayTitle, filteredContent, showRank } = useMemo(() => {
    let title = categoryTitle;
    let content = [...allContent];
    let isRanked = false;

    // --- Existing Filtering Logic ---
    if (categoryTitle === 'top-rated-content') {
        title = 'الأعلى تقييماً';
        content = content.sort((a, b) => b.rating - a.rating);
    }
    else if (categoryTitle === 'new-content') {
        title = 'أحدث الإضافات';
        content = content.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    else if (categoryTitle === 'top-rated-movies') {
        title = 'الأفلام الأعلى تقييماً';
        content = content
            .filter(c => c.type === ContentType.Movie)
            .sort((a, b) => b.rating - a.rating);
    } 
    else if (categoryTitle === 'new-movies') {
        title = 'أحدث الأفلام';
        content = content
            .filter(c => c.type === ContentType.Movie)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    else if (categoryTitle === 'top-rated-series') {
        title = 'المسلسلات الأعلى تقييماً';
        content = content
            .filter(c => c.type === ContentType.Series)
            .sort((a, b) => b.rating - a.rating);
    }
    else if (categoryTitle === 'new-series') {
        title = 'أحدث المسلسلات';
        content = content
            .filter(c => c.type === ContentType.Series)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    else if (categoryTitle === 'top-rated-kids') {
        title = 'أفضل محتوى للأطفال';
        content = content
            .filter(c => c.categories.includes('افلام أنميشن') || c.visibility === 'kids')
            .sort((a, b) => b.rating - a.rating);
    }
    else if (categoryTitle === 'new-kids') {
        title = 'جديد الأطفال';
        content = content
            .filter(c => c.categories.includes('افلام أنميشن') || c.visibility === 'kids')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    else if (categoryTitle === 'top-rated-ramadan') {
        title = 'الأفضل في رمضان';
        content = content
            .filter(c => c.categories.includes('رمضان'))
            .sort((a, b) => b.rating - a.rating);
    }
    else if (categoryTitle === 'new-ramadan') {
        title = 'أحدث ما في رمضان';
        content = content
            .filter(c => c.categories.includes('رمضان'))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    else {
        content = content
            .filter(c => c.categories.includes(categoryTitle as Category))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // --- Search Filtering ---
    if (searchQuery.trim()) {
        content = content.filter(c => c.title.toLowerCase().includes(searchQuery.trim().toLowerCase()));
    }

    return { displayTitle: title, filteredContent: content, showRank: isRanked };
  }, [allContent, categoryTitle, searchQuery]);

  // Check if there is a sidebar ad to show
  const hasSidebarAd = useMemo(() => {
      if (!adsEnabled) return false;
      return ads.some(a => 
          a.placement === 'listing-sidebar' && 
          a.status === 'active' &&
          (a.targetDevice === 'all' || a.targetDevice === 'desktop')
      );
  }, [ads, adsEnabled]);

  // Theme Colors for Accent
  const accentColor = isRamadanTheme 
        ? 'text-[#FFD700]' 
        : isEidTheme 
            ? 'text-purple-500' 
            : isCosmicTealTheme
                ? 'text-[#35F18B]'
                : isNetflixRedTheme
                    ? 'text-[#E50914]'
                    : 'text-[#00A7F8]';

  const ringColor = isRamadanTheme 
        ? 'focus-within:ring-[#FFD700]' 
        : isEidTheme 
            ? 'focus-within:ring-purple-500' 
            : isCosmicTealTheme
                ? 'focus-within:ring-[#35F18B]'
                : isNetflixRedTheme
                    ? 'focus-within:ring-[#E50914]'
                    : 'focus-within:ring-[#00A7F8]';

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white animate-fade-in-up">
      
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-50 bg-[var(--bg-body)]/95 backdrop-blur-xl border-b border-white/5 pb-4 pt-6 px-4 md:px-8 shadow-lg w-full">
          
          {/* UPDATED: Fluid Container (Full Width) */}
          <div className="w-full flex flex-col gap-6">
              
              {/* 1. Search Bar (Top) */}
              <div className="w-full max-w-3xl mx-auto">
                  <div className={`relative group flex items-center bg-black/40 border border-white/10 rounded-full px-4 py-3 transition-all duration-300 focus-within:bg-black/60 focus-within:shadow-[0_0_20px_rgba(0,0,0,0.3)] focus-within:border-transparent focus-within:ring-2 ${ringColor}`}>
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`ابحث في ${displayTitle}...`}
                            className="w-full bg-transparent outline-none text-white text-sm md:text-base placeholder-gray-500"
                        />
                        <SearchIcon className={`w-5 h-5 ${accentColor}`} />
                  </div>
              </div>

              {/* 2. Title & Back Button Row (Below Search) */}
              <div className="flex flex-row justify-between items-center w-full">
                    <h1 className={`text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text truncate max-w-[70%] leading-tight
                        ${isRamadanTheme 
                            ? 'bg-gradient-to-r from-[#D4AF37] to-[#F59E0B]' 
                            : isEidTheme 
                                ? 'bg-gradient-to-r from-purple-400 to-purple-600' 
                                : isCosmicTealTheme
                                    ? 'bg-gradient-to-r from-[#35F18B] to-[#2596be]'
                                    : isNetflixRedTheme
                                        ? 'text-[#E50914]' 
                                        : 'bg-gradient-to-r from-white to-gray-400'
                        }`}>
                        {displayTitle}
                    </h1>

                    <button 
                        onClick={() => onSetView('home')}
                        className={`group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-300 hover:border-transparent hover:text-black hover:scale-105 active:scale-95 shadow-md
                            ${isRamadanTheme 
                                ? 'hover:bg-[#FFD700]' 
                                : isEidTheme 
                                    ? 'hover:bg-purple-500' 
                                    : isCosmicTealTheme
                                        ? 'hover:bg-[#35F18B]'
                                        : isNetflixRedTheme
                                            ? 'hover:bg-[#E50914] hover:text-white'
                                            : 'hover:bg-white'
                            }`}
                    >
                        <span className="transform rotate-180 transition-transform duration-300 group-hover:-translate-x-1">
                            <ChevronRightIcon className="w-4 h-4 md:w-5 md:h-5" />
                        </span>
                        <span className="font-bold text-xs md:text-sm">الرجوع</span>
                    </button>
              </div>
          </div>
      </div>

      {/* Main Layout - UPDATED: Fluid Container (Full Width 100%) */}
      <div className="w-full max-w-none px-4 md:px-8 pt-6 pb-24 flex flex-col lg:flex-row gap-6">
        
        <div className="flex-1 w-full">
            <AdPlacement ads={ads} placement="listing-top" isEnabled={adsEnabled} />

            {filteredContent.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 md:gap-4 gap-y-4 md:gap-y-8 w-full">
                {filteredContent.map((content, index) => (
                <ContentCard 
                    key={content.id} 
                    content={content} 
                    onSelectContent={onSelectContent}
                    isLoggedIn={isLoggedIn}
                    myList={myList}
                    onToggleMyList={onToggleMyList}
                    isGridItem={true}
                    rank={showRank ? index + 1 : undefined}
                    isRamadanTheme={isRamadanTheme}
                    isEidTheme={isEidTheme}
                    isCosmicTealTheme={isCosmicTealTheme}
                    isNetflixRedTheme={isNetflixRedTheme}
                />
                ))}
            </div>
            ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-80 animate-fade-in-up">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                    <SearchIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-300 mb-2">لا توجد نتائج</h2>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">لم يتم العثور على محتوى مطابق لبحثك في هذا القسم.</p>
                
                {/* Request Feature Entry Point */}
                {onRequestOpen && (
                    <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 max-w-md w-full">
                        <h3 className="text-lg font-bold text-white mb-2">لم تجد ما تبحث عنه؟</h3>
                        <p className="text-sm text-gray-400 mb-4">يمكنك طلب إضافة الفيلم أو المسلسل الذي تريده.</p>
                        <button 
                            onClick={onRequestOpen}
                            className={`w-full py-3 rounded-xl font-bold text-black transition-all hover:scale-[1.02] shadow-lg
                                ${isRamadanTheme 
                                    ? 'bg-[#FFD700] hover:bg-amber-400' 
                                    : isEidTheme 
                                        ? 'bg-purple-500 text-white hover:bg-purple-400' 
                                        : isCosmicTealTheme
                                            ? 'bg-[#35F18B] hover:bg-[#2596be]'
                                            : isNetflixRedTheme
                                                ? 'bg-[#E50914] text-white hover:bg-[#b20710]'
                                                : 'bg-[#00A7F8] hover:bg-[#00FFB0]'
                                }
                            `}
                        >
                            اطلبه الآن
                        </button>
                    </div>
                )}
            </div>
            )}

            <AdPlacement ads={ads} placement="listing-bottom" isEnabled={adsEnabled} />
        </div>

        {/* Sidebar (Desktop Only) - Render ONLY if Ads Enabled AND Sidebar Ads Exist */}
        {hasSidebarAd && (
            <div className="hidden lg:block w-[300px] flex-shrink-0 sticky top-48 h-fit">
                <AdPlacement ads={ads} placement="listing-sidebar" isEnabled={adsEnabled} />
            </div>
        )}

      </div>
    </div>
  );
};

export default CategoryPage;
