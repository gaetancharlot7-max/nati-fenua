import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Loader2, Code, Bug, Sparkles, Trash2, Plus, History, ChevronLeft, Copy, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const AIAgentPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadSessions();
    // Start a new session
    const newSessionId = `chat_${user?.user_id}_${Date.now().toString(36)}`;
    setSessionId(newSessionId);
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    try {
      const res = await fetch(`${API}/api/ai/sessions`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadSession = async (sid) => {
    setSessionId(sid);
    try {
      const res = await fetch(`${API}/api/ai/history/${sid}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        const formattedMessages = data.history.flatMap(h => [
          { role: 'user', content: h.user_message },
          { role: 'assistant', content: h.ai_response }
        ]);
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        loadSessions(); // Refresh sessions list
      } else {
        toast.error(data.error || 'Erreur de communication avec l\'agent');
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Erreur: ${data.error || 'Impossible de communiquer avec l\'agent IA'}` 
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur de connexion');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Erreur de connexion au serveur. Veuillez réessayer.' 
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const startNewSession = () => {
    const newSessionId = `chat_${user?.user_id}_${Date.now().toString(36)}`;
    setSessionId(newSessionId);
    setMessages([]);
    toast.success('Nouvelle conversation démarrée');
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Copié dans le presse-papiers');
  };

  const quickActions = [
    { icon: Bug, label: 'Analyser un bug', prompt: 'J\'ai un bug à analyser. Voici l\'erreur: ' },
    { icon: Code, label: 'Générer du code', prompt: 'Génère du code pour: ' },
    { icon: Sparkles, label: 'Améliorer une feature', prompt: 'Suggère des améliorations pour: ' },
  ];

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```(\w+)?\n?/g, '').replace(/```$/g, '');
        return (
          <div key={i} className="relative my-3">
            <pre className="bg-[#1A1A2E] text-white p-4 rounded-xl overflow-x-auto text-sm">
              <code>{code}</code>
            </pre>
            <button
              onClick={() => copyToClipboard(code, `code-${i}`)}
              className="absolute top-2 right-2 p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              {copiedIndex === `code-${i}` ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        );
      }
      
      // Format bold text
      const formatted = part.split(/(\*\*.*?\*\*)/g).map((segment, j) => {
        if (segment.startsWith('**') && segment.endsWith('**')) {
          return <strong key={j}>{segment.slice(2, -2)}</strong>;
        }
        return segment;
      });
      
      return <span key={i}>{formatted}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F0] to-[#FFE5E0] flex">
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="w-72 bg-white border-r border-gray-200 flex flex-col"
          >
            <div className="p-4 border-b border-gray-100">
              <Button
                onClick={startNewSession}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white"
              >
                <Plus size={18} className="mr-2" />
                Nouvelle conversation
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">
                <History size={14} className="inline mr-1" />
                Historique
              </h3>
              {sessions.length === 0 ? (
                <p className="text-sm text-gray-400 px-2">Aucune conversation</p>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session._id}
                    onClick={() => loadSession(session._id)}
                    className={`w-full text-left p-3 rounded-xl mb-1 transition-colors ${
                      sessionId === session._id 
                        ? 'bg-gradient-to-r from-[#FF6B35]/10 to-[#FF1493]/10 border border-[#FF6B35]/20' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {session.last_message?.slice(0, 40)}...
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {session.message_count} messages
                    </p>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-4">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className={`transition-transform ${!showSidebar ? 'rotate-180' : ''}`} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] flex items-center justify-center">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800">Agent IA Nati Fenua</h1>
              <p className="text-xs text-gray-500">Assistant de développement GPT-5.2</p>
            </div>
          </div>
          
          <div className="ml-auto">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              En ligne
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] flex items-center justify-center mb-6">
                <Bot size={40} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Bonjour {user?.name?.split(' ')[0]} !
              </h2>
              <p className="text-gray-500 mb-8 max-w-md">
                Je suis ton assistant de développement pour Nati Fenua. 
                Je connais toute l'architecture de l'application et je peux t'aider à corriger des bugs, 
                améliorer des features ou générer du code.
              </p>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 justify-center">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(action.prompt)}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 hover:border-[#FF6B35] hover:bg-[#FF6B35]/5 transition-all"
                  >
                    <action.icon size={18} className="text-[#FF6B35]" />
                    <span className="text-sm font-medium text-gray-700">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.role === 'assistant' ? formatMessage(msg.content) : msg.content}
                    </div>
                  </div>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => copyToClipboard(msg.content, i)}
                      className="mt-1 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                    >
                      {copiedIndex === i ? <Check size={12} /> : <Copy size={12} />}
                      Copier
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
          
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-gray-200 p-4 rounded-2xl">
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">L'agent réfléchit...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={sendMessage} className="flex gap-3">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Décris ton problème ou ta demande..."
              className="flex-1 bg-gray-50 border-gray-200 focus:border-[#FF6B35] rounded-xl"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white rounded-xl px-6"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </Button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-2">
            Agent alimenté par GPT-5.2 - Contexte: Architecture complète Nati Fenua
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAgentPage;
