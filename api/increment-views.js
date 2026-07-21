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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const { contentId } = req.body;

    if (!contentId) {
      return res.status(400).json({ success: false, error: 'contentId is required.' });
    }

    const docRef = db.collection('content').doc(contentId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ success: false, error: 'Content not found.' });
    }

    // Increment views safely using FieldValue.increment
    await docRef.update({
      views: admin.firestore.FieldValue.increment(1)
    });

    return res.status(200).json({
      success: true,
      message: 'View count incremented successfully.',
      contentId: contentId
    });

  } catch (error) {
    console.error('Increment Views API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
