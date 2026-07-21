
// Modular SDK imports for advanced caching
import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  memoryLocalCache,
  getFirestore
} from "firebase/firestore";

// Compatibility imports to support existing project logic
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/messaging";
import "firebase/compat/storage";

import type { Ad, SiteSettings, User, PinnedContentState, PinnedItem, PageKey, ContentRequest, HomeSection, Content, Top10State, Story, Notification, BroadcastNotification, Person, ReleaseSchedule, PromotionalBanner, GlobalServer, AutoLinkConfig } from '@/types';
import { initialSiteSettings, pinnedContentData as initialPinnedData, top10ContentData as initialTop10Data } from './data';
import { UserRole } from '@/types';

// Check if we are on the client or server to handle env vars correctly
const getEnvVar = (key: string, viteKey: string) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || process.env[viteKey];
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[viteKey];
  }
  return undefined;
};

// Configuration for Cinematix
const firebaseConfig = {
  apiKey: getEnvVar("NEXT_PUBLIC_FIREBASE_API_KEY", "VITE_FIREBASE_API_KEY") || "AIzaSyBVK0Zla5VD05Hgf4QqExAWUuXX64odyes", 
  authDomain: "cinematic-d3697.firebaseapp.com",
  projectId: "cinematic-d3697", 
  storageBucket: "cinematic-d3697.firebasestorage.app", 
  messagingSenderId: "247576999692",
  appId: "1:247576999692:web:309f001a211dc1b150fb29",
  measurementId: "G-XWRXYMGWRG"
};

// 1. Initialize Firebase Modular App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Initialize Firestore with a fallback to memory cache to prevent FILE_ERROR_NO_SPACE
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true
  });
} catch (getErr) {
  try {
    firestoreInstance = initializeFirestore(app, {
      // Set a conservative cache size limit (10 MB instead of default 40 MB) 
      // to prevent hitting IndexDB space limits on user's browser
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: 10485760 
      }),
      experimentalForceLongPolling: true
    });
  } catch (e) {
    console.warn("[Cinematix] Failed to initialize persistent cache, falling back to memory:", e);
    try {
      firestoreInstance = initializeFirestore(app, {
        localCache: memoryLocalCache(),
        experimentalForceLongPolling: true
      });
    } catch (e2) {
      firestoreInstance = getFirestore(app);
    }
  }
}

// 3. Setup Compat Layer for the rest of the application
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const storage = firebase.app().storage();
export const auth = firebase.app().auth();

// Set explicit persistence to ensure it works across environments if possible
try {
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
} catch (e) {
  console.warn("[Cinematix] Auth persistence could not be set:", e);
}

// Google Auth Provider for Social Login
export const googleProvider = new firebase.auth.GoogleAuthProvider();

// Additional Firestore Settings for compat layer
try {
  db.settings({
    ignoreUndefinedProperties: true,
    merge: true,
    experimentalForceLongPolling: true
  });
} catch (e: any) {
  if (!e.message.includes('already been initialized')) {
    console.warn("[Cinematix] Firestore settings error:", e.message);
  }
}

export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
export const Timestamp = firebase.firestore.Timestamp;

export let messaging: firebase.messaging.Messaging | null = null;

const initMessaging = async () => {
    if (typeof window !== 'undefined') {
        try {
            const supported = await firebase.messaging.isSupported();
            if (supported) {
                messaging = firebase.messaging();
            }
        } catch (e) {
            // SILENT
        }
    }
};

// Initialize messaging
initMessaging();

const safeGetTimestamp = (timestamp: any): string => {
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString();
    }
    if (typeof timestamp === 'string') {
        return timestamp;
    }
    return new Date().toISOString();
};

export const generateSlug = (title: string): string => {
    if (!title) return '';
    return title
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u0621-\u064A\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

const handleFirestoreError = (error: any, context: string, fallback: any) => {
    const msg = error?.message || '';
    if (msg.toLowerCase().includes('index')) {
        console.error(`[Cinematix] Missing Index for ${context}.`);
        return fallback;
    }
    return fallback;
};

export const getPromotionalBanners = async (): Promise<PromotionalBanner[]> => {
    try {
        const querySnapshot = await db.collection('promotionalBanners').get();
        const banners: PromotionalBanner[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.isActive) {
                banners.push({ id: doc.id, ...data } as PromotionalBanner);
            }
        });
        return banners;
    } catch (error) {
        console.error("Error fetching promotional banners:", error);
        return [];
    }
};

