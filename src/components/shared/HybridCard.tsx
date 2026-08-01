import React, { useState, useRef, useEffect } from 'react';
import type { Content } from '@/types';
import { PlayIcon } from '../icons/PlayIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { SpeakerIcon } from '../icons/SpeakerIcon';
import { CloseIcon } from '../icons/CloseIcon';

interface HybridCardProps {
    content: Content;
    index: number;
    totalItems: number;
    expandedIndex: number | null;
    shiftX?: number;
    onSetExpandedIndex: (index: number | null, pushAmount?: number) => void;
    onSelectContent: (content: Content) => void;
    isLoggedIn: boolean;
    myList?: string[];
    onToggleMyList: (contentId: string) => void;
    isRamadanTheme?: boolean;
    isEidTheme?: boolean;
    isCosmicTealTheme?: boolean;
    isNetflixRedTheme?: boolean;
    isSoonCarousel?: boolean;
}

const HybridCard: React.FC<HybridCardProps> = ({
    content,
    index,
    totalItems,
    expandedIndex,
    shiftX = 0,
    onSetExpandedIndex,
    onSelectContent,
    isLoggedIn,
    myList,
    onToggleMyList,
    isRamadanTheme,
    isEidTheme,
    isCosmicTealTheme,
    isNetflixRedTheme,
    isSoonCarousel
}) => {
    const isExpanded = expandedIndex === index;
    const [showVideo, setShowVideo] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const videoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const isInMyList = !!myList?.includes(content.id);
    const isEpisodic = content.type === 'series' || content.type === 'program';

    const latestSeason = isEpisodic && content.seasons && content.seasons.length > 0
        ? isSoonCarousel
            ? [...content.seasons].sort((a, b) => b.seasonNumber - a.seasonNumber)[0]
            : [...content.seasons].filter(season => season.status !== 'coming_soon' && !season.isUpcoming).sort((a, b) => b.seasonNumber - a.seasonNumber)[0] || [...content.seasons].sort((a, b) => b.seasonNumber - a.seasonNumber)[0]
        : null;

    const posterSrc = (isEpisodic && latestSeason?.poster) ? latestSeason.poster : content.poster;
    const backdropSrc = (isEpisodic && latestSeason?.backdrop) ? latestSeason.backdrop : (content.backdrop || content.poster);
    const logoSrc = (isEpisodic && latestSeason?.logoUrl) ? latestSeason.logoUrl : content.logoUrl;

    const getCollapsedImage = (): string => {
        if (content.top10Poster && content.top10Poster.trim() !== '') {
            return content.top10Poster;
        }
        const verticalGallery = content.imageGallery?.verticalBackdrop?.[0];
        if (verticalGallery && verticalGallery.trim() !== '') {
            return verticalGallery;
        }
        if (content.mobileBackdropUrl && content.mobileBackdropUrl.trim() !== '') {
            return content.mobileBackdropUrl;
        }
        if (isEpisodic && latestSeason?.mobileImageUrl && latestSeason.mobileImageUrl.trim() !== '') {
            return latestSeason.mobileImageUrl;
        }
        if (backdropSrc && backdropSrc.trim() !== '') {
            return backdropSrc;
        }
        return posterSrc;
    };

    const collapsedImgSrc = getCollapsedImage();

    const getVideoId = (url: string | undefined) => {
        if (!url) return null;
        try {
            if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
            if (url.includes('v=')) return url.split('v=')[1].split('&')[0];
            if (url.includes('embed/')) return url.split('embed/')[1].split('?')[0];
            return null;
        } catch (e) { return null; }
    };

    const trailerUrl = (isEpisodic && latestSeason?.trailerUrl) ? latestSeason.trailerUrl : content.trailerUrl;
    const trailerId = getVideoId(trailerUrl);
    const hasTrailer = !!trailerId;

    const calculateRealPush = () => {
        if (!cardRef.current) return 0;
        const rect = cardRef.current.getBoundingClientRect();
        
        const currentWidth = rect.width;
        // مقدار الزيادة في العرض عند التكبير (3.2x - 1x = 2.2x)
        const extraWidth = currentWidth * 2.2; 
        
        // التعديل الجذري: ترك مساحة ظاهرة من الكارت التالي بنسبة 20% (بين 15% و 25%) بالإضافة لمسافة أمان
        const visiblePeek = currentWidth * 0.20;
        const safetyMargin = 16 + visiblePeek;
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;

        // عند التمدد ناحية الشمال في Flexbox RTL
        const projectedLeft = rect.left - extraWidth;

        // إذا كان التمدد سيتسبب في خروج الكارت أو تغطية النسبة المطلوب إظهارها من الكارت التالي
        if (projectedLeft < safetyMargin) {
            // الشفت ناحية اليمين المطلوب لإبقاء الكارت داخل الشاشة مع ترك الجزء المرئي من الكارت التالي
            const neededShiftRight = safetyMargin - projectedLeft;

            // التأكد من أن الشفت لليمين لا يخرج حافة الكارت اليمين بره حدود الشاشة
            const maxAllowedShift = Math.max(0, viewportWidth - safetyMargin - rect.right);
            return Math.min(neededShiftRight, maxAllowedShift);
        }

        return 0;
    };

    const handleMouseEnter = () => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = setTimeout(() => {
            const pushAmount = calculateRealPush();
            onSetExpandedIndex(index, pushAmount);
        }, 350);
    };

    const handleMouseLeave = () => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        if (videoTimerRef.current) {
            clearTimeout(videoTimerRef.current);
            videoTimerRef.current = null;
        }
        if (isExpanded) {
            onSetExpandedIndex(null, 0);
            setShowVideo(false);
            setIsMuted(true);
        }
    };

    useEffect(() => {
        if (isExpanded && hasTrailer) {
            videoTimerRef.current = setTimeout(() => {
                setShowVideo(true);
            }, 400); 
        } else {
            setShowVideo(false);
        }
        return () => {
            if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
        };
    }, [isExpanded, hasTrailer]);

    useEffect(() => {
        if (showVideo && iframeRef.current) {
            const command = isMuted ? 'mute' : 'unMute';
            try {
                iframeRef.current.contentWindow?.postMessage(JSON.stringify({
                    event: 'command',
                    func: command,
                    args: ''
                }), '*');
            } catch (e) {}
        }
    }, [isMuted, showVideo]);

    const seasonNumber = latestSeason ? latestSeason.seasonNumber : null;
    const watchSubtitle = isEpisodic && seasonNumber ? `الموسم ${seasonNumber}، الحلقة 1` : content.releaseYear;
    const genres = content.genres?.slice(0, 3).join(' • ');

    const getNoteText = (): string | null => {
        if (content.bannerNote && !content.bannerNote.includes('حلقة واحدة') && !content.bannerNote.includes('مجانا')) {
            return content.bannerNote;
        }
        return null;
    };
    const noteText = getNoteText();

    const idleWidthClass = 'w-[calc((100vw-32px)/2.1)] sm:w-[calc((100vw-48px)/3.1)] md:w-[calc((100vw-64px)/4.1)] lg:w-[calc((100vw-64px)/5.1)] xl:w-[calc((100vw-80px)/5.1)]';
    const expandedWidthClass = 'w-[86vw] sm:w-[calc(((100vw-48px)/3.1)*3.2)] md:w-[calc(((100vw-64px)/4.1)*3.2)] lg:w-[calc(((100vw-64px)/5.1)*3.2)] xl:w-[calc(((100vw-80px)/5.1)*3.2)]';

    const detailUrl = content.type === 'movie' 
        ? `/watch/movie/${content.slug || content.id}` 
        : `/series/${content.slug || content.id}${latestSeason ? `/الموسم${latestSeason.seasonNumber}` : ''}${isSoonCarousel ? '?targetSeason=upcoming' : ''}`;

    const flipStyle = { transform: content.flipBackdrop ? 'scaleX(-1)' : 'none' };

    return (
        <div 
            ref={cardRef}
            style={{
                transform: shiftX ? `translateX(${shiftX}px)` : 'none',
            }}
            className={`relative flex-shrink-0 cursor-pointer block no-underline text-inherit transition-[width,transform] duration-500 ease-in-out ${isExpanded ? expandedWidthClass : idleWidthClass} ${isExpanded ? 'z-40' : 'z-0'}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => {
              if(isExpanded) {
                e.preventDefault();
                onSelectContent(content);
              } else {
                e.preventDefault();
                onSetExpandedIndex(index, calculateRealPush());
              }
            }}
        >
            <div className={`relative w-full h-full rounded-xl overflow-hidden transition-all duration-500 ${isExpanded ? 'shadow-2xl border-2 border-white/90 ring-1 ring-white/20' : 'shadow-lg border border-transparent'}`}>
                {isExpanded && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSetExpandedIndex(null);
                        }}
                        className="absolute top-3 right-3 z-50 w-7 h-7 md:w-8 md:h-8 rounded-full bg-black/50 hover:bg-black/80 border border-white/30 hover:border-white text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm shadow-md"
                        title="إغلاق"
                        aria-label="إغلاق"
                    >
                        <CloseIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                    </button>
                )}
                <div className={`${idleWidthClass} aspect-[9/16] invisible pointer-events-none float-left`} aria-hidden="true" />

                <div className="absolute inset-0 w-full h-full">
                    <div className={`absolute inset-0 w-full h-full z-10 transition-opacity duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                        {showVideo && hasTrailer ? (
                            <div 
                                className="relative w-full h-full overflow-hidden bg-black"
                                style={{ transform: content.flipBackdrop ? 'scaleX(-1)' : undefined }}
                            >
                                <iframe 
                                    ref={iframeRef}
                                    src={`https://www.youtube.com/embed/${trailerId}?autoplay=1&mute=1&enablejsapi=1&controls=0&showinfo=0&rel=0&modestbranding=1&loop=1&playlist=${trailerId}&playsinline=1&disablekb=1&iv_load_policy=3&fs=0`}
                                    className="absolute top-1/2 left-1/2 w-[160%] h-[160%] -translate-x-1/2 -translate-y-1/2 pointer-events-none border-none" 
                                    title={content.title}
                                    allow="autoplay; encrypted-media"
                                />
                            </div>
                        ) : (
                            <img src={backdropSrc} style={flipStyle} alt={content.title} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-body)]/90 via-[var(--bg-body)]/25 via-25% to-transparent pointer-events-none"></div>
                    </div>

                    <div className={`absolute inset-0 w-full h-full z-20 transition-opacity duration-500 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        <img src={collapsedImgSrc} alt={content.title} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-x-0 bottom-0 h-[82%] p-4 md:p-5 pb-7 md:pb-9 bg-gradient-to-t from-[var(--bg-body)] via-[var(--bg-body)]/85 via-45% to-transparent flex flex-col justify-end items-center text-center pointer-events-none z-10">
                            {content.isLogoEnabled !== false && logoSrc ? (
                                <img src={logoSrc} alt={content.title} className="h-14 md:h-18 lg:h-20 object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)] max-w-[90%] md:max-w-[92%] mb-2" />
                            ) : (
                                <h3 className="text-white font-black text-base md:text-lg leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] line-clamp-2 mb-2">{content.title}</h3>
                            )}
                        </div>
                    </div>

                    <div className={`absolute inset-0 z-30 flex flex-col justify-end p-4 md:p-6 transition-opacity duration-300 delay-100 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="absolute bottom-4 left-4 z-40">
                             {showVideo && (
                                <button 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMuted(!isMuted); }}
                                    className="w-9 h-9 rounded-full border border-gray-500 hover:border-white flex items-center justify-center text-white bg-black/40 backdrop-blur-sm transition-colors"
                                >
                                    <SpeakerIcon isMuted={isMuted} className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col items-start gap-1 w-full relative z-30 pr-0 pb-1">
                            <div className="pr-2 flex flex-col items-start gap-1 w-full">
                                <div className="mb-1.5">
                                    {content.isLogoEnabled !== false && logoSrc ? (
                                        <img src={logoSrc} alt={content.title} className="h-12 md:h-16 object-contain self-start drop-shadow-md max-w-[75%]" />
                                    ) : (
                                        <h3 className="text-white font-bold text-xl md:text-2xl leading-tight drop-shadow-md line-clamp-1">{content.title}</h3>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm font-medium text-gray-300 mb-1">
                                    {content.releaseYear && <span>{content.releaseYear}</span>}
                                    {seasonNumber && (
                                        <>
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                            <span className="text-gray-200">الموسم {seasonNumber}</span>
                                        </>
                                    )}
                                    {genres && (
                                        <>
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                            <span>{genres}</span>
                                        </>
                                    )}
                                </div>
                                {noteText && (
                                    <div className="text-[#ffb700] text-sm md:text-base font-bold mb-3 drop-shadow-sm">
                                        {noteText}
                                    </div>
                                )}
                            </div>

                            <div className="mt-1 flex items-center gap-2.5 relative z-50">
                                <a 
                                    href={detailUrl}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onSelectContent(content);
                                    }}
                                    className="bg-[#d1d5db] hover:bg-white text-black font-bold px-5 py-2 md:px-6 md:py-2.5 rounded-full flex items-center gap-2 text-xs md:text-sm transition-all shadow-md group/play"
                                >
                                    <PlayIcon className="w-4 h-4 fill-black text-black" />
                                    <span>شاهد الآن</span>
                                </a>
                                <button 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleMyList(content.id); }}
                                    className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/20 hover:bg-white/30 border border-white/10 flex items-center justify-center text-white transition-all"
                                    title="قائمتي"
                                >
                                    {isInMyList ? <CheckIcon className="w-4 h-4 md:w-5 md:h-5 text-green-400" /> : <PlusIcon className="w-4 h-4 md:w-5 md:h-5" />}
                                </button>
                                <button 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/20 hover:bg-white/30 border border-white/10 flex items-center justify-center text-white transition-all"
                                    title="إعجاب"
                                >
                                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HybridCard;