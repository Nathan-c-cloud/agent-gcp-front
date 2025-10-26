import {useState, useEffect} from 'react';
import {Card} from './ui/card';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Send, Sparkles} from 'lucide-react';
import {chatMessages, suggestedQuestions} from '../lib/mockData';
import {getSettings} from '../services/settingsService';

const API_URL = "https://agent-client-478570587937.us-west1.run.app";

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function AIAssistant() {
    const [messages, setMessages] = useState<Message[]>(chatMessages);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [userFirstName, setUserFirstName] = useState('');

    // Charger les données depuis Firestore
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const companyId = "demo_company"; // TODO: Récupérer depuis le contexte d'authentification
                const settings = await getSettings(companyId);

                if (settings) {
                    setUserFirstName(settings.representative.prenom || 'Utilisateur');
                }
            } catch (error) {
                console.error('Error loading user data:', error);
                setUserFirstName('Utilisateur');
            }
        };

        loadUserData();
    }, []);

    const handleSend = async (text?: string) => {
        const messageText = text || inputValue;
        if (!messageText.trim()) return;

        // Add user message
        setMessages(prev => [...prev, {role: 'user', content: messageText}]);
        setInputValue('');
        setIsTyping(true); // Affiche "Simplify écrit..."

        // Au lieu de simuler, on appelle la vraie API
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: messageText // On envoie la question
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Si l'API renvoie une erreur (400, 500, etc.)
                throw new Error(data.erreur || "Une erreur inconnue est survenue.");
            }

            // Ajoute la vraie réponse de l'IA
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.reponse
            }]);

        } catch (error) {
            console.error("Erreur lors de l'appel à l'agent:", error);
            // Affiche un message d'erreur dans le chat
            const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue";
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Désolé, une erreur est survenue : ${errorMessage}`
            }]);
        } finally {
            setIsTyping(false); // Arrête l'animation "écrit..."
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div
            className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
            {/* Animated background circles */}
            <div className="absolute top-20 right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-wave"/>
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-wave"
                 style={{animationDelay: '1s'}}/>

            {/* Header */}
            <div className="relative p-8 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto">
                    {/* Welcome Card */}
                    <Card
                        className="p-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-0 rounded-2xl shadow-soft relative overflow-hidden">
                        <div
                            className="absolute top-0 right-0 w-32 h-32 bg-blue-400/30 rounded-full blur-2xl animate-pulse"/>
                        <div className="flex items-center gap-5 relative">
                            <div className="relative">
                                <div
                                    className="size-20 rounded-2xl bg-gradient-to-br from-[#2563EB] via-[#7C3AED] to-[#DB2777] flex items-center justify-center shadow-lg animate-float">
                                    <Sparkles className="size-10 text-white"/>
                                </div>
                                <div
                                    className="absolute inset-0 rounded-2xl bg-[#2563EB] blur-xl opacity-50 animate-pulse"/>
                                <div
                                    className="absolute -top-1 -right-1 size-4 rounded-full bg-green-500 border-2 border-white animate-pulse shadow-lg"/>
                            </div>
                            <div>
                                <h2 className="tracking-tight mb-1">Simplify Bot</h2>
                                <p className="text-base text-muted-foreground font-medium">
                                    👋 Bonjour {userFirstName}, je suis prêt à t'aider dans ta paperasse !
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-8 relative">
                <div className="max-w-4xl mx-auto space-y-6">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
                        >
                            <div
                                className={`flex items-end gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                {message.role === 'assistant' && (
                                    <div
                                        className="size-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shrink-0 shadow-lg">
                                        <Sparkles className="size-5 text-white"/>
                                    </div>
                                )}
                                <Card
                                    className={`p-4 rounded-2xl border-0 ${
                                        message.role === 'user'
                                            ? 'bg-gradient-to-br from-gray-100 to-gray-50 shadow-soft'
                                            : 'bg-gradient-to-br from-blue-50 to-purple-50 shadow-soft-lg'
                                    }`}
                                >
                                    <p className="text-sm leading-relaxed">{message.content}</p>
                                </Card>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start animate-in fade-in">
                            <div className="flex items-end gap-3">
                                <div
                                    className="size-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shadow-lg">
                                    <Sparkles className="size-5 text-white"/>
                                </div>
                                <Card
                                    className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-0 rounded-2xl shadow-soft">
                                    <div className="flex gap-2 items-center">
                                        <div className="size-2.5 rounded-full bg-[#2563EB] animate-bounce"
                                             style={{animationDelay: '0ms'}}/>
                                        <div className="size-2.5 rounded-full bg-[#2563EB] animate-bounce"
                                             style={{animationDelay: '150ms'}}/>
                                        <div className="size-2.5 rounded-full bg-[#2563EB] animate-bounce"
                                             style={{animationDelay: '300ms'}}/>
                                        <span className="text-sm text-muted-foreground ml-2 font-medium">Simplify écrit...</span>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Suggested Questions */}
                    {messages.length === 2 && (
                        <div className="pt-6 animate-in fade-in slide-in-from-bottom-4">
                            <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                                <Sparkles className="size-4"/>
                                Suggestions pour vous :
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {suggestedQuestions.map((question, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSend(question)}
                                        className="text-sm rounded-xl hover:shadow-md hover:scale-105 hover:bg-blue-50 hover:border-blue-200 transition-all font-medium"
                                    >
                                        {question}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Bar */}
            <div className="relative p-8 bg-white/80 backdrop-blur-sm border-t border-gray-100">
                <div className="max-w-4xl mx-auto">
                    <Card className="p-3 rounded-2xl bg-white border-0 shadow-soft-lg">
                        <div className="flex gap-3">
                            <Input
                                placeholder="Posez une question à Simplify..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base bg-transparent"
                            />
                            <Button
                                onClick={() => handleSend()}
                                className="gap-2 bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#DB2777] hover:shadow-lg hover:scale-105 transition-all rounded-xl px-6 font-semibold"
                            >
                                <Send className="size-5"/>
                                Envoyer
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