export const getSiteSettings = async (): Promise<SiteSettings> => {
    try {
        const docSnap = await db.collection("settings").doc("site").get();
        if (docSnap.exists) {
            const data = docSnap.data() as Partial<SiteSettings>;
            return {
                ...initialSiteSettings,
                ...data,
                shoutBar: { ...initialSiteSettings.shoutBar, ...(data.shoutBar || {}) },
                socialLinks: { ...initialSiteSettings.socialLinks, ...(data.socialLinks || {}) }
            };
        } else {
            return initialSiteSettings;
        }
    } catch (error) {
        return handleFirestoreError(error, 'site settings', initialSiteSettings);
    }
};

export const updateSiteSettings = async (settings: SiteSettings): Promise<void> => {
    await db.collection("settings").doc("site").set(settings, { merge: true });
};

export const getPinnedContent = async (): Promise<PinnedContentState> => {
    try {
        const docSnap = await db.collection("settings").doc("pinned").get();
        if (docSnap.exists) {
            return { ...initialPinnedData, ...docSnap.data() };
        }
        return initialPinnedData;
    } catch (error) {
        return handleFirestoreError(error, 'pinned content', initialPinnedData);
    }
};

export const updatePinnedContentForPage = async (pageKey: PageKey, items: PinnedItem[]): Promise<void> => {
    await db.collection("settings").doc("pinned").set({
        [pageKey]: items
    }, { merge: true });
};

export const getTop10Content = async (): Promise<Top10State> => {
    try {
        const docSnap = await db.collection("settings").doc("top10").get();
        if (docSnap.exists) {
            return { ...initialTop10Data, ...docSnap.data() };
        }
        return initialTop10Data;
    } catch (error) {
        return handleFirestoreError(error, 'top10 content', initialTop10Data);
    }
};

export const updateTop10ContentForPage = async (pageKey: PageKey, items: PinnedItem[]): Promise<void> => {
    await db.collection("settings").doc("top10").set({
        [pageKey]: items
    }, { merge: true });
};

export const getAds = async (): Promise<Ad[]> => {
    try {
        const querySnapshot = await db.collection("ads").orderBy("updatedAt", "desc").get();
        return querySnapshot.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
                placement: data.placement || data.position || 'home-top',
                type: data.type || 'code',
                status: data.status || (data.isActive === false ? 'disabled' : 'active'),
                isActive: data.status === 'active' || data.isActive === true,
                timerDuration: data.timerDuration || 0,
                updatedAt: safeGetTimestamp(data.updatedAt),
            };
        }) as Ad[];
    } catch (error) {
        return handleFirestoreError(error, 'ads', []);
    }
};

