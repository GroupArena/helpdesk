import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ============================================================
// CONFIGURATION FIREBASE
// ============================================================
// Pour activer Firebase, remplacez les valeurs ci-dessous par vos clés.
// Vous les trouverez dans Firebase Console > Paramètres du projet > Vos applications
// 
// En attendant, l'application fonctionne en MODE DÉMO avec localStorage.
// ============================================================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Détection automatique : si les clés sont encore par défaut, on est en mode démo
export const isDemoMode = firebaseConfig.apiKey === "YOUR_API_KEY_HERE";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
