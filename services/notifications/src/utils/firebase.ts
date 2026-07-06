import admin from "firebase-admin";
export let messaging: admin.messaging.Messaging;
export function initFirebase() {
  if (admin.apps.length) return;
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    messaging = admin.messaging();
  } catch {
    // Firebase not configured — push notifications disabled
  }
}
