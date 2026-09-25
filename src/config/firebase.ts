import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration Firebase - À remplacer par vos propres clés Firebase
// Créez un fichier .env à la racine avec vos variables :
// VITE_FIREBASE_API_KEY=xxx
// VITE_FIREBASE_AUTH_DOMAIN=xxx
// VITE_FIREBASE_PROJECT_ID=xxx
// VITE_FIREBASE_STORAGE_BUCKET=xxx
// VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
// VITE_FIREBASE_APP_ID=xxx

const firebaseConfig = {
  apiKey: "AIzaSyDemoKeyReplaceMe",
  authDomain: "groupe-arena.firebaseapp.com",
  projectId: "groupe-arena",
  storageBucket: "groupe-arena.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
