import {LucideIcon} from 'lucide-react';
import {Page} from '../App';
import {useState, useEffect} from 'react';
import {getSettings} from '../services/settingsService';

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
    const [userInitials, setUserInitials] = useState('JD');
    const [userName, setUserName] = useState('Jean Dupont');
    const [companyName, setCompanyName] = useState('Entreprise SAS');

    // Charger les données depuis Firestore
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const companyId = "demo_company"; // TODO: Récupérer depuis le contexte d'authentification
                const settings = await getSettings(companyId);

                if (settings) {
                    const prenom = settings.representative.prenom || 'Jean';
                    const nom = settings.representative.nom || 'Dupont';
                    const entreprise = settings.company_info.nom || 'Entreprise SAS';

                    setUserName(`${prenom} ${nom}`);
                    setUserInitials(`${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase());
                    setCompanyName(entreprise);
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };

        loadUserData();
    }, []);

    return (
        <nav className="w-72 bg-white border-r border-gray-200 p-8 flex flex-col gap-2">
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="relative size-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                        <span className="text-xl">✨</span>
                    </div>
                    <div>
                        <h2 className="text-xl tracking-tight font-bold text-gray-900">Simplify</h2>
                    </div>
                </div>
                <p className="text-xs text-gray-600 ml-[52px] tracking-wide uppercase font-semibold">Copilote
                    administratif</p>
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

            <div className="mt-auto pt-8 border-t border-gray-200">
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
            </div>
        </nav>
    );
}