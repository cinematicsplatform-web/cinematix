
import React, { useState, useEffect, useMemo } from 'react';
import type { Content, Server, Season, Episode, Category, Genre } from '../types';
import { ContentType, categories, genres } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { PlusIcon } from './icons/PlusIcon';
import ToggleSwitch from './ToggleSwitch';
import { generateSlug } from '../firebase';
import DeleteConfirmationModal from './DeleteConfirmationModal';

// --- ICONS ---
const ShieldCheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
);
const AdultIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
);
const FaceSmileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75z" /></svg>
);
const CheckSmallIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" /></svg>
);
const CloudArrowDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
);
const ArrowPathIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

// --- STYLES ---
const MODAL_BG = "bg-gray-800"; 
const INPUT_BG = "bg-gray-900"; 
const BORDER_COLOR = "border-gray-600";
const FOCUS_RING = "focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]";

const inputClass = `w-full ${INPUT_BG} border ${BORDER_COLOR} rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none ${FOCUS_RING} transition-all duration-300`;
const labelClass = "block text-sm font-bold text-gray-400 mb-2";
const sectionBoxClass = "bg-[#1a2230] p-6 rounded-2xl border border-gray-700/50 shadow-lg";

// --- NESTED MODAL (Server Management) ---
interface ServerManagementModalProps {
    episode: Episode;
    onClose: () => void;
    onSave: (servers: Server[]) => void;
}

