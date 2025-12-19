
import React, { useState, useEffect, useRef } from 'react';
import { getAdByPosition } from '@/firebase';
import type { Ad, AdPlacement } from '@/types';

interface AdZoneProps {
    position: AdPlacement | string; // Accept generic string to match adPlacements type loosely
    className?: string;
}

const AdZone: React.FC<AdZoneProps> = ({ position, className }) => {
    const [ad, setAd] = useState<Ad | null>(null);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchAd = async () => {
            setLoading(true);
            try {
                const fetchedAd = await getAdByPosition(position);
                if (isMounted && fetchedAd && fetchedAd.status === 'active') {
                    setAd(fetchedAd);
                } else {
                    setAd(null);
                }
            } catch (error) {
                console.error('Failed to load ad:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchAd();
        return () => { isMounted = false; };
    }, [position]);

    // Script Injection Effect
    useEffect(() => {
        const shouldRenderCode = ad && (ad.type === 'code' || !ad.type);
        
        if (shouldRenderCode && (ad.code || ad.scriptCode) && containerRef.current) {
            containerRef.current.innerHTML = '';
            try {
                const range = document.createRange();
                range.selectNode(containerRef.current);
                const codeContent = ad.code || ad.scriptCode || '';
                const fragment = range.createContextualFragment(codeContent);
                containerRef.current.appendChild(fragment);
            } catch (e) {
                console.error("Ad Script Injection Error:", e);
            }
        }
    }, [ad]);

    if (loading) return null; 
    if (!ad) return null;

    if (ad.type === 'banner' && ad.imageUrl) {
        return (
            <div className={`w-full flex justify-center items-center my-6 z-10 relative ad-slot ${className || ''}`}>
                <a 
                    href={ad.destinationUrl || '#'} 
                    target="_blank" 
                    rel="nofollow noopener noreferrer"
                    className="block transition-transform hover:scale-[1.01] max-w-full"
                >
                    <img 
                        src={ad.imageUrl} 
                        alt={ad.title || "Advertisement"} 
                        className="max-w-full h-auto rounded-xl shadow-md object-contain"
                        style={{ maxHeight: '250px' }} 
                    />
                </a>
            </div>
        );
    }

    if (ad.type === 'code' || !ad.type) {
        return (
            <div 
                ref={containerRef} 
                className={`ad-zone-code w-full flex justify-center my-4 ${className || ''}`}
                style={{ minHeight: position === 'global_head' ? 0 : 'auto' }} 
            />
        );
    }

    return null;
};

export default AdZone;
