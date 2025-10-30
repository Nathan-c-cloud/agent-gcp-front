/**
 * Service pour gérer les appels vers l'API backend de veille réglementaire
 */

import { useState, useEffect, useCallback } from 'react';

export interface AlerteVeille {
  id: string;
  companyId: string;
  userId?: string;
  type?: 'veille';
  // Champs de la vraie structure Firestore
  summary: string; // Le message/description
  detectedDate: string; // Date de détection
  sourceUrl: string; // URL de la source
  category?: string; // Catégorie (social, fiscal, etc.)
  status: string; // "nouveau" ou "lu"
  priority?: number; // Priorité numérique
  score?: number; // Score de pertinence
  score_base?: number;
  actions?: string[]; // Liste des actions
  aiAnalysis?: string; // Analyse IA
  pertinence?: {
    raisons: string[];
    score: number;
    score_base: number;
  };
  processedDate?: string | null;
  tags?: string[]; // Tags associés à l'alerte

  // Pour rétrocompatibilité avec l'affichage
  titre: string; // Sera mappé depuis summary
  message: string; // Sera mappé depuis summary ou aiAnalysis
  source: string; // Sera mappé depuis sourceUrl
  priorite: 'haute' | 'moyenne' | 'basse'; // Sera calculé depuis priority
  statut: 'non_lu' | 'lu'; // Sera mappé depuis status
  dateCreation: string; // Sera mappé depuis detectedDate
  dateEcheance?: string | null;
  dateLecture?: string | null;
  metadata?: {
    categorie: string;
    score_pertinence?: number;
    question_origine?: string;
  };
}

export interface VeilleResponse {
  success: boolean;
  alertes: AlerteVeille[];
  total: number;
}

export interface AnalyseVeilleResponse {
  success: boolean;
  nb_nouvelles_alertes: number;
  alertes: AlerteVeille[];
}

import { ENDPOINTS } from '../config/api';

const API_BASE_URL = ENDPOINTS.veille.base;

/**
 * Normalise les données Firestore vers le format attendu par le frontend
 */
function normalizeAlerteVeille(data: any): AlerteVeille {
  // Mapper priority (numérique) vers priorite (texte)
  let priorite: 'haute' | 'moyenne' | 'basse' = 'moyenne';
  if (data.priority !== undefined) {
    if (data.priority <= 1) priorite = 'haute';
    else if (data.priority === 2) priorite = 'moyenne';
    else priorite = 'basse';
  } else if (data.score && data.score > 0.7) {
    priorite = 'haute';
  }

  // Mapper status vers statut
  let statut: 'non_lu' | 'lu' = 'non_lu';
  if (data.status === 'lu' || data.status === 'read') {
    statut = 'lu';
  } else if (data.status === 'nouveau' || data.status === 'new' || !data.status) {
    statut = 'non_lu';
  }

  // Extraire la catégorie depuis category ou tags
  let categorie = 'fiscal';
  if (data.category) {
    categorie = data.category;
  } else if (data.tags && data.tags.length > 0) {
    // Mapper les tags vers les catégories
    const tag = data.tags[0].toLowerCase();
    if (tag.includes('social') || tag.includes('rh')) categorie = 'rh';
    else if (tag.includes('juridique') || tag.includes('legal')) categorie = 'juridique';
    else if (tag.includes('aide') || tag.includes('subvention')) categorie = 'aides';
    else categorie = 'fiscal';
  }

  // Extraire le titre depuis title ou summary
  const titre = data.title || data.summary?.split('\n')[0] || 'Alerte réglementaire';

  // Extraire le message depuis aiAnalysis ou summary
  const message = data.aiAnalysis || data.summary || data.message || '';

  return {
    ...data,
    // Champs normalisés pour l'affichage
    titre: titre.length > 100 ? titre.substring(0, 100) + '...' : titre,
    message,
    source: data.sourceUrl || data.source || '#',
    priorite,
    statut,
    dateCreation: data.detectedDate || data.dateCreation || new Date().toISOString(),
    metadata: {
      categorie,
      score_pertinence: data.score || data.pertinence?.score || 0,
      question_origine: data.pertinence?.raisons?.join(', ') || (data.tags ? data.tags.join(', ') : '')
    }
  };
}

class VeilleService {
  /**
   * Récupère les alertes de veille pour une entreprise
   */
  async getAlertesVeille(companyId: string): Promise<VeilleResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/company/${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur backend:', errorText);
        throw new Error(`Erreur HTTP ${response.status}: Backend non disponible ou erreur serveur`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const htmlContent = await response.text();
        console.error('Réponse HTML reçue au lieu de JSON:', htmlContent.substring(0, 200));
        throw new Error('Backend non démarré ou endpoint incorrect. Vérifiez que le backend Flask tourne sur le port 8080.');
      }

      const data = await response.json();

      // Normaliser les alertes
      const alertesNormalisees = data.alertes.map(normalizeAlerteVeille);

      return {
        success: data.success,
        alertes: alertesNormalisees,
        total: data.total
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes de veille:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Impossible de contacter le backend. Assurez-vous que le backend est démarré (port 8080).');
      }
      throw error;
    }
  }

  /**
   * Lance une analyse de veille réglementaire
   */
  async analyserVeille(companyId: string): Promise<AnalyseVeilleResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/analyser/${companyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur backend:', errorText);
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Backend non démarré ou endpoint incorrect.');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'analyse de veille:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Backend non disponible. Vérifiez qu\'il est démarré sur le port 8080.');
      }
      throw error;
    }
  }

  /**
   * Marque une alerte comme lue
   */
  async marquerCommeLue(alerteId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/marquer-lu/${alerteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors du marquage de l\'alerte:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Backend non disponible.');
      }
      throw error;
    }
  }
}

export const veilleService = new VeilleService();

/**
 * Hook React pour récupérer les alertes de veille
 */
export function useAlertesVeille(companyId: string) {
  const [alertes, setAlertes] = useState<AlerteVeille[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlertes = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await veilleService.getAlertesVeille(companyId);
      setAlertes(response.alertes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('Erreur useAlertesVeille:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchAlertes();
  }, [fetchAlertes]);

  return { alertes, loading, error, refetch: fetchAlertes };
}

/**
 * Hook React pour lancer une analyse de veille
 */
export function useAnalyseVeille(companyId: string) {
  const [analysing, setAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyser = useCallback(async () => {
    if (!companyId) return null;

    setAnalysing(true);
    setError(null);

    try {
      const response = await veilleService.analyserVeille(companyId);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('Erreur useAnalyseVeille:', err);
      return null;
    } finally {
      setAnalysing(false);
    }
  }, [companyId]);

  return { analyser, analysing, error };
}

