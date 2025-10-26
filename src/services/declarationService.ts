/**
 * Service de gestion des déclarations
 * Utilise l'API saas-integrations-api existante pour récupérer les données
 */

import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';

// URL de l'API saas-integrations-api
const SAAS_API_URL = import.meta.env.VITE_SAAS_API_URL ||
  'https://us-west1-agent-gcp-f6005.cloudfunctions.net/saas-integrations-api';

// Types
export type DeclarationStatus = 'brouillon' | 'en_cours' | 'en_verification' | 'terminé' | 'soumis' | 'erreur';
export type DeclarationType = 'tva' | 'urssaf' | 'charges_sociales' | 'demande_aides';

export interface Declaration {
  id: string;
  company_id: string;
  user_id: string;
  type: DeclarationType;
  statut: DeclarationStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
  current_step: number;
  total_steps: number;
  completed_steps: number[];
  completion_percentage: number;

  // Étape 1 : Périmètre
  perimetre?: {
    periode: string;  // Format: YYYY-MM pour TVA, YYYY-QN pour URSSAF
    etablissement: string;
    regime_fiscal: string;
  };

  // Étape 2 : Données
  donnees?: {
    source: string;  // 'odoo', 'payfit', 'manual'
    verified: boolean;
    tva_collectee?: number;
    tva_deductible?: number;
    tva_a_payer?: number;
    details?: any;
    fetched_at?: string;
  };

  // Étape 3 : Vérifications
  verifications?: {
    analyzed: boolean;
    suggestions: any[];
    coherence_score: number;
    anomalies_detected: boolean;
    anomalies?: any[];
  };

  // Étape 4 : Pièces justificatives
  pieces_justificatives?: {
    name: string;
    type: string;
    size: string;
    url: string;
    status: string;
    generated_at: string;
  }[];

  // Étape 5 : Validation
  validation?: {
    confirmed: boolean;
    pdf_generated: boolean;
    pdf_url?: string;
    submitted_to_portal: boolean;
    submitted_at?: string;
  };

  // Historique
  history?: {
    timestamp: string;
    action: string;
    user: string;
    details: string;
  }[];
}

/**
 * Créer une nouvelle déclaration
 */
export async function createDeclaration(
  companyId: string,
  userId: string,
  type: DeclarationType
): Promise<Declaration> {
  const declarationRef = doc(collection(db, 'declarations'));

  const declaration: Declaration = {
    id: declarationRef.id,
    company_id: companyId,
    user_id: userId,
    type,
    statut: 'brouillon',
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
    current_step: 1,
    total_steps: 5,
    completed_steps: [],
    completion_percentage: 0,
    history: [{
      timestamp: new Date().toISOString(),
      action: 'created',
      user: userId,
      details: `Déclaration ${type} créée`
    }]
  };

  await setDoc(declarationRef, declaration);

  return declaration;
}

/**
 * Récupérer une déclaration par ID
 */
export async function getDeclaration(declarationId: string): Promise<Declaration | null> {
  const declarationRef = doc(db, 'declarations', declarationId);
  const declarationSnap = await getDoc(declarationRef);

  if (!declarationSnap.exists()) {
    return null;
  }

  return declarationSnap.data() as Declaration;
}

/**
 * Récupérer toutes les déclarations d'une entreprise
 */
export async function getDeclarations(
  companyId: string,
  status?: DeclarationStatus
): Promise<Declaration[]> {
  const declarationsRef = collection(db, 'declarations');

  let q = query(
    declarationsRef,
    where('company_id', '==', companyId),
    orderBy('created_at', 'desc')
  );

  if (status) {
    q = query(q, where('statut', '==', status));
  }

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => doc.data() as Declaration);
}

/**
 * Mettre à jour une déclaration
 */
export async function updateDeclaration(
  declarationId: string,
  updates: Partial<Declaration>,
  userId: string,
  actionDescription: string
): Promise<void> {
  const declarationRef = doc(db, 'declarations', declarationId);

  // Ajouter à l'historique
  const declaration = await getDeclaration(declarationId);
  const history = declaration?.history || [];

  history.push({
    timestamp: new Date().toISOString(),
    action: 'updated',
    user: userId,
    details: actionDescription
  });

  await updateDoc(declarationRef, {
    ...updates,
    updated_at: Timestamp.now(),
    history
  });
}

/**
 * Passer à l'étape suivante
 */
