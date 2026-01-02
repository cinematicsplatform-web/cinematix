
import React, { useEffect, useState } from 'react';
import type { Ad } from '@/types';
import AdDisplay from './AdDisplay';

interface AdPlacementProps {
  ads: Ad[];
  placement: string;
  isEnabled: boolean;
  className?: string;
}

const AdPlacement: React.FC<AdPlacementProps> = ({ ads, placement, isEnabled, className }) => {
  // 1. تحديد نوع الجهاز بشكل حيوي
  const [isMobile, setIsMobile] = useState<boolean>(
     typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. فلترة الإعلان النشط لهذا المكان وهذا الجهاز
  const activeAd = ads.find(ad => {
    if (ad.placement !== placement && ad.position !== placement) return false;
    
    const isAdActive = ad.status === 'active' || ad.isActive === true;
    if (!isAdActive) return false;
    
    const target = ad.targetDevice || 'all';
    if (target === 'mobile' && !isMobile) return false;
    if (target === 'desktop' && isMobile) return false;

    return true; 
  });

  if (!isEnabled || !activeAd) return null;

  const defaultClasses = "ad-container w-full flex justify-center items-center my-4 overflow-hidden z-10";
  const finalClasses = className ? `${defaultClasses} ${className}` : defaultClasses;

  // في حال كان الإعلان بانر صوري
  if (activeAd.type === 'banner' && activeAd.imageUrl) {
      return (
          <div className={finalClasses}>
              <a 
                href={activeAd.destinationUrl || '#'} 
                target="_blank" 
                rel="nofollow noopener noreferrer"
                className="block transition-all hover:scale-[1.01] active:scale-[0.98] max-w-full"
              >
                  <img 
                    src={activeAd.imageUrl} 
                    alt={activeAd.title || "Cinemaitx Ad"} 
                    className="max-w-full h-auto rounded-2xl shadow-xl object-contain border border-white/5"
                    style={{ maxHeight: '250px' }}
                  />
              </a>
          </div>
      );
  }

  // في حال كان الإعلان كود برمجي (Adsterra, Monetag, etc)
  return (
    <AdDisplay 
      adCode={activeAd.code || activeAd.scriptCode || ''} 
      className={finalClasses} 
    />
  );
};

export default AdPlacement;
