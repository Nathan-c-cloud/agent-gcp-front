import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText,
  ArrowUpRight,
  Sparkles,
  Zap,
  Plus
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSettings } from '../services/settingsService';
import { useProcedures, ProceduresService, type Procedure } from '../services/proceduresService';
import { useAlerts, alertService, type Alert } from '../services/alertService';

export function Dashboard({ 
  onNewDeclaration,
  onNavigateToProcedures,
  onNavigateToAlerts
}: { 
  onNewDeclaration: () => void;
  onNavigateToProcedures?: () => void;
  onNavigateToAlerts?: () => void;
}) {
  const [userFirstName, setUserFirstName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Récupérer les vraies données des démarches et des alertes (sans filtrer par user_id)
  const { procedures: allProcedures } = useProcedures();
  const { alerts: allAlerts } = useAlerts();

  // Charger les données depuis Firestore
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const companyId = "demo_company"; // TODO: Récupérer depuis le contexte d'authentification
        const settings = await getSettings(companyId);

        if (settings) {
          setUserFirstName(settings.representative.prenom || 'Utilisateur');
          setCompanyName(settings.company_info.nom || 'Votre entreprise');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setUserFirstName('Utilisateur');
        setCompanyName('Votre entreprise');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Calculer les vraies statistiques
  const demarchesEnCours = allProcedures.filter(proc => proc.status === 'inprogress').length;
  const demarchesCompletes = allProcedures.filter(proc => proc.status === 'done').length;
  const demarchesUrgentes = ProceduresService.countUrgent(allProcedures);
  
  // Calculer les vraies alertes
  const alertesCritiques = allAlerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high').length;
  
  const stats = [
    {
      label: 'Alertes actives',
      value: allAlerts.length.toString(),
      change: alertesCritiques > 0 ? `${alertesCritiques} critiques` : 'Aucune critique',
      trend: alertesCritiques > 0 ? 'up' : 'neutral',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      iconBg: 'bg-red-500'
    },
    {
      label: 'Démarches en cours',
      value: demarchesEnCours.toString(),
      change: demarchesUrgentes > 0 ? `${demarchesUrgentes} à échéance proche` : 'Aucune urgence',
      trend: demarchesUrgentes > 0 ? 'neutral' : 'up',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-500'
    },
    {
      label: 'Tâches complétées',
      value: demarchesCompletes.toString(),
      change: `${allProcedures.length} au total`,
      trend: 'up',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-500'
    },
    {
      label: 'Documents traités',
      value: '156', // TODO: Calculer depuis les vraies données si disponible
      change: '+12% vs mois dernier',
      trend: 'up',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-500'
    }
  ];

  // Calculer les tâches urgentes à partir des vraies données
  const urgentTasks = allProcedures
    .filter(proc => proc.status !== 'done') // Uniquement les procédures non terminées
    .map(proc => {
      const daysUntil = ProceduresService.getDaysUntilDeadline(proc.deadline);
      const deadline = new Date(proc.deadline);
      const isUrgent = ProceduresService.isUrgent(proc);
      
      return {
        id: proc.id,
        title: proc.name,
        deadline: deadline.toLocaleDateString('fr-FR', { 
          day: '2-digit', 
          month: 'short' 
        }),
        status: isUrgent ? 'urgent' : (daysUntil <= 15 ? 'warning' : 'normal'),
        progress: proc.progress,
        daysUntil
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil) // Trier par échéance la plus proche
    .slice(0, 3); // Prendre les 3 plus urgentes

  // Préparer les alertes récentes à partir des vraies données
  const recentAlerts = allAlerts
    .slice(0, 3) // Prendre les 3 plus récentes (déjà triées par priorité)
    .map(alert => {
      // Déterminer la catégorie basée sur le type d'alerte ou le message
      let category = 'Réglementaire';
      const messageLC = (alert.message || alert.title || '').toLowerCase();
      
      if (messageLC.includes('urssaf') || messageLC.includes('social') || messageLC.includes('rh')) {
        category = 'RH';
      } else if (messageLC.includes('tva') || messageLC.includes('fiscal') || messageLC.includes('impôt')) {
        category = 'Fiscal';  
      } else if (messageLC.includes('aide') || messageLC.includes('subvention')) {
        category = 'Aides';
      }
      
      return {
        id: alert.id,
        title: alert.title || alert.message,
        category,
        urgent: alert.severity === 'critical' || alert.severity === 'high',
        severity: alert.severity,
        due_date: alert.due_date,
        days_remaining: alert.days_remaining
      };
    });

  return (
    <div className="min-h-full bg-gray-50 p-12 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl tracking-tight mb-2">
              {isLoading ? 'Chargement...' : `Bonjour ${userFirstName} 👋`}
            </h1>
            <p className="text-gray-600 text-lg">
              Voici les nouveautés réglementaires du jour
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onNewDeclaration}
              className="gap-2 bg-green-600 hover:bg-green-700 shadow-lg transition-all hover:scale-105 rounded-xl px-6 h-12"
            >
              <Plus className="size-5" />
              <span className="font-semibold">➕ Nouvelle déclaration</span>
            </Button>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg transition-all hover:scale-105 rounded-xl px-6 h-12">
              <Sparkles className="size-5" />
              <span className="font-semibold">Demander à l'IA</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer rounded-2xl bg-white border border-gray-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                    <Icon className="size-6 text-white" />
                  </div>
                  {stat.trend === 'up' && (
                    <Badge className="bg-green-100 text-green-700 border-0">
                      <TrendingUp className="size-3 mr-1" />
                      <span className="font-bold">+</span>
                    </Badge>
                  )}
                </div>
                <h2 className="text-3xl mb-1 font-bold tracking-tight text-gray-900">{stat.value}</h2>
                <p className="text-sm text-gray-600 font-medium mb-1">{stat.label}</p>
                <p className="text-xs text-gray-500">{stat.change}</p>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Urgent Tasks */}
          <Card className="lg:col-span-2 p-8 rounded-2xl bg-white border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <span className="text-2xl">🔥</span>
                </div>
                <h3 className="text-xl tracking-tight font-semibold">Démarches urgentes</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1"
                onClick={() => onNavigateToProcedures?.()}
              >
                <span className="font-medium">Tout voir</span>
                <ArrowUpRight className="size-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {urgentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle2 className="size-12 text-green-500" />
                    <div>
                      <p className="font-semibold text-gray-900">Aucune démarche urgente !</p>
                      <p className="text-sm text-gray-600">Toutes vos échéances sont sous contrôle</p>
                    </div>
                  </div>
                </div>
              ) : (
                urgentTasks.map((task, index) => (
                <div
                  key={index}
                  className="group flex items-center justify-between p-5 rounded-xl bg-gray-50 border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                  onClick={() => onNavigateToProcedures?.()}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-1.5 h-16 rounded-full ${
                      task.status === 'urgent' ? 'bg-red-500' :
                      task.status === 'warning' ? 'bg-orange-500' :
                      'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <p className="font-semibold mb-2 text-gray-900">{task.title}</p>
                      <div className="flex items-center gap-3">
                        <p className="text-sm text-gray-600">Échéance : {task.deadline}</p>
                        <div className="flex-1 max-w-[200px]">
                          <Progress value={task.progress} className="h-2" />
                        </div>
                        <span className="text-xs font-bold text-gray-600">{task.progress}%</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={task.status === 'urgent' ? 'destructive' : 'secondary'} className="font-semibold">
                    {task.status === 'urgent' ? 'Urgent' : task.status === 'warning' ? 'Bientôt' : 'Normal'}
                  </Badge>
                </div>
                ))
              )}
            </div>
            {allProcedures.length > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-green-50 border border-green-200">
                <p className="text-sm font-medium text-green-900">
                  🎉 Bonne nouvelle ! <span className="font-bold">{demarchesCompletes} démarches sur {allProcedures.length}</span> sont déjà faites
                  {demarchesCompletes === allProcedures.length && (
                    <span> - Tout est à jour ! 🎯</span>
                  )}
                </p>
              </div>
            )}
          </Card>

          {/* Activity Progress */}
          <Card className="p-8 rounded-2xl bg-white border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-100">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl tracking-tight font-semibold">Progression mensuelle</h3>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Conformité fiscale</span>
                  <span className="text-lg font-bold text-blue-600">85%</span>
                </div>
                <Progress value={85} className="h-3" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Obligations RH</span>
                  <span className="text-lg font-bold text-green-600">92%</span>
                </div>
                <Progress value={92} className="h-3" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Démarches juridiques</span>
                  <span className="text-lg font-bold text-orange-600">70%</span>
                </div>
                <Progress value={70} className="h-3" />
              </div>
              <div className="pt-6 border-t border-gray-200">
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                  <p className="text-sm font-medium text-purple-900">
                    🎯 Vous êtes en avance sur <span className="font-bold text-lg">78%</span> des entreprises similaires
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Alerts with AI branding */}
        <Card className="p-8 rounded-2xl bg-white border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative p-2 rounded-lg bg-blue-500">
                <Zap className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl tracking-tight font-semibold">Dernières alertes réglementaires</h3>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <Sparkles className="size-3" />
                  Analysées par Vertex AI
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1"
              onClick={() => onNavigateToAlerts?.()}
            >
              <span className="font-medium">Voir toutes</span>
              <ArrowUpRight className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentAlerts.length === 0 ? (
              <div className="col-span-3 text-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle2 className="size-12 text-green-500" />
                  <div>
                    <p className="font-semibold text-gray-900">Aucune alerte récente</p>
                    <p className="text-sm text-gray-600">Tout est à jour côté réglementaire !</p>
                  </div>
                </div>
              </div>
            ) : (
              recentAlerts.map((alert, index) => (
                <div
                  key={alert.id || index}
                  className="p-5 rounded-xl border border-gray-200 bg-white hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group"
                  onClick={() => onNavigateToAlerts?.()}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                    alert.category === 'RH' ? 'bg-green-500' :
                    alert.category === 'Fiscal' ? 'bg-blue-500' :
                    alert.category === 'Aides' ? 'bg-purple-500' :
                    'bg-orange-500'
                  }`} />
                  {alert.urgent && (
                    <Badge className="mb-3 bg-red-500 text-white border-0 font-semibold">
                      {alertService.getPriorityIcon(alert.severity)} Urgent
                    </Badge>
                  )}
                  <p className="text-sm font-medium mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {alert.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs font-semibold">{alert.category}</Badge>
                    {alert.days_remaining !== undefined && (
                      <Badge 
                        variant={alert.days_remaining <= 7 ? 'destructive' : 'secondary'} 
                        className="text-xs"
                      >
                        {alert.days_remaining} jours
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}