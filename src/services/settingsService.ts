// services/settingsService.ts
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';

// ✅ MODE MOCK pour développement sans Firebase
const USE_MOCK_MODE = false; // Firebase activé

// Mock storage local
const MOCK_STORAGE_KEY = 'simplify_settings_mock';

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
}


// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Types
export interface CompanyInfo {
  nom: string;
  siret: string;
  formeJuridique: string;
  dateCreation: string;
  adresse: string;
  codePostal: string;
  ville: string;
  effectif: string;
  secteurActivite: string;
  regimeFiscal: string;
  regimeTVA: string;
}

export interface Representant {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  fonction: string;
}

export interface Notifications {
  echeances: boolean;
  recommandations: boolean;
  nouvellesAides: boolean;
  miseAJourLegislation: boolean;
  rappelDeclarations: boolean;
  email: boolean;
  push: boolean;
}

export interface AIPreferences {
  niveauDetail: string;
  tonCommunication: string;
  frequenceRecommandations: string;
  domainesPrioritaires: string[];
}

export interface Settings {
  companyId?: string;
  userId?: string;
  company_info: CompanyInfo;
  representative: Representant;
  notifications: Notifications;
  ai_preferences: AIPreferences;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Récupère les paramètres d'une entreprise
 */
export async function getSettings(companyId: string): Promise<Settings | null> {
  // MODE MOCK
  if (USE_MOCK_MODE) {
    console.log('🔧 [MOCK MODE] Fetching settings for company:', companyId);
    const mockData = localStorage.getItem(MOCK_STORAGE_KEY);
    if (mockData) {
      const data = JSON.parse(mockData) as Settings;
      console.log('✅ [MOCK MODE] Settings loaded:', data);
      return data;
    }
    console.log('⚠️ [MOCK MODE] No settings found');
    return null;
  }

  // MODE FIREBASE
  try {
    console.log('📡 Fetching settings for company:', companyId);
    const docRef = doc(db, 'settings', companyId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as Settings;
      console.log('✅ Settings loaded:', data);
      return data;
    } else {
      console.log('⚠️ No settings found for company:', companyId);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching settings:', error);
    throw error;
  }
}

/**
 * Sauvegarde les paramètres d'une entreprise
 */
export async function saveSettings(
  companyId: string,
  settings: Omit<Settings, 'companyId' | 'userId' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<{ success: boolean; message: string }> {
  // MODE MOCK
  if (USE_MOCK_MODE) {
    console.log('💾 [MOCK MODE] Saving settings for company:', companyId);

    try {
      const now = new Date().toISOString();
      const existingData = localStorage.getItem(MOCK_STORAGE_KEY);
      const isNew = !existingData;

      const dataToSave: Settings = {
        ...settings,
        companyId,
        userId,
        updatedAt: now,
        createdAt: isNew ? now : (existingData ? JSON.parse(existingData).createdAt : now)
      };

      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(dataToSave));
      console.log('✅ [MOCK MODE] Settings saved successfully');

      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));

      return { success: true, message: 'Paramètres enregistrés avec succès (Mode Mock)' };
    } catch (error) {
      console.error('❌ [MOCK MODE] Error saving settings:', error);
      return { success: false, message: 'Erreur lors de la sauvegarde' };
    }
  }

  // MODE FIREBASE
  try {
    console.log('💾 Saving settings for company:', companyId);
    const docRef = doc(db, 'settings', companyId);

    // Vérifier si le document existe déjà
    const docSnap = await getDoc(docRef);
    const now = new Date().toISOString();

    const dataToSave: Settings = {
      ...settings,
      companyId,
      userId,
      updatedAt: now,
      ...(docSnap.exists() ? {} : { createdAt: now })
    };

    await setDoc(docRef, dataToSave, { merge: true });

    console.log('✅ Settings saved successfully');
    return { success: true, message: 'Paramètres enregistrés avec succès' };
  } catch (error) {
    console.error('❌ Error saving settings:', error);
    return { success: false, message: 'Erreur lors de la sauvegarde' };
  }
}

/**
 * Initialise les paramètres par défaut pour une nouvelle entreprise
 */
export async function initializeDefaultSettings(
  companyId: string,
  userId: string
): Promise<void> {
  console.log('🆕 Initializing default settings for:', companyId);

  const defaultSettings: Omit<Settings, 'companyId' | 'userId' | 'createdAt' | 'updatedAt'> = {
    company_info: {
      nom: "",
      siret: "",
      formeJuridique: "SARL",
      dateCreation: "",
      adresse: "",
      codePostal: "",
      ville: "",
      effectif: "1-9",
      secteurActivite: "",
      regimeFiscal: "reel_simplifie",
      regimeTVA: "reel_normal"
    },
    representative: {
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      fonction: "Gérant"
    },
    notifications: {
      echeances: true,
      recommandations: true,
      nouvellesAides: true,
      miseAJourLegislation: false,
      rappelDeclarations: true,
      email: true,
      push: false
    },
    ai_preferences: {
      niveauDetail: "standard",
      tonCommunication: "professionnel",
      frequenceRecommandations: "quotidienne",
      domainesPrioritaires: ["fiscalite", "aides"]
    }
  };

  await saveSettings(companyId, defaultSettings, userId);
}

/**
 * Écoute les changements en temps réel des paramètres
 */
export function subscribeToSettings(
  companyId: string,
  callback: (settings: Settings | null) => void
): () => void {
  console.log('👂 Subscribing to settings changes for:', companyId);

  // MODE MOCK - Pas de subscription en temps réel
  if (USE_MOCK_MODE) {
    console.log('🔧 [MOCK MODE] Real-time subscription not available in mock mode');
    // Retourner une fonction de nettoyage vide
    return () => {};
  }

  // MODE FIREBASE
  const docRef = doc(db, 'settings', companyId);

  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as Settings;
      console.log('🔄 Settings updated:', data);
      callback(data);
    } else {
      console.log('⚠️ Settings document deleted');
      callback(null);
    }
  }, (error) => {
    console.error('❌ Error in settings subscription:', error);
  });

  return unsubscribe;
}

/**
 * Valide les paramètres avant sauvegarde
 */
export function validateSettings(
  settings: Omit<Settings, 'companyId' | 'userId' | 'createdAt' | 'updatedAt'>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validation entreprise
  if (!settings.company_info.nom) {
    errors.push("Le nom de l'entreprise est requis");
  }

  // Validation représentant
  if (!settings.representative.email) {
    errors.push("L'email du représentant est requis");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.representative.email)) {
    errors.push("L'email du représentant est invalide");
  }

  // Validation préférences IA
  if (settings.ai_preferences.domainesPrioritaires.length === 0) {
    errors.push("Au moins un domaine prioritaire doit être sélectionné");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ✅ Fonctions de compatibilité avec l'ancien code
export const saveAllSettings = saveSettings;
export const updateCompanyInfo = saveSettings;
export const updateRepresentant = saveSettings;
export const updateNotifications = saveSettings;
export const updateAIPreferences = saveSettings;
