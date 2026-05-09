import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Newspaper, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * /preview — public landing for guests & App Store/Play Store reviewers.
 * Shows recent RSS articles WITHOUT requiring authentication.
 * Required by Apple App Review Guideline 5.1.1: app must show some content
 * before forcing account creation.
 */
const PreviewFeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/public/rss-feed?limit=15`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] to-white">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-[#1A1A2E] hover:text-[#FF6B35]" data-testid="preview-back">
            <ArrowLeft size={18} />
            <span className="text-sm font-semibold">Retour</span>
          </Link>
          <h1 className="font-black text-lg">
            <span className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] bg-clip-text text-transparent">Nati Fenua</span>
          </h1>
          <Link to="/auth">
            <Button size="sm" className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white text-xs font-bold rounded-full px-4">
              S'inscrire
            </Button>
          </Link>
        </div>
      </header>

      {/* Banner */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="rounded-2xl bg-gradient-to-br from-[#FF6B35]/10 via-[#FF1493]/10 to-[#9400D3]/10 border border-[#FF6B35]/30 p-4 flex gap-3 items-start">
          <Newspaper className="text-[#C8421A] flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-bold text-[#1A1A2E] text-sm mb-1">Mode Aperçu</p>
            <p className="text-xs text-gray-700 leading-relaxed">
              Tu consultes l'actualité polynésienne sans compte. <Link to="/auth" className="text-[#C8421A] font-semibold underline">Inscris-toi gratuitement</Link> pour publier, discuter, vendre/acheter sur le marketplace et accéder à la carte Mana 🌺
            </p>
          </div>
        </div>
      </div>

      {/* Posts */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Chargement…</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Aucun article disponible</div>
        ) : (
          posts.map((post, idx) => (
            <motion.article
              key={post.post_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              data-testid={`preview-post-${post.post_id}`}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
            >
              {post.thumbnail_url && (
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src={post.thumbnail_url}
                    alt={post.link_title || ''}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="p-4">
                {post.link_source && (
                  <p className="text-[10px] uppercase tracking-wider text-[#C8421A] font-bold mb-2">
                    {post.link_source}
                  </p>
                )}
                <h2 className="font-bold text-[#1A1A2E] mb-2 leading-snug">
                  {post.link_title || post.caption || 'Article'}
                </h2>
                {post.caption && post.link_title && (
                  <p className="text-sm text-gray-600 line-clamp-3 mb-3">{post.caption}</p>
                )}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                  {post.external_link ? (
                    <a
                      href={post.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#C8421A] font-semibold inline-flex items-center gap-1.5"
                    >
                      Lire l'article <ExternalLink size={14} />
                    </a>
                  ) : <span />}
                  <span className="text-xs text-gray-400">
                    {new Date(post.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                {/* Locked features hint */}
                <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                  <Lock size={12} />
                  <span>Likes, commentaires et partage : <Link to="/auth" className="text-[#C8421A] underline">connecte-toi</Link></span>
                </div>
              </div>
            </motion.article>
          ))
        )}
      </main>

      {/* CTA bottom */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <div className="rounded-3xl bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F1729] p-6 text-center text-white">
          <h2 className="text-2xl font-black mb-2">Rejoins le Fenua connecté</h2>
          <p className="text-white/70 text-sm mb-5 max-w-md mx-auto">
            Discute avec tes amis, publie tes photos, achète/vends localement, retrouve les webcams et événements en Polynésie.
          </p>
          <Link to="/auth">
            <Button data-testid="preview-cta-signup" className="bg-gradient-to-r from-[#FF6B35] via-[#FF1493] to-[#9400D3] text-white font-bold rounded-full px-8 py-6 text-base shadow-xl shadow-pink-500/30">
              Créer mon compte gratuitement →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PreviewFeedPage;
