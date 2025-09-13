// 📂 firestore.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Render の secret file を利用する場合
const serviceAccount = JSON.parse(
  readFileSync('/etc/secrets/firebase-account.json', 'utf8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
console.log("✅ Firestore initialized with project:", serviceAccount.project_id);

try {
  await db.collection("debug").doc("ping").set({ ok: true, time: Date.now() });
  console.log("✅ Firestore write test succeeded");
} catch (err) {
  console.error("❌ Firestore write test failed", err);
}
// 👇 これを追加するのを忘れない！
export { db };
