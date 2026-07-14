import React, { useState, useEffect } from 'react';
import type { Content } from '../../types';
import { fetchTMDB } from '../../utils/tmdbService';
import ToggleSwitch from '../shared/ToggleSwitch';
import { RefreshIcon } from './AdminIcons';
import { BouncingDotsLoader } from '../shared/BouncingDotsLoader';
import { 
    Sparkles, 
    TrendingUp, 
    Film, 
    Tv, 
    Users, 
    Search, 
    Filter, 
    CheckCircle2, 
    PlusCircle, 
    ExternalLink, 
    Star, 
    Calendar, 
    Globe, 
    EyeOff,
    Layers
} from 'lucide-react';

interface TmdbResult {
    id: number;
    title?: string;
    name?: string;
    poster_path: string;
    release_date?: string;
    first_air_date?: string;
    media_type: 'movie' | 'tv';
    original_language?: string;
    origin_country?: string[];
    popularity?: number;
    vote_average?: number;
}

const RadarIconFixed = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9m0 18c-5.965 0-10.8-4.03-10.8-9S6.035 3 12 3" />
    </svg>
);

interface DashboardTabProps {
    stats: {
        totalMovies: number;
        totalSeries: number;
        totalUsers: number;
    };
    allContent: Content[];
    onSelectTmdbItem?: (item: TmdbResult) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ stats, allContent, onSelectTmdbItem }) => {
    const TMDB_API_KEY = 'b8d66e320b334f4d56728d98a7e39697';
    const [tmdbRadarItems, setTmdbRadarItems] = useState<TmdbResult[]>([]);
    const [isRadarLoading, setIsRadarLoading] = useState(false);
    const [radarType, setRadarType] = useState<string>('all');
    const [radarMode, setRadarMode] = useState<'discover' | 'now_playing'>('discover');
    const [strict24h, setStrict24h] = useState(true);
    const [radarSearch, setRadarSearch] = useState('');
    const [sortBy, setSortBy] = useState<'popularity' | 'date' | 'rating'>('popularity');
    const [hideAlreadyAdded, setHideAlreadyAdded] = useState(false);
    const [itemsLimit, setItemsLimit] = useState<number>(48); // الافتراضي 48 عمل

    const getOriginLabel = (item: TmdbResult) => {
        const lang = item.original_language;
        const countries = item.origin_country || [];
        const country = countries[0];

        if (lang === 'ar') {
            if (country === 'EG') return 'مصري 🇪🇬';
            if (country === 'MA') return 'مغربي 🇲🇦';
            return 'عربي 🇸🇦';
        }
        if (lang === 'tr') return 'تركي 🇹🇷';
        if (lang === 'hi') return 'هندي 🇮🇳';
        if (lang === 'ru') return 'روسي 🇷🇺';
        if (lang === 'es') return 'إسباني 🇪🇸';
        if (lang === 'en') {
            if (country === 'US') return 'أمريكي 🇺🇸';
            return 'أجنبي 🌐';
        }
        return 'أجنبي 🌐';
    };

    // 🚀 تطوير جوهري: دالة سحب متعددة الصفحات لتخطي حاجز الـ 20 عمل الخاص بـ TMDB
    const fetchMultiplePages = async (baseUrl: string, maxPages = 4): Promise<any[]> => {
        const promises = [];
        for (let p = 1; p <= maxPages; p++) {
            promises.push(
                fetchTMDB(`${baseUrl}&page=${p}`)
                    .then(r => r.json())
                    .catch(() => ({ results: [] }))
            );
        }
        const responses = await Promise.all(promises);
        return responses.flatMap(res => res.results || []);
    };

    const fetchTmdbRadar = async (category: string = radarType, mode: 'discover' | 'now_playing' = radarMode, isStrict: boolean = strict24h) => {
        setIsRadarLoading(true);
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const last45Days = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const dateFilter = isStrict ? yesterday : (mode === 'now_playing' ? last45Days : lastWeek);
        
        let moviesBaseUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&primary_release_date.gte=${dateFilter}&sort_by=popularity.desc&language=ar-SA&include_adult=false`;
        let tvBaseUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&first_air_date.gte=${dateFilter}&sort_by=popularity.desc&language=ar-SA&include_adult=false`;

        if (category === 'arabic_movies') moviesBaseUrl += '&with_original_language=ar';
        if (category === 'arabic_series') tvBaseUrl += '&with_original_language=ar';
        if (category === 'turkish_movies') moviesBaseUrl += '&with_original_language=tr';
        if (category === 'turkish_series') tvBaseUrl += '&with_original_language=tr';
        if (category === 'foreign_movies') moviesBaseUrl += '&with_original_language=en';
        if (category === 'foreign_series') tvBaseUrl += '&with_original_language=en';
        if (category === 'animation') {
            moviesBaseUrl += '&with_genres=16';
            tvBaseUrl += '&with_genres=16';
        }

        try {
            // سحب 4 صفحات دفعة واحدة (حوالي 80-100 عمل لكل تصنيف)
            const [moviesRaw, tvRaw] = await Promise.all([
                category.includes('series') ? Promise.resolve([]) : fetchMultiplePages(moviesBaseUrl, 4),
                category.includes('movies') ? Promise.resolve([]) : fetchMultiplePages(tvBaseUrl, 4)
            ]);

            let movies = moviesRaw.map((i: any) => ({ ...i, media_type: 'movie' }));
            let tv = tvRaw.map((i: any) => ({ ...i, media_type: 'tv' }));
            
            if (isStrict) {
                movies = movies.filter((m: any) => m.release_date >= yesterday);
                tv = tv.filter((t: any) => t.first_air_date >= yesterday);
            }

            let combined = [...movies, ...tv];
            
            if (category.includes('movies')) combined = movies;
            if (category.includes('series')) combined = tv;

            // إزالة التكرارات إن وجدت وترتيبها حسب الشعبية
            const uniqueMap = new Map();
            combined.forEach(item => uniqueMap.set(item.id, item));
            const uniqueCombined = Array.from(uniqueMap.values());

            setTmdbRadarItems(uniqueCombined.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)));
        } catch (e) {
            console.error("Radar Fetch Error", e);
        } finally {
            setIsRadarLoading(false);
        }
    };

    useEffect(() => {
        fetchTmdbRadar(radarType, radarMode, strict24h);
    }, [radarType, radarMode, strict24h]);

    // 🌟 قائمة الأزرار بأسماء واضحة وغير قابلة للقص
    const categoryButtons = [
        { id: 'all', label: 'كل الرصد العالمي', icon: '🌐', color: 'from-slate-700/40 to-slate-800/60 border-slate-600 text-slate-200' },
        { id: 'arabic_movies', label: 'أفلام عربية', icon: '🎬', color: 'from-emerald-600/30 to-emerald-900/40 border-emerald-500/50 text-emerald-300' },
        { id: 'arabic_series', label: 'مسلسلات عربية', icon: '📺', color: 'from-teal-600/30 to-teal-900/40 border-teal-500/50 text-teal-300' },
        { id: 'turkish_movies', label: 'أفلام تركية', icon: '🇹🇷', color: 'from-blue-600/30 to-blue-900/40 border-blue-500/50 text-blue-300' },
        { id: 'turkish_series', label: 'مسلسلات تركية', icon: '🔥', color: 'from-cyan-600/30 to-cyan-900/40 border-cyan-500/50 text-cyan-300' },
        { id: 'foreign_movies', label: 'أفلام أجنبية', icon: '🎥', color: 'from-indigo-600/30 to-indigo-900/40 border-indigo-500/50 text-indigo-300' },
        { id: 'foreign_series', label: 'مسلسلات أجنبية', icon: '🌍', color: 'from-purple-600/30 to-purple-900/40 border-purple-500/50 text-purple-300' },
        { id: 'animation', label: 'أنيميشن وكرتون', icon: '🦄', color: 'from-amber-600/30 to-amber-900/40 border-amber-500/50 text-amber-300' },
    ];

    const currentCategoryLabel = categoryButtons.find(b => b.id === radarType)?.label || 'الكل';

    let processedRadarItems = [...tmdbRadarItems];

    if (hideAlreadyAdded) {
        processedRadarItems = processedRadarItems.filter(item => {
            return !allContent.some(c => c.id === String(item.id) || (c as any).tmdbId === String(item.id));
        });
    }

    if (radarSearch.trim()) {
        const query = radarSearch.toLowerCase();
        processedRadarItems = processedRadarItems.filter(item => {
            const title = (item.title || item.name || '').toLowerCase();
            return title.includes(query);
        });
    }

    if (sortBy === 'date') {
        processedRadarItems.sort((a, b) => {
            const dateA = a.release_date || a.first_air_date || '0000-00-00';
            const dateB = b.release_date || b.first_air_date || '0000-00-00';
            return dateB.localeCompare(dateA);
        });
    } else if (sortBy === 'rating') {
        processedRadarItems.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    } else {
        processedRadarItems.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    // تطبيق الحد الأقصى المختار من الإدارة (حتى 96 عمل)
    processedRadarItems = processedRadarItems.slice(0, itemsLimit);

    return (
        <div className="space-y-8 animate-fade-in pb-16 font-sans" dir="rtl">
            
            {/* إحصائيات المنصة الفاخرة */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-900/50 p-7 rounded-[2rem] border border-blue-500/30 shadow-[0_10px_30px_rgba(59,130,246,0.1)] overflow-hidden group hover:border-blue-500/60 transition-all duration-300">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mt-10 pointer-events-none group-hover:bg-blue-500/20 transition-all duration-500"></div>
                    <div className="flex items-center justify-between relative z-10 mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                                <Film className="w-6 h-6" />
                            </div>
                            <h3 className="text-slate-300 text-sm font-extrabold tracking-wide">أرشيف الأفلام</h3>
                        </div>
                        <span className="text-xs font-mono font-bold bg-blue-500/10 text-blue-300 px-3 py-1 rounded-full border border-blue-500/20">جاهز للعرض</span>
                    </div>
                    <div className="flex items-baseline gap-2 relative z-10">
                        <p className="text-5xl font-black text-white tracking-tight font-mono">{stats.totalMovies}</p>
                        <span className="text-xs font-bold text-slate-400">فيلم سينمائي</span>
                    </div>
                    <div className="mt-4 w-full bg-slate-800/60 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full w-3/4 rounded-full"></div>
                    </div>
                </div>

                <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-900/50 p-7 rounded-[2rem] border border-purple-500/30 shadow-[0_10px_30px_rgba(168,85,247,0.1)] overflow-hidden group hover:border-purple-500/60 transition-all duration-300">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mt-10 pointer-events-none group-hover:bg-purple-500/20 transition-all duration-500"></div>
                    <div className="flex items-center justify-between relative z-10 mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                                <Tv className="w-6 h-6" />
                            </div>
                            <h3 className="text-slate-300 text-sm font-extrabold tracking-wide">أرشيف المسلسلات</h3>
                        </div>
                        <span className="text-xs font-mono font-bold bg-purple-500/10 text-purple-300 px-3 py-1 rounded-full border border-purple-500/20">مستمر وبرامج</span>
                    </div>
                    <div className="flex items-baseline gap-2 relative z-10">
                        <p className="text-5xl font-black text-white tracking-tight font-mono">{stats.totalSeries}</p>
                        <span className="text-xs font-bold text-slate-400">عمل تلفزيوني</span>
                    </div>
                    <div className="mt-4 w-full bg-slate-800/60 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-400 h-full w-4/5 rounded-full"></div>
                    </div>
                </div>

                <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-900/50 p-7 rounded-[2rem] border border-emerald-500/30 shadow-[0_10px_30px_rgba(16,185,129,0.1)] overflow-hidden group hover:border-emerald-500/60 transition-all duration-300">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -ml-10 -mt-10 pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                    <div className="flex items-center justify-between relative z-10 mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-slate-300 text-sm font-extrabold tracking-wide">مجتمع المشتركين</h3>
                        </div>
                        <span className="text-xs font-mono font-bold bg-emerald-500/10 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/20">● نشط حالياً</span>
                    </div>
                    <div className="flex items-baseline gap-2 relative z-10">
                        <p className="text-5xl font-black text-white tracking-tight font-mono">{stats.totalUsers}</p>
                        <span className="text-xs font-bold text-slate-400">حساب مسجل</span>
                    </div>
                    <div className="mt-4 w-full bg-slate-800/60 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full w-2/3 rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* لوحة تحكم الرادار (تم تنظيم الأزرار وتوسيعها لمنع القص نهائياً) */}
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 p-6 md:p-8 rounded-[2.5rem] shadow-2xl space-y-8">
                
                {/* الهيدر وأدوات التحكم منظمين بشكل انسيابي */}
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00A7F8]/20 to-indigo-500/10 border border-[#00A7F8]/30 flex items-center justify-center text-[#00A7F8] shadow-lg shadow-[#00A7F8]/10 shrink-0">
                            <TrendingUp className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h4 className="text-xl font-black text-white">محرك الرصد الذكي TMDB</h4>
                                <span className="text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">LIVE RADAR</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">اكتشف أحدث الأفلام والمسلسلات العالمية بضغطة زر وأضفها لمنصتك فوراً</p>
                        </div>
                    </div>

                    {/* شبكة أزرار التحكم بدون تداخل */}
                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto bg-slate-950 p-2.5 rounded-2xl border border-slate-800/80 shadow-inner">
                        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 flex-1 sm:flex-initial">
                            <button 
                                onClick={() => setRadarMode('discover')} 
                                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black transition-all duration-200 ${radarMode === 'discover' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                إضافات هذا الأسبوع ⚡
                            </button>
                            <button 
                                onClick={() => setRadarMode('now_playing')} 
                                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black transition-all duration-200 ${radarMode === 'now_playing' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                يعرض الآن في السينما 🎟️
                            </button>
                        </div>

                        <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

                        <label className="flex items-center gap-2 cursor-pointer group px-2 py-1 rounded-xl hover:bg-slate-900/60 transition-colors">
                             <ToggleSwitch checked={strict24h} onChange={setStrict24h} className="scale-75" />
                             <span className={`text-xs font-black tracking-wide transition-colors ${strict24h ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`}>رصد اليوم فقط (24h)</span>
                        </label>

                        <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

                        <label className="flex items-center gap-2 cursor-pointer group px-2 py-1 rounded-xl hover:bg-slate-900/60 transition-colors">
                             <ToggleSwitch checked={hideAlreadyAdded} onChange={setHideAlreadyAdded} className="scale-75" />
                             <span className={`text-xs font-black tracking-wide flex items-center gap-1.5 transition-colors ${hideAlreadyAdded ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                 <EyeOff className="w-3.5 h-3.5" />
                                 <span>إخفاء المضاف مسبقاً</span>
                             </span>
                        </label>
                    </div>
                </div>
                
                {/* 🌟 شبكة الأزرار (تم التوسيع: 4 أعمدة على الشاشات الكبيرة بحيث لا تنقص أي كلمة نهائياً) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3">
                    {categoryButtons.map(btn => {
                        const isSelected = radarType === btn.id;
                        return (
                            <button 
                                key={btn.id}
                                onClick={() => setRadarType(btn.id)}
                                className={`group p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex items-center justify-center gap-2.5 text-center select-none shadow-md ${
                                    isSelected 
                                        ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-[#00A7F8] ring-2 ring-[#00A7F8]/30 shadow-lg shadow-[#00A7F8]/15 scale-[1.02]' 
                                        : `bg-gradient-to-r ${btn.color} hover:border-slate-500 hover:shadow-lg hover:-translate-y-0.5`
                                }`}
                            >
                                <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">{btn.icon}</span>
                                <span className={`text-xs sm:text-sm font-black whitespace-normal leading-tight ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                    {btn.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
            
            {/* منطقة نتائج الرادار العالمية */}
            <div className="bg-slate-900/90 rounded-[2.5rem] border border-slate-800/80 overflow-hidden shadow-2xl relative">
                
                {/* شريط أدوات الفلترة والبحث واختيار العدد (حتى 96 عمل) */}
                <div className="p-6 md:p-8 border-b border-slate-800/80 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-slate-950/60 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 animate-pulse shadow-inner">
                            <RadarIconFixed className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h3 className="font-black text-xl text-white tracking-wide">الرصد الحي: <span className="text-red-400">{currentCategoryLabel}</span></h3>
                                <span className="text-xs bg-slate-800 text-slate-300 font-mono font-bold px-3 py-0.5 rounded-full border border-slate-700">
                                    {processedRadarItems.length} عمل معروض
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                {radarMode === 'discover' ? 'رصد أحدث الإصدارات العالمية والمحلية' : 'رصد الأعمال التي تُعرض حالياً في شاشات السينما والمنصات'}
                                {strict24h ? ' • مصفى بآخر 24 ساعة' : ''}
                            </p>
                        </div>
                    </div>
                    
                    {/* الفلاتر والبحث والـ Limit */}
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                        <div className="relative flex-1 sm:flex-initial min-w-[240px]">
                            <input
                                type="text"
                                placeholder="ابحث باسم الفيلم أو المسلسل..."
                                value={radarSearch}
                                onChange={(e) => setRadarSearch(e.target.value)}
                                className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-4 py-2.5 pl-9 outline-none focus:border-[#00A7F8] focus:ring-2 focus:ring-[#00A7F8]/20 transition-all placeholder-slate-500 font-medium"
                            />
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            {radarSearch && (
                                <button onClick={() => setRadarSearch('')} className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1">✕</button>
                            )}
                        </div>

                        <select
                            value={sortBy}
                            onChange={(e: any) => setSortBy(e.target.value)}
                            className="bg-slate-950 text-xs text-slate-200 font-bold border border-slate-800 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#00A7F8] transition-all cursor-pointer"
                        >
                            <option value="popularity">🔥 الأكثر شعبية حالياً</option>
                            <option value="date">📅 الأحدث في تاريخ الصدور</option>
                            <option value="rating">⭐ الأعلى في التقييم العالمي</option>
                        </select>

                        {/* 🚀 اختيار عدد الأعمال المعروضة (تم رفعه حتى 96 عمل فوراً) */}
                        <select
                            value={itemsLimit}
                            onChange={(e: any) => setItemsLimit(Number(e.target.value))}
                            className="bg-slate-950 text-xs text-slate-200 font-mono font-bold border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-[#00A7F8] transition-all cursor-pointer"
                            title="عدد العناصر المعروضة"
                        >
                            <option value={24}>عرض 24 عمل</option>
                            <option value={48}>عرض 48 عمل</option>
                            <option value={72}>عرض 72 عمل</option>
                            <option value={96}>عرض 96 عمل</option>
                        </select>

                        <button 
                            onClick={() => fetchTmdbRadar()}
                            disabled={isRadarLoading}
                            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700 hover:scale-105 active:scale-95 shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center"
                            title="تحديث البيانات فوراً"
                        >
                            <RefreshIcon className={`w-4 h-4 ${isRadarLoading ? 'animate-spin text-[#00A7F8]' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* شبكة الأعمال (بوسترات نظيفة تماماً وبدون أوسمة مكررة مع تكبير الخط) */}
                <div className="p-6 md:p-8">
                    {isRadarLoading ? (
                        <div className="py-28 flex flex-col items-center justify-center gap-6 opacity-80">
                            <BouncingDotsLoader size="lg" delayMs={300} colorClass="bg-red-500" />
                            <span className="text-xs font-black animate-pulse tracking-widest uppercase text-slate-400">جاري مسح قواعد بيانات الرادار العالمي وسحب الصفحات...</span>
                        </div>
                    ) : processedRadarItems.length === 0 ? (
                        <div className="py-28 text-center text-slate-400 flex flex-col items-center gap-5 animate-fade-in">
                            <div className="w-20 h-20 rounded-3xl bg-slate-800/50 flex items-center justify-center border border-slate-700/60 shadow-inner">
                                <span className="text-4xl opacity-50">📡</span>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-xl font-extrabold text-white">لم يتم رصد نتائج مطابقة</p>
                                <p className="max-w-sm font-medium text-xs text-slate-500 mx-auto leading-relaxed">
                                    {hideAlreadyAdded ? 'جميع الأعمال في هذا التصنيف تم إضافتها لموقعك بالفعل! جرب إلغاء فلتر "إخفاء المضاف مسبقاً".' : `لم نجد نتائج مطابقة لفلتر "${currentCategoryLabel}" بالخيارات المحددة حالياً.`}
                                </p>
                            </div>
                            <button 
                                onClick={() => { setRadarSearch(''); setHideAlreadyAdded(false); setStrict24h(false); }}
                                className="mt-2 text-xs bg-slate-800 hover:bg-slate-700 text-[#00A7F8] font-bold px-5 py-2.5 rounded-xl border border-slate-700 transition-colors"
                            >
                                توسيع نطاق البحث وإلغاء القيود
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5 animate-fade-in font-sans">
                            {processedRadarItems.map(item => {
                                const isAlreadyAdded = allContent.some(c => c.id === String(item.id) || (c as any).tmdbId === String(item.id));
                                const rating = item.vote_average ? Number(item.vote_average.toFixed(1)) : 0;
                                
                                return (
                                    <div 
                                        key={item.id} 
                                        onClick={() => onSelectTmdbItem && onSelectTmdbItem(item)}
                                        className="group relative bg-slate-950 rounded-3xl border border-slate-800/80 overflow-hidden transition-all duration-300 hover:border-[#00A7F8]/60 hover:shadow-[0_10px_30px_rgba(0,167,248,0.15)] hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
                                    >
                                        <div className="aspect-[2/3] relative overflow-hidden bg-slate-900">
                                            <img 
                                                src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '/placeholder.png'} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                                alt={item.title || item.name || ''} 
                                                loading="lazy"
                                            />
                                            
                                            {/* شارة بلد الأصل */}
                                            <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-extrabold text-white border border-white/10 shadow-lg z-20 flex items-center gap-1">
                                                <span>{getOriginLabel(item)}</span>
                                            </div>

                                            {/* إظهار شارة مضاف مسبقاً فقط (وإزالة كلمة جديد المزعجة) */}
                                            {isAlreadyAdded && (
                                                <div className="absolute top-2.5 left-2.5 z-20">
                                                    <span className="bg-emerald-600/95 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-black text-white shadow-lg flex items-center gap-1 border border-emerald-400/30">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span>مضاف مسبقاً</span>
                                                    </span>
                                                </div>
                                            )}

                                            {/* تدرج سفلي سينمائي ناعم مع التقييم والنوع */}
                                            <div className="absolute bottom-0 left-0 right-0 p-3.5 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-end justify-between z-10">
                                                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${item.media_type === 'movie' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-purple-600 text-white shadow-md shadow-purple-500/20'}`}>
                                                    {item.media_type === 'movie' ? 'فيلم' : 'مسلسل'}
                                                </span>

                                                {rating > 0 && (
                                                    <span className="flex items-center gap-1 bg-amber-500/20 backdrop-blur-md text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg font-mono font-bold text-[10px]">
                                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                        <span>{rating}</span>
                                                    </span>
                                                )}
                                            </div>

                                            {/* واجهة التفاعل السريع عند تمرير الماوس */}
                                            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 z-30 p-4">
                                                <div className="text-center mb-1">
                                                    <span className="text-[10px] text-slate-400 font-mono block">TMDB ID: {item.id}</span>
                                                </div>
                                                {isAlreadyAdded ? (
                                                    <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition-transform hover:scale-105 flex items-center justify-center gap-1.5">
                                                        <span>تعديل بالموقع</span>
                                                        <span>📝</span>
                                                    </button>
                                                ) : (
                                                    <button className="w-full py-2.5 bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black hover:opacity-95 rounded-xl text-xs font-black shadow-lg shadow-[#00A7F8]/20 transition-transform hover:scale-105 flex items-center justify-center gap-1.5">
                                                        <span>إضافة للموقع</span>
                                                        <span>⚡</span>
                                                    </button>
                                                )}
                                                <a 
                                                    href={`https://www.themoviedb.org/${item.media_type}/${item.id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-center text-[11px] font-extrabold border border-slate-700 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <span>عرض في TMDB</span>
                                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                                </a>
                                            </div>
                                        </div>

                                        {/* أسفل الكارت (تم تحسين حجم الخط وتنسيق العنوان) */}
                                        <div className="p-4 space-y-2.5 bg-slate-950 flex-1 flex flex-col justify-between">
                                            <h4 className="text-sm font-black text-white line-clamp-1 leading-snug group-hover:text-[#00A7F8] transition-colors text-right" title={item.title || item.name}>
                                                {item.title || item.name}
                                            </h4>
                                            <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-[11px] text-slate-400">
                                                <span className="flex items-center gap-1 text-slate-500 font-bold">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>الإصدار</span>
                                                </span>
                                                <span className="font-mono font-extrabold text-slate-300">{item.release_date || item.first_air_date || '----'}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;