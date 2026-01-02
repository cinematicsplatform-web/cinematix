
import React, { useEffect, useRef } from 'react';

interface AdDisplayProps {
  adCode: string; // The raw HTML/Script code from the database
  className?: string;
}

const AdDisplay: React.FC<AdDisplayProps> = ({ adCode, className = '' }) => {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Exit if no code or ref is missing
    if (!adCode || !adContainerRef.current) return;

    const container = adContainerRef.current;

    // 1. Clear previous content to avoid duplicates
    container.innerHTML = '';

    try {
        // 2. Create a range and fragment (This allows script execution)
        const range = document.createRange();
        range.selectNode(container);
        const documentFragment = range.createContextualFragment(adCode);

        // 3. Inject the ad
        container.appendChild(documentFragment);
    } catch (err) {
        console.error("Error rendering ad:", err);
    }

    // Cleanup on unmount
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
