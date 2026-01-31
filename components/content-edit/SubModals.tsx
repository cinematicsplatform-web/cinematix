import React, { useState, useEffect, useMemo } from 'react';
import type { Episode, Server } from '@/types';
import { ContentType } from '@/types';
import { 
    CloseIcon, PhotoIcon, LanguageIcon, ServerIcon, SearchIcon, 
    PlusIcon, FOCUS_RING 
} from './ContentEditIcons';
import UqloadSearchModal from '../UqloadSearchModal';
import DailymotionSearchModal from '../DailymotionSearchModal';
import VkSearchModal from '../VkSearchModal';

const API_KEY = 'b8d66e320b334f4d56728d98a7e39697';

// --- Image Gallery Modal ---
export const ImageGalleryModal: React.FC<any> = ({ isOpen, onClose, tmdbId, type, targetField, onSelect }) => {
    const [images, setImages] = useState<{ posters: any[], backdrops: any[], logos: any[] }>({ posters: [], backdrops: [], logos: [] });
    const [loading, setLoading] = useState(false);
    const [filterLang, setFilterLang] = useState<string>('all'); 

    const activeTab = useMemo(() => {
        if (targetField === 'poster') return 'posters';
        if (targetField === 'logo') return 'logos';
        return 'backdrops';
    }, [targetField]);

    useEffect(() => {
        if (isOpen && tmdbId) {
            fetchImages();
        }
    }, [isOpen, tmdbId]);

    const fetchImages = async () => {
        setLoading(true);
        try {
            const endpointType = (type === ContentType.Movie || type === ContentType.Play || type === ContentType.Concert) ? 'movie' : 'tv';
            const res = await fetch(`https://api.themoviedb.org/3/${endpointType}/${tmdbId}/images?api_key=${API_KEY}&include_image_language=ar,en,null`);
            const data = await res.json();
            setImages({
                posters: data.posters || [],
                backdrops: data.backdrops || [],
                logos: data.logos || []
            });
        } catch (error) {
            console.error("Error fetching images:", error);
        } finally {
            setLoading(false);
        }
    };

    const displayedImages = useMemo(() => {
        const list = images[activeTab] || [];
        if (filterLang === 'all') return list;
        if (filterLang === 'null') return list.filter((img: any) => img.iso_639_1 === null);
        return list.filter((img: any) => img.iso_639_1 === filterLang);
    }, [images, activeTab, filterLang]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-800 bg-[#0f1014] shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-800 bg-[#161b22] px-4 md:px-6 py-4">
                    <h3 className="flex items-center gap-3 text-lg md:text-xl font-bold text-white">
                        <PhotoIcon className="w-5 h-5 md:w-6 md:h-6 text-[var(--color-accent)]"/>
                        معرض الصور 
                        <span className="hidden sm:inline rounded bg-[var(--color-accent)]/10 px-2 py-0.5 text-xs text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                            {activeTab === 'posters' ? 'بوسترات' : activeTab === 'logos' ? 'شعارات' : 'خلفيات'}
                        </span>
                    </h3>
                    <div className="flex items-center gap-2 md:gap-3">
                        <select 
                            value={filterLang} 
                            onChange={(e) => setFilterLang(e.target.value)}
                            className="rounded-lg border border-gray-700 bg-black px-3 py-2 text-xs text-white focus:border-[var(--color-accent)] focus:outline-none"
                        >
                            <option value="all">كل اللغات</option>
                            <option value="ar">العربية (AR)</option>
                            <option value="en">الإنجليزية (EN)</option>
                            <option value="null">بدون نص (Clean)</option>
                        </select>
                        <button onClick={onClose} className="rounded-lg bg-gray-800 p-2 text-gray-400 transition-colors hover:bg-red-500 hover:text-white">
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto bg-[#0a0a0a] p-4 md:p-6">
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-gray-500">جاري تحميل الصور...</div>
                    ) : displayedImages.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-gray-500">لا توجد صور مطابقة للفلتر المحدد.</div>
                    ) : (
                        <div className={`grid gap-4 md:gap-6 ${activeTab === 'posters' ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3'}`}>
                            {displayedImages.map((img: any, idx: number) => (
                                <div key={idx} onClick={() => { onSelect(`https://image.tmdb.org/t/p/original${img.file_path}`); onClose(); }} className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-800 bg-gray-900 transition-all hover:border-[var(--color-accent)] hover:shadow-lg hover:shadow-[var(--color-accent)]/10">
                                    <img 
                                        src={`https://image.tmdb.org/t/p/w500${img.file_path}`} 
                                        loading="lazy" 
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                        alt=""
                                    />
                                    <div className="absolute top-2 right-2 rounded bg-black/80 px-2 py-0.5 font-mono text-[10px] text-white backdrop-blur-md border border-white/10">
                                        {img.iso_639_1?.toUpperCase() || 'NO-TEXT'}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                                        <span className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-black shadow-lg">اختيار</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end border-t border-gray-800 bg-[#161b22] p-4">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-6 py-2 text-sm font-bold text-red-400 transition-all hover:bg-red-500 hover:text-white"
                    >
                        <CloseIcon className="h-4 w-4" />
                        إغلاق المعرض
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Title Gallery Modal ---
export const TitleGalleryModal: React.FC<any> = ({ isOpen, onClose, tmdbId, type, onSelect }) => {
    const [titles, setTitles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && tmdbId) {
            fetchTitles();
        }
    }, [isOpen, tmdbId]);

    const fetchTitles = async () => {
        setLoading(true);
        try {
            const endpointType = (type === ContentType.Movie || type === ContentType.Play || type === ContentType.Concert) ? 'movie' : 'tv';
            
            const infoRes = await fetch(`https://api.themoviedb.org/3/${endpointType}/${tmdbId}?api_key=${API_KEY}&language=ar-SA`);
            const info = await infoRes.json();
            
            const results: any[] = [];
            
            if (info.title) results.push({ title: info.title, iso_3166_1: 'Primary (AR)', type: 'Main' });
            if (info.name) results.push({ title: info.name, iso_3166_1: 'Primary (AR)', type: 'Main' });
            if (info.original_title && info.original_title !== info.title) results.push({ title: info.original_title, iso_3166_1: info.original_language?.toUpperCase() || 'Original', type: 'Original' });
            if (info.original_name && info.original_name !== info.name) results.push({ title: info.original_name, iso_3166_1: info.original_language?.toUpperCase() || 'Original', type: 'Original' });

            const altRes = await fetch(`https://api.themoviedb.org/3/${endpointType}/${tmdbId}/alternative_titles?api_key=${API_KEY}`);
            const altData = await altRes.json();
            
            if (altData.titles || altData.results) {
                const altList = altData.titles || altData.results;
                altList.forEach((item: any) => {
                    if (!results.some(r => r.title === (item.title || item.name))) {
                        results.push({
                            title: item.title || item.name,
                            iso_3166_1: item.iso_3166_1 || 'Alt',
                            type: 'Alternative'
                        });
                    }
                });
            }

            setTitles(results);
        } catch (error) {
            console.error("Error fetching titles:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-800 bg-[#0f1014] shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-800 bg-[#161b22] px-6 py-4">
                    <h3 className="flex items-center gap-3 text-xl font-bold text-white">
                        <LanguageIcon className="w-6 h-6 text-[var(--color-accent)]"/>
                        عناوين بديلة
                    </h3>
                    <button onClick={onClose} className="rounded-lg bg-gray-800 p-2 text-gray-400 transition-colors hover:bg-red-500 hover:text-white">
                        <CloseIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto bg-[#0a0a0a] p-6 space-y-3">
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-gray-500">جاري تحميل العناوين...</div>
                    ) : titles.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-gray-500">لا توجد عناوين بديلة متاحة.</div>
                    ) : (
                        titles.map((item, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => { onSelect(item.title); onClose(); }} 
                                className="group flex items-center justify-between p-4 bg-[#161b22] hover:bg-[#1f2937] border border-gray-800 hover:border-[var(--color-accent)] rounded-xl cursor-pointer transition-all shadow-md"
                            >
                                <div className="flex flex-col text-right">
                                    <span className="text-white font-bold text-lg group-hover:text-[var(--color-accent)] transition-colors">{item.title}</span>
                                    <span className="text-xs text-gray-500 font-mono mt-1">{item.type} • {item.iso_3166_1}</span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <PlusIcon className="w-5 h-5 text-[var(--color-accent)]" />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex justify-end border-t border-gray-800 bg-[#161b22] p-4">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-gray-700"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Server Management Modal ---
export const ServerManagementModal: React.FC<any> = ({ episode, onClose, onSave }) => {
    const [servers, setServers] = useState<Server[]>(() => {
        const existing = [...(episode.servers || [])];
        if (existing.length === 0) {
            existing.push({ id: Date.now(), name: 'سيرفر 1', url: '', downloadUrl: '', isActive: true });
        }
        return existing;
    });

    const [isUqloadModalOpen, setIsUqloadModalOpen] = useState(false);
    const [isDailymotionModalOpen, setIsDailymotionModalOpen] = useState(false);
    const [isVkModalOpen, setIsVkModalOpen] = useState(false);

    const handleServerChange = (index: number, field: keyof Server, value: string | boolean) => {
        const updatedServers = [...servers];
        updatedServers[index] = { ...updatedServers[index], [field]: value };
        setServers(updatedServers);
    };

    const handleAddServer = () => {
        setServers([...servers, { 
            id: Date.now() + servers.length, 
            name: `سيرفر ${servers.length + 1}`, 
            url: '', 
            downloadUrl: '', 
            isActive: true 
        }]);
    };

    const handleRemoveServer = (index: number) => {
        if (servers.length <= 1) {
            handleServerChange(0, 'url', '');
            handleServerChange(0, 'downloadUrl', '');
            return;
        }
        setServers(servers.filter((_, i) => i !== index));
    };

    const handleSaveServers = () => {
        const serversToSave = servers.filter(s => (s.url && s.url.trim() !== '') || (s.downloadUrl && s.downloadUrl.trim() !== ''));
        onSave(serversToSave);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className={`w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-800 bg-[#0f1014] text-white shadow-2xl animate-fade-in-up`} onClick={e => e.stopPropagation()}>
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-800 bg-[#161b22] px-4 md:px-6 py-4 gap-4">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                         <ServerIcon className="w-5 h-5 text-[var(--color-accent)]"/>
                         إدارة السيرفرات: <span className="text-[var(--color-accent)] text-sm">{episode.title}</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => setIsVkModalOpen(true)} className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 px-4 py-1.5 text-xs font-bold text-blue-400 transition-colors hover:bg-blue-600/20 hover:border-blue-500/40">
                             <span>VK</span>
                        </button>
                        <button onClick={() => setIsDailymotionModalOpen(true)} className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-400 transition-colors hover:bg-blue-600/20 hover:border-blue-500/40">
                            <span className="w-4 h-4 flex items-center justify-center font-black">d</span>
                            <span>Daily</span>
                        </button>
                        <button onClick={() => setIsUqloadModalOpen(true)} className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-400 transition-colors hover:bg-blue-600/20 hover:border-blue-500/40">
                            <SearchIcon className="w-4 h-4"/>
                            <span>Uqload</span>
                        </button>
                        <button onClick={onClose} className="mr-auto md:ml-2 md:mr-0 text-gray-400 hover:text-white"><CloseIcon className="w-5 h-5"/></button>
                    </div>
                </div>
                
                <div className="custom-scrollbar max-h-[60vh] overflow-y-auto p-4 md:p-6 space-y-4 bg-[#0a0a0a]">
                    {servers.map((server, index) => (
                          <div key={index} className="relative group/s rounded-xl border border-gray-800 bg-[#161b22] p-4 md:p-5 space-y-4 hover:border-gray-700 transition-colors">
                            <button 
                                onClick={() => handleRemoveServer(index)}
                                className="absolute -top-2 -left-2 z-20 rounded-full bg-red-600 p-1.5 text-white opacity-100 md:opacity-0 shadow-lg transition-opacity md:group-hover/s:opacity-100"
                                title="حذف السيرفر"
                            >
                                <CloseIcon className="h-3 w-3" />
                            </button>

                            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                              <div className="flex w-full items-center gap-3 sm:w-auto">
                                  <span className="flex h-6 w-6 items-center justify-center rounded bg-black/30 font-mono text-xs text-gray-500">{index + 1}</span>
                                  <input 
                                    value={server.name} 
                                    onChange={(e) => handleServerChange(index, 'name', e.target.value)} 
                                    placeholder="اسم السيرفر" 
                                    className={`w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:outline-none ${FOCUS_RING} sm:w-48`}
                                  />
                              </div>
                              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-700 bg-black px-3 py-1.5 text-sm transition-colors hover:border-[var(--color-accent)]">
                                <input type="checkbox" checked={server.isActive} onChange={(e) => handleServerChange(index, 'isActive', e.target.checked)} className="h-4 w-4 accent-[var(--color-accent)] rounded"/> 
                                <span className={server.isActive ? "text-[var(--color-accent)] font-bold text-xs" : "text-gray-400 text-xs"}>نشط</span>
                              </label>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase text-right">رابط المشاهدة (Watch)</label>
                                    <input 
                                        value={server.url} 
                                        onChange={(e) => handleServerChange(index, 'url', e.target.value)} 
                                        placeholder="رابط المشاهدة (mp4, m3u8, embed...)" 
                                        className={`w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:outline-none ${FOCUS_RING} dir-ltr placeholder:text-right text-left`}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase text-right">رابط التحميل (Download)</label>
                                    <input 
                                        value={server.downloadUrl} 
                                        onChange={(e) => handleServerChange(index, 'downloadUrl', e.target.value)} 
                                        placeholder="رابط التحميل المباشر" 
                                        className={`w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:outline-none ${FOCUS_RING} dir-ltr placeholder:text-right text-left`}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <button 
                        type="button"
                        onClick={handleAddServer}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-700 bg-[#161b22]/50 py-4 font-bold text-gray-400 transition-all hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 hover:text-[var(--color-accent)]"
                    >
                        <PlusIcon className="h-5 w-5" />
                        <span>إضافة سيرفر جديد</span>
                    </button>
                </div>
                <div className="flex justify-end gap-3 border-t border-gray-800 bg-[#161b22] p-4 md:p-6">
                    <button type="button" onClick={onClose} className="rounded-lg bg-gray-700 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-gray-600">إلغاء</button>
                    <button type="button" onClick={handleSaveServers} className="rounded-lg bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] px-8 py-2 text-sm font-bold text-black shadow-lg transition-all hover:scale-105 hover:shadow-[0_0_20px_var(--shadow-color)]">حفظ التغييرات</button>
                </div>
            </div>

            {isUqloadModalOpen && (
                <UqloadSearchModal 
                    isOpen={isUqloadModalOpen} 
                    onClose={() => setIsUqloadModalOpen(false)} 
                    onSelect={(res) => { 
                        const newServer: Server = { id: Date.now(), name: 'Uqload', url: res.embedUrl, downloadUrl: res.downloadUrl, isActive: true };
                        setServers(prev => [...prev, newServer]);
                    }} 
                />
            )}
            {isDailymotionModalOpen && (
                <DailymotionSearchModal 
                    isOpen={isDailymotionModalOpen} 
                    onClose={() => setIsDailymotionModalOpen(false)} 
                    onSelect={(res) => { 
                        const newServer: Server = { id: Date.now(), name: 'Dailymotion', url: res.embedUrl, downloadUrl: '', isActive: true };
                        setServers(prev => [...prev, newServer]);
                    }} 
                />
            )}
            {isVkModalOpen && (
                <VkSearchModal 
                    isOpen={isVkModalOpen}
                    onClose={() => setIsVkModalOpen(false)} 
                    onSelect={(res) => {
                        const newServer: Server = { id: Date.now(), name: 'VK Video', url: res.embedUrl, downloadUrl: res.downloadUrl, isActive: true };
                        setServers(prev => [...prev, newServer]);
                    }}
                />
            )}
        </div>
    );
};
