// services/integrationService.ts
/**
 * Service pour gérer les intégrations SaaS
 * CORRECTION: Utilise GET /status au lieu de POST
 */

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
}

/**
 * Récupère l'état de toutes les intégrations pour un user
 * UTILISE GET avec query parameters
 */
export async function getIntegrations(userId: string, companyId: string): Promise<Integration[]> {
  try {
    // ✅ GET /status avec query parameters (pas POST!)
    const url = `${SAAS_API_URL}/status?user_id=${encodeURIComponent(userId)}&company_id=${encodeURIComponent(companyId)}`;

    console.log('📡 Fetching integrations from:', url);

    const response = await fetch(url, {
      method: 'GET', // ← GET, pas POST!
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Integrations received:', data);

    // Transformer la réponse backend en format frontend
    return transformBackendToFrontend(data.connections);

  } catch (error) {
    console.error('❌ Error fetching integrations:', error);
    // Retourner des intégrations par défaut en cas d'erreur
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
 * Déconnecte une intégration
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

    const result = await response.json();
    console.log('✅ Disconnect result:', result);

    return {
      success: result.success || result.status === 'success',
      message: result.message || 'Intégration déconnectée'
    };

  } catch (error) {
    console.error('❌ Error disconnecting integration:', error);
    return {
      success: false,
      message: 'Erreur lors de la déconnexion'
    };
  }
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

    const result = await response.json();
    console.log('✅ Test result:', result);

    return {
      success: result.connected || false,
      message: result.message || 'Test effectué'
    };

  } catch (error) {
    console.error('❌ Error testing integration:', error);
    return {
      success: false,
      message: 'Erreur lors du test'
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
    }
  ];
}