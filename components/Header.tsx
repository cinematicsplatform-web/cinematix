
import React, { useState, useEffect, useRef } from 'react';
import type { User, Profile, View, Content } from '../types';
import { UserRole } from '../types';
import { SearchIcon } from './icons/SearchIcon';
import { UserIcon } from './icons/UserIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { StarIcon } from './icons/StarIcon';

interface HeaderProps {
  onSetView: (view: View) => void;
  currentUser: User | null;
  activeProfile: Profile | null;
  onLogout: () => void;
  allContent: Content[];
  onSelectContent: (content: Content) => void;
  currentView?: View;
  isRamadanTheme?: boolean;
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onSetView, currentUser, activeProfile, onLogout, allContent, onSelectContent, currentView, isRamadanTheme, isEidTheme, isCosmicTealTheme }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Content[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    
    const handleClickOutside = (event: MouseEvent) => {
        if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
            setSearchQuery('');
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const results = allContent.filter(content =>
        content.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Sort results: Movies first, then Series (as per visual hierarchy preference)
      const sortedResults = results.sort((a, b) => {
          if (a.type === b.type) return 0;
          return a.type === 'movie' ? -1 : 1;
      });

      setSearchResults(sortedResults.slice(0, 6)); // Limit results to 6 for the dropdown
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allContent]);
  
  const handleResultClick = (content: Content) => {
    onSelectContent(content);
    setSearchQuery('');
    setSearchResults([]);
  };

  const menuItems: { name: string; view: View, loggedIn?: boolean }[] = [
    { name: 'الرئيسية', view: 'home' },
    { name: 'المسلسلات', view: 'series' },
    { name: 'الأفلام', view: 'movies' },
    { name: 'الأطفال', view: 'kids' },
    { name: 'رمضان', view: 'ramadan' },
    { name: 'قريباً', view: 'soon' },
  ];

  const isLoggedIn = !!currentUser;
  const isAdmin = currentUser?.role === UserRole.Admin;
  const isDetailView = currentView === 'detail';

  return (
    <header 
      className={`
        fixed top-0 right-0 left-0 z-50 transition-all duration-500 ease-in-out
        ${isScrolled 
            ? 'bg-black/10 backdrop-blur-3xl' 
            : 'bg-gradient-to-b from-black/70 to-transparent'}
      `}
    >
      {/* Full Width Header with px-4 md:px-8 Padding. Added gap-2 to prevent element collision on narrow screens */}
      <div className="w-full px-4 md:px-8 flex items-center justify-between h-16 md:h-20 gap-2">
        
        {/* Left Side: Logo or Mobile Back Button */}
        <div className="flex items-center gap-8">
          {isDetailView ? (
              // Mobile: Show Back Button only in Detail View
              <div className="flex md:hidden">
                 <button 
                    onClick={() => onSetView('home')} 
                    className="p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
                 >
                    <ChevronRightIcon className="w-6 h-6 transform rotate-180" /> {/* Icon rotated for RTL back */}
                 </button>
              </div>
          ) : null}

          <h1 onClick={() => onSetView('home')} className={`text-2xl md:text-3xl font-extrabold cursor-pointer ${isDetailView ? 'hidden md:block' : 'block'}`}>
            <span className="text-white">سينما</span><span className="gradient-text font-['Lalezar'] tracking-wide">تيكس</span>
          </h1>
          
          <nav className="hidden lg:flex items-center gap-6">
            {menuItems.map((item) => {
              if (item.loggedIn && !isLoggedIn) return null;
              return (
                <a 
                  key={item.name} 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); onSetView(item.view); }} 
                  className={`font-bold hover-text-accent transition-all duration-200 text-md flex items-center gap-2 ${isCosmicTealTheme ? 'text-gray-200 hover:text-[#35F18B]' : 'text-white'}`}
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

        {/* Right Side: Search & Profile (Hidden on mobile if in Detail View) */}
        <div className={`flex items-center gap-3 md:gap-6 ${isDetailView ? 'hidden md:flex' : 'flex'}`}>
          
          {/* SEARCH COMPONENT */}
          <div ref={searchRef} className="relative group">
            {/* Search Input - Responsive Focus Behavior */}
            <div className={`flex items-center bg-black/30 backdrop-blur-sm border rounded-full py-2 px-4 
                transition-all duration-300 ease-out
                
                /* Mobile: Viewport Width Percentage */
                w-[35vw] focus-within:w-[50vw] mr-4 md:mr-0
                
                /* Desktop: Default Width */
                md:w-64 
                
                /* Desktop Focus: Relative Expand */
                md:focus-within:w-[450px]
                
                focus-within:bg-black/80 focus-within:shadow-[0_0_25px_rgba(0,167,248,0.4)]
                ${isRamadanTheme 
                  ? 'border-amber-500/30 focus-within:border-amber-500' 
                  : isEidTheme
                    ? 'border-purple-500/30 focus-within:border-purple-500 focus-within:shadow-[0_0_15px_rgba(147,112,219,0.4)]'
                    : isCosmicTealTheme
                        ? 'border-[#35F18B]/30 focus-within:border-[#35F18B] focus-within:shadow-[0_0_15px_rgba(53,241,139,0.4)]'
                        : 'border-white/10 focus-within:border-[#00A7F8]'
                }
            `}>
                <input 
                  type="text" 
                  name="search_cinematix_app" 
                  placeholder="ابحث..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-white text-sm w-full placeholder-gray-400 appearance-none"
                  style={{ backgroundColor: 'transparent' }}
                />
                <div className="pointer-events-none">
                   <SearchIcon className={`w-5 h-5 transition-colors ${isRamadanTheme ? 'text-[#FFD700]' : isEidTheme ? 'text-purple-400' : isCosmicTealTheme ? 'text-[#35F18B]' : 'text-gray-400 group-focus-within:text-[#00A7F8]'}`} />
                </div>
            </div>

            {/* SEARCH DROPDOWN - Floating Mobile Layout */}
            {searchResults.length > 0 && (
              <div className={`
                  z-[100] overflow-hidden max-h-[70vh] overflow-y-auto custom-scrollbar animate-fade-in-up
                  bg-[#151922]/95 backdrop-blur-3xl shadow-[0_10px_50px_rgba(0,0,0,0.9)]
                  
                  /* Mobile: Floating Centered Box */
                  !fixed !top-[75px] !left-1/2 !-translate-x-1/2 !w-[92%] !max-w-[95%] !rounded-[20px] border border-white/10
                  
                  /* Desktop: Reset to standard absolute positioning relative to parent */
                  md:!absolute md:!top-full md:!mt-4 md:!left-0 md:!translate-x-0 md:!w-full md:!max-w-none md:!rounded-2xl
              `}>
                
                {/* Results List */}
                <div className="flex flex-col p-2 gap-2">
                    {searchResults.map((content) => (
                      <div 
                        key={content.id} 
                        onClick={() => handleResultClick(content)}
                        className="flex flex-row items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-all duration-200 group relative border border-white/5"
                      >
                        {/* Thumbnail - Right (RTL) - Fixed Size 50x70 */}
                        <img 
                            src={content.poster} 
                            alt={content.title} 
                            className="w-[50px] h-[70px] rounded-lg object-cover shadow-lg flex-shrink-0 bg-gray-800" 
                        />

                        {/* Content Info - Middle */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          {/* Title */}
                          <h4 className="text-white font-bold text-sm md:text-base font-['Tajawal'] leading-tight group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                              {content.title}
                          </h4>
                          
                          {/* Meta Row */}
                          <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-400 font-medium">
                              <span>{content.releaseYear}</span>
                              <span className="w-0.5 h-0.5 rounded-full bg-gray-600"></span>
                              <span className="truncate max-w-[80px]">{content.genres?.[0]}</span>
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-1 mt-0.5">
                              <StarIcon className="w-3 h-3 text-[#FFD700]" />
                              <span className="text-gray-300 text-[10px] font-bold">{content.rating.toFixed(1)}</span>
                          </div>
                        </div>

                        {/* Badge - Left (RTL) */}
                        <div className="self-center pl-1">
                            <span 
                                className="text-[10px] px-2.5 py-1 rounded-full border border-[var(--color-accent)] text-[var(--color-accent)] font-bold tracking-wide bg-[var(--color-accent)]/5 whitespace-nowrap group-hover:bg-[var(--color-accent)] group-hover:text-black transition-all"
                            >
                                {content.type === 'movie' ? 'فيلم' : 'مسلسل'}
                            </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Profile Menu - Hidden on Mobile */}
          <div className="relative z-50 hidden md:block" onMouseLeave={() => setIsMenuOpen(false)}>
            <button 
              onClick={isLoggedIn ? () => setIsMenuOpen(!isMenuOpen) : () => onSetView('login')} 
              className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-700 flex items-center justify-center text-white overflow-hidden ring-2 transition-all duration-300 
                ${isMenuOpen 
                    ? (isRamadanTheme 
                        ? 'ring-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.6)]' 
                        : isEidTheme
                            ? 'ring-purple-500 shadow-[0_0_15px_rgba(147,112,219,0.6)]'
                            : isCosmicTealTheme
                                ? 'ring-[#35F18B] shadow-[0_0_15px_rgba(53,241,139,0.6)]'
                                : 'ring-[var(--color-accent)] shadow-[0_0_15px_var(--shadow-color)]') 
                    : (isRamadanTheme 
                        ? 'ring-transparent hover:ring-[#FFD700]' 
                        : isEidTheme 
                            ? 'ring-transparent hover:ring-purple-500'
                            : isCosmicTealTheme
                                ? 'ring-transparent hover:ring-[#35F18B]'
                                : 'ring-transparent hover:ring-gray-500')
                }
              `}
            >
                {activeProfile ? <img src={activeProfile.avatar} alt={activeProfile.name} className="w-full h-full object-cover" /> : <UserIcon />}
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
                                    : 'border-gray-700/50'}
                    `}>
                        {/* Header Info */}
                        <div className="px-5 py-4 border-b border-white/5 bg-white/5">
                            <p className={`font-bold text-lg ${isRamadanTheme ? 'text-[#FFD700]' : isEidTheme ? 'text-purple-400' : isCosmicTealTheme ? 'text-[#35F18B]' : 'text-white'}`}>{activeProfile?.name}</p>
                            <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{currentUser?.email}</p>
                        </div>
                        
                        {/* Menu Items */}
                        <div className="p-2 flex flex-col gap-1">
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

                        {/* Logout */}
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
