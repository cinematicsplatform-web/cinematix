
import React, { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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
import { ReplayIcon } from './icons/ReplayIcon';
import { ExpandIcon } from './icons/ExpandIcon';
import SEO from './SEO';
import AdZone from './AdZone';
import AdWaiterModal from './AdWaiterModal';

interface DetailPageProps {
  content: Content;
  ads: Ad[];
  adsEnabled: boolean;
  allContent: Content[];
  onSelectContent: (content: Content) => void;
  isLoggedIn: boolean;
  myList?: string[];
  onToggleMyList: (contentId: string) => void;
  onSetView: (view: View) => void;
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
  const playerSectionRef = useRef<HTMLDivElement>(null);
  
  // --- HERO VIDEO STATE ---
  const [showVideo, setShowVideo] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);

  // Refs for Scroll Control & Player API
  const heroRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // --- HELPER: Find Latest Season ---
  const getLatestSeason = (seasons?: Season[]) => {
      if (!seasons || seasons.length === 0) return null;
      return [...seasons].sort((a, b) => b.seasonNumber - a.seasonNumber)[0];
  };

  // --- IMMEDIATE INITIALIZATION ---
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(() => {
      if (content.type === 'series' && content.seasons && content.seasons.length > 0) {
          const latest = getLatestSeason(content.seasons);
          return latest ? latest.id : content.seasons[0].id;
      }
      return null;
  });

  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(() => {
      if (content.type === 'series' && content.seasons && content.seasons.length > 0) {
          const latest = getLatestSeason(content.seasons);
          return latest?.episodes?.[0] || null;
      }
      return null;
  });

  // Derived State
  const currentSeason = content.seasons?.find(s => s.id === selectedSeasonId);
  const episodes = currentSeason?.episodes || [];
  
  // Resolve servers based on type (Memoized) and filter out empty URLs
  const activeServers = useMemo(() => {
      let servers: Server[] = [];
      
      if (content.type === 'movie') {
          servers = content.servers || [];
      } else if (content.type === 'series' && selectedEpisode) {
          servers = selectedEpisode.servers || [];
      }

      // Only return servers that have a valid URL
      return servers.filter(s => s.url && s.url.trim().length > 0);
  }, [content, selectedEpisode]);

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
  
  // Get Download URL
  const downloadUrl = selectedServer?.downloadUrl || activeServers[0]?.downloadUrl;

  const isInMyList = !!myList?.includes(content.id);
  
  const isContentPlayable = content.type === 'movie' || (content.type === 'series' && !!selectedEpisode);

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

  // 2. Listen for YouTube "Ended" event via postMessage
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

  // 3. Scroll Visibility Rule (Intersection Observer)
  useEffect(() => {
      const observer = new IntersectionObserver(
          ([entry]) => {
              if (iframeRef.current) {
                  // If scrolled back into view AND it was supposed to be playing (not ended), Play.
                  // If scrolled out of view, Pause.
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
          { threshold: 0.1 } // Trigger when 10% visible
      );
      
      if (heroRef.current) observer.observe(heroRef.current);
      return () => observer.disconnect();
  }, [showVideo, videoEnded]);

  const handleReplay = (e: React.MouseEvent) => {
      e.stopPropagation();
      setVideoEnded(false);
      setShowVideo(true);
      setIsMuted(false); // Unmute on replay for better UX
      
      // Smart Restart via postMessage (No Reload)
      if (iframeRef.current) {
          // Seek to 0
          iframeRef.current.contentWindow?.postMessage(JSON.stringify({event: 'command', func: 'seekTo', args: [0, true]}), '*');
          // Play
          iframeRef.current.contentWindow?.postMessage(JSON.stringify({event: 'command', func: 'playVideo', args: ''}), '*');
          // Unmute
          iframeRef.current.contentWindow?.postMessage(JSON.stringify({event: 'command', func: 'unMute', args: ''}), '*');
      }
  };

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
        const episodeMatch = decodedPath.match(/\/(?:الحلقة|episode)\/(\d+)/i);

        if (seasonMatch && seasonMatch[1]) {
            const sNum = parseInt(seasonMatch[1]);
            const foundS = content.seasons.find(s => s.seasonNumber === sNum);
            
            if (foundS) {
                // 1. Update Season if URL differs from current state
                if (foundS.id !== selectedSeasonId) {
                    setSelectedSeasonId(foundS.id);
                }
                
                // 2. Update Episode if URL specified
                if (episodeMatch && episodeMatch[1]) {
                    const eNum = parseInt(episodeMatch[1]);
                    
                    // Try finding episode by title (e.g. "الحلقة 5") or fallback to array index
                    let foundE = foundS.episodes.find(e => {
                        const titleDigits = e.title?.match(/\d+/);
                        return titleDigits ? parseInt(titleDigits[0]) === eNum : false;
                    });

                    if (!foundE) {
                         // Fallback: Assume ordered list (Episode 1 is at index 0)
                         foundE = foundS.episodes[eNum - 1];
                    }
                    
                    if (foundE) {
                         setSelectedEpisode(foundE);
                    }
                } else if (foundS.id !== selectedSeasonId) {
                    // If Season changed but no Episode in URL, reset to first episode of that season
                    const firstEp = foundS.episodes[0];
                    if (firstEp) setSelectedEpisode(firstEp);
                }
            }
        }
    } 
  }, [content.id, locationPath]); // Re-run when content loads or URL changes

  // --- Pre-roll Effect (Timer & Script Injection) ---
  useEffect(() => {
      if (isContentPlayable && prerollAd) {
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
  }, [content.id, selectedEpisode?.id, prerollAd, isContentPlayable]);

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

  const updateUrlForEpisode = (seasonNum: number, episodeNum: number) => {
      const slug = content.slug || content.id;
      const newPath = `/مسلسل/${slug}/الموسم/${seasonNum}/الحلقة/${episodeNum}`;
      try {
          window.history.pushState({}, '', newPath);
      } catch (e) {
          console.warn('Failed to push state:', e);
      }
  };

  const handleWatchScroll = () => {
    playerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  
  const handleSeasonSelect = (seasonId: number) => {
      setSelectedSeasonId(seasonId);
      const season = content.seasons?.find(s => s.id === seasonId);
      
      if (season && season.episodes && season.episodes.length > 0) {
          const firstEp = season.episodes[0];
          handleEpisodeSelect(firstEp, season.seasonNumber, 1); 
      } else {
          setSelectedEpisode(null);
      }
  };

  const handleEpisodeSelect = (episode: Episode, seasonNum?: number, episodeIndex?: number) => {
      // WRAP EPISODE SELECTION IN AD TRIGGER
      const performSelect = () => {
          setSelectedEpisode(episode);
          if (content.type === 'series') {
              const sNum = seasonNum ?? currentSeason?.seasonNumber ?? 1;
              let eNum = episodeIndex;
              if (!eNum && currentSeason) {
                  const idx = currentSeason.episodes.findIndex(e => e.id === episode.id);
                  eNum = idx + 1;
              }
              if(eNum) updateUrlForEpisode(sNum, eNum);
          }
          // Also scroll to player if changing episodes
          playerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };

      // Trigger 'action_next_episode' ad logic
      triggerActionWithAd(performSelect, 'action_next_episode');
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


  // UI Helpers
  let displayBackdrop = (content.type === 'series' && currentSeason?.backdrop) ? currentSeason.backdrop : content.backdrop;
  let imgStyle: React.CSSProperties | undefined = undefined;

  if (isMobile) {
      if (content.type === 'series' && currentSeason) {
          if (currentSeason.useCustomMobileImage && currentSeason.mobileImageUrl) {
              displayBackdrop = currentSeason.mobileImageUrl;
              imgStyle = { objectPosition: 'center' };
          } else {
              const posX = currentSeason.mobileCropPositionX ?? currentSeason.mobileCropPosition ?? 50;
              const posY = currentSeason.mobileCropPositionY ?? 50;
              imgStyle = { objectPosition: `${posX}% ${posY}%` };
          }
      } else {
          if (content.enableMobileCrop) {
              const posX = content.mobileCropPositionX ?? content.mobileCropPosition ?? 50;
              const posY = content.mobileCropPositionY ?? 50;
              imgStyle = { objectPosition: `${posX}% ${posY}%` };
          }
      }
  }

  const videoPoster = content.type === 'movie' ? content.backdrop : (selectedEpisode?.thumbnail || content.backdrop);
  const displayLogo = (content.type === 'series' && currentSeason?.logoUrl) ? currentSeason.logoUrl : content.logoUrl;
  const displayDescription = (content.type === 'series' && currentSeason?.description) ? currentSeason.description : content.description;
  const displayCast = (content.type === 'series' && currentSeason?.cast && currentSeason.cast.length > 0) ? currentSeason.cast : content.cast;

  const SectionTitle = ({ title }: { title: string }) => (
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
        <h3 className="text-2xl font-bold text-white">{title}</h3>
    </div>
  );
  
  // --- SEO Optimization & Structured Data (JSON-LD) ---
  const generateSchema = () => {
    const baseUrl = 'https://cinematix-kappa.vercel.app';
    const slug = content.slug || content.id;
    const desc = content.description ? content.description.substring(0, 300) : content.title;
    const actors = content.cast?.map(actor => ({ "@type": "Person", "name": actor })) || [];
    const director = { "@type": "Person", "name": "غير محدد" }; 
    const ratingVal = content.rating > 0 ? content.rating.toFixed(1) : "5.0";

    const aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": ratingVal,
        "bestRating": "5",
        "ratingCount": "100" 
    };

    // --- SCHEMA FOR MOVIE ---
    if (content.type === 'movie') {
        return {
            "@context": "https://schema.org",
            "@type": "Movie",
            "name": content.title,
            "url": `${baseUrl}/فيلم/${slug}`,
            "image": content.poster,
            "description": desc,
            "datePublished": `${content.releaseYear}-01-01`,
            "aggregateRating": aggregateRating,
            "genre": content.genres,
            "actor": actors,
            "director": director,
            "duration": content.duration ? `PT${content.duration.replace('h', 'H').replace('m', 'M').replace(' ', '')}` : undefined,
            "offers": {
                "@type": "Offer",
                "availability": "https://schema.org/InStock",
                "price": "0",
                "priceCurrency": "USD"
            }
        };
    }

    // --- SCHEMA FOR SERIES ---
    if (content.type === 'series') {
        const seriesUrl = `${baseUrl}/مسلسل/${slug}`;
        
        const seriesSchema: any = {
            "@context": "https://schema.org",
            "@type": "TVSeries",
            "name": content.title,
            "url": seriesUrl,
            "image": content.poster,
            "description": desc,
            "startDate": `${content.releaseYear}-01-01`,
            "aggregateRating": aggregateRating,
            "genre": content.genres,
            "actor": actors,
            "numberOfSeasons": content.seasons?.length || 1,
        };

        // If a specific season is selected but not an episode (less common view state for SEO, but possible)
        if (currentSeason && !selectedEpisode) {
             return {
                "@context": "https://schema.org",
                "@type": "TVSeason",
                "name": currentSeason.title,
                "url": `${seriesUrl}/الموسم/${currentSeason.seasonNumber}`,
                "numberOfEpisodes": currentSeason.episodes.length,
                "seasonNumber": currentSeason.seasonNumber,
                "partOfSeries": seriesSchema
             }
        }

        // If watching a specific episode, wrap it in TVEpisode
        if (selectedEpisode && currentSeason) {
            const idx = currentSeason.episodes.findIndex(e => e.id === selectedEpisode.id);
            const epNum = idx + 1;
            const episodeUrl = `${seriesUrl}/الموسم/${currentSeason.seasonNumber}/الحلقة/${epNum}`;
            
            return {
                "@context": "https://schema.org",
                "@type": "TVEpisode",
                "name": selectedEpisode.title || `Episode ${epNum}`,
                "url": episodeUrl,
                "image": selectedEpisode.thumbnail || currentSeason.poster,
                "episodeNumber": epNum,
                "description": desc,
                "partOfSeason": {
                    "@type": "TVSeason",
                    "seasonNumber": currentSeason.seasonNumber,
                    "name": currentSeason.title,
                    "partOfSeries": seriesSchema
                }
            };
        }
        
        return seriesSchema;
    }
    
    return {};
  };

  const getSEOData = () => {
      const baseUrl = 'https://cinematix-kappa.vercel.app';
      const slug = content.slug || content.id;
      
      // MOVIE SEO
      if (content.type === 'movie') {
          return {
              title: `مشاهدة فيلم ${content.title} مترجم - ${content.releaseYear} | سينماتيكس`,
              description: `مشاهدة وتحميل فيلم ${content.title} ${content.releaseYear} مترجم بجودة عالية. قصة الفيلم: ${content.description?.substring(0, 150)}...`,
              image: content.poster,
              url: `${baseUrl}/فيلم/${slug}`,
              type: 'video.movie' as const
          };
      } 
      // SERIES SEO
      else {
          const sNum = currentSeason?.seasonNumber || 1;
          
          if (selectedEpisode) {
              const idx = currentSeason?.episodes.findIndex(e => e.id === selectedEpisode.id) ?? 0;
              const epNum = idx + 1;
              const title = `مسلسل ${content.title} – الموسم ${sNum} – الحلقة ${epNum} | سينماتيكس`;
              const description = `مشاهدة مسلسل ${content.title} الموسم ${sNum} الحلقة ${epNum} مترجمة. تفاصيل الحلقة: ${content.description ? content.description.substring(0, 150) : ''}...`;
              const image = selectedEpisode.thumbnail || currentSeason?.poster || content.poster;
              const url = `${baseUrl}/مسلسل/${slug}/الموسم/${sNum}/الحلقة/${epNum}`;
              
              return { title, description, image, url, type: 'video.episode' as const };
          } else {
              return {
                  title: `مسلسل ${content.title} (${content.releaseYear}) - جميع الحلقات | سينماتيكس`,
                  description: `مشاهدة جميع حلقات مسلسل ${content.title} بجودة عالية. قصة المسلسل: ${content.description?.substring(0, 150)}...`,
                  image: currentSeason?.poster || content.poster,
                  url: `${baseUrl}/مسلسل/${slug}`,
                  type: 'video.tv_show' as const
              };
          }
      }
  };

  const { title: seoTitle, description: seoDesc, image: seoImage, url: seoUrl, type: seoType } = getSEOData();

  // --- TRAILER URL (Optimized & Memoized) ---
  // Start muted (mute=1) to allow autoplay and prevent reload on simple mute toggles.
  const heroEmbedUrl = useMemo(() => {
      if (!trailerVideoId) return '';
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      return `https://www.youtube.com/embed/${trailerVideoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&loop=0&playsinline=1&enablejsapi=1&origin=${origin}`;
  }, [trailerVideoId]);

  const modalEmbedUrl = trailerVideoId ? `https://www.youtube.com/embed/${trailerVideoId}?autoplay=1&mute=0&controls=1&showinfo=0&rel=0&modestbranding=1&playsinline=1` : '';

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white pb-0">
      
      <SEO 
        title={seoTitle}
        description={seoDesc}
        image={seoImage}
        type={seoType}
        url={seoUrl}
        schema={generateSchema()}
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

      {/* --- 1. Hero Section (Updated) --- */}
      <div ref={heroRef} className="relative h-[80vh] w-full overflow-hidden group">
        <div className="absolute inset-0 bg-black">
            {/* 1.1 Poster Image (Transition Out) */}
            <img 
                src={displayBackdrop} 
                alt={content.title} 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${showVideo && !isTrailerModalOpen ? 'opacity-0' : 'opacity-100'} ${!isMobile ? 'md:object-top' : ''}`}
                style={imgStyle} 
                loading="eager"
            />
            
            {/* 1.2 YouTube Trailer (Transition In) */}
            {heroEmbedUrl && !isMobile && !isTrailerModalOpen && (
                <div className={`absolute inset-0 w-full h-full overflow-hidden transition-opacity duration-1000 ${showVideo ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                    <div className="relative w-full h-full pointer-events-none scale-125">
                        <iframe 
                            ref={iframeRef}
                            src={heroEmbedUrl}
                            className="absolute top-0 left-0 w-full h-full object-cover" 
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

        {/* Content Layer */}
        <div className="absolute bottom-0 left-0 w-full px-4 md:px-8 pb-4 md:pb-12 flex flex-col justify-end items-start z-20">
            <div className="max-w-4xl w-full animate-fade-in-up flex flex-col items-center md:items-start text-center md:text-right">
                
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
                    <span className="text-gray-500 text-xl">|</span>
                    <span className="text-white tracking-wide">{currentSeason?.releaseYear || content.releaseYear}</span>
                    <span className="text-gray-500 text-xl">|</span>
                    {content.ageRating && (
                        <>
                            <span className="px-2 py-0.5 border border-gray-500 rounded text-gray-300 text-xs md:text-sm">{content.ageRating}</span>
                            <span className="text-gray-500 text-xl">|</span>
                        </>
                    )}
                    {/* DURATION BADGE FOR MOVIES */}
                    {content.type === 'movie' && content.duration && (
                        <>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 border border-gray-500 rounded text-gray-300 text-xs md:text-sm backdrop-blur-sm bg-white/5">
                                <ClockIcon className="w-4 h-4" />
                                <span dir="ltr">{content.duration}</span>
                            </div>
                            <span className="text-gray-500 text-xl">|</span>
                        </>
                    )}
                    <div className="flex flex-wrap gap-1">
                        {content.genres.map((genre, index) => (
                            <span key={index} className={`${isRamadanTheme ? 'text-[#FFD700]' : isEidTheme ? 'text-purple-400' : isCosmicTealTheme ? 'text-[#35F18B]' : isNetflixRedTheme ? 'text-[#E50914]' : 'text-[#00A7F8]'}`}>
                                {genre}{index < content.genres.length - 1 ? '، ' : ''}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Description (Fade Out on Video) */}
                <div className={`overflow-hidden transition-all duration-700 ease-in-out w-full ${showVideo ? 'opacity-0 max-h-0 mb-0' : 'opacity-100 max-h-40 mb-6'}`}>
                    <p className="text-gray-300 text-base md:text-lg line-clamp-3 leading-relaxed mx-auto md:mx-0 max-w-2xl">
                        {content.description}
                    </p>
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center justify-center md:justify-start gap-4 w-full md:w-auto relative z-40 mt-1 md:mt-2">
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
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

                        {/* 2. Mute/Replay Button - Visible if video is playing OR ended */}
                        {heroEmbedUrl && !isMobile && (showVideo || videoEnded) && (
                            <button 
                                onClick={videoEnded ? handleReplay : toggleMute} 
                                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-transparent border border-white/30 text-white hover:bg-white/10 transition-all duration-300 backdrop-blur-md"
                                title={videoEnded ? "إعادة التشغيل" : (isMuted ? "تشغيل الصوت" : "كتم الصوت")}
                            >
                                {videoEnded ? (
                                    <ReplayIcon className="w-5 h-5 md:w-6 md:h-6" />
                                ) : (
                                    <SpeakerIcon isMuted={isMuted} className="w-5 h-5 md:w-6 md:h-6" />
                                )}
                            </button>
                        )}
                        
                        {/* 3. Expand Button - Visible ONLY if video is playing (showVideo is true) */}
                        {trailerVideoId && showVideo && (
                            <button 
                                onClick={() => setIsTrailerModalOpen(true)}
                                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-gray-600/40 border border-white/30 text-white hover:bg-white/20 transition-all duration-300 backdrop-blur-md ml-auto md:ml-0"
                                title="عرض التريلر"
                            >
                                <ExpandIcon className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- Trailer Modal --- */}
      {isTrailerModalOpen && trailerVideoId && createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in-up" onClick={() => setIsTrailerModalOpen(false)}>
              <div className="relative w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800" onClick={e => e.stopPropagation()}>
                  <button 
                      onClick={() => setIsTrailerModalOpen(false)}
                      className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
                  >
                      <CloseIcon className="w-6 h-6" />
                  </button>
                  <iframe 
                      src={modalEmbedUrl} 
                      className="w-full h-full" 
                      allow="autoplay; encrypted-media; picture-in-picture; fullscreen" 
                      allowFullScreen
                      title="Trailer Modal"
                  ></iframe>
              </div>
          </div>,
          document.body
      )}

      {/* --- 2. Info & Lists Section --- */}
      <div className="w-full px-4 md:px-8 pt-4 pb-10 md:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 space-y-12">
                  <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                      <SectionTitle title="القصة" />
                      <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-4xl opacity-90">
                          {displayDescription}
                      </p>
                  </div>

                  {displayCast && displayCast.length > 0 && (
                      <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                          <SectionTitle title="طاقم العمل" />
                          <div className="flex flex-wrap gap-3">
                              {displayCast.map((actor, index) => (
                                  <div key={index} className="bg-gray-800/50 border border-gray-700 px-4 py-2 rounded-full text-gray-300 text-sm hover:bg-gray-700 hover:text-white transition-colors cursor-default">
                                      {actor}
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {content.type === 'series' && content.seasons && (
                    <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                        <SectionTitle title="الحلقات" />
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
                            <div className="grid grid-cols-3 gap-3 md:gap-4">
                                {episodes.map((ep, index) => (
                                    <button
                                        key={ep.id}
                                        onClick={() => handleEpisodeSelect(ep, currentSeason?.seasonNumber, index + 1)}
                                        className={`
                                            relative group flex flex-col items-center justify-center py-4 px-2 rounded-xl border transition-all duration-300 overflow-hidden
                                            ${selectedEpisode?.id === ep.id
                                                ? (isRamadanTheme 
                                                    ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                                                    : isEidTheme
                                                        ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_15px_rgba(147,112,219,0.2)]'
                                                        : isCosmicTealTheme
                                                            ? 'bg-[#35F18B]/20 border-[#35F18B] shadow-[0_0_15px_rgba(53,241,139,0.2)]'
                                                            : isNetflixRedTheme
                                                                ? 'bg-[#E50914]/20 border-[#E50914] shadow-[0_0_15px_rgba(229,9,20,0.2)]'
                                                                : 'bg-[#00A7F8]/20 border-[#00A7F8] shadow-[0_0_15px_rgba(0,167,248,0.2)]')
                                                : 'bg-gray-800/50 border-gray-700 hover:bg-gray-700 hover:border-gray-500'
                                            }
                                        `}
                                    >
                                        <span className={`text-lg md:text-xl font-bold mb-1 ${selectedEpisode?.id === ep.id ? (isRamadanTheme ? 'text-amber-500' : isEidTheme ? 'text-purple-400' : isCosmicTealTheme ? 'text-[#35F18B]' : isNetflixRedTheme ? 'text-[#E50914]' : 'text-[#00A7F8]') : 'text-white group-hover:text-white transition-colors'}`}>
                                            {index + 1}
                                        </span>
                                        <span className="text-[10px] md:text-xs text-gray-400 truncate max-w-full px-2">
                                            {ep.title || `الحلقة ${index + 1}`}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-gray-500 text-center py-10 bg-gray-900/50 rounded-xl border border-gray-800">
                                <p className="text-lg">لا توجد حلقات متاحة لهذا الموسم.</p>
                            </div>
                        )}
                    </div>
                  )}
              </div>

              <div className="lg:col-span-1 mt-8 lg:mt-0">
                  <div className="sticky top-24">
                       {/* New Ad Zone: Details Sidebar */}
                       {adsEnabled && <AdZone position="details_sidebar" />}
                  </div>
              </div>
          </div>
      </div>

      {/* --- 3. Player Zone --- */}
      <div ref={playerSectionRef} className="bg-[var(--bg-body)] py-12 border-t border-gray-900/50 scroll-mt-20">
         <AdPlacement ads={ads} placement="watch-top" isEnabled={adsEnabled} />
         
         <div className="w-full px-4 md:px-8">
             <div className="max-w-6xl mx-auto">
                 {isContentPlayable ? (
                    <>
                         {activeServers.length > 0 && (
                             <div className="mb-6 animate-fade-in-up">
                                <SectionTitle title="سيرفرات المشاهدة" />
                                <div className="flex items-center gap-3 overflow-x-auto rtl-scroll pb-2 no-scrollbar">
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

                         <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.7)] border border-gray-800 bg-black z-10 group animate-fade-in-up" style={{ animationDelay: '100ms' }}>
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
                                      {/* Manual Injection Container for Pre-roll Scripts */}
                                      <div className="w-full h-full flex items-center justify-center pointer-events-auto bg-black">
                                          <div ref={prerollContainerRef} className="w-full h-full flex justify-center items-center" />
                                      </div>
                                  </div>
                              ) : (
                                  <VideoPlayer 
                                      tmdbId={content.id}
                                      type={content.type}
                                      season={currentSeason?.seasonNumber}
                                      episode={selectedEpisode ? (episodes.findIndex(e => e.id === selectedEpisode.id) + 1) : 1}
                                      manualSrc={selectedServer?.url} 
                                      poster={videoPoster} 
                                      ads={ads}
                                      adsEnabled={adsEnabled}
                                  />
                              )}
                         </div>
                         
                         <AdPlacement ads={ads} placement="watch-below-player" isEnabled={adsEnabled} />

                         {downloadUrl && (
                             <div className="mt-8 flex justify-center items-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
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
                    </>
                 ) : (
                    content.type === 'series' && !selectedEpisode && (
                        <div className="text-center py-24 text-gray-500 bg-gray-900/20 rounded-2xl border border-gray-800/50">
                            <p className="text-xl mb-2">الرجاء اختيار حلقة للمشاهدة</p>
                            <p className="text-sm opacity-60">(إذا كان الموسم فارغاً، يرجى اختيار موسم آخر)</p>
                        </div>
                    )
                 )}
             </div>
         </div>
         
         <AdPlacement ads={ads} placement="watch-bottom" isEnabled={adsEnabled} />
      </div>

      <div className="w-full px-4 md:px-8 pt-8">
         <AdPlacement ads={ads} placement="watch-above-recommendations" isEnabled={adsEnabled} />
         <div className={`border-t pt-8 ${isRamadanTheme ? 'border-amber-900/20' : isEidTheme ? 'border-purple-900/20' : 'border-gray-800'}`}>
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
      </div>

      {waiterAdState.isOpen && waiterAdState.ad && (
          <AdWaiterModal 
              isOpen={waiterAdState.isOpen}
              ad={waiterAdState.ad}
              onComplete={waiterAdState.onComplete}
              onClose={() => setWaiterAdState(prev => ({ ...prev, isOpen: false }))}
          />
      )}

    </div>
  );
};

export default DetailPage;
