import {useState, useEffect, JSX} from 'react';
import {Card} from './ui/card';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Send, Sparkles} from 'lucide-react';
import {chatMessages, suggestedQuestions} from '../lib/mockData';
import {getSettings} from '../services/settingsService';

import {AI_ASSISTANT_URL} from '../config/api';

const API_URL = AI_ASSISTANT_URL;

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

// Fonction pour détecter et parser le JSON dans une réponse
function parseResponseContent(content: string): {
    isJson: boolean;
    data: any;
    formatted: string;
    textBefore: string;
    textAfter: string
} {
    // Nettoyer les préfixes inutiles
    let cleanedContent = content
        .replace(/^Reponse Brute\s*/i, '')  // Enlever "Reponse Brute"
        .replace(/^Réponse\s*:\s*/i, '')    // Enlever "Réponse :"
        .trim();

    // Chercher des blocs JSON dans le texte (avec ```json ou sans)
    const jsonBlockMatch = cleanedContent.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonMatch = jsonBlockMatch ? jsonBlockMatch[1] : cleanedContent.match(/(\{[\s\S]*}|\[[\s\S]*])/)?.[1];

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
        return {isJson: true, data: parsed, formatted: cleanedContent, textBefore: '', textAfter: ''};
    } catch {
        return {isJson: false, data: null, formatted: cleanedContent, textBefore: '', textAfter: ''};
    }
}

// Composant pour afficher une réponse formatée
function FormattedResponse({content}: { content: string }) {
    const {isJson, data, formatted, textBefore, textAfter} = parseResponseContent(content);

    if (!isJson) {
        // Formater le texte avec support Markdown basique
        return <MarkdownText content={formatted}/>;
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
                            {renderValue(v)}
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
                            <Sparkles className="size-4 text-blue-600"/>
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="pl-6">
                            {renderValue(value)}
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
                    <MarkdownText content={textBefore}/>
                </div>
            )}

            {/* Contenu JSON formaté */}
            <div className="space-y-3">
                {renderJsonContent()}
            </div>

            {/* Texte après le JSON */}
            {textAfter && (
                <div className="mt-4">
                    <MarkdownText content={textAfter}/>
                </div>
            )}
        </div>
    );
}

// Composant pour afficher du texte avec formatage Markdown basique
function MarkdownText({content}: { content: string }) {
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
        setIsTyping(true); // Affiche "Optimious écrit..."

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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex-1 overflow-y-auto">
                <div className="p-12 animate-in fade-in duration-500">
                    <div className="max-w-7xl mx-auto">
                        {/* Header EXACTEMENT comme démarches */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 shadow-lg">
                                    <img
                                        src="/img.png"
                                        alt="Optimious Bot"
                                        className="w-12 h-12 object-contain"
                                        style={{filter: 'drop-shadow(0 0 2px rgba(37, 99, 235, 0.3))'}}
                                    />
                                </div>
                                <h1 className="text-3xl tracking-tight font-bold">Assistant IA</h1>
                            </div>
                            <div className="h-1.5 w-40 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-4 shadow-lg" />
                        </div>
                        {/* Sous-titre déplacé sous le header, comme une intro optionnelle */}
                        <div className="-mt-4 mb-8">
                            <p className="text-muted-foreground font-medium">
                                Bonjour {userFirstName}, je suis prêt à t'aider dans ta paperasse !
                            </p>
                        </div>

                        {/* Messages */}
                        <div className="space-y-6 pb-6">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
                        >
                            <div
                                className={`flex items-end gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                {message.role === 'assistant' && (
                                    <div
                                        className="size-10 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shrink-0 shadow-lg p-1.5">
                                        <img
                                            src="/img.png"
                                            alt="Optimious Bot"
                                            className="w-full h-full object-contain rounded-2xl"
                                            style={{filter: 'drop-shadow(0 0 2px rgba(37, 99, 235, 0.3))'}}
                                        />
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
                                        <FormattedResponse content={message.content}/>
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
                                    className="size-10 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shrink-0 shadow-lg p-1.5">
                                    <img
                                        src="/img.png"
                                        alt="Optimious Bot"
                                        className="w-full h-full object-contain rounded-2xl"
                                        style={{filter: 'drop-shadow(0 0 2px rgba(37, 99, 235, 0.3))'}}
                                    />
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
                                        <span className="text-sm text-muted-foreground">Optimious écrit...</span>
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
                </div>
            </div>

            {/* Input fixé en bas */}
            <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-8 pb-8 px-12">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-lg flex gap-3 items-center px-6 py-3 border border-gray-200">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Pose-moi une question sur la réglementation..."
                            className="flex-1 h-12 px-4 bg-transparent border-0 focus:ring-0 focus:outline-none"
                            disabled={isTyping}
                        />
                        <Button
                            onClick={() => handleSend()}
                            disabled={!inputValue.trim() || isTyping}
                            className="h-10 w-12 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1E40AF] hover:to-[#6D28D9] text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            <Send className="size-5"/>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
