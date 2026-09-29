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
  apiKey: "AIzaSyCmZBIqxLActosAXX2h4KR8Ork5RpoqZk4",
  authDomain: "helpdesk-5eec3.firebaseapp.com",
  projectId: "helpdesk-5eec3",
  storageBucket: "helpdesk-5eec3.firebasestorage.app",
  messagingSenderId: "1041021893485",
  appId: "1:1041021893485:web:d3d316f487729e67cf7864"
};

// Détection automatique : si les clés sont encore par défaut, on est en mode démo
export const isDemoMode = firebaseConfig.apiKey === "YOUR_API_KEY_HERE";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;