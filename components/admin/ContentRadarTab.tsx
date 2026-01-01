import React, { useState, useEffect, useMemo } from 'react';
import { getReleaseSchedules, saveReleaseSchedule, deleteReleaseSchedule, markScheduleAsAdded, db } from '../../firebase';
import type { ReleaseSchedule, ReleaseSource, Content } from '../../types';
import { PlusIcon } from '../icons/PlusIcon';
import { CloseIcon } from '../icons/CloseIcon';
import DeleteConfirmationModal from '../DeleteConfirmationModal';

const RadarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 0-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

interface ContentRadarTabProps {
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    onRequestDelete: (id: string, title: string) => void;
    onEditContent: (content: Content) => void;
    allPublishedContent: Content[];
}

const ContentRadarTab: React.FC<ContentRadarTabProps> = ({ addToast, onRequestDelete, onEditContent, allPublishedContent }) => {
    const [schedules, setSchedules] = useState<ReleaseSchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<ReleaseSchedule | null>(null);

    const today = new Date().getDay(); // 0-6

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        setIsLoading(true);
        try {
            const data = await getReleaseSchedules();
            setSchedules(data);
        } catch (e) {
            addToast('فشل تحميل رادار المحتوى', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenEdit = (schedule: ReleaseSchedule | null) => {
        setEditingSchedule(schedule);
        setIsModalOpen(true);
    };

    const handleMarkAsDone = async (id: string) => {
        try {
            await markScheduleAsAdded(id);
            setSchedules(prev => prev.map(s => s.id === id ? { ...s, lastAddedAt: new Date().toISOString() } : s));
            addToast('تم تحديث حالة النشر بنجاح!', 'success');
        } catch (e) {
            addToast('حدث خطأ أثناء التحديث', 'error');
        }
    };

    const handleJumpToContent = (seriesName: string) => {
        const found = allPublishedContent.find(c => c.title.toLowerCase().includes(seriesName.toLowerCase()));
        if (found) onEditContent(found);
        else addToast('لم يتم العثور على المسلسل في المكتبة المنشورة بعد.', 'info');
    };

    const airingToday = useMemo(() => schedules.filter(s => s.dayOfWeek === today && s.isActive), [schedules, today]);
    const others = useMemo(() => schedules.filter(s => s.dayOfWeek !== today || !s.isActive), [schedules, today]);

    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    return (
        <div className="space-y-10 animate-fade-in-up" dir="rtl">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1f2937] p-8 rounded-[2rem] border border-gray-700/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 p-6 opacity-5 pointer-events-none text-blue-500">
                    <RadarIcon />
                </div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-black text-white mb-2">رادار المحتوى (Release Scheduler)</h3>
                    <p className="text-gray-400 text-sm max-w-xl font-medium">مساعدك الشخصي لتتبع مواعيد صدور حلقات المسلسلات والحصول على روابط المصادر بشكل فوري.</p>
                </div>
                <button 
                    onClick={() => handleOpenEdit(null)}
                    className="relative z-10 bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-black px-10 py-4 rounded-2xl hover:shadow-[0_0_30px_rgba(0,167,248,0.4)] transition-all transform hover:scale-105"
                >
                    + إضافة مسلسل للرادار
                </button>
            </div>

            {/* Airing Today Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-8 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
                    <h4 className="text-xl font-bold text-white uppercase tracking-wider">يعرض اليوم ({airingToday.length})</h4>
                    <span className="bg-green-500/10 text-green-400 text-[10px] font-black px-3 py-1 rounded-full border border-green-500/20">{dayNames[today]}</span>
                </div>

                {isLoading ? (
                    <div className="py-20 text-center text-gray-500">جاري مسح الرادار...</div>
                ) : airingToday.length === 0 ? (
                    <div className="bg-[#0f1014] p-12 rounded-3xl border border-gray-800 text-center opacity-40">
                         <p className="text-lg font-bold">لا توجد إصدارات مجدولة لهذا اليوم.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {airingToday.map(item => (
                            <RadarCard 
                                key={item.id} 
                                item={item} 
                                dayLabel={dayNames[item.dayOfWeek]} 
                                onMarkDone={() => handleMarkAsDone(item.id)}
                                onEdit={() => handleOpenEdit(item)}
                                onDelete={() => onRequestDelete(item.id, item.seriesName)}
                                onJump={() => handleJumpToContent(item.seriesName)}
                                isToday={true}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Weekly Overview Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(0,167,248,0.5)]"></div>
                    <h4 className="text-xl font-bold text-white uppercase tracking-wider">بقية الأسبوع</h4>
                </div>
                
                {others.length === 0 ? (
                    <div className="text-center py-10 text-gray-600">لا توجد مسلسلات أخرى في الرادار.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {others.map(item => (
                            <RadarCard 
                                key={item.id} 
                                item={item} 
                                dayLabel={dayNames[item.dayOfWeek]} 
                                onMarkDone={() => handleMarkAsDone(item.id)}
                                onEdit={() => handleOpenEdit(item)}
                                onDelete={() => onRequestDelete(item.id, item.seriesName)}
                                onJump={() => handleJumpToContent(item.seriesName)}
                                isToday={false}
                            />
                        ))}
                    </div>
                )}
            </section>

            {isModalOpen && (
                <ScheduleEditModal 
                    schedule={editingSchedule} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={async (s) => {
                        await saveReleaseSchedule(s);
                        addToast('تم حفظ بيانات الرادار!', 'success');
                        setIsModalOpen(false);
                        fetchSchedules();
                    }} 
                />
            )}
        </div>
    );
};

const RadarCard: React.FC<{
    item: ReleaseSchedule; 
    dayLabel: string; 
    onMarkDone: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onJump: () => void;
    isToday: boolean;
}> = ({ item, dayLabel, onMarkDone, onEdit, onDelete, onJump, isToday }) => {
    
    // Logic to check if published today
    const lastAddedDate = item.lastAddedAt ? new Date(item.lastAddedAt) : null;
    const isPublishedToday = lastAddedDate && lastAddedDate.toDateString() === new Date().toDateString();

    return (
        <div className={`group relative bg-[#1f2937] border rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.02] flex flex-col shadow-xl ${isToday ? 'border-green-500/20 ring-1 ring-green-500/10' : 'border-gray-700/50'}`}>
            <div className="aspect-[16/9] relative overflow-hidden bg-black">
                <img src={item.poster} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1f2937] via-transparent to-transparent"></div>
                
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    <button onClick={onEdit} className="p-2 rounded-xl bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-[#00A7F8] hover:text-black transition-all shadow-lg">✎</button>
                    <button onClick={onDelete} className="p-2 rounded-xl bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-red-600 transition-all shadow-lg">✕</button>
                </div>

                <div className="absolute bottom-4 right-4 text-right">
                    <h5 className="text-xl font-black text-white drop-shadow-lg leading-tight mb-1">{item.seriesName}</h5>
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${isToday ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-gray-800 text-gray-400'}`}>
                            {dayLabel} {item.time}
                        </span>
                        {!item.isActive && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-lg font-black uppercase">متوقف</span>}
                    </div>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-6">
                {/* Sources Section */}
                <div className="space-y-3">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">المصادر المتاحة</span>
                    <div className="grid grid-cols-2 gap-2">
                        {item.sources.map((src, i) => (
                            <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-800 rounded-xl text-xs font-bold text-gray-300 hover:bg-gray-700 border border-gray-700 transition-colors group/link">
                                <span className="truncate max-w-[80px]">{src.name}</span>
                                <ExternalLinkIcon />
                            </a>
                        ))}
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-700/50 flex items-center justify-between">
                    <button 
                        onClick={onJump}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                    >
                        فتح في المكتبة 🔗
                    </button>

                    <button 
                        onClick={onMarkDone}
                        disabled={isPublishedToday}
                        className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg flex items-center gap-2 ${isPublishedToday ? 'bg-green-500/10 text-green-500 border border-green-500/20 cursor-default' : 'bg-white text-black hover:scale-105 active:scale-95'}`}
                    >
                        {isPublishedToday ? (
                            <>
                                <span>✓ تم النشر</span>
                                <span className="text-[8px] opacity-60">اليوم</span>
                            </>
                        ) : 'تحديد كمكتمل'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ScheduleEditModal: React.FC<{ schedule: ReleaseSchedule | null; onClose: () => void; onSave: (s: ReleaseSchedule) => void }> = ({ schedule, onClose, onSave }) => {
    const isNew = !schedule;
    const [allContent, setAllContent] = useState<Content[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const [formData, setFormData] = useState<ReleaseSchedule>(schedule || {
        id: '',
        seriesName: '',
        poster: '',
        dayOfWeek: 1,
        time: '21:00',
        isActive: true,
        lastAddedAt: null,
        sources: [{ name: 'EGYBEST', url: '' }, { name: 'WE CIMA', url: '' }]
    });

    useEffect(() => {
        const fetchAll = async () => {
            const snap = await db.collection('content').where('type', '==', 'series').get();
            setAllContent(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content)));
        };
        fetchAll();
    }, []);

    const filteredSuggestions = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return allContent.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
    }, [allContent, searchQuery]);

    const handleSelectContent = (content: Content) => {
        setFormData({
            ...formData,
            seriesId: content.id,
            seriesName: content.title,
            poster: content.poster
        });
        setSearchQuery('');
        setIsSearching(false);
    };

    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    const handleSourceChange = (idx: number, field: keyof ReleaseSource, val: string) => {
        const updated = [...formData.sources];
        updated[idx] = { ...updated[idx], [field]: val };
        setFormData({ ...formData, sources: updated });
    };

    const addSource = () => {
        setFormData({ ...formData, sources: [...formData.sources, { name: 'New Source', url: '' }] });
    };

    const removeSource = (idx: number) => {
        setFormData({ ...formData, sources: formData.sources.filter((_, i) => i !== idx) });
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#151922] border border-gray-700 rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-gray-700 flex justify-between items-center bg-[#1a2230]">
                    <h3 className="text-2xl font-black text-white">{isNew ? 'إضافة رادار بث جديد' : 'تعديل بيانات الرادار'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"><CloseIcon /></button>
                </div>
                
                <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        {/* Poster Preview */}
                        <div className="md:col-span-4">
                             <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-gray-900 border-2 border-dashed border-gray-700 relative">
                                {formData.poster ? <img src={formData.poster} className="w-full h-full object-cover" alt=""/> : <div className="h-full flex items-center justify-center text-xs text-gray-600">Poster Preview</div>}
                             </div>
                             <input value={formData.poster} onChange={e => setFormData({...formData, poster: e.target.value})} className="mt-4 w-full bg-[#0f1014] border border-gray-700 rounded-xl px-4 py-2 text-xs font-mono text-gray-500 focus:border-[#00A7F8] outline-none" placeholder="Poster URL..."/>
                        </div>

                        {/* Basic Info */}
                        <div className="md:col-span-8 space-y-6">
                            <div className="relative">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">اختر من المسلسلات الحالية أو اكتب الاسم</label>
                                <div className="flex gap-2">
                                    <input 
                                        value={formData.seriesName} 
                                        onChange={e => {
                                            setFormData({...formData, seriesName: e.target.value, seriesId: undefined});
                                            setSearchQuery(e.target.value);
                                            setIsSearching(true);
                                        }} 
                                        onFocus={() => setIsSearching(true)}
                                        className="w-full bg-[#0f1014] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#00A7F8] outline-none" 
                                        placeholder="اسم المسلسل..."
                                    />
                                </div>
                                
                                {isSearching && filteredSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-[#1f2937] border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                                        {filteredSuggestions.map(content => (
                                            <button 
                                                key={content.id}
                                                onClick={() => handleSelectContent(content)}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-800 transition-colors border-b border-gray-700 last:border-0"
                                            >
                                                <img src={content.poster} className="w-10 h-14 rounded-lg object-cover" alt=""/>
                                                <div className="text-right">
                                                    <p className="font-bold text-white text-sm">{content.title}</p>
                                                    <p className="text-[10px] text-gray-500">{content.releaseYear}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">يوم العرض</label>
                                    <select value={formData.dayOfWeek} onChange={e => setFormData({...formData, dayOfWeek: Number(e.target.value)})} className="w-full bg-[#0f1014] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#00A7F8] outline-none cursor-pointer">
                                        {dayNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">وقت العرض (24h)</label>
                                    <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full bg-[#0f1014] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#00A7F8] outline-none"/>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-800">
                                <div className="flex justify-between items-center mb-4">
                                     <h4 className="text-sm font-bold text-gray-300">سيرفرات المصادر</h4>
                                     <button type="button" onClick={addSource} className="text-xs font-bold text-blue-400 hover:underline">+ إضافة مصدر</button>
                                </div>
                                <div className="space-y-3">
                                    {formData.sources.map((src, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <input value={src.name} onChange={e => handleSourceChange(i, 'name', e.target.value)} className="w-24 bg-[#0f1014] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white" placeholder="Name"/>
                                            <input value={src.url} onChange={e => handleSourceChange(i, 'url', e.target.value)} className="flex-1 bg-[#0f1014] border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-500 dir-ltr" placeholder="Source URL..."/>
                                            <button type="button" onClick={() => removeSource(i)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">✕</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-gray-700 flex justify-end gap-4 bg-[#1a2230]/50">
                    <button onClick={onClose} className="px-8 py-3 bg-gray-800 text-gray-300 font-bold rounded-2xl hover:bg-gray-700">إلغاء</button>
                    <button 
                        onClick={() => onSave(formData)} 
                        className="bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-black px-12 py-3 rounded-2xl shadow-xl transform active:scale-95"
                    >
                        حفظ الرادار
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContentRadarTab;