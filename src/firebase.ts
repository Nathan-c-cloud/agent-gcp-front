import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ============================================
// CONFIGURATION FIREBASE
// ============================================

// ✅ VOTRE CONFIGURATION FIREBASE
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

if (!firebaseConfig.apiKey) {
    console.error('❌ Variables d\'environnement Firebase manquantes !');
    console.error('Vérifiez que .env.local existe et contient les variables VITE_FIREBASE_*');
    console.error('\n📝 Variables requises :');
    console.error('  - VITE_FIREBASE_API_KEY');
    console.error('  - VITE_FIREBASE_AUTH_DOMAIN');
    console.error('  - VITE_FIREBASE_PROJECT_ID');
    console.error('  - VITE_FIREBASE_STORAGE_BUCKET');
    console.error('  - VITE_FIREBASE_MESSAGING_SENDER_ID');
    console.error('  - VITE_FIREBASE_APP_ID');
    console.error('\n🔧 Solution rapide : npm run setup');
    throw new Error('Configuration Firebase incomplète');
}

console.log('✅ Configuration Firebase chargée :', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
});

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
