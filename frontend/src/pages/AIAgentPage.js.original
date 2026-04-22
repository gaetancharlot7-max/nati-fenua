import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Send, Loader2, Code, Bug, Sparkles, Trash2, Plus, History, 
  ChevronLeft, Copy, Check, Shield, Zap, FileText, AlertTriangle,
  Download, RefreshCw, Settings, Terminal, Search, Filter
} from 'lucide-react';
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
  const [adminEmail, setAdminEmail] = useState('admin');
  const [activeTab, setActiveTab] = useState('chat');
  const [auditType, setAuditType] = useState('code_quality');
  const [emergentReports, setEmergentReports] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem('admin_email');
    if (storedEmail) setAdminEmail(storedEmail);
    
    const userId = user?.user_id || storedEmail || 'admin';
    const newSessionId = `chat_${userId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now().toString(36)}`;
    setSessionId(newSessionId);
    
    loadSessions();
    loadEmergentReports();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
    'Content-Type': 'application/json'
  });

  const loadSessions = async () => {
    try {
      const res = await fetch(`${API}/api/ai/sessions`, {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadEmergentReports = async () => {
    try {
      const res = await fetch(`${API}/api/ai/reports`, {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setEmergentReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const loadSession = async (sid) => {
    setSessionId(sid);
    try {
      const res = await fetch(`${API}/api/ai/history/${sid}`, {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const formattedMessages = data.history.flatMap(h => [
          { role: 'user', content: h.user_message },
          { role: 'assistant', content: h.ai_response, report: h.emergent_report }
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
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response,
          report: data.emergent_report
        }]);
        loadSessions();
        if (data.emergent_report) loadEmergentReports();
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
        content: 'Erreur de connexion au serveur. Veuillez reessayer.' 
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const runAudit = async () => {
    if (loading) return;
    setLoading(true);
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: `Lancer un audit: ${auditType}` 
    }]);

    try {
      const res = await fetch(`${API}/api/ai/audit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          audit_type: auditType,
          session_id: sessionId
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response,
          report: data.emergent_report
        }]);
        if (data.emergent_report) loadEmergentReports();
      } else {
        toast.error(data.error || 'Erreur lors de l\'audit');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const exportReports = async () => {
    try {
      const res = await fetch(`${API}/api/ai/export`, {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emergent_reports_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Rapports exportes avec succes');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  const startNewSession = () => {
    const userId = user?.user_id || adminEmail;
    const newSessionId = `chat_${userId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now().toString(36)}`;
    setSessionId(newSessionId);
    setMessages([]);
    toast.success('Nouvelle conversation demarree');
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Copie dans le presse-papiers');
  };

  const quickActions = [
    { icon: Bug, label: 'Analyser un bug', prompt: 'Analyse ce bug en detail:\n\nErreur: ', color: 'red' },
    { icon: Shield, label: 'Audit securite', prompt: 'Effectue un audit de securite complet sur ', color: 'blue' },
    { icon: Zap, label: 'Optimiser performance', prompt: 'Analyse et optimise les performances de ', color: 'yellow' },
    { icon: Code, label: 'Generer du code', prompt: 'Genere du code production-ready pour ', color: 'green' },
    { icon: FileText, label: 'Rapport Emergent', prompt: 'Genere un rapport detaille pour Emergent concernant ', color: 'purple' },
    { icon: Terminal, label: 'Debug avance', prompt: 'Mode debug avance - Analyse ce stack trace:\n\n', color: 'orange' },
  ];

  const auditTypes = [
    { id: 'security', label: 'Securite', icon: Shield },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'code_quality', label: 'Qualite Code', icon: Code },
    { id: 'accessibility', label: 'Accessibilite', icon: FileText },
  ];

  const formatMessage = (content) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
        const lang = match?.[1] || '';
        const code = match?.[2] || part.replace(/```\w*\n?/g, '').replace(/```$/g, '');
        
        return (
          <div key={i} className="relative my-3">
            {lang && (
              <div className="absolute top-0 left-0 px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-tl-xl rounded-br-lg">
                {lang}
              </div>
            )}
            <pre className="bg-[#1A1A2E] text-green-400 p-4 pt-8 rounded-xl overflow-x-auto text-sm font-mono">
              <code>{code}</code>
            </pre>
            <button
              onClick={() => copyToClipboard(code, `code-${i}`)}
              className="absolute top-2 right-2 p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              {copiedIndex === `code-${i}` ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
            </button>
          </div>
        );
      }
      
      // Format headers, bold, lists
      const lines = part.split('\n').map((line, j) => {
        if (line.startsWith('## ')) {
          return <h2 key={j} className="text-lg font-bold mt-4 mb-2 text-[#FF6B35]">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={j} className="text-md font-semibold mt-3 mb-1">{line.slice(4)}</h3>;
        }
        if (line.startsWith('- [ ]')) {
          return <div key={j} className="flex items-center gap-2 ml-4"><span className="w-4 h-4 border border-gray-400 rounded"></span><span>{line.slice(6)}</span></div>;
        }
        if (line.startsWith('- [x]')) {
          return <div key={j} className="flex items-center gap-2 ml-4"><Check size={16} className="text-green-500" /><span>{line.slice(6)}</span></div>;
        }
        if (line.startsWith('- ')) {
          return <div key={j} className="ml-4">• {line.slice(2)}</div>;
        }
        if (line.match(/^\d+\.\s/)) {
          return <div key={j} className="ml-4">{line}</div>;
        }
        
        // Bold text
        const formatted = line.split(/(\*\*.*?\*\*)/g).map((segment, k) => {
          if (segment.startsWith('**') && segment.endsWith('**')) {
            return <strong key={k} className="text-[#FF6B35]">{segment.slice(2, -2)}</strong>;
          }
          return segment;
        });
        
        return <div key={j}>{formatted}</div>;
      });
      
      return <div key={i} className="space-y-1">{lines}</div>;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F1A] via-[#1A1A2E] to-[#16213E] flex">
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="w-80 bg-[#0D0D15] border-r border-white/10 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <Button
                onClick={startNewSession}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white font-semibold"
              >
                <Plus size={18} className="mr-2" />
                Nouvelle session
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'chat' ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]' : 'text-white/50 hover:text-white/70'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'audit' ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]' : 'text-white/50 hover:text-white/70'
                }`}
              >
                Audits
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'reports' ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]' : 'text-white/50 hover:text-white/70'
                }`}
              >
                Rapports
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-3">
              {activeTab === 'chat' && (
                <>
                  <h3 className="text-xs font-semibold text-white/40 uppercase mb-2 px-2 flex items-center gap-1">
                    <History size={14} />
                    Historique
                  </h3>
                  {sessions.length === 0 ? (
                    <p className="text-sm text-white/40 px-2">Aucune conversation</p>
                  ) : (
                    sessions.map((session) => (
                      <button
                        key={session._id}
                        onClick={() => loadSession(session._id)}
                        className={`w-full text-left p-3 rounded-xl mb-1 transition-colors ${
                          sessionId === session._id 
                            ? 'bg-gradient-to-r from-[#FF6B35]/20 to-[#FF1493]/20 border border-[#FF6B35]/30' 
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <p className="text-sm font-medium text-white truncate">
                          {session.last_message?.slice(0, 35)}...
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                          {session.message_count} messages
                        </p>
                      </button>
                    ))
                  )}
                </>
              )}

              {activeTab === 'audit' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-white/40 uppercase mb-2 px-2">
                    Type d'audit
                  </h3>
                  {auditTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setAuditType(type.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        auditType === type.id 
                          ? 'bg-gradient-to-r from-[#FF6B35]/20 to-[#FF1493]/20 border border-[#FF6B35]/30' 
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <type.icon size={18} className={auditType === type.id ? 'text-[#FF6B35]' : 'text-white/50'} />
                      <span className={auditType === type.id ? 'text-white font-medium' : 'text-white/70'}>
                        {type.label}
                      </span>
                    </button>
                  ))}
                  <Button
                    onClick={runAudit}
                    disabled={loading}
                    className="w-full mt-4 bg-gradient-to-r from-purple-500 to-blue-500"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Shield size={18} className="mr-2" />}
                    Lancer l'audit
                  </Button>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <h3 className="text-xs font-semibold text-white/40 uppercase">
                      Rapports Emergent
                    </h3>
                    <button
                      onClick={exportReports}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                      title="Exporter les rapports"
                    >
                      <Download size={14} className="text-white/50" />
                    </button>
                  </div>
                  {emergentReports.length === 0 ? (
                    <p className="text-sm text-white/40 px-2">Aucun rapport genere</p>
                  ) : (
                    emergentReports.slice(0, 10).map((report, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono text-[#FF6B35]">
                            {report.emergent_report?.bug_id || report.emergent_report?.audit_id || 'REPORT'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            report.emergent_report?.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                            report.emergent_report?.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            report.emergent_report?.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {report.emergent_report?.severity || report.message_type}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 truncate">
                          {report.emergent_report?.root_cause || report.emergent_report?.component || '-'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-[#0D0D15]/80 backdrop-blur-xl border-b border-white/10 p-4 flex items-center gap-4">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className={`text-white transition-transform ${!showSidebar ? 'rotate-180' : ''}`} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] flex items-center justify-center shadow-lg shadow-[#FF6B35]/20">
              <Bot size={28} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">Agent IA Master Developer</h1>
              <p className="text-xs text-white/50">Expert Full-Stack • Audit • Debug • Code Gen</p>
            </div>
          </div>
          
          <div className="ml-auto flex items-center gap-3">
            <span className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-xs font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              GPT-4o Actif
            </span>
            <button
              onClick={loadEmergentReports}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Rafraichir"
            >
              <RefreshCw size={18} className="text-white/50" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] flex items-center justify-center mb-8 shadow-2xl shadow-[#FF6B35]/30">
                <Bot size={48} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Agent IA Master Developer
              </h2>
              <p className="text-white/50 mb-10 max-w-lg">
                Expert en diagnostics de bugs, audits de code, generation de solutions et rapports detailles pour Emergent.
                Je connais l'integralite de l'architecture Nati Fenua.
              </p>
              
              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(action.prompt)}
                    className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-[#FF6B35]/50 hover:bg-white/10 transition-all group"
                  >
                    <div className={`p-2 rounded-xl bg-${action.color}-500/20`}>
                      <action.icon size={20} className={`text-${action.color}-400 group-hover:text-${action.color}-300`} />
                    </div>
                    <span className="text-sm font-medium text-white/70 group-hover:text-white">{action.label}</span>
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
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-[#FF6B35] to-[#FF1493] flex items-center justify-center">
                        <Bot size={14} className="text-white" />
                      </div>
                      <span className="text-xs text-white/40">Agent IA</span>
                      {msg.report && (
                        <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                          Rapport genere
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    className={`p-5 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white'
                        : 'bg-[#0D0D15] border border-white/10 text-white'
                    }`}
                  >
                    <div className="text-sm leading-relaxed">
                      {msg.role === 'assistant' ? formatMessage(msg.content) : msg.content}
                    </div>
                  </div>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => copyToClipboard(msg.content, i)}
                        className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1"
                      >
                        {copiedIndex === i ? <Check size={12} /> : <Copy size={12} />}
                        Copier
                      </button>
                      {msg.report && (
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(msg.report, null, 2), `report-${i}`)}
                          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                        >
                          <FileText size={12} />
                          Copier rapport JSON
                        </button>
                      )}
                    </div>
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
              <div className="bg-[#0D0D15] border border-white/10 p-5 rounded-2xl">
                <div className="flex items-center gap-3 text-white/50">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-sm">Analyse en cours...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#0D0D15]/80 backdrop-blur-xl border-t border-white/10">
          <form onSubmit={sendMessage} className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Decris ton probleme, demande un audit ou genere du code..."
                className="w-full bg-white/5 border-white/10 focus:border-[#FF6B35] rounded-xl py-6 pl-4 pr-12 text-white placeholder:text-white/30"
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white rounded-xl px-8 py-6 font-semibold"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </Button>
          </form>
          <p className="text-xs text-white/30 text-center mt-3">
            Agent Master Developer • GPT-4o • Rapports Emergent automatiques
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAgentPage;