const ServerManagementModal: React.FC<ServerManagementModalProps> = ({ episode, onClose, onSave }) => {
    const [servers, setServers] = useState<Server[]>(() => {
        const existing = [...(episode.servers || [])];
        while (existing.length < 4) {
            existing.push({ id: Date.now() + existing.length, name: `سيرفر ${existing.length + 1}`, url: '', downloadUrl: '', isActive: false });
        }
        return existing;
    });

    const handleServerChange = (index: number, field: keyof Server, value: string | boolean) => {
        const updatedServers = [...servers];
        updatedServers[index] = { ...updatedServers[index], [field]: value };
        setServers(updatedServers);
    };

    const handleSaveServers = () => {
        const serversToSave = servers.filter(s => s.url && s.url.trim() !== '');
        onSave(serversToSave);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[105] flex items-center justify-center p-4" onClick={onClose}>
            <div className={`${MODAL_BG} border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl text-white animate-fade-in-up overflow-hidden`} onClick={e => e.stopPropagation()}>
                <div className="bg-black/20 p-6 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-[var(--color-accent)]">إدارة السيرفرات: {episode.title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon /></button>
                </div>
                
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {servers.slice(0, 4).map((server, index) => (
                         <div key={index} className={`p-4 ${INPUT_BG} border border-gray-700 rounded-xl space-y-3`}>
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                              <div className="flex items-center gap-3 w-full sm:w-auto">
                                  <span className="text-gray-500 text-xs font-mono w-6 text-center">{index + 1}</span>
                                  <input 
                                    value={server.name} 
                                    onChange={(e) => handleServerChange(index, 'name', e.target.value)} 
                                    placeholder="اسم السيرفر" 
                                    className={`bg-gray-800 border border-gray-600 text-white text-sm px-3 py-2 rounded-lg focus:outline-none ${FOCUS_RING} w-full sm:w-48`}
                                  />
                              </div>
                              <label className="flex items-center gap-2 cursor-pointer text-sm bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-600 hover:border-[var(--color-accent)] transition-colors">
                                <input type="checkbox" checked={server.isActive} onChange={(e) => handleServerChange(index, 'isActive', e.target.checked)} className="accent-[var(--color-accent)] w-4 h-4"/> 
                                <span className={server.isActive ? "text-[var(--color-accent)] font-bold" : "text-gray-400"}>نشط</span>
                              </label>
                            </div>
                            <input 
                                value={server.url} 
                                onChange={(e) => handleServerChange(index, 'url', e.target.value)} 
                                placeholder="رابط المشاهدة (mp4, m3u8, embed...)" 
                                className={`w-full bg-gray-800 border border-gray-600 text-white text-sm px-3 py-2 rounded-lg focus:outline-none ${FOCUS_RING} dir-ltr placeholder:text-right`}
                            />
                        </div>
                    ))}
                     <div className={`p-4 ${INPUT_BG} border border-gray-700 rounded-xl space-y-2`}>
                        <label className="text-xs font-bold text-gray-400">رابط التحميل المباشر</label>
                        <input 
                            value={servers[0]?.downloadUrl || ''} 
                            onChange={(e) => handleServerChange(0, 'downloadUrl', e.target.value)} 
                            placeholder="رابط التحميل" 
                            className={`w-full bg-gray-800 border border-gray-600 text-white text-sm px-3 py-2 rounded-lg focus:outline-none ${FOCUS_RING} dir-ltr placeholder:text-right`}
                        />
                     </div>
                </div>
                <div className="p-6 border-t border-gray-700 bg-black/20 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-full transition-colors">إلغاء</button>
                    <button type="button" onClick={handleSaveServers} className="bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black font-bold py-2 px-8 rounded-full shadow-[0_0_15px_var(--shadow-color)] hover:shadow-[0_0_25px_var(--shadow-color)] hover:scale-105 transition-all">حفظ</button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN CONTENT EDIT MODAL ---
interface ContentEditModalProps {
    content: Content | null;
    onClose: () => void;
    onSave: (content: Content) => void;
}

const ContentEditModal: React.FC<ContentEditModalProps> = ({ content, onClose, onSave }) => {
    const isNewContent = content === null;

    const getDefaultFormData = (): Content => ({
        id: '', title: '', description: '', type: ContentType.Movie, poster: '', backdrop: '',
        rating: 0, ageRating: '', categories: [], genres: [], releaseYear: new Date().getFullYear(), cast: [],
        visibility: 'general', seasons: [], servers: [], bannerNote: '', createdAt: '',
        logoUrl: '', isLogoEnabled: false, duration: '', enableMobileCrop: false, mobileCropPosition: 50,
        slug: '',
        ...content,
    });

    const [formData, setFormData] = useState<Content>(getDefaultFormData());
    const [editingServersForEpisode, setEditingServersForEpisode] = useState<Episode | null>(null);
    const [isManagingMovieServers, setIsManagingMovieServers] = useState<boolean>(false);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!content?.slug);
    const [newActor, setNewActor] = useState('');
    const [seasonCastInputs, setSeasonCastInputs] = useState<Record<number, string>>({});
    
    const [deleteSeasonState, setDeleteSeasonState] = useState<{
        isOpen: boolean;
        seasonId: number | null;
        title: string;
    }>({ isOpen: false, seasonId: null, title: '' });

    // --- TMDB STATE ---
    const [tmdbIdInput, setTmdbIdInput] = useState(content?.id && !isNaN(Number(content.id)) ? content.id : '');
    const [fetchLoading, setFetchLoading] = useState(false);
    const [refreshLoading, setRefreshLoading] = useState(false);
    const [enableAutoLinks, setEnableAutoLinks] = useState(false); // New Toggle State
    const API_KEY = 'b8d66e320b334f4d56728d98a7e39697';

    useEffect(() => {
        setFormData(getDefaultFormData());
        setSlugManuallyEdited(!!content?.slug);
        setNewActor('');
        setSeasonCastInputs({});
        setTmdbIdInput(content?.id && !isNaN(Number(content.id)) ? content.id : '');
    }, [content]);

    useEffect(() => {
        if (!slugManuallyEdited && formData.title) {
            setFormData(prev => ({ ...prev, slug: generateSlug(prev.title) }));
        }
    }, [formData.title, slugManuallyEdited]);

    // --- Helper for Generating Links ---
    const generateEpisodeServers = (tmdbId: string, seasonNum: number, episodeNum: number) => {
         const epServers: Server[] = [];
         // FORMULA FOR SERIES: https://dl.vidsrc.vip/tv/{id}/{season}/{episode}
         const autoDownloadUrl = `https://dl.vidsrc.vip/tv/${tmdbId}/${seasonNum}/${episodeNum}`;

         if (enableAutoLinks) {
             // Priority 1: Cinematix VIP
             epServers.push({
                 id: 80000 + episodeNum,
                 name: 'Cinematix VIP (سريع)',
                 url: `https://vidsrc.vip/embed/tv/${tmdbId}/${seasonNum}/${episodeNum}`,
                 downloadUrl: autoDownloadUrl,
                 isActive: true
             });
             // Priority 2: VidSrc
             epServers.push({
                 id: 90000 + episodeNum,
                 name: 'سيرفر VidSrc',
                 url: `https://vidsrc.to/embed/tv/${tmdbId}/${seasonNum}/${episodeNum}`,
                 downloadUrl: autoDownloadUrl,
                 isActive: true
             });
             // Priority 3: SuperEmbed
             epServers.push({
                 id: 90000 + episodeNum + 1000, 
                 name: 'سيرفر SuperEmbed',
                 url: `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1&s=${seasonNum}&e=${episodeNum}`,
                 downloadUrl: autoDownloadUrl,
                 isActive: true
             });
         }
         return epServers;
    }

    // --- SMART REFRESH LOGIC ---
    const handleRefreshData = async () => {
        if (!tmdbIdInput) return;
        if (formData.type !== ContentType.Series) return; // Only for Series for now

        setRefreshLoading(true);
        const language = 'ar-SA';

        try {
            // 1. Fetch TV Details
            const detailsRes = await fetch(`https://api.themoviedb.org/3/tv/${tmdbIdInput}?api_key=${API_KEY}&language=${language}`);
            if (!detailsRes.ok) throw new Error('فشل الاتصال بـ TMDB. تأكد من الـ ID');
            const details = await detailsRes.json();

            // 2. Fetch Seasons
            let newSeasonsFromApi: Season[] = [];
            if (details.seasons) {
                const seasonPromises = details.seasons.map(async (s: any) => {
                    try {
                        const seasonDetailRes = await fetch(`https://api.themoviedb.org/3/tv/${tmdbIdInput}/season/${s.season_number}?api_key=${API_KEY}&language=${language}`);
                        const seasonData = await seasonDetailRes.json();
                        
                        const episodeCount = seasonData.episodes?.length || s.episode_count || 0;
                        const episodes: Episode[] = [];

                        for (let i = 1; i <= episodeCount; i++) {
                            const epId = Date.now() + Math.floor(Math.random() * 1000000) + i;
                            episodes.push({
                                id: epId,
                                title: `الحلقة ${i}`,
                                thumbnail: '', 
                                duration: 0,
                                progress: 0,
                                servers: generateEpisodeServers(tmdbIdInput, s.season_number, i) // Apply auto links logic to FRESH episodes
                            });
                        }

                        return {
                            id: s.id, // TMDB ID
                            seasonNumber: s.season_number,
                            title: s.name,
                            description: s.overview || '',
                            releaseYear: seasonData.air_date ? new Date(seasonData.air_date).getFullYear() : undefined,
                            poster: s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : '',
                            episodes: episodes
                        } as Season;
                    } catch (e) { return null; }
                });
                const results = await Promise.all(seasonPromises);
                newSeasonsFromApi = results.filter(Boolean).sort((a, b) => a.seasonNumber - b.seasonNumber) as Season[];
            }

            // 3. SMART MERGE STRATEGY
            const currentSeasons = formData.seasons || [];
            
            const mergedSeasons = newSeasonsFromApi.map(newS => {
                // Find matching existing season (by number)
                const existingS = currentSeasons.find(s => s.seasonNumber === newS.seasonNumber);
                
                if (!existingS) {
                    // It's a completely new season! Add it whole.
                    return { ...newS, id: Date.now() + Math.random() }; // Ensure unique ID for app logic
                }

                // It's an existing season, let's check for new episodes
                const mergedEpisodes = newS.episodes.map(newEp => {
                    // Parse episode number from title (Standard: "الحلقة X")
                    const newEpNum = parseInt(newEp.title?.replace('الحلقة ', '') || '0');
                    
                    // Try to find this episode in the existing data
                    const existingEp = existingS.episodes.find(e => {
                        const oldEpNum = parseInt(e.title?.replace('الحلقة ', '') || '0');
                        return oldEpNum === newEpNum;
                    });

                    if (existingEp) {
                        // EPISODE EXISTS: Keep the OLD one to preserve Manual Links!
                        return existingEp; 
                    } else {
                        // NEW EPISODE FOUND: Return the new one (which has auto-links if enabled)
                        return newEp;
                    }
                });
                
                // Return merged season: New Metadata + Merged Episodes
                return {
                    ...existingS, // Keep internal ID
                    title: newS.title, // Update Metadata
                    poster: newS.poster, // Update Poster
                    releaseYear: newS.releaseYear, // Update Year
                    episodes: mergedEpisodes
                };
            });

            setFormData(prev => ({ ...prev, seasons: mergedSeasons }));
            alert(`تم تحديث البيانات بنجاح! تم فحص ${newSeasonsFromApi.length} موسم.`);

        } catch (e: any) {
            console.error(e);
            alert('حدث خطأ أثناء التحديث: ' + e.message);
        } finally {
            setRefreshLoading(false);
        }
    };

    // --- TMDB Logic (Original Fetch) ---
    const fetchFromTMDB = async () => {
        if (!tmdbIdInput) return;
        setFetchLoading(true);

        // Use local variable for current type logic to handle smart switching
        let currentType = formData.type;
        const language = 'ar-SA'; 

        try {
            // Helper to construct URL
            const getUrl = (type: ContentType) => {
                const typePath = type === ContentType.Movie ? 'movie' : 'tv';
                const append = type === ContentType.Movie 
                    ? 'credits,release_dates' 
                    : 'content_ratings,credits';
                return `https://api.themoviedb.org/3/${typePath}/${tmdbIdInput}?api_key=${API_KEY}&language=${language}&append_to_response=${append}`;
            };

            // 1. Attempt fetch with currently selected type
            let res = await fetch(getUrl(currentType));

            // 2. Smart Retry: If 404 (Not Found), switch type and try again
            if (!res.ok && res.status === 404) {
                const altType = currentType === ContentType.Movie ? ContentType.Series : ContentType.Movie;
                console.log(`TMDB: ID not found as ${currentType}, retrying as ${altType}...`);
                
                const resAlt = await fetch(getUrl(altType));
                
                if (resAlt.ok) {
                    res = resAlt;
                    currentType = altType; // Switch type for subsequent logic
                }
            }

            if (!res.ok) throw new Error('لم يتم العثور على محتوى بهذا الـ ID. تأكد من صحة الرقم.');
            
            const details = await res.json();

            // --- MAPPING LOGIC ---

            // 1. Basic Info
            const title = details.title || details.name || '';
            const description = details.overview || ''; 
            const poster = details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '';
            const backdrop = details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : '';
            const rating = details.vote_average ? Number((details.vote_average / 2).toFixed(1)) : 0;
            const releaseDate = details.release_date || details.first_air_date || '';
            const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();
            
            // 4. Runtime / Duration
            let duration = '';
            if (currentType === ContentType.Movie && details.runtime) {
                const h = Math.floor(details.runtime / 60);
                const m = details.runtime % 60;
                duration = `${h}h ${m}m`;
            }

            // 5. Age Rating
            let ageRating = '';
            if (currentType === ContentType.Movie) {
                const usRelease = details.release_dates?.results?.find((r: any) => r.iso_3166_1 === 'US');
                if (usRelease?.release_dates) {
                    const cert = usRelease.release_dates.find((d: any) => d.certification !== '')?.certification;
                    ageRating = cert || '';
                }
            } else {
                const usRating = details.content_ratings?.results?.find((r: any) => r.iso_3166_1 === 'US');
                ageRating = usRating?.rating || '';
            }

            // 6. Genres
            const mappedGenres: Genre[] = [];
            details.genres?.forEach((g: any) => {
                const gName = g.name.toLowerCase();
                if (gName.includes('action') || gName.includes('أكشن') || gName.includes('حركة')) mappedGenres.push('أكشن');
                else if (gName.includes('adventure') || gName.includes('مغامرة')) mappedGenres.push('مغامرة');
                else if (gName.includes('animation') || gName.includes('رسوم متحركة')) mappedGenres.push('أطفال');
                else if (gName.includes('comedy') || gName.includes('كوميديا')) mappedGenres.push('كوميديا');
                else if (gName.includes('crime') || gName.includes('جريمة')) mappedGenres.push('جريمة');
                else if (gName.includes('documentary') || gName.includes('وثائقي')) mappedGenres.push('وثائقي');
                else if (gName.includes('drama') || gName.includes('دراما')) mappedGenres.push('دراما');
                else if (gName.includes('family') || gName.includes('عائلي')) mappedGenres.push('عائلي');
                else if (gName.includes('fantasy') || gName.includes('فانتازيا') || gName.includes('خيال')) mappedGenres.push('فانتازيا');
                else if (gName.includes('history') || gName.includes('تاريخ')) mappedGenres.push('تاريخي');
                else if (gName.includes('horror') || gName.includes('رعب')) mappedGenres.push('رعب');
                else if (gName.includes('romance') || gName.includes('رومانسي')) mappedGenres.push('رومانسي');
                else if (gName.includes('science fiction') || gName.includes('خيال علمي')) mappedGenres.push('خيال علمي');
                else if (gName.includes('thriller') || gName.includes('إثارة')) mappedGenres.push('إثارة');
                else if (gName.includes('war') || gName.includes('حرب')) mappedGenres.push('حربي');
            });

            // 7. Main Cast
            const topCast = details.credits?.cast?.slice(0, 7).map((c: any) => c.name) || [];

            // --- 8. SERIES SPECIFIC LOGIC (Advanced) & Auto Link Gen ---
            let newSeasons: Season[] = [];
            let movieServers: Server[] = [];

            // A. MOVIE AUTO SERVERS
            if (currentType === ContentType.Movie && enableAutoLinks) {
                // FORMULA FOR MOVIES: https://dl.vidsrc.vip/movie/{id}
                const autoDownloadUrl = `https://dl.vidsrc.vip/movie/${tmdbIdInput}`;

                // Priority 1: Cinematix VIP
                movieServers.push({
                    id: 9900,
                    name: 'Cinematix VIP (سريع)',
                    url: `https://vidsrc.vip/embed/movie/${tmdbIdInput}`,
                    downloadUrl: autoDownloadUrl,
                    isActive: true
                });
                // Priority 2: VidSrc.to
                movieServers.push({
                    id: 9901,
                    name: 'سيرفر VidSrc',
                    url: `https://vidsrc.to/embed/movie/${tmdbIdInput}`,
                    downloadUrl: autoDownloadUrl,
                    isActive: true
                });
                // Priority 3: SuperEmbed
                movieServers.push({
                    id: 9902,
                    name: 'سيرفر SuperEmbed',
                    url: `https://multiembed.mov/directstream.php?video_id=${tmdbIdInput}&tmdb=1`,
                    downloadUrl: autoDownloadUrl,
                    isActive: true
                });
            } else if (currentType === ContentType.Movie) {
                movieServers = formData.servers || [];
            }

            // B. SERIES LOGIC
            if (currentType === ContentType.Series && details.seasons) {
                const seasonPromises = details.seasons.map(async (s: any, index: number) => {
                    try {
                        const seasonDetailRes = await fetch(`https://api.themoviedb.org/3/tv/${tmdbIdInput}/season/${s.season_number}?api_key=${API_KEY}&append_to_response=credits&language=${language}`);
                        const seasonData = await seasonDetailRes.json();
                        
                        const seasonYear = seasonData.air_date ? new Date(seasonData.air_date).getFullYear() : undefined;
                        const seasonCast = seasonData.credits?.cast?.slice(0, 5).map((c: any) => c.name) || [];
                        
                        const episodes: Episode[] = [];
                        const episodeCount = seasonData.episodes?.length || s.episode_count || 0;
                        
                        for (let i = 1; i <= episodeCount; i++) {
                            const epId = Date.now() + Math.floor(Math.random() * 1000000) + i;
                            
                            // Use helper to generate links
                            const epServers = generateEpisodeServers(String(tmdbIdInput), s.season_number, i);

                            episodes.push({
                                id: epId,
                                title: `الحلقة ${i}`,
                                thumbnail: '', 
                                duration: 0,
                                progress: 0,
                                servers: epServers
                            });
                        }

                        return {
                            id: s.id,
                            seasonNumber: s.season_number,
                            title: s.name,
                            description: s.overview || '', 
                            releaseYear: seasonYear,
                            poster: s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : '',
                            backdrop: '',
                            cast: seasonCast,
                            episodes: episodes
                        } as Season;

                    } catch (e) {
                        console.error(`Failed to fetch details for season ${s.season_number}`, e);
                        return {
                            id: s.id,
                            seasonNumber: s.season_number,
                            title: s.name,
                            episodes: []
                        } as Season;
                    }
                });

                const results = await Promise.all(seasonPromises);
                newSeasons = results.filter(Boolean).sort((a, b) => a.seasonNumber - b.seasonNumber);
            }

            // Update State
            setFormData(prev => ({
                ...prev,
                id: String(tmdbIdInput),
                title,
                description,
                poster,
                backdrop,
                rating,
                releaseYear,
                ageRating,
                type: currentType, 
                genres: [...new Set([...prev.genres, ...mappedGenres])],
                cast: topCast,
                duration: duration || prev.duration,
                seasons: currentType === ContentType.Series ? newSeasons : prev.seasons,
                servers: movieServers
            }));

            // Auto-set category
            if (details.origin_country?.includes('TR')) {
                handleCategoryChange(currentType === ContentType.Movie ? 'افلام تركية' : 'مسلسلات تركية');
            } else if (details.origin_country?.includes('EG') || details.origin_country?.includes('SA') || details.original_language === 'ar') {
                handleCategoryChange(currentType === ContentType.Movie ? 'افلام عربية' : 'مسلسلات عربية');
            } else if (details.origin_country?.includes('IN')) {
                handleCategoryChange('افلام هندية');
            }

        } catch (e: any) {
            console.error(e);
            alert(e.message || 'فشل جلب البيانات. تأكد من صحة الـ ID ونوع المحتوى (فيلم/مسلسل).');
        } finally {
            setFetchLoading(false);
        }
    };

    const filteredCategories = useMemo(() => {
        const commonCats: Category[] = ['قريباً'];
        if (formData.type === ContentType.Movie) {
            const movieCats: Category[] = ['افلام عربية', 'افلام تركية', 'افلام اجنبية', 'افلام هندية', 'افلام أنميشن', 'افلام العيد'];
            return [...movieCats, ...commonCats];
        } else {
            const seriesCats: Category[] = ['مسلسلات عربية', 'مسلسلات تركية', 'مسلسلات اجنبية', 'برامج تلفزيونية', 'رمضان', 'برامج رمضان', 'حصرياً لرمضان', 'مسلسلات رمضان'];
            return [...seriesCats, ...commonCats];
        }
    }, [formData.type]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const inputElement = e.target as HTMLInputElement;
    
        if (inputElement.type === 'number') {
            const numericValue = value === '' ? 0 : parseFloat(value);
            setFormData(prev => ({ ...prev, [name]: isNaN(numericValue) ? 0 : numericValue }));
            return;
        }
    
        if (name === 'type' && value === ContentType.Series && (!formData.seasons || formData.seasons.length === 0)) {
            setFormData(prev => ({...prev, type: ContentType.Series, seasons: [{ id: Date.now(), seasonNumber: 1, title: 'الموسم 1', episodes: []}]}));
            return;
        }
        
        if (name === 'slug') {
            setSlugManuallyEdited(true);
        }

        setFormData(prev => ({ ...prev, [name]: value } as Content));
    };
    
    const handleCategoryChange = (category: Category) => {
        setFormData(prev => {
            const currentCats = prev.categories || [];
            const newCats = currentCats.includes(category)
                ? currentCats.filter(c => c !== category)
                : [...currentCats, category];
            return { ...prev, categories: newCats };
        });
    };
    
    const handleGenreChange = (genre: Genre) => {
        setFormData(prev => {
            const currentGenres = prev.genres || [];
            const newGenres = currentGenres.includes(genre)
                ? currentGenres.filter(g => g !== genre)
                : [...currentGenres, genre];
            return { ...prev, genres: newGenres };
        });
    };

    const handleAddActor = () => {
        if (newActor.trim()) {
            setFormData(prev => ({
                ...prev,
                cast: [...(prev.cast || []), newActor.trim()]
            }));
            setNewActor('');
        }
    };

    const handleRemoveActor = (index: number) => {
        setFormData(prev => ({
            ...prev,
            cast: (prev.cast || []).filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) { alert('الرجاء تعبئة حقول العنوان.'); return; }
        if (formData.categories.length === 0) { alert('الرجاء اختيار تصنيف واحد على الأقل.'); return; }
        
        const finalSlug = formData.slug?.trim() || generateSlug(formData.title);

        const contentToSave: Content = { 
            ...formData, 
            slug: finalSlug,
            id: formData.id || String(Date.now()),
            createdAt: formData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        onSave(contentToSave);
    };

    // --- Helper Functions for Nested Data ---
    const handleAddSeason = () => {
        const newSeasonNumber = (formData.seasons?.length || 0) + 1;
        setFormData(prev => ({
            ...prev,
            seasons: [...(prev.seasons || []), { id: Date.now(), seasonNumber: newSeasonNumber, title: `الموسم ${newSeasonNumber}`, episodes: [] }]
        }));
    };

    const requestDeleteSeason = (seasonId: number, seasonTitle: string) => {
        setDeleteSeasonState({
            isOpen: true,
            seasonId,
            title: seasonTitle
        });
    };

    const executeDeleteSeason = () => {
        if (deleteSeasonState.seasonId) {
            setFormData(prev => ({ ...prev, seasons: (prev.seasons || []).filter(s => s.id !== deleteSeasonState.seasonId) }));
        }
        setDeleteSeasonState(prev => ({ ...prev, isOpen: false }));
    };

    const handleUpdateSeason = (seasonId: number, field: keyof Season, value: any) => {
        setFormData(prev => ({
            ...prev,
            seasons: (prev.seasons || []).map(s => s.id === seasonId ? { ...s, [field]: value } : s)
        }));
    };

    const handleAddSeasonCast = (seasonId: number) => {
        const actorName = seasonCastInputs[seasonId]?.trim();
        if (!actorName) return;

        setFormData(prev => ({
            ...prev,
            seasons: (prev.seasons || []).map(s => {
                if (s.id === seasonId) {
                    return { ...s, cast: [...(s.cast || []), actorName] };
                }
                return s;
            })
        }));
        setSeasonCastInputs(prev => ({...prev, [seasonId]: ''}));
    };

    const handleRemoveSeasonCast = (seasonId: number, actorIndex: number) => {
        setFormData(prev => ({
            ...prev,
            seasons: (prev.seasons || []).map(s => {
                if (s.id === seasonId) {
                    return { ...s, cast: (s.cast || []).filter((_, i) => i !== actorIndex) };
                }
                return s;
            })
        }));
    };
    
    const handleAddEpisode = (seasonId: number) => {
        setFormData(prev => {
            const seasons = [...(prev.seasons || [])];
            const seasonIndex = seasons.findIndex(s => s.id === seasonId);
            if (seasonIndex > -1) {
                const newEpNum = (seasons[seasonIndex].episodes.length || 0) + 1;
                seasons[seasonIndex].episodes.push({
                    id: Date.now(),
                    title: `الحلقة ${newEpNum}`,
                    thumbnail: '',
                    duration: 45,
                    progress: 0,
                    servers: []
                });
            }
            return { ...prev, seasons };
        });
    };
    
    const handleDeleteEpisode = (seasonId: number, episodeId: number) => {
        setFormData(prev => {
            const seasons = [...(prev.seasons || [])];
            const seasonIndex = seasons.findIndex(s => s.id === seasonId);
            if (seasonIndex > -1) {
                seasons[seasonIndex].episodes = seasons[seasonIndex].episodes.filter(e => e.id !== episodeId);
            }
            return { ...prev, seasons };
        });
    };

    const handleUpdateEpisodeTitle = (seasonId: number, episodeId: number, newTitle: string) => {
        setFormData(prev => {
            const seasons = [...(prev.seasons || [])];
            const seasonIndex = seasons.findIndex(s => s.id === seasonId);
            if (seasonIndex > -1) {
                const epIndex = seasons[seasonIndex].episodes.findIndex(e => e.id === episodeId);
                if(epIndex > -1) seasons[seasonIndex].episodes[epIndex].title = newTitle;
            }
            return { ...prev, seasons };
        });
    };

    const handleUpdateEpisodeServers = (servers: Server[]) => {
        if (!editingServersForEpisode) return;
        setFormData(prev => {
            const seasons = [...(prev.seasons || [])];
            for (let s of seasons) {
                const epIndex = s.episodes.findIndex(e => e.id === editingServersForEpisode.id);
                if (epIndex > -1) {
                    s.episodes[epIndex].servers = servers;
                    break;
                }
            }
            return { ...prev, seasons };
        });
    };
    
    const handleUpdateMovieServers = (servers: Server[]) => {
        setFormData(prev => ({ ...prev, servers }));
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-[6px] z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className={`${MODAL_BG} rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] w-full max-w-5xl text-white border border-gray-700 flex flex-col max-h-[95vh]`} onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-700 flex justify-between items-center bg-black/20 rounded-t-2xl backdrop-blur-md">
                    <h2 className="text-3xl font-bold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                         {isNewContent ? <PlusIcon className="w-8 h-8 text-[var(--color-primary-to)]"/> : <span className="text-[var(--color-accent)]">✎</span>}
                         {isNewContent ? 'إضافة محتوى جديد' : 'تعديل المحتوى'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"><CloseIcon /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                    {/* 🚀 TMDB Smart Fetch Section */}
                    <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
                        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-bold text-blue-300 mb-1">جلب تلقائي (TMDB)</label>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex gap-2 flex-1">
                                        <input 
                                            type="text" 
                                            value={tmdbIdInput}
                                            onChange={(e) => setTmdbIdInput(e.target.value)}
                                            placeholder="أدخل TMDB ID (مثال: 12345)" 
                                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                        />
                                        
                                        {/* Normal Fetch Button */}
                                        <button 
                                            type="button"
                                            onClick={fetchFromTMDB}
                                            disabled={fetchLoading}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                                        >
                                            {fetchLoading ? 'جاري الجلب...' : (
                                                <>
                                                    <CloudArrowDownIcon />
                                                    جلب البيانات
                                                </>
                                            )}
                                        </button>

                                        {/* Smart Refresh Button (Series Only) */}
                                        {formData.type === ContentType.Series && (
                                            <button 
                                                type="button"
                                                onClick={handleRefreshData}
                                                disabled={refreshLoading}
                                                className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shadow-lg shadow-amber-900/20"
                                                title="تحديث المواسم والحلقات الجديدة فقط مع الحفاظ على الروابط القديمة"
                                            >
                                                {refreshLoading ? 'جاري التحديث...' : (
                                                    <>
                                                        <ArrowPathIcon />
                                                        تحديث البيانات
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* AUTO LINKS TOGGLE */}
                                    <div className="flex items-center gap-2 bg-blue-800/30 px-3 py-2 rounded-lg border border-blue-500/30">
                                        <ToggleSwitch 
                                            checked={enableAutoLinks} 
                                            onChange={setEnableAutoLinks} 
                                            className="scale-75"
                                        />
                                        <span className="text-xs text-gray-300 font-bold whitespace-nowrap select-none">توليد روابط تلقائية</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-gray-400 hidden md:block max-w-xs">
                                سيقوم هذا الخيار بملء الحقول أدناه تلقائياً. فعل خيار "توليد روابط" لإضافة سيرفرات مشاهدة VidSrc مباشرة.
                                <br/>
                                <span className="text-amber-400 mt-1 block">زر "تحديث البيانات" يضيف الحلقات الجديدة فقط ولا يحذف الروابط القديمة.</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        
                        {/* 1. Main Info Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Col: Main Inputs */}
                            <div className="lg:col-span-2 space-y-6">
                                <div>
                                    <label className={labelClass}>عنوان العمل</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClass} placeholder="أدخل العنوان هنا..." required />
                                </div>
                                
                                <div>
                                    <label className={labelClass}>الرابط (Slug)</label>
                                    <div className={`flex items-center ${INPUT_BG} border ${BORDER_COLOR} rounded-xl px-3 ${FOCUS_RING} transition-colors`}>
                                        <span className="text-gray-500 text-xs whitespace-nowrap dir-ltr select-none">cinematix.app/{formData.type === ContentType.Series ? 'series/' : 'movie/'}</span>
                                        <input 
                                            type="text" 
                                            name="slug" 
                                            value={formData.slug || ''} 
                                            onChange={handleChange} 
                                            placeholder="auto-generated"
                                            className="w-full bg-transparent border-none px-2 py-3 focus:ring-0 outline-none text-sm dir-ltr text-left text-[var(--color-primary-to)]" 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>الوصف</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className={inputClass} placeholder="اكتب نبذة مختصرة عن القصة..." required />
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>سنة الإصدار</label>
                                        <input type="number" name="releaseYear" value={formData.releaseYear} onChange={handleChange} className={inputClass} required />
                                    </div>
                                    <div>
                                        <label className={labelClass}>التقييم (5/x)</label>
                                        <input type="number" name="rating" step="0.1" max="5" value={formData.rating} onChange={handleChange} className={`${inputClass} text-yellow-400 font-bold`} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>التصنيف العمري</label>
                                        <input type="text" name="ageRating" value={formData.ageRating} onChange={handleChange} className={inputClass} placeholder="+13" />
                                    </div>
                                </div>
                            </div>

                            {/* Right Col: Visibility Cards & Type */}
                            <div className="space-y-6">
                                {/* Visibility Cards */}
                                <div>
                                    <label className={labelClass}>جمهور المشاهدة</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {/* General Card */}
                                        <button 
                                            type="button"
                                            onClick={() => setFormData(prev => ({...prev, visibility: 'general'}))}
                                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group text-right relative overflow-hidden
                                                ${formData.visibility === 'general' 
                                                    ? 'border-green-500/50 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.15)] scale-[1.02]' 
                                                    : 'border-gray-700 bg-[#1a2230] hover:border-gray-500'}
                                            `}
                                        >
                                            {formData.visibility === 'general' && <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>}
                                            <div className={`p-3 rounded-full transition-colors ${formData.visibility === 'general' ? 'bg-green-500 text-black' : 'bg-gray-800 text-gray-500'}`}>
                                                <ShieldCheckIcon />
                                            </div>
                                            <div>
                                                <div className={`font-bold text-lg ${formData.visibility === 'general' ? 'text-green-400' : 'text-white'}`}>عام (عائلي)</div>
                                                <div className="text-xs text-gray-400 mt-0.5">مناسب لجميع الأعمار</div>
                                            </div>
                                        </button>

                                        {/* Adults Card */}
                                        <button 
                                            type="button"
                                            onClick={() => setFormData(prev => ({...prev, visibility: 'adults'}))}
                                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group text-right relative overflow-hidden
                                                ${formData.visibility === 'adults' 
                                                    ? 'border-red-500/50 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.15)] scale-[1.02]' 
                                                    : 'border-gray-700 bg-[#1a2230] hover:border-gray-500'}
                                            `}
                                        >
                                            {formData.visibility === 'adults' && <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>}
                                            <div className={`p-3 rounded-full transition-colors ${formData.visibility === 'adults' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
                                                <AdultIcon />
                                            </div>
                                            <div>
                                                <div className={`font-bold text-lg ${formData.visibility === 'adults' ? 'text-red-400' : 'text-white'}`}>للكبار فقط</div>
                                                <div className="text-xs text-gray-400 mt-0.5">محتوى +18 أو مقيد</div>
                                            </div>
                                        </button>

                                        {/* Kids Card */}
                                        <button 
                                            type="button"
                                            onClick={() => setFormData(prev => ({...prev, visibility: 'kids'}))}
                                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group text-right relative overflow-hidden
                                                ${formData.visibility === 'kids' 
                                                    ? 'border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_20px_rgba(234,179,8,0.15)] scale-[1.02]' 
                                                    : 'border-gray-700 bg-[#1a2230] hover:border-gray-500'}
                                            `}
                                        >
                                            {formData.visibility === 'kids' && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>}
                                            <div className={`p-3 rounded-full transition-colors ${formData.visibility === 'kids' ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-500'}`}>
                                                <FaceSmileIcon />
                                            </div>
                                            <div>
                                                <div className={`font-bold text-lg ${formData.visibility === 'kids' ? 'text-yellow-400' : 'text-white'}`}>للأطفال</div>
                                                <div className="text-xs text-gray-400 mt-0.5">وضع آمن للأطفال</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>نوع المحتوى</label>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({...prev, type: ContentType.Movie}))}
                                            className={`
                                                flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 border
                                                ${formData.type === ContentType.Movie
                                                    ? 'bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black border-transparent shadow-[0_0_15px_var(--shadow-color)] scale-105'
                                                    : `${INPUT_BG} border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white`
                                                }
                                            `}
                                        >
                                            فيلم
                                            {formData.type === ContentType.Movie && <div className="bg-black/20 rounded-full p-0.5"><CheckSmallIcon /></div>}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({
                                                    ...prev, 
                                                    type: ContentType.Series, 
                                                    seasons: (prev.seasons && prev.seasons.length > 0) ? prev.seasons : [{ id: Date.now(), seasonNumber: 1, title: 'الموسم 1', episodes: []}]
                                                }));
                                            }}
                                            className={`
                                                flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 border
                                                ${formData.type === ContentType.Series
                                                    ? 'bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black border-transparent shadow-[0_0_15px_var(--shadow-color)] scale-105'
                                                    : `${INPUT_BG} border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white`
                                                }
                                            `}
                                        >
                                            مسلسل
                                            {formData.type === ContentType.Series && <div className="bg-black/20 rounded-full p-0.5"><CheckSmallIcon /></div>}
                                        </button>
                                    </div>
                                </div>
                                
                                {formData.type === ContentType.Movie && (
                                    <div>
                                        <label className={labelClass}>مدة الفيلم</label>
                                        <input type="text" name="duration" value={formData.duration || ''} onChange={handleChange} placeholder="مثال: 1h 45m" className={inputClass}/>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Categorization */}
                        <div className={sectionBoxClass}>
                            <h3 className="text-lg font-bold text-[var(--color-primary-to)] mb-4 flex items-center gap-2">
                                <span>🏷️</span> التصنيفات والأنواع
                            </h3>
                            
                            <div className="mb-6">
                                <label className="text-xs text-gray-400 font-bold mb-3 block uppercase tracking-wider">القوائم الرئيسية</label>
                                <div className="flex flex-wrap gap-3">
                                    {filteredCategories.map(cat => {
                                        const isSelected = formData.categories.includes(cat);
                                        return (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => handleCategoryChange(cat)}
                                                className={`
                                                    flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 border
                                                    ${isSelected 
                                                        ? 'bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black border-transparent shadow-[0_0_15px_var(--shadow-color)] scale-105' 
                                                        : `${INPUT_BG} border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white`
                                                    }
                                                `}
                                            >
                                                {cat}
                                                {isSelected && <div className="bg-black/20 rounded-full p-0.5"><CheckSmallIcon /></div>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 font-bold mb-3 block uppercase tracking-wider">النوع الفني</label>
                                <div className="flex flex-wrap gap-2">
                                    {genres.map(g => {
                                        const isSelected = formData.genres.includes(g);
                                        return (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => handleGenreChange(g)}
                                                className={`
                                                    flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 border
                                                    ${isSelected 
                                                        ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.4)] scale-105' 
                                                        : `${INPUT_BG} border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white`
                                                    }
                                                `}
                                            >
                                                {g}
                                                {isSelected && <CheckSmallIcon />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-gray-700">
                                 <label className={labelClass}>نص شارة مميز</label>
                                 <input type="text" name="bannerNote" value={formData.bannerNote || ''} onChange={handleChange} className={inputClass} placeholder="مثال: الأكثر مشاهدة، جديد رمضان" />
                            </div>
                        </div>

                        {/* 3. Media & Assets */}
                        <div className={sectionBoxClass}>
                            <h3 className="text-lg font-bold text-[var(--color-primary-to)] mb-6 border-b border-gray-700 pb-4 flex items-center gap-2">
                                <span>🖼️</span> الصور والوسائط
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <label className={labelClass}>رابط البوستر (عمودي)</label>
                                    <div className="flex gap-4 items-center">
                                        <input type="text" name="poster" value={formData.poster} onChange={handleChange} className={`${inputClass} flex-1`} placeholder="https://..." required />
                                        {formData.poster && (
                                            <div className={`w-16 h-24 ${INPUT_BG} rounded-lg overflow-hidden shadow-md border border-gray-600 flex-shrink-0 animate-fade-in-up`}>
                                                <img src={formData.poster} className="w-full h-full object-cover"/>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>رابط الخلفية (أفقي)</label>
                                    <div className="flex gap-4 items-center">
                                        <input type="text" name="backdrop" value={formData.backdrop} onChange={handleChange} className={`${inputClass} flex-1`} placeholder="https://..." required />
                                        {formData.backdrop && (
                                            <div className={`w-32 h-20 ${INPUT_BG} rounded-lg overflow-hidden shadow-md border border-gray-600 flex-shrink-0 animate-fade-in-up`}>
                                                <img src={formData.backdrop} className="w-full h-full object-cover"/>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                 <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className={labelClass}>رابط اللوجو (شفاف)</label>
                                        <div className="flex items-center gap-2 bg-gray-900/50 px-3 py-1 rounded-lg border border-gray-700/50">
                                            <span className="text-xs text-gray-400 font-medium">تفعيل اللوجو بدلاً من النص</span>
                                            <ToggleSwitch 
                                                checked={formData.isLogoEnabled || false} 
                                                onChange={(c) => setFormData(prev => ({...prev, isLogoEnabled: c}))} 
                                                className="scale-75"
                                            />
                                        </div>
                                    </div>
                                    <input type="text" name="logoUrl" value={formData.logoUrl || ''} onChange={handleChange} className={inputClass} placeholder="https://..." />
                                    {formData.logoUrl && <img src={formData.logoUrl} alt="Logo Preview" className={`mt-3 h-16 object-contain ${INPUT_BG} p-2 rounded border border-gray-600`} />}
                                </div>
                                
                                <div className="bg-black/30 p-5 rounded-xl border border-gray-700 transition-all duration-300">
                                     <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold text-white flex items-center gap-2">📱 تخصيص للموبايل (قص الصورة)</h4>
                                        <ToggleSwitch checked={formData.enableMobileCrop || false} onChange={(c) => setFormData(prev => ({...prev, enableMobileCrop: c}))} className="scale-90"/>
                                    </div>
                                    
                                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${formData.enableMobileCrop ? 'max-h-40 opacity-100' : 'max-h-0 opacity-50'}`}>
                                        <label className="block text-xs text-gray-400 mb-3 font-medium">حدد نقطة التركيز (Center Point)</label>
                                        <div className="relative pt-2 pb-4 px-2">
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="100" 
                                                value={formData.mobileCropPosition || 50} 
                                                onChange={(e) => setFormData(prev => ({...prev, mobileCropPosition: parseInt(e.target.value)}))}
                                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
                                            />
                                            <div className="flex justify-between text-[10px] text-gray-500 mt-2 font-mono uppercase tracking-wider">
                                                <span>Left (0%)</span>
                                                <span className="text-[var(--color-accent)] font-bold text-base">{formData.mobileCropPosition || 50}%</span>
                                                <span>Right (100%)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* 4. Content Logic (Series / Movies) */}
                        {formData.type === ContentType.Series && (
                            <div className={sectionBoxClass}>
                                <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                                    <h3 className="text-lg font-bold text-[var(--color-accent)] flex items-center gap-2">
                                        <span>📺</span> المواسم والحلقات
                                    </h3>
                                    <button type="button" onClick={handleAddSeason} className="bg-[var(--color-accent)] text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-white transition-colors shadow-lg">+ إضافة موسم</button>
                                </div>
                                
                                <div className="space-y-6">
                                    {formData.seasons?.map((season, sIndex) => (
                                        <div key={season.id} className={`bg-gray-900 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-colors`}>
                                            {/* Season Header */}
                                            <div className="flex flex-wrap gap-4 items-center justify-between mb-4 bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                                                <div className="flex gap-2 flex-1">
                                                    <input 
                                                        type="text" 
                                                        value={season.title} 
                                                        onChange={(e) => handleUpdateSeason(season.id, 'title', e.target.value)}
                                                        className="bg-transparent font-bold text-lg text-white border-none focus:ring-0 placeholder-gray-500 w-full"
                                                        placeholder="عنوان الموسم"
                                                    />
                                                    <input 
                                                        type="number" 
                                                        value={season.releaseYear || ''} 
                                                        onChange={(e) => handleUpdateSeason(season.id, 'releaseYear', e.target.value === '' ? undefined : parseInt(e.target.value))}
                                                        className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white w-24 focus:outline-none focus:border-[var(--color-accent)]"
                                                        placeholder="سنة العرض"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button type="button" onClick={() => handleAddEpisode(season.id)} className="text-green-400 text-xs font-bold bg-green-500/10 px-3 py-1.5 rounded hover:bg-green-500/20 transition-colors">+ حلقة جديدة</button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => requestDeleteSeason(season.id, season.title || `الموسم ${season.seasonNumber}`)} 
                                                        className="text-red-400 text-xs font-bold bg-red-500/10 px-3 py-1.5 rounded hover:bg-red-500/20 transition-colors"
                                                    >
                                                        حذف
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* Season Details: Description */}
                                            <div className="mb-4">
                                                <textarea 
                                                    value={season.description || ''} 
                                                    onChange={(e) => handleUpdateSeason(season.id, 'description', e.target.value)}
                                                    placeholder="قصة الموسم (اختياري)..." 
                                                    className={`bg-gray-800 border border-gray-600 rounded px-3 py-2 text-xs text-white w-full focus:outline-none focus:border-[var(--color-accent)] resize-none`}
                                                    rows={2}
                                                />
                                            </div>

                                            {/* Season Details: Cast */}
                                            <div className="mb-4 bg-gray-800/30 p-3 rounded border border-gray-700">
                                                <div className="flex gap-2 mb-2">
                                                    <input 
                                                        type="text" 
                                                        value={seasonCastInputs[season.id] || ''}
                                                        onChange={(e) => setSeasonCastInputs(prev => ({...prev, [season.id]: e.target.value}))}
                                                        onKeyDown={(e) => {
                                                            if(e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddSeasonCast(season.id);
                                                            }
                                                        }}
                                                        placeholder="طاقم عمل الموسم..."
                                                        className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-xs text-white flex-1 focus:outline-none focus:border-[var(--color-accent)]"
                                                    />
                                                    <button type="button" onClick={() => handleAddSeasonCast(season.id)} className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 rounded transition-colors">إضافة</button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {(season.cast || []).map((actor, i) => (
                                                        <div key={i} className="bg-gray-700 text-gray-200 px-2 py-0.5 rounded flex items-center gap-1 text-[10px]">
                                                            <span>{actor}</span>
                                                            <button type="button" onClick={() => handleRemoveSeasonCast(season.id, i)} className="text-gray-400 hover:text-red-400"><CloseIcon className="w-3 h-3" /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            {/* Season Images & Logo */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div className="space-y-2">
                                                    <input type="text" placeholder="بوستر الموسم" value={season.poster || ''} onChange={(e) => handleUpdateSeason(season.id, 'poster', e.target.value)} className={`bg-gray-800 border border-gray-600 rounded px-3 py-2 text-xs text-white w-full ${FOCUS_RING}`}/>
                                                </div>
                                                <div className="space-y-2">
                                                    <input type="text" placeholder="خلفية الموسم" value={season.backdrop || ''} onChange={(e) => handleUpdateSeason(season.id, 'backdrop', e.target.value)} className={`bg-gray-800 border border-gray-600 rounded px-3 py-2 text-xs text-white w-full ${FOCUS_RING}`}/>
                                                </div>
                                                <div className="space-y-2">
                                                    <input type="text" placeholder="لوجو الموسم (شفاف)" value={season.logoUrl || ''} onChange={(e) => handleUpdateSeason(season.id, 'logoUrl', e.target.value)} className={`bg-gray-800 border border-gray-600 rounded px-3 py-2 text-xs text-white w-full ${FOCUS_RING}`}/>
                                                </div>
                                            </div>

                                            {/* Episodes List */}
                                            <div className="space-y-2 pl-2 border-r-2 border-gray-700/50">
                                                {season.episodes.length === 0 && <p className="text-gray-500 text-sm italic p-2">لم يتم إضافة حلقات لهذا الموسم.</p>}
                                                {season.episodes.map((ep, eIndex) => (
                                                    <div key={ep.id} className="flex items-center gap-3 bg-gray-800 p-2.5 rounded-lg hover:bg-gray-750 transition-colors group">
                                                        <span className="text-gray-500 text-xs font-mono w-6 text-center">{eIndex + 1}</span>
                                                        <input 
                                                            type="text" 
                                                            value={ep.title} 
                                                            onChange={(e) => handleUpdateEpisodeTitle(season.id, ep.id, e.target.value)}
                                                            className="bg-transparent border-b border-transparent focus:border-[var(--color-accent)] text-sm text-white flex-1 outline-none placeholder-gray-600 transition-colors"
                                                            placeholder={`عنوان الحلقة ${eIndex + 1}`}
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => setEditingServersForEpisode(ep)}
                                                            className={`text-xs px-3 py-1.5 rounded font-medium transition-all ${ep.servers?.some(s=>s.url) ? 'bg-[var(--color-accent)] text-black' : 'bg-gray-700 text-[var(--color-accent)] hover:bg-gray-600'}`}
                                                        >
                                                            {ep.servers?.some(s=>s.url) ? `تم الربط (${ep.servers.filter(s=>s.url).length})` : 'إدارة السيرفرات'}
                                                        </button>
                                                        <button type="button" onClick={() => handleDeleteEpisode(season.id, ep.id)} className="text-gray-500 hover:text-red-400 p-1"><CloseIcon className="w-4 h-4"/></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {formData.type === ContentType.Movie && (
                            <div className="sectionBoxClass">
                                 <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                                    <h3 className="text-lg font-bold text-[var(--color-accent)] flex items-center gap-2">
                                        <span>🎬</span> سيرفرات المشاهدة
                                    </h3>
                                    <button type="button" onClick={() => setIsManagingMovieServers(true)} className="bg-[var(--color-accent)] text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-white transition-colors shadow-lg">إدارة الروابط</button>
                                </div>
                                <div className="bg-black/20 rounded-lg p-4 border border-gray-700">
                                    <p className="text-gray-400 text-sm mb-2">السيرفرات الحالية:</p>
                                    {formData.servers?.length === 0 ? (
                                        <p className="text-red-400 text-sm font-bold">لم يتم إضافة أي سيرفر للمشاهدة.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {formData.servers?.map((s, i) => s.url && (
                                                <li key={i} className="flex items-center gap-3 text-sm text-gray-300 bg-gray-800 p-2 rounded border border-gray-700">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                                    <span className="font-bold text-white">{s.name}</span>
                                                    <span className="text-gray-500 text-xs truncate max-w-[200px] dir-ltr">({s.url})</span>
                                                    {s.downloadUrl && <span className="text-blue-400 text-xs ml-auto">⬇️ رابط تحميل</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}

                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-700 bg-black/20 rounded-b-2xl backdrop-blur-xl flex justify-between items-center">
                    <div className="text-xs text-gray-600 font-mono">
                        {formData.id ? `ID: ${formData.id}` : 'New Entry'}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-3 rounded-full font-bold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">إلغاء</button>
                        <button onClick={handleSubmit} className="px-10 py-3 rounded-full font-bold bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black shadow-[0_0_20px_var(--shadow-color)] hover:shadow-[0_0_30px_var(--shadow-color)] hover:scale-105 transition-all transform">
                            {isNewContent ? 'نشر المحتوى' : 'حفظ التعديلات'}
                        </button>
                    </div>
                </div>

            </div>

            {(editingServersForEpisode || isManagingMovieServers) && (
                <ServerManagementModal 
                    episode={editingServersForEpisode || { id: 0, title: formData.title, thumbnail: '', duration: 0, progress: 0, servers: formData.servers || [] }} 
                    onClose={() => {
                         setEditingServersForEpisode(null);
                         setIsManagingMovieServers(false);
                    }}
                    onSave={(servers) => {
                        if (isManagingMovieServers) {
                            handleUpdateMovieServers(servers);
                        } else {
                            handleUpdateEpisodeServers(servers);
                        }
                    }}
                />
            )}
            
            <DeleteConfirmationModal 
                isOpen={deleteSeasonState.isOpen}
                onClose={() => setDeleteSeasonState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={executeDeleteSeason}
                title="حذف الموسم"
                message={`هل أنت متأكد من حذف ${deleteSeasonState.title}؟ لا يمكن التراجع عن هذا الإجراء.`}
            />
        </div>
    );
};

export default ContentEditModal;
