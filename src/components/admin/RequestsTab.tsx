import React, { useState, useEffect } from 'react';
import { getContentRequests, deleteContentRequest, getUserProfile, db, updateContentRequestStatus } from '../../firebase';
import type { ContentRequest } from '../../types';
import { InboxIcon, TrashIcon } from './AdminIcons';

const RequestsTab: React.FC<any> = ({ addToast, onRequestDelete }) => { 
    const [requests, setRequests] = useState<ContentRequest[]>([]); 
    const [loading, setLoading] = useState(true); 
    const [filterStatus, setFilterStatus] = useState<'pending' | 'completed' | 'rejected' | 'all'>('pending');
    
    useEffect(() => { 
        setLoading(true);
        // Real-time listener using onSnapshot for direct interface updates on new requests
        const unsubscribe = db.collection("requests").onSnapshot((snapshot) => {
            const data = snapshot.docs.map(doc => {
                const docData = doc.data();
                const rawTime = docData.createdAt || docData.timestamp;
                
                // Map the status gracefully to standardize with mobile apps
                let status = docData.status || 'pending';
                if (status === 'requested') status = 'pending';
                if (status === 'uploaded') status = 'completed';

                return {
                    id: doc.id,
                    title: docData.title || docData.movieName || 'طلب غير مسمى',
                    movieName: docData.movieName || docData.title || 'طلب غير مسمى',
                    year: docData.year || '',
                    type: docData.type || 'movie',
                    notes: docData.notes || (docData.year ? `سنة الإنتاج: ${docData.year}` : ''),
                    userId: docData.userId || null,
                    userName: docData.userName || null,
                    requestId: docData.requestId || doc.id,
                    status: status,
                    createdAt: rawTime ? (rawTime.toDate ? rawTime.toDate().toISOString() : (typeof rawTime === 'string' ? rawTime : new Date().toISOString())) : new Date().toISOString()
                } as any;
            });
            
            // Sort by createdAt descending
            const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setRequests(sorted);
            setLoading(false);
        }, (error) => {
            console.error("Firestore real-time requests listener error:", error);
            fetchRequests();
        });

        return () => unsubscribe();
    }, []); 
    
    const fetchRequests = async () => { 
        setLoading(true); 
        const data = await getContentRequests(); 
        setRequests(data); 
        setLoading(false); 
    }; 
    
    const handleUpdateStatus = async (req: ContentRequest, newStatus: 'completed' | 'rejected' | 'pending') => {
        try {
            let notificationSent = false;
            
            // If completed, optionally send notification to user
            if (newStatus === 'completed' && req.userId) {
                try {
                    const userProfile = await getUserProfile(req.userId);
                    const tokens = userProfile?.fcmTokens || [];
                    if (tokens.length > 0) {
                        const title = 'تم تلبية طلبك! 🎉';
                        const body = `تمت إضافة "${req.title}" إلى الموقع. مشاهدة ممتعة!`;
                        
                        // Send to each token
                        await Promise.all(tokens.map(async (token: string) => { 
                            await fetch('/api/send-notification', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    title,
                                    body,
                                    image: 'https://cinematix.watch/android-chrome-192x192.png',
                                    targetUrl: '/',
                                    type: 'new_content',
                                    targetToken: token
                                })
                            });
                        })); 
                        notificationSent = true;
                    }
                } catch (notifyErr) {
                    console.error("Failed to send notification:", notifyErr);
                }
            }

            await updateContentRequestStatus(req.id, newStatus);
            
            let toastMsg = "تم تحديث حالة الطلب بنجاح";
            if (newStatus === 'completed') {
                toastMsg = notificationSent ? 'تم تحديد الطلب كمكتمل وإرسال إشعار للمستخدم بنجاح.' : 'تم تحديد الطلب كمكتمل بنجاح.';
            } else if (newStatus === 'rejected') {
                toastMsg = 'تم رفض الطلب.';
            } else if (newStatus === 'pending') {
                toastMsg = 'تم إعادة فتح الطلب وقيد الانتظار.';
            }
            
            addToast(toastMsg, 'success');
        } catch (error) {
            console.error("Error updating request status:", error);
            addToast('حدث خطأ أثناء تحديث حالة الطلب.', 'error');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
            case 'uploaded':
                return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold">تم الرفع / مكتمل</span>;
            case 'rejected':
                return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-xs font-bold">مرفوض</span>;
            case 'pending':
            case 'requested':
            default:
                return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold animate-pulse">قيد الانتظار</span>;
        }
    };

    // Filter requests based on selected status tab
    const filteredRequests = requests.filter(r => {
        if (filterStatus === 'all') return true;
        return r.status === filterStatus;
    });
    
    return (
        <div className="space-y-6">
            {/* Header and Filter Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#11131c] p-6 rounded-2xl border border-gray-800/80">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#00A7F8]/10 text-[#00A7F8] rounded-xl border border-[#00A7F8]/20">
                        <InboxIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-white">📥 نظام طلبات المحتوى المشترك</h3>
                        <p className="text-gray-400 text-xs mt-1">تلقّي طلبات الأفلام والمسلسلات من مستخدمي الويب وتطبيق الأندرويد وإدارتها.</p>
                    </div>
                </div>
                
                {/* Tabs */}
                <div className="flex bg-gray-950/60 p-1.5 rounded-xl border border-gray-800/60 self-start md:self-auto">
                    {[
                        { id: 'pending', label: 'قيد الانتظار' },
                        { id: 'completed', label: 'تمت الإضافة' },
                        { id: 'rejected', label: 'مرفوضة' },
                        { id: 'all', label: 'الكل' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterStatus(tab.id as any)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterStatus === tab.id ? 'bg-[#00A7F8] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            {tab.label}
                            {requests.filter(r => tab.id === 'all' ? true : r.status === tab.id).length > 0 && (
                                <span className={`mr-1.5 px-1.5 py-0.5 text-[9px] rounded-full font-bold ${filterStatus === tab.id ? 'bg-white text-black' : 'bg-gray-800 text-gray-300'}`}>
                                    {requests.filter(r => tab.id === 'all' ? true : r.status === tab.id).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Requests Table Wrapper */}
            <div className="bg-[#11131c] rounded-2xl border border-gray-800/80 overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="text-center py-20 text-gray-500">
                        <div className="w-10 h-10 border-4 border-[#00A7F8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        جاري تحميل طلبات الأعضاء في الوقت الفعلي...
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-24 text-gray-500 flex flex-col items-center gap-4">
                        <span className="text-5xl opacity-40">📭</span>
                        <div className="text-lg font-bold text-white">لا توجد طلبات في هذا القسم</div>
                        <p className="text-gray-400 text-xs">تظهر الطلبات الجديدة هنا فور إرسالها.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right text-gray-300 whitespace-nowrap">
                            <thead className="bg-gray-950/60 text-xs font-bold text-gray-400 border-b border-gray-800">
                                <tr>
                                    <th className="px-8 py-4">العنوان المطلوب</th>
                                    <th className="px-8 py-4">المستخدم الطالب</th>
                                    <th className="px-8 py-4">نوع المحتوى</th>
                                    <th className="px-8 py-4">الملاحظات / التفاصيل</th>
                                    <th className="px-8 py-4">التاريخ والوقت</th>
                                    <th className="px-8 py-4">الحالة الحالية</th>
                                    <th className="px-8 py-4 text-left pl-8">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/40">
                                {filteredRequests.map(req => (
                                    <tr key={req.id} className="hover:bg-gray-800/10 transition-colors">
                                        <td className="px-8 py-4 font-bold text-white">
                                            <div className="flex flex-col">
                                                <span>{req.title}</span>
                                                {req.year && (
                                                    <span className="text-[10px] text-gray-500 font-mono mt-0.5">
                                                        سنة الإنتاج: {req.year}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-gray-300">
                                            {req.userName ? (
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white">{req.userName}</span>
                                                    {req.userId && <span className="text-[10px] text-gray-500 font-mono">{req.userId}</span>}
                                                </div>
                                            ) : req.userId ? (
                                                <span className="font-mono text-xs text-gray-400">{req.userId}</span>
                                            ) : (
                                                <span className="text-gray-500 text-xs">زائر (غير مسجل)</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${req.type === 'movie' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                                {req.type === 'movie' ? '🎬 فيلم' : '📺 مسلسل'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 max-w-xs truncate text-gray-400" title={req.notes}>
                                            {req.notes || '-'}
                                        </td>
                                        <td className="px-8 py-4 text-xs font-mono text-gray-400">
                                            {new Date(req.createdAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td className="px-8 py-4">
                                            {getStatusBadge(req.status)}
                                        </td>
                                        <td className="px-8 py-4 text-left pl-8">
                                            <div className="flex items-center justify-end gap-2">
                                                
                                                {req.status !== 'completed' && (
                                                    <button 
                                                        onClick={() => handleUpdateStatus(req, 'completed')} 
                                                        className="text-xs bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white font-bold py-1.5 px-3 rounded-lg border border-emerald-500/20 transition-all shadow-sm"
                                                    >
                                                        ✓ تم التوفير
                                                    </button>
                                                )}
                                                
                                                {req.status !== 'rejected' && (
                                                    <button 
                                                        onClick={() => handleUpdateStatus(req, 'rejected')} 
                                                        className="text-xs bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white font-bold py-1.5 px-3 rounded-lg border border-red-500/20 transition-all shadow-sm"
                                                    >
                                                        🚫 رفض
                                                    </button>
                                                )}

                                                {req.status !== 'pending' && (
                                                    <button 
                                                        onClick={() => handleUpdateStatus(req, 'pending')} 
                                                        className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-1.5 px-3 rounded-lg border border-gray-700 transition-all shadow-sm"
                                                    >
                                                        🔄 إعادة فتح
                                                    </button>
                                                )}

                                                <button 
                                                    onClick={() => onRequestDelete(req.id, req.title)} 
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-colors border border-transparent hover:border-red-500/15" 
                                                    title="حذف الطلب نهائياً"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    ); 
};

export default RequestsTab;
