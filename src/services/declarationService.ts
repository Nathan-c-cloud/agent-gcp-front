/**
 * Service complet pour la gestion des déclarations fiscales
 * Version unifiée : utilise un seul agent fiscal pour tout
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// URLs des APIs
// En développement, utilise le proxy Vite pour éviter les problèmes CORS
const isDevelopment = import.meta.env.DEV;
const SAAS_API_URL = isDevelopment
  ? '/api/saas'
  : 'https://us-west1-agent-gcp-f6005.cloudfunctions.net/saas-integrations-api';
const PDF_GENERATOR_URL = isDevelopment
  ? '/api/pdf-generator'
  : 'https://pdf-generator-478570587937.us-west1.run.app';
const AGENT_FISCAL_URL = isDevelopment
  ? '/api/agent-fiscal'
  : 'https://us-west1-agent-gcp-f6005.cloudfunctions.net/agent-fiscal-v2';

export interface Declaration {
  id: string;
  company_id: string;
  user_id: string;
  type: 'tva' | 'urssaf' | 'charges' | 'aides';
  statut: 'brouillon' | 'en_cours' | 'terminé' | 'soumis';
  current_step: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  perimetre?: {
    periode: string;
    etablissement: string;
    regime_fiscal: string;
  };
  donnees?: {
    source: string;
    verified: boolean;
    tva_collectee: number;
    tva_deductible: number;
    tva_a_payer: number;
    details: any;
    fetched_at: string;
  };
  verifications?: Array<{
    type: 'warning' | 'success' | 'info';
    title: string;
    message: string;
    field: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  pieces_justificatives?: Array<{
    name: string;
    type: string;
    size: string;
    url: string;
    status: string;
  }>;
  pdf_url?: string;
  history?: Array<{
    action: string;
    timestamp: Timestamp;
    user_id: string;
    details?: any;
  }>;
}

/**
 * Crée une nouvelle déclaration dans Firestore
 */
export async function createDeclaration(
  companyId: string,
  userId: string,
  type: 'tva' | 'urssaf' | 'charges' | 'aides'
): Promise<Declaration> {
  const declarationsRef = collection(db, 'declarations');
  const newDocRef = doc(declarationsRef);

  const declaration: Declaration = {
    id: newDocRef.id,
    company_id: companyId,
    user_id: userId,
    type,
    statut: 'brouillon',
    current_step: 'perimetre',
    created_at: serverTimestamp() as Timestamp,
    updated_at: serverTimestamp() as Timestamp,
    history: [
      {
        action: 'created',
        timestamp: Timestamp.now(),
        user_id: userId
      }
    ]
  };

  await setDoc(newDocRef, declaration);

  return declaration;
}

/**
 * Sauvegarde les données de périmètre
 */
export async function savePerimetreData(
  declarationId: string,
  userId: string,
  perimetreData: {
    periode: string;
    etablissement: string;
    regime_fiscal: string;
  }
): Promise<void> {
  const docRef = doc(db, 'declarations', declarationId);

  await updateDoc(docRef, {
    perimetre: perimetreData,
    updated_at: serverTimestamp(),
    history: [
      {
        action: 'perimetre_saved',
        timestamp: new Date().toISOString(),
        user_id: userId,
        details: perimetreData
      }
    ]
  });
}

/**
 * Récupère les données TVA depuis l'API Odoo
 */
