/**
 * MedLink — Firebase Admin initialisation (singleton)
 *
 * Firebase Admin is initialised once using the service account JSON
 * stored in the FIREBASE_SERVICE_ACCOUNT_JSON environment variable.
 * The variable must contain the raw JSON string (not a file path).
 *
 * In local development you can also set FIREBASE_PROJECT_ID and rely
 * on Application Default Credentials if you have the gcloud CLI
 * authenticated. For production always use the full service account.
 */

import admin from "firebase-admin";

let _app: admin.app.App | null = null;

export const getFirebaseAdmin = (): admin.app.App => {
  if (_app) return _app;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
    _app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "medlink-f0762.firebasestorage.app",
    });
  } else if (projectId) {
    // Local dev fallback: uses Application Default Credentials
    _app = admin.initializeApp({ 
      projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "medlink-f0762.firebasestorage.app",
    });
  } else {
    throw new Error(
      "Either FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID must be set"
    );
  }

  return _app;
};
