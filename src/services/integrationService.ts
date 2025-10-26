// services/integrationService.ts
/**
 * Service pour gérer les intégrations SaaS
 * CORRECTION: Utilise GET /status au lieu de POST + récupération Firestore
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const SAAS_API_URL = "https://saas-integrations-api-2hpsggoeja-uw.a.run.app";

export interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'configuring' | 'disconnected';
  icon: string;
  connectedAt?: string;
  lastSync?: string;
  data?: any;
}

export interface ConnectionCredentials {
  // Odoo
  instance_url?: string;
  database?: string;
  username?: string;
  api_key?: string;
  password?: string;

  // PayFit
  payfit_api_key?: string;

  // QuickBooks
  client_id?: string;
  client_secret?: string;

  // Sage
  sage_api_key?: string;
  sage_company_id?: string;

  // Pennylane
  pennylane_api_key?: string;

  // Xero
  xero_client_id?: string;
  xero_client_secret?: string;

  // Générique (pour toute autre application)
  app_name?: string;
  api_endpoint?: string;
  auth_token?: string;
  additional_params?: Record<string, string>;
}

/**
 * Récupère l'état de toutes les intégrations pour un user
 * UTILISE GET avec query parameters + fallback Firestore
 */
export async function getIntegrations(userId: string, companyId: string): Promise<Integration[]> {
  try {
    // ✅ NOUVEAU: D'abord essayer Firestore directement (plus fiable que l'API)
    console.log('📡 Trying Firestore first...');
    const firestoreConnections = await fetchConnectionsFromFirestore(userId, companyId);

    if (firestoreConnections && Object.keys(firestoreConnections).length > 0) {
      console.log('✅ Connections found in Firestore, using them:', firestoreConnections);
      const transformed = transformFirestoreToFrontend(firestoreConnections);
      console.log('✅ Transformed from Firestore:', transformed);
      return transformed;
    }

    // ✅ Fallback: Essayer l'API backend
    const url = `${SAAS_API_URL}/status?user_id=${encodeURIComponent(userId)}&company_id=${encodeURIComponent(companyId)}`;

    console.log('📡 Firestore returned nothing, trying API:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Integrations received from API:', data);
      console.log('🔍 data.connections:', data.connections);

      // Si l'API retourne des connexions valides, les utiliser
      if (data.connections) {
        const connectionsKeys = Object.keys(data.connections);
        console.log('🔑 Connections keys:', connectionsKeys);
        console.log('🔑 Number of keys:', connectionsKeys.length);

        if (connectionsKeys.length > 0) {
          const transformed = transformBackendToFrontend(data.connections);
          console.log('✅ Transformed integrations from API:', transformed);
          return transformed;
        }
      }
    }

    // ✅ Si rien trouvé, retourner les intégrations par défaut
    console.log('ℹ️ No connections found, returning default integrations');
    return getDefaultIntegrations();

  } catch (error) {
    console.error('❌ Error fetching integrations:', error);
    return getDefaultIntegrations();
  }
}

/**
 * Connecte une nouvelle intégration via l'Agent Onboarding
 */
