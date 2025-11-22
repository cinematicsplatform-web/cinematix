
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
      {/* Full Width Header with px-4 md:px-8 Padding */}
      <div className="w-full px-4 md:px-8 flex items-center justify-between h-16 md:h-20">
        
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
        <div className={`flex items-center gap-4 md:gap-6 ${isDetailView ? 'hidden md:flex' : 'flex'}`}>
          
          {/* SEARCH COMPONENT */}
          <div ref={searchRef} className="relative group">
            {/* UPDATED: Increased widths (w-48/w-96) and focus widths (w-64/w-[500px]) */}
            <div className={`flex items-center bg-black/30 backdrop-blur-sm border rounded-full py-2 px-4 w-48 md:w-96 transition-all duration-300 focus-within:w-64 md:focus-within:w-[500px] focus-within:bg-black/60 focus-within:shadow-[0_0_15px_rgba(0,167,248,0.3)]
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
                  name="search_cinematix_app" // Unique name to prevent browser history autofill
                  placeholder="ابحث عن فيلم، مسلسل..." 
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

            {/* SEARCH DROPDOWN (CINEMATIC OVERLAY) */}
            {/* UPDATED: Uses explicit dark background with very low transparency to block underlying content */}
            {searchResults.length > 0 && (
              <div className={`
                  fixed left-4 right-4 top-[75px] w-auto z-[100]
                  md:absolute md:top-full md:mt-3 md:right-0 md:left-auto md:w-full md:min-w-[400px]
                  bg-[#141b29]/98 backdrop-blur-3xl border rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.95)] 
                  overflow-hidden max-h-[70vh] overflow-y-auto custom-scrollbar animate-fade-in-up 
                  ${isRamadanTheme 
                    ? 'border-amber-500/30 ring-1 ring-amber-500/20' 
                    : isEidTheme 
                        ? 'border-purple-500/30 ring-1 ring-purple-500/20' 
                        : isCosmicTealTheme
                            ? 'border-[#35F18B]/30 ring-1 ring-[#35F18B]/20'
                            : 'border-white/10 ring-1 ring-white/5'
                  }
              `}>
                
                {/* Results List */}
                <div className="flex flex-col p-2">
                    {searchResults.map((content) => (
                      <div 
                        key={content.id} 
                        onClick={() => handleResultClick(content)}
                        className="flex items-start gap-4 p-3 hover:bg-white/10 cursor-pointer transition-colors rounded-xl group/item"
                      >
                        {/* Poster Thumbnail */}
                        <div className="w-12 h-[72px] flex-shrink-0 rounded-lg overflow-hidden shadow-lg border border-white/5 group-hover/item:border-white/20 transition-colors">
                            <img src={content.poster} alt={content.title} className="w-full h-full object-cover" />
                        </div>

                        {/* Content Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center h-full gap-1">
                          {/* Title */}
                          <p className={`font-bold text-base truncate ${isRamadanTheme ? 'text-white group-hover/item:text-[#FFD700]' : isEidTheme ? 'text-white group-hover/item:text-purple-400' : isCosmicTealTheme ? 'text-white group-hover/item:text-[#35F18B]' : 'text-white group-hover/item:text-[#00A7F8]'} transition-colors`}>
                              {content.title}
                          </p>
                          
                          {/* Meta: Year | Genre */}
                          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                              <span>{content.releaseYear}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                              <span className="truncate max-w-[150px]">{content.genres[0]}</span>
                          </div>

                          {/* Rating & Badge */}
                          <div className="flex items-center justify-between mt-1">
                              <div className="flex items-center gap-1 text-yellow-400">
                                  <StarIcon className="w-3 h-3 fill-current" />
                                  <span className="text-xs font-bold text-gray-200">{content.rating.toFixed(1)}</span>
                              </div>
                              
                              {/* Type Badge */}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                  content.type === 'movie' 
                                    ? (isRamadanTheme ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30')
                                    : (isRamadanTheme 
                                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
                                        : isEidTheme 
                                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                                            : isCosmicTealTheme 
                                                ? 'bg-[#35F18B]/10 text-[#35F18B] border-[#35F18B]/30'
                                                : 'bg-green-500/20 text-green-400 border-green-500/30')
                              }`}>
                                  {content.type === 'movie' ? 'فيلم' : 'مسلسل'}
                              </span>
                          </div>
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
