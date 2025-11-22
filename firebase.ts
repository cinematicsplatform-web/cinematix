
// FIX: Use 'compat' imports to support v8 namespaced syntax with Firebase v9+ SDK.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
// FIX: Import Modular SDK functions for modern persistence initialization
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

import type { Ad, SiteSettings, User, PinnedContentState, PinnedItem, PageKey } from './types';
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
// Fallback values are kept for local development convenience but should be overridden in production.
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
  // DEBUG: Log the project ID to ensure env vars are loaded correctly
  console.log(`[Firebase] Initializing with Project ID: ${firebaseConfig.projectId}`);
  firebase.initializeApp(firebaseConfig);
}
const app = firebase.app();

// --- CRITICAL FIX: Modern Firestore Initialization ---
// We use initializeFirestore from the Modular SDK to configure persistence and settings.
// This replaces the deprecated enableMultiTabIndexedDbPersistence and separate db.settings() calls.
// experimentalAutoDetectLongPolling is passed here to resolve connection issues.
initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalAutoDetectLongPolling: true,
  ignoreUndefinedProperties: true,
});

// Export Compat instance for the rest of the app
// Since initializeFirestore was called on the app instance above, app.firestore() will return
// the initialized instance with the correct settings.
export const db = app.firestore();
export const auth = app.auth();
export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
export const Timestamp = firebase.firestore.Timestamp;


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
// Generates clean, SEO-friendly slugs for Arabic and English
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
            console.log("No site settings found, creating from initial data...");
            await db.collection("settings").doc("site").set(initialSiteSettings);
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
        // FIX: Force fetch from server to avoid stale cache issues (Point 3 in user request)
        const docSnap = await db.collection("settings").doc("pinned").get({ source: 'server' });
        
        if (docSnap.exists) {
            // Return existing data merged with initial structure to ensure all keys exist
            return { ...initialPinnedData, ...docSnap.data() };
        } else {
            // Initialize if not exists
            await db.collection("settings").doc("pinned").set(initialPinnedData);
            return initialPinnedData;
        }
    } catch (error) {
        console.warn("Error fetching pinned content from server, attempting cache fallback:", error);
        try {
             // Fallback to default get (cache or server) if forced server fetch fails
             const docSnap = await db.collection("settings").doc("pinned").get();
             if (docSnap.exists) {
                return { ...initialPinnedData, ...docSnap.data() };
             }
        } catch(e) {
            console.error("Error fetching pinned content:", e);
        }
        return initialPinnedData;
    }
};

export const updatePinnedContentForPage = async (pageKey: PageKey, items: PinnedItem[]): Promise<void> => {
    // Update only the specific page key using merge: true
    // This ensures we don't overwrite other pages' pinned items
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
            updatedAt: safeGetTimestamp(d.data().updatedAt),
        }));
    } catch (error) {
        console.error("Error fetching ads:", error);
        return [];
    }
};

export const addAd = async (adData: Omit<Ad, 'id' | 'updatedAt'>): Promise<string> => {
    const docRef = await db.collection("ads").add({ ...adData, updatedAt: serverTimestamp() });
    return docRef.id;
};

export const updateAd = async (adId: string, adData: Partial<Omit<Ad, 'id'>>): Promise<void> => {
    await db.collection("ads").doc(adId).update({ ...adData, updatedAt: serverTimestamp() });
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

// FIX: Updated return type to include 'role' which is used in App.tsx
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
    await db.collection("users").doc(uid).set({ ...data, role: UserRole.User }); // Default role
};

export const updateUserProfileInFirestore = async (userId: string, userData: Partial<User>): Promise<void> => {
    const dataToUpdate = { ...userData };
    delete dataToUpdate.id;
    delete dataToUpdate.password;
    // Don't delete role if it's being explicitly updated (e.g. by admin), but here we mostly update profiles
    await db.collection("users").doc(userId).update(dataToUpdate);
};

export const deleteUserFromFirestore = async (userId: string): Promise<void> => {
    await db.collection("users").doc(userId).delete();
};
