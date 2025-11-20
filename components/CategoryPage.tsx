
import React, { useMemo } from 'react';
import type { Content, Category, View, Profile } from '../types';
import { ContentType } from '../types';
import ContentCard from './ContentCard';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface CategoryPageProps {
  categoryTitle: string;
  allContent: Content[];
  onSelectContent: (content: Content) => void;
  isLoggedIn: boolean;
  myList?: string[];
  onToggleMyList: (contentId: string) => void;
  onSetView: (view: View) => void;
  isRamadanTheme?: boolean; // Added prop
}

const CategoryPage: React.FC<CategoryPageProps> = ({ 
    categoryTitle, 
    allContent, 
    onSelectContent, 
    isLoggedIn, 
    myList, 
    onToggleMyList, 
    onSetView,
    isRamadanTheme
}) => {

  // Helper to determine display title and filter logic based on the "key" passed as categoryTitle
  const { displayTitle, filteredContent, showRank } = useMemo(() => {
    let title = categoryTitle;
    let content = [...allContent];
    let isRanked = false;

    // --- Special Cases for Sorting & Filtering ---

    // 1. All Content - Top Rated (Movies & Series)
    if (categoryTitle === 'top-rated-content') {
        title = 'الأعلى تقييماً';
        // No type filtering, just sort by rating
        content = content.sort((a, b) => b.rating - a.rating);
        isRanked = true;
    }
    // 2. All Content - New (Movies & Series)
    else if (categoryTitle === 'new-content') {
        title = 'أحدث الإضافات';
        // No type filtering, just sort by date
        content = content.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    // 3. Movies - Top Rated
    else if (categoryTitle === 'top-rated-movies') {
        title = 'الأفلام الأعلى تقييماً';
        content = content
            .filter(c => c.type === ContentType.Movie)
            .sort((a, b) => b.rating - a.rating);
    } 
    // 4. Movies - New
    else if (categoryTitle === 'new-movies') {
        title = 'أحدث الأفلام';
        content = content
            .filter(c => c.type === ContentType.Movie)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    // 5. Series - Top Rated
    else if (categoryTitle === 'top-rated-series') {
        title = 'المسلسلات الأعلى تقييماً';
        content = content
            .filter(c => c.type === ContentType.Series)
            .sort((a, b) => b.rating - a.rating);
    }
    // 6. Series - New
    else if (categoryTitle === 'new-series') {
        title = 'أحدث المسلسلات';
        content = content
            .filter(c => c.type === ContentType.Series)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    // 7. Kids - Top Rated
    else if (categoryTitle === 'top-rated-kids') {
        title = 'أفضل محتوى للأطفال';
        content = content
            .filter(c => c.categories.includes('افلام أنميشن') || c.visibility === 'kids')
            .sort((a, b) => b.rating - a.rating);
    }
    // 8. Kids - New
    else if (categoryTitle === 'new-kids') {
        title = 'جديد الأطفال';
        content = content
            .filter(c => c.categories.includes('افلام أنميشن') || c.visibility === 'kids')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    // 9. Ramadan - Top Rated (Enable Rankings)
    else if (categoryTitle === 'top-rated-ramadan') {
        title = 'الأفضل في رمضان';
        content = content
            .filter(c => c.categories.includes('رمضان'))
            .sort((a, b) => b.rating - a.rating);
        isRanked = true; // Enable ranking display
    }
    // 10. Ramadan - New
    else if (categoryTitle === 'new-ramadan') {
        title = 'أحدث ما في رمضان';
        content = content
            .filter(c => c.categories.includes('رمضان'))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    // 11. Default Category Filter
    else {
        // Standard category filter (e.g. "افلام عربية" or "مسلسلات رمضان")
        content = content
            .filter(c => c.categories.includes(categoryTitle as Category))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return { displayTitle: title, filteredContent: content, showRank: isRanked };
  }, [allContent, categoryTitle]);

  return (
    // Global Alignment: Full width (no container constraint), aligned padding (px-4 md:px-8)
    <div className="min-h-screen bg-[var(--bg-body)] text-white p-4 md:px-8 pt-8 animate-fade-in-up">
      <div className="w-full">
        
        {/* Header */}
        <div className="flex flex-row justify-between items-center mb-12 mt-20 md:mt-24">
            <div className="flex items-center gap-4">
                 <button 
                    onClick={() => onSetView('home')}
                    className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                    <ChevronRightIcon className="w-6 h-6 transform rotate-180" />
                </button>
                <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                    {displayTitle}
                </h1>
            </div>
            <span className="text-sm text-gray-400 font-medium">
                {filteredContent.length} عمل
            </span>
        </div>

        {filteredContent.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 gap-y-12">
            {filteredContent.map((content, index) => (
              <ContentCard 
                key={content.id} 
                content={content} 
                onSelectContent={onSelectContent}
                isLoggedIn={isLoggedIn}
                myList={myList}
                onToggleMyList={onToggleMyList}
                isGridItem={true}
                // Pass Rank if enabled for this view (Top 10 Ramadan or Top Rated General)
                rank={showRank ? index + 1 : undefined}
                isRamadanTheme={isRamadanTheme}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center opacity-60">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">لا يوجد محتوى</h2>
            <p className="text-gray-500 max-w-md">لم يتم العثور على أعمال في هذا التصنيف حالياً.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