export const getAdByPosition = async (position: string): Promise<Ad | null> => {
  try {
    // Try matching by both placement and position fields to ensure backward compatibility
    let snap = await db.collection("ads")
        .where("placement", "==", position)
        .limit(5)
        .get();
    
    if (snap.empty) {
        snap = await db.collection("ads")
            .where("position", "==", position)
            .limit(5)
            .get();
    }

    if (!snap.empty) {
        // Find first active ad among results
        const activeDoc = snap.docs.find(d => {
            const data = d.data();
            return data.status === 'active' || data.isActive === true;
        }) || snap.docs[0];

        const data = activeDoc.data();
        return { 
            id: activeDoc.id, 
            ...data, 
            placement: data.placement || data.position || position,
            type: data.type || 'code',
            status: data.status || 'active',
            isActive: true
        } as Ad;
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const addAd = async (adData: Omit<Ad, 'id' | 'updatedAt'>): Promise<string> => {
    const docRef = await db.collection("ads").add({ 
        ...adData, 
        position: adData.placement, 
        updatedAt: serverTimestamp() 
    });
    return docRef.id;
};

export const updateAd = async (adId: string, adData: Partial<Omit<Ad, 'id'>>): Promise<void> => {
    const data: any = { ...adData, updatedAt: serverTimestamp() };
    if (adData.placement) data.position = adData.placement;
    await db.collection("ads").doc(adId).update(data);
};

export const deleteAd = async (adId: string): Promise<void> => {
    await db.collection("ads").doc(adId).delete();
};

const parseScheduledDate = (scheduledAt: any): Date | null => {
    if (!scheduledAt) return null;
    
    // Firestore Timestamp
    if (typeof scheduledAt.toDate === 'function') {
        return scheduledAt.toDate();
    }
    
    // Raw Firestore Timestamp object
    if (typeof scheduledAt === 'object' && typeof scheduledAt.seconds === 'number') {
        return new Date(scheduledAt.seconds * 1000);
    }
    
    // ISO String or Long Epoch Milliseconds
    if (typeof scheduledAt === 'string') {
        const trimmed = scheduledAt.trim();
        if (trimmed === '') return null;
        if (/^\d+$/.test(trimmed)) {
            return new Date(parseInt(trimmed, 10));
        }
        return new Date(trimmed);
    }
    
    if (typeof scheduledAt === 'number') {
        return new Date(scheduledAt);
    }
    
    return null;
};

export const isItemVisible = (item: { isScheduled?: boolean; scheduledAt?: any }): boolean => {
    // Rule 3: Flag Check: If isScheduled is true but scheduledAt is missing or empty, hide completely.
    if (item.isScheduled && (!item.scheduledAt || String(item.scheduledAt).trim() === '')) {
        return false;
    }
    
    // Rule 2 & 4: Date-First Check / Auto Publish:
    // If scheduledAt contains a date in the future, hide automatically (even if isScheduled is false)
    if (item.scheduledAt) {
        const scheduleDate = parseScheduledDate(item.scheduledAt);
        if (scheduleDate && !isNaN(scheduleDate.getTime())) {
            const now = new Date();
            if (now < scheduleDate) {
                return false;
            }
        }
    }
    
    return true;
};

export const getAllContent = async (isAdmin: boolean = false): Promise<Content[]> => {
    try {
        const snapshot = await db.collection('content').get();
        
        let contents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
        
        try {
            const serversList = await getServers();
            if (serversList.length > 0) {
                contents = resolveContentDynamicUrls(contents, serversList);
            }
        } catch (serverErr) {
            console.warn("Failed to resolve dynamic servers for content:", serverErr);
        }
        
        if (!isAdmin) {
            // Filter top-level content
            contents = contents.filter(c => isItemVisible(c));
            
            // Filter nested episodes inside seasons
            contents = contents.map(c => {
                if (c.seasons && c.seasons.length > 0) {
                    const filteredSeasons = c.seasons.map(s => {
                        if (s.episodes && s.episodes.length > 0) {
                            return {
                                ...s,
                                episodes: s.episodes.filter(ep => isItemVisible(ep))
                            };
                        }
                        return s;
                    });
                    return { ...c, seasons: filteredSeasons };
                }
                return c;
            });
        }
        
        return contents;
    } catch (error) {
        return handleFirestoreError(error, 'content', []);
    }
};

export const incrementContentViewCount = async (contentId: string): Promise<void> => {
    if (!contentId) return;
    try {
        await db.collection('content').doc(contentId).update({
            views: firebase.firestore.FieldValue.increment(1)
        });
    } catch (e) {
        console.error("[Cinematix] Error incrementing view count:", e);
    }
};

export const getUsers = async (): Promise<User[]> => {
    try {
        const querySnapshot = await db.collection("users").get();
        return querySnapshot.docs.map(d => ({
            ...(d.data() as Omit<User, 'id'>),
            id: d.id,
        }));
    } catch (error) {
        return handleFirestoreError(error, 'users', []);
    }
};

export const getUserProfile = async (uid: string): Promise<Omit<User, 'password'> | null> => {
    try {
        const docSnap = await db.collection("users").doc(uid).get();
        if (docSnap.exists) {
            return { ...(docSnap.data() as Omit<User, 'id'>), id: docSnap.id };
        }
        return null;
    } catch (e) {
        return null;
    }
};

export const createUserProfileInFirestore = async (uid: string, data: Omit<User, 'id' | 'role' | 'password'>): Promise<void> => {
    await db.collection("users").doc(uid).set({ ...data, role: UserRole.User });
};

export const updateUserProfileInFirestore = async (userId: string, userData: Partial<User>): Promise<void> => {
    const dataToUpdate = { ...userData };
    delete (dataToUpdate as any).id;
    delete (dataToUpdate as any).password;
    await db.collection("users").doc(userId).update(dataToUpdate);
};

export const deleteUserFromFirestore = async (userId: string): Promise<void> => {
    await db.collection("users").doc(userId).delete();
};

/**
 * دالة طلب الإذن بالإشعارات وتسجيل توكن الجهاز
 * تم تحديثها لتسجيل التوكن في مجموعة عامة لضمان وصول الإشعارات للجميع (زوار وأعضاء)
 */
export const requestNotificationPermission = async (userId?: string) => {
    if (typeof window === 'undefined') return;
    
    try {
        const supported = await firebase.messaging.isSupported();
        if (!supported) return;
        
        if (!messaging) {
            messaging = firebase.messaging();
        }
        
        if (Notification.permission === 'denied') {
            return;
        }
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            const registration = await navigator.serviceWorker.ready;
            
            const token = await messaging.getToken({
                vapidKey: 'BHy3zaLsQsTzR23TNBbBRyVzz2OjySYt4k62K8TEOk0Wceez6uao-THJIzAaRzkSN7czJPLfMfaWfsbRt_rN9VQ',
                serviceWorkerRegistration: registration
            });
            
            if (token) {
                // 1. تسجيل التوكن في المجموعة العامة للإرسال الشامل (Global Push)
                await db.collection('fcm_tokens').doc(token).set({
                    token: token,
                    lastSeen: serverTimestamp(),
                    userId: userId || null,
                    device: navigator.userAgent
                }, { merge: true });

                // 2. إذا كان المستخدم مسجلاً، نربط التوكن بحسابه أيضاً
                if (userId) {
                    await db.collection('users').doc(userId).set({
                        fcmTokens: firebase.firestore.FieldValue.arrayUnion(token)
                    }, { merge: true });
                }
                
                console.log('[Cinematix] FCM Token successfully registered.');
            }
        } else {
            console.log('[Cinematix] Push Notification permission denied.');
        }
    } catch (error) {
        console.error('[Cinematix] FCM Token Request Error:', error);
    }
};

export const addContentRequest = async (request: Omit<ContentRequest, 'id' | 'createdAt' | 'status'>): Promise<void> => {
    const sanitizedData = {
        ...request,
        movieName: request.title || '', // set both for Android compatibility
        userId: request.userId || null,
        status: 'pending',
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp() // set both for Android compatibility
    };
    await db.collection('requests').add(sanitizedData);
};

export const getContentRequests = async (): Promise<ContentRequest[]> => {
    try {
        const snapshot = await db.collection('requests').get();
        const reqs = snapshot.docs.map(doc => {
            const data = doc.data();
            const rawTime = data.createdAt || data.timestamp;
            return {
                id: doc.id,
                title: data.title || data.movieName || 'طلب غير مسمى',
                movieName: data.movieName || data.title || 'طلب غير مسمى',
                year: data.year || '',
                type: data.type || 'movie',
                notes: data.notes || (data.year ? `سنة الإنتاج: ${data.year}` : ''),
                userId: data.userId || null,
                userName: data.userName || null,
                status: data.status || 'pending',
                requestId: data.requestId || doc.id,
                createdAt: safeGetTimestamp(rawTime)
            } as any;
        });
        // Sort in-memory descending by createdAt to prevent index failures
        return reqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
        console.error("Error fetching content requests:", e);
        return [];
    }
};

export const updateContentRequestStatus = async (requestId: string, status: 'pending' | 'completed' | 'rejected'): Promise<void> => {
    await db.collection('requests').doc(requestId).update({ status });
};

export const deleteContentRequest = async (requestId: string): Promise<void> => {
    await db.collection('requests').doc(requestId).delete();
};

export const addReport = async (reportData: { 
    contentId: string;
    contentType: 'movie' | 'series';
    episodeId?: string;
    contentTitle: string;
    reason: string;
    description?: string;
    userId?: string | null;
    userEmail?: string | null;
}): Promise<void> => {
    const docRef = db.collection('reports').doc();
    await docRef.set({
        reportId: docRef.id,
        contentId: reportData.contentId,
        contentType: reportData.contentType,
        episodeId: reportData.episodeId || null,
        contentTitle: reportData.contentTitle,
        reason: reportData.reason,
        reportType: reportData.reason, // set both for Android compatibility
        description: reportData.description || '',
        userId: reportData.userId || null,
        userEmail: reportData.userEmail || null,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(), // fallback compatibility
        status: 'pending'
    });
};

export const getReports = async (): Promise<any[]> => {
    try {
        const snapshot = await db.collection('reports').get();
        const data = snapshot.docs.map(doc => {
            const docData = doc.data();
            const rawTime = docData.timestamp || docData.createdAt;
            return {
                id: doc.id,
                ...docData,
                reason: docData.reason || docData.reportType || 'غير محدد',
                reportType: docData.reportType || docData.reason || 'غير محدد',
                description: docData.description || '',
                contentTitle: docData.contentTitle || `معرف المحتوى: ${docData.contentId}`,
                timestamp: safeGetTimestamp(rawTime),
                createdAt: safeGetTimestamp(rawTime)
            };
        });
        // Sort in-memory descending to prevent index errors
        return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (e) {
        console.error("Error getting reports:", e);
        return [];
    }
};

export const updateReportStatus = async (reportId: string, status: 'pending' | 'resolved' | 'ignored'): Promise<void> => {
    await db.collection('reports').doc(reportId).update({ status });
};

export const deleteReport = async (reportId: string): Promise<void> => {
    await db.collection('reports').doc(reportId).delete();
};

export const getHomeSections = async (): Promise<HomeSection[]> => {
    try {
        const snapshot = await db.collection('home_sections').orderBy('positionIndex', 'asc').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as HomeSection[];
    } catch (e) {
        return handleFirestoreError(e, 'home sections', []);
    }
};

export const saveHomeSection = async (section: HomeSection): Promise<void> => {
    const { id, ...data } = section;
    const dataToSave = {
        ...data,
        updatedAt: serverTimestamp()
    };

    if (id) {
        await db.collection('home_sections').doc(id).update(dataToSave);
    } else {
        await db.collection('home_sections').add({
            ...dataToSave,
            createdAt: serverTimestamp()
        });
    }
};

export const deleteHomeSection = async (sectionId: string): Promise<void> => {
    await db.collection('home_sections').doc(sectionId).delete();
};

export const getPeople = async (): Promise<Person[]> => {
  try {
    const snapshot = await db.collection('people').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      updatedAt: safeGetTimestamp(doc.data().updatedAt)
    } as Person));
  } catch (error) {
    return handleFirestoreError(error, 'people', []);
  }
};

