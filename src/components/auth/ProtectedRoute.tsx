import { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // Si l'utilisateur n'est pas connecté, on ne rend rien
    // Le composant AuthGuard va gérer l'affichage de l'auth
    return null;
  }

  return <>{children}</>;
}