import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, TrendingUp, CreditCard, Check, X, RefreshCw, AlertCircle, Search, Megaphone, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const xpf = (n) => Number(n || 0).toLocaleString('fr-FR') + ' XPF';

const StatusBadge = ({ status }) => {
  const map = {
    paid: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: '✓ Payé' },
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'En attente' },
    initiated: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Initié' },
    cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Annulé' },
    expired: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Expiré' },
    refunded: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Remboursé' }
  };
  const s = map[status] || map.pending;
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${s.bg} ${s.text}`}>{s.label}</span>;
};

const AdStatusBadge = ({ ad_status }) => {
  const map = {
    approved: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: '✓ Validée' },
    rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: '✗ Refusée' },
    pending_review: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: '⏳ À valider' }
  };
  const s = map[ad_status] || map.pending_review;
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${s.bg} ${s.text}`}>{s.label}</span>;
};

const AdminPaymentsPage = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ total_revenue_xpf: 0, paid_count: 0, pending_count: 0, by_type: [] });
  const [pendingAds, setPendingAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState('all');

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
  });

  const load = async () => {
    setLoading(true);
    try {
      const [paymentsRes, adsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/payments?limit=200`, getAuthHeaders()),
        axios.get(`${API_URL}/api/admin/ads/pending`, getAuthHeaders())
      ]);
      setTransactions(paymentsRes.data.transactions || []);
      setStats(paymentsRes.data.stats || stats);
      setPendingAds(adsRes.data.ads || []);
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

  const handleApprove = async (txId) => {
    try {
      await axios.post(`${API_URL}/api/admin/ads/${txId}/approve`, {}, getAuthHeaders());
      toast.success('Annonce validée 🌺');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const handleReject = async (txId) => {
    const reason = prompt('Raison du refus (visible à l\'admin uniquement) :');
    if (reason === null) return;
    try {
      await axios.post(`${API_URL}/api/admin/ads/${txId}/reject`, { reason }, getAuthHeaders());
      toast.success('Annonce refusée — pense à rembourser sur Stripe Dashboard');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const filtered = transactions.filter((t) => {
    if (tab === 'paid' && t.status !== 'paid') return false;
    if (tab === 'pending' && !['pending', 'initiated'].includes(t.status)) return false;
    if (filter) {
      const f = filter.toLowerCase();
      return (
        (t.user_email || '').toLowerCase().includes(f) ||
        (t.package_id || '').toLowerCase().includes(f) ||
        (t.transaction_id || '').toLowerCase().includes(f)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0F1729] text-white p-4 sm:p-6">
      <div className="max-w-6xl mx-auto mb-6">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4">
          <ArrowLeft size={16} /> Retour dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black flex items-center gap-3">
              <span className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500">
                <DollarSign size={24} />
              </span>
              Paiements & Annonces
            </h1>
            <p className="text-white/60 mt-1 text-sm">Vue d'ensemble du chiffre d'affaires Stripe</p>
          </div>
          <Button onClick={load} variant="outline" data-testid="admin-payments-refresh" className="border-white/20 text-white hover:bg-white/10">
            <RefreshCw size={16} className="mr-2" /> Actualiser
          </Button>
        </div>
      </div>

      {/* Revenue stats */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <RevenueStat icon={<TrendingUp size={20} />} label="Chiffre d'affaires" value={xpf(stats.total_revenue_xpf)} accent="from-emerald-500/20 to-emerald-600/20 border-emerald-500/30" />
        <RevenueStat icon={<CreditCard size={20} />} label="Paiements réussis" value={stats.paid_count} accent="from-cyan-500/20 to-cyan-600/20 border-cyan-500/30" />
        <RevenueStat icon={<Clock size={20} />} label="En attente" value={stats.pending_count} accent="from-yellow-500/20 to-yellow-600/20 border-yellow-500/30" />
        <RevenueStat icon={<AlertCircle size={20} />} label="Annonces à valider" value={pendingAds.length} accent="from-orange-500/20 to-orange-600/20 border-orange-500/30" testId="admin-pending-ads-count" />
      </div>

      {/* Pending ads to validate */}
      {pendingAds.length > 0 && (
        <div className="max-w-6xl mx-auto mb-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 sm:p-5">
          <h2 className="font-bold flex items-center gap-2 mb-3">
            <Megaphone className="text-orange-400" size={20} /> Annonces premium à valider ({pendingAds.length})
          </h2>
          <div className="space-y-2">
            {pendingAds.map((ad) => (
              <div key={ad.transaction_id} className="bg-[#16213E] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3" data-testid={`pending-ad-${ad.transaction_id}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{ad.package_name || ad.package_id}</p>
                  <p className="text-xs text-white/60 truncate">{ad.user_email} • {xpf(ad.amount)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(ad.transaction_id)} data-testid={`approve-${ad.transaction_id}`} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                    <Check size={14} className="mr-1" /> Valider
                  </Button>
                  <Button size="sm" onClick={() => handleReject(ad.transaction_id)} variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-500/10">
                    <X size={14} className="mr-1" /> Refuser
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue by type */}
      {stats.by_type && stats.by_type.length > 0 && (
        <div className="max-w-6xl mx-auto mb-6 bg-[#16213E] rounded-2xl p-4 sm:p-5">
          <h2 className="font-bold mb-3 text-sm uppercase tracking-wider text-white/70">CA par catégorie</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.by_type.map((s) => (
              <div key={s.type} className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-xs text-white/50 capitalize">{(s.type || '').replace(/_/g, ' ')}</p>
                <p className="text-lg font-black mt-1">{xpf(s.total)}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{s.count} vente{s.count > 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-6xl mx-auto mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-[#16213E] rounded-xl p-1">
          {['all', 'paid', 'pending'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              data-testid={`tab-${t}`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === t ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white' : 'text-white/60 hover:text-white'}`}
            >
              {t === 'all' ? 'Tout' : t === 'paid' ? 'Payés' : 'En attente'}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Rechercher par email, package, ID…"
            className="bg-[#16213E] border-white/10 text-white pl-10"
          />
        </div>
      </div>

      {/* Transactions table */}
      <div className="max-w-6xl mx-auto bg-[#16213E] rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-white/50">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-white/50">
            <CreditCard size={32} className="mx-auto mb-3 opacity-30" />
            Aucune transaction
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((tx) => (
              <div key={tx.transaction_id} className="p-4 sm:p-5 hover:bg-white/5 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold truncate">{tx.package_name || tx.package_id}</p>
                      <StatusBadge status={tx.status} />
                      {tx.ad_status && <AdStatusBadge ad_status={tx.ad_status} />}
                    </div>
                    <p className="text-sm text-white/60 truncate">{tx.user_email || '—'}</p>
                    <p className="text-[10px] text-white/40 mt-1 font-mono truncate">{tx.transaction_id}</p>
                    <p className="text-[10px] text-white/40">{tx.created_at ? new Date(tx.created_at).toLocaleString('fr-FR') : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-black text-[#FF1493]">{xpf(tx.amount)}</p>
                    <p className="text-[10px] text-white/40">{(tx.currency || 'XPF').toUpperCase()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const RevenueStat = ({ icon, label, value, accent, testId }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`bg-gradient-to-br ${accent} border rounded-2xl p-4`} data-testid={testId}>
    <div className="flex items-center gap-2 text-white/70 text-xs uppercase tracking-wider mb-2">
      {icon} <span>{label}</span>
    </div>
    <p className="text-2xl sm:text-3xl font-black">{value}</p>
  </motion.div>
);

export default AdminPaymentsPage;
