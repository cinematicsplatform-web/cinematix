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
import { StarIcon } from '@/components/icons/StarIcon';
import { ClockIcon } from '@/components/icons/ClockIcon';
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
  onSelectContent: (content: Content, seasonNum?: number, episodeNum?: number) => void;
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
  const isLoaded = !!content && !!content.id;
  const safeTitle = content?.title || 'جاري التحميل...';
  const seriesSlug = content?.slug || content?.id;

  const [activeTab, setActiveTab] = useState<'episodes' | 'trailer' | 'details' | 'related'>('episodes');
  const tabsRef = useRef<HTMLDivElement>(null);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getEpisodeDescription = (description: string | undefined, epNumber: number, sNumber: number) => {
      if (description && description.trim().length > 0) return description;
      return `شاهد أحداث الحلقة ${epNumber} من الموسم ${sNumber}. استمتع بمشاهدة تطورات الأحداث في هذه الحلقة.`;
  };

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
              setIsSeasonDropdownOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

  useEffect(() => {
    if (isLoaded && content.type === 'series' && content.seasons && content.seasons.length > 0) {
        let targetSeason = null;
        if (initialSeasonNumber) {
            targetSeason = content.seasons.find(s => s.seasonNumber === initialSeasonNumber);
        }
        if (!targetSeason) {
            const path = decodeURIComponent(locationPath || window.location.pathname);
            const seasonMatch = path.match(/\/(?:الموسم|season|series)\/.*?(?:\/(\d+))?$/i);
            if (seasonMatch && seasonMatch[1]) {
                const sNum = parseInt(seasonMatch[1]);
                targetSeason = content.seasons.find(s => s.seasonNumber === sNum);
            }
        }
        if (!targetSeason) targetSeason = [...content.seasons].sort((a, b) => b.seasonNumber - a.seasonNumber)[0];

        if (targetSeason) {
            setSelectedSeasonId(targetSeason.id);
            if (targetSeason.episodes && targetSeason.episodes.length > 0) setSelectedEpisode(targetSeason.episodes[0]);
        }
    }
  }, [content?.id, isLoaded]);

  const currentSeason = useMemo(() => content?.seasons?.find(s => s.id === selectedSeasonId), [content?.seasons, selectedSeasonId]);
  const episodes = useMemo(() => currentSeason?.episodes || [], [currentSeason]);
  const displayBackdrop = currentSeason?.backdrop || content?.backdrop || '';
  const displayLogo = currentSeason?.logoUrl || content?.logoUrl || '';
  const displayDescription = currentSeason?.description || content?.description || '';
  const activeServers = (content?.type === 'movie' ? content.servers : []) || [];
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  useEffect(() => {
      if (activeServers.length > 0) setSelectedServer(activeServers.find(s => s.isActive) || activeServers[0]);
  }, [activeServers]); 
  
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

  const trailerVideoId = getVideoId((content?.type === 'series' && currentSeason?.trailerUrl) ? currentSeason.trailerUrl : content?.trailerUrl);

  useEffect(() => {
      setShowVideo(false); setIsMuted(true);
      if (!trailerVideoId || isMobile) return;
      const timer = setTimeout(() => { setShowVideo(true); }, 2000); 
      return () => clearTimeout(timer);
  }, [content?.id, trailerVideoId, isMobile, selectedSeasonId]);

  useEffect(() => {
      if (showVideo && iframeRef.current) {
          const cmd = isMuted ? 'mute' : 'unMute';
          try { iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: cmd, args: '' }), '*'); } catch (e) {}
      }
  }, [isMuted, showVideo]);

  const [waiterAdState, setWaiterAdState] = useState<{ isOpen: boolean, ad: Ad | null, onComplete: () => void }>({ isOpen: false, ad: null, onComplete: () => {} });

  const handleEpisodeSelect = (episode: Episode, seasonNum?: number, episodeIndex?: number) => {
      const sNum = seasonNum ?? currentSeason?.seasonNumber ?? 1;
      const eNum = episodeIndex || currentSeason?.episodes.findIndex(e => e.id === episode.id) + 1;
      onSelectContent(content, sNum, eNum);
  };

  const similarContent = useMemo(() => {
    if (!content?.id) return [];
    return allContent.filter(c => c.id !== content.id && c.categories.some(cat => content.categories.includes(cat))).slice(0, 10);
  }, [content, allContent]);

  const activeTabClass = isRamadanTheme ? 'text-white border-[#FFD700]' : isEidTheme ? 'text-white border-purple-500' : isCosmicTealTheme ? 'text-white border-[#35F18B]' : isNetflixRedTheme ? 'text-white border-[#E50914]' : 'text-white border-[#00A7F8]';
  const tabHoverClass = 'text-gray-400 border-transparent hover:text-white';

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white pb-0 relative overflow-x-hidden w-full">
      <SEO 
        type={content?.type === 'series' ? 'series' : 'movie'} 
        title={content?.title} 
        seasonNumber={content?.type === 'series' ? currentSeason?.seasonNumber : undefined}
        description={content?.description} 
        image={content?.poster} 
        banner={displayBackdrop}
      />

      <div ref={heroRef} className="relative h-[80vh] w-full overflow-hidden group z-10">
        <div className="absolute inset-0 bg-black">
            {isLoaded ? <img key={displayBackdrop} src={displayBackdrop} alt={content.title} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${showVideo ? 'opacity-0' : 'opacity-100'}`}/> : <div className="absolute inset-0 bg-[#0f1014] skeleton-shimmer"></div>}
            {trailerVideoId && !isMobile && (
                <div className={`absolute inset-0 w-full h-full overflow-hidden transition-opacity duration-1000 ${showVideo ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full aspect-video pointer-events-none">
                        <iframe ref={iframeRef} src={`https://www.youtube.com/embed/${trailerVideoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&loop=0&playsinline=1&enablejsapi=1`} className="w-full h-full" frameBorder="0"></iframe>
                    </div>
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-body)] via-[var(--bg-body)]/80 via-20% to-transparent z-10"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-full px-4 md:px-8 pb-4 md:pb-6 flex flex-col justify-end items-start z-20">
            <div className="max-w-4xl w-full flex flex-col items-center md:items-start text-center md:text-right">
                {isLoaded ? (content.isLogoEnabled && displayLogo ? <img src={displayLogo} alt={content.title} className="w-auto h-auto max-w-[245px] md:max-w-[435px] max-h-[190px] md:max-h-[300px] mb-3 object-contain drop-shadow-2xl"/> : <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-3 leading-tight text-white drop-shadow-lg">{content.title}</h1>) : <div className="w-64 md:w-96 h-12 md:h-20 bg-gray-800 rounded-xl skeleton-shimmer mb-4"></div>}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-2 text-sm md:text-base font-medium text-gray-200 w-full">
                    {isLoaded ? <><div className="flex items-center gap-1.5 text-yellow-400 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10"><StarIcon className="w-5 h-5" /><span className="font-bold text-white">{content.rating.toFixed(1)}</span></div><span className="text-gray-500">|</span><span className="text-white">{currentSeason?.releaseYear || content.releaseYear}</span><span className="text-gray-500">|</span><span className="px-2 py-0.5 border border-gray-500 rounded text-gray-300 text-xs">{content.ageRating}</span></> : <div className="w-48 h-6 bg-gray-800 rounded skeleton-shimmer"></div>}
                </div>
                <div className="overflow-hidden transition-all duration-700 ease-in-out w-full opacity-100 max-h-40 mb-3 md:mb-4">
                    {isLoaded ? <p className="text-gray-300 text-xs sm:text-sm md:text-lg line-clamp-3 leading-relaxed max-w-2xl mx-auto md:mx-0 font-medium">{displayDescription}</p> : <div className="space-y-2 w-full max-w-xl"><div className="h-4 bg-gray-800 rounded skeleton-shimmer w-full"></div><div className="h-4 bg-gray-800 rounded skeleton-shimmer w-3/4"></div></div>}
                </div>
                <div className="flex items-center justify-center md:justify-start w-full md:w-auto relative z-40 mt-1">
                    {isLoaded ? <ActionButtons onWatch={() => setActiveTab('episodes')} onToggleMyList={() => onToggleMyList(content.id)} isInMyList={!!myList?.includes(content.id)} showMyList={isLoggedIn} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} content={content}/> : <div className="flex gap-4"><div className="w-40 h-14 bg-gray-800 rounded-full skeleton-shimmer"></div><div className="w-40 h-14 bg-gray-800 rounded-full skeleton-shimmer"></div></div>}
                </div>
            </div>
        </div>
      </div>

      <div ref={tabsRef} className="sticky top-16 md:top-20 z-40 bg-[var(--bg-body)]/95 backdrop-blur-xl border-b border-white/5 shadow-md w-full">
          <div className="w-full px-4 md:px-8 flex flex-row items-center justify-between h-14 md:h-16">
              <div className="flex items-center gap-6 md:gap-8 h-full overflow-x-auto no-scrollbar">
                  <button onClick={() => setActiveTab('episodes')} className={`py-4 px-2 border-b-[3px] font-bold transition-all duration-300 text-sm md:text-lg whitespace-nowrap ${activeTab === 'episodes' ? activeTabClass : tabHoverClass}`}>{content?.type === 'movie' ? 'المشاهدة' : `الحلقات (${episodes.length})`}</button>
                  <button onClick={() => setActiveTab('details')} className={`py-4 px-2 border-b-[3px] font-bold transition-all duration-300 text-sm md:text-lg whitespace-nowrap ${activeTab === 'details' ? activeTabClass : tabHoverClass}`}>التفاصيل</button>
                  <button onClick={() => setActiveTab('related')} className={`py-4 px-2 border-b-[3px] font-bold transition-all duration-300 text-sm md:text-lg whitespace-nowrap ${activeTab === 'related' ? activeTabClass : tabHoverClass}`}>أعمال مشابهة</button>
              </div>
          </div>
      </div>

      <div className="relative w-full bg-[var(--bg-body)] min-h-[500px]">
          {activeTab === 'episodes' && (
              <div className="animate-fade-in-up w-full px-4 md:px-8 pt-8">
                  {content.type === 'series' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-10 pb-10">
                          {episodes.map((ep, index) => {
                              const eNum = index + 1;
                              const sNum = currentSeason?.seasonNumber || 1;
                              // --- RULE B: SLUG-BASED SHORTCUT LINK ---
                              const watchUrl = `/watch/${seriesSlug}/${sNum}/${eNum}`;
                              
                              return (
                                  <a 
                                    key={ep.id} 
                                    href={watchUrl}
                                    onClick={(e) => { e.preventDefault(); handleEpisodeSelect(ep, sNum, eNum); }}
                                    aria-label={`شاهد ${content.title} الموسم ${sNum} الحلقة ${eNum}`}
                                    className="group cursor-pointer relative rounded-xl bg-[var(--bg-card)] border border-gray-800 episode-card-hover overflow-hidden h-full flex flex-col no-underline text-inherit"
                                  >
                                      <div className="relative w-full aspect-video overflow-hidden bg-black">
                                          <img src={ep.thumbnail || content.backdrop} alt={ep.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                          <div className="absolute bottom-3 right-3 left-3 flex justify-between items-end">
                                              <h4 className="text-xl font-bold text-white drop-shadow-md leading-none">{ep.title || `الحلقة ${eNum}`}</h4>
                                              {ep.duration && <span className="text-xs font-bold text-white bg-black/60 px-2 py-1 rounded-lg">{ep.duration}</span>}
                                          </div>
                                      </div>
                                      <div className="p-3 md:p-4 flex-1"><p className="text-xs md:text-sm text-gray-400 line-clamp-3 leading-relaxed">{getEpisodeDescription(ep.description, eNum, sNum)}</p></div>
                                  </a>
                              );
                          })}
                      </div>
                  ) : (
                      <div className="max-w-6xl mx-auto w-full py-8">
                           <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-800 bg-black">
                                <VideoPlayer tmdbId={content.id} type={content.type} manualSrc={selectedServer?.url} poster={content.backdrop} />
                           </div>
                      </div>
                  )}
              </div>
          )}
          {activeTab === 'details' && (
              <div className="px-4 md:px-8 py-8 animate-fade-in-up w-full">
                  <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-12">
                      <div className="flex-1 space-y-10">
                          <div><h3 className="text-xl md:text-2xl font-bold text-white mb-4">القصة</h3><p className="text-gray-300 text-lg leading-loose">{displayDescription}</p></div>
                          <div><h3 className="text-xl md:text-2xl font-bold text-white mb-4">التصنيف</h3><div className="flex flex-wrap gap-2">{content?.genres?.map((genre, index) => (<div key={index} className="px-4 py-2 rounded-lg text-sm font-bold border border-gray-700 bg-gray-800/50 text-gray-300">{genre}</div>))}</div></div>
                      </div>
                  </div>
              </div>
          )}
          {activeTab === 'related' && (
              <div className="py-8 animate-fade-in-up w-full">
                  <ContentCarousel title="قد يعجبك أيضاً" contents={similarContent} onSelectContent={onSelectContent} isLoggedIn={isLoggedIn} myList={myList} onToggleMyList={onToggleMyList} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} isHorizontal={true} />
              </div>
          )}
      </div>
    </div>
  );
};

export default DetailPage;