import React from 'react';
import type { Content, Category, Genre, Season, Episode } from '@/types';
import { ContentType, genres } from '@/types';
import { 
    sectionBoxClass, CloudArrowDownIcon, SearchIcon, RefreshIcon, 
    inputClass, labelClass, LanguageIcon, CheckSmallIcon, 
    FamilyIcon, AdultIcon, PhotoIcon, YouTubeIcon, 
    LayersIcon, ExcelIcon, PlusIcon, TrashIcon, 
    StackIcon, ServerIcon, INPUT_BG, FOCUS_RING,
    ChevronDownIcon, PlayIcon, StarIcon, CalendarIcon, CloseIcon
} from './ContentEditIcons';
import ToggleSwitch from '../ToggleSwitch';
import MobileSimulator from './MobileSimulator';

// --- General Tab ---
export const GeneralTab: React.FC<any> = (props) => {
    const {
        formData, handleChange, tmdbIdInput, setTmdbIdInput, fetchLoading,
        fetchFromTMDB, updateLoading, handleComprehensiveUpdate, tmdbSearchMode,
        setTmdbSearchMode, tmdbSearchQuery, setTmdbSearchQuery, tmdbSearchResults,
        isSearchingTMDB, searchTMDB, handleSelectSearchResult, openTitleGallery,
        isEpisodic, isStandalone, isNewContent, castQuery, searchCast,
        isSearchingCast, castResults, addCastMember, removeCastMember,
        setVisibility, setType, setIsUpcoming
    } = props;

    const getSearchBadge = (mediaType: string) => {
        switch (mediaType) {
            case 'movie': return { label: 'فيلم', color: 'bg-blue-600/90' };
            case 'tv': return { label: 'مسلسل', color: 'bg-purple-600/90' };
            default: return { label: mediaType === 'person' ? 'فنان' : mediaType, color: 'bg-gray-600/90' };
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">
            <div className="lg:col-span-12 rounded-2xl border border-blue-500/10 bg-gradient-to-r from-blue-900/10 to-transparent p-4 md:p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <CloudArrowDownIcon className="w-40 h-40"/>
                </div>
                <div className="relative z-10">
                    <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                        <CloudArrowDownIcon className="w-5 h-5"/> جلب بيانات تلقائي (TMDB)
                    </h3>
                    <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-4">
                        <div className="flex rounded-lg bg-[#0f1014] p-1 border border-gray-700 self-start">
                            <button type="button" onClick={() => setTmdbSearchMode('name')} className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${tmdbSearchMode === 'name' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>بحث بالاسم</button>
                            <button type="button" onClick={() => setTmdbSearchMode('id')} className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${tmdbSearchMode === 'id' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>بحث بالـ ID</button>
                        </div>
                        <div className="flex-1 w-full md:w-auto flex gap-2">
                            {tmdbSearchMode === 'name' ? (
                                <div className="relative flex-1">
                                    <input type="text" value={tmdbSearchQuery} onChange={(e) => setTmdbSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchTMDB()} placeholder="اكتب اسم الفيلم أو المسلسل..." className={inputClass + " pr-10"} />
                                    <button type="button" onClick={searchTMDB} className="absolute left-1 top-1 bottom-1 bg-blue-600 text-white px-4 rounded hover:bg-blue-500"><SearchIcon className="w-4 h-4"/></button>
                                </div>
                            ) : (
                                <div className="flex gap-2 flex-1">
                                    <input type="text" value={tmdbIdInput} onChange={(e) => setTmdbIdInput(e.target.value)} placeholder="TMDB ID..." className={inputClass} />
                                    <button type="button" onClick={() => fetchFromTMDB()} disabled={fetchLoading} className="bg-blue-600 text-white px-6 rounded-lg font-bold hover:bg-blue-500 whitespace-nowrap">{fetchLoading ? '...' : 'جلب'}</button>
                                </div>
                            )}
                        </div>
                        {isEpisodic && !isNewContent && (
                            <button type="button" onClick={handleComprehensiveUpdate} disabled={updateLoading} className="flex items-center justify-center gap-2 bg-green-600/20 text-green-400 border border-green-600/30 px-4 py-2 rounded-lg hover:bg-green-600 hover:text-white transition-all w-full md:w-auto justify-center"><RefreshIcon className="w-4 h-4"/> تحديث شامل</button>
                        )}
                    </div>
                    {tmdbSearchMode === 'name' && tmdbSearchResults.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                            {tmdbSearchResults.map((result: any) => {
                                const badgeInfo = getSearchBadge(result.media_type);
                                return (
                                    <div key={result.id} onClick={() => handleSelectSearchResult(result)} className="group cursor-pointer">
                                        <div className="aspect-[2/3] rounded-lg overflow-hidden border border-gray-700 relative">
                                            {result.poster_path ? <img src={`https://image.tmdb.org/t/p/w200${result.poster_path}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" /> : <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs">No Image</div>}
                                            <div className={`absolute top-1 left-1 z-10 px-2 py-0.5 rounded text-[9px] font-black text-white shadow-lg backdrop-blur-sm ${badgeInfo.color}`}>{badgeInfo.label}</div>
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded">اختر</span></div>
                                        </div>
                                        <div className="mt-2 text-center">
                                            <div className="text-xs font-bold text-white truncate">{result.title || result.name}</div>
                                            <div className="text-[10px] text-gray-500">{result.release_date?.substring(0,4) || result.first_air_date?.substring(0,4)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className={`${sectionBoxClass} lg:col-span-9 h-full flex flex-col`}>
                <h4 className="text-sm font-bold text-[#00A7F8] mb-6 uppercase border-b border-gray-800 pb-2">البيانات الأساسية</h4>
                <div className="space-y-6 flex-1">
                    <div>
                        <label className={labelClass}>عنوان العمل</label>
                        <div className="flex items-stretch gap-2">
                            <input type="text" name="title" value={formData.title} onChange={handleChange} className={`${inputClass} flex-1`} placeholder="اسم الفيلم أو المسلسل" />
                            <button type="button" onClick={openTitleGallery} className="flex items-center justify-center rounded-lg bg-gray-800 px-4 text-white shadow-md transition-all hover:bg-gray-700 hover:text-[var(--color-accent)] border border-gray-700" title="اختر عنواناً بدلاً من TMDB"><LanguageIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>النص الوصفي (يظهر على البوستر)</label>
                        <input type="text" name="bannerNote" value={formData.bannerNote || ''} onChange={handleChange} className={inputClass} placeholder="مثال: مترجم، مدبلج، حصري..." />
                    </div>
                    <div>
                        <label className={labelClass}>الوصف (القصة)</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className={inputClass + " resize-none h-40"} placeholder="اكتب ملخص القصة..." />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className={labelClass}>سنة الإنتاج</label><input type="number" name="releaseYear" value={formData.releaseYear} onChange={handleChange} className={inputClass} /></div>
                        <div><label className={labelClass}>التقييم (10/x)</label><input type="number" step="0.1" name="rating" value={formData.rating} onChange={handleChange} className={inputClass + " text-yellow-400 font-bold"} /></div>
                    </div>
                </div>
            </div>

            <div className={`${sectionBoxClass} lg:col-span-3 h-full flex flex-col`}>
                <h4 className="text-sm font-bold text-gray-500 mb-6 uppercase border-b border-gray-800 pb-2">خيارات الحالة</h4>
                <div className="flex flex-col gap-4 flex-1">
                    <div className="bg-[#161b22] p-4 rounded-xl border border-gray-700 space-y-4">
                        <label className={labelClass}>الحالة (قريباً)</label>
                        <ToggleSwitch checked={formData.isUpcoming || false} onChange={setIsUpcoming} label={formData.isUpcoming ? "قريباً (Upcoming)" : "متاح الآن"} />
                    </div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-4 border-b border-gray-800 pb-1">النوع</h4>
                    <div className="flex flex-col gap-2">
                        {[ContentType.Movie, ContentType.Series, ContentType.Program, ContentType.Play, ContentType.Concert].map((type) => (
                            <button key={type} type="button" onClick={() => setType(type)} className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${formData.type === type ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)] text-[var(--color-accent)] font-bold text-sm' : 'bg-[#161b22] border-transparent text-gray-400 hover:border-gray-600 text-sm'}`}>
                                <span>{type === ContentType.Movie ? 'فيلم' : type === ContentType.Series ? 'مسلسل' : type === ContentType.Program ? 'برنامج' : type === ContentType.Play ? 'مسرحية' : 'حفلة'}</span>
                                {formData.type === type && <CheckSmallIcon className="w-4 h-4"/>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className={`${sectionBoxClass} lg:col-span-9 h-full flex flex-col`}>
                <h4 className="text-sm font-bold text-gray-500 mb-6 uppercase border-b border-gray-800 pb-2">تفاصيل إضافية</h4>
                <div className="space-y-6 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div><label className={labelClass}>المخرج</label><input type="text" name="director" value={formData.director || ''} onChange={handleChange} className={inputClass} /></div>
                        <div><label className={labelClass}>الكاتب</label><input type="text" name="writer" value={formData.writer || ''} onChange={handleChange} className={inputClass} /></div>
                        <div><label className={labelClass}>التصنيف العمري</label><input type="text" name="ageRating" value={formData.ageRating} onChange={handleChange} className={inputClass} placeholder="+13" /></div>
                        {isStandalone && <div><label className={labelClass}>المدة</label><input type="text" name="duration" value={formData.duration || ''} onChange={handleChange} className={inputClass} placeholder="1h 30m" /></div>}
                    </div>
                    <div className="border-t border-gray-800 pt-4">
                        <label className={labelClass}>طاقم العمل</label>
                        <div className="relative mb-3">
                            <input type="text" value={castQuery} onChange={(e) => searchCast(e.target.value)} className={inputClass} placeholder="بحث عن ممثل في TMDB..." />
                            {isSearchingCast && <div className="absolute left-3 top-3"><div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"/></div>}
                            {castResults.length > 0 && (
                                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#1a1f29] border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                    {castResults.map((person: any) => (
                                        <div key={person.id} onClick={() => addCastMember(person)} className="flex items-center gap-3 p-2 hover:bg-gray-700 cursor-pointer border-b border-gray-800 last:border-0 text-right">
                                            <img src={person.profile_path ? `https://image.tmdb.org/t/p/w45${person.profile_path}` : 'https://placehold.co/45x45'} className="w-8 h-8 rounded-full object-cover" alt=""/>
                                            <span className="text-xs text-white">{person.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar p-1">
                            {formData.cast.map((c: string, i: number) => (
                                <span key={i} className="flex items-center gap-1 bg-gray-800 text-[11px] font-bold px-3 py-1 rounded-full border border-gray-700 text-gray-300">
                                    {c} <button type="button" onClick={() => removeCastMember(c)} className="text-gray-500 hover:text-red-400 transition-colors mr-1"><CloseIcon className="w-3 h-3"/></button>
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-800 pt-4">
                        <div><label className={labelClass}>Slug (الرابط)</label><input type="text" name="slug" value={formData.slug || ''} onChange={handleChange} className={inputClass + " font-mono text-xs text-blue-400 text-left dir-ltr"} /></div>
                        <div><label className={labelClass}>كود (TMDB ID)</label><input type="text" name="tmdbId" value={formData.tmdbId || ''} onChange={handleChange} className={inputClass + " font-mono text-[var(--color-accent)] text-left dir-ltr"} /></div>
                    </div>
                </div>
            </div>

            <div className={`${sectionBoxClass} lg:col-span-3 h-full flex flex-col`}>
                <h4 className="text-sm font-bold text-gray-500 mb-6 uppercase border-b border-gray-800 pb-2">جمهور المشاهدة</h4>
                <div className="space-y-6 flex-1 justify-center flex flex-col">
                    <button type="button" onClick={() => props.setVisibility('general')} className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all ${formData.visibility === 'general' ? 'border-green-500/50 bg-green-500/10 ring-1 ring-green-500/20' : 'border-gray-800 bg-[#161b22]'}`}>
                        <div className={`p-3 rounded-full ${formData.visibility === 'general' ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-gray-700 text-gray-500'}`}><FamilyIcon className="w-6 h-6"/></div>
                        <div className="text-right"><div className={`text-lg font-black ${formData.visibility === 'general' ? 'text-green-400' : 'text-gray-300'}`}>عائلي (عام)</div><div className="text-xs text-gray-500 font-bold">مناسب للجميع وآمن للأطفال</div></div>
                    </button>
                    <button type="button" onClick={() => props.setVisibility('adults')} className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all ${formData.visibility === 'adults' ? 'border-red-500/50 bg-red-500/10 ring-1 ring-red-500/20' : 'border-gray-800 bg-[#161b22]'}`}>
                        <div className={`p-3 rounded-full ${formData.visibility === 'adults' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-gray-700 text-gray-500'}`}><AdultIcon className="w-6 h-6"/></div>
                        <div className="text-right"><div className={`text-lg font-black ${formData.visibility === 'adults' ? 'text-red-400' : 'text-gray-300'}`}>للكبار فقط</div><div className="text-xs text-gray-500 font-bold">+18 محتوى مقيد للبالغين</div></div>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Categories Tab ---
export const CategoriesTab: React.FC<any> = ({ filteredCategories, handleCategoryChange, formData, handleGenreChange }) => {
    const SEARCH_CATEGORIES = [
        'مصري', 'عربي', 'تركي', 'أجنبي', 'برامج',
        'رومانسي', 'عائلي', 'كوميديا', 'دراما', 'أكشن',
        'جريمة', 'خيال علمي', 'رعب', 'تركي مدبلج', 'مسرح', 'قريباً'
    ];

    return (
        <div className={sectionBoxClass + " animate-fade-in-up"}>
            <div className="space-y-8">
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">التصنيفات الرئيسية</h3>
                    <div className="flex flex-wrap gap-3">
                        {filteredCategories.map((cat: Category) => (
                            <button key={cat} type="button" onClick={() => handleCategoryChange(cat)} className={`flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-bold transition-all duration-300 ${formData.categories.includes(cat) ? 'scale-105 border-transparent bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black shadow-lg shadow-[var(--color-accent)]/20' : `${INPUT_BG} border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white`}`}>
                                {cat} {formData.categories.includes(cat) && <CheckSmallIcon />}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">تصنيفات البحث</h3>
                    <div className="flex flex-wrap gap-3">
                        {SEARCH_CATEGORIES.map((cat) => (
                            <button key={cat} type="button" onClick={() => handleCategoryChange(cat as Category)} className={`flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-bold transition-all duration-300 ${formData.categories.includes(cat as Category) ? 'scale-105 border-purple-500/50 bg-purple-500/10 text-purple-300 shadow-lg shadow-purple-500/10' : `${INPUT_BG} border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white`}`}>
                                {cat} {formData.categories.includes(cat as Category) && <CheckSmallIcon />}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">النوع الفني</h3>
                    <div className="flex flex-wrap gap-2">
                        {genres.map((g: Genre) => (
                            <button key={g} type="button" onClick={() => handleGenreChange(g)} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold transition-all duration-200 ${formData.genres.includes(g) ? 'bg-white text-black border-white' : `${INPUT_BG} border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white`}`}>
                                {g} {formData.genres.includes(g) && <CheckSmallIcon />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Media Tab ---
export const MediaTab: React.FC<any> = ({ formData, setFormData, openGallery, setYouTubeSearchState }) => {
    const renderImageInput = (label: string, value: string | undefined, field: keyof Content, galleryType: 'poster' | 'backdrop' | 'logo', placeholder: string = "https://...", previewClass: string = "w-12 h-16") => (
        <div>
            <label className={labelClass}>{label}</label>
            <div className="flex items-stretch gap-2">
                <input type="text" value={value || ''} onChange={(e) => setFormData((prev: any) => ({...prev, [field]: e.target.value}))} className={`${inputClass} flex-1 dir-ltr text-left`} placeholder={placeholder} />
                <button type="button" onClick={() => openGallery(galleryType, (url: string) => setFormData((prev: any) => ({...prev, [field]: url})))} className="flex items-center justify-center rounded-lg bg-gray-800 px-4 text-white shadow-md transition-all hover:bg-gray-700 hover:text-[var(--color-accent)] border border-gray-700" title="اختر من المعرض"><PhotoIcon className="w-5 h-5"/></button>
                {value && <div className={`${previewClass} bg-black flex-shrink-0 overflow-hidden rounded-lg border border-gray-700 shadow-sm`}><img src={value} className="h-full w-full object-cover" alt="preview" /></div>}
            </div>
        </div>
    );
    return (
        <div className="flex flex-col gap-8 animate-fade-in-up">
            <div className={`w-full space-y-6 ${sectionBoxClass}`}>
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><PhotoIcon className="w-5 h-5 text-[var(--color-accent)]"/> الصور الأساسية</h3>
                {renderImageInput("البوستر العمودي (Poster)", formData.poster, 'poster', 'poster', "https://...", "w-20 h-28")}
                {renderImageInput("خلفية عريضة (Backdrop)", formData.backdrop, 'backdrop', 'backdrop', "https://...", "w-32 h-20")}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {renderImageInput("بوستر عريض (Horizontal)", formData.horizontalPoster, 'horizontalPoster', 'backdrop', "https://...", "w-24 h-14")}
                     {renderImageInput("توب 10 (Top 10)", formData.top10Poster, 'top10Poster', 'poster', "https://...", "w-16 h-20")}
                </div>
                <div className="border-t border-gray-800 pt-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <label className={labelClass}>اللوجو (شعار شفاف)</label>
                        <ToggleSwitch checked={formData.isLogoEnabled || false} onChange={(val) => setFormData((prev: any) => ({...prev, isLogoEnabled: val}))} label={formData.isLogoEnabled ? "مفعل" : "معطل"}/>
                    </div>
                    {renderImageInput("", formData.logoUrl, 'logoUrl', 'logo', "https://...", "hidden")}
                    {formData.logoUrl && <div className="mt-2 bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-gray-800 p-4 rounded-lg flex justify-center"><img src={formData.logoUrl} className="h-16 object-contain" alt="" /></div>}
                </div>
                <div>
                     <label className={labelClass}>رابط التريلر (YouTube)</label>
                     <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <input type="text" value={formData.trailerUrl || ''} onChange={(e) => setFormData((prev: any) => ({...prev, trailerUrl: e.target.value}))} className={inputClass + " dir-ltr text-left"} placeholder="https://youtube.com/..." />
                            <button type="button" onClick={() => setYouTubeSearchState({ isOpen: true, targetId: 'main' })} className="absolute left-1 top-1 bottom-1 bg-red-600/10 border border-red-600/30 text-red-500 rounded-md px-3 text-[10px] font-black hover:bg-red-600 hover:text-white transition-all flex items-center justify-center"><YouTubeIcon className="w-4 h-4" /></button>
                        </div>
                     </div>
                </div>
            </div>
            <div className={`w-full ${sectionBoxClass}`}>
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">📱 تخصيص الموبايل</h3>
                {renderImageInput("صورة الخلفية للموبايل", formData.mobileBackdropUrl, 'mobileBackdropUrl', 'poster', "https://...", "hidden")}
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-gray-400 uppercase">تفعيل القص التلقائي</span>
                        <ToggleSwitch checked={formData.enableMobileCrop || false} onChange={(val) => setFormData((prev: any) => ({...prev, enableMobileCrop: val}))} label={formData.enableMobileCrop ? "مفعل" : "معطل"}/>
                    </div>
                    {formData.enableMobileCrop && (
                        <MobileSimulator imageUrl={formData.mobileBackdropUrl || formData.backdrop || ''} posX={formData.mobileCropPositionX ?? 50} posY={formData.mobileCropPositionY ?? 50} contentData={formData} onUpdateX={(v) => setFormData((prev: any) => ({...prev, mobileCropPositionX: v}))} onUpdateY={(v) => setFormData((prev: any) => ({...prev, mobileCropPositionY: v}))}/>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Seasons Tab ---
export const SeasonsTab: React.FC<any> = (props) => {
    const {
        formData, expandedSeasons, toggleSeason, handleComprehensiveUpdate,
        globalFileInputRef, handleBulkSeriesImport, handleAddSeason, handleUpdateSpecificSeasonFromTMDB,
        handleSeasonExcelImport, openBulkActionModal, handleAddEpisode, requestDeleteSeason,
        requestDeleteEpisode, handleUpdateSeason, setYouTubeSearchState, openGallery,
        handleUpdateEpisode, setEditingServersForEpisode
    } = props;

    const renderImageInput = (label: string, value: string | undefined, seasonId: number, field: keyof Season, galleryType: 'poster' | 'backdrop' | 'logo', placeholder: string = "https://...") => (
        <div>
            <label className={labelClass}>{label}</label>
            <div className="flex items-stretch gap-2">
                <input type="text" value={value || ''} onChange={(e) => handleUpdateSeason(seasonId, field, e.target.value)} className={`${inputClass} flex-1 dir-ltr text-left`} placeholder={placeholder} />
                <button type="button" onClick={() => openGallery(galleryType, (url: string) => handleUpdateSeason(seasonId, field, url))} className="flex items-center justify-center rounded-lg bg-gray-800 px-4 text-white shadow-md transition-all hover:bg-gray-700 hover:text-[var(--color-accent)] border border-gray-700" title="اختر من المعرض"><PhotoIcon className="w-5 h-5"/></button>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in-up space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-[#0f1014] p-4 rounded-xl border border-gray-800 gap-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><LayersIcon className="w-6 h-6 text-[var(--color-accent)]"/> قائمة المواسم</h3>
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={handleComprehensiveUpdate} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-600 hover:text-white transition-all w-full md:w-auto"><RefreshIcon className="w-4 h-4"/> تحديث كافة المواسم</button>
                    <button type="button" onClick={() => globalFileInputRef.current?.click()} className="flex items-center justify-center gap-2 px-4 py-2 bg-[#161b22] border border-gray-700 text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-800 hover:text-white w-full md:w-auto"><ExcelIcon className="w-4 h-4"/> استيراد Excel</button>
                    <input type="file" className="hidden" ref={globalFileInputRef} accept=".xlsx" onChange={handleBulkSeriesImport}/>
                    <button type="button" onClick={handleAddSeason} className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-black rounded-lg text-sm font-bold hover:bg-white transition-colors w-full md:w-auto"><PlusIcon className="w-4 h-4"/> إضافة موسم</button>
                </div>
            </div>
            <div className="space-y-4">
                {formData.seasons?.map((season: Season) => (
                    <div key={season.id} className="bg-[#0f1014] border border-gray-800 rounded-xl overflow-hidden transition-all hover:border-gray-700">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#161b22] cursor-pointer gap-4" onClick={() => toggleSeason(season.id)}>
                            <div className="flex items-center gap-4">
                                <div className={`transition-transform duration-300 ${expandedSeasons.has(season.id) ? 'rotate-180' : ''}`}><ChevronDownIcon className="w-5 h-5 text-gray-500"/></div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <input onClick={e => e.stopPropagation()} value={season.title} onChange={e => handleUpdateSeason(season.id, 'title', e.target.value)} className="bg-transparent text-lg font-bold text-white border-none focus:ring-0 p-0 w-32"/>
                                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{season.episodes.length} حلقة</span>
                                        {season.isUpcoming && <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-black animate-pulse">قريباً</span>}
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-1">ID: {season.id}</div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleUpdateSpecificSeasonFromTMDB(season.id, season.seasonNumber); }} className="flex items-center gap-1 p-2 hover:bg-blue-900/30 text-blue-400 rounded text-xs font-bold" title="تحديث هذا الموسم فقط"><RefreshIcon className="w-3 h-3"/> تحديث</button>
                                <input onClick={e => e.stopPropagation()} type="file" id={`excel-${season.id}`} className="hidden" accept=".xlsx" onChange={(e) => handleSeasonExcelImport(e, season.id, season.seasonNumber)}/>
                                <label htmlFor={`excel-${season.id}`} className="p-2 hover:bg-green-900/30 text-green-600 rounded cursor-pointer" title="استيراد حلقات"><ExcelIcon className="w-4 h-4"/></label>
                                <button type="button" onClick={(e) => { e.stopPropagation(); openBulkActionModal(season.id, 'add'); }} className="p-2 hover:bg-blue-600/10 text-blue-500 rounded font-bold text-[10px] flex items-center gap-1" title="إضافة حلقات متعددة"><StackIcon className="w-4 h-4"/> +</button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); openBulkActionModal(season.id, 'delete'); }} className="p-2 hover:bg-red-600/10 text-red-500 rounded font-bold text-[10px] flex items-center gap-1" title="حذف حلقات متعددة"><StackIcon className="w-4 h-4"/> -</button>
                                <button type="button" onClick={(e) => {e.stopPropagation(); handleAddEpisode(season.id)}} className="p-2 hover:bg-gray-800 text-blue-400 rounded" title="إضافة حلقة"><PlusIcon className="w-4 h-4"/></button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); requestDeleteSeason(season.id, season.title || `الموسم ${season.seasonNumber}`); }} className="p-2 hover:bg-red-900/30 text-red-500 rounded" title="حذف الموسم"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                        {expandedSeasons.has(season.id) && (
                            <div className="p-4 md:p-6 border-t border-gray-800 bg-[#0a0a0a]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-4 md:p-6 bg-[#13161c] rounded-2xl border border-gray-800/50 text-right">
                                    <div className="col-span-full mb-4 border-b border-gray-800 pb-2 flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-blue-400">بيانات الموسم {season.seasonNumber}</h4>
                                        <div className="flex items-center gap-3">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">موسم قادم (قريباً)</label>
                                            <ToggleSwitch checked={season.isUpcoming || false} onChange={(val) => handleUpdateSeason(season.id, 'isUpcoming', val)} label={season.isUpcoming ? "نعم" : "لا"} className="scale-75 origin-right" />
                                        </div>
                                    </div>
                                    {formData.seasons?.length === 1 ? (
                                        <div className="col-span-full p-8 bg-black/20 rounded-2xl border border-dashed border-gray-800 text-center animate-fade-in"><p className="text-gray-400 text-sm font-bold">يتم مزامنة صور وميديا هذا الموسم تلقائياً مع بيانات العمل الأساسية.</p></div>
                                    ) : (
                                        <>
                                            {renderImageInput("بوستر الموسم", season.poster, season.id, 'poster', 'poster', "Poster URL")}
                                            {renderImageInput("خلفية الموسم", season.backdrop, season.id, 'backdrop', 'backdrop', "Backdrop URL")}
                                            {renderImageInput("بوستر عريض", season.horizontalPoster, season.id, 'horizontalPoster', 'backdrop', "Horizontal Poster URL")}
                                            {renderImageInput("شعار الموسم", season.logoUrl, season.id, 'logoUrl', 'logo', "Logo URL")}
                                            {renderImageInput("صورة الموبايل", season.mobileImageUrl, season.id, 'mobileImageUrl', 'poster', "Mobile Image URL")}
                                            <div className="space-y-4">
                                                <div>
                                                    <label className={labelClass}>رابط التريلر (Trailer Link)</label>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1 relative">
                                                            <input value={season.trailerUrl || ''} onChange={(e) => handleUpdateSeason(season.id, 'trailerUrl', e.target.value)} className={inputClass + " dir-ltr text-left"} placeholder="YouTube Trailer URL" />
                                                            <button type="button" onClick={() => setYouTubeSearchState({ isOpen: true, targetId: season.id })} className="absolute left-1 top-1 bottom-1 bg-red-600/10 border border-red-600/30 text-red-500 rounded-md px-3 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center"><YouTubeIcon className="w-4 h-4" /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div><label className={labelClass}>سنة إنتاج الموسم</label><input type="number" value={season.releaseYear || ''} onChange={e => handleUpdateSeason(season.id, 'releaseYear', parseInt(e.target.value))} className={inputClass} placeholder="مثال: 2024"/></div>
                                            </div>
                                            <div className="col-span-full"><label className={labelClass}>قصة الموسم</label><textarea value={season.description || ''} onChange={(e) => handleUpdateSeason(season.id, 'description', e.target.value)} className={inputClass} rows={2}/></div>
                                            <div className="col-span-full mt-4 p-4 border-t border-gray-800">
                                                <div className="flex justify-between items-center mb-4"><label className={labelClass}>تخصيص الموبايل لهذا الموسم</label><ToggleSwitch checked={season.enableMobileCrop || false} onChange={(val) => handleUpdateSeason(season.id, 'enableMobileCrop', val)} label={season.enableMobileCrop ? "مفعل" : "معطل"}/></div>
                                                {season.enableMobileCrop && (<div className="mt-2"><MobileSimulator imageUrl={season.mobileImageUrl || season.backdrop || formData.backdrop || ''} posX={season.mobileCropPositionX ?? 50} posY={season.mobileCropPositionY ?? 50} contentData={{...formData, ...season, id: formData.id} as Content} onUpdateX={(v) => handleUpdateSeason(season.id, 'mobileCropPositionX', v)} onUpdateY={(v) => handleUpdateSeason(season.id, 'mobileCropPositionY', v)} /></div>)}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-gray-500 mb-2 px-2 uppercase tracking-widest text-right">قائمة الحلقات</h4>
                                    {season.episodes.map((ep, idx) => (
                                        <div key={ep.id} className="flex flex-col md:flex-row gap-4 p-4 md:p-5 rounded-2xl border border-gray-800 bg-[#161b22] hover:border-gray-700 transition-all group">
                                            <div className="w-full md:w-32 h-40 md:h-24 bg-black rounded-xl overflow-hidden border border-gray-800 flex-shrink-0 relative group/thumb">
                                                {ep.thumbnail ? <img src={ep.thumbnail} className="w-full h-full object-cover transition-transform group-hover/thumb:scale-110" alt=""/> : <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-600">No Image</div>}
                                                <button type="button" onClick={() => openGallery('backdrop', (url: string) => handleUpdateEpisode(season.id, ep.id, 'thumbnail', url))} className="absolute inset-0 bg-black/60 hidden group-hover/thumb:flex items-center justify-center text-white"><PhotoIcon className="w-5 h-5"/></button>
                                            </div>
                                            <div className="flex-1 space-y-4 md:space-y-3 w-full text-right">
                                                <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                                        <span className="bg-black text-gray-500 font-mono text-xs px-2 py-1 rounded-md border border-gray-800 shrink-0">#{idx+1}</span>
                                                        <input value={ep.title} onChange={(e) => handleUpdateEpisode(season.id, ep.id, 'title', e.target.value)} className="bg-transparent border-b border-gray-700 text-sm font-bold text-white focus:border-[var(--color-accent)] focus:outline-none flex-1 md:w-48 transition-colors"/>
                                                    </div>
                                                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                                                        <input value={ep.duration} onChange={(e) => handleUpdateEpisode(season.id, ep.id, 'duration', e.target.value)} className="bg-transparent border-b border-gray-700 text-xs text-gray-400 w-20 text-center" placeholder="00:00"/>
                                                        <label className="flex items-center gap-2 cursor-pointer bg-gray-800/50 px-3 py-1 rounded-lg border border-gray-700">
                                                            <input type="checkbox" checked={ep.isLastEpisode} onChange={e => handleUpdateEpisode(season.id, ep.id, 'isLastEpisode', e.target.checked)} className="accent-red-500 h-4 w-4"/>
                                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider whitespace-nowrap">الأخيرة؟</span>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div><label className="text-[9px] font-bold text-gray-600 mb-1 block uppercase">رابط صورة الحلقة</label><input value={ep.thumbnail || ''} onChange={(e) => handleUpdateEpisode(season.id, ep.id, 'thumbnail', e.target.value)} className="w-full bg-black/30 border border-gray-800 rounded-lg px-3 py-2 text-[10px] text-gray-400 focus:border-[var(--color-accent)] focus:outline-none dir-ltr text-left" placeholder="Link..."/></div>
                                                    <div><label className="text-[9px] font-bold text-gray-400 mb-1 block uppercase">وسام مخصص</label><input value={(ep as any).badgeText || ''} onChange={(e) => handleUpdateEpisode(season.id, ep.id, 'badgeText', e.target.value)} className="w-full bg-black/30 border border-gray-800 rounded-lg px-3 py-2 text-[10px] text-amber-400 focus:border-amber-500 focus:outline-none" placeholder="مثال: مؤجل..."/></div>
                                                </div>
                                                <input value={ep.description || ''} onChange={(e) => handleUpdateEpisode(season.id, ep.id, 'description', e.target.value)} className="w-full bg-transparent text-xs text-gray-500 focus:outline-none placeholder:text-gray-700" placeholder="اكتب وصفاً مختصراً لهذه الحلقة..."/>
                                            </div>
                                            <div className="flex flex-row md:flex-col gap-2 mt-2 md:mt-0 border-t border-gray-800 md:border-0 pt-4 md:pt-0">
                                                <button type="button" onClick={() => setEditingServersForEpisode(ep)} className={`flex-1 md:flex-none px-4 py-3 md:py-2 text-xs md:text-[10px] font-black rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all ${ep.servers?.length ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>
                                                    <ServerIcon className="w-4 h-4 md:w-3.5 md:h-3.5"/> سيرفرات ({ep.servers?.length || 0})
                                                </button>
                                                <button type="button" onClick={() => requestDeleteEpisode(season.id, ep.id, ep.title || '')} className="p-3 md:p-2 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 shadow-sm" title="حذف الحلقة"><TrashIcon className="w-5 h-5"/></button>
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
    );
};

// --- Servers Tab ---
export const ServersTab: React.FC<any> = ({ isStandalone, setIsManagingMovieServers, movieExcelInputRef, handleMovieExcelImport, handleDeleteSection, formData }) => {
    if (!isStandalone) return null;
    return (
        <div className={`${sectionBoxClass} animate-fade-in-up flex flex-col items-center justify-center py-20 text-center gap-8`}>
            <div className="flex flex-col items-center">
                <ServerIcon className="w-16 h-16 text-gray-700 mb-4"/>
                <h3 className="text-xl font-bold text-white mb-2">سيرفرات المشاهدة والتحميل</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-md">أضف روابط المشاهدة والتحميل لهذا الفيلم. يمكنك إضافة عدة سيرفرات لضمان التوفر أو الاستيراد من ملف Excel.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 w-full">
                <button type="button" onClick={() => setIsManagingMovieServers(true)} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-lg shadow-blue-600/20 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3"><ServerIcon className="w-5 h-5" />إدارة السيرفرات يدوياً ({formData.servers?.length || 0})</button>
                <div className="h-10 w-px bg-gray-800 hidden md:block"></div>
                <button type="button" onClick={() => movieExcelInputRef.current?.click()} className="px-10 py-4 bg-green-600/20 border border-green-500/30 text-green-400 font-black rounded-2xl hover:bg-green-600 hover:text-white transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3"><ExcelIcon className="w-5 h-5" />استيراد سيرفرات من Excel</button>
                <input type="file" className="hidden" ref={movieExcelInputRef} accept=".xlsx" onChange={handleMovieExcelImport}/>
            </div>
            <div className="pt-8 border-t border-gray-800 w-full max-w-xs mx-auto"><button type="button" onClick={() => handleDeleteSection('servers')} className="text-red-500/60 text-xs font-bold hover:text-red-500 hover:underline transition-all">حذف كافة روابط السيرفرات</button></div>
        </div>
    );
};

// --- Preview Tab ---
export const PreviewTab: React.FC<any> = ({ formData }) => {
    const posX = formData.mobileCropPositionX ?? 50;
    const posY = formData.mobileCropPositionY ?? 50;
    const imgStyle: React.CSSProperties = { '--mob-x': `${posX}%`, '--mob-y': `${posY}%`, objectPosition: `${posX}% ${posY}%` } as React.CSSProperties;
    const cropClass = formData.enableMobileCrop ? 'mobile-custom-crop' : '';
    return (
        <div className="space-y-12 animate-fade-in text-right" dir="rtl">
            <div className="flex flex-col items-center gap-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">📱</span>معاينة الجوال (Mobile View)</h3>
                <div className="relative w-[300px] md:w-[320px] h-[600px] md:h-[650px] bg-black border-[8px] md:border-[10px] border-[#1f2127] rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden ring-1 ring-white/10 scale-95 md:scale-100">
                    <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-black/80 to-transparent z-40 px-6 flex items-center"><div className="w-6 h-6 rounded-full bg-white/10"></div></div>
                    <div className="h-full bg-[#141b29] overflow-y-auto no-scrollbar scroll-smooth flex flex-col">
                        <div className="relative h-[400px] md:h-[480px] w-full flex-shrink-0">
                            <img src={formData.mobileBackdropUrl || formData.backdrop || 'https://placehold.co/1080x1920/101010/101010/png'} className={`absolute inset-0 h-full w-full object-cover ${cropClass} object-top transition-none`} style={imgStyle}/>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#141b29] via-[#141b29]/40 via-40% to-transparent z-10"></div>
                            <div className="absolute inset-0 z-20 flex flex-col justify-end p-5 pb-8 text-white text-center">
                                {formData.bannerNote && <div className="mb-2 mx-auto text-[10px] font-bold bg-[#6366f1]/80 text-white border border-[#6366f1]/30 px-2 py-0.5 rounded backdrop-blur-md w-fit">{formData.bannerNote}</div>}
                                <div className="mb-3">{formData.isLogoEnabled && formData.logoUrl ? <img src={formData.logoUrl} className="max-w-[140px] md:max-w-[160px] max-h-[80px] md:max-h-[100px] object-contain drop-shadow-2xl mx-auto" alt="" /> : <h1 className="text-xl md:text-2xl font-black drop-shadow-lg leading-tight">{formData.title || 'العنوان'}</h1>}</div>
                                <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-gray-200 mb-4 font-bold"><div className="flex items-center gap-1 text-yellow-400 bg-black/40 px-2 py-0.5 rounded-full border border-white/10"><StarIcon className="w-2.5 h-2.5" /><span>{formData.rating.toFixed(1)}</span></div><span>•</span><span>{formData.releaseYear}</span><span>•</span><span className="px-1 border border-gray-500 rounded text-[8px]">{formData.ageRating || 'G'}</span></div>
                                <div className="flex gap-2"><div className="flex-1 bg-[#00A7F8] text-black h-10 rounded-full flex items-center justify-center font-black text-xs gap-2"><PlayIcon className="w-3 h-3 fill-black" />شاهد الآن</div><div className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center font-bold text-lg">+</div></div>
                            </div>
                        </div>
                        <div className="sticky top-0 z-30 bg-[#141b29]/95 backdrop-blur-md border-b border-white/5 flex gap-4 px-4 h-12 items-center flex-shrink-0"><div className="text-[10px] font-black border-b-2 border-[#00A7F8] py-3 text-white">الحلقات</div><div className="text-[10px] font-black text-gray-500 py-3">التفاصيل</div><div className="text-[10px] font-black text-gray-500 py-3">أعمال مشابهة</div></div>
                        <div className="p-4 space-y-4 flex-1"><p className="text-[11px] text-gray-400 leading-relaxed text-justify line-clamp-4">{formData.description || 'قصة العمل تظهر هنا...'}</p><div className="grid grid-cols-2 gap-2"><div className="bg-white/5 p-3 rounded-xl border border-white/5 text-right"><span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">المخرج</span><span className="text-[10px] font-bold text-gray-300 truncate block">{formData.director || 'N/A'}</span></div><div className="bg-white/5 p-3 rounded-xl border border-white/5 text-right"><span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">التقييم</span><span className="text-[10px] font-bold text-yellow-400">★ {formData.rating}</span></div></div></div>
                    </div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1f2127] rounded-b-2xl z-50"></div>
                </div>
            </div>
            <div className="flex flex-col items-center gap-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">💻</span>معاينة المتصفح (Desktop View)</h3>
                <div className="w-full max-w-4xl aspect-video bg-[#141b29] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden relative group/desk">
                    <div className="h-8 bg-[#1f2127] border-b border-gray-800 flex items-center px-4 gap-1.5 z-50 relative"><div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div><div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div><div className="flex-1 h-5 bg-black/40 rounded-md mx-auto flex items-center px-3 text-left dir-ltr"><span className="text-[8px] text-gray-600 font-mono">cinematix.watch/{formData.slug || 'slug'}</span></div></div>
                    <div className="relative h-full w-full">
                        <img src={formData.backdrop || 'https://placehold.co/1920x1080/101010/101010/png'} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#141b29] via-[#141b29]/40 to-transparent z-10"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#141b29] via-transparent to-transparent z-10"></div>
                        <div className="absolute inset-0 p-12 flex flex-col justify-center items-start max-w-2xl text-right z-20">
                            {formData.bannerNote && <div className="mb-4 text-sm font-medium bg-[#6366f1]/80 text-white border border-[#6366f1]/30 px-3 py-1 rounded-lg backdrop-blur-md w-fit">{formData.bannerNote}</div>}
                            <div className="mb-6">{formData.isLogoEnabled && formData.logoUrl ? <img src={formData.logoUrl} className="h-24 md:h-32 object-contain drop-shadow-2xl" alt="" /> : <h1 className="text-5xl font-black text-white drop-shadow-lg leading-tight">{formData.title || 'العنوان'}</h1>}</div>
                            <div className="flex items-center gap-4 mb-6 text-sm font-bold"><div className="flex items-center gap-1.5 text-yellow-400 bg-black/40 px-3 py-1 rounded-full border border-white/10"><StarIcon className="w-4 h-4" /><span>{formData.rating.toFixed(1)}</span></div><span className="text-gray-500">|</span><span className="text-white font-black">{formData.releaseYear}</span><span className="text-gray-500">|</span><span className="border border-gray-500 px-2 py-0.5 rounded text-xs font-black">{formData.ageRating || 'G'}</span></div>
                            <p className="text-gray-300 text-lg line-clamp-3 mb-10 leading-relaxed font-medium">{formData.description || 'وصف العمل يظهر هنا بشكل احترافي ومميز ليعبر عن قصة المحتوى الرائعة التي تقدمها المنصة للمشاهدين...'}</p>
                            <div className="flex gap-4"><div className="bg-[#00A7F8] text-black px-12 py-4 rounded-full font-black text-xl flex items-center gap-3 shadow-xl hover:scale-105 transition-all"><PlayIcon className="w-6 h-6 fill-black"/> شاهد الآن</div><div className="bg-white/10 backdrop-blur-md px-12 py-4 rounded-full font-black text-xl border border-white/20 hover:bg-white/20 transition-all">+ قائمتي</div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SEARCH_CATEGORIES = ['مصري', 'عربي', 'تركي', 'أجنبي', 'برامج', 'رومانسي', 'عائلي', 'كوميديا', 'دراما', 'أكشن', 'جريمة', 'خيال علمي', 'رعب', 'تركي مدبلج', 'مسرح', 'قريباً'];
