
import React, { useState, useEffect, useRef } from 'react';
import { db, getReleaseSchedules, deleteReleaseSchedule, deleteBroadcastNotification, deleteReport, deleteContentRequest } from '../../firebase'; 
import type { Content, User, Ad, PinnedItem, SiteSettings, View, PinnedContentState, Top10State, PageKey, Story } from '../types';
import { ContentType, UserRole } from '../types';
import ContentEditModal from './ContentEditModal'; 
import AdEditModal from '../ads/AdEditModal';
import DeleteConfirmationModal from '../shared/DeleteConfirmationModal';
import SEO from '../shared/SeoMeta';
import ShortcutsPage from '../pages/ShortcutsPage';

// Import split components
import DashboardTab from './DashboardTab';
import ContentManagementTab from './ContentManagementTab';
import UserManagementTab from './UserManagementTab';
import RequestsTab from './RequestsTab';
import ReportsManagementTab from './ReportsManagementTab';
import AdsManagementTab from './AdsManagementTab';
import PinnedContentManagementTab from './PinnedContentManagementTab';
import Top10ManagerTab from './Top10ManagerTab';
import ThemesTab from './ThemesTab';
import SiteSettingsTab from './SiteSettingsTab';
import NotificationTab from './NotificationTab';
import AnalyticsTab from './AnalyticsTab';
import AlertsTab from './AlertsTab';
import AppConfigTab from './AppConfigTab';
import PeopleManagerTab from './PeopleManagerTab';
import ContentRadarTab from './ContentRadarTab';
import StartupAdTab from './StartupAdTab';
import PromoBannersTab from './PromoBannersTab';
import ManageStories from '../home/ManageStories';
import ServersManagementTab from './ServersManagementTab';
import MostViewedTab from './MostViewedTab';

// Import Icons
import { 
    HomeIcon, FilmIcon, StarIcon, TrophyIcon, UsersIcon, InboxIcon, 
    FlagIcon, MegaphoneIcon, PaintBrushIcon, CogIcon, ChartBarIcon, 
    PlayCircleIcon, DevicePhoneMobileIcon, UserGroupIcon, MenuIcon, 
    MapIcon, ExitIcon, BellIcon
} from './AdminIcons';

const ServerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
);

const KeyboardIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm2 4h2v2H5V9zm4 0h2v2H9V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9zM5 13h14v2H5v-2z" />
    </svg>
);

type AdminTab = 'dashboard' | 'content' | 'most_viewed' | 'servers_domains' | 'content_radar' | 'top_content' | 'top10' | 'stories' | 'people' | 'users' | 'requests' | 'reports' | 'ads' | 'startup_ad' | 'promo_banners' | 'themes' | 'settings' | 'analytics' | 'notifications' | 'alerts' | 'app_config' | 'shortcuts';

interface RadarAlert {
    id: string;
    message: string;
}

interface AdminPanelProps {
  allUsers: User[];
  allAds: Ad[];
  pinnedItems: PinnedContentState;
  top10Items: Top10State;
  stories: Story[];
  siteSettings: SiteSettings;
  onSetSiteSettings: (settings: SiteSettings) => void;
  onSetPinnedItems: (pageKey: PageKey, items: PinnedItem[]) => void;
  onSetTop10Items: (pageKey: PageKey, items: PinnedItem[]) => void;
  onSetView: (view: View) => void;
  onUpdateAd: (ad: Ad) => void;
  onDeleteAd: (adId: string) => void;
  onDeleteContent?: (contentId: string) => void;
  onAddAd: (ad: Omit<Ad, 'id' | 'updatedAt'>) => void;
  onAddAdmin: (admin: Omit<User, 'id' | 'role' | 'profiles'>) => Promise<void>;
  onDeleteUser: (userId: string) => void;
  onContentChanged: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
    const [activeTab, setActiveTab] = useState<AdminTab>(() => {
        const saved = localStorage.getItem('cinematix_admin_active_tab');
        return (saved as AdminTab) || 'dashboard';
    });
    
