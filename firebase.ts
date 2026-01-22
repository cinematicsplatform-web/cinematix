
// FIX: Use 'compat' imports to support v8 namespaced syntax with Firebase v9+ SDK.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/messaging";
import "firebase/compat/storage";

import type { Ad, SiteSettings, User, PinnedContentState, PinnedItem, PageKey, ContentRequest, HomeSection, Content, Top10State, Story, Notification, BroadcastNotification, Person, ReleaseSchedule } from '@/types';
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

// Configuration
const firebaseConfig = {
  apiKey: getEnvVar("NEXT_PUBLIC_FIREBASE_API_KEY", "VITE_FIREBASE_API_KEY") || "AIzaSyBVK0Zla5VD05Hgf4QqExAWUuXX64odyes", 
  authDomain: getEnvVar("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_AUTH_DOMAIN") || "cinematic-d3697.firebaseapp.com",
  projectId: getEnvVar("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "VITE_FIREBASE_PROJECT_ID") || "cinematic-d3697", 
  storageBucket: getEnvVar("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "VITE_FIREBASE_STORAGE_BUCKET") || "cinematic-d3697.firebasestorage.app", 
  messagingSenderId: getEnvVar("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "VITE_FIREBASE_MESSAGING_SENDER_ID") || "247576999692",
  appId: getEnvVar("NEXT_PUBLIC_FIREBASE_APP_ID", "VITE_FIREBASE_APP_ID") || "1:247576999692:web:309f001a211dc1b150fb29", 
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const app = firebase.app();

// Initialize Firestore
const firestoreInstance = app.firestore();

/**
 * معالجة تحذير "overriding the original host":
 * تم إزالة experimentalAutoDetectLongPolling لأنه المسبب الرئيسي للتحذير في البيئات الحديثة
 * إلا إذا كان هناك حاجة ماسة له (مثل العمل خلف بروكـسي مقيد جداً).
 */
try {
  firestoreInstance.settings({
    ignoreUndefinedProperties: true,
    // تم إزالة الخاصية التي تسبب التحذير لضمان استقرار الاتصال الافتراضي
  });
} catch (e: any) {
  if (!e.message.includes('already been initialized')) {
    console.warn("[Cinematix] Firestore settings error:", e.message);
  }
}

export const db = firestoreInstance;
export const storage = app.storage();

/**
 * معالجة تحذير "enableMultiTabIndexedDbPersistence() will be deprecated":
 * في مكتبة compat، نستخدم enablePersistence ولكن نلتقط الخطأ لمنع تكرار التحذير
 */
if (typeof window !== 'undefined') {
    // تفعيل التخزين المتعدد التبويبات بطريقة آمنة
    db.enablePersistence({ synchronizeTabs: true })
      .catch((err) => {
          if (err.code === 'failed-precondition') {
              // قد يكون هناك تبويب آخر مفتوح بالفعل، لا حاجة لإظهار خطأ للمستخدم
              console.debug("[Cinematix] Persistence already active in another tab.");
          } else if (err.code === 'unimplemented') {
              console.warn("[Cinematix] Persistence failed: Browser not supported.");
          }
      });
}

export const auth = app.auth();
export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
export const Timestamp = firebase.firestore.Timestamp;

export let messaging: firebase.messaging.Messaging | null = null;
if (typeof window !== 'undefined') {
    try {
      if (firebase.messaging.isSupported()) {
        messaging = firebase.messaging();
      }
    } catch (e) {
      // SILENT
    }
}

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
    const code = error?.code;
    const msg = error?.message || '';
    if (msg.toLowerCase().includes('index')) {
        console.error(`[Cinematix] Missing Index for ${context}.`);
        return fallback;
    }
    if (code === 'unavailable' || msg.includes('offline') || code === 'failed-precondition') {
        return fallback;
    } 
    return fallback;
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

// REFINED: Standard Ads fetching with full field mapping
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
                timerDuration: data.timerDuration || 0,
                updatedAt: safeGetTimestamp(data.updatedAt),
            };
        }) as Ad[];
    } catch (error) {
        return handleFirestoreError(error, 'ads', []);
    }
};

// REFINED: Direct Fetch for standalone zones
export const getAdByPosition = async (position: string): Promise<Ad | null> => {
  try {
    // Try querying by placement field
    let q = db.collection("ads")
        .where("placement", "==", position)
        .where("status", "==", "active")
        .limit(1);
    
    let snap = await q.get();
    
    // Fallback for legacy position field
    if (snap.empty) {
        q = db.collection("ads")
            .where("position", "==", position)
            .where("status", "==", "active")
            .limit(1);
        snap = await q.get();
    }

    if (!snap.empty) {
        const doc = snap.docs[0];
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data, 
            placement: data.placement || data.position || position,
            type: data.type || 'code',
            status: 'active'
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

export const getAllContent = async (): Promise<Content[]> => {
    try {
        const snapshot = await db.collection('content').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
    } catch (error) {
        return handleFirestoreError(error, 'content', []);
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
    delete dataToUpdate.id;
    delete dataToUpdate.password;
    await db.collection("users").doc(userId).update(dataToUpdate);
};

export const deleteUserFromFirestore = async (userId: string): Promise<void> => {
    await db.collection("users").doc(userId).delete();
};

export const requestNotificationPermission = async (userId: string) => {
    if (!messaging || typeof window === 'undefined') return;
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await messaging.getToken({
                vapidKey: 'BM_s__YOUR_VAPID_KEY_IF_NEEDED__HERE' 
            });
            if (token && userId) {
                await db.collection('users').doc(userId).set({
                    fcmTokens: firebase.firestore.FieldValue.arrayUnion(token)
                }, { merge: true });
            }
        }
    } catch (error) {
        // SILENT
    }
};

export const addContentRequest = async (request: Omit<ContentRequest, 'id' | 'createdAt' | 'status'>): Promise<void> => {
    const sanitizedData = {
        ...request,
        userId: request.userId || null,
        status: 'pending',
        createdAt: serverTimestamp()
    };
    await db.collection('content_requests').add(sanitizedData);
};

export const getContentRequests = async (): Promise<ContentRequest[]> => {
    try {
        const snapshot = await db.collection('content_requests').orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: safeGetTimestamp(doc.data().createdAt)
        })) as ContentRequest[];
    } catch (e) {
        return [];
    }
};

export const deleteContentRequest = async (requestId: string): Promise<void> => {
    await db.collection('content_requests').doc(requestId).delete();
};

export const addReport = async (reportData: { 
    contentId: string;
    contentTitle: string;
    episode?: string;
    reason: string;
    description?: string;
}): Promise<void> => {
    await db.collection('reports').add({
        ...reportData,
        status: 'open',
        createdAt: serverTimestamp()
    });
};

export const getReports = async (): Promise<any[]> => {
    try {
        const snapshot = await db.collection('reports').orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: safeGetTimestamp(doc.data().createdAt)
        }));
    } catch (e) {
        return [];
    }
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
