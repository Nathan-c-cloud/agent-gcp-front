/**
 * Service pour gérer les appels vers l'API backend des alertes
 */

import { useState, useEffect, useCallback } from 'react';

export interface Alert {
  id: string;
  task_id: string;
  alert_type: string;  // Plus flexible pour les vraies données
  message: string;
  received_at: string | number;  // Firestore peut envoyer timestamp
  severity: 'low' | 'medium' | 'high' | 'critical' | 'warning' | 'info';  // Correspond aux vraies données
  due_date: string;
  days_remaining?: number;  // Peut être absent dans les vraies données
  // Champs additionnels de Firestore
  acknowledged?: boolean;
  created_at?: number;
  metadata?: any;
  org_id?: string;
  source?: string;
  title?: string;
}

export interface AlertsResponse {
  alerts: Alert[];
  triggered: boolean;
  trigger_mode: 'background' | 'sync' | null;
  metadata: {
    count: number;
    last_refresh: number;
    time_since_refresh: number;
    ttl: number;
    timestamp: number;
    mode: string;
  };
  scan_result?: {
    status: string;
    message: string;
    alerts_processed?: number;
    alerts_created?: number;
  };
}

export interface HealthResponse {
  status: string;
  timestamp: number;
  mode: string;
}

class AlertService {
  private baseUrl = '/api';

  /**
   * Vérifie la santé du backend
   */
  async healthCheck(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Récupère les alertes depuis le backend
   * @param syncMode - Si true, attend la réponse du scan alert-engine
   * @param ttlOverride - Override du TTL pour forcer le refresh (en secondes)
   */
  async getAlerts(syncMode: boolean = false, ttlOverride?: number): Promise<AlertsResponse> {
    const params = new URLSearchParams();
    
    if (syncMode) {
      params.set('sync', 'true');
    }
    
    if (ttlOverride !== undefined) {
      params.set('ttl_override', ttlOverride.toString());
    }

    const url = `${this.baseUrl}/alerts${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch alerts: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Ajoute une alerte mockée (développement uniquement)
   */
  async addMockAlert(alertData: Partial<Alert>): Promise<{ status: string; alert: Alert }> {
    const response = await fetch(`${this.baseUrl}/alerts/mock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alertData),
    });

    if (!response.ok) {
      throw new Error(`Failed to add mock alert: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Reset les alertes mockées aux valeurs par défaut (développement)
   */
  async resetMockAlerts(): Promise<{ status: string; message: string; count: number }> {
    const response = await fetch(`${this.baseUrl}/alerts/reset`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to reset mock alerts: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Formate la date pour l'affichage
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formate le temps relatif (ex: "il y a 2 heures")
   */
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'à l\'instant';
    if (diffMinutes < 60) return `il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    if (diffHours < 24) return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  }

  /**
   * Détermine la couleur de la priorité pour l'UI
   */
  getPriorityColor(severity: Alert['severity']): string {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'warning':
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  /**
   * Détermine l'icône de la priorité
   */
  getPriorityIcon(severity: Alert['severity']): string {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'warning':
      case 'medium': return '⚡';
      case 'info':
      case 'low': return 'ℹ️';
      default: return '📋';
    }
  }

  /**
   * Trie les alertes par priorité puis par date d'échéance
   */
  sortAlerts(alerts: Alert[]): Alert[] {
    const priorityOrder: Record<string, number> = { 
      critical: 4, 
      high: 3, 
      warning: 2,
      medium: 2, 
      info: 1,
      low: 1 
    };
    
    return [...alerts].sort((a, b) => {
      // D'abord par priorité (décroissant)
      const severityA = a.severity || 'low';
      const severityB = b.severity || 'low';
      const priorityDiff = (priorityOrder[severityB] || 0) - (priorityOrder[severityA] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Ensuite par jours restants (croissant - plus urgent d'abord)
      const daysA = a.days_remaining || 999;
      const daysB = b.days_remaining || 999;
      return daysA - daysB;
    });
  }
}

// Instance singleton
export const alertService = new AlertService();

// Hook React personnalisé pour utiliser les alertes
export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AlertsResponse | null>(null);

  const fetchAlerts = useCallback(async (syncMode: boolean = false, ttlOverride?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const responseData = await alertService.getAlerts(syncMode, ttlOverride);
      const sortedAlerts = alertService.sortAlerts(responseData.alerts);
      
      setAlerts(sortedAlerts);
      setResponse(responseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAlerts = useCallback(() => {
    fetchAlerts(false, 0); // Force refresh
  }, [fetchAlerts]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    metadata: response?.metadata || null,
    triggered: response?.triggered || false,
    trigger_mode: response?.trigger_mode || null,
    refreshAlerts,
    fetchAlerts
  };
}

export default alertService;