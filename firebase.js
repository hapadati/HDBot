import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountPath = '/etc/secrets/firebase-account.json'; // Secret File
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();
