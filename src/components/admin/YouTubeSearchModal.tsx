import React, { useState, useEffect, useCallback } from 'react';
import { CloseIcon } from '../icons/CloseIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { BouncingDotsLoader } from '../shared/BouncingDotsLoader';
import { fetchTMDB } from '@/utils/tmdbService';

const YOUTUBE_API_KEYS = [
    'AIzaSyDKU89B22xeUd_R3mmVV_2G5L_r3Uh8gq4',
];

const TMDB_API_KEY = '4f27d42721868461ab121820ddf8a379';

interface YouTubeVideo {
    id: { videoId: string };
    snippet: {
        title: string;
        thumbnails: { high: { url: string } };
        channelTitle: string;
        publishedAt: string;
    };
    source?: string;
}

interface YouTubeSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    initialQuery?: string;
}

const YouTubeIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
);

// Extract Video ID if input is a YouTube URL or 11-char ID
function extractYouTubeVideoId(input: string): string | null {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
        return trimmed;
    }
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i);
    return match ? match[1] : null;
}

// Invidious instances fallback search
const invidiousInstances = [
    'https://inv.tux.pizza',
    'https://invidious.nerdvpn.de',
    'https://vid.puffyan.us',
    'https://invidious.drgns.space'
];

async function searchInvidious(searchQuery: string): Promise<YouTubeVideo[]> {
    for (const domain of invidiousInstances) {
        try {
            const url = `${domain}/api/v1/search?q=${encodeURIComponent(searchQuery)}&type=video`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    return data.map((item: any) => ({
                        id: { videoId: item.videoId },
                        snippet: {
                            title: item.title,
                            thumbnails: { high: { url: `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg` } },
                            channelTitle: item.author || 'YouTube',
                            publishedAt: item.publishedText || new Date().toISOString()
                        },
                        source: 'YouTube'
                    })).filter(item => item.id.videoId);
                }
            }
        } catch (e) {
            // Silently try next instance
        }
    }
    return [];
}

// Piped instances fallback search
async function searchPiped(searchQuery: string): Promise<YouTubeVideo[]> {
    const pipedInstances = [
        'https://pipedapi.kavin.rocks',
        'https://api.piped.yt',
        'https://pipedapi.mha.fi'
    ];
    for (const domain of pipedInstances) {
        try {
            const url = `${domain}/search?q=${encodeURIComponent(searchQuery)}&filter=videos`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.items) && data.items.length > 0) {
                    return data.items
                        .filter((item: any) => item.url && item.url.includes('v='))
                        .map((item: any) => {
                            const vId = item.url.split('v=')[1]?.split('&')[0];
                            return {
                                id: { videoId: vId },
                                snippet: {
                                    title: item.title,
                                    thumbnails: { high: { url: item.thumbnail || `https://img.youtube.com/vi/${vId}/hqdefault.jpg` } },
                                    channelTitle: item.uploaderName || 'YouTube',
                                    publishedAt: item.uploadedDate || new Date().toISOString()
                                },
                                source: 'YouTube'
                            };
                        })
                        .filter((item: any) => item.id.videoId);
                }
            }
        } catch (e) {
            // Silently try next instance
        }
    }
    return [];
}

// TMDB Trailers Search Fallback
async function searchTMDBTrailers(rawQuery: string): Promise<YouTubeVideo[]> {
    try {
        const cleanQuery = rawQuery.replace(/official trailer|trailer|إعلان|التريلر|الرسمي/gi, '').trim();
        if (!cleanQuery) return [];

        const searchRes = await fetchTMDB(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanQuery)}&language=ar-SA&include_adult=false`);
        if (!searchRes.ok) return [];

        const searchData = await searchRes.json();
        const results = searchData.results || [];

        const videoPromises = results.slice(0, 5).map(async (item: any) => {
            const mediaType = item.media_type === 'tv' ? 'tv' : 'movie';
            const title = item.title || item.name || cleanQuery;
            try {
                let videoRes = await fetchTMDB(`https://api.themoviedb.org/3/${mediaType}/${item.id}/videos?api_key=${TMDB_API_KEY}&language=ar-SA`);
                let videoData = videoRes.ok ? await videoRes.json() : null;
                let ytVideos = (videoData?.results || []).filter((v: any) => v.site === 'YouTube');

                if (ytVideos.length === 0) {
                    videoRes = await fetchTMDB(`https://api.themoviedb.org/3/${mediaType}/${item.id}/videos?api_key=${TMDB_API_KEY}&language=en-US`);
                    videoData = videoRes.ok ? await videoRes.json() : null;
                    ytVideos = (videoData?.results || []).filter((v: any) => v.site === 'YouTube');
                }

                return ytVideos.map((v: any) => ({
                    id: { videoId: v.key },
                    snippet: {
                        title: `${title} - ${v.name || 'الإعلان الرسمي'}`,
                        thumbnails: { high: { url: `https://img.youtube.com/vi/${v.key}/hqdefault.jpg` } },
                        channelTitle: `${v.type || 'Trailer'} (${mediaType === 'movie' ? 'فيلم' : 'مسلسل'})`,
                        publishedAt: v.published_at || new Date().toISOString()
                    },
                    source: 'TMDB Official Trailer'
                }));
            } catch (e) {
                return [];
            }
        });

        const allFetched = await Promise.all(videoPromises);
        return allFetched.flat();
    } catch (e) {
        return [];
    }
}

