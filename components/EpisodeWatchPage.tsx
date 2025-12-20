import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Content, Episode, Server, Ad, View } from '@/types';
import VideoPlayer from './VideoPlayer';
import AdPlacement from './AdPlacement';
import { PlayIcon } from './icons/PlayIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { CloseIcon } from './icons/CloseIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import SEO from './SEO';
import AdWaiterModal from './AdWaiterModal';
import ReportModal from './ReportModal';

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
    const isLoaded = !!content && !!content.id;

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

    const activeServers = useMemo(() => {
        const servers = selectedEpisode?.servers || [];
        return servers.filter(s => s.url && s.url.trim().length > 0);
    }, [selectedEpisode]);

    const [selectedServer, setSelectedServer] = useState<Server | null>(null);

    useEffect(() => {
        if (activeServers.length > 0) {
            const defaultServer = activeServers.find(s => s.isActive) || activeServers[0];
            setSelectedServer(defaultServer);
        }
    }, [activeServers]);

    const [showPreroll, setShowPreroll] = useState(false);
    const [prerollTimer, setPrerollTimer] = useState(10);
    const prerollContainerRef = useRef<HTMLDivElement>(null);
    const prerollAd = useMemo(() => adsEnabled ? ads.find(ad => ad.placement === 'watch-preroll' && ad.status === 'active') : null, [ads, adsEnabled]);

    const [waiterAdState, setWaiterAdState] = useState<{ isOpen: boolean, ad: Ad | null, onComplete: () => void }>({ isOpen: false, ad: null, onComplete: () => {} });
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const accentColor = isRamadanTheme ? 'text-[#FFD700]' : isEidTheme ? 'text-purple-500' : isCosmicTealTheme ? 'text-[#35F18B]' : isNetflixRedTheme ? 'text-[#E50914]' : 'text-[#00A7F8]';
    const bgAccent = isRamadanTheme ? 'bg-amber-500' : isEidTheme ? 'bg-purple-500' : isCosmicTealTheme ? 'bg-[#35F18B]' : isNetflixRedTheme ? 'bg-[#E50914]' : 'bg-[#00A7F8]';

    return (
        <div className="min-h-screen bg-[var(--bg-body)] text-white pb-20 animate-fade-in-up">
            <SEO 
                type="series" 
                title={content?.title} 
                seasonNumber={seasonNumber}
                episodeNumber={episodeNumber}
                description={selectedEpisode?.description} 
                image={selectedEpisode?.thumbnail || content?.poster} 
            />

            <div className="sticky top-0 z-50 bg-[var(--bg-body)]/95 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4 w-full">
                    <button onClick={() => onSetView('detail', undefined, { season: seasonNumber })} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <ChevronRightIcon className="w-5 h-5 transform rotate-180 text-white" />
                    </button>
                    <div className="flex flex-col min-w-0 items-start">
                        {isLoaded ? (
                            <>
                                <h1 className="text-sm md:text-base font-bold text-gray-200 truncate">{content.title}</h1>
                                <span className={`text-[10px] md:text-xs font-bold ${accentColor}`}>الموسم {seasonNumber} | الحلقة {episodeNumber}</span>
                            </>
                        ) : (
                            <div className="w-40 h-8 bg-gray-800 rounded skeleton-shimmer"></div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-0 pt-6">
                <div className="w-full mb-4">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2">
                        {isLoaded ? activeServers.map((server) => (
                            <button key={server.id} onClick={() => setSelectedServer(server)} className={`flex-shrink-0 px-5 py-2.5 rounded-lg font-bold text-xs transition-all border ${selectedServer?.id === server.id ? `${bgAccent} text-black border-transparent shadow-lg` : 'bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-800'}`}>
                                {server.name}
                            </button>
                        )) : [1,2,3].map(i => <div key={i} className="h-10 w-24 bg-gray-800 rounded-lg skeleton-shimmer"></div>)}
                    </div>
                </div>

                <div className={`relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl bg-black border ${isLoaded ? 'border-white/5' : 'border-gray-800'} z-10`}>
                    {isLoaded ? (
                        <VideoPlayer tmdbId={content.id} type={content.type} season={seasonNumber} episode={episodeNumber} manualSrc={selectedServer?.url} poster={selectedEpisode?.thumbnail || content.backdrop} />
                    ) : (
                        <div className="absolute inset-0 bg-[#0f1014] skeleton-shimmer"></div>
                    )}
                </div>

                <div className="mt-8 flex flex-col gap-6">
                    {isLoaded ? (
                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold text-white">{selectedEpisode?.title || `الحلقة ${episodeNumber}`}</h2>
                            <p className="text-sm text-gray-400 max-w-3xl leading-loose">{selectedEpisode?.description || content.description}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="w-64 h-8 bg-gray-800 rounded skeleton-shimmer"></div>
                            <div className="w-full h-20 bg-gray-800 rounded skeleton-shimmer"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EpisodeWatchPage;