    const [isContentModalOpen, setIsContentModalOpen] = useState(false);
    const [editingContent, setEditingContent] = useState<Content | null>(null);
    const [isAdModalOpen, setIsAdModalOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<Ad | null>(null);
    const [allContent, setAllContent] = useState<Content[]>([]);
    const [isLoadingContent, setIsLoadingContent] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [radarCount, setRadarCount] = useState(0);
    const [radarAlerts, setRadarAlerts] = useState<RadarAlert[]>([]);
    const [dismissedAlerts, setDismissedAlerts] = useState<string[]>(() => {
        const saved = localStorage.getItem('cinematix_dismissed_radar_alerts');
        return saved ? JSON.parse(saved) : [];
    });

    // مفتاح لتنشيط تحديث المكونات التابعة
    const [contentRefreshKey, setContentRefreshKey] = useState(0);

    const prevRadarCountRef = useRef(0);
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; type: 'content' | 'user' | 'ad' | 'pinned' | 'story' | 'broadcast' | 'report' | 'radar' | 'request'; id: string; title?: string; meta?: any; }>({ isOpen: false, type: 'content', id: '' });

    useEffect(() => {
        localStorage.setItem('cinematix_admin_active_tab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        localStorage.setItem('cinematix_dismissed_radar_alerts', JSON.stringify(dismissedAlerts));
    }, [dismissedAlerts]);

    useEffect(() => {
        if (radarCount > prevRadarCountRef.current) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(e => console.debug("Audio play blocked", e));
        }
        prevRadarCountRef.current = radarCount;
    }, [radarCount]);

