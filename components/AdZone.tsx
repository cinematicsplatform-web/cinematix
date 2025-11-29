
import React, { useState, useEffect, useRef } from 'react';
import { getAdByPosition } from '../firebase';
import type { Ad, AdPosition } from '../types';

interface AdZoneProps {
    position: AdPosition;
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
                // Using getAdByPosition directly instead of fetch API since this is a client-side app
                const fetchedAd = await getAdByPosition(position);
                if (isMounted && fetchedAd) {
                    setAd(fetchedAd);
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

    // Script Injection Effect for 'code' types
    useEffect(() => {
        // Render code if type is 'code' OR if type is undefined but 'code' prop exists (legacy)
        const shouldRenderCode = ad && (ad.type === 'code' || !ad.type);
        
        if (shouldRenderCode && (ad.code || ad.scriptCode) && containerRef.current) {
            containerRef.current.innerHTML = ''; // Clear previous
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

    // 1. Banner Display
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

    // 2. Code/Script Display
    if (ad.type === 'code' || !ad.type) {
        return (
            <div 
                ref={containerRef} 
                className={`ad-zone-code w-full flex justify-center my-4 ${className || ''}`}
                // Ensure it doesn't collapse if empty initially, but only for head injection
                style={{ minHeight: position === 'global_head' ? 0 : 'auto' }} 
            />
        );
    }

    return null;
};

export default AdZone;