export async function connectIntegration(
  saasType: string,
  credentials: ConnectionCredentials,
  userId: string,
  companyId: string
): Promise<{
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}> {
  try {
    console.log('📡 Connecting integration:', saasType);

    const response = await fetch(`${SAAS_API_URL}/connect/${saasType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        company_id: companyId,
        ...credentials
      })
    });

    const result = await response.json();
    console.log('✅ Connection result:', result);

    return {
      success: result.success || false,
      message: result.message || '',
      data: result,
      error: result.error
    };

  } catch (error) {
    console.error('❌ Error connecting integration:', error);
    return {
      success: false,
      message: 'Erreur lors de la connexion',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Déconnecte une intégration et supprime les données de Firestore
 */
export async function disconnectIntegration(
  saasType: string,
  userId: string,
  companyId: string
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    console.log('📡 Disconnecting integration:', saasType);
    console.log('📡 Disconnect URL:', `${SAAS_API_URL}/disconnect/${saasType}`);
    console.log('📡 Disconnect payload:', { user_id: userId, company_id: companyId });

    // 1️⃣ Appeler l'API backend pour déconnecter
    const response = await fetch(`${SAAS_API_URL}/disconnect/${saasType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        company_id: companyId
      })
    });

    console.log('📡 Disconnect response status:', response.status);

    // Gérer les erreurs HTTP
    if (!response.ok && response.status !== 200) {
      const errorText = await response.text();
      console.error('❌ Disconnect failed with status:', response.status, 'Error:', errorText);

      // Essayer de parser le JSON même en cas d'erreur
      try {
        const errorJson = JSON.parse(errorText);
        return {
          success: false,
          message: errorJson.message || `Erreur ${response.status}`
        };
      } catch {
        return {
          success: false,
          message: `Erreur ${response.status}: ${errorText || 'Erreur inconnue'}`
        };
      }
    }

    const result = await response.json();
    console.log('✅ Disconnect result from API:', result);

    // 2️⃣ Supprimer ou mettre à jour les données dans Firestore
    try {
      console.log('🗑️ Cleaning up Firestore data...');
      await removeConnectionFromFirestore(saasType, userId, companyId);
      console.log('✅ Firestore data cleaned up successfully');
    } catch (firestoreError) {
      console.error('⚠️ Failed to clean up Firestore, but API disconnect succeeded:', firestoreError);
      // On continue même si Firestore échoue, car l'API a déconnecté
    }

    return {
      success: result.success || result.status === 'success',
      message: result.message || 'Intégration déconnectée avec succès'
    };

  } catch (error) {
    console.error('❌ Exception during disconnect:', error);
    return {
      success: false,
      message: `Erreur réseau: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    };
  }
}

/**
 * Supprime les données de connexion d'une intégration dans Firestore
 */
async function removeConnectionFromFirestore(
  saasType: string,
  userId: string,
  companyId: string
): Promise<void> {
  const { collection, getDocs, doc: fsDoc, updateDoc, deleteField } = await import('firebase/firestore');

  console.log('🔍 Searching for connection data to remove...');

  // ✅ Option 1: Chercher dans saas_connections
  try {
    const saasCollectionRef = collection(db, 'saas_connections');
    const snapshot = await getDocs(saasCollectionRef);

    console.log(`📂 Checking ${snapshot.size} documents in saas_connections`);

    for (const docSnap of snapshot.docs) {
      const docId = docSnap.id;
      if (docId.includes(userId)) {
        console.log(`📄 Found matching document: ${docId}`);
        const data = docSnap.data();

        if (data.connections && data.connections[saasType]) {
          console.log(`🗑️ Removing ${saasType} from document ${docId}`);

          // Supprimer uniquement la connexion spécifique
          const docRef = fsDoc(db, 'saas_connections', docId);
          await updateDoc(docRef, {
            [`connections.${saasType}`]: deleteField()
          });

          console.log(`✅ Successfully removed ${saasType} from Firestore`);
          return;
        }
      }
    }
  } catch (error) {
    console.error('❌ Error updating saas_connections:', error);
  }

  // ✅ Option 2: Chercher dans users/userId
  try {
    const userDocRef = fsDoc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();

      if (userData.connections && userData.connections[saasType]) {
        console.log(`🗑️ Removing ${saasType} from user document`);
        await updateDoc(userDocRef, {
          [`connections.${saasType}`]: deleteField()
        });
        console.log(`✅ Successfully removed ${saasType} from user document`);
        return;
      }

      if (userData.integrations && userData.integrations[saasType]) {
        console.log(`🗑️ Removing ${saasType} from user integrations`);
        await updateDoc(userDocRef, {
          [`integrations.${saasType}`]: deleteField()
        });
        console.log(`✅ Successfully removed ${saasType} from user integrations`);
        return;
      }
    }
  } catch (error) {
    console.error('❌ Error updating user document:', error);
  }

  // ✅ Option 3: Chercher dans companies/companyId
  try {
    const companyDocRef = fsDoc(db, 'companies', companyId);
    const companyDoc = await getDoc(companyDocRef);

    if (companyDoc.exists()) {
      const companyData = companyDoc.data();

      if (companyData.connections && companyData.connections[saasType]) {
        console.log(`🗑️ Removing ${saasType} from company document`);
        await updateDoc(companyDocRef, {
          [`connections.${saasType}`]: deleteField()
        });
        console.log(`✅ Successfully removed ${saasType} from company document`);
        return;
      }

      if (companyData.integrations && companyData.integrations[saasType]) {
        console.log(`🗑️ Removing ${saasType} from company integrations`);
        await updateDoc(companyDocRef, {
          [`integrations.${saasType}`]: deleteField()
        });
        console.log(`✅ Successfully removed ${saasType} from company integrations`);
        return;
      }
    }
  } catch (error) {
    console.error('❌ Error updating company document:', error);
  }

  console.log('⚠️ No Firestore data found to remove');
}

/**
 * Teste une intégration existante
 */
export async function testIntegration(
  saasType: string,
  userId: string,
  companyId: string
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    console.log('📡 Testing integration:', saasType);
    console.log('📡 Test URL:', `${SAAS_API_URL}/test/${saasType}`);
    console.log('📡 Test payload:', { user_id: userId, company_id: companyId });

    const response = await fetch(`${SAAS_API_URL}/test/${saasType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        company_id: companyId
      })
    });

    console.log('📡 Response status:', response.status);

    // Essayer de parser la réponse JSON même si le statut n'est pas OK
    try {
      const result = await response.json();
      console.log('✅ Test result:', result);

      // L'API peut retourner 400 avec un message valide (ex: "Odoo non connecté")
      // On regarde le champ "connected" pour déterminer le succès
      if (result.connected === true) {
        return {
          success: true,
          message: result.message || 'Connexion réussie ✅'
        };
      } else {
        // Connexion échouée mais c'est une réponse valide de l'API
        return {
          success: false,
          message: result.message || 'Connexion échouée'
        };
      }
    } catch (jsonError) {
      // Si on ne peut pas parser le JSON, c'est une vraie erreur
      const errorText = await response.text();
      console.error('❌ Could not parse JSON response:', errorText);

      return {
        success: false,
        message: `Erreur ${response.status}: Réponse invalide du serveur`
      };
    }

  } catch (error) {
    console.error('❌ Error testing integration:', error);
    return {
      success: false,
      message: 'Erreur réseau lors du test'
    };
  }
}