export const savePerson = async (person: Partial<Person>): Promise<string> => {
  const { id, ...data } = person;
  const dataToSave = {
    ...data,
    updatedAt: serverTimestamp()
  };

  if (id) {
    await db.collection('people').doc(id).update(dataToSave);
    return id;
  } else {
    const docRef = await db.collection('people').add({
      ...dataToSave,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  }
};

export const deletePerson = async (personId: string): Promise<void> => {
  await db.collection('people').doc(personId).delete();
};

export const getStories = async (onlyActive: boolean = true): Promise<Story[]> => {
    try {
        const snapshot = await db.collection('stories').get();
        let stories = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...(data as Omit<Story, 'id' | 'createdAt'>),
                createdAt: safeGetTimestamp(data.createdAt)
            } as Story;
        });
        stories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (onlyActive) {
            stories = stories.filter(s => s.isActive);
        }
        return stories;
    } catch (e) {
        return handleFirestoreError(e, 'stories', []);
    }
};

export const saveStory = async (story: Partial<Story>): Promise<void> => {
    const { id, ...data } = story;
    const dataToSave = {
        ...data,
        createdAt: data.createdAt ? data.createdAt : serverTimestamp()
    };
    if (id) {
        await db.collection('stories').doc(id).update(dataToSave);
    } else {
        await db.collection('stories').add({
            ...dataToSave,
            createdAt: serverTimestamp()
        });
    }
};

