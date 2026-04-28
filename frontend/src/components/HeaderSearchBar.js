import { useState, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon, X, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { searchApi } from '../lib/api';

/**
 * Inline search bar with debounced API call to /api/search?q= and dropdown results.
 * Used in MainLayout desktop top bar (lg+ screens). Mobile keeps its dedicated search route.
 */
const HeaderSearchBar = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 2) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchApi.search({ q: query, type: 'all', limit: 8 });
        setResults(res.data);
      } catch (err) {
        setResults({ users: [], posts: [], products: [] });
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const goToFullSearch = useCallback(() => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  }, [navigate, query]);

  const handleResultClick = (path) => {
    setOpen(false);
    setQuery('');
    setResults(null);
    navigate(path);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-2 w-full px-4 py-2 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors">
        <SearchIcon size={18} className="text-gray-500 flex-shrink-0 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') goToFullSearch(); }}
          placeholder="Rechercher sur Nati Fenua..."
          data-testid="header-search-input"
          aria-label="Rechercher"
          className="flex-1 bg-transparent outline-none text-sm text-[#1A1A2E] placeholder-gray-500"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults(null); }}
            data-testid="header-search-clear"
            aria-label="Effacer"
            className="p-1 rounded-full hover:bg-gray-300 flex-shrink-0"
          >
            <X size={14} className="text-gray-500 pointer-events-none" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open && query.trim().length >= 2 && (
        <div
          data-testid="header-search-dropdown"
          className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-[60vh] overflow-y-auto"
        >
          {loading && (
            <div className="p-4 text-center text-sm text-gray-500">Recherche…</div>
          )}

          {!loading && results && (
            <>
              {results.users?.length > 0 && (
                <div className="py-2">
                  <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Comptes</p>
                  {results.users.slice(0, 5).map((u) => (
                    <button
                      key={u.user_id}
                      type="button"
                      onClick={() => handleResultClick(`/profile/${u.user_id}`)}
                      data-testid={`header-search-user-${u.user_id}`}
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
                    >
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={u.picture} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        <AvatarFallback className="bg-[#00899B] text-white text-sm">{u.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#1A1A2E] text-sm truncate">{u.name || 'Utilisateur'}</p>
                        {u.bio && <p className="text-xs text-gray-500 truncate">{u.bio}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.posts?.length > 0 && (
                <div className="py-2 border-t border-gray-100">
                  <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Publications</p>
                  {results.posts.slice(0, 3).map((p) => (
                    <button
                      key={p.post_id}
                      type="button"
                      onClick={() => handleResultClick(`/post/${p.post_id}`)}
                      data-testid={`header-search-post-${p.post_id}`}
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
                    >
                      <div className="w-9 h-9 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                        {p.media_url ? (
                          <img src={p.media_url} alt="" className="w-full h-full object-cover"
                               onError={(e) => { e.currentTarget.src = '/placeholder-post.svg'; }} />
                        ) : null}
                      </div>
                      <p className="text-sm text-[#1A1A2E] line-clamp-2 flex-1">{p.caption || 'Publication'}</p>
                    </button>
                  ))}
                </div>
              )}

              {results.products?.length > 0 && (
                <div className="py-2 border-t border-gray-100">
                  <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Produits</p>
                  {results.products.slice(0, 3).map((p) => (
                    <button
                      key={p.product_id}
                      type="button"
                      onClick={() => handleResultClick(`/marketplace?product=${p.product_id}`)}
                      data-testid={`header-search-product-${p.product_id}`}
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
                    >
                      <div className="w-9 h-9 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt="" className="w-full h-full object-cover"
                               onError={(e) => { e.currentTarget.src = '/placeholder-post.svg'; }} />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#1A1A2E] truncate">{p.title}</p>
                        <p className="text-xs text-[#FF6B35] font-semibold">{p.price?.toLocaleString()} XPF</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {(!results.users?.length && !results.posts?.length && !results.products?.length) && (
                <div className="p-6 text-center">
                  <User size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Aucun résultat pour "{query}"</p>
                </div>
              )}

              {(results.users?.length > 0 || results.posts?.length > 0 || results.products?.length > 0) && (
                <button
                  type="button"
                  onClick={goToFullSearch}
                  data-testid="header-search-see-all"
                  className="w-full text-center py-3 border-t border-gray-100 text-sm font-medium text-[#FF6B35] hover:bg-gray-50"
                >
                  Voir tous les résultats →
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HeaderSearchBar;
