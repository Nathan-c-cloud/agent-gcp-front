import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Checkbox } from './ui/checkbox';
import { 
  ArrowLeft, 
  ArrowRight, 
  FileText, 
  Users, 
  Banknote, 
  Gift,
  Clock,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Upload,
  Download,
  Send,
  Check,
  Calendar,
  Building2,
  TrendingUp,
  Shield
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type DeclarationType = 'tva' | 'urssaf' | 'charges' | 'aides' | null;
type Step = 'selection' | 'scope' | 'data' | 'verification' | 'documents' | 'validation' | 'confirmation';

const declarationTypes = [
  {
    id: 'tva' as DeclarationType,
    title: 'Déclaration TVA',
    icon: Banknote,
    description: 'TVA collectée et déductible',
    estimatedTime: '2 min',
    prefillRate: '85%',
    color: 'blue'
  },
  {
    id: 'urssaf' as DeclarationType,
    title: 'URSSAF',
    icon: Users,
    description: 'Cotisations sociales',
    estimatedTime: '3 min',
    prefillRate: '80%',
    color: 'green'
  },
  {
    id: 'charges' as DeclarationType,
    title: 'Charges sociales',
    icon: FileText,
    description: 'Déclaration mensuelle',
    estimatedTime: '2 min',
    prefillRate: '90%',
    color: 'purple'
  },
  {
    id: 'aides' as DeclarationType,
    title: 'Demande d\'aides',
    icon: Gift,
    description: 'Aides publiques',
    estimatedTime: '4 min',
    prefillRate: '70%',
    color: 'orange'
  }
];

export function NewDeclaration({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState<Step>('selection');
  const [selectedType, setSelectedType] = useState<DeclarationType>(null);
  const [confirmed, setConfirmed] = useState(false);

  const stepProgress = {
    selection: 0,
    scope: 20,
    data: 40,
    verification: 60,
    documents: 80,
    validation: 90,
    confirmation: 100
  };

  const stepNames = {
    scope: 'Périmètre',
    data: 'Données',
    verification: 'Vérifications',
    documents: 'Pièces',
    validation: 'Validation'
  };

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' }
  };

  const selectedDeclaration = declarationTypes.find(d => d.id === selectedType);

  const renderSelection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Choisir une déclaration</h2>
        <p className="text-gray-600">Sélectionnez le type de déclaration que vous souhaitez préparer</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {declarationTypes.map((type) => {
          const Icon = type.icon;
          const colors = colorMap[type.color];
          
          return (
            <Card
              key={type.id}
              onClick={() => {
                setSelectedType(type.id);
                setCurrentStep('scope');
              }}
              className="p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border-2 border-gray-200 hover:border-blue-500"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${colors.bg}`}>
                  <Icon className={`size-8 ${colors.text}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold mb-1">{type.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <Badge className="bg-blue-100 text-blue-700 border-0">
                      <Clock className="size-3 mr-1" />
                      {type.estimatedTime}
                    </Badge>
                    <Badge className="bg-green-100 text-green-700 border-0">
                      <Sparkles className="size-3 mr-1" />
                      Prérempli à {type.prefillRate}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderScope = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-2 block">Période de déclaration</Label>
          <Select defaultValue="oct2025">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oct2025">Octobre 2025</SelectItem>
              <SelectItem value="sep2025">Septembre 2025</SelectItem>
              <SelectItem value="aug2025">Août 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 block">Établissement</Label>
          <Select defaultValue="main">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main">Siège social - Paris</SelectItem>
              <SelectItem value="branch">Agence - Lyon</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Régime fiscal</Label>
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="size-5 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900">Régime réel normal</p>
              <p className="text-sm text-blue-700">Pré-sélectionné selon votre profil</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderData = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
        <Shield className="size-5 text-green-600" />
        <p className="text-sm font-semibold text-green-900">Données vérifiées • Source : Odoo</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block">TVA collectée</Label>
            <Input value="12 450,00 €" readOnly className="bg-gray-50 font-semibold" />
            <p className="text-xs text-gray-600 mt-1">Auto-calculé depuis vos factures</p>
          </div>
          <div>
            <Label className="mb-2 block">TVA déductible</Label>
            <Input value="8 320,00 €" readOnly className="bg-gray-50 font-semibold" />
            <p className="text-xs text-gray-600 mt-1">Auto-calculé depuis vos achats</p>
          </div>
        </div>

        <Card className="p-4 border-2 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 mb-1">TVA à payer</p>
              <p className="text-2xl font-bold text-blue-600">4 130,00 €</p>
            </div>
            <Badge className="bg-blue-500 text-white">
              <Sparkles className="size-3 mr-1" />
              Analysé par Vertex AI
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderVerification = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <Sparkles className="size-5 text-blue-600" />
        <p className="text-sm font-semibold text-blue-900">Analyse IA terminée • 2 suggestions détectées</p>
      </div>

      <div className="space-y-3">
        <Card className="p-4 border-l-4 border-yellow-500">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-yellow-600 mt-1" />
            <div className="flex-1">
              <p className="font-semibold mb-1">Variation inhabituelle détectée</p>
              <p className="text-sm text-gray-700 mb-2">
                La TVA collectée est 15% supérieure au mois précédent
              </p>
              <Badge className="bg-yellow-100 text-yellow-800 border-0">
                <TrendingUp className="size-3 mr-1" />
                +15% vs septembre 2025
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-green-500">
          <div className="flex items-start gap-3">
            <CheckCircle className="size-5 text-green-600 mt-1" />
            <div className="flex-1">
              <p className="font-semibold mb-1">Cohérence vérifiée</p>
              <p className="text-sm text-gray-700">
                Les montants correspondent aux écritures comptables
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold mb-4">Pièces justificatives attachées</h3>
        <div className="space-y-2">
          <Card className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="size-5 text-blue-600" />
              <div>
                <p className="font-semibold text-sm">Journal des ventes - Octobre 2025</p>
                <p className="text-xs text-gray-600">245 KB • PDF</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-700 border-0">Attaché</Badge>
          </Card>

          <Card className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="size-5 text-blue-600" />
              <div>
                <p className="font-semibold text-sm">Journal des achats - Octobre 2025</p>
                <p className="text-xs text-gray-600">198 KB • PDF</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-700 border-0">Attaché</Badge>
          </Card>
        </div>
      </div>

      <Button variant="outline" className="w-full gap-2">
        <Upload className="size-4" />
        Ajouter un justificatif
      </Button>

      <Button variant="outline" className="w-full gap-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
        <Download className="size-4" />
        📄 Générer le récapitulatif PDF
      </Button>
    </div>
  );

  const renderValidation = () => (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
        <h3 className="font-bold mb-4">Résumé de votre déclaration</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-700">Période</span>
            <span className="font-semibold">Octobre 2025</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-700">TVA collectée</span>
            <span className="font-semibold">12 450,00 €</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-700">TVA déductible</span>
            <span className="font-semibold">8 320,00 €</span>
          </div>
          <div className="flex items-center justify-between py-3 bg-blue-100 -mx-6 px-6 rounded-lg mt-3">
            <span className="font-bold text-blue-900">TVA à payer</span>
            <span className="text-2xl font-bold text-blue-600">4 130,00 €</span>
          </div>
        </div>
      </Card>

      <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
        <Checkbox 
          id="confirm" 
          checked={confirmed}
          onCheckedChange={(checked) => setConfirmed(checked as boolean)}
        />
        <Label htmlFor="confirm" className="cursor-pointer flex-1">
          Je confirme l'exactitude des informations déclarées et autorise l'envoi de cette déclaration
        </Label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button 
          className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
          disabled={!confirmed}
          onClick={() => setCurrentStep('confirmation')}
        >
          <Send className="size-4" />
          📤 Envoyer via portail
        </Button>
        <Button variant="outline" className="w-full gap-2" disabled={!confirmed}>
          <Download className="size-4" />
          📄 Télécharger PDF
        </Button>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="size-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="size-12 text-green-600" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-2">✅ Déclaration préparée</h2>
        <p className="text-gray-600">Votre déclaration TVA a été enregistrée et est prête à être envoyée</p>
      </div>

      <Card className="p-6 bg-gray-50 text-left">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">N° de dossier</span>
            <span className="font-mono font-semibold">TVA-2025-10-001</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Date de création</span>
            <span className="font-semibold">{new Date().toLocaleDateString('fr-FR')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Pièces jointes</span>
            <span className="font-semibold">2 documents</span>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 gap-2">
          <Users className="size-4" />
          Partager au comptable
        </Button>
        <Button variant="outline" className="flex-1 gap-2">
          <Calendar className="size-4" />
          Créer un rappel
        </Button>
      </div>

      <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={onClose}>
        Retour au tableau de bord
      </Button>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 'selection': return renderSelection();
      case 'scope': return renderScope();
      case 'data': return renderData();
      case 'verification': return renderVerification();
      case 'documents': return renderDocuments();
      case 'validation': return renderValidation();
      case 'confirmation': return renderConfirmation();
      default: return renderSelection();
    }
  };

  const canGoNext = currentStep !== 'selection' && currentStep !== 'confirmation';
  const canGoBack = currentStep !== 'selection' && currentStep !== 'confirmation';

  const goNext = () => {
    const steps: Step[] = ['scope', 'data', 'verification', 'documents', 'validation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goBack = () => {
    const steps: Step[] = ['scope', 'data', 'verification', 'documents', 'validation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    } else {
      setCurrentStep('selection');
    }
  };

  return (
    <div className="min-h-full bg-gray-50 p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={onClose} className="mb-4 gap-2">
            <ArrowLeft className="size-4" />
            Retour
          </Button>
          
          {currentStep !== 'selection' && currentStep !== 'confirmation' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">
                  {selectedDeclaration?.title}
                </h1>
                <Badge className="bg-blue-100 text-blue-700 border-0">
                  Étape {['scope', 'data', 'verification', 'documents', 'validation'].indexOf(currentStep) + 1} / 5
                </Badge>
              </div>
              <Progress value={stepProgress[currentStep]} className="h-2 mb-2" />
              <div className="flex justify-between text-xs text-gray-600">
                {Object.entries(stepNames).map(([key, name]) => (
                  <span 
                    key={key}
                    className={currentStep === key ? 'font-bold text-blue-600' : ''}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <Card className="p-8 bg-white border border-gray-200">
          {renderStep()}
        </Card>

        {/* Navigation */}
        {canGoNext && (
          <div className="flex justify-between mt-6">
            {canGoBack && (
              <Button variant="outline" onClick={goBack} className="gap-2">
                <ArrowLeft className="size-4" />
                Précédent
              </Button>
            )}
            <Button 
              onClick={goNext} 
              className={`gap-2 bg-blue-600 hover:bg-blue-700 ${!canGoBack ? 'ml-auto' : ''}`}
            >
              Suivant
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
