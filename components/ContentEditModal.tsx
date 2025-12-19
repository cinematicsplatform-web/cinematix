import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Content, Server, Season, Episode, Category, Genre } from '@/types';
import { ContentType, genres } from '@/types';
import { CloseIcon } from './icons/CloseIcon';
import { PlusIcon } from './icons/PlusIcon';
import ToggleSwitch from './ToggleSwitch';
import { generateSlug } from '@/firebase';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import * as XLSX from 'xlsx';
import UqloadSearchModal from './UqloadSearchModal';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

// --- ICONS ---
const ShieldCheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
);
const AdultIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
);
const FaceSmileIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75z" /></svg>
);
const CheckSmallIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" {...props}><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" /></svg>
);
const CloudArrowDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
);
const ExcelIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
);
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
);
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
);

// --- STYLES (UPDATED FOR DARK MODERN THEME) ---
const MODAL_BG = "bg-[#151922]"; 
const INPUT_BG = "bg-[#0f1014]"; 
const BORDER_COLOR = "border-gray-700";
const FOCUS_RING = "focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]";

const inputClass = `w-full ${INPUT_BG} border ${BORDER_COLOR} rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none ${FOCUS_RING} transition-all duration-300`;
const labelClass = "block text-sm font-bold text-gray-400 mb-2";
const sectionBoxClass = "bg-[#1a2230] p-6 rounded-2xl border border-gray-700/50 shadow-lg";

// --- COMPONENT: Mobile Simulator ---
interface MobileSimulatorProps {
    imageUrl: string;
    posX: number;
    posY: number;
    onUpdateX: (val: number) => void;
    onUpdateY: (val: number) => void;
}

