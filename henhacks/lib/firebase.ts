// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDo6OKscdw0OFdWCe7jbXmdR29cWMyotUc",
  authDomain: "henhacks-62add.firebaseapp.com",
  projectId: "henhacks-62add",
  storageBucket: "henhacks-62add.firebasestorage.app",
  messagingSenderId: "853221671275",
  appId: "1:853221671275:web:62aa1bf645b9c5f954cc2e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
