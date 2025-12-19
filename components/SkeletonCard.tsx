
import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="relative w-[calc((100vw-40px)/2.25)] md:w-[calc((100vw-64px)/4.2)] lg:w-[calc((100vw-64px)/6)] flex-shrink-0 mb-0">
      <div className="relative rounded-xl overflow-hidden bg-gray-800 aspect-[2/3] w-full">
        {/* Shimmer Effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        
        {/* Content Placeholders */}
        <div className="absolute bottom-2 right-2 left-2 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
