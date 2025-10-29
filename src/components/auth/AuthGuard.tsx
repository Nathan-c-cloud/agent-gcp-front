import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { WelcomeScreen } from './WelcomeScreen';
import { AuthForm } from './AuthForm';
import { ProtectedRoute } from './ProtectedRoute';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { currentUser } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  // Si l'utilisateur est connecté, afficher l'application
  if (currentUser) {
    return (
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
    );
  }

  // Si pas connecté et pas encore sur l'écran d'auth, afficher l'écran d'accueil
  if (!showAuth) {
    return <WelcomeScreen onGetStarted={() => setShowAuth(true)} />;
  }

  // Sinon afficher les formulaires d'authentification
  return <AuthForm onBack={() => setShowAuth(false)} />;
}