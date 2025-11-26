
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
import { CloseIcon } from './icons/CloseIcon'; // Use existing CloseIcon for pre-roll
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
  locationPath?: string; // Passed from App to trigger updates
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
      // Sort by seasonNumber descending
      return [...seasons].sort((a, b) => b.seasonNumber - a.seasonNumber)[0];
  };

  // --- IMMEDIATE INITIALIZATION ---
  // Initialize with the LATEST season and its first episode
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

  const [selectedServer, setSelectedServer] = useState<Server | null>(() => {
      // 1. Movie: Default to first active
      if (content.type === 'movie' && content.servers && content.servers.length > 0) {
          return content.servers.find(s => s.isActive) || content.servers[0];
      }
      // 2. Series: Default to first episode's server of the latest season
      if (content.type === 'series' && content.seasons && content.seasons.length > 0) {
          const latest = getLatestSeason(content.seasons);
          const firstEp = latest?.episodes?.[0];
          if (firstEp && firstEp.servers && firstEp.servers.length > 0) {
              return firstEp.servers.find(s => s.isActive) || firstEp.servers[0];
          }
      }
      return null;
  });
  
  // Pre-roll Ad State
  const [showPreroll, setShowPreroll] = useState(false);
  const [prerollTimer, setPrerollTimer] = useState(5);
  
  // Derived State
  const currentSeason = content.seasons?.find(s => s.id === selectedSeasonId);
  const episodes = currentSeason?.episodes || [];
  
  // Resolve servers based on type
  const activeServers = useMemo(() => {
      if (content.type === 'movie') return content.servers || [];
      if (content.type === 'series' && selectedEpisode) return selectedEpisode.servers || [];
      return [];
  }, [content, selectedEpisode]);

  // Get Download URL (Prefer selected server's download url, fallback to first server, or empty)
  const downloadUrl = selectedServer?.downloadUrl || activeServers[0]?.downloadUrl;

  const isInMyList = !!myList?.includes(content.id);
  
  // Check if player/servers/download should be visible
  // Visible if: Type is Movie OR (Type is Series AND an episode is selected)
  const isContentPlayable = content.type === 'movie' || (content.type === 'series' && !!selectedEpisode);

  // Find Pre-roll Ad
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
                
                // If season changed via URL, check for episode too
                if (episodeMatch && episodeMatch[1]) {
                    const eNum = parseInt(episodeMatch[1]);
                    const foundE = foundS.episodes[eNum - 1] || foundS.episodes[0];
                    if (foundE) {
                        setSelectedEpisode(foundE);
                        // Update server if needed
                        const active = foundE.servers?.find(s => s.isActive) || foundE.servers?.[0];
                        setSelectedServer(active || null);
                    }
                } else {
                    // Default to Ep 1 if only Season provided
                    const firstEp = foundS.episodes[0];
                    if (firstEp) {
                        setSelectedEpisode(firstEp);
                        const active = firstEp.servers?.find(s => s.isActive) || firstEp.servers?.[0];
                        setSelectedServer(active || null);
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
          setPrerollTimer(10); // Reset timer to 10s
          
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
          console.warn('Failed to push state (likely sandboxed):', e);
      }
  };

  const handleWatchScroll = () => {
    playerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  
  const handleSeasonSelect = (seasonId: number) => {
      setSelectedSeasonId(seasonId);
      const season = content.seasons?.find(s => s.id === seasonId);
      
      if (season && season.episodes && season.episodes.length > 0) {
          // Select first episode by default when changing season
          const firstEp = season.episodes[0];
          handleEpisodeSelect(firstEp, season.seasonNumber, 1); 
      } else {
          setSelectedEpisode(null);
          setSelectedServer(null);
      }
  };

  const handleEpisodeSelect = (episode: Episode, seasonNum?: number, episodeIndex?: number) => {
      setSelectedEpisode(episode);
      // Reset Server to first active
      if (episode.servers && episode.servers.length > 0) {
          const active = episode.servers.find(s => s.isActive) || episode.servers[0];
          setSelectedServer(active);
      } else {
          setSelectedServer(null);
      }

      // Update URL
      if (content.type === 'series') {
          // Fallback logic if params not passed directly
          const sNum = seasonNum ?? currentSeason?.seasonNumber ?? 1;
          // Calculate visual episode number (index + 1) if not passed
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

  // Recommendations
  const similarContent = useMemo(() => {
      return allContent.filter(c => c.id !== content.id && c.categories.some(cat => content.categories.includes(cat))).slice(0, 10);
  }, [content, allContent]);


  // UI Helpers
  const videoPoster = content.type === 'movie' ? content.backdrop : (selectedEpisode?.thumbnail || content.backdrop);

  // Determine which backdrop to show (Season specific or Content generic)
  const displayBackdrop = (content.type === 'series' && currentSeason?.backdrop) 
    ? currentSeason.backdrop 
    : content.backdrop;

  // Determine which logo to show (Season specific or Content generic)
  const displayLogo = (content.type === 'series' && currentSeason?.logoUrl)
    ? currentSeason.logoUrl
    : content.logoUrl;

  // Determine Description (Season Specific or Content generic)
  const displayDescription = (content.type === 'series' && currentSeason?.description)
    ? currentSeason.description
    : content.description;

  // Determine Cast (Season Specific or Content generic)
  const displayCast = (content.type === 'series' && currentSeason?.cast && currentSeason.cast.length > 0)
    ? currentSeason.cast
    : content.cast;

  // Reusable Title Component
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

  // --- SEO & SCHEMA MARKUP GENERATION ---
  
  // 1. Dynamic Title & URL Logic
  const getSEOData = () => {
      const baseUrl = 'https://cinematix-kappa.vercel.app';
      const slug = content.slug || content.id;
      
      if (content.type === 'movie') {
          return {
              title: `مشاهدة فيلم ${content.title} (${content.releaseYear}) مترجم | سينماتيكس`,
              url: `${baseUrl}/فيلم/${slug}`
          };
      } else {
          // Calculate Episode Number
          let epNum = 1;
          if (selectedEpisode && currentSeason) {
              const idx = currentSeason.episodes.findIndex(e => e.id === selectedEpisode.id);
              if (idx !== -1) epNum = idx + 1;
          }
          const sNum = currentSeason?.seasonNumber || 1;
          
          // Dynamic Series Title
          const seriesTitle = `مشاهدة مسلسل ${content.title} الموسم ${sNum} الحلقة ${epNum} (${content.releaseYear}) مترجم | سينماتيكس`;
          const seriesUrl = `${baseUrl}/مسلسل/${slug}/الموسم/${sNum}/الحلقة/${epNum}`;
          
          return { title: seriesTitle, url: seriesUrl };
      }
  };

  const { title: seoTitle, url: seoUrl } = getSEOData();

  // 2. Schema.org Generation
  const generateSchema = () => {
    // Base schema structure
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
        "ratingCount": "100" // Static placeholder for rich snippet validity
      },
      "genre": content.genres,
      "actor": content.cast?.map(actor => ({
          "@type": "Person",
          "name": actor
      })) || []
    };

    if (content.type === 'movie') {
       if (content.duration) {
           baseSchema["duration"] = content.duration.replace('h', 'H').replace('m', 'M').replace(' ', ''); // ISO 8601 basic fix
       }
    } else {
       // Series specific additions
       const sNum = currentSeason?.seasonNumber || 1;
       const epNum = selectedEpisode ? (currentSeason?.episodes.findIndex(e => e.id === selectedEpisode.id) || 0) + 1 : 1;
       
       baseSchema["containsSeason"] = {
           "@type": "TVSeason",
           "seasonNumber": sNum,
           "numberOfEpisodes": currentSeason?.episodes.length || 0,
           "episode": {
               "@type": "TVEpisode",
               "episodeNumber": epNum,
               "name": selectedEpisode?.title || `Episode ${epNum}`,
               "image": selectedEpisode?.thumbnail || content.backdrop
           }
       };
    }
    
    return baseSchema;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white pb-0">
      
      {/* Dynamic SEO Tags */}
      <SEO 
        title={seoTitle}
        description={content.description ? content.description.substring(0, 160) : `مشاهدة ${content.title} اون لاين بجودة عالية`}
        image={content.backdrop}
        type={content.type === 'movie' ? 'video.movie' : 'video.tv_show'}
        url={seoUrl}
        schema={generateSchema()}
      />

      {/* Performance Optimization: Preconnect to all server domains */}
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

      {/* --- 1. Hero Section (Cinematic) --- */}
      <div className="relative h-[80vh] w-full overflow-hidden group">
        <div className="absolute inset-0">
            <img 
                src={displayBackdrop} 
                alt={content.title} 
                className={`w-full h-full object-cover ${content.enableMobileCrop ? 'md:!object-top' : 'object-top'}`}
                style={imgStyle}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-body)] via-[var(--bg-body)]/20 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-body)]/80 via-transparent to-transparent"></div>
        </div>

        {/* Info Content */}
        <div className="absolute bottom-0 left-0 w-full px-4 md:px-8 pb-12 flex flex-col justify-end items-start z-10">
            <div className="max-w-4xl w-full animate-fade-in-up flex flex-col items-center md:items-start text-center md:text-right">
                
                {/* A. Title Logic: Logo vs Text */}
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

                {/* B. Meta Row (Rating - Year - Genre) */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 mb-8 text-sm md:text-lg font-medium text-gray-200 w-full">
                     {/* Rating */}
                     <div className="flex items-center gap-1.5 text-yellow-400 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        <StarIcon className="w-5 h-5" />
                        <span className="font-bold text-white">{content.rating.toFixed(1)}</span>
                    </div>
                    
                    {/* Divider */}
                    <span className="text-gray-500 text-xl">|</span>

                    {/* Year */}
                    <span className="text-white tracking-wide">{currentSeason?.releaseYear || content.releaseYear}</span>
                    
                    {/* Divider */}
                    <span className="text-gray-500 text-xl">|</span>

                    {/* Age Rating */}
                    {content.ageRating && (
                        <>
                            <span className="px-2 py-0.5 border border-gray-500 rounded text-gray-300 text-xs md:text-sm">{content.ageRating}</span>
                            <span className="text-gray-500 text-xl">|</span>
                        </>
                    )}

                    {/* Movie Duration (Only visible for Movies) */}
                    {content.type === 'movie' && content.duration && (
                        <>
                             <div className="flex items-center gap-1.5 text-gray-300 bg-black/30 px-2 py-0.5 rounded border border-white/5">
                                <ClockIcon className="w-4 h-4" />
                                <span>{content.duration}</span>
                            </div>
                            <span className="text-gray-500 text-xl">|</span>
                        </>
                    )}

                    {/* Genres - Show All */}
                    <div className="flex flex-wrap gap-1">
                        {content.genres.map((genre, index) => (
                            <span key={index} className={`${isRamadanTheme ? 'text-[#FFD700]' : isEidTheme ? 'text-purple-400' : isCosmicTealTheme ? 'text-[#35F18B]' : isNetflixRedTheme ? 'text-[#E50914]' : 'text-[#00A7F8]'}`}>
                                {genre}{index < content.genres.length - 1 ? '، ' : ''}
                            </span>
                        ))}
                    </div>
                </div>

                {/* C. Action Buttons */}
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

      {/* --- 2. Info & Lists Section (Story, Cast, Episodes) & Sidebar Ad --- */}
      <div className="w-full px-4 md:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Left Column (Content) - Spans 3 cols on large screens */}
              <div className="lg:col-span-3 space-y-12">
                  {/* A. Story Section */}
                  <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                      <SectionTitle title="القصة" />
                      <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-4xl opacity-90">
                          {displayDescription}
                      </p>
                  </div>

                  {/* B. Cast Section */}
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

                  {/* C. Series Interaction (Seasons & Episodes) */}
                  {content.type === 'series' && content.seasons && (
                    <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                        <SectionTitle title="الحلقات" />
                        
                        {/* Season Selector */}
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

                        {/* Episodes Grid */}
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

              {/* Right Column (Sidebar Ad) */}
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
                 
                 {/* Player, Servers, Download */}
                 {isContentPlayable ? (
                    <>
                         {/* A. Servers Row */}
                         <div className="mb-6 animate-fade-in-up">
                            <SectionTitle title="سيرفرات المشاهدة" />
                            
                            <div className="flex items-center gap-3 overflow-x-auto rtl-scroll pb-2 no-scrollbar">
                                {activeServers.length > 0 ? activeServers.map((server) => (
                                     <button
                                        key={server.id}
                                        onClick={() => handleServerSelect(server)}
                                        className={`
                                            flex-shrink-0 px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-sm flex items-center gap-2 whitespace-nowrap
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
                                    <p className="text-gray-500 italic text-sm">لا توجد سيرفرات متاحة حالياً.</p>
                                )}
                            </div>
                         </div>

                         {/* B. The Player Container */}
                         <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.7)] border border-gray-800 bg-black z-10 group animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                              
                              {/* Pre-roll Ad Overlay */}
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
                                      
                                      <div className="w-full h-full flex items-center justify-center pointer-events-auto" dangerouslySetInnerHTML={{ __html: prerollAd.code }} />
                                  </div>
                              ) : (
                                  /* Actual Video Player */
                                  <VideoPlayer 
                                      poster={videoPoster} 
                                      src={selectedServer?.url} 
                                  />
                              )}
                         </div>

                         {/* C. Download Button */}
                         {downloadUrl && (
                             <div className="mt-8 flex justify-center items-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                                 <a 
                                    href={downloadUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`
                                        relative overflow-hidden group w-full md:w-auto
                                        bg-[#151515] hover:bg-[#202020]
                                        border border-gray-700 hover:border-opacity-50
                                        rounded-full p-1.5 transition-all duration-300
                                        flex items-center justify-center gap-4 shadow-lg min-w-[280px]
                                        ${isRamadanTheme 
                                            ? 'hover:border-amber-500/50' 
                                            : isEidTheme
                                                ? 'hover:border-purple-500/50'
                                                : isCosmicTealTheme
                                                    ? 'hover:border-[#35F18B]/50'
                                                    : isNetflixRedTheme
                                                        ? 'hover:border-[#E50914]/50'
                                                        : 'hover:border-[#00A7F8]/50'}
                                    `}
                                 >
                                    <div className={`bg-gradient-to-br from-gray-800 to-black p-3 rounded-full border border-gray-700 transition-colors 
                                        ${isRamadanTheme 
                                            ? 'group-hover:border-amber-500' 
                                            : isEidTheme
                                                ? 'group-hover:border-purple-500'
                                                : isCosmicTealTheme
                                                    ? 'group-hover:border-[#35F18B]'
                                                    : isNetflixRedTheme
                                                        ? 'group-hover:border-[#E50914]'
                                                        : 'group-hover:border-[#00A7F8]'
                                        }
                                    `}>
                                        <DownloadIcon className={`w-6 h-6 transition-transform group-hover:scale-110 
                                            ${isRamadanTheme 
                                                ? 'text-amber-500' 
                                                : isEidTheme
                                                    ? 'text-purple-500'
                                                    : isCosmicTealTheme
                                                        ? 'text-[#35F18B]'
                                                        : isNetflixRedTheme
                                                            ? 'text-[#E50914]'
                                                            : 'text-[#00A7F8]'
                                            }
                                        `} />
                                    </div>
                                    <div className="flex flex-col text-right py-2 pl-8">
                                        <span className={`font-bold text-base transition-colors 
                                            ${isRamadanTheme 
                                                ? 'text-white group-hover:text-amber-500' 
                                                : isEidTheme
                                                    ? 'text-white group-hover:text-purple-400'
                                                    : isCosmicTealTheme
                                                        ? 'text-white group-hover:text-[#35F18B]'
                                                        : isNetflixRedTheme
                                                            ? 'text-white group-hover:text-[#E50914]'
                                                            : 'text-white group-hover:text-[#00A7F8]'
                                            }
                                        `}>
                                            تحميل بجودة عالية
                                        </span>
                                        <span className="text-gray-500 text-xs mt-0.5 group-hover:text-gray-400">
                                            رابط مباشر وسريع
                                        </span>
                                    </div>
                                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-10 group-hover:animate-shine" />
                                 </a>
                             </div>
                         )}
                    </>
                 ) : (
                    /* Fallback Message for Series with Empty Season */
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

      {/* --- 4. Recommendations Footer --- */}
      <div className="w-full px-4 md:px-8 pt-8">
         <div className={`border-t pt-8 ${isRamadanTheme ? 'border-amber-900/20' : isEidTheme ? 'border-purple-900/20' : 'border-gray-800'}`}>
            <ContentCarousel 
                title={
                    <div className="flex items-center gap-3">
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
