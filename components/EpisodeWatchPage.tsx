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
    // 1. Locate Season and Episode Data
    const currentSeason = useMemo(() => 
        content.seasons?.find(s => s.seasonNumber === seasonNumber), 
    [content.seasons, seasonNumber]);

    const selectedEpisode = useMemo(() => {
        if (!currentSeason?.episodes) return null;
        if (episodeNumber > 0 && episodeNumber <= currentSeason.episodes.length) {
            return currentSeason.episodes[episodeNumber - 1];
        }
        return null;
    }, [currentSeason, episodeNumber]);

    // --- HELPER: FALLBACK DESCRIPTION ---
    const getEpisodeDescription = (description: string | undefined, epNum: number, sNum: number) => {
        if (description && description.trim().length > 0) return description;
        return `شاهد أحداث الحلقة ${epNum} من الموسم ${sNum}. استمتع بمشاهدة تطورات الأحداث في هذه الحلقة.`;
    };

    // 2. Active Servers Logic
    const activeServers = useMemo(() => {
        const servers = selectedEpisode?.servers || [];
        return servers.filter(s => s.url && s.url.trim().length > 0);
    }, [selectedEpisode]);

    const [selectedServer, setSelectedServer] = useState<Server | null>(null);

    useEffect(() => {
        if (activeServers.length > 0) {
            const defaultServer = activeServers.find(s => s.isActive) || activeServers[0];
            setSelectedServer(defaultServer);
        } else {
            setSelectedServer(null);
        }
    }, [activeServers]);

    // 3. Pre-roll & Ads Logic
    const [showPreroll, setShowPreroll] = useState(false);
    const [prerollTimer, setPrerollTimer] = useState(5);
    const prerollContainerRef = useRef<HTMLDivElement>(null);
    const prerollAd = useMemo(() => adsEnabled ? ads.find(ad => ad.placement === 'watch-preroll' && ad.status === 'active') : null, [ads, adsEnabled]);

    useEffect(() => {
        if (prerollAd && selectedEpisode) {
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
        }
    }, [selectedEpisode, prerollAd]);

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
            } catch (e) {}
        }
    }, [showPreroll, prerollAd]);

    // 4. Download & Action Logic
    const [waiterAdState, setWaiterAdState] = useState<{ isOpen: boolean, ad: Ad | null, onComplete: () => void }>({ isOpen: false, ad: null, onComplete: () => {} });
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const effectiveDownloadUrl = useMemo(() => {
        return activeServers.find(s => s.downloadUrl && s.downloadUrl.trim().length > 0)?.downloadUrl;
    }, [activeServers]);

    const triggerActionWithAd = (callback: () => void, adPosition: string) => {
        if (!adsEnabled) { callback(); return; }
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
    };

    const handleDownloadClick = () => {
        if (!effectiveDownloadUrl) return;
        triggerActionWithAd(() => window.open(effectiveDownloadUrl, '_blank'), 'action_download');
    };

    const handleBack = () => {
        onSetView('detail', undefined, { season: seasonNumber }); 
    };

    const mappedSeasons = useMemo(() => {
        return content.seasons?.map(s => ({
            season_number: s.seasonNumber,
            episodes: s.episodes.map((ep, idx) => ({
                episode_number: idx + 1,
                season_number: s.seasonNumber,
                name: ep.title,
                overview: ep.description,
                still_path: ep.thumbnail
            }))
        })) || [];
    }, [content.seasons]);

    const mappedCurrentEpisode = useMemo(() => {
        if (!selectedEpisode) return undefined;
        return {
            episode_number: episodeNumber,
            season_number: seasonNumber,
            name: selectedEpisode.title,
            overview: selectedEpisode.description,
            still_path: selectedEpisode.thumbnail
        };
    }, [selectedEpisode, episodeNumber, seasonNumber]);

    // Theme Colors
    const accentColor = isRamadanTheme ? 'text-[#FFD700]' : isEidTheme ? 'text-purple-500' : isCosmicTealTheme ? 'text-[#35F18B]' : isNetflixRedTheme ? 'text-[#E50914]' : 'text-[#00A7F8]';
    const bgAccent = isRamadanTheme ? 'bg-amber-500' : isEidTheme ? 'bg-purple-500' : isCosmicTealTheme ? 'bg-[#35F18B]' : isNetflixRedTheme ? 'bg-[#E50914]' : 'bg-[#00A7F8]';
    const borderAccent = isRamadanTheme ? 'border-[#FFD700]' : isEidTheme ? 'border-purple-500' : isCosmicTealTheme ? 'border-[#35F18B]' : isNetflixRedTheme ? 'border-[#E50914]' : 'border-[#00A7F8]';

    // REMOVED: Full page loading spinner. Instead, we show a clean "not found" or "skeleton" shell if needed.
    if (!selectedEpisode) {
        return (
            <div className="min-h-screen bg-[var(--bg-body)] flex items-center justify-center text-white">
                <div className="text-center p-8 animate-fade-in-up">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CloseIcon className="w-10 h-10 text-gray-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">عفواً، هذه الحلقة غير متاحة حالياً.</h2>
                    <p className="text-gray-400 mb-8 max-w-sm mx-auto">قد يكون جارٍ رفع الحلقة أو تم حذفها مؤقتاً.</p>
                    <button onClick={handleBack} className="bg-white/10 px-8 py-3 rounded-full hover:bg-white/20 transition-all font-bold">الرجوع للمسلسل</button>
                </div>
            </div>
        );
    }

    const displayEpDesc = getEpisodeDescription(selectedEpisode.description, episodeNumber, seasonNumber);

    return (
        <div className="min-h-screen bg-[var(--bg-body)] text-white pb-20 animate-fade-in-up">
            <SEO 
                type="series"
                title={content.title} 
                description={selectedEpisode.description || content.description} 
                image={selectedEpisode.thumbnail || content.poster} 
                banner={content.backdrop}
                seasons={mappedSeasons}
                currentEpisode={mappedCurrentEpisode}
            />

            {/* Header (Back & Title) */}
            <div className="sticky top-0 z-50 bg-[var(--bg-body)]/95 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4 w-full">
                    <button 
                        onClick={handleBack}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors group flex-shrink-0"
                    >
                        <ChevronRightIcon className="w-5 h-5 transform rotate-180 group-hover:-translate-x-1 transition-transform text-white" />
                    </button>
                    <div className="flex flex-col min-w-0 items-start">
                        <h1 className="text-sm md:text-base font-bold text-gray-200 truncate">{content.title}</h1>
                        <span className={`text-[10px] md:text-xs font-bold ${accentColor}`}>
                            {content.type === 'movie' ? 'فيلم' : `الموسم ${seasonNumber} | الحلقة ${episodeNumber}`}
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-0 pt-6">
                
                {/* Controls Area (Servers Only) */}
                <div className="w-full mb-4">
                    <h3 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${bgAccent} animate-pulse`}></span>
                        سيرفرات المشاهدة
                    </h3>
                    <div className="flex items-center gap-1.5 overflow-x-auto rtl-scroll pb-2 no-scrollbar">
                        {activeServers.map((server) => (
                            <button
                                key={server.id}
                                onClick={() => setSelectedServer(server)}
                                className={`
                                    flex-shrink-0 px-5 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap border
                                    ${selectedServer?.id === server.id 
                                        ? `${bgAccent} text-black border-transparent shadow-[0_0_15px_rgba(0,0,0,0.3)] scale-105 z-10`
                                        : 'bg-gray-800/50 text-gray-300 border-gray-700 hover:border-gray-500 hover:bg-gray-800'
                                    }
                                `}
                            >
                                <PlayIcon className="w-3 h-3" />
                                {server.name}
                            </button>
                        ))}
                    </div>
                </div>

                <AdPlacement ads={ads} placement="watch-top" isEnabled={adsEnabled} />

                {/* Video Player Section */}
                <div className={`relative w-full aspect-video rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-black border ${selectedServer ? borderAccent : 'border-gray-800'} z-10 transition-colors duration-300`}>
                    {showPreroll && prerollAd ? (
                        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
                            <div className="absolute top-4 right-4 z-[60] bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3">
                                <span className="text-gray-300 text-xs">إعلان</span>
                                <div className="h-4 w-px bg-white/20"></div>
                                {prerollTimer > 0 ? (
                                    <span className="text-white font-bold text-sm">تخطي بعد {prerollTimer} ثانية</span>
                                ) : (
                                    <button onClick={() => setShowPreroll(false)} className={`font-bold text-sm flex items-center gap-1 transition-colors hover:text-white ${accentColor}`}>
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
                            season={seasonNumber}
                            episode={episodeNumber}
                            manualSrc={selectedServer?.url} 
                            poster={selectedEpisode.thumbnail || content.backdrop} 
                            ads={ads}
                            adsEnabled={adsEnabled}
                        />
                    )}
                </div>

                <div className="flex justify-end mt-2 px-1">
                     <button 
                        onClick={() => setIsReportModalOpen(true)}
                        className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>الإبلاغ عن مشكلة</span>
                    </button>
                </div>

                {/* Download Actions */}
                <div className="mt-6 mb-8 flex flex-col items-center gap-6">
                    {effectiveDownloadUrl && (
                        <button
                            onClick={handleDownloadClick}
                            className={`
                                relative overflow-hidden group w-full md:w-auto min-w-[300px]
                                bg-[#151922] border border-gray-700 hover:border-opacity-0
                                rounded-2xl p-2 transition-all duration-300 
                                shadow-lg hover:shadow-[0_0_30px_rgba(0,0,0,0.4)]
                                flex items-center justify-between pr-4 pl-2
                                hover:scale-105 target-download-btn
                            `}
                        >
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${bgAccent}`}></div>
                            <div className="flex flex-col text-right z-10">
                                <span className="font-bold text-white text-lg">تحميل الحلقة</span>
                                <span className={`text-[10px] ${accentColor} opacity-80`}>جودة عالية • رابط مباشر</span>
                            </div>
                            <div className={`p-3 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors z-10 border border-white/5`}>
                                <DownloadIcon className={`w-6 h-6 text-gray-300 group-hover:text-white transition-colors`} />
                            </div>
                        </button>
                    )}
                </div>

                <div className="w-full h-px bg-white/5 mb-6"></div>

                {/* Episode Details */}
                <div className="flex flex-col gap-4">
                    <div className="space-y-3">
                        <h2 className="text-2xl font-bold text-white leading-tight">
                            {selectedEpisode.title || `الحلقة ${episodeNumber}`}
                        </h2>
                        <p className="text-sm text-gray-400 max-w-3xl leading-loose">
                            {displayEpDesc}
                        </p>
                    </div>
                </div>

                <AdPlacement ads={ads} placement="watch-below-player" isEnabled={adsEnabled} />
            </div>

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
                    episode={`الموسم ${seasonNumber} - الحلقة ${episodeNumber}`}
                    isCosmicTealTheme={isCosmicTealTheme}
                    isNetflixRedTheme={isNetflixRedTheme}
                />
            )}
        </div>
    );
};

export default EpisodeWatchPage;