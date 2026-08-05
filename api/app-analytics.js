const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY 
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
          : undefined,
      }),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const db = admin.firestore();

// Secret API key default
const DEFAULT_API_KEY = process.env.CINEMATIX_APP_API_KEY || 'cinematix_mobile_app_sec_key_2026';

module.exports = async (req, res) => {
  // Enable CORS for mobile app requests and web
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-App-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const now = new Date();
  const isoNow = now.toISOString();
  const todayStr = isoNow.split('T')[0];

  // GET: Retrieve usage stats summary for API integrations or status check
  if (req.method === 'GET') {
    try {
      const activeAppSnap = await db.collection('app_active_sessions')
        .where('lastSeenMs', '>=', Date.now() - 3 * 60 * 1000)
        .get();

      const activeWebSnap = await db.collection('web_active_sessions')
        .where('lastSeenMs', '>=', Date.now() - 3 * 60 * 1000)
        .get();

      return res.status(200).json({
        success: true,
        status: 'online',
        serverTime: isoNow,
        activeAppUsersNow: activeAppSnap.size,
        activeWebUsersNow: activeWebSnap.size,
        endpoint: '/api/app-analytics',
        supportedActions: ['heartbeat', 'screen_view', 'play_video', 'app_open']
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const payload = req.body || {};
    const {
      apiKey,
      sessionId,
      userId,
      userName,
      platform = 'android',
      appVersion = '1.0.0',
      deviceModel = 'Unknown Device',
      osVersion = 'Android',
      currentScreen = 'Home',
      action = 'heartbeat',
      ipAddress,
      details = {}
    } = payload;

    // Generate or use sessionId
    const effectiveSessionId = sessionId || `app_sess_${platform}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const effectiveUserId = userId || 'guest';
    const effectiveUserName = userName || (userId ? `User #${userId.slice(0, 6)}` : 'زائر التطبيق');

    const sessionData = {
      sessionId: effectiveSessionId,
      userId: effectiveUserId,
      userName: effectiveUserName,
      platform: platform.toLowerCase(),
      appVersion,
      deviceModel,
      osVersion,
      currentScreen,
      action,
      ipAddress: ipAddress || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1',
      lastSeen: isoNow,
      lastSeenMs: Date.now(),
      date: todayStr,
      details
    };

    // 1. Update/Set active session doc in app_active_sessions
    await db.collection('app_active_sessions').doc(effectiveSessionId).set(sessionData, { merge: true });

    // 2. Log entry in app_usage_logs for historical analysis
    await db.collection('app_usage_logs').add({
      ...sessionData,
      createdAt: isoNow,
      createdAtMs: Date.now()
    });

    // 3. Increment counters in app_daily_stats
    const dailyRef = db.collection('app_daily_stats').doc(todayStr);
    await dailyRef.set({
      date: todayStr,
      totalHeartbeats: admin.firestore.FieldValue.increment(1),
      lastUpdated: isoNow,
      [`platform_${platform.toLowerCase()}`]: admin.firestore.FieldValue.increment(1),
      [`version_${appVersion.replace(/\./g, '_')}`]: admin.firestore.FieldValue.increment(1)
    }, { merge: true });

    // Return current live active users count in response
    const liveSnap = await db.collection('app_active_sessions')
      .where('lastSeenMs', '>=', Date.now() - 3 * 60 * 1000)
      .get();

    return res.status(200).json({
      success: true,
      message: 'App heartbeat recorded successfully',
      sessionId: effectiveSessionId,
      serverTime: isoNow,
      activeAppUsersNow: liveSnap.size
    });

  } catch (error) {
    console.error('App Analytics API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
