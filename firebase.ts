
// FIX: Use 'compat' imports to support v8 namespaced syntax with Firebase v9+ SDK.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/messaging"; // Import Messaging

import type { Ad, SiteSettings, User, PinnedContentState, PinnedItem, PageKey, ContentRequest } from './types';
import { initialSiteSettings, pinnedContentData as initialPinnedData } from './data';
import { UserRole } from './types';

// Safe environment variable access
const getEnv = () => {
  try {
    // @ts-ignore
    return (import.meta && import.meta.env) || {};
  } catch {
    return {};
  }
};

const env = getEnv();

// Configuration is now pulled from Environment Variables (Vercel/local .env)
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyBVK0Zla5VD05Hgf4QqExAWUuXX64odyes", 
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "cinematic-d3697.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "cinematic-d3697", 
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "cinematic-d3697.firebasestorage.app", 
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "247576999692",
  appId: env.VITE_FIREBASE_APP_ID || "1:247576999692:web:309f001a211dc1b150fb29", 
};

// Initialize Firebase using v8 namespaced syntax via compat library.
if (!firebase.apps.length) {
  console.log(`[Firebase] Initializing with Project ID: ${firebaseConfig.projectId}`);
  firebase.initializeApp(firebaseConfig);
}
const app = firebase.app();

// --- Firestore Initialization (Fixed for Connectivity) ---
// We use the compat instance directly. 
export const db = app.firestore();

// Apply standard settings - Updated to suppress host override warning
db.settings({
  ignoreUndefinedProperties: true,
  merge: true, 
} as any); // Cast to any to avoid strict type checks on compat interface if types are outdated

// Enable offline persistence (standard compat method)
// We wrap this in a catch block because it can fail in certain environments (e.g. multiple tabs)
db.enablePersistence({ synchronizeTabs: true })
  .catch((err) => {
    if (err.code == 'failed-precondition') {
        // console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
        // console.warn('Firestore persistence not supported in this browser');
    }
  });

export const auth = app.auth();
export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
export const Timestamp = firebase.firestore.Timestamp;

// --- Messaging Initialization ---
export let messaging: firebase.messaging.Messaging | null = null;
try {
  if (firebase.messaging.isSupported()) {
    messaging = firebase.messaging();
  }
} catch (e) {
  // console.warn("Firebase Messaging not supported in this environment");
}

// --- Helpers ---
const safeGetTimestamp = (timestamp: any): string => {
    // Check if it's a Firebase Timestamp (v8 has toDate())
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString();
    }
    if (typeof timestamp === 'string') {
        return timestamp;
    }
    return new Date().toISOString();
};

// --- Helper: Slug Generator (SEO) ---
export const generateSlug = (title: string): string => {
    if (!title) return '';
    
    return title
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\u0621-\u064A\-]+/g, '') // Remove all non-word chars (keeping Arabic letters & dashes)
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
};


// ---- Site Settings ----
export const getSiteSettings = async (): Promise<SiteSettings> => {
    try {
        const docSnap = await db.collection("settings").doc("site").get();
        if (docSnap.exists) {
            const data = docSnap.data() as Partial<SiteSettings>;
            // Merge with initial settings to ensure all fields exist (schema migration safety)
            return {
                ...initialSiteSettings,
                ...data,
                shoutBar: { ...initialSiteSettings.shoutBar, ...(data.shoutBar || {}) },
                socialLinks: { ...initialSiteSettings.socialLinks, ...(data.socialLinks || {}) }
            };
        } else {
            // Attempt to create if possible, but don't fail if permission denied (e.g. public user)
            try {
                await db.collection("settings").doc("site").set(initialSiteSettings);
            } catch(e) { /* ignore write errors for public */ }
            return initialSiteSettings;
        }
    } catch (error) {
        console.error("Error fetching site settings:", error);
        // Return default settings so the app doesn't crash
        return initialSiteSettings;
    }
};

export const updateSiteSettings = async (settings: SiteSettings): Promise<void> => {
    await db.collection("settings").doc("site").set(settings, { merge: true });
};

