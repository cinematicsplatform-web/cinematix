
import React, { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import type { Content, Ad, Episode, Server, Season, View } from '@/types';
import VideoPlayer from '@/components/VideoPlayer';
import ContentCarousel from '@/components/ContentCarousel';
import AdPlacement from '@/components/AdPlacement';
import ActionButtons from '@/components/ActionButtons';
import SEO from '@/components/SEO';
import AdZone from '@/components/AdZone';
import AdWaiterModal from '@/components/AdWaiterModal';
import ReportModal from '@/components/ReportModal';

// Icons
import { PlayIcon } from '@/components/icons/PlayIcon';
import { StarIcon } from '@/components/icons/StarIcon';
import { ClockIcon } from '@/components/icons/ClockIcon';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { SpeakerIcon } from '@/components/icons/SpeakerIcon';
import { ExpandIcon } from '@/components/icons/ExpandIcon';
import { DownloadIcon } from '@/components/icons/DownloadIcon';
import { CheckIcon } from '@/components/CheckIcon';
import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon';

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
  initialSeasonNumber?: number;
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
  locationPath,
  initialSeasonNumber
}) => {
  // Tabs State
  const [activeTab, setActiveTab] = useState<'episodes' | 'trailer' | 'details' | 'related'>('episodes');
  const tabsRef = useRef<HTMLDivElement>(null);
  const playerSectionRef = useRef<HTMLDivElement>(null);
  
  // --- SEASON DROPDOWN STATE ---
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- HERO VIDEO STATE ---
  const [showVideo, setShowVideo] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  // --- NEW STATES FOR UPGRADES ---
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Refs for Scroll Control & Player API
  const heroRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
              setIsSeasonDropdownOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- HELPER: Find Latest Season ---
  const getLatestSeason = useCallback((seasons?: Season[]) => {
      if (!seasons || seasons.length === 0) return null;
      return [...seasons].sort((a, b) => b.seasonNumber - a.seasonNumber)[0];
  }, []);

  // --- IMMEDIATE INITIALIZATION ---
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(() => {
      if (content.type === 'series' && content.seasons && content.seasons.length > 0) {
          if (initialSeasonNumber) {
              const explicitSeason = content.seasons.find(s => s.seasonNumber === initialSeasonNumber);
              if (explicitSeason) return explicitSeason.id;
          }

          const path = decodeURIComponent(locationPath || window.location.pathname);
          const seasonMatch = path.match(/\/(?:الموسم|season)\/(\d+)/i);
          
          if (seasonMatch && seasonMatch[1]) {
              const sNum = parseInt(seasonMatch[1]);
              const foundS = content.seasons.find(s => s.seasonNumber === sNum);
              if (foundS) return foundS.id;
          }

          const latest = getLatestSeason(content.seasons);
          return latest ? latest.id : content.seasons[0].id;
      }
      return null;
  });

  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(() => {
      if (content.type === 'series' && content.seasons && content.seasons.length > 0) {
          const targetSeason = content.seasons.find(s => s.id === selectedSeasonId) || getLatestSeason(content.seasons);
          return targetSeason?.episodes?.[0] || null;
      }
      return null;
  });

  useEffect(() => {
      if (content.type === 'series' && selectedSeasonId && content.seasons) {
          const currentS = content.seasons.find(s => s.id === selectedSeasonId);
          if (currentS) {
              const slug = content.slug || content.id;
              const targetPath = `/مسلسل/${slug}/الموسم/${currentS.seasonNumber}`;
              const currentPath = decodeURIComponent(window.location.pathname);
              const hasSeasonParam = currentPath.match(/\/(?:الموسم|season)\/(\d+)/i);
              
              if (!hasSeasonParam) {
                  try {
                      if (window.location.protocol !== 'blob:' && window.location.protocol !== 'file:') {
                          window.history.replaceState(null, '', targetPath);
                      }
                  } catch (e) {
                      console.warn("History replaceState failed:", e);
                  }
              }
          }
      }
  }, [selectedSeasonId, content]);

  useEffect(() => {
      setActiveTab('episodes');

      if (content.type === 'series' && content.seasons && content.seasons.length > 0) {
          let targetSeason = null;
          if (initialSeasonNumber) {
              targetSeason = content.seasons.find(s => s.seasonNumber === initialSeasonNumber);
          }
          if (!targetSeason) {
              const path = decodeURIComponent(locationPath || window.location.pathname);
              const seasonMatch = path.match(/\/(?:الموسم|season)\/(\d+)/i);
              if (seasonMatch && seasonMatch[1]) {
                  const sNum = parseInt(seasonMatch[1]);
                  targetSeason = content.seasons.find(s => s.seasonNumber === sNum);
              }
          }
          if (!targetSeason) {
              targetSeason = getLatestSeason(content.seasons);
          }
          
          if (targetSeason) {
              setSelectedSeasonId(targetSeason.id);
              setSelectedEpisode(targetSeason.episodes?.[0] || null);
          }
      } else {
          setSelectedSeasonId(null);
          setSelectedEpisode(null);
      }
  }, [content.id, content.type, content.seasons, getLatestSeason, locationPath, initialSeasonNumber]);

  const currentSeason = useMemo(() => content.seasons?.find(s => s.id === selectedSeasonId), [content.seasons, selectedSeasonId]);
  const episodes = useMemo(() => currentSeason?.episodes || [], [currentSeason]);
  
  const activeServers = useMemo(() => {
      let servers: Server[] = [];
      if (content.type === 'movie') {
          servers = content.servers || [];
      } 
      return servers.filter(s => s.url && s.url.trim().length > 0);
  }, [content.type, content.servers]);

  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  useEffect(() => {
      if (activeServers.length > 0) {
          const defaultServer = activeServers.find(s => s.isActive) || activeServers[0];
          setSelectedServer(defaultServer);
      } else {
          setSelectedServer(null);
      }
  }, [activeServers]); 
  
  const [showPreroll, setShowPreroll] = useState(false);
  const [prerollTimer, setPrerollTimer] = useState(5);
  const prerollContainerRef = useRef<HTMLDivElement>(null);
  const downloadUrl = selectedServer?.downloadUrl || activeServers[0]?.downloadUrl;
  const isInMyList = !!myList?.includes(content.id);
  const isContentPlayPlayable = content.type === 'movie';

  const prerollAd = useMemo(() => {
      return adsEnabled ? ads.find(ad => ad.placement === 'watch-preroll' && ad.status === 'active') : null;
  }, [ads, adsEnabled]);

  const [isMobile, setIsMobile] = useState(false);
  useLayoutEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getVideoId = (url: string | undefined) => {
      if (!url) return null;
      try {
          if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
          if (url.includes('v=')) return url.split('v=')[1].split('&')[0];
          if (url.includes('embed/')) return url.split('embed/')[1].split('?')[0];
          return null;
      } catch (e) { return null; }
  };

  const displayTrailerUrl = (content.type === 'series' && currentSeason?.trailerUrl) 
        ? currentSeason.trailerUrl 
        : content.trailerUrl;
  const trailerVideoId = getVideoId(displayTrailerUrl);

  useEffect(() => {
      setShowVideo(false);
      setVideoEnded(false);
      setIsMuted(true);
      if (!trailerVideoId || isMobile) return;
      const timer = setTimeout(() => { setShowVideo(true); }, 2000); 
      return () => clearTimeout(timer);
  }, [content.id, trailerVideoId, isMobile]);

  useEffect(() => {
      let limitTimer: ReturnType<typeof setTimeout>;
      if (showVideo) {
          limitTimer = setTimeout(() => {
              if (iframeRef.current) {
                  iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
              }
              setShowVideo(false);
              setVideoEnded(true);
          }, 60000); 
      }
      return () => clearTimeout(limitTimer);
  }, [showVideo]);

  useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
          try {
              if (typeof event.data === 'string') {
                  const data = JSON.parse(event.data);
                  if (data.event === 'infoDelivery' && data.info && data.info.playerState === 0) {
                      setShowVideo(false);
                      setVideoEnded(true);
                  }
                  if (data.event === 'onStateChange' && data.info === 0) {
                      setShowVideo(false);
                      setVideoEnded(true);
                  }
              }
          } catch (e) { }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
      const observer = new IntersectionObserver(
          ([entry]) => {
              if (iframeRef.current) {
                  const msg = entry.isIntersecting 
                      ? (showVideo && !videoEnded ? 'playVideo' : null) 
                      : 'pauseVideo';
                  if (msg) {
                      iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: msg, args: '' }), '*');
                  }
              }
          },
          { threshold: 0.0 }
      );
      if (heroRef.current) observer.observe(heroRef.current);
      return () => observer.disconnect();
  }, [showVideo, videoEnded]);

  const toggleMute = (e: React.MouseEvent) => {
      e.stopPropagation();
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      if (iframeRef.current) {
          iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: newMuted ? 'mute' : 'unMute', args: '' }), '*');
      }
  };

  useEffect(() => {
    const decodedPath = decodeURIComponent(locationPath || window.location.pathname);
    if (content.type === 'series' && content.seasons && content.seasons.length > 0) {
        const seasonMatch = decodedPath.match(/\/(?:الموسم|season)\/(\d+)/i);
        if (seasonMatch && seasonMatch[1]) {
            const sNum = parseInt(seasonMatch[1]);
            const foundS = content.seasons.find(s => s.seasonNumber === sNum);
            if (foundS && foundS.id !== selectedSeasonId) {
                setSelectedSeasonId(foundS.id);
            }
        }
    } 
  }, [content.id, content.seasons, content.type, locationPath, selectedSeasonId]);

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

  useEffect(() => {
      if (showPreroll && prerollAd && prerollContainerRef.current) {
          const container = prerollContainerRef.current;
          container.innerHTML = ''; 
          try {
              const range = document.createRange();
              range.selectNode(container);
              const adContent = prerollAd.code || prerollAd.scriptCode || '';
              const fragment = range.createContextualFragment(adContent);
              container.appendChild(fragment);
          } catch (e) {
              console.error("Failed to inject pre-roll ad:", e);
          }
      }
  }, [showPreroll, prerollAd]);

  const [waiterAdState, setWaiterAdState] = useState<{ isOpen: boolean, ad: Ad | null, onComplete: () => void }>({ isOpen: false, ad: null, onComplete: () => {} });

  const triggerActionWithAd = useCallback((callback: () => void, adPosition: string) => {
      if (!adsEnabled) {
          callback();
          return;
      }
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
          callback();
      }
  }, [ads, adsEnabled]);

  const handleWatchScroll = () => {
    setActiveTab('episodes');
    setTimeout(() => {
        tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  
  const handleSeasonSelect = (seasonId: number) => {
      setSelectedSeasonId(seasonId);
      const season = content.seasons?.find(s => s.id === seasonId);
      if (season) {
          const slug = content.slug || content.id;
          const newPath = `/مسلسل/${slug}/الموسم/${season.seasonNumber}`;
          if (decodeURIComponent(window.location.pathname) !== newPath) {
              try {
                  if (window.location.protocol !== 'blob:' && window.location.protocol !== 'file:') {
                      window.history.pushState(null, '', newPath);
                  }
              } catch (e) {
                  console.warn("History pushState failed:", e);
              }
          }
      }
  };

  const handleEpisodeSelect = (episode: Episode, seasonNum?: number, episodeIndex?: number) => {
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

  let displayBackdrop = content.backdrop;
  let imgStyle: React.CSSProperties | undefined = undefined;
  let isCustomCrop = false;

  if (content.type === 'series' && currentSeason?.backdrop) {
      displayBackdrop = currentSeason.backdrop;
  }

  if (isMobile) {
      if (content.type === 'series' && currentSeason) {
          if (currentSeason.useCustomMobileImage && currentSeason.mobileImageUrl) {
              displayBackdrop = currentSeason.mobileImageUrl;
              imgStyle = { objectPosition: 'center' };
          } 
          else if (content.mobileBackdropUrl) {
              displayBackdrop = content.mobileBackdropUrl;
              imgStyle = { objectPosition: 'center' };
          }
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
  
  const heroEmbedUrl = useMemo(() => {
      if (!trailerVideoId) return '';
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      return `https://www.youtube.com/embed/${trailerVideoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&loop=0&playsinline=1&enablejsapi=1&origin=${origin}`;
  }, [trailerVideoId]);

  const modalEmbedUrl = trailerVideoId ? `https://www.youtube.com/embed/${trailerVideoId}?autoplay=1&mute=0&controls=1&showinfo=0&rel=0&modestbranding=1&playsinline=1` : '';

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

  const activeSeasonHighlight = isRamadanTheme 
    ? 'text-[#FFD700]' 
    : isEidTheme
        ? 'text-purple-400' 
        : isCosmicTealTheme
            ? 'text-[#35F18B]' 
            : isNetflixRedTheme
                ? 'text-[#E50914]' 
                : 'text-[#00A7F8]';

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white pb-0 relative overflow-x-hidden w-full">
      
      <SEO 
        title={content.title}
        description={content.description.substring(0, 160)}
        poster={content.poster}
        banner={content.backdrop}
        keywords={`${content.title}, ${content.categories.join(', ')}, مشاهدة اون لاين`}
        type={content.type === 'series' ? 'video.tv_show' : 'video.movie'}
      />

      {/* Hero Section */}
      <div ref={heroRef} className="relative h-[80vh] w-full overflow-hidden group z-10">
        <div className="absolute inset-0 bg-black">
            <img 
                src={displayBackdrop} 
                alt={content.title} 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${showVideo ? 'opacity-0' : 'opacity-100'} ${!isMobile ? 'md:object-top' : ''} ${isCustomCrop ? 'mobile-custom-crop' : ''}`}
                style={imgStyle} 
                loading="eager"
            />
            
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

            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-body)] via-[var(--bg-body)]/80 via-20% to-transparent z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-body)]/80 via-transparent to-transparent z-10 hidden md:block"></div>
        </div>

        <div className="absolute bottom-0 left-0 w-full px-4 md:px-8 pb-4 md:pb-6 flex flex-col justify-end items-start z-20">
            <div className="max-w-4xl w-full flex flex-col items-center md:items-start text-center md:text-right">
                
                {content.isLogoEnabled && displayLogo ? (
                    <img 
                        src={displayLogo} 
                        alt={content.title} 
                        className={`w-auto h-auto max-w-[245px] md:max-w-[435px] max-h-[190px] md:max-h-[300px] mb-1 md:mb-3 object-contain drop-shadow-2xl mx-auto md:mx-0 transition-transform duration-700 ${showVideo ? 'translate-y-0 scale-75 origin-bottom-right' : 'scale-100'}`}
                        draggable={false}
                    />
                ) : (
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-1 md:mb-3 leading-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-300 drop-shadow-lg">
                        {content.title}
                    </h1>
                )}

                {/* Season Selector */}
                {content.type === 'series' && content.seasons && content.seasons.length > 1 && (
                    <div className="relative mt-1 mb-2 z-50 w-full md:w-auto flex justify-center md:justify-start" ref={dropdownRef}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsSeasonDropdownOpen(!isSeasonDropdownOpen);
                            }}
                            className={`flex items-center gap-2 text-xl md:text-2xl font-bold transition-colors duration-200 group ${isRamadanTheme ? 'text-white hover:text-[#FFD700]' : isEidTheme ? 'text-white hover:text-purple-400' : isCosmicTealTheme ? 'text-white hover:text-[#35F18B]' : isNetflixRedTheme ? 'text-white hover:text-[#E50914]' : 'text-white hover:text-[#00A7F8]'}`}
                        >
                            <span>{`الموسم ${currentSeason?.seasonNumber}`}</span>
                            <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isSeasonDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isSeasonDropdownOpen && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-[#1f2937] border border-gray-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-fade-in-up origin-top-right">
                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    {[...content.seasons].sort((a, b) => a.seasonNumber - b.seasonNumber).map(season => (
                                        <button
                                            key={season.id}
                                            onClick={() => {
                                                handleSeasonSelect(season.id);
                                                setIsSeasonDropdownOpen(false);
                                            }}
                                            className={`w-full text-right px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group ${selectedSeasonId === season.id ? 'bg-white/5' : ''}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`text-lg font-bold ${selectedSeasonId === season.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                                    {`الموسم ${season.seasonNumber}`}
                                                </span>
                                                {selectedSeasonId === season.id && <CheckIcon className={`w-4 h-4 ${activeSeasonHighlight}`} />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4 mb-2 text-sm md:text-base font-medium text-gray-200 w-full">
                     <div className="flex items-center gap-1.5 text-yellow-400 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        <StarIcon className="w-5 h-5" />
                        <span className="font-bold text-white">{content.rating.toFixed(1)}</span>
                    </div>
                    
                    <span className="text-gray-500 text-sm md:text-lg">|</span>

                    <span className="text-white tracking-wide">{currentSeason?.releaseYear || content.releaseYear}</span>
                    
                    {content.ageRating && (
                        <>
                            <span className="text-gray-500 text-sm md:text-lg">|</span>
                            <span className="px-2 py-0.5 border border-gray-500 rounded text-gray-300 text-xs md:text-sm">{content.ageRating}</span>
                        </>
                    )}
                    
                    {content.type === 'movie' && content.duration && (
                        <>
                            <span className="text-gray-500 text-sm md:text-lg">|</span>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 border border-gray-500 rounded text-gray-300 text-xs md:text-sm backdrop-blur-sm bg-white/5">
                                <ClockIcon className="w-4 h-4" />
                                <span dir="ltr">{content.duration}</span>
                            </div>
                        </>
                    )}

                    {content.genres.length > 0 && (
                        <>
                            <span className="text-gray-500 text-sm md:text-lg">|</span>
                            <div className="flex flex-wrap gap-1">
                                {content.genres.map((genre, index) => (
                                    <span key={index} className={`${isRamadanTheme ? 'text-[#FFD700]' : isEidTheme ? 'text-purple-400' : isCosmicTealTheme ? 'text-[#35F18B]' : isNetflixRedTheme ? 'text-[#E50914]' : 'text-[#00A7F8]'}`}>
                                        {genre}{index < content.genres.length - 1 ? '، ' : ''}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className={`overflow-hidden transition-all duration-700 ease-in-out w-full opacity-100 max-h-40 mb-3 md:mb-4`}>
                    <p className="text-gray-300 text-xs sm:text-sm md:text-lg line-clamp-3 leading-relaxed max-w-2xl mx-auto md:mx-0 font-medium text-center md:text-right">
                        {displayDescription}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center md:justify-start w-full md:w-auto relative z-40 mt-1">
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

      {/* Tabs Navigation */}
      <div 
        ref={tabsRef}
        className="sticky top-16 md:top-20 z-40 bg-[var(--bg-body)]/95 backdrop-blur-xl border-b border-white/5 shadow-md w-full transition-all duration-300"
      >
          <div className="w-full px-4 md:px-8 flex flex-row items-center justify-between h-14 md:h-16">
              <div className="flex items-center gap-6 md:gap-8 h-full overflow-x-auto rtl-scroll no-scrollbar">
                  <button 
                    onClick={() => setActiveTab('episodes')}
                    className={`flex items-center gap-2 py-4 px-2 border-b-[3px] font-bold transition-all duration-300 text-sm md:text-lg whitespace-nowrap ${activeTab === 'episodes' ? activeTabClass : tabHoverClass}`}
                  >
                      <span>{content.type === 'movie' ? 'المشاهدة' : `الحلقات (${episodes.length})`}</span>
                  </button>

                  {trailerVideoId && (
                      <button 
                        onClick={() => setActiveTab('trailer')}
                        className={`flex items-center gap-2 py-4 px-2 border-b-[3px] font-bold transition-all duration-300 text-sm md:text-lg whitespace-nowrap ${activeTab === 'trailer' ? activeTabClass : tabHoverClass}`}
                      >
                          <span>الإعلان</span>
                      </button>
                  )}

                  <button 
                    onClick={() => setActiveTab('details')}
                    className={`flex items-center gap-2 py-4 px-2 border-b-[3px] font-bold transition-all duration-300 text-sm md:text-lg whitespace-nowrap ${activeTab === 'details' ? activeTabClass : tabHoverClass}`}
                  >
                      <span>التفاصيل</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('related')}
                    className={`flex items-center gap-2 py-4 px-2 border-b-[3px] font-bold transition-all duration-300 text-sm md:text-lg whitespace-nowrap ${activeTab === 'related' ? activeTabClass : tabHoverClass}`}
                  >
                      <span>أعمال مشابهة</span>
                  </button>
              </div>
          </div>
      </div>

      <div className="relative w-full bg-[var(--bg-body)] min-h-[500px]">
          {activeTab === 'episodes' && (
              <div className="animate-fade-in-up w-full">
                  {content.type === 'series' && content.seasons && (
                    <div className="px-4 md:px-8 pt-8 w-full">
                        {episodes.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-10 pb-10 px-2">
                                {episodes.map((ep, index) => {
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
                                            <div className="relative w-full aspect-video overflow-hidden bg-black flex-shrink-0">
                                                <img 
                                                    src={thumbnailSrc} 
                                                    alt={epTitle}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                                
                                                <div className="absolute bottom-3 right-3 left-3 flex justify-between items-end z-20 pointer-events-none">
                                                    <h4 className={`text-xl font-bold text-white drop-shadow-md leading-none ${isSelected ? 'text-[var(--color-accent)]' : ''}`}>
                                                        {epTitle}
                                                    </h4>

                                                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-white shadow-sm">
                                                        <PlayIcon className="w-3.5 h-3.5 fill-current" />
                                                        {ep.duration && (
                                                            <span className="text-xs font-bold font-mono tracking-wider" dir="ltr">
                                                                {ep.duration}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {ep.progress > 0 && <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700 z-30"><div className="h-full bg-[var(--color-accent)]" style={{ width: `${ep.progress}%` }}></div></div>}
                                            </div>
                                            
                                            <div className="p-3 md:p-4 flex-1 flex flex-col justify-center">
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

                  {isContentPlayPlayable && (
                      <div ref={playerSectionRef} className="bg-[var(--bg-body)] py-8 px-4 md:px-8 border-t border-gray-800 w-full">
                         <div className="max-w-6xl mx-auto w-full">
                             <AdPlacement ads={ads} placement="watch-top" isEnabled={adsEnabled} />
                             
                             <div className="flex justify-between items-end mb-6 w-full">
                                 {activeServers.length > 0 && (
                                     <div className="flex-1 overflow-hidden w-full">
                                        <div className="mb-4 flex items-center gap-3">
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
                                            <h3 className="text-xl md:text-2xl font-bold text-white">سيرفرات المشاهدة</h3>
                                        </div>
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

          {activeTab === 'details' && (
              <div className="px-4 md:px-8 py-8 animate-fade-in-up w-full">
                  <div className="w-full">
                      <div className="flex flex-col md:flex-row justify-between gap-8 items-start w-full">
                          
                          <div className="w-full md:w-[60%] lg:w-[65%] space-y-10 order-1 flex-shrink-0">
                              <div>
                                  <div className="mb-4 flex items-center gap-3">
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
                                    <h3 className="text-xl md:text-2xl font-bold text-white">القصة</h3>
                                  </div>
                                  <p className="text-gray-300 text-base md:text-lg leading-loose font-medium text-justify ml-4">
                                      {displayDescription}
                                  </p>
                              </div>

                              <div>
                                  <div className="mb-4 flex items-center gap-3">
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
                                    <h3 className="text-xl md:text-2xl font-bold text-white">التصنيف</h3>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                      {content.genres.map((genre, index) => (
                                          <div key={index} className={`px-4 py-2 rounded-lg text-sm font-bold border bg-gray-800/50 border-gray-700 text-gray-300`}>
                                              {genre}
                                          </div>
                                      ))}
                                  </div>
                              </div>

                              <div>
                                  <div className="mb-4 flex items-center gap-3">
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
                                    <h3 className="text-xl md:text-2xl font-bold text-white">معلومات إضافية</h3>
                                  </div>
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

                          <div className="w-full md:w-[35%] lg:w-[30%] order-2 flex-shrink-0">
                              {displayCast && displayCast.length > 0 && (
                                  <div className="bg-gray-900/30 rounded-3xl p-6 border border-white/5 w-full">
                                      <div className="mb-4 flex items-center gap-3">
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
                                        <h3 className="text-xl md:text-2xl font-bold text-white">طاقم العمل</h3>
                                      </div>
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

          {activeTab === 'related' && (
              <div className="py-8 animate-fade-in-up w-full">
                  <AdPlacement ads={ads} placement="watch-above-recommendations" isEnabled={adsEnabled} />
                  <ContentCarousel 
                        title={null} 
                        contents={similarContent}
                        onSelectContent={onSelectContent}
                        isLoggedIn={isLoggedIn}
                        myList={myList}
                        onToggleMyList={onToggleMyList}
                        isRamadanTheme={isRamadanTheme}
                        isEidTheme={isEidTheme}
                        isCosmicTealTheme={isCosmicTealTheme}
                        isNetflixRedTheme={isNetflixRedTheme}
                        isHorizontal={true} 
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
