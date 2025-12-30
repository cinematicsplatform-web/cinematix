import React, { useMemo } from 'react';
import type { Content, View, Server } from '@/types';
import SEO from '../components/SEO';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { StarIcon } from '../components/icons/StarIcon';
import { ClockIcon } from '../components/icons/ClockIcon';

interface DownloadPageProps {
  content: Content;
  seasonNumber?: number;
  episodeNumber?: number;
  onSetView: (view: View) => void;
  isRamadanTheme?: boolean;
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
  isNetflixRedTheme?: boolean;
  returnView?: View;
}

const DownloadPage: React.FC<DownloadPageProps> = ({ 
  content, 
  seasonNumber, 
  episodeNumber, 
  onSetView, 
  isRamadanTheme, 
  isEidTheme, 
  isCosmicTealTheme, 
  isNetflixRedTheme,
  returnView 
}) => {
  const isEpisodic = content.type === 'series' || content.type === 'program';
  
  const currentSeason = useMemo(() => 
    isEpisodic ? content.seasons?.find(s => s.seasonNumber === seasonNumber) : null,
  [content.seasons, seasonNumber, isEpisodic]);

  const selectedEpisode = useMemo(() => {
    if (!currentSeason?.episodes || !episodeNumber) return null;
    return currentSeason.episodes[episodeNumber - 1] || null;
  }, [currentSeason, episodeNumber]);

  const downloadServers = useMemo(() => {
    const servers: Server[] = (isEpisodic ? selectedEpisode?.servers : content.servers) || [];
    return servers.filter(s => s.downloadUrl && s.downloadUrl.trim().length > 0);
  }, [content, selectedEpisode, isEpisodic]);

  const accentColor = isRamadanTheme ? 'text-amber-500' : isEidTheme ? 'text-purple-500' : isCosmicTealTheme ? 'text-[#35F18B]' : isNetflixRedTheme ? 'text-[#E50914]' : 'text-[#00A7F8]';
  const bgAccent = isRamadanTheme ? 'bg-amber-500' : isEidTheme ? 'bg-purple-500' : isCosmicTealTheme ? 'bg-[#35F18B]' : isNetflixRedTheme ? 'bg-[#E50914]' : 'bg-[#00A7F8]';
  const borderAccent = isRamadanTheme ? 'border-amber-500/50' : isEidTheme ? 'border-purple-500/50' : isCosmicTealTheme ? 'border-[#35F18B]/50' : isNetflixRedTheme ? 'border-[#E50914]/50' : 'border-[#00A7F8]/50';

  const displayTitle = isEpisodic && episodeNumber 
    ? `${content.title} - الموسم ${seasonNumber} - الحلقة ${episodeNumber}`
    : content.title;

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white font-['Cairo'] pb-20 animate-fade-in relative overflow-x-hidden" dir="rtl">
        <SEO 
            title={`تحميل ${displayTitle}`} 
            description={`صفحة تحميل ${displayTitle} بجودات متعددة وسيرفرات سريعة على سينماتيكس.`}
            noIndex={true}
        />

        {/* Cinematic Backdrop */}
        <div className="absolute top-0 left-0 w-full h-[85vh] z-0">
            <img 
                src={currentSeason?.backdrop || content.backdrop} 
                alt="" 
                className="w-full h-full object-cover opacity-20 blur-xl scale-110 md:object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-body)] via-transparent to-[var(--bg-body)]"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-8 md:pt-16">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <button 
                    onClick={() => onSetView('detail')}
                    className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                >
                    <ChevronRightIcon className="w-6 h-6 transform rotate-180 text-white group-hover:-translate-x-1 transition-transform" />
                </button>
                <h1 className="text-xl md:text-3xl font-black truncate max-w-[70%] text-center">{displayTitle}</h1>
                <div className="w-12"></div> {/* Spacer for symmetry */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                
                {/* Left: Poster & Info */}
                <div className="lg:col-span-4 flex flex-col items-center lg:items-start animate-fade-in-up">
                    <div className={`relative w-64 md:w-full aspect-[2/3] rounded-3xl overflow-hidden border-4 ${borderAccent} shadow-2xl mb-6`}>
                        <img 
                            src={currentSeason?.poster || content.poster} 
                            alt={content.title} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    
                    <div className="w-full space-y-4 text-center lg:text-right">
                        <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                            <div className="flex items-center gap-1 text-yellow-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                <StarIcon className="w-4 h-4" />
                                <span className="font-bold">{content.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-300 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                <ClockIcon className="w-4 h-4" />
                                <span dir="ltr">{selectedEpisode?.duration || content.duration || 'N/A'}</span>
                            </div>
                            <div className="text-white font-bold bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                {currentSeason?.releaseYear || content.releaseYear}
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed line-clamp-4">
                            {selectedEpisode?.description || content.description}
                        </p>
                    </div>
                </div>

                {/* Right: Download Servers */}
                <div className="lg:col-span-8 space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    
                    <div className="bg-[#1f2937]/40 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                        <div className="text-center mb-10">
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${bgAccent} text-black mb-6 shadow-xl`}>
                                <DownloadIcon className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl md:text-4xl font-black mb-2">اختر سيرفر التحميل</h2>
                            <p className="text-gray-400 font-bold">جميع الروابط مباشرة وسريعة تدعم الاستكمال</p>
                        </div>

                        {downloadServers.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {downloadServers.map((server, idx) => (
                                    <a 
                                        key={server.id}
                                        href={server.downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/30 transition-all transform active:scale-95 overflow-hidden"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 ${accentColor} group-hover:bg-white group-hover:text-black transition-colors`}>
                                                <DownloadIcon className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-lg text-white">{server.name || (idx + 1)}</span>
                                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Direct High Speed</span>
                                            </div>
                                        </div>
                                        <ChevronRightIcon className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                                        
                                        {/* Hover Glow Effect */}
                                        <div className={`absolute top-0 right-0 w-1 h-full ${bgAccent} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center flex flex-col items-center gap-4 border-2 border-dashed border-white/10 rounded-3xl">
                                <div className="text-4xl opacity-20">📥</div>
                                <p className="text-gray-500 font-bold">عذراً، روابط التحميل غير متوفرة حالياً لهذا العمل.</p>
                                <button 
                                    onClick={() => onSetView('home')}
                                    className={`px-8 py-2 rounded-xl font-bold ${accentColor} border ${borderAccent} hover:bg-white/5`}
                                >
                                    العودة للرئيسية
                                </button>
                            </div>
                        )}

                        <div className="mt-12 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-4">
                            <span className="text-xl">💡</span>
                            <div className="text-sm text-blue-300/80 leading-relaxed font-bold">
                                نصيحة: إذا واجهت مشكلة في أحد السيرفرات، يرجى تجربة سيرفر آخر. نوصي باستخدام متصفح Chrome أو تطبيق ADM لتحميل الملفات بأقصى سرعة.
                            </div>
                        </div>
                    </div>

                    {/* Safety Badge */}
                    <div className="flex justify-center items-center gap-6 opacity-40">
                         <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            <span className="text-xs font-black">روابط آمنة ومفحوصة</span>
                         </div>
                         <div className="w-px h-4 bg-gray-700"></div>
                         <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            <span className="text-xs font-black">سرعة تحميل قصوى</span>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DownloadPage;