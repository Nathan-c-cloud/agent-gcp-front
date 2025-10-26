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

// Fonction pour détecter et parser le JSON dans une réponse
function parseResponseContent(content: string): { isJson: boolean; data: any; formatted: string; textBefore: string; textAfter: string } {
    // Nettoyer les préfixes inutiles
    let cleanedContent = content
        .replace(/^Reponse Brute\s*/i, '')  // Enlever "Reponse Brute"
        .replace(/^Réponse\s*:\s*/i, '')    // Enlever "Réponse :"
        .trim();

    // Chercher des blocs JSON dans le texte (avec ```json ou sans)
    const jsonBlockMatch = cleanedContent.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonMatch = jsonBlockMatch ? jsonBlockMatch[1] : cleanedContent.match(/(\{[\s\S]*\}|\[[\s\S]*])/)?.[1];

    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch);

            // Extraire le texte avant et après le JSON
            const jsonStartIndex = cleanedContent.indexOf(jsonMatch);
            const jsonEndIndex = jsonStartIndex + jsonMatch.length;

            let textBefore = cleanedContent.substring(0, jsonStartIndex).trim();
            let textAfter = cleanedContent.substring(jsonEndIndex).trim();

            // Nettoyer les marqueurs de code block
            textBefore = textBefore.replace(/```json\s*$/, '').trim();
            textAfter = textAfter.replace(/^```/, '').trim();

            return {
                isJson: true,
                data: parsed,
                formatted: jsonMatch,
                textBefore,
                textAfter
            };
        } catch (e) {
            console.error('Failed to parse JSON:', e);
        }
    }

    // Si ce n'est pas du JSON, vérifier si c'est du JSON pur
    try {
        const parsed = JSON.parse(cleanedContent);
        return { isJson: true, data: parsed, formatted: cleanedContent, textBefore: '', textAfter: '' };
    } catch {
        return { isJson: false, data: null, formatted: cleanedContent, textBefore: '', textAfter: '' };
    }
}

