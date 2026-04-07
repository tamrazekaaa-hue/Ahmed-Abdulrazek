import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

// Test connection to Firestore
async function testConnection() {
  try {
    // We use a dummy path to test the connection
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("[Firestore] Connection successful");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("[Firestore] CRITICAL: Could not reach Firestore backend. This usually means the configuration is incorrect or the project is not provisioned.");
    }
    // Skip logging for other errors, as this is simply a connection test.
  }
}
testConnection();
