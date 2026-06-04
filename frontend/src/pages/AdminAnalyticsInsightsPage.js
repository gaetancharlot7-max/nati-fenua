import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Users, FileText, ShoppingBag, MapPin, RefreshCw, Trophy, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminAnalyticsInsightsPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/analytics/insights?days=${period}`, getAuthHeaders());
      setData(res.data);
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
  }, [period]);

  const summary = data?.summary || {};
  const topPosts = data?.top_posts || [];
  const topVendors = data?.top_vendors || [];
  const byIsland = data?.by_island || [];

  return (
    <div className="min-h-screen bg-[#0F1729] text-white p-4 sm:p-6">
      <div className="max-w-6xl mx-auto mb-6">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4">
          <ArrowLeft size={16} /> Retour dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black flex items-center gap-3">
              <span className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
                <TrendingUp size={24} />
              </span>
              Analytics & Insights
            </h1>
            <p className="text-white/60 mt-1 text-sm">Top contenus, vendeurs et répartition géographique</p>
          </div>
          <div className="flex gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(parseInt(e.target.value))}
              data-testid="insights-period"
              className="bg-[#16213E] border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
            >
              <option value="1">24 heures</option>
              <option value="7">7 jours</option>
              <option value="30">30 jours</option>
              <option value="90">90 jours</option>
            </select>
            <Button onClick={load} variant="outline" data-testid="insights-refresh" className="border-white/20 text-white hover:bg-white/10">
              <RefreshCw size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat icon={<Users size={20} />} label="Utilisateurs totaux" value={summary.total_users || 0} accent="from-blue-500/20 to-blue-600/20 border-blue-500/30" />
        <Stat icon={<Users size={20} />} label="Nouveaux users" value={summary.new_users || 0} accent="from-emerald-500/20 to-emerald-600/20 border-emerald-500/30" subtitle="sur la période" />
        <Stat icon={<FileText size={20} />} label="Nouvelles publications" value={summary.new_posts || 0} accent="from-pink-500/20 to-pink-600/20 border-pink-500/30" />
        <Stat icon={<FileText size={20} />} label="Articles RSS" value={summary.new_articles || 0} accent="from-cyan-500/20 to-cyan-600/20 border-cyan-500/30" />
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 size={28} className="animate-spin mx-auto text-[#FF6B35]" /></div>
      ) : (
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-4">
          {/* Top Posts */}
          <div className="bg-[#16213E] rounded-2xl border border-white/10 p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-white/70">
              <Trophy size={16} className="text-yellow-400" /> Top publications
            </h2>
            {topPosts.length === 0 ? (
              <p className="text-sm text-white/40 py-4 text-center">Aucune publication sur la période</p>
            ) : (
              <ol className="space-y-2">
                {topPosts.map((p, i) => (
                  <li key={p.post_id} data-testid={`top-post-${i + 1}`} className="flex items-start gap-3 p-2 hover:bg-white/5 rounded-xl">
                    <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400 to-[#FF6B35] flex items-center justify-center font-black text-xs">
                      {i + 1}
                    </span>
                    {p.media_url && (
                      <img src={p.media_url} alt="" loading="lazy" className="w-10 h-10 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.caption || '—'}</p>
                      <p className="text-xs text-white/50 truncate">
                        {p.author?.name || '—'} • <span className="text-[#FF1493] font-bold">{p.likes_count} ❤️</span> · {p.comments_count} 💬
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Top Vendors */}
          <div className="bg-[#16213E] rounded-2xl border border-white/10 p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-white/70">
              <ShoppingBag size={16} className="text-emerald-400" /> Top vendeurs marketplace
            </h2>
            {topVendors.length === 0 ? (
              <p className="text-sm text-white/40 py-4 text-center">Aucun vendeur actif</p>
            ) : (
              <ol className="space-y-2">
                {topVendors.map((v, i) => (
                  <li key={v._id} data-testid={`top-vendor-${i + 1}`} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl">
                    <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${i < 3 ? 'bg-gradient-to-br from-yellow-400 to-[#FF6B35] text-white' : 'bg-white/10 text-white/70'}`}>
                      {i + 1}
                    </span>
                    <img
                      src={v.vendor?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(v.vendor?.name || '?')}&background=FF6B35&color=fff`}
                      alt=""
                      loading="lazy"
                      className="w-9 h-9 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {v.vendor?.name || '—'} {v.vendor?.is_business && '🏪'}
                      </p>
                      <p className="text-xs text-white/50 truncate">
                        {v.items_count} produit{v.items_count > 1 ? 's' : ''} · {v.total_views || 0} vues
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* By Island */}
          <div className="md:col-span-2 bg-[#16213E] rounded-2xl border border-white/10 p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-white/70">
              <MapPin size={16} className="text-cyan-400" /> Répartition par île
            </h2>
            {byIsland.length === 0 ? (
              <p className="text-sm text-white/40 py-4 text-center">Aucune donnée géographique disponible</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {byIsland.map((isl) => {
                  const total = byIsland.reduce((s, x) => s + x.count, 0);
                  const pct = Math.round((isl.count / total) * 100);
                  return (
                    <div key={isl.island} className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-xs text-white/50 capitalize">{isl.island}</p>
                      <p className="text-2xl font-black mt-1">{isl.count}</p>
                      <div className="h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-white/40 mt-1">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Stat = ({ icon, label, value, subtitle, accent }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`bg-gradient-to-br ${accent} border rounded-2xl p-4`}>
    <div className="flex items-center gap-2 text-white/70 text-xs uppercase tracking-wider mb-2">{icon}<span>{label}</span></div>
    <p className="text-2xl sm:text-3xl font-black">{value}</p>
    {subtitle && <p className="text-xs text-white/50 mt-1">{subtitle}</p>}
  </motion.div>
);

export default AdminAnalyticsInsightsPage;