// ---- Pinned Content (New Implementation) ----
export const getPinnedContent = async (): Promise<PinnedContentState> => {
    try {
        const docSnap = await db.collection("settings").doc("pinned").get();
        
        if (docSnap.exists) {
            return { ...initialPinnedData, ...docSnap.data() };
        } else {
             try {
                await db.collection("settings").doc("pinned").set(initialPinnedData);
             } catch(e) { /* ignore write errors */ }
            return initialPinnedData;
        }
    } catch (error) {
        // console.warn("Error fetching pinned content:", error);
        return initialPinnedData;
    }
};

export const updatePinnedContentForPage = async (pageKey: PageKey, items: PinnedItem[]): Promise<void> => {
    await db.collection("settings").doc("pinned").set({
        [pageKey]: items
    }, { merge: true });
};


// ---- Ads ----
export const getAds = async (): Promise<Ad[]> => {
    try {
        const querySnapshot = await db.collection("ads").orderBy("updatedAt", "desc").get();
        return querySnapshot.docs.map(d => ({
            ...(d.data() as Omit<Ad, 'id' | 'updatedAt'>),
            id: d.id,
            placement: d.data().placement || d.data().position || 'home-top',
            timerDuration: d.data().timerDuration || 0,
            updatedAt: safeGetTimestamp(d.data().updatedAt),
        })) as Ad[];
    } catch (error) {
        console.error("Error fetching ads:", error);
        return [];
    }
};

export const getAdByPosition = async (position: string): Promise<Ad | null> => {
  try {
    let q = db.collection("ads")
        .where("placement", "==", position)
        .where("status", "==", "active")
        .limit(1);
    
    let snap = await q.get();
    if (!snap.empty) {
        const doc = snap.docs[0];
        return { id: doc.id, ...doc.data() } as Ad;
    }
    
    // Fallback query for 'position' field (backward compat)
    const q2 = db.collection("ads")
        .where("position", "==", position)
        .where("status", "==", "active")
        .limit(1);
        
    const snap2 = await q2.get();
    if(!snap2.empty) {
         const doc = snap2.docs[0];
        return { id: doc.id, ...doc.data() } as Ad;
    }

    return null;
  } catch (e) {
    // console.error(`Error fetching ad by position [${position}]:`, e);
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
    if (adData.placement) data.position = adData.placement; // Sync position field
    
    await db.collection("ads").doc(adId).update(data);
};

export const deleteAd = async (adId: string): Promise<void> => {
    await db.collection("ads").doc(adId).delete();
};


// ---- Users ----
export const getUsers = async (): Promise<User[]> => {
    try {
        const querySnapshot = await db.collection("users").get();
        return querySnapshot.docs.map(d => ({
            ...(d.data() as Omit<User, 'id'>),
            id: d.id,
        }));
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
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
        console.error("Error getting user profile:", e);
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

// --- Push Notifications Logic ---
export const requestNotificationPermission = async (userId: string) => {
    if (!messaging) return;
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            // Get token - VAPID key is often required for web push.
            // Replace with your actual VAPID key if you have generated one in Firebase Console -> Project Settings -> Cloud Messaging -> Web Configuration
            const token = await messaging.getToken({
                vapidKey: 'BM_s__YOUR_VAPID_KEY_IF_NEEDED__HERE' 
            });
            
            if (token && userId) {
                console.log('FCM Token Generated:', token);
                
                // Save token to user document in Firestore using set with merge
                // using arrayUnion to avoid duplicates if the token already exists
                await db.collection('users').doc(userId).set({
                    fcmTokens: firebase.firestore.FieldValue.arrayUnion(token)
                }, { merge: true });
                
                console.log('Token saved to DB successfully!');
            }
        }
    } catch (error) {
        console.error('Unable to get permission to notify.', error);
    }
};

// ---- Content Requests ----
export const addContentRequest = async (request: Omit<ContentRequest, 'id' | 'createdAt' | 'status'>): Promise<void> => {
    // Sanitize data: Ensure userId is null if undefined to avoid Firestore "Unsupported field value: undefined" error
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
        console.error("Error fetching requests:", e);
        return [];
    }
};

export const deleteContentRequest = async (requestId: string): Promise<void> => {
    await db.collection('content_requests').doc(requestId).delete();
};

// ---- Reporting System ----
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