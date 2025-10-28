import {useState} from 'react';
import {Dashboard} from './components/Dashboard';
import {AlertsList} from './components/AlertsList';
import {Procedures} from './components/Procedures';
import {RegulatoryWatch} from './components/RegulatoryWatch';
import {Settings} from './components/Settings';
import {AIAssistant} from './components/AIAssistant';
import {NewDeclaration} from './components/NewDeclaration';
import {Navigation} from './components/Navigation';
import {Bell, Bot, Eye, FolderOpen, LayoutDashboard, Settings as SettingsIcon} from 'lucide-react';

export type Page = 'dashboard' | 'alert' | 'procedures' | 'watch' | 'settings' | 'assistant' | 'new-declaration';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedAlertId, setSelectedAlertId] = useState<string>('alert-1');
  const [selectedDeclarationId, setSelectedDeclarationId] = useState<string | null>(null);
  // TODO: Récupérer depuis le contexte d'authentification
  const currentUser = {
        uid: 'test_user',
        companyId: 'demo_company'
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            onNewDeclaration={() => {
              setSelectedDeclarationId(null);
              setCurrentPage('new-declaration');
            }}
            onNavigateToProcedures={() => setCurrentPage('procedures')}
            onNavigateToAlerts={() => setCurrentPage('alert')}
          />
        );
      case 'alert':
        return <AlertsList />;
      case 'procedures':
        return (
          <Procedures 
            onNewDeclaration={() => {
              setSelectedDeclarationId(null);
              setCurrentPage('new-declaration');
            }}
            onContinueDeclaration={(declarationId: string) => {
              setSelectedDeclarationId(declarationId);
              setCurrentPage('new-declaration');
            }}
          />
        );
      case 'watch':
        return <RegulatoryWatch onSelectAlert={(id) => {
          setSelectedAlertId(id);
          setCurrentPage('alert');
        }} />;
      case 'settings':
        return <Settings />;
      case 'assistant':
        return <AIAssistant />;
      case 'new-declaration':
        return (
          <NewDeclaration 
            onClose={() => setCurrentPage('dashboard')} 
            userId="test_user"
            companyId="demo_company"
          />
        );
      default:
        return <Dashboard onNewDeclaration={() => setCurrentPage('new-declaration')} />;
    }
  };


    const navItems = [
        {id: 'dashboard' as Page, label: 'Tableau de bord', icon: LayoutDashboard},
        {id: 'alert' as Page, label: 'Alertes', icon: Bell},
        {id: 'procedures' as Page, label: 'Démarches', icon: FolderOpen},
        {id: 'watch' as Page, label: 'Veille', icon: Eye},
        {id: 'assistant' as Page, label: 'Assistant IA', icon: Bot},
        {id: 'settings' as Page, label: 'Paramètres', icon: SettingsIcon},
    ];

    return (
        <div className="h-screen w-screen flex bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Navigation
                currentPage={currentPage}
                onNavigate={setCurrentPage}
                items={navItems}
            />
            <main className="flex-1 overflow-auto">
                {renderPage()}
            </main>
        </div>
    );
}