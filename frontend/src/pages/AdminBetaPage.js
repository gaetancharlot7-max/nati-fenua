import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Rocket, Mail, Check, Award, ExternalLink, RefreshCw, ArrowLeft, Send, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const DEFAULT_TEST_LINK = 'https://play.google.com/apps/testing/com.natifenua.app';

const StatusBadge = ({ status }) => {
  const map = {
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'En attente' },
    accepted: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Email envoyé' },
    awarded: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Pionnier ✓' },
    rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Refusée' }
  };
  const s = map[status] || map.pending;
  return <span className={`px-2 py-1 rounded-lg text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
};

const AdminBetaPage = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ total: 0, accepted: 0, awarded: 0, remaining_slots: 50 });
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [testLink, setTestLink] = useState(DEFAULT_TEST_LINK);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/beta/applications`, getAuthHeaders());
      setApplications(res.data.applications || []);
      setStats(res.data.stats || stats);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/admin/login');
      } else {
        toast.error('Erreur de chargement');
      }
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

  const handleApprove = async (app) => {
    setActionInProgress(app.application_id);
    try {
      const res = await axios.post(
        `${API_URL}/api/admin/beta/approve`,
        { application_id: app.application_id, test_link: testLink },
        getAuthHeaders()
      );
      if (res.data.email_sent) {
        toast.success(`📧 Email envoyé à ${app.email}`);
      } else {
        toast.warning('Approuvé, mais email non envoyé (Resend non configuré)');
      }
      await load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de l\'approbation');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAwardPionnier = async (app) => {
    setActionInProgress(app.application_id);
    try {
      await axios.post(
        `${API_URL}/api/admin/beta/award-pionnier`,
        { email: app.google_email || app.email },
        getAuthHeaders()
      );
      toast.success(`🚀 Badge Pionnier attribué à ${app.name}`);
      await load();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Erreur';
      if (detail.includes('introuvable')) {
        toast.error(`${app.name} doit d'abord créer son compte sur Nati Fenua avec ${app.google_email || app.email}`);
      } else {
        toast.error(detail);
      }
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4">
          <ArrowLeft size={16} /> Retour au dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black flex items-center gap-3">
              <span className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9400D3] via-[#FF1493] to-[#FF6B35]">
                <Rocket size={24} />
              </span>
              Programme Pionniers
            </h1>
            <p className="text-white/60 mt-1 text-sm">Gestion des bêta-testeurs Google Play Closed Testing</p>
          </div>
          <Button
            onClick={load}
            variant="outline"
            data-testid="admin-beta-refresh"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw size={16} className="mr-2" /> Actualiser
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Candidatures" value={stats.total} accent="from-blue-500/20 to-blue-600/20 border-blue-500/30" />
        <Stat label="Acceptées (email envoyé)" value={stats.accepted} accent="from-cyan-500/20 to-cyan-600/20 border-cyan-500/30" />
        <Stat label="Badge Pionnier" value={stats.awarded} accent="from-emerald-500/20 to-emerald-600/20 border-emerald-500/30" />
        <Stat label="Places restantes" value={stats.remaining_slots} accent="from-pink-500/20 to-pink-600/20 border-pink-500/30" />
      </div>

      {/* Test link config */}
      <div className="max-w-6xl mx-auto mb-6 bg-[#16213E] border border-white/10 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold mb-1">Lien Google Play Closed Testing</p>
            <p className="text-xs text-white/50 mb-2">Récupéré dans Play Console → Closed testing → Tester Opt-in URL</p>
            <Input
              value={testLink}
              onChange={(e) => setTestLink(e.target.value)}
              data-testid="admin-beta-test-link"
              className="bg-white/10 border-white/20 text-white text-sm"
              placeholder="https://play.google.com/apps/testing/..."
            />
          </div>
          <p className="text-xs text-white/50 sm:max-w-xs">
            Ce lien sera inclus dans l'email envoyé aux candidats que tu approuves.
          </p>
        </div>
      </div>

      {/* Applications list */}
      <div className="max-w-6xl mx-auto bg-[#16213E] rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-white/50">Chargement…</div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-white/50">
            <Mail size={40} className="mx-auto mb-3 opacity-30" />
            Aucune candidature pour l'instant.
            <p className="text-sm mt-2">
              Partage <Link to="/beta-test" className="text-[#FF6B35] underline">/beta-test</Link> sur tes réseaux pour recruter tes 12 testeurs.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {applications.map((app) => (
              <ApplicationRow
                key={app.application_id}
                app={app}
                onApprove={handleApprove}
                onAward={handleAwardPionnier}
                inProgress={actionInProgress === app.application_id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Help */}
      <div className="max-w-6xl mx-auto mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-sm">
        <p className="font-semibold mb-2 text-purple-300">📋 Workflow</p>
        <ol className="space-y-1 text-white/70 list-decimal list-inside">
          <li>Le candidat remplit <code className="text-[#FF6B35]">/beta-test</code> → status <strong>En attente</strong></li>
          <li>Tu cliques <strong>Approuver & envoyer email</strong> → email Resend automatique avec le lien Closed Testing → status <strong>Email envoyé</strong></li>
          <li>Le candidat installe l'app via Play Store et utilise pendant 14 jours</li>
          <li>Une fois validé par Google, tu cliques <strong>Attribuer Pionnier</strong> → badge à vie sur son profil</li>
        </ol>
      </div>
    </div>
  );
};

const Stat = ({ label, value, accent }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-gradient-to-br ${accent} border rounded-2xl p-4`}
  >
    <p className="text-3xl font-black">{value}</p>
    <p className="text-xs text-white/60 mt-1">{label}</p>
  </motion.div>
);

const ApplicationRow = ({ app, onApprove, onAward, inProgress }) => {
  const isPending = app.status === 'pending';
  const isAccepted = app.status === 'accepted';
  const isAwarded = app.status === 'awarded';

  return (
    <div className="p-4 sm:p-5 hover:bg-white/5 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate">{app.name}</h3>
            <StatusBadge status={app.status} />
          </div>
          <div className="text-sm text-white/60 mt-1 space-y-0.5">
            <p className="truncate"><Mail size={12} className="inline mr-1.5" />{app.email}</p>
            <p className="truncate text-xs">Google : {app.google_email}</p>
            {app.device && <p className="text-xs">📱 {app.device}</p>}
            {app.motivation && <p className="text-xs italic text-white/40 mt-1">"{app.motivation}"</p>}
          </div>
          <p className="text-[10px] text-white/40 mt-2">
            Reçue {new Date(app.created_at).toLocaleString('fr-FR')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:w-auto">
          {isPending && (
            <Button
              onClick={() => onApprove(app)}
              disabled={inProgress}
              data-testid={`admin-beta-approve-${app.application_id}`}
              className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white"
              size="sm"
            >
              <Send size={14} className="mr-1.5" />
              {inProgress ? 'Envoi…' : 'Approuver & envoyer email'}
            </Button>
          )}
          {isAccepted && (
            <Button
              onClick={() => onAward(app)}
              disabled={inProgress}
              data-testid={`admin-beta-award-${app.application_id}`}
              className="bg-gradient-to-r from-[#9400D3] via-[#FF1493] to-[#FF6B35] text-white"
              size="sm"
            >
              <Award size={14} className="mr-1.5" />
              {inProgress ? '…' : 'Attribuer Pionnier'}
            </Button>
          )}
          {isAwarded && (
            <span className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
              <Check size={16} /> Pionnier confirmé
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBetaPage;
