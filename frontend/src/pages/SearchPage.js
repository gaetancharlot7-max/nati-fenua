import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, X, Users, Image, ShoppingBag, Briefcase, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { searchApi } from '../lib/api';

// Demo trending
const trendingTags = [
  { tag: '#FenuaSocial', count: '2.5K posts' },
  { tag: '#Tahiti', count: '15K posts' },
  { tag: '#PerlesdeTahiti', count: '8.2K posts' },
  { tag: '#OriTahiti', count: '5.1K posts' },
  { tag: '#Moorea', count: '12K posts' },
  { tag: '#BoraBora', count: '18K posts' }
];

// Demo recent searches
const recentSearches = ['perles', 'monoï', 'excursion bora bora', 'ori tahiti'];

// Demo results
const demoResults = {
  users: [
    { user_id: '1', name: 'Hinano Tahiti', picture: 'https://images.unsplash.com/photo-1612708437841-085ba65e370b?w=100', followers_count: 1234 },
    { user_id: '2', name: 'Perles Manava', picture: 'https://ui-avatars.com/api/?name=PM&background=00899B&color=fff', followers_count: 567 }
  ],
  posts: [
    { post_id: '1', media_url: 'https://images.unsplash.com/photo-1723958286930-b32795ed2bbd?w=300', likes_count: 234 },
    { post_id: '2', media_url: 'https://images.unsplash.com/photo-1760969485983-c7b370a1532f?w=300', likes_count: 567 }
  ],
  products: [
    { product_id: '1', title: 'Collier Perles', price: 45000, images: ['https://images.unsplash.com/photo-1760969485983-c7b370a1532f?w=200'] }
  ],
  services: [
    { service_id: '1', title: 'Excursion Lagon', price_range: '15 000 XPF', images: ['https://images.unsplash.com/photo-1703549068359-49d854524ddd?w=200'] }
  ]
};

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const searchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await searchApi.search({ q: query, type: activeTab });
      setResults(response.data);
    } catch (error) {
      // Use demo results on error
      setResults(demoResults);
    } finally {
      setLoading(false);
    }
  }, [query, activeTab]);

  useEffect(() => {
    if (query.length >= 2) {
      searchItems();
      setShowSuggestions(false);
    } else {
      setResults(null);
      setShowSuggestions(true);
    }
  }, [query, searchItems]);

  const handleRecentSearch = (term) => {
    setQuery(term);
  };

  const handleTagClick = (tag) => {
    setQuery(tag.replace('#', ''));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 safe-bottom">
      {/* Search Input */}
      <div className="sticky top-14 lg:top-16 z-20 bg-[#FFF4E6] pb-4">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            data-testid="search-input"
            placeholder="Rechercher sur Nati Fenua..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 pr-12 py-6 rounded-xl bg-white border-gray-200"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions (when no query) */}
      {showSuggestions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Recent Searches */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <Clock size={16} />
              Recherches récentes
            </h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleRecentSearch(term)}
                  data-testid={`recent-${term}`}
                  className="px-4 py-2 bg-white rounded-full text-sm text-[#2F2F31] hover:bg-[#F5E6D3] transition-all"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Trending Tags */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <TrendingUp size={16} />
              Tendances
            </h3>
            <div className="space-y-3">
              {trendingTags.map((item, index) => (
                <motion.button
                  key={item.tag}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleTagClick(item.tag)}
                  data-testid={`trending-${item.tag}`}
                  className="w-full flex items-center justify-between p-3 bg-white rounded-xl hover:bg-[#F5E6D3] transition-all"
                >
                  <span className="font-medium text-[#00899B]">{item.tag}</span>
                  <span className="text-sm text-gray-500">{item.count}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Search Results */}
      {results && (
        <div>
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="w-full justify-start overflow-x-auto hide-scrollbar bg-transparent gap-2 p-0">
              <TabsTrigger 
                value="all"
                className="px-4 py-2 rounded-full data-[state=active]:bg-[#00899B] data-[state=active]:text-white bg-white"
              >
                Tout
              </TabsTrigger>
              <TabsTrigger 
                value="users"
                className="px-4 py-2 rounded-full data-[state=active]:bg-[#00899B] data-[state=active]:text-white bg-white"
              >
                <Users size={16} className="mr-1" />
                Comptes
              </TabsTrigger>
              <TabsTrigger 
                value="posts"
                className="px-4 py-2 rounded-full data-[state=active]:bg-[#00899B] data-[state=active]:text-white bg-white"
              >
                <Image size={16} className="mr-1" />
                Posts
              </TabsTrigger>
              <TabsTrigger 
                value="products"
                className="px-4 py-2 rounded-full data-[state=active]:bg-[#00899B] data-[state=active]:text-white bg-white"
              >
                <ShoppingBag size={16} className="mr-1" />
                Produits
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-[#00899B] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Users Results */}
          {!loading && (activeTab === 'all' || activeTab === 'users') && results.users?.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Comptes</h3>
              <div className="space-y-2">
                {results.users.map((user) => (
                  <Link
                    key={user.user_id}
                    to={`/profile/${user.user_id}`}
                    data-testid={`user-result-${user.user_id}`}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-[#F5E6D3] transition-all"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.picture} />
                      <AvatarFallback className="bg-[#00899B] text-white">{user.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-[#2F2F31]">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.followers_count} amis</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Posts Results */}
          {!loading && (activeTab === 'all' || activeTab === 'posts') && results.posts?.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Publications</h3>
              <div className="grid grid-cols-3 gap-1">
                {results.posts.map((post) => (
                  <div
                    key={post.post_id}
                    data-testid={`post-result-${post.post_id}`}
                    className="aspect-square relative group cursor-pointer overflow-hidden"
                  >
                    <img 
                      src={post.media_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-bold">{post.likes_count} ❤️</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products Results */}
          {!loading && (activeTab === 'all' || activeTab === 'products') && results.products?.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Produits</h3>
              <div className="grid grid-cols-2 gap-3">
                {results.products.map((product) => (
                  <div
                    key={product.product_id}
                    data-testid={`product-result-${product.product_id}`}
                    className="bg-white rounded-xl overflow-hidden card-hover"
                  >
                    <div className="aspect-square">
                      <img 
                        src={product.images?.[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm text-[#2F2F31] truncate">{product.title}</p>
                      <p className="text-[#00899B] font-bold">{product.price?.toLocaleString()} XPF</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {!loading && 
            (!results.users?.length && !results.posts?.length && !results.products?.length && !results.services?.length) && (
            <div className="text-center py-12">
              <SearchIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucun résultat pour "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
