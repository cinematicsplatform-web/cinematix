import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Content, View } from '@/types';
import { ContentType } from '@/types';
import { SearchIcon } from './icons/SearchIcon';
import { CloseIcon } from './icons/CloseIcon';
import { PlayIcon } from './icons/PlayIcon';

interface SearchPageProps {
    allContent: Content[];
    onSelectContent: (content: Content, seasonNumber?: number) => void;
    onSetView: (view: View) => void;
    onClose?: () => void;
}

const SearchResultCard: React.FC<{ content: any; onClick: () => void }> = ({ content, onClick }) => {
    
    const imageSrc = content.backdrop || content.poster;
    const seasonCount = content.seasons?.length || 0;
    const isSeasonItem = content.isSeasonItem;
    
    const isEpisodic = content.type === ContentType.Series || content.type === ContentType.Program;

    const displaySeasonLabel = isSeasonItem 
        ? `الموسم ${content.seasonNumber}`
        : (seasonCount > 2 ? `${seasonCount} مواسم` : (seasonCount > 0 ? "موسمين" : ""));

    const showSeasonBadge = isSeasonItem || (isEpisodic && seasonCount > 1);
    const genreText = content.genres?.slice(0, 2).join(' • ');

    const slug = content.slug || content.id;
    const detailUrl = !isEpisodic
      ? `/watch/movie/${slug}` 
      : `/${content.type}/${slug}/الموسم${content.seasonNumber || 1}`;

    const getTypeText = (type: string) => {
        switch(type) {
            case ContentType.Movie: return 'فيلم';
            case ContentType.Series: return 'مسلسل';
            case ContentType.Program: return 'برنامج';
            case ContentType.Concert: return 'حفل';
            case ContentType.Play: return 'مسرحية';
            default: return 'عمل';
        }
    }

    return (
        <a 
            href={detailUrl}
            aria-label={`شاهد ${content.title}`}
            onClick={(e) => {
              e.preventDefault();
              onClick();
            }}
            className="relative group block no-underline text-inherit w-full cursor-pointer overflow-hidden rounded-xl bg-[#1a2230] border border-gray-800 transition-all duration-300 ease-out origin-center hover:scale-[1.02] hover:border-gray-600 hover:shadow-2xl md:hover:scale-105"
        >
            <div className="aspect-video w-full relative overflow-hidden">
                <img 
                    src={imageSrc} 
                    alt={content.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#151922] via-transparent to-transparent opacity-90"></div>
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full border border-white/30">
                        <PlayIcon className="w-8 h-8 text-white fill-white" />
                    </div>
                </div>

                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    {content.bannerNote && (
                        <span className="bg-[#E50914]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg backdrop-blur-sm border border-white/10">
                            {content.bannerNote}
                        </span>
                    )}
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 flex flex-col items-start justify-end bg-gradient-to-t from-[#151922] via-[#151922]/80 to-transparent pt-12">
                <div className="mb-2">
                    {content.isLogoEnabled && content.logoUrl ? (
                        <img src={content.logoUrl} alt={content.title} className="h-8 md:h-12 object-contain drop-shadow-md" />
                    ) : (
                        <h3 className="text-white font-bold text-base md:text-lg leading-tight drop-shadow-md line-clamp-1">
                            {content.title}
                        </h3>
                    )}
                </div>
                
                <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[10px] md:text-xs font-medium text-gray-300">
                    <span className="bg-white/20 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-white font-bold shadow-sm">
                        {getTypeText(content.type)}
                    </span>
                    {showSeasonBadge && (
                        <>
                            <span className={`${isSeasonItem ? 'text-[#FFD700]' : 'text-[#00A7F8]'} font-bold`}>{displaySeasonLabel}</span>
                            <span className="opacity-50 text-[8px]">•</span>
                        </>
                    )}
                    <span className="text-white font-bold">{content.releaseYear}</span>
                    {genreText && (
                        <>
                            <span className="opacity-50 text-[8px]">•</span>
                            <span className="text-white opacity-90">{genreText}</span>
                        </>
                    )}
                </div>
            </div>
        </a>
    );
};

const SearchPage: React.FC<SearchPageProps> = ({ allContent, onSelectContent, onSetView, onClose }) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    const { results, relatedTags } = useMemo(() => {
        if (!query.trim()) return { results: [], relatedTags: [] };

        const lowerQuery = query.toLowerCase();
        
        const matchedParents = allContent.filter(c => 
            c.title.toLowerCase().includes(lowerQuery) || 
            c.cast.some(actor => actor.toLowerCase().includes(lowerQuery)) ||
            c.genres.some(g => g.toLowerCase().includes(lowerQuery))
        );

        const explodedResults: any[] = [];
        
        matchedParents.forEach(item => {
            const isEpisodic = item.type === ContentType.Series || item.type === ContentType.Program;
            if (isEpisodic && item.seasons && item.seasons.length > 0) {
                const sortedSeasons = [...item.seasons].sort((a, b) => a.seasonNumber - b.seasonNumber);
                sortedSeasons.forEach(season => {
                    explodedResults.push({
                        ...item, 
                        id: `${item.id}_s${season.seasonNumber}`, 
                        _original: item, 
                        isSeasonItem: true,
                        seasonNumber: season.seasonNumber,
                        title: season.title || item.title,
                        poster: season.poster || item.poster,
                        backdrop: season.backdrop || item.backdrop,
                        releaseYear: season.releaseYear || item.releaseYear,
                        logoUrl: season.logoUrl || item.logoUrl,
                        isLogoEnabled: season.logoUrl ? true : item.isLogoEnabled,
                        description: season.description || item.description,
                    });
                });
            } else {
                explodedResults.push(item);
            }
        });

        const tags = new Set<string>();
        matchedParents.forEach(c => tags.add(c.title));
        matchedParents.forEach(c => c.cast.forEach(actor => { if (actor.toLowerCase().includes(lowerQuery)) tags.add(actor); }));
        matchedParents.forEach(c => c.genres.forEach(g => { if (g.toLowerCase() !== lowerQuery) tags.add(g); }));

        return { 
            results: explodedResults, 
            relatedTags: Array.from(tags).slice(0, 10) 
        };
    }, [query, allContent]);

    const handleTagClick = (tag: string) => {
        setQuery(tag);
        if (inputRef.current) inputRef.current.focus();
    };

    const handleClear = () => {
        setQuery('');
        if (inputRef.current) inputRef.current.focus();
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#0f1014] animate-fade-in pb-20">
            <div className="relative flex flex-col w-full h-full">
                
                {/* Header */}
                <div className="bg-[#151922] border-b border-gray-800 shadow-xl z-20">
                    <div className="max-w-[1920px] mx-auto px-4 md:px-8 h-20 flex items-center gap-4">
                        
                        <div className="flex-1 relative flex items-center bg-[#0f1014] border border-gray-700 rounded-full px-4 h-12 focus-within:border-[#00A7F8] focus-within:ring-1 focus-within:ring-[#00A7F8] transition-all">
                            <SearchIcon className="w-5 h-5 text-gray-400 ml-3" />
                            <input 
                                ref={inputRef}
                                type="text" 
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="ابحث عن مسلسل، فيلم..."
                                className="w-full bg-transparent text-white text-base md:text-lg placeholder-gray-600 outline-none h-full"
                            />
                            {query && (
                                <button onClick={handleClear} className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Related Tags */}
                    {relatedTags.length > 0 && (
                        <div className="w-full border-t border-gray-800 bg-[#12151c]">
                            <div className="max-w-[1920px] mx-auto px-4 md:px-8 py-2 flex items-center justify-start overflow-x-auto rtl-scroll gap-2">
                                {relatedTags.map((tag, index) => (
                                    <button key={index} onClick={() => handleTagClick(tag)} className="px-3 py-1 rounded-full bg-[#1f2937] hover:bg-[#00A7F8] text-gray-400 hover:text-white text-xs whitespace-nowrap border border-gray-700 hover:border-[#00A7F8] transition-colors">{tag}</button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-[#0f1014] w-full">
                    {query.trim() === '' ? (
                        <div className="flex flex-col items-center justify-center pt-32 opacity-50">
                            <SearchIcon className="w-16 h-16 text-gray-600 mb-4" />
                            <p className="text-xl text-gray-400">ابحث عن أفلامك ومسلسلاتك المفضلة</p>
                        </div>
                    ) : (
                        <div className="max-w-[1920px] mx-auto px-4 md:px-8 pt-6 pb-24">
                            {results.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {results.map(item => (
                                        <SearchResultCard key={item.id} content={item} onClick={() => onSelectContent(item._original || item, item.seasonNumber)} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <p className="text-gray-500 text-lg mb-4">لا توجد نتائج مطابقة لـ "{query}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchPage;