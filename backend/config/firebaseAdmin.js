const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      return admin.apps[0];
    }

    // Initialize with project ID (for development)
    const app = admin.initializeApp({
      projectId: 'buyboxbot-3cd51'
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return app;
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error);
    // Don't throw error, just log it
    return null;
  }
};

// Verify Firebase ID token
const verifyIdToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
};

// Get user by UID
const getUserByUid = async (uid) => {
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error getting user by UID:', error);
    throw error;
  }
};

module.exports = {
  initializeFirebaseAdmin,
  verifyIdToken,
  getUserByUid,
  admin
}; 