import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Button } from "./Button";
import { Input } from "./Input";
import { Card } from "./Card";
import { chatWithAI } from "../../lib/ai";
import { useData } from "../../context/DataContext";
import { marked } from 'marked';

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "model", content: "Hi! I'm your AI Tutor. Ask me anything about what you're learning!" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  const location = useLocation();
  const { topic: topicSlug } = useParams(); // Note: This might not work outside of Routes if not handled carefully, but Layout is inside Router.
  const { topics } = useData();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Determine context based on current route
  const getContext = () => {
    if (location.pathname.startsWith('/ladder/')) {
        // Extract slug from path if useParams doesn't work as expected in this context
        const slug = location.pathname.split('/ladder/')[1];
        const currentTopic = topics.find(t => t.slug === slug);
        if (currentTopic) {
            return `The user is currently studying the topic "${currentTopic.title}" at the "${currentTopic.progress}" level. Answer questions relevant to this topic and level.`;
        }
    }
    return "The user is browsing the Concept Ladder app.";
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    const context = getContext();
    // Filter out the initial greeting from history sent to API if needed, or keep it.
    // We pass previous messages as history.
    const history = messages.slice(1); 

    const response = await chatWithAI(userMessage, history, context);

    setMessages(prev => [...prev, { role: "model", content: response }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end gap-4">
      {isOpen && (
        <Card className="w-[calc(100vw-2rem)] sm:w-96 max-w-sm h-[480px] max-h-[75vh] flex flex-col shadow-2xl border-primary/20 animate-in slide-in-from-bottom-10 fade-in duration-300">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-primary/5 rounded-t-xl flex justify-between items-center">
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">smart_toy</span>
                <h3 className="font-bold text-gray-900 dark:text-white">AI Tutor</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-white dark:bg-background-dark">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                        msg.role === 'user' 
                            ? 'bg-primary text-white rounded-br-none' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'
                    }`}>
                        <div 
                            className="prose prose-sm dark:prose-invert max-w-none break-words"
                            dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }}
                        />
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2 rounded-bl-none flex gap-1 items-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-background-dark rounded-b-xl">
            <div className="flex gap-2">
                <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask a question..."
                    className="flex-1"
                    disabled={isLoading}
                />
                <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon" className="shrink-0">
                    <span className="material-symbols-outlined">send</span>
                </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Toggle Button */}
      <Button 
        onClick={() => setIsOpen(!isOpen)} 
        className="rounded-full h-14 w-14 shadow-lg p-0 flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-2xl">
            {isOpen ? 'close' : 'chat_bubble'}
        </span>
      </Button>
    </div>
  );
}
