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
    <div className="min-h-full bg-gradient-to-br from-blue-100 via-white to-purple-50">
      <div className="flex flex-col items-center justify-center px-4 py-10 min-h-screen">
        {/* Logo et titre principal */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            {!logoError ? (
              <img
                src="/logo.svg"
                alt="Logo RegleWatch"
                className="h-14 w-auto"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="h-14 w-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            Bienvenue sur <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">RegleWatch</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Votre assistant intelligent pour la conformité réglementaire et la gestion des démarches administratives
          </p>
        </div>

        {/* Fonctionnalités principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 max-w-3xl w-full">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-blue-900">Alertes Intelligentes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-blue-700">
                Recevez des notifications proactives sur les changements réglementaires qui vous concernent
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 bg-purple-600 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-purple-900">Gestion des Démarches</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-purple-700">
                Suivez et gérez toutes vos démarches administratives en un seul endroit
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 bg-green-600 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-green-900">Assistant IA</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-green-700">
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
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 text-base font-semibold shadow-md transition-all duration-200"
          >
            Commencer maintenant
          </Button>

          <p className="text-sm text-gray-500 mt-4">
            Connectez-vous ou créez votre compte pour accéder à toutes les fonctionnalités
          </p>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-400 text-sm">
          <p>© 2025 RegleWatch - Votre partenaire conformité</p>
        </div>
      </div>
    </div>
  );
}