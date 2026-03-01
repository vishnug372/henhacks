import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { Auth0User } from '../context/AuthContext';

const firebaseConfig = {
  apiKey: "AIzaSyDo6OKscdw0OFdWCe7jbXmdR29cWMyotUc",
  authDomain: "henhacks-62add.firebaseapp.com",
  projectId: "henhacks-62add",
  storageBucket: "henhacks-62add.firebasestorage.app",
  messagingSenderId: "853221671275",
  appId: "1:853221671275:web:62aa1bf645b9c5f954cc2e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ─── Upsert Auth0 user into Firestore ────────────────────────────
export async function upsertUser(user: Auth0User): Promise<void> {
  await setDoc(
    doc(db, 'users', user.sub),
    { sub: user.sub, email: user.email, name: user.name, picture: user.picture ?? null },
    { merge: true }
  );
}
