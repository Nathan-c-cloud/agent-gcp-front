/**
 * Adaptateur pour convertir les données du backend vers le format AlertDetail
 */

import { Alert as BackendAlert } from './alertService';
import { Alert as UIAlert } from '../lib/mockData';

export class AlertAdapter {
  
  /**
   * Convertit une alerte du backend vers le format attendu par AlertDetail
   */
  static adaptAlert(backendAlert: BackendAlert): UIAlert {
    return {
      id: backendAlert.id,
      title: this.generateTitle(backendAlert),
      type: this.mapSeverityToType(backendAlert.severity),
      summary: this.generateSummary(backendAlert),
      sourceUrl: this.generateSourceUrl(backendAlert),
      aiAnalysis: this.generateAiAnalysis(backendAlert),
      detectedDate: backendAlert.received_at,
      status: 'pending', // Par défaut, à adapter selon votre logique métier
      category: this.mapAlertTypeToCategory(backendAlert.alert_type)
    };
  }

  /**
   * Convertit la liste des alertes backend vers le format UI
   */
  static adaptAlerts(backendAlerts: BackendAlert[]): UIAlert[] {
    return backendAlerts.map(alert => this.adaptAlert(alert));
  }

  /**
   * Génère un titre lisible à partir des données backend
   */
  private static generateTitle(alert: BackendAlert): string {
    const daysRemaining = this.calculateDaysRemaining(alert);
    const daysText = daysRemaining === 1 ? '1 jour' : `${daysRemaining} jours`;
    
    switch (alert.alert_type) {
      case 'deadline_critical':
      case 'D-1':
        return `🚨 Échéance critique dans ${daysText} — ${this.formatTaskName(alert.task_id)}`;
      case 'deadline_approaching':
      case 'D-7':
        return `⏰ Échéance dans ${daysText} — ${this.formatTaskName(alert.task_id)}`;
      case 'overdue':
        return `❌ Tâche en retard — ${this.formatTaskName(alert.task_id)}`;
      default:
        return alert.title || `📋 ${this.formatTaskName(alert.task_id)}`;
    }
  }

