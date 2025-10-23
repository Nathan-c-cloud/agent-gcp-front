import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { ExternalLink, Bell, Share2, CheckCircle, Lightbulb, Scale, Coins, Users, Gift, Sparkles } from 'lucide-react';
import { alerts } from '../lib/mockData';

interface AlertDetailProps {
  alertId: string;
}

export function AlertDetail({ alertId }: AlertDetailProps) {
  const alert = alerts.find(a => a.id === alertId) || alerts[0];

  const typeConfig = {
    urgent: { color: '#EF4444', label: '🟥 Urgent', badgeVariant: 'destructive' as const },
    info: { color: '#F59E0B', label: '🟡 Info', badgeVariant: 'secondary' as const },
    normal: { color: '#10B981', label: '🟢 Normal', badgeVariant: 'default' as const }
  };

  const categoryIcons = {
    fiscal: Coins,
    rh: Users,
    juridique: Scale,
    aides: Gift
  };

  const categoryEmojis = {
    fiscal: '💶',
    rh: '👥',
    juridique: '⚖️',
    aides: '🎁'
  };

  const config = typeConfig[alert.type];
  const CategoryIcon = categoryIcons[alert.category];

  return (
    <div className="min-h-full bg-gradient-to-b from-[#F8FAFF] to-white p-12 animate-in slide-in-from-right duration-500 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl" />
      
      <div className="w-full max-w-[800px] mx-auto space-y-6 relative">
        {/* Header Card */}
        <Card 
          className="p-8 rounded-2xl border-0 hover:shadow-xl transition-all duration-300 relative overflow-hidden" 
          style={{ 
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl" style={{ backgroundColor: config.color }} />
          <div className="flex items-start gap-4 ml-2">
            <div className="p-3 rounded-xl shadow-lg" style={{ backgroundColor: `${config.color}15` }}>
              <CategoryIcon className="size-7" style={{ color: config.color }} />
            </div>
            <div className="flex-1">
              <Badge variant={config.badgeVariant} className="mb-3 font-semibold shadow-sm">
                {config.label}
              </Badge>
              <h1 className="tracking-tight flex items-center gap-2">
                <span>{categoryEmojis[alert.category]}</span>
                {alert.title}
              </h1>
            </div>
          </div>
        </Card>

        {/* Bloc 1 - Résumé */}
        <Card className="p-7 bg-gradient-to-br from-white to-gray-50 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <span className="text-xl">📋</span>
            </div>
            <h3 className="tracking-tight">Résumé de la règle</h3>
          </div>
          <p className="mb-5 leading-relaxed">{alert.summary}</p>
          <Button variant="outline" className="gap-2 hover:shadow-md hover:scale-105 transition-all rounded-xl font-semibold border-blue-200 hover:bg-blue-50 hover:text-blue-700" asChild>
            <a href={alert.sourceUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Lire la source officielle
            </a>
          </Button>
        </Card>

        {/* Bloc 2 - Analyse IA */}
        <Card className="p-7 bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border-0 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(37,99,235,0.15)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl animate-pulse" />
          <div className="flex items-center gap-2 mb-4 relative">
            <div className="relative p-2 rounded-lg bg-blue-100">
              <Sparkles className="size-5 text-[#2563EB]" />
              <div className="absolute inset-0 bg-[#2563EB] rounded-lg blur-md opacity-30 animate-pulse" />
            </div>
            <h3 className="tracking-tight text-blue-900">Synthèse générée par Vertex AI</h3>
          </div>
          <div className="flex gap-3 relative">
            <div className="relative shrink-0">
              <Lightbulb className="size-6 text-[#2563EB]" />
              <div className="absolute inset-0 bg-[#2563EB] rounded-full blur-md opacity-30 animate-pulse" />
            </div>
            <p className="text-blue-900 leading-relaxed font-medium">{alert.aiAnalysis}</p>
          </div>
        </Card>

        {/* Bloc 3 - Actions */}
        <Card className="p-7 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 border-0" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-purple-100">
              <span className="text-xl">⚡</span>
            </div>
            <h3 className="tracking-tight">Actions possibles</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2 hover:scale-105 transition-all bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:shadow-lg hover:shadow-blue-500/25 rounded-xl font-semibold px-6 animate-pulse hover:animate-none">
              <Bell className="size-5" />
              Créer un rappel
            </Button>
            <Button variant="outline" className="gap-2 hover:shadow-md hover:scale-105 transition-all rounded-xl font-semibold border-gray-200 hover:bg-gray-50">
              <Share2 className="size-5" />
              Partager au comptable
            </Button>
            <Button variant="outline" className="gap-2 hover:shadow-md hover:scale-105 transition-all rounded-xl font-semibold border-green-200 hover:bg-green-50 hover:text-green-700">
              <CheckCircle className="size-5" />
              Marquer comme traité
            </Button>
          </div>
        </Card>

        {/* Bloc 4 - Historique */}
        <Card className="p-7 bg-gradient-to-br from-white to-purple-50/30 rounded-2xl hover:shadow-xl transition-all duration-300 border-0" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-orange-100">
              <span className="text-xl">📅</span>
            </div>
            <h3 className="tracking-tight">Historique & suivi</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-white/50 border border-blue-100">
              <div className="size-4 rounded-full bg-blue-500 animate-pulse shadow-lg" />
              <span className="text-sm font-medium">Détectée le {new Date(alert.detectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            {alert.processedDate && (
              <div className="flex items-center gap-4 p-3 rounded-lg bg-white/50 border border-green-100">
                <div className="size-4 rounded-full bg-green-500 shadow-lg" />
                <span className="text-sm font-medium">Traitée le {new Date(alert.processedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            )}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-white/50 border border-yellow-100">
              <div className="size-4 rounded-full bg-yellow-500 shadow-lg" />
              <span className="text-sm font-medium">En attente de vérification comptable</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}