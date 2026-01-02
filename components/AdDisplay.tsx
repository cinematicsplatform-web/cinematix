
import React, { useEffect, useRef } from 'react';

interface AdDisplayProps {
  adCode: string; // الكود البرمجي الخام القادم من قاعدة البيانات
  className?: string;
}

/**
 * مكون AdDisplay: يقوم بإجبار المتصفح على تنفيذ السكربتات
 * نستخدم createContextualFragment لأن innerHTML لا يشغل السكربتات برمجياً
 */
const AdDisplay: React.FC<AdDisplayProps> = ({ adCode, className = '' }) => {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adCode || !adContainerRef.current) return;

    const container = adContainerRef.current;

    // 1. تنظيف المحتوى السابق لمنع تكرار الإعلانات
    container.innerHTML = '';

    try {
        // 2. إنشاء Range و Fragment (هذا هو المفتاح لتشغيل السكربتات)
        const range = document.createRange();
        range.selectNode(container);
        const documentFragment = range.createContextualFragment(adCode);

        // 3. حقن الإعلان في الحاوية
        container.appendChild(documentFragment);
    } catch (err) {
        console.error("Cinematix Ad Error:", err);
    }

    // تنظيف عند الخروج
    return () => {
        if (container) container.innerHTML = '';
    };
  }, [adCode]);

  return (
    <div 
      ref={adContainerRef} 
      className={`ad-wrapper flex justify-center items-center overflow-hidden ${className}`}
    />
  );
};

export default AdDisplay;
