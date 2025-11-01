import {LucideIcon, LogOut} from 'lucide-react';
import {Page} from '../App';
import {useState, useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';

interface NavItem {
    id: Page;
    label: string;
    icon: LucideIcon;
}

interface NavigationProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
    items: NavItem[];
}

export function Navigation({currentPage, onNavigate, items}: NavigationProps) {
    const { logout, currentUser } = useAuth();
    const [userInitials, setUserInitials] = useState('U');
    const [userName, setUserName] = useState('Utilisateur');
    const [companyName, setCompanyName] = useState('Entreprise');

    // Charger les données depuis le contexte d'auth
    useEffect(() => {
        if (!currentUser) return;

        // Extraire le nom depuis l'email
        const emailPrefix = currentUser.email.split('@')[0];
        const displayName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        
        // Générer les initiales (première lettre de l'email)
        const initials = emailPrefix.substring(0, 2).toUpperCase();
        
        // Formatter le companyId en nom lisible
        const formattedCompany = currentUser.companyId
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());

        setUserName(displayName);
        setUserInitials(initials);
        setCompanyName(formattedCompany);
    }, [currentUser]);

    return (
        <nav className="w-72 h-full bg-white border-r border-gray-200 p-8 flex flex-col gap-2">
            <div className="mb-10 text-center">
                <h2 className="text-2xl tracking-tight font-bold text-gray-900 mb-2">Optimious</h2>
                <p className="text-xs text-gray-600 tracking-wide uppercase font-semibold">Anticipez Optimisez Réussissez</p>
            </div>


            {items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                            isActive
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                        }`}
                    >
                        <Icon
                            className={`size-5 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}/>
                        <span className="font-semibold">{item.label}</span>
                        {isActive && (
                            <div className="ml-auto size-2 rounded-full bg-white animate-pulse"/>
                        )}
                    </button>
                );
            })}

            <div className="mt-auto pt-8 border-t border-gray-200 space-y-3">
                <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 hover:shadow-md transition-all cursor-pointer">
                    <div
                        className="size-11 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md">
                        <span className="font-semibold">{userInitials}</span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900">{userName}</p>
                        <p className="text-xs text-gray-600">{companyName}</p>
                    </div>
                </div>
                
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
                >
                    <LogOut className="size-5 group-hover:scale-110 transition-transform duration-200"/>
                    <span className="font-semibold">Déconnexion</span>
                </button>
            </div>
        </nav>
    );
}