export const deleteStory = async (storyId: string): Promise<void> => {
    await db.collection('stories').doc(storyId).delete();
};

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const snapshot = await db.collection('notifications')
            .where('userId', '==', userId)
            .get();
        let notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: safeGetTimestamp(doc.data().createdAt)
        } as Notification));
        notifications = notifications.filter(n => new Date(n.createdAt) > sevenDaysAgo);
        notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return notifications;
    } catch (error) {
        return handleFirestoreError(error, 'notifications', []);
    }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    try {
        await db.collection('notifications').doc(notificationId).update({ isRead: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

export const deleteUserNotification = async (notificationId: string): Promise<void> => {
    try {
        await db.collection('notifications').doc(notificationId).delete();
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
    try {
        const unreadSnapshot = await db.collection('notifications')
            .where('userId', '==', userId)
            .where('isRead', '==', false)
            .get();
        const batch = db.batch();
        unreadSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { isRead: true });
        });
        await batch.commit();
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
};

export const deleteAllUserNotifications = async (userId: string): Promise<void> => {
    try {
        const snapshot = await db.collection('notifications')
            .where('userId', '==', userId)
            .get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    } catch (error) {
        console.error('Error deleting all notifications:', error);
    }
};

export const getBroadcastHistory = async (): Promise<BroadcastNotification[]> => {
    try {
        const snapshot = await db.collection('broadcast_history').orderBy('createdAt', 'desc').limit(20).get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: safeGetTimestamp(doc.data().createdAt)
        })) as BroadcastNotification[];
    } catch (e) {
        return [];
    }
};

