
import React, { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import type { Content, Ad, Episode, Server, Season, View } from '../types';
import VideoPlayer from './VideoPlayer';
import ContentCarousel from './ContentCarousel';
import AdPlacement from './AdPlacement';
import ActionButtons from './ActionButtons';
import { PlayIcon } from './icons/PlayIcon';
import { StarIcon } from './icons/StarIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CloseIcon } from './icons/CloseIcon'; 
import { SpeakerIcon } from './icons/SpeakerIcon';
import { ExpandIcon } from './icons/ExpandIcon';
import SEO from './SEO';
import AdZone from './AdZone';
import AdWaiterModal from './AdWaiterModal';
import ReportModal from './ReportModal';

interface DetailPageProps {
  content: Content;
  ads: Ad[];
  adsEnabled: boolean;
  allContent: Content[];
  onSelectContent: (content: Content) => void;
  isLoggedIn: boolean;
  myList?: string[];
  onToggleMyList: (contentId: string) => void;
  onSetView: (view: View, category?: string, params?: any) => void;
  isRamadanTheme?: boolean;
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
  isNetflixRedTheme?: boolean;
  locationPath?: string; 
}

const DetailPage: React.FC<DetailPageProps> = ({
  content,
  ads,
  adsEnabled,
  allContent,
  onSelectContent,
  isLoggedIn,
  myList,
  onToggleMyList,
  onSetView,
  isRamadanTheme,
  isEidTheme,
  isCosmicTealTheme,
  isNetflixRedTheme,
  locationPath
}) => {
  // Tabs State
  const [activeTab, setActiveTab] = useState<'episodes' | 'trailer' | 'details' | 'related'>('episodes');
  const tabsRef = useRef<HTMLDivElement>(null);
  const playerSectionRef = useRef<HTMLDivElement>(null);
  
  // --- HERO VIDEO STATE ---
  const [showVideo, setShowVideo] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  // --- NEW STATES FOR UPGRADES ---
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Refs for Scroll Control & Player API
  const heroRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // --- HELPER: Find Latest Season ---
  const getLatestSeason = useCallback((seasons?: Season[]) => {
      if (!seasons || seasons.length === 0) return null;
      return [...seasons].sort((a, b) => b.seasonNumber - a.seasonNumber)[0];
  }, []);

  // --- IMMEDIATE INITIALIZATION ---
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(() => {
      if (content.type === 'series' && content.seasons && content.seasons.length > 0) {
          const latest = getLatestSeason(content.seasons);
          return latest ? latest.id : content.seasons[0].id;
      }
      return null;
  });

  // Selected Episode state is used to highlight UI, but not for player (series uses new page)
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(() => {
      if (content.type === 'series' && content.seasons && content.seasons.length > 0) {
          const latest = getLatestSeason(content.seasons);
          return latest?.episodes?.[0] || null;
      }
      return null;
  });

  // --- STATE RESET EFFECT (Fix for Related Content Navigation) ---
  useEffect(() => {
      // 1. Reset Tab to Default
      setActiveTab('episodes');

      // 2. Reset Season & Episode selection for Series
      if (content.type === 'series' && content.seasons && content.seasons.length > 0) {
          const latest = getLatestSeason(content.seasons);
          const targetSeason = latest || content.seasons[0];
          
          if (targetSeason) {
              setSelectedSeasonId(targetSeason.id);
              setSelectedEpisode(targetSeason.episodes?.[0] || null);
          }
      } else {
          // Reset for Movies or empty Series
          setSelectedSeasonId(null);
          setSelectedEpisode(null);
      }
  }, [content.id, content.type, content.seasons, getLatestSeason]);

  // Derived State
  const currentSeason = useMemo(() => content.seasons?.find(s => s.id === selectedSeasonId), [content.seasons, selectedSeasonId]);
  const episodes = useMemo(() => currentSeason?.episodes || [], [currentSeason]);
  
  // Resolve servers based on type (Memoized) and filter out empty URLs
  // Only for MOVIES now
  const activeServers = useMemo(() => {
      let servers: Server[] = [];
      
      if (content.type === 'movie') {
          servers = content.servers || [];
      } 
      // Series episodes are handled in the Watch Page

      // Only return servers that have a valid URL
      return servers.filter(s => s.url && s.url.trim().length > 0);
  }, [content.type, content.servers]);

  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  // Effect to set default server when activeServers changes
  useEffect(() => {
      if (activeServers.length > 0) {
          // Prefer active server, otherwise first valid server
          const defaultServer = activeServers.find(s => s.isActive) || activeServers[0];
          setSelectedServer(defaultServer);
      } else {
          setSelectedServer(null);
      }
  }, [activeServers]); 
  
  // Pre-roll Ad State
  const [showPreroll, setShowPreroll] = useState(false);
  const [prerollTimer, setPrerollTimer] = useState(5);
  const prerollContainerRef = useRef<HTMLDivElement>(null);
  
  // Get Download URL (Movies Only)
  const downloadUrl = selectedServer?.downloadUrl || activeServers[0]?.downloadUrl;

  const isInMyList = !!myList?.includes(content.id);
  
  // Determine if content is playable *INLINE* (i.e., only movies)
  const isContentPlayPlayable = content.type === 'movie';

  const prerollAd = useMemo(() => {
      return adsEnabled ? ads.find(ad => ad.placement === 'watch-preroll' && ad.status === 'active') : null;
  }, [ads, adsEnabled]);

  // Mobile Detection for Background Logic
  const [isMobile, setIsMobile] = useState(false);
  useLayoutEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- TRAILER LOGIC ---
  const getVideoId = (url: string | undefined) => {
      if (!url) return null;
      try {
          if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
          if (url.includes('v=')) return url.split('v=')[1].split('&')[0];
          if (url.includes('embed/')) return url.split('embed/')[1].split('?')[0];
          return null;
      } catch (e) { return null; }
  };

  // Determine which trailer to show: Season-specific or Content-default
  const displayTrailerUrl = (content.type === 'series' && currentSeason?.trailerUrl) 
        ? currentSeason.trailerUrl 
        : content.trailerUrl;

  const trailerVideoId = getVideoId(displayTrailerUrl);

  // 1. Auto-play delay logic
  useEffect(() => {
      // Reset states when content changes
      setShowVideo(false);
      setVideoEnded(false);
      setIsMuted(true);

      if (!trailerVideoId || isMobile) return;

      const timer = setTimeout(() => {
          setShowVideo(true);
      }, 2000); // 2 Seconds Delay

      return () => clearTimeout(timer);
  }, [content.id, trailerVideoId, isMobile]);

  // 2. 60 Seconds Limit Logic (Hero Trailer)
  useEffect(() => {
      let limitTimer: ReturnType<typeof setTimeout>;

      if (showVideo) {
          limitTimer = setTimeout(() => {
              // 1. Manually pause video (to stop audio)
              if (iframeRef.current) {
                  iframeRef.current.contentWindow?.postMessage(JSON.stringify({
                      event: 'command',
                      func: 'pauseVideo',
                      args: ''
                  }), '*');
              }
              // 2. Hide video and revert to poster
              setShowVideo(false);
              setVideoEnded(true);
          }, 60000); // 60 Seconds
      }

      return () => clearTimeout(limitTimer);
  }, [showVideo]);

  // 3. Listen for YouTube "Ended" event via postMessage
  useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
          try {
              if (typeof event.data === 'string') {
                  const data = JSON.parse(event.data);
                  // YouTube API: info delivery. info=0 means ended.
                  if (data.event === 'infoDelivery' && data.info && data.info.playerState === 0) {
                      setShowVideo(false);
                      setVideoEnded(true);
                  }
                  // Handle standardized postMessage from some embed wrappers
                  if (data.event === 'onStateChange' && data.info === 0) {
                      setShowVideo(false);
                      setVideoEnded(true);
                  }
              }
          } catch (e) {
              // Ignore non-JSON messages
          }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 4. Scroll Visibility Rule (Intersection Observer)
  useEffect(() => {
      const observer = new IntersectionObserver(
          ([entry]) => {
              if (iframeRef.current) {
                  // "Out of View" (isIntersecting = false): Stop resource usage (Pause)
                  // "Back in View" (isIntersecting = true): Resume from last point (Play)
                  // Only try to play if it hasn't ended and was supposed to be showing
                  const msg = entry.isIntersecting 
                      ? (showVideo && !videoEnded ? 'playVideo' : null) 
                      : 'pauseVideo';
                  
                  if (msg) {
                      iframeRef.current.contentWindow?.postMessage(JSON.stringify({
                          event: 'command',
                          func: msg,
                          args: ''
                      }), '*');
                  }
              }
          },
          { threshold: 0.0 } // 0.0 means trigger exactly when element leaves viewport completely
      );
      
      if (heroRef.current) observer.observe(heroRef.current);
      return () => observer.disconnect();
  }, [showVideo, videoEnded]);

  const toggleMute = (e: React.MouseEvent) => {
      e.stopPropagation();
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      
      // Toggle mute via postMessage to prevent iframe reload
      if (iframeRef.current) {
          iframeRef.current.contentWindow?.postMessage(JSON.stringify({
              event: 'command',
              func: newMuted ? 'mute' : 'unMute',
              args: ''
          }), '*');
      }
  };

  // --- Logic: Deep Link Parsing & Sync on Load/Change ---
  useEffect(() => {
    const decodedPath = decodeURIComponent(locationPath || window.location.pathname);
    
    if (content.type === 'series' && content.seasons && content.seasons.length > 0) {
        // Parse Season and Episode numbers from URL (Support both Arabic and English segments)
        const seasonMatch = decodedPath.match(/\/(?:الموسم|season)\/(\d+)/i);
        // const episodeMatch = decodedPath.match(/\/(?:الحلقة|episode)\/(\d+)/i); // Not using episode match here currently for selection

        if (seasonMatch && seasonMatch[1]) {
            const sNum = parseInt(seasonMatch[1]);
            const foundS = content.seasons.find(s => s.seasonNumber === sNum);
            
            if (foundS) {
                if (foundS.id !== selectedSeasonId) {
                    setSelectedSeasonId(foundS.id);
                }
            }
        }
    } 
  }, [content.id, content.seasons, content.type, locationPath, selectedSeasonId]);

  // --- Pre-roll Effect (Timer & Script Injection) ---
  useEffect(() => {
      if (isContentPlayPlayable && prerollAd) {
          setShowPreroll(true);
          setPrerollTimer(10);
          
          const interval = setInterval(() => {
              setPrerollTimer(prev => {
                  if (prev <= 1) {
                      clearInterval(interval);
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
          
          return () => clearInterval(interval);
      } else {
          setShowPreroll(false);
      }
  }, [content.id, prerollAd, isContentPlayPlayable]);

  // Inject Script for Pre-roll
  useEffect(() => {
      if (showPreroll && prerollAd && prerollContainerRef.current) {
          const container = prerollContainerRef.current;
          container.innerHTML = ''; // Clear previous content
          
          try {
              const range = document.createRange();
              range.selectNode(container);
              // Fallback to scriptCode if code is missing (backward compatibility)
              const adContent = prerollAd.code || prerollAd.scriptCode || '';
              const fragment = range.createContextualFragment(adContent);
              container.appendChild(fragment);
          } catch (e) {
              console.error("Failed to inject pre-roll ad:", e);
          }
      }
  }, [showPreroll, prerollAd]);

  // --- ACTION AD WAITER LOGIC ---
  const [waiterAdState, setWaiterAdState] = useState<{ isOpen: boolean, ad: Ad | null, onComplete: () => void }>({ isOpen: false, ad: null, onComplete: () => {} });

  const triggerActionWithAd = useCallback((callback: () => void, adPosition: string) => {
      if (!adsEnabled) {
          callback();
          return;
      }

      // Find active action ad
      const actionAd = ads.find(a => (a.placement === adPosition || a.position === adPosition) && a.isActive);

      if (actionAd) {
          setWaiterAdState({
              isOpen: true,
              ad: actionAd,
              onComplete: () => {
                  setWaiterAdState(prev => ({ ...prev, isOpen: false }));
                  callback();
              }
          });
      } else {
          // No ad, execute immediately
          callback();
      }
  }, [ads, adsEnabled]);


  // --- Handlers ---

  const handleWatchScroll = () => {
    setActiveTab('episodes');
    setTimeout(() => {
        tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  
  const handleSeasonSelect = (seasonId: number) => {
      setSelectedSeasonId(seasonId);
  };

  const handleEpisodeSelect = (episode: Episode, seasonNum?: number, episodeIndex?: number) => {
      // NAVIGATE TO WATCH PAGE FOR SERIES
      if (content.type === 'series') {
          const sNum = seasonNum ?? currentSeason?.seasonNumber ?? 1;
          
          let eNum = episodeIndex;
          if (!eNum && currentSeason) {
              const idx = currentSeason.episodes.findIndex(e => e.id === episode.id);
              eNum = idx + 1;
          }
          
          if (eNum) {
              onSetView('watch', undefined, { season: sNum, episode: eNum });
          }
          return;
      }
      
      // Keep selected logic just for UI highlight in movies (though movies usually don't have episodes)
      setSelectedEpisode(episode);
  };

  const handleServerSelect = (server: Server) => {
      setSelectedServer(server);
  };
  
  const handleSkipPreroll = () => {
      setShowPreroll(false);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
      e.preventDefault();
      if (!downloadUrl) return;
      
      triggerActionWithAd(() => {
          window.open(downloadUrl, '_blank');
      }, 'action_download');
  };

  const similarContent = useMemo(() => {
      return allContent.filter(c => c.id !== content.id && c.categories.some(cat => content.categories.includes(cat))).slice(0, 10);
  }, [content, allContent]);


  // UI Helpers (BACKDROP SELECTION LOGIC)
  let displayBackdrop = content.backdrop;
  let imgStyle: React.CSSProperties | undefined = undefined;
  let isCustomCrop = false;

  // Standard Backdrop Selection (Desktop Default)
  if (content.type === 'series' && currentSeason?.backdrop) {
      displayBackdrop = currentSeason.backdrop;
  }

  // Mobile Override Logic
  if (isMobile) {
      // 1. Check for specific Season Mobile URL
      if (content.type === 'series' && currentSeason) {
          if (currentSeason.useCustomMobileImage && currentSeason.mobileImageUrl) {
              displayBackdrop = currentSeason.mobileImageUrl;
              imgStyle = { objectPosition: 'center' };
          } 
          // 2. Fallback to Content-Level Mobile Backdrop
          else if (content.mobileBackdropUrl) {
              displayBackdrop = content.mobileBackdropUrl;
              imgStyle = { objectPosition: 'center' };
          }
          // 3. Fallback to Crop Logic
          else {
              let posX = currentSeason.mobileCropPositionX ?? currentSeason.mobileCropPosition;
              let posY = currentSeason.mobileCropPositionY;
              
              if (posX === undefined && posY === undefined && content.enableMobileCrop) {
                  posX = content.mobileCropPositionX ?? content.mobileCropPosition ?? 50;
                  posY = content.mobileCropPositionY ?? 50;
              }

              if (posX !== undefined || posY !== undefined) {
                   posX = posX ?? 50;
                   posY = posY ?? 50;
                   imgStyle = { 
                       objectPosition: `${posX}% ${posY}%`,
                       '--mob-x': `${posX}%`,
                       '--mob-y': `${posY}%`
                   } as React.CSSProperties;
                   isCustomCrop = true;
              } else {
                   imgStyle = { objectPosition: 'top center' };
              }
          }
      } 
      // Movie or Series without season selected
      else {
          if (content.mobileBackdropUrl) {
              displayBackdrop = content.mobileBackdropUrl;
              imgStyle = { objectPosition: 'center' };
          }
          else if (content.enableMobileCrop) {
              const posX = content.mobileCropPositionX ?? content.mobileCropPosition ?? 50;
              const posY = content.mobileCropPositionY ?? 50;
              imgStyle = { 
                  objectPosition: `${posX}% ${posY}%`,
                  '--mob-x': `${posX}%`,
                  '--mob-y': `${posY}%`
              } as React.CSSProperties;
              isCustomCrop = true;
          } else {
              imgStyle = { objectPosition: 'top center' };
          }
      }
  }

  const videoPoster = content.type === 'movie' ? content.backdrop : (selectedEpisode?.thumbnail || content.backdrop);
  const displayLogo = (content.type === 'series' && currentSeason?.logoUrl) ? currentSeason.logoUrl : content.logoUrl;
  const displayDescription = (content.type === 'series' && currentSeason?.description) ? currentSeason.description : content.description;
  const displayCast = (content.type === 'series' && currentSeason?.cast && currentSeason.cast.length > 0) ? currentSeason.cast : content.cast;

  const SectionTitle = ({ title, showBar = false }: { title: string, showBar?: boolean }) => (
    <div className="mb-4 flex items-center gap-3">
        {showBar && (
            <div className={`w-1.5 h-6 md:h-8 rounded-full shadow-[0_0_10px_rgba(0,167,248,0.6)] 
                ${isRamadanTheme 
                    ? 'bg-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.6)]' 
                    : isEidTheme
                        ? 'bg-purple-500 shadow-[0_0_15px_rgba(147,112,219,0.6)]'
                        : isCosmicTealTheme
                            ? 'bg-gradient-to-b from-[#35F18B] to-[#2596be] shadow-[0_0_15px_rgba(53,241,139,0.6)]'
                            : isNetflixRedTheme
                                ? 'bg-[#E50914] shadow-[0_0_15px_rgba(229,9,20,0.6)]'
                                : 'bg-gradient-to-b from-[#00A7F8] to-[#00FFB0]'
                }`}></div>
        )}
        <h3 className="text-xl md:text-2xl font-bold text-white">{title}</h3>
    </div>
  );
  
  // --- SEO Optimization ---
  const { title: seoTitle, description: seoDesc, image: seoImage, url: seoUrl, type: seoType } = {
      title: `${content.title} | سينماتيكس`,
      description: content.description?.substring(0, 160),
      image: content.poster,
      url: window.location.href,
      type: 'website' as const
  };

  // --- TRAILER URL (Optimized & Memoized) ---
  const heroEmbedUrl = useMemo(() => {
      if (!trailerVideoId) return '';
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      return `https://www.youtube.com/embed/${trailerVideoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&loop=0&playsinline=1&enablejsapi=1&origin=${origin}`;
  }, [trailerVideoId]);

  const modalEmbedUrl = trailerVideoId ? `https://www.youtube.com/embed/${trailerVideoId}?autoplay=1&mute=0&controls=1&showinfo=0&rel=0&modestbranding=1&playsinline=1` : '';

  // Theme Logic - UPDATED: Clean Tabs (White Text + Colored Underline)
  const activeTabClass = isRamadanTheme 
    ? 'text-white border-[#FFD700]'
    : isEidTheme
        ? 'text-white border-purple-500'
        : isCosmicTealTheme
            ? 'text-white border-[#35F18B]'
            : isNetflixRedTheme
                ? 'text-white border-[#E50914]'
                : 'text-white border-[#00A7F8]';

  const tabHoverClass = 'text-gray-400 border-transparent hover:text-white';

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white pb-0 relative overflow-x-hidden w-full">
      
      <SEO 
        title={seoTitle}
        description={seoDesc}
        image={seoImage}
        type={seoType}
        url={seoUrl}
      />

      {/* Preconnect */}
      {activeServers.map(server => {
          try {
              if (!server.url) return null;
              const origin = new URL(server.url).origin;
              return (
                  <React.Fragment key={origin}>
                      <link rel="preconnect" href={origin} />
                      <link rel="dns-prefetch" href={origin} />
                  </React.Fragment>
              );
          } catch (e) { return null; }
      })}

      {/* --- 1. Hero Section (Unchanged logic, kept consistent) --- */}
      <div ref={heroRef} className="relative h-[80vh] w-full overflow-hidden group z-10">
        <div className="absolute inset-0 bg-black">
            {/* 1.1 Poster Image */}
            <img 
                src={displayBackdrop} 
                alt={content.title} 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${showVideo ? 'opacity-0' : 'opacity-100'} ${!isMobile ? 'md:object-top' : ''} ${isCustomCrop ? 'mobile-custom-crop' : ''}`}
                style={imgStyle} 
                loading="eager"
            />
            
            {/* 1.2 YouTube Trailer (Hero Background) */}
            {heroEmbedUrl && !isMobile && (
                <div className={`absolute inset-0 w-full h-full overflow-hidden transition-opacity duration-1000 ${showVideo ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full aspect-video pointer-events-none">
                        <iframe 
                            ref={iframeRef}
                            src={heroEmbedUrl}
                            className="w-full h-full pointer-events-none" 
                            allow="autoplay; encrypted-media; picture-in-picture" 
                            title="Trailer"
                            frameBorder="0"
                        ></iframe>
                    </div>
                </div>
            )}

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-body)] via-[var(--bg-body)]/80 via-20% to-transparent z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-body)]/80 via-transparent to-transparent z-10 hidden md:block"></div>
        </div>

        {/* Hero Content Layer */}
        <div className="absolute bottom-0 left-0 w-full px-4 md:px-8 pb-4 md:pb-12 flex flex-col justify-end items-start z-20">
            <div className="max-w-4xl w-full flex flex-col items-center md:items-start text-center md:text-right">
                
                {/* Logo/Title */}
                {content.isLogoEnabled && displayLogo ? (
                    <img 
                        src={displayLogo} 
                        alt={content.title} 
                        className={`w-auto h-auto max-w-[250px] md:max-w-[500px] mb-2 md:mb-6 object-contain drop-shadow-2xl mx-auto md:mx-0 transition-transform duration-700 ${showVideo ? 'translate-y-0 scale-75 origin-bottom-right' : 'scale-100'}`}
                        draggable={false}
                    />
                ) : (
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-2 md:mb-4 leading-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-300 drop-shadow-lg">
                        {content.title}
                        {content.type === 'series' && currentSeason && (
                            <span className="block text-2xl md:text-4xl mt-1 md:mt-2 text-white/80 font-normal">{currentSeason.title}</span>
                        )}
                    </h1>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 mb-4 md:mb-8 text-sm md:text-lg font-medium text-gray-200 w-full">
                     <div className="flex items-center gap-1.5 text-yellow-400 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        <StarIcon className="w-5 h-5" />
                        <span className="font-bold text-white">{content.rating.toFixed(1)}</span>
                    </div>
                    
                    <span className="text-white tracking-wide">{currentSeason?.releaseYear || content.releaseYear}</span>
                    
                    {content.ageRating && (
                        <span className="px-2 py-0.5 border border-gray-500 rounded text-gray-300 text-xs md:text-sm">{content.ageRating}</span>
                    )}
                    {content.type === 'movie' && content.duration && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 border border-gray-500 rounded text-gray-300 text-xs md:text-sm backdrop-blur-sm bg-white/5">
                            <ClockIcon className="w-4 h-4" />
                            <span dir="ltr">{content.duration}</span>
                        </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                        {content.genres.map((genre, index) => (
                            <span key={index} className={`${isRamadanTheme ? 'text-[#FFD700]' : isEidTheme ? 'text-purple-400' : isCosmicTealTheme ? 'text-[#35F18B]' : isNetflixRedTheme ? 'text-[#E50914]' : 'text-[#00A7F8]'}`}>
                                {genre}{index < content.genres.length - 1 ? '، ' : ''}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center md:justify-start w-full md:w-auto relative z-40 mt-1 md:mt-2">
                    <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
                        <ActionButtons 
                            onWatch={handleWatchScroll}
                            onToggleMyList={() => onToggleMyList(content.id)}
                            isInMyList={isInMyList}
                            showMyList={isLoggedIn}
                            isRamadanTheme={isRamadanTheme}
                            isEidTheme={isEidTheme}
                            isCosmicTealTheme={isCosmicTealTheme}
                            isNetflixRedTheme={isNetflixRedTheme}
                            className="flex-1 md:flex-none"
                        />

                        {heroEmbedUrl && !isMobile && showVideo && !videoEnded && (
                            <button 
                                onClick={toggleMute} 
                                className="p-5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 transition-all z-50 group"
                                title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
                            >
                                <SpeakerIcon isMuted={isMuted} className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                            </button>
                        )}
                        
                        {trailerVideoId && (showVideo || videoEnded) && (
                            <button 
                                onClick={() => { setActiveTab('trailer'); tabsRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                                className="p-5 bg-gray-600/40 border border-white/30 hover:bg-white/20 backdrop-blur-md rounded-full transition-all z-50 group"
                                title="عرض التريلر"
                            >
                                <ExpandIcon className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- TAB NAVIGATION --- */}
      <div 
        ref={tabsRef}
        className="sticky top-16 md:top-20 z-40 bg-[var(--bg-body)]/95 backdrop-blur-xl border-b border-white/5 shadow-md w-full transition-all duration-300"
      >
          <div className="w-full px-4 md:px-8 overflow-x-auto rtl-scroll">
              <div className="flex items-center gap-6 md:gap-8 min-w-max">
                  {/* Tab 1: Episodes / Watch */}
                  <button 
                    onClick={() => setActiveTab('episodes')}
                    className={`flex items-center gap-2 py-4 px-2 border-b-[3px] font-bold transition-all duration-300 text-base md:text-lg ${activeTab === 'episodes' ? activeTabClass : tabHoverClass}`}
                  >
                      <span>{content.type === 'movie' ? 'المشاهدة' : `الحلقات (${episodes.length})`}</span>
                  </button>

                  {/* Tab 2: Trailer */}
                  {trailerVideoId && (
                      <button 
                        onClick={() => setActiveTab('trailer')}
                        className={`flex items-center gap-2 py-4 px-2 border-b-[3px] font-bold transition-all duration-300 text-base md:text-lg ${activeTab === 'trailer' ? activeTabClass : tabHoverClass}`}
                      >
                          <span>الإعلان</span>
                      </button>
                  )}

                  {/* Tab 3: Details */}
                  <button 
                    onClick={() => setActiveTab('details')}
                    className={`flex items-center gap-2 py-4 px-2 border-b-[3px] font-bold transition-all duration-300 text-base md:text-lg ${activeTab === 'details' ? activeTabClass : tabHoverClass}`}
                  >
                      <span>التفاصيل</span>
                  </button>

                  {/* Tab 4: Related */}
                  <button 
                    onClick={() => setActiveTab('related')}
                    className={`flex items-center gap-2 py-4 px-2 border-b-[3px] font-bold transition-all duration-300 text-base md:text-lg ${activeTab === 'related' ? activeTabClass : tabHoverClass}`}
                  >
                      <span>أعمال مشابهة</span>
                  </button>
              </div>
          </div>
      </div>

      {/* --- TAB CONTENT AREA --- */}
      <div className="relative w-full bg-[var(--bg-body)] min-h-[500px]">
          
          {/* TAB 1: EPISODES / WATCH */}
          {activeTab === 'episodes' && (
              <div className="animate-fade-in-up w-full">
                  {content.type === 'series' && content.seasons && (
                    <div className="px-4 md:px-8 pt-8 w-full">
                        <div className="flex items-center gap-3 overflow-x-auto rtl-scroll pb-4 mb-6">
                            {[...content.seasons].sort((a, b) => a.seasonNumber - b.seasonNumber).map(season => (
                                <button
                                    key={season.id}
                                    onClick={() => handleSeasonSelect(season.id)}
                                    className={`
                                        whitespace-nowrap px-6 py-2.5 rounded-full text-sm md:text-base font-bold transition-all border
                                        ${selectedSeasonId === season.id 
                                            ? (isNetflixRedTheme 
                                                ? 'bg-[#E50914] text-white border-[#E50914] shadow-lg'
                                                : 'bg-white text-black border-white shadow-lg')
                                            : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white'
                                        }
                                    `}
                                >
                                    {season.title || `الموسم ${season.seasonNumber}`}
                                </button>
                            ))}
                        </div>

                        {episodes.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-10 pb-10 px-2">
                                {episodes.map((ep, index) => {
                                    // Highlight logic: Series uses navigation now, so highlighting might just show active if coming back
                                    const isSelected = selectedEpisode?.id === ep.id;
                                    const epTitle = ep.title || `الحلقة ${index + 1}`;
                                    const thumbnailSrc = ep.thumbnail || currentSeason?.backdrop || content.backdrop;
                                    
                                    return (
                                        <div 
                                            key={ep.id}
                                            onClick={() => handleEpisodeSelect(ep, currentSeason?.seasonNumber, index + 1)}
                                            className={`
                                                group cursor-pointer relative rounded-xl bg-[var(--bg-card)] border episode-card-hover flex flex-col h-full overflow-hidden
                                                ${isSelected 
                                                    ? `${isRamadanTheme ? 'border-amber-500' : isEidTheme ? 'border-purple-500' : isCosmicTealTheme ? 'border-[#35F18B]' : isNetflixRedTheme ? 'border-[#E50914]' : 'border-[#00A7F8]'} ring-1 ring-offset-0 ${isRamadanTheme ? 'ring-amber-500' : isEidTheme ? 'ring-purple-500' : isCosmicTealTheme ? 'ring-[#35F18B]' : isNetflixRedTheme ? 'ring-[#E50914]' : 'ring-[#00A7F8]'} shadow-lg` 
                                                    : 'border-gray-800'
                                                }
                                            `}
                                        >
                                            {/* Image Container */}
                                            <div className="relative w-full aspect-video overflow-hidden bg-black flex-shrink-0">
                                                <img 
                                                    src={thumbnailSrc} 
                                                    alt={epTitle}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                                
                                                {/* --- NEW OVERLAY SECTION --- */}
                                                <div className="absolute bottom-3 right-3 left-3 flex justify-between items-end z-20 pointer-events-none">
                                                    {/* Title: Bottom Right, Size 20px (text-xl) */}
                                                    <h4 className={`text-xl font-bold text-white drop-shadow-md leading-none ${isSelected ? 'text-[var(--color-accent)]' : ''}`}>
                                                        {epTitle}
                                                    </h4>

                                                    {/* Duration & Play Icon: Bottom Left */}
                                                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-white shadow-sm">
                                                        <PlayIcon className="w-3.5 h-3.5 fill-current" />
                                                        {ep.duration && (
                                                            <span className="text-xs font-bold font-mono tracking-wider" dir="ltr">
                                                                {ep.duration}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* --------------------------- */}

                                                {/* Progress Bar */}
                                                {ep.progress > 0 && <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700 z-30"><div className="h-full bg-[var(--color-accent)]" style={{ width: `${ep.progress}%` }}></div></div>}
                                            </div>
                                            
                                            {/* Info Section (Story Only) */}
                                            <div className="p-3 md:p-4 flex-1 flex flex-col justify-center">
                                                {/* Description */}
                                                {ep.description ? (
                                                    <p className="text-xs md:text-sm text-gray-400 line-clamp-3 leading-relaxed">
                                                        {ep.description}
                                                    </p>
                                                ) : (
                                                     <p className="text-[10px] md:text-xs text-gray-500">لا يتوفر وصف.</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-gray-500 text-center py-10 bg-gray-900/50 rounded-xl border border-gray-800 mb-10">
                                <p className="text-lg">لا توجد حلقات متاحة لهذا الموسم.</p>
                            </div>
                        )}
                    </div>
                  )}

                  {/* PLAYER ZONE - MOVIES ONLY */}
                  {isContentPlayPlayable && (
                      <div ref={playerSectionRef} className="bg-[var(--bg-body)] py-8 px-4 md:px-8 border-t border-gray-800 w-full">
                         <div className="max-w-6xl mx-auto w-full">
                             <AdPlacement ads={ads} placement="watch-top" isEnabled={adsEnabled} />
                             
                             <div className="flex justify-between items-end mb-6 w-full">
                                 {activeServers.length > 0 && (
                                     <div className="flex-1 overflow-hidden w-full">
                                        <SectionTitle title="سيرفرات المشاهدة" showBar={true} />
                                        {/* Servers Horizontal Scroll - ensure w-full and no wrap */}
                                        <div className="flex items-center gap-3 overflow-x-auto rtl-scroll pb-2 no-scrollbar w-full">
                                            {activeServers.map((server) => (
                                                 <button
                                                    key={server.id}
                                                    onClick={() => handleServerSelect(server)}
                                                    className={`
                                                        flex-shrink-0 px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-sm flex items-center gap-2 whitespace-nowrap target-server-btn
                                                        ${selectedServer?.id === server.id 
                                                            ? (isRamadanTheme 
                                                                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                                                                : isEidTheme
                                                                    ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(147,112,219,0.4)]'
                                                                    : isCosmicTealTheme
                                                                        ? 'bg-[#35F18B] text-black shadow-[0_0_15px_rgba(53,241,139,0.4)]'
                                                                        : isNetflixRedTheme
                                                                            ? 'bg-[#E50914] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]'
                                                                            : 'bg-[#00A7F8] text-black scale-105 shadow-[0_0_15px_rgba(0,167,248,0.4)]')
                                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                                                        }
                                                    `}
                                                >
                                                    <PlayIcon className="w-4 h-4" />
                                                    {server.name}
                                                </button>
                                            ))}
                                        </div>
                                     </div>
                                 )}
                             </div>

                             <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.7)] border border-gray-800 bg-black z-10 group">
                                  {showPreroll && prerollAd ? (
                                      <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
                                          <div className="absolute top-4 right-4 z-[60] bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3">
                                              <span className="text-gray-300 text-xs">إعلان</span>
                                              <div className="h-4 w-px bg-white/20"></div>
                                              {prerollTimer > 0 ? (
                                                  <span className="text-white font-bold text-sm">يمكنك التخطي بعد {prerollTimer} ثانية</span>
                                              ) : (
                                                  <button onClick={handleSkipPreroll} className={`font-bold text-sm flex items-center gap-1 transition-colors ${isCosmicTealTheme ? 'text-[#35F18B] hover:text-white' : isNetflixRedTheme ? 'text-[#E50914] hover:text-white' : 'text-[#00A7F8] hover:text-white'}`}>
                                                      <span>تخطي الإعلان</span>
                                                      <CloseIcon className="w-4 h-4" />
                                                  </button>
                                              )}
                                          </div>
                                          <div className="w-full h-full flex items-center justify-center pointer-events-auto bg-black">
                                              <div ref={prerollContainerRef} className="w-full h-full flex justify-center items-center" />
                                          </div>
                                      </div>
                                  ) : (
                                      <VideoPlayer 
                                          tmdbId={content.id}
                                          type={content.type}
                                          season={1}
                                          episode={1}
                                          manualSrc={selectedServer?.url} 
                                          poster={videoPoster} 
                                          ads={ads}
                                          adsEnabled={adsEnabled}
                                      />
                                  )}
                             </div>
                             
                             <div className="flex justify-end mt-2">
                                 <button 
                                    onClick={() => setIsReportModalOpen(true)}
                                    className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                                 >
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                     </svg>
                                     الإبلاغ عن مشكلة
                                 </button>
                             </div>
                             
                             <AdPlacement ads={ads} placement="watch-below-player" isEnabled={adsEnabled} />

                             {downloadUrl && (
                                 <div className="mt-8 flex justify-center items-center">
                                     <button 
                                        onClick={handleDownloadClick}
                                        className={`relative overflow-hidden group w-full md:w-auto bg-[#151515] hover:bg-[#202020] border border-gray-700 hover:border-opacity-50 rounded-full p-1.5 transition-all duration-300 flex items-center justify-center gap-4 shadow-lg min-w-[280px] target-download-btn`}
                                     >
                                        <div className={`bg-gradient-to-br from-gray-800 to-black p-3 rounded-full border border-gray-700 transition-colors group-hover:border-[#00A7F8]`}>
                                            <DownloadIcon className={`w-6 h-6 transition-transform group-hover:scale-110 text-[#00A7F8]`} />
                                        </div>
                                        <div className="flex flex-col text-right py-2 pl-8">
                                            <span className={`font-bold text-base transition-colors text-white group-hover:text-[#00A7F8]`}>
                                                تحميل بجودة عالية
                                            </span>
                                            <span className="text-gray-500 text-xs mt-0.5 group-hover:text-gray-400">
                                                رابط مباشر وسريع
                                            </span>
                                        </div>
                                     </button>
                                 </div>
                             )}
                         </div>
                      </div>
                  )}
              </div>
          )}

          {/* TAB 2: TRAILER */}
          {activeTab === 'trailer' && trailerVideoId && (
              <div className="px-4 md:px-8 py-8 animate-fade-in-up w-full">
                  <div className="max-w-5xl mx-auto w-full">
                      <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-800 bg-black">
                          <iframe 
                              src={modalEmbedUrl} 
                              className="w-full h-full" 
                              allow="autoplay; encrypted-media; picture-in-picture; fullscreen" 
                              allowFullScreen
                              title="Official Trailer"
                          ></iframe>
                      </div>
                  </div>
              </div>
          )}

          {/* TAB 3: DETAILS */}
          {activeTab === 'details' && (
              <div className="px-4 md:px-8 py-8 animate-fade-in-up w-full">
                  <div className="w-full">
                      <div className="flex flex-col md:flex-row justify-between gap-8 items-start w-full">
                          
                          {/* Right Column: Story & Info (First in DOM due to RTL, visually Right) */}
                          <div className="w-full md:w-[60%] lg:w-[65%] space-y-10 order-1 flex-shrink-0">
                              
                              {/* Story */}
                              <div>
                                  <SectionTitle title="القصة" />
                                  <p className="text-gray-300 text-base md:text-lg leading-loose font-medium text-justify ml-4">
                                      {displayDescription}
                                  </p>
                              </div>

                              {/* Genres */}
                              <div>
                                  <SectionTitle title="التصنيف" />
                                  <div className="flex flex-wrap gap-2">
                                      {content.genres.map((genre, index) => (
                                          <div key={index} className={`px-4 py-2 rounded-lg text-sm font-bold border bg-gray-800/50 border-gray-700 text-gray-300`}>
                                              {genre}
                                          </div>
                                      ))}
                                  </div>
                              </div>

                              {/* Info Grid */}
                              <div>
                                  <SectionTitle title="معلومات إضافية" />
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                      <div className="bg-gray-900/60 p-4 rounded-2xl border border-gray-800 flex flex-col items-center justify-center gap-1">
                                          <span className="text-gray-500 text-xs">التقييم</span>
                                          <div className="flex items-center gap-1 text-yellow-400 font-bold text-xl">
                                              <StarIcon className="w-5 h-5" />
                                              {content.rating}
                                          </div>
                                      </div>
                                      <div className="bg-gray-900/60 p-4 rounded-2xl border border-gray-800 flex flex-col items-center justify-center gap-1">
                                          <span className="text-gray-500 text-xs">سنة الإنتاج</span>
                                          <span className="text-white font-bold text-xl">{content.releaseYear}</span>
                                      </div>
                                      <div className="bg-gray-900/60 p-4 rounded-2xl border border-gray-800 flex flex-col items-center justify-center gap-1">
                                          <span className="text-gray-500 text-xs">التصنيف العمري</span>
                                          <span className="text-white font-bold text-xl">{content.ageRating || 'غير محدد'}</span>
                                      </div>
                                      {content.type === 'movie' && (
                                         <div className="bg-gray-900/60 p-4 rounded-2xl border border-gray-800 flex flex-col items-center justify-center gap-1">
                                              <span className="text-gray-500 text-xs">المدة</span>
                                              <span className="text-white font-bold text-xl dir-ltr">{content.duration || '-'}</span>
                                          </div>
                                      )}
                                  </div>
                              </div>

                          </div>

                          {/* Left Column: Cast (Second in DOM, visually Left) */}
                          <div className="w-full md:w-[35%] lg:w-[30%] order-2 flex-shrink-0">
                              {displayCast && displayCast.length > 0 && (
                                  <div className="bg-gray-900/30 rounded-3xl p-6 border border-white/5 w-full">
                                      <SectionTitle title="طاقم العمل" />
                                      <div className="flex flex-wrap gap-2">
                                          {displayCast.map((actor, index) => (
                                              <div key={index} className="flex-grow text-center bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 cursor-default">
                                                  {actor}
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              )}
                          </div>

                      </div>
                  </div>
                  
                  {adsEnabled && <div className="mt-8"><AdZone position="details_sidebar" /></div>}
              </div>
          )}

          {/* TAB 4: RELATED */}
          {activeTab === 'related' && (
              <div className="py-8 animate-fade-in-up w-full">
                  <AdPlacement ads={ads} placement="watch-above-recommendations" isEnabled={adsEnabled} />
                  <ContentCarousel 
                        title={
                            <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-6 md:h-8 rounded-full shadow-[0_0_10px_rgba(0,167,248,0.6)] bg-gradient-to-b from-[#00A7F8] to-[#00FFB0]`}></div>
                                <span>قد يعجبك أيضاً</span>
                            </div>
                        }
                        contents={similarContent}
                        onSelectContent={onSelectContent}
                        isLoggedIn={isLoggedIn}
                        myList={myList}
                        onToggleMyList={onToggleMyList}
                        isRamadanTheme={isRamadanTheme}
                        isEidTheme={isEidTheme}
                        isCosmicTealTheme={isCosmicTealTheme}
                        isNetflixRedTheme={isNetflixRedTheme}
                    />
              </div>
          )}
      </div>

      <AdPlacement ads={ads} placement="watch-bottom" isEnabled={adsEnabled} />

      {waiterAdState.isOpen && waiterAdState.ad && (
          <AdWaiterModal 
              isOpen={waiterAdState.isOpen}
              ad={waiterAdState.ad}
              onComplete={waiterAdState.onComplete}
              onClose={() => setWaiterAdState(prev => ({ ...prev, isOpen: false }))}
          />
      )}

      {isReportModalOpen && (
          <ReportModal 
              isOpen={isReportModalOpen}
              onClose={() => setIsReportModalOpen(false)}
              contentId={content.id}
              contentTitle={content.title}
              episode={selectedEpisode?.title}
              isCosmicTealTheme={isCosmicTealTheme}
              isNetflixRedTheme={isNetflixRedTheme}
          />
      )}

    </div>
  );
};

export default DetailPage;
