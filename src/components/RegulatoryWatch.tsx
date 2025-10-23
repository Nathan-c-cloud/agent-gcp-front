import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { ExternalLink, Zap, Scale, Users, Coins, Gift, Sparkles } from 'lucide-react';
import { alerts } from '../lib/mockData';

interface RegulatoryWatchProps {
  onSelectAlert: (alertId: string) => void;
}

export function RegulatoryWatch({ onSelectAlert }: RegulatoryWatchProps) {
  const [filterTheme, setFilterTheme] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('30');

  const filteredAlerts = alerts.filter(alert => {
    const matchesTheme = filterTheme === 'all' || alert.category === filterTheme;
    
    const alertDate = new Date(alert.detectedDate);
    const daysDiff = Math.floor((Date.now() - alertDate.getTime()) / (1000 * 60 * 60 * 24));
    const matchesPeriod = daysDiff <= parseInt(filterPeriod);
    
    return matchesTheme && matchesPeriod;
  });

  const categoryConfig: Record<string, { label: string; color: string; icon: any; borderColor: string; bgGradient: string }> = {
    fiscal: { 
      label: '📜 FISCAL', 
      color: 'bg-blue-500', 
      icon: Coins, 
      borderColor: '#3B82F6',
      bgGradient: 'from-blue-50 to-cyan-50'
    },
    rh: { 
      label: '👩‍💼 RH', 
      color: 'bg-green-500', 
      icon: Users, 
      borderColor: '#10B981',
      bgGradient: 'from-green-50 to-emerald-50'
    },
    juridique: { 
      label: '⚖️ JURIDIQUE', 
      color: 'bg-orange-500', 
      icon: Scale, 
      borderColor: '#F97316',
      bgGradient: 'from-orange-50 to-amber-50'
    },
    aides: { 
      label: '🎁 AIDES', 
      color: 'bg-purple-500', 
      icon: Gift, 
      borderColor: '#A855F7',
      bgGradient: 'from-purple-50 to-pink-50'
    }
  };

  return (
    <div className="min-h-full p-12 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute top-20 right-40 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-wave" />
      <div className="absolute bottom-40 left-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-wave" style={{ animationDelay: '1.5s' }} />
      
      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative p-3 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 shadow-lg">
              <Zap className="size-7 text-blue-600" />
              <div className="absolute inset-0 bg-blue-400 rounded-xl blur-lg opacity-40 animate-pulse" />
            </div>
            <h1 className="tracking-tight">Veille réglementaire complète</h1>
          </div>
          <div className="h-1.5 w-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-4 shadow-lg" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-blue-500" />
            <p className="font-medium">
              Mise à jour quotidienne • Dernière actualisation : {new Date().toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap mt-6">
            <div className="flex gap-2">
              <Button
                variant={filterTheme === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterTheme('all')}
                className="rounded-xl font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                Tous
              </Button>
              <Button
                variant={filterTheme === 'fiscal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterTheme('fiscal')}
                className="rounded-xl font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                📜 Fiscal
              </Button>
              <Button
                variant={filterTheme === 'rh' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterTheme('rh')}
                className="rounded-xl font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                👩‍💼 RH
              </Button>
              <Button
                variant={filterTheme === 'juridique' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterTheme('juridique')}
                className="rounded-xl font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                ⚖️ Juridique
              </Button>
              <Button
                variant={filterTheme === 'aides' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterTheme('aides')}
                className="rounded-xl font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                🎁 Aides
              </Button>
            </div>
            
            <div className="w-px bg-gray-300" />
            
            <div className="flex gap-2">
              <Button
                variant={filterPeriod === '7' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterPeriod('7')}
                className="rounded-xl font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                7 jours
              </Button>
              <Button
                variant={filterPeriod === '30' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterPeriod('30')}
                className="rounded-xl font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                30 jours
              </Button>
            </div>
          </div>
        </div>

        {/* Grid of Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlerts.map((alert, index) => {
            const config = categoryConfig[alert.category];
            const CategoryIcon = config.icon;
            
            return (
              <Card
                key={alert.id}
                className="p-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer bg-white rounded-2xl border-0 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
                onClick={() => onSelectAlert(alert.id)}
              >
                {/* Top gradient bar */}
                <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${config.bgGradient.replace('from-', 'from-').replace('to-', 'to-')} shadow-md`} style={{ background: `linear-gradient(to right, ${config.borderColor}, ${config.borderColor}dd)` }} />
                
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} opacity-30 group-hover:opacity-50 transition-opacity`} />
                
                {/* Content */}
                <div className="relative">
                  {/* Icon & Title */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform`} style={{ backgroundColor: `${config.borderColor}15` }}>
                      <CategoryIcon className="size-6" style={{ color: config.borderColor }} />
                    </div>
                    <h3 className="flex-1 line-clamp-2 group-hover:text-blue-600 transition-colors font-semibold">{alert.title}</h3>
                  </div>

                  {/* Summary */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                    {alert.aiAnalysis}
                  </p>

                  {/* Category Badge */}
                  <Badge className={`${config.color} text-white border-0 mb-4 shadow-sm font-semibold`}>
                    {config.label}
                  </Badge>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-2 px-0 hover:shadow-md transition-all font-medium hover:text-blue-600"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a href={alert.sourceUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-4" />
                        Source ↗
                      </a>
                    </Button>
                    
                    <div className="relative">
                      <Zap className="size-5 text-[#2563EB] animate-pulse" />
                      <div className="absolute inset-0 bg-[#2563EB] rounded-full blur-md opacity-50 animate-pulse" />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredAlerts.length === 0 && (
          <Card className="p-12 text-center bg-white rounded-2xl border-0 shadow-soft">
            <p className="text-muted-foreground font-medium">
              Aucune alerte ne correspond à vos critères de recherche.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}