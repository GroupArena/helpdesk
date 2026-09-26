import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration Firebase
// Les valeurs peuvent être définies via des variables d'environnement (.env)
// ou directement ici pour le développement/démonstration

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyReplaceMe",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "groupe-arena.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "groupe-arena",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "groupe-arena.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
