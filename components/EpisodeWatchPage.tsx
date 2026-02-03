
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Content, Episode, Server, Ad, View, Person } from '../types';
import { ContentType } from '../types';
import VideoPlayer from './VideoPlayer';
import AdPlacement from './AdPlacement';
import { PlayIcon } from './icons/PlayIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { CloseIcon } from './icons/CloseIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import SEO from './SEO';
import AdWaiterModal from './AdWaiterModal';
import ReportModal from './ReportModal';
import { getPeople } from '../firebase';
import { StarIcon } from './icons/StarIcon';

interface EpisodeWatchPageProps {
    content: Content;
    seasonNumber: number;
    episodeNumber: number;
    allContent: Content[];
    onSetView: (view: View, category?: string, params?: any) => void;
    ads: Ad[];
    adsEnabled: boolean;
    isRamadanTheme?: boolean;
    isEidTheme?: boolean;
    isCosmicTealTheme?: boolean;
    isNetflixRedTheme?: boolean;
}

export const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    {...props}
  >
    <circle cx="12" cy="7" r="5" />
    <path d="M12 13c-5 0-9 2-9 5v6h18v-6c0-3-4-5-9-5z" />
  </svg>
);

const EpisodeWatchPage: React.FC<EpisodeWatchPageProps> = ({
    content,
    seasonNumber,
    episodeNumber,
    onSetView,
    ads,
    adsEnabled,
    isRamadanTheme,
    isEidTheme,
    isCosmicTealTheme,
    isNetflixRedTheme
}) => {
    const isBasicLoaded = !!content && !!content.id;
    const isEpisodic = content?.type === ContentType.Series || content?.type === ContentType.Program;
    const [people, setPeople] = useState<Person[]>([]);

    useEffect(() => {
        getPeople().then(setPeople);
    }, []);

    const currentSeason = useMemo(() => 
        content?.seasons?.find(s => s.seasonNumber === seasonNumber), 
    [content?.seasons, seasonNumber]);

    const selectedEpisode = useMemo(() => {
        if (!currentSeason?.episodes) return null;
        if (episodeNumber > 0 && episodeNumber <= currentSeason.episodes.length) {
            return currentSeason.episodes[episodeNumber - 1];
        }
        return null;
    }, [currentSeason, episodeNumber]);

    const flipBackdrop = currentSeason?.flipBackdrop ?? content?.flipBackdrop ?? false;
    const displayBackdrop = currentSeason?.backdrop || content?.backdrop || '';
    const displayDescription = currentSeason?.description || content?.description || '';

    const canonicalUrl = isEpisodic ? `/${content.type}/${content?.slug || content?.id}` : `/watch/movie/${content?.slug || content?.id}`;

    const activeServers = useMemo(() => {
        const servers = selectedEpisode?.servers || [];
        return servers.filter(s => s.url && s.url.trim().length > 0);
    }, [selectedEpisode]);

    const [selectedServer, setSelectedServer] = useState<Server | null>(null);
    const [playerKey, setPlayerKey] = useState(0); 

    useEffect(() => {
        if (activeServers.length > 0) {
            const defaultServer = activeServers.find(s => s.isActive) || activeServers[0];
            setSelectedServer(defaultServer);
        }
    }, [activeServers]);

    // تأكيد جاهزية الصفحة كاملة: يجب توفر المحتوى والسيرفر النشط
    const isFullyReady = isBasicLoaded && !!selectedServer;

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isDownloadErrorOpen, setIsDownloadErrorOpen] = useState(false);

    const accentColor = isRamadanTheme ? 'text-[#FFD700]' : isEidTheme ? 'text-purple-500' : isCosmicTealTheme ? 'text-[#35F18B]' : isNetflixRedTheme ? 'text-[#E50914]' : 'text-[#00A7F8]';
    const bgAccent = isRamadanTheme ? 'bg-amber-500' : isEidTheme ? 'bg-purple-500' : isCosmicTealTheme ? 'bg-[#35F18B]' : isNetflixRedTheme ? 'text-[#E50914]' : 'bg-[#00A7F8]';

    const handleDownload = () => {
        const episodeServers = selectedEpisode?.servers || [];
        const hasDownloadLinks = episodeServers.some(s => s.downloadUrl && s.downloadUrl.trim().length > 0);

        if (!hasDownloadLinks) {
            setIsDownloadErrorOpen(true);
            return;
        }

        onSetView('download', undefined, { 
            content: content,
            season: seasonNumber,
            episode: episodeNumber
        });
    };

    const cropStyle: React.CSSProperties = {
      '--mob-x': `${currentSeason?.mobileCropPositionX ?? currentSeason?.mobileCropPosition ?? content?.mobileCropPositionX ?? content?.mobileCropPosition ?? 50}%`,
      '--mob-y': `${currentSeason?.mobileCropPositionY ?? currentSeason?.mobileCropPositionY ?? content?.mobileCropPositionY ?? 50}%`,
      transform: flipBackdrop ? 'scaleX(-1)' : 'none'
    } as React.CSSProperties;

    const enableCrop = currentSeason?.enableMobileCrop ?? content?.enableMobileCrop ?? false;

    return (
        <div className="min-h-screen bg-[var(--bg-body)] text-white pb-20 animate-fade-in-up relative overflow-x-hidden overflow-y-auto">
            <SEO 
                type={isEpisodic ? "series" : "movie"} 
                title={content?.title} 
                seasonNumber={seasonNumber}
                episodeNumber={episodeNumber}
                description={selectedEpisode?.description || currentSeason?.description || content?.description} 
                image={selectedEpisode?.thumbnail || currentSeason?.poster || content?.poster}
                url={canonicalUrl}
                noIndex={true} 
            />

            <div className="sticky top-0 z-50 bg-[var(--bg-body)]/95 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4 w-full">
                    <button onClick={() => onSetView('detail', undefined, { season: seasonNumber })} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <ChevronRightIcon className="w-5 h-5 transform rotate-180 text-white" />
                    </button>
                    <div className="flex flex-col min-w-0 items-start">
                        {isFullyReady ? (
                            <>
                                <h1 className="text-sm md:text-base font-bold text-gray-200 truncate">{content.title}</h1>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] md:text-xs font-bold ${accentColor}`}>الموسم {seasonNumber} | الحلقة {episodeNumber}</span>
                                    {selectedEpisode?.isLastEpisode && (
                                        <span className="bg-red-600/20 text-red-500 border border-red-500/30 text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">الحلقة الأخيرة</span>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col gap-1">
                                <div className="w-32 md:w-48 h-4 bg-gray-800/40 rounded skeleton-shimmer border border-white/5"></div>
                                <div className="w-20 md:w-32 h-3 bg-gray-800/40 rounded skeleton-shimmer border border-white/5"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-0 pt-6 text-center">
                
                <div className="w-full mb-6">
                    <div className="flex items-center justify-start md:justify-start gap-3 overflow-x-auto no-scrollbar pb-3">
                        <span className="text-sm text-gray-400 font-black ml-2 whitespace-nowrap">سيرفر المشاهدة:</span>
                        {isFullyReady && activeServers.length > 0 ? activeServers.map((server, idx) => (
                            <button key={server.id} onClick={() => setSelectedServer(server)} className={`flex-shrink-0 px-8 py-3 rounded-2xl font-black text-sm transition-all border target-server-btn ${selectedServer?.id === server.id ? `${bgAccent} text-black border-transparent shadow-[0_0_20px_var(--shadow-color)] scale-105` : 'bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-800 hover:border-gray-600'}`}>
                                سيرفر {idx + 1}
                            </button>
                        )) : (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-12 w-28 bg-gray-800/40 rounded-2xl skeleton-shimmer border border-white/5 flex-shrink-0"></div>
                            ))
                        )}
                    </div>
                </div>

                {/* Video Container - لا يظهر إلا عند جاهزية السيرفر الأول */}
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/5 z-10 mx-auto video-player-wrapper">
                    {isFullyReady ? (
                        <VideoPlayer 
                            key={playerKey}
                            tmdbId={content.id} 
                            type={content.type} 
                            season={seasonNumber} 
                            episode={episodeNumber} 
                            manualSrc={selectedServer?.url} 
                            poster={selectedEpisode?.thumbnail || displayBackdrop} 
                            title={content.title}
                        />
                    ) : (
                        <div className="absolute inset-0 bg-[#0f1014] skeleton-shimmer flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-white/10 border-t-[#00cba9] rounded-full animate-spin"></div>
                                <span className="text-gray-400 font-bold text-sm animate-pulse">جاري تأمين اتصال السيرفر...</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-5 relative flex flex-col items-center gap-2 animate-fade-in-up">
                    <div className="flex justify-center w-full">
                        {isFullyReady && selectedEpisode?.servers.some(s => s.downloadUrl && s.downloadUrl.trim().length > 0) && (
                            <button 
                                onClick={handleDownload}
                                className={`
                                    inline-flex items-center justify-center gap-3
                                    font-bold 
                                    py-3 px-8 md:py-4 md:px-12
                                    rounded-full
                                    text-base md:text-lg
                                    transform transition-all duration-200
                                    active:scale-95
                                    shadow-lg hover:shadow-2xl
                                    target-download-btn
                                    ${isRamadanTheme 
                                        ? "bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black" 
                                        : isEidTheme 
                                            ? "bg-gradient-to-r from-purple-800 to-purple-500 text-white" 
                                            : "bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black"
                                    }
                                `}
                            >
                                <DownloadIcon className="h-5 w-5 md:w-6 md:h-6 fill-current" />
                                <span>تحميل الآن</span>
                            </button>
                        )}
                    </div>

                    <div className="w-full flex justify-center md:justify-start">
                        <button 
                            onClick={() => setIsReportModalOpen(true)} 
                            className="px-4 py-1.5 rounded-lg text-red-500/60 hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all flex items-center justify-center shrink-0"
                        >
                            <span className="text-xs font-bold">⚠️ إبلاغ عن عطل</span>
                        </button>
                    </div>
                </div>

                <div className="mt-8 flex flex-col items-center md:items-start gap-6 text-center md:text-right">
                    {isFullyReady ? (
                        <div className="space-y-6 w-full">
                            <div className="flex justify-center md:justify-between items-start">
                                <h2 className="text-2xl font-bold text-white text-center md:text-right">{selectedEpisode?.title || `الحلقة ${episodeNumber}`}</h2>
                            </div>
                            <p className="text-sm text-gray-400 max-w-3xl leading-loose mx-auto md:mx-0">{selectedEpisode?.description || displayDescription}</p>
                            
                            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-xl max-w-4xl mt-4 mx-auto md:mx-0">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap divide-x divide-y md:divide-y-0 divide-white/10 rtl:divide-x-reverse">
                                    <div className="p-4 flex flex-col items-center md:items-start gap-1 flex-1 min-w-[120px]">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">سنة العرض</span>
                                        <span className="text-white font-black text-sm md:text-base">{currentSeason?.releaseYear || content.releaseYear}</span>
                                    </div>
                                    <div className="p-4 flex flex-col items-center md:items-start gap-1 flex-1 min-w-[120px]">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">مدة الحلقة</span>
                                        <span className="text-white font-black text-sm md:text-base" dir="ltr">{selectedEpisode?.duration || '45m+'}</span>
                                    </div>
                                    <div className="p-4 flex flex-col items-center md:items-start gap-1 flex-1 min-w-[120px]">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">التصنيف</span>
                                        <div className="w-fit border border-gray-600 rounded px-1.5 py-0.5 text-[10px] font-black text-gray-200">{content.ageRating}</div>
                                    </div>
                                    <div className="p-4 flex flex-col items-center md:items-start gap-1 flex-1 min-w-[120px]">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">التقييم</span>
                                        <div className="flex items-center gap-1.5 text-yellow-500">
                                            <StarIcon className="w-3 h-3" />
                                            <span className="font-black text-sm md:text-base">{(Number(content.rating) || 0).toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 w-full">
                            <div className="w-64 h-8 bg-gray-800/40 rounded skeleton-shimmer border border-white/5 mx-auto md:mx-0"></div>
                            <div className="space-y-2">
                                <div className="w-full h-4 bg-gray-800/40 rounded skeleton-shimmer border border-white/5"></div>
                                <div className="w-3/4 h-4 bg-gray-800/40 rounded skeleton-shimmer border border-white/5"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ReportModal 
                isOpen={isReportModalOpen} 
                onClose={() => setIsReportModalOpen(false)} 
                contentId={content?.id} 
                contentTitle={content?.title} 
                episode={`الموسم ${seasonNumber} الحلقة ${episodeNumber}`}
                isCosmicTealTheme={isCosmicTealTheme}
                isNetflixRedTheme={isNetflixRedTheme}
            />
        </div>
    );
};

export default EpisodeWatchPage;
