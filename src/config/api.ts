/**
 * Configuration centralisée des URLs API
 * Utilise les variables d'environnement Vite
 */

// URL de base pour l'API backend (auth, procedures, etc.)
// En production, utilise le proxy Nginx (URL relative)
// En développement, utilise localhost
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.VITE_NODE_ENV === 'production' ? '' : 'http://localhost:8080');

// URL pour l'API SaaS externe (déclarations)
export const SAAS_API_URL = import.meta.env.VITE_SAAS_API_URL || 'https://saas-integrations-api-2hpsggoeja-uw.a.run.app';

// URL pour l'assistant AI
export const AI_ASSISTANT_URL = import.meta.env.VITE_AI_API_URL || 'https://agent-client-478570587937.us-west1.run.app';

// Endpoints backend
export const ENDPOINTS = {
  // Authentication
  auth: {
    register: `${API_BASE_URL}/auth/register`,
    login: `${API_BASE_URL}/auth/login`,
    logout: `${API_BASE_URL}/auth/logout`
  },
  
  // Procedures
  procedures: {
    list: `${API_BASE_URL}/api/procedures`,
    byId: (id: string) => `${API_BASE_URL}/api/procedures/${id}`,
    health: `${API_BASE_URL}/api/procedures/health`
  },

  // Alertes
  alerts: {
    base: `${API_BASE_URL}/alerts/`,
    trigger: `${API_BASE_URL}/alerts/trigger`,
    health: `${API_BASE_URL}/alerts/health`,
    config: `${API_BASE_URL}/alerts/config`
  },

  // Veille réglementaire
  veille: {
    base: `${API_BASE_URL}/veille`,
    company: (companyId: string) => `${API_BASE_URL}/veille/company/${companyId}`,
    analyser: (companyId: string) => `${API_BASE_URL}/veille/analyser/${companyId}`,
    marquerLu: (alerteId: string) => `${API_BASE_URL}/veille/marquer-lu/${alerteId}`,
    news: `${API_BASE_URL}/veille/news`,
    updates: `${API_BASE_URL}/veille/updates`
  },

  // Tâches
  tasks: {
    base: `${API_BASE_URL}/tasks/`,
    byOrg: (orgId: string) => `${API_BASE_URL}/tasks/org/${orgId}`,
    byId: (taskId: string) => `${API_BASE_URL}/tasks/${taskId}`,
    updateStatus: (taskId: string) => `${API_BASE_URL}/tasks/${taskId}/status`,
    health: `${API_BASE_URL}/tasks/health`
  }
};

// Fonction utilitaire pour construire les headers avec auth
export function getAuthHeaders(token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  // Récupérer le token depuis localStorage si pas fourni
  const authToken = token || localStorage.getItem('auth_token');
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  
  return headers;
}

// Fonction utilitaire pour les requêtes API avec gestion d'erreurs
export async function apiRequest(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ API Request failed for ${url}:`, error);
    throw error;
  }
}

console.log('🔧 API Configuration loaded:', {
  API_BASE_URL,
  SAAS_API_URL,
  AI_ASSISTANT_URL
});