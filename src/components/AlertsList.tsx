/**
 * Composant AlertsList - Affiche la liste des alertes depuis le backend
 */

import { useState } from 'react';
import { useAlerts } from '../services/alertService';
import { AlertDetail } from './AlertDetail';
import AlertAdapter from '../services/alertAdapter';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { RefreshCw, Clock, AlertTriangle, Info, CheckCircle } from 'lucide-react';

export function AlertsList() {
  const { alerts: backendAlerts, loading, error, metadata, triggered, trigger_mode, refreshAlerts } = useAlerts();
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  // Si une alerte est sélectionnée, afficher AlertDetail
  if (selectedAlertId) {
    return (
      <div>
        <div className="p-4 bg-white border-b shadow-sm">
          <Button 
            onClick={() => setSelectedAlertId(null)}
            variant="outline"
            className="mb-2"
          >
            ← Retour à la liste
          </Button>
        </div>
        <AlertDetail alertId={selectedAlertId} />
      </div>
    );
  }

  // Affichage de la liste des alertes
  return (
    <div className="min-h-full bg-gradient-to-b from-[#F8FAFF] to-white">
      {/* Header */}
      <div className="bg-white border-b shadow-sm p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🚨 Alertes Réglementaires</h1>
              <p className="text-gray-600 mt-1">
                Suivez vos échéances et obligations en temps réel
              </p>
            </div>
            <div className="flex items-center gap-4">
              {metadata && (
                <div className="text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4" />
                    <span>
                      Dernière mise à jour: {
                        metadata.last_refresh > 0 
                          ? new Date(metadata.last_refresh * 1000).toLocaleTimeString('fr-FR')
                          : 'Jamais'
                      }
                    </span>
                  </div>
                  {metadata.mode === 'local_development' && (
                    <Badge variant="secondary" className="mt-1">
                      Mode développement
                    </Badge>
                  )}
                </div>
              )}
              <Button 
                onClick={refreshAlerts}
                variant="outline"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des alertes...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-6 border-red-200 bg-red-50">
            <div className="flex items-center gap-3 text-red-700">
              <AlertTriangle className="size-5" />
              <div>
                <h3 className="font-semibold">Erreur de chargement</h3>
                <p className="text-sm mt-1">{error}</p>
                <Button 
                  onClick={refreshAlerts}
                  variant="outline"
                  size="sm"
                  className="mt-3 border-red-300 hover:bg-red-100"
                >
                  Réessayer
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && backendAlerts.length === 0 && (
          <Card className="p-12 text-center">
            <CheckCircle className="size-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune alerte active
            </h3>
            <p className="text-gray-600 mb-4">
              Toutes vos obligations sont à jour ! Nous vous notifierons dès qu'une nouvelle échéance approchera.
            </p>
            <Button onClick={refreshAlerts} variant="outline">
              Vérifier les mises à jour
            </Button>
          </Card>
        )}

        {/* Alerts List */}
        {!loading && backendAlerts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {backendAlerts.length} alerte{backendAlerts.length > 1 ? 's' : ''} active{backendAlerts.length > 1 ? 's' : ''}
              </h2>
              {metadata && (
                <div className="text-sm text-gray-500">
                  {triggered && trigger_mode && (
                    <Badge variant={trigger_mode === 'sync' ? 'default' : 'secondary'}>
                      Actualisé ({trigger_mode})
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-4">
              {backendAlerts.map((alert) => (
                <AlertCard 
                  key={alert.id}
                  alert={alert}
                  onClick={() => setSelectedAlertId(alert.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant pour une carte d'alerte individuelle
interface AlertCardProps {
  alert: any; // Type from backend
  onClick: () => void;
}

function AlertCard({ alert, onClick }: AlertCardProps) {
  const getPriorityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          color: 'border-red-500 bg-red-50',
          badge: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertTriangle,
          iconColor: 'text-red-600'
        };
      case 'high':
        return {
          color: 'border-orange-500 bg-orange-50',
          badge: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: AlertTriangle,
          iconColor: 'text-orange-600'
        };
      case 'warning':
      case 'medium':
        return {
          color: 'border-yellow-500 bg-yellow-50',
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Info,
          iconColor: 'text-yellow-600'
        };
      default:
        return {
          color: 'border-blue-500 bg-blue-50',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Info,
          iconColor: 'text-blue-600'
        };
    }
  };

  const config = getPriorityConfig(alert.severity || 'info');
  const Icon = config.icon;

  const formatDaysRemaining = (days: number) => {
    if (days <= 0) return 'En retard';
    if (days === 1) return 'Demain';
    if (days <= 7) return `Dans ${days} jours`;
    return `Dans ${days} jours`;
  };

  return (
    <Card 
      className={`p-4 cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 ${config.color}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Icon className={`size-5 ${config.iconColor}`} />
            <Badge className={`text-xs font-medium border ${config.badge}`}>
              {(alert.severity || 'info').toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {formatDaysRemaining(alert.days_remaining || 0)}
            </Badge>
          </div>
          
          <h3 className="font-semibold text-gray-900 mb-1">
            {alert.task_id.replace(/^task_/, '').replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())}
          </h3>
          
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            {alert.message}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>📅 Échéance: {new Date(alert.due_date).toLocaleDateString('fr-FR')}</span>
            <span>🏷️ {alert.alert_type}</span>
            <span>⏰ {new Date(alert.received_at).toLocaleString('fr-FR')}</span>
          </div>
        </div>
        
        <div className="ml-4">
          <Button variant="ghost" size="sm">
            Voir détails →
          </Button>
        </div>
      </div>
    </Card>
  );
}