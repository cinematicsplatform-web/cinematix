
import React, { useState, useMemo, useEffect } from 'react';
import { db, generateSlug, getContentRequests, deleteContentRequest, getUserProfile } from '../firebase';
import type { Content, User, Ad, PinnedItem, SiteSettings, View, PinnedContentState, PageKey, ThemeType, Category, Genre, Season, Episode, Server, ContentRequest } from '../types';
import { ContentType, UserRole, adPlacementLabels } from '../types';
import ContentEditModal from './ContentEditModal';
import AdEditModal from './AdEditModal';
import ToggleSwitch from './ToggleSwitch';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { CloseIcon } from './icons/CloseIcon';
import * as XLSX from 'xlsx'; 
import * as jsrsasign from 'jsrsasign'; 

// Icons
const ArrowUpTrayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
);
const DocumentArrowDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
);
const TableCellsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25v1.5c0 .621.504 1.125 1.125 1.125m17.25-2.625h-7.5c-.621 0-1.125.504-1.125 1.125" /></svg>
);
const PaperAirplaneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
);
const InboxIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" /></svg>
);

type AdminTab = 'dashboard' | 'content' | 'pinned' | 'users' | 'requests' | 'ads' | 'themes' | 'settings' | 'analytics' | 'notifications';

const getAccessToken = async (serviceAccountJson: string): Promise<string | null> => {
    try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        const { private_key, client_email } = serviceAccount;
        if (!private_key || !client_email) throw new Error("Invalid Service Account JSON");
        const now = Math.floor(Date.now() / 1000);
        const header = { alg: 'RS256', typ: 'JWT' };
        const claim = { iss: client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now };
        const sJWS = jsrsasign.KJUR.jws.JWS.sign(null, header, claim, private_key);
        const body = new URLSearchParams();
        body.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
        body.append('assertion', sJWS);
        const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body });
        const data = await response.json();
        return data.access_token;
    } catch (e) { console.error("Failed to generate Access Token:", e); return null; }
};

const sendFCMv1Message = async (token: string, notification: any, accessToken: string, projectId: string) => {
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    const message = { message: { token: token, notification: { title: notification.title, body: notification.body, image: notification.image }, data: notification.data || {} } };
    const response = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(message) });
    if (!response.ok) { const err = await response.json(); throw new Error(JSON.stringify(err)); }
    return response.json();
};

interface AdminPanelProps {
  allUsers: User[];
  allAds: Ad[];
  pinnedItems: PinnedContentState;
  siteSettings: SiteSettings;
  onSetSiteSettings: (settings: SiteSettings) => void;
  onSetPinnedItems: (pageKey: PageKey, items: PinnedItem[]) => void;
  onSetView: (view: View) => void;
  onUpdateAd: (ad: Ad) => void;
  onDeleteAd: (adId: string) => void;
  onAddAd: (ad: Omit<Ad, 'id' | 'updatedAt'>) => void;
  onAddAdmin: (admin: Omit<User, 'id' | 'role' | 'profiles'>) => Promise<void>;
  onDeleteUser: (userId: string) => void;
  onContentChanged: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [isContentModalOpen, setIsContentModalOpen] = useState(false);
    const [editingContent, setEditingContent] = useState<Content | null>(null);
    const [isAdModalOpen, setIsAdModalOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<Ad | null>(null);
    const [allContent, setAllContent] = useState<Content[]>([]);
    const [isLoadingContent, setIsLoadingContent] = useState(true);
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; type: 'content' | 'user' | 'ad' | 'pinned'; id: string; title?: string; meta?: any; }>({ isOpen: false, type: 'content', id: '' });

    useEffect(() => {
        const getContent = async () => {
            setIsLoadingContent(true);
            try {
                const data = await db.collection("content").orderBy("updatedAt", "desc").get();
                const contentData = data.docs.map(d => ({ ...d.data(), id: d.id })) as Content[];
                setAllContent(contentData);
            } catch (err) {
                console.error("Error fetching content:", err);
                props.addToast("حدث خطأ أثناء جلب المحتوى من قاعدة البيانات.", "error");
            }
            setIsLoadingContent(false);
        };
        getContent();
    }, []); 

    const totalMovies = allContent.filter(c => c.type === ContentType.Movie).length;
    const totalSeries = allContent.filter(c => c.type === ContentType.Series).length;
    const totalUsers = props.allUsers.length;
    const openContentModalForEdit = (c: Content) => { setEditingContent(c); setIsContentModalOpen(true); };
    const openContentModalForNew = () => { setEditingContent(null); setIsContentModalOpen(true); };
    const handleSaveContent = async (c: Content) => { try { const contentWithDate = { ...c, updatedAt: new Date().toISOString() }; if(editingContent) { const { id, ...contentData } = contentWithDate; await db.collection("content").doc(c.id).update(contentData); setAllContent(prev => { const filtered = prev.filter(item => item.id !== c.id); return [contentWithDate, ...filtered]; }); props.addToast("تم تعديل المحتوى وتصدر القائمة!", "success"); } else { const { id, ...contentData } = contentWithDate; const docRef = await db.collection("content").add(contentData); setAllContent(prev => [{...contentWithDate, id: docRef.id}, ...prev]); props.addToast("تم إضافة المحتوى وتصدر القائمة!", "success"); } props.onContentChanged(); setIsContentModalOpen(false); setEditingContent(null); } catch (err) { console.error("Error saving content:", err); props.addToast("حدث خطأ أثناء حفظ المحتوى.", "error"); } };
    const confirmDeleteContent = (contentId: string, contentTitle: string) => { setDeleteModalState({ isOpen: true, type: 'content', id: contentId, title: contentTitle }); };
    const confirmDeleteUser = (userId: string, userName: string) => { setDeleteModalState({ isOpen: true, type: 'user', id: userId, title: userName }); };
    const confirmDeleteAd = (adId: string, adTitle: string) => { setDeleteModalState({ isOpen: true, type: 'ad', id: adId, title: adTitle }); };
    const executeDelete = async () => { const { type, id } = deleteModalState; if (type === 'content') { try { await db.collection("content").doc(id).delete(); setAllContent(prev => prev.filter(item => item.id !== id)); props.onContentChanged(); props.addToast('تم حذف المحتوى بنجاح.', 'success'); } catch (err) { console.error("Error deleting content:", err); props.addToast("حدث خطأ أثناء الحذف.", "error"); } } else if (type === 'user') { props.onDeleteUser(id); } else if (type === 'ad') { props.onDeleteAd(id); } setDeleteModalState(prev => ({ ...prev, isOpen: false })); };
    const openAdModalForEdit = (ad: Ad) => { setEditingAd(ad); setIsAdModalOpen(true); };
    const openAdModalForNew = () => { setEditingAd(null); setIsAdModalOpen(true); };
    const handleSaveAd = (ad: Ad) => { if(editingAd) { props.onUpdateAd(ad); } else { const { id, updatedAt, ...newAdData } = ad; props.onAddAd(newAdData); } setIsAdModalOpen(false); };

    const renderTabContent = () => {
        switch(activeTab) {
            case 'content': return <ContentManagementTab content={allContent} onEdit={openContentModalForEdit} onNew={openContentModalForNew} onRequestDelete={confirmDeleteContent} isLoading={isLoadingContent} addToast={props.addToast} onBulkSuccess={props.onContentChanged} />;
            case 'users': return <UserManagementTab users={props.allUsers} onAddAdmin={props.onAddAdmin} onRequestDelete={confirmDeleteUser} addToast={props.addToast} />;
            case 'requests': return <RequestsTab addToast={props.addToast} serviceAccountJson={props.siteSettings.serviceAccountJson} />;
            case 'ads': return <AdsManagementTab ads={props.allAds} onNew={openAdModalForNew} onEdit={openAdModalForEdit} onRequestDelete={confirmDeleteAd} onUpdateAd={props.onUpdateAd} />;
            case 'pinned': return <PinnedContentManagementTab allContent={allContent} pinnedState={props.pinnedItems} setPinnedItems={props.onSetPinnedItems} />;
            case 'themes': return <ThemesTab siteSettings={props.siteSettings} onSetSiteSettings={props.onSetSiteSettings} />;
            case 'settings': return <SiteSettingsTab siteSettings={props.siteSettings} onSetSiteSettings={props.onSetSiteSettings} allContent={allContent} />;
            case 'notifications': return <NotificationTab addToast={props.addToast} serviceAccountJson={props.siteSettings.serviceAccountJson} />;
            case 'analytics': return <AnalyticsTab allContent={allContent} allUsers={props.allUsers}/>;
            case 'dashboard': default: return <DashboardTab stats={{totalMovies, totalSeries, totalUsers}} allContent={allContent} />;
        }
    };