/**
 * Transforme les données backend en format frontend
 */
function transformBackendToFrontend(backendConnections: any): Integration[] {
  if (!backendConnections) {
    return getDefaultIntegrations();
  }

  const integrations: Integration[] = [];

  // Odoo
  if (backendConnections?.odoo) {
    integrations.push({
      id: 'odoo',
      name: 'Odoo',
      description: 'ERP & Comptabilité',
      status: backendConnections.odoo.status === 'connected' ? 'connected' : 'disconnected',
      icon: backendConnections.odoo.status === 'connected' ? '✅' : '🔴',
      connectedAt: backendConnections.odoo.connected_at,
      lastSync: backendConnections.odoo.last_sync,
      data: backendConnections.odoo.info
    });
  } else {
    integrations.push({
      id: 'odoo',
      name: 'Odoo',
      description: 'ERP & Comptabilité',
      status: 'disconnected',
      icon: '🔴'
    });
  }

  // PayFit
  if (backendConnections?.payfit) {
    integrations.push({
      id: 'payfit',
      name: 'PayFit',
      description: 'Gestion de la paie',
      status: backendConnections.payfit.status === 'connected' ? 'connected' : 'disconnected',
      icon: backendConnections.payfit.status === 'connected' ? '✅' : '🔴',
      connectedAt: backendConnections.payfit.connected_at,
      lastSync: backendConnections.payfit.last_sync
    });
  } else {
    integrations.push({
      id: 'payfit',
      name: 'PayFit',
      description: 'Gestion de la paie',
      status: 'disconnected',
      icon: '🔴'
    });
  }

  // QuickBooks
  if (backendConnections?.quickbooks) {
    integrations.push({
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Comptabilité',
      status: backendConnections.quickbooks.status === 'connected' ? 'connected' : 'disconnected',
      icon: backendConnections.quickbooks.status === 'connected' ? '✅' : '🔴',
      connectedAt: backendConnections.quickbooks.connected_at
    });
  } else {
    integrations.push({
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Comptabilité',
      status: 'disconnected',
      icon: '🔴'
    });
  }

  // Sage
  if (backendConnections?.sage) {
    integrations.push({
      id: 'sage',
      name: 'Sage',
      description: 'Comptabilité & Gestion',
      status: backendConnections.sage.status === 'connected' ? 'connected' : 'disconnected',
      icon: backendConnections.sage.status === 'connected' ? '✅' : '🔴',
      connectedAt: backendConnections.sage.connected_at
    });
  } else {
    integrations.push({
      id: 'sage',
      name: 'Sage',
      description: 'Comptabilité & Gestion',
      status: 'disconnected',
      icon: '🔴'
    });
  }

  // Pennylane
  if (backendConnections?.pennylane) {
    integrations.push({
      id: 'pennylane',
      name: 'Pennylane',
      description: 'Comptabilité en ligne',
      status: backendConnections.pennylane.status === 'connected' ? 'connected' : 'disconnected',
      icon: backendConnections.pennylane.status === 'connected' ? '✅' : '🔴',
      connectedAt: backendConnections.pennylane.connected_at
    });
  } else {
    integrations.push({
      id: 'pennylane',
      name: 'Pennylane',
      description: 'Comptabilité en ligne',
      status: 'disconnected',
      icon: '🔴'
    });
  }

  // Xero
  if (backendConnections?.xero) {
    integrations.push({
      id: 'xero',
      name: 'Xero',
      description: 'Comptabilité cloud',
      status: backendConnections.xero.status === 'connected' ? 'connected' : 'disconnected',
      icon: backendConnections.xero.status === 'connected' ? '✅' : '🔴',
      connectedAt: backendConnections.xero.connected_at
    });
  } else {
    integrations.push({
      id: 'xero',
      name: 'Xero',
      description: 'Comptabilité cloud',
      status: 'disconnected',
      icon: '🔴'
    });
  }

  return integrations;
}

