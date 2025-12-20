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
    autoSlideInterval = 6000, 
    isRamadanTheme,
    isEidTheme,
    isCosmicTealTheme,
    isNetflixRedTheme,
    hideDescription = false
}) => {
    // --- Internal State (Fully Encapsulated) ---
    const [unboundedIndex, setUnboundedIndex] = useState(0);
    const [isDirectJump, setIsDirectJump] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isPaused, setIsPaused] = useState(false); // Pause auto-slide on hover
    
    // Touch/Drag State
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const activeIframeRef = useRef<HTMLIFrameElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    // --- Derived Values ---
    const len = contents.length;
    // Normalized active index (0 to length-1) ensuring proper wrapping
    const activeIndex = len > 0 ? ((unboundedIndex % len) + len) % len : 0;
    const activeContent = contents[activeIndex];
    const hasMultiple = len > 1;

    // --- Self-Management Effects ---

    // 1. Mobile Detection (Kept for video logic only, not for images)
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile(); 
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 2. Auto-Reset: Detect content change (Navigation or Slide Change) and reset/start video
    useEffect(() => {
        // Reset state only when the active content ID changes
        setShowVideo(false);
        setIsMuted(true);
        setIsPaused(false);
        setIsDirectJump(false);

        if (!activeContent || !activeContent.trailerUrl) return;

        // Delay video start to allow user to see the poster first
        const trailerTimer = setTimeout(() => {
            // Start video regardless of dragging state to ensure smooth transitions
            setShowVideo(true);
        }, 3500); // 3.5 seconds delay

        return () => clearTimeout(trailerTimer);
    }, [activeContent?.id]); // Only re-run when the specific content changes

    // 3. Audio Control Effect (Using postMessage to avoid iframe reload)
    useEffect(() => {
        if (showVideo && activeIframeRef.current) {
            const command = isMuted ? 'mute' : 'unMute';
            try {
                activeIframeRef.current.contentWindow?.postMessage(JSON.stringify({
                    event: 'command',
                    func: command,
                    args: ''
                }), '*');
            } catch (e) {
                console.warn("Failed to send audio command to trailer", e);
            }
        }
    }, [isMuted, showVideo]);

    // 4. Auto Slider Logic
    useEffect(() => {
        if (!hasMultiple) return;
        if (isDragging) return; 
        if (showVideo) return; // Stop sliding if video is playing
        if (isPaused) return;  // Stop sliding if mouse is hovering

        const slideInterval = setInterval(() => {
            setIsDirectJump(false);
            setUnboundedIndex(prev => prev + 1);
        }, autoSlideInterval);

        return () => clearInterval(slideInterval);
    }, [hasMultiple, autoSlideInterval, showVideo, isDragging, isPaused]);

    // 5. Scroll Visibility Rule (Intersection Observer)
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (activeIframeRef.current) {
                    if (entry.isIntersecting) {
                        // Resume if it was intended to be playing (showVideo is true)
                        if (showVideo) {
                            activeIframeRef.current.contentWindow?.postMessage(JSON.stringify({
                                event: 'command',
                                func: 'playVideo',
                                args: ''
                            }), '*');
                        }
                    } else {
                        // Pause if out of view
                        if (showVideo) {
                            activeIframeRef.current.contentWindow?.postMessage(JSON.stringify({
                                event: 'command',
                                func: 'pauseVideo',
                                args: ''
                            }), '*');
                        }
                    }
                }
            },
            { threshold: 0.1 } // Trigger when 10% visible
        );
        
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [showVideo]);

    // --- Internal Handlers ---

    const getVideoId = (url: string | undefined) => {
        if (!url) return null;
        try {
            if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
            if (url.includes('v=')) return url.split('v=')[1].split('&')[0];
            if (url.includes('embed/')) return url.split('embed/')[1].split('?')[0];
            return null;
        } catch (e) { return null; }
    };

    const handleManualSlide = useCallback((targetIndex: number) => {
        if (targetIndex === activeIndex) return;
        
        setIsDirectJump(true); // Enable fade transition for click-jumps

        // Smart Path Finding: Go the shortest direction
        const currentMod = activeIndex;
        let diff = targetIndex - currentMod;
        
        // Adjust diff to wrap around correctly if closer
        if (diff > len / 2) diff -= len;
        else if (diff < -len / 2) diff += len;

        setUnboundedIndex(prev => prev + diff);
    }, [activeIndex, len]);

    const handleStart = (clientX: number) => {
        if (!hasMultiple) return;
        setIsDragging(true);
        setStartPos(clientX);
        setDragOffset(0);
        setIsDirectJump(false);
        // Do NOT stop video here. Interaction shouldn't stop playback unless slide changes.
    };

    const handleMove = (clientX: number) => {
        if (!isDragging) return;
        const diff = clientX - startPos;
        setDragOffset(diff);
    };

    const handleEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        
        const threshold = window.innerWidth * 0.2; // 20% swipe width required
        
        if (dragOffset > threshold) {
            setUnboundedIndex(prev => prev - 1); // Swipe Right -> Prev
        } else if (dragOffset < -threshold) {
            setUnboundedIndex(prev => prev + 1); // Swipe Left -> Next
        }
        setDragOffset(0);
    };

    if (!contents || contents.length === 0) return null;

    // --- Render Helpers ---

    const containerBgColor = isRamadanTheme 
        ? 'bg-[#1a1000]' 
        : isEidTheme 
            ? 'bg-[#1a0b2e]' 
            : isCosmicTealTheme
                ? 'bg-[#0b1116]' 
                : isNetflixRedTheme
                    ? 'bg-[#141414]' 
                    : 'bg-black';    

    // Dots Indicator
    const renderDots = (className: string) => (
      <div className={`flex gap-1.5 pointer-events-none justify-center w-full ${className}`} dir="rtl">
        {contents.map((_, idx) => (
            <button 
                key={idx}
                className={`h-1.5 transition-all duration-300 pointer-events-auto cursor-pointer rounded-full
                    ${activeIndex === idx 
                        ? (isRamadanTheme 
                            ? 'bg-amber-500 w-6' 
                            : isEidTheme 
                                ? 'bg-purple-500 w-6' 
                                : isCosmicTealTheme
                                    ? 'bg-[#35F18B] w-6 shadow-[0_0_10px_#35F18B]'
                                    : isNetflixRedTheme
                                        ? 'bg-[#E50914] w-6 shadow-[0_0_10px_rgba(229,9,20,0.5)]'
                                        : 'bg-[#00A7F8] w-6') 
                        : 'bg-white/30 hover:bg-white/60 w-2'
                    }`}
                onClick={(e) => { 
                    e.stopPropagation(); 
                    if (activeIndex === idx) return;
                    handleManualSlide(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
            />
        ))}
      </div>
    );

    return (
        <div 
            ref={containerRef}
            className={`relative h-[80vh] md:h-[85vh] w-full overflow-hidden group ${containerBgColor} select-none touch-pan-y`}
            onMouseDown={(e) => handleStart(e.clientX)}
            onMouseMove={(e) => handleMove(e.clientX)}
            onMouseUp={handleEnd}
            onMouseLeave={(e) => { handleEnd(); setIsPaused(false); }}
            onMouseEnter={() => setIsPaused(true)}
            onTouchStart={(e) => handleStart(e.targetTouches[0].clientX)}
            onTouchMove={(e) => handleMove(e.targetTouches[0].clientX)}
            onTouchEnd={handleEnd}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
            
            {contents.map((content, index) => {
                const isActive = index === activeIndex;
                
                // Smart Crop Logic: Always calculate values, CSS handles whether to use them via media query
                const posX = content.mobileCropPositionX ?? content.mobileCropPosition ?? 50;
                const posY = content.mobileCropPositionY ?? 50;

                // Pass variables to CSS. The 'mobile-custom-crop' class in index.css 
                // uses a media query (@media max-width: 768px) to apply these only on mobile.
                const imgStyle: React.CSSProperties = {
                    '--mob-x': `${posX}%`,
                    '--mob-y': `${posY}%`,
                } as React.CSSProperties;

                // Determine CSS Class: Apply custom crop class only if we are using the desktop image and cropping it
                // If a dedicated mobile URL exists, we usually want to show it as-is (cover center)
                const cropClass = (content.enableMobileCrop && !content.mobileBackdropUrl) ? 'mobile-custom-crop' : '';

                // Video Logic
                let embedUrl = '';
                if (isActive && content.trailerUrl) {
                    const videoId = getVideoId(content.trailerUrl);
                    if (videoId) {
                        const origin = typeof window !== 'undefined' ? window.location.origin : '';
                        // Always mute=1 in URL to prevent reload. We control sound via postMessage.
                        embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&loop=1&playlist=${videoId}&playsinline=1&enablejsapi=1&origin=${origin}`;
                    }
                }
                // Video only shows on Desktop
                const shouldShowVideo = isActive && showVideo && embedUrl && !isMobile;

                // Infinite Loop Calculation (Modulo Arithmetic)
                let offset = (index - unboundedIndex) % len;
                if (offset < 0) offset += len; 
                // Adjust to center the active item (0) and have neighbors at 1 and -1 (conceptually)
                if (offset > len / 2) offset -= len;
                
                const baseTranslate = offset * 100;
                
                // Transitions: Snap if dragging, Ease if auto/click
                const transitionStyle = isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
                
                // Fade effect for text to prevent clashing during fast slides
                const textOpacityClass = isDirectJump 
                    ? (isActive ? 'opacity-100' : 'opacity-0') 
                    : 'opacity-100';

                return (
                    <div 
                        // Key includes index to allow wrapping clones to have unique IDs if needed
                        key={`${content.id}-${index}`} 
                        className="absolute top-0 left-0 w-full h-full will-change-transform"
                        style={{ 
                            transform: `translateX(calc(${baseTranslate}% + ${dragOffset}px))`,
                            transition: transitionStyle,
                            zIndex: isActive ? 20 : 10 
                        }}
                    >
                        {/* 1. Background Layer (Using <picture> for instant mobile switching) */}
                        <div className="absolute inset-0 w-full h-full">
                            {shouldShowVideo && (
                                <div className="absolute inset-0 w-full h-full overflow-hidden z-0 animate-fade-in-up pointer-events-none"> 
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full aspect-video pointer-events-none">
                                        <iframe 
                                            ref={activeIframeRef}
                                            src={embedUrl} 
                                            className="w-full h-full pointer-events-none" 
                                            allow="autoplay; encrypted-media; picture-in-picture" 
                                            title={`Trailer for ${content.title}`}
                                            frameBorder="0"
                                        ></iframe>
                                    </div>
                                </div>
                            )}

                            {/* THE FIX: Use <picture> element. Browser chooses source BEFORE loading/rendering */}
                            <picture className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-1000 ${shouldShowVideo ? 'opacity-0' : 'opacity-100'}`}>
                                {/* 1. Mobile Source: If dedicated mobile image exists, use it for screens < 768px */}
                                {content.mobileBackdropUrl && (
                                    <source media="(max-width: 767px)" srcSet={content.mobileBackdropUrl} />
                                )}
                                
                                {/* 2. Desktop/Default Source: Used for desktop OR fallback for mobile */}
                                <img 
                                    src={content.backdrop} 
                                    alt={content.title} 
                                    className={`absolute inset-0 w-full h-full object-cover z-10 pointer-events-none ${cropClass}`}
                                    style={imgStyle}
                                    draggable={false}
                                    loading={isActive ? "eager" : "lazy"}
                                />
                            </picture>

                            {/* Gradient Overlays */}
                            <div className={`absolute inset-0 z-20 pointer-events-none
                                ${isRamadanTheme 
                                    ? "bg-gradient-to-t from-black via-black/80 via-25% to-transparent"
                                    : "bg-gradient-to-t from-[var(--bg-body)] via-[var(--bg-body)]/60 via-40% to-transparent"
                                }`}>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-body)]/90 via-[var(--bg-body)]/40 via-50% to-transparent z-20 hidden md:block pointer-events-none"></div>
                        </div>

                        {/* 2. Content Overlay Layer */}
                        <div className={`
                            absolute inset-0 z-30 flex flex-col justify-end px-4 md:px-12 pb-4 md:pb-32 text-white pointer-events-none 
                            transition-opacity duration-500 ease-in-out
                            ${textOpacityClass}
                        `}>
                            
                            <div className="max-w-3xl w-full flex flex-col items-center md:items-start text-center md:text-right pointer-events-auto">
                                
                                {content.bannerNote && (
                                    <div className={`
                                        mb-1 md:mb-2 text-sm font-medium shadow-sm w-fit animate-fade-in-up
                                        ${isRamadanTheme 
                                            ? 'bg-[#D4AF37]/10 text-white border border-[#D4AF37]/10 px-3 py-1 rounded-lg backdrop-blur-md' 
                                            : isEidTheme
                                                ? 'bg-purple-600/10 text-white border border-purple-500/10 px-3 py-1 rounded-lg backdrop-blur-md'
                                                : isCosmicTealTheme
                                                    ? 'bg-[#35F18B]/10 text-white border border-[#35F18B]/10 px-3 py-1 rounded-lg backdrop-blur-md'
                                                    : isNetflixRedTheme
                                                        ? 'bg-[#E50914]/20 text-white border border-[#E50914]/20 px-3 py-1 rounded-lg backdrop-blur-md'
                                                        : 'bg-[rgba(15,35,55,0.5)] text-[#00D2FF] border border-[rgba(0,210,255,0.3)] rounded-[6px] px-[12px] py-[4px] backdrop-blur-[4px]'}
                                    `}>
                                        {content.bannerNote}
                                    </div>
                                )}

                                <div className={`transition-all duration-700 ease-in-out transform origin-center md:origin-right ${shouldShowVideo ? 'translate-y-4 scale-75 mb-1 md:mb-2' : 'translate-y-0 scale-100 mb-2 md:mb-6'}`}>
                                    {content.isLogoEnabled && content.logoUrl ? (
                                        <img 
                                            src={content.logoUrl} 
                                            alt={content.title} 
                                            className="w-auto h-auto max-w-[190px] md:max-w-[380px] max-h-[165px] md:max-h-[245px] object-contain drop-shadow-2xl mx-auto md:mx-0"
                                            draggable={false}
                                        />
                                    ) : (
                                        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg leading-tight">
                                            {content.title}
                                        </h1>
                                    )}
                                </div>

                                <div className={`flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3 text-xs md:text-base font-medium text-gray-200 transition-all duration-700 ease-in-out w-full ${shouldShowVideo ? 'mb-1 md:mb-2 opacity-80' : 'mb-1 md:mb-3 opacity-100'}`}>
                                    <div className="flex items-center gap-1.5 text-yellow-400 bg-black/40 backdrop-blur-md px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-white/10">
                                        <StarIcon className="w-3 h-3 md:w-4 md:h-4" />
                                        <span className="font-bold text-white">{content.rating.toFixed(1)}</span>
                                    </div>
                                    <span className="text-gray-500 text-sm md:text-lg">|</span>
                                    <span>{content.releaseYear}</span>
                                    {content.ageRating && (
                                        <>
                                            <span className="text-gray-500 text-sm md:text-lg">|</span>
                                            <span className="border border-gray-500 px-1.5 py-0.5 md:px-2 md:py-0.5 rounded text-[10px] md:text-xs backdrop-blur-sm bg-white/5">{content.ageRating}</span>
                                        </>
                                    )}
                                    {content.type === 'movie' && content.duration && (
                                        <>
                                            <span className="text-gray-500 text-sm md:text-lg">|</span>
                                            <div className="flex items-center gap-1 px-2 py-0.5 border border-gray-500 rounded text-gray-300 text-[10px] md:text-xs backdrop-blur-sm bg-white/5">
                                                <ClockIcon className="w-3 h-3 md:w-4 md:h-4" />
                                                <span dir="ltr">{content.duration}</span>
                                            </div>
                                        </>
                                    )}
                                    {content.genres && content.genres.length > 0 && (
                                        <>
                                            <span className="text-gray-500 text-sm md:text-lg">|</span>
                                            <div className="flex items-center gap-2">
                                                {content.genres.slice(0, 3).map((genre, index) => (
                                                    <React.Fragment key={index}>
                                                        <span className={isRamadanTheme ? 'text-[#FFD700]' : isEidTheme ? 'text-purple-400' : isCosmicTealTheme ? 'text-[#35F18B]' : isNetflixRedTheme ? 'text-[#E50914]' : 'text-[#00A7F8]'}>
                                                            {genre}
                                                        </span>
                                                        {index < Math.min(content.genres.length, 3) - 1 && <span className="text-gray-500 text-[10px] md:text-xs">|</span>}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {!hideDescription && (
                                    <div className={`overflow-hidden transition-all duration-700 ease-in-out w-full ${shouldShowVideo ? 'opacity-0 max-h-0 mb-0' : 'opacity-100 max-h-40 mb-3 md:mb-4'}`}>
                                        <p className="text-gray-300 text-xs sm:text-sm md:text-lg line-clamp-2 md:line-clamp-3 leading-relaxed mx-auto md:mx-0 max-w-xl font-medium">
                                            {content.description}
                                        </p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-4 w-full justify-center md:justify-start relative z-40 mt-1 md:mt-2">
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
                                    
                                    {shouldShowVideo && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsMuted(!isMuted); }}
                                            className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 transition-all z-50 group scale-[1.15] origin-center"
                                            title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
                                        >
                                            <SpeakerIcon isMuted={isMuted} className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                                        </button>
                                    )}
                                </div>

                                {/* Mobile Dots - Moved Below Actions */}
                                {hasMultiple && renderDots("mt-4 md:hidden")}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Desktop Thumbnail Navigation - INCREASED GAP HERE */}
            {hasMultiple && (
                <div className="hidden md:flex absolute bottom-0 left-0 right-0 w-full z-40 justify-center items-end gap-10 animate-fade-in-up px-4 pb-0 pointer-events-none">
                    {contents.map((c, idx) => {
                        const isActiveItem = idx === activeIndex;
                        const indicatorColor = isRamadanTheme ? 'bg-[#FFD700]' : isEidTheme ? 'bg-purple-500' : isCosmicTealTheme ? 'bg-[#35F18B]' : isNetflixRedTheme ? 'bg-[#E50914]' : 'bg-[#00A7F8]';

                        return (
                            <button 
                                key={`thumb-${c.id}`} 
                                onClick={(e) => { e.stopPropagation(); handleManualSlide(idx); }}
                                className={`relative transition-all duration-500 ease-out group flex flex-col items-center gap-2 pb-2 pointer-events-auto ${isActiveItem ? `opacity-100 scale-110 filter-none` : 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0 hover:scale-105'}`}
                                title={c.title}
                            >
                                {c.logoUrl ? (
                                    <img src={c.logoUrl} alt={c.title} className="h-20 w-auto object-contain max-w-[140px] drop-shadow-lg" loading="lazy" />
                                ) : (
                                    <span className="text-sm font-bold text-white max-w-[100px] truncate block bg-black/50 px-3 py-1 rounded">{c.title}</span>
                                )}
                                <div className={`h-[3px] rounded-full transition-all duration-300 mt-1 ${isActiveItem ? `w-12 opacity-100 ${indicatorColor} shadow-[0_0_8px_rgba(255,255,255,0.3)]` : 'w-0 opacity-0 bg-transparent'}`}></div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
      );
};

export default Hero;