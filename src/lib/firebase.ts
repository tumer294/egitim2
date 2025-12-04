// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJ3G_aB6dj3gvxgjg3sygeMnMNnEcXywE",
  authDomain: "takip-k0hdb.firebaseapp.com",
  projectId: "takip-k0hdb",
  storageBucket: "takip-k0hdb.appspot.com",
  messagingSenderId: "1093335320755",
  appId: "1:1093335320755:web:b029a206cb0fe66f7408c6"
};


// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const messaging = (typeof window !== 'undefined') ? getMessaging(app) : null;

export { app, db, auth, messaging };
