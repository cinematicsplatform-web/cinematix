
import React, { useEffect, useState, useRef } from 'react';
import type { Ad } from '@/types';

interface AdPlacementProps {
  ads: Ad[];
  placement: string;
  isEnabled: boolean;
  className?: string;
}

const AdPlacement: React.FC<AdPlacementProps> = ({ ads, placement, isEnabled, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 1. Determine device type (Simple & Effective)
  const [isMobile, setIsMobile] = useState<boolean>(
     typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. Smart Filtering: Select the appropriate ad for device and placement
  const activeAd = ads.find(ad => {
    if (ad.placement !== placement || ad.status !== 'active') return false;
    
    // If no targeting or 'all', it's valid
    if (!ad.targetDevice || ad.targetDevice === 'all') return true;
    
    // Precise targeting logic
    if (ad.targetDevice === 'mobile' && isMobile) return true;
    if (ad.targetDevice === 'desktop' && !isMobile) return true;

    return false; 
  });

  // Execute Ad Code (Manual Injection) - Only for CODE type
  useEffect(() => {
    const container = containerRef.current;
    
    // Clean container to prevent duplication
    if (container) {
        container.innerHTML = ''; 
    }

    if (!isEnabled || !activeAd || !container) return;
    
    // If it's a banner, we render via JSX below, don't inject.
    if (activeAd.type === 'banner') return;

    // Legacy support: if type is undefined, treat as code
    if (activeAd.type === 'code' || !activeAd.type) {
        try {
            const range = document.createRange();
            range.selectNode(container);
            // Support both 'code' (new) and 'scriptCode' (old)
            const adContent = activeAd.code || activeAd.scriptCode || '';
            const documentFragment = range.createContextualFragment(adContent);
            container.appendChild(documentFragment);
        } catch (e) {
            console.error('Ad Injection Error:', e);
        }
    }
  }, [activeAd, isEnabled, isMobile, placement]);

  // 3. If no suitable ad is found for this device, return null.
  if (!isEnabled || !activeAd) {
      return null; 
  }

  const defaultClasses = "ad-container w-full flex justify-center items-center my-2 overflow-hidden";
  const finalClasses = className ? `${defaultClasses} ${className}` : defaultClasses;

  // RENDER BANNER TYPE
  if (activeAd.type === 'banner' && activeAd.imageUrl) {
      return (
          <div className={finalClasses}>
              <a 
                href={activeAd.destinationUrl || '#'} 
                target="_blank" 
                rel="nofollow noopener noreferrer"
                className="block transition-transform hover:scale-[1.01] max-w-full"
              >
                  <img 
                    src={activeAd.imageUrl} 
                    alt={activeAd.title} 
                    className="max-w-full h-auto rounded-xl shadow-md object-contain"
                    style={{ maxHeight: '250px' }}
                  />
              </a>
          </div>
      );
  }

  // RENDER CODE TYPE (Container for injection)
  return (
    <div 
      ref={containerRef} 
      id={`ad-${placement}`}
      className={finalClasses}
      style={{ minHeight: 'auto' }} 
    />
  );
};

export default AdPlacement;