    return (
        <div className="bg-[#0f1014] min-h-screen text-white relative">
            {/* Sticky Header with Backdrop Blur */}
            <div className="sticky top-0 z-50 bg-[#0f1014]/95 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 lg:px-8 py-4 mb-6 flex flex-row justify-between items-center gap-4 shadow-sm">
                <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">لوحة التحكم</h1>
                <button onClick={() => props.onSetView('home')} className="bg-[#1f2937] hover:bg-[#374151] border border-gray-700 font-bold py-2 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl text-sm md:text-base">العودة للموقع</button>
            </div>

            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
                {/* Navigation Pills */}
                <div className="mb-8 overflow-x-auto py-2 rtl-scroll">
                    <div className="flex gap-2">
                        {(['dashboard', 'content', 'pinned', 'users', 'requests', 'ads', 'themes', 'settings', 'analytics', 'notifications'] as AdminTab[]).map(tab => (
                            <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab)} 
                                className={`flex-shrink-0 px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                                    activeTab === tab 
                                    ? 'bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black' 
                                    : 'bg-[#1f2937] text-gray-400 hover:text-white hover:bg-[#374151]'
                                }`}
                            >
                                { {dashboard: 'نظرة عامة', content: 'المحتوى', pinned: 'المحتوى المثبت', users: 'المستخدمون', requests: 'الطلبات', ads: 'إدارة الإعلانات', themes: 'المظهر', settings: 'إعدادات الموقع', analytics: 'الإحصائيات', notifications: 'إرسال إشعار'}[tab] }
                            </button>
                        ))}
                    </div>
                </div>
                
                {renderTabContent()}
            </div>
             {isContentModalOpen && <ContentEditModal content={editingContent} onClose={() => setIsContentModalOpen(false)} onSave={handleSaveContent} />}
             {isAdModalOpen && <AdEditModal ad={editingAd} onClose={() => setIsAdModalOpen(false)} onSave={handleSaveAd} />}
             <DeleteConfirmationModal isOpen={deleteModalState.isOpen} onClose={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))} onConfirm={executeDelete} title={deleteModalState.type === 'content' ? 'حذف المحتوى' : deleteModalState.type === 'user' ? 'حذف المستخدم' : deleteModalState.type === 'ad' ? 'حذف الإعلان' : 'حذف'} message={`هل أنت متأكد من حذف "${deleteModalState.title}"؟ لا يمكن التراجع عن هذا الإجراء.`} />
        </div>
    );
};

