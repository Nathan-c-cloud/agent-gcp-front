import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { User, Bell, Plug, Shield, CheckCircle, Settings as SettingsIcon, Sparkles } from 'lucide-react';

export function Settings() {
  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-purple-50/30 p-12 animate-in fade-in duration-500 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-20 right-40 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-40 left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
      
      <div className="max-w-4xl mx-auto space-y-8 relative">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 shadow-lg">
              <span className="text-3xl">⚙️</span>
            </div>
            <h1 className="tracking-tight">Paramètres & Intégrations</h1>
          </div>
          <div className="h-1.5 w-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-2 shadow-lg" />
          <p className="text-muted-foreground font-medium">Personnalisez Simplify selon vos besoins</p>
        </div>

        {/* Profile Section */}
        <Card 
          className="p-8 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 border-0 group" 
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-blue-100 group-hover:scale-110 transition-transform shadow-lg">
              <User className="size-6 text-blue-600" />
            </div>
            <h2 className="tracking-tight">Profil utilisateur</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="mb-2 block">Nom complet</Label>
                <Input id="name" defaultValue="Jean Dupont" className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium" />
              </div>
              <div>
                <Label htmlFor="email" className="mb-2 block">Email</Label>
                <Input id="email" type="email" defaultValue="jean.dupont@entreprise.fr" className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role" className="mb-2 block">Rôle</Label>
                <Input id="role" defaultValue="Gérant" className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium" />
              </div>
              <div>
                <Label htmlFor="company" className="mb-2 block">Société</Label>
                <Input id="company" defaultValue="Entreprise SAS" className="rounded-xl border-0 bg-gray-50 shadow-sm font-medium" />
              </div>
            </div>
            <Button className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-105 rounded-full px-8 py-6 font-semibold">
              Modifier profil
            </Button>
          </div>
        </Card>

        {/* Notifications Section */}
        <Card 
          className="p-8 bg-gradient-to-br from-white to-yellow-50/30 rounded-2xl hover:shadow-xl transition-all duration-300 border-0 group" 
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-yellow-100 group-hover:scale-110 transition-transform shadow-lg">
              <Bell className="size-6 text-yellow-600" />
            </div>
            <h2 className="tracking-tight">Préférences d'alertes</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4 font-medium">
              Choisissez les types d'alertes que vous souhaitez recevoir
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
                <Checkbox id="fiscal" defaultChecked />
                <Label htmlFor="fiscal" className="cursor-pointer flex-1 font-medium">Alertes fiscales</Label>
                <Badge className="bg-blue-100 text-blue-700 border-0 font-semibold">Actif</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
                <Checkbox id="rh" defaultChecked />
                <Label htmlFor="rh" className="cursor-pointer flex-1 font-medium">Alertes RH</Label>
                <Badge className="bg-green-100 text-green-700 border-0 font-semibold">Actif</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
                <Checkbox id="juridique" defaultChecked />
                <Label htmlFor="juridique" className="cursor-pointer flex-1 font-medium">Alertes juridiques</Label>
                <Badge className="bg-orange-100 text-orange-700 border-0 font-semibold">Actif</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
                <Checkbox id="aides" defaultChecked />
                <Label htmlFor="aides" className="cursor-pointer flex-1 font-medium">Aides publiques</Label>
                <Badge className="bg-purple-100 text-purple-700 border-0 font-semibold">Actif</Badge>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 mt-6">
              <Label className="mb-4 block font-semibold">Niveau d'urgence</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
                  <Checkbox id="all" defaultChecked />
                  <Label htmlFor="all" className="cursor-pointer font-medium">Toutes les alertes</Label>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
                  <Checkbox id="urgent" />
                  <Label htmlFor="urgent" className="cursor-pointer font-medium">Seulement urgentes</Label>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Integrations Section */}
        <Card 
          className="p-8 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 border-0" 
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-green-100 shadow-lg">
              <Plug className="size-6 text-green-600" />
            </div>
            <h2 className="tracking-tight">Intégrations</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 border-0 rounded-2xl hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer bg-gradient-to-r from-green-50 to-emerald-50 group shadow-soft">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-xl bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <CheckCircle className="size-7 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg">PayFit</p>
                  <p className="text-sm text-muted-foreground font-medium">Gestion de la paie</p>
                </div>
              </div>
              <Badge className="bg-green-500 text-white shadow-md font-semibold">Connecté ✅</Badge>
            </div>

            <div className="flex items-center justify-between p-5 border-0 rounded-2xl hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer bg-gradient-to-r from-orange-50 to-amber-50 group shadow-soft">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-xl bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <SettingsIcon className="size-7 text-orange-600 animate-spin-slow" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Odoo</p>
                  <p className="text-sm text-muted-foreground font-medium">ERP & Comptabilité</p>
                </div>
              </div>
              <Badge className="bg-orange-500 text-white shadow-md font-semibold">En configuration ⚙️</Badge>
            </div>

            <div className="flex items-center justify-between p-5 border border-gray-200 rounded-2xl hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer bg-white group">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-xl bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plug className="size-7 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg">QuickBooks</p>
                  <p className="text-sm text-muted-foreground font-medium">Comptabilité</p>
                </div>
              </div>
              <Badge variant="secondary" className="shadow-sm font-semibold">Non connecté 🔴</Badge>
            </div>

            <Button variant="outline" className="w-full mt-4 rounded-xl hover:shadow-md hover:scale-[1.02] transition-all py-6 font-semibold border-dashed border-2 hover:bg-blue-50 hover:border-blue-300">
              <Sparkles className="size-5 mr-2" />
              Ajouter une intégration
            </Button>
          </div>
        </Card>

        {/* Security Section */}
        <Card 
          className="p-8 bg-gradient-to-br from-white to-purple-50/30 rounded-2xl hover:shadow-xl transition-all duration-300 border-0 group" 
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-purple-100 relative shadow-lg group-hover:scale-110 transition-transform">
              <Shield className="size-6 text-purple-600 animate-pulse" />
              <div className="absolute inset-0 bg-purple-400 rounded-xl blur-lg opacity-20 animate-pulse" />
            </div>
            <h2 className="tracking-tight">Sécurité</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="mb-3 block font-semibold">Méthode d'authentification</Label>
              <div className="flex gap-3">
                <Badge className="bg-blue-500 text-white shadow-md font-semibold px-4 py-2">🇫🇷 FranceConnect Pro</Badge>
                <Badge variant="secondary" className="shadow-sm font-semibold px-4 py-2">📧 Email</Badge>
              </div>
            </div>
            
            <Button variant="outline" className="mt-6 rounded-xl hover:shadow-md transition-all font-semibold hover:bg-purple-50 hover:border-purple-200">
              Gérer les accès
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}