import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink, Globe, Newspaper, ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { postsApi } from '../lib/api';
import api from '../lib/api';

// Media sources configuration with website URLs
const MEDIA_SOURCES = {
  "tahiti_infos": {
    name: "Tahiti Infos",
    logo: "https://www.tahiti-infos.com/photo/titre_5283164.png",
    website: "https://www.tahiti-infos.com",
    description: "L'information de Polynésie française en continu",
    categories: ["Actualité", "Politique", "Société"]
  },
  "polynesie_1ere": {
    name: "Polynésie 1ère",
    logo: "https://la1ere.francetvinfo.fr/image/dpvm2y6n3-d0c6/600/315/16779527.png",
    website: "https://la1ere.francetvinfo.fr/polynesie",
    description: "La chaîne TV et radio de Polynésie française",
    categories: ["Actualité", "Télévision", "Info"]
  },
  "outremers360": {
    name: "Outremers 360",
    logo: "https://outremers360.com/wp-content/uploads/2020/01/logo-outremers360.png",
    website: "https://outremers360.com",
    description: "L'info des Outre-mer à 360 degrés",
    categories: ["Actualité", "Outre-mer", "Économie"]
  },
  "lemonde_pacifique": {
    name: "Le Monde - Pacifique",
    logo: "https://www.lemonde.fr/img/favicon/icon-180.png",
    website: "https://www.lemonde.fr/asie-pacifique/",
    description: "Actualités Asie-Pacifique par Le Monde",
    categories: ["Actualité", "International"]
  },
  "wsl_surf": {
    name: "World Surf League",
    logo: "https://www.worldsurfleague.com/favicon.ico",
    website: "https://www.worldsurfleague.com",
    description: "La ligue mondiale de surf professionnelle",
    categories: ["Surf", "Sport", "Compétition"]
  },
  "surfer_mag": {
    name: "Surfer Magazine",
    logo: "https://www.surfer.com/favicon.ico",
    website: "https://www.surfer.com",
    description: "Magazine de référence du surf mondial",
    categories: ["Surf", "Sport", "Lifestyle"]
  },
  "ocean_conservancy": {
    name: "Ocean Conservancy",
    logo: "https://oceanconservancy.org/favicon.ico",
    website: "https://oceanconservancy.org",
    description: "Protection et conservation des océans",
    categories: ["Environnement", "Océan", "Conservation"]
  },
  "tntv_polynesie": {
    name: "TNTV",
    logo: "https://www.tntv.pf/wp-content/uploads/2019/07/tntv-logo.png",
    website: "https://www.tntv.pf",
    description: "Tahiti Nui Télévision - La télé du Fenua",
    categories: ["Actualité", "Télévision"]
  }
};

const MediaPage = () => {
  const { mediaId } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get media info from our config or from URL param
  const mediaInfo = MEDIA_SOURCES[mediaId] || {
    name: mediaId?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Média',
    logo: null,
    website: null,
    description: 'Source d\'actualités',
    categories: ['Actualité']
  };

  useEffect(() => {
    loadMediaPosts();
  }, [mediaId]);

  const loadMediaPosts = async () => {
    try {
      setLoading(true);
      // Fetch posts from this media source
      const response = await api.get(`/posts?source=${mediaId}&limit=20`);
      if (response.data && Array.isArray(response.data)) {
        setPosts(response.data.filter(p => p.user?.user_id === mediaId || p.source_id === mediaId));
      }
    } catch (error) {
      console.error('Error loading media posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 safe-bottom">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-[#00899B] mb-4 transition-colors"
        data-testid="back-btn"
      >
        <ArrowLeft size={20} />
        <span>Retour</span>
      </button>

      {/* Media Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 mb-6 shadow-lg"
        data-testid="media-header"
      >
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Logo */}
          <div className="relative">
            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-[#00899B] rounded-2xl bg-white p-2">
              <AvatarImage 
                src={mediaInfo.logo} 
                className="rounded-xl object-contain" 
              />
              <AvatarFallback className="bg-gradient-to-br from-[#FF6B35] to-[#FF1493] text-white text-3xl rounded-xl">
                <Newspaper size={40} />
              </AvatarFallback>
            </Avatar>
            {/* Verified Media Badge */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-[#00CED1] to-[#006994] rounded-xl flex items-center justify-center border-2 border-white shadow-lg">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
              </svg>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
              <h1 className="text-2xl font-serif text-[#2F2F31]" data-testid="media-name">
                {mediaInfo.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#00899B]/10 text-[#00899B] text-sm font-medium w-fit mx-auto md:mx-0">
                <Newspaper size={14} />
                Média vérifié
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-4" data-testid="media-description">
              {mediaInfo.description}
            </p>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
              {mediaInfo.categories.map((cat, idx) => (
                <span 
                  key={idx}
                  className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm"
                >
                  {cat}
                </span>
              ))}
            </div>

            {/* Website Button */}
            {mediaInfo.website && (
              <Button
                onClick={() => window.open(mediaInfo.website, '_blank')}
                className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white rounded-full hover:opacity-90 shadow-lg"
                data-testid="visit-website-btn"
              >
                <Globe size={18} className="mr-2" />
                Visiter le site web
                <ExternalLink size={16} className="ml-2" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Recent Articles Section */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#2F2F31] mb-4 flex items-center gap-2">
          <Newspaper size={24} className="text-[#00899B]" />
          Articles récents
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-[#00899B] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <motion.a
                key={post.post_id}
                href={post.external_link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer"
                data-testid={`media-article-${post.post_id}`}
              >
                {/* Thumbnail */}
                {(post.media_url || post.thumbnail_url) && (
                  <img 
                    src={post.media_url || post.thumbnail_url}
                    alt=""
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#2F2F31] line-clamp-2 group-hover:text-[#00899B] transition-colors">
                    {post.link_title || post.caption}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(post.created_at)}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight size={20} className="text-gray-300 group-hover:text-[#00899B] flex-shrink-0 mt-1 transition-colors" />
              </motion.a>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Newspaper size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-500">Aucun article récent</p>
            {mediaInfo.website && (
              <Button
                variant="outline"
                onClick={() => window.open(mediaInfo.website, '_blank')}
                className="mt-4 rounded-full"
              >
                Voir sur leur site
                <ExternalLink size={16} className="ml-2" />
              </Button>
            )}
          </div>
        )}

        {/* View All on Website */}
        {mediaInfo.website && posts.length > 0 && (
          <div className="mt-6 pt-4 border-t text-center">
            <Button
              variant="outline"
              onClick={() => window.open(mediaInfo.website, '_blank')}
              className="rounded-full border-[#00899B] text-[#00899B] hover:bg-[#00899B]/10"
            >
              Voir tous les articles sur {mediaInfo.name}
              <ExternalLink size={16} className="ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaPage;
