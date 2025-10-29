export interface Alert {
  id: string;
  title: string;
  type: 'urgent' | 'info' | 'normal';
  summary: string;
  sourceUrl: string;
  aiAnalysis: string;
  detectedDate: string;
  processedDate?: string;
  status: 'pending' | 'processed' | 'archived';
  category: 'fiscal' | 'rh' | 'juridique' | 'aides';
}

export interface Procedure {
  id: string;
  name: string;
  type: 'Fiscal' | 'Social' | 'Comptable' | 'Juridique';
  deadline: string;
  status: 'todo' | 'inprogress' | 'done';
}

export const alerts: Alert[] = [
  {
    id: 'alert-1',
    title: 'Nouvelle règle URSSAF — cotisations trimestrielles',
    type: 'urgent',
    summary: 'Applicable dès novembre 2025. Taux modifié pour les entreprises < 50 salariés.',
    sourceUrl: 'https://service-public.fr/urssaf-2025',
    aiAnalysis: 'Cette mesure pourrait impacter vos cotisations sociales dès le prochain trimestre. Optimious peut vous rappeler cette échéance et calculer l\'impact estimé sur votre trésorerie.',
    detectedDate: '2025-10-10',
    processedDate: '2025-10-12',
    status: 'pending',
    category: 'rh'
  },
  {
    id: 'alert-2',
    title: 'Loi de finances 2026 — Mesures fiscales',
    type: 'info',
    summary: 'Nouvelles dispositions fiscales pour les PME. Crédit d\'impôt recherche élargi.',
    sourceUrl: 'https://service-public.fr/loi-finances-2026',
    aiAnalysis: 'Votre entreprise pourrait bénéficier des nouveaux crédits d\'impôt recherche. Une analyse approfondie est recommandée avec votre expert-comptable.',
    detectedDate: '2025-10-08',
    status: 'processed',
    category: 'fiscal'
  },
  {
    id: 'alert-3',
    title: 'Nouvelles obligations télétravail',
    type: 'normal',
    summary: 'Mise à jour du cadre légal pour le télétravail partiel et hybride.',
    sourceUrl: 'https://service-public.fr/teletravail-2025',
    aiAnalysis: 'Si vous avez des employés en télétravail, vous devrez mettre à jour vos accords d\'entreprise avant fin décembre 2025.',
    detectedDate: '2025-10-09',
    status: 'pending',
    category: 'rh'
  },
  {
    id: 'alert-4',
    title: 'Aide à la transition écologique',
    type: 'info',
    summary: 'Nouveau dispositif d\'aide pour les entreprises engagées dans la transition écologique.',
    sourceUrl: 'https://service-public.fr/aides-ecologie',
    aiAnalysis: 'Votre entreprise est éligible à cette aide si vous investissez dans des équipements éco-responsables. Montant maximal : 20 000€.',
    detectedDate: '2025-10-11',
    status: 'pending',
    category: 'aides'
  }
];

export const procedures: Procedure[] = [
  {
    id: 'proc-1',
    name: 'Déclaration TVA',
    type: 'Fiscal',
    deadline: '2025-10-15',
    status: 'todo'
  },
  {
    id: 'proc-2',
    name: 'URSSAF Q4',
    type: 'Social',
    deadline: '2025-10-30',
    status: 'inprogress'
  },
  {
    id: 'proc-3',
    name: 'Bilan comptable',
    type: 'Comptable',
    deadline: '2025-10-20',
    status: 'done'
  },
  {
    id: 'proc-4',
    name: 'Déclaration sociale',
    type: 'Social',
    deadline: '2025-11-05',
    status: 'todo'
  },
  {
    id: 'proc-5',
    name: 'Mise à jour statuts',
    type: 'Juridique',
    deadline: '2025-11-15',
    status: 'todo'
  }
];

export const chatMessages = [
  {
    role: 'user' as const,
    content: 'Quels sont mes paiements URSSAF à venir ?'
  },
  {
    role: 'assistant' as const,
    content: 'D\'après vos données, votre prochaine échéance URSSAF est le 30 octobre 2025 pour le trimestre Q4. Le montant estimé est de 4 850€. Souhaitez-vous que je crée un rappel ?'
  }
];

export const suggestedQuestions = [
  'Quelles sont les dernières alertes urgentes ?',
  'Aide-moi à préparer ma déclaration TVA',
  'Quelles aides publiques sont disponibles ?',
  'Résume mes démarches en retard'
];