const MobileSimulator: React.FC<MobileSimulatorProps> = ({ imageUrl, posX, posY, onUpdateX, onUpdateY }) => {
    return (
        <div className="flex flex-col md:flex-row gap-8 items-start p-6 bg-black/40 rounded-xl border border-gray-700 mt-2">
            {/* 1. Phone Frame Simulator */}
            <div className="relative mx-auto md:mx-0 flex-shrink-0">
                <div 
                    className="relative overflow-hidden border-4 border-gray-800 rounded-[2.5rem] shadow-2xl bg-black"
                    style={{ width: '260px', height: '462px' }} // ~9:16 Aspect Ratio
                >
                    {/* Image */}
                    <div 
                        className="w-full h-full bg-no-repeat bg-cover transition-all duration-100 ease-out"
                        style={{ 
                            backgroundImage: `url(${imageUrl || 'https://placehold.co/1080x1920/101010/101010/png'})`, 
                            backgroundPosition: `${posX}% ${posY}%` 
                        }}
                    />
                    
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-800 rounded-b-xl z-20"></div>
                    
                    {/* Status Bar Fake Items (Optional) */}
                    <div className="absolute top-1 right-4 w-4 h-4 bg-gray-700 rounded-full opacity-50 z-20"></div>
                </div>
                <div className="text-center text-xs text-gray-500 mt-2 font-mono">Mobile Preview (9:16)</div>
            </div>

            {/* 2. Controls */}
            <div className="flex flex-col gap-6 flex-1 w-full pt-4">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">ضبط كادر الموبايل</h3>
                    <p className="text-xs text-gray-400">حرك المؤشرات لضبط الجزء الظاهر من الصورة داخل إطار الهاتف.</p>
                </div>
                
                {/* Horizontal X */}
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <label className="flex justify-between text-sm mb-3 font-bold text-gray-300">
                        <span className="flex items-center gap-2">↔️ تحريك أفقي (X-Axis)</span>
                        <span className="font-mono text-[var(--color-accent)]">{posX}%</span>
                    </label>
                    <input 
                        type="range" min="0" max="100" step="1"
                        value={posX}
                        onChange={(e) => onUpdateX(Number(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                        <span>Left</span>
                        <span>Right</span>
                    </div>
                </div>

                {/* Vertical Y */}
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <label className="flex justify-between text-sm mb-3 font-bold text-gray-300">
                        <span className="flex items-center gap-2">↕️ تحريك عمودي (Y-Axis)</span>
                        <span className="font-mono text-[var(--color-accent)]">{posY}%</span>
                    </label>
                    <input 
                        type="range" min="0" max="100" step="1"
                        value={posY}
                        onChange={(e) => onUpdateY(Number(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                        <span>Top</span>
                        <span>Bottom</span>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- NESTED MODAL (Server Management) ---
interface ServerManagementModalProps {
    episode: Episode;
    onClose: () => void;
    onSave: (servers: Server[]) => void;
    onOpenSearch: () => void;
}

const ServerManagementModal: React.FC<ServerManagementModalProps> = ({ episode, onClose, onSave, onOpenSearch }) => {
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[220] flex items-center justify-center p-4" onClick={onClose}>
            <div className={`${MODAL_BG} border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl text-white animate-fade-in-up overflow-hidden`} onClick={e => e.stopPropagation()}>
                <div className="bg-black/20 p-6 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-[var(--color-accent)]">إدارة السيرفرات: {episode.title}</h3>
                    <div className="flex items-center gap-2">
                        {/* Search Uqload Button */}
                        <button onClick={onOpenSearch} className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors">
                            <SearchIcon />
                            <span>بحث Uqload</span>
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-white ml-2"><CloseIcon /></button>
                    </div>
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
        id: '', title: '', description: '', type: ContentType.Movie, poster: '', top10Poster: '', backdrop: '', horizontalPoster: '', mobileBackdropUrl: '',
        rating: 0, ageRating: '', categories: [], genres: [], releaseYear: new Date().getFullYear(), cast: [],
        visibility: 'general', seasons: [], servers: [], bannerNote: '', createdAt: '',
        logoUrl: '', isLogoEnabled: false, trailerUrl: '', duration: '', enableMobileCrop: false, 
        mobileCropPositionX: 50, mobileCropPositionY: 50, // Default Centers
        slug: '',
        ...content,
    });

    const [formData, setFormData] = useState<Content>(getDefaultFormData());
    const [editingServersForEpisode, setEditingServersForEpisode] = useState<Episode | null>(null);
    const [isManagingMovieServers, setIsManagingMovieServers] = useState<boolean>(false);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!content?.slug);
    const [newActor, setNewActor] = useState('');
    const [seasonCastInputs, setSeasonCastInputs] = useState<Record<number, string>>({});
    const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());
    
    // File input refs for Excel Import
    const globalFileInputRef = useRef<HTMLInputElement>(null);
    const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
    
    const [deleteSeasonState, setDeleteSeasonState] = useState<{
        isOpen: boolean;
        seasonId: number | null;
        title: string;
    }>({ isOpen: false, seasonId: null, title: '' });

    // DELETE EPISODE STATE
    const [deleteEpisodeState, setDeleteEpisodeState] = useState<{
        isOpen: boolean;
        seasonId: number | null;
        episodeId: number | null;
        title: string;
    }>({ isOpen: false, seasonId: null, episodeId: null, title: '' });

    // --- Uqload Modal State ---
    const [isUqloadModalOpen, setIsUqloadModalOpen] = useState(false);

    // --- TMDB STATE ---
    const [tmdbIdInput, setTmdbIdInput] = useState(content?.id && !isNaN(Number(content.id)) ? content.id : '');
    const [fetchLoading, setFetchLoading] = useState(false);
    const [refreshLoading, setRefreshLoading] = useState(false);
    const [enableAutoLinks, setEnableAutoLinks] = useState(false); 
    const API_KEY = 'b8d66e320b334f4d56728d98a7e39697';

    // --- NEW: TMDB SEARCH STATE ---
    const [tmdbSearchMode, setTmdbSearchMode] = useState<'id' | 'name'>('name');
    const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
    const [tmdbSearchResults, setTmdbSearchResults] = useState<any[]>([]);
    const [isSearchingTMDB, setIsSearchingTMDB] = useState(false);

    useEffect(() => {
        // Initialize form data with fallback for mobileCropPosition (old X) if new X isn't set
        const initData = getDefaultFormData();
        if (initData.mobileCropPosition !== undefined && initData.mobileCropPositionX === undefined) {
            initData.mobileCropPositionX = initData.mobileCropPosition;
        }
        
        setFormData(initData);
        setSlugManuallyEdited(!!content?.slug);
        setNewActor('');
        setSeasonCastInputs({});
        setTmdbIdInput(content?.id && !isNaN(Number(content.id)) ? content.id : '');
        fileInputRefs.current = {};
    }, [content]);

    useEffect(() => {
        if (!slugManuallyEdited && formData.title) {
            setFormData(prev => ({ ...prev, slug: generateSlug(prev.title) }));
        }
    }, [formData.title, slugManuallyEdited]);

    const generateEpisodeServers = (tmdbId: string, seasonNum: number, episodeNum: number) => {
         const epServers: Server[] = [];
         const autoDownloadUrl = `https://dl.vidsrc.vip/tv/${tmdbId}/${seasonNum}/${episodeNum}`;

         if (enableAutoLinks) {
             epServers.push({
                 id: 80000 + episodeNum,
                 name: 'Cinematix VIP (سريع)',
                 url: `https://vidsrc.vip/embed/tv/${tmdbId}/${seasonNum}/${episodeNum}`,
                 downloadUrl: autoDownloadUrl,
                 isActive: true
             });
             epServers.push({
                 id: 90000 + episodeNum,
                 name: 'سيرفر VidSrc',
                 url: `https://vidsrc.to/embed/tv/${tmdbId}/${seasonNum}/${episodeNum}`,
                 downloadUrl: autoDownloadUrl,
                 isActive: true
             });
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

    const handleRefreshData = async () => {
        alert('Validation mock: Refresh function triggered');
    };

    // --- NEW: TMDB SEARCH FUNCTION ---
    const searchTMDB = async () => {
        if (!tmdbSearchQuery.trim()) return;
        setIsSearchingTMDB(true);
        setTmdbSearchResults([]);

        try {
            // Use search/multi to find both movies and tv shows
            const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(tmdbSearchQuery)}&language=ar-SA&page=1&include_adult=false`);
            const data = await res.json();
            
            if (data.results) {
                // Filter only movie and tv
                const filtered = data.results.filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv');
                setTmdbSearchResults(filtered);
            }
        } catch (e) {
            console.error("TMDB Search Error:", e);
            alert("حدث خطأ أثناء البحث في TMDB.");
        } finally {
            setIsSearchingTMDB(false);
        }
    };

    const handleSelectSearchResult = (result: any) => {
        // Set the ID
        setTmdbIdInput(String(result.id));
        
        // Auto-set the type based on the result
        if (result.media_type === 'movie') {
            setFormData(prev => ({ ...prev, type: ContentType.Movie }));
        } else if (result.media_type === 'tv') {
            setFormData(prev => ({ ...prev, type: ContentType.Series }));
        }

        // Trigger fetch immediately with the new ID
        fetchFromTMDB(String(result.id), result.media_type === 'movie' ? ContentType.Movie : ContentType.Series);
        
        // Reset Search UI
        setTmdbSearchResults([]);
        setTmdbSearchQuery('');
    };

    // --- HELPER: Fetch Season Details Recursively ---
    const fetchSeasonDetails = async (tmdbId: string, seasonNumber: number) => {
        try {
            const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNumber}?api_key=${API_KEY}&language=ar-SA`);
            if (res.ok) return await res.json();
            return null;
        } catch (e) {
            console.warn(`Failed to fetch season ${seasonNumber}`, e);
            return null;
        }
    };

    const fetchFromTMDB = async (overrideId?: string, overrideType?: ContentType) => {
        const targetId = overrideId || tmdbIdInput;
        if (!targetId) return;
        
        setFetchLoading(true);

        // Use override type if provided (from search selection), otherwise current state
        let currentType = overrideType || formData.type;
        
        try {
            const getUrl = (type: ContentType, lang: string) => {
                const typePath = type === ContentType.Movie ? 'movie' : 'tv';
                // Note: 'seasons' is included in TV details by default in 'tv' endpoint
                const append = type === ContentType.Movie 
                    ? 'credits,release_dates,videos,images' 
                    : 'content_ratings,credits,videos,images'; 
                // Include image language preference for logos
                return `https://api.themoviedb.org/3/${typePath}/${targetId}?api_key=${API_KEY}&language=${lang}&append_to_response=${append}&include_image_language=${lang},en,null`;
            };

            // 1. Initial Fetch with Arabic (to check if it's local)
            let res = await fetch(getUrl(currentType, 'ar-SA'));

            // Handle 404 / Type Mismatch Logic (Auto-switch type if needed)
            if (!res.ok && res.status === 404) {
                const altType = currentType === ContentType.Movie ? ContentType.Series : ContentType.Movie;
                const resAlt = await fetch(getUrl(altType, 'ar-SA'));
                if (resAlt.ok) {
                    res = resAlt;
                    currentType = altType; 
                }
            }

            if (!res.ok) throw new Error('لم يتم العثور على محتوى بهذا الـ ID. تأكد من صحة الرقم.');
            
            let details = await res.json();

            // 2. Language Logic: Check Original Language
            const originLang = details.original_language;
            
            // Refined Category Logic
            let autoCategory: Category = 'افلام اجنبية'; 
            if (currentType === ContentType.Series) {
                if (originLang === 'tr') autoCategory = 'مسلسلات تركية';
                else if (originLang === 'ar') autoCategory = 'مسلسلات عربية';
                else autoCategory = 'مسلسلات اجنبية';
            } else {
                if (originLang === 'tr') autoCategory = 'افلام تركية';
                else if (originLang === 'ar') autoCategory = 'افلام عربية';
                else if (originLang === 'hi') autoCategory = 'افلام هندية';
                else autoCategory = 'افلام اجنبية';
            }

            // Fallback to English for assets/overview if Arabic is missing
            if (originLang !== 'ar') {
                const resEn = await fetch(getUrl(currentType, 'en-US'));
                if (resEn.ok) {
                    const enDetails = await resEn.json();
                    if (!details.overview) details.overview = enDetails.overview;
                    if (enDetails.images) details.images = enDetails.images;
                    if (enDetails.videos) details.videos = enDetails.videos;
                }
            }

            // 3. Extract Basic Data
            const title = details.title || details.name || '';
            const description = details.overview || ''; 
            const poster = details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '';
            const backdrop = details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : '';
            const rating = details.vote_average ? Number((details.vote_average / 2).toFixed(1)) : 0;
            const releaseDate = details.release_date || details.first_air_date || '';
            const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();
            
            // --- Extract Trailer ---
            let trailerUrl = '';
            if (details.videos && details.videos.results) {
                let trailer = details.videos.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
                if (!trailer) {
                     trailer = details.videos.results.find((v: any) => v.type === 'Teaser' && v.site === 'YouTube');
                }
                if (trailer) {
                    trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
                }
            }

            // --- Extract Logo (PNG) ---
            let logoUrl = '';
            if (details.images && details.images.logos && details.images.logos.length > 0) {
                let logoNode = details.images.logos.find((img: any) => img.iso_639_1 === 'ar');
                if (!logoNode) logoNode = details.images.logos.find((img: any) => img.iso_639_1 === 'en');
                if (!logoNode) logoNode = details.images.logos[0];
                if (logoNode) logoUrl = `https://image.tmdb.org/t/p/w500${logoNode.file_path}`;
            }

            let duration = '';
            if (currentType === ContentType.Movie && details.runtime) {
                const h = Math.floor(details.runtime / 60);
                const m = details.runtime % 60;
                duration = `${h}h ${m}m`;
            }

            // Age Rating
            let ageRating = '';
            if (currentType === ContentType.Movie) {
                 const releaseDates = details.release_dates?.results || [];
                 const usRelease = releaseDates.find((r: any) => r.iso_3166_1 === 'US');
                 if (usRelease) ageRating = usRelease.release_dates[0]?.certification || '';
            } else {
                 const contentRatings = details.content_ratings?.results || [];
                 const usRating = contentRatings.find((r: any) => r.iso_3166_1 === 'US');
                 if (usRating) ageRating = usRating.rating || '';
            }

            const mappedGenres: Genre[] = details.genres?.map((g: any) => {
                // Simple mapping (can be expanded)
                if(g.name === 'Action') return 'أكشن';
                if(g.name === 'Adventure') return 'مغامرة';
                if(g.name === 'Animation') return 'أطفال';
                if(g.name === 'Comedy') return 'كوميديا';
                if(g.name === 'Crime') return 'جريمة';
                if(g.name === 'Documentary') return 'وثائقي';
                if(g.name === 'Drama') return 'دراما';
                if(g.name === 'Family') return 'عائلي';
                if(g.name === 'Fantasy') return 'فانتازيا';
                if(g.name === 'History') return 'تاريخي';
                if(g.name === 'Horror') return 'رعب';
                if(g.name === 'Music') return 'موسيقي';
                if(g.name === 'Mystery') return 'غموض';
                if(g.name === 'Romance') return 'رومانسي';
                if(g.name === 'Science Fiction') return 'خيال علمي';
                if(g.name === 'TV Movie') return 'فيلم تلفزيوني';
                if(g.name === 'Thriller') return 'إثارة';
                if(g.name === 'War') return 'حربي';
                if(g.name === 'Western') return 'ويسترن';
                return g.name; 
            }) || [];

            // Add 'أطفال' to genres if Animation category detected
            if (mappedGenres.includes('أطفال') && !autoCategory.includes('أنميشن')) {
                 autoCategory = 'افلام أنميشن';
            }

            const topCast = details.credits?.cast?.slice(0, 7).map((c: any) => c.name) || [];

            // --- SERIES DEEP FETCHING (Seasons & Episodes) ---
            let newSeasons: Season[] = [];
            
            if (currentType === ContentType.Series && details.seasons) {
                // Fetch details for each season in parallel
                // Filter out season 0 (Specials) usually, unless desired. keeping for now.
                const validSeasons = details.seasons.filter((s:any) => s.season_number > 0);
                
                const seasonPromises = validSeasons.map((s: any) => fetchSeasonDetails(String(targetId), s.season_number));
                const detailedSeasons = await Promise.all(seasonPromises);

                newSeasons = detailedSeasons.filter(ds => ds !== null).map((ds: any) => {
                    
                    // Map Episodes
                    const mappedEpisodes: Episode[] = ds.episodes?.map((ep: any) => {
                        let epDuration = '';
                        if (ep.runtime) {
                             if(ep.runtime > 60) {
                                 epDuration = `${Math.floor(ep.runtime/60)}h ${ep.runtime%60}m`;
                             } else {
                                 epDuration = `${ep.runtime}:00`;
                             }
                        }

                        return {
                            id: Date.now() + ep.episode_number + Math.random(), // Unique ID generation
                            title: ep.name || `الحلقة ${ep.episode_number}`,
                            description: ep.overview,
                            thumbnail: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : '', // Episode Still
                            duration: epDuration,
                            progress: 0,
                            servers: generateEpisodeServers(String(targetId), ds.season_number, ep.episode_number)
                        };
                    }) || [];

                    return {
                        id: Date.now() + ds.season_number + Math.random(),
                        seasonNumber: ds.season_number,
                        title: ds.name || `الموسم ${ds.season_number}`,
                        releaseYear: ds.air_date ? new Date(ds.air_date).getFullYear() : releaseYear,
                        description: ds.overview,
                        poster: ds.poster_path ? `https://image.tmdb.org/t/p/w500${ds.poster_path}` : poster, // Season Poster
                        backdrop: backdrop, // Fallback to series backdrop usually, unless specific exists
                        logoUrl: ds.season_number === 1 ? logoUrl : '', // Assign Logo only to Season 1
                        // REMOVED: horizontalPoster and mobileImageUrl auto-mapping
                        episodes: mappedEpisodes
                    };
                });
            }

            // --- SERVER LOGIC (Movies) ---
            let movieServers: Server[] = [];
            // ... (Existing movie server logic remains same if any) ...

            setFormData(prev => ({
                ...prev,
                id: String(targetId),
                title,
                description,
                poster,
                backdrop,
                horizontalPoster: prev.horizontalPoster, // PRESERVE MANUAL VALUE
                mobileBackdropUrl: prev.mobileBackdropUrl, // PRESERVE MANUAL VALUE
                logoUrl,
                isLogoEnabled: !!logoUrl,
                trailerUrl,
                rating,
                releaseYear,
                ageRating,
                type: currentType, 
                categories: [autoCategory], // Auto assign category
                genres: [...new Set([...prev.genres, ...mappedGenres])],
                cast: topCast,
                duration: duration || prev.duration,
                seasons: currentType === ContentType.Series ? newSeasons : prev.seasons,
                servers: movieServers,
                bannerNote: prev.bannerNote // Preserve banner note
            }));

        } catch (e: any) {
            console.error(e);
            alert(e.message || 'فشل جلب البيانات.');
        } finally {
            setFetchLoading(false);
        }
    };

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
        if (name === 'slug') setSlugManuallyEdited(true);
        setFormData(prev => ({ ...prev, [name]: value } as Content));
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

    const toggleSeason = (id: number) => {
        setExpandedSeasons(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleAddSeason = () => {
        const newSeasonNumber = (formData.seasons?.length || 0) + 1;
        setFormData(prev => ({
            ...prev,
            seasons: [...(prev.seasons || []), { id: Date.now(), seasonNumber: newSeasonNumber, title: `الموسم ${newSeasonNumber}`, episodes: [] }]
        }));
    };

    const handleUpdateSeason = (seasonId: number, field: keyof Season, value: any) => {
        setFormData(prev => ({
            ...prev,
            seasons: (prev.seasons || []).map(s => s.id === seasonId ? { ...s, [field]: value } : s)
        }));
    };

    const requestDeleteSeason = (seasonId: number, seasonTitle: string) => { setDeleteSeasonState({ isOpen: true, seasonId, title: seasonTitle }); };
    
    const executeDeleteSeason = () => { if (deleteSeasonState.seasonId) setFormData(prev => ({ ...prev, seasons: (prev.seasons || []).filter(s => s.id !== deleteSeasonState.seasonId) })); setDeleteSeasonState(prev => ({ ...prev, isOpen: false })); };
    
    const handleSeasonExcelImport = async (e: React.ChangeEvent<HTMLInputElement>, seasonId: number, seasonNumber: number) => { /* ... existing import logic ... */ };
    
    const handleAddEpisode = (seasonId: number) => { 
        setFormData(prev => ({
            ...prev,
            seasons: (prev.seasons || []).map(s => {
                if (s.id !== seasonId) return s;
                const newEpNum = (s.episodes?.length || 0) + 1;
                return {
                    ...s,
                    episodes: [...(s.episodes || []), { id: Date.now(), title: `الحلقة ${newEpNum}`, duration: '', progress: 0, servers: [] }]
                };
            })
        }));
    };
    
    const requestDeleteEpisode = (seasonId: number, episodeId: number, episodeTitle: string) => { 
        setDeleteEpisodeState({ isOpen: true, seasonId, episodeId, title: episodeTitle }); 
    };
    
    const executeDeleteEpisode = () => { 
        const { seasonId, episodeId } = deleteEpisodeState;
        if (seasonId && episodeId) {
            setFormData(prev => ({
                ...prev,
                seasons: (prev.seasons || []).map(s => {
                    if (s.id !== seasonId) return s;
                    return { ...s, episodes: s.episodes.filter(e => e.id !== episodeId) };
                })
            }));
        }
        setDeleteEpisodeState(prev => ({...prev, isOpen: false})); 
    };
    
    const handleUpdateEpisode = (seasonId: number, episodeId: number, field: keyof Episode, value: any) => { 
        setFormData(prev => ({
            ...prev,
            seasons: (prev.seasons || []).map(s => {
                if (s.id !== seasonId) return s;
                return {
                    ...s,
                    episodes: s.episodes.map(e => e.id === episodeId ? { ...e, [field]: value } : e)
                };
            })
        }));
    };
    
    const handleUpdateEpisodeServers = (newServers: Server[]) => { 
        if (!editingServersForEpisode) return;
        setFormData(prev => ({
            ...prev,
            seasons: (prev.seasons || []).map(s => ({
                ...s,
                episodes: s.episodes.map(e => e.id === editingServersForEpisode.id ? { ...e, servers: newServers } : e)
            }))
        }));
    };
    
    const handleUpdateMovieServers = (servers: Server[]) => { 
        setFormData(prev => ({ ...prev, servers })); 
    };
    
    const handleBulkSeriesImport = async (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
    
    const handleUqloadSelect = (result: { name: string, embedUrl: string, downloadUrl: string }) => { /* ... */ };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center md:bg-black/80 md:backdrop-blur-sm md:p-4 bg-[#0f1014]" onClick={onClose}>
            <div className={`bg-[#151922] w-full h-full md:h-auto md:max-h-[95vh] md:max-w-5xl md:rounded-2xl md:border border-gray-700 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.9)] text-white flex flex-col overflow-hidden`} onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="px-6 md:px-8 py-4 md:py-6 border-b border-gray-700 flex justify-between items-center bg-black/30 backdrop-blur-md sticky top-0 z-10">
                    <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                         {isNewContent ? <PlusIcon className="w-6 h-6 md:w-8 md:h-8 text-[var(--color-primary-to)]"/> : <span className="text-[var(--color-accent)]">✎</span>}
                         {isNewContent ? 'إضافة محتوى جديد' : 'تعديل المحتوى'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"><CloseIcon /></button>
                </div>

                {/* Form Body - Ensure pb-24 or similar to clear the fixed footer */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-6 md:space-y-8 bg-[#151922] pb-24">
                    {/* 🚀 TMDB Smart Fetch Section (Enhanced) */}
                    <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-2xl shadow-inner">
                        <div className="flex flex-col gap-4">
                            {/* Search Mode Tabs */}
                            <div className="flex gap-4 border-b border-blue-500/20 pb-3">
                                <button 
                                    type="button"
                                    onClick={() => setTmdbSearchMode('name')}
                                    className={`text-sm font-bold pb-2 transition-all ${tmdbSearchMode === 'name' ? 'text-white border-b-2 border-[#00A7F8]' : 'text-blue-400/60 hover:text-blue-300'}`}
                                >
                                    بحث بالاسم (Name Search)
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setTmdbSearchMode('id')}
                                    className={`text-sm font-bold pb-2 transition-all ${tmdbSearchMode === 'id' ? 'text-white border-b-2 border-[#00A7F8]' : 'text-blue-400/60 hover:text-blue-300'}`}
                                >
                                    بحث بالـ ID (Manual ID)
                                </button>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
                                <div className="flex-1 w-full">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        {/* Input Area */}
                                        <div className="flex gap-2 flex-1">
                                            {tmdbSearchMode === 'name' ? (
                                                <>
                                                    <input 
                                                        type="text" 
                                                        value={tmdbSearchQuery}
                                                        onChange={(e) => setTmdbSearchQuery(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && searchTMDB()}
                                                        placeholder="ابحث باسم الفيلم أو المسلسل..." 
                                                        className="w-full bg-[#0f1014] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={searchTMDB}
                                                        disabled={isSearchingTMDB}
                                                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shadow-lg hover:shadow-blue-500/30 transform hover:scale-105"
                                                    >
                                                        {isSearchingTMDB ? 'جاري البحث...' : <SearchIcon className="w-5 h-5 text-white" />}
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <input 
                                                        type="text" 
                                                        value={tmdbIdInput}
                                                        onChange={(e) => setTmdbIdInput(e.target.value)}
                                                        placeholder="أدخل TMDB ID (مثال: 12345)" 
                                                        className="w-full bg-[#0f1014] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={() => fetchFromTMDB()}
                                                        disabled={fetchLoading}
                                                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shadow-lg hover:shadow-blue-500/30 transform hover:scale-105"
                                                    >
                                                        {fetchLoading ? 'جاري الجلب...' : (
                                                            <>
                                                                <CloudArrowDownIcon />
                                                                جلب البيانات
                                                            </>
                                                        )}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-3 bg-blue-900/20 px-4 py-2 rounded-xl border border-blue-500/20">
                                            <ToggleSwitch 
                                                checked={enableAutoLinks} 
                                                onChange={setEnableAutoLinks} 
                                                className="scale-90"
                                            />
                                            <span className="text-xs text-gray-300 font-bold whitespace-nowrap select-none">توليد روابط تلقائية</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Search Results Grid */}
                            {tmdbSearchMode === 'name' && tmdbSearchResults.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                                    {tmdbSearchResults.map((result) => (
                                        <div 
                                            key={result.id} 
                                            onClick={() => handleSelectSearchResult(result)}
                                            className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#00A7F8] transition-all group relative border border-gray-700"
                                        >
                                            <div className="aspect-[2/3] w-full relative">
                                                {result.poster_path ? (
                                                    <img 
                                                        src={`https://image.tmdb.org/t/p/w200${result.poster_path}`} 
                                                        alt={result.title || result.name} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-600">No Image</div>
                                                )}
                                                <div className="absolute top-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-white font-bold backdrop-blur-sm border border-white/10">
                                                    {result.media_type === 'movie' ? 'فيلم' : 'مسلسل'}
                                                </div>
                                            </div>
                                            <div className="p-2">
                                                <h4 className="text-xs font-bold text-white truncate">{result.title || result.name}</h4>
                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                    {result.release_date ? result.release_date.substring(0, 4) : result.first_air_date ? result.first_air_date.substring(0, 4) : 'N/A'}
                                                </p>
                                            </div>
                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-[#00A7F8]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="bg-[#00A7F8] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">اختيار</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Type & Title */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            <div className="lg:col-span-4 order-1 lg:order-2">
                                <label className={labelClass}>نوع المحتوى</label>
                                <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({...prev, type: ContentType.Movie}))}
                                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 border w-full justify-center ${formData.type === ContentType.Movie ? 'bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black border-transparent shadow-[0_0_15px_var(--shadow-color)] scale-105' : `${INPUT_BG} border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white`}`}
                                    >
                                        فيلم {formData.type === ContentType.Movie && <div className="bg-black/20 rounded-full p-0.5"><CheckSmallIcon /></div>}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({...prev, type: ContentType.Series, seasons: (prev.seasons && prev.seasons.length > 0) ? prev.seasons : [{ id: Date.now(), seasonNumber: 1, title: 'الموسم 1', episodes: []}]}))}
                                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 border w-full justify-center ${formData.type === ContentType.Series ? 'bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black border-transparent shadow-[0_0_15px_var(--shadow-color)] scale-105' : `${INPUT_BG} border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white`}`}
                                    >
                                        مسلسل {formData.type === ContentType.Series && <div className="bg-black/20 rounded-full p-0.5"><CheckSmallIcon /></div>}
                                    </button>
                                </div>
                            </div>
                            <div className="lg:col-span-8 order-2 lg:order-1 space-y-6">
                                <div><label className={labelClass}>عنوان العمل</label><input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClass} placeholder="أدخل العنوان هنا..." required /></div>
                                <div><label className={labelClass}>الرابط (Slug)</label><div className={`flex items-center ${INPUT_BG} border ${BORDER_COLOR} rounded-xl px-3 ${FOCUS_RING} transition-colors`}><span className="text-gray-500 text-xs whitespace-nowrap dir-ltr select-none">cinematix.app/{formData.type === ContentType.Series ? 'series/' : 'movie/'}</span><input type="text" name="slug" value={formData.slug || ''} onChange={handleChange} placeholder="auto-generated" className="w-full bg-transparent border-none px-2 py-3 focus:ring-0 outline-none text-sm dir-ltr text-left text-[var(--color-primary-to)] font-mono" /></div></div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div><label className={labelClass}>الوصف</label><textarea name="description" value={formData.description} onChange={handleChange} rows={4} className={inputClass} placeholder="اكتب نبذة مختصرة عن القصة..." required /></div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div><label className={labelClass}>سنة الإصدار</label><input type="number" name="releaseYear" value={formData.releaseYear} onChange={handleChange} className={inputClass} required /></div>
                                    <div><label className={labelClass}>التقييم (5/x)</label><input type="number" name="rating" step="0.1" max="5" value={formData.rating} onChange={handleChange} className={`${inputClass} text-yellow-400 font-bold`} /></div>
                                    <div><label className={labelClass}>التصنيف العمري</label><input type="text" name="ageRating" value={formData.ageRating} onChange={handleChange} className={inputClass} placeholder="+13" /></div>
                                    {formData.type === ContentType.Movie && (<div><label className={labelClass}>مدة الفيلم</label><input type="text" name="duration" value={formData.duration || ''} onChange={handleChange} placeholder="مثال: 1h 45m" className={inputClass}/></div>)}
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div><label className={labelClass}>جمهور المشاهدة</label><div className="grid grid-cols-1 gap-3">
                                        <button type="button" onClick={() => setFormData(prev => ({...prev, visibility: 'general'}))} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group text-right relative overflow-hidden ${formData.visibility === 'general' ? 'border-green-500/50 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.15)] scale-[1.02]' : 'border-gray-700 bg-[#1a2230] hover:border-gray-500'}`}>{formData.visibility === 'general' && <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>}<div className={`p-3 rounded-full transition-colors ${formData.visibility === 'general' ? 'bg-green-500 text-black' : 'bg-gray-800 text-gray-500'}`}><ShieldCheckIcon /></div><div><div className={`font-bold text-lg ${formData.visibility === 'general' ? 'text-green-400' : 'text-white'}`}>عام (عائلي)</div><div className="text-xs text-gray-400 mt-0.5">مناسب لجميع الأعمار</div></div></button>
                                        <button type="button" onClick={() => setFormData(prev => ({...prev, visibility: 'adults'}))} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group text-right relative overflow-hidden ${formData.visibility === 'adults' ? 'border-red-500/50 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.15)] scale-[1.02]' : 'border-gray-700 bg-[#1a2230] hover:border-gray-500'}`}>{formData.visibility === 'adults' && <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>}<div className={`p-3 rounded-full transition-colors ${formData.visibility === 'adults' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-500'}`}><AdultIcon /></div><div><div className={`font-bold text-lg ${formData.visibility === 'adults' ? 'text-red-400' : 'text-white'}`}>للكبار فقط</div><div className="text-xs text-gray-400 mt-0.5">محتوى +18 أو مقيد</div></div></button>
                                        <button type="button" onClick={() => setFormData(prev => ({...prev, visibility: 'kids'}))} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group text-right relative overflow-hidden ${formData.visibility === 'kids' ? 'border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_20px_rgba(234,179,8,0.15)] scale-[1.02]' : 'border-gray-700 bg-[#1a2230] hover:border-gray-500'}`}>{formData.visibility === 'kids' && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>}<div className={`p-3 rounded-full transition-colors ${formData.visibility === 'kids' ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-500'}`}><FaceSmileIcon /></div><div><div className={`font-bold text-lg ${formData.visibility === 'kids' ? 'text-yellow-400' : 'text-white'}`}>للأطفال</div><div className="text-xs text-gray-400 mt-0.5">وضع آمن للأطفال</div></div></button>
                                </div></div>
                            </div>
                        </div>

                        {/* Categorization */}
                        <div className={sectionBoxClass}><h3 className="text-lg font-bold text-[var(--color-primary-to)] mb-4 flex items-center gap-2"><span>🏷️</span> التصنيفات والأنواع</h3><div className="mb-6"><label className="text-xs text-gray-400 font-bold mb-3 block uppercase tracking-wider">القوائم الرئيسية</label><div className="flex flex-wrap gap-3">{filteredCategories.map(cat => (<button key={cat} type="button" onClick={() => handleCategoryChange(cat)} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 border ${formData.categories.includes(cat) ? 'bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black border-transparent shadow-[0_0_15px_var(--shadow-color)] scale-105' : `${INPUT_BG} border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white`}`}>{cat}{formData.categories.includes(cat) && <div className="bg-black/20 rounded-full p-0.5"><CheckSmallIcon /></div>}</button>))}</div></div><div><label className="text-xs text-gray-400 font-bold mb-3 block uppercase tracking-wider">النوع الفني</label><div className="flex flex-wrap gap-2">{genres.map(g => (<button key={g} type="button" onClick={() => handleGenreChange(g)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 border ${formData.genres.includes(g) ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.4)] scale-105' : `${INPUT_BG} border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white`}`}>{g}{formData.genres.includes(g) && <CheckSmallIcon />}</button>))}</div></div><div className="mt-6 pt-6 border-t border-gray-700"><label className={labelClass}>نص شارة مميز</label><input type="text" name="bannerNote" value={formData.bannerNote || ''} onChange={handleChange} className={inputClass} placeholder="مثال: الأكثر مشاهدة، جديد رمضان" /></div></div>

                        {/* --- CINEMATIC ASSETS (PHASE 1) --- */}
                        <div className={sectionBoxClass}>
                            <h3 className="text-lg font-bold text-[var(--color-primary-to)] mb-6 border-b border-gray-700 pb-4 flex items-center gap-2">
                                <span>🎥</span> أصول العرض السينمائي (Hybrid Carousel)
                            </h3>
                            
                            <div className="space-y-6">
                                {/* 1. Vertical Poster (Standard) */}
                                <div>
                                    <label className={labelClass}>البوستر العمودي (Poster URL)</label>
                                    <div className="flex gap-4 items-center">
                                        <input type="text" name="poster" value={formData.poster} onChange={handleChange} className={`${inputClass} flex-1`} placeholder="https://image.tmdb.org/t/p/w500/..." required />
                                        {formData.poster && (
                                            <div className={`w-16 h-24 ${INPUT_BG} rounded-lg overflow-hidden shadow-md border border-gray-600 flex-shrink-0 animate-fade-in-up`}>
                                                <img src={formData.poster} alt="Poster Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* NEW: Top 10 Poster URL */}
                                <div>
                                    <label className={labelClass}>صورة التوب 10 (Top 10 Poster URL)</label>
                                    <p className="text-xs text-gray-500 mb-2">صورة مخصصة تظهر عندما يكون العمل ضمن قائمة أفضل 10 (يظهر اللوجو أسفلها).</p>
                                    <div className="flex gap-4 items-center">
                                        <input type="text" name="top10Poster" value={formData.top10Poster || ''} onChange={handleChange} className={`${inputClass} flex-1`} placeholder="https://..." />
                                        {formData.top10Poster && (
                                            <div className={`w-16 h-24 ${INPUT_BG} rounded-lg overflow-hidden shadow-md border border-gray-600 flex-shrink-0 animate-fade-in-up`}>
                                                <img src={formData.top10Poster} alt="Top 10 Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 1.5 Horizontal Poster (New) */}
                                <div>
                                    <label className={labelClass}>البوستر العريض (Horizontal Poster)</label>
                                    <p className="text-xs text-gray-500 mb-2">يستخدم للبطاقات العريضة (Landscape) في بعض القوائم.</p>
                                    <div className="flex gap-4 items-center">
                                        <input type="text" name="horizontalPoster" value={formData.horizontalPoster || ''} onChange={handleChange} className={`${inputClass} flex-1`} placeholder="https://image.tmdb.org/t/p/w500/..." />
                                        {formData.horizontalPoster && (
                                            <div className={`w-32 h-20 ${INPUT_BG} rounded-lg overflow-hidden shadow-md border border-gray-600 flex-shrink-0 animate-fade-in-up`}>
                                                <img src={formData.horizontalPoster} alt="Horizontal Poster Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 2. Backdrop (Background) */}
                                <div>
                                    <label className={labelClass}>صورة الخلفية العريضة (Backdrop URL)</label>
                                    <p className="text-xs text-gray-500 mb-2">ستظهر كخلفية عند توسيع الكارت في الوضع الأفقي (Hybrid Hover).</p>
                                    <div className="flex gap-4 items-center">
                                        <input type="text" name="backdrop" value={formData.backdrop} onChange={handleChange} className={`${inputClass} flex-1`} placeholder="https://image.tmdb.org/t/p/original/..." required />
                                        {formData.backdrop && (
                                            <div className={`w-32 h-20 ${INPUT_BG} rounded-lg overflow-hidden shadow-md border border-gray-600 flex-shrink-0 animate-fade-in-up`}>
                                                <img src={formData.backdrop} alt="Backdrop Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 2.5 Mobile Photo (Existing) */}
                                <div>
                                    <label className={labelClass}>صورة الموبايل (Mobile Background)</label>
                                    <p className="text-xs text-gray-500 mb-2">صورة مخصصة للهواتف (Vertical Crop).</p>
                                    <input type="text" name="mobileBackdropUrl" value={formData.mobileBackdropUrl || ''} onChange={handleChange} className={inputClass} placeholder="https://..." />
                                </div>

                                {/* 3. Logo (Transparent PNG) */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className={labelClass}>شعار العمل (Transparent Logo URL)</label>
                                        <div className="flex items-center gap-2 bg-gray-900/50 px-3 py-1 rounded-lg border border-gray-700/50">
                                            <span className="text-xs text-gray-400 font-medium">تفعيل اللوجو بدلاً من النص</span>
                                            <ToggleSwitch checked={formData.isLogoEnabled || false} onChange={(c) => setFormData(prev => ({...prev, isLogoEnabled: c}))} className="scale-75"/>
                                        </div>
                                    </div>
                                    <input type="text" name="logoUrl" value={formData.logoUrl || ''} onChange={handleChange} className={inputClass} placeholder="https://.../logo.png" />
                                    {formData.logoUrl && (
                                        <div className={`mt-3 h-20 ${INPUT_BG} p-2 rounded border border-gray-600 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')]`}>
                                            <img src={formData.logoUrl} alt="Logo Preview" className="h-full object-contain" />
                                        </div>
                                    )}
                                </div>

                                {/* 4. Trailer */}
                                <div>
                                    <label className={labelClass}>رابط الإعلان (Trailer URL)</label>
                                    <p className="text-xs text-gray-500 mb-2">يوتيوب أو رابط مباشر (MP4) للتشغيل التلقائي عند التحويم.</p>
                                    <div className="flex gap-4 items-center">
                                        <input type="text" name="trailerUrl" value={formData.trailerUrl || ''} onChange={handleChange} className={`${inputClass} flex-1`} placeholder="https://www.youtube.com/watch?v=..." />
                                        {formData.trailerUrl && (<a href={formData.trailerUrl} target="_blank" rel="noopener noreferrer" className="bg-red-600/20 text-red-500 border border-red-600/50 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors" title="تشغيل التريلر"><PlayIcon className="w-6 h-6" /></a>)}
                                    </div>
                                </div>

                                {/* Mobile Crop Logic (Optional) */}
                                <div className="bg-black/30 p-5 rounded-xl border border-gray-700 transition-all duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold text-white flex items-center gap-2">📱 تخصيص للموبايل (قص الخلفية)</h4>
                                        <ToggleSwitch checked={formData.enableMobileCrop || false} onChange={(c) => setFormData(prev => ({...prev, enableMobileCrop: c}))} className="scale-90"/>
                                    </div>
                                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${formData.enableMobileCrop ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-50'}`}>
                                        <MobileSimulator imageUrl={formData.mobileBackdropUrl || formData.backdrop} posX={formData.mobileCropPositionX ?? 50} posY={formData.mobileCropPositionY ?? 50} onUpdateX={(val) => setFormData(prev => ({...prev, mobileCropPositionX: val}))} onUpdateY={(val) => setFormData(prev => ({...prev, mobileCropPositionY: val}))}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* 4. Content Logic (Series / Movies) */}
                        {formData.type === ContentType.Series && (
                            <div className={sectionBoxClass}>
                                {/* ... (Keeping existing series logic) ... */}
                                <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                                    <h3 className="text-lg font-bold text-[var(--color-accent)] flex items-center gap-2">
                                        <span>📺</span> المواسم والحلقات
                                    </h3>
                                    <div className="relative flex items-center gap-2">
                                        <input type="file" accept=".xlsx, .xls" onChange={handleBulkSeriesImport} className="hidden" ref={globalFileInputRef} />
                                        <button type="button" onClick={() => globalFileInputRef.current?.click()} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg flex items-center gap-2" title="استيراد شامل (Excel)"><ExcelIcon /> استيراد شامل</button>
                                        <button type="button" onClick={handleAddSeason} className="bg-[var(--color-accent)] text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-white transition-colors shadow-lg">+ إضافة موسم</button>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    {formData.seasons?.map((season, sIndex) => (
                                        <div key={season.id} className={`bg-gray-900 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors overflow-hidden mb-4`}>
                                            <div 
                                                className="flex flex-wrap gap-4 items-center justify-between p-4 bg-gray-800/50 cursor-pointer hover:bg-gray-800 transition-colors"
                                                onClick={() => toggleSeason(season.id)}
                                            >
                                                <div className="flex gap-3 flex-1 items-center">
                                                    {/* Toggle Arrow */}
                                                    <button
                                                        type="button"
                                                        className={`p-1 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 ${expandedSeasons.has(season.id) ? 'rotate-180 bg-[var(--color-accent)]/20 text-[var(--color-accent)]' : 'text-gray-400'}`}
                                                    >
                                                        <ChevronDownIcon className="w-5 h-5" />
                                                    </button>

                                                    <input 
                                                        type="text" 
                                                        value={season.title} 
                                                        onClick={(e) => e.stopPropagation()} 
                                                        onChange={(e) => handleUpdateSeason(season.id, 'title', e.target.value)} 
                                                        className="bg-transparent font-bold text-lg text-white border-none focus:ring-0 placeholder-gray-500 w-full" 
                                                        placeholder="عنوان الموسم" 
                                                    />
                                                    
                                                    <input 
                                                        type="number" 
                                                        value={season.releaseYear || ''} 
                                                        onClick={(e) => e.stopPropagation()} 
                                                        onChange={(e) => handleUpdateSeason(season.id, 'releaseYear', e.target.value === '' ? undefined : parseInt(e.target.value))} 
                                                        className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white w-24 focus:outline-none focus:border-[var(--color-accent)]" 
                                                        placeholder="سنة العرض" 
                                                    />
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    {/* Actions (Import, Add Episode, Delete) */}
                                                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                                                        <input type="file" accept=".xlsx, .xls" onChange={(e) => handleSeasonExcelImport(e, season.id, season.seasonNumber)} className="hidden" id={`season-import-${season.id}`} />
                                                        <label htmlFor={`season-import-${season.id}`} className="cursor-pointer text-blue-400 text-xs font-bold bg-blue-500/10 px-3 py-1.5 rounded hover:bg-blue-500/20 transition-colors flex items-center gap-1" title="استيراد حلقات هذا الموسم"><ExcelIcon className="w-3 h-3" /> استيراد</label>
                                                    </div>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleAddEpisode(season.id); }} className="text-green-400 text-xs font-bold bg-green-500/10 px-3 py-1.5 rounded hover:bg-green-500/20 transition-colors">+ حلقة</button>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); requestDeleteSeason(season.id, season.title || `الموسم ${season.seasonNumber}`); }} className="text-red-400 text-xs font-bold bg-red-500/10 px-3 py-1.5 rounded hover:bg-red-500/20 transition-colors">حذف</button>
                                                </div>
                                            </div>
                                            
                                            {/* Collapsible Body */}
                                            {expandedSeasons.has(season.id) && (
                                                <div className="p-5 border-t border-gray-700 bg-gray-900/30 animate-fade-in-up">
                                                    
                                                    {/* Season Assets Grid */}
                                                    <div className="mb-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                                                        <h4 className="text-sm font-bold text-[var(--color-primary-to)] mb-4 border-b border-gray-700 pb-2">أصول وتفاصيل الموسم</h4>
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            {/* Right Column: Text Info */}
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="block text-xs font-bold text-gray-400 mb-1">قصة الموسم (Story)</label>
                                                                    <textarea 
                                                                        value={season.description || ''} 
                                                                        onChange={(e) => handleUpdateSeason(season.id, 'description', e.target.value)} 
                                                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-accent)] resize-y min-h-[80px]"
                                                                        placeholder="أدخل قصة هذا الموسم..."
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-bold text-gray-400 mb-1">سنة الإنتاج</label>
                                                                    <input 
                                                                        type="number" 
                                                                        value={season.releaseYear || ''} 
                                                                        onChange={(e) => handleUpdateSeason(season.id, 'releaseYear', parseInt(e.target.value))} 
                                                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-accent)]"
                                                                        placeholder="YYYY"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Left Column: Images */}
                                                            <div className="space-y-4">
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-gray-400 mb-1">بوستر الموسم</label>
                                                                        <input 
                                                                            type="text" 
                                                                            value={season.poster || ''} 
                                                                            onChange={(e) => handleUpdateSeason(season.id, 'poster', e.target.value)} 
                                                                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-[var(--color-accent)] dir-ltr"
                                                                            placeholder="Poster URL..."
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-gray-400 mb-1">بوستر عريض (Horizontal)</label>
                                                                        <input 
                                                                            type="text" 
                                                                            value={season.horizontalPoster || ''} 
                                                                            onChange={(e) => handleUpdateSeason(season.id, 'horizontalPoster', e.target.value)} 
                                                                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-[var(--color-accent)] dir-ltr"
                                                                            placeholder="Horizontal Poster URL..."
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-gray-400 mb-1">لوجو الموسم</label>
                                                                        <input 
                                                                            type="text" 
                                                                            value={season.logoUrl || ''} 
                                                                            onChange={(e) => handleUpdateSeason(season.id, 'logoUrl', e.target.value)} 
                                                                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-[var(--color-accent)] dir-ltr"
                                                                            placeholder="Logo URL..."
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-gray-400 mb-1">خلفية (Backdrop)</label>
                                                                        <input 
                                                                            type="text" 
                                                                            value={season.backdrop || ''} 
                                                                            onChange={(e) => handleUpdateSeason(season.id, 'backdrop', e.target.value)} 
                                                                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-[var(--color-accent)] dir-ltr"
                                                                            placeholder="Backdrop URL..."
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-2">
                                                                        <label className="block text-[10px] font-bold text-gray-400 mb-1">صورة الموبايل</label>
                                                                        <input 
                                                                            type="text" 
                                                                            value={season.mobileImageUrl || ''} 
                                                                            onChange={(e) => handleUpdateSeason(season.id, 'mobileImageUrl', e.target.value)} 
                                                                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-[var(--color-accent)] dir-ltr"
                                                                            placeholder="Mobile Asset URL..."
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Mobile Simulator for Season */}
                                                        <div className="mt-6 pt-4 border-t border-gray-700/50">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h4 className="text-xs font-bold text-gray-300 flex items-center gap-2">📱 تخصيص للموبايل (قص الخلفية لهذا الموسم)</h4>
                                                                <ToggleSwitch checked={season.enableMobileCrop || false} onChange={(c) => handleUpdateSeason(season.id, 'enableMobileCrop', c)} className="scale-75"/>
                                                            </div>
                                                            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${season.enableMobileCrop ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-50'}`}>
                                                                <MobileSimulator 
                                                                    imageUrl={season.mobileImageUrl || season.backdrop || ''} 
                                                                    posX={season.mobileCropPositionX ?? 50} 
                                                                    posY={season.mobileCropPositionY ?? 50} 
                                                                    onUpdateX={(val) => handleUpdateSeason(season.id, 'mobileCropPositionX', val)} 
                                                                    onUpdateY={(val) => handleUpdateSeason(season.id, 'mobileCropPositionY', val)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Episodes Header */}
                                                    <div className="flex justify-between items-center mb-4 px-2">
                                                        <h4 className="text-sm font-bold text-white">الحلقات ({season.episodes.length})</h4>
                                                    </div>

                                                    {/* Episodes List */}
                                                    <div className="space-y-4 pl-2 border-r-2 border-gray-700/50 mr-2 pr-2">
                                                        {season.episodes?.map((ep, idx) => (
                                                            <div key={ep.id} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all">
                                                                <div className="flex flex-col gap-4">
                                                                    {/* Top Row: Title, Duration, Actions */}
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-gray-500 font-mono text-xs font-bold bg-black/30 px-2 py-1 rounded">#{idx + 1}</span>
                                                                        <input 
                                                                            type="text" 
                                                                            value={ep.title} 
                                                                            onChange={(e) => handleUpdateEpisode(season.id, ep.id, 'title', e.target.value)} 
                                                                            className="bg-transparent border-b border-gray-600 focus:border-[var(--color-accent)] px-2 py-1 text-sm font-bold text-white focus:outline-none flex-1" 
                                                                            placeholder="عنوان الحلقة" 
                                                                        />
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] text-gray-400">المدة:</span>
                                                                            <input 
                                                                                type="text" 
                                                                                value={ep.duration || ''} 
                                                                                onChange={(e) => handleUpdateEpisode(season.id, ep.id, 'duration', e.target.value)} 
                                                                                className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white w-20 text-center focus:outline-none focus:border-[var(--color-accent)]" 
                                                                                placeholder="00:00" 
                                                                            />
                                                                        </div>
                                                                        <button type="button" onClick={() => setEditingServersForEpisode(ep)} className={`text-xs px-3 py-1.5 rounded transition-colors font-bold ${ep.servers?.some(s => s.url) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}>سيرفرات {ep.servers?.filter(s=>s.url).length || 0}</button>
                                                                        <button type="button" onClick={() => requestDeleteEpisode(season.id, ep.id, ep.title || `حلقة ${idx+1}`)} className="text-red-400 hover:bg-red-500/10 p-1.5 rounded transition-colors"><CloseIcon className="w-4 h-4" /></button>
                                                                    </div>
                                                                    {/* Episode Thumbnail */}
                                                                    <div className="flex gap-4">
                                                                        <div className="w-24 h-14 bg-black rounded overflow-hidden flex-shrink-0 border border-gray-700">
                                                                            {ep.thumbnail ? <img src={ep.thumbnail} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px]">No Image</div>}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <input 
                                                                                type="text" 
                                                                                value={ep.thumbnail || ''} 
                                                                                onChange={(e) => handleUpdateEpisode(season.id, ep.id, 'thumbnail', e.target.value)} 
                                                                                className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-[var(--color-accent)] dir-ltr placeholder:text-right" 
                                                                                placeholder="رابط صورة الحلقة (Thumbnail URL)" 
                                                                            />
                                                                            <textarea
                                                                                value={ep.description || ''}
                                                                                onChange={(e) => handleUpdateEpisode(season.id, ep.id, 'description', e.target.value)}
                                                                                className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-[var(--color-accent)] mt-2 resize-none h-10"
                                                                                placeholder="وصف الحلقة..."
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 5. Movie Servers */}
                        {formData.type === ContentType.Movie && (
                            <div className={sectionBoxClass}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-[var(--color-accent)]">سيرفرات المشاهدة</h3>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsManagingMovieServers(true)} 
                                        className="bg-[#00A7F8] hover:bg-[#0096d6] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                                    >
                                        إدارة السيرفرات ({formData.servers?.filter(s => s.url).length || 0})
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* --- FIXED ACTION BAR --- */}
                <div className="flex justify-end items-center px-6 md:px-8 py-4 border-t border-gray-700 bg-[#1a2230] shadow-[0_-10px_30px_rgba(0,0,0,0.4)] z-50">
                    <div className="flex gap-4">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 px-8 rounded-xl transition-all duration-200 active:scale-95"
                        >
                            إلغاء
                        </button>
                        <button 
                            type="button" 
                            onClick={handleSubmit}
                            className="bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black font-extrabold py-2.5 px-10 rounded-xl hover:shadow-[0_0_20px_var(--shadow-color)] transition-all duration-200 transform active:scale-95"
                        >
                            {isNewContent ? 'إضافة المحتوى' : 'حفظ التغييرات'}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- SUB-MODALS --- */}
            {editingServersForEpisode && (
                <ServerManagementModal 
                    episode={editingServersForEpisode} 
                    onClose={() => setEditingServersForEpisode(null)} 
                    onSave={handleUpdateEpisodeServers} 
                    onOpenSearch={() => setIsUqloadModalOpen(true)}
                />
            )}

            {isManagingMovieServers && formData.type === ContentType.Movie && (
                <ServerManagementModal 
                    episode={{ id: 0, title: formData.title, progress: 0, servers: formData.servers || [] } as any} // Mock episode
                    onClose={() => setIsManagingMovieServers(false)} 
                    onSave={handleUpdateMovieServers}
                    onOpenSearch={() => setIsUqloadModalOpen(true)}
                />
            )}

            {/* Delete Confirmations */}
            <DeleteConfirmationModal isOpen={deleteSeasonState.isOpen} onClose={() => setDeleteSeasonState(prev => ({...prev, isOpen: false}))} onConfirm={executeDeleteSeason} title="حذف الموسم" message={`هل أنت متأكد من حذف ${deleteSeasonState.title}؟ سيتم حذف جميع الحلقات داخله.`} />
            <DeleteConfirmationModal isOpen={deleteEpisodeState.isOpen} onClose={() => setDeleteEpisodeState(prev => ({...prev, isOpen: false}))} onConfirm={executeDeleteEpisode} title="حذف الحلقة" message={`هل أنت متأكد من حذف ${deleteEpisodeState.title}؟`} />

            {/* Uqload Search */}
            <UqloadSearchModal isOpen={isUqloadModalOpen} onClose={() => setIsUqloadModalOpen(false)} onSelect={handleUqloadSelect} />
        </div>
    );
};

export default ContentEditModal;