export const deleteBroadcastNotification = async (broadcastId: string): Promise<void> => {
    try {
        await db.collection('broadcast_history').doc(broadcastId).delete();
        const userNotifs = await db.collection('notifications').where('broadcastId', '==', broadcastId).get();
        const batch = db.batch();
        userNotifs.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    } catch (e) {
        console.error('Error deleting broadcast notification:', e);
    }
};

export const getReleaseSchedules = async (): Promise<ReleaseSchedule[]> => {
  try {
    const snapshot = await db.collection('release_radar').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ReleaseSchedule));
  } catch (error) {
    return handleFirestoreError(error, 'release radar', []);
  }
};

export const saveReleaseSchedule = async (schedule: Partial<ReleaseSchedule>): Promise<void> => {
  const { id, ...data } = schedule;
  if (id) {
    await db.collection('release_radar').doc(id).update(data);
  } else {
    await db.collection('release_radar').add({
      ...data,
      lastAddedAt: null
    });
  }
};

export const deleteReleaseSchedule = async (id: string): Promise<void> => {
  await db.collection('release_radar').doc(id).delete();
};

export const markScheduleAsAdded = async (id: string): Promise<void> => {
  await db.collection('release_radar').doc(id).update({
    lastAddedAt: new Date().toISOString()
  });
};

// --- GET, ADD, UPDATE, DELETE SERVERS AND RESOLVE DYNAMIC URLS ---

export const getServers = async (): Promise<GlobalServer[]> => {
  try {
    const snapshot = await db.collection('servers').orderBy('createdAt', 'asc').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as GlobalServer));
  } catch (error) {
    return [];
  }
};