export async function advanceToNextStep(
  declarationId: string,
  userId: string
): Promise<void> {
  const declaration = await getDeclaration(declarationId);

  if (!declaration) {
    throw new Error('Déclaration non trouvée');
  }

  const nextStep = declaration.current_step + 1;
  const completedSteps = [...declaration.completed_steps, declaration.current_step];
  const completionPercentage = (completedSteps.length / declaration.total_steps) * 100;

  await updateDeclaration(
    declarationId,
    {
      current_step: nextStep,
      completed_steps: completedSteps,
      completion_percentage: completionPercentage,
      statut: nextStep === declaration.total_steps ? 'en_verification' : 'en_cours'
    },
    userId,
    `Passage à l'étape ${nextStep}`
  );
}

/**
 * Revenir à l'étape précédente
 */
export async function goToPreviousStep(
  declarationId: string,
  userId: string
): Promise<void> {
  const declaration = await getDeclaration(declarationId);

  if (!declaration || declaration.current_step <= 1) {
    return;
  }

  await updateDeclaration(
    declarationId,
    {
      current_step: declaration.current_step - 1
    },
    userId,
    `Retour à l'étape ${declaration.current_step - 1}`
  );
}

/**
 * Récupérer les données TVA depuis Odoo via l'API saas-integrations-api
 */
export async function fetchTVAData(
  userId: string,
  companyId: string,
  periode: string,
  etablissement?: string
): Promise<any> {
  try {
    const response = await fetch(`${SAAS_API_URL}/declarations/tva/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        company_id: companyId,
        periode,
        etablissement
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la récupération des données TVA');
    }

    return await response.json();
  } catch (error: any) {
    console.error('[TVA] Error fetching data:', error);
    throw error;
  }
}

/**
 * Récupérer les données URSSAF depuis PayFit via l'API
 */
export async function fetchURSSAFData(
  userId: string,
  companyId: string,
  periode: string
): Promise<any> {
  try {
    const response = await fetch(`${SAAS_API_URL}/declarations/urssaf/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        company_id: companyId,
        periode
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la récupération des données URSSAF');
    }

    return await response.json();
  } catch (error: any) {
    console.error('[URSSAF] Error fetching data:', error);
    throw error;
  }
}

/**
 * Récupérer les pièces justificatives depuis Odoo
 */
export async function fetchDocuments(
  userId: string,
  companyId: string,
  type: DeclarationType,
  periode: string
): Promise<any> {
  try {
    const response = await fetch(`${SAAS_API_URL}/declarations/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        company_id: companyId,
        type,
        periode
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la récupération des documents');
    }

    return await response.json();
  } catch (error: any) {
    console.error('[DOCUMENTS] Error fetching:', error);
    throw error;
  }
}

/**
 * Sauvegarder les données de l'étape Périmètre
 */
export async function savePerimetreData(
  declarationId: string,
  userId: string,
  data: {
    periode: string;
    etablissement: string;
    regime_fiscal: string;
  }
): Promise<void> {
  await updateDeclaration(
    declarationId,
    {
      perimetre: data
    },
    userId,
    'Périmètre sauvegardé'
  );
}

/**
 * Sauvegarder les données de l'étape Données
 */
export async function saveDonneesData(
  declarationId: string,
  userId: string,
  data: any
): Promise<void> {
  await updateDeclaration(
    declarationId,
    {
      donnees: data
    },
    userId,
    'Données sauvegardées'
  );
}

/**
 * Sauvegarder les vérifications
 */
export async function saveVerificationsData(
  declarationId: string,
  userId: string,
  data: any
): Promise<void> {
  await updateDeclaration(
    declarationId,
    {
      verifications: data
    },
    userId,
    'Vérifications sauvegardées'
  );
}

/**
 * Sauvegarder les pièces justificatives
 */
export async function savePiecesData(
  declarationId: string,
  userId: string,
  documents: any[]
): Promise<void> {
  await updateDeclaration(
    declarationId,
    {
      pieces_justificatives: documents
    },
    userId,
    'Pièces justificatives ajoutées'
  );
}

/**
 * Valider et soumettre la déclaration
 */
export async function submitDeclaration(
  declarationId: string,
  userId: string
): Promise<void> {
  await updateDeclaration(
    declarationId,
    {
      statut: 'soumis',
      validation: {
        confirmed: true,
        pdf_generated: true,
        submitted_to_portal: true,
        submitted_at: new Date().toISOString()
      }
    },
    userId,
    'Déclaration soumise au portail fiscal'
  );
}

/**
 * Supprimer une déclaration
 */
export async function deleteDeclaration(declarationId: string): Promise<void> {
  const declarationRef = doc(db, 'declarations', declarationId);
  await deleteDoc(declarationRef);
}

/**
 * Vérifier le statut de connexion Odoo
 */
export async function checkOdooConnection(
  userId: string,
  companyId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${SAAS_API_URL}/status?user_id=${userId}&company_id=${companyId}`);

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.connections?.odoo?.connected === true;
  } catch (error) {
    console.error('[ODOO] Error checking connection:', error);
    return false;
  }
}
