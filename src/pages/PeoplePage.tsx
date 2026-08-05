import React, { useState, useMemo } from 'react';
import type { Content, Person } from '@/types';
import { SearchIcon } from '@/components/icons/SearchIcon';

export const UserIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
  </svg>
);

interface PersonItemData {
  name: string;
  role: 'actor' | 'director' | 'writer' | 'crew';
  image?: string;
  worksCount: number;
  worksList: string[]; // titles of works this person participated in
}

interface PeoplePageProps {
  allContent: Content[];
  people?: Person[];
  onPersonClick: (name: string, role: string) => void;
  onSetView: (view: any) => void;
}

const PeoplePage: React.FC<PeoplePageProps> = ({ allContent, people = [], onPersonClick }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'actors' | 'directors' | 'writers' | 'crew'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Merged list of all people across DB & Platform Catalog
  const mergedPeopleList = useMemo(() => {
    const map = new Map<string, PersonItemData>();

    // 1. Process database people first
    people.forEach((p) => {
      if (!p.name) return;
      const key = p.name.trim().toLowerCase();
      
      const matchedWorks: string[] = [];

      // Add platform works
      allContent.forEach(c => {
        if (
          c.cast?.includes(p.name) || 
          c.director === p.name || 
          c.writer === p.name
        ) {
          matchedWorks.push(c.title);
        }
      });

      // Add custom database tasks
      p.tasks?.forEach(t => {
        if (t.title && !matchedWorks.includes(t.title)) {
          matchedWorks.push(t.title);
        }
      });

      map.set(key, {
        name: p.name,
        role: p.role || 'actor',
        image: p.image || undefined,
        worksCount: matchedWorks.length,
        worksList: matchedWorks,
      });
    });

    // 2. Extract remaining people from allContent catalog
    allContent.forEach((c) => {
      c.cast?.forEach((actor) => {
        if (!actor) return;
        const key = actor.trim().toLowerCase();
        const existing = map.get(key);
        if (existing) {
          if (!existing.worksList.includes(c.title)) {
            existing.worksList.push(c.title);
            existing.worksCount = existing.worksList.length;
          }
        } else {
          map.set(key, {
            name: actor,
            role: 'actor',
            worksCount: 1,
            worksList: [c.title],
          });
        }
      });

      if (c.director) {
        const key = c.director.trim().toLowerCase();
        const existing = map.get(key);
        if (existing) {
          if (!existing.worksList.includes(c.title)) {
            existing.worksList.push(c.title);
            existing.worksCount = existing.worksList.length;
          }
        } else {
          map.set(key, {
            name: c.director,
            role: 'director',
            worksCount: 1,
            worksList: [c.title],
          });
        }
      }

      if (c.writer) {
        const key = c.writer.trim().toLowerCase();
        const existing = map.get(key);
        if (existing) {
          if (!existing.worksList.includes(c.title)) {
            existing.worksList.push(c.title);
            existing.worksCount = existing.worksList.length;
          }
        } else {
          map.set(key, {
            name: c.writer,
            role: 'writer',
            worksCount: 1,
            worksList: [c.title],
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.worksCount - a.worksCount);
  }, [allContent, people]);

  // Works matching the search query
  const matchingWorks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const catalogMatches = allContent.filter(c => c.title.toLowerCase().includes(q));
    
    // Also gather unique task titles matching
    const taskTitlesSet = new Set<string>();
    people.forEach(p => {
      p.tasks?.forEach(t => {
        if (t.title.toLowerCase().includes(q)) {
          taskTitlesSet.add(t.title);
        }
      });
    });

    const result = catalogMatches.map(c => ({
      id: c.id,
      title: c.title,
      type: c.type,
      poster: c.poster || c.backdrop,
      cast: c.cast || [],
      director: c.director,
      writer: c.writer,
    }));

    taskTitlesSet.forEach(tTitle => {
      if (!result.some(r => r.title.toLowerCase() === tTitle.toLowerCase())) {
        result.push({
          id: `task-${tTitle}`,
          title: tTitle,
          type: 'series',
          poster: undefined,
          cast: [],
          director: undefined,
          writer: undefined,
        });
      }
    });

    return result;
  }, [searchQuery, allContent, people]);

  // Filtered people by name OR work title participation
  const filteredPeople = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return mergedPeopleList.filter((item) => {
      // Check if search matches person name
      const matchesName = !q || item.name.toLowerCase().includes(q);

      // Check if search matches any of their work titles
      const matchesWork = !q || item.worksList.some(w => w.toLowerCase().includes(q));

      if (!matchesName && !matchesWork) return false;

      if (activeTab === 'actors') return item.role === 'actor';
      if (activeTab === 'directors') return item.role === 'director';
      if (activeTab === 'writers') return item.role === 'writer';
      if (activeTab === 'crew') return item.role === 'crew';
      return true;
    });
  }, [mergedPeopleList, activeTab, searchQuery]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'director': return 'مخرج';
      case 'writer': return 'كاتب';
      case 'crew': return 'طاقم عمل';
      default: return 'ممثل';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white pt-24 pb-20 animate-fade-in font-['Cairo']" dir="rtl">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        
        {/* Header Title & Description */}
        <div className="flex flex-col items-center mb-10 space-y-4 text-center">
          <span className="px-4 py-1.5 rounded-full bg-[#00A7F8]/10 border border-[#00A7F8]/30 text-[#00A7F8] font-bold text-xs">
            السينما وصناع الفن
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-[#00A7F8]">
            نجوم وصناع الأعمال بالمنصة
          </h1>
          <p className="text-gray-400 text-sm max-w-xl">
            ابحث باسم الفنان أو اكتب اسم العمل الدرامي لاستعراض جميع الممثلين وطاقم العمل المشارك به.
          </p>

          {/* Search Bar - Supports Person Name OR Work Title */}
          <div className="relative w-full max-w-lg pt-2">
            <input
              type="text"
              placeholder="ابحث باسم الممثل أو اكتب اسم المسلسل/الفيلم (مثل: الاختيار)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#151922] border border-gray-700/80 rounded-full pr-12 pl-12 py-3.5 text-sm text-white focus:border-[#00A7F8] focus:ring-1 focus:ring-[#00A7F8] outline-none shadow-2xl transition-all"
            />
            <SearchIcon className="absolute right-4 top-6 text-gray-400 w-5 h-5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-4 top-5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {[
              { id: 'all', label: `الكل (${mergedPeopleList.length})` },
              { id: 'actors', label: 'الممثلين' },
              { id: 'directors', label: 'المخرجين' },
              { id: 'writers', label: 'الكتاب' },
              { id: 'crew', label: 'طاقم العمل' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#00A7F8] text-white shadow-lg shadow-[#00A7F8]/20 scale-105'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Matching Works Banner (If Searching for a Work Name) */}
        {searchQuery.trim() && matchingWorks.length > 0 && (
          <div className="mb-10 bg-[#151922]/90 border border-[#00A7F8]/30 rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-7 bg-[#00A7F8] rounded-full shadow-[0_0_12px_#00A7F8]"></div>
              <h2 className="text-lg font-black text-white">
                الأعمال الفنية المطابقة للبحث ({matchingWorks.length}) وطاقم عملها:
              </h2>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {matchingWorks.map((work) => (
                <div key={work.id} className="flex-shrink-0 bg-[#0c0f16] border border-gray-800 rounded-2xl p-3 flex items-center gap-3 min-w-[240px]">
                  {work.poster ? (
                    <img src={work.poster} alt="" className="w-12 h-16 object-cover rounded-xl shrink-0" />
                  ) : (
                    <div className="w-12 h-16 bg-gray-800 rounded-xl flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">🎬</div>
                  )}
                  <div>
                    <h4 className="font-extrabold text-xs text-white">{work.title}</h4>
                    <span className="text-[10px] text-[#00A7F8] block mt-0.5">
                      يظهر طاقم العمل والمشاركين في القائمة أدناه
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* People Cards Grid */}
        {filteredPeople.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {filteredPeople.map((item, index) => (
              <div
                key={index}
                onClick={() => onPersonClick(item.name, item.role)}
                className="group cursor-pointer bg-[#151922] border border-gray-800/80 hover:border-[#00A7F8] rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-[#00A7F8]/10 hover:-translate-y-1.5 flex flex-col"
              >
                {/* Image Container */}
                <div className="aspect-[3/4] bg-gradient-to-b from-gray-800 to-gray-950 flex items-center justify-center relative overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-700">
                      <UserIcon className="w-20 h-20 group-hover:text-[#00A7F8] transition-colors" />
                    </div>
                  )}

                  {/* Badge & Works count overlay */}
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10 shadow-md">
                    {getRoleLabel(item.role)}
                  </div>

                  {item.worksCount > 0 && (
                    <div className="absolute bottom-2 left-2 bg-[#00A7F8]/90 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md">
                      {item.worksCount} أعمال
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-[#151922] via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity"></div>
                </div>

                {/* Footer Info */}
                <div className="p-3.5 text-center flex-1 flex flex-col justify-center">
                  <h3 className="font-extrabold text-white group-hover:text-[#00A7F8] truncate transition-colors text-sm">
                    {item.name}
                  </h3>
                  
                  {/* If searching for work name, show matching work tag */}
                  {searchQuery.trim() && item.worksList.some(w => w.toLowerCase().includes(searchQuery.toLowerCase().trim())) ? (
                    <span className="text-[10px] text-[#00FFB0] mt-1 font-semibold truncate block">
                      مشارك في: {item.worksList.find(w => w.toLowerCase().includes(searchQuery.toLowerCase().trim()))}
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-400 mt-0.5">
                      انقر لاستعراض الملف والمهام
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-[#151922]/50 border border-gray-800 rounded-3xl p-8 max-w-lg mx-auto">
            <UserIcon className="w-16 h-16 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">لم يتم العثور على نتائج</h3>
            <p className="text-xs text-gray-400">
              تأكد من كتابة اسم الفنان أو اسم العمل (مثل اسم المسلسل أو الفيلم) بشكل صحيح.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeoplePage;
