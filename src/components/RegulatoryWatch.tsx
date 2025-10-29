import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { ExternalLink, Zap, Scale, Users, Coins, Gift, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useAlertesVeille, type AlerteVeille } from '../services/veilleService';

interface RegulatoryWatchProps {
  onSelectAlert?: (alertId: string) => void;
}

export function RegulatoryWatch({ }: RegulatoryWatchProps) {
  const [filterTheme, setFilterTheme] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('30');
  const [selectedAlerte, setSelectedAlerte] = useState<AlerteVeille | null>(null);

  // TODO: Récupérer le vrai companyId depuis le contexte utilisateur
  const companyId = 'demo_company';
  const { alertes, loading, error, refetch } = useAlertesVeille(companyId);

  const filteredAlerts = alertes.filter(alert => {
    const matchesTheme = filterTheme === 'all' || alert.metadata?.categorie === filterTheme;

    const alertDate = new Date(alert.dateCreation);
    const daysDiff = Math.floor((Date.now() - alertDate.getTime()) / (1000 * 60 * 60 * 24));
    const matchesPeriod = daysDiff <= parseInt(filterPeriod);

    return matchesTheme && matchesPeriod;
  });

  const handleAlerteClick = (alerte: AlerteVeille) => {
    setSelectedAlerte(alerte);
  };

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

  // Si une alerte est sélectionnée, afficher les détails
  if (selectedAlerte) {
    return (
      <div className="min-h-full p-12 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute top-20 right-40 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-wave" />
        <div className="absolute bottom-40 left-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-wave" style={{ animationDelay: '1.5s' }} />

        <div className="max-w-4xl mx-auto relative">
          {/* Bouton retour */}
          <Button 
            onClick={() => setSelectedAlerte(null)}
            variant="outline"
            className="mb-6 shadow-sm hover:shadow-md transition-all"
          >
            ← Retour à la liste
          </Button>

          {/* Détails de l'alerte */}
          <Card className="p-8 bg-white rounded-2xl shadow-xl border-0">
            {/* Header */}
            <div className="mb-6 pb-6 border-b">
              <div className="flex items-start gap-4 mb-4">
                {(() => {
                  const categorie = selectedAlerte.metadata?.categorie || 'fiscal';
                  const config = categoryConfig[categorie] || categoryConfig.fiscal;
                  const CategoryIcon = config.icon;
                  return (
                    <div className="p-3 rounded-xl shadow-lg" style={{ backgroundColor: `${config.borderColor}15` }}>
                      <CategoryIcon className="size-8" style={{ color: config.borderColor }} />
                    </div>
                  );
                })()}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{selectedAlerte.titre}</h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className={(() => {
                      const categorie = selectedAlerte.metadata?.categorie || 'fiscal';
                      const config = categoryConfig[categorie] || categoryConfig.fiscal;
                      return `${config.color} text-white border-0 shadow-sm`;
                    })()}>
                      {(() => {
                        const categorie = selectedAlerte.metadata?.categorie || 'fiscal';
                        const config = categoryConfig[categorie] || categoryConfig.fiscal;
                        return config.label;
                      })()}
                    </Badge>
                    <Badge variant={selectedAlerte.priorite === 'haute' ? 'destructive' : 'secondary'} className="shadow-sm">
                      {selectedAlerte.priorite === 'haute' ? '🔥 Haute' : selectedAlerte.priorite === 'moyenne' ? '⚡ Moyenne' : '📌 Basse'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(selectedAlerte.dateCreation).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="space-y-6">
              {/* Message complet */}
              <div>
                <h3 className="font-semibold text-lg mb-3">📄 Description détaillée</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedAlerte.message}
                </p>
              </div>

              {/* Analyse IA */}
              {selectedAlerte.aiAnalysis && selectedAlerte.aiAnalysis !== selectedAlerte.message && (
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm text-purple-900 mb-2 flex items-center gap-2">
                    <Sparkles className="size-4" />
                    Analyse IA
                  </h3>
                  <p className="text-sm text-purple-800 leading-relaxed whitespace-pre-wrap">
                    {selectedAlerte.aiAnalysis}
                  </p>
                </div>
              )}

              {/* Actions recommandées */}
              {selectedAlerte.actions && selectedAlerte.actions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm text-blue-900 mb-3 flex items-center gap-2">
                    ✓ Actions recommandées
                  </h3>
                  <ul className="space-y-2">
                    {selectedAlerte.actions.map((action: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-blue-800">
                        <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold text-blue-900">
                          {idx + 1}
                        </span>
                        <span className="flex-1">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Raisons de pertinence */}
              {selectedAlerte.pertinence?.raisons && selectedAlerte.pertinence.raisons.length > 0 && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm text-green-900 mb-3 flex items-center gap-2">
                    🎯 Pourquoi cette alerte vous concerne
                  </h3>
                  <ul className="space-y-2">
                    {selectedAlerte.pertinence.raisons.map((raison: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                        <span className="mt-1">•</span>
                        <span>{raison}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {selectedAlerte.tags && selectedAlerte.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-slate-700 mb-2">🏷️ Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAlerte.tags.map((tag: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Métadonnées / Scores */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-sm text-slate-700 mb-2">📊 Informations complémentaires</h3>

                {selectedAlerte.score && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Score de pertinence</span>
                    <Badge variant="outline" className="font-mono">
                      {(selectedAlerte.score * 100).toFixed(1)}%
                    </Badge>
                  </div>
                )}

                {selectedAlerte.score_base && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Score de base</span>
                    <Badge variant="outline" className="font-mono">
                      {(selectedAlerte.score_base * 100).toFixed(1)}%
                    </Badge>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Date de détection</span>
                  <span className="text-slate-700 font-medium">
                    {new Date(selectedAlerte.dateCreation).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Statut</span>
                  <Badge variant={selectedAlerte.statut === 'non_lu' ? 'default' : 'secondary'}>
                    {selectedAlerte.statut === 'non_lu' ? '🔔 Nouveau' : '✓ Lu'}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button asChild className="flex-1">
                  <a href={selectedAlerte.source} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <ExternalLink className="size-4" />
                    Consulter la source officielle
                  </a>
                </Button>
                <Button variant="outline" onClick={() => setSelectedAlerte(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-12 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute top-20 right-40 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-wave" />
      <div className="absolute bottom-40 left-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-wave" style={{ animationDelay: '1.5s' }} />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative p-3 rounded-xl bg-white shadow-lg">
              <img 
                src="/img.png" 
                alt="Veille Icon" 
                className="size-7 object-contain relative z-10"
                style={{ filter: 'drop-shadow(0 0 3px rgba(37, 99, 235, 0.4))' }}
              />
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

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="size-12 animate-spin text-blue-500 mb-4" />
            <p className="text-muted-foreground font-medium">Chargement de la veille réglementaire...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-8 bg-red-50 border-red-200 rounded-2xl">
            <div className="flex items-start gap-4">
              <AlertCircle className="size-6 text-red-500 mt-1" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">Erreur de chargement</h3>
                <p className="text-red-700 text-sm mb-4">{error}</p>
                <Button onClick={refetch} variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                  Réessayer
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Grid of Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAlerts.map((alert, index) => {
              const categorie = alert.metadata?.categorie || 'fiscal';
              const config = categoryConfig[categorie] || categoryConfig.fiscal;
              const CategoryIcon = config.icon;

              return (
                <Card
                  key={alert.id}
                  className="p-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer bg-white rounded-2xl border-0 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                  onClick={() => handleAlerteClick(alert)}
                >
                  {/* Top gradient bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-2 shadow-md"
                    style={{ background: `linear-gradient(to right, ${config.borderColor}, ${config.borderColor}dd)` }}
                  />

                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} opacity-30 group-hover:opacity-50 transition-opacity`} />

                  {/* Content */}
                  <div className="relative">
                    {/* Icon & Title */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: `${config.borderColor}15` }}>
                        <CategoryIcon className="size-6" style={{ color: config.borderColor }} />
                      </div>
                      <h3 className="flex-1 line-clamp-2 group-hover:text-blue-600 transition-colors font-semibold">{alert.titre}</h3>
                    </div>

                    {/* Summary */}
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                      {alert.message}
                    </p>

                    {/* Category Badge & Priority */}
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className={`${config.color} text-white border-0 shadow-sm font-semibold`}>
                        {config.label}
                      </Badge>
                      <Badge variant={alert.priorite === 'haute' ? 'destructive' : 'secondary'} className="border-0 shadow-sm">
                        {alert.priorite === 'haute' ? '🔥 Haute' : alert.priorite === 'moyenne' ? '⚡ Moyenne' : '📌 Basse'}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 px-0 hover:shadow-md transition-all font-medium hover:text-blue-600"
                        asChild
                      >
                        <a 
                          href={alert.source} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          <ExternalLink className="size-4" />
                          Source ↗
                        </a>
                      </Button>

                      {alert.statut === 'non_lu' && (
                        <div className="relative">
                          <Zap className="size-5 text-[#2563EB] animate-pulse" />
                          <div className="absolute inset-0 bg-[#2563EB] rounded-full blur-md opacity-50 animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {filteredAlerts.length === 0 && !loading && !error && (
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

