import React, { useState } from 'react';
import { Search, Bell, User, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-gradient-to-b from-black/90 to-transparent pb-8 pt-4 px-4 md:px-8 transition-all duration-300">
      <div className="flex items-center justify-between">
        
        {/* Right Side: Logo & Links */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tighter">
              شاهد <span className="text-yellow-500 italic">VIP</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-200">
            <a href="#" className="hover:text-yellow-500 transition-colors">الرئيسية</a>
            <a href="#" className="hover:text-yellow-500 transition-colors">مسلسلات</a>
            <a href="#" className="hover:text-yellow-500 transition-colors">أفلام</a>
            <a href="#" className="hover:text-yellow-500 transition-colors">رياضة</a>
            <a href="#" className="hover:text-yellow-500 transition-colors">مباشر</a>
          </div>
        </div>

        {/* Left Side: Icons */}
        <div className="flex items-center gap-4 text-white">
          <button className="p-2 hover:bg-white/10 rounded-full transition">
            <Search size={20} />
          </button>
          <button className="hidden md:block bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold px-4 py-2 rounded-md transition-colors">
            اشترك الآن
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition">
            <User size={20} />
          </button>
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-slate-900 border-t border-slate-800 p-4 flex flex-col gap-4 md:hidden shadow-xl">
           <a href="#" className="text-white hover:text-yellow-500">الرئيسية</a>
            <a href="#" className="text-white hover:text-yellow-500">مسلسلات</a>
            <a href="#" className="text-white hover:text-yellow-500">أفلام</a>
            <a href="#" className="text-white hover:text-yellow-500">رياضة</a>
            <button className="bg-yellow-600 text-white py-2 rounded font-bold mt-2">اشترك الآن</button>
        </div>
      )}
    </nav>
  );
};