    const triggerScheduledNotificationsIfNeeded = async (contentData: Content[]) => {
        const users = props.allUsers;
        if (!users || users.length === 0) return;
        const now = new Date();
        let updatedCount = 0;

        for (const content of contentData) {
            // Case 1: Standalone content (Movie, etc.) is scheduled and has passed its release time
            if (content.isScheduled && content.scheduledAt) {
                const schedDate = new Date(content.scheduledAt);
                if (schedDate <= now) {
                    const shouldNotify = content.notifyOnPublish !== false && !content.notificationSent;
                    
                    console.log(`[Cinematix] Publishing scheduled content: ${content.title} (Notify: ${shouldNotify})`);
                    
                    // Update DB to mark as published (live)
                    await db.collection("content").doc(content.id).update({
                        isScheduled: false,
                        notificationSent: shouldNotify ? true : content.notificationSent,
                        updatedAt: new Date().toISOString()
                    });
                    content.isScheduled = false;

                    if (shouldNotify) {
                        content.notificationSent = true;
                        // Send FCM push notification
                        try {
                            const broadcastId = String(Date.now());
                            const targetUrl = `/${content.type}/${content.slug || content.id}`;
                            const title = `متاح الآن! شاهد ${content.title} 🎬`;
                            const body = `أصبح فيلم ${content.title} متاحاً الآن للمشاهدة المباشرة بدقة عالية على سينماتيكس.`;
                            const image = content.backdrop || content.poster || '';

                            await fetch('/api/send-notification', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    title,
                                    body,
                                    image,
                                    targetUrl,
                                    type: 'new_content',
                                    topic: 'all_users',
                                    contentId: content.id,
                                }),
                            });

                            // Log internal notifications
                            const batch = db.batch();
                            users.forEach((user: any) => {
                                const notifRef = db.collection('notifications').doc();
                                batch.set(notifRef, {
                                    userId: user.id,
                                    title,
                                    body,
                                    type: 'new_content',
                                    isRead: false,
                                    createdAt: new Date().toISOString(),
                                    targetUrl,
                                    imageUrl: image || undefined,
                                    broadcastId
                                });
                            });

                            // Log broadcast history
                            const historyRef = db.collection('broadcast_history').doc(broadcastId);
                            batch.set(historyRef, {
                                title, body, type: 'new_content', 
                                imageUrl: image || null, 
                                targetUrl: targetUrl || null,
                                createdAt: new Date().toISOString(),
                                recipientCount: users.length,
                                contentId: content.id,
                                isAutoScheduled: true
                            });

                            await batch.commit();
                            updatedCount++;
                        } catch (err) {
                            console.error(`Failed to send notification for ${content.title}:`, err);
                        }
                    }
                }
            }

            // Case 2: Episodes of a Series/Program are scheduled and have passed their release time
            if (content.seasons && (content.type === ContentType.Series || content.type === ContentType.Program)) {
                let hasChanges = false;
                const cleanSeasons = content.seasons.map(s => ({
                    ...s,
                    episodes: s.episodes.map(ep => {
                        if (ep.isScheduled && ep.scheduledAt) {
                            const schedDate = new Date(ep.scheduledAt);
                            if (schedDate <= now) {
                                ep.isScheduled = false; // Now live!
                                hasChanges = true;
                                if (ep.notifyOnPublish !== false && !ep.notificationSent) {
                                    ep.notificationSent = true;
                                }
                            }
                        }
                        return ep;
                    })
                }));

                if (hasChanges) {
                    // Update in database
                    await db.collection("content").doc(content.id).update({
                        seasons: cleanSeasons,
                        updatedAt: new Date().toISOString()
                    });

                    // Send notification for each newly unlocked episode
                    for (const season of cleanSeasons) {
                        for (const ep of season.episodes) {
                            // Find matching original episode to see if it was just unlocked
                            const origSeason = content.seasons.find(s => s.id === season.id);
                            const origEp = origSeason?.episodes.find(e => e.id === ep.id);
                            
                            if (ep.notificationSent && (!origEp || !origEp.notificationSent)) {
                                try {
                                    const broadcastId = String(Date.now());
                                    const extractEpNo = (t: string | undefined): number => {
                                        if (!t) return 0;
                                        const explicitMatch = t.match(/(?:الحلقة|حلقة|ep|episode|الـحـلـقـة|الفصل|فصل|الاخيرة|الأخيرة)\s*(\d+)/i);
                                        if (explicitMatch && explicitMatch[1]) return parseInt(explicitMatch[1], 10);
                                        const digits = t.match(/\d+/g);
                                        if (digits && digits.length > 0) return parseInt(digits[0], 10);
                                        return 0;
                                    };
                                    const epNum = extractEpNo(ep.title);
                                    const targetUrl = `/watch/${content.slug || content.id}/${season.seasonNumber}/${epNum}`;
                                    const title = `حلقة جديدة من ${content.title}! 🍿`;
                                    const body = `الآن يمكنك مشاهدة ${ep.title || `الحلقة ${epNum}`} من ${content.title} على سينماتيكس.`;
                                    const image = ep.thumbnail || content.backdrop || content.poster || '';

                                    await fetch('/api/send-notification', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            title,
                                            body,
                                            image,
                                            targetUrl,
                                            type: 'new_content',
                                            topic: 'all_users',
                                            contentId: content.id,
                                        }),
                                    });

                                    // Log internal notifications
                                    const batch = db.batch();
                                    users.forEach((user: any) => {
                                        const notifRef = db.collection('notifications').doc();
                                        batch.set(notifRef, {
                                            userId: user.id,
                                            title,
                                            body,
                                            type: 'new_content',
                                            isRead: false,
                                            createdAt: new Date().toISOString(),
                                            targetUrl,
                                            imageUrl: image || undefined,
                                            broadcastId
                                        });
                                    });

                                    // Log broadcast history
                                    const historyRef = db.collection('broadcast_history').doc(broadcastId);
                                    batch.set(historyRef, {
                                        title, body, type: 'new_content', 
                                        imageUrl: image || null, 
                                        targetUrl: targetUrl || null,
                                        createdAt: new Date().toISOString(),
                                        recipientCount: users.length,
                                        contentId: content.id,
                                        isAutoScheduled: true
                                    });

                                    await batch.commit();
                                    updatedCount++;
                                } catch (err) {
                                    console.error(`Failed to send episode notification:`, err);
                                }
                            }
                        }
                    }
                }
            }
        }

        if (updatedCount > 0) {
            props.addToast(`تم بث ${updatedCount} إشعار مجدول تلقائياً للجمهور! 🚀`, 'success');
            props.onContentChanged();
        }
    };

    const fetchAllContent = async () => {
        setIsLoadingContent(true);
        try {
            const data = await db.collection("content").orderBy("updatedAt", "desc").get();
            const contentData = data.docs.map(d => ({ ...d.data(), id: d.id })) as Content[];
            setAllContent(contentData);
            triggerScheduledNotificationsIfNeeded(contentData);
        } catch (err) {
            console.error("Error fetching content:", err);
            props.addToast("حدث خطأ أثناء جلب المحتوى من قاعدة البيانات.", "error");
        }
        setIsLoadingContent(false);
    };

    useEffect(() => {
        fetchAllContent();
        
        const refreshRadarBadge = () => {
            getReleaseSchedules().then(schedules => {
                const now = new Date();
                const today = now.getDay();
                const todayStr = now.toDateString();
                
                const pendingToday = schedules.filter(s => {
                    const alertId = `${s.id}_${todayStr}_${s.nextEpisodeNumber || 0}`;
                    if (dismissedAlerts.includes(alertId)) return false;

                    const lastAddedDate = s.lastAddedAt ? new Date(s.lastAddedAt) : null;
                    const alreadyPublished = lastAddedDate && lastAddedDate.toDateString() === todayStr;
                    
                    const isScheduledToday = s.daysOfWeek.includes(today);
                    if (!isScheduledToday || !s.isActive || alreadyPublished) return false;

                    const [h, m] = s.time.split(':').map(Number);
                    const scheduledTime = new Date();
                    scheduledTime.setHours(h, m, 0, 0);

                    return now >= scheduledTime;
                });

                const alerts = pendingToday.map(s => ({
                    id: `${s.id}_${todayStr}_${s.nextEpisodeNumber || 0}`,
                    message: `حان الآن موعد نشر الحلقة ${s.nextEpisodeNumber || ''} من مسلسل ${s.seriesName}`
                }));

                setRadarAlerts(alerts);
                setRadarCount(alerts.length);
            });
        };

        refreshRadarBadge();
        const interval = setInterval(refreshRadarBadge, 60000); 
        return () => clearInterval(interval);
    }, [dismissedAlerts]); 

    const handleDismissAlert = (id: string) => {
        setDismissedAlerts(prev => [...prev, id]);
    };

    const handleClearAllAlerts = () => {
        const allIds = radarAlerts.map(a => a.id);
        setDismissedAlerts(prev => [...new Set([...prev, ...allIds])]);
        props.addToast('تم إخفاء جميع التنبيهات.', 'info');
    };

    const totalMovies = allContent.filter(c => c.type === ContentType.Movie).length;
    const totalSeries = allContent.filter(c => c.type === ContentType.Series).length;
    const totalUsers = props.allUsers.length;
    
    const openContentModalForEdit = (c: Content) => { setEditingContent(c); setIsContentModalOpen(true); };
    const openContentModalForNew = () => { setEditingContent(null); setIsContentModalOpen(true); };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
                e.preventDefault();
                openContentModalForNew();
            } else if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) {
                e.preventDefault();
                setIsSidebarCollapsed(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
    
    const handleSaveContent = async (c: Content) => { 
        try { 
            const contentWithDate = { ...c, updatedAt: new Date().toISOString() }; 
            const isExisting = allContent.some(item => item.id === c.id);
            
            if (isExisting) { 
                const { id, ...contentData } = contentWithDate; 
                await db.collection("content").doc(c.id).update(contentData); 
                props.addToast("تم تعديل المحتوى بنجاح!", "success"); 
                
                // تحديث الحالة المحلية وترتيبها لتظهر في المقدمة
                setAllContent(prev => {
                    const updated = prev.map(item => item.id === c.id ? contentWithDate : item);
                    return [...updated].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
                });
            } else { 
                const { id, ...contentData } = contentWithDate; 
                if (c.id) {
                    await db.collection("content").doc(c.id).set(contentData);
                    props.addToast("تم إضافة المحتوى بنجاح!", "success"); 
                    
                    const newContentWithId = { ...contentWithDate };
                    setAllContent(prev => [newContentWithId, ...prev]);
                } else {
                    const docRef = await db.collection("content").add(contentData); 
                    props.addToast("تم إضافة المحتوى بنجاح!", "success"); 
                    
                    const newContentWithId = { ...contentWithDate, id: docRef.id };
                    setAllContent(prev => [newContentWithId, ...prev]);
                }
            } 
            
            setIsContentModalOpen(false); 
            setEditingContent(null);
            
            // تحديث المفتاح لإجبار ContentManagementTab على إعادة الجلب
            setContentRefreshKey(prev => prev + 1);
            
            // تحديث حالة التطبيق العامة
            props.onContentChanged(); 
        } catch (err) { 
            console.error("Error saving content:", err); 
            props.addToast("حدث خطأ أثناء حفظ المحتوى.", "error"); 
        } 
    };
    
    const confirmDeleteContent = (contentId: string, contentTitle: string) => { setDeleteModalState({ isOpen: true, type: 'content', id: contentId, title: contentTitle }); };
    const confirmDeleteUser = (userId: string, userName: string) => { setDeleteModalState({ isOpen: true, type: 'user', id: userId, title: userName }); };
    const confirmDeleteAd = (adId: string, adTitle: string) => { setDeleteModalState({ isOpen: true, type: 'ad', id: adId, title: adTitle }); };
    const confirmDeleteBroadcast = (id: string, title: string) => { setDeleteModalState({ isOpen: true, type: 'broadcast', id, title }); };
    const confirmDeleteReport = (id: string, title: string) => { setDeleteModalState({ isOpen: true, type: 'report', id, title }); };
    const confirmDeleteRadar = (id: string, title: string) => { setDeleteModalState({ isOpen: true, type: 'radar', id, title }); };
    const confirmDeleteRequest = (id: string, title: string) => { setDeleteModalState({ isOpen: true, type: 'request', id, title }); };
    
    const executeDelete = async () => { 
        const { type, id } = deleteModalState; 
        if (type === 'content') { 
            try { 
                await db.collection("content").doc(id).delete(); 
                setAllContent(prev => prev.filter(item => item.id !== id)); 
                props.onContentChanged(); 
                setContentRefreshKey(prev => prev + 1);
                props.addToast('تم حذف المحتوى بنجاح.', 'success'); 
            } catch (err) { 
                console.error("Error deleting content:", err); 
                props.addToast("حدث خطأ أثناء الحذف.", "error"); 
            } 
        } else if (type === 'user') { 
            props.onDeleteUser(id); 
        } else if (type === 'ad') { 
            props.onDeleteAd(id); 
        } else if (type === 'broadcast') {
            try { await deleteBroadcastNotification(id); props.addToast('تم سحب الإشعار بنجاح.', 'success'); } catch (e) { props.addToast('فشل سحب الإشعار', 'error'); }
        } else if (type === 'report') {
            try { await deleteReport(id); props.addToast('تم حذف البلاغ بنجاح.', 'success'); } catch (e) { props.addToast('فشل حذف البلاغ', 'error'); }
        } else if (type === 'radar') {
            try { 
                await deleteReleaseSchedule(id); 
                props.addToast('تم حذف تخصيص رادار البحث بنجاح.', 'success'); 
            } catch (e) { 
                props.addToast('فشل الحذف', 'error'); 
            }
        } else if (type === 'request') {
            try {
                await deleteContentRequest(id);
                props.addToast('تم حذف الطلب بنجاح.', 'success');
                props.onContentChanged(); 
            } catch (e) {
                props.addToast('فشل حذف الطلب', 'error');
            }
        }
        setDeleteModalState(prev => ({ ...prev, isOpen: false })); 
    };
    
    const openAdModalForEdit = (ad: Ad) => { setEditingAd(ad); setIsAdModalOpen(true); };
    const openAdModalForNew = () => { setEditingAd(null); setIsAdModalOpen(true); };
    const handleSaveAd = (ad: Ad) => { if(editingAd) { props.onUpdateAd(ad); } else { const { id, updatedAt, ...newAdData } = ad; props.onAddAd(newAdData); } setIsAdModalOpen(false); };

    const renderTabContent = () => {
        switch(activeTab) {
            case 'content': return <ContentManagementTab onEdit={openContentModalForEdit} onNew={openContentModalForNew} onRequestDelete={confirmDeleteContent} addToast={props.addToast} onBulkSuccess={() => { props.onContentChanged(); setContentRefreshKey(prev => prev + 1); }} refreshKey={contentRefreshKey} />;
            case 'most_viewed': return <MostViewedTab onEdit={openContentModalForEdit} addToast={props.addToast} />;
            case 'servers_domains': return <ServersManagementTab addToast={props.addToast} onServersChanged={props.onContentChanged} />;
            case 'users': return <UserManagementTab users={props.allUsers} onAddAdmin={props.onAddAdmin} onRequestDelete={confirmDeleteUser} addToast={props.addToast} />;
            case 'requests': return <RequestsTab addToast={props.addToast} onRequestDelete={confirmDeleteRequest} />;
            case 'reports': return <ReportsManagementTab addToast={props.addToast} onRequestDelete={confirmDeleteReport} allContent={allContent} onEditContent={openContentModalForEdit} />;
            case 'ads': return <AdsManagementTab ads={props.allAds} onNew={openAdModalForNew} onEdit={openAdModalForEdit} onRequestDelete={confirmDeleteAd} onUpdateAd={props.onUpdateAd} />;
            case 'startup_ad': return <StartupAdTab siteSettings={props.siteSettings} onSetSiteSettings={props.onSetSiteSettings} allContent={allContent} />;
            case 'promo_banners': return <PromoBannersTab addToast={props.addToast} allContent={allContent} onContentChanged={props.onContentChanged} />;
            case 'top_content': return <PinnedContentManagementTab allContent={allContent} pinnedState={props.pinnedItems} setPinnedItems={props.onSetPinnedItems} />;
            case 'top10': return <Top10ManagerTab allContent={allContent} pinnedState={props.top10Items} setPinnedItems={props.onSetTop10Items} />;
            case 'themes': return <ThemesTab siteSettings={props.siteSettings} onSetSiteSettings={props.onSetSiteSettings} />;
            case 'settings': return <SiteSettingsTab siteSettings={props.siteSettings} onSetSiteSettings={props.onSetSiteSettings} allContent={allContent} addToast={props.addToast} />;
            case 'notifications': return <NotificationTab addToast={props.addToast} allUsers={props.allUsers} onRequestDelete={confirmDeleteBroadcast} />;
            case 'stories': return <ManageStories addToast={props.addToast} />;
            case 'analytics': return <AnalyticsTab allContent={allContent} allUsers={props.allUsers}/>;
            case 'app_config': return <AppConfigTab settings={props.siteSettings} onUpdate={props.onSetSiteSettings} />;
            case 'people': return <PeopleManagerTab addToast={props.addToast} />;
            case 'shortcuts': return <ShortcutsPage siteSettings={props.siteSettings} onSetSiteSettings={props.onSetSiteSettings} addToast={props.addToast} isNestedInAdmin={true} />;
            case 'content_radar': return <ContentRadarTab addToast={props.addToast} onRequestDelete={confirmDeleteRadar} onEditContent={openContentModalForEdit} allPublishedContent={allContent} />;
            case 'alerts': return <AlertsTab alerts={radarAlerts} onGoToRadar={() => setActiveTab('content_radar')} onDismiss={handleDismissAlert} onClearAll={handleClearAllAlerts} />;
            case 'dashboard': default: return (
                <DashboardTab 
                    stats={{totalMovies, totalSeries, totalUsers}} 
                    allContent={allContent} 
                    onSelectTmdbItem={(item) => {
                        const existing = allContent.find(c => c.id === String(item.id) || c.tmdbId === String(item.id));
                        if (existing) {
                            openContentModalForEdit(existing);
                        } else {
                            const dummyContent: Partial<Content> = {
                                tmdbId: String(item.id),
                                id: String(item.id),
                                type: item.media_type === 'movie' ? ContentType.Movie : ContentType.Series,
                                title: '',
                            };
                            setEditingContent(dummyContent as Content);
                            setIsContentModalOpen(true);
                        }
                    }}
                />
            );
        }
    };

    const navItems: {id: AdminTab, label: string, icon: any}[] = [
        { id: 'dashboard', label: 'نظرة عامة', icon: HomeIcon },
        { id: 'content', label: 'المحتوى', icon: FilmIcon },
        { id: 'most_viewed', label: 'الأكثر مشاهدة', icon: ChartBarIcon },
        { id: 'servers_domains', label: 'إدارة السيرفرات والدومينات', icon: ServerIcon },
        { id: 'content_radar', label: 'رادار البث', icon: MapIcon }, 
        { id: 'top_content', label: 'المثبت (Hero)', icon: StarIcon },
        { id: 'top10', label: 'قائمة التوب 10', icon: TrophyIcon },
        { id: 'stories', label: 'إدارة الستوري', icon: PlayCircleIcon },
        { id: 'people', label: 'النجوم والطاقم', icon: UserGroupIcon },
        { id: 'users', label: 'المستخدمون', icon: UsersIcon },
        { id: 'requests', label: 'الطلبات', icon: InboxIcon },
        { id: 'reports', label: 'البلاغات', icon: FlagIcon },
        { id: 'ads', label: 'الإعلانات', icon: MegaphoneIcon },
        { id: 'startup_ad', label: 'إعلان الانطلاق', icon: MegaphoneIcon },
        { id: 'promo_banners', label: 'الحاويات الترويجية', icon: FilmIcon },
        { id: 'themes', label: 'المظهر', icon: PaintBrushIcon },
        { id: 'settings', label: 'إعدادات الموقع', icon: CogIcon },
        { id: 'analytics', label: 'الإحصائيات', icon: ChartBarIcon },
        { id: 'notifications', label: 'إرسال إشعار', icon: BellIcon },
        { id: 'alerts', label: 'تنبيهات النظام', icon: BellIcon },
        { id: 'app_config', label: 'تطبيق الموبايل', icon: DevicePhoneMobileIcon },
        { id: 'shortcuts', label: 'الاختصارات', icon: KeyboardIcon },
    ];

    const currentTabLabel = navItems.find(i => i.id === activeTab)?.label;

    return (
        <div className="flex h-screen bg-[#090b10] text-gray-200 overflow-hidden font-sans selection:bg-[var(--color-accent)] selection:text-black" dir="rtl">
            <SEO title="لوحة التحكم - سينماتيكس" noIndex={true} />
            
            <div 
                className={`fixed inset-0 bg-black/60 z-[90] lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                onClick={() => setIsSidebarOpen(false)} 
            />

            <aside className={`fixed inset-y-0 right-0 z-[100] w-72 bg-[#0f1014] border-l border-gray-800 flex flex-col shadow-2xl transition-all duration-300 ${isSidebarCollapsed ? 'lg:hidden lg:w-0 lg:opacity-0' : 'lg:relative lg:translate-x-0 lg:w-72 lg:opacity-100'} ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
                <div className="p-8 border-b border-gray-800 flex flex-col items-center gap-3">
                    <div className="text-3xl font-extrabold cursor-default flex flex-row items-baseline gap-1 justify-center">
                        <span className="text-white font-['Cairo']">سينما</span>
                        <span className="gradient-text font-['Lalezar'] tracking-wide text-4xl">تيكس</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[11px] font-bold text-gray-400 bg-gray-900/50 px-3 py-1 rounded-full border border-gray-800/50 backdrop-blur-sm">
                            {currentTabLabel}
                        </span>
                    </div>
                </div>
                
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 text-right">Main Menu</div>
                    {navItems.map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === item.id ? 'bg-[#1a1f29] text-white border-r-2 border-[#00A7F8]' : 'text-gray-400 hover:bg-[#161b22] hover:text-white'}`}
                        >
                            <item.icon className="w-5 h-5"/>
                            <span>{item.label}</span>
                            {item.id === 'alerts' && radarCount > 0 && (
                                <span className="mr-auto bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">{radarCount}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-800">
                     <button onClick={() => props.onSetView('home')} className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200">
                        <ExitIcon className="w-5 h-5"/>
                        <span>الخروج من اللوحة</span>
                     </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 bg-[#090b10] relative">
                {/* Content Editor Modal Overlay - Ensures structure stability */}
                {isContentModalOpen && (
                    <div className="fixed inset-0 z-[200] bg-[#090b10] animate-fade-in">
                        <ContentEditModal 
                            content={editingContent} 
                            onClose={() => {
                                setIsContentModalOpen(false);
                                setEditingContent(null);
                            }} 
                            onSave={handleSaveContent} 
                            addToast={props.addToast} 
                            allUsers={props.allUsers}
                        />
                    </div>
                )}

                <header className="h-20 border-b border-gray-800 bg-[#0f1014]/90 backdrop-blur-md flex items-center justify-between px-6 md:px-10 z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        <button 
                            type="button" 
                            onClick={() => {
                                if (isSidebarCollapsed) {
                                    setIsSidebarCollapsed(false);
                                } else {
                                    setIsSidebarOpen(!isSidebarOpen);
                                }
                            }} 
                            className={`${isSidebarCollapsed ? 'flex' : 'lg:hidden'} p-2 text-gray-400 hover:text-white transition-colors`}
                            title={isSidebarCollapsed ? 'عرض القائمة الجانبية' : 'تغيير القائمة الجانبية'}
                        >
                            <MenuIcon className="w-6 h-6" />
                        </button>
                        
                        <div className="flex flex-col">
                             <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {currentTabLabel}
                             </h2>
                             <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 mt-1">
                                 <span>المسؤول</span>
                                 <span>/</span>
                                 <span className="text-[#00A7F8]">{currentTabLabel}</span>
                             </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative mr-4 flex items-center gap-2">
                             <button onClick={() => setActiveTab('alerts')} className="p-2.5 bg-gray-800/50 rounded-xl border border-gray-700 hover:bg-gray-700 transition-all text-gray-400 hover:text-white relative group" title="تنبيهات النظام">
                                <BellIcon className="w-6 h-6" />
                                {radarCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0f1014] shadow-lg group-hover:scale-110 transition-transform">
                                        {radarCount > 9 ? '+9' : radarCount}
                                    </span>
                                )}
                             </button>

                             <button onClick={() => setActiveTab('shortcuts')} className="p-2.5 bg-gray-800/50 rounded-xl border border-gray-700 hover:bg-gray-700 transition-all text-gray-400 hover:text-white relative group" title="الاختصارات">
                                <KeyboardIcon className="w-6 h-6" />
                             </button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar pb-32">
                    <div className="max-w-7xl mx-auto">
                        {renderTabContent()}
                    </div>
                </div>
            </main>
             
             {isAdModalOpen && <AdEditModal ad={editingAd} onClose={() => setIsAdModalOpen(false)} onSave={handleSaveAd} />}
             <DeleteConfirmationModal 
                isOpen={deleteModalState.isOpen} 
                onClose={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))} 
                onConfirm={executeDelete} 
                title={
                    deleteModalState.type === 'content' ? 'حذف المحتوى' : 
                    deleteModalState.type === 'user' ? 'حذف المستخدم' : 
                    deleteModalState.type === 'ad' ? 'حذف الإعلان' : 
                    deleteModalState.type === 'story' ? 'حذف الستوري' : 
                    deleteModalState.type === 'broadcast' ? 'سحب الإشعار' : 
                    deleteModalState.type === 'report' ? 'حذف البلاغ' : 
                    deleteModalState.type === 'radar' ? 'حذف تخصيص رادار البحث' : 
                    deleteModalState.type === 'request' ? 'حذف الطلب' :
                    'حذف'
                } 
                message={`هل أنت متأكد من حذف "${deleteModalState.title}"؟ لا يمكن التراجع عن هذا الإجراء.`} 
             />
        </div>
    );
};

export default AdminPanel;