export const addServer = async (server: Omit<GlobalServer, 'id'>): Promise<string> => {
  const docRef = await db.collection('servers').add({
    ...server,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const updateServer = async (id: string, server: Partial<Omit<GlobalServer, 'id'>>): Promise<void> => {
  await db.collection('servers').doc(id).update(server);
};

export const deleteServer = async (id: string): Promise<void> => {
  await db.collection('servers').doc(id).delete();
};

const getCleanedSlug = (slug: string): string => {
    if (!slug) return '';
    if (slug.endsWith('/')) return slug;
    
    // Check if the slug ends with an episode prefix pattern or symbol
    const pattern = /[._\-\s/]([Ee]|[Ee][Pp]|[Hh])$/;
    const endsWithSeparator = /[._\-]$/;
    
    if (pattern.test(slug) || endsWithSeparator.test(slug)) {
        return slug;
    }
    return slug + '/';
};

export const resolveContentDynamicUrls = (contents: Content[], servers: GlobalServer[]): Content[] => {
    if (!servers || servers.length === 0) return contents;
    
    return contents.map(content => {
        // Find matching server if autoLinkConfig is used
        let preferredServer = content.autoLinkConfig?.serverId 
            ? servers.find(s => s.id === content.autoLinkConfig.serverId)
            : null;

        // Function to resolve any dynamic or static URL based on a global server, or fallbacks
        const resolveUrl = (originalUrl: string, serverIdFromConfig?: string): string => {
            if (!originalUrl || originalUrl.trim() === '') return originalUrl;
            if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) return originalUrl;
            
            const upgradeProtocol = (url: string): string => {
                if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
                    return url.replace(/^http:\/\//, 'https://');
                }
                return url;
            };

            try {
                const urlObj = new URL(originalUrl);
                const hostName = urlObj.hostname.toLowerCase();
                const externalDomains = [
                    'youtube.com', 'youtu.be', 'dailymotion.com', 'ok.ru', 
                    'vk.com', 'uqload', 'drive.google.com', 'vimeo.com',
                    'facebook.com', 'twitter.com', 'instagram.com'
                ];
                if (externalDomains.some(domain => hostName.includes(domain))) {
                    return upgradeProtocol(originalUrl);
                }
                
                const pathName = urlObj.pathname;
                
                // Determine which server to use
                let matchedSrv = preferredServer;
                
                // If we have a specific server ID from the config, try to resolve it first
                if (serverIdFromConfig && (!matchedSrv || matchedSrv.id !== serverIdFromConfig)) {
                    matchedSrv = servers.find(s => s.id === serverIdFromConfig) || null;
                }
                
                // If still not matched, try matching by checking host of the original URL with baseDomain hosts
                if (!matchedSrv) {
                    matchedSrv = servers.find(s => {
                        try {
                            const sUrl = new URL(s.baseDomain);
                            return sUrl.host === urlObj.host;
                        } catch {
                            return s.baseDomain.includes(urlObj.host);
                        }
                    }) || null;
                }
                
                // Ultimate Fallback: Default to the first server in the list if no match can be established
                if (!matchedSrv) {
                    matchedSrv = servers[0];
                }
                
                if (matchedSrv) {
                    const baseDomain = matchedSrv.baseDomain || '';
                    const cleanBaseDomain = baseDomain.endsWith('/') ? baseDomain.slice(0, -1) : baseDomain;
                    const cleanPath = pathName.startsWith('/') ? pathName : '/' + pathName;
                    const searchParam = urlObj.search || '';
                    return upgradeProtocol(cleanBaseDomain + cleanPath + searchParam);
                }
            } catch (err) {
                // Return fallback/original URL if parser fails
                return upgradeProtocol(originalUrl);
            }
            return upgradeProtocol(originalUrl);
        };

        // 1. Resolve movie/standalone direct servers at root level
        let updatedServers = content.servers;
        if (content.servers && content.servers.length > 0) {
            updatedServers = content.servers.map(server => {
                const updatedUrl = resolveUrl(server.url, content.autoLinkConfig?.serverId);
                const updatedDownloadUrl = server.downloadUrl 
                    ? resolveUrl(server.downloadUrl, content.autoLinkConfig?.serverId)
                    : updatedUrl;
                return {
                    ...server,
                    url: updatedUrl,
                    downloadUrl: updatedDownloadUrl
                };
            });
        }

        // 2. Resolve series, seasons, and episodes
        let updatedSeasons = content.seasons;
        if (content.seasons) {
            updatedSeasons = content.seasons.map(season => {
                if (!season.episodes) return season;
                
                const updatedEpisodes = season.episodes.map(episode => {
                    // Case A: Episode already has manual/static server URLs, resolve them dynamically applying current domain
                    if (episode.servers && episode.servers.length > 0) {
                        const updatedEpServers = episode.servers.map(server => {
                            const updatedUrl = resolveUrl(server.url, content.autoLinkConfig?.serverId);
                            const updatedDownloadUrl = server.downloadUrl 
                                ? resolveUrl(server.downloadUrl, content.autoLinkConfig?.serverId)
                                : updatedUrl;
                            return {
                                ...server,
                                url: updatedUrl,
                                downloadUrl: updatedDownloadUrl
                            };
                        });
                        
                        return {
                            ...episode,
                            servers: updatedEpServers
                        };
                    }
                    
                    // Case B: Generate the link dynamically from template metadata of autoLinkConfig (if present)
                    if (content.autoLinkConfig && content.autoLinkConfig.serverId) {
                        const matchedServer = servers.find(s => s.id === content.autoLinkConfig.serverId) || servers[0];
                        let baseDomain = matchedServer.baseDomain || '';
                        if (typeof window !== 'undefined' && window.location.protocol === 'https:' && baseDomain.startsWith('http://')) {
                            baseDomain = baseDomain.replace(/^http:\/\//, 'https://');
                        }
                        const slug = content.autoLinkConfig.seriesSlug || '';
                        const suffix = content.autoLinkConfig.suffix || '.mp4';
                        const padZero = content.autoLinkConfig.padZero;
                        const padTwoZeros = content.autoLinkConfig.padTwoZeros;

                        const extractEpisodeNumber = (title?: string): number => {
                            if (!title) return 0;
                            const match = title.match(/\d+/);
                            return match ? parseInt(match[0], 10) : 0;
                        };

                        const epNum = extractEpisodeNumber(episode.title);
                        if (epNum > 0) {
                            let numStr = `${epNum}`;
                            if (padTwoZeros) {
                                numStr = epNum < 10 ? `00${epNum}` : (epNum < 100 ? `0${epNum}` : `${epNum}`);
                            } else if (padZero) {
                                numStr = epNum < 10 ? `0${epNum}` : `${epNum}`;
                            }
                            
                            const cleanedSlug = getCleanedSlug(slug);
                            const cleanBaseDomain = baseDomain.endsWith('/') ? baseDomain.slice(0, -1) : baseDomain;
                            const dynamicUrl = `${cleanBaseDomain}/${cleanedSlug}${numStr}${suffix}`;
                            
                            const dynamicServer = {
                                id: 1, // Matches standard Server type id
                                name: matchedServer.name,
                                url: dynamicUrl,
                                downloadUrl: dynamicUrl,
                                isActive: true
                            };
                            
                            return {
                                ...episode,
                                servers: [dynamicServer]
                            };
                        }
                    }
                    return episode;
                });
                
                return {
                    ...season,
                    episodes: updatedEpisodes
                };
            });
        }
        
        return {
            ...content,
            servers: updatedServers,
            seasons: updatedSeasons
        };
    });
};

export const runDatabaseNormalizationMigration = async (serverId: string): Promise<{ successCount: number; failedCount: number }> => {
    let successCount = 0;
    let failedCount = 0;
    
    try {
        const snapshot = await db.collection('content').get();
        for (const doc of snapshot.docs) {
            const data = doc.data() as Content;
            let needsMigration = false;
            let seriesSlug = '';
            
            if (data.seasons) {
                for (const season of data.seasons) {
                    if (season.episodes) {
                        for (const ep of season.episodes) {
                            if (ep.servers) {
                                for (const s of ep.servers) {
                                    if (s.url && (s.url.startsWith('http://') || s.url.startsWith('https://'))) {
                                        try {
                                            const urlObj = new URL(s.url);
                                            const pathname = urlObj.pathname;
                                            const parts = pathname.split('/');
                                            if (parts.length > 2) {
                                                const slugParts = parts.slice(1, parts.length - 1);
                                                const candidateSlug = slugParts.join('/') + '/';
                                                if (candidateSlug && candidateSlug !== '/') {
                                                    seriesSlug = candidateSlug;
                                                    needsMigration = true;
                                                    break;
                                                }
                                            }
                                        } catch (urlErr) {
                                            // skip
                                        }
                                    }
                                }
                            }
                            if (needsMigration) break;
                        }
                    }
                    if (needsMigration) break;
                }
            }
            
            if (needsMigration && seriesSlug) {
                const autoLinkConfig = {
                    serverId,
                    seriesSlug,
                    suffix: '.mp4',
                    padZero: true,
                    padTwoZeros: false
                };
                
                await db.collection('content').doc(doc.id).update({
                    autoLinkConfig
                });
                successCount++;
            } else {
                failedCount++;
            }
        }
    } catch (err) {
        console.error("Migration error in firebase.ts:", err);
        throw err;
    }
    
    return { successCount, failedCount };
};

export const resolveSingleContentDynamicUrls = (content: Content, servers: GlobalServer[]): Content => {
    return resolveContentDynamicUrls([content], servers)[0];
};
