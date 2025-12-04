
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Content } from '../types';
import { StarIcon } from './icons/StarIcon';
import ActionButtons from './ActionButtons';
import { SpeakerIcon } from './icons/SpeakerIcon';

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
}

const Hero: React.FC<HeroProps> = ({ contents, onWatchNow, isLoggedIn, myList, onToggleMyList, autoSlideInterval, isRamadanTheme, isEidTheme, isCosmicTealTheme, isNetflixRedTheme }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Interaction States
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number>(0);
  const [dragOffset, setDragOffset] = useState<number>(0); // in pixels
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Video Background States
  const [showVideo, setShowVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Helpers ---
  const getPrevIndex = (idx: number) => (idx === 0 ? contents.length - 1 : idx - 1);
  const getNextIndex = (idx: number) => (idx === contents.length - 1 ? 0 : idx + 1);

  // We need at least 2 items to slide effectively. If 1, we just show it static.
  const hasMultiple = contents.length > 1;

  // --- Video Logic ---
  const extractVideoID = (url?: string) => {
      if (!url) return null;
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[7].length === 11) ? match[7] : null;
  };

  const toggleMute = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
          const newMuteState = !isMuted;
          const command = newMuteState ? 'mute' : 'unMute';
          iframeRef.current.contentWindow.postMessage(JSON.stringify({
              event: 'command',
              func: command,
              args: []
          }), '*');
          setIsMuted(newMuteState);
      }
  };

  // --- Auto Slide Logic ---
  const startTimer = useCallback(() => {
      if (!hasMultiple || !autoSlideInterval) return;
      stopTimer(); 
      intervalRef.current = setInterval(() => {
          handleSlide('next');
      }, autoSlideInterval);
  }, [hasMultiple, autoSlideInterval]);

  const stopTimer = () => {
      if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
      }
  };

  // Handle slide change video logic reset
  useEffect(() => {
      // 1. Reset Video State
      setShowVideo(false);
      setVideoLoaded(false);
      setIsMuted(true);
      if (videoTimeoutRef.current) clearTimeout(videoTimeoutRef.current);

      // 2. Setup Video Timer if applicable
      const currentContent = contents[currentIndex];
      const videoId = extractVideoID(currentContent?.trailerUrl);
      
      // Simple Mobile Check to avoid burning data
      const isMobile = window.innerWidth < 768; 

      if (videoId && !isMobile) {
          // Delay showing the video to allow poster to be seen first and improve perceived speed
          videoTimeoutRef.current = setTimeout(() => {
              setShowVideo(true);
          }, 3000); // 3 seconds delay
      }

      return () => {
          if (videoTimeoutRef.current) clearTimeout(videoTimeoutRef.current);
      };
  }, [currentIndex, contents]);

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [startTimer]);

  // --- Slide Action ---
  const handleSlide = (direction: 'next' | 'prev') => {
      if (isAnimating || !containerRef.current) return;
      
      stopTimer();
      setIsAnimating(true);
      
      const width = containerRef.current.offsetWidth;
      const targetOffset = direction === 'next' ? -width : width;

      setDragOffset(targetOffset);

      setTimeout(() => {
          // After animation completes:
          setCurrentIndex(prev => direction === 'next' ? getNextIndex(prev) : getPrevIndex(prev));
          setIsAnimating(false); 
          setDragOffset(0);
          startTimer();
      }, 300); // Match CSS transition duration
  };

  // --- Interaction Handlers ---
  const handleStart = (clientX: number) => {
      if (isAnimating || !hasMultiple) return;
      stopTimer();
      setIsDragging(true);
      setDragStart(clientX);
  };

  const handleMove = (clientX: number) => {
      if (!isDragging) return;
      const diff = clientX - dragStart;
      setDragOffset(diff);
  };

  const handleEnd = () => {
      if (!isDragging || !containerRef.current) return;
      setIsDragging(false);

      const width = containerRef.current.offsetWidth;
      const threshold = width * 0.20; // Reduced threshold for easier swiping

      if (dragOffset < -threshold) {
          // User dragged left -> Go Next
          setIsAnimating(true);
          setDragOffset(-width);
          setTimeout(() => {
              setCurrentIndex(prev => getNextIndex(prev));
              setIsAnimating(false);
              setDragOffset(0);
              startTimer();
          }, 300);
      } else if (dragOffset > threshold) {
          // User dragged right -> Go Prev
          setIsAnimating(true);
          setDragOffset(width);
          setTimeout(() => {
              setCurrentIndex(prev => getPrevIndex(prev));
              setIsAnimating(false);
              setDragOffset(0);
              startTimer();
          }, 300);
      } else {
          // Snap back to 0 (Cancel)
          setIsAnimating(true);
          setDragOffset(0);
          setTimeout(() => {
              setIsAnimating(false);
              startTimer();
          }, 300);
      }
  };


  // --- Render Helper ---
  const renderDots = (className: string) => (
      <div className={`flex gap-2 pointer-events-none justify-center w-full ${className}`} dir="rtl">
        {contents.map((_, idx) => (
            <button 
                key={idx}
                // pointer-events-auto allows clicking the dots
                className={`h-1.5 md:h-2 rounded-full transition-all duration-300 pointer-events-auto cursor-pointer 
                    ${currentIndex === idx 
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
                    e.stopPropagation(); // Prevent triggering drag logic
                    if (currentIndex === idx || isAnimating) return;
                    const dir = idx > currentIndex ? 'next' : 'prev';
                    handleSlide(dir);
                    setCurrentIndex(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
            />
        ))}
    </div>
  );

  const renderSlide = (content: Content, position: 'prev' | 'curr' | 'next') => {
      if (!content) return null;
      
      let baseTranslate = 0;
      if (position === 'prev') baseTranslate = -100;
      if (position === 'next') baseTranslate = 100;

      const style: React.CSSProperties = {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: `translateX(calc(${baseTranslate}% + ${dragOffset}px))`,
          transition: isAnimating ? 'transform 300ms ease-out' : 'none',
          // Ensure current slide is on top during transitions
          zIndex: position === 'curr' ? 20 : 10 
      };

      const isActive = position === 'curr';
      const videoID = extractVideoID(content.trailerUrl);
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      
      // Determine if we should attempt to show video for this slide
      // Only show if it's the current slide, video exists, showVideo is true, and NOT animating/dragging
      const shouldPlayVideo = isActive && videoID && showVideo && !isAnimating && !isDragging && !isMobile;

      // Use global CSS variable for background to allow theme switching (Black/Blue)
      // UPDATED: Cosmic Teal now uses a specific inline style for the precise gradient requirement.
      const gradientClass = isRamadanTheme 
          ? "bg-gradient-to-t from-black via-black/80 via-25% to-transparent" 
          : isCosmicTealTheme
            ? "" // Handled by style prop
            : "bg-gradient-to-t from-[var(--bg-body)] via-[var(--bg-body)]/60 via-40% to-transparent";

      // Custom Gradient Style for Cosmic Teal to match precise spec
      // Modified to be solid #0b1116 at 0% to blend seamlessly with the new body background
      // Shifted stop points down to allow more image visibility (transparency extends longer)
      const gradientStyle: React.CSSProperties = isCosmicTealTheme 
        ? { background: 'linear-gradient(to top, #0b1116 0%, rgba(11, 17, 22, 0.8) 10%, rgba(11, 17, 22, 0) 60%)' }
        : {};

      // Custom Logic for Mobile Crop via CSS Variables
      const cropStyle: React.CSSProperties = content.enableMobileCrop ? {
          '--mob-x': `${content.mobileCropPositionX ?? content.mobileCropPosition ?? 50}%`,
          '--mob-y': `${content.mobileCropPositionY ?? 50}%`,
      } as React.CSSProperties : {};

      return (
        <div 
            key={`${content.id}-${position}`}
            style={style}
            dir="rtl" 
        >
            {/* Background Image - Z-Index 0 */}
            <div className="absolute inset-0 z-0">
                <img 
                    src={content.backdrop} 
                    alt={content.title} 
                    className={`w-full h-full object-cover object-top md:object-center ${content.enableMobileCrop ? 'mobile-custom-crop' : ''}`}
                    style={cropStyle}
                    draggable={false}
                />
                <div className="absolute inset-0 bg-black/20"></div>
            </div>

            {/* Video Background Layer - Z-Index 5 (Above Image, Below Gradient) */}
            {shouldPlayVideo && (
                <div className={`absolute inset-0 z-5 overflow-hidden transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="relative w-full h-full pointer-events-none scale-[1.35]"> {/* Scale to remove black bars */}
                        <iframe
                            ref={iframeRef}
                            src={`https://www.youtube.com/embed/${videoID}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoID}&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                            className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2 object-cover pointer-events-none"
                            title="Hero Video"
                            frameBorder="0"
                            allow="autoplay; encrypted-media"
                            onLoad={() => setVideoLoaded(true)}
                        />
                    </div>
                </div>
            )}

            {/* 
                Gradient Overlay
                Adjusted dynamically to blend with the correct page background
            */}
            <div className={`absolute inset-0 z-10 ${gradientClass}`} style={gradientStyle}></div>
             
            {isRamadanTheme && (
                <div className="absolute inset-0 bg-gradient-to-r from-amber-950/40 via-transparent to-transparent mix-blend-multiply pointer-events-none z-10"></div>
            )}
            {isEidTheme && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-950/40 via-transparent to-transparent mix-blend-multiply pointer-events-none z-10"></div>
            )}
            {/* Cosmic Teal: Removed horizontal gradient to ensure purely vertical flow */}

            {/* Content Info - Z-Index 30 (Moved above gradient) */}
            {/* FIX: Enforced px-4 and pb-8 specifically for Mobile */}
            <div className="absolute inset-0 z-30 flex flex-col justify-end px-4 md:px-16 pb-8 md:pb-10 text-white pointer-events-none">
                {/* FIX: Enforced items-center and text-center specifically for Mobile */}
                <div className={`max-w-2xl w-full transition-opacity duration-300 pointer-events-auto flex flex-col items-center md:items-start text-center md:text-right relative ${isActive ? 'opacity-100' : 'opacity-100'}`}>
                    
                    {/* Banner Note - Featured Text */}
                    {content.bannerNote && (
                        <div className={`
                            mb-2 text-sm font-bold shadow-sm w-fit
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

                    {/* Title Logic: Logo vs Text */}
                    {content.isLogoEnabled && content.logoUrl ? (
                        <img 
                            src={content.logoUrl} 
                            alt={content.title} 
                            className="w-auto h-auto max-w-[200px] md:max-w-[450px] mb-2 md:mb-4 object-contain drop-shadow-xl mx-auto md:mx-0"
                            draggable={false}
                        />
                    ) : (
                        <h1 className={`text-3xl sm:text-5xl md:text-7xl font-extrabold mb-1 md:mb-4 leading-tight 
                            ${isRamadanTheme 
                                ? 'text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-amber-400 drop-shadow-lg' 
                                : isEidTheme 
                                    ? 'text-transparent bg-clip-text bg-gradient-to-b from-purple-100 to-purple-400 drop-shadow-lg' 
                                    : isCosmicTealTheme
                                        ? 'text-white drop-shadow-[0_0_10px_rgba(53,241,139,0.3)]'
                                        : 'text-white'
                            }`}>
                            {content.title}
                        </h1>
                    )}

                    {/* Meta: Reduced gap and margin on mobile */}
                    <div className="flex items-center justify-center md:justify-start gap-2 md:gap-6 mb-1 md:mb-5 text-gray-300 text-xs md:text-base font-medium w-full">
                        <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-white/10">
                        <StarIcon className="text-[#FFD700] w-3 h-3 md:w-5 md:h-5" />
                        <span className="font-bold text-white">{content.rating.toFixed(1)}</span>
                        </div>
                        <span>{content.releaseYear}</span>
                        {/* Age Rating in Meta is still useful for context, kept but styled subtly */}
                        <span className={`border px-1.5 py-0.5 rounded ${isRamadanTheme ? 'border-amber-500/50 text-amber-100' : isEidTheme ? 'border-purple-500/50 text-purple-200' : isCosmicTealTheme ? 'border-[#35F18B]/50 text-[#35F18B]' : isNetflixRedTheme ? 'border-[#E50914]/50 text-white' : 'border-gray-500'}`}>{content.ageRating}</span>
                        
                        <div className="flex items-center">
                            {content.genres.slice(0, 3).map((g, index, arr) => (
                                <React.Fragment key={g}>
                                    <span className="text-gray-400">{g}</span>
                                    {index < arr.length - 1 && <span className="mx-1.5 md:mx-2 text-gray-500">|</span>}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                    
                    {/* Description: Limit to 2 lines on mobile for better visibility of image */}
                    <p className="text-gray-100 text-xs sm:text-lg md:text-xl mb-2 md:mb-8 line-clamp-2 md:line-clamp-3 leading-relaxed max-w-xl opacity-90 drop-shadow-md mx-auto md:mx-0">
                        {content.description}
                    </p>

                    {/* Mobile Dots: Placed BEFORE buttons */}
                    {hasMultiple && renderDots("mb-2 md:hidden")}

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
                        />
                        
                        {/* Mute Toggle Button (Visible only when video is active) */}
                        {shouldPlayVideo && videoLoaded && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                                className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 transition-all z-50 group mt-2 md:mt-6"
                                title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
                            >
                                <SpeakerIcon isMuted={isMuted} className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      );
  };

  if (contents.length === 0) {
    return (
      <div className="relative h-[80vh] md:h-[85vh] w-full bg-black flex items-center justify-center">
        <p className="text-gray-500">لا يوجد محتوى مميز لعرضه حالياً.</p>
      </div>
    );
  }

  return (
    <div 
        ref={containerRef}
        // FIX: Enforced 80vh on mobile and 90vh on desktop exactly as requested
        className="relative h-[80vh] sm:h-[80vh] md:h-[90vh] w-full overflow-hidden bg-black select-none touch-pan-y group"
        onTouchStart={(e) => handleStart(e.targetTouches[0].clientX)}
        onTouchMove={(e) => handleMove(e.targetTouches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => {
             if ((e.target as HTMLElement).closest('button, a, .action-buttons-container')) return;
             e.preventDefault();
             handleStart(e.clientX);
        }}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={() => { if(isDragging) handleEnd() }}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        dir="ltr" 
    >
        {hasMultiple ? (
            <>
                {renderSlide(contents[getPrevIndex(currentIndex)], 'prev')}
                {renderSlide(contents[currentIndex], 'curr')}
                {renderSlide(contents[getNextIndex(currentIndex)], 'next')}
            </>
        ) : (
             renderSlide(contents[0], 'curr')
        )}

        {/* Desktop Dots: Bottom Absolute Position */}
        {hasMultiple && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 hidden md:flex gap-2 pointer-events-none" dir="rtl">
                {contents.map((_, idx) => (
                    <button 
                        key={idx}
                        className={`h-2 rounded-full transition-all duration-300 pointer-events-auto cursor-pointer 
                            ${currentIndex === idx 
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
                            if (currentIndex === idx || isAnimating) return;
                            const dir = idx > currentIndex ? 'next' : 'prev';
                            handleSlide(dir);
                            setCurrentIndex(idx);
                        }}
                    />
                ))}
            </div>
        )}
    </div>
  );
};

export default Hero;