// Composant pour afficher une réponse formatée
function FormattedResponse({ content }: { content: string }) {
    const { isJson, data, formatted, textBefore, textAfter } = parseResponseContent(content);

    if (!isJson) {
        // Formater le texte avec support Markdown basique
        return <MarkdownText content={formatted} />;
    }

    // Formater les données JSON de manière lisible
    const renderValue = (value: any): JSX.Element => {
        if (value === null || value === undefined) {
            return <span className="text-gray-400 italic">non défini</span>;
        }

        if (typeof value === 'boolean') {
            return <span className={value ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                {value ? '✓ Oui' : '✗ Non'}
            </span>;
        }

        if (typeof value === 'number') {
            return <span className="text-blue-600 font-medium">{value}</span>;
        }

        if (typeof value === 'string') {
            // Détecter les URLs
            if (value.match(/^https?:\/\//)) {
                return <a href={value} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all">{value}</a>;
            }
            return <span className="text-gray-900">{value}</span>;
        }

        if (Array.isArray(value)) {
            if (value.length === 0) {
                return <span className="text-gray-400 italic">Aucun élément</span>;
            }
            return (
                <ul className="space-y-2 mt-2">
                    {value.map((item, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-blue-600 font-bold mt-0.5">•</span>
                            <div className="flex-1">{renderValue(item)}</div>
                        </li>
                    ))}
                </ul>
            );
        }

        if (typeof value === 'object') {
            return (
                <div className="space-y-3 mt-2 pl-4 border-l-2 border-blue-200 bg-blue-50/30 py-2 rounded-r">
                    {Object.entries(value).map(([k, v]) => (
                        <div key={k} className="text-sm">
                            <span className="font-semibold text-gray-700">
                                {k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                            </span>{' '}
                            {renderValue(v, k)}
                        </div>
                    ))}
                </div>
            );
        }

        return <span>{String(value)}</span>;
    };

    const renderJsonContent = () => {
        if (typeof data === 'object' && !Array.isArray(data)) {
            return Object.entries(data).map(([key, value]) => {
                // Ne pas afficher les listes/objets vides
                if (Array.isArray(value) && value.length === 0) {
                    return null;
                }

                return (
                    <div key={key} className="space-y-2 p-3 bg-white/50 rounded-lg">
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                            <Sparkles className="size-4 text-blue-600" />
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="pl-6">
                            {renderValue(value, key)}
                        </div>
                    </div>
                );
            });
        }
        return renderValue(data);
    };

    return (
        <div className="space-y-3">
            {/* Texte avant le JSON */}
            {textBefore && (
                <div className="mb-4">
                    <MarkdownText content={textBefore} />
                </div>
            )}

            {/* Contenu JSON formaté */}
            <div className="space-y-3">
                {renderJsonContent()}
            </div>

            {/* Texte après le JSON */}
            {textAfter && (
                <div className="mt-4">
                    <MarkdownText content={textAfter} />
                </div>
            )}
        </div>
    );
}

// Composant pour afficher du texte avec formatage Markdown basique
function MarkdownText({ content }: { content: string }) {
    const formatText = (text: string): JSX.Element[] => {
        const lines = text.split('\n');
        const elements: JSX.Element[] = [];
        let currentParagraph: string[] = [];
        let listItems: string[] = [];
        let inList = false;

        const flushParagraph = () => {
            if (currentParagraph.length > 0) {
                elements.push(
                    <p key={`p-${elements.length}`} className="text-sm leading-relaxed mb-3">
                        {formatInlineElements(currentParagraph.join(' '))}
                    </p>
                );
                currentParagraph = [];
            }
        };

        const flushList = () => {
            if (listItems.length > 0) {
                elements.push(
                    <ul key={`ul-${elements.length}`} className="list-none space-y-2 mb-3 ml-4">
                        {listItems.map((item, idx) => (
                            <li key={idx} className="text-sm leading-relaxed flex items-start gap-2">
                                <span className="text-blue-600 font-bold mt-0.5">•</span>
                                <span>{formatInlineElements(item)}</span>
                            </li>
                        ))}
                    </ul>
                );
                listItems = [];
                inList = false;
            }
        };

        lines.forEach((line) => {
            const trimmedLine = line.trim();

            // Ligne vide
            if (!trimmedLine) {
                flushParagraph();
                flushList();
                return;
            }

            // Liste à puces (*, -, •)
            const listMatch = trimmedLine.match(/^[*\-•]\s+(.+)/);
            if (listMatch) {
                flushParagraph();
                inList = true;
                listItems.push(listMatch[1]);
                return;
            }

            // Si on était dans une liste et qu'on rencontre du texte normal
            if (inList && !listMatch) {
                flushList();
            }

            // Texte normal
            currentParagraph.push(trimmedLine);
        });

        // Flush ce qui reste
        flushParagraph();
        flushList();

        return elements;
    };

    const formatInlineElements = (text: string): (string | JSX.Element)[] => {
        const parts: (string | JSX.Element)[] = [];
        let lastIndex = 0;

        // Regex pour détecter **texte en gras**
        const boldRegex = /\*\*([^*]+)\*\*/g;
        let match;

        while ((match = boldRegex.exec(text)) !== null) {
            // Ajouter le texte avant le match
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }

            // Ajouter le texte en gras
            parts.push(
                <strong key={`bold-${match.index}`} className="font-semibold text-gray-900">
                    {match[1]}
                </strong>
            );

            lastIndex = match.index + match[0].length;
        }

        // Ajouter le reste du texte
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return parts.length > 0 ? parts : [text];
    };

    return <div className="space-y-2">{formatText(content)}</div>;
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
                                    {message.role === 'assistant' ? (
                                        <FormattedResponse content={message.content} />
                                    ) : (
                                        <p className="text-sm leading-relaxed">{message.content}</p>
                                    )}
                                </Card>
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                        <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-end gap-3 max-w-[80%]">
                                <div
                                    className="size-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shrink-0 shadow-lg">
                                    <Sparkles className="size-5 text-white"/>
                                </div>
                                <Card
                                    className="p-4 rounded-2xl border-0 bg-gradient-to-br from-blue-50 to-purple-50 shadow-soft-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <div
                                                className="size-2 rounded-full bg-blue-400 animate-bounce"
                                                style={{animationDelay: '0ms'}}
                                            />
                                            <div
                                                className="size-2 rounded-full bg-blue-400 animate-bounce"
                                                style={{animationDelay: '150ms'}}
                                            />
                                            <div
                                                className="size-2 rounded-full bg-blue-400 animate-bounce"
                                                style={{animationDelay: '300ms'}}
                                            />
                                        </div>
                                        <span className="text-sm text-muted-foreground">Simplify écrit...</span>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Suggested Questions */}
                    {messages.length <= 2 && !isTyping && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3">
                            <p className="text-sm text-muted-foreground font-medium text-center">
                                💡 Questions suggérées
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {suggestedQuestions.map((question, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        className="h-auto p-4 text-left justify-start hover:bg-blue-50/50 hover:border-blue-200 transition-all duration-200 hover:shadow-md group"
                                        onClick={() => handleSend(question)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Sparkles
                                                className="size-4 text-blue-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform"/>
                                            <span className="text-sm leading-relaxed">{question}</span>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input */}
            <div className="relative p-6 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto">
                    <div className="flex gap-3">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Pose-moi une question sur la réglementation..."
                            className="flex-1 h-12 px-4 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                            disabled={isTyping}
                        />
                        <Button
                            onClick={() => handleSend()}
                            disabled={!inputValue.trim() || isTyping}
                            className="h-12 px-6 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1E40AF] hover:to-[#6D28D9] text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="size-5"/>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
