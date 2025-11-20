

import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import type { Content, Server, Season, Episode, Category, Genre } from '../types';
import { ContentType, categories, genres } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { CheckIcon } from './CheckIcon';
import { PlusIcon } from './icons/PlusIcon';
import ToggleSwitch from './ToggleSwitch';
import { generateSlug } from '../firebase';

// --- MODAL FOR SERVER MANAGEMENT ---
interface ServerManagementModalProps {
    episode: Episode;
    onClose: () => void;
    onSave: (servers: Server[]) => void;
}

const ServerManagementModal: React.FC<ServerManagementModalProps> = ({ episode, onClose, onSave }) => {
    const [servers, setServers] = useState<Server[]>(() => {
        // Ensure there are always 4 server slots for the UI, filling with empty ones if needed
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
        // Filter out empty servers before saving, but keep at least one if needed structure
        // FIX: Just save valid ones with URLs
        const serversToSave = servers.filter(s => s.url && s.url.trim() !== '');
        onSave(serversToSave);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[101] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-700 rounded-2xl shadow-xl w-full max-w-2xl text-white animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-[#00A7F8]">إدارة السيرفرات لـ: {episode.title}</h3>
                        <button onClick={onClose}><CloseIcon /></button>
                    </div>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2">
                        {servers.slice(0, 4).map((server, index) => (
                             <div key={index} className="p-3 bg-gray-600 rounded-lg space-y-2">
                                <div className="flex gap-4 items-center justify-between">
                                  <input value={server.name} onChange={(e) => handleServerChange(index, 'name', e.target.value)} placeholder={`اسم السيرفر ${index + 1}`} className="bg-gray-500 px-2 py-1 rounded w-40"/>
                                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                                    <input type="checkbox" checked={server.isActive} onChange={(e) => handleServerChange(index, 'isActive', e.target.checked)} className="accent-[#00A7F8] w-4 h-4"/> نشط
                                  </label>
                                </div>
                                <input value={server.url} onChange={(e) => handleServerChange(index, 'url', e.target.value)} placeholder={`رابط مشاهدة السيرفر ${index + 1}`} className="w-full bg-gray-500 px-2 py-1 rounded"/>
                            </div>
                        ))}
                         <div className="p-3 bg-gray-600 rounded-lg space-y-2">
                            <label className="font-semibold">رابط التحميل المباشر</label>
                            <input value={servers[0]?.downloadUrl || ''} onChange={(e) => handleServerChange(0, 'downloadUrl', e.target.value)} placeholder="رابط التحميل للحلقة" className="w-full bg-gray-500 px-2 py-1 rounded"/>
                         </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-600">
                        <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded-lg">إلغاء</button>
                        <button type="button" onClick={handleSaveServers} className="bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-bold py-2 px-6 rounded-lg">حفظ السيرفرات</button>
                    </div>
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
        logoUrl: '', isLogoEnabled: false, duration: '', enableMobileCrop: false, mobileCropPosition: 30,
        slug: '',
        ...content,
    });

    const [formData, setFormData] = useState<Content>(getDefaultFormData());
    const [editingServersForEpisode, setEditingServersForEpisode] = useState<Episode | null>(null);
    const [isManagingMovieServers, setIsManagingMovieServers] = useState<boolean>(false);
    
    // Internal state to track if slug was manually edited
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!content?.slug);

    useEffect(() => {
        setFormData(getDefaultFormData());
        setSlugManuallyEdited(!!content?.slug);
    }, [content]);

    // Auto-generate slug when title changes, unless manually edited
    useEffect(() => {
        if (!slugManuallyEdited && formData.title) {
            setFormData(prev => ({ ...prev, slug: generateSlug(prev.title) }));
        }
    }, [formData.title, slugManuallyEdited]);

    // Classification Filtering Logic
    const filteredCategories = useMemo(() => {
        // Common categories (shared)
        const commonCats: Category[] = ['قريباً'];
        
        if (formData.type === ContentType.Movie) {
            // Movies: Remove 'Exclusive for Ramadan', Add 'Eid Movies'
            const movieCats: Category[] = ['افلام عربية', 'افلام تركية', 'افلام اجنبية', 'افلام هندية', 'افلام أنميشن', 'افلام العيد'];
            return [...movieCats, ...commonCats];
        } else {
            // Series: Include 'Exclusive for Ramadan' and 'Ramadan Series'
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
    
        // Reset seasons if switching from Movie to Series for the first time
        if (name === 'type' && value === ContentType.Series && (!formData.seasons || formData.seasons.length === 0)) {
            setFormData(prev => ({...prev, type: ContentType.Series, seasons: [{ id: Date.now(), seasonNumber: 1, title: 'الموسم 1', episodes: []}]}));
            return;
        }
        
        // If editing slug manually, set flag
        if (name === 'slug') {
            setSlugManuallyEdited(true);
        }

        setFormData(prev => ({ ...prev, [name]: value } as Content));
    };
    
    // Handle Multi-select for Categories
    const handleCategoryChange = (category: Category) => {
        setFormData(prev => {
            const currentCats = prev.categories || [];
            const newCats = currentCats.includes(category)
                ? currentCats.filter(c => c !== category)
                : [...currentCats, category];
            return { ...prev, categories: newCats };
        });
    };
    
    // Handle Multi-select for Genres
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
        
        // Ensure slug is set (fallback to generating from title if empty)
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

    // --- Season & Episode Handlers ---
    const handleAddSeason = () => {
        const newSeasonNumber = (formData.seasons?.length || 0) + 1;
        const newSeason: Season = {
            id: Date.now(),
            seasonNumber: newSeasonNumber,
            title: `الموسم ${newSeasonNumber}`,
            episodes: []
        };
        setFormData(prevFormData => {
            const updatedSeasons = [...(prevFormData.seasons || []), newSeason];
            return { ...prevFormData, seasons: updatedSeasons };
        });
    };

    const handleDeleteSeason = (seasonId: number) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الموسم بكل حلقاته؟')) {
            setFormData(prev => ({
                ...prev,
                seasons: (prev.seasons || []).filter(s => s.id !== seasonId)
            }));
        }
    };

    const handleUpdateSeasonTitle = (seasonId: number, newTitle: string) => {
        setFormData(prev => ({
            ...prev,
            seasons: (prev.seasons || []).map(s => s.id === seasonId ? { ...s, title: newTitle } : s)
        }));
    };

    const handleUpdateSeasonImages = (seasonId: number, field: 'poster' | 'backdrop', value: string) => {
        setFormData(prev => ({
            ...prev,
            seasons: (prev.seasons || []).map(s => s.id === seasonId ? { ...s, [field]: value } : s)
        }));
    };
    
    const handleAddEpisode = (seasonId: number) => {
        setFormData(prevFormData => {
            const season = prevFormData.seasons?.find(s => s.id === seasonId);
            if (!season) return prevFormData;
            
            const newEpisodeNumber = (season.episodes.length || 0) + 1;
            const newEpisode: Episode = {
                id: Date.now(),
                title: `الحلقة ${newEpisodeNumber}`,
                thumbnail: '',
                duration: 45,
                progress: 0,
                servers: []
            };
            const updatedSeason = { ...season, episodes: [...season.episodes, newEpisode] };
            
            const updatedSeasons = (prevFormData.seasons || []).map(s => s.id === updatedSeason.id ? updatedSeason : s);
            return { ...prevFormData, seasons: updatedSeasons };
        });
    };
    
    const handleDeleteEpisode = (seasonId: number, episodeId: number) => {
        setFormData(prevFormData => {
            const seasonToUpdate = prevFormData.seasons?.find(s => s.id === seasonId);
            if (!seasonToUpdate) return prevFormData;

            const updatedEpisodes = seasonToUpdate.episodes.filter(e => e.id !== episodeId);
            const updatedSeason = { ...seasonToUpdate, episodes: updatedEpisodes };

            return {
                ...prevFormData,
                seasons: (prevFormData.seasons || []).map(s => s.id === updatedSeason.id ? updatedSeason : s)
            };
        });
    };

    const handleUpdateEpisodeTitle = (seasonId: number, episodeId: number, newTitle: string) => {
        setFormData(prevFormData => {
            const seasonToUpdate = prevFormData.seasons?.find(s => s.id === seasonId);
            if (!seasonToUpdate) return prevFormData;

            const updatedEpisodes = seasonToUpdate.episodes.map(e => 
                e.id === episodeId ? { ...e, title: newTitle } : e
            );
            const updatedSeason = { ...seasonToUpdate, episodes: updatedEpisodes };

            return {
                ...prevFormData,
                seasons: (prevFormData.seasons || []).map(s => s.id === updatedSeason.id ? updatedSeason : s)
            };
        });
    };

    // --- Server Handlers for Movies ---
    const handleAddMovieServer = () => {
        setFormData(prev => ({
            ...prev,
            servers: [...(prev.servers || []), { id: Date.now(), name: `سيرفر ${(prev.servers?.length || 0) + 1}`, url: '', downloadUrl: '', isActive: false }]
        }));
    };

    const handleUpdateMovieServer = (index: number, field: keyof Server, value: any) => {
         setFormData(prev => {
            const newServers = [...(prev.servers || [])];
            newServers[index] = { ...newServers[index], [field]: value };
            return { ...prev, servers: newServers };
        });
    };

    const handleDeleteMovieServer = (index: number) => {
         setFormData(prev => ({
             ...prev,
             servers: (prev.servers || []).filter((_, i) => i !== index)
         }));
    };


    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl text-white border border-gray-700 flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50 rounded-t-2xl">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                         {isNewContent ? <PlusIcon className="w-6 h-6 text-[#00FFB0]"/> : <span className="text-yellow-400">✎</span>}
                         {isNewContent ? 'إضافة محتوى جديد' : 'تعديل المحتوى'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors"><CloseIcon /></button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        
                        {/* 1. Basic Info */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">عنوان العمل</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#00A7F8] outline-none" required />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">رابط الصفحة (Slug - SEO)</label>
                                    <div className="flex items-center bg-gray-700 border border-gray-600 rounded-lg px-3 overflow-hidden">
                                        <span className="text-gray-400 text-xs whitespace-nowrap dir-ltr">/</span>
                                        {formData.type === ContentType.Series && <span className="text-gray-400 text-xs whitespace-nowrap dir-ltr">series/</span>}
                                        <input 
                                            type="text" 
                                            name="slug" 
                                            value={formData.slug || ''} 
                                            onChange={handleChange} 
                                            placeholder="auto-generated"
                                            className="w-full bg-transparent border-none px-1 py-3 focus:ring-0 outline-none text-sm dir-ltr text-left" 
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">يترك فارغاً للتوليد التلقائي من العنوان.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">الوصف</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#00A7F8] outline-none" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">سنة الإصدار</label>
                                        <input type="number" name="releaseYear" value={formData.releaseYear} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">التقييم (من 5)</label>
                                        <input type="number" name="rating" step="0.1" max="5" value={formData.rating} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2" />
                                    </div>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">التصنيف العمري</label>
                                    <input type="text" name="ageRating" value={formData.ageRating} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2" placeholder="مثال: +18, +13, G" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">نوع المحتوى</label>
                                    <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3">
                                        <option value={ContentType.Movie}>فيلم</option>
                                        <option value={ContentType.Series}>مسلسل</option>
                                    </select>
                                </div>
                                
                                {formData.type === ContentType.Movie && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">مدة الفيلم</label>
                                        <input type="text" name="duration" value={formData.duration || ''} onChange={handleChange} placeholder="مثال: 1h 45m" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3"/>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">التصنيفات (Category)</label>
                                    <div className="flex flex-wrap gap-2 bg-gray-700 p-3 rounded-lg border border-gray-600 max-h-32 overflow-y-auto">
                                        {filteredCategories.map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => handleCategoryChange(cat)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${formData.categories.includes(cat) ? 'bg-[#00A7F8] text-black' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                                            >
                                                {cat} {formData.categories.includes(cat) && '✓'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">النوع (Genres)</label>
                                    <div className="flex flex-wrap gap-2 bg-gray-700 p-3 rounded-lg border border-gray-600 max-h-32 overflow-y-auto">
                                        {genres.map(g => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => handleGenreChange(g)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${formData.genres.includes(g) ? 'bg-[#00FFB0] text-black' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                                            >
                                                {g} {formData.genres.includes(g) && '✓'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">نص البانر المميز (اختياري)</label>
                                    <input type="text" name="bannerNote" value={formData.bannerNote || ''} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2" placeholder="مثال: الموسم الجديد, الأكثر مشاهدة" />
                                </div>
                            </div>
                        </div>

                         {/* 2. Media & Visuals */}
                         <div className="bg-gray-700/30 p-6 rounded-xl border border-gray-700">
                            <h3 className="text-lg font-bold text-[#00FFB0] mb-4 border-b border-gray-600 pb-2">الصور والوسائط</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">رابط البوستر (عمودي)</label>
                                    <input type="text" name="poster" value={formData.poster} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm" placeholder="https://..." required />
                                    {formData.poster && <img src={formData.poster} alt="Preview" className="mt-2 h-32 rounded object-cover shadow-md" />}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">رابط الخلفية (أفقي)</label>
                                    <input type="text" name="backdrop" value={formData.backdrop} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm" placeholder="https://..." required />
                                    {formData.backdrop && <img src={formData.backdrop} alt="Preview" className="mt-2 w-full h-32 rounded object-cover shadow-md" />}
                                </div>
                                 {/* LOGO URL */}
                                 <div className="col-span-full">
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-sm font-medium text-gray-400">رابط اللوجو (شفاف)</label>
                                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                                            <input type="checkbox" checked={formData.isLogoEnabled || false} onChange={(e) => setFormData(prev => ({...prev, isLogoEnabled: e.target.checked}))} className="accent-[#00A7F8]"/>
                                            تفعيل اللوجو بدلاً من العنوان النصي
                                        </label>
                                    </div>
                                    <input type="text" name="logoUrl" value={formData.logoUrl || ''} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm" placeholder="https://..." />
                                    {formData.logoUrl && <img src={formData.logoUrl} alt="Logo Preview" className="mt-2 h-16 object-contain bg-black/50 p-2 rounded" />}
                                </div>
                                {/* MOBILE CROP SETTINGS */}
                                <div className="col-span-full bg-gray-800 p-4 rounded-lg border border-gray-600">
                                     <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-bold text-white">إعدادات العرض للموبايل</h4>
                                        <ToggleSwitch checked={formData.enableMobileCrop || false} onChange={(c) => setFormData(prev => ({...prev, enableMobileCrop: c}))} className="scale-75"/>
                                    </div>
                                    {formData.enableMobileCrop && (
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">محاذاة الصورة (Center Point %)</label>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="100" 
                                                value={formData.mobileCropPosition || 30} 
                                                onChange={(e) => setFormData(prev => ({...prev, mobileCropPosition: parseInt(e.target.value)}))}
                                                className="w-full accent-[#00A7F8]"
                                            />
                                            <div className="text-center text-xs mt-1">{formData.mobileCropPosition || 30}%</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 3. Specific Content Logic (Series vs Movie) */}
                        
                        {/* --- SERIES LOGIC --- */}
                        {formData.type === ContentType.Series && (
                            <div className="bg-gray-700/30 p-6 rounded-xl border border-gray-700">
                                <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-2">
                                    <h3 className="text-lg font-bold text-[#00A7F8]">إدارة المواسم والحلقات</h3>
                                    <button type="button" onClick={handleAddSeason} className="bg-[#00A7F8] text-black px-3 py-1 rounded text-sm font-bold hover:bg-white transition-colors">+ إضافة موسم</button>
                                </div>
                                
                                <div className="space-y-6">
                                    {formData.seasons?.map((season, sIndex) => (
                                        <div key={season.id} className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                                            <div className="flex flex-wrap gap-4 items-center justify-between mb-4 bg-gray-900/50 p-2 rounded">
                                                <input 
                                                    type="text" 
                                                    value={season.title} 
                                                    onChange={(e) => handleUpdateSeasonTitle(season.id, e.target.value)}
                                                    className="bg-transparent font-bold text-white border-none focus:ring-0"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <button type="button" onClick={() => handleAddEpisode(season.id)} className="text-green-400 text-xs hover:underline px-2">+ حلقة جديدة</button>
                                                    <button type="button" onClick={() => handleDeleteSeason(season.id)} className="text-red-400 text-xs hover:underline">حذف الموسم</button>
                                                </div>
                                            </div>
                                            
                                            {/* Season Poster & Backdrop (Optional) */}
                                            <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                                                 <input type="text" placeholder="بوستر الموسم (اختياري)" value={season.poster || ''} onChange={(e) => handleUpdateSeasonImages(season.id, 'poster', e.target.value)} className="bg-gray-700 border border-gray-600 rounded px-2 py-1"/>
                                                 <input type="text" placeholder="خلفية الموسم (اختياري)" value={season.backdrop || ''} onChange={(e) => handleUpdateSeasonImages(season.id, 'backdrop', e.target.value)} className="bg-gray-700 border border-gray-600 rounded px-2 py-1"/>
                                            </div>

                                            {/* Episodes List */}
                                            <div className="space-y-2 pl-4 border-r-2 border-gray-700">
                                                {season.episodes.length === 0 && <p className="text-gray-500 text-sm">لا توجد حلقات بعد.</p>}
                                                {season.episodes.map((ep, eIndex) => (
                                                    <div key={ep.id} className="flex items-center gap-3 bg-gray-700/50 p-2 rounded hover:bg-gray-700 transition-colors">
                                                        <span className="text-gray-400 text-sm font-mono w-6">{eIndex + 1}</span>
                                                        <input 
                                                            type="text" 
                                                            value={ep.title} 
                                                            onChange={(e) => handleUpdateEpisodeTitle(season.id, ep.id, e.target.value)}
                                                            className="bg-transparent border-b border-transparent focus:border-[#00A7F8] text-sm text-white flex-1 outline-none"
                                                            placeholder={`الحلقة ${eIndex + 1}`}
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => setEditingServersForEpisode(ep)}
                                                            className="bg-[#00A7F8]/20 text-[#00A7F8] px-3 py-1 rounded text-xs hover:bg-[#00A7F8] hover:text-white transition-colors"
                                                        >
                                                            السيرفرات ({ep.servers?.filter(s => s.url).length || 0})
                                                        </button>
                                                        <button type="button" onClick={() => handleDeleteEpisode(season.id, ep.id)} className="text-red-400 hover:text-red-300"><CloseIcon className="w-4 h-4"/></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- MOVIE LOGIC --- */}
                        {formData.type === ContentType.Movie && (
                            <div className="bg-gray-700/30 p-6 rounded-xl border border-gray-700">
                                 <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-2">
                                    <h3 className="text-lg font-bold text-[#00A7F8]">سيرفرات المشاهدة</h3>
                                    <button type="button" onClick={handleAddMovieServer} className="bg-[#00A7F8] text-black px-3 py-1 rounded text-sm font-bold hover:bg-white transition-colors">+ إضافة سيرفر</button>
                                </div>
                                <div className="space-y-3">
                                    {formData.servers?.length === 0 && <p className="text-gray-500">لا توجد سيرفرات مضافة.</p>}
                                    {formData.servers?.map((server, index) => (
                                        <div key={server.id} className="bg-gray-800 p-3 rounded-lg flex flex-col gap-2">
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="text" 
                                                    value={server.name} 
                                                    onChange={(e) => handleUpdateMovieServer(index, 'name', e.target.value)}
                                                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-1/3"
                                                    placeholder="اسم السيرفر"
                                                />
                                                 <input 
                                                    type="text" 
                                                    value={server.url} 
                                                    onChange={(e) => handleUpdateMovieServer(index, 'url', e.target.value)}
                                                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm flex-1 dir-ltr"
                                                    placeholder="رابط الفيديو"
                                                />
                                                <button type="button" onClick={() => handleDeleteMovieServer(index)} className="text-red-400"><CloseIcon className="w-5 h-5"/></button>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="text" 
                                                    value={server.downloadUrl} 
                                                    onChange={(e) => handleUpdateMovieServer(index, 'downloadUrl', e.target.value)}
                                                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs w-full dir-ltr"
                                                    placeholder="رابط التحميل (اختياري)"
                                                />
                                                 <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                                                    <input type="checkbox" checked={server.isActive} onChange={(e) => handleUpdateMovieServer(index, 'isActive', e.target.checked)} className="accent-green-500"/>
                                                    <span className="text-xs text-gray-300">نشط</span>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-700 bg-gray-800/50 rounded-b-2xl flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg font-bold text-gray-300 hover:bg-gray-700 transition-colors">إلغاء</button>
                    <button onClick={handleSubmit} className="px-8 py-2 rounded-lg font-bold bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black hover:shadow-lg hover:scale-105 transition-all">
                        {isNewContent ? 'نشر المحتوى' : 'حفظ التعديلات'}
                    </button>
                </div>

            </div>

            {/* Nested Modal for Episode Servers */}
            {editingServersForEpisode && (
                <ServerManagementModal 
                    episode={editingServersForEpisode}
                    onClose={() => setEditingServersForEpisode(null)}
                    onSave={(newServers) => {
                        // Update the specific episode with new servers
                        setFormData(prev => {
                            const updatedSeasons = prev.seasons?.map(s => ({
                                ...s,
                                episodes: s.episodes.map(e => 
                                    e.id === editingServersForEpisode.id ? { ...e, servers: newServers } : e
                                )
                            }));
                            return { ...prev, seasons: updatedSeasons };
                        });
                    }}
                />
            )}
        </div>
    );
};

export default ContentEditModal;