/**
 * Intégrations par défaut (fallback)
 */
function getDefaultIntegrations(): Integration[] {
  return [
    {
      id: 'odoo',
      name: 'Odoo',
      description: 'ERP & Comptabilité',
      status: 'disconnected',
      icon: '🔴'
    },
    {
      id: 'payfit',
      name: 'PayFit',
      description: 'Gestion de la paie',
      status: 'disconnected',
      icon: '🔴'
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Comptabilité',
      status: 'disconnected',
      icon: '🔴'
    },
    {
      id: 'sage',
      name: 'Sage',
      description: 'Comptabilité & Gestion',
      status: 'disconnected',
      icon: '🔴'
    },
    {
      id: 'pennylane',
      name: 'Pennylane',
      description: 'Comptabilité en ligne',
      status: 'disconnected',
      icon: '🔴'
    },
    {
      id: 'xero',
      name: 'Xero',
      description: 'Comptabilité cloud',
      status: 'disconnected',
      icon: '🔴'
    },
    {
      id: 'other',
      name: 'Autre application',
      description: 'Connecter une autre application',
      status: 'disconnected',
      icon: '🔴'
    }
  ];
}

/**
 * Récupère les connexions depuis Firestore
 * Cherche dans plusieurs emplacements possibles
 */
export async function fetchConnectionsFromFirestore(userId: string, companyId: string) {
  try {
    console.log('🔍 Searching Firestore for connections...', { userId, companyId });

    // ✅ Option prioritaire: Chercher dans saas_connections avec pattern userId_companyName
    // L'API backend stocke dans des documents nommés comme "test_user_Demo Company"
    try {
      const { collection: fsCollection, getDocs: fsGetDocs, query: fsQuery } = await import('firebase/firestore');
      const saasCollectionRef = fsCollection(db, 'saas_connections');
      const snapshot = await fsGetDocs(saasCollectionRef);

      console.log(`📂 Found ${snapshot.size} documents in saas_connections`);

      // Chercher un document qui correspond à notre userId
      let foundConnection = null;
      snapshot.forEach(docSnap => {
        const docId = docSnap.id;
        console.log(`   📄 Checking document: ${docId}`);

        // Vérifier si ce document correspond à notre utilisateur
        if (docId.includes(userId)) {
          const data = docSnap.data();
          console.log(`   ✅ Found matching document for user ${userId}:`, data);

          if (data.connections) {
            foundConnection = data.connections;
          }
        }
      });

      if (foundConnection) {
        console.log('✅ Found connections in saas_connections collection:', foundConnection);
        return foundConnection;
      }
    } catch (error) {
      console.error('❌ Error searching saas_connections collection:', error);
    }

    // ✅ Option 1: Chercher dans users/userId
    let docRef = doc(db, 'users', userId);
    let docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      console.log('📄 User document found:', userData);

      // Vérifier différentes structures possibles
      if (userData.connections) {
        console.log('✅ Found connections in user document');
        return userData.connections;
      }

      if (userData.integrations) {
        console.log('✅ Found integrations in user document');
        return userData.integrations;
      }
    }

    // ✅ Option 2: Chercher dans companies/companyId
    docRef = doc(db, 'companies', companyId);
    docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const companyData = docSnap.data();
      console.log('📄 Company document found:', companyData);

      if (companyData.connections) {
        console.log('✅ Found connections in company document');
        return companyData.connections;
      }

      if (companyData.integrations) {
        console.log('✅ Found integrations in company document');
        return companyData.integrations;
      }
    }

    // ✅ Option 3: Chercher dans integrations/companyId
    docRef = doc(db, 'integrations', companyId);
    docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const integrationsData = docSnap.data();
      console.log('📄 Integrations document found:', integrationsData);

      if (integrationsData.connections) {
        console.log('✅ Found connections in integrations document');
        return integrationsData.connections;
      }

      // Le document lui-même pourrait contenir les connexions directement
      return integrationsData;
    }

    console.log('⚠️ No connections found in any Firestore location');
    return [];

  } catch (error) {
    console.error('❌ Error fetching from Firestore:', error);
    return [];
  }
}

