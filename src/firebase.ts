import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ============================================
// CONFIGURATION FIREBASE
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyCGGeq5T3zaSwrz-HVQS802kacw5uZ_aY0",
  authDomain: "agent-gcp-f6005.firebaseapp.com",
  projectId: "agent-gcp-f6005",
  storageBucket: "agent-gcp-f6005.firebasestorage.app",
  appId: "1:478570587937:web:d81df679d2415617548060",
  messagingSenderId: "G-EDEHHT05DB"
};

// ============================================
// INITIALISATION FIREBASE
// ============================================

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Firestore
export const db = getFirestore(app);

// Initialiser Auth
export const auth = getAuth(app);

// Exporter l'app par défaut
export default app;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Vérifie si Firebase est correctement configuré
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

/**
 * Affiche les informations de configuration (sans les secrets)
 */
export function getFirebaseInfo() {
  return {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    configured: isFirebaseConfigured()
  };
}
