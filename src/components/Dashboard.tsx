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

export function Dashboard({ onNewDeclaration }: { onNewDeclaration: () => void }) {
  const stats = [
    {
      label: 'Alertes actives',
      value: '12',
      change: '+3 cette semaine',
      trend: 'up',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      iconBg: 'bg-red-500'
    },
    {
      label: 'Démarches en cours',
      value: '5',
      change: '2 à échéance proche',
      trend: 'neutral',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-500'
    },
    {
      label: 'Tâches complétées',
      value: '24',
      change: '+8 ce mois',
      trend: 'up',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-500'
    },
    {
      label: 'Documents traités',
      value: '156',
      change: '+12% vs mois dernier',
      trend: 'up',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-500'
    }
  ];

  const urgentTasks = [
    { title: 'Déclaration TVA', deadline: '15 Oct', status: 'urgent', progress: 30 },
    { title: 'URSSAF Q4', deadline: '30 Oct', status: 'warning', progress: 60 },
    { title: 'Bilan comptable', deadline: '20 Oct', status: 'normal', progress: 85 }
  ];

  const recentAlerts = [
    { title: 'Nouvelle règle URSSAF — cotisations trimestrielles', category: 'RH', urgent: true },
    { title: 'Loi de finances 2026 — Mesures fiscales', category: 'Fiscal', urgent: false },
    { title: 'Aide à la transition écologique', category: 'Aides', urgent: false }
  ];

  return (
    <div className="min-h-full bg-gray-50 p-12 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl tracking-tight mb-2">Bonjour Jean 👋</h1>
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
              <Button variant="ghost" size="sm" className="gap-1">
                <span className="font-medium">Tout voir</span>
                <ArrowUpRight className="size-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {urgentTasks.map((task, index) => (
                <div
                  key={index}
                  className="group flex items-center justify-between p-5 rounded-xl bg-gray-50 border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
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
              ))}
            </div>
            <div className="mt-6 p-4 rounded-xl bg-green-50 border border-green-200">
              <p className="text-sm font-medium text-green-900">
                🎉 Bonne nouvelle ! <span className="font-bold">2 démarches sur 5</span> sont déjà faites
              </p>
            </div>
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
            <Button variant="ghost" size="sm" className="gap-1">
              <span className="font-medium">Voir toutes</span>
              <ArrowUpRight className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentAlerts.map((alert, index) => (
              <div
                key={index}
                className="p-5 rounded-xl border border-gray-200 bg-white hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group"
              >
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                  alert.category === 'RH' ? 'bg-green-500' :
                  alert.category === 'Fiscal' ? 'bg-blue-500' :
                  'bg-purple-500'
                }`} />
                {alert.urgent && (
                  <Badge className="mb-3 bg-red-500 text-white border-0 font-semibold">Urgent</Badge>
                )}
                <p className="text-sm font-medium mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">{alert.title}</p>
                <Badge variant="secondary" className="text-xs font-semibold">{alert.category}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}