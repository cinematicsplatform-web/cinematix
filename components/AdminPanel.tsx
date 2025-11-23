import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../firebase';
import type { Content, User, Ad, PinnedItem, SiteSettings, View, PinnedContentState, PageKey, ThemeType } from '../types';
import { ContentType, UserRole, adPlacementLabels } from '../types';
import ContentEditModal from './ContentEditModal';
import AdEditModal from './AdEditModal';
import ToggleSwitch from './ToggleSwitch';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { CloseIcon } from './icons/CloseIcon';

type AdminTab = 'dashboard' | 'content' | 'pinned' | 'users' | 'ads' | 'themes' | 'settings' | 'analytics';

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

    // --- Delete Modal State ---
    const [deleteModalState, setDeleteModalState] = useState<{
        isOpen: boolean;
        type: 'content' | 'user' | 'ad' | 'pinned';
        id: string;
        title?: string;
        meta?: any; // Extra data if needed
    }>({ isOpen: false, type: 'content', id: '' });

    useEffect(() => {
        const getContent = async () => {
            setIsLoadingContent(true);
            try {
                // Order by updatedAt to show recently modified first, fallback to createdAt
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

    const openContentModalForEdit = (c: Content) => {
        setEditingContent(c);
        setIsContentModalOpen(true);
    };

    const openContentModalForNew = () => {
        setEditingContent(null);
        setIsContentModalOpen(true);
    };
    
    const handleSaveContent = async (c: Content) => {
        try {
            // Update the timestamp locally to ensure sorting works immediately
            const contentWithDate = { ...c, updatedAt: new Date().toISOString() };

            if(editingContent) {
                const { id, ...contentData } = contentWithDate;
                await db.collection("content").doc(c.id).update(contentData);
                
                // Move edited item to the TOP of the list
                setAllContent(prev => {
                    const filtered = prev.filter(item => item.id !== c.id);
                    return [contentWithDate, ...filtered];
                });
                props.addToast("تم تعديل المحتوى وتصدر القائمة!", "success");
            } else {
                const { id, ...contentData } = contentWithDate;
                const docRef = await db.collection("content").add(contentData);
                
                // Add new item to the TOP of the list
                setAllContent(prev => [{...contentWithDate, id: docRef.id}, ...prev]);
                props.addToast("تم إضافة المحتوى وتصدر القائمة!", "success");
            }
            props.onContentChanged();
            setIsContentModalOpen(false);
            setEditingContent(null);
        } catch (err) {
             console.error("Error saving content:", err);
             props.addToast("حدث خطأ أثناء حفظ المحتوى.", "error");
        }
    }

    // --- New Delete Handlers (Trigger Modal) ---
    const confirmDeleteContent = (contentId: string, contentTitle: string) => {
        setDeleteModalState({
            isOpen: true,
            type: 'content',
            id: contentId,
            title: contentTitle
        });
    };

    const confirmDeleteUser = (userId: string, userName: string) => {
        setDeleteModalState({
            isOpen: true,
            type: 'user',
            id: userId,
            title: userName
        });
    };

    const confirmDeleteAd = (adId: string, adTitle: string) => {
        setDeleteModalState({
            isOpen: true,
            type: 'ad',
            id: adId,
            title: adTitle
        });
    };

    // --- Execution Handlers (Called by Modal) ---
    const executeDelete = async () => {
        const { type, id } = deleteModalState;
        
        // 1. Content Deletion
        if (type === 'content') {
            try {
                await db.collection("content").doc(id).delete();
                setAllContent(prev => prev.filter(item => item.id !== id));
                props.onContentChanged();
                props.addToast('تم حذف المحتوى بنجاح.', 'success');
            } catch (err) {
                console.error("Error deleting content:", err);
                props.addToast("حدث خطأ أثناء الحذف.", "error");
            }
        }
        // 2. User Deletion
        else if (type === 'user') {
            props.onDeleteUser(id);
        }
        // 3. Ad Deletion
        else if (type === 'ad') {
            props.onDeleteAd(id);
        }

        // Close modal
        setDeleteModalState(prev => ({ ...prev, isOpen: false }));
    };

    
    const openAdModalForEdit = (ad: Ad) => {
        setEditingAd(ad);
        setIsAdModalOpen(true);
    };

    const openAdModalForNew = () => {
        setEditingAd(null);
        setIsAdModalOpen(true);
    };

    const handleSaveAd = (ad: Ad) => {
        if(editingAd) {
            props.onUpdateAd(ad);
        } else {
            const { id, updatedAt, ...newAdData } = ad;
            props.onAddAd(newAdData);
        }
        setIsAdModalOpen(false);
    };


    const renderTabContent = () => {
        switch(activeTab) {
            case 'content':
                return <ContentManagementTab 
                            content={allContent} 
                            onEdit={openContentModalForEdit} 
                            onNew={openContentModalForNew} 
                            onRequestDelete={confirmDeleteContent}
                            isLoading={isLoadingContent}
                        />;
            case 'users':
                return <UserManagementTab 
                            users={props.allUsers} 
                            onAddAdmin={props.onAddAdmin} 
                            onRequestDelete={confirmDeleteUser} 
                            addToast={props.addToast} 
                        />;
            case 'ads':
                return <AdsManagementTab 
                            ads={props.allAds} 
                            onNew={openAdModalForNew} 
                            onEdit={openAdModalForEdit} 
                            onRequestDelete={confirmDeleteAd} 
                            onUpdateAd={props.onUpdateAd} 
                        />;
            case 'pinned':
                return <PinnedContentManagementTab 
                            allContent={allContent} 
                            pinnedState={props.pinnedItems} 
                            setPinnedItems={props.onSetPinnedItems} 
                        />;
            case 'themes':
                return <ThemesTab siteSettings={props.siteSettings} onSetSiteSettings={props.onSetSiteSettings} />;
            case 'settings':
                return <SiteSettingsTab siteSettings={props.siteSettings} onSetSiteSettings={props.onSetSiteSettings} allContent={allContent} />;
            case 'analytics':
                return <AnalyticsTab allContent={allContent} allUsers={props.allUsers}/>;
            case 'dashboard':
            default:
                return <DashboardTab stats={{totalMovies, totalSeries, totalUsers}} allContent={allContent} />;
        }
    };

    return (
        <div className="bg-gray-900 min-h-screen p-4 sm:p-6 lg:p-8 pt-4 md:pt-8 text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-row justify-between items-center gap-4 mb-8">
                    <h1 className="text-3xl font-bold">لوحة التحكم</h1>
                    <button onClick={() => props.onSetView('home')} className="bg-gray-700 hover:bg-gray-600 font-bold py-2 px-4 rounded-lg transition-colors self-start sm:self-auto">
                        العودة للموقع
                    </button>
                </div>

                <div className="border-b border-gray-700 mb-8">
                  <div className="flex overflow-x-auto rtl-scroll">
                    {(['dashboard', 'content', 'pinned', 'users', 'ads', 'themes', 'settings', 'analytics'] as AdminTab[]).map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-shrink-0 px-4 md:px-6 py-3 font-semibold transition-colors ${activeTab === tab ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]' : 'text-gray-400 hover:text-white'}`}
                        >
                           { {dashboard: 'نظرة عامة', content: 'المحتوى', pinned: 'المحتوى المثبت', users: 'المستخدمون', ads: 'إدارة الإعلانات', themes: 'المظهر (Themes)', settings: 'إعدادات الموقع', analytics: 'الإحصائيات'}[tab] }
                        </button>
                    ))}
                  </div>
                </div>

                {renderTabContent()}

            </div>
             {isContentModalOpen && (
                <ContentEditModal 
                    content={editingContent} 
                    onClose={() => setIsContentModalOpen(false)} 
                    onSave={handleSaveContent} 
                />
             )}
             {isAdModalOpen && (
                <AdEditModal 
                    ad={editingAd}
                    onClose={() => setIsAdModalOpen(false)}
                    onSave={handleSaveAd}
                />
             )}
             
             <DeleteConfirmationModal 
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={executeDelete}
                title={
                    deleteModalState.type === 'content' ? 'حذف المحتوى' :
                    deleteModalState.type === 'user' ? 'حذف المستخدم' :
                    deleteModalState.type === 'ad' ? 'حذف الإعلان' : 'حذف'
                }
                message={`هل أنت متأكد من حذف "${deleteModalState.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
             />
        </div>
    );
};


const DashboardTab: React.FC<{stats: {totalMovies: number, totalSeries: number, totalUsers: number}, allContent: Content[]}> = ({stats, allContent}) => {
    // Sort by updatedAt to show recently active items (Edited OR Added)
    const recentlyAdded = [...allContent]
        .sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt).getTime();
            return dateB - dateA;
        })
        .slice(0, 5);

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <div className="flex items-center justify-between">
                        <h3 className="text-gray-400 text-sm font-medium">إجمالي الأفلام</h3>
                        <span className="text-2xl">🎬</span>
                    </div>
                    <p className="text-4xl font-bold mt-4 text-white">{stats.totalMovies}</p>
                    <p className="text-xs text-green-400 mt-2">متاح في قاعدة البيانات</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <div className="flex items-center justify-between">
                        <h3 className="text-gray-400 text-sm font-medium">إجمالي المسلسلات</h3>
                         <span className="text-2xl">📺</span>
                    </div>
                    <p className="text-4xl font-bold mt-4 text-white">{stats.totalSeries}</p>
                    <p className="text-xs text-green-400 mt-2">متاح في قاعدة البيانات</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                     <div className="flex items-center justify-between">
                        <h3 className="text-gray-400 text-sm font-medium">المستخدمين المسجلين</h3>
                        <span className="text-2xl">👥</span>
                    </div>
                    <p className="text-4xl font-bold mt-4 text-white">{stats.totalUsers}</p>
                    <p className="text-xs text-blue-400 mt-2">حساب نشط</p>
                </div>
            </div>

            {/* Recently Active Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700">
                    <h3 className="font-bold text-lg">أحدث الأنشطة (إضافة/تعديل)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-gray-300 whitespace-nowrap">
                        <thead className="bg-gray-700/50 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3">العنوان</th>
                                <th className="px-6 py-3">النوع</th>
                                <th className="px-6 py-3">تاريخ التعديل</th>
                                <th className="px-6 py-3">الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentlyAdded.length > 0 ? recentlyAdded.map(item => (
                                <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                                        <img src={item.poster} alt="" className="w-8 h-10 object-cover rounded"/>
                                        {item.title}
                                    </td>
                                    <td className="px-6 py-4">{item.type === 'movie' ? 'فيلم' : 'مسلسل'}</td>
                                    <td className="px-6 py-4 dir-ltr text-right">
                                        {new Date(item.updatedAt || item.createdAt).toLocaleDateString('en-GB')}
                                        <span className="text-xs text-gray-500 block">{new Date(item.updatedAt || item.createdAt).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs ${item.visibility === 'general' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {item.visibility === 'general' ? 'عام' : 'مقيد'}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-500">لا يوجد محتوى حديث</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const ContentManagementTab: React.FC<{
    content: Content[], 
    onNew: () => void, 
    onEdit: (c: Content) => void, 
    onRequestDelete: (id: string, title: string) => void,
    isLoading: boolean 
}> = ({content, onNew, onEdit, onRequestDelete, isLoading}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredContent = content
      .filter(c => (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-800 p-4 rounded-xl mb-6">
                <input 
                    type="text"
                    placeholder="ابحث عن فيلم أو مسلسل..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-auto sm:max-w-sm bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-white"
                />
                <button onClick={onNew} className="w-full sm:w-auto bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black font-bold py-2 px-4 rounded-lg hover:bg-white transition-colors">إضافة محتوى</button>
            </div>
            <div className="overflow-x-auto bg-gray-800 rounded-xl">
                {isLoading ? (
                     <div className="text-center py-20 text-gray-400">
                        جاري تحميل المحتوى من قاعدة البيانات...
                     </div>
                ) : (
                <table className="min-w-full text-sm text-right text-gray-300 whitespace-nowrap">
                    <thead className="bg-gray-700 text-xs uppercase">
                        <tr>
                            <th scope="col" className="px-6 py-3">العنوان</th>
                            <th scope="col" className="px-6 py-3">النوع</th>
                            <th scope="col" className="px-6 py-3">الرؤية</th>
                            <th scope="col" className="px-6 py-3">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredContent.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={4} className="text-center py-10 text-gray-500">
                                    لا يوجد محتوى. قم بإضافة أول فيلم أو مسلسل.
                                </td>
                            </tr>
                        )}
                        {filteredContent.map(c => (
                            <tr key={c.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                                    <img src={c.poster} alt={c.title} className="w-10 h-14 object-cover rounded bg-gray-900"/>
                                    <span>{c.title}</span>
                                </td>
                                <td className="px-6 py-4">{c.type === 'movie' ? 'فيلم' : 'مسلسل'}</td>
                                <td className="px-6 py-4">{c.visibility}</td>
                                <td className="px-6 py-4 space-x-2 space-x-reverse">
                                    <button onClick={() => onEdit(c)} className="font-medium text-green-400 hover:underline">تعديل</button>
                                    <button onClick={() => onRequestDelete(c.id, c.title)} className="font-medium text-red-400 hover:underline">حذف</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                )}
            </div>
        </div>
    );
};

const UserManagementTab: React.FC<{
    users: User[], 
    onAddAdmin: (admin: Omit<User, 'id' | 'role' | 'profiles'>) => Promise<void>, 
    onRequestDelete: (userId: string, userName: string) => void, 
    addToast: AdminPanelProps['addToast']
}> = ({users, onAddAdmin, onRequestDelete, addToast}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');

    const handleAddAdminSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email && password) {
            try {
                await onAddAdmin({email, password, firstName});
                setEmail('');
                setPassword('');
                setFirstName('');
                addToast('تمت إضافة المستخدم بنجاح.', 'success');
            } catch (error: any) {
                addToast(error.message, 'error');
            }
        }
    };
    
    return (
    <div className="space-y-8">
        <div className="bg-gray-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold mb-4 text-[var(--color-accent)]">إضافة مستخدم جديد</h3>
            <form onSubmit={handleAddAdminSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="الاسم الأول" className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2" required/>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2" required/>
                <div className="flex gap-4">
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2" required/>
                    <button type="submit" className="bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black font-bold py-2 px-4 rounded-lg hover:bg-white transition-colors">إضافة</button>
                </div>
            </form>
        </div>
        <div className="overflow-x-auto bg-gray-800 rounded-xl">
            <table className="min-w-full text-sm text-right text-gray-300 whitespace-nowrap">
                <thead className="bg-gray-700 text-xs uppercase">
                    <tr>
                        <th scope="col" className="px-6 py-3">الاسم</th>
                        <th scope="col" className="px-6 py-3">البريد الإلكتروني</th>
                        <th scope="col" className="px-6 py-3">الدور</th>
                        <th scope="col" className="px-6 py-3">إجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="px-6 py-4 font-medium text-white">
                            {user.firstName} {user.lastName || ''}
                            </td>
                            <td className="px-6 py-4">{user.email}</td>
                            <td className="px-6 py-4">{user.role === UserRole.Admin ? 'مسؤول' : 'مستخدم'}</td>
                            <td className="px-6 py-4">
                               <button onClick={() => onRequestDelete(user.id, user.email)} className="font-medium text-red-400 hover:underline">حذف</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
    );
};

const PinnedContentManagementTab: React.FC<{
    allContent: Content[];
    pinnedState: PinnedContentState;
    setPinnedItems: (pageKey: PageKey, items: PinnedItem[]) => void; 
}> = ({ allContent, pinnedState, setPinnedItems }) => {
    const [selectedPage, setSelectedPage] = useState<PageKey>('home');
    const [searchTerm, setSearchTerm] = useState('');
    const [localPinnedItems, setLocalPinnedItems] = useState<PinnedItem[]>([]);
    const [draggedItem, setDraggedItem] = useState<PinnedItem | null>(null);
    const [dragOverItem, setDragOverItem] = useState<PinnedItem | null>(null);

    useEffect(() => {
        setLocalPinnedItems(pinnedState[selectedPage] || []);
    }, [pinnedState, selectedPage]);
    
    const isDirty = JSON.stringify(localPinnedItems) !== JSON.stringify(pinnedState[selectedPage] || []);

    const pinnedContentDetails = useMemo(() => localPinnedItems.map(pin => {
        const content = allContent.find(c => c.id === pin.contentId);
        return content ? { ...pin, contentDetails: content } : null;
    }).filter((item): item is { contentDetails: Content } & PinnedItem => item !== null), [localPinnedItems, allContent]);

    const availableContent = useMemo(() => {
        const pinnedIds = new Set(localPinnedItems.map(p => p.contentId));
        let filtered = allContent.filter(c => !pinnedIds.has(c.id));
        
        if (selectedPage === 'movies') {
            filtered = filtered.filter(c => c.type === ContentType.Movie);
        } else if (selectedPage === 'series') {
             filtered = filtered.filter(c => c.type === ContentType.Series);
        } else if (selectedPage === 'kids') {
             filtered = filtered.filter(c => c.categories.includes('افلام أنميشن') || c.visibility === 'kids');
        } else if (selectedPage === 'ramadan') {
             filtered = filtered.filter(c => c.categories.includes('رمضان'));
        } else if (selectedPage === 'soon') {
             filtered = filtered.filter(c => c.categories.includes('قريباً'));
        }

        return filtered.filter(c => (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()));
    }, [allContent, localPinnedItems, searchTerm, selectedPage]);

    const handlePin = (contentId: string) => {
        // FIX: Use pinnedContentDetails.length (valid/visible items) instead of localPinnedItems.length (raw/potentially stale items)
        // This resolves the logic bug where ghost items (deleted content) were counting towards the limit.
        if (pinnedContentDetails.length >= 10) {
            alert('يمكنك تثبيت 10 عناصر كحد أقصى.');
            return;
        }
        setLocalPinnedItems([...localPinnedItems, { contentId, bannerNote: '' }]);
    };

    const handleUnpin = (contentId: string) => {
        setLocalPinnedItems(localPinnedItems.filter(p => p.contentId !== contentId));
    };
    
    const handleBannerNoteChange = (contentId: string, note: string) => {
        setLocalPinnedItems(localPinnedItems.map(p => p.contentId === contentId ? { ...p, bannerNote: note } : p));
    };
    
    const onDragStart = (e: React.DragEvent<HTMLLIElement>, item: PinnedItem) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e: React.DragEvent<HTMLLIElement>, item: PinnedItem) => {
        e.preventDefault();
        if (draggedItem?.contentId !== item.contentId) {
            setDragOverItem(item);
        }
    };
    
    const onDrop = () => {
        if (!draggedItem || !dragOverItem) return;

        const currentItems = [...localPinnedItems];
        const fromIndex = currentItems.findIndex(p => p.contentId === draggedItem.contentId);
        const toIndex = currentItems.findIndex(p => p.contentId === dragOverItem.contentId);

        if (fromIndex === -1 || toIndex === -1) return;

        const updatedItems = [...currentItems];
        const [movedItem] = updatedItems.splice(fromIndex, 1);
        updatedItems.splice(toIndex, 0, movedItem);
        
        setLocalPinnedItems(updatedItems);
        
        setDraggedItem(null);
        setDragOverItem(null);
    };

    const onDragEnd = () => {
        setDraggedItem(null);
        setDragOverItem(null);
    };

    // Removed 'kids' from available pin pages to remove "Our Choice/Top 10" capability
    const pageLabels: Record<string, string> = {
        home: 'الصفحة الرئيسية',
        movies: 'صفحة الأفلام',
        series: 'صفحة المسلسلات',
        // kids: 'صفحة الأطفال', // REMOVED
        ramadan: 'صفحة رمضان',
        soon: 'صفحة قريباً'
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3 bg-gray-800 p-4 rounded-xl mb-2">
                <h3 className="text-gray-400 mb-2 text-sm">اختر الصفحة التي تريد تعديل المحتوى المثبت فيها:</h3>
                <div className="flex flex-wrap gap-2">
                    {(Object.keys(pageLabels) as PageKey[]).map(key => (
                        <button
                            key={key}
                            onClick={() => setSelectedPage(key)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedPage === key ? 'bg-[var(--color-accent)] text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                        >
                            {pageLabels[key]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-accent)]">المثبت في: {pageLabels[selectedPage]}</h3>
                    <p className="text-sm text-gray-400">اسحب وأفلت لإعادة الترتيب، أو استخدم الأزرار.</p>
                  </div>
                  <button onClick={() => setPinnedItems(selectedPage, localPinnedItems)} disabled={!isDirty} className="bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black font-bold py-2 px-4 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    حفظ التغييرات
                  </button>
                </div>
                {pinnedContentDetails.length > 0 ? (
                    <ul onDrop={onDrop} onDragLeave={() => setDragOverItem(null)} className="space-y-3">
                        {pinnedContentDetails.map((item, index) => (
                            <li 
                                key={item.contentId}
                                draggable
                                onDragStart={(e) => onDragStart(e, item)}
                                onDragOver={(e) => onDragOver(e, item)}
                                onDragEnd={onDragEnd}
                                className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-200 cursor-grab ${draggedItem?.contentId === item.contentId ? 'opacity-50' : ''} ${dragOverItem?.contentId === item.contentId ? 'bg-gray-600' : 'bg-gray-700'}`}
                            >
                                <div className="flex flex-col items-center justify-center w-8 text-gray-500 cursor-grab">
                                     <div className="w-1 h-1 bg-gray-500 rounded-full mb-0.5"></div>
                                     <div className="w-1 h-1 bg-gray-500 rounded-full mb-0.5"></div>
                                     <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                                </div>
                                <img src={item.contentDetails.poster} alt="" className="w-10 h-14 object-cover rounded bg-gray-800" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm truncate">{item.contentDetails.title}</p>
                                    <input 
                                        type="text" 
                                        placeholder="نص مميز (اختياري)" 
                                        value={item.bannerNote || ''} 
                                        onChange={(e) => handleBannerNoteChange(item.contentId, e.target.value)}
                                        className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs w-full mt-1 text-gray-300"
                                    />
                                </div>
                                <button onClick={() => handleUnpin(item.contentId)} className="text-red-400 hover:text-red-300 p-2">
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-10 text-gray-500 border border-dashed border-gray-700 rounded-xl">
                        لا يوجد محتوى مثبت في هذه الصفحة.
                    </div>
                )}
            </div>

            <div className="bg-gray-800 p-6 rounded-xl h-fit">
                <h3 className="font-bold text-[var(--color-primary-to)] mb-4">إضافة محتوى للمثبت</h3>
                <input 
                    type="text" 
                    placeholder="ابحث لإضافة..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 mb-4 text-white"
                />
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {availableContent.slice(0, 20).map(c => (
                         <div key={c.id} className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded-lg transition-colors">
                            <img src={c.poster} alt="" className="w-8 h-10 object-cover rounded bg-gray-900" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-white">{c.title}</p>
                                <p className="text-xs text-gray-500">{c.releaseYear}</p>
                            </div>
                            <button onClick={() => handlePin(c.id)} className="text-[var(--color-accent)] hover:text-white font-bold text-xl px-2">+</button>
                         </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const AdsManagementTab: React.FC<{
    ads: Ad[];
    onNew: () => void;
    onEdit: (ad: Ad) => void;
    onRequestDelete: (id: string, title: string) => void;
    onUpdateAd: (ad: Ad) => void;
}> = ({ ads, onNew, onEdit, onRequestDelete, onUpdateAd }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-6 bg-gray-800 p-4 rounded-xl">
                <h3 className="text-lg font-bold text-white">إدارة الإعلانات</h3>
                <button onClick={onNew} className="bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black font-bold py-2 px-4 rounded-lg hover:bg-white transition-colors">إضافة إعلان جديد</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ads.map(ad => (
                    <div key={ad.id} className="bg-gray-800 border border-gray-700 p-4 rounded-xl flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-white">{ad.title}</h4>
                                <span className={`px-2 py-0.5 rounded text-xs ${ad.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {ad.status === 'active' ? 'نشط' : 'معطل'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">المكان: {adPlacementLabels[ad.placement]}</p>
                            <div className="bg-gray-900 p-2 rounded text-xs text-gray-500 font-mono truncate mb-4">
                                {ad.code}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                            <ToggleSwitch checked={ad.status === 'active'} onChange={(c) => onUpdateAd({...ad, status: c ? 'active' : 'disabled'})} className="mr-auto scale-75" />
                            <button onClick={() => onEdit(ad)} className="text-green-400 hover:text-green-300 text-sm font-bold">تعديل</button>
                            <button onClick={() => onRequestDelete(ad.id, ad.title)} className="text-red-400 hover:text-red-300 text-sm font-bold">حذف</button>
                        </div>
                    </div>
                ))}
                {ads.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 border border-dashed border-gray-700 rounded-xl">
                        لا توجد إعلانات.
                    </div>
                )}
            </div>
        </div>
    );
}

const ThemesTab: React.FC<{
    siteSettings: SiteSettings;
    onSetSiteSettings: (s: SiteSettings) => void;
}> = ({ siteSettings, onSetSiteSettings }) => {
    
    const changeTheme = (theme: ThemeType) => {
        // Update setting - App.tsx will handle side effects (like modifying document.body and updating backward compat properties)
        onSetSiteSettings({ ...siteSettings, activeTheme: theme });
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-fade-in-up">
             <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-6">
                <h3 className="text-lg font-bold text-[var(--color-primary-to)] mb-4 border-b border-gray-700 pb-4">إعدادات المظهر (Themes)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Default Theme Card */}
                    <div 
                        onClick={() => changeTheme('default')}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${siteSettings.activeTheme === 'default' ? 'border-[#00A7F8] bg-[#00A7F8]/10' : 'border-gray-600 hover:border-gray-500'}`}
                    >
                        <div className="h-20 bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] rounded-lg mb-4 shadow-lg"></div>
                        <h4 className="font-bold text-white text-lg">الافتراضي (السايبر)</h4>
                        <p className="text-xs text-gray-400 mt-2">الثيم الأساسي باللون الأزرق والأخضر.</p>
                        {siteSettings.activeTheme === 'default' && <div className="mt-2 text-[#00A7F8] text-xs font-bold">✓ مفعل</div>}
                    </div>

                    {/* Cosmic Teal Theme Card (NEW) */}
                    <div 
                        onClick={() => changeTheme('cosmic-teal')}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${siteSettings.activeTheme === 'cosmic-teal' ? 'border-[#35F18B] bg-[#35F18B]/10' : 'border-gray-600 hover:border-gray-500'}`}
                    >
                        <div className="h-20 bg-gradient-to-br from-[#35F18B] to-[#2596be] rounded-lg mb-4 shadow-lg flex items-center justify-center text-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80')] opacity-50 bg-cover"></div>
                            <span className="relative z-10">✨</span>
                        </div>
                        <h4 className="font-bold text-white text-lg">الكوني (Cosmic Teal)</h4>
                        <p className="text-xs text-gray-400 mt-2">تصميم عصري بألوان الأخضر الزاهي والخلفية الكونية.</p>
                        {siteSettings.activeTheme === 'cosmic-teal' && <div className="mt-2 text-[#35F18B] text-xs font-bold">✓ مفعل</div>}
                    </div>

                    {/* Ramadan Theme Card */}
                    <div 
                        onClick={() => changeTheme('ramadan')}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${siteSettings.activeTheme === 'ramadan' ? 'border-amber-500 bg-amber-500/10' : 'border-gray-600 hover:border-gray-500'}`}
                    >
                        <div className="h-20 bg-gradient-to-br from-[#D4AF37] to-[#F59E0B] rounded-lg mb-4 shadow-lg flex items-center justify-center text-2xl">🌙</div>
                        <h4 className="font-bold text-white text-lg">رمضان الذهبي</h4>
                        <p className="text-xs text-gray-400 mt-2">ألوان ذهبية دافئة تناسب الأجواء الرمضانية.</p>
                        {siteSettings.activeTheme === 'ramadan' && <div className="mt-2 text-amber-500 text-xs font-bold">✓ مفعل</div>}
                    </div>

                    {/* Eid Theme Card */}
                    <div 
                        onClick={() => changeTheme('eid')}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${siteSettings.activeTheme === 'eid' ? 'border-purple-500 bg-purple-500/10' : 'border-gray-600 hover:border-gray-500'}`}
                    >
                        <div className="h-20 bg-gradient-to-br from-[#6A0DAD] to-[#C0C0C0] rounded-lg mb-4 shadow-lg flex items-center justify-center text-2xl">🎉</div>
                        <h4 className="font-bold text-white text-lg">العيد (بنفسجي/فضي)</h4>
                        <p className="text-xs text-gray-400 mt-2">ألوان احتفالية مبهجة للمناسبات.</p>
                        {siteSettings.activeTheme === 'eid' && <div className="mt-2 text-purple-500 text-xs font-bold">✓ مفعل</div>}
                    </div>

                    {/* iOS Theme Card */}
                    <div 
                        onClick={() => changeTheme('ios')}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${siteSettings.activeTheme === 'ios' ? 'border-[#00C6FF] bg-[#00C6FF]/10' : 'border-gray-600 hover:border-gray-500'}`}
                    >
                        <div className="h-20 bg-gradient-to-r from-[#00C6FF] to-[#0072FF] rounded-lg mb-4 shadow-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
                        </div>
                        <h4 className="font-bold text-white text-lg">iOS Glass</h4>
                        <p className="text-xs text-gray-400 mt-2">تصميم زجاجي عصري مع تدرجات سماوية.</p>
                        {siteSettings.activeTheme === 'ios' && <div className="mt-2 text-[#00C6FF] text-xs font-bold">✓ مفعل</div>}
                    </div>

                    {/* Night City Theme Card */}
                    <div 
                        onClick={() => changeTheme('night-city')}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${siteSettings.activeTheme === 'night-city' ? 'border-[#FF00FF] bg-[#FF00FF]/10' : 'border-gray-600 hover:border-gray-500'}`}
                    >
                        <div className="h-20 bg-black rounded-lg mb-4 shadow-[0_0_15px_#FF00FF] relative border border-[#00FFFF]">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#FF00FF]/30 to-[#00FFFF]/30"></div>
                        </div>
                        <h4 className="font-bold text-white text-lg">المدينة الليلية (Night City)</h4>
                        <p className="text-xs text-gray-400 mt-2">ألوان نيون حيوية ومظهر مستقبلي.</p>
                        {siteSettings.activeTheme === 'night-city' && <div className="mt-2 text-[#FF00FF] text-xs font-bold">✓ مفعل</div>}
                    </div>

                    {/* Serene Nature Theme Card */}
                    <div 
                        onClick={() => changeTheme('nature')}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${siteSettings.activeTheme === 'nature' ? 'border-[#8FBC8F] bg-[#8FBC8F]/10' : 'border-gray-600 hover:border-gray-500'}`}
                    >
                        <div className="h-20 bg-gradient-to-br from-[#2F4F4F] to-[#8FBC8F] rounded-lg mb-4 shadow-lg"></div>
                        <h4 className="font-bold text-white text-lg">الطبيعة الهادئة (Nature)</h4>
                        <p className="text-xs text-gray-400 mt-2">ألوان طبيعية هادئة مستوحاة من الغابات.</p>
                        {siteSettings.activeTheme === 'nature' && <div className="mt-2 text-[#8FBC8F] text-xs font-bold">✓ مفعل</div>}
                    </div>
                </div>
            </div>
        </div>
    )
}

const SiteSettingsTab: React.FC<{
    siteSettings: SiteSettings;
    onSetSiteSettings: (s: SiteSettings) => void;
    allContent: Content[];
}> = ({ siteSettings, onSetSiteSettings, allContent }) => {
    const handleChange = (field: keyof SiteSettings, value: any) => {
        onSetSiteSettings({ ...siteSettings, [field]: value });
    };

    const handleNestedChange = (parent: keyof SiteSettings, child: string, value: any) => {
        onSetSiteSettings({
            ...siteSettings,
            [parent]: { ...(siteSettings[parent] as any), [child]: value }
        });
    };

    const generateSitemap = () => {
        // CHANGED: Use hardcoded production URL instead of window.location.origin
        const baseUrl = 'https://cinematex.vercel.app';
        const date = new Date().toISOString().split('T')[0];
        
        // Parse duration helper (e.g., "1h 30m" -> 5400 seconds)
        const parseDuration = (durationStr?: string | number): number => {
            if (typeof durationStr === 'number') return durationStr * 60; // Assume minutes if number
            if (!durationStr) return 0;
            
            let totalSeconds = 0;
            const hoursMatch = durationStr.match(/(\d+)h/);
            const minutesMatch = durationStr.match(/(\d+)m/);
            
            if (hoursMatch) totalSeconds += parseInt(hoursMatch[1]) * 3600;
            if (minutesMatch) totalSeconds += parseInt(minutesMatch[1]) * 60;
            
            return totalSeconds || 0;
        };

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n`;
        
        // Static Pages
        const staticPages = ['', '/movies', '/series', '/kids', '/ramadan', '/soon', '/about', '/privacy'];
        staticPages.forEach(page => {
            xml += `  <url>\n`;
            xml += `    <loc>${baseUrl}${page}</loc>\n`;
            xml += `    <lastmod>${date}</lastmod>\n`;
            xml += `    <changefreq>daily</changefreq>\n`;
            xml += `    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n`;
            xml += `  </url>\n`;
        });

        // Dynamic Content
        allContent.forEach(item => {
            const slug = item.slug || item.id;
            const prefix = item.type === 'series' ? 'مسلسل' : 'فيلم';
            const url = `${baseUrl}/${prefix}/${slug}`;
            const itemDate = item.updatedAt ? item.updatedAt.split('T')[0] : date;
            const thumbnail = item.backdrop || item.poster || '';
            const desc = (item.description || item.title).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
            const title = item.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

            xml += `  <url>\n`;
            xml += `    <loc>${url}</loc>\n`;
            xml += `    <lastmod>${itemDate}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.7</priority>\n`;
            
            // Video Extension for Movies
            if (item.type === ContentType.Movie) {
                const duration = parseDuration(item.duration);
                xml += `    <video:video>\n`;
                xml += `      <video:thumbnail_loc>${thumbnail.replace(/&/g, '&amp;')}</video:thumbnail_loc>\n`;
                xml += `      <video:title>${title}</video:title>\n`;
                xml += `      <video:description>${desc.substring(0, 2000)}</video:description>\n`;
                if (duration > 0) xml += `      <video:duration>${duration}</video:duration>\n`;
                xml += `      <video:publication_date>${item.releaseYear}-01-01T00:00:00+00:00</video:publication_date>\n`;
                xml += `      <video:family_friendly>${item.visibility === 'kids' || item.visibility === 'general' ? 'yes' : 'no'}</video:family_friendly>\n`;
                xml += `    </video:video>\n`;
            }
            xml += `  </url>\n`;

            // Deep Linking for Episodes (Series)
            if (item.type === ContentType.Series && item.seasons) {
                item.seasons.forEach(season => {
                    season.episodes.forEach((ep, index) => {
                        // Construct Deep Link: /مسلسل/slug/الموسم/S/الحلقة/E
                        // Note: Episode index is 1-based in UI usually, checking logic from DetailPage
                        const epNum = index + 1; 
                        const epUrl = `${baseUrl}/مسلسل/${slug}/الموسم/${season.seasonNumber}/الحلقة/${epNum}`;
                        const epTitle = `${title} - الموسم ${season.seasonNumber} الحلقة ${epNum}`;
                        const epThumb = ep.thumbnail || thumbnail;
                        const epDuration = ep.duration ? ep.duration * 60 : 0; // Minutes to seconds

                        xml += `  <url>\n`;
                        xml += `    <loc>${epUrl}</loc>\n`;
                        xml += `    <lastmod>${itemDate}</lastmod>\n`;
                        xml += `    <changefreq>weekly</changefreq>\n`;
                        xml += `    <priority>0.6</priority>\n`;
                        xml += `    <video:video>\n`;
                        xml += `      <video:thumbnail_loc>${epThumb.replace(/&/g, '&amp;')}</video:thumbnail_loc>\n`;
                        xml += `      <video:title>${epTitle}</video:title>\n`;
                        xml += `      <video:description>${desc.substring(0, 2000)}</video:description>\n`; // Fallback to series desc if no ep desc
                        if (epDuration > 0) xml += `      <video:duration>${epDuration}</video:duration>\n`;
                        xml += `      <video:publication_date>${item.releaseYear}-01-01T00:00:00+00:00</video:publication_date>\n`;
                        xml += `    </video:video>\n`;
                        xml += `  </url>\n`;
                    });
                });
            }
        });

        xml += `</urlset>`;

        // Create Blob and download
        const blob = new Blob([xml], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sitemap.xml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* New SEO Section */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-[var(--color-primary-to)] mb-4">تحسين محركات البحث (SEO)</h3>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                    <div>
                        <h4 className="font-bold text-white mb-1">ملف خريطة الموقع (Sitemap.xml)</h4>
                        <p className="text-xs text-gray-400">توليد ملف sitemap.xml متقدم يشمل {allContent.length} عمل وروابط جميع الحلقات مع بيانات الفيديو (Video Schema) لتقديمه إلى Google.</p>
                    </div>
                    <button 
                        onClick={generateSitemap}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg flex items-center gap-2 whitespace-nowrap"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        تنزيل الملف
                    </button>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4">
                <h3 className="text-lg font-bold text-[var(--color-primary-to)] mb-4">أوضاع الموقع</h3>
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <span>وضع الصيانة (يغلق الموقع للزوار)</span>
                    <ToggleSwitch checked={siteSettings.is_maintenance_mode_enabled} onChange={(c) => handleChange('is_maintenance_mode_enabled', c)} />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <span>تفعيل الإعلانات في الموقع</span>
                    <ToggleSwitch checked={siteSettings.adsEnabled} onChange={(c) => handleChange('adsEnabled', c)} />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <span>عرض كاروسيل رمضان في الصفحة الرئيسية</span>
                    <ToggleSwitch checked={siteSettings.isShowRamadanCarousel} onChange={(c) => handleChange('isShowRamadanCarousel', c)} />
                </div>
            </div>

            {/* Top 10 Settings Section */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4">
                <h3 className="text-lg font-bold text-[var(--color-primary-to)] mb-4">إعدادات قوائم أفضل 10 (Top 10)</h3>
                <p className="text-xs text-gray-400 -mt-3 mb-3">تحكم في ظهور شريط "أفضل 10 أعمال" (المحتوى المثبت) في الصفحات المختلفة.</p>
                
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <span>عرض في الصفحة الرئيسية</span>
                    <ToggleSwitch checked={siteSettings.showTop10Home} onChange={(c) => handleChange('showTop10Home', c)} />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <span>عرض في صفحة الأفلام</span>
                    <ToggleSwitch checked={siteSettings.showTop10Movies} onChange={(c) => handleChange('showTop10Movies', c)} />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <span>عرض في صفحة المسلسلات</span>
                    <ToggleSwitch checked={siteSettings.showTop10Series} onChange={(c) => handleChange('showTop10Series', c)} />
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-[var(--color-primary-to)]">شريط الإعلانات العلوي (ShoutBar)</h3>
                    <ToggleSwitch checked={siteSettings.shoutBar.isVisible} onChange={(c) => handleNestedChange('shoutBar', 'isVisible', c)} />
                </div>
                <input 
                    value={siteSettings.shoutBar.text}
                    onChange={(e) => handleNestedChange('shoutBar', 'text', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    placeholder="نص الشريط المتحرك..."
                />
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-[var(--color-primary-to)] mb-4">روابط التواصل الاجتماعي</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(siteSettings.socialLinks).map((key) => (
                        <div key={key}>
                             <label className="block text-xs text-gray-400 mb-1 capitalize">{key}</label>
                             <input 
                                value={(siteSettings.socialLinks as any)[key]}
                                onChange={(e) => handleNestedChange('socialLinks', key, e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                             />
                        </div>
                    ))}
                </div>
            </div>

             <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-[var(--color-primary-to)]">العد التنازلي (رمضان / مناسبات)</h3>
                    <ToggleSwitch checked={siteSettings.isCountdownVisible} onChange={(c) => handleChange('isCountdownVisible', c)} />
                </div>
                <label className="block text-xs text-gray-400 mb-1">تاريخ الانتهاء</label>
                <input 
                    type="datetime-local"
                    value={siteSettings.countdownDate.substring(0, 16)}
                    onChange={(e) => handleChange('countdownDate', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                 <h3 className="text-lg font-bold text-[var(--color-primary-to)] mb-4">سياسة الخصوصية</h3>
                 <textarea 
                    value={siteSettings.privacyPolicy}
                    onChange={(e) => handleChange('privacyPolicy', e.target.value)}
                    className="w-full h-40 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm"
                 />
            </div>
        </div>
    );
};

const AnalyticsTab: React.FC<{
    allContent: Content[];
    allUsers: User[];
}> = ({ allContent, allUsers }) => {
    const contentByType = {
        movies: allContent.filter(c => c.type === 'movie').length,
        series: allContent.filter(c => c.type === 'series').length
    };

    const usersByRole = {
        admin: allUsers.filter(u => u.role === 'admin').length,
        user: allUsers.filter(u => u.role === 'user').length
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">توزيع المحتوى</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span>الأفلام</span>
                        <span className="font-bold text-[var(--color-accent)]">{contentByType.movies}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-[var(--color-accent)] h-2 rounded-full" style={{ width: `${(contentByType.movies / allContent.length) * 100}%` }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <span>المسلسلات</span>
                        <span className="font-bold text-[var(--color-primary-to)]">{contentByType.series}</span>
                    </div>
                     <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-[var(--color-primary-to)] h-2 rounded-full" style={{ width: `${(contentByType.series / allContent.length) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">المستخدمين</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span>المسؤولين</span>
                        <span className="font-bold text-yellow-400">{usersByRole.admin}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span>المستخدمين العاديين</span>
                        <span className="font-bold text-white">{usersByRole.user}</span>
                    </div>
                    <div className="pt-4 border-t border-gray-700">
                        <p className="text-sm text-gray-400">إجمالي المستخدمين المسجلين: <span className="text-white font-bold">{allUsers.length}</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminPanel;