import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Search, FileText, Archive, AlertCircle, Plus, RefreshCw } from 'lucide-react';
import { 
  useProcedures, 
  ProceduresService, 
  statusConfig, 
  typeColors,
  type ProcedureType,
  type ProcedureStatus
} from '../services/proceduresService';

export function Procedures({ 
  onNewDeclaration, 
  onContinueDeclaration 
}: { 
  onNewDeclaration: () => void;
  onContinueDeclaration: (declarationId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProcedureStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<ProcedureType | 'all'>('all');

  // Utiliser le hook pour récupérer les vraies données (sans filtrer par user_id)
  const { procedures: allProcedures, loading, error, refresh } = useProcedures();

  // Filtrage des données
  let filteredProcedures = allProcedures;
  
  // Filtrer par recherche
  filteredProcedures = ProceduresService.search(filteredProcedures, searchQuery);
  
  // Filtrer par statut
  filteredProcedures = ProceduresService.filterByStatus(filteredProcedures, filterStatus);
  
  // Filtrer par type
  filteredProcedures = ProceduresService.filterByType(filteredProcedures, filterType);

  // Compter les démarches urgentes
  const urgentCount = ProceduresService.countUrgent(filteredProcedures);

  return (
    <div className="min-h-full bg-gray-50 p-12 animate-in fade-in duration-500 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 shadow-lg">
                <span className="text-3xl">📁</span>
              </div>
              <h1 className="text-3xl tracking-tight font-bold">Mes démarches administratives</h1>
              {loading && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={refresh}
                variant="outline"
                className="gap-2 shadow-lg transition-all hover:scale-105 rounded-xl px-4 h-12"
                disabled={loading}
              >
                <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button
                onClick={onNewDeclaration}
                className="gap-2 bg-green-600 hover:bg-green-700 shadow-lg transition-all hover:scale-105 rounded-xl px-6 h-12"
              >
                <Plus className="size-5" />
                <span className="font-semibold">➕ Nouvelle déclaration</span>
              </Button>
            </div>
          </div>
          <div className="h-1.5 w-40 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-4 shadow-lg" />

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 flex items-center gap-3">
              <AlertCircle className="size-5 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-900">
                  Erreur lors du chargement des démarches
                </p>
                <p className="text-xs text-red-700">{error}</p>
              </div>
              <Button onClick={refresh} size="sm" variant="outline" className="ml-auto">
                Réessayer
              </Button>
            </div>
          )}

          {urgentCount > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 flex items-center gap-3">
              <AlertCircle className="size-5 text-red-600" />
              <p className="text-sm font-semibold text-red-900">
                Attention : <span className="text-lg">{urgentCount}</span> démarche{urgentCount > 1 ? 's' : ''} à échéance proche
              </p>
            </div>
          )}
          
          {/* Search Bar */}
          <div className="relative mt-6 mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher un dossier (TVA, URSSAF, Paie...)"
              className="pl-12 rounded-xl shadow-soft border-0 bg-white font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
                className="rounded-xl font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                Tous
              </Button>
              <Button
                variant={filterStatus === 'todo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('todo')}
                className="rounded-xl font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                À faire
              </Button>
              <Button
                variant={filterStatus === 'inprogress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('inprogress')}
                className="rounded-xl font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                En cours
              </Button>
              <Button
                variant={filterStatus === 'done' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('done')}
                className="rounded-xl font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                Terminé
              </Button>
            </div>
            
            <div className="w-px bg-gray-300" />
            
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
                className="rounded-xl font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                Tous types
              </Button>
              <Button
                variant={filterType === 'Fiscal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('Fiscal')}
                className="rounded-xl font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                Fiscal
              </Button>
              <Button
                variant={filterType === 'Social' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('Social')}
                className="rounded-xl font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                RH
              </Button>
              <Button
                variant={filterType === 'Juridique' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('Juridique')}
                className="rounded-xl font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                Juridique
              </Button>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="space-y-4">
          {filteredProcedures.map((proc, index) => {
            const daysUntil = ProceduresService.getDaysUntilDeadline(proc.deadline);
            const isUrgent = ProceduresService.isUrgent(proc);
            const deadline = new Date(proc.deadline);
            
            return (
              <Card
                key={proc.id}
                className={`p-6 bg-white rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-2 ${
                  proc.status === 'done' ? 'cursor-default opacity-75' : 'cursor-pointer'
                }`}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
                onClick={() => {
                  if (proc.status !== 'done') {
                    onContinueDeclaration(proc.id);
                  }
                }}
              >
                {/* Left colored bar */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl shadow-lg group-hover:w-3 transition-all"
                  style={{ backgroundColor: typeColors[proc.type].border }}
                />
                
                {/* Urgent indicator */}
                {isUrgent && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-red-500 text-white border-0 shadow-md animate-pulse font-semibold">
                      ⚠️ Urgent
                    </Badge>
                  </div>
                )}
                
                <div className="flex items-center justify-between gap-6 ml-2">
                  {/* Name & Type */}
                  <div className="flex-1 min-w-0">
                    <h3 className="mb-2 group-hover:text-blue-600 transition-colors font-semibold tracking-tight">{proc.name}</h3>
                    <Badge className={`${typeColors[proc.type].bg} text-white border-0 shadow-sm font-semibold`}>
                      {proc.type}
                    </Badge>
                  </div>

                  {/* Deadline */}
                  <div className="text-center min-w-[140px] p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Date limite</p>
                    <p className="font-bold text-lg">
                      {deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                    {daysUntil > 0 && proc.status !== 'done' && (
                      <p className={`text-xs mt-1 font-semibold ${isUrgent ? 'text-red-600' : 'text-muted-foreground'}`}>
                        Dans {daysUntil} jour{daysUntil > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  {/* Status with Progress */}
                  <div className="min-w-[200px]">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant={statusConfig[proc.status].variant} className="shadow-sm font-semibold">
                        {statusConfig[proc.status].label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={proc.progress} className="h-3 flex-1" />
                      <span className="text-sm font-bold text-muted-foreground">{proc.progress}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Étape {proc.current_step} / {proc.total_steps}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="min-w-[130px] text-right">
                    {proc.status === 'done' ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 hover:shadow-md hover:scale-105 transition-all rounded-xl font-semibold cursor-default opacity-50"
                        disabled
                      >
                        <Archive className="size-4" />
                        Terminé
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 hover:shadow-md hover:scale-105 transition-all rounded-xl font-semibold hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => onContinueDeclaration(proc.id)}
                      >
                        <FileText className="size-4" />
                        Continuer
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredProcedures.length === 0 && (
          <Card className="p-12 text-center bg-white rounded-2xl border-0 shadow-soft">
            <p className="text-muted-foreground font-medium">
              Aucune démarche ne correspond à vos critères de recherche.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}