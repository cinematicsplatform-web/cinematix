import React, { useState, useEffect } from 'react';
import { db, getBroadcastHistory, deleteBroadcastNotification } from '../../firebase';
import type { Notification, BroadcastNotification } from '../../types';
import { getAccessToken, sendFCMv1Message } from './AdminHelpers';
import { PaperAirplaneIcon, PlayIcon, BellIcon, TrashIcon, ChevronRightIcon } from './AdminIcons';

const NotificationTab: React.FC<any> = ({ addToast, serviceAccountJson, allUsers, onRequestDelete }) => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [image, setImage] = useState('');
    const [url, setUrl] = useState('/');
    const [type, setType] = useState<'info' | 'play' | 'alert' | 'new_content'>('new_content');
    const [sending, setSending] = useState(false);
    const [history, setHistory] = useState<BroadcastNotification[]>([]);

    useEffect(() => { fetchHistory(); }, []);

    const fetchHistory = async () => {
        const data = await getBroadcastHistory();
        setHistory(data);
    };

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            const broadcastId = String(Date.now());
            
            if (serviceAccountJson) {
                const accessToken = await getAccessToken(serviceAccountJson);
                if (accessToken) {
                    const parsedServiceAccount = JSON.parse(serviceAccountJson);
                    const projectId = parsedServiceAccount.project_id;
                    const allTokens: string[] = [];
                    allUsers.forEach((u: any) => {
                        if (u.fcmTokens && Array.isArray(u.fcmTokens)) allTokens.push(...u.fcmTokens);
                    });
                    const uniqueTokens = Array.from(new Set(allTokens));
                    const notificationData = { title, body, image: image || '/icon-192.png', data: { url } };
                    await Promise.all(uniqueTokens.map(token => sendFCMv1Message(token, notificationData, accessToken, projectId)));
                }
            }

            const batch = db.batch();
            allUsers.forEach((user: any) => {
                const notifRef = db.collection('notifications').doc();
                const newNotif: Omit<Notification, 'id'> = {
                    userId: user.id,
                    title,
                    body,
                    type,
                    isRead: false,
                    createdAt: new Date().toISOString(),
                    targetUrl: url || undefined,
                    imageUrl: image || undefined,
                    broadcastId: broadcastId
                };
                batch.set(notifRef, newNotif);
            });

            const historyRef = db.collection('broadcast_history').doc(broadcastId);
            batch.set(historyRef, {
                title, body, type, imageUrl: image || null, targetUrl: url || null,
                createdAt: new Date().toISOString(),
                recipientCount: allUsers.length
            });

            await batch.commit();

            addToast(`تم إرسال الإشعار لـ ${allUsers.length} مستخدم بنجاح!`, 'success');
            setTitle(''); setBody(''); setImage(''); setUrl('/'); setType('new_content');
            fetchHistory();
        } catch (error: any) { 
            addToast('فشل إرسال الإشعارات: ' + error.message, 'error'); 
        } finally { 
            setSending(false); 
        }
    };

    const getIcon = (t: string) => {
        switch(t) {
            case 'new_content': return <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><PlayIcon className="w-5 h-5"/></div>;
            case 'alert': return <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">⚠️</div>;
            default: return <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">ℹ️</div>;
        }
    };

    const getAccentPreview = (t: string) => {
        switch(t) {
            case 'new_content': return 'bg-green-500/10 border-green-500/20';
            case 'alert': return 'bg-red-500/10 border-red-500/20';
            default: return 'bg-blue-500/10 border-blue-500/20';
        }
    };

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 bg-[#1f2937] p-8 rounded-3xl border border-gray-700/50 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2"><PaperAirplaneIcon /> إرسال إشعار جماعي</h3>
                        <button type="button" onClick={() => {setTitle(''); setBody(''); setImage(''); setUrl('/');}} className="text-xs text-gray-500 hover:text-white">مسح الحقول</button>
                    </div>
                    <form onSubmit={handleSendNotification} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2">عنوان الإشعار</label>
                                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#00A7F8] outline-none" required placeholder="مثال: تم إضافة فيلم أفاتار 2"/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2">نوع الإشعار</label>
                                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#00A7F8] outline-none">
                                    <option value="new_content">🟢 محتوى جديد</option>
                                    <option value="alert">🟡 تنبيه (System)</option>
                                    <option value="info">🔵 خبر (Info)</option>
                                </select>
                            </div>
                        </div>
                        <div><label className="block text-xs font-bold text-gray-400 mb-2">نص الرسالة</label><textarea value={body} onChange={e => setBody(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white h-24 outline-none focus:border-[#00A7F8]" required placeholder="التفاصيل..."/></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-xs font-bold text-gray-400 mb-2">رابط الصورة (بوستر)</label><input value={image} onChange={e => setImage(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white dir-ltr" placeholder="https://..."/></div>
                            <div><label className="block text-xs font-bold text-gray-400 mb-2">رابط التوجيه (URL)</label><input value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white dir-ltr" placeholder="/watch/movie/123"/></div>
                        </div>
                        <button type="submit" disabled={sending || !title} className="w-full bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-black py-4 rounded-2xl shadow-lg hover:shadow-[#00A7F8]/40 transition-all transform hover:scale-[1.01] disabled:opacity-50">
                            {sending ? 'جاري الإرسال...' : `🚀 إرسال إلى ${allUsers.length} مستخدم`}
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-5">
                    <div className="sticky top-28">
                        <label className="block text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest text-center">المعاينة الحية (Mobile Preview)</label>
                        <div className="relative mx-auto w-[280px] h-[580px] bg-[#000] border-[8px] border-[#1f2937] rounded-[3rem] shadow-2xl overflow-hidden">
                            <div className="absolute top-0 w-full h-6 bg-[#1f2937] flex justify-center items-end pb-1"><div className="w-16 h-3 bg-black rounded-full"></div></div>
                            <div className="p-4 pt-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-8 h-8 rounded-full bg-gray-800"></div>
                                    <div className="relative"><BellIcon className="w-6 h-6 text-gray-500"/><div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full flex items-center justify-center text-[8px] font-bold">1</div></div>
                                </div>
                                
                                <div className={`border rounded-[1.5rem] shadow-lg animate-fade-in-up overflow-hidden ${getAccentPreview(type)}`}>
                                    <div className="flex items-stretch">
                                        {image && (
                                            <div className="w-20 flex-shrink-0 self-stretch border-l border-white/10 bg-black">
                                                <img src={image} className="w-full h-full object-cover" />
                                            </div>
                                        )}

                                        <div className="flex-1 p-3 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">تحديث</span>
                                                <span className="text-[7px] text-gray-500 font-bold">الآن</span>
                                            </div>
                                            
                                            <div className="flex gap-2 items-start">
                                                 <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/5">
                                                    {getIcon(type)}
                                                 </div>
                                                 <div className="flex-1 min-w-0">
                                                     <h4 className="text-[10px] font-bold text-white truncate">{title || 'عنوان الإشعار يظهر هنا'}</h4>
                                                     <p className="text-[8px] text-gray-400 line-clamp-2 mt-0.5 leading-tight">{body || 'نص الرسالة التفصيلي سيظهر في هذا المكان...'}</p>
                                                     
                                                     {url !== '/' && (
                                                         <div className="mt-2 flex items-center gap-1 text-[#00A7F8] font-bold text-[7px]">
                                                             <span>اكتشف الآن</span>
                                                             <span className="scale-75 transform rotate-180">→</span>
                                                         </div>
                                                     )}
                                                 </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#1f2937] rounded-3xl border border-gray-700/50 shadow-xl overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-700/50 flex justify-between items-center bg-black/10">
                    <h3 className="font-bold text-xl text-white">آخر الإشعارات المرسلة</h3>
                    <span className="text-xs text-gray-500">تلقائياً يتم حذف السجلات القديمة</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-gray-300">
                        <thead className="bg-gray-800/50 text-xs font-bold text-gray-400 uppercase">
                            <tr><th className="px-8 py-4">النوع</th><th className="px-8 py-4">العنوان</th><th className="px-8 py-4">المستلمون</th><th className="px-8 py-4">التاريخ</th><th className="px-8 py-4">إجراء</th></tr>
                        </thead>
                        <tbody>
                            {history.map(item => (
                                <tr key={item.id} className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors group">
                                    <td className="px-8 py-4">{getIcon(item.type)}</td>
                                    <td className="px-8 py-4 font-bold text-white">{item.title}</td>
                                    <td className="px-8 py-4"><span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-xs">{item.recipientCount}</span></td>
                                    <td className="px-8 py-4 text-xs font-mono text-gray-500">{new Date(item.createdAt).toLocaleDateString('en-GB')}</td>
                                    <td className="px-8 py-4"><button onClick={() => onRequestDelete(item.id, item.title)} className="p-2 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><TrashIcon/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default NotificationTab;