export async function fetchTVAData(
  userId: string,
  companyId: string,
  periode: string,
  etablissement: string
): Promise<any> {
  const response = await fetch(`${SAAS_API_URL}/declarations/tva/data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      company_id: companyId,
      periode,
      etablissement
    })
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des données TVA');
  }

  return response.json();
}

/**
 * Sauvegarde les données TVA dans Firestore
 */
export async function saveDonneesData(
  declarationId: string,
  userId: string,
  donneesData: any
): Promise<void> {
  const docRef = doc(db, 'declarations', declarationId);

  await updateDoc(docRef, {
    donnees: donneesData,
    updated_at: serverTimestamp(),
    history: [
      {
        action: 'donnees_fetched',
        timestamp: new Date().toISOString(),
        user_id: userId,
        details: { source: donneesData.source }
      }
    ]
  });
}

/**
 * Effectue les vérifications IA sur les données
 * UTILISE LE MÊME AGENT FISCAL avec settings pour l'analyse
 */
export async function verifyDeclarationData(
  declarationId: string,
  userId: string,
  data: any,
  historicalData?: any
): Promise<any> {
  const requestBody = {
    settings: {
      task: 'verify',
      companyId: 'demo_company',
      company_info: {
        company_name: 'Tech Corp',
        siren: '123456789',
        activity: 'Services informatiques'
      },
      data: {
        tva_collectee: data.tva_collectee || 0,
        tva_deductible: data.tva_deductible || 0,
        tva_a_payer: data.tva_a_payer || 0,
        details: data.details || {}
      },
      ...(historicalData && {
        historical_data: {
          tva_collectee: historicalData.tva_collectee || 0,
          tva_deductible: historicalData.tva_deductible || 0,
          tva_a_payer: historicalData.tva_a_payer || 0
        }
      })
    }
  };

  console.log('Request to agent fiscal:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(AGENT_FISCAL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  console.log('Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Agent fiscal error:', errorText);
    throw new Error(`Erreur lors de la vérification IA (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  console.log('Agent fiscal response:', result);

  // Préparer les données à sauvegarder (sans valeurs undefined)
  const updateData: any = {
    verifications: result.verifications || [],
    updated_at: serverTimestamp()
  };

  // Ajouter à l'historique uniquement si défini
  const historyEntry = {
    action: 'verifications_completed',
    timestamp: new Date().toISOString(),
    user_id: userId,
    details: {
      nb_verifications: result.verifications?.length || 0,
      ...(result.score_confiance !== undefined && { score_confiance: result.score_confiance })
    }
  };

  updateData.history = [historyEntry];

  // Sauvegarder les vérifications dans Firestore
  const docRef = doc(db, 'declarations', declarationId);
  await updateDoc(docRef, updateData);

  return result;
}

/**
 * Pose une question fiscale à l'agent
 * UTILISE LE MÊME AGENT FISCAL avec question: '...'
 */
export async function askFiscalQuestion(question: string): Promise<any> {
  const response = await fetch(AGENT_FISCAL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question  // ← Indique qu'on veut une réponse documentaire
    })
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la question à l\'agent fiscal');
  }

  return response.json();
}

/**
 * Récupère les documents depuis l'API
 */
export async function fetchDocuments(
  userId: string,
  companyId: string,
  type: string,
  periode: string
): Promise<any> {
  const response = await fetch(`${SAAS_API_URL}/declarations/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      company_id: companyId,
      type,
      periode
    })
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des documents');
  }

  return response.json();
}

/**
 * Sauvegarde les pièces justificatives
 */
export async function savePiecesData(
  declarationId: string,
  userId: string,
  pieces: any[]
): Promise<void> {
  const docRef = doc(db, 'declarations', declarationId);

  await updateDoc(docRef, {
    pieces_justificatives: pieces,
    updated_at: serverTimestamp(),
    history: [
      {
        action: 'pieces_attached',
        timestamp: new Date().toISOString(),
        user_id: userId,
        details: { nb_pieces: pieces.length }
      }
    ]
  });
}

/**
 * Génère le PDF de la déclaration
 */
export async function generatePDF(
  declarationId: string,
  userId: string
): Promise<string> {
  // Récupérer la déclaration complète depuis Firestore
  const docRef = doc(db, 'declarations', declarationId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Déclaration introuvable');
  }

  const declaration = docSnap.data() as Declaration;

  // Appeler le générateur PDF
  const response = await fetch(`${PDF_GENERATOR_URL}/generate-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      declaration_id: declarationId,
      data: declaration
    })
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la génération du PDF');
  }

  const result = await response.json();

  // Sauvegarder l'URL du PDF dans Firestore
  await updateDoc(docRef, {
    pdf_url: result.pdf_url,
    updated_at: serverTimestamp(),
    history: [
      {
        action: 'pdf_generated',
        timestamp: new Date().toISOString(),
        user_id: userId,
        details: { pdf_url: result.pdf_url }
      }
    ]
  });

  return result.pdf_url;
}

/**
 * Télécharge directement le PDF (sans stockage)
 */
