
import React from 'react';
import type { View, Profile } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { TvIcon } from './icons/TvIcon';
import { FilmIcon } from './icons/FilmIcon';
import { SmileIcon } from './icons/SmileIcon';
import { MoonIcon } from './icons/MoonIcon';
import { UserIcon } from './icons/UserIcon';
import { CheckIcon } from './CheckIcon';

interface BottomNavigationProps {
  currentView: View;
  onSetView: (view: View) => void;
  activeProfile: Profile | null;
  isLoggedIn: boolean;
  isRamadanTheme?: boolean;
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
  isNetflixRedTheme?: boolean;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentView, onSetView, activeProfile, isLoggedIn, isRamadanTheme, isEidTheme, isCosmicTealTheme, isNetflixRedTheme }) => {
  
  // Logic to switch nav items if Kid Profile
  const isKid = activeProfile?.isKid;

  let baseItems;

  if (isKid) {
      // Kids Items: Home (Kids), My List, Account
      baseItems = [
          { id: 'kids', label: 'الرئيسية', view: 'kids' as View, icon: SmileIcon },
          { id: 'mylist', label: 'قائمتي', view: 'myList' as View, icon: CheckIcon },
      ];
  } else {
      // Adult Items
      baseItems = [
        { id: 'home', label: 'الرئيسية', view: 'home' as View, icon: HomeIcon },
        { id: 'series', label: 'المسلسلات', view: 'series' as View, icon: TvIcon },
        { id: 'movies', label: 'الأفلام', view: 'movies' as View, icon: FilmIcon },
        { id: 'kids', label: 'الأطفال', view: 'kids' as View, icon: SmileIcon },
        { id: 'ramadan', label: 'رمضان', view: 'ramadan' as View, icon: MoonIcon },
      ];
  }

  // Dynamic Item (Last Item)
  const accountItem = isLoggedIn
    ? { 
        id: 'account', 
        label: 'حسابي', 
        view: 'profileHub' as View, 
        icon: UserIcon,
        isProfile: true 
      }
    : { 
        id: 'login', 
        label: 'زائر', 
        view: 'login' as View, 
        icon: UserIcon,
        isProfile: false 
      };

  const navItems = [...baseItems, accountItem];

  // Define Active Color based on Theme
  const activeColorClass = isRamadanTheme 
    ? 'text-[#FFD700]' 
    : isEidTheme 
        ? 'text-purple-500' 
        : isCosmicTealTheme
            ? 'text-[#35F18B]'
            : isNetflixRedTheme
                ? 'text-[#E50914]'
                : 'text-[#00A7F8]';
        
  const activeRingColor = isRamadanTheme 
    ? 'ring-[#FFD700]' 
    : isEidTheme
        ? 'ring-purple-500'
        : isCosmicTealTheme
            ? 'ring-[#35F18B]'
            : isNetflixRedTheme
                ? 'ring-[#E50914]'
                : 'ring-[#00A7F8]';

  // Additional Classes for iOS Glassmorphism
  // .glass-panel is globally defined for iOS theme in index.html
  const fallbackBg = "bg-[#0D121B]/90 backdrop-blur-[10px]";

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[1000] md:hidden pb-safe transition-all duration-500 ${fallbackBg} glass-panel`}>
      <div className="flex justify-between items-center px-4 h-[72px] w-full max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          const Icon = item.icon;
          
          // Check if we should render the profile avatar
          const showAvatar = item.id === 'account' && activeProfile?.avatar;

          return (
            <button
              key={item.id}
              onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  onSetView(item.view);
              }}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1.5 active:scale-95 transition-transform group"
            >
              <div className={`transition-all duration-300 relative ${isActive ? `-translate-y-1 ${activeColorClass}` : 'text-white'}`}>
                {showAvatar ? (
                   <div className={`w-7 h-7 rounded-full overflow-hidden ring-2 transition-all duration-300 ${isActive ? activeRingColor : 'ring-white/20 grayscale'}`}>
                       <img src={activeProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                   </div>
                ) : (
                    <Icon 
                        className={`w-7 h-7 transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'opacity-90'}`} 
                    />
                )}
              </div>
              
              <span 
                className={`text-[10px] font-bold truncate max-w-[60px] transition-all duration-300 ${
                    isActive 
                    ? `${activeColorClass} opacity-100 translate-y-0`
                    : 'text-white opacity-70'
                }`}
              >
                {item.label}
              </span>
              
              {/* Optional Active Dot Indicator */}
              {isActive && (
                  <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isRamadanTheme ? 'bg-[#FFD700]' : isEidTheme ? 'bg-purple-500' : isCosmicTealTheme ? 'bg-[#35F18B]' : isNetflixRedTheme ? 'bg-[#E50914]' : 'bg-[#00A7F8]'} animate-pulse`}></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
