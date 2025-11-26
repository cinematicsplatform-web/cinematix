
import React, { useEffect, useRef } from 'react';
import type { Ad } from '../types';

interface AdPlacementProps {
  ads: Ad[];
  placement: string;
  isEnabled: boolean;
  className?: string;
}

const AdPlacement: React.FC<AdPlacementProps> = ({ ads, placement, isEnabled, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // البحث عن الإعلان النشط لهذا المكان
  const activeAd = ads.find(ad => ad.placement === placement && ad.status === 'active');

  useEffect(() => {
    const container = containerRef.current;
    
    // 1. تنظيف الحاوية (مهم جداً لمنع التكرار)
    if (container) {
        container.innerHTML = ''; 
    }

    if (!isEnabled || !activeAd || !container) return;

    // 2. الحقن اليدوي للسكربت (Manual Script Injection)
    try {
        const range = document.createRange();
        range.selectNode(container);
        
        // هذه الدالة تجبر المتصفح على قراءة السكربت وتنفيذه
        const documentFragment = range.createContextualFragment(activeAd.code);
        
        container.appendChild(documentFragment);
        
        console.log(`✅ Ad injected successfully at: ${placement}`);
    } catch (err) {
        console.error("❌ Failed to render ad:", err);
    }

  }, [activeAd, isEnabled, placement]);

  // إذا لم يكن هناك إعلان، لا تعرض أي شيء (حتى لا تظهر مساحة فارغة)
  if (!isEnabled || !activeAd) return null;

  const defaultClasses = "ad-container w-full flex justify-center items-center my-4 overflow-hidden min-h-[50px]";
  const finalClasses = className ? `${defaultClasses} ${className}` : defaultClasses;

  return (
    <div 
        ref={containerRef} 
        id={`ad-${placement}`}
        className={finalClasses} 
        style={{ minHeight: '90px' }} // ارتفاع مبدئي لحين تحميل الإعلان
    />
  );
};

export default AdPlacement;
