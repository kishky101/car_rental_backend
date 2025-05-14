import admin from "firebase-admin";
import serviceAccount from "./config/serviceAccountKey.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

export const auth = admin.auth();
export const db = admin.database();
export const bucket = admin.storage().bucket();
export default admin;