/**
 * Transforme les données de Firestore en format frontend
 * Gère plusieurs formats possibles
 */
function transformFirestoreToFrontend(firestoreData: any): Integration[] {
  console.log('🔄 Transforming Firestore data:', firestoreData);

  // Créer la liste complète des intégrations par défaut
  const allIntegrations: Integration[] = [
    {
      id: 'odoo',
      name: 'Odoo',
      description: 'ERP & Comptabilité',
      status: 'disconnected' as const,
      icon: '🔴'
    },
    {
      id: 'payfit',
      name: 'PayFit',
      description: 'Gestion de la paie',
      status: 'disconnected' as const,
      icon: '🔴'
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Comptabilité',
      status: 'disconnected' as const,
      icon: '🔴'
    },
    {
      id: 'sage',
      name: 'Sage',
      description: 'Comptabilité & Gestion',
      status: 'disconnected' as const,
      icon: '🔴'
    },
    {
      id: 'pennylane',
      name: 'Pennylane',
      description: 'Comptabilité en ligne',
      status: 'disconnected' as const,
      icon: '🔴'
    },
    {
      id: 'xero',
      name: 'Xero',
      description: 'Comptabilité cloud',
      status: 'disconnected' as const,
      icon: '🔴'
    }
  ];

  // Si c'est un objet avec les clés odoo, payfit, etc.
  if (typeof firestoreData === 'object' && firestoreData !== null && !Array.isArray(firestoreData)) {
    // Mettre à jour les intégrations avec les données de Firestore
    allIntegrations.forEach(integration => {
      const data = firestoreData[integration.id];
      if (data) {
        integration.status = data.status === 'connected' ? 'connected' : 'disconnected';
        integration.icon = data.status === 'connected' ? '✅' : '🔴';
        integration.connectedAt = data.connected_at || data.connectedAt;
        integration.lastSync = data.last_sync || data.lastSync;
        integration.data = data.credentials || data.info || data;
      }
    });

    return allIntegrations;
  }

  // Si c'est un tableau
  if (Array.isArray(firestoreData)) {
    firestoreData.forEach(conn => {
      const integration = allIntegrations.find(i => i.id === (conn.id || conn.saas_type));
      if (integration) {
        integration.status = conn.status === 'connected' ? 'connected' : 'disconnected';
        integration.icon = conn.status === 'connected' ? '✅' : '🔴';
        integration.connectedAt = conn.connectedAt || conn.connected_at;
        integration.lastSync = conn.lastSync || conn.last_sync;
        integration.data = conn.data || conn.credentials;
      }
    });

    return allIntegrations;
  }

  // Si aucune donnée, retourner toutes les intégrations déconnectées
  return allIntegrations;
}
