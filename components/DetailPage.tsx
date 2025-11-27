import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import SEO from './SEO';

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
  
  // Resolve servers based on type (Memoized)
  const activeServers = useMemo(() => {
      let servers: Server[] = [];
      
      if (content.type === 'movie') {
          servers = content.servers || [];
      } else if (content.type === 'series' && selectedEpisode) {
          servers = selectedEpisode.servers || [];
      }

      // We only return manual servers here.
      // If list is empty, VideoPlayer will handle Auto Mode.
      return servers;
  }, [content, selectedEpisode]);

  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  // Effect to set default server when activeServers changes
  useEffect(() => {
      if (activeServers.length > 0) {
          const defaultServer = activeServers.find(s => s.isActive) || activeServers[0];
          setSelectedServer(defaultServer);
      } else {
          setSelectedServer(null);
      }
  }, [activeServers]); 
  
  // Pre-roll Ad State
  const [showPreroll, setShowPreroll] = useState(false);
  const [prerollTimer, setPrerollTimer] = useState(5);
  
  // Get Download URL
  const downloadUrl = selectedServer?.downloadUrl || activeServers[0]?.downloadUrl;

  const isInMyList = !!myList?.includes(content.id);
  
  const isContentPlayable = content.type === 'movie' || (content.type === 'series' && !!selectedEpisode);

  const prerollAd = useMemo(() => {
      return adsEnabled ? ads.find(ad => ad.placement === 'watch-preroll' && ad.status === 'active') : null;
  }, [ads, adsEnabled]);

  // --- Logic: Deep Link Parsing & Sync on Load/Change ---
  useEffect(() => {
    const decodedPath = decodeURIComponent(locationPath || window.location.pathname);
    
    if (content.type === 'series' && content.seasons && content.seasons.length > 0) {
        const seasonMatch = decodedPath.match(/\/الموسم\/(\d+)/);
        const episodeMatch = decodedPath.match(/\/الحلقة\/(\d+)/);

        if (seasonMatch && seasonMatch[1]) {
            const sNum = parseInt(seasonMatch[1]);
            const foundS = content.seasons.find(s => s.seasonNumber === sNum);
            if (foundS && foundS.id !== selectedSeasonId) {
                setSelectedSeasonId(foundS.id);
                
                if (episodeMatch && episodeMatch[1]) {
                    const eNum = parseInt(episodeMatch[1]);
                    // Find episode by title number or index
                    const foundE = foundS.episodes.find(e => e.title?.includes(`${eNum}`)) || foundS.episodes[eNum - 1];
                    if (foundE) {
                        setSelectedEpisode(foundE);
                    }
                } else {
                    const firstEp = foundS.episodes[0];
                    if (firstEp) {
                        setSelectedEpisode(firstEp);
                    }
                }
            }
        }
    } 
  }, [content.id, locationPath]); 

  // --- Pre-roll Effect ---
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
  };

  const handleServerSelect = (server: Server) => {
      setSelectedServer(server);
  };
  
  const handleSkipPreroll = () => {
      setShowPreroll(false);
  };

  const similarContent = useMemo(() => {
      return allContent.filter(c => c.id !== content.id && c.categories.some(cat => content.categories.includes(cat))).slice(0, 10);
  }, [content, allContent]);


  // UI Helpers
  const videoPoster = content.type === 'movie' ? content.backdrop : (selectedEpisode?.thumbnail || content.backdrop);
  const displayBackdrop = (content.type === 'series' && currentSeason?.backdrop) ? currentSeason.backdrop : content.backdrop;
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
  
  const mobilePos = content.mobileCropPosition ?? 50;
  const imgStyle = content.enableMobileCrop ? { objectPosition: `${mobilePos}% center` } : undefined;

  // --- SEO ---
  const getSEOData = () => {
      const baseUrl = 'https://cinematix-kappa.vercel.app';
      const slug = content.slug || content.id;
      
      if (content.type === 'movie') {
          return {
              title: `مشاهدة فيلم ${content.title} (${content.releaseYear}) مترجم | سينماتيكس`,
              url: `${baseUrl}/فيلم/${slug}`
          };
      } else {
          let epNum = 1;
          if (selectedEpisode && currentSeason) {
              const idx = currentSeason.episodes.findIndex(e => e.id === selectedEpisode.id);
              if (idx !== -1) epNum = idx + 1;
          }
          const sNum = currentSeason?.seasonNumber || 1;
          const seriesTitle = `مشاهدة مسلسل ${content.title} الموسم ${sNum} الحلقة ${epNum} (${content.releaseYear}) مترجم | سينماتيكس`;
          const seriesUrl = `${baseUrl}/مسلسل/${slug}/الموسم/${sNum}/الحلقة/${epNum}`;
          return { title: seriesTitle, url: seriesUrl };
      }
  };

  const { title: seoTitle, url: seoUrl } = getSEOData();

  const generateSchema = () => {
    const baseSchema: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": content.type === 'movie' ? "Movie" : "TVSeries",
      "name": content.title,
      "image": content.poster,
      "description": content.description ? content.description.substring(0, 160) : content.title,
      "datePublished": `${content.releaseYear}-01-01`,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": content.rating > 0 ? content.rating.toString() : "5.0",
        "bestRating": "5",
        "ratingCount": "100"
      },
      "genre": content.genres,
      "actor": content.cast?.map(actor => ({ "@type": "Person", "name": actor })) || []
    };
    return baseSchema;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white pb-0">
      
      <SEO 
        title={seoTitle}
        description={content.description ? content.description.substring(0, 160) : `مشاهدة ${content.title} اون لاين بجودة عالية`}
        image={content.backdrop}
        type={content.type === 'movie' ? 'video.movie' : 'video.tv_show'}
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

      {/* --- 1. Hero Section --- */}
      <div className="relative h-[80vh] w-full overflow-hidden group">
        <div className="absolute inset-0">
            <img 
                src={displayBackdrop} 
                alt={content.title} 
                className={`w-full h-full object-cover ${content.enableMobileCrop ? 'md:!object-top' : 'object-top'}`}
                style={imgStyle}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-body)] via-[var(--bg-body)]/20 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-body)]/80 via-transparent to-transparent"></div>
        </div>

        <div className="absolute bottom-0 left-0 w-full px-4 md:px-8 pb-12 flex flex-col justify-end items-start z-10">
            <div className="max-w-4xl w-full animate-fade-in-up flex flex-col items-center md:items-start text-center md:text-right">
                {content.isLogoEnabled && displayLogo ? (
                    <img 
                        src={displayLogo} 
                        alt={content.title} 
                        className="w-auto h-auto max-w-[250px] md:max-w-[500px] mb-6 object-contain drop-shadow-2xl mx-auto md:mx-0"
                        draggable={false}
                    />
                ) : (
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-4 leading-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-300 drop-shadow-lg">
                        {content.title}
                        {content.type === 'series' && currentSeason && (
                            <span className="block text-2xl md:text-4xl mt-2 text-white/80 font-normal">{currentSeason.title}</span>
                        )}
                    </h1>
                )}

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 mb-8 text-sm md:text-lg font-medium text-gray-200 w-full">
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
                    {content.type === 'movie' && content.duration && (
                        <>
                             <div className="flex items-center gap-1.5 text-gray-300 bg-black/30 px-2 py-0.5 rounded border border-white/5">
                                <ClockIcon className="w-4 h-4" />
                                <span>{content.duration}</span>
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

                <ActionButtons 
                    onWatch={handleWatchScroll}
                    onToggleMyList={() => onToggleMyList(content.id)}
                    isInMyList={isInMyList}
                    showMyList={isLoggedIn}
                    isRamadanTheme={isRamadanTheme}
                    isEidTheme={isEidTheme}
                    isCosmicTealTheme={isCosmicTealTheme}
                    isNetflixRedTheme={isNetflixRedTheme}
                />
            </div>
        </div>
      </div>

      {/* --- 2. Info & Lists Section --- */}
      <div className="w-full px-4 md:px-8 py-10">
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
                       <AdPlacement ads={ads} placement="watch-sidebar" isEnabled={adsEnabled} />
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
                         <div className="mb-6 animate-fade-in-up">
                            <SectionTitle title="سيرفرات المشاهدة" />
                            <div className="flex items-center gap-3 overflow-x-auto rtl-scroll pb-2 no-scrollbar">
                                {activeServers.length > 0 ? activeServers.map((server) => (
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
                                )) : (
                                    <div className="text-gray-400 text-sm flex items-center gap-2 p-2 bg-gray-900/50 rounded-lg border border-gray-800">
                                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                        <span>المشاهدة التلقائية مفعلة</span>
                                    </div>
                                )}
                            </div>
                         </div>

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
                                      <div className="w-full h-full flex items-center justify-center pointer-events-auto">
                                          <div dangerouslySetInnerHTML={{ __html: prerollAd.code }} />
                                      </div>
                                  </div>
                              ) : (
                                  <VideoPlayer 
                                      tmdbId={content.id}
                                      type={content.type}
                                      season={currentSeason?.seasonNumber}
                                      episode={selectedEpisode ? (episodes.findIndex(e => e.id === selectedEpisode.id) + 1) : 1}
                                      manualSrc={selectedServer?.url} // If null (auto mode), this is undefined, triggering VideoPlayer auto-logic
                                      poster={videoPoster} 
                                  />
                              )}
                         </div>
                         
                         <AdPlacement ads={ads} placement="watch-below-player" isEnabled={adsEnabled} />

                         {downloadUrl && (
                             <div className="mt-8 flex justify-center items-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                                 <a 
                                    href={downloadUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
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
                                 </a>
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

    </div>
  );
};

export default DetailPage;