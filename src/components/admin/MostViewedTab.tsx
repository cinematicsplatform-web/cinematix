import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import type { Content } from '../types';
import { ContentType } from '../types';
import { 
    Search, 
    Film, 
    Tv, 
    Eye, 
    TrendingUp, 
    Edit, 
    Calendar, 
    Award, 
    Star, 
    ArrowUpRight,
    SlidersHorizontal,
    X
} from 'lucide-react';
import { BouncingDotsLoader } from '../shared/BouncingDotsLoader';
import { normalizeText } from '../../utils/textUtils';

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

interface MostViewedTabProps {
    onEdit: (content: Content) => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const MostViewedTab: React.FC<MostViewedTabProps> = ({ onEdit, addToast }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [contentType, setContentType] = useState<string>('all');
    const [allContent, setAllContent] = useState<Content[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    
    const itemsPerPage = 15;
    const pagesPerGroup = 5;

    useEffect(() => {
        const fetchContent = async () => {
            setIsLoading(true);
            try {
                const snap = await db.collection("content").get();
                const docs = snap.docs.map(d => ({ 
                    ...d.data(), 
                    id: d.id,
                    views: Number(d.data().views || 0)
                })) as Content[];
                
                // Sort by views descending
                docs.sort((a, b) => (b.views || 0) - (a.views || 0));
                setAllContent(docs);
            } catch (e) {
                console.error("Error fetching views analytics:", e);
                addToast("خطأ في جلب بيانات المشاهدات من قاعدة البيانات", "error");
            }
            setIsLoading(false);
        };
        fetchContent();
    }, [addToast]);

    const filteredContent = useMemo(() => {
        if (!allContent) return [];
        let result = [...allContent];

        if (contentType !== 'all') {
            result = result.filter(c => c.type === contentType);
        }

        if (searchTerm.trim() !== '') {
            const normalizedQuery = normalizeText(searchTerm);
            result = result.filter(c => normalizeText(c.title || '').includes(normalizedQuery));
        }

        return result;
    }, [allContent, contentType, searchTerm]);

    const totalViews = useMemo(() => {
        if (!allContent) return 0;
        return allContent.reduce((sum, item) => sum + (item.views || 0), 0);
    }, [allContent]);

    const averageViews = useMemo(() => {
        if (!allContent || allContent.length === 0) return 0;
        return Math.round(totalViews / allContent.length);
    }, [allContent, totalViews]);

    // Pagination calculations
    const totalItems = filteredContent.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const pagedItems = useMemo(() => {
        return filteredContent.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredContent, startIndex]);

    const currentGroup = Math.floor((currentPage - 1) / pagesPerGroup);
    const pageNumbersInGroup = Array.from(
        { length: Math.min(pagesPerGroup, totalPages - currentGroup * pagesPerGroup) },
        (_, i) => currentGroup * pagesPerGroup + i + 1
    );

    const hasNextGroup = (currentGroup + 1) * pagesPerGroup < totalPages;
    const hasPrevGroup = currentGroup > 0;

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header / Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-gradient-to-br from-gray-900 to-gray-950 p-6 rounded-3xl border border-gray-800 shadow-xl flex items-center gap-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#00A7F8]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#00A7F8]/10 transition-all duration-300"></div>
                    <div className="w-14 h-14 rounded-2xl bg-[#00A7F8]/10 border border-[#00A7F8]/20 flex items-center justify-center text-[#00A7F8] shrink-0">
                        <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-gray-500 block mb-0.5">إجمالي مشاهدات المنصة</span>
                        <span className="text-2xl font-black text-white font-mono">{totalViews.toLocaleString('ar-EG')}</span>
                        <span className="text-[10px] text-gray-400 block mt-1">مشاهدة لكافة الأعمال المدرجة</span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-gray-950 p-6 rounded-3xl border border-gray-800 shadow-xl flex items-center gap-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFB0]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#00FFB0]/10 transition-all duration-300"></div>
                    <div className="w-14 h-14 rounded-2xl bg-[#00FFB0]/10 border border-[#00FFB0]/20 flex items-center justify-center text-[#00FFB0] shrink-0">
                        <Eye className="w-7 h-7" />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-gray-500 block mb-0.5">معدل المشاهدة للعمل</span>
                        <span className="text-2xl font-black text-white font-mono">{averageViews.toLocaleString('ar-EG')}</span>
                        <span className="text-[10px] text-gray-400 block mt-1">متوسط المشاهدات لكل عمل فني</span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-gray-950 p-6 rounded-3xl border border-gray-800 shadow-xl flex items-center gap-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/10 transition-all duration-300"></div>
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                        <Film className="w-7 h-7" />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-gray-500 block mb-0.5">إجمالي أعمال المنصة</span>
                        <span className="text-2xl font-black text-white font-mono">{(allContent?.length || 0).toLocaleString('ar-EG')}</span>
                        <span className="text-[10px] text-gray-400 block mt-1">عدد الأفلام والمسلسلات الكلية</span>
                    </div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-gray-900/90 backdrop-blur-xl p-6 rounded-3xl border border-gray-800 shadow-2xl">
                <div className="relative w-full md:w-auto md:min-w-[360px]">
                    <input 
                        type="text" 
                        placeholder="ابحث بالاسم في قائمة المشاهدات..." 
                        value={searchTerm} 
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }} 
                        className="w-full bg-gray-950/80 border border-gray-800 rounded-2xl px-12 py-3.5 focus:outline-none focus:border-[#00A7F8] focus:ring-2 focus:ring-[#00A7F8]/20 text-white placeholder-gray-500 shadow-inner transition-all text-sm font-medium"
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                            مسح
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-gray-950/80 p-1.5 rounded-2xl border border-gray-800 w-full md:w-auto">
                        <button
                            onClick={() => { setContentType('all'); setCurrentPage(1); }}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                contentType === 'all' 
                                    ? 'bg-[#1a1f29] text-white border border-[#00A7F8]/40 font-extrabold' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            الكل
                        </button>
                        <button
                            onClick={() => { setContentType(ContentType.Movie); setCurrentPage(1); }}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                contentType === ContentType.Movie 
                                    ? 'bg-[#1a1f29] text-white border border-[#00A7F8]/40 font-extrabold' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            الأفلام
                        </button>
                        <button
                            onClick={() => { setContentType(ContentType.Series); setCurrentPage(1); }}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                contentType === ContentType.Series 
                                    ? 'bg-[#1a1f29] text-white border border-[#00A7F8]/40 font-extrabold' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            المسلسلات
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            {isLoading ? (
                <div className="py-36 flex flex-col items-center justify-center gap-6">
                    <BouncingDotsLoader size="lg" delayMs={300} />
                    <span className="text-gray-400 font-extrabold tracking-widest uppercase text-xs">جاري جلب إحصائيات المشاهدة وتجهيز القائمة...</span>
                </div>
            ) : (
                <>
                    {totalItems === 0 ? (
                        <div className="text-center py-24 text-gray-400 border-2 border-dashed border-gray-800 rounded-[2.5rem] flex flex-col items-center justify-center bg-gray-900/20">
                            <div className="w-16 h-16 rounded-3xl bg-gray-800/60 flex items-center justify-center text-3xl mb-4 border border-gray-700/50">
                                📊
                            </div>
                            <h3 className="text-lg font-extrabold text-white mb-1">لا يوجد محتوى</h3>
                            <p className="text-xs text-gray-500">لم نجد أي عمل يطابق شروط البحث الحالية.</p>
                        </div>
                    ) : (
                        <div className="bg-gray-900/40 rounded-[2.5rem] border border-gray-800 overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-800 bg-gray-950/60 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            <th className="py-5 px-6 text-center w-20">الترتيب</th>
                                            <th className="py-5 px-6">العمل الفني</th>
                                            <th className="py-5 px-6 w-32 text-center">النوع الفني</th>
                                            <th className="py-5 px-6 w-32 text-center">سنة الإصدار</th>
                                            <th className="py-5 px-6 w-44 text-center">عدد المشاهدات</th>
                                            <th className="py-5 px-6 w-32 text-center">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/60">
                                        {pagedItems.map((c, index) => {
                                            const globalIndex = startIndex + index + 1;
                                            const meta = getTypeMeta(c.type);

                                            // Award badge class for top 3
                                            let rankBadge = '';
                                            if (globalIndex === 1) {
                                                rankBadge = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
                                            } else if (globalIndex === 2) {
                                                rankBadge = 'bg-slate-300/20 text-slate-300 border-slate-300/40';
                                            } else if (globalIndex === 3) {
                                                rankBadge = 'bg-amber-700/20 text-amber-600 border-amber-700/40';
                                            } else {
                                                rankBadge = 'bg-gray-800/50 text-gray-400 border-gray-800';
                                            }

                                            return (
                                                <tr key={c.id} className="hover:bg-gray-850/30 transition-colors group">
                                                    {/* Rank */}
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black border font-mono ${rankBadge}`}>
                                                            {globalIndex <= 3 && <Award className="w-3.5 h-3.5 ml-0.5 shrink-0" />}
                                                            {globalIndex}
                                                        </span>
                                                    </td>

                                                    {/* Work Info */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-18 rounded-lg overflow-hidden shrink-0 border border-gray-800 relative bg-gray-950">
                                                                <img 
                                                                    src={c.poster || '/placeholder.png'} 
                                                                    alt={c.title} 
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="text-sm font-black text-white group-hover:text-[#00A7F8] transition-colors truncate mb-1">
                                                                    {c.title || 'بدون عنوان'}
                                                                </h4>
                                                                <div className="flex items-center gap-2">
                                                                    {c.rating > 0 && (
                                                                        <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-400">
                                                                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                                            <span>{c.rating}</span>
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[10px] text-gray-500 font-bold truncate max-w-[200px]">
                                                                        {c.categories?.join(' • ') || 'غير مصنف'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Type */}
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${meta.color}`}>
                                                            {meta.label}
                                                        </span>
                                                    </td>

                                                    {/* Release Year */}
                                                    <td className="py-4 px-6 text-center text-sm font-bold text-gray-400 font-mono">
                                                        {c.releaseYear || '----'}
                                                    </td>

                                                    {/* Views Count */}
                                                    <td className="py-4 px-6 text-center">
                                                        <div className="inline-flex items-center gap-2 bg-gray-950/60 px-4 py-2 rounded-2xl border border-gray-800/80">
                                                            <Eye className="w-4 h-4 text-[#00A7F8]" />
                                                            <span className="text-sm font-extrabold text-white font-mono">
                                                                {(c.views || 0).toLocaleString('ar-EG')}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-4 px-6 text-center">
                                                        <button
                                                            onClick={() => onEdit(c)}
                                                            className="inline-flex items-center gap-1.5 bg-gray-800 hover:bg-[#00FFB0] text-gray-300 hover:text-black font-extrabold px-3 py-1.5 rounded-xl text-xs transition-all duration-200 cursor-pointer shadow-sm"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                            <span>تعديل</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex flex-col items-center gap-5 p-6 bg-gray-950/40 border-t border-gray-800">
                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                        {hasPrevGroup && (
                                            <button 
                                                onClick={() => setCurrentPage(currentGroup * pagesPerGroup)}
                                                className="flex items-center gap-2 px-3.5 py-2 bg-gray-800 text-gray-300 font-extrabold rounded-xl hover:bg-gray-700 transition-all border border-gray-700 cursor-pointer text-xs"
                                            >
                                                <span className="rotate-180">«</span>
                                                <span>المجموعة السابقة</span>
                                            </button>
                                        )}

                                        {pageNumbersInGroup.map(num => (
                                            <button
                                                key={num}
                                                onClick={() => setCurrentPage(num)}
                                                className={`w-10 h-10 rounded-xl font-black text-xs transition-all border cursor-pointer flex items-center justify-center ${
                                                    currentPage === num 
                                                        ? 'bg-gradient-to-tr from-[#00A7F8] to-[#00FFB0] text-black border-transparent shadow-lg scale-105' 
                                                        : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white hover:border-gray-600'
                                                }`}
                                            >
                                                {num}
                                            </button>
                                        ))}

                                        {hasNextGroup && (
                                            <button 
                                                onClick={() => setCurrentPage((currentGroup + 1) * pagesPerGroup + 1)}
                                                className="flex items-center gap-2 px-3.5 py-2 bg-gray-800 text-gray-300 font-extrabold rounded-xl hover:bg-gray-700 transition-all border border-gray-700 cursor-pointer text-xs"
                                            >
                                                <span>المجموعة التالية</span>
                                                <span>»</span>
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-xs font-bold text-gray-500 font-mono">
                                        الصفحة {currentPage} من {totalPages} | إجمالي العناصر: {totalItems}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MostViewedTab;
