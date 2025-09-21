// This file must be in the public directory.

// Import the Firebase app and messaging services
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

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
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Handle background messages
onBackgroundMessage(messaging, (payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  // Customize notification here
  const notificationTitle = payload.notification?.title || 'Yeni Mesaj';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: "/favicon.ico",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