const DashboardTab: React.FC<{stats: {totalMovies: number, totalSeries: number, totalUsers: number}, allContent: Content[]}> = ({stats, allContent}) => {
    const recentlyAdded = [...allContent].sort((a, b) => { const dateA = new Date(a.updatedAt || a.createdAt).getTime(); const dateB = new Date(b.updatedAt || b.createdAt).getTime(); return dateB - dateA; }).slice(0, 5);
    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center justify-between relative z-10"><h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">إجمالي الأفلام</h3><span className="text-2xl bg-blue-500/20 p-2 rounded-lg">🎬</span></div>
                    <p className="text-5xl font-black mt-4 text-white relative z-10">{stats.totalMovies}</p>
                    <p className="text-xs text-blue-400 mt-2 font-bold relative z-10">فيلم متاح</p>
                </div>
                <div className="bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center justify-between relative z-10"><h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">إجمالي المسلسلات</h3><span className="text-2xl bg-purple-500/20 p-2 rounded-lg">📺</span></div>
                    <p className="text-5xl font-black mt-4 text-white relative z-10">{stats.totalSeries}</p>
                    <p className="text-xs text-purple-400 mt-2 font-bold relative z-10">مسلسل متاح</p>
                </div>
                <div className="bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center justify-between relative z-10"><h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">المستخدمين</h3><span className="text-2xl bg-green-500/20 p-2 rounded-lg">👥</span></div>
                    <p className="text-5xl font-black mt-4 text-white relative z-10">{stats.totalUsers}</p>
                    <p className="text-xs text-green-400 mt-2 font-bold relative z-10">حساب نشط</p>
                </div>
            </div>
            
            <div className="bg-[#1f2937] rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl">
                <div className="px-8 py-6 border-b border-gray-700/50 flex justify-between items-center">
                    <h3 className="font-bold text-xl text-white">أحدث الأنشطة</h3>
                    <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">آخر 5 إضافات</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-gray-300 whitespace-nowrap">
                        <thead className="bg-gray-800/50 text-xs uppercase font-bold text-gray-400">
                            <tr><th className="px-8 py-4">العنوان</th><th className="px-8 py-4">النوع</th><th className="px-8 py-4">تاريخ التعديل</th><th className="px-8 py-4">الحالة</th></tr>
                        </thead>
                        <tbody>
                            {recentlyAdded.length > 0 ? recentlyAdded.map(item => (
                                <tr key={item.id} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors">
                                    <td className="px-8 py-4 font-bold text-white flex items-center gap-4">
                                        <div className="w-10 h-14 rounded-md overflow-hidden shadow-md">
                                            <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        {item.title}
                                    </td>
                                    <td className="px-8 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${item.type === 'movie' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>{item.type === 'movie' ? 'فيلم' : 'مسلسل'}</span></td>
                                    <td className="px-8 py-4 dir-ltr text-right font-mono text-xs text-gray-400">{new Date(item.updatedAt || item.createdAt).toLocaleDateString('en-GB')}</td>
                                    <td className="px-8 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${item.visibility === 'general' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{item.visibility === 'general' ? 'عام' : 'مقيد'}</span></td>
                                </tr>
                            )) : (<tr><td colSpan={4} className="text-center py-12 text-gray-500">لا يوجد محتوى حديث</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const ContentManagementTab: React.FC<any> = ({content, onNew, onEdit, onRequestDelete, isLoading, addToast, onBulkSuccess}) => { 
    const [searchTerm, setSearchTerm] = useState(''); 
    const filteredContent = content.filter((c:any) => (c.title || '').toLowerCase().includes(searchTerm.toLowerCase())); 
    const excelInputRef = React.useRef<HTMLInputElement>(null); 
    const [processingExcel, setProcessingExcel] = useState(false); 
    const [progress, setProgress] = useState(''); 
    const API_KEY = 'b8d66e320b334f4d56728d98a7e39697'; 
    const LANG = 'ar-SA'; 
    const generateExcelTemplate = () => { const moviesHeader = ["TMDB_ID", "Title", "Description", "Year", "Rating", "Genres", "Poster_URL", "Backdrop_URL", "Logo_URL", "Watch_Server_1", "Watch_Server_2", "Watch_Server_3", "Watch_Server_4", "Download_Link"]; const episodesHeader = ["Series_TMDB_ID", "Series_Name", "Season_Number", "Episode_Number", "Episode_Title", "Watch_Server_1", "Watch_Server_2", "Download_Link"]; const wb = XLSX.utils.book_new(); const wsMovies = XLSX.utils.aoa_to_sheet([moviesHeader]); const wsEpisodes = XLSX.utils.aoa_to_sheet([episodesHeader]); XLSX.utils.book_append_sheet(wb, wsMovies, "Movies"); XLSX.utils.book_append_sheet(wb, wsEpisodes, "Episodes"); XLSX.writeFile(wb, "cinematix_import_template.xlsx"); }; 
    const fetchTMDBData = async (id: string, type: 'movie' | 'tv') => { if (!id) return null; try { const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=${LANG}&append_to_response=images,credits`); if (!res.ok) return null; return await res.json(); } catch (e) { console.error("TMDB Fetch Error:", e); return null; } }; 
    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { 
        const file = e.target.files?.[0]; 
        if (!file) return; 
        setProcessingExcel(true); 
        setProgress('جاري قراءة الملف...'); 
        const reader = new FileReader(); 
        reader.onload = async (evt) => { 
            try { 
                const data = new Uint8Array(evt.target?.result as ArrayBuffer); 
                const workbook = XLSX.read(data, { type: 'array' }); 
                if (workbook.Sheets['Movies']) { 
                    const movies = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Movies']); 
                    let count = 0; 
                    const batch = db.batch(); 
                    let batchCount = 0; 
                    for (const row of movies) { 
                        count++; 
                        setProgress(`معالجة الفيلم ${count} من ${movies.length}...`); 
                        let movieData: any = {}; 
                        if (row.TMDB_ID) { 
                            const tmdb = await fetchTMDBData(String(row.TMDB_ID), 'movie'); 
                            if (tmdb) { 
                                movieData = { 
                                    title: tmdb.title, 
                                    description: tmdb.overview, 
                                    poster: tmdb.poster_path ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}` : '', 
                                    backdrop: tmdb.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdb.backdrop_path}` : '', 
                                    rating: tmdb.vote_average ? Number((tmdb.vote_average / 2).toFixed(1)) : 0, 
                                    releaseYear: tmdb.release_date ? new Date(tmdb.release_date).getFullYear() : new Date().getFullYear(), 
                                    genres: tmdb.genres?.map((g: any) => g.name) || [], 
                                    cast: tmdb.credits?.cast?.slice(0, 5).map((c: any) => c.name) || [] 
                                }; 
                            } 
                        } 
                        if (row.Title) movieData.title = row.Title; 
                        if (row.Description) movieData.description = row.Description; 
                        if (row.Year) movieData.releaseYear = parseInt(String(row.Year)); 
                        if (row.Rating) movieData.rating = parseFloat(String(row.Rating)); 
                        if (row.Poster_URL) movieData.poster = row.Poster_URL; 
                        if (row.Backdrop_URL) movieData.backdrop = row.Backdrop_URL; 
                        if (row.Logo_URL) { movieData.logoUrl = row.Logo_URL; movieData.isLogoEnabled = true; } 
                        if (row.Genres) movieData.genres = row.Genres.split(',').map((g: string) => g.trim()); 
                        const servers: Server[] = []; 
                        if (row.Watch_Server_1) servers.push({ id: 1, name: "سيرفر 1", url: row.Watch_Server_1, downloadUrl: "", isActive: true }); 
                        if (row.Watch_Server_2) servers.push({ id: 2, name: "سيرفر 2", url: row.Watch_Server_2, downloadUrl: "", isActive: true }); 
                        if (row.Watch_Server_3) servers.push({ id: 3, name: "سيرفر 3", url: row.Watch_Server_3, downloadUrl: "", isActive: true }); 
                        if (row.Watch_Server_4) servers.push({ id: 4, name: "سيرفر 4", url: row.Watch_Server_4, downloadUrl: "", isActive: true }); 
                        if (row.Download_Link) servers.forEach(s => s.downloadUrl = row.Download_Link); 
                        const finalMovie: Content = { 
                            id: row.TMDB_ID ? String(row.TMDB_ID) : String(Date.now() + Math.random()), 
                            type: ContentType.Movie, 
                            title: movieData.title || 'New Movie', 
                            description: movieData.description || '', 
                            poster: movieData.poster || '', 
                            backdrop: movieData.backdrop || '', 
                            rating: movieData.rating || 0, 
                            releaseYear: movieData.releaseYear || new Date().getFullYear(), 
                            genres: movieData.genres || [], 
                            categories: ['افلام اجنبية'], 
                            cast: movieData.cast || [], 
                            visibility: 'general', 
                            ageRating: '', 
                            servers: servers, 
                            seasons: [], 
                            createdAt: new Date().toISOString(), 
                            updatedAt: new Date().toISOString(), 
                            slug: generateSlug(movieData.title || ''), 
                            logoUrl: movieData.logoUrl, 
                            isLogoEnabled: movieData.isLogoEnabled 
                        }; 
                        const ref = db.collection("content").doc(finalMovie.id); 
                        batch.set(ref, finalMovie, { merge: true }); 
                        batchCount++; 
                        if (batchCount >= 400) { await batch.commit(); batchCount = 0; } 
                    } 
                    if (batchCount > 0) await batch.commit(); 
                } 
                if (workbook.Sheets['Episodes']) { 
                    const episodes = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Episodes']); 
                    const seriesGroups: Record<string, any[]> = {}; 
                    episodes.forEach(ep => { 
                        const key = ep.Series_TMDB_ID || ep.Series_Name || 'Unknown'; 
                        if (!seriesGroups[key]) seriesGroups[key] = []; 
                        seriesGroups[key].push(ep); 
                    }); 
                    const epBatch = db.batch(); 
                    let epBatchCount = 0; 
                    let seriesCount = 0; 
                    for (const [seriesKey, epRows] of Object.entries(seriesGroups)) { 
                        seriesCount++; 
                        setProgress(`معالجة المسلسل ${seriesCount} من ${Object.keys(seriesGroups).length}...`); 
                        let seriesDoc: any = null; 
                        let seriesId = String(seriesKey); 
                        const existingSeries = content.find((c:any) => c.id === seriesId || c.title === seriesKey); 
                        if (existingSeries) { 
                            seriesDoc = { ...existingSeries }; 
                            seriesId = existingSeries.id; 
                        } else { 
                            let tmdbSeries: any = null; 
                            if (!isNaN(Number(seriesKey))) { 
                                tmdbSeries = await fetchTMDBData(String(seriesKey), 'tv'); 
                            } 
                            seriesDoc = { 
                                id: seriesId, 
                                type: ContentType.Series, 
                                title: tmdbSeries?.name || epRows[0].Series_Name || 'New Series', 
                                description: tmdbSeries?.overview || '', 
                                poster: tmdbSeries?.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbSeries.poster_path}` : '', 
                                backdrop: tmdbSeries?.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbSeries.backdrop_path}` : '', 
                                rating: tmdbSeries?.vote_average ? Number((tmdbSeries.vote_average / 2).toFixed(1)) : 0, 
                                releaseYear: tmdbSeries?.first_air_date ? new Date(tmdbSeries.first_air_date).getFullYear() : new Date().getFullYear(), 
                                genres: tmdbSeries?.genres?.map((g: any) => g.name) || [], 
                                categories: ['مسلسلات اجنبية'], 
                                seasons: [], 
                                visibility: 'general', 
                                createdAt: new Date().toISOString(), 
                                updatedAt: new Date().toISOString(), 
                                slug: generateSlug(tmdbSeries?.name || epRows[0].Series_Name || '') 
                            }; 
                        } 
                        if (!seriesDoc.seasons) seriesDoc.seasons = []; 
                        for (const ep of epRows) { 
                            const sNum = parseInt(String(ep.Season_Number)) || 1; 
                            const eNum = parseInt(String(ep.Episode_Number)) || 1; 
                            let season = seriesDoc.seasons.find((s: Season) => s.seasonNumber === sNum); 
                            if (!season) { 
                                season = { id: Date.now() + Math.random(), seasonNumber: sNum, title: `الموسم ${sNum}`, episodes: [] }; 
                                seriesDoc.seasons.push(season); 
                            } 
                            const episodeObj: Episode = { 
                                id: Date.now() + Math.random(), 
                                title: ep.Episode_Title || `الحلقة ${eNum}`, 
                                thumbnail: seriesDoc.backdrop || '', 
                                duration: "45:00", 
                                progress: 0, 
                                servers: [] 
                            }; 
                            if (ep.Watch_Server_1) episodeObj.servers.push({ id: 1, name: "سيرفر 1", url: ep.Watch_Server_1, downloadUrl: ep.Download_Link || "", isActive: true }); 
                            if (ep.Watch_Server_2) episodeObj.servers.push({ id: 2, name: "سيرفر 2", url: ep.Watch_Server_2, downloadUrl: "", isActive: true }); 
                            const existingEpIndex = season.episodes.findIndex((e: Episode) => e.title?.includes(`${eNum}`) || e.title === ep.Episode_Title); 
                            if (existingEpIndex > -1) { 
                                season.episodes[existingEpIndex] = { ...season.episodes[existingEpIndex], ...episodeObj, servers: [...season.episodes[existingEpIndex].servers, ...episodeObj.servers] }; 
                            } else { 
                                season.episodes.push(episodeObj); 
                            } 
                        } 
                        seriesDoc.seasons.sort((a: Season, b: Season) => a.seasonNumber - b.seasonNumber); 
                        seriesDoc.seasons.forEach((s: Season) => { 
                            s.episodes.sort((a: Episode, b: Episode) => { 
                                const numA = parseInt(a.title?.replace(/\D/g, '') || '0'); 
                                const numB = parseInt(b.title?.replace(/\D/g, '') || '0'); 
                                return numA - numB; 
                            }); 
                        }); 
                        const ref = db.collection("content").doc(seriesDoc.id); 
                        epBatch.set(ref, seriesDoc, { merge: true }); 
                        epBatchCount++; 
                        if (epBatchCount >= 300) { await epBatch.commit(); epBatchCount = 0; } 
                    } 
                    if (epBatchCount > 0) await epBatch.commit(); 
                } 
                addToast('تم استيراد البيانات من Excel بنجاح!', 'success'); 
                onBulkSuccess(); 
            } catch (err) { 
                console.error("Excel Import Error:", err); 
                addToast('حدث خطأ أثناء معالجة ملف Excel.', 'error'); 
            } finally { 
                setProcessingExcel(false); 
                setProgress(''); 
                if (excelInputRef.current) excelInputRef.current.value = ''; 
            } 
        }; 
        reader.readAsArrayBuffer(file); 
    }; 
    
    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1f2937] p-6 rounded-2xl mb-8 border border-gray-700/50 shadow-lg">
                <input type="text" placeholder="ابحث عن فيلم أو مسلسل..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-auto md:min-w-[350px] bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#00A7F8] text-white placeholder-gray-500 shadow-inner"/>
                <div className="flex gap-3 w-full md:w-auto flex-wrap">
                    <button onClick={generateExcelTemplate} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-5 rounded-xl transition-colors text-sm border border-gray-600" title="تحميل نموذج Excel"><TableCellsIcon /><span className="hidden sm:inline">تحميل نموذج Excel</span></button>
                    <input type="file" accept=".xlsx, .xls" ref={excelInputRef} onChange={handleExcelUpload} className="hidden" />
                    <button onClick={() => excelInputRef.current?.click()} disabled={processingExcel} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-5 rounded-xl transition-colors text-sm disabled:opacity-50 border border-gray-600" title="استيراد من Excel"><ArrowUpTrayIcon /><span className="hidden sm:inline">{processingExcel ? 'جاري المعالجة...' : 'استيراد من Excel'}</span></button>
                    <button onClick={onNew} className="flex-1 md:flex-none bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-extrabold py-3 px-8 rounded-xl hover:shadow-[0_0_20px_rgba(0,167,248,0.4)] transition-all transform hover:scale-105 whitespace-nowrap">+ إضافة محتوى</button>
                </div>
            </div>
            {processingExcel && (<div className="mb-6 bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 animate-pulse shadow-lg"><div className="flex justify-between mb-3 text-sm text-[#00A7F8] font-bold"><span>جاري الاستيراد...</span><span>{progress}</span></div><div className="w-full bg-gray-800 rounded-full h-3"><div className="bg-[#00A7F8] h-3 rounded-full w-2/3 transition-all duration-500 shadow-[0_0_10px_#00A7F8]"></div></div><p className="text-xs text-gray-500 mt-3 text-center">الرجاء عدم إغلاق الصفحة حتى تكتمل العملية.</p></div>)}
            
            {/* CONTENT DISPLAY AREA - GRID SYSTEM */}
            {isLoading ? (
                <div className="text-center py-32 text-gray-500">جاري تحميل المحتوى من قاعدة البيانات...</div> 
            ) : (
                <>
                    {filteredContent.length === 0 && (
                        <div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-800 rounded-3xl mb-8 flex flex-col items-center justify-center">
                            <span className="text-4xl mb-4 opacity-50">📂</span>
                            لا يوجد محتوى مطابق للبحث.
                        </div>
                    )}

                    {/* Poster Grid Layout */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {filteredContent.map((c:any) => (
                            <div key={c.id} className="group relative aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer bg-gray-800 border border-gray-700/50 shadow-lg hover:shadow-[0_0_25px_rgba(0,167,248,0.2)] transition-all duration-300 hover:scale-[1.02]">
                                {/* Poster Image */}
                                <img src={c.poster} alt={c.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                
                                {/* Top Badge */}
                                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold backdrop-blur-md border ${c.type === 'movie' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'}`}>
                                        {c.type === 'movie' ? 'فيلم' : 'مسلسل'}
                                    </span>
                                </div>

                                {/* Dark Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>

                                {/* Content Info */}
                                <div className="absolute bottom-0 left-0 w-full p-4 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                    <h3 className="text-white font-bold text-lg leading-tight line-clamp-1 mb-1 drop-shadow-md">{c.title}</h3>
                                    <div className="flex items-center justify-between text-xs text-gray-300 mb-3">
                                        <span className="font-mono">{c.releaseYear}</span>
                                        <span className={`font-bold ${c.visibility === 'general' ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {c.visibility === 'general' ? 'عام' : 'مقيد'}
                                        </span>
                                    </div>

                                    {/* Action Buttons (Slide Up on Hover) */}
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onEdit(c); }} 
                                            className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white py-2 rounded-lg text-xs font-bold border border-white/10 transition-colors"
                                        >
                                            تعديل
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onRequestDelete(c.id, c.title); }} 
                                            className="flex-1 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md text-red-300 py-2 rounded-lg text-xs font-bold border border-red-500/20 transition-colors"
                                        >
                                            حذف
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    ); 
};
const RequestsTab: React.FC<any> = ({ addToast, serviceAccountJson }) => { const [requests, setRequests] = useState<ContentRequest[]>([]); const [loading, setLoading] = useState(true); useEffect(() => { fetchRequests(); }, []); const fetchRequests = async () => { setLoading(true); const data = await getContentRequests(); setRequests(data); setLoading(false); }; const handleFulfillRequest = async (req: ContentRequest) => { if (confirm(`هل أنت متأكد من تحديد طلب "${req.title}" كمكتمل؟ سيتم إرسال إشعار للمستخدم وحذف الطلب.`)) { try { let notificationSent = false; if (req.userId && serviceAccountJson) { try { const accessToken = await getAccessToken(serviceAccountJson); if (!accessToken) throw new Error("Could not generate access token"); const userProfile = await getUserProfile(req.userId); const tokens = userProfile?.fcmTokens || []; if (tokens.length > 0) { const parsedServiceAccount = JSON.parse(serviceAccountJson); const projectId = parsedServiceAccount.project_id; const notificationData = { title: 'تم تلبية طلبك! 🎉', body: `تمت إضافة "${req.title}" إلى الموقع. مشاهدة ممتعة!`, image: '/icon-192.png', data: { url: '/' } }; await Promise.all(tokens.map(async (token: string) => { await sendFCMv1Message(token, notificationData, accessToken, projectId); })); notificationSent = true; console.log('HTTP v1 Notification sent.'); } } catch (notifyErr) { console.error("Failed to send notification:", notifyErr); addToast('فشل إرسال الإشعار، لكن سيتم إكمال الطلب.', 'error'); } } else if (req.userId && !serviceAccountJson) { addToast('لم يتم إرسال الإشعار لعدم وجود ملف الخدمة (Service Account) في الإعدادات.', 'error'); } await deleteContentRequest(req.id); setRequests(prev => prev.filter(r => r.id !== req.id)); addToast(notificationSent ? 'تمت تلبية الطلب وإشعار المستخدم.' : 'تمت تلبية الطلب (بدون إشعار).', 'success'); } catch (error) { console.error(error); addToast('حدث خطأ أثناء معالجة الطلب.', 'error'); } } }; return (<div className="space-y-6">{!serviceAccountJson && (<div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-xl text-yellow-200 text-sm flex items-center gap-3"><span className="text-xl">⚠️</span><span>تنبيه: يجب إضافة "ملف الخدمة (Service Account JSON)" في تبويب "إعدادات الموقع" لتفعيل الإشعارات التلقائية عند تلبية الطلبات.</span></div>)}<div className="bg-[#1f2937] rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl"><div className="px-8 py-6 border-b border-gray-700/50 flex justify-between items-center"><h3 className="font-bold text-lg text-white flex items-center gap-2"><InboxIcon />طلبات المحتوى ({requests.length})</h3><button onClick={fetchRequests} className="text-sm text-[#00A7F8] hover:text-[#00FFB0] font-bold transition-colors">تحديث القائمة</button></div>{loading ? (<div className="text-center py-12 text-gray-500">جاري التحميل...</div>) : requests.length === 0 ? (<div className="text-center py-20 text-gray-500 flex flex-col items-center gap-4"><span className="text-4xl opacity-50">📭</span>لا يوجد طلبات جديدة حالياً.</div>) : (<div className="overflow-x-auto"><table className="w-full text-sm text-right text-gray-300 whitespace-nowrap"><thead className="bg-gray-800/50 text-xs uppercase font-bold text-gray-400"><tr><th className="px-8 py-4">العنوان</th><th className="px-8 py-4">النوع</th><th className="px-8 py-4">ملاحظات</th><th className="px-8 py-4">التاريخ</th><th className="px-8 py-4">إجراءات</th></tr></thead><tbody>{requests.map(req => (<tr key={req.id} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors"><td className="px-8 py-4 font-bold text-white">{req.title}</td><td className="px-8 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${req.type === 'movie' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>{req.type === 'movie' ? 'فيلم' : 'مسلسل'}</span></td><td className="px-8 py-4 max-w-xs truncate text-gray-400" title={req.notes}>{req.notes || '-'}</td><td className="px-8 py-4 dir-ltr text-right text-xs font-mono">{new Date(req.createdAt).toLocaleDateString('en-GB')}</td><td className="px-8 py-4"><button onClick={() => handleFulfillRequest(req)} className="bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold py-2 px-4 rounded-lg text-xs transition-colors border border-green-500/20">✓ تمت الإضافة</button></td></tr>))}</tbody></table></div>)}</div></div>); };
const UserManagementTab: React.FC<any> = ({users, onAddAdmin, onRequestDelete, addToast}) => { const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [firstName, setFirstName] = useState(''); const handleAddAdminSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (email && password) { try { await onAddAdmin({email, password, firstName}); setEmail(''); setPassword(''); setFirstName(''); addToast('تمت إضافة المستخدم بنجاح.', 'success'); } catch (error: any) { addToast(error.message, 'error'); } } }; return (<div className="space-y-8"><div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl"><h3 className="text-xl font-bold mb-6 text-[#00FFB0]">إضافة مستخدم جديد</h3><form onSubmit={handleAddAdminSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end"><div className="w-full"><label className="block text-xs font-bold text-gray-400 mb-2">الاسم</label><input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00A7F8] text-white placeholder-gray-600" required/></div><div className="w-full"><label className="block text-xs font-bold text-gray-400 mb-2">البريد الإلكتروني</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00A7F8] text-white placeholder-gray-600" required/></div><div className="flex gap-4 w-full"><div className="flex-1"><label className="block text-xs font-bold text-gray-400 mb-2">كلمة المرور</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00A7F8] text-white placeholder-gray-600" required/></div><button type="submit" className="bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-bold py-3 px-6 rounded-xl hover:shadow-[0_0_15px_rgba(0,167,248,0.4)] transition-all transform hover:scale-105 h-[48px] mt-auto">إضافة</button></div></form></div><div className="overflow-x-auto bg-[#1f2937] rounded-2xl border border-gray-700/50 shadow-xl"><table className="min-w-full text-sm text-right text-gray-300 whitespace-nowrap"><thead className="bg-gray-800/50 text-xs uppercase font-bold text-gray-400"><tr><th scope="col" className="px-8 py-4">الاسم</th><th scope="col" className="px-8 py-4">البريد الإلكتروني</th><th scope="col" className="px-8 py-4">الدور</th><th scope="col" className="px-8 py-4">إجراءات</th></tr></thead><tbody>{users.map((user:any) => (<tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors"><td className="px-8 py-4 font-bold text-white">{user.firstName} {user.lastName || ''}</td><td className="px-8 py-4">{user.email}</td><td className="px-8 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === UserRole.Admin ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>{user.role === UserRole.Admin ? 'مسؤول' : 'مستخدم'}</span></td><td className="px-8 py-4"><button onClick={() => onRequestDelete(user.id, user.email)} className="text-red-400 hover:text-red-300 font-bold text-xs bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors">حذف</button></td></tr>))}</tbody></table></div></div>); };
const PinnedContentManagementTab: React.FC<any> = ({ allContent, pinnedState, setPinnedItems }) => { const [selectedPage, setSelectedPage] = useState<PageKey>('home'); const [searchTerm, setSearchTerm] = useState(''); const [localPinnedItems, setLocalPinnedItems] = useState<PinnedItem[]>([]); const [draggedItem, setDraggedItem] = useState<PinnedItem | null>(null); const [dragOverItem, setDragOverItem] = useState<PinnedItem | null>(null); useEffect(() => { setLocalPinnedItems(pinnedState[selectedPage] || []); }, [pinnedState, selectedPage]); const isDirty = JSON.stringify(localPinnedItems) !== JSON.stringify(pinnedState[selectedPage] || []); const pinnedContentDetails = useMemo(() => localPinnedItems.map(pin => { const content = allContent.find((c:any) => c.id === pin.contentId); return content ? { ...pin, contentDetails: content } : null; }).filter((item): item is { contentDetails: Content } & PinnedItem => item !== null), [localPinnedItems, allContent]); const availableContent = useMemo(() => { const pinnedIds = new Set(localPinnedItems.map(p => p.contentId)); let filtered = allContent.filter((c:any) => !pinnedIds.has(c.id)); if (selectedPage === 'movies') filtered = filtered.filter((c:any) => c.type === ContentType.Movie); else if (selectedPage === 'series') filtered = filtered.filter((c:any) => c.type === ContentType.Series); else if (selectedPage === 'kids') filtered = filtered.filter((c:any) => c.categories.includes('افلام أنميشن') || c.visibility === 'kids' || c.genres.includes('أطفال')); else if (selectedPage === 'ramadan') filtered = filtered.filter((c:any) => c.categories.includes('رمضان')); else if (selectedPage === 'soon') filtered = filtered.filter((c:any) => c.categories.includes('قريباً')); return filtered.filter((c:any) => (c.title || '').toLowerCase().includes(searchTerm.toLowerCase())); }, [allContent, localPinnedItems, searchTerm, selectedPage]); const handlePin = (contentId: string) => { if (pinnedContentDetails.length >= 10) { alert('يمكنك تثبيت 10 عناصر كحد أقصى.'); return; } setLocalPinnedItems([...localPinnedItems, { contentId, bannerNote: '' }]); }; const handleUnpin = (contentId: string) => { setLocalPinnedItems(localPinnedItems.filter(p => p.contentId !== contentId)); }; const handleBannerNoteChange = (contentId: string, note: string) => { setLocalPinnedItems(localPinnedItems.map(p => p.contentId === contentId ? { ...p, bannerNote: note } : p)); }; const onDragStart = (e: React.DragEvent<HTMLLIElement>, item: PinnedItem) => { setDraggedItem(item); e.dataTransfer.effectAllowed = 'move'; }; const onDragOver = (e: React.DragEvent<HTMLLIElement>, item: PinnedItem) => { e.preventDefault(); if (draggedItem?.contentId !== item.contentId) { setDragOverItem(item); } }; const onDrop = () => { if (!draggedItem || !dragOverItem) return; const currentItems = [...localPinnedItems]; const fromIndex = currentItems.findIndex(p => p.contentId === draggedItem.contentId); const toIndex = currentItems.findIndex(p => p.contentId === dragOverItem.contentId); if (fromIndex === -1 || toIndex === -1) return; const updatedItems = [...currentItems]; const [movedItem] = updatedItems.splice(fromIndex, 1); updatedItems.splice(toIndex, 0, movedItem); setLocalPinnedItems(updatedItems); setDraggedItem(null); setDragOverItem(null); }; const onDragEnd = () => { setDraggedItem(null); setDragOverItem(null); }; const pageLabels: Record<string, string> = { home: 'الصفحة الرئيسية', movies: 'صفحة الأفلام', series: 'صفحة المسلسلات', ramadan: 'صفحة رمضان', soon: 'صفحة قريباً', kids: 'صفحة الأطفال' }; return ( <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> <div className="lg:col-span-3 bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 mb-2 shadow-lg"><h3 className="text-gray-400 mb-4 text-sm font-bold uppercase tracking-wider">اختر الصفحة للتحكم في المثبت (Hero Slider):</h3><div className="flex flex-wrap gap-3">{(Object.keys(pageLabels) as PageKey[]).map(key => (<button key={key} onClick={() => setSelectedPage(key)} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all border ${selectedPage === key ? 'bg-[#00A7F8]/20 border-[#00A7F8] text-[#00A7F8] shadow-[0_0_15px_rgba(0,167,248,0.2)]' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'}`}>{pageLabels[key]}</button>))}</div></div> <div className="lg:col-span-2 bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 shadow-xl"><div className="flex justify-between items-center mb-6"><div><h3 className="text-xl font-bold text-[#00FFB0]">المثبت في: {pageLabels[selectedPage]}</h3><p className="text-sm text-gray-400 mt-1">اسحب وأفلت لإعادة الترتيب.</p></div><button onClick={() => setPinnedItems(selectedPage, localPinnedItems)} disabled={!isDirty} className="bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-bold py-2 px-6 rounded-xl hover:shadow-[0_0_15px_rgba(0,167,248,0.4)] transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none">حفظ التغييرات</button></div>{pinnedContentDetails.length > 0 ? (<ul onDrop={onDrop} onDragLeave={() => setDragOverItem(null)} className="space-y-4">{pinnedContentDetails.map((item, index) => (<li key={item.contentId} draggable onDragStart={(e) => onDragStart(e, item)} onDragOver={(e) => onDragOver(e, item)} onDragEnd={onDragEnd} className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 cursor-grab border ${draggedItem?.contentId === item.contentId ? 'opacity-50' : ''} ${dragOverItem?.contentId === item.contentId ? 'bg-gray-700 border-[#00A7F8]' : 'bg-gray-800/50 border-gray-700'}`}><div className="flex flex-col items-center justify-center w-8 text-gray-600 cursor-grab"><div className="w-1.5 h-1.5 bg-gray-600 rounded-full mb-1"></div><div className="w-1.5 h-1.5 bg-gray-600 rounded-full mb-1"></div><div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div></div><img src={item.contentDetails.poster} alt={item.contentDetails.title} className="w-12 h-16 object-cover rounded-lg bg-gray-900 shadow-sm" /><div className="flex-1 min-w-0"><p className="font-bold text-white text-base truncate mb-1">{item.contentDetails.title}</p><input type="text" placeholder="نص مميز (اختياري)" value={item.bannerNote || ''} onChange={(e) => handleBannerNoteChange(item.contentId, e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs w-full text-gray-300 focus:outline-none focus:border-[#00A7F8] transition-colors"/></div><button onClick={() => handleUnpin(item.contentId)} className="text-red-400 hover:text-red-300 p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"><CloseIcon className="w-5 h-5" /></button></li>))}</ul>) : (<div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-700 rounded-3xl flex flex-col items-center justify-center gap-2"><span className="text-4xl opacity-30">📌</span>لا يوجد محتوى مثبت في هذه الصفحة.</div>)}</div> <div className="bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 shadow-xl h-fit"><h3 className="font-bold text-[#00A7F8] mb-4 text-lg">إضافة محتوى للمثبت</h3><input type="text" placeholder="ابحث لإضافة..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 mb-4 text-white focus:outline-none focus:ring-2 focus:ring-[#00A7F8] placeholder-gray-600"/><div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">{availableContent.slice(0, 20).map((c:any) => (<div key={c.id} className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-xl transition-colors border border-transparent hover:border-gray-700 cursor-pointer group"><img src={c.poster} alt={c.title} className="w-10 h-14 object-cover rounded-lg bg-gray-900 shadow-sm" /><div className="flex-1 min-w-0"><p className="text-sm font-bold truncate text-white group-hover:text-[#00A7F8] transition-colors">{c.title}</p><p className="text-xs text-gray-500 font-mono">{c.releaseYear}</p></div><button onClick={() => handlePin(c.id)} className="bg-[#00A7F8]/10 text-[#00A7F8] hover:bg-[#00A7F8] hover:text-black font-bold text-xl w-8 h-8 rounded-lg flex items-center justify-center transition-all">+</button></div>))}</div></div> </div> ); };
const AdsManagementTab: React.FC<any> = ({ ads, onNew, onEdit, onRequestDelete, onUpdateAd }) => { return ( <div> <div className="flex justify-between items-center mb-8 bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 shadow-lg"> <h3 className="text-xl font-bold text-white">إدارة الإعلانات</h3> <button onClick={onNew} className="bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-bold py-3 px-6 rounded-xl hover:shadow-[0_0_15px_rgba(0,167,248,0.4)] transition-all transform hover:scale-105">إضافة إعلان جديد</button> </div> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {ads.map((ad:any) => ( <div key={ad.id} className="bg-[#1f2937] border border-gray-700/50 p-6 rounded-2xl flex flex-col justify-between shadow-lg hover:border-[#00A7F8]/30 transition-all"> <div> <div className="flex justify-between items-start mb-4"> <h4 className="font-bold text-white text-lg">{ad.title}</h4> <div className="flex gap-2"> <span className={`px-2 py-1 rounded-md text-[10px] border font-bold uppercase tracking-wider ${ad.targetDevice === 'mobile' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : ad.targetDevice === 'desktop' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-gray-700 text-gray-400 border-gray-600'}`}>{ad.targetDevice === 'mobile' ? 'موبايل' : ad.targetDevice === 'desktop' ? 'كمبيوتر' : 'الكل'}</span> <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${ad.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{ad.status === 'active' ? 'نشط' : 'معطل'}</span> </div> </div> <p className="text-xs text-gray-400 mb-3 font-mono bg-gray-900/50 p-2 rounded border border-gray-700">{adPlacementLabels[ad.placement as keyof typeof adPlacementLabels]}</p> <div className="bg-gray-900 p-3 rounded-lg text-xs text-gray-500 font-mono truncate mb-6 border border-gray-800">{ad.code}</div> </div> <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50 items-center"> <ToggleSwitch checked={ad.status === 'active'} onChange={(c) => onUpdateAd({...ad, status: c ? 'active' : 'disabled'})} className="mr-auto scale-90" /> <button onClick={() => onEdit(ad)} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">تعديل</button> <button onClick={() => onRequestDelete(ad.id, ad.title)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-xs font-bold transition-colors">حذف</button> </div> </div> ))} {ads.length === 0 && ( <div className="col-span-full text-center py-20 text-gray-500 border-2 border-dashed border-gray-700 rounded-3xl flex flex-col items-center justify-center gap-2"><span className="text-4xl opacity-30">📢</span>لا توجد إعلانات.</div> )} </div> </div> ); }
const ThemesTab: React.FC<any> = ({ siteSettings, onSetSiteSettings }) => { const changeTheme = (theme: ThemeType) => { onSetSiteSettings({ ...siteSettings, activeTheme: theme }); }; return ( <div className="space-y-6 max-w-5xl mx-auto animate-fade-in-up"> <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 space-y-8 shadow-xl"> <h3 className="text-xl font-bold text-[#00A7F8] mb-4 border-b border-gray-700 pb-4">إعدادات المظهر (Themes)</h3> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> <div onClick={() => changeTheme('default')} className={`p-5 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${siteSettings.activeTheme === 'default' ? 'border-[#00A7F8] bg-[#00A7F8]/5 shadow-[0_0_20px_rgba(0,167,248,0.1)]' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}><div className="h-24 bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] rounded-xl mb-4 shadow-lg"></div><h4 className="font-bold text-white text-lg">الافتراضي (السايبر)</h4><p className="text-xs text-gray-400 mt-2 leading-relaxed">الثيم الأساسي باللون الأزرق والأخضر.</p>{siteSettings.activeTheme === 'default' && <div className="mt-3 text-[#00A7F8] text-xs font-bold bg-[#00A7F8]/10 px-2 py-1 rounded w-fit">✓ مفعل</div>}</div> <div onClick={() => changeTheme('netflix-red')} className={`p-5 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${siteSettings.activeTheme === 'netflix-red' ? 'border-[#E50914] bg-[#E50914]/5 shadow-[0_0_20px_rgba(229,9,20,0.1)]' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}><div className="h-24 bg-[#141414] rounded-xl mb-4 shadow-lg flex items-center justify-center border-b-4 border-[#E50914]"><span className="text-[#E50914] text-3xl font-black tracking-tighter">N</span></div><h4 className="font-bold text-white text-lg">الأحمر الداكن (Netflix)</h4><p className="text-xs text-gray-400 mt-2 leading-relaxed">تصميم سينمائي باللون الأسود والأحمر.</p>{siteSettings.activeTheme === 'netflix-red' && <div className="mt-3 text-[#E50914] text-xs font-bold bg-[#E50914]/10 px-2 py-1 rounded w-fit">✓ مفعل</div>}</div> <div onClick={() => changeTheme('cosmic-teal')} className={`p-5 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${siteSettings.activeTheme === 'cosmic-teal' ? 'border-[#35F18B] bg-[#35F18B]/5 shadow-[0_0_20px_rgba(53,241,139,0.1)]' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}><div className="h-24 bg-gradient-to-br from-[#35F18B] to-[#2596be] rounded-xl mb-4 shadow-lg flex items-center justify-center text-3xl relative overflow-hidden"><div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80')] opacity-50 bg-cover"></div><span className="relative z-10">✨</span></div><h4 className="font-bold text-white text-lg">الكوني (Cosmic Teal)</h4><p className="text-xs text-gray-400 mt-2 leading-relaxed">تصميم عصري بألوان الأخضر الزاهي.</p>{siteSettings.activeTheme === 'cosmic-teal' && <div className="mt-3 text-[#35F18B] text-xs font-bold bg-[#35F18B]/10 px-2 py-1 rounded w-fit">✓ مفعل</div>}</div> <div onClick={() => changeTheme('ramadan')} className={`p-5 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${siteSettings.activeTheme === 'ramadan' ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}><div className="h-24 bg-gradient-to-br from-[#D4AF37] to-[#F59E0B] rounded-xl mb-4 shadow-lg flex items-center justify-center text-3xl">🌙</div><h4 className="font-bold text-white text-lg">رمضان الذهبي</h4><p className="text-xs text-gray-400 mt-2 leading-relaxed">ألوان ذهبية دافئة للأجواء الرمضانية.</p>{siteSettings.activeTheme === 'ramadan' && <div className="mt-3 text-amber-500 text-xs font-bold bg-amber-500/10 px-2 py-1 rounded w-fit">✓ مفعل</div>}</div> <div onClick={() => changeTheme('eid')} className={`p-5 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${siteSettings.activeTheme === 'eid' ? 'border-purple-500 bg-purple-500/5 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}><div className="h-24 bg-gradient-to-br from-[#6A0DAD] to-[#C0C0C0] rounded-xl mb-4 shadow-lg flex items-center justify-center text-3xl">🎉</div><h4 className="font-bold text-white text-lg">العيد (بنفسجي)</h4><p className="text-xs text-gray-400 mt-2 leading-relaxed">ألوان احتفالية مبهجة للمناسبات.</p>{siteSettings.activeTheme === 'eid' && <div className="mt-3 text-purple-500 text-xs font-bold bg-purple-500/10 px-2 py-1 rounded w-fit">✓ مفعل</div>}</div> <div onClick={() => changeTheme('ios')} className={`p-5 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${siteSettings.activeTheme === 'ios' ? 'border-[#00C6FF] bg-[#00C6FF]/5 shadow-[0_0_20px_rgba(0,198,255,0.1)]' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}><div className="h-24 bg-gradient-to-r from-[#00C6FF] to-[#0072FF] rounded-xl mb-4 shadow-lg relative overflow-hidden"><div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div></div><h4 className="font-bold text-white text-lg">iOS Glass</h4><p className="text-xs text-gray-400 mt-2 leading-relaxed">تصميم زجاجي عصري مع تدرجات سماوية.</p>{siteSettings.activeTheme === 'ios' && <div className="mt-3 text-[#00C6FF] text-xs font-bold bg-[#00C6FF]/10 px-2 py-1 rounded w-fit">✓ مفعل</div>}</div> <div onClick={() => changeTheme('night-city')} className={`p-5 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${siteSettings.activeTheme === 'night-city' ? 'border-[#FF00FF] bg-[#FF00FF]/5 shadow-[0_0_20px_rgba(255,0,255,0.1)]' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}><div className="h-24 bg-black rounded-xl mb-4 shadow-[0_0_15px_#FF00FF] relative border border-[#00FFFF]"><div className="absolute inset-0 bg-gradient-to-r from-[#FF00FF]/30 to-[#00FFFF]/30"></div></div><h4 className="font-bold text-white text-lg">Night City</h4><p className="text-xs text-gray-400 mt-2 leading-relaxed">ألوان نيون حيوية ومظهر مستقبلي.</p>{siteSettings.activeTheme === 'night-city' && <div className="mt-3 text-[#FF00FF] text-xs font-bold bg-[#FF00FF]/10 px-2 py-1 rounded w-fit">✓ مفعل</div>}</div> <div onClick={() => changeTheme('nature')} className={`p-5 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${siteSettings.activeTheme === 'nature' ? 'border-[#8FBC8F] bg-[#8FBC8F]/5 shadow-[0_0_20px_rgba(143,188,143,0.1)]' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}><div className="h-24 bg-gradient-to-br from-[#2F4F4F] to-[#8FBC8F] rounded-xl mb-4 shadow-lg"></div><h4 className="font-bold text-white text-lg">Nature</h4><p className="text-xs text-gray-400 mt-2 leading-relaxed">ألوان طبيعية هادئة مستوحاة من الغابات.</p>{siteSettings.activeTheme === 'nature' && <div className="mt-3 text-[#8FBC8F] text-xs font-bold bg-[#8FBC8F]/10 px-2 py-1 rounded w-fit">✓ مفعل</div>}</div> </div> </div> </div> ); }

const SiteSettingsTab: React.FC<{
    siteSettings: SiteSettings;
    onSetSiteSettings: (s: SiteSettings) => void;
    allContent: Content[];
}> = ({ siteSettings, onSetSiteSettings, allContent }) => {
    
    const handleChange = (field: keyof SiteSettings, value: any) => { onSetSiteSettings({ ...siteSettings, [field]: value }); };
    const handleNestedChange = (parent: keyof SiteSettings, child: string, value: any) => { onSetSiteSettings({ ...siteSettings, [parent]: { ...(siteSettings[parent] as any), [child]: value } }); };
    
    // --- UPDATED SITEMAP GENERATION ---
    const generateSpecificSitemap = (type: 'index' | 'movies' | 'series' | 'seasons' | 'episodes') => {
        const baseUrl = 'https://cinematix-kappa.vercel.app';
        const date = new Date().toISOString().split('T')[0];
        
        // --- SAFE URL ESCAPING FUNCTION ---
        // Prevents Fatal XML Parse Error (EntityRef: expecting ';')
        const escapeXml = (unsafe: string) => {
            return unsafe.replace(/[<>&'"]/g, function (c) {
                switch (c) {
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '&': return '&amp;';
                    case '\'': return '&apos;';
                    case '"': return '&quot;';
                    default: return c;
                }
            });
        };

        let xmlContent = '';
        let fileName = '';

        if (type === 'index') {
            fileName = 'sitemap-index.xml';
            xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${escapeXml(`${baseUrl}/movie-sitemap.xml`)}</loc>
    <lastmod>${date}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${escapeXml(`${baseUrl}/series-sitemap.xml`)}</loc>
    <lastmod>${date}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${escapeXml(`${baseUrl}/season-sitemap.xml`)}</loc>
    <lastmod>${date}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${escapeXml(`${baseUrl}/episode-sitemap.xml`)}</loc>
    <lastmod>${date}</lastmod>
  </sitemap>
</sitemapindex>`;
        } else {
            // Header for all content sitemaps
            xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n`;

            if (type === 'movies') {
                fileName = 'movie-sitemap.xml';
                const movies = allContent.filter(c => c.type === 'movie');
                movies.forEach(item => {
                    const slug = item.slug || item.id;
                    const url = `${baseUrl}/فيلم/${slug}`;
                    const itemDate = item.updatedAt ? item.updatedAt.split('T')[0] : date;
                    const desc = escapeXml(item.description || item.title);
                    const title = escapeXml(item.title);
                    const thumbnail = item.poster || '';

                    // Apply escapeXml to URL to fix EntityRef errors
                    xmlContent += `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${itemDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n`;
                    xmlContent += `    <video:video>\n      <video:thumbnail_loc>${escapeXml(thumbnail)}</video:thumbnail_loc>\n      <video:title>${title}</video:title>\n      <video:description>${desc.substring(0, 1000)}</video:description>\n      <video:publication_date>${item.releaseYear}-01-01T00:00:00+00:00</video:publication_date>\n    </video:video>\n`;
                    xmlContent += `  </url>\n`;
                });
            } else if (type === 'series') {
                fileName = 'series-sitemap.xml';
                const series = allContent.filter(c => c.type === 'series');
                series.forEach(item => {
                    const slug = item.slug || item.id;
                    const url = `${baseUrl}/مسلسل/${slug}`;
                    const itemDate = item.updatedAt ? item.updatedAt.split('T')[0] : date;
                    // Apply escapeXml to URL
                    xmlContent += `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${itemDate}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
                });
            } else if (type === 'seasons') {
                fileName = 'season-sitemap.xml';
                const series = allContent.filter(c => c.type === 'series');
                series.forEach(item => {
                    const slug = item.slug || item.id;
                    const itemDate = item.updatedAt ? item.updatedAt.split('T')[0] : date;
                    item.seasons?.forEach(season => {
                        const url = `${baseUrl}/مسلسل/${slug}/الموسم/${season.seasonNumber}`;
                        // Apply escapeXml to URL
                        xmlContent += `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${itemDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
                    });
                });
            } else if (type === 'episodes') {
                fileName = 'episode-sitemap.xml';
                const series = allContent.filter(c => c.type === 'series');
                series.forEach(item => {
                    const slug = item.slug || item.id;
                    const itemDate = item.updatedAt ? item.updatedAt.split('T')[0] : date;
                    const title = escapeXml(item.title);
                    
                    item.seasons?.forEach(season => {
                        season.episodes.forEach((ep, index) => {
                            const epNum = index + 1;
                            const url = `${baseUrl}/مسلسل/${slug}/الموسم/${season.seasonNumber}/الحلقة/${epNum}`;
                            const epTitle = `${title} - الموسم ${season.seasonNumber} الحلقة ${epNum}`;
                            const epThumb = ep.thumbnail || item.poster || '';
                            const desc = escapeXml(item.description || item.title);

                            // Apply escapeXml to URL
                            xmlContent += `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${itemDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n`;
                            xmlContent += `    <video:video>\n      <video:thumbnail_loc>${escapeXml(epThumb)}</video:thumbnail_loc>\n      <video:title>${escapeXml(epTitle)}</video:title>\n      <video:description>${desc.substring(0, 1000)}</video:description>\n      <video:publication_date>${item.releaseYear}-01-01T00:00:00+00:00</video:publication_date>\n    </video:video>\n`;
                            xmlContent += `  </url>\n`;
                        });
                    });
                });
            }

            xmlContent += `</urlset>`;
        }

        // Trigger Download
        const blob = new Blob([xmlContent], { type: 'text/xml' });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl">
                <h3 className="text-xl font-bold text-[#00A7F8] mb-6">تحسين محركات البحث (SEO)</h3>
                
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-600/50 mb-4">
                    <h4 className="font-bold text-white mb-2">مولد خرائط الموقع (Split Sitemaps)</h4>
                    <p className="text-xs text-gray-400 mb-6 leading-relaxed">قم بتنزيل الملفات التالية ورفعها إلى مجلد `public` في مشروعك لضمان الفهرسة الكاملة في جوجل.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <button onClick={() => generateSpecificSitemap('index')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg">
                            <DocumentArrowDownIcon /> 1. Sitemap Index
                        </button>
                        <button onClick={() => generateSpecificSitemap('movies')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-gray-600">
                            <DocumentArrowDownIcon /> 2. Movies XML
                        </button>
                        <button onClick={() => generateSpecificSitemap('series')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-gray-600">
                            <DocumentArrowDownIcon /> 3. Series XML
                        </button>
                        <button onClick={() => generateSpecificSitemap('seasons')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-gray-600">
                            <DocumentArrowDownIcon /> 4. Seasons XML
                        </button>
                        <button onClick={() => generateSpecificSitemap('episodes')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-gray-600">
                            <DocumentArrowDownIcon /> 5. Episodes XML
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 space-y-6 shadow-xl"><h3 className="text-xl font-bold text-[#00A7F8] mb-4">أوضاع الموقع</h3><div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50"><span>وضع الصيانة (يغلق الموقع للزوار)</span><ToggleSwitch checked={siteSettings.is_maintenance_mode_enabled} onChange={(c) => handleChange('is_maintenance_mode_enabled', c)} /></div><div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50"><span>تفعيل الإعلانات في الموقع</span><ToggleSwitch checked={siteSettings.adsEnabled} onChange={(c) => handleChange('adsEnabled', c)} /></div><div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50"><span>عرض كاروسيل رمضان في الصفحة الرئيسية</span><ToggleSwitch checked={siteSettings.isShowRamadanCarousel} onChange={(c) => handleChange('isShowRamadanCarousel', c)} /></div></div>
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 space-y-6 shadow-xl"><h3 className="text-xl font-bold text-[#00A7F8] mb-4">إعدادات قوائم أفضل 10 (Top 10)</h3><p className="text-xs text-gray-400 -mt-4 mb-4">تحكم في ظهور شريط "أفضل 10 أعمال" (المحتوى المثبت) في الصفحات المختلفة.</p><div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50"><span>عرض في الصفحة الرئيسية</span><ToggleSwitch checked={siteSettings.showTop10Home} onChange={(c) => handleChange('showTop10Home', c)} /></div><div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50"><span>عرض في صفحة الأفلام</span><ToggleSwitch checked={siteSettings.showTop10Movies} onChange={(c) => handleChange('showTop10Movies', c)} /></div><div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50"><span>عرض في صفحة المسلسلات</span><ToggleSwitch checked={siteSettings.showTop10Series} onChange={(c) => handleChange('showTop10Series', c)} /></div></div>
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl"><div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-[#00A7F8]">شريط الإعلانات العلوي (ShoutBar)</h3><ToggleSwitch checked={siteSettings.shoutBar.isVisible} onChange={(c) => handleNestedChange('shoutBar', 'isVisible', c)} /></div><input value={siteSettings.shoutBar.text} onChange={(e) => handleNestedChange('shoutBar', 'text', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 text-white focus:outline-none focus:border-[#00A7F8]" placeholder="نص الشريط المتحرك..."/></div>
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl"><h3 className="text-xl font-bold text-[#00A7F8] mb-6">روابط التواصل الاجتماعي</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{Object.keys(siteSettings.socialLinks).map((key) => (<div key={key}><label className="block text-xs font-bold text-gray-400 mb-2 capitalize">{key}</label><input value={(siteSettings.socialLinks as any)[key]} onChange={(e) => handleNestedChange('socialLinks', key, e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00A7F8] text-white dir-ltr"/></div>))}</div></div>
             <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl"><div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-[#00A7F8]">العد التنازلي (رمضان / مناسبات)</h3><ToggleSwitch checked={siteSettings.isCountdownVisible} onChange={(c) => handleChange('isCountdownVisible', c)} /></div><label className="block text-xs font-bold text-gray-400 mb-2">تاريخ الانتهاء</label><input type="datetime-local" value={siteSettings.countdownDate.substring(0, 16)} onChange={(e) => handleChange('countdownDate', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A7F8]"/></div>
            
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl">
                <h3 className="text-xl font-bold text-[#00A7F8] mb-6">إعدادات الإشعارات (Firebase Cloud Messaging)</h3>
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                    <label className="block text-xs font-bold text-gray-300 mb-3">Service Account JSON (مطلوب لـ FCM HTTP v1)</label>
                    <textarea 
                        value={siteSettings.serviceAccountJson || ''}
                        onChange={(e) => handleChange('serviceAccountJson', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-xs focus:border-[#00A7F8] focus:outline-none h-48 dir-ltr"
                        placeholder='{ "type": "service_account", "project_id": "...", ... }'
                    />
                    <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
                        انسخ محتوى ملف JSON الخاص بـ Service Account هنا. هذا مطلوب لإرسال الإشعارات عبر API v1 الجديد.
                        <br/>
                        <span className="text-red-400 font-bold">تحذير أمني:</span> هذا المفتاح يمنح صلاحيات كاملة. لا تشاركه مع أحد.
                    </p>
                </div>
            </div>

            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl"><h3 className="text-xl font-bold text-[#00A7F8] mb-6">سياسة الخصوصية</h3><textarea value={siteSettings.privacyPolicy} onChange={(e) => handleChange('privacyPolicy', e.target.value)} className="w-full h-48 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00A7F8]"/></div>
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl"><h3 className="text-xl font-bold text-[#00A7F8] mb-6">سياسة حقوق الملكية</h3><textarea value={siteSettings.copyrightPolicy || ''} onChange={(e) => handleChange('copyrightPolicy', e.target.value)} className="w-full h-48 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00A7F8]" placeholder="أدخل نص سياسة حقوق الملكية هنا..."/></div>
        </div>
    );
};

const NotificationTab: React.FC<{ addToast: AdminPanelProps['addToast'], serviceAccountJson?: string }> = ({ addToast, serviceAccountJson }) => {
    const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [image, setImage] = useState(''); const [url, setUrl] = useState(''); const [isSending, setIsSending] = useState(false); const handleSend = async (e: React.FormEvent) => { e.preventDefault(); if (!title || !body) { addToast('الرجاء تعبئة العنوان والرسالة.', 'error'); return; } if (!serviceAccountJson) { addToast('يجب إدخال Service Account JSON في الإعدادات أولاً.', 'error'); return; } setIsSending(true); try { const accessToken = await getAccessToken(serviceAccountJson); if (!accessToken) { addToast('فشل في إنشاء رمز الوصول (Access Token). تأكد من صحة ملف JSON.', 'error'); setIsSending(false); return; } const parsedServiceAccount = JSON.parse(serviceAccountJson); const projectId = parsedServiceAccount.project_id; const usersSnapshot = await db.collection('users').get(); const tokens: string[] = []; usersSnapshot.forEach(doc => { const userData = doc.data(); if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) { userData.fcmTokens.forEach((token: string) => { if (token && !tokens.includes(token)) { tokens.push(token); } }); } }); if (tokens.length === 0) { addToast('لم يتم العثور على أي مستخدمين مسجلين للإشعارات.', 'info'); setIsSending(false); return; } console.log(`Sending notification to ${tokens.length} devices...`); const results = await Promise.all(tokens.map(async (token) => { try { const notification = { title, body, image: image || undefined, data: { url: url || '/' } }; await sendFCMv1Message(token, notification, accessToken, projectId); return true; } catch (error) { console.error('FCM Error:', error); return false; } })); const successCount = results.filter(Boolean).length; if (successCount > 0) { addToast(`تم إرسال الإشعار بنجاح إلى ${successCount} جهاز!`, 'success'); setTitle(''); setBody(''); setImage(''); setUrl(''); } else { addToast('فشل إرسال الإشعار لجميع الأجهزة.', 'error'); } } catch (error) { console.error(error); addToast('حدث خطأ غير متوقع.', 'error'); } finally { setIsSending(false); } }; return (<div className="max-w-2xl mx-auto bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl animate-fade-in-up"><div className="flex items-center gap-3 mb-8 border-b border-gray-700/50 pb-6"><PaperAirplaneIcon /><h3 className="text-2xl font-bold text-white">إرسال إشعار للمستخدمين</h3></div>{!serviceAccountJson && (<div className="mb-8 bg-red-500/10 border border-red-500/20 p-5 rounded-xl text-red-300 text-sm flex gap-2"><span className="text-lg">⚠️</span><div>لم يتم إعداد <strong>Service Account JSON</strong>. يرجى إضافته من تبويب "إعدادات الموقع" لتفعيل الإرسال.</div></div>)}<form onSubmit={handleSend} className="space-y-6"><div><label className="block text-xs font-bold text-gray-400 mb-2">عنوان الإشعار</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00A7F8] text-white placeholder-gray-600" placeholder="مثال: نزل الآن!" required/></div><div><label className="block text-xs font-bold text-gray-400 mb-2">نص الرسالة</label><textarea value={body} onChange={e => setBody(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00A7F8] text-white h-32 resize-none placeholder-gray-600" placeholder="مثال: الحلقة 5 من المؤسس عثمان متاحة بجودة عالية" required/></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-gray-400 mb-2">رابط الصورة (اختياري)</label><input type="text" value={image} onChange={e => setImage(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00A7F8] text-white dir-ltr placeholder-gray-600" placeholder="https://..."/></div><div><label className="block text-xs font-bold text-gray-400 mb-2">رابط التوجيه (Deep Link)</label><input type="text" value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00A7F8] text-white dir-ltr placeholder-gray-600" placeholder="/movie/inception"/><p className="text-[10px] text-gray-500 mt-2">المسار النسبي للفيلم أو المسلسل (مثال: /series/game-of-thrones)</p></div></div><div className="pt-6"><button type="submit" disabled={isSending || !serviceAccountJson} className={`w-full bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg ${isSending || !serviceAccountJson ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-[0_0_20px_rgba(0,167,248,0.4)]'}`}>{isSending ? (<><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div><span>جاري الإرسال...</span></>) : (<><PaperAirplaneIcon /><span>إرسال الإشعار الآن</span></>)}</button></div></form></div>);
};

const AnalyticsTab: React.FC<{ allContent: Content[]; allUsers: User[]; }> = ({ allContent, allUsers }) => {
    const contentByType = { movies: allContent.filter(c => c.type === 'movie').length, series: allContent.filter(c => c.type === 'series').length };
    const usersByRole = { admin: allUsers.filter(u => u.role === 'admin').length, user: allUsers.filter(u => u.role === 'user').length };
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl"><h3 className="text-xl font-bold text-white mb-6">توزيع المحتوى</h3><div className="space-y-6"><div className="flex justify-between items-center"><span>الأفلام</span><span className="font-bold text-[#00A7F8] bg-[#00A7F8]/10 px-3 py-1 rounded-lg">{contentByType.movies}</span></div><div className="w-full bg-gray-800 rounded-full h-3"><div className="bg-[#00A7F8] h-3 rounded-full shadow-[0_0_10px_#00A7F8]" style={{ width: `${(contentByType.movies / allContent.length) * 100}%` }}></div></div><div className="flex justify-between items-center mt-4"><span>المسلسلات</span><span className="font-bold text-[#00FFB0] bg-[#00FFB0]/10 px-3 py-1 rounded-lg">{contentByType.series}</span></div><div className="w-full bg-gray-800 rounded-full h-3"><div className="bg-[#00FFB0] h-3 rounded-full shadow-[0_0_10px_#00FFB0]" style={{ width: `${(contentByType.series / allContent.length) * 100}%` }}></div></div></div></div>
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl"><h3 className="text-xl font-bold text-white mb-6">المستخدمين</h3><div className="space-y-6"><div className="flex justify-between items-center"><span>المسؤولين</span><span className="font-bold text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-lg">{usersByRole.admin}</span></div><div className="flex justify-between items-center"><span>المستخدمين العاديين</span><span className="font-bold text-white bg-gray-700 px-3 py-1 rounded-lg">{usersByRole.user}</span></div><div className="pt-6 border-t border-gray-700/50"><p className="text-sm text-gray-400">إجمالي المستخدمين المسجلين: <span className="text-white font-bold text-lg mr-2">{allUsers.length}</span></p></div></div></div>
        </div>
    );
}

export default AdminPanel;
