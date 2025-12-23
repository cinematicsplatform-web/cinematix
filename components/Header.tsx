import React, { useState, useEffect } from 'react';
import type { User, Profile, View, Content } from '@/types';
import { UserRole } from '@/types';
import { SearchIcon } from './icons/SearchIcon';
import { UserIcon } from './icons/UserIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { BellIcon } from './icons/BellIcon';

interface HeaderProps {
  onSetView: (view: View) => void;
  currentUser: User | null;
  activeProfile: Profile | null;
  onLogout: () => void;
  allContent: Content[];
  onSelectContent: (content: Content, seasonNumber?: number) => void;
  currentView?: View;
  isRamadanTheme?: boolean;
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
  isNetflixRedTheme?: boolean;
  returnView?: View;
  isKidProfile?: boolean;
  onOpenSearch?: () => void; 
  unreadNotificationsCount?: number;
}

const Header: React.FC<HeaderProps> = ({ onSetView, currentUser, activeProfile, onLogout, allContent, onSelectContent, currentView, isRamadanTheme, isEidTheme, isCosmicTealTheme, isNetflixRedTheme, returnView, isKidProfile, onOpenSearch, unreadNotificationsCount = 0 }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const baseMenuItems: { name: string; view: View, loggedIn?: boolean }[] = [
    { name: 'الرئيسية', view: 'home' },
    { name: 'المسلسلات', view: 'series' },
    { name: 'الأفلام', view: 'movies' },
    { name: 'الأطفال', view: 'kids' },
    { name: 'رمضان', view: 'ramadan' },
    { name: 'قريباً', view: 'soon' },
  ];

  // Logic to show simplified menu for kids
  const menuItems = isKidProfile 
    ? [{ name: 'الرئيسية', view: 'kids' as View }] 
    : baseMenuItems;

  const isLoggedIn = !!currentUser;
  const isAdmin = currentUser?.role === UserRole.Admin;
  const isDetailView = currentView === 'detail';

  const displayCount = unreadNotificationsCount > 9 ? '+9' : String(unreadNotificationsCount);

  return (
    <header 
      className={`
        fixed top-0 right-0 left-0 z-50 transition-all duration-500 ease-in-out
        ${isScrolled 
            ? 'bg-black/10 backdrop-blur-3xl' 
            : 'bg-gradient-to-b from-black/70 to-transparent'}
      `}
    >
      <div className="w-full px-4 md:px-8 flex items-center justify-between h-16 md:h-20 gap-2">
        
        <div className="flex items-center gap-8">
          {isDetailView ? (
              <div className="flex md:hidden">
                 <button 
                    onClick={() => onSetView(returnView || (isKidProfile ? 'kids' : 'home'))} 
                    className="p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
                 >
                    <ChevronRightIcon className="w-6 h-6 transform rotate-180" />
                 </button>
              </div>
          ) : null}

          <h1 onClick={() => onSetView(isKidProfile ? 'kids' : 'home')} className={`text-2xl md:text-3xl font-extrabold cursor-pointer ${isDetailView ? 'hidden md:block' : 'block'}`}>
            {isNetflixRedTheme ? (
               <span className="text-[#E50914] font-['Lalezar'] tracking-wide">CINEMATIX</span>
            ) : (
               <><span className="text-white">سينما</span><span className="gradient-text font-['Lalezar'] tracking-wide">تيكس</span></>
            )}
          </h1>
          
          <nav className="hidden lg:flex items-center gap-6">
            {menuItems.map((item) => {
              if (item.loggedIn && !isLoggedIn) return null;
              return (
                <a 
                  key={item.name} 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); onSetView(item.view); }} 
                  className={`font-bold hover-text-accent transition-all duration-200 text-md flex items-center gap-2 target-nav-link ${isCosmicTealTheme ? 'text-gray-200 hover:text-[#35F18B]' : isNetflixRedTheme ? 'text-gray-300 hover:text-[#E50914]' : 'text-white'}`}
                >
                  {item.view === 'kids' && (
                      <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f423/512.webp" alt="kids" className="w-5 h-5" />
                  )}
                  {item.name}
                </a>
              )
            })}
          </nav>
        </div>

        <div className={`flex items-center gap-3 md:gap-4 ${isDetailView ? 'hidden md:flex' : 'flex'}`}>
          
          <button 
            onClick={() => {
                if (onOpenSearch) onOpenSearch();
                else onSetView('search');
            }}
            className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 
                hover:bg-white/10
                ${isRamadanTheme 
                    ? 'text-[#FFD700] hover:shadow-[0_0_15px_rgba(255,215,0,0.4)]' 
                    : isEidTheme
                        ? 'text-purple-400 hover:shadow-[0_0_15px_rgba(147,112,219,0.4)]'
                        : isCosmicTealTheme
                            ? 'text-[#35F18B] hover:shadow-[0_0_15px_rgba(53,241,139,0.4)]'
                            : isNetflixRedTheme 
                                ? 'text-[#E50914] hover:shadow-[0_0_15px_rgba(229,9,20,0.4)]'
                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                }
            `}
            title="بحث"
          >
              <SearchIcon className="w-7 h-7" />
          </button>
          
          <div className="relative z-50 hidden md:block" onMouseLeave={() => setIsMenuOpen(false)}>
            <button 
              onClick={isLoggedIn ? () => setIsMenuOpen(!isMenuOpen) : () => onSetView('welcome')} 
              className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-700 flex items-center justify-center text-white overflow-hidden ring-2 transition-all duration-300 relative
                ${isMenuOpen 
                    ? (isRamadanTheme 
                        ? 'ring-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.6)]' 
                        : isEidTheme
                            ? 'ring-purple-500 shadow-[0_0_15px_rgba(147,112,219,0.6)]'
                            : isCosmicTealTheme
                                ? 'ring-[#35F18B] shadow-[0_0_15px_rgba(53,241,139,0.6)]'
                                : isNetflixRedTheme
                                    ? 'ring-[#E50914] shadow-[0_0_15px_rgba(229,9,20,0.6)]'
                                    : 'ring-[var(--color-accent)] shadow-[0_0_15px_var(--shadow-color)]') 
                    : (isRamadanTheme 
                        ? 'ring-transparent hover:ring-[#FFD700]' 
                        : isEidTheme 
                            ? 'ring-transparent hover:ring-purple-500'
                            : isCosmicTealTheme
                                ? 'ring-transparent hover:ring-[#35F18B]'
                                : isNetflixRedTheme
                                    ? 'ring-transparent hover:ring-[#E50914]'
                                    : 'ring-transparent hover:ring-gray-500')
                }
              `}
            >
                {activeProfile ? <img src={activeProfile.avatar} alt={activeProfile.name} className="w-full h-full object-cover" /> : <UserIcon />}
                
                {/* Notification Badge */}
                {unreadNotificationsCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#141b29] animate-bounce">
                    {displayCount}
                  </div>
                )}
            </button>
            
            {isLoggedIn && (
                 <div 
                    className={`
                        absolute left-0 top-full pt-3 w-72 
                        transition-all duration-200 origin-top-left
                        ${isMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible pointer-events-none'}
                    `}
                 >
                    <div className={`bg-[#162032] border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden 
                        ${isRamadanTheme 
                            ? 'border-amber-500/30' 
                            : isEidTheme 
                                ? 'border-purple-500/30' 
                                : isCosmicTealTheme 
                                    ? 'border-[#35F18B]/30'
                                    : isNetflixRedTheme
                                        ? 'border-[#E50914]/30'
                                        : 'border-gray-700/50'}
                    `}>
                        <div className="px-5 py-4 border-b border-white/5 bg-white/5">
                            <p className={`font-bold text-lg ${isRamadanTheme ? 'text-[#FFD700]' : isEidTheme ? 'text-purple-400' : isCosmicTealTheme ? 'text-[#35F18B]' : isNetflixRedTheme ? 'text-[#E50914]' : 'text-white'}`}>{activeProfile?.name}</p>
                            <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{currentUser?.email}</p>
                        </div>
                        
                        <div className="p-2 flex flex-col gap-1">
                             <a href="#" onClick={(e) => {e.preventDefault(); onSetView('notifications'); setIsMenuOpen(false);}} className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover-text-accent hover:bg-white/5 rounded-xl transition-all duration-200">
                                <div className="flex items-center gap-3">
                                  <span>الإشعارات</span>
                                </div>
                                {unreadNotificationsCount > 0 && (
                                  <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{displayCount}</span>
                                )}
                             </a>
                             <a href="#" onClick={(e) => {e.preventDefault(); onSetView('myList'); setIsMenuOpen(false);}} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover-text-accent hover:bg-white/5 rounded-xl transition-all duration-200">
                                <span>قائمتي</span>
                             </a>
                             <a href="#" onClick={(e) => {e.preventDefault(); onSetView('accountSettings'); setIsMenuOpen(false);}} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover-text-accent hover:bg-white/5 rounded-xl transition-all duration-200">
                                <span>إدارة الحساب</span>
                             </a>
                             <a href="#" onClick={(e) => {e.preventDefault(); onSetView('profileSelector'); setIsMenuOpen(false);}} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover-text-accent hover:bg-white/5 rounded-xl transition-all duration-200">
                                <span>تبديل الملف الشخصي</span>
                             </a>
                             {isAdmin && (
                                <a href="#" onClick={(e)=>{e.preventDefault(); onSetView('admin'); setIsMenuOpen(false);}} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover-text-accent hover:bg-white/5 rounded-xl transition-all duration-200">
                                    <span>لوحة التحكم</span>
                                </a>
                             )}
                        </div>

                        <div className="p-2 border-t border-white/5">
                             <a href="#" onClick={(e)=>{e.preventDefault(); onLogout(); setIsMenuOpen(false);}} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all duration-200">
                                <span>تسجيل الخروج</span>
                             </a>
                        </div>
                    </div>
                 </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;