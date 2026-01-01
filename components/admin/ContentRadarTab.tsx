import React, { useState, useEffect, useMemo } from 'react';
import { getReleaseSchedules, saveReleaseSchedule, deleteReleaseSchedule, markScheduleAsAdded, db } from '../../firebase';
import type { ReleaseSchedule, ReleaseSource, Content, ReleasePriority, ReleaseStatus } from '../../types';
import { PlusIcon } from '../icons/PlusIcon';
import { CloseIcon } from '../icons/CloseIcon';
import DeleteConfirmationModal from '../DeleteConfirmationModal';
import ToggleSwitch from '../ToggleSwitch';

// --- PREMIUM ICONS ---
const RadarIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={props.className || "w-10 h-10"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
);

const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
    </svg>
);

const TimerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
);

// --- COMPONENT HELPERS ---
const PriorityBadge = ({ priority }: { priority: ReleasePriority }) => {
    switch (priority) {
        case 'hot': return <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse">HOT 🔥</span>;
        case 'high': return <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(249,115,22,0.3)]">TRENDING 📈</span>;
        case 'medium': return <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded">NEW</span>;
        default: return <span className="bg-gray-700 text-gray-300 text-[9px] font-black px-2 py-0.5 rounded">REGULAR</span>;
    }
};

const StatusLabel = ({ status }: { status: ReleaseStatus }) => {
    switch (status) {
        case 'ongoing': return <span className="text-green-400 font-bold">مستمر</span>;
        case 'hiatus': return <span className="text-yellow-500 font-bold">متوقف مؤقتاً</span>;
        case 'finished': return <span className="text-gray-500 font-bold">منتهي</span>;
        case 'upcoming': return <span className="text-blue-400 font-bold">قريباً</span>;
        default: return null;
    }
};

interface ContentRadarTabProps {
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    onRequestDelete: (id: string, title: string) => void;
    onEditContent: (content: Content) => void;
    allPublishedContent: Content[];
}