  /**
   * Formate le nom de la tâche pour l'affichage
   */
  private static formatTaskName(taskId: string): string {
    // Transforme "task_test_7_days" en "Tâche test 7 jours"
    return taskId
      .replace(/^task_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  /**
   * Calcule les jours restants jusqu'à l'échéance
   */
  private static calculateDaysRemaining(alert: BackendAlert): number {
    if (alert.days_remaining !== undefined) {
      return alert.days_remaining;
    }
    
    // Calculer à partir de due_date
    if (alert.due_date) {
      const dueDate = new Date(alert.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      dueDate.setHours(0, 0, 0, 0);
      
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    
    // Fallback: extraire du metadata.delta si disponible
    if (alert.metadata && typeof alert.metadata === 'object' && 'delta' in alert.metadata) {
      return (alert.metadata as any).delta;
    }
    
    // Par défaut
    return 0;
  }

  /**
   * Mappe la severity backend vers le type UI
   */
  private static mapSeverityToType(severity: string): UIAlert['type'] {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'urgent';
      case 'warning':
        return 'info';
      case 'info':
      case 'low':
      default:
        return 'normal';
    }
  }

  /**
   * Mappe le type d'alerte vers une catégorie UI
   */
  private static mapAlertTypeToCategory(alertType: string): UIAlert['category'] {
    switch (alertType) {
      case 'deadline_critical':
      case 'deadline_approaching':
        // Inférer la catégorie à partir du message ou type de tâche
        return 'fiscal'; // Par défaut fiscal, à adapter selon vos besoins
      case 'overdue':
        return 'fiscal';
      case 'test':
        return 'rh';
      default:
        return 'fiscal';
    }
  }

  /**
   * Génère un résumé adapté à partir du message backend
   */
  private static generateSummary(alert: BackendAlert): string {
    const baseMessage = alert.message || `Tâche ${alert.task_id} à traiter`;
    const daysRemaining = this.calculateDaysRemaining(alert);
    const dueDate = new Date(alert.due_date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    if (daysRemaining <= 0) {
      return `${baseMessage}. Cette tâche était due le ${dueDate} et est maintenant en retard.`;
    } else if (daysRemaining === 1) {
      return `${baseMessage}. Échéance demain (${dueDate}).`;
    } else if (daysRemaining <= 7) {
      return `${baseMessage}. Échéance le ${dueDate} dans ${daysRemaining} jours.`;
    } else {
      return `${baseMessage}. Échéance le ${dueDate}.`;
    }
  }

  /**
   * Génère une URL source basée sur le type d'alerte
   */
  private static generateSourceUrl(alert: BackendAlert): string {
    // Déterminer le type de démarche selon l'alert_type et task_id
    const taskId = alert.task_id.toLowerCase();
    const alertType = alert.alert_type.toLowerCase();
    
    // URLs spécialisées selon le type de tâche
    if (taskId.includes('tva') || taskId.includes('tax')) {
      return 'https://www.service-public.fr/professionnels-entreprises/vosdroits/F23566'; // TVA
    } else if (taskId.includes('social') || taskId.includes('urssaf')) {
      return 'https://www.urssaf.fr/portail/home/employeur/calculer-les-cotisations.html'; // Cotisations sociales
    } else if (taskId.includes('bilan') || taskId.includes('comptable')) {
      return 'https://www.service-public.fr/professionnels-entreprises/vosdroits/F31214'; // Bilan comptable
    } else if (taskId.includes('declaration') || taskId.includes('impot')) {
      return 'https://www.impots.gouv.fr/professionnel'; // Déclarations fiscales
    } else if (taskId.includes('rh') || taskId.includes('emploi')) {
      return 'https://www.service-public.fr/professionnels-entreprises/vosdroits/N24267'; // RH/Emploi
    } else if (taskId.includes('formation') || taskId.includes('cpf')) {
      return 'https://www.service-public.fr/professionnels-entreprises/vosdroits/F22570'; // Formation professionnelle
    } else if (taskId.includes('test') || taskId.includes('demo')) {
      // Pour les tâches de test, lien vers documentation générale
      return 'https://www.service-public.fr/professionnels-entreprises';
    } else {
      // URL générique pour les obligations fiscales
      return 'https://www.service-public.fr/professionnels-entreprises/vosdroits/N24266';
    }
  }

  /**
   * Génère une analyse IA contextuelle
   */
  private static generateAiAnalysis(alert: BackendAlert): string {
    const daysRemaining = this.calculateDaysRemaining(alert);
    const taskName = this.formatTaskName(alert.task_id);
    
    if (daysRemaining <= 0) {
      return `⚠️ La tâche "${taskName}" est en retard. Il est crucial de la traiter immédiatement pour éviter d'éventuelles pénalités ou complications. Nous recommandons de contacter votre expert-comptable si nécessaire.`;
    } else if (daysRemaining === 1) {
      return `🚨 La tâche "${taskName}" doit être complétée demain. Assurez-vous d'avoir tous les documents nécessaires et prévoyez du temps pour finaliser cette démarche aujourd'hui.`;
    } else if (daysRemaining <= 3) {
      return `⚡ La tâche "${taskName}" arrive à échéance dans ${daysRemaining} jours. Il est temps de commencer la préparation et de rassembler les documents requis pour éviter tout stress de dernière minute.`;
    } else if (daysRemaining <= 7) {
      return `📅 La tâche "${taskName}" doit être complétée dans ${daysRemaining} jours. Vous avez encore du temps, mais il est recommandé de planifier cette tâche dans votre agenda pour la semaine.`;
    } else if (daysRemaining <= 15) {
      return `📋 La tâche "${taskName}" arrive à échéance dans ${daysRemaining} jours. Vous pouvez commencer à anticiper cette démarche et identifier les documents ou informations nécessaires.`;
    } else {
      return `📝 La tâche "${taskName}" est programmée dans ${daysRemaining} jours. Pas d'urgence, mais vous pouvez déjà noter cette échéance dans votre planning pour ne pas l'oublier.`;
    }
  }
}

export default AlertAdapter;