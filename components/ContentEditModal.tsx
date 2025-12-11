
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Content, Server, Season, Episode, Category, Genre } from '../types';
import { ContentType, genres } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { PlusIcon } from './icons/PlusIcon';
import ToggleSwitch from './ToggleSwitch';
import { generateSlug } from '../firebase';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import * as XLSX from 'xlsx';
import UqloadSearchModal from './UqloadSearchModal';

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
const ArrowPathIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
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
        id: '', title: '', description: '', type: ContentType.Movie, poster: '', backdrop: '', mobileBackdropUrl: '',
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
    
    // File input refs for Excel Import
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

    // --- EXCEL IMPORT LOGIC ---
    const handleSeasonExcelImport = async (e: React.ChangeEvent<HTMLInputElement>, seasonId: number, seasonNumber: number) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet);

            if (jsonRows.length === 0) {
                alert('الملف فارغ أو لا يحتوي على بيانات صالحة.');
                return;
            }

            const newEpisodes: Episode[] = [];
            const tmdbId = formData.id; 
            const language = 'ar-SA';

            for (let i = 0; i < jsonRows.length; i++) {
                const row = jsonRows[i];
                const epNum = i + 1;
                let title = `الحلقة ${epNum}`;
                let thumbnail = '';
                let description = '';
                let duration = '45:00'; // Default
                
                if (tmdbId && !isNaN(Number(tmdbId))) {
                    try {
                        const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNumber}/episode/${epNum}?api_key=${API_KEY}&language=${language}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.name) title = data.name;
                            if (data.still_path) thumbnail = `https://image.tmdb.org/t/p/w500${data.still_path}`;
                            if (data.overview) description = data.overview;
                            if (data.runtime) duration = `${data.runtime}:00`;
                        }
                    } catch (err) {
                        console.warn(`Failed to fetch metadata for S${seasonNumber}E${epNum}`);
                    }
                }

                const primaryServer: Server = {
                    id: 1,
                    name: "سيرفر أساسي",
                    url: row['url'] || '',
                    downloadUrl: row['downloadUrl'] || '',
                    isActive: true
                };

                newEpisodes.push({
                    id: Date.now() + i + Math.random(), 
                    title: title,
                    thumbnail: thumbnail,
                    description: description, 
                    duration: duration,
                    progress: 0,
                    servers: [primaryServer]
                });
            }

            setFormData(prev => ({
                ...prev,
                seasons: (prev.seasons || []).map(s => {
                    if (s.id === seasonId) {
                        return { ...s, episodes: newEpisodes }; 
                    }
                    return s;
                })
            }));

            alert(`تم استيراد ${newEpisodes.length} حلقة بنجاح!`);

        } catch (error) {
            console.error("Excel Import Error", error);
            alert("حدث خطأ أثناء قراءة ملف Excel. تأكد من الأعمدة: url, downloadUrl");
        }
    };

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
        if (!tmdbIdInput) return;
        if (formData.type !== ContentType.Series) return; 

        setRefreshLoading(true);
        const language = 'ar-SA';

        try {
            const detailsRes = await fetch(`https://api.themoviedb.org/3/tv/${tmdbIdInput}?api_key=${API_KEY}&language=${language}`);
            if (!detailsRes.ok) throw new Error('فشل الاتصال بـ TMDB. تأكد من الـ ID');
            const details = await detailsRes.json();

            let newSeasonsFromApi: Season[] = [];
            if (details.seasons) {
                const seasonPromises = details.seasons.map(async (s: any) => {
                    try {
                        const seasonDetailRes = await fetch(`https://api.themoviedb.org/3/tv/${tmdbIdInput}/season/${s.season_number}?api_key=${API_KEY}&language=${language}`);
                        const seasonData = await seasonDetailRes.json();
                        
                        const episodeCount = seasonData.episodes?.length || s.episode_count || 0;
                        const episodes: Episode[] = [];

                        for (let i = 1; i <= episodeCount; i++) {
                            // Find matching episode data from TMDB if available
                            const tmdbEp = seasonData.episodes?.find((e:any) => e.episode_number === i);
                            
                            const epId = Date.now() + Math.floor(Math.random() * 1000000) + i;
                            episodes.push({
                                id: epId,
                                title: tmdbEp?.name || `الحلقة ${i}`,
                                thumbnail: tmdbEp?.still_path ? `https://image.tmdb.org/t/p/w500${tmdbEp.still_path}` : '',
                                description: tmdbEp?.overview || '', // Fetch Description
                                duration: tmdbEp?.runtime ? `${tmdbEp.runtime}:00` : '',
                                progress: 0,
                                servers: generateEpisodeServers(tmdbIdInput, s.season_number, i) 
                            });
                        }

                        return {
                            id: s.id, 
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

            const currentSeasons = formData.seasons || [];
            
            const mergedSeasons = newSeasonsFromApi.map(newS => {
                const existingS = currentSeasons.find(s => s.seasonNumber === newS.seasonNumber);
                
                if (!existingS) {
                    return { ...newS, id: Date.now() + Math.random() }; 
                }

                const mergedEpisodes = newS.episodes.map(newEp => {
                    // Try to match by episode number in title or index
                    // Assuming basic "الحلقة X" pattern or index matching
                    const newEpNum = parseInt(newEp.title?.replace(/\D/g, '') || '0');
                    const existingEp = existingS.episodes.find(e => {
                        const oldEpNum = parseInt(e.title?.replace(/\D/g, '') || '0');
                        return oldEpNum === newEpNum;
                    });

                    if (existingEp) {
                        return {
                            ...existingEp,
                            thumbnail: newEp.thumbnail || existingEp.thumbnail, // Update thumbnail if new one exists
                            description: newEp.description || existingEp.description, // Update description if new exists
                            duration: newEp.duration || existingEp.duration // Update duration
                        }; 
                    } else {
                        return newEp;
                    }
                });
                
                return {
                    ...existingS, 
                    title: newS.title, 
                    poster: newS.poster, 
                    releaseYear: newS.releaseYear, 
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

    const fetchFromTMDB = async () => {
        if (!tmdbIdInput) return;
        setFetchLoading(true);

        let currentType = formData.type;
        
        try {
            const getUrl = (type: ContentType, lang: string) => {
                const typePath = type === ContentType.Movie ? 'movie' : 'tv';
                const append = type === ContentType.Movie 
                    ? 'credits,release_dates,videos,images' 
                    : 'content_ratings,credits,videos,images';
                // Include image language preference
                return `https://api.themoviedb.org/3/${typePath}/${tmdbIdInput}?api_key=${API_KEY}&language=${lang}&append_to_response=${append}&include_image_language=${lang},null`;
            };

            // 1. Initial Fetch with Arabic (to check if it's local)
            let res = await fetch(getUrl(currentType, 'ar-SA'));

            // Handle 404 / Type Mismatch
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
            // If AR or TR -> Keep Arabic.
            // If Foreign -> Switch to English to get Original Title & Poster.
            const originLang = details.original_language;
            const isLocal = originLang === 'ar' || originLang === 'tr';

            if (!isLocal) {
                // Fetch English Data for foreign content to get original title and poster
                const resEn = await fetch(getUrl(currentType, 'en-US'));
                if (resEn.ok) {
                    details = await resEn.json();
                }
            }

            // 3. Extract Data
            const title = details.title || details.name || '';
            const description = details.overview || ''; 
            const poster = details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '';
            const backdrop = details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : '';
            const rating = details.vote_average ? Number((details.vote_average / 2).toFixed(1)) : 0;
            const releaseDate = details.release_date || details.first_air_date || '';
            const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();
            
            // Extract Trailer
            let trailerUrl = '';
            if (details.videos && details.videos.results) {
                // Prioritize "Trailer" on YouTube
                let trailer = details.videos.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
                // Fallback to Teaser
                if (!trailer) {
                     trailer = details.videos.results.find((v: any) => v.type === 'Teaser' && v.site === 'YouTube');
                }
                
                if (trailer) {
                    trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
                }
            }

            let duration = '';
            if (currentType === ContentType.Movie && details.runtime) {
                const h = Math.floor(details.runtime / 60);
                const m = details.runtime % 60;
                duration = `${h}h ${m}m`;
            }

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

            const topCast = details.credits?.cast?.slice(0, 7).map((c: any) => c.name) || [];

            let newSeasons: Season[] = [];
            let movieServers: Server[] = [];

            if (currentType === ContentType.Movie && enableAutoLinks) {
                const autoDownloadUrl = `https://dl.vidsrc.vip/movie/${tmdbIdInput}`;
                movieServers.push({
                    id: 9900,
                    name: 'Cinematix VIP (سريع)',
                    url: `https://vidsrc.vip/embed/movie/${tmdbIdInput}`,
                    downloadUrl: autoDownloadUrl,
                    isActive: true
                });
                movieServers.push({
                    id: 9901,
                    name: 'سيرفر VidSrc',
                    url: `https://vidsrc.to/embed/movie/${tmdbIdInput}`,
                    downloadUrl: autoDownloadUrl,
                    isActive: true
                });
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

            if (currentType === ContentType.Series && details.seasons) {
                const seasonPromises = details.seasons.map(async (s: any, index: number) => {
                    try {
                        const seasonDetailRes = await fetch(`https://api.themoviedb.org/3/tv/${tmdbIdInput}/season/${s.season_number}?api_key=${API_KEY}&append_to_response=credits&language=${isLocal ? 'ar-SA' : 'en-US'}`);
                        const seasonData = await seasonDetailRes.json();
                        
                        const seasonYear = seasonData.air_date ? new Date(seasonData.air_date).getFullYear() : undefined;
                        const seasonCast = seasonData.credits?.cast?.slice(0, 5).map((c: any) => c.name) || [];
                        
                        const episodes: Episode[] = [];
                        const episodeCount = seasonData.episodes?.length || s.episode_count || 0;
                        
                        for (let i = 1; i <= episodeCount; i++) {
                            // Try to get specific episode data from the season details response if available
                            const tmdbEp = seasonData.episodes?.find((e:any) => e.episode_number === i);
                            
                            const epId = Date.now() + Math.floor(Math.random() * 1000000) + i;
                            const epServers = generateEpisodeServers(String(tmdbIdInput), s.season_number, i);

                            episodes.push({
                                id: epId,
                                title: tmdbEp?.name || `الحلقة ${i}`,
                                thumbnail: tmdbEp?.still_path ? `https://image.tmdb.org/t/p/w500${tmdbEp.still_path}` : '',
                                description: tmdbEp?.overview || '', // Fetch Description
                                duration: tmdbEp?.runtime ? `${tmdbEp.runtime}:00` : '',
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
                servers: movieServers,
                trailerUrl: trailerUrl || prev.trailerUrl // Use fetched trailer or keep existing
            }));

            // Auto Category Assignment based on Origin
            if (details.origin_country?.includes('TR') || originLang === 'tr') {
                handleCategoryChange(currentType === ContentType.Movie ? 'افلام تركية' : 'مسلسلات تركية');
            } else if (details.origin_country?.includes('EG') || details.origin_country?.includes('SA') || originLang === 'ar') {
                handleCategoryChange(currentType === ContentType.Movie ? 'افلام عربية' : 'مسلسلات عربية');
            } else if (details.origin_country?.includes('IN')) {
                handleCategoryChange('افلام هندية');
            } else {
                handleCategoryChange(currentType === ContentType.Movie ? 'افلام اجنبية' : 'مسلسلات اجنبية');
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
                    description: '',
                    duration: '45:00',
                    progress: 0,
                    servers: []
                });
            }
            return { ...prev, seasons };
        });
    };
    
    // Updated Logic: Request Delete for Episodes
    const requestDeleteEpisode = (seasonId: number, episodeId: number, episodeTitle: string) => {
        setDeleteEpisodeState({
            isOpen: true,
            seasonId,
            episodeId,
            title: episodeTitle
        });
    };

    const executeDeleteEpisode = () => {
        const { seasonId, episodeId } = deleteEpisodeState;
        if (seasonId && episodeId) {
            setFormData(prev => {
                const seasons = [...(prev.seasons || [])];
                const seasonIndex = seasons.findIndex(s => s.id === seasonId);
                if (seasonIndex > -1) {
                    seasons[seasonIndex].episodes = seasons[seasonIndex].episodes.filter(e => e.id !== episodeId);
                }
                return { ...prev, seasons };
            });
        }
        setDeleteEpisodeState(prev => ({ ...prev, isOpen: false }));
    };

    const handleUpdateEpisode = (seasonId: number, episodeId: number, field: keyof Episode, value: any) => {
        setFormData(prev => {
            const seasons = [...(prev.seasons || [])];
            const seasonIndex = seasons.findIndex(s => s.id === seasonId);
            if (seasonIndex > -1) {
                const epIndex = seasons[seasonIndex].episodes.findIndex(e => e.id === episodeId);
                if(epIndex > -1) {
                    seasons[seasonIndex].episodes[epIndex] = {
                        ...seasons[seasonIndex].episodes[epIndex],
                        [field]: value
                    };
                }
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

    const handleUqloadSelect = (result: { name: string, embedUrl: string, downloadUrl: string }) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(result.embedUrl).then(() => {
                alert('تم نسخ رابط التضمين (Embed) إلى الحافظة!');
            });
        }
        setIsUqloadModalOpen(false);
    };

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

                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-6 md:space-y-8 bg-[#151922]">
                    {/* 🚀 TMDB Smart Fetch Section */}
                    <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-2xl shadow-inner">
                        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-bold text-blue-400 mb-2 uppercase tracking-wider">جلب تلقائي (TMDB)</label>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex gap-2 flex-1">
                                        <input 
                                            type="text" 
                                            value={tmdbIdInput}
                                            onChange={(e) => setTmdbIdInput(e.target.value)}
                                            placeholder="أدخل TMDB ID (مثال: 12345)" 
                                            className="w-full bg-[#0f1014] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                        />
                                        
                                        {/* Normal Fetch Button */}
                                        <button 
                                            type="button"
                                            onClick={fetchFromTMDB}
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

                                        {/* Smart Refresh Button (Series Only) */}
                                        {formData.type === ContentType.Series && (
                                            <button 
                                                type="button"
                                                onClick={handleRefreshData}
                                                disabled={refreshLoading}
                                                className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shadow-lg hover:shadow-amber-500/30 transform hover:scale-105"
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
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* ... Existing Content Type, Title, Details, etc ... */}
                        {/* (Skipping unrelated parts for brevity, keeping existing grid structures) */}
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

                        {/* Main Details Grid */}
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

                        {/* Categorization (Reduced for brevity, same as existing) */}
                        <div className={sectionBoxClass}><h3 className="text-lg font-bold text-[var(--color-primary-to)] mb-4 flex items-center gap-2"><span>🏷️</span> التصنيفات والأنواع</h3><div className="mb-6"><label className="text-xs text-gray-400 font-bold mb-3 block uppercase tracking-wider">القوائم الرئيسية</label><div className="flex flex-wrap gap-3">{filteredCategories.map(cat => (<button key={cat} type="button" onClick={() => handleCategoryChange(cat)} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 border ${formData.categories.includes(cat) ? 'bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black border-transparent shadow-[0_0_15px_var(--shadow-color)] scale-105' : `${INPUT_BG} border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white`}`}>{cat}{formData.categories.includes(cat) && <div className="bg-black/20 rounded-full p-0.5"><CheckSmallIcon /></div>}</button>))}</div></div><div><label className="text-xs text-gray-400 font-bold mb-3 block uppercase tracking-wider">النوع الفني</label><div className="flex flex-wrap gap-2">{genres.map(g => (<button key={g} type="button" onClick={() => handleGenreChange(g)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 border ${formData.genres.includes(g) ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.4)] scale-105' : `${INPUT_BG} border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white`}`}>{g}{formData.genres.includes(g) && <CheckSmallIcon />}</button>))}</div></div><div className="mt-6 pt-6 border-t border-gray-700"><label className={labelClass}>نص شارة مميز</label><input type="text" name="bannerNote" value={formData.bannerNote || ''} onChange={handleChange} className={inputClass} placeholder="مثال: الأكثر مشاهدة، جديد رمضان" /></div></div>

                        {/* Media & Assets (Same as existing) */}
                        <div className={sectionBoxClass}><h3 className="text-lg font-bold text-[var(--color-primary-to)] mb-6 border-b border-gray-700 pb-4 flex items-center gap-2"><span>🖼️</span> الصور والوسائط</h3><div className="space-y-6"><div><label className={labelClass}>رابط البوستر (عمودي)</label><div className="flex gap-4 items-center"><input type="text" name="poster" value={formData.poster} onChange={handleChange} className={`${inputClass} flex-1`} placeholder="https://..." required />{formData.poster && (<div className={`w-16 h-24 ${INPUT_BG} rounded-lg overflow-hidden shadow-md border border-gray-600 flex-shrink-0 animate-fade-in-up`}><img src={formData.poster} className="w-full h-full object-cover"/></div>)}</div></div><div><label className={labelClass}>رابط الخلفية (أفقي)</label><div className="flex gap-4 items-center"><input type="text" name="backdrop" value={formData.backdrop} onChange={handleChange} className={`${inputClass} flex-1`} placeholder="https://..." required />{formData.backdrop && (<div className={`w-32 h-20 ${INPUT_BG} rounded-lg overflow-hidden shadow-md border border-gray-600 flex-shrink-0 animate-fade-in-up`}><img src={formData.backdrop} className="w-full h-full object-cover"/></div>)}</div></div><div><label className={labelClass}>رابط الخلفية للموبايل (عمودي)</label><div className="flex gap-4 items-center"><input type="text" name="mobileBackdropUrl" value={formData.mobileBackdropUrl || ''} onChange={handleChange} className={`${inputClass} flex-1`} placeholder="https://... (اختياري - لاستبدال الخلفية على الموبايل)" />{formData.mobileBackdropUrl && (<div className={`w-16 h-24 ${INPUT_BG} rounded-lg overflow-hidden shadow-md border border-gray-600 flex-shrink-0 animate-fade-in-up`}><img src={formData.mobileBackdropUrl} className="w-full h-full object-cover"/></div>)}</div></div><div><label className={labelClass}>رابط يوتيوب تريلر (اختياري)</label><div className="flex gap-4 items-center"><input type="text" name="trailerUrl" value={formData.trailerUrl || ''} onChange={handleChange} className={`${inputClass} flex-1`} placeholder="https://www.youtube.com/watch?v=..." />{formData.trailerUrl && (<a href={formData.trailerUrl} target="_blank" rel="noopener noreferrer" className="bg-red-600/20 text-red-500 border border-red-600/50 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors" title="تشغيل التريلر"><PlayIcon className="w-6 h-6" /></a>)}</div></div><div><div className="flex items-center justify-between mb-2"><label className={labelClass}>رابط اللوجو (شفاف)</label><div className="flex items-center gap-2 bg-gray-900/50 px-3 py-1 rounded-lg border border-gray-700/50"><span className="text-xs text-gray-400 font-medium">تفعيل اللوجو بدلاً من النص</span><ToggleSwitch checked={formData.isLogoEnabled || false} onChange={(c) => setFormData(prev => ({...prev, isLogoEnabled: c}))} className="scale-75"/></div></div><input type="text" name="logoUrl" value={formData.logoUrl || ''} onChange={handleChange} className={inputClass} placeholder="https://..." />{formData.logoUrl && <img src={formData.logoUrl} alt="Logo Preview" className={`mt-3 h-16 object-contain ${INPUT_BG} p-2 rounded border border-gray-600`} />}</div><div className="bg-black/30 p-5 rounded-xl border border-gray-700 transition-all duration-300"><div className="flex items-center justify-between mb-4"><h4 className="text-sm font-bold text-white flex items-center gap-2">📱 تخصيص للموبايل (قص الخلفية)</h4><ToggleSwitch checked={formData.enableMobileCrop || false} onChange={(c) => setFormData(prev => ({...prev, enableMobileCrop: c}))} className="scale-90"/></div><div className={`transition-all duration-500 ease-in-out overflow-hidden ${formData.enableMobileCrop ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-50'}`}><MobileSimulator imageUrl={formData.mobileBackdropUrl || formData.backdrop} posX={formData.mobileCropPositionX ?? 50} posY={formData.mobileCropPositionY ?? 50} onUpdateX={(val) => setFormData(prev => ({...prev, mobileCropPositionX: val}))} onUpdateY={(val) => setFormData(prev => ({...prev, mobileCropPositionY: val}))}/></div></div></div></div>
                        
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
                                                    {/* EXCEL IMPORT BUTTON */}
                                                    <div className="relative">
                                                        <input 
                                                            type="file"
                                                            accept=".xlsx, .xls"
                                                            onChange={(e) => handleSeasonExcelImport(e, season.id, season.seasonNumber)}
                                                            className="hidden"
                                                            ref={(el) => { fileInputRefs.current[season.id] = el; }}
                                                        />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => fileInputRefs.current[season.id]?.click()}
                                                            className="text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded hover:bg-blue-500/20 transition-colors flex items-center gap-1.5 text-xs font-bold"
                                                            title="استيراد الحلقات من ملف Excel"
                                                        >
                                                            <ExcelIcon />
                                                            استيراد Excel
                                                        </button>
                                                    </div>

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
                                            
                                            {/* Season Details ... */}
                                            {/* (Keeping existing season details like description, cast, trailer, images) */}
                                            <div className="mb-4"><textarea value={season.description || ''} onChange={(e) => handleUpdateSeason(season.id, 'description', e.target.value)} placeholder="قصة الموسم (اختياري)..." className={`bg-gray-800 border border-gray-600 rounded px-3 py-2 text-xs text-white w-full focus:outline-none focus:border-[var(--color-accent)] resize-none`} rows={2}/></div>
                                            
                                            {/* Season Media Customization */}
                                            <div className="mb-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 space-y-4">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">وسائط الموسم (اختياري)</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <input 
                                                        type="text" 
                                                        value={season.poster || ''} 
                                                        onChange={(e) => handleUpdateSeason(season.id, 'poster', e.target.value)}
                                                        className="bg-black/20 border border-gray-600 rounded px-3 py-2 text-xs text-gray-300 w-full focus:outline-none focus:border-[var(--color-accent)]"
                                                        placeholder="رابط بوستر الموسم"
                                                    />
                                                    <input 
                                                        type="text" 
                                                        value={season.backdrop || ''} 
                                                        onChange={(e) => handleUpdateSeason(season.id, 'backdrop', e.target.value)}
                                                        className="bg-black/20 border border-gray-600 rounded px-3 py-2 text-xs text-gray-300 w-full focus:outline-none focus:border-[var(--color-accent)]"
                                                        placeholder="رابط خلفية الموسم"
                                                    />
                                                    <input 
                                                        type="text" 
                                                        value={season.logoUrl || ''} 
                                                        onChange={(e) => handleUpdateSeason(season.id, 'logoUrl', e.target.value)}
                                                        className="bg-black/20 border border-gray-600 rounded px-3 py-2 text-xs text-gray-300 w-full focus:outline-none focus:border-[var(--color-accent)]"
                                                        placeholder="رابط لوجو الموسم (شفاف)"
                                                    />
                                                </div>
                                                
                                                {/* Season Mobile Customization */}
                                                <div className="pt-2 border-t border-gray-700/50">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-gray-400">تخصيص للموبايل (الموسم)</span>
                                                            <ToggleSwitch 
                                                                checked={season.enableMobileCrop || false} // Assuming enableMobileCrop exists on Season or handled similarly
                                                                onChange={(c) => handleUpdateSeason(season.id, 'enableMobileCrop', c)}
                                                                className="scale-75"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    {season.enableMobileCrop && (
                                                        <div className="space-y-4 animate-fade-in-up">
                                                            <input 
                                                                type="text" 
                                                                value={season.mobileImageUrl || ''} 
                                                                onChange={(e) => handleUpdateSeason(season.id, 'mobileImageUrl', e.target.value)}
                                                                className="bg-black/20 border border-gray-600 rounded px-3 py-2 text-xs text-gray-300 w-full focus:outline-none focus:border-[var(--color-accent)]"
                                                                placeholder="رابط صورة خاصة للموبايل (اختياري - يفضل عمودي)"
                                                            />
                                                            
                                                            <MobileSimulator 
                                                                imageUrl={season.mobileImageUrl || season.backdrop || formData.backdrop} 
                                                                posX={season.mobileCropPositionX ?? 50} 
                                                                posY={season.mobileCropPositionY ?? 50} 
                                                                onUpdateX={(val) => handleUpdateSeason(season.id, 'mobileCropPositionX', val)} 
                                                                onUpdateY={(val) => handleUpdateSeason(season.id, 'mobileCropPositionY', val)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Episodes List - UPDATED STRUCTURE for Thumbnails */}
                                            <div className="space-y-4 pl-2 border-r-2 border-gray-700/50 mr-2 pr-2">
                                                <h4 className="text-xs font-bold text-gray-500 mb-2">الحلقات ({season.episodes?.length || 0})</h4>
                                                {season.episodes?.map((ep) => (
                                                    <div key={ep.id} className="flex flex-col gap-2 bg-gray-800 p-3 rounded-lg border border-gray-700">
                                                        {/* Top Row: Basic Info & Actions */}
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-gray-500 font-mono text-xs font-bold bg-black/30 px-2 py-1 rounded">#{ep.title?.replace(/\D/g, '') || '?'}</span>
                                                            <input 
                                                                type="text" 
                                                                value={ep.title} 
                                                                onChange={(e) => handleUpdateEpisode(season.id, ep.id, 'title', e.target.value)}
                                                                className="bg-transparent border-none text-sm font-bold text-white focus:ring-0 flex-1 min-w-0"
                                                                placeholder="عنوان الحلقة"
                                                            />
                                                            <input 
                                                                type="text" 
                                                                value={ep.duration || ''} 
                                                                onChange={(e) => handleUpdateEpisode(season.id, ep.id, 'duration', e.target.value)}
                                                                className="bg-black/30 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300 w-20 text-center focus:outline-none focus:border-[var(--color-accent)]"
                                                                placeholder="45:00"
                                                            />
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setEditingServersForEpisode(ep)}
                                                                className={`text-xs px-3 py-1.5 rounded transition-colors font-bold ${ep.servers?.some(s => s.url) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                                                            >
                                                                {ep.servers?.length || 0} سيرفرات
                                                            </button>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => requestDeleteEpisode(season.id, ep.id, ep.title || '')} 
                                                                className="text-red-400 hover:text-red-300 p-1.5 bg-red-500/10 rounded hover:bg-red-500/20"
                                                            >
                                                                <CloseIcon className="w-4 h-4"/>
                                                            </button>
                                                        </div>
                                                        
                                                        <textarea
                                                            value={ep.description || ''}
                                                            onChange={(e) => handleUpdateEpisode(season.id, ep.id, 'description', e.target.value)}
                                                            className="bg-black/20 border border-gray-600 rounded px-3 py-1.5 text-xs text-gray-400 w-full focus:outline-none focus:border-[var(--color-accent)] focus:text-white resize-none"
                                                            placeholder="قصة الحلقة..."
                                                            rows={2}
                                                        />
                                                        
                                                        {/* Bottom Row: Thumbnail URL */}
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-[10px] text-gray-500 whitespace-nowrap w-8 text-center">صورة</div>
                                                            <input 
                                                                type="text" 
                                                                value={ep.thumbnail || ''} 
                                                                onChange={(e) => handleUpdateEpisode(season.id, ep.id, 'thumbnail', e.target.value)}
                                                                className="bg-black/20 border border-gray-600 rounded px-3 py-1.5 text-xs text-gray-400 w-full focus:outline-none focus:border-[var(--color-accent)] focus:text-white"
                                                                placeholder="رابط الصورة المصغرة (Thumbnail URL) - يفضل أفقي"
                                                            />
                                                            {ep.thumbnail && (
                                                                <div className="w-10 h-6 rounded overflow-hidden flex-shrink-0 border border-gray-600">
                                                                    <img src={ep.thumbnail} alt="" className="w-full h-full object-cover" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {season.episodes?.length === 0 && (
                                                    <div className="text-gray-500 text-xs text-center py-2">لا توجد حلقات. اضغط "حلقة جديدة" أو "استيراد Excel".</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {formData.seasons?.length === 0 && <div className="text-center text-gray-500 py-10">لا توجد مواسم. أضف موسماً جديداً.</div>}
                                </div>
                            </div>
                        )}

                        {formData.type === ContentType.Movie && (
                            <div className={sectionBoxClass}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-[var(--color-primary-to)] flex items-center gap-2">
                                        <span>🎬</span> سيرفرات الفيلم
                                    </h3>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setIsUqloadModalOpen(true)} className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"><SearchIcon /><span className="hidden sm:inline">بحث Uqload</span></button>
                                        <button type="button" onClick={() => setIsManagingMovieServers(true)} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">إدارة السيرفرات ({formData.servers?.length || 0})</button>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-400 bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
                                    {formData.servers && formData.servers.length > 0 ? (
                                        <ul className="list-disc list-inside space-y-1">
                                            {formData.servers.filter(s => s.url).map((s, i) => (
                                                <li key={i} className="text-white"><span className="text-gray-500">{s.name}:</span> <span className="text-[var(--color-accent)] font-mono text-xs">{s.url.substring(0, 40)}...</span></li>
                                            ))}
                                        </ul>
                                    ) : (
                                        "لا توجد سيرفرات مضافة حالياً."
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end items-center pt-6 border-t border-gray-700 gap-4">
                            <button type="button" onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full transition-colors text-sm">إلغاء</button>
                            <button type="submit" className="bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black font-bold py-3 px-10 rounded-full hover:bg-white transition-all shadow-[0_0_20px_var(--shadow-color)] transform hover:scale-105">حفظ التغييرات</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Nested Modals */}
            {editingServersForEpisode && (
                <ServerManagementModal 
                    episode={editingServersForEpisode} 
                    onClose={() => setEditingServersForEpisode(null)} 
                    onSave={handleUpdateEpisodeServers} 
                    onOpenSearch={() => setIsUqloadModalOpen(true)}
                />
            )}

            {isManagingMovieServers && (
                <ServerManagementModal 
                    episode={{ 
                        id: 0, 
                        title: formData.title, 
                        thumbnail: formData.poster, 
                        duration: '0', 
                        progress: 0, 
                        servers: formData.servers 
                    }} 
                    onClose={() => setIsManagingMovieServers(false)} 
                    onSave={handleUpdateMovieServers} 
                    onOpenSearch={() => setIsUqloadModalOpen(true)}
                />
            )}

            {/* Uqload Search Modal */}
            <UqloadSearchModal 
                isOpen={isUqloadModalOpen}
                onClose={() => setIsUqloadModalOpen(false)}
                onSelect={handleUqloadSelect}
            />

            {/* Delete Season Modal */}
            <DeleteConfirmationModal 
                isOpen={deleteSeasonState.isOpen}
                onClose={() => setDeleteSeasonState(prev => ({...prev, isOpen: false}))}
                onConfirm={executeDeleteSeason}
                title="حذف الموسم"
                message={`هل أنت متأكد من حذف "${deleteSeasonState.title}"؟ سيتم حذف جميع الحلقات داخله.`}
            />

            {/* Delete Episode Modal */}
            <DeleteConfirmationModal 
                isOpen={deleteEpisodeState.isOpen}
                onClose={() => setDeleteEpisodeState(prev => ({...prev, isOpen: false}))}
                onConfirm={executeDeleteEpisode}
                title="حذف الحلقة"
                message={`هل أنت متأكد من حذف "${deleteEpisodeState.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
            />
        </div>
    );
};

export default ContentEditModal;