const ContentRadarTab: React.FC<ContentRadarTabProps> = ({ addToast, onRequestDelete, onEditContent, allPublishedContent }) => {
    const [schedules, setSchedules] = useState<ReleaseSchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // NEW: View management instead of modal
    const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
    const [editingSchedule, setEditingSchedule] = useState<ReleaseSchedule | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    const today = new Date().getDay();
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

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
        setViewMode('editor');
    };

    const handleCloseEditor = () => {
        setViewMode('list');
        setEditingSchedule(null);
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

    const filteredSchedules = useMemo(() => {
        return schedules.filter(s => {
            const matchesSearch = s.seriesName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' ? true : (filterStatus === 'active' ? s.isActive : !s.isActive);
            return matchesSearch && matchesStatus;
        }).sort((a, b) => {
            const pMap = { hot: 0, high: 1, medium: 2, low: 3 };
            if (pMap[a.priority] !== pMap[b.priority]) return pMap[a.priority] - pMap[b.priority];
            return a.seriesName.localeCompare(b.seriesName);
        });
    }, [schedules, searchTerm, filterStatus]);

    const airingToday = useMemo(() => filteredSchedules.filter(s => s.daysOfWeek.includes(today) && s.isActive), [filteredSchedules, today]);
    const others = useMemo(() => filteredSchedules.filter(s => !s.daysOfWeek.includes(today) || !s.isActive), [filteredSchedules, today]);

    const stats = useMemo(() => {
        const now = new Date();
        const todayStr = now.toDateString();
        
        const dueItems = airingToday.filter(s => {
            const lastAddedDate = s.lastAddedAt ? new Date(s.lastAddedAt) : null;
            const alreadyPublished = lastAddedDate && lastAddedDate.toDateString() === todayStr;
            if (alreadyPublished) return false;

            const [h, m] = s.time.split(':').map(Number);
            const sched = new Date();
            sched.setHours(h, m, 0, 0);
            return now >= sched;
        });

        return {
            total: schedules.length,
            active: schedules.filter(s => s.isActive).length,
            todayCount: airingToday.length,
            dueCount: dueItems.length,
            completedToday: airingToday.filter(s => s.lastAddedAt && new Date(s.lastAddedAt).toDateString() === new Date().toDateString()).length
        };
    }, [schedules, airingToday]);

    // RENDER EDITOR VIEW
    if (viewMode === 'editor') {
        return (
            <ScheduleEditorView 
                schedule={editingSchedule} 
                onClose={handleCloseEditor} 
                onSave={async (s) => {
                    await saveReleaseSchedule(s);
                    addToast('تم حفظ بيانات الرادار!', 'success');
                    handleCloseEditor();
                    fetchSchedules();
                }} 
            />
        );
    }

    // RENDER LIST VIEW
    return (
        <div className="space-y-8 animate-fade-in-up" dir="rtl">
            {/* Header / Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#1a2230] p-6 rounded-3xl border border-gray-800 shadow-xl flex items-center justify-between group hover:border-[#00A7F8]/50 transition-all">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">إجمالي الرادار</p>
                        <p className="text-3xl font-black text-white">{stats.total}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400"><RadarIcon className="w-6 h-6" /></div>
                </div>
                <div className="bg-[#1a2230] p-6 rounded-3xl border border-gray-800 shadow-xl flex items-center justify-between group hover:border-red-500/50 transition-all">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">حان موعدها (Due)</p>
                        <p className="text-3xl font-black text-red-500">{stats.dueCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 animate-pulse">📡</div>
                </div>
                <div className="bg-[#1a2230] p-6 rounded-3xl border border-gray-800 shadow-xl flex items-center justify-between group hover:border-purple-500/50 transition-all">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">تم نشره اليوم</p>
                        <p className="text-3xl font-black text-purple-400">{stats.completedToday}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">✓</div>
                </div>
                <div className="bg-[#1a2230] p-6 rounded-3xl border border-gray-800 shadow-xl flex items-center justify-between group hover:border-yellow-500/50 transition-all">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">غير نشط</p>
                        <p className="text-3xl font-black text-yellow-500">{stats.total - stats.active}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">⏸</div>
                </div>
            </div>

            {/* Toolbar Area */}
            <div className="flex flex-col lg:flex-row justify-between items-stretch gap-4 bg-[#1f2937] p-6 rounded-3xl border border-gray-700/50 shadow-2xl relative overflow-hidden">
                <div className="flex-1 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative w-full md:w-80">
                        <input 
                            type="text" 
                            placeholder="ابحث في الرادار..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0f1014] border border-gray-700 rounded-2xl px-12 py-3 focus:border-[#00A7F8] focus:ring-1 focus:ring-[#00A7F8] outline-none text-white transition-all text-sm"
                        />
                        <div className="absolute right-4 top-3 text-gray-500">🔍</div>
                    </div>
                    <div className="flex bg-[#0f1014] p-1 rounded-xl border border-gray-700 w-full md:w-auto">
                        <button onClick={() => setFilterStatus('all')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${filterStatus === 'all' ? 'bg-gray-800 text-white shadow' : 'text-gray-500'}`}>الكل</button>
                        <button onClick={() => setFilterStatus('active')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${filterStatus === 'active' ? 'bg-green-600 text-white shadow' : 'text-gray-500'}`}>النشط</button>
                        <button onClick={() => setFilterStatus('inactive')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${filterStatus === 'inactive' ? 'bg-red-600 text-white shadow' : 'text-gray-500'}`}>متوقف</button>
                    </div>
                </div>
                <button 
                    onClick={() => handleOpenEdit(null)}
                    className="bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-black px-10 py-3 rounded-2xl hover:shadow-[0_0_30px_rgba(0,167,248,0.4)] transition-all transform hover:scale-105 active:scale-95"
                >
                    + إضافة مسلسل للرادار
                </button>
            </div>

            {/* Main Content Sections */}
            <div className="space-y-12">
                {/* Airing Today */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-8 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
                        <h4 className="text-2xl font-black text-white">إصدارات اليوم ({airingToday.length})</h4>
                    </div>

                    {isLoading ? (
                        <div className="py-20 text-center text-gray-500 animate-pulse">جاري مسح الرادار...</div>
                    ) : airingToday.length === 0 ? (
                        <div className="bg-[#0f1014] p-12 rounded-[2.5rem] border border-gray-800 text-center opacity-30">
                             <p className="text-xl font-bold">لا توجد إصدارات مجدولة لهذا اليوم.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {airingToday.map(item => (
                                <RadarCard 
                                    key={item.id} 
                                    item={item} 
                                    dayLabels={item.daysOfWeek.map(d => dayNames[d])} 
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

                {/* Weekly Queue */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(0,167,248,0.5)]"></div>
                        <h4 className="text-2xl font-black text-white">قائمة الأسبوع (بقية الإصدارات)</h4>
                    </div>
                    
                    {others.length === 0 ? (
                        <div className="text-center py-10 text-gray-600 font-bold">لا توجد أعمال أخرى مطابقة للفلتر.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {others.map(item => (
                                <RadarCard 
                                    key={item.id} 
                                    item={item} 
                                    dayLabels={item.daysOfWeek.map(d => dayNames[d])} 
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
            </div>
        </div>
    );
};

// --- RADAR CARD COMPONENT (IMPROVED FOR FULL POSTER) ---
const RadarCard: React.FC<{
    item: ReleaseSchedule; 
    dayLabels: string[]; 
    onMarkDone: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onJump: () => void;
    isToday: boolean;
}> = ({ item, dayLabels, onMarkDone, onEdit, onDelete, onJump, isToday }) => {
    
    const lastAddedDate = item.lastAddedAt ? new Date(item.lastAddedAt) : null;
    const isPublishedToday = lastAddedDate && lastAddedDate.toDateString() === new Date().toDateString();

    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        if (!isToday || isPublishedToday) return;

        const updateTimer = () => {
            const now = new Date();
            const [hours, minutes] = item.time.split(':').map(Number);
            const target = new Date();
            target.setHours(hours, minutes, 0);

            if (now > target) {
                setTimeLeft('حان الموعد!');
            } else {
                const diff = target.getTime() - now.getTime();
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff / (1000 * 60)) % 60);
                setTimeLeft(`يصدر خلال ${h}س و ${m}د`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, [isToday, isPublishedToday, item.time]);

    const borderGlow = item.priority === 'hot' ? 'border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.2)]' : isToday ? 'border-green-600/30' : 'border-gray-800';

    return (
        <div className={`group relative bg-[#1a2230] border rounded-[2rem] overflow-hidden transition-all duration-500 hover:shadow-2xl flex flex-col ${borderGlow}`}>
            {/* Visual Header - CHANGED aspect ratio for full poster look */}
            <div className="aspect-[16/14] relative overflow-hidden bg-black">
                <img 
                    src={item.poster} 
                    className="w-full h-full object-cover object-top opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" 
                    alt="" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a2230] via-[#1a2230]/10 to-transparent"></div>
                
                {/* Status & Priority */}
                <div className="absolute top-4 inset-x-4 flex justify-between items-start z-20">
                    <div className="flex flex-col gap-2">
                         <PriorityBadge priority={item.priority} />
                         <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-[8px] font-black text-white border border-white/10 uppercase tracking-widest">
                            <StatusLabel status={item.status} />
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onEdit} className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-[#00A7F8] hover:text-black transition-all shadow-lg">✎</button>
                        <button onClick={onDelete} className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-red-600 transition-all shadow-lg">✕</button>
                    </div>
                </div>

                {/* Main Info Overlay */}
                <div className="absolute bottom-4 right-4 left-4 text-right">
                    <h5 className="text-2xl font-black text-white drop-shadow-lg leading-tight mb-2 truncate">{item.seriesName}</h5>
                    <div className="flex flex-wrap gap-1 mb-2">
                        {dayLabels.map((day, idx) => (
                            <span key={idx} className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${isToday && dayLabels.length === 1 ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-gray-800 text-gray-400'}`}>
                                {day}
                            </span>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                         <span className="bg-[#00A7F8] text-black text-[10px] px-3 py-1 rounded-lg font-black shadow-lg" dir="rtl">{item.time}</span>
                         {isToday && !isPublishedToday && (
                             <span className="bg-green-500/20 text-green-400 text-[10px] px-3 py-1 rounded-lg font-black border border-green-500/30 flex items-center gap-1">
                                <TimerIcon />
                                {timeLeft}
                             </span>
                         )}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 flex-1 flex flex-col gap-6">
                {/* Sources Pill Area */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">المصادر (Sources)</span>
                        <span className="text-[10px] text-gray-600 font-bold">رقم الحلقة القادمة: {item.nextEpisodeNumber || '-'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {item.sources.map((src, i) => (
                            <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-[#0f1014] rounded-2xl text-[11px] font-bold text-gray-300 hover:bg-[#161b22] border border-gray-800 transition-all group/link hover:border-[#00A7F8]/30">
                                <span className="truncate max-w-[80px]">{src.name}</span>
                                <ExternalLinkIcon />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-auto pt-6 border-t border-gray-800/50 flex items-center justify-between">
                    <button 
                        onClick={onJump}
                        className="text-xs font-black text-[#00A7F8] hover:text-[#00FFB0] transition-colors flex items-center gap-1.5 group/jump"
                    >
                        <span>فتح في المكتبة</span>
                        <span className="transition-transform group-hover/jump:-translate-x-1">🔗</span>
                    </button>

                    <button 
                        onClick={onMarkDone}
                        disabled={isPublishedToday}
                        className={`px-6 py-2.5 rounded-2xl font-black text-xs transition-all shadow-xl flex items-center gap-2 active:scale-95 ${isPublishedToday ? 'bg-green-600/10 text-green-400 border border-green-500/20 cursor-default' : 'bg-white text-black hover:bg-[#00FFB0]'}`}
                    >
                        {isPublishedToday ? (
                            <>
                                <span className="text-lg">✓</span>
                                <span>تم النشر اليوم</span>
                            </>
                        ) : 'تحديد كمكتمل'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- SCHEDULE EDITOR VIEW (MODAL CONTENT AS FULL PAGE) ---
const ScheduleEditorView: React.FC<{ 
    schedule: ReleaseSchedule | null; 
    onClose: () => void; 
    onSave: (s: ReleaseSchedule) => void 
}> = ({ schedule, onClose, onSave }) => {
    const isNew = !schedule;
    const [allContent, setAllContent] = useState<Content[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const [formData, setFormData] = useState<ReleaseSchedule>(schedule || {
        id: '',
        seriesName: '',
        poster: '',
        daysOfWeek: [1],
        time: '21:00',
        isActive: true,
        lastAddedAt: null,
        sources: [{ name: 'EGYBEST', url: '' }, { name: 'WE CIMA', url: '' }],
        priority: 'medium',
        status: 'ongoing',
        nextEpisodeNumber: 1,
        internalNotes: ''
    });

    useEffect(() => {
        const fetchAll = async () => {
            const snap = await db.collection('content').get();
            setAllContent(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content)));
        };
        fetchAll();
    }, []);

    const filteredSuggestions = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase();
        return allContent.filter(c => 
            c.title.toLowerCase().includes(query) || 
            (c.slug && c.slug.toLowerCase().includes(query))
        ).slice(0, 5);
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

    const toggleDay = (dayIndex: number) => {
        setFormData(prev => {
            const currentDays = prev.daysOfWeek || [];
            const newDays = currentDays.includes(dayIndex)
                ? currentDays.filter(d => d !== dayIndex)
                : [...currentDays, dayIndex];
            return { ...prev, daysOfWeek: newDays.sort((a,b) => a - b) };
        });
    };

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

    const inputClass = "w-full bg-[#0f1014] border border-gray-700 rounded-2xl px-4 py-3 text-white focus:border-[#00A7F8] outline-none transition-all text-sm";
    const labelClass = "block text-[10px] font-black text-gray-500 uppercase tracking-[0.15em] mb-2 pr-1";

    return (
        <div className="space-y-10 animate-fade-in" dir="rtl">
            {/* Page Header */}
            <div className="flex justify-between items-center bg-[#1a2230] p-8 rounded-3xl border border-gray-800 shadow-xl">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-3 bg-gray-800 text-gray-400 hover:text-white rounded-2xl transition-all border border-gray-700">
                        <BackIcon />
                    </button>
                    <div>
                        <h3 className="text-2xl font-black text-white">{isNew ? 'إضافة رادار بث جديد' : 'تعديل بيانات الرادار'}</h3>
                        <p className="text-xs text-gray-500 font-bold">أنت الآن تقوم بـ {isNew ? 'إنشاء مدخل جديد' : `تحديث بيانات ${formData.seriesName}`}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="px-8 py-3 bg-gray-800 text-gray-300 font-black rounded-2xl hover:bg-gray-700 transition-colors border border-gray-700">إلغاء</button>
                    <button 
                        onClick={() => onSave(formData)} 
                        className="bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-black px-12 py-3 rounded-2xl shadow-2xl transform active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                        disabled={!formData.seriesName || formData.daysOfWeek.length === 0}
                    >
                        حفظ ونشر
                    </button>
                </div>
            </div>

            {/* Editor Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* Poster Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                     <div className="bg-[#1a2230] p-6 rounded-[3rem] border border-gray-800 shadow-2xl">
                         <div className="aspect-[2/3] rounded-[2.5rem] overflow-hidden bg-black border-2 border-dashed border-gray-700 relative group mb-6">
                            {formData.poster ? (
                                <img src={formData.poster} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt=""/>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-xs text-gray-600 text-center px-8 gap-4">
                                    <RadarIcon className="w-12 h-12 opacity-20" />
                                    <span>اختر مسلسلاً لعرض البوستر هنا</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                         </div>
                         <div>
                            <label className={labelClass}>رابط البوستر المخصص</label>
                            <input value={formData.poster} onChange={e => setFormData({...formData, poster: e.target.value})} className={inputClass + " font-mono text-[10px] text-blue-400/70"} placeholder="https://..."/>
                         </div>
                     </div>
                </div>

                {/* Form Content */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Database Search */}
                    <div className="bg-[#1a2230] p-8 rounded-[3rem] border border-gray-800 shadow-xl space-y-6">
                        <div className="relative">
                            <label className={labelClass}>🔍 الربط مع قاعدة البيانات</label>
                            <input 
                                type="text"
                                value={searchQuery} 
                                onChange={e => { setSearchQuery(e.target.value); setIsSearching(true); }} 
                                onFocus={() => setIsSearching(true)}
                                className={inputClass + " border-blue-500/20 focus:border-[#00A7F8] bg-[#0f1014] shadow-inner"} 
                                placeholder="اكتب اسم المسلسل للربط التلقائي..."
                            />
                            
                            {isSearching && filteredSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-[#1f2937] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                                    {filteredSuggestions.map(content => (
                                        <button 
                                            key={content.id}
                                            type="button"
                                            onClick={() => handleSelectContent(content)}
                                            className="w-full flex items-center gap-4 p-4 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0"
                                        >
                                            <img src={content.poster} className="w-12 h-16 object-cover rounded-lg shadow-md" alt="" />
                                            <div className="flex flex-col text-right">
                                                <span className="font-bold text-white">{content.title}</span>
                                                <span className="text-[10px] text-gray-500 font-mono">ID: {content.id}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Basic Info Row */}
                        <div className="bg-[#1a2230] p-8 rounded-[3rem] border border-gray-800 shadow-xl space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className={labelClass}>اسم المسلسل (للربط)</label>
                                    <input value={formData.seriesName} onChange={e => setFormData({...formData, seriesName: e.target.value})} className={inputClass} placeholder="مثال: المؤسس عثمان"/>
                                </div>
                                <div>
                                    <label className={labelClass}>رقم الحلقة القادمة</label>
                                    <input type="number" value={formData.nextEpisodeNumber || ''} onChange={e => setFormData({...formData, nextEpisodeNumber: parseInt(e.target.value)})} className={inputClass} placeholder="25"/>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className={labelClass}>وقت العرض (بتوقيت مكة)</label>
                                    <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className={inputClass}/>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>الأولوية (Priority)</label>
                                        <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})} className={inputClass}>
                                            <option value="low">عادي (Low)</option>
                                            <option value="medium">متوسط (Medium)</option>
                                            <option value="high">مرتفع (High)</option>
                                            <option value="hot">تريند (HOT 🔥)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>الحالة (Status)</label>
                                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className={inputClass}>
                                            <option value="ongoing">مستمر</option>
                                            <option value="hiatus">متوقف مؤقتاً</option>
                                            <option value="finished">منتهي</option>
                                            <option value="upcoming">قريباً</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Days of week */}
                            <div>
                                <label className={labelClass}>أيام الصدور (Days of Week)</label>
                                <div className="flex flex-wrap gap-2">
                                    {dayNames.map((name, idx) => (
                                        <button 
                                            key={idx}
                                            type="button"
                                            onClick={() => toggleDay(idx)}
                                            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all border ${formData.daysOfWeek.includes(idx) ? 'bg-[#00A7F8] text-black border-transparent shadow-[0_0_15px_rgba(0,167,248,0.3)]' : 'bg-[#0f1014] text-gray-500 border-gray-800 hover:border-gray-600'}`}
                                        >
                                            {name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between border-t border-gray-800">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white">تفعيل الرادار</span>
                                    <span className="text-[10px] text-gray-500">سيتم إظهار تنبيهات لهذا المسلسل في اللوحة عند موعد صدوره.</span>
                                </div>
                                <ToggleSwitch checked={formData.isActive} onChange={(val) => setFormData({...formData, isActive: val})} />
                            </div>
                        </div>

                        {/* Sources Management */}
                        <div className="bg-[#1a2230] p-8 rounded-[3rem] border border-gray-800 shadow-xl space-y-6">
                            <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                                <h4 className="text-lg font-black text-white">مصادر البحث (Search Sources)</h4>
                                <button type="button" onClick={addSource} className="text-xs font-black text-[#00A7F8] hover:underline flex items-center gap-1">
                                    <PlusIcon className="w-4 h-4"/> إضافة مصدر
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {formData.sources.map((src, i) => (
                                    <div key={i} className="bg-[#0f1014] p-4 rounded-2xl border border-gray-800 space-y-3 group relative">
                                        <button onClick={() => removeSource(i)} className="absolute -top-2 -left-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                            <CloseIcon className="w-3 h-3 text-white"/>
                                        </button>
                                        <input value={src.name} onChange={e => handleSourceChange(i, 'name', e.target.value)} className={inputClass + " h-9"} placeholder="اسم المصدر..."/>
                                        <input value={src.url} onChange={e => handleSourceChange(i, 'url', e.target.value)} className={inputClass + " h-9 text-[10px] font-mono"} placeholder="رابط البحث المباشر..."/>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Internal Notes */}
                        <div className="bg-[#1a2230] p-8 rounded-[3rem] border border-gray-800 shadow-xl">
                             <label className={labelClass}>ملاحظات داخلية للمشرفين</label>
                             <textarea value={formData.internalNotes || ''} onChange={e => setFormData({...formData, internalNotes: e.target.value})} className={inputClass + " h-32 resize-none"} placeholder="أي تفاصيل أخرى تساعد المشرفين..."/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContentRadarTab;
