import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Shield, Users, FileText, Bell } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-white to-purple-50 overflow-y-auto flex items-center justify-center">
      <div className="flex flex-col items-center justify-center px-4 py-12 w-full">
        {/* Logo et titre principal */}
        <div className="text-center mb-8 w-full max-w-4xl">
          <div className="flex justify-center mb-4">
            {!logoError ? (
              <img
                src="/logo.svg"
                alt="Logo Optimious"
                className="h-16 w-16 object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="h-16 w-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            Bienvenue sur <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Optimious</span>
          </h1>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Votre assistant intelligent pour la conformité réglementaire et la gestion des démarches administratives
          </p>
        </div>

        {/* Fonctionnalités principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 max-w-6xl w-full px-4">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-2xl transition-shadow min-h-[320px]">
            <CardHeader className="text-center py-10">
              <div className="mx-auto mb-8 h-24 w-24 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <Bell className="h-12 w-12 text-white" />
              </div>
              <CardTitle className="text-2xl text-blue-900 font-bold">Alertes Intelligentes</CardTitle>
            </CardHeader>
            <CardContent className="pb-10 px-8">
              <CardDescription className="text-center text-blue-700 text-lg leading-relaxed">
                Recevez des notifications proactives sur les changements réglementaires qui vous concernent
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-2xl transition-shadow min-h-[320px]">
            <CardHeader className="text-center py-10">
              <div className="mx-auto mb-8 h-24 w-24 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <FileText className="h-12 w-12 text-white" />
              </div>
              <CardTitle className="text-2xl text-purple-900 font-bold">Gestion des Démarches</CardTitle>
            </CardHeader>
            <CardContent className="pb-10 px-8">
              <CardDescription className="text-center text-purple-700 text-lg leading-relaxed">
                Suivez et gérez toutes vos démarches administratives en un seul endroit
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-2xl transition-shadow min-h-[320px]">
            <CardHeader className="text-center py-10">
              <div className="mx-auto mb-8 h-24 w-24 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                <Users className="h-12 w-12 text-white" />
              </div>
              <CardTitle className="text-2xl text-green-900 font-bold">Assistant IA</CardTitle>
            </CardHeader>
            <CardContent className="pb-10 px-8">
              <CardDescription className="text-center text-green-700 text-lg leading-relaxed">
                Bénéficiez de conseils personnalisés grâce à notre intelligence artificielle
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Bouton d'action */}
        <div className="text-center w-full max-w-sm mx-auto">
          <Button
            onClick={onGetStarted}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-black px-6 py-3 text-base font-semibold shadow-md transition-all duration-200"
          >
            Commencer maintenant
          </Button>

          <p className="text-sm text-gray-500 mt-4">
            Connectez-vous ou créez votre compte pour accéder à toutes les fonctionnalités
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400 text-sm w-full max-w-4xl">
          <p>© 2025 Optimious - Votre partenaire conformité</p>
        </div>
      </div>
    </div>
  );
}

