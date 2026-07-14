import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { db, generateSlug } from '../../firebase';
import type { Content, Season, Episode, Server } from '../../types';
import { ContentType } from '../../types';
import { SearchIcon, TableCellsIcon, ArrowUpTrayIcon, ExcelIcon, RefreshIcon, TrashIcon } from './AdminIcons';
import { normalizeText } from '../../utils/textUtils';
import { fetchTMDB } from '../../utils/tmdbService';
import { BouncingDotsLoader } from '../shared/BouncingDotsLoader';
import { 
    Filter, 
    Calendar, 
    Film, 
    Tv, 
    Play, 
    Moon, 
    Link, 
    Download, 
    SlidersHorizontal, 
    AlertCircle, 
    Info, 
    ChevronDown,
    XCircle,
    RotateCcw,
    Check,
    Layers,
    Sparkles,
    LayoutGrid,
    List,
    Star,
    Edit3,
    Trash2,
    Eye
} from 'lucide-react';

const API_KEY = 'b8d66e320b334f4d56728d98a7e39697';
const LANG = 'ar-SA';

import { SYSTEM_CATEGORIES, FILTER_ITEMS } from './FilterConfig';

const getTypeMeta = (type: string) => {
    switch (type) {
        case ContentType.Movie: return { label: 'فيلم', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-blue-500/10' };
        case ContentType.Series: return { label: 'مسلسل', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-500/10' };
        case ContentType.Program: return { label: 'برنامج', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-indigo-500/10' };
        case ContentType.Concert: return { label: 'حفلة', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-teal-500/10' };
        case ContentType.Play: return { label: 'مسرحية', color: 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-pink-500/10' };
        default: return { label: type || 'أخرى', color: 'bg-gray-500/20 text-gray-300 border-gray-500/40' };
    }
};

interface ContentManagementTabProps {
    onEdit: (content: Content) => void;
    onNew: () => void;
    onRequestDelete: (id: string, title: string) => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    onBulkSuccess: () => void;
    refreshKey: number;
}

const ContentManagementTab: React.FC<ContentManagementTabProps> = ({ 
    onEdit, 
    onNew, 
    onRequestDelete, 
    addToast, 
    onBulkSuccess,
    refreshKey
}) => { 
    const [searchTerm, setSearchTerm] = useState(''); 
    const [allContent, setAllContent] = useState<Content[] | null>(null);
    const [isInternalLoading, setIsInternalLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [localRefreshKey, setLocalRefreshKey] = useState(0);

    // 🌟 خيار التخطيط الجديد (شبكة أم كروت أفقية)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isFilterBoxVisible, setIsFilterBoxVisible] = useState<boolean>(false);

    // Filter states
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'recently-updated' | 'newest' | 'oldest' | 'rating' | 'alphabetical'>('recently-updated');

    // Custom Dropdown states and refs
    const [isSmartFilterOpen, setIsSmartFilterOpen] = useState(false);
    const [isMultiFilterOpen, setIsMultiFilterOpen] = useState(false);
    const smartDropdownRef = useRef<HTMLDivElement>(null);
    const multiDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (smartDropdownRef.current && !smartDropdownRef.current.contains(event.target as Node)) {
                setIsSmartFilterOpen(false);
            }
            if (multiDropdownRef.current && !multiDropdownRef.current.contains(event.target as Node)) {
                setIsMultiFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const itemsPerPage = viewMode === 'grid' ? 20 : 12;
    const pagesPerGroup = 10;
    const excelInputRef = useRef<HTMLInputElement>(null); 
    const [processingExcel, setProcessingExcel] = useState(false); 
    const [progress, setProgress] = useState(''); 

    const hasWatchLinks = (c: Content): boolean => {
        if (!c) return false;
        const isEpisodic = c?.type === 'series' || c?.type === 'program';
        if (!isEpisodic) {
            return !!(c?.servers && c.servers.some(s => s?.url && s.url.trim() !== ''));
        } else {
            return !!(c?.seasons && c.seasons.some(s => s?.episodes && s.episodes.some(ep => ep?.servers && ep.servers.some(srv => srv?.url && srv.url.trim() !== ''))));
        }
    };

    const hasDownloadLinks = (c: Content): boolean => {
        if (!c) return false;
        const isEpisodic = c?.type === 'series' || c?.type === 'program';
        if (!isEpisodic) {
            return !!(c?.servers && c.servers.some(s => s?.downloadUrl && s.downloadUrl.trim() !== ''));
        } else {
            return !!(c?.seasons && c.seasons.some(s => s?.episodes && s.episodes.some(ep => ep?.servers && ep.servers.some(srv => srv?.downloadUrl && srv.downloadUrl.trim() !== ''))));
        }
    };

    const executeMatch = useCallback((item: any, content: Content, hasWatch: boolean, hasDownload: boolean) => {
        if (!content || !item || typeof item.match !== 'function') return false;
        try {
            if (item.match.length === 1) {
                return item.match({
                    content,
                    hasWatch,
                    hasDownload,
                    hasPoster: !!(content?.poster && (!content?.seasons || content.seasons.every(s => s?.poster && s.poster.trim() !== ''))),
                    isPublished: content?.visibility === 'general'
                });
            }
            return item.match(content, hasWatch, hasDownload);
        } catch (e) {
            return false;
        }
    }, []);

    useEffect(() => {
        const loadAll = async () => {
            setIsInternalLoading(true);
            try {
                const snap = await db.collection("content").get();
                const docs = snap.docs.map(d => ({ ...d.data(), id: d.id })) as Content[];
                setAllContent(docs);
            } catch (e) {
                console.error("Error fetching content:", e);
                addToast("خطأ في جلب البيانات من السيرفر", "error");
            }
            setIsInternalLoading(false);
        };
        loadAll();
    }, [refreshKey, localRefreshKey, addToast]);

    const safeContentList = React.useMemo(() => {
        return (allContent || []).filter(item => item != null && typeof item === 'object');
    }, [allContent]);

    const uniqueYears = React.useMemo(() => {
        const yearsSet = new Set<number>();
        safeContentList.forEach(c => {
            if (c?.releaseYear) {
                yearsSet.add(c.releaseYear);
            }
        });
        return Array.from(yearsSet).sort((a, b) => b - a).map(String);
    }, [safeContentList]);

    const filterCounts = React.useMemo(() => {
        const counts: Record<string, number> = {};
        FILTER_ITEMS.forEach(item => {
            counts[item.key] = 0;
        });
        SYSTEM_CATEGORIES.forEach(cat => {
            counts[cat] = 0;
        });
        
        safeContentList.forEach(c => {
            const hasWatch = hasWatchLinks(c);
            const hasDownload = hasDownloadLinks(c);
            
            FILTER_ITEMS.forEach(item => {
                if (executeMatch(item, c, hasWatch, hasDownload)) {
                    counts[item.key]++;
                }
            });
            
            if (Array.isArray(c?.categories)) {
                c.categories.forEach(cat => {
                    if (counts[cat] !== undefined) {
                        counts[cat]++;
                    } else {
                        counts[cat] = 1;
                    }
                });
            }
        });
        return counts;
    }, [safeContentList, executeMatch]);

    const processedFilteredContent = React.useMemo(() => {
        let result = [...safeContentList];

        if (searchTerm.trim() !== '') {
            const normalizedQuery = normalizeText(searchTerm);
            result = result.filter(c => normalizeText(c?.title || '').includes(normalizedQuery));
        }

        const matchedFilter = FILTER_ITEMS.find(item => item.key === activeFilter);
        if (matchedFilter) {
            result = result.filter(c => executeMatch(matchedFilter, c, hasWatchLinks(c), hasDownloadLinks(c)));
        } else if (activeFilter !== 'all') {
            result = result.filter(c => Array.isArray(c?.categories) && c.categories.includes(activeFilter as any));
        }

        if (selectedCategories.length > 0) {
            result = result.filter(c => 
                Array.isArray(c?.categories) && selectedCategories.some(cat => c.categories.includes(cat as any))
            );
        }

        if (selectedYear !== 'all') {
            const yr = parseInt(selectedYear);
            result = result.filter(c => c?.releaseYear === yr);
        }

        if (selectedType !== 'all') {
            result = result.filter(c => c?.type === selectedType);
        }

        result.sort((a, b) => {
            if (sortBy === 'recently-updated') {
                const timeA = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
                const timeB = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
                return timeB - timeA;
            } else if (sortBy === 'newest') {
                return (b?.releaseYear || 0) - (a?.releaseYear || 0);
            } else if (sortBy === 'oldest') {
                return (a?.releaseYear || 0) - (b?.releaseYear || 0);
            } else if (sortBy === 'rating') {
                return (b?.rating || 0) - (a?.rating || 0);
            } else if (sortBy === 'alphabetical') {
                return (a?.title || '').localeCompare(b?.title || '', 'ar');
            }
            return 0;
        });

        return result;
    }, [safeContentList, searchTerm, activeFilter, selectedCategories, selectedYear, selectedType, sortBy, executeMatch]);

    const totalItems = processedFilteredContent.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const pagedItems = React.useMemo(() => {
        return processedFilteredContent.slice(startIndex, startIndex + itemsPerPage);
    }, [processedFilteredContent, startIndex, itemsPerPage]);

    const currentGroup = Math.floor((currentPage - 1) / pagesPerGroup);

    const generateExcelTemplate = () => { const moviesHeader = ["TMDB_ID", "Title", "Description", "Year", "Rating", "Genres", "Poster_URL", "Backdrop_URL", "Logo_URL", "Watch_Server_1", "Watch_Server_2", "Watch_Server_3", "Watch_Server_4", "Download_Link"]; const episodesHeader = ["Series_TMDB_ID", "Series_Name", "Season_Number", "Episode_Number", "Episode_Title", "Watch_Server_1", "Watch_Server_2", "Download_Link"]; const wb = XLSX.utils.book_new(); const wsMovies = XLSX.utils.aoa_to_sheet([moviesHeader]); const wsEpisodes = XLSX.utils.aoa_to_sheet([episodesHeader]); XLSX.utils.book_append_sheet(wb, wsMovies, "Movies"); XLSX.utils.book_append_sheet(wb, wsEpisodes, "Episodes"); XLSX.writeFile(wb, "cinematix_import_template.xlsx"); }; 
    const fetchTMDBData = async (id: string, type: 'movie' | 'tv') => { if (!id) return null; try { const res = await fetchTMDB(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=${LANG}&append_to_response=images,credits`); if (!res.ok) return null; return await res.json(); } catch (e) { console.error("TMDB Fetch Error:", e); return null; } }; 
    
    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { 
        const file = e.target.files?.[0]; 
        if (!file) return; 
        setProcessingExcel(true); 
        setProgress('جاري قراءة الملف...'); 
        const reader = new FileReader(); 
        reader.onload = async (evt) => { 
            try { 
                const data = new Uint8Array(evt.target?.result as ArrayBuffer); 
                const workbook = XLSX.read(data, { type: 'array' }); 
                if (workbook.Sheets['Movies']) { 
                    const movies = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Movies']); 
                    let count = 0; 
                    const batch = db.batch(); 
                    let batchCount = 0; 
                    for (const row of movies) { 
                        count++; 
                        setProgress(`معالجة الفيلم ${count} من ${movies.length}...`); 
                        let movieData: any = {}; 
                        if (row.TMDB_ID) { 
                            const tmdb = await fetchTMDBData(String(row.TMDB_ID), 'movie'); 
                            if (tmdb) { 
                                movieData = { 
                                    title: tmdb.title, 
                                    description: tmdb.overview, 
                                    poster: tmdb.poster_path ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}` : '', 
                                    backdrop: tmdb.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdb.backdrop_path}` : '', 
                                    rating: tmdb.vote_average ? Number((tmdb.vote_average / 2).toFixed(1)) : 0, 
                                    releaseYear: tmdb.release_date ? new Date(tmdb.release_date).getFullYear() : new Date().getFullYear(), 
                                    genres: tmdb.genres?.map((g: any) => g.name) || [], 
                                    cast: tmdb.credits?.cast?.slice(0, 5).map((c: any) => c.name) || [] 
                                }; 
                            } 
                        } 
                        if (row.Title) movieData.title = row.Title; 
                        if (row.Description) movieData.description = row.Description; 
                        if (row.Year) movieData.releaseYear = parseInt(String(row.Year)); 
                        if (row.Rating) movieData.rating = parseFloat(String(row.Rating)); 
                        if (row.Poster_URL) movieData.poster = row.Poster_URL; 
                        if (row.Backdrop_URL) movieData.backdrop = row.Backdrop_URL; 
                        if (row.Logo_URL) { movieData.logoUrl = row.Logo_URL; movieData.isLogoEnabled = true; } 
                        if (row.Genres) movieData.genres = row.Genres.split(',').map((g: string) => g.trim()); 
                        const servers: Server[] = []; 
                        if (row.Watch_Server_1) servers.push({ id: 1, name: "سيرفر 1", url: row.Watch_Server_1, downloadUrl: "", isActive: true }); 
                        if (row.Watch_Server_2) servers.push({ id: 2, name: "سيرفر 2", url: row.Watch_Server_2, downloadUrl: "", isActive: true }); 
                        if (row.Watch_Server_3) servers.push({ id: 3, name: "سيرفر 3", url: row.Watch_Server_3, downloadUrl: "", isActive: true }); 
                        if (row.Watch_Server_4) servers.push({ id: 4, name: "سيرفر 4", url: row.Watch_Server_4, downloadUrl: "", isActive: true }); 
                        if (row.Download_Link) servers.forEach(s => s.downloadUrl = row.Download_Link); 
                        const finalMovie: Content = { 
                            id: row.TMDB_ID ? String(row.TMDB_ID) : String(Date.now() + Math.random()), 
                            type: ContentType.Movie, 
                            title: movieData.title || 'New Movie', 
                            description: movieData.description || '', 
                            poster: movieData.poster || '', 
                            backdrop: movieData.backdrop || '', 
                            rating: movieData.rating || 0, 
                            releaseYear: movieData.releaseYear || new Date().getFullYear(), 
                            genres: movieData.genres || [], 
                            categories: ['افلام اجنبية'], 
                            cast: movieData.cast || [], 
                            visibility: 'general', 
                            ageRating: '', 
                            servers: servers, 
                            seasons: [], 
                            createdAt: new Date().toISOString(), 
                            updatedAt: new Date().toISOString(), 
                            slug: generateSlug(movieData.title || ''), 
                            logoUrl: movieData.logoUrl, 
                            isLogoEnabled: movieData.isLogoEnabled 
                        }; 
                        const ref = db.collection("content").doc(finalMovie.id); 
                        batch.set(ref, finalMovie, { merge: true }); 
                        batchCount++; 
                        if (batchCount >= 400) { await batch.commit(); batchCount = 0; } 
                    } 
                    if (batchCount > 0) await batch.commit(); 
                } 
                if (workbook.Sheets['Episodes']) { 
                    const episodes = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Episodes']); 
                    const seriesGroups: Record<string, any[]> = {}; 
                    episodes.forEach(ep => { 
                        const key = ep.Series_TMDB_ID || ep.Series_Name || 'Unknown'; 
                        if (!seriesGroups[key]) seriesGroups[key] = []; 
                        seriesGroups[key].push(ep); 
                    }); 
                    const epBatch = db.batch(); 
                    let epBatchCount = 0; 
                    let seriesCount = 0; 
                    for (const [seriesKey, epRows] of Object.entries(seriesGroups)) { 
                        seriesCount++; 
                        setProgress(`معالجة المسلسل ${seriesCount} من ${Object.keys(seriesGroups).length}...`); 
                        let seriesDoc: any = null; 
                        let seriesId = String(seriesKey); 
                        const existingSnap = await db.collection("content").doc(seriesId).get(); 
                        if (existingSnap.exists) { 
                            seriesDoc = { ...existingSnap.data(), id: existingSnap.id }; 
                        } else { 
                            let tmdbSeries: any = null; 
                            if (!isNaN(Number(seriesKey))) { 
                                tmdbSeries = await fetchTMDBData(String(seriesKey), 'tv'); 
                            } 
                            seriesDoc = { 
                                id: seriesId, 
                                type: ContentType.Series, 
                                title: tmdbSeries?.name || epRows[0].Series_Name || 'New Series', 
                                description: tmdbSeries?.overview || '', 
                                poster: tmdbSeries?.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbSeries.poster_path}` : '', 
                                backdrop: tmdbSeries?.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbSeries.backdrop_path}` : '', 
                                rating: tmdbSeries?.vote_average ? Number((tmdbSeries.vote_average / 2).toFixed(1)) : 0, 
                                releaseYear: tmdbSeries?.first_air_date ? new Date(tmdbSeries.first_air_date).getFullYear() : new Date().getFullYear(), 
                                genres: tmdbSeries?.genres?.map((g: any) => g.name) || [], 
                                categories: ['مسلسلات اجنبية'], 
                                seasons: [], 
                                visibility: 'general', 
                                createdAt: new Date().toISOString(), 
                                updatedAt: new Date().toISOString(), 
                                slug: generateSlug(tmdbSeries?.name || epRows[0].Series_Name || '') 
                            }; 
                        } 
                        if (!seriesDoc.seasons) seriesDoc.seasons = []; 
                        for (const ep of epRows) { 
                            const sNum = parseInt(String(ep.Season_Number)) || 1; 
                            const eNum = parseInt(String(ep.Episode_Number)) || 1; 
                            let season = seriesDoc.seasons.find((s: Season) => s.seasonNumber === sNum); 
                            if (!season) { 
                                season = { id: Date.now() + Math.random(), seasonNumber: sNum, title: `الموسم ${sNum}`, episodes: [] }; 
                                seriesDoc.seasons.push(season); 
                            } 
                            const episodeObj: Episode = { 
                                id: Date.now() + Math.random(), 
                                title: ep.Episode_Title || `الحلقة ${eNum}`, 
                                thumbnail: seriesDoc.backdrop || '', 
                                duration: "45:00", 
                                progress: 0, 
                                servers: [] 
                            }; 
                            if (ep.Watch_Server_1) episodeObj.servers.push({ id: 1, name: "سيرفر 1", url: ep.Watch_Server_1, downloadUrl: ep.Download_Link || "", isActive: true }); 
                            if (ep.Watch_Server_2) episodeObj.servers.push({ id: 2, name: "سيرفر 2", url: ep.Watch_Server_2, downloadUrl: "", isActive: true }); 
                            const existingEpIndex = season.episodes.findIndex((e: Episode) => e.title?.includes(`${eNum}`) || e.title === ep.Episode_Title); 
                            if (existingEpIndex > -1) { 
                                season.episodes[existingEpIndex] = { ...season.episodes[existingEpIndex], ...episodeObj, servers: [...season.episodes[existingEpIndex].servers, ...episodeObj.servers] }; 
                            } else { 
                                season.episodes.push(episodeObj); 
                            } 
                        } 
                        seriesDoc.seasons.sort((a: Season, b: Season) => a.seasonNumber - b.seasonNumber); 
                        seriesDoc.seasons.forEach((s: Season) => { 
                            s.episodes.sort((a: Episode, b: Episode) => { 
                                const numA = parseInt(a.title?.replace(/\D/g, '') || '0'); 
                                const numB = parseInt(b.title?.replace(/\D/g, '') || '0'); 
                                return numA - numB; 
                            }); 
                        }); 
                        const ref = db.collection("content").doc(seriesDoc.id); 
                        epBatch.set(ref, seriesDoc, { merge: true }); 
                        epBatchCount++; 
                        if (epBatchCount >= 300) { await epBatch.commit(); epBatchCount = 0; } 
                    } 
                    if (epBatchCount > 0) await epBatch.commit(); 
                } 
                addToast('تم استيراد البيانات من Excel بنجاح!', 'success'); 
                onBulkSuccess(); 
                setLocalRefreshKey(prev => prev + 1);
                setCurrentPage(1);
            } catch (err) { 
                console.error("Excel Import Error:", err); 
                addToast('حدث خطأ أثناء معالجة ملف Excel.', 'error'); 
            } finally { 
                setProcessingExcel(false); 
                setProgress(''); 
                if (excelInputRef.current) excelInputRef.current.value = ''; 
            } 
        }; 
        reader.readAsArrayBuffer(file); 
    }; 
    
    const pageNumbersInGroup = Array.from(
        { length: Math.min(pagesPerGroup, totalPages - currentGroup * pagesPerGroup) },
        (_, i) => currentGroup * pagesPerGroup + i + 1
    );

    const hasNextGroup = (currentGroup + 1) * pagesPerGroup < totalPages;
    const hasPrevGroup = currentGroup > 0;

    return (
        <div className="space-y-8" dir="rtl">
            {/* شريط البحث العلوي وأزرار التحكم */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-gray-900/90 backdrop-blur-xl p-6 rounded-3xl border border-gray-800 shadow-2xl">
                <div className="relative w-full md:w-auto md:min-w-[420px]">
                    <input 
                        type="text" 
                        placeholder="ابحث بالاسم في كامل قاعدة البيانات..." 
                        value={searchTerm} 
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }} 
                        className="w-full bg-gray-950/80 border border-gray-800 rounded-2xl px-12 py-3.5 focus:outline-none focus:border-[#00A7F8] focus:ring-2 focus:ring-[#00A7F8]/20 text-white placeholder-gray-500 shadow-inner transition-all text-sm font-medium"
                    />
                    <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                            مسح
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                    <button 
                        onClick={() => setIsFilterBoxVisible(!isFilterBoxVisible)} 
                        className={`flex items-center justify-center gap-2 font-bold py-3.5 px-5 rounded-2xl transition-all text-xs border shadow-md cursor-pointer ${
                            isFilterBoxVisible 
                                ? 'bg-gradient-to-r from-[#00A7F8]/20 to-blue-500/10 border-[#00A7F8]/40 text-[#00A7F8]' 
                                : 'bg-gray-800/80 hover:bg-gray-700 text-gray-200 border-gray-700'
                        }`}
                    >
                        <Filter className="w-4 h-4" />
                        <span>{isFilterBoxVisible ? 'إخفاء الفلترة' : 'تفعيل الفلترة والتصنيف'}</span>
                        {(activeFilter !== 'all' || selectedCategories.length > 0 || selectedYear !== 'all' || selectedType !== 'all') && (
                            <span className="w-2 h-2 rounded-full bg-[#00FFB0] animate-pulse" />
                        )}
                    </button>
                    <button onClick={generateExcelTemplate} className="flex items-center justify-center gap-2 bg-gray-800/80 hover:bg-gray-700 text-gray-200 font-bold py-3.5 px-5 rounded-2xl transition-all text-xs border border-gray-700 shadow-md cursor-pointer"><TableCellsIcon /><span className="hidden sm:inline">تحميل نموذج Excel</span></button>
                    <input type="file" accept=".xlsx, .xls" ref={excelInputRef} onChange={handleExcelUpload} className="hidden" />
                    <button onClick={() => excelInputRef.current?.click()} disabled={processingExcel} className="flex items-center justify-center gap-2 bg-gray-800/80 hover:bg-gray-700 text-gray-200 font-bold py-3.5 px-5 rounded-2xl transition-all text-xs disabled:opacity-50 border border-gray-700 shadow-md cursor-pointer"><ArrowUpTrayIcon /><span className="hidden sm:inline">{processingExcel ? 'جاري المعالجة...' : 'استيراد من Excel'}</span></button>
                    <button onClick={onNew} className="flex-1 md:flex-none bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-black py-3.5 px-8 rounded-2xl hover:shadow-[0_0_25px_rgba(0,167,248,0.4)] transition-all transform hover:-translate-y-0.5 whitespace-nowrap text-sm flex items-center justify-center gap-2 cursor-pointer">
                        <Sparkles className="w-4 h-4 fill-current" />
                        <span>إضافة محتوى</span>
                    </button>
                </div>
            </div>

            {/* 🌟 لوحة الفلاتر الذكية المطورة */}
            {isFilterBoxVisible && (
                <div className={`bg-gray-900 border border-gray-800/90 rounded-[2rem] p-6 md:p-8 shadow-2xl relative ${isSmartFilterOpen || isMultiFilterOpen ? 'z-50' : 'z-20'} animate-fade-in`}>
                    <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#00A7F8]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#00FFB0]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-gray-800/80 pb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00A7F8]/20 to-[#00FFB0]/10 border border-[#00A7F8]/30 flex items-center justify-center text-[#00A7F8] shadow-lg shadow-[#00A7F8]/5">
                                    <SlidersHorizontal className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-white font-extrabold text-lg md:text-xl tracking-wide">نظام الفلترة والتحكم المتقدم</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">تصنيف وفحص سريع لكامل محتوى المنصة بسهولة</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-950/90 border border-gray-800 px-4 py-2 rounded-2xl shadow-inner self-start sm:self-center">
                                <span className="w-2 h-2 rounded-full bg-[#00FFB0] animate-pulse"></span>
                                <span className="text-xs text-gray-300 font-bold">
                                    إجمالي العناصر: <strong className="text-[#00FFB0] font-mono text-sm ml-1">{safeContentList.length}</strong>
                                </span>
                            </div>
                        </div>

                        {/* حقول الفلترة الذكية والتصنيفات */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-gray-800/60">
                            {/* الفلترة الذكية الشاملة */}
                            <div className="flex flex-col gap-2 relative" ref={smartDropdownRef}>
                                <label className="text-xs text-gray-300 font-bold flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-[#00A7F8]" />
                                    <span>الفلترة الذكية الشاملة (اختر واحدة)</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSmartFilterOpen(!isSmartFilterOpen);
                                        setIsMultiFilterOpen(false);
                                    }}
                                    className={`w-full bg-gray-950/90 border rounded-2xl px-5 py-3.5 text-xs md:text-sm text-gray-200 flex items-center justify-between cursor-pointer focus:outline-none transition-all duration-200 shadow-md ${
                                        isSmartFilterOpen 
                                            ? 'border-[#00A7F8] ring-4 ring-[#00A7F8]/10 bg-gray-900' 
                                            : 'border-gray-800/90 hover:border-gray-700 hover:bg-gray-900/50'
                                    }`}
                                >
                                    <span className="font-extrabold flex items-center gap-2.5 text-right truncate">
                                        <span className="text-base">
                                            {FILTER_ITEMS.find(item => item.key === activeFilter)?.icon || '✨'}
                                        </span>
                                        <span>
                                            {FILTER_ITEMS.find(item => item.key === activeFilter)?.label || 'اختر الفلترة الذكية...'}
                                        </span>
                                    </span>
                                    <ChevronDown className={`text-gray-400 w-4 h-4 shrink-0 transition-transform duration-300 ${isSmartFilterOpen ? 'rotate-180 text-[#00A7F8]' : ''}`} />
                                </button>

                                {isSmartFilterOpen && (
                                    <div className="absolute right-0 top-[calc(100%+8px)] w-full bg-[#0f172a]/95 border border-gray-700/80 rounded-2xl p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[9999] max-h-[460px] overflow-y-auto custom-scrollbar backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="space-y-1">
                                            {FILTER_ITEMS.map((item) => {
                                                const isSelected = activeFilter === item.key;
                                                return (
                                                    <button
                                                        key={item.key}
                                                        type="button"
                                                        onClick={() => {
                                                            setActiveFilter(item.key);
                                                            setIsSmartFilterOpen(false);
                                                            setCurrentPage(1);
                                                        }}
                                                        className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all duration-150 cursor-pointer text-right group ${
                                                            isSelected
                                                                ? 'bg-gradient-to-r from-[#00A7F8] to-[#00A7F8]/80 text-white font-extrabold shadow-lg shadow-[#00A7F8]/20'
                                                                : 'text-gray-300 hover:bg-gray-800/80 hover:text-white'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5 truncate">
                                                            <span className="text-base shrink-0 group-hover:scale-110 transition-transform">{item.icon}</span>
                                                            <span className="truncate">{item.label}</span>
                                                        </div>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ml-2 transition-colors ${
                                                            isSelected ? 'bg-black/30 text-white border border-white/20' : 'bg-gray-900 text-gray-400 group-hover:bg-gray-700 group-hover:text-gray-200'
                                                        }`}>
                                                            {filterCounts[item.key] || 0}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* التصنيفات التفصيلية المتعددة */}
                            <div className="flex flex-col gap-2 relative" ref={multiDropdownRef}>
                                <label className="text-xs text-gray-300 font-bold flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-[#00FFB0]" />
                                    <span>تصنيفات تفصيلية ومخصصة (اختيار متعدد)</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsMultiFilterOpen(!isMultiFilterOpen);
                                        setIsSmartFilterOpen(false);
                                    }}
                                    className={`w-full bg-gray-950/90 border rounded-2xl px-5 py-3.5 text-xs md:text-sm text-gray-200 flex items-center justify-between cursor-pointer focus:outline-none transition-all duration-200 shadow-md ${
                                        isMultiFilterOpen 
                                            ? 'border-[#00FFB0] ring-4 ring-[#00FFB0]/10 bg-gray-900' 
                                            : 'border-gray-800/90 hover:border-gray-700 hover:bg-gray-900/50'
                                    }`}
                                >
                                    <div className="flex flex-wrap items-center gap-1.5 max-w-[88%] text-right overflow-hidden truncate">
                                        {selectedCategories.length === 0 ? (
                                            <span className="text-gray-500 font-medium">تحديد تصنيفات مخصصة متعددة...</span>
                                        ) : (
                                            selectedCategories.map(cat => (
                                                <span key={cat} className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg px-2 py-0.5 text-[11px] font-extrabold flex items-center gap-1">
                                                    <span>{cat}</span>
                                                </span>
                                            ))
                                        )}
                                    </div>
                                    <ChevronDown className={`text-gray-400 w-4 h-4 shrink-0 transition-transform duration-300 ${isMultiFilterOpen ? 'rotate-180 text-[#00FFB0]' : ''}`} />
                                </button>

                                {isMultiFilterOpen && (
                                    <div className="absolute right-0 top-[calc(100%+8px)] w-full bg-[#0f172a]/95 border border-gray-700/80 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[9999] max-h-[460px] overflow-y-auto custom-scrollbar backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-gray-800">
                                            <div>
                                                <h3 className="text-xs font-extrabold text-white">اختر تصنيفات تفصيلية معينة</h3>
                                                <p className="text-[10px] text-gray-400 mt-0.5">يمكنك تفعيل خيارات متعددة لتصفية مرنة للمحتوى</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setSelectedCategories([])}
                                                    className="text-[11px] font-extrabold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-500/20"
                                                >
                                                    إلغاء تحديد الكل
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        setActiveFilter('all');
                                                        setSelectedCategories([]);
                                                    }}
                                                    className="text-[11px] font-extrabold text-gray-300 hover:text-white transition-colors cursor-pointer bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded-lg border border-gray-700"
                                                >
                                                    إعادة تعيين
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            {SYSTEM_CATEGORIES.map(cat => {
                                                const isSelected = selectedCategories.includes(cat);
                                                return (
                                                    <button
                                                        key={cat}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedCategories(prev => 
                                                                prev.includes(cat) 
                                                                    ? prev.filter(c => c !== cat) 
                                                                    : [...prev, cat]
                                                            );
                                                            setCurrentPage(1);
                                                        }}
                                                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all duration-150 cursor-pointer text-right flex items-center justify-between ${
                                                            isSelected 
                                                                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-500/10 font-extrabold ring-1 ring-emerald-500/50' 
                                                                : 'bg-gray-900/80 border-gray-800 text-gray-300 hover:border-gray-700 hover:bg-gray-800 hover:text-white'
                                                        }`}
                                                    >
                                                        <span className="truncate">{cat}</span>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[3]" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* الفلترة الدقيقة والترتيب */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-2">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-gray-300 font-bold flex items-center gap-1.5">
                                    <Film className="w-3.5 h-3.5 text-[#00A7F8]" />
                                    <span>نوع العمل</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedType}
                                        onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
                                        className="w-full bg-gray-950/90 border border-gray-800 hover:border-gray-700 rounded-2xl px-4 py-3 pl-10 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-[#00A7F8] appearance-none cursor-pointer transition-colors font-medium shadow-sm"
                                    >
                                        <option value="all">كل الأنواع والأشكال</option>
                                        <option value="movie">أفلام</option>
                                        <option value="series">مسلسلات</option>
                                        <option value="program">برامج تلفزيونية</option>
                                        <option value="play">مسرحيات</option>
                                        <option value="concert">حفلات</option>
                                    </select>
                                    <ChevronDown className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-gray-300 font-bold flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-[#00A7F8]" />
                                    <span>سنة الإنتاج والصدور</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
                                        className="w-full bg-gray-950/90 border border-gray-800 hover:border-gray-700 rounded-2xl px-4 py-3 pl-10 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-[#00A7F8] appearance-none cursor-pointer transition-colors font-medium shadow-sm"
                                    >
                                        <option value="all">كل السنين والأعوام</option>
                                        {uniqueYears.map((yr) => (
                                            <option key={yr} value={yr}>{yr}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-gray-300 font-bold flex items-center gap-1.5">
                                    <RotateCcw className="rotate-180 w-3.5 h-3.5 text-[#00A7F8]" />
                                    <span>ترتيب وعرض حسب</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1); }}
                                        className="w-full bg-gray-950/90 border border-gray-800 hover:border-gray-700 rounded-2xl px-4 py-3 pl-10 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-[#00A7F8] appearance-none cursor-pointer transition-colors font-medium shadow-sm"
                                    >
                                        <option value="recently-updated">الأحدث تحديثاً وتعديلاً</option>
                                        <option value="newest">الأحدث إنتاجاً (سنة تنازلية)</option>
                                        <option value="oldest">الأقدم إنتاجاً (سنة تصاعدية)</option>
                                        <option value="rating">الأعلى تقييماً وتصنيفاً</option>
                                        <option value="alphabetical">الترتيب الأبجدي (أ - ي)</option>
                                    </select>
                                    <ChevronDown className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveFilter('all');
                                        setSelectedCategories([]);
                                        setSelectedYear('all');
                                        setSelectedType('all');
                                        setSortBy('recently-updated');
                                        setSearchTerm('');
                                        setCurrentPage(1);
                                        setIsSmartFilterOpen(false);
                                        setIsMultiFilterOpen(false);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 px-4 py-3 rounded-2xl text-xs md:text-sm font-extrabold border border-rose-500/25 hover:border-rose-500/40 transition-all cursor-pointer shadow-sm min-h-[46px]"
                                >
                                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                    <span>إعادة ضبط الفلاتر</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {processingExcel && (<div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 animate-pulse shadow-xl"><div className="flex justify-between mb-3 text-sm text-[#00A7F8] font-extrabold"><span>جاري استيراد البيانات ومعالجتها...</span><span className="font-mono">{progress}</span></div><div className="w-full bg-gray-800 rounded-full h-3.5 p-0.5 border border-gray-700"><div className="bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] h-full rounded-full w-2/3 transition-all duration-500 shadow-[0_0_15px_rgba(0,167,248,0.5)]"></div></div><p className="text-xs text-gray-400 mt-3 text-center">الرجاء عدم إغلاق أو تحديث الصفحة حتى تكتمل العملية بأمان.</p></div>)}
            
            {/* 🌟 شريط التحكم في التخطيط (Grid vs List) ومعلومات النتائج */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-900/60 p-4 rounded-2xl border border-gray-800/80">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <span>عرض المحتوى:</span>
                    <span className="text-[#00FFB0] font-mono font-extrabold bg-gray-800 px-2.5 py-1 rounded-xl border border-gray-700">
                        {totalItems} أعمال مطابقة
                    </span>
                    <span className="text-gray-500">(اضغط على أي كارت في أي مكان لفتح التعديل مباشرة)</span>
                </div>

                <div className="flex items-center gap-2 bg-gray-950/80 p-1 rounded-xl border border-gray-800">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            viewMode === 'grid' 
                                ? 'bg-[#00A7F8] text-black shadow-lg shadow-[#00A7F8]/20 font-black' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                        title="عرض شبكي (كروت)"
                    >
                        <LayoutGrid className="w-4 h-4" />
                        <span>شبكة كروت</span>
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            viewMode === 'list' 
                                ? 'bg-[#00FFB0] text-black shadow-lg shadow-[#00FFB0]/20 font-black' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                        title="عرض أفقي تفصيلي"
                    >
                        <List className="w-4 h-4" />
                        <span>قائمة أفقية</span>
                    </button>
                </div>
            </div>

            {isInternalLoading ? (
                <div className="py-36 flex flex-col items-center justify-center gap-6">
                    <BouncingDotsLoader size="lg" delayMs={300} />
                    <span className="text-gray-400 font-extrabold tracking-widest uppercase text-xs">جاري سحب المحتوى وتشغيل محرك الفلترة...</span>
                </div> 
            ) : (
                <>
                    {totalItems === 0 && (
                        <div className="text-center py-24 text-gray-400 border-2 border-dashed border-gray-800 rounded-[2.5rem] flex flex-col items-center justify-center bg-gray-900/20">
                            <div className="w-16 h-16 rounded-3xl bg-gray-800/60 flex items-center justify-center text-3xl mb-4 border border-gray-700/50 shadow-inner">
                                📂
                            </div>
                            <h3 className="text-lg font-extrabold text-white mb-1">لا يوجد محتوى مطابق</h3>
                            <p className="text-xs text-gray-500 max-w-sm">لم نجد أي أفلام أو مسلسلات تطابق شروط الفلترة أو البحث المحددة حالياً.</p>
                            <button 
                                onClick={() => {
                                    setActiveFilter('all');
                                    setSelectedCategories([]);
                                    setSelectedYear('all');
                                    setSelectedType('all');
                                    setSearchTerm('');
                                }} 
                                className="mt-5 text-xs bg-gray-800 hover:bg-gray-700 text-[#00A7F8] font-extrabold px-5 py-2.5 rounded-xl border border-gray-700 transition-colors cursor-pointer"
                            >
                                إعادة ضبط كل الفلاتر
                            </button>
                        </div>
                    )}

                    {/* 🌟 شبكة المحتوى (تدعم التخطيطين الشبكي والأفقي) */}
                    {viewMode === 'grid' ? (
                        /* التخطيط الرأسي (Grid Cards) */
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {pagedItems.map((c: any) => {
                                if (!c) return null;
                                const meta = getTypeMeta(c.type);
                                return (
                                    <div 
                                        key={c.id || Math.random()} 
                                        onClick={() => onEdit(c)}
                                        className="group relative aspect-[2/3] rounded-3xl overflow-hidden cursor-pointer bg-gray-900 border border-gray-800 shadow-xl hover:shadow-[0_12px_35px_rgba(0,167,248,0.25)] hover:border-[#00A7F8]/40 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-end"
                                    >
                                        <img src={c.poster || '/placeholder.png'} alt={c.title || 'بدون عنوان'} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                                        
                                        {/* شارات علوية */}
                                        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-1">
                                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold backdrop-blur-md border shadow-md ${meta.color}`}>
                                                {meta.label}
                                            </span>
                                            {c.rating > 0 && (
                                                <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md text-amber-400 font-mono text-[11px] font-extrabold px-2 py-1 rounded-xl border border-white/10">
                                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                    <span>{c.rating}</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* تدرج الألوان السفلي والنصوص */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                        
                                        <div className="relative z-10 p-4 transition-transform duration-300 group-hover:-translate-y-1">
                                            <h3 className="text-white font-extrabold text-base md:text-lg leading-tight line-clamp-1 mb-1.5 drop-shadow-md">{c.title || 'بدون عنوان'}</h3>
                                            
                                            <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
                                                <span className="font-mono font-bold bg-black/50 px-2 py-0.5 rounded-md border border-white/10">{c.releaseYear || '----'}</span>
                                                <span className={`font-extrabold text-[11px] ${c.visibility === 'general' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                    {c.visibility === 'general' ? '● عام' : '🔒 مقيد'}
                                                </span>
                                            </div>

                                            {/* أزرار الإجراءات على الكارت */}
                                            <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-30 w-full">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEdit(c);
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-[#00A7F8]/20 hover:bg-[#00A7F8] text-[#00A7F8] hover:text-black border border-[#00A7F8]/30 text-[11px] font-extrabold cursor-pointer transition-all duration-200"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                    <span>تعديل</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRequestDelete(c.id, c.title || 'عنصر');
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-[11px] font-extrabold cursor-pointer transition-all duration-200"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    <span>حذف</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* التخطيط الأفقي المطور (List View) */
                        <div className="flex flex-col gap-4">
                            {pagedItems.map((c: any) => {
                                if (!c) return null;
                                const meta = getTypeMeta(c.type);
                                const primaryGenre = (Array.isArray(c.categories) && c.categories[0]) || (Array.isArray(c.genres) && c.genres[0]) || 'غير مصنف';
                                
                                const isEpisodic = c.type === ContentType.Series || c.type === ContentType.Program;
                                const latestSeason = isEpisodic && c.seasons && c.seasons.length > 0
                                    ? [...c.seasons].sort((a, b) => b.seasonNumber - a.seasonNumber)[0]
                                    : null;
                                const logoSrc = (isEpisodic && latestSeason?.logoUrl) ? latestSeason.logoUrl : c.logoUrl;
                                
                                return (
                                    <div
                                        key={c.id || Math.random()}
                                        onClick={() => onEdit(c)}
                                        className="group bg-gray-900 hover:bg-gray-850 border border-gray-800 hover:border-[#00FFB0]/40 rounded-3xl p-4 md:p-5 flex flex-col sm:flex-row items-center gap-5 cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(0,255,176,0.15)] transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
                                    >
                                        {/* شريط إضاءة جانبي جمالي */}
                                        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#00A7F8] to-[#00FFB0] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                        {/* صورة البوستر الأفقية */}
                                        <div className="w-full sm:w-32 md:w-36 aspect-[2/3] rounded-2xl overflow-hidden shrink-0 bg-gray-950 relative border border-gray-800">
                                            <img src={c.poster || '/placeholder.png'} alt={c.title || 'بدون عنوان'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                                            <span className={`absolute bottom-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-extrabold backdrop-blur-md border ${meta.color}`}>
                                                {meta.label}
                                            </span>
                                        </div>

                                        {/* المحتوى والتفاصيل */}
                                        <div className="flex-1 flex flex-col justify-between self-stretch gap-3 w-full">
                                            <div>
                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                    {logoSrc && logoSrc.trim() !== '' ? (
                                                        <div className="flex items-center min-h-[44px]">
                                                            <img 
                                                                src={logoSrc} 
                                                                alt={c.title || 'لوجو'} 
                                                                className="max-h-12 md:max-h-14 max-w-[160px] md:max-w-[220px] object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105" 
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <h3 className="text-white font-black text-lg md:text-xl group-hover:text-[#00FFB0] transition-colors">{c.title || 'بدون عنوان'}</h3>
                                                    )}
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold bg-gray-950 px-2.5 py-1 rounded-xl text-xs text-gray-300 border border-gray-800">
                                                            📅 {c.releaseYear || '----'}
                                                        </span>
                                                        {c.rating > 0 && (
                                                            <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 font-mono text-xs font-extrabold px-2.5 py-1 rounded-xl border border-amber-500/20">
                                                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                                <span>{c.rating}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* سطرين من القصة والتقييم والبيانات */}
                                                <p className="text-gray-400 text-xs md:text-sm leading-relaxed line-clamp-2 mb-3">
                                                    {c.description ? c.description : 'لا توجد قصة أو نبذة تعريفية مضافة لهذا العمل حالياً...'}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-800/80">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="bg-[#00A7F8]/10 text-[#00A7F8] border border-[#00A7F8]/30 px-3 py-1 rounded-xl text-xs font-extrabold">
                                                        🏷️ {primaryGenre}
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${c.visibility === 'general' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                                        {c.visibility === 'general' ? '● منشور للعامة' : '🔒 مقيد'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                                                    <div className="flex items-center gap-1.5 bg-gray-800 group-hover:bg-[#00FFB0] group-hover:text-black text-gray-300 font-extrabold px-4 py-2 rounded-xl text-xs transition-all duration-200">
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                        <span>تعديل المحتوى</span>
                                                    </div>
                                                    
                                                    {/* زر الحذف المستقل */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onRequestDelete(c.id, c.title || 'عنصر');
                                                        }}
                                                        title="حذف هذا العمل"
                                                        className="bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white p-2 rounded-xl text-xs font-bold border border-rose-500/30 transition-all cursor-pointer shadow-sm hover:scale-105"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* نظام التصفح والصفحات */}
                    {totalPages > 1 && (
                        <div className="flex flex-col items-center gap-6 bg-gray-900/90 backdrop-blur-md p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                {hasPrevGroup && (
                                    <button 
                                        onClick={() => setCurrentPage(currentGroup * pagesPerGroup)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-gray-300 font-extrabold rounded-2xl hover:bg-gray-700 transition-all border border-gray-700 cursor-pointer text-xs shadow-sm"
                                    >
                                        <span className="text-sm rotate-180">«</span>
                                        <span>المجموعة السابقة</span>
                                    </button>
                                )}

                                {pageNumbersInGroup.map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setCurrentPage(num)}
                                        className={`w-12 h-12 rounded-2xl font-black text-sm transition-all border cursor-pointer flex items-center justify-center ${
                                            currentPage === num 
                                                ? 'bg-gradient-to-tr from-[#00A7F8] to-[#00FFB0] text-black border-transparent shadow-[0_0_20px_rgba(0,167,248,0.4)] scale-105' 
                                                : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 hover:bg-gray-800'
                                        }`}
                                    >
                                        {num}
                                    </button>
                                ))}

                                {hasNextGroup && (
                                    <button 
                                        onClick={() => setCurrentPage((currentGroup + 1) * pagesPerGroup + 1)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-gray-300 font-extrabold rounded-2xl hover:bg-gray-700 transition-all border border-gray-700 cursor-pointer text-xs shadow-sm"
                                    >
                                        <span>المجموعة التالية</span>
                                        <span className="text-sm">»</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold text-gray-400 flex-row-reverse bg-gray-950 px-5 py-2.5 rounded-2xl border border-gray-800">
                                <span className="text-white">الصفحة <strong className="text-[#00A7F8] font-mono">{currentPage}</strong> من <strong className="font-mono">{totalPages}</strong></span>
                                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                <span>المطابقة: <strong className="text-emerald-400 font-mono">{totalItems}</strong> عنصر</span>
                                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                <span>الإجمالي الكلي: <strong className="font-mono">{safeContentList.length}</strong></span>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    ); 
};

export default ContentManagementTab;