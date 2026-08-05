import { db, serverTimestamp } from './firebase';
import firebase from 'firebase/compat/app';

/**
 * Logs a search query to Firestore to track user interest.
 */
export const logSearchQuery = async (query: string) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized || normalized.length < 2) return;

    try {
        const searchRef = db.collection('analytics_search').doc(normalized);
        await searchRef.set({
            query: normalized,
            count: firebase.firestore.FieldValue.increment(1),
            lastSearched: serverTimestamp()
        }, { merge: true });
    } catch (e) {
        console.error("Analytics: Failed to log search query", e);
    }
};

/**
 * Logs a watch session duration.
 */
export const logWatchSession = async (durationSeconds: number) => {
    if (durationSeconds <= 0) return;

    try {
        const sessionRef = db.collection('analytics_sessions').doc();
        await sessionRef.set({
            duration: durationSeconds,
            timestamp: serverTimestamp()
        });
        
        // Also update a global counter for easy aggregation
        const statsRef = db.collection('analytics_global').doc('watch_stats');
        await statsRef.set({
            totalSeconds: firebase.firestore.FieldValue.increment(durationSeconds),
            totalSessions: firebase.firestore.FieldValue.increment(1)
        }, { merge: true });
    } catch (e) {
        console.error("Analytics: Failed to log watch session", e);
    }
};

/**
 * Detects device type and logs the visit.
 */
export const logDeviceVisit = async () => {
    // Only log once per session to avoid noise
    const sessionLogged = sessionStorage.getItem('cinematix_visit_logged');
    if (sessionLogged) return;

    const userAgent = navigator.userAgent;
    let device = 'Desktop';

    if (/SmartTV|Tizen|WebOS|AppleTV|HbbTV/i.test(userAgent)) {
        device = 'Smart TV';
    } else if (/Tablet|iPad|PlayBook/i.test(userAgent)) {
        device = 'Tablet';
    } else if (/Mobi|Android|iPhone/i.test(userAgent)) {
        device = 'Mobile';
    }

    try {
        const deviceRef = db.collection('analytics_devices').doc(device);
        await deviceRef.set({
            deviceType: device,
            count: firebase.firestore.FieldValue.increment(1),
            lastVisit: serverTimestamp()
        }, { merge: true });
        
        sessionStorage.setItem('cinematix_visit_logged', 'true');
    } catch (e) {
        console.error("Analytics: Failed to log device visit", e);
    }
};

/**
 * Gets or creates a persistent session ID for the current browser tab/session.
 */
export const getWebSessionId = (): string => {
    let sessId = sessionStorage.getItem('cinematix_web_sess_id');
    if (!sessId) {
        sessId = 'web_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
        sessionStorage.setItem('cinematix_web_sess_id', sessId);
    }
    return sessId;
};

/**
 * Sends a live active session heartbeat for Web Users to Firestore `web_active_sessions`.
 */
export const sendWebHeartbeat = async (currentPage: string = '/', user?: { id?: string; email?: string; name?: string } | null) => {
    try {
        const sessionId = getWebSessionId();
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
        
        let device = 'سطح المكتب (PC)';
        if (/SmartTV|Tizen|WebOS|AppleTV|HbbTV/i.test(userAgent)) {
            device = 'شاشة ذكية (Smart TV)';
        } else if (/Tablet|iPad|PlayBook/i.test(userAgent)) {
            device = 'تابلت (Tablet)';
        } else if (/Mobi|Android|iPhone/i.test(userAgent)) {
            device = 'هاتف (Mobile)';
        }

        let browser = 'متصفح ويب';
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Edg')) browser = 'Edge';

        const isoNow = new Date().toISOString();
        const todayStr = isoNow.split('T')[0];

        const sessionRef = db.collection('web_active_sessions').doc(sessionId);
        await sessionRef.set({
            sessionId,
            userId: user?.id || 'guest',
            userName: user?.name || user?.email || 'زائر الموقع',
            device,
            browser,
            currentPage,
            lastSeen: isoNow,
            lastSeenMs: Date.now(),
            date: todayStr,
            isLive: true
        }, { merge: true });

        // Log to web_usage_logs for historical reports once per interval
        const lastLoggedTime = Number(sessionStorage.getItem('cinematix_last_usage_log') || '0');
        if (Date.now() - lastLoggedTime > 5 * 60 * 1000) { // Log history every 5 mins
            await db.collection('web_usage_logs').add({
                sessionId,
                userId: user?.id || 'guest',
                userName: user?.name || user?.email || 'زائر الموقع',
                device,
                browser,
                page: currentPage,
                timestamp: isoNow,
                createdAtMs: Date.now(),
                date: todayStr
            });
            sessionStorage.setItem('cinematix_last_usage_log', String(Date.now()));
        }

    } catch (e) {
        console.warn("Analytics: Web heartbeat failed", e);
    }
};

