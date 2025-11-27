
import React, { useEffect, useState, useRef } from 'react';
import type { Ad } from '../types';

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

  // Execute Ad Code (Manual Injection)
  useEffect(() => {
    const container = containerRef.current;
    
    // Clean container to prevent duplication
    if (container) {
        container.innerHTML = ''; 
    }

    if (!isEnabled || !activeAd || !container) return;

    try {
        // Native Script Injection using createContextualFragment
        // This executes standard JS tags and renders HTML strings safely without external dependencies
        const range = document.createRange();
        range.selectNode(container);
        const documentFragment = range.createContextualFragment(activeAd.code);
        container.appendChild(documentFragment);
        
        // console.log(`✅ Ad injected successfully at: ${placement}`);
    } catch (e) {
        console.error('Ad Injection Error:', e);
    }
  }, [activeAd, isEnabled, isMobile, placement]);

  // 3. Root Cause Fix for White Space:
  // If no suitable ad is found for this device, return null.
  if (!isEnabled || !activeAd) {
      return null; 
  }

  const defaultClasses = "ad-container w-full flex justify-center items-center my-4 overflow-hidden";
  const finalClasses = className ? `${defaultClasses} ${className}` : defaultClasses;

  return (
    <div 
      ref={containerRef} 
      id={`ad-${placement}`}
      className={finalClasses}
      // Dynamic height to prevent fixed gaps
      style={{ minHeight: 'auto' }} 
    />
  );
};

export default AdPlacement;
