
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { db, generateSlug } from '../../firebase';
import type { Content, Season, Episode, Server } from '../../types';
import { ContentType } from '../../types';
import { SearchIcon, TableCellsIcon, ArrowUpTrayIcon, ExcelIcon, RefreshIcon, TrashIcon } from './AdminIcons';
import { normalizeText } from '../../utils/textUtils';

const API_KEY = 'b8d66e320b334f4d56728d98a7e39697';
const LANG = 'ar-SA';

const getTypeMeta = (type: string) => {
    switch (type) {
        case ContentType.Movie: return { label: 'فيلم', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
        case ContentType.Series: return { label: 'مسلسل', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
        case ContentType.Program: return { label: 'برنامج', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
        case ContentType.Concert: return { label: 'حفلة', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30' };
        case ContentType.Play: return { label: 'مسرحية', color: 'bg-pink-500/10 text-pink-400 border-pink-500/30' };
        default: return { label: type, color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' };
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
    const [pagedContent, setPagedContent] = useState<Content[]>([]);
    const [isInternalLoading, setIsInternalLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalContentCount, setTotalContentCount] = useState(0);
    
    const itemsPerPage = 20;
    const pagesPerGroup = 10;
    const currentGroup = Math.floor((currentPage - 1) / pagesPerGroup);
    const excelInputRef = useRef<HTMLInputElement>(null); 
    const [processingExcel, setProcessingExcel] = useState(false); 
    const [progress, setProgress] = useState(''); 

    const fetchMetadata = useCallback(async () => {
        try {
            const snap = await db.collection("content").get();
            setTotalContentCount(snap.size);
        } catch (e) { console.error(e); }
    }, []);

    const fetchPage = useCallback(async (page: number) => {
        setIsInternalLoading(true);
        try {
            const query = db.collection("content").orderBy("updatedAt", "desc");
            const offset = (page - 1) * itemsPerPage;
            
            let finalQuery;
            if (offset > 0) {
                const skipSnapshot = await query.limit(offset).get();
                const lastVisible = skipSnapshot.docs[skipSnapshot.docs.length - 1];
                if (lastVisible) {
                    finalQuery = query.startAfter(lastVisible).limit(itemsPerPage);
                } else {
                    finalQuery = query.limit(itemsPerPage);
                }
            } else {
                finalQuery = query.limit(itemsPerPage);
            }

            const snap = await finalQuery.get();
            const docs = snap.docs.map(d => ({ ...d.data(), id: d.id })) as Content[];
            setPagedContent(docs);
        } catch (e) {
            console.error(e);
            addToast("خطأ في جلب الصفحة", "error");
        }
        setIsInternalLoading(false);
    }, [itemsPerPage, addToast]);

    const handleGlobalSearch = useCallback(async () => {
        if (!searchTerm.trim()) return;
        setIsInternalLoading(true);
        try {
            const normalizedQuery = normalizeText(searchTerm);
            const snap = await db.collection("content").get();
            const results = snap.docs
                .map(d => ({ ...d.data(), id: d.id } as Content))
                .filter(c => normalizeText(c.title).includes(normalizedQuery));
            
            setPagedContent(results);
        } catch (e) {
            console.error(e);
        }
        setIsInternalLoading(false);
    }, [searchTerm]);

    // إعادة الجلب عند تغيير الصفحة، مصطلح البحث، أو مفتاح التحديث
    useEffect(() => {
        fetchMetadata();
        if (searchTerm.trim() === '') {
            fetchPage(currentPage);
        } else {
            handleGlobalSearch();
        }
    }, [currentPage, searchTerm, refreshKey, fetchPage, handleGlobalSearch, fetchMetadata]);

    const generateExcelTemplate = () => { const moviesHeader = ["TMDB_ID", "Title", "Description", "Year", "Rating", "Genres", "Poster_URL", "Backdrop_URL", "Logo_URL", "Watch_Server_1", "Watch_Server_2", "Watch_Server_3", "Watch_Server_4", "Download_Link"]; const episodesHeader = ["Series_TMDB_ID", "Series_Name", "Season_Number", "Episode_Number", "Episode_Title", "Watch_Server_1", "Watch_Server_2", "Download_Link"]; const wb = XLSX.utils.book_new(); const wsMovies = XLSX.utils.aoa_to_sheet([moviesHeader]); const wsEpisodes = XLSX.utils.aoa_to_sheet([episodesHeader]); XLSX.utils.book_append_sheet(wb, wsMovies, "Movies"); XLSX.utils.book_append_sheet(wb, wsEpisodes, "Episodes"); XLSX.writeFile(wb, "cinematix_import_template.xlsx"); }; 
    const fetchTMDBData = async (id: string, type: 'movie' | 'tv') => { if (!id) return null; try { const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=${LANG}&append_to_response=images,credits`); if (!res.ok) return null; return await res.json(); } catch (e) { console.error("TMDB Fetch Error:", e); return null; } }; 
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
                fetchPage(1); 
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
    
    const totalPages = Math.ceil(totalContentCount / itemsPerPage);
    const pageNumbersInGroup = Array.from(
        { length: Math.min(pagesPerGroup, totalPages - currentGroup * pagesPerGroup) },
        (_, i) => currentGroup * pagesPerGroup + i + 1
    );

    const hasNextGroup = (currentGroup + 1) * pagesPerGroup < totalPages;
    const hasPrevGroup = currentGroup > 0;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1f2937] p-6 rounded-2xl mb-8 border border-gray-700/50 shadow-lg">
                <div className="relative w-full md:w-auto md:min-w-[350px]">
                    <input 
                        type="text" 
                        placeholder="ابحث في كامل قاعدة البيانات..." 
                        value={searchTerm} 
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }} 
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#00A7F8] text-white placeholder-gray-600 shadow-inner"
                    />
                    <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                </div>
                <div className="flex gap-3 w-full md:w-auto flex-wrap">
                    <button onClick={generateExcelTemplate} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-5 rounded-xl transition-colors text-sm border border-gray-600"><TableCellsIcon /><span className="hidden sm:inline">تحميل نموذج Excel</span></button>
                    <input type="file" accept=".xlsx, .xls" ref={excelInputRef} onChange={handleExcelUpload} className="hidden" />
                    <button onClick={() => excelInputRef.current?.click()} disabled={processingExcel} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-5 rounded-xl transition-colors text-sm disabled:opacity-50 border border-gray-600"><ArrowUpTrayIcon /><span className="hidden sm:inline">{processingExcel ? 'جاري المعالجة...' : 'استيراد من Excel'}</span></button>
                    <button onClick={onNew} className="flex-1 md:flex-none bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-extrabold py-3 px-8 rounded-xl hover:shadow-[0_0_20px_rgba(0,167,248,0.4)] transition-all transform hover:scale-105 whitespace-nowrap">+ إضافة محتوى</button>
                </div>
            </div>
            {processingExcel && (<div className="mb-6 bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 animate-pulse shadow-lg"><div className="flex justify-between mb-3 text-sm text-[#00A7F8] font-bold"><span>جاري الاستيرار...</span><span>{progress}</span></div><div className="w-full bg-gray-800 rounded-full h-3"><div className="bg-[#00A7F8] h-3 rounded-full w-2/3 transition-all duration-500 shadow-[0_0_10px_#00A7F8]"></div></div><p className="text-xs text-gray-500 mt-3 text-center">الرجاء عدم إغلاق الصفحة حتى تكتمل العملية.</p></div>)}
            
            {isInternalLoading ? (
                <div className="py-32 flex flex-col items-center justify-center gap-6">
                    <div className="w-16 h-16 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500 font-black tracking-widest uppercase text-xs">جاري سحب البيانات...</span>
                </div> 
            ) : (
                <>
                    {pagedContent.length === 0 && (
                        <div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-800 rounded-3xl mb-8 flex flex-col items-center justify-center">
                            <span className="text-4xl mb-4 opacity-50">📂</span>
                            لا يوجد محتوى مطابق لبحثك.
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3 mb-10">
                        {pagedContent.map((c:any) => {
                            const meta = getTypeMeta(c.type);
                            return (
                                <div key={c.id} className="group relative aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer bg-gray-800 border border-gray-700/50 shadow-lg hover:shadow-[0_0_25px_rgba(0,167,248,0.2)] transition-all duration-300 hover:scale-[1.02]">
                                    <img src={c.poster} alt={c.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold backdrop-blur-md border ${meta.color}`}>
                                            {meta.label}
                                        </span>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="absolute bottom-0 left-0 w-full p-4 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                        <h3 className="text-white font-bold text-lg leading-tight line-clamp-1 mb-1 drop-shadow-md">{c.title}</h3>
                                        <div className="flex items-center justify-between text-xs text-gray-300 mb-3">
                                            <span className="font-mono">{c.releaseYear}</span>
                                            <span className={`font-bold ${c.visibility === 'general' ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {c.visibility === 'general' ? 'عام' : 'مقيد'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                                            <button onClick={(e) => { e.stopPropagation(); onEdit(c); }} className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white py-2 rounded-lg text-xs font-bold border border-white/10 transition-colors">تعديل</button>
                                            <button onClick={(e) => { e.stopPropagation(); onRequestDelete(c.id, c.title); }} className="flex-1 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md text-red-300 py-2 rounded-lg text-xs font-bold border border-red-500/20 transition-colors">حذف</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {searchTerm.trim() === '' && totalPages > 1 && (
                        <div className="flex flex-col items-center gap-6 bg-[#1f2937] p-8 rounded-[2.5rem] border border-gray-700/50 shadow-xl mb-12">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                {hasPrevGroup && (
                                    <button 
                                        onClick={() => setCurrentPage(currentGroup * pagesPerGroup)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-400 font-black rounded-xl hover:bg-gray-700 transition-all border border-gray-700"
                                    >
                                        <span className="text-xl rotate-180">«</span>
                                        <span className="text-xs">المجموعة السابقة</span>
                                    </button>
                                )}

                                {pageNumbersInGroup.map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setCurrentPage(num)}
                                        className={`w-12 h-12 rounded-xl font-black text-sm transition-all border ${currentPage === num ? 'bg-[var(--color-accent)] text-black border-transparent shadow-[0_0_20px_var(--shadow-color)]' : 'bg-gray-900 border-gray-700 text-gray-500 hover:text-white hover:border-gray-500'}`}
                                    >
                                        {num}
                                    </button>
                                ))}

                                {hasNextGroup && (
                                    <button 
                                        onClick={() => setCurrentPage((currentGroup + 1) * pagesPerGroup + 1)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-400 font-black rounded-xl hover:bg-gray-700 transition-all border border-gray-700"
                                    >
                                        <span className="text-xs">المجموعة التالية</span>
                                        <span className="text-xl">»</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                                <span>الصفحة {currentPage} من {totalPages}</span>
                                <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                                <span>إجمالي العناصر: {totalContentCount}</span>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    ); 
};

export default ContentManagementTab;
