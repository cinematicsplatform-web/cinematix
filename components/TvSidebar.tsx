
import React from 'react';
import type { View, Profile } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { TvIcon } from './icons/TvIcon';
import { FilmIcon } from './icons/FilmIcon';
import { SearchIcon } from './icons/SearchIcon';
import { UserIcon } from './icons/UserIcon';
import { SmileIcon } from './icons/SmileIcon';

// Local Grid Icon for Categories
const CategoryIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-3.75-2.25v-2.25z" />
    </svg>
);

interface TvSidebarProps {
  onSetView: (view: View) => void;
  currentView: View;
  activeProfile: Profile | null;
  isRamadanTheme?: boolean;
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
  isNetflixRedTheme?: boolean;
}

const TvSidebar: React.FC<TvSidebarProps> = ({ 
  onSetView, 
  currentView, 
  activeProfile, 
  isRamadanTheme, 
  isEidTheme, 
  isCosmicTealTheme, 
  isNetflixRedTheme 
}) => {
  const isKid = activeProfile?.isKid;

  const navItems = [
    { id: 'home', icon: HomeIcon, view: (isKid ? 'kids' : 'home') as View, label: 'الرئيسية' },
    { id: 'series', icon: TvIcon, view: 'series' as View, label: 'المسلسلات' },
    { id: 'movies', icon: FilmIcon, view: 'movies' as View, label: 'الأفلام' },
    { id: 'kids', icon: SmileIcon, view: 'kids' as View, label: 'الأطفال' },
    { id: 'category', icon: CategoryIcon, view: 'category' as View, label: 'الأقسام' },
    { id: 'search', icon: SearchIcon, view: 'search' as View, label: 'البحث' },
    { id: 'profile', icon: UserIcon, view: 'profileHub' as View, label: 'الملف الشخصي', isProfile: true },
  ];

  const activeColorClass = isRamadanTheme 
    ? 'text-[#FFD700]' 
    : isEidTheme 
        ? 'text-purple-500' 
        : isCosmicTealTheme
            ? 'text-[#35F18B]'
            : isNetflixRedTheme
                ? 'text-[#E50914]'
                : 'text-[#00A7F8]';

  const activeBgClass = isRamadanTheme 
    ? 'bg-[#FFD700]/10' 
    : isEidTheme 
        ? 'bg-purple-500/10' 
        : isCosmicTealTheme
            ? 'bg-[#35F18B]/10'
            : isNetflixRedTheme
                ? 'bg-[#E50914]/10'
                : 'bg-[#00A7F8]/10';

  const activeIndicatorClass = isRamadanTheme 
    ? 'bg-[#FFD700]' 
    : isEidTheme 
        ? 'bg-purple-500' 
        : isCosmicTealTheme
            ? 'bg-[#35F18B]'
            : isNetflixRedTheme
                ? 'bg-[#E50914]'
                : 'bg-[#00A7F8]';

  return (
    <div className="fixed top-0 right-0 bottom-0 w-20 bg-black/80 backdrop-blur-2xl border-l border-white/10 z-[1000] flex flex-col items-center py-10 gap-8 animate-fade-in">
      {/* Platform Logo Placeholder */}
      <div className="mb-6 w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#00A7F8] to-[#00FFB0] p-0.5 shadow-2xl">
        <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center">
            <span className="text-xl font-black text-white">C</span>
        </div>
      </div>

      <nav className="flex flex-col gap-6 w-full items-center">
        {navItems.map((item) => {
          const isActive = currentView === item.view || (item.id === 'home' && (currentView === 'home' || currentView === 'kids'));
          const Icon = item.icon;
          const showAvatar = item.isProfile && activeProfile?.avatar;

          return (
            <button
              key={item.id}
              onClick={() => onSetView(item.view)}
              className={`relative w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 group ${isActive ? `${activeBgClass} ${activeColorClass}` : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              title={item.label}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <div className={`absolute right-0 top-1/4 bottom-1/4 w-1 rounded-l-full ${activeIndicatorClass} shadow-[0_0_10px_currentColor] animate-fade-in`}></div>
              )}

              {showAvatar ? (
                <div className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all duration-300 ${isActive ? `border-current` : 'border-transparent opacity-60 group-hover:opacity-100'}`}>
                   <img src={activeProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                </div>
              ) : (
                <Icon className={`w-7 h-7 transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_currentColor]' : 'opacity-70 group-hover:opacity-100'}`} />
              )}
              
              {/* Tooltip Label (Optional for TV, can be removed if strictly iconic) */}
              <div className="absolute left-full mr-4 px-3 py-1 bg-black/90 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-[1001]">
                {item.label}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Info Placeholder for TV */}
      <div className="mt-auto opacity-20 hover:opacity-50 transition-opacity">
        <span className="text-[10px] font-black transform -rotate-90 block">TV_MODE</span>
      </div>
    </div>
  );
};

export default TvSidebar;
