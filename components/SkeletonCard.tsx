
import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="relative w-[calc((100vw-40px)/2.25)] md:w-[calc((100vw-64px)/4.2)] lg:w-[calc((100vw-64px)/6)] flex-shrink-0 mb-0">
      <div className="relative rounded-xl overflow-hidden bg-[var(--bg-card)] aspect-[2/3] w-full border border-white/5">
        {/* Shimmer Effect */}
        <div className="absolute inset-0 skeleton-shimmer"></div>
        
        {/* Content Placeholders */}
        <div className="absolute bottom-2 right-2 left-2 space-y-2 z-10">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-3 bg-white/5 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
