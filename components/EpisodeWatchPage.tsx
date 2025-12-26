import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Content, Episode, Server, Ad, View, Person } from '@/types';
import { ContentType } from '@/types';
import VideoPlayer from './VideoPlayer';
import AdPlacement from './AdPlacement';
import { PlayIcon } from './icons/PlayIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { CloseIcon } from './icons/CloseIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import SEO from './SEO';
import AdWaiterModal from './AdWaiterModal';
import ReportModal from './ReportModal';
import { getPeople } from '@/firebase';
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
    const isLoaded = !!content && !!content.id;
    // البرامج والمسلسلات فقط هي من تملك نظام حلقات
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

    const canonicalUrl = isEpisodic ? `/${content.type}/${content?.slug || content?.id}` : `/watch/movie/${content?.slug || content?.id}`;

    const activeServers = useMemo(() => {
        const servers = selectedEpisode?.servers || [];
        return servers.filter(s => s.url && s.url.trim().length > 0);
    }, [selectedEpisode]);

    const [selectedServer, setSelectedServer] = useState<Server | null>(null);
    const [playerKey, setPlayerKey] = useState(0); // To force re-render on reload

    useEffect(() => {
        if (activeServers.length > 0) {
            const defaultServer = activeServers.find(s => s.isActive) || activeServers[0];
            setSelectedServer(defaultServer);
        }
    }, [activeServers]);

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const accentColor = isRamadanTheme ? 'text-[#FFD700]' : isEidTheme ? 'text-purple-500' : isCosmicTealTheme ? 'text-[#35F18B]' : isNetflixRedTheme ? 'text-[#E50914]' : 'text-[#00A7F8]';
    const bgAccent = isRamadanTheme ? 'bg-amber-500' : isEidTheme ? 'bg-purple-500' : isCosmicTealTheme ? 'bg-[#35F18B]' : isNetflixRedTheme ? 'bg-[#E50914]' : 'bg-[#00A7F8]';
    const borderAccent = isRamadanTheme ? 'border-amber-500/30' : isEidTheme ? 'border-purple-500/30' : isCosmicTealTheme ? 'border-[#35F18B]/30' : isNetflixRedTheme ? 'border-[#E50914]/30' : 'border-[#00A7F8]/30';

    const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

    const PersonCard: React.FC<{ name: string, label?: string }> = ({ name, label }) => {
        const personProfile = people.find(p => p.name === name);
        const arabic = isArabic(name);
        return (
          <div 
            key={name}
            onClick={() => onSetView('personProfile' as any, undefined, { name })}
            className="cursor-pointer group flex flex-col"
          >
            <div className="w-full aspect-square rounded-xl bg-[#1f2937]/80 border border-white/5 overflow-hidden mb-2 transition-all duration-300 group-hover:scale-105 group-hover:border-[var(--color-accent)] relative flex flex-col justify-end shadow-none">
              {personProfile?.image ? (
                <img 
                  src={personProfile.image} 
                  alt={name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-end justify-center">
                  <UserIcon className="w-full h-full text-gray-700/50" />
                </div>
              )}
              <div className={`relative z-10 pb-3 px-3 ${arabic ? 'text-right' : 'text-left'}`} dir={arabic ? 'rtl' : 'ltr'}>
                <span className="text-sm md:text-base font-bold text-white truncate block drop-shadow-[0_2px_6px_rgba(0,0,0,1)]">{name}</span>
              </div>
            </div>
            {label && (
              <span className="text-center text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest leading-none mt-1">{label}</span>
            )}
          </div>
        );
    };

    const PeopleGrid: React.FC<{ title: string, names: string[] }> = ({ title, names }) => {
        if (!names || names.length === 0) return null;
        return (
          <div className="mb-12">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="h-6 md:h-8 w-1.5 bg-[var(--color-accent)] rounded-full"></div>
              <span>{title}</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {names.map((name) => (
                <PersonCard key={name} name={name} />
              ))}
            </div>
          </div>
        );
      };

    const handleReload = () => {
        setPlayerKey(prev => prev + 1);
    };

    const handleDownload = () => {
        if (selectedServer?.downloadUrl) {
            window.open(selectedServer.downloadUrl, '_blank');
        } else {
            alert('رابط التحميل غير متوفر لهذا السيرفر حالياً.');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-body)] text-white pb-20 animate-fade-in-up">
            <SEO 
                type={isEpisodic ? "series" : "movie"} 
                title={content?.title} 
                seasonNumber={seasonNumber}
                episodeNumber={episodeNumber}
                description={selectedEpisode?.description || `مشاهدة الحلقة ${episodeNumber} من الموسم ${seasonNumber} لـ ${content?.title}`} 
                image={selectedEpisode?.thumbnail || content?.poster}
                url={canonicalUrl}
                noIndex={true} 
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
                            <div className="flex flex-col gap-1">
                                <div className="w-32 md:w-48 h-4 bg-gray-800/40 rounded skeleton-shimmer border border-white/5"></div>
                                <div className="w-20 md:w-32 h-3 bg-gray-800/40 rounded skeleton-shimmer border border-white/5"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-0 pt-6 text-center">
                
                {/* Server Selection Header - ENLARGED BUTTONS */}
                <div className="w-full mb-6">
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-3">
                        <span className="text-sm text-gray-400 font-black ml-2 whitespace-nowrap">سيرفر المشاهدة:</span>
                        {isLoaded && activeServers.length > 0 ? activeServers.map((server, idx) => (
                            <button key={server.id} onClick={() => setSelectedServer(server)} className={`flex-shrink-0 px-8 py-3 rounded-2xl font-black text-sm transition-all border ${selectedServer?.id === server.id ? `${bgAccent} text-black border-transparent shadow-[0_0_20px_var(--shadow-color)] scale-105` : 'bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-800 hover:border-gray-600 hover:border-gray-600'}`}>
                                سيرفر {idx + 1}
                            </button>
                        )) : (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-12 w-28 bg-gray-800/40 rounded-2xl skeleton-shimmer border border-white/5 flex-shrink-0"></div>
                            ))
                        )}
                    </div>
                </div>

                {/* Player Container */}
                <div className={`relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border ${isLoaded ? 'border-white/5' : 'border-gray-800'} z-10 mx-auto`}>
                    {isLoaded ? (
                        <VideoPlayer 
                            key={playerKey}
                            tmdbId={content.id} 
                            type={content.type} 
                            season={seasonNumber} 
                            episode={episodeNumber} 
                            manualSrc={selectedServer?.url} 
                            poster={selectedEpisode?.thumbnail || content.backdrop} 
                        />
                    ) : (
                        <div className="absolute inset-0 bg-[#0f1014] skeleton-shimmer flex items-center justify-center">
                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-30">
                                <PlayIcon className="w-10 h-10 md:w-16 md:h-16 text-white opacity-20" />
                            </div>
                        </div>
                    )}
                </div>

                {/* --- ACTIONS AREA: DOWNLOAD (CENTERED) & REPORT (LEFT) --- */}
                <div className="mt-5 relative flex flex-col items-center gap-2 animate-fade-in-up">
                    <div className="flex justify-center w-full">
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
                                ${isRamadanTheme 
                                    ? "bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]" 
                                    : isEidTheme 
                                        ? "bg-gradient-to-r from-purple-800 to-purple-500 text-white shadow-[0_0_15px_rgba(106,13,173,0.4)]" 
                                        : isCosmicTealTheme 
                                            ? "bg-gradient-to-r from-[#35F18B] to-[#2596be] text-black shadow-[0_0_15px_rgba(53,241,139,0.4)]" 
                                            : isNetflixRedTheme 
                                                ? "bg-[#E50914] text-white" 
                                                : "bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black shadow-[0_0_15px_var(--shadow-color)]"
                                }
                            `}
                        >
                            <DownloadIcon className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                            <span>تحميل الآن</span>
                        </button>
                    </div>

                    <div className="w-full flex justify-start">
                        <button 
                            onClick={() => setIsReportModalOpen(true)} 
                            className="px-4 py-1.5 rounded-lg text-red-500/60 hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all flex items-center justify-center shrink-0"
                            title="إبلاغ عن عطل"
                        >
                            <span className="text-xs font-bold">⚠️ إبلاغ عن عطل</span>
                        </button>
                    </div>
                </div>

                <div className="mt-8 flex flex-col gap-6 text-right">
                    {isLoaded ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <h2 className="text-2xl font-bold text-white">{selectedEpisode?.title || `الحلقة ${episodeNumber}`}</h2>
                            </div>
                            <p className="text-sm text-gray-400 max-w-3xl leading-loose">{selectedEpisode?.description || content.description}</p>
                            
                            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-xl max-w-4xl mt-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap divide-x divide-y md:divide-y-0 divide-white/10 rtl:divide-x-reverse">
                                    <div className="p-4 flex flex-col gap-1 flex-1 min-w-[120px]">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">سنة العرض</span>
                                        <span className="text-white font-black text-sm md:text-base">{currentSeason?.releaseYear || content.releaseYear}</span>
                                    </div>
                                    
                                    <div className="p-4 flex flex-col gap-1 flex-1 min-w-[120px]">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">مدة الحلقة</span>
                                        <span className="text-white font-black text-sm md:text-base" dir="ltr">{selectedEpisode?.duration || '45m+'}</span>
                                    </div>

                                    <div className="p-4 flex flex-col gap-1 flex-1 min-w-[120px]">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">التصنيف</span>
                                        <div className="w-fit border border-gray-600 rounded px-1.5 py-0.5 text-[10px] font-black text-gray-200">
                                            {content.ageRating}
                                        </div>
                                    </div>

                                    <div className="p-4 flex flex-col gap-1 flex-1 min-w-[120px]">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">الحلقة</span>
                                        <span className="text-white font-black text-sm md:text-base">{episodeNumber}</span>
                                    </div>

                                    <div className="p-4 flex flex-col gap-1 flex-1 min-w-[120px]">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">التقييم</span>
                                        <div className="flex items-center gap-1.5 text-yellow-500">
                                            <StarIcon className="w-3 h-3" />
                                            <span className="font-black text-sm md:text-base">{content.rating.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="w-64 h-8 bg-gray-800/40 rounded skeleton-shimmer border border-white/5"></div>
                            <div className="space-y-2">
                                <div className="w-full h-4 bg-gray-800/40 rounded skeleton-shimmer border border-white/5"></div>
                                <div className="w-full h-4 bg-gray-800/40 rounded skeleton-shimmer border border-white/5"></div>
                                <div className="w-2/3 h-4 bg-gray-800/40 rounded skeleton-shimmer border border-white/5"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4 md:px-8 py-12 mt-12 border-t border-white/5 bg-black/20">
                <div className="max-w-7xl mx-auto w-full">
                    {content.cast && content.cast.length > 0 && <PeopleGrid title="طاقم التمثيل" names={content.cast} />}
                    
                    {(content.director || content.writer) && (
                      <div className="mb-12">
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-3">
                          <div className="h-6 md:h-8 w-1.5 bg-[var(--color-accent)] rounded-full"></div>
                          <span>صنّاع العمل</span>
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                           {content.director && <PersonCard name={content.director} label="إخراج" />}
                           {content.writer && <PersonCard name={content.writer} label="تأليف" />}
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