export async function downloadPDF(declarationId: string): Promise<Blob> {
  // Récupérer la déclaration complète depuis Firestore
  const docRef = doc(db, 'declarations', declarationId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Déclaration introuvable');
  }

  const declaration = docSnap.data() as Declaration;

  // Convertir les Timestamps Firestore en ISO strings pour le service PDF
  const declarationForPDF = {
    ...declaration,
    created_at: declaration.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
    updated_at: declaration.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
    history: declaration.history?.map(h => ({
      ...h,
      timestamp: typeof h.timestamp === 'string' ? h.timestamp : h.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
    }))
  };

  try {
    console.log('Calling PDF generator with data:', declarationForPDF);

    // Appeler le générateur PDF (endpoint download)
    const response = await fetch(`${PDF_GENERATOR_URL}/generate-pdf-download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: declarationForPDF
      })
    });

    console.log('PDF Generator response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PDF Generator error:', response.status, errorText);
      // Fallback: générer un PDF simple avec les données
      throw new Error(`Service PDF temporairement indisponible (${response.status})`);
    }

    return response.blob();
  } catch (error) {
    console.error('Error calling PDF generator:', error);
    // Créer un PDF HTML simple comme fallback
    console.log('Using fallback PDF generation');
    return generateSimplePDF(declaration);
  }
}

/**
 * Génère un PDF simple en HTML comme fallback
 */
function generateSimplePDF(declaration: Declaration): Blob {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Déclaration TVA - ${declaration.perimetre?.periode}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    h1 { color: #2563EB; border-bottom: 3px solid #2563EB; padding-bottom: 10px; }
    .section { margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    .label { font-weight: bold; color: #374151; }
    .value { color: #1f2937; margin-left: 10px; }
    .total { background: #dbeafe; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; font-weight: bold; }
  </style>
</head>
<body>
  <h1>📄 Déclaration de TVA</h1>
  
  <div class="section">
    <h2>Informations générales</h2>
    <p><span class="label">Type:</span><span class="value">${declaration.type.toUpperCase()}</span></p>
    <p><span class="label">Période:</span><span class="value">${declaration.perimetre?.periode || 'N/A'}</span></p>
    <p><span class="label">Établissement:</span><span class="value">${declaration.perimetre?.etablissement || 'N/A'}</span></p>
    <p><span class="label">Régime fiscal:</span><span class="value">${declaration.perimetre?.regime_fiscal || 'N/A'}</span></p>
    <p><span class="label">Statut:</span><span class="value">${declaration.statut}</span></p>
  </div>

  <div class="section">
    <h2>Données TVA</h2>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Montant</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>TVA Collectée</td>
          <td style="text-align: right;">${(declaration.donnees?.tva_collectee || 0).toFixed(2)} €</td>
        </tr>
        <tr>
          <td>TVA Déductible</td>
          <td style="text-align: right;">${(declaration.donnees?.tva_deductible || 0).toFixed(2)} €</td>
        </tr>
      </tbody>
    </table>
    <div class="total">
      TVA à payer: ${(declaration.donnees?.tva_a_payer || 0).toFixed(2)} €
    </div>
  </div>

  ${declaration.donnees?.details ? `
  <div class="section">
    <h2>Détails</h2>
    <p><span class="label">Nombre de factures de vente:</span><span class="value">${declaration.donnees.details.nb_factures_vente || 0}</span></p>
    <p><span class="label">Nombre de factures d'achat:</span><span class="value">${declaration.donnees.details.nb_factures_achat || 0}</span></p>
    <p><span class="label">Montant HT ventes:</span><span class="value">${(declaration.donnees.details.montant_ht_ventes || 0).toFixed(2)} €</span></p>
    <p><span class="label">Montant HT achats:</span><span class="value">${(declaration.donnees.details.montant_ht_achats || 0).toFixed(2)} €</span></p>
  </div>
  ` : ''}

  ${declaration.verifications && declaration.verifications.length > 0 ? `
  <div class="section">
    <h2>Vérifications IA</h2>
    ${declaration.verifications.map(v => `
      <div style="margin: 10px 0; padding: 10px; background: white; border-left: 4px solid ${v.type === 'warning' ? '#f59e0b' : v.type === 'success' ? '#10b981' : '#3b82f6'};">
        <strong>${v.title}</strong>
        <p style="margin: 5px 0 0 0;">${v.message}</p>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="section">
    <p style="text-align: center; color: #6b7280; font-size: 12px;">
      Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}<br>
      Document ID: ${declaration.id}
    </p>
  </div>
</body>
</html>
  `;

  return new Blob([htmlContent], { type: 'text/html' });
}

/**
 * Avance à l'étape suivante
 */
export async function advanceToNextStep(
  declarationId: string,
  userId: string
): Promise<void> {
  const docRef = doc(db, 'declarations', declarationId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Déclaration introuvable');
  }

  const declaration = docSnap.data() as Declaration;
  const currentStep = declaration.current_step;

  const steps = ['perimetre', 'donnees', 'verifications', 'documents', 'validation'];
  const currentIndex = steps.indexOf(currentStep);

  if (currentIndex < steps.length - 1) {
    const nextStep = steps[currentIndex + 1];

    await updateDoc(docRef, {
      current_step: nextStep,
      statut: 'en_cours',
      updated_at: serverTimestamp()
    });
  }
}

/**
 * Soumet la déclaration
 */
export async function submitDeclaration(
  declarationId: string,
  userId: string
): Promise<void> {
  const docRef = doc(db, 'declarations', declarationId);

  await updateDoc(docRef, {
    statut: 'terminé',
    current_step: 'confirmation',
    submitted_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    history: [
      {
        action: 'submitted',
        timestamp: new Date().toISOString(),
        user_id: userId
      }
    ]
  });
}

/**
 * Récupère une déclaration par ID
 */
export async function getDeclaration(declarationId: string): Promise<Declaration | null> {
  const docRef = doc(db, 'declarations', declarationId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as Declaration;
}
