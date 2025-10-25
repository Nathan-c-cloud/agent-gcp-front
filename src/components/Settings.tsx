import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Building2, User, Bell, Sparkles, Save, CheckCircle, Settings as SettingsIcon, Plug } from 'lucide-react';
import { toast } from 'sonner';
// AJOUTER ces imports
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { RefreshCw, AlertCircle } from 'lucide-react';
import {
  getIntegrations,
  connectIntegration,
  disconnectIntegration,
  testIntegration,
  type Integration,
  type ConnectionCredentials
} from '../services/integrationService';

export function Settings() {
  const [isSaving, setIsSaving] = useState(false);


  // Informations entreprise
  const [companyInfo, setCompanyInfo] = useState({
    nom: "SARL TechCorp",
    siret: "123 456 789 00012",
    formeJuridique: "SARL",
    dateCreation: "2020-01-15",
    adresse: "12 Rue de la République",
    codePostal: "75001",
    ville: "Paris",
    effectif: "10-49",
    secteurActivite: "tech",
    regimeFiscal: "reel_simplifie",
    regimeTVA: "reel_normal"
  });

  // Représentant légal
  const [representant, setRepresentant] = useState({
    nom: "Dupont",
    prenom: "Jean",
    email: "jean.dupont@techcorp.fr",
    telephone: "01 23 45 67 89",
    fonction: "Gérant"
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    echeances: true,
    recommandations: true,
    nouvellesAides: true,
    miseAJourLegislation: false,
    rappelDeclarations: true,
    email: true,
    push: false
  });

  // Préférences IA
  const [aiPreferences, setAiPreferences] = useState({
    niveauDetail: "detaille",
    tonCommunication: "professionnel",
    frequenceRecommandations: "quotidienne",
    domainesPrioritaires: ["fiscalite", "aides", "social"]
  });


  // Intégrations - État dynamique depuis le backend
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedSaas, setSelectedSaas] = useState<string>('');
  const [connectionForm, setConnectionForm] = useState<ConnectionCredentials>({});

  const userId = "test_user";
  const companyId = "Demo Company";

  const handleSave = () => {
    setIsSaving(true);

    // Simuler une sauvegarde
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Paramètres enregistrés avec succès", {
        description: "Vos modifications ont été sauvegardées.",
        duration: 3000,
      });
    }, 1000);

  };

  // Charger les intégrations
  useEffect(() => {
    loadIntegrations();
    const interval = setInterval(loadIntegrations, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadIntegrations = async () => {
    setIsLoadingIntegrations(true);
    try {
      const data = await getIntegrations(userId, companyId);
      setIntegrations(data);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setIsLoadingIntegrations(false);
    }
  };

  const handleConnectIntegration = async () => {
    if (!selectedSaas) {
      toast.error('Veuillez sélectionner une intégration');
      return;
    }

    try {
      const result = await connectIntegration(
        selectedSaas,
        connectionForm,
        userId,
        companyId
      );

      if (result.success) {
        toast.success(result.message || 'Intégration connectée avec succès !');
        await loadIntegrations();
        setIsAddDialogOpen(false);
        setConnectionForm({});
        setSelectedSaas('');
      } else {
        toast.error(result.message || 'Échec de la connexion');
      }
    } catch (error) {
      toast.error('Erreur lors de la connexion');
    }
  };

  const handleDisconnectIntegration = async (saasId: string, saasName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir déconnecter ${saasName} ?`)) return;

    try {
      const result = await disconnectIntegration(saasId, userId, companyId);
      if (result.success) {
        toast.success(`${saasName} déconnecté`);
        await loadIntegrations();
      } else {
        toast.error('Échec de la déconnexion');
      }
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const handleTestIntegration = async (saasId: string, saasName: string) => {
    try {
      const result = await testIntegration(saasId, userId, companyId);
      if (result.success) {
        toast.success(`${saasName} : Connexion OK ✅`);
      } else {
        toast.error(`${saasName} : Connexion échouée ❌`);
      }
    } catch (error) {
      toast.error('Erreur lors du test');
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-purple-50/30 p-12 animate-in fade-in duration-500 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-20 right-40 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-40 left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />

      <div className="max-w-5xl mx-auto space-y-8 relative">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 shadow-lg">
              <span className="text-3xl">⚙️</span>
            </div>
            <h1 className="tracking-tight">Paramètres</h1>
          </div>
          <div className="h-1.5 w-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-2 shadow-lg" />
          <p className="text-muted-foreground font-medium">Configurez les informations de votre entreprise et vos préférences</p>
        </div>

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="!grid w-full grid-cols-5 bg-white rounded-2xl p-2 shadow-lg">
            <TabsTrigger
              value="company"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all"
            >
              <Building2 className="size-4 mr-2" />
              Entreprise
            </TabsTrigger>
            <TabsTrigger
              value="user"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all"
            >
              <User className="size-4 mr-2" />
              Représentant
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white transition-all"
            >
              <Bell className="size-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all"
            >
              <Plug className="size-4 mr-2" />
              Intégrations
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all"
            >
              <Sparkles className="size-4 mr-2" />
              Assistant IA
            </TabsTrigger>
          </TabsList>

          {/* ONGLET ENTREPRISE */}
          <TabsContent value="company" className="space-y-6">
            <Card
              className="p-8 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 border-0 group"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-blue-100 group-hover:scale-110 transition-transform shadow-lg">
                  <Building2 className="size-6 text-blue-600" />
                </div>
                <h3 className="tracking-tight">Informations générales</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom de l'entreprise</Label>
                  <Input
                    id="nom"
                    value={companyInfo.nom}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, nom: e.target.value })}
                    className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siret">SIRET</Label>
                  <Input
                    id="siret"
                    value={companyInfo.siret}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, siret: e.target.value })}
                    className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formeJuridique">Forme juridique</Label>
                  <Select
                    value={companyInfo.formeJuridique}
                    onValueChange={(value) => setCompanyInfo({ ...companyInfo, formeJuridique: value })}
                  >
                    <SelectTrigger id="formeJuridique" className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SARL">SARL</SelectItem>
                      <SelectItem value="SAS">SAS</SelectItem>
                      <SelectItem value="SASU">SASU</SelectItem>
                      <SelectItem value="EURL">EURL</SelectItem>
                      <SelectItem value="SA">SA</SelectItem>
                      <SelectItem value="SNC">SNC</SelectItem>
                      <SelectItem value="auto-entrepreneur">Auto-entrepreneur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateCreation">Date de création</Label>
                  <Input
                    id="dateCreation"
                    type="date"
                    value={companyInfo.dateCreation}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, dateCreation: e.target.value })}
                    className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="adresse">Adresse</Label>
                  <Input
                    id="adresse"
                    value={companyInfo.adresse}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, adresse: e.target.value })}
                    className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codePostal">Code postal</Label>
                  <Input
                    id="codePostal"
                    value={companyInfo.codePostal}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, codePostal: e.target.value })}
                    className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ville">Ville</Label>
                  <Input
                    id="ville"
                    value={companyInfo.ville}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, ville: e.target.value })}
                    className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium"
                  />
                </div>
              </div>
            </Card>

            <Card
              className="p-8 bg-gradient-to-br from-white to-blue-50/30 rounded-2xl hover:shadow-xl transition-all duration-300 border-0 group"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-indigo-100 group-hover:scale-110 transition-transform shadow-lg">
                  <Sparkles className="size-6 text-indigo-600" />
                </div>
                <h3 className="tracking-tight">Activité</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="secteurActivite">Secteur d'activité</Label>
                  <Select
                    value={companyInfo.secteurActivite}
                    onValueChange={(value) => setCompanyInfo({ ...companyInfo, secteurActivite: value })}
                  >
                    <SelectTrigger id="secteurActivite" className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tech">Technologies & Informatique</SelectItem>
                      <SelectItem value="commerce">Commerce & Distribution</SelectItem>
                      <SelectItem value="services">Services aux entreprises</SelectItem>
                      <SelectItem value="industrie">Industrie & Manufacturing</SelectItem>
                      <SelectItem value="batiment">BTP & Construction</SelectItem>
                      <SelectItem value="sante">Santé & Social</SelectItem>
                      <SelectItem value="agriculture">Agriculture</SelectItem>
                      <SelectItem value="transport">Transport & Logistique</SelectItem>
                      <SelectItem value="hotellerie">Hôtellerie & Restauration</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effectif">Nombre de salariés</Label>
                  <Select
                    value={companyInfo.effectif}
                    onValueChange={(value) => setCompanyInfo({ ...companyInfo, effectif: value })}
                  >
                    <SelectTrigger id="effectif" className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 (auto-entrepreneur)</SelectItem>
                      <SelectItem value="1-9">1 à 9</SelectItem>
                      <SelectItem value="10-49">10 à 49</SelectItem>
                      <SelectItem value="50-249">50 à 249</SelectItem>
                      <SelectItem value="250+">250 et plus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regimeFiscal">Régime fiscal</Label>
                  <Select
                    value={companyInfo.regimeFiscal}
                    onValueChange={(value) => setCompanyInfo({ ...companyInfo, regimeFiscal: value })}
                  >
                    <SelectTrigger id="regimeFiscal" className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reel_simplifie">Réel simplifié</SelectItem>
                      <SelectItem value="reel_normal">Réel normal</SelectItem>
                      <SelectItem value="micro">Micro-entreprise</SelectItem>
                      <SelectItem value="franchise">Franchise en base de TVA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regimeTVA">Régime de TVA</Label>
                  <Select
                    value={companyInfo.regimeTVA}
                    onValueChange={(value) => setCompanyInfo({ ...companyInfo, regimeTVA: value })}
                  >
                    <SelectTrigger id="regimeTVA" className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reel_normal">Réel normal</SelectItem>
                      <SelectItem value="reel_simplifie">Réel simplifié</SelectItem>
                      <SelectItem value="franchise">Franchise en base</SelectItem>
                      <SelectItem value="mini_reel">Mini-réel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ONGLET REPRÉSENTANT */}
          <TabsContent value="user" className="space-y-6">
            <Card
              className="p-8 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 border-0 group"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-purple-100 group-hover:scale-110 transition-transform shadow-lg">
                  <User className="size-6 text-purple-600" />
                </div>
                <h3 className="tracking-tight">Informations du représentant légal</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={representant.prenom}
                    onChange={(e) => setRepresentant({ ...representant, prenom: e.target.value })}
                    className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nomRepresentant">Nom</Label>
                  <Input
                    id="nomRepresentant"
                    value={representant.nom}
                    onChange={(e) => setRepresentant({ ...representant, nom: e.target.value })}
                    className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fonction">Fonction</Label>
                  <Input
                    id="fonction"
                    value={representant.fonction}
                    onChange={(e) => setRepresentant({ ...representant, fonction: e.target.value })}
                    className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailRepresentant">Email professionnel</Label>
                  <Input
                    id="emailRepresentant"
                    type="email"
                    value={representant.email}
                    onChange={(e) => setRepresentant({ ...representant, email: e.target.value })}
                    className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    value={representant.telephone}
                    onChange={(e) => setRepresentant({ ...representant, telephone: e.target.value })}
                    className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ONGLET NOTIFICATIONS */}
          <TabsContent value="notifications" className="space-y-6">
            <Card
              className="p-8 bg-gradient-to-br from-white to-yellow-50/30 rounded-2xl hover:shadow-xl transition-all duration-300 border-0 group"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-yellow-100 group-hover:scale-110 transition-transform shadow-lg">
                  <Bell className="size-6 text-yellow-600" />
                </div>
                <h3 className="tracking-tight">Types d'alertes</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/50 transition-colors">
                  <div className="space-y-0.5">
                    <Label htmlFor="echeances" className="font-semibold">Échéances importantes</Label>
                    <p className="text-sm text-muted-foreground">Déclarations fiscales et sociales à venir</p>
                  </div>
                  <Switch
                    id="echeances"
                    checked={notifications.echeances}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, echeances: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/50 transition-colors">
                  <div className="space-y-0.5">
                    <Label htmlFor="recommandations" className="font-semibold">Recommandations personnalisées</Label>
                    <p className="text-sm text-muted-foreground">Suggestions basées sur votre activité</p>
                  </div>
                  <Switch
                    id="recommandations"
                    checked={notifications.recommandations}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, recommandations: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/50 transition-colors">
                  <div className="space-y-0.5">
                    <Label htmlFor="nouvellesAides" className="font-semibold">Nouvelles aides disponibles</Label>
                    <p className="text-sm text-muted-foreground">Être alerté des nouvelles aides et subventions</p>
                  </div>
                  <Switch
                    id="nouvellesAides"
                    checked={notifications.nouvellesAides}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, nouvellesAides: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/50 transition-colors">
                  <div className="space-y-0.5">
                    <Label htmlFor="miseAJourLegislation" className="font-semibold">Mises à jour législatives</Label>
                    <p className="text-sm text-muted-foreground">Changements de lois et régulations</p>
                  </div>
                  <Switch
                    id="miseAJourLegislation"
                    checked={notifications.miseAJourLegislation}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, miseAJourLegislation: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/50 transition-colors">
                  <div className="space-y-0.5">
                    <Label htmlFor="rappelDeclarations" className="font-semibold">Rappels de déclarations</Label>
                    <p className="text-sm text-muted-foreground">Rappels avant chaque déclaration obligatoire</p>
                  </div>
                  <Switch
                    id="rappelDeclarations"
                    checked={notifications.rappelDeclarations}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, rappelDeclarations: checked })}
                  />
                </div>
              </div>
            </Card>

            <Card
              className="p-8 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 border-0 group"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-blue-100 group-hover:scale-110 transition-transform shadow-lg">
                  <Sparkles className="size-6 text-blue-600" />
                </div>
                <h3 className="tracking-tight">Canaux de communication</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotif" className="font-semibold">Notifications par email</Label>
                    <p className="text-sm text-muted-foreground">Envoyer les alertes par email</p>
                  </div>
                  <Switch
                    id="emailNotif"
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="space-y-0.5">
                    <Label htmlFor="pushNotif" className="font-semibold">Notifications push</Label>
                    <p className="text-sm text-muted-foreground">Recevoir des notifications dans le navigateur</p>
                  </div>
                  <Switch
                    id="pushNotif"
                    checked={notifications.push}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ONGLET INTÉGRATIONS */}
          {/* ONGLET INTÉGRATIONS - VERSION DYNAMIQUE */}
          <TabsContent value="integrations" className="space-y-6">
            <Card
              className="p-8 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 border-0"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-green-100 shadow-lg">
                    <Plug className="size-6 text-green-600" />
                  </div>
                  <h3 className="tracking-tight">Intégrations</h3>
                </div>

                {/* Bouton refresh */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadIntegrations}
                  disabled={isLoadingIntegrations}
                  className="rounded-xl"
                >
                  <RefreshCw className={`size-4 mr-2 ${isLoadingIntegrations ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>

              <div className="space-y-4">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className={`flex items-center justify-between p-5 border-0 rounded-2xl hover:shadow-md transition-all group shadow-soft
                      ${integration.status === 'connected' ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 
                        integration.status === 'configuring' ? 'bg-gradient-to-r from-orange-50 to-amber-50' : 
                        'bg-white border border-gray-200'}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`size-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg
                        ${integration.status === 'connected' ? 'bg-green-100' : 
                          integration.status === 'configuring' ? 'bg-orange-100' : 
                          'bg-gray-100'}`}
                      >
                        {integration.status === 'connected' && <CheckCircle className="size-7 text-green-600" />}
                        {integration.status === 'configuring' && <SettingsIcon className="size-7 text-orange-600 animate-spin-slow" />}
                        {integration.status === 'disconnected' && <Plug className="size-7 text-gray-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{integration.name}</p>
                        <p className="text-sm text-muted-foreground font-medium">{integration.description}</p>
                        {integration.connectedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Connecté le {new Date(integration.connectedAt).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        className={`shadow-md font-semibold
                          ${integration.status === 'connected' ? 'bg-green-500 text-white' : 
                            integration.status === 'configuring' ? 'bg-orange-500 text-white' : 
                            'bg-gray-200 text-gray-700'}`}
                      >
                        {integration.status === 'connected' && `Connecté ${integration.icon}`}
                        {integration.status === 'configuring' && `En configuration ${integration.icon}`}
                        {integration.status === 'disconnected' && `Non connecté ${integration.icon}`}
                      </Badge>

                      {integration.status === 'connected' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestIntegration(integration.id, integration.name)}
                            className="rounded-xl"
                          >
                            Tester
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnectIntegration(integration.id, integration.name)}
                            className="rounded-xl text-red-600 hover:text-red-700"
                          >
                            Déconnecter
                          </Button>
                        </>
                      )}

                      {integration.status === 'disconnected' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSaas(integration.id);
                            setIsAddDialogOpen(true);
                          }}
                          className="rounded-xl"
                        >
                          Connecter
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Dialog pour ajouter/connecter une intégration */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mt-4 rounded-xl hover:shadow-md hover:scale-[1.02] transition-all py-6 font-semibold border-dashed border-2 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Sparkles className="size-5 mr-2" />
                      Ajouter une intégration
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>
                        Connecter {selectedSaas === 'odoo' ? 'Odoo' : selectedSaas === 'payfit' ? 'PayFit' : 'QuickBooks'}
                      </DialogTitle>
                      <DialogDescription>
                        Entrez vos informations de connexion pour intégrer {selectedSaas}.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      {selectedSaas === 'odoo' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="instance_url">URL de l'instance</Label>
                            <Input
                              id="instance_url"
                              placeholder="https://votre-entreprise.odoo.com"
                              value={connectionForm.instance_url || ''}
                              onChange={(e) => setConnectionForm({ ...connectionForm, instance_url: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="database">Base de données</Label>
                            <Input
                              id="database"
                              placeholder="production"
                              value={connectionForm.database || ''}
                              onChange={(e) => setConnectionForm({ ...connectionForm, database: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="username">Email / Username</Label>
                            <Input
                              id="username"
                              type="email"
                              placeholder="jean@entreprise.fr"
                              value={connectionForm.username || ''}
                              onChange={(e) => setConnectionForm({ ...connectionForm, username: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="api_key">API Key</Label>
                            <Input
                              id="api_key"
                              type="password"
                              placeholder="Votre API Key Odoo"
                              value={connectionForm.api_key || ''}
                              onChange={(e) => setConnectionForm({ ...connectionForm, api_key: e.target.value })}
                            />
                          </div>
                          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                            <AlertCircle className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-900">
                              <strong>Astuce :</strong> Générez une API Key dans Odoo → Préférences → Sécurité du compte
                            </p>
                          </div>
                        </>
                      )}

                      {selectedSaas === 'payfit' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="payfit_api_key">API Key PayFit</Label>
                            <Input
                              id="payfit_api_key"
                              type="password"
                              placeholder="pk_..."
                              value={connectionForm.payfit_api_key || ''}
                              onChange={(e) => setConnectionForm({ ...connectionForm, payfit_api_key: e.target.value })}
                            />
                          </div>
                        </>
                      )}

                      {selectedSaas === 'quickbooks' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="client_id">Client ID</Label>
                            <Input
                              id="client_id"
                              placeholder="Votre Client ID"
                              value={connectionForm.client_id || ''}
                              onChange={(e) => setConnectionForm({ ...connectionForm, client_id: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="client_secret">Client Secret</Label>
                            <Input
                              id="client_secret"
                              type="password"
                              placeholder="Votre Client Secret"
                              value={connectionForm.client_secret || ''}
                              onChange={(e) => setConnectionForm({ ...connectionForm, client_secret: e.target.value })}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddDialogOpen(false);
                          setConnectionForm({});
                        }}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleConnectIntegration}
                        className="bg-gradient-to-r from-green-500 to-emerald-600"
                      >
                        Connecter
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          </TabsContent>

          {/* ONGLET ASSISTANT IA */}
          <TabsContent value="ai" className="space-y-6">
            <Card
              className="p-8 bg-gradient-to-br from-white to-purple-50/30 rounded-2xl hover:shadow-xl transition-all duration-300 border-0 group"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-purple-100 group-hover:scale-110 transition-transform shadow-lg">
                  <Sparkles className="size-6 text-purple-600" />
                </div>
                <h3 className="tracking-tight">Comportement de l'assistant</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="niveauDetail">Niveau de détail des réponses</Label>
                  <Select
                    value={aiPreferences.niveauDetail}
                    onValueChange={(value) => setAiPreferences({ ...aiPreferences, niveauDetail: value })}
                  >
                    <SelectTrigger id="niveauDetail" className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concis">Concis - Réponses courtes et directes</SelectItem>
                      <SelectItem value="standard">Standard - Équilibre entre détail et concision</SelectItem>
                      <SelectItem value="detaille">Détaillé - Explications complètes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tonCommunication">Ton de communication</Label>
                  <Select
                    value={aiPreferences.tonCommunication}
                    onValueChange={(value) => setAiPreferences({ ...aiPreferences, tonCommunication: value })}
                  >
                    <SelectTrigger id="tonCommunication" className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formel">Formel - Langage administratif</SelectItem>
                      <SelectItem value="professionnel">Professionnel - Équilibré</SelectItem>
                      <SelectItem value="convivial">Convivial - Accessible et simple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequenceRecommandations">Fréquence des recommandations</Label>
                  <Select
                    value={aiPreferences.frequenceRecommandations}
                    onValueChange={(value) => setAiPreferences({ ...aiPreferences, frequenceRecommandations: value })}
                  >
                    <SelectTrigger id="frequenceRecommandations" className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temps_reel">Temps réel - Dès qu'une opportunité est détectée</SelectItem>
                      <SelectItem value="quotidienne">Quotidienne - Résumé quotidien</SelectItem>
                      <SelectItem value="hebdomadaire">Hebdomadaire - Résumé hebdomadaire</SelectItem>
                      <SelectItem value="manuelle">Manuelle - Uniquement sur demande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card
              className="p-8 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 border-0 group"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-pink-100 group-hover:scale-110 transition-transform shadow-lg">
                  <CheckCircle className="size-6 text-pink-600" />
                </div>
                <h3 className="tracking-tight">Domaines prioritaires</h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4 font-medium">
                Sélectionnez les domaines sur lesquels l'IA doit se concentrer pour ses recommandations
              </p>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: "fiscalite", label: "Fiscalité", color: "blue" },
                  { id: "aides", label: "Aides & Subventions", color: "green" },
                  { id: "social", label: "Social & RH", color: "purple" },
                  { id: "juridique", label: "Juridique", color: "orange" },
                  { id: "financement", label: "Financement", color: "indigo" },
                  { id: "export", label: "Export & International", color: "cyan" },
                  { id: "innovation", label: "Innovation & R&D", color: "pink" },
                  { id: "environnement", label: "Environnement", color: "emerald" }
                ].map((domaine) => {
                  const isSelected = aiPreferences.domainesPrioritaires.includes(domaine.id);
                  return (
                    <Badge
                      key={domaine.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer px-4 py-2 rounded-xl font-semibold transition-all hover:scale-105 ${
                        isSelected ? 'shadow-md' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          setAiPreferences({
                            ...aiPreferences,
                            domainesPrioritaires: aiPreferences.domainesPrioritaires.filter(d => d !== domaine.id)
                          });
                        } else {
                          setAiPreferences({
                            ...aiPreferences,
                            domainesPrioritaires: [...aiPreferences.domainesPrioritaires, domaine.id]
                          });
                        }
                      }}
                    >
                      {isSelected && <CheckCircle className="w-3 h-3 mr-1" />}
                      {domaine.label}
                    </Badge>
                  );
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bouton de sauvegarde global */}
        <div className="flex justify-end gap-4 pt-6">
          <Button
            variant="outline"
            className="rounded-xl px-6 font-semibold hover:shadow-md transition-all"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-105 rounded-xl px-8 font-semibold"
          >
            {isSaving ? (
              <>Enregistrement...</>
            ) : (
              <>
                <Save className="size-4 mr-2" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}