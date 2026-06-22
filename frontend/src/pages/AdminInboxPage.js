import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Inbox, RefreshCw, Search, X, Mail, MailOpen,
  Trash2, Paperclip, ExternalLink, Sparkles, Send, Copy, Check
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (_) { return iso; }
};

const sanitizeFrom = (raw) => {
  if (!raw) return '—';
  // "Name <email@x.y>" → strip
  const match = raw.match(/^(.*?)\s*<(.+@.+)>$/);
  if (match) return { name: match[1].trim() || match[2], email: match[2] };
  return { name: raw, email: raw };
};

const AdminInboxPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | unread | read
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftTone, setDraftTone] = useState('friendly');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const getAuth = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
  });

  const load = async (resetPage = false) => {
    setLoading(true);
    try {
      const nextPage = resetPage ? 1 : page;
      const params = new URLSearchParams({ page: String(nextPage), limit: '25' });
      if (filter !== 'all') params.set('filter_read', filter);
      if (search.trim()) params.set('q', search.trim());
      const res = await axios.get(`${API_URL}/api/admin/inbox?${params.toString()}`, getAuth());
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
      setUnread(res.data.unread || 0);
      setHasMore(res.data.has_more || false);
      if (resetPage) setPage(1);
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin/login');
      else toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('admin_token')) {
      navigate('/admin/login');
      return;
    }
    load();
  }, []);

  useEffect(() => { load(true); /* reset to page 1 on filter change */
  }, [filter]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => load(true), 350);
    return () => clearTimeout(t);
  }, [search]);

  const openEmail = async (item) => {
    setDetailLoading(true);
    setSelected(item); // optimistic show
    setDraftText(''); // reset draft when opening another email
    setCopied(false);
    try {
      const res = await axios.get(
        `${API_URL}/api/admin/inbox/${item.inbound_id}`,
        getAuth()
      );
      setSelected(res.data);
      // Restore last AI draft if any
      if (res.data?.ai_draft) {
        setDraftText(res.data.ai_draft);
        if (res.data.ai_draft_tone) setDraftTone(res.data.ai_draft_tone);
      }
      // Update list (mark as read locally)
      setItems(prev => prev.map(i => i.inbound_id === item.inbound_id ? { ...i, read: true } : i));
      setUnread(u => Math.max(0, u - (item.read ? 0 : 1)));
    } catch (_) {
      toast.error('Impossible de charger l\'email');
    } finally {
      setDetailLoading(false);
    }
  };

  const generateDraft = async () => {
    if (!selected) return;
    setDraftLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/admin/inbox/${selected.inbound_id}/draft-reply`,
        { tone: draftTone },
        { ...getAuth(), timeout: 45000 }
      );
      if (res.data?.is_spam) {
        toast.warning('⚠️ L\'IA détecte cet email comme du SPAM');
        setDraftText('[Cet email semble être du spam — vérifiez avant de répondre]');
      } else {
        setDraftText(res.data?.draft || '');
        toast.success('✨ Brouillon généré');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur génération IA');
    } finally {
      setDraftLoading(false);
    }
  };

  const sendReply = async () => {
    if (!selected || !draftText.trim()) {
      toast.error('Le brouillon est vide');
      return;
    }
    if (!window.confirm(`Envoyer la réponse à ${selected.from} ?`)) return;
    setSending(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/admin/inbox/${selected.inbound_id}/send-reply`,
        { text: draftText, subject: `Re: ${selected.subject || ''}` },
        { ...getAuth(), timeout: 30000 }
      );
      if (res.data?.mocked) {
        toast.warning('⚠️ Réponse simulée (RESEND_API_KEY absent en sandbox)');
      } else {
        toast.success('📤 Réponse envoyée !');
      }
      setDraftText('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur envoi');
    } finally {
      setSending(false);
    }
  };

  const copyDraft = async () => {
    if (!draftText) return;
    try {
      await navigator.clipboard.writeText(draftText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (_) {
      toast.error('Copie impossible');
    }
  };

  const toggleRead = async (item, e) => {
    e?.stopPropagation();
    try {
      const newRead = !item.read;
      await axios.post(
        `${API_URL}/api/admin/inbox/${item.inbound_id}/read`,
        { read: newRead },
        getAuth()
      );
      setItems(prev => prev.map(i => i.inbound_id === item.inbound_id ? { ...i, read: newRead } : i));
      setUnread(u => Math.max(0, u + (newRead ? -1 : 1)));
      if (selected?.inbound_id === item.inbound_id) {
        setSelected(s => s ? { ...s, read: newRead } : s);
      }
    } catch (_) {
      toast.error('Erreur');
    }
  };

  const archiveEmail = async (item, e) => {
    e?.stopPropagation();
    if (!window.confirm('Archiver cet email ?')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/inbox/${item.inbound_id}`, getAuth());
      setItems(prev => prev.filter(i => i.inbound_id !== item.inbound_id));
      setTotal(t => Math.max(0, t - 1));
      if (selected?.inbound_id === item.inbound_id) setSelected(null);
      toast.success('Archivé');
    } catch (_) {
      toast.error('Erreur');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1729] text-white p-4 sm:p-6" data-testid="admin-inbox-page">
      <div className="max-w-7xl mx-auto mb-6">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4">
          <ArrowLeft size={16} /> Retour dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black flex items-center gap-3">
              <span className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF1493]">
                <Inbox size={24} />
              </span>
              Boîte de réception
            </h1>
            <p className="text-white/60 mt-1 text-sm">
              Emails reçus sur <span className="text-white/90 font-mono">contact@nati-fenua.com</span> ·{' '}
              <span className="text-[#FF6B35] font-semibold">{unread} non-lu{unread > 1 ? 's' : ''}</span> · {total} au total
            </p>
          </div>
          <Button
            onClick={() => load(true)}
            variant="outline"
            size="sm"
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            data-testid="inbox-refresh-btn"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin mr-2' : 'mr-2'} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">
        {/* List */}
        <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
          {/* Search + filter */}
          <div className="p-3 border-b border-white/10 space-y-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher (objet, expéditeur, contenu)…"
                className="bg-white/5 border-white/15 text-white placeholder-white/40 pl-9 pr-9"
                data-testid="inbox-search-input"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  aria-label="Effacer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-1.5">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'unread', label: 'Non-lus' },
                { id: 'read', label: 'Lus' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilter(opt.id)}
                  data-testid={`inbox-filter-${opt.id}`}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    filter === opt.id
                      ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
                      : 'bg-transparent text-white/70 border-white/20 hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="max-h-[68vh] overflow-y-auto divide-y divide-white/5">
            {loading && items.length === 0 ? (
              <div className="p-8 text-center text-white/50 text-sm">Chargement…</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-white/50">
                <Inbox size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">Aucun email reçu.</p>
                <p className="text-xs mt-1 opacity-70">Configurez vos MX records Resend pour activer la réception.</p>
              </div>
            ) : (
              items.map(item => {
                const from = sanitizeFrom(item.from);
                const isSelected = selected?.inbound_id === item.inbound_id;
                return (
                  <button
                    key={item.inbound_id}
                    onClick={() => openEmail(item)}
                    className={`w-full text-left p-3 transition-colors hover:bg-white/5 ${
                      isSelected ? 'bg-white/10' : ''
                    } ${!item.read ? 'border-l-2 border-l-[#FF6B35]' : ''}`}
                    data-testid={`inbox-item-${item.inbound_id}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`text-sm truncate ${item.read ? 'text-white/70' : 'text-white font-semibold'}`}>
                            {from.name}
                          </p>
                          {(item.attachments || []).length > 0 && (
                            <Paperclip size={12} className="text-white/40 flex-shrink-0" />
                          )}
                        </div>
                        <p className={`text-sm truncate ${item.read ? 'text-white/50' : 'text-white/90 font-medium'}`}>
                          {item.subject || '(sans sujet)'}
                        </p>
                        <p className="text-xs text-white/40 truncate mt-0.5">
                          {(item.text || '').replace(/\s+/g, ' ').slice(0, 80)}
                        </p>
                      </div>
                      <div className="text-xs text-white/40 whitespace-nowrap pt-0.5">
                        {formatDate(item.created_at).split(' ')[0]}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {(hasMore || page > 1) && (
            <div className="p-2 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
              <span>Page {page}</span>
              <div className="flex gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => { setPage(p => p - 1); setTimeout(load, 0); }}
                  className="px-2 py-1 rounded border border-white/20 disabled:opacity-30"
                >Précédent</button>
                <button
                  disabled={!hasMore}
                  onClick={() => { setPage(p => p + 1); setTimeout(load, 0); }}
                  className="px-2 py-1 rounded border border-white/20 disabled:opacity-30"
                >Suivant</button>
              </div>
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 overflow-hidden min-h-[400px]">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.inbound_id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                <div className="p-5 border-b border-white/10">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h2 className="text-xl font-bold flex-1" data-testid="inbox-detail-subject">
                      {selected.subject || '(sans sujet)'}
                    </h2>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        onClick={(e) => toggleRead(selected, e)}
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                        data-testid="inbox-toggle-read-btn"
                        title={selected.read ? 'Marquer comme non-lu' : 'Marquer comme lu'}
                      >
                        {selected.read ? <Mail size={14} /> : <MailOpen size={14} />}
                      </Button>
                      <Button
                        onClick={(e) => archiveEmail(selected, e)}
                        variant="outline"
                        size="sm"
                        className="bg-red-500/10 border-red-400/30 text-red-300 hover:bg-red-500/20"
                        data-testid="inbox-archive-btn"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex gap-2">
                      <span className="text-white/50 w-12">De :</span>
                      <span className="text-white font-mono break-all">{selected.from || '—'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-white/50 w-12">À :</span>
                      <span className="text-white font-mono break-all">{selected.to || '—'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-white/50 w-12">Date :</span>
                      <span className="text-white/70">{formatDate(selected.created_at)}</span>
                    </div>
                    {(selected.attachments || []).length > 0 && (
                      <div className="flex gap-2 items-start pt-2">
                        <span className="text-white/50 w-12">PJ :</span>
                        <div className="flex flex-wrap gap-2">
                          {(selected.attachments || []).map((a, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-xs">
                              <Paperclip size={12} /> {a.filename || `pièce ${i + 1}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {selected.from && (
                      <a
                        href={`mailto:${(sanitizeFrom(selected.from).email || '').replace(/[<>]/g, '')}?subject=${encodeURIComponent('Re: ' + (selected.subject || ''))}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white text-xs font-semibold hover:opacity-90"
                        data-testid="inbox-reply-btn"
                      >
                        <ExternalLink size={12} /> Répondre
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  {detailLoading ? (
                    <p className="text-white/50 text-sm">Chargement du contenu…</p>
                  ) : selected.html ? (
                    <div
                      className="prose prose-invert max-w-none text-white/90 [&_a]:text-[#FF6B35]"
                      dangerouslySetInnerHTML={{ __html: selected.html }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-sm text-white/90 leading-relaxed">
                      {selected.text || '(contenu vide)'}
                    </pre>
                  )}

                  {/* AI Draft Reply section */}
                  <div className="mt-6 pt-5 border-t border-white/10" data-testid="ai-draft-section">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <h3 className="text-sm font-bold flex items-center gap-2 text-[#FF6B35]">
                        <Sparkles size={16} />
                        Brouillon de réponse IA
                      </h3>
                      <div className="flex gap-1.5 items-center">
                        <select
                          value={draftTone}
                          onChange={(e) => setDraftTone(e.target.value)}
                          className="bg-white/5 border border-white/15 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-[#FF6B35]"
                          data-testid="ai-draft-tone"
                        >
                          <option value="friendly">😊 Amical</option>
                          <option value="formal">👔 Formel</option>
                          <option value="apologetic">🙏 Désolé</option>
                        </select>
                        <Button
                          onClick={generateDraft}
                          disabled={draftLoading}
                          size="sm"
                          className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white hover:opacity-90 disabled:opacity-50"
                          data-testid="ai-draft-generate-btn"
                        >
                          {draftLoading ? (
                            <><RefreshCw size={12} className="animate-spin mr-1" /> Génération…</>
                          ) : (
                            <><Sparkles size={12} className="mr-1" /> Générer</>
                          )}
                        </Button>
                      </div>
                    </div>

                    <Textarea
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      placeholder="Cliquez sur 'Générer' pour créer un brouillon IA, ou rédigez votre réponse manuellement ici…"
                      className="min-h-[180px] bg-white/5 border-white/15 text-white placeholder-white/30 font-mono text-sm leading-relaxed focus:border-[#FF6B35]"
                      data-testid="ai-draft-textarea"
                    />

                    <div className="flex justify-between items-center mt-3 flex-wrap gap-2">
                      <span className="text-xs text-white/40">
                        {draftText.length} caractères · ~{Math.ceil(draftText.split(/\s+/).filter(Boolean).length)} mots
                      </span>
                      <div className="flex gap-2">
                        <Button
                          onClick={copyDraft}
                          disabled={!draftText}
                          variant="outline"
                          size="sm"
                          className="bg-white/5 border-white/20 text-white hover:bg-white/10 disabled:opacity-30"
                          data-testid="ai-draft-copy-btn"
                        >
                          {copied ? <><Check size={12} className="mr-1 text-green-400" /> Copié</>
                                  : <><Copy size={12} className="mr-1" /> Copier</>}
                        </Button>
                        <Button
                          onClick={sendReply}
                          disabled={!draftText.trim() || sending}
                          size="sm"
                          className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90 disabled:opacity-50"
                          data-testid="ai-draft-send-btn"
                        >
                          {sending ? (
                            <><RefreshCw size={12} className="animate-spin mr-1" /> Envoi…</>
                          ) : (
                            <><Send size={12} className="mr-1" /> Envoyer la réponse</>
                          )}
                        </Button>
                      </div>
                    </div>

                    {selected.replied_at && (
                      <p className="text-xs text-emerald-400 mt-2" data-testid="reply-sent-badge">
                        ✓ Réponse envoyée le {formatDate(selected.replied_at)}
                        {selected.reply_mocked && ' (mode test — RESEND_API_KEY absent)'}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center text-white/40 p-8 text-center"
              >
                <div>
                  <Inbox size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Sélectionnez un email pour le lire</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminInboxPage;
