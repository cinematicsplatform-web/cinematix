import React from 'react';
import { Play } from 'lucide-react';
import { MediaItem } from '../types';

interface MediaCardProps {
  item: MediaItem;
  onClick: (item: MediaItem) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, onClick }) => {
  return (
    <div 
      className="group relative flex-shrink-0 w-36 md:w-56 cursor-pointer transition-all duration-300 hover:z-10 hover:scale-105"
      onClick={() => onClick(item)}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-slate-800 shadow-lg">
        <img 
          src={item.imageUrl} 
          alt={item.title} 
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          loading="lazy"
        />
        
        {/* VIP Badge */}
        {item.isVip && (
          <div className="absolute top-2 right-0 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-l shadow-md">
            VIP
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
            <Play fill="white" className="text-white" size={24} />
          </div>
        </div>
        
        {/* Bottom Gradient for text readability */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/90 to-transparent"></div>
      </div>

      <div className="mt-2 px-1">
        <h3 className="text-white font-bold text-sm md:text-base truncate group-hover:text-yellow-500 transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
           <span>{item.type === 'movie' ? 'فيلم' : 'مسلسل'}</span>
           <span className="flex items-center gap-1 text-yellow-500">★ {item.rating}</span>
        </div>
      </div>
    </div>
  );
};