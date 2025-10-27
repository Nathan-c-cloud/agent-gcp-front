/**
 * Service de gestion des démarches/procédures administratives
 * Récupère les données depuis le backend Flask/Firestore
 */

import { useState, useEffect } from 'react';

// Types pour les démarches
export type ProcedureStatus = 'todo' | 'inprogress' | 'done';
export type ProcedureType = 'Fiscal' | 'Social' | 'Comptable' | 'Juridique';

export interface Procedure {
  id: string;
  name: string;
  type: ProcedureType;
  deadline: string; // Format YYYY-MM-DD
  status: ProcedureStatus;
  progress: number; // 0-100
  current_step: number;
  total_steps: number;
  periode: string;
  etablissement: string;
  regime_fiscal: string;
  updated_at: string;
  firestore_status: string; // Le statut original dans Firestore
  firestore_type: string; // Le type original dans Firestore
}

interface ProceduresResponse {
  success?: boolean;
  data?: Procedure[];
  count?: number;
  timestamp?: string;
  error?: string;
  // Format alternatif du service existant
  procedures?: any[];
  source?: string;
  stats?: {
    completed: number;
    in_progress: number;
    total: number;
    urgent: number;
  };
}

/**
 * Transforme les données du service existant vers notre format
 */
function transformExistingDataToProcedures(rawProcedures: any[]): Procedure[] {
  return rawProcedures.map((proc) => {
    // Mapper les statuts
    const statusMapping: Record<string, ProcedureStatus> = {
      'in_progress': 'inprogress',
      'submitted': 'done',
      'review': 'inprogress',
      'completed': 'done'
    };

    // Mapper les types
    const typeMapping: Record<string, ProcedureType> = {
      'tva': 'Fiscal',
      'urssaf': 'Social',
      'aides': 'Juridique'
    };

    // Calculer deadline basée sur la période
    const calculateDeadline = (type: string, periode?: string) => {
      const now = new Date();
      const deadlineDays = type === 'tva' ? 20 : type === 'urssaf' ? 15 : 30;
      const deadline = new Date(now);
      deadline.setDate(deadline.getDate() + deadlineDays);
      return deadline.toISOString().split('T')[0];
    };

    return {
      id: proc.id,
      name: proc.title || `Déclaration ${proc.type?.toUpperCase()}`,
      type: typeMapping[proc.type] || 'Fiscal',
      deadline: calculateDeadline(proc.type, proc._raw?.perimetre?.periode),
      status: statusMapping[proc.status] || 'todo',
      progress: proc.progress || 0,
      current_step: proc.currentStep || 1,
      total_steps: proc.totalSteps || 5,
      periode: proc._raw?.perimetre?.periode || 'Période inconnue',
      etablissement: proc._raw?.perimetre?.etablissement || '',
      regime_fiscal: proc._raw?.perimetre?.regime_fiscal || '',
      updated_at: proc.lastUpdated || new Date().toISOString(),
      firestore_status: proc._raw?.statut || proc.status,
      firestore_type: proc.type || 'tva'
    };
  });
}

/**
 * Hook React pour gérer les démarches
 */
