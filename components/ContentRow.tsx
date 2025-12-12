import React, { useRef } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { MediaCard } from './MediaCard';
import { MediaItem } from '../types';

interface ContentRowProps {
  title: string;
  items: MediaItem[];
  onItemClick: (item: MediaItem) => void;
}

export const ContentRow: React.FC<ContentRowProps> = ({ title, items, onItemClick }) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { clientWidth } = rowRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth / 1.5 : clientWidth / 1.5;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-8 md:mb-12 relative group">
      <div className="px-4 md:px-12 mb-4 flex items-end justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-white border-r-4 border-yellow-500 pr-3">
          {title}
        </h2>
        <button className="text-xs text-gray-400 hover:text-white transition">عرض الكل</button>
      </div>

      <div className="relative">
        <div 
          ref={rowRef}
          className="flex gap-4 overflow-x-auto no-scrollbar px-4 md:px-12 pb-4 scroll-smooth"
        >
          {items.map((item) => (
            <MediaCard key={item.id} item={item} onClick={onItemClick} />
          ))}
        </div>

        {/* Scroll Buttons - Hidden on Mobile, visible on hover desktop */}
        <button 
          onClick={() => scroll('left')}
          className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/80 to-transparent z-10 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/50"
        >
          <ChevronRight size={32} />
        </button>
        <button 
          onClick={() => scroll('right')}
          className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/80 to-transparent z-10 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/50"
        >
          <ChevronLeft size={32} />
        </button>
      </div>
    </div>
  );
};