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

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const { 
      requestId, 
      userId, 
      userName, 
      contentName, 
      contentType, 
      notes, 
      timestamp, 
      status = 'pending' 
    } = req.body;

    if (!contentName) {
      return res.status(400).json({ success: false, error: 'contentName is required.' });
    }

    // Map contentType (Arabic/English) to standard type 'movie' or 'series'
    let mappedType = 'movie';
    if (contentType) {
      const typeStr = String(contentType).toLowerCase();
      if (typeStr.includes('مسلسل') || typeStr.includes('series') || typeStr.includes('tv') || typeStr.includes('show')) {
        mappedType = 'series';
      }
    }

    // Map timestamp to Date object
    let createdAt = new Date();
    if (timestamp) {
      // Check if unix timestamp is in seconds or milliseconds
      const ms = timestamp > 9999999999 ? Number(timestamp) : Number(timestamp) * 1000;
      if (!isNaN(ms)) {
        createdAt = new Date(ms);
      }
    }

    const requestData = {
      title: contentName.trim(),
      type: mappedType,
      notes: notes ? notes.trim() : '',
      userId: userId || null,
      userName: userName || null,
      requestId: requestId || null,
      status: status || 'pending',
      createdAt: admin.firestore.Timestamp.fromDate(createdAt)
    };

    let docId = requestId;
    if (docId) {
      // Ensure requestId matches some basic alphanumeric format or sanitize it
      docId = String(docId).replace(/[^a-zA-Z0-9_\-]/g, '');
    }

    if (docId && docId.trim().length > 0) {
      await db.collection('requests').doc(docId).set(requestData, { merge: true });
    } else {
      const docRef = await db.collection('requests').add(requestData);
      docId = docRef.id;
    }

    return res.status(200).json({
      success: true,
      message: 'Request received and stored successfully.',
      requestId: docId
    });

  } catch (error) {
    console.error('Content Request API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