export function useProcedures(userId: string = 'test_user') {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchProcedures = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        user_id: userId
      });
      
      if (forceRefresh) {
        params.append('refresh', 'true');
      }

      const response = await fetch(`/api/procedures/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: ProceduresResponse = await response.json();
      
      let procedures: Procedure[] = [];
      
      // Format nouveau (notre module Flask)
      if (data.success && data.data) {
        procedures = data.data;
        console.log(`✅ ${data.count} démarches récupérées (nouveau format)`);
      }
      // Format existant (service demarches-api)
      else if (data.procedures) {
        procedures = transformExistingDataToProcedures(data.procedures);
        console.log(`✅ ${data.procedures.length} démarches récupérées (format existant)`);
      }
      else if (data.error) {
        throw new Error(data.error);
      }
      else {
        throw new Error('Format de données non reconnu');
      }
      
      setProcedures(procedures);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(errorMessage);
      console.error('❌ Erreur chargement démarches:', err);
      // En cas d'erreur, garder les données existantes si on en a
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcedures();
  }, [userId]);

  return {
    procedures,
    loading,
    error,
    lastUpdate,
    refresh: () => fetchProcedures(true),
    refetch: fetchProcedures
  };
}

/**
 * Service principal pour les démarches
 */
export class ProceduresService {
  private static readonly BASE_URL = '/api/procedures';

  /**
   * Récupère toutes les démarches pour un utilisateur
   */
  static async getProcedures(userId: string = 'test_user'): Promise<Procedure[]> {
    try {
      const params = new URLSearchParams({ user_id: userId });
      const response = await fetch(`${this.BASE_URL}/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data: ProceduresResponse = await response.json();
      
      // Format nouveau (notre module Flask)
      if (data.success && data.data) {
        return data.data;
      }
      // Format existant (service demarches-api)
      else if (data.procedures) {
        return transformExistingDataToProcedures(data.procedures);
      }
      else if (data.error) {
        throw new Error(data.error);
      }
      else {
        throw new Error('Format de données non reconnu');
      }
    } catch (error) {
      console.error('❌ Erreur ProceduresService.getProcedures:', error);
      throw error;
    }
  }

  /**
   * Récupère une démarche spécifique par ID
   */
  static async getProcedureById(id: string): Promise<Procedure | null> {
    try {
      const procedures = await this.getProcedures();
      return procedures.find(proc => proc.id === id) || null;
    } catch (error) {
      console.error('❌ Erreur ProceduresService.getProcedureById:', error);
      throw error;
    }
  }

  /**
   * Filtre les démarches par statut
   */
  static filterByStatus(procedures: Procedure[], status: ProcedureStatus | 'all'): Procedure[] {
    if (status === 'all') return procedures;
    return procedures.filter(proc => proc.status === status);
  }

  /**
   * Filtre les démarches par type
   */
  static filterByType(procedures: Procedure[], type: ProcedureType | 'all'): Procedure[] {
    if (type === 'all') return procedures;
    return procedures.filter(proc => proc.type === type);
  }

  /**
   * Recherche dans les démarches
   */
  static search(procedures: Procedure[], query: string): Procedure[] {
    if (!query.trim()) return procedures;
    const lowerQuery = query.toLowerCase();
    return procedures.filter(proc => 
      proc.name.toLowerCase().includes(lowerQuery) ||
      proc.type.toLowerCase().includes(lowerQuery) ||
      proc.periode.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Calcule les jours restants avant deadline
   */
  static getDaysUntilDeadline(deadline: string): number {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Vérifie si une démarche est urgente (deadline <= 7 jours)
   */
  static isUrgent(procedure: Procedure): boolean {
    if (procedure.status === 'done') return false;
    return this.getDaysUntilDeadline(procedure.deadline) <= 7;
  }

  /**
   * Compte les démarches urgentes
   */
  static countUrgent(procedures: Procedure[]): number {
    return procedures.filter(proc => this.isUrgent(proc)).length;
  }

  /**
   * Trie les démarches par deadline (plus proches en premier)
   */
  static sortByDeadline(procedures: Procedure[]): Procedure[] {
    return [...procedures].sort((a, b) => {
      const dateA = new Date(a.deadline);
      const dateB = new Date(b.deadline);
      return dateA.getTime() - dateB.getTime();
    });
  }

  /**
   * Test de connexion à l'API
   */
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/health`);
      const data = await response.json();
      
      return {
        success: response.ok && data.status !== 'error',
        message: data.status === 'error' ? data.error : 'Connexion OK'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur de connexion'
      };
    }
  }
}

/**
 * Configuration des statuts pour l'affichage
 */
export const statusConfig = {
  todo: { 
    label: '🟡 À faire', 
    color: 'bg-yellow-500', 
    variant: 'secondary' as const, 
    progress: 0 
  },
  inprogress: { 
    label: '🔴 En attente', 
    color: 'bg-red-500', 
    variant: 'destructive' as const, 
    progress: 50 
  },
  done: { 
    label: '🟢 Terminé', 
    color: 'bg-green-500', 
    variant: 'default' as const, 
    progress: 100 
  }
};

/**
 * Configuration des couleurs par type
 */
export const typeColors: Record<ProcedureType, { bg: string; border: string }> = {
  Fiscal: { bg: 'bg-blue-500', border: '#3B82F6' },
  Social: { bg: 'bg-green-500', border: '#10B981' },
  Comptable: { bg: 'bg-purple-500', border: '#A855F7' },
  Juridique: { bg: 'bg-orange-500', border: '#F97316' }
};