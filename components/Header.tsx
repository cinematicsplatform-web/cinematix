
import React, { useState, useEffect, useRef } from 'react';
import type { User, Profile, View, Content } from '../types';
import { UserRole } from '../types';
import { SearchIcon } from './icons/SearchIcon';
import { UserIcon } from './icons/UserIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface HeaderProps {
  onSetView: (view: View) => void;
  currentUser: User | null;
  activeProfile: Profile | null;
  onLogout: () => void;
  allContent: Content[];
  onSelectContent: (content: Content) => void;
  currentView?: View;
  isRamadanTheme?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onSetView, currentUser, activeProfile, onLogout, allContent, onSelectContent, currentView, isRamadanTheme }) => {
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
      setSearchResults(results.slice(0, 7)); // Limit results
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
    <header className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[var(--bg-body)]/90 backdrop-blur-md shadow-lg' : 'bg-gradient-to-b from-[var(--bg-body)]/80 to-transparent'}`}>
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
                  className="text-white font-bold hover-text-accent transition-all duration-200 text-md flex items-center gap-2"
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
          <div ref={searchRef} className="relative group">
            <input 
              type="text" 
              placeholder="ابحث..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`bg-gray-800/50 border rounded-full py-1.5 px-4 pr-10 w-40 md:w-64 focus:outline-none transition-all duration-300 text-white text-sm
                ${isRamadanTheme 
                  ? 'border-amber-500/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500' 
                  : 'border-gray-700 focus:border-[#00A7F8] focus:ring-1 focus:ring-[#00A7F8]' // Explicit blue focus
                }
              `}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
               <SearchIcon className={`w-5 h-5 transition-colors ${isRamadanTheme ? 'text-[#FFD700]' : 'text-gray-400 group-focus-within:text-[#00A7F8]'}`} />
            </div>
            {searchResults.length > 0 && (
              <div className={`absolute top-full mt-2 w-64 md:w-80 bg-gray-900 border rounded-lg shadow-2xl max-h-96 overflow-y-auto z-[100] ${isRamadanTheme ? 'border-amber-500/30' : 'border-gray-700'}`}>
                {searchResults.map(content => (
                  <div 
                    key={content.id} 
                    onClick={() => handleResultClick(content)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-800 last:border-none"
                  >
                    <img src={content.poster} alt={content.title} className="w-10 h-14 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{content.title}</p>
                      <p className="text-xs text-gray-400">{content.releaseYear} &middot; {content.type === 'movie' ? 'فيلم' : 'مسلسل'}</p>
                    </div>
                  </div>
                ))}
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
                        : 'ring-[var(--color-accent)] shadow-[0_0_15px_var(--shadow-color)]') 
                    : (isRamadanTheme 
                        ? 'ring-transparent hover:ring-[#FFD700]' 
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
                    <div className={`bg-[#162032] border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden ${isRamadanTheme ? 'border-amber-500/30' : 'border-gray-700/50'}`}>
                        {/* Header Info */}
                        <div className="px-5 py-4 border-b border-white/5 bg-white/5">
                            <p className={`font-bold text-lg ${isRamadanTheme ? 'text-[#FFD700]' : 'text-white'}`}>{activeProfile?.name}</p>
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
