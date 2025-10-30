import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ENDPOINTS } from '../config/api';

export interface AuthUser {
  uid: string;
  email: string;
  companyId: string;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, companyName: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function register(email: string, password: string, companyName: string) {
    try {
      const response = await fetch(ENDPOINTS.auth.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          companyName
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      if (data.success && data.user) {
        // Stocker le token
        localStorage.setItem('auth_token', data.token);
        // Utiliser les données de l'utilisateur réel
        setCurrentUser({
          uid: data.user.uid,
          email: data.user.email,
          companyId: data.user.companyId
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    }
  }

  async function login(email: string, password: string) {
    try {
      const response = await fetch(ENDPOINTS.auth.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la connexion');
      }

      if (data.success && data.user) {
        // Stocker le token
        localStorage.setItem('auth_token', data.token);
        // Utiliser les données de l'utilisateur réel
        setCurrentUser({
          uid: data.user.uid,
          email: data.user.email,
          companyId: data.user.companyId
        });
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      // Supprimer le token local
      localStorage.removeItem('auth_token');
      setCurrentUser(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  }

  useEffect(() => {
    // Vérifier s'il y a un token stocké au démarrage
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Décoder le token pour récupérer les infos utilisateur
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser({
          uid: payload.user_id || 'test_user',
          email: payload.email || 'demo@example.com',
          companyId: payload.companyId || 'demo_company'
        });
      } catch (e) {
        // Token invalide, on déconnecte
        localStorage.removeItem('auth_token');
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
    setLoading(false);
  }, []);

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}