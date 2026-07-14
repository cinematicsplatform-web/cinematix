const admin = require('firebase-admin');

const hasFirebaseCreds = process.env.FIREBASE_PROJECT_ID && 
                         process.env.FIREBASE_CLIENT_EMAIL && 
                         process.env.FIREBASE_PRIVATE_KEY;

// Initialize Firebase Admin (Singleton pattern)
if (hasFirebaseCreds && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const db = admin.apps.length > 0 ? admin.firestore() : null;

module.exports = async (req, res) => {
  // Allow secure access using a secret query parameter (optional but recommended)
  const { secret } = req.body || req.query;
  const expectedSecret = process.env.INDEXING_SECRET || 'cinematix-cron-secret';
  
  if (process.env.INDEXING_SECRET && secret !== expectedSecret) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (!db) {
    return res.status(500).json({ success: false, error: 'Database connection not available.' });
  }

  const now = new Date();
  const nowStr = now.toISOString();
  let updatedCount = 0;
  const logs = [];

  try {
    // 1. Fetch all users to log internal notifications (needed for FCM and in-app logs)
    const usersSnapshot = await db.collection("users").get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 2. Fetch all content that could be scheduled
    const contentSnapshot = await db.collection("content").get();
    const contents = contentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    for (const content of contents) {
      // Case 1: Standalone content (Movie, etc.) is scheduled and has passed its release time
      if (content.isScheduled && content.scheduledAt) {
        const schedDate = new Date(content.scheduledAt);
        if (schedDate <= now) {
          const shouldNotify = content.notifyOnPublish !== false && !content.notificationSent;
          
          logs.push(`Publishing scheduled standalone content: ${content.title}`);
          
          // Update DB to mark as published (live) and set updatedAt to current time
          await db.collection("content").doc(content.id).update({
            isScheduled: false,
            notificationSent: shouldNotify ? true : (content.notificationSent || false),
            updatedAt: nowStr
          });

          updatedCount++;

          if (shouldNotify) {
            try {
              const broadcastId = String(Date.now());
              const targetUrl = `/${content.type}/${content.slug || content.id}`;
              const title = `متاح الآن! شاهد ${content.title} 🎬`;
              const body = `أصبح فيلم ${content.title} متاحاً الآن للمشاهدة المباشرة بدقة عالية على سينماتيكس.`;
              const image = content.backdrop || content.poster || '';

              // Send FCM Push Notification
              const payload = {
                notification: { title, body },
                topic: 'all_users',
                data: {
                  title: String(title),
                  message: String(body),
                  click_action: "FLUTTER_NOTIFICATION_CLICK",
                  targetUrl: String(targetUrl || '/'),
                  type: 'new_content',
                  broadcastId: String(broadcastId),
                  contentId: String(content.id),
                  image: image ? String(image) : '',
                  picture: image ? String(image) : '',
                  imageUrl: image ? String(image) : '',
                  pic: image ? String(image) : '',
                }
              };
              if (image) {
                payload.notification.imageUrl = String(image);
              }

              await admin.messaging().send(payload);

              // Log in-app notifications for each user
              const batch = db.batch();
              users.forEach((user) => {
                const notifRef = db.collection('notifications').doc();
                batch.set(notifRef, {
                  userId: user.id,
                  title,
                  body,
                  type: 'new_content',
                  isRead: false,
                  createdAt: nowStr,
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
                createdAt: nowStr,
                recipientCount: users.length,
                contentId: content.id,
                isAutoScheduled: true
              });

              await batch.commit();
              logs.push(`Sent FCM and in-app notifications for standalone content: ${content.title}`);
            } catch (err) {
              console.error(`Failed to send notification for ${content.title}:`, err);
              logs.push(`Failed to send notification for ${content.title}: ${err.message}`);
            }
          }
        }
      }

      // Case 2: Episodes of a Series/Program are scheduled and have passed their release time
      if (content.seasons && (content.type === 'series' || content.type === 'program')) {
        let hasChanges = false;
        const cleanSeasons = content.seasons.map(s => {
          const episodes = (s.episodes || []).map(ep => {
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
          });
          return { ...s, episodes };
        });

        if (hasChanges) {
          logs.push(`Publishing scheduled episode(s) for series: ${content.title}`);
          
          // Update in database and refresh updatedAt
          await db.collection("content").doc(content.id).update({
            seasons: cleanSeasons,
            updatedAt: nowStr
          });

          updatedCount++;

          // Send notification for each newly unlocked episode
          for (const season of cleanSeasons) {
            for (const ep of season.episodes) {
              const origSeason = content.seasons.find(s => s.id === season.id);
              const origEp = origSeason?.episodes.find(e => e.id === ep.id);
              
              if (ep.notificationSent && (!origEp || !origEp.notificationSent)) {
                try {
                  const broadcastId = String(Date.now());
                  const extractEpNo = (t) => {
                    if (!t) return 0;
                    const explicitMatch = t.toString().match(/(?:الحلقة|حلقة|ep|episode|الـحـلـقـة|الفصل|فصل|الاخيرة|الأخيرة)\s*(\d+)/i);
                    if (explicitMatch && explicitMatch[1]) return parseInt(explicitMatch[1], 10);
                    const digits = t.toString().match(/\d+/g);
                    if (digits && digits.length > 0) return parseInt(digits[0], 10);
                    return 0;
                  };
                  const epNum = extractEpNo(ep.title);
                  const targetUrl = `/watch/${content.slug || content.id}/${season.seasonNumber}/${epNum}`;
                  const title = `حلقة جديدة من ${content.title}! 🍿`;
                  const body = `الآن يمكنك مشاهدة ${ep.title || `الحلقة ${epNum}`} من ${content.title} على سينماتيكس.`;
                  const image = ep.thumbnail || content.backdrop || content.poster || '';

                  // Send FCM Push Notification
                  const payload = {
                    notification: { title, body },
                    topic: 'all_users',
                    data: {
                      title: String(title),
                      message: String(body),
                      click_action: "FLUTTER_NOTIFICATION_CLICK",
                      targetUrl: String(targetUrl || '/'),
                      type: 'new_content',
                      broadcastId: String(broadcastId),
                      contentId: String(content.id),
                      image: image ? String(image) : '',
                      picture: image ? String(image) : '',
                      imageUrl: image ? String(image) : '',
                      pic: image ? String(image) : '',
                    }
                  };
                  if (image) {
                    payload.notification.imageUrl = String(image);
                  }

                  await admin.messaging().send(payload);

                  // Log in-app notifications
                  const batch = db.batch();
                  users.forEach((user) => {
                    const notifRef = db.collection('notifications').doc();
                    batch.set(notifRef, {
                      userId: user.id,
                      title,
                      body,
                      type: 'new_content',
                      isRead: false,
                      createdAt: nowStr,
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
                    createdAt: nowStr,
                    recipientCount: users.length,
                    contentId: content.id,
                    isAutoScheduled: true
                  });

                  await batch.commit();
                  logs.push(`Sent FCM and in-app notifications for series: ${content.title}, Season ${season.seasonNumber}, Ep ${epNum}`);
                } catch (err) {
                  console.error(`Failed to send episode notification for ${content.title}:`, err);
                  logs.push(`Failed to send episode notification for ${content.title}: ${err.message}`);
                }
              }
            }
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      time: nowStr,
      updatedCount,
      logs
    });

  } catch (error) {
    console.error('Cron Publish API Error:', error);
    return res.status(500).json({ success: false, error: error.message, logs });
  }
};
