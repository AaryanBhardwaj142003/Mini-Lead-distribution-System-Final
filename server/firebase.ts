import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let app;

const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), 'firebase-admin-sdk.json');
const APPLET_CONFIG_PATH = path.join(process.cwd(), 'firebase-applet-config.json');

if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  app = initializeApp({
    credential: cert(serviceAccount)
  });
} else {
  try {
    app = initializeApp();
  } catch (e) {
    console.warn('Firebase Admin not initialized. Ensure credentials are set.');
  }
}

let firestoreDatabaseId = '(default)';
if (fs.existsSync(APPLET_CONFIG_PATH)) {
    const config = JSON.parse(fs.readFileSync(APPLET_CONFIG_PATH, 'utf8'));
    if (config.firestoreDatabaseId) {
        firestoreDatabaseId = config.firestoreDatabaseId;
    }
}

export const db = getAdminFirestore(app, firestoreDatabaseId);
export const auth = getAdminAuth(app);
