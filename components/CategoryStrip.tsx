
import React from 'react';
import type { View } from '../types';

interface CategoryStripProps {
  onSetView: (view: View) => void;
}

const CategoryStrip: React.FC<CategoryStripProps> = ({ onSetView }) => {
  const navItems: { name: string; view: View }[] = [
    { name: 'الرئيسية', view: 'home' },
    { name: 'المسلسلات', view: 'series' },
    { name: 'الأفلام', view: 'movies' },
    { name: 'الأطفال', view: 'kids' },
    { name: 'رمضان', view: 'ramadan' },
    { name: 'قريباً', view: 'soon' },
  ];

  return (
    // Full width strip, padding matches global layout (px-4 md:px-8)
    <div className="sticky top-16 md:top-20 z-40 bg-black/80 backdrop-blur-sm shadow-md w-full">
      <div className="w-full px-4 md:px-8">
        <nav className="flex items-center justify-center gap-4 md:gap-8 h-12 overflow-x-auto rtl-scroll">
          {navItems.map((item) => (
            <a
              key={item.name}
              href="#"
              onClick={(e) => { e.preventDefault(); onSetView(item.view); }}
              className="flex-shrink-0 text-white font-bold hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-l hover:from-[#00A7F8] hover:to-[#00FFB0] transition-all duration-200 text-md"
            >
              {item.name}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default CategoryStrip;
