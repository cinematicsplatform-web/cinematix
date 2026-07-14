import React, { useState, useEffect } from 'react';
import { db, getReports, deleteReport, updateReportStatus } from '../../firebase';
import { TrashIcon } from './AdminIcons';
import type { Content } from '../../types';

interface ReportsManagementTabProps {
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
    onRequestDelete: (id: string, title: string) => void;
    allContent?: Content[];
    onEditContent?: (content: Content) => void;
}

const ReportsManagementTab: React.FC<ReportsManagementTabProps> = ({ 
    addToast, 
    onRequestDelete, 
    allContent = [], 
    onEditContent 
}) => {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'pending' | 'resolved' | 'ignored' | 'all'>('pending');
    const [selectedReport, setSelectedReport] = useState<any | null>(null);

    useEffect(() => {
        setLoading(true);
        // Real-time listener using onSnapshot for direct interface updates on new reports
        const unsubscribe = db.collection("reports").onSnapshot((snapshot) => {
            const data = snapshot.docs.map(doc => {
                const docData = doc.data();
                return {
                    id: doc.id,
                    ...docData,
                    timestamp: docData.timestamp?.toDate ? docData.timestamp.toDate().toISOString() : (docData.timestamp || docData.createdAt || new Date().toISOString())
                };
            });
            
            // Sort by timestamp descending
            const sorted = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setReports(sorted);
            setLoading(false);
        }, (error) => {
            console.error("Firestore real-time reports listener error:", error);
            fetchReports();
        });

        return () => unsubscribe();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        const data = await getReports();
        setReports(data);
        setLoading(false);
    };

    const handleUpdateStatus = async (reportId: string, status: 'pending' | 'resolved' | 'ignored') => {
        try {
            await updateReportStatus(reportId, status);
            addToast(
                status === 'resolved' ? "تم تحديد البلاغ كـ 'تم الإصلاح' بنجاح" : "تم تجاهل البلاغ بنجاح",
                "success"
            );
            if (selectedReport && selectedReport.id === reportId) {
                setSelectedReport(prev => prev ? { ...prev, status } : null);
            }
        } catch (error) {
            console.error("Error updating report status:", error);
            addToast("فشل تحديث حالة البلاغ.", "error");
        }
    };

    const handleGoToContent = (contentId: string) => {
        if (!allContent || allContent.length === 0) {
            addToast("جاري تحميل بيانات المحتوى، يرجى المحاولة بعد قليل.", "info");
            return;
        }
        const item = allContent.find(c => c.id === contentId);
        if (item && onEditContent) {
            onEditContent(item);
        } else {
            addToast("عذراً، لم يتم العثور على العمل الأصلي في قاعدة البيانات (قد يكون تم حذفه).", "error");
        }
    };

    // Filter reports based on the selected status tab
    const filteredReports = reports.filter(r => {
        if (filterStatus === 'all') return true;
        // Map 'open' to 'pending' if any older reports exist
        const status = r.status === 'open' ? 'pending' : r.status;
        return status === filterStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'resolved':
                return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold">تم الإصلاح</span>;
            case 'ignored':
                return <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 px-3 py-1 rounded-full text-xs font-bold">تم التجاهل</span>;
            case 'pending':
            case 'open':
            default:
                return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold animate-pulse">قيد الانتظار</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header and Filter Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#11131c] p-6 rounded-2xl border border-gray-800/80">
                <div>
                    <h3 className="font-bold text-xl text-white flex items-center gap-2">⚠️ نظام إدارة بلاغات الأعطال</h3>
                    <p className="text-gray-400 text-xs mt-1">تتبع وإصلاح الروابط التالفة أو الأخطاء التي يبلغ عنها المستخدمون في الوقت الفعلي.</p>
                </div>
                
                {/* Tabs */}
                <div className="flex bg-gray-950/60 p-1.5 rounded-xl border border-gray-800/60 self-start md:self-auto">
                    {[
                        { id: 'pending', label: 'قيد الانتظار' },
                        { id: 'resolved', label: 'تم الإصلاح' },
                        { id: 'ignored', label: 'تم التجاهل' },
                        { id: 'all', label: 'الكل' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterStatus(tab.id as any)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterStatus === tab.id ? 'bg-[#00A7F8] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            {tab.label}
                            {reports.filter(r => (tab.id === 'all' ? true : (r.status === 'open' ? 'pending' : r.status) === tab.id)).length > 0 && (
                                <span className={`mr-1 px-1.5 py-0.5 text-[9px] rounded-full font-bold ${filterStatus === tab.id ? 'bg-white text-black' : 'bg-gray-800 text-gray-300'}`}>
                                    {reports.filter(r => (tab.id === 'all' ? true : (r.status === 'open' ? 'pending' : r.status) === tab.id)).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reports List */}
            <div className="bg-[#11131c] rounded-2xl border border-gray-800/80 overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="text-center py-20 text-gray-500">
                        <div className="w-10 h-10 border-4 border-[#00A7F8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        جاري تحميل البلاغات في الوقت الفعلي...
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="text-center py-24 text-gray-500 flex flex-col items-center gap-4">
                        <span className="text-5xl opacity-40">🎉</span>
                        <div className="text-lg font-bold text-white">لا توجد بلاغات في هذا القسم</div>
                        <p className="text-gray-400 text-xs">كل شيء يعمل بشكل ممتاز!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right text-gray-300">
                            <thead className="bg-gray-950/60 text-xs font-bold text-gray-400 border-b border-gray-800">
                                <tr>
                                    <th className="px-8 py-4">عنوان العمل والمحتوى</th>
                                    <th className="px-8 py-4">نوع المشكلة</th>
                                    <th className="px-8 py-4">التفاصيل</th>
                                    <th className="px-8 py-4">التاريخ والوقت</th>
                                    <th className="px-8 py-4">الحالة</th>
                                    <th className="px-8 py-4 text-left pl-8">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/40">
                                {filteredReports.map(report => {
                                    const hasOriginalContent = allContent.some(c => c.id === report.contentId);
                                    return (
                                        <tr key={report.id} className="hover:bg-gray-800/10 transition-colors cursor-pointer" onClick={() => setSelectedReport(report)}>
                                            <td className="px-8 py-4 font-bold text-white">
                                                <div className="flex flex-col">
                                                    <span>{report.contentTitle}</span>
                                                    <div className="flex gap-2 items-center mt-1">
                                                        <span className="text-[10px] text-gray-500 font-bold bg-gray-950/50 px-2 py-0.5 rounded border border-gray-800/50">
                                                            {report.contentType === 'series' ? '📺 مسلسل' : '🎬 فيلم'}
                                                        </span>
                                                        {report.episodeId && (
                                                            <span className="text-[10px] text-[#00A7F8] font-bold bg-[#00A7F8]/5 px-2 py-0.5 rounded border border-[#00A7F8]/10">
                                                                {report.episodeId}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className="bg-red-500/5 text-red-400 border border-red-500/10 px-3 py-1 rounded-xl text-xs font-bold">
                                                    {report.reason}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-xs text-gray-400 max-w-xs truncate" title={report.description}>
                                                {report.description || '-'}
                                            </td>
                                            <td className="px-8 py-4 text-xs font-mono text-gray-400">
                                                {new Date(report.timestamp).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                                            </td>
                                            <td className="px-8 py-4">
                                                {getStatusBadge(report.status)}
                                            </td>
                                            <td className="px-8 py-4 text-left pl-8" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => setSelectedReport(report)}
                                                        className="text-xs bg-gray-800 hover:bg-gray-700 text-white font-bold py-1.5 px-3 rounded-lg border border-gray-700 transition-all"
                                                    >
                                                        عرض التفاصيل
                                                    </button>
                                                    {hasOriginalContent && onEditContent && (
                                                        <button 
                                                            onClick={() => handleGoToContent(report.contentId)}
                                                            className="text-xs bg-[#00A7F8]/10 hover:bg-[#00A7F8] text-[#00A7F8] hover:text-white font-bold py-1.5 px-3 rounded-lg border border-[#00A7F8]/20 transition-all"
                                                            title="تعديل العمل الأصلي مباشرة"
                                                        >
                                                            تعديل العمل
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => onRequestDelete(report.id, `بلاغ: ${report.contentTitle}`)} 
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                                                        title="حذف البلاغ نهائياً"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail View Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={() => setSelectedReport(null)}>
                    <div className="bg-[#11131c] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950/40">
                            <div>
                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span>🔍 تفاصيل بلاغ العطل</span>
                                    {getStatusBadge(selectedReport.status)}
                                </h4>
                                <p className="text-gray-400 text-xs mt-0.5">معرّف البلاغ: <span className="font-mono text-gray-500">{selectedReport.id}</span></p>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            
                            {/* Content Info */}
                            <div className="space-y-3 bg-gray-950/40 p-4 rounded-xl border border-gray-800">
                                <h5 className="text-xs font-bold text-[#00A7F8] uppercase tracking-wider">محتوى العمل الأصلي</h5>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 text-sm">اسم العمل:</span>
                                        <span className="text-white font-bold text-sm">{selectedReport.contentTitle}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 text-sm">نوع العمل:</span>
                                        <span className="text-white text-sm bg-gray-900 px-2 py-0.5 rounded border border-gray-800">{selectedReport.contentType === 'series' ? 'مسلسل تلفزيوني' : 'فيلم سينمائي'}</span>
                                    </div>
                                    {selectedReport.episodeId && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 text-sm">رقم الحلقة المتضررة:</span>
                                            <span className="text-[#00A7F8] font-bold text-sm bg-[#00A7F8]/5 px-2 py-0.5 rounded border border-[#00A7F8]/15">{selectedReport.episodeId}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Report Details */}
                            <div className="space-y-3 bg-gray-950/40 p-4 rounded-xl border border-gray-800">
                                <h5 className="text-xs font-bold text-red-400 uppercase tracking-wider">تفاصيل المشكلة المبلغ عنها</h5>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 text-sm">نوع المشكلة:</span>
                                        <span className="text-red-400 font-bold text-sm">{selectedReport.reason}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-gray-400 text-sm block">الوصف الإضافي من المستخدم:</span>
                                        <div className="bg-gray-900 border border-gray-800/80 p-3 rounded-lg text-sm text-gray-200 leading-relaxed min-h-[60px] whitespace-pre-wrap">
                                            {selectedReport.description || 'لا يوجد وصف إضافي.'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reporter Info */}
                            <div className="space-y-3 bg-gray-950/40 p-4 rounded-xl border border-gray-800">
                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">معلومات المُبلِغ ووقت الإرسال</h5>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 text-sm">مُرسل البلاغ:</span>
                                        <span className="text-white text-sm font-bold">
                                            {selectedReport.userId ? `مستخدم مسجل` : 'زائر (غير مسجل)'}
                                        </span>
                                    </div>
                                    {selectedReport.userId && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 text-sm">معرف المستخدم (UID):</span>
                                            <span className="text-gray-400 font-mono text-xs">{selectedReport.userId}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 text-sm">البريد الإلكتروني:</span>
                                        <span className="text-gray-300 text-sm font-mono">{selectedReport.userEmail || 'لا يوجد'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 text-sm">تاريخ ووقت الإرسال:</span>
                                        <span className="text-gray-300 text-sm font-mono">
                                            {new Date(selectedReport.timestamp).toLocaleString('ar-EG')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Footer Action Buttons */}
                        <div className="p-6 border-t border-gray-800 bg-gray-950/40 flex flex-wrap gap-2 justify-between items-center">
                            
                            {/* Status controls */}
                            <div className="flex gap-2">
                                {selectedReport.status !== 'resolved' && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-4 rounded-xl border border-emerald-500/20 transition-all shadow-lg"
                                    >
                                        ✓ تم الإصلاح
                                    </button>
                                )}
                                {selectedReport.status !== 'ignored' && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedReport.id, 'ignored')}
                                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold py-2 px-4 rounded-xl border border-gray-700 transition-all"
                                    >
                                        🚫 تجاهل البلاغ
                                    </button>
                                )}
                                {selectedReport.status !== 'pending' && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedReport.id, 'pending')}
                                        className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2 px-4 rounded-xl border border-amber-500/20 transition-all"
                                    >
                                        🔄 إعادة فتح
                                    </button>
                                )}
                            </div>

                            {/* Navigation and delete */}
                            <div className="flex gap-2">
                                {allContent.some(c => c.id === selectedReport.contentId) && onEditContent && (
                                    <button
                                        onClick={() => {
                                            handleGoToContent(selectedReport.contentId);
                                            setSelectedReport(null);
                                        }}
                                        className="bg-[#00A7F8] hover:bg-[#008ac5] text-white text-xs font-bold py-2 px-4 rounded-xl shadow-lg transition-all"
                                    >
                                        🔗 انتقل للعمل
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        onRequestDelete(selectedReport.id, `بلاغ: ${selectedReport.contentTitle}`);
                                        setSelectedReport(null);
                                    }}
                                    className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-xs font-bold py-2 px-3 rounded-xl border border-red-500/20 transition-all"
                                >
                                    حذف البلاغ
                                </button>
                            </div>

                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default ReportsManagementTab;
