import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Content } from '@/types';
import ActionButtons from './ActionButtons';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { StarIcon } from './icons/StarIcon';
import { ClockIcon } from './icons/ClockIcon';

interface HeroProps {
  contents: Content[];
  onWatchNow: (content: Content) => void;
  isLoggedIn: boolean;
  myList?: string[];
  onToggleMyList: (contentId: string) => void;
  autoSlideInterval?: number;
  isRamadanTheme?: boolean;
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
  isNetflixRedTheme?: boolean;
  hideDescription?: boolean;
}

const Hero: React.FC<HeroProps> = ({ 
    contents, 
    onWatchNow, 
    isLoggedIn, 
    myList, 
    onToggleMyList, 
    autoSlideInterval = 5000, 
    isRamadanTheme,
    isEidTheme,
    isCosmicTealTheme,
    isNetflixRedTheme,
    hideDescription = false
}) => {
    const [unboundedIndex, setUnboundedIndex] = useState(0);
    const [showVideo, setShowVideo] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState(0);
    
    const activeIframeRef = useRef<HTMLIFrameElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    const len = contents.length;
    const activeIndex = len > 0 ? ((unboundedIndex % len) + len) % len : 0;
    const activeContent = contents[activeIndex];
    const hasMultiple = len > 1;

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile(); 
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleNext = useCallback(() => {
        setUnboundedIndex(prev => prev + 1);
    }, []);

    const handlePrev = useCallback(() => {
        setUnboundedIndex(prev => prev - 1);
    }, []);

    // 60-Second Rotation Logic (The "Ad/Video" rotation timer)
    useEffect(() => {
        if (!hasMultiple || isDragging || isPaused) return;

        // If video is showing, we use a 60s rotation as requested.
        // If just an image, we use the standard interval.
        const currentInterval = showVideo ? 60000 : autoSlideInterval;

        const timer = setTimeout(() => {
            handleNext();
        }, currentInterval);

        return () => clearTimeout(timer);
    }, [hasMultiple, isDragging, isPaused, showVideo, handleNext, autoSlideInterval]);

    // Handle Video State Reset on Slide Change
    useEffect(() => {
        setShowVideo(false);
        setIsMuted(true);

        if (!activeContent || !activeContent.trailerUrl || isMobile) return;

        // Delay video start slightly for smoother transition
        const trailerTimer = setTimeout(() => {
            setShowVideo(true);
        }, 1500);

        return () => clearTimeout(trailerTimer);
    }, [activeContent?.id, isMobile]);

    const getVideoId = (url: string | undefined) => {
        if (!url) return null;
        try {
            if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
            if (url.includes('v=')) return url.split('v=')[1].split('&')[0];
            if (url.includes('embed/')) return url.split('embed/')[1].split('?')[0];
            return null;
        } catch (e) { return null; }
    };

    // YouTube Messaging for Mute/Unmute
    useEffect(() => {
        if (showVideo && activeIframeRef.current) {
            const command = isMuted ? 'mute' : 'unMute';
            try {
                activeIframeRef.current.contentWindow?.postMessage(JSON.stringify({
                    event: 'command',
                    func: command,
                    args: ''
                }), '*');
            } catch (e) {}
        }
    }, [isMuted, showVideo]);

    // Drag Handlers
    const handleStart = (clientX: number) => {
        if (!hasMultiple) return;
        setIsDragging(true);
        setStartPos(clientX);
    };

    const handleMove = (clientX: number) => {
        if (!isDragging) return;
        setDragOffset(clientX - startPos);
    };

    const handleEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        const threshold = window.innerWidth * 0.15;
        if (dragOffset > threshold) handlePrev();
        else if (dragOffset < -threshold) handleNext();
        setDragOffset(0);
    };

    if (!contents || contents.length === 0) return null;

    const containerBgColor = isRamadanTheme ? 'bg-[#1a1000]' : isEidTheme ? 'bg-[#1a0b2e]' : isCosmicTealTheme ? 'bg-[#0b1116]' : isNetflixRedTheme ? 'bg-[#141414]' : 'bg-black';    

    return (
        <div 
            className={`relative h-[80vh] md:h-[85vh] w-full overflow-hidden group ${containerBgColor} select-none touch-pan-y`}
            onMouseDown={(e) => handleStart(e.clientX)}
            onMouseMove={(e) => handleMove(e.clientX)}
            onMouseUp={handleEnd}
            onMouseLeave={() => { handleEnd(); setIsPaused(false); }}
            onMouseEnter={() => setIsPaused(true)}
            onTouchStart={(e) => handleStart(e.targetTouches[0].clientX)}
            onTouchMove={(e) => handleMove(e.targetTouches[0].clientX)}
            onTouchEnd={handleEnd}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
            {contents.map((content, index) => {
                const isActive = index === activeIndex;
                const posX = content.mobileCropPositionX ?? 50;
                const posY = content.mobileCropPositionY ?? 50;
                
                // Optimized YouTube URL: 
                // rel=0 (related videos only from same channel)
                // loop=1 + playlist=ID (native loop)
                // iv_load_policy=3 (no annotations)
                // controls=0 (no UI)
                let embedUrl = '';
                const vId = getVideoId(content.trailerUrl);
                if (isActive && vId) {
                    const origin = typeof window !== 'undefined' ? window.location.origin : '';
                    embedUrl = `https://www.youtube.com/embed/${vId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&loop=1&playlist=${vId}&playsinline=1&enablejsapi=1&iv_load_policy=3&disablekb=1&origin=${origin}`;
                }

                let offset = (index - unboundedIndex) % len;
                if (offset < 0) offset += len; 
                if (offset > len / 2) offset -= len;
                
                return (
                    <div 
                        key={`${content.id}-${index}`} 
                        className="absolute inset-0 w-full h-full will-change-transform"
                        style={{ 
                            transform: `translateX(calc(${offset * 100}% + ${dragOffset}px))`,
                            transition: isDragging ? 'none' : 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                            zIndex: isActive ? 20 : 10 
                        }}
                    >
                        <div className="absolute inset-0">
                            {isActive && showVideo && embedUrl && !isMobile && (
                                <div className="absolute inset-0 overflow-hidden z-0 animate-fade-in"> 
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[105%] h-[105%] aspect-video pointer-events-none">
                                        <iframe 
                                            ref={activeIframeRef}
                                            src={embedUrl} 
                                            className="w-full h-full" 
                                            allow="autoplay; encrypted-media" 
                                            frameBorder="0"
                                        />
                                    </div>
                                </div>
                            )}

                            <picture className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${isActive && showVideo && !isMobile ? 'opacity-0' : 'opacity-100'}`}>
                                {content.mobileBackdropUrl && <source media="(max-width: 767px)" srcSet={content.mobileBackdropUrl} />}
                                <img 
                                    src={content.backdrop} 
                                    alt={content.title} 
                                    className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                                    style={{ objectPosition: content.enableMobileCrop ? `${posX}% ${posY}%` : 'center' }}
                                    loading={isActive ? "eager" : "lazy"}
                                />
                            </picture>

                            <div className="absolute inset-0 z-20 bg-gradient-to-t from-[var(--bg-body)] via-[var(--bg-body)]/60 via-40% to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-body)]/90 via-transparent to-transparent z-20 hidden md:block" />
                        </div>

                        <div className={`absolute inset-0 z-30 flex flex-col justify-end px-4 md:px-12 pb-4 md:pb-32 text-white transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <div className="max-w-3xl w-full flex flex-col items-center md:items-start text-center md:text-right">
                                {content.bannerNote && (
                                    <div className={`mb-2 text-sm font-bold px-3 py-1 rounded-lg backdrop-blur-md border border-white/10 animate-fade-in-up ${isNetflixRedTheme ? 'bg-[#E50914]/20' : 'bg-white/10 text-[var(--color-accent)]'}`}>
                                        {content.bannerNote}
                                    </div>
                                )}
                                
                                <div className={`transition-all duration-700 transform ${showVideo && isActive ? 'translate-y-4 scale-90 mb-2' : 'translate-y-0 scale-100 mb-4 md:mb-6'}`}>
                                    {content.isLogoEnabled && content.logoUrl ? (
                                        <img src={content.logoUrl} alt={content.title} className="w-auto h-auto max-w-[200px] md:max-w-[400px] max-h-[180px] md:max-h-[250px] object-contain drop-shadow-2xl" />
                                    ) : (
                                        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black drop-shadow-lg leading-tight">{content.title}</h1>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3 text-xs md:text-base font-bold text-gray-200">
                                    <div className="flex items-center gap-1.5 text-yellow-400 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                                        <StarIcon className="w-4 h-4" />
                                        <span className="text-white">{content.rating.toFixed(1)}</span>
                                    </div>
                                    <span className="opacity-40">|</span>
                                    <span>{content.releaseYear}</span>
                                    {content.type === 'movie' && content.duration && (
                                        <>
                                            <span className="opacity-40">|</span>
                                            <div className="flex items-center gap-1 px-2 py-0.5 border border-white/20 rounded text-[10px] md:text-xs bg-white/5">
                                                <ClockIcon className="w-3.5 h-3.5" />
                                                <span dir="ltr">{content.duration}</span>
                                            </div>
                                        </>
                                    )}
                                    {content.ageRating && (
                                        <>
                                            <span className="opacity-40">|</span>
                                            <span className="border border-white/20 px-2 py-0.5 rounded text-[10px] md:text-xs font-black">{content.ageRating}</span>
                                        </>
                                    )}
                                </div>

                                {!hideDescription && (
                                    <p className={`text-gray-300 text-sm md:text-lg line-clamp-2 md:line-clamp-3 leading-relaxed mb-6 max-w-xl transition-opacity duration-700 ${showVideo && isActive ? 'opacity-0' : 'opacity-100'}`}>
                                        {content.description}
                                    </p>
                                )}

                                <div className="flex items-center gap-4 w-full justify-center md:justify-start">
                                    <ActionButtons 
                                        onWatch={() => onWatchNow(content)} 
                                        onToggleMyList={() => onToggleMyList(content.id)} 
                                        isInMyList={!!myList?.includes(content.id)} 
                                        isRamadanTheme={isRamadanTheme} 
                                        isEidTheme={isEidTheme} 
                                        isCosmicTealTheme={isCosmicTealTheme} 
                                        isNetflixRedTheme={isNetflixRedTheme} 
                                        showMyList={isLoggedIn} 
                                        content={content} 
                                    />
                                    {isActive && showVideo && !isMobile && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} 
                                            className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 transition-all group active:scale-90"
                                        >
                                            <SpeakerIcon isMuted={isMuted} className="w-7 h-7 text-white" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {hasMultiple && (
                <div className="absolute bottom-6 left-0 right-0 z-40 flex justify-center gap-2 md:hidden">
                    {contents.map((_, idx) => (
                        <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === idx ? 'bg-[var(--color-accent)] w-6' : 'bg-white/30 w-1.5'}`} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Hero;