// Standard YouTube API Search
async function searchYouTubeAPI(searchQuery: string): Promise<YouTubeVideo[]> {
    for (const apiKey of YOUTUBE_API_KEYS) {
        try {
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=15&q=${encodeURIComponent(searchQuery)}&relevanceLanguage=ar&key=${apiKey}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data.items && data.items.length > 0) {
                    return data.items.map((item: any) => ({
                        id: { videoId: item.id?.videoId },
                        snippet: item.snippet,
                        source: 'YouTube'
                    })).filter((item: any) => item.id?.videoId);
                }
            }
        } catch (e) {
            // Silently fail if blocked or rate-limited
        }
    }
    return [];
}

const YouTubeSearchModal: React.FC<YouTubeSearchModalProps> = ({ isOpen, onClose, onSelect, initialQuery = '' }) => {
    const [query, setQuery] = useState(initialQuery);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<YouTubeVideo[]>([]);
    const [error, setError] = useState('');

    const handleSearch = useCallback(async (e?: React.FormEvent, customQuery?: string) => {
        if (e) e.preventDefault();
        const queryToUse = customQuery !== undefined ? customQuery : query;
        if (!queryToUse.trim()) return;

        setLoading(true);
        setError('');
        setResults([]);

        const trimmedInput = queryToUse.trim();

        // 1. Direct YouTube link or Video ID check
        const directId = extractYouTubeVideoId(trimmedInput);
        if (directId) {
            let videoTitle = `فيديو يوتيوب (${directId})`;
            let channelTitle = 'YouTube Video';
            try {
                const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${directId}&format=json`);
                if (oembedRes.ok) {
                    const oembedData = await oembedRes.json();
                    if (oembedData.title) videoTitle = oembedData.title;
                    if (oembedData.author_name) channelTitle = oembedData.author_name;
                }
            } catch (e) {
                // Ignore oembed failure
            }

            setResults([{
                id: { videoId: directId },
                snippet: {
                    title: videoTitle,
                    thumbnails: { high: { url: `https://img.youtube.com/vi/${directId}/hqdefault.jpg` } },
                    channelTitle: channelTitle,
                    publishedAt: new Date().toISOString()
                },
                source: 'رابط مباشر'
            }]);
            setLoading(false);
            return;
        }

        // 2. Multi-source search
        const searchQuery = trimmedInput.toLowerCase().includes('trailer') ? trimmedInput : `${trimmedInput} official trailer`;

        // Run YouTube API, Invidious/Piped, and TMDB in smart sequence/parallel
        let fetchedResults = await searchYouTubeAPI(searchQuery);

        if (fetchedResults.length === 0) {
            fetchedResults = await searchInvidious(searchQuery);
        }

        if (fetchedResults.length === 0) {
            fetchedResults = await searchPiped(searchQuery);
        }

        const tmdbResults = await searchTMDBTrailers(trimmedInput);

        // Deduplicate by videoId
        const seenIds = new Set<string>();
        const mergedResults: YouTubeVideo[] = [];

        for (const item of [...fetchedResults, ...tmdbResults]) {
            const vId = item.id?.videoId;
            if (vId && !seenIds.has(vId)) {
                seenIds.add(vId);
                mergedResults.push(item);
            }
        }

        if (mergedResults.length > 0) {
            setResults(mergedResults);
        } else {
            setError('لم يتم العثور على نتائج تلقائياً. يمكنك لصق رابط فيديو يوتيوب مباشرة في خانة البحث.');
        }
        setLoading(false);
    }, [query]);

    // Automatically trigger search when modal opens or initialQuery changes
    useEffect(() => {
        if (isOpen && initialQuery) {
            setQuery(initialQuery);
            handleSearch(undefined, initialQuery);
        } else if (isOpen && query) {
            handleSearch(undefined, query);
        }
    }, [isOpen, initialQuery]);

    const handleSelectVideo = (videoId: string) => {
        onSelect(`https://www.youtube.com/watch?v=${videoId}`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[500] flex items-center justify-center p-2 md:p-4" onClick={onClose}>
            <div className="bg-[#0b1116] border border-gray-800 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,1)] w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-5 md:p-7 border-b border-white/5 flex justify-between items-center bg-[#0f172a]/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-600 text-white rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                            <YouTubeIcon />
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-white">YouTube Trailer Search</h3>
                            <p className="text-xs text-gray-400 font-bold mt-0.5">ابحث عن الإعلانات الرسمية أو ألصق رابط الفيديو مباشرة</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-all">
                        <CloseIcon className="w-7 h-7" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-5 md:p-8 bg-[#0b1116]">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="relative flex-1 group">
                            <input 
                                type="text" 
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="اسم الفيلم، المسلسل، أو رابط يوتيوب..."
                                className="w-full bg-[#161b22] border border-gray-700 rounded-2xl px-6 py-4 pr-14 text-white font-bold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all text-lg shadow-inner"
                                autoFocus
                            />
                            <div className="absolute right-5 top-4.5 text-gray-500 group-focus-within:text-red-500 transition-colors">
                                <SearchIcon className="w-6 h-6 mt-1" />
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 text-white font-black py-4 px-10 rounded-2xl transition-all disabled:opacity-50 shadow-[0_0_25px_rgba(220,38,38,0.2)] whitespace-nowrap text-lg active:scale-95"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <BouncingDotsLoader size="sm" colorClass="bg-white" delayMs={0} />
                                    <span>جاري البحث</span>
                                </div>
                            ) : 'بحث'}
                        </button>
                    </form>
                </div>

                {/* Results Grid */}
                <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar bg-[#050505]">
                    {loading && results.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 gap-6 opacity-50">
                            <BouncingDotsLoader size="lg" delayMs={300} colorClass="bg-red-500" />
                            <span className="text-gray-400 text-lg font-black animate-pulse">جاري جلب الفيديوهات...</span>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="text-center py-20 bg-red-500/5 rounded-3xl border border-red-500/10 max-w-xl mx-auto p-10 shadow-inner">
                            <div className="text-red-500 mb-4 text-5xl">⚠️</div>
                            <p className="text-xl font-black text-red-400 mb-2">{error}</p>
                            <p className="text-sm text-gray-500 font-bold">تأكد من كتابة اسم العمل بشكل صحيح أو قم بلصق رابط يوتيوب مباشر.</p>
                        </div>
                    )}

                    {!loading && !error && results.length === 0 && (
                        <div className="text-center py-20 text-gray-600 flex flex-col items-center gap-6">
                            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center opacity-20">
                                <YouTubeIcon />
                            </div>
                            <p className="max-w-md text-lg font-black opacity-40">أدخل اسم العمل في الأعلى للبحث أو ألصق رابط الفيديو من يوتيوب.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-10">
                        {results.map((video) => (
                            <div 
                                key={video.id.videoId} 
                                onClick={() => handleSelectVideo(video.id.videoId)}
                                className="group bg-[#161b22] border border-gray-800 rounded-3xl overflow-hidden hover:border-red-500/40 transition-all flex flex-col shadow-2xl hover:shadow-red-900/10 cursor-pointer transform active:scale-[0.98]"
                            >
                                <div className="aspect-video w-full relative overflow-hidden bg-black">
                                    <img 
                                        src={video.snippet.thumbnails.high.url} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                        alt={video.snippet.title} 
                                        onError={(e) => {
                                            // Fallback to standard YouTube thumbnail if high res image fails
                                            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.id.videoId}/hqdefault.jpg`;
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                        <div className="bg-red-600 text-white font-black px-6 py-3 rounded-2xl shadow-2xl transform scale-90 group-hover:scale-100 transition-all">
                                            اختيار التريلر
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 right-2 bg-red-600 px-2 py-0.5 rounded text-[9px] font-black text-white uppercase tracking-tighter shadow-lg">HD</div>
                                    {video.source && (
                                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold text-gray-300">
                                            {video.source}
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h4 className="text-base font-bold text-white line-clamp-2 mb-3 leading-relaxed group-hover:text-red-400 transition-colors" title={video.snippet.title}>
                                        {video.snippet.title}
                                    </h4>
                                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-500 font-black truncate max-w-[150px] uppercase tracking-wide">{video.snippet.channelTitle}</span>
                                            <span className="text-[9px] text-gray-600 font-bold">
                                                {isNaN(new Date(video.snippet.publishedAt).getTime()) 
                                                    ? video.snippet.publishedAt 
                                                    : new Date(video.snippet.publishedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-red-600/10 px-2 py-1 rounded-lg">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                            <span className="text-[9px] text-red-500 font-black uppercase tracking-widest">YouTube</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="p-4 bg-[#0b1116] border-t border-white/5 text-center">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">Multi-Source Trailer Engine (YouTube + TMDB)</p>
                </div>
            </div>
        </div>
    );
};

export default YouTubeSearchModal;
