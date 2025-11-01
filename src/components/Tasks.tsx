/**
 * Composant pour afficher et gérer les tâches
 */

import { useEffect, useState } from 'react';
import { tasksService, Task } from '../services/tasksService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle2, Circle, Clock, AlertCircle, Calendar, User, Building2, FileText } from 'lucide-react';

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      // Utiliser org_demo comme ID d'organisation par défaut
      const tasksData = await tasksService.getTasksByOrg('org_demo');
      setTasks(tasksData);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await tasksService.updateTaskStatus(taskId, newStatus);
      // Recharger les tâches après la mise à jour
      await loadTasks();
    } catch (err) {
      console.error('Error updating task status:', err);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const getStatusBadge = (status: Task['status']) => {
    const statusConfig = {
      open: { label: 'Ouvert', variant: 'default' as const, icon: Circle },
      in_progress: { label: 'En cours', variant: 'secondary' as const, icon: Clock },
      completed: { label: 'Terminé', variant: 'outline' as const, icon: CheckCircle2 },
      cancelled: { label: 'Annulé', variant: 'destructive' as const, icon: AlertCircle }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Si une tâche est sélectionnée, afficher les détails
  if (selectedTask) {
    return (
      <div className="min-h-full p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto">
          {/* Bouton retour */}
          <Button 
            onClick={() => setSelectedTask(null)}
            variant="outline"
            className="mb-6 shadow-sm hover:shadow-md transition-all"
          >
            ← Retour à la liste
          </Button>

          {/* Détails de la tâche */}
          <Card className="p-8 bg-white rounded-2xl shadow-xl border-0">
            {/* Header */}
            <div className="mb-6 pb-6 border-b">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedTask.title}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                {getStatusBadge(selectedTask.status)}
                {selectedTask.needs_review && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Nécessite révision
                  </Badge>
                )}
              </div>
            </div>

            {/* Contenu */}
            <div className="space-y-6">
              {/* Description */}
              {selectedTask.description && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    Description
                  </h3>
                  <p className="text-muted-foreground leading-relaxed pl-7">
                    {selectedTask.description}
                  </p>
                </div>
              )}

              {/* Informations principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Date d'échéance</span>
                  </div>
                  <p className="text-lg font-semibold pl-6">{selectedTask.due_date}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Date de création</span>
                  </div>
                  <p className="text-sm pl-6">{formatDate(selectedTask.created_at)}</p>
                </div>
              </div>

              {/* Informations complémentaires */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-semibold text-lg text-blue-900 mb-4">Informations complémentaires</h3>
                <div className="space-y-3">
                  {/* Créée par */}
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-blue-700 mt-1" />
                    <div className="flex-1">
                      <span className="text-sm text-blue-700 block">Créée par</span>
                      <span className="font-medium text-blue-900">{selectedTask.created_by}</span>
                    </div>
                  </div>

                  {/* Organisation */}
                  <div className="flex items-start gap-3">
                    <Building2 className="h-4 w-4 text-blue-700 mt-1" />
                    <div className="flex-1">
                      <span className="text-sm text-blue-700 block">Organisation</span>
                      <span className="font-medium text-blue-900">{selectedTask.org_id}</span>
                    </div>
                  </div>

                  {/* Règle associée */}
                  {selectedTask.rule_id && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 text-blue-700 mt-1" />
                      <div className="flex-1">
                        <span className="text-sm text-blue-700 block">Règle associée</span>
                        <span className="font-mono text-xs bg-blue-100 px-2 py-1 rounded inline-block mt-1 text-blue-900">
                          {selectedTask.rule_id}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Dernière mise à jour */}
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-blue-700 mt-1" />
                    <div className="flex-1">
                      <span className="text-sm text-blue-700 block">Dernière mise à jour</span>
                      <span className="text-sm text-blue-900">{formatDate(selectedTask.updated_at)}</span>
                    </div>
                  </div>

                  {/* ID de la tâche */}
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-blue-700 mt-1" />
                    <div className="flex-1">
                      <span className="text-sm text-blue-700 block">ID de la tâche</span>
                      <span className="font-mono text-xs bg-blue-100 px-2 py-1 rounded inline-block mt-1 break-all text-blue-900">
                        {selectedTask.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                {selectedTask.status === 'open' && (
                  <Button
                    variant="default"
                    onClick={() => {
                      handleStatusChange(selectedTask.id, 'in_progress');
                      setSelectedTask(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Marquer en cours
                  </Button>
                )}
                
                {selectedTask.status === 'in_progress' && (
                  <Button
                    variant="default"
                    onClick={() => {
                      handleStatusChange(selectedTask.id, 'completed');
                      setSelectedTask(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Terminer la tâche
                  </Button>
                )}
                
                {(selectedTask.status === 'open' || selectedTask.status === 'in_progress') && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleStatusChange(selectedTask.id, 'cancelled');
                      setSelectedTask(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Annuler
                  </Button>
                )}
                
                {selectedTask.status === 'completed' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleStatusChange(selectedTask.id, 'open');
                      setSelectedTask(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Circle className="h-4 w-4" />
                    Rouvrir
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedTask(null)}
                  className="ml-auto"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des tâches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">Erreur</p>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadTasks}>Réessayer</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 p-12 animate-in fade-in duration-500 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 shadow-lg">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-3xl tracking-tight font-bold">Tâches</h1>
          </div>
          <div className="h-1.5 w-40 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-4 shadow-lg" />
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Liste des tâches */}
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Circle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2">Aucune tâche</p>
                  <p className="text-muted-foreground">Aucune tâche trouvée</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tasks.map((task) => (
                <Card
                  key={task.id}
                  className="hover:shadow-lg transition-all cursor-pointer hover:border-primary/50"
                  onClick={() => setSelectedTask(task)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg mb-2 truncate">{task.title}</CardTitle>
                        {task.description && (
                          <CardDescription className="text-sm line-clamp-2">
                            {task.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {getStatusBadge(task.status)}
                        {task.needs_review && (
                          <Badge variant="destructive" className="text-xs">Révision</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{task.due_date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Créée le {formatDate(task.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
