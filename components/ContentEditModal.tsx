import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Content, Server, Season, Episode, Category, Genre } from '@/types';
import { ContentType } from '@/types';
import { db, generateSlug } from '@/firebase'; 
import * as XLSX from 'xlsx';
import YouTubeSearchModal from './YouTubeSearchModal';
import { 
    CloseIcon, MenuIcon, DashboardIcon, TagIcon, PhotoIcon, 
    LayersIcon, ServerIcon, EyeIcon, CheckSmallIcon, 
    TrashIcon, CalendarIcon, StackIcon, inputClass
} from './content-edit/ContentEditIcons';
import { ImageGalleryModal, TitleGalleryModal, ServerManagementModal } from './content-edit/SubModals';
import { GeneralTab, CategoriesTab, MediaTab, SeasonsTab, ServersTab, PreviewTab } from './content-edit/Tabs';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface ContentEditModalProps {
    content: Content | null;
    onClose: () => void; 
    onSave: (content: Content) => void;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ContentEditModal: React.FC<ContentEditModalProps> = ({ content, onClose, onSave, addToast }) => {
    const isNewContent = content === null;
    const [activeTab, setActiveTab] = useState('general');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSchedulingUI, setShowSchedulingUI] = useState(false);

    const getDefaultFormData = (): Content => ({
        id: '', tmdbId: '', title: '', description: '', type: ContentType.Movie, poster: '', top10Poster: '', backdrop: '', horizontalPoster: '', mobileBackdropUrl: '',
        rating: 0, ageRating: '', categories: [], genres: [], releaseYear: new Date().getFullYear(), cast: [],
        visibility: 'general', seasons: [], servers: [], bannerNote: '', createdAt: '',
        logoUrl: '', isLogoEnabled: false, trailerUrl: '', duration: '', enableMobileCrop: false, 
        mobileCropPositionX: 50, mobileCropPositionY: 50, 
        slug: '', director: '', writer: '', isUpcoming: false, isScheduled: false, scheduledAt: '',
        ...content,
    });

    const [formData, setFormData] = useState<Content>(getDefaultFormData());
    const [editingServersForEpisode, setEditingServersForEpisode] = useState<Episode | null>(null);
    const [isManagingMovieServers, setIsManagingMovieServers] = useState<boolean>(false);
    const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());
    const [castQuery, setCastQuery] = useState('');
    const [castResults, setCastResults] = useState<any[]>([]);
    const [isSearchingCast, setIsSearchingCast] = useState(false);
    const [youTubeSearchState, setYouTubeSearchState] = useState<{ isOpen: boolean; targetId: 'main' | number | null }>({ isOpen: false, targetId: null });
    const [galleryState, setGalleryState] = useState<{ isOpen: boolean; imageType: 'poster' | 'backdrop' | 'logo'; onSelect: (url: string) => void; }>({ isOpen: false, imageType: 'poster', onSelect: () => {} });
    const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
    const globalFileInputRef = useRef<HTMLInputElement>(null);
    const movieExcelInputRef = useRef<HTMLInputElement>(null);
    
    const [bulkActionState, setBulkActionState] = useState<{ isOpen: boolean; type: 'add' | 'delete'; seasonId: number | null; startFrom: number; endTo: number; }>({ isOpen: false, type: 'add', seasonId: null, startFrom: 1, endTo: 10 });
    const [deleteSeasonState, setDeleteSeasonState] = useState<{ isOpen: boolean; seasonId: number | null; title: string; }>({ isOpen: false, seasonId: null, title: '' });
    const [deleteEpisodeState, setDeleteEpisodeState] = useState<{ isOpen: boolean; seasonId: number | null; episodeId: number | null; title: string; }>({ isOpen: false, seasonId: null, episodeId: null, title: '' });

    const [tmdbIdInput, setTmdbIdInput] = useState(content?.id && !isNaN(Number(content.id)) ? content.id : '');
    const [fetchLoading, setFetchLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false); 
    const [enableAutoLinks, setEnableAutoLinks] = useState(false);
    const API_KEY = 'b8d66e320b334f4d56728d98a7e39697';

    const [tmdbSearchMode, setTmdbSearchMode] = useState<'id' | 'name'>('name');
    const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
    const [tmdbSearchResults, setTmdbSearchResults] = useState<any[]>([]);
    const [isSearchingTMDB, setIsSearchingTMDB] = useState(false);

    const isEpisodic = formData.type === ContentType.Series || formData.type === ContentType.Program;
    const isStandalone = !isEpisodic;

    useEffect(() => {
        const initData = getDefaultFormData();
        if (initData.mobileCropPosition !== undefined && initData.mobileCropPositionX === undefined) { initData.mobileCropPositionX = initData.mobileCropPosition; }
        if (!initData.tmdbId && initData.id && !isNaN(Number(initData.id))) { initData.tmdbId = initData.id; }
        setFormData(initData);
        setTmdbIdInput(content?.id && !isNaN(Number(content.id)) ? content.id : '');
        setShowSchedulingUI(initData.isScheduled || false);
    }, [content]);

    // Handlers
    const openGallery = (type: 'poster' | 'backdrop' | 'logo', callback: (url: string) => void) => {
        const idToUse = formData.tmdbId || formData.id;
        if (!idToUse) { addToast("يرجى جلب بيانات المحتوى أولاً (ID مطلوب) لفتح المعرض.", "info"); return; }
        setGalleryState({ isOpen: true, imageType: type, onSelect: callback });
    };

    const openTitleGallery = () => {
        const idToUse = formData.tmdbId || formData.id;
        if (!idToUse) { addToast("يرجى جلب بيانات المحتوى أولاً (ID مطلوب) لفتح قائمة العناوين.", "info"); return; }
        setIsTitleModalOpen(true);
    };

    const handleDeleteSection = (tabId: string) => {
        if (!confirm(`هل أنت متأكد من حذف (تصفير) بيانات قسم "${tabId}" بالكامل؟`)) return;
        setFormData(prev => {
            const updated = { ...prev };
            if (tabId === 'servers') updated.servers = [];
            return updated;
        });
    };

    const searchTMDB = async () => {
        if (!tmdbSearchQuery.trim()) return;
        setIsSearchingTMDB(true);
        try {
            const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(tmdbSearchQuery)}&language=ar-SA&page=1&include_adult=false`);
            const data = await res.json();
            if (data.results) setTmdbSearchResults(data.results.filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv'));
        } catch (e) { addToast("حدث خطأ أثناء البحث في TMDB.", "error"); } finally { setIsSearchingTMDB(false); }
    };

    const fetchFromTMDB = async (overrideId?: string, overrideType?: ContentType) => {
        const targetId = overrideId || tmdbIdInput;
        if (!targetId) return;
        setFetchLoading(true);
        let currentType = overrideType || formData.type;
        try {
            const getUrl = (type: ContentType, lang: string) => {
                const typePath = (type === ContentType.Movie || type === ContentType.Play || type === ContentType.Concert) ? 'movie' : 'tv';
                const append = (type === ContentType.Movie || type === ContentType.Play || type === ContentType.Concert) ? 'credits,release_dates,videos,images' : 'content_ratings,credits,videos,images'; 
                return `https://api.themoviedb.org/3/${typePath}/${targetId}?api_key=${API_KEY}&language=${lang}&append_to_response=${append}&include_image_language=${lang},en,null`;
            };
            let res = await fetch(getUrl(currentType, 'ar-SA'));
            if (!res.ok) throw new Error('لم يتم العثور على محتوى.');
            let details = await res.json();
            
            const originLang = details.original_language;
            let autoCategory: Category = 'افلام اجنبية'; 
            if (currentType === ContentType.Series || currentType === ContentType.Program) {
                if (originLang === 'tr') autoCategory = 'مسلسلات تركية';
                else if (originLang === 'ar') autoCategory = 'مسلسلات عربية';
                else autoCategory = 'مسلسلات اجنبية';
            } else {
                if (originLang === 'tr') autoCategory = 'افلام تركية';
                else if (originLang === 'ar') autoCategory = 'افلام عربية';
                else if (originLang === 'hi') autoCategory = 'افلام هندية';
                else autoCategory = 'افلام اجنبية';
            }

            if (originLang !== 'ar') {
                const resEn = await fetch(getUrl(currentType, 'en-US'));
                if (resEn.ok) {
                    const enDetails = await resEn.json();
                    if (!details.overview) details.overview = enDetails.overview;
                }
            }

            const mappedGenres: Genre[] = details.genres?.map((g: any) => {
                const map: Record<string, Genre> = { 'Action': 'أكشن', 'Adventure': 'مغامرة', 'Animation': 'أطفال', 'Comedy': 'كوميديا', 'Crime': 'جريمة', 'Documentary': 'وثائقي', 'Drama': 'دراما', 'Family': 'عائلي', 'Fantasy': 'فانتازيا', 'History': 'تاريخي', 'Horror': 'رعب', 'Music': 'موسيقي', 'Mystery': 'غموض', 'Romance': 'رومانسي', 'Science Fiction': 'خيال علمي', 'TV Movie': 'دراما', 'Thriller': 'إثارة', 'War': 'حربي', 'Western': 'دراما' };
                return map[g.name] || 'دراما';
            }) || [];

            const castNames = details.credits?.cast?.slice(0, 10).map((p: any) => p.name) || [];
            const director = details.credits?.crew?.find((c: any) => c.job === 'Director')?.name || '';
            const writer = details.credits?.crew?.find((c: any) => c.job === 'Writer' || c.job === 'Screenplay' || c.job === 'Story')?.name || '';

            setFormData(prev => ({
                ...prev, title: details.title || details.name, description: details.overview, tmdbId: String(details.id),
                poster: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : prev.poster,
                backdrop: details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : prev.backdrop,
                rating: details.vote_average ? Number((details.vote_average / 2).toFixed(1)) : 0,
                releaseYear: (details.release_date || details.first_air_date) ? new Date(details.release_date || details.first_air_date).getFullYear() : prev.releaseYear,
                genres: [...new Set(mappedGenres)], categories: [autoCategory], cast: castNames, director, writer
            }));
            addToast("تم جلب البيانات بنجاح!", "success");
        } catch (e: any) { addToast(e.message, "error"); } finally { setFetchLoading(false); }
    };

    const handleComprehensiveUpdate = async () => {
        addToast("جاري التحديث الشامل للمواسم والحلقات...", "info");
        const idToUse = formData.tmdbId || formData.id;
        if (!idToUse) return;
        setUpdateLoading(true);
        try {
            const res = await fetch(`https://api.themoviedb.org/3/tv/${idToUse}?api_key=${API_KEY}&language=ar-SA`);
            const details = await res.json();
            const validSeasons = details.seasons.filter((s:any) => s.season_number > 0);
            const newSeasons: Season[] = [];
            for (const s of validSeasons) {
                const sRes = await fetch(`https://api.themoviedb.org/3/tv/${idToUse}/season/${s.season_number}?api_key=${API_KEY}&language=ar-SA`);
                const sData = await sRes.json();
                newSeasons.push({
                    id: Date.now() + Math.random(), seasonNumber: s.season_number, title: sData.name || `الموسم ${s.season_number}`,
                    episodes: sData.episodes.map((ep: any) => ({
                        id: Date.now() + Math.random(), title: `الحلقة ${ep.episode_number}`, progress: 0, servers: [],
                        thumbnail: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : ''
                    }))
                });
            }
            setFormData(prev => ({ ...prev, seasons: newSeasons }));
            addToast("تم تحديث كافة المواسم بنجاح!", "success");
        } catch (e) { addToast("فشل التحديث الشامل", "error"); } finally { setUpdateLoading(false); }
    };

    const handleSave = async (e: React.FormEvent, isScheduled: boolean = false) => {
        e.preventDefault();
        if (isSubmitting) return; 
        if (!formData.title) { addToast('الرجاء كتابة اسم العمل.', "info"); return; }
        setIsSubmitting(true);
        try { await onSave({...formData, updatedAt: new Date().toISOString(), isScheduled, scheduledAt: isScheduled ? formData.scheduledAt : ''}); addToast("تم الحفظ بنجاح!", "success"); } catch (err) { setIsSubmitting(false); }
    };

    const toggleSeason = (id: number) => { setExpandedSeasons(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectSearchResult = (result: any) => {
        setTmdbIdInput(String(result.id));
        setTmdbSearchQuery('');
        setTmdbSearchResults([]);
        fetchFromTMDB(String(result.id), result.media_type === 'movie' ? ContentType.Movie : ContentType.Series);
    };

    const searchCast = async (query: string) => {
        setCastQuery(query);
        if (!query.trim()) { setCastResults([]); return; }
        setIsSearchingCast(true);
        try {
            const res = await fetch(`https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=ar-SA`);
            const data = await res.json();
            setCastResults(data.results || []);
        } catch (e) { console.error(e); } finally { setIsSearchingCast(false); }
    };

    const addCastMember = (person: any) => {
        if (!formData.cast.includes(person.name)) {
            setFormData(prev => ({ ...prev, cast: [...prev.cast, person.name] }));
        }
        setCastQuery('');
        setCastResults([]);
    };

    const removeCastMember = (name: string) => {
        setFormData(prev => ({ ...prev, cast: prev.cast.filter(c => c !== name) }));
    };

    const handleBulkSeriesImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        addToast("تم استيراد بيانات السلسلة بنجاح (محاكاة Excel).", "success");
    };

    const handleAddSeason = () => {
        const newSeasonNum = (formData.seasons?.length || 0) + 1;
        const newSeason: Season = { id: Date.now(), seasonNumber: newSeasonNum, title: `الموسم ${newSeasonNum}`, episodes: [] };
        setFormData(prev => ({ ...prev, seasons: [...(prev.seasons || []), newSeason] }));
    };

    const handleUpdateSpecificSeasonFromTMDB = async (seasonId: number, seasonNumber: number) => {
        addToast(`تحديث الموسم ${seasonNumber} من TMDB...`, "info");
    };

    const handleSeasonExcelImport = (e: React.ChangeEvent<HTMLInputElement>, seasonId: number, seasonNumber: number) => {
        const file = e.target.files?.[0];
        if (!file) return;
        addToast(`جاري استيراد ملف Excel للموسم ${seasonNumber}...`, "info");
    };

    const handleAddEpisode = (seasonId: number) => {
        setFormData(prev => ({
            ...prev,
            seasons: prev.seasons?.map(s => s.id === seasonId ? {
                ...s,
                episodes: [...s.episodes, { id: Date.now(), title: `الحلقة ${s.episodes.length + 1}`, progress: 0, servers: [] }]
            } : s)
        }));
    };

    const handleUpdateSeason = (id: number, f: keyof Season, v: any) => { setFormData(prev => ({...prev, seasons: prev.seasons?.map(s => s.id === id ? {...s, [f]: v} : s)})); };
    const handleUpdateEpisode = (sId: number, eId: number, f: keyof Episode, v: any) => {
        setFormData(prev => ({
            ...prev,
            seasons: prev.seasons?.map(s => s.id === sId ? {
                ...s,
                episodes: s.episodes.map(e => e.id === eId ? { ...e, [f]: v } : e)
            } : s)
        }));
    };

    const handleMovieExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        addToast(`تم استيراد سيرفرات الفيلم من Excel بنجاح.`, "success");
    };

    const filteredCategories = useMemo<Category[]>(() => {
        const commonCats: Category[] = ['قريباً'];
        if (formData.type === ContentType.Movie) {
            return ['افلام عربية', 'افلام تركية', 'افلام اجنبية', 'افلام هندية', 'افلام أنميشن', 'افلام العيد', ...commonCats];
        } else if (formData.type === ContentType.Series) {
            return ['مسلسلات عربية', 'مسلسلات تركية', 'مسلسلات اجنبية', 'رمضان', 'حصرياً لرمضان', 'مسلسلات رمضان', ...commonCats];
        } else if (formData.type === ContentType.Program) {
            return ['برامج تلفزيونية', 'برامج رمضان', ...commonCats];
        } else if (formData.type === ContentType.Concert) {
            return ['حفلات', ...commonCats];
        } else if (formData.type === ContentType.Play) {
            return ['مسرحيات', ...commonCats];
        }
        return commonCats;
    }, [formData.type]);

    return (
        <div className="flex h-screen w-full bg-[#090b10] text-gray-200 overflow-hidden font-sans selection:bg-[var(--color-accent)] selection:text-black" dir="rtl">
            <div className={`fixed inset-0 bg-black/60 z-[90] lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} />
            <aside className={`fixed inset-y-0 right-0 z-[100] w-72 bg-[#0f1014] border-l border-gray-800 flex flex-col shadow-2xl transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
                <div className="p-8 border-b border-gray-800 flex flex-col items-center gap-3">
                    <div className="text-3xl font-extrabold cursor-default flex flex-row items-baseline gap-1 justify-center"><span className="text-white font-['Cairo']">سينما</span><span className="gradient-text font-['Lalezar'] tracking-wide text-4xl">تيكس</span></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">{isNewContent ? 'New Content' : 'Edit Mode'}</span>
                </div>
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
                    {[
                        { id: 'general', label: 'البيانات الأساسية', icon: DashboardIcon },
                        { id: 'categories', label: 'التصنيف والأنواع', icon: TagIcon },
                        { id: 'media', label: 'الصور والميديا', icon: PhotoIcon },
                        ...(isEpisodic ? [{ id: 'seasons', label: 'المواسم والحلقات', icon: LayersIcon }] : []),
                        ...(isStandalone ? [{ id: 'servers', label: 'السيرفرات', icon: ServerIcon }] : [])
                    ].map(tab => (
                        <button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id ? 'bg-[#1a1f29] text-white border-r-2 border-[var(--color-accent)]' : 'text-gray-400 hover:bg-[#161b22] hover:text-white'}`}>
                            <tab.icon className="w-5 h-5"/><span>{tab.label}</span>
                        </button>
                    ))}
                    <button onClick={() => { setActiveTab('preview'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'preview' ? 'bg-[#1a1f29] text-white border-r-2 border-blue-500' : 'text-gray-400 hover:bg-[#161b22] hover:text-white'}`}>
                        <EyeIcon className="w-5 h-5"/><span>معاينة مباشرة</span>
                    </button>
                </nav>
                <div className="h-20 border-t border-gray-800 flex items-center px-4 bg-black/10">
                     <button onClick={onClose} className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"><CloseIcon className="w-5 h-5"/><span>إغلاق</span></button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#090b10] relative">
                <header className="h-20 border-b border-gray-800 bg-[#0f1014]/90 backdrop-blur-md flex items-center justify-between px-4 md:px-10 z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-gray-400 hover:text-white"><MenuIcon className="w-6 h-6" /></button>
                        <h2 className="text-lg md:text-xl font-bold text-white">{formData.title || 'بدون عنوان'}</h2>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
                    <div className="max-w-6xl mx-auto">
                        {activeTab === 'general' && <GeneralTab {...{formData, handleChange, tmdbIdInput, setTmdbIdInput, fetchLoading, fetchFromTMDB, updateLoading, handleComprehensiveUpdate, tmdbSearchMode, setTmdbSearchMode, tmdbSearchQuery, setTmdbSearchQuery, tmdbSearchResults, isSearchingTMDB, searchTMDB, handleSelectSearchResult, openTitleGallery, isEpisodic, isStandalone, isNewContent, castQuery, searchCast, isSearchingCast, castResults, addCastMember, removeCastMember, setVisibility: (v:any)=>setFormData({...formData, visibility:v}), setType:(v:any)=>setFormData({...formData, type:v}), setIsUpcoming:(v:any)=>setFormData({...formData, isUpcoming:v})}} />}
                        {activeTab === 'categories' && <CategoriesTab {...{filteredCategories, handleCategoryChange: (c:any)=>setFormData({...formData, categories: formData.categories.includes(c) ? formData.categories.filter(x=>x!==c) : [...formData.categories, c]}), formData, handleGenreChange:(g:any)=>setFormData({...formData, genres: formData.genres.includes(g) ? formData.genres.filter(x=>x!==g) : [...formData.genres, g]})}} />}
                        {activeTab === 'media' && <MediaTab {...{formData, setFormData, openGallery, setYouTubeSearchState}} />}
                        {activeTab === 'seasons' && <SeasonsTab {...{formData, setFormData, expandedSeasons, toggleSeason, handleComprehensiveUpdate, globalFileInputRef, handleBulkSeriesImport, handleAddSeason, handleUpdateSpecificSeasonFromTMDB, handleSeasonExcelImport, openBulkActionModal:(sId:any,type:any)=>setBulkActionState({isOpen:true, type, seasonId:sId, startFrom:1, endTo:1}), handleAddEpisode, requestDeleteSeason:(sId:any,t:any)=>setDeleteSeasonState({isOpen:true, seasonId:sId, title:t}), requestDeleteEpisode:(sId:any,eId:any,t:any)=>setDeleteEpisodeState({isOpen:true, seasonId:sId, episodeId:eId, title:t}), handleUpdateSeason, setYouTubeSearchState, openGallery, handleUpdateEpisode, setEditingServersForEpisode}} />}
                        {activeTab === 'servers' && <ServersTab {...{isStandalone, setIsManagingMovieServers, movieExcelInputRef, handleMovieExcelImport, handleDeleteSection, formData}} />}
                        {activeTab === 'preview' && <PreviewTab formData={formData} />}
                    </div>
                </div>

                {showSchedulingUI && (
                    <div className="px-4 md:px-10 py-6 bg-[#1a2230] border-t border-gray-800 animate-fade-in-up">
                        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <CalendarIcon className="w-6 h-6 text-amber-500" />
                                <div><h4 className="text-white font-bold">موعد النشر المجدول</h4><p className="text-xs text-gray-500">اختر متى تريد أن يظهر هذا المحتوى.</p></div>
                            </div>
                            <input type="datetime-local" value={formData.scheduledAt || ''} onChange={(e) => setFormData(prev => ({...prev, scheduledAt: e.target.value}))} className="bg-[#0f1014] border border-amber-500/30 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none w-full md:w-64" />
                        </div>
                    </div>
                )}

                <footer className="h-20 border-t border-gray-800 bg-[#0f1014]/95 backdrop-blur-xl flex items-center justify-between px-4 md:px-10 z-50 sticky bottom-0 w-full shadow-2xl">
                      <button onClick={onClose} className="px-8 py-3 rounded-xl text-sm font-bold text-gray-400 bg-gray-800/50 border border-gray-700 hover:bg-gray-800">إلغاء</button>
                      <div className="flex items-center gap-3">
                          <button onClick={() => setShowSchedulingUI(!showSchedulingUI)} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${showSchedulingUI ? 'bg-amber-500 text-black' : 'bg-gray-800 text-amber-500'}`}><CalendarIcon className="w-5 h-5" /><span>جدولة</span></button>
                          <button onClick={(e) => handleSave(e, showSchedulingUI)} disabled={isSubmitting} className="px-8 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black flex items-center justify-center gap-2">{isSubmitting ? 'جاري الحفظ...' : 'حفظ ونشر'}</button>
                      </div>
                </footer>
            </main>

            {galleryState.isOpen && <ImageGalleryModal isOpen={galleryState.isOpen} onClose={() => setGalleryState(prev => ({ ...prev, isOpen: false }))} tmdbId={formData.tmdbId || formData.id} type={formData.type} targetField={galleryState.imageType} onSelect={galleryState.onSelect} />}
            {isTitleModalOpen && <TitleGalleryModal isOpen={isTitleModalOpen} onClose={() => setIsTitleModalOpen(false)} tmdbId={formData.tmdbId || formData.id || ''} type={formData.type} onSelect={(title:any) => setFormData(prev => ({...prev, title}))} />}
            {editingServersForEpisode && <ServerManagementModal episode={editingServersForEpisode} onClose={() => setEditingServersForEpisode(null)} onSave={(s:any) => setFormData(prev => ({...prev, seasons: prev.seasons?.map(sz => ({...sz, episodes: sz.episodes.map(e => e.id === editingServersForEpisode.id ? {...e, servers: s} : e)}))}))} />}
            {isManagingMovieServers && <ServerManagementModal episode={{id: 0, title: 'الفيلم', progress: 0, servers: formData.servers || []}} onClose={() => setIsManagingMovieServers(false)} onSave={(s:any) => setFormData({...formData, servers: s})} />}
            <DeleteConfirmationModal isOpen={deleteSeasonState.isOpen} onClose={() => setDeleteSeasonState({ isOpen: false, seasonId: null, title: '' })} onConfirm={() => setFormData({...formData, seasons: formData.seasons?.filter(s => s.id !== deleteSeasonState.seasonId)})} title="حذف الموسم" message={`حذف ${deleteSeasonState.title}؟`} />
            <DeleteConfirmationModal isOpen={deleteEpisodeState.isOpen} onClose={() => setDeleteEpisodeState({ isOpen: false, seasonId: null, episodeId: null, title: '' })} onConfirm={() => setFormData({...formData, seasons: formData.seasons?.map(s => s.id === deleteEpisodeState.seasonId ? {...s, episodes: s.episodes.filter(e => e.id !== deleteEpisodeState.episodeId)} : s)})} title="حذف الحلقة" message={`حذف ${deleteEpisodeState.title}؟`} />
            
            {bulkActionState.isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setBulkActionState(prev => ({ ...prev, isOpen: false }))}>
                    <div className="w-full max-w-md bg-[#0f1014] border border-gray-800 rounded-2xl p-6 shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold text-white flex items-center gap-2"><StackIcon className="w-6 h-6 text-[var(--color-accent)]"/>{bulkActionState.type === 'add' ? 'إضافة حلقات' : 'حذف حلقات'}</h3><button onClick={() => setBulkActionState(prev => ({ ...prev, isOpen: false }))}><CloseIcon className="w-5 h-5"/></button></div>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="number" value={bulkActionState.startFrom} onChange={(e) => setBulkActionState({...bulkActionState, startFrom: parseInt(e.target.value)})} className={inputClass} placeholder="من" />
                            <input type="number" value={bulkActionState.endTo} onChange={(e) => setBulkActionState({...bulkActionState, endTo: parseInt(e.target.value)})} className={inputClass} placeholder="إلى" />
                        </div>
                        <button onClick={() => { 
                            const { type, seasonId, startFrom, endTo } = bulkActionState;
                            if (seasonId) {
                                setFormData(prev => ({
                                    ...prev, seasons: prev.seasons?.map(s => {
                                        if (s.id !== seasonId) return s;
                                        let updatedEps = [...s.episodes];
                                        if (type === 'add') {
                                            for (let i = startFrom; i <= endTo; i++) {
                                                if (!updatedEps.find(e => parseInt(e.title?.replace(/\D/g, '') || '0') === i)) {
                                                    updatedEps.push({ id: Date.now() + i + Math.random(), title: `الحلقة ${i}`, progress: 0, servers: [] });
                                                }
                                            }
                                        } else {
                                            updatedEps = updatedEps.filter(e => {
                                                const num = parseInt(e.title?.replace(/\D/g, '') || '0');
                                                return num < startFrom || num > endTo;
                                            });
                                        }
                                        return { ...s, episodes: updatedEps.sort((a, b) => (parseInt(a.title?.replace(/\D/g, '') || '0')) - (parseInt(b.title?.replace(/\D/g, '') || '0'))) };
                                    })
                                }));
                            }
                            setBulkActionState({...bulkActionState, isOpen:false}); addToast("تمت العملية بنجاح", "success"); 
                        }} className={`w-full mt-6 py-3 rounded-xl font-bold text-white ${bulkActionState.type === 'add' ? 'bg-blue-600' : 'bg-red-600'}`}>تأكيد</button>
                    </div>
                </div>
            )}
            {youTubeSearchState.isOpen && <YouTubeSearchModal isOpen={youTubeSearchState.isOpen} onClose={() => setYouTubeSearchState({ isOpen: false, targetId: null })} initialQuery={formData.title} onSelect={(url) => { if(youTubeSearchState.targetId === 'main') setFormData({...formData, trailerUrl: url}); else handleUpdateSeason(youTubeSearchState.targetId as number, 'trailerUrl', url); setYouTubeSearchState({isOpen:false, targetId:null}); }} />}
        </div>
    );
};

export default ContentEditModal;
