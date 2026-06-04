import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Eye, MousePointer, AlertTriangle, RefreshCw, Inbox, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminEmailStatsPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [sendingDigest, setSendingDigest] = useState(false);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/email/stats?days=${period}`, getAuthHeaders());
      setStats(res.data);
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin/login');
      else toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const triggerDigest = async () => {
    if (!window.confirm('Envoyer le digest hebdo immédiatement à tous les utilisateurs inactifs ?')) return;
    setSendingDigest(true);
    try {
      const res = await axios.post(`${API_URL}/api/admin/digest/send-now`, {}, getAuthHeaders());
      toast.success(`📧 Digest envoyé : ${res.data.sent} emails / ${res.data.failed || 0} échecs`);
      setTimeout(load, 2000);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    } finally {
      setSendingDigest(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('admin_token')) {
      navigate('/admin/login');
      return;
    }
    load();
  }, [period]);

  const totals = stats?.totals || {};
  const rates = stats?.rates || {};
  const events = stats?.recent_events || [];

  return (
    <div className="min-h-screen bg-[#0F1729] text-white p-4 sm:p-6">
      <div className="max-w-6xl mx-auto mb-6">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4">
          <ArrowLeft size={16} /> Retour dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black flex items-center gap-3">
              <span className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <Mail size={24} />
              </span>
              Statistiques Emails
            </h1>
            <p className="text-white/60 mt-1 text-sm">Performance des emails envoyés via Resend</p>
          </div>
          <div className="flex gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(parseInt(e.target.value))}
              data-testid="admin-email-period"
              className="bg-[#16213E] border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
            >
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
            </select>
            <Button onClick={load} variant="outline" data-testid="admin-email-refresh" className="border-white/20 text-white hover:bg-white/10">
              <RefreshCw size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Kpi icon={<Send size={20} />} label="Emails envoyés" value={totals.sent || 0} accent="from-blue-500/20 to-blue-600/20 border-blue-500/30" />
        <Kpi icon={<Eye size={20} />} label="Taux d'ouverture" value={`${rates.open_rate_pct || 0}%`} subtitle={`${totals.opened || 0} ouverts`} accent="from-emerald-500/20 to-emerald-600/20 border-emerald-500/30" />
        <Kpi icon={<MousePointer size={20} />} label="Taux de clic" value={`${rates.click_rate_pct || 0}%`} subtitle={`${totals.clicked || 0} clics`} accent="from-cyan-500/20 to-cyan-600/20 border-cyan-500/30" />
        <Kpi icon={<AlertTriangle size={20} />} label="Taux de rebond" value={`${rates.bounce_rate_pct || 0}%`} subtitle={`${totals.bounced || 0} échecs`} accent="from-orange-500/20 to-red-500/20 border-orange-500/30" />
      </div>

      {/* Quick actions */}
      <div className="max-w-6xl mx-auto mb-6 bg-purple-500/10 border border-purple-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="font-bold mb-1 flex items-center gap-2"><Send size={18} /> Digest hebdomadaire</h2>
          <p className="text-sm text-white/70">Envoie le récap de la semaine à tous les utilisateurs inactifs depuis 3+ jours.</p>
        </div>
        <Button
          onClick={triggerDigest}
          disabled={sendingDigest}
          data-testid="admin-trigger-digest"
          className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white font-bold"
        >
          {sendingDigest ? 'Envoi…' : 'Envoyer maintenant'}
        </Button>
      </div>

      {/* Recent events */}
      <div className="max-w-6xl mx-auto bg-[#16213E] rounded-2xl border border-white/10 overflow-hidden">
        <h2 className="text-sm font-bold p-4 border-b border-white/5 uppercase tracking-wider text-white/70 flex items-center gap-2">
          <Inbox size={16} /> Derniers événements
        </h2>
        {loading ? (
          <div className="p-12 text-center text-white/50">Chargement…</div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-white/50">
            Aucun événement reçu.<br />
            <p className="text-xs mt-2">Configure le webhook Resend sur ton dashboard Resend → Webhooks → URL : <code className="text-[#FF6B35]">https://api.nati-fenua.com/api/webhook/resend</code></p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {events.map((e, i) => (
              <EventRow key={i} event={e} />
            ))}
          </div>
        )}
      </div>

      {/* Setup help */}
      <div className="max-w-6xl mx-auto mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-sm">
        <p className="font-semibold mb-2 text-blue-300">📋 Configuration du webhook Resend</p>
        <ol className="space-y-1 text-white/70 list-decimal list-inside">
          <li>Va sur <a href="https://resend.com/webhooks" target="_blank" rel="noopener noreferrer" className="text-[#FF6B35] underline">resend.com/webhooks</a></li>
          <li>+ Add Webhook → URL : <code className="text-[#FF6B35]">https://api.nati-fenua.com/api/webhook/resend</code></li>
          <li>Coche tous les événements (sent, delivered, opened, clicked, bounced, complained)</li>
          <li>Copie le <strong>Signing Secret</strong> et mets-le dans Render → Env Var : <code>RESEND_WEBHOOK_SECRET</code></li>
        </ol>
      </div>
    </div>
  );
};

const Kpi = ({ icon, label, value, subtitle, accent }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`bg-gradient-to-br ${accent} border rounded-2xl p-4`}>
    <div className="flex items-center gap-2 text-white/70 text-xs uppercase tracking-wider mb-2">
      {icon} <span>{label}</span>
    </div>
    <p className="text-2xl sm:text-3xl font-black">{value}</p>
    {subtitle && <p className="text-xs text-white/50 mt-1">{subtitle}</p>}
  </motion.div>
);

const EVENT_STYLES = {
  'email.sent':       { color: 'text-blue-400', icon: '📤', label: 'Envoyé' },
  'email.delivered':  { color: 'text-emerald-400', icon: '✓', label: 'Délivré' },
  'email.opened':     { color: 'text-cyan-400', icon: '👁', label: 'Ouvert' },
  'email.clicked':    { color: 'text-purple-400', icon: '🖱', label: 'Cliqué' },
  'email.bounced':    { color: 'text-red-400', icon: '⚠️', label: 'Rebond' },
  'email.complained': { color: 'text-orange-400', icon: '🚫', label: 'Plainte' }
};

const EventRow = ({ event }) => {
  const style = EVENT_STYLES[event.event_type] || { color: 'text-white/60', icon: '•', label: event.event_type };
  return (
    <div className="p-3 sm:p-4 flex items-center gap-3 hover:bg-white/5">
      <div className={`text-lg ${style.color} w-8 flex-shrink-0`}>{style.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{event.to || '—'}</p>
        <p className="text-xs text-white/50 truncate">{event.subject || '—'}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-xs font-bold ${style.color}`}>{style.label}</p>
        <p className="text-[10px] text-white/40">{event.created_at ? new Date(event.created_at).toLocaleString('fr-FR') : ''}</p>
      </div>
    </div>
  );
};

export default AdminEmailStatsPage;
