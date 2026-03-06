import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, Grid3X3, Film, Bookmark, ShoppingBag, MoreHorizontal, MapPin, Link as LinkIcon, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { usersApi, postsApi, marketplaceApi } from '../lib/api';
import { toast } from 'sonner';

// Demo posts
const demoPosts = [
  { post_id: 'p1', media_url: 'https://images.unsplash.com/photo-1723958286930-b32795ed2bbd?w=400', content_type: 'photo' },
  { post_id: 'p2', media_url: 'https://images.unsplash.com/photo-1760969485983-c7b370a1532f?w=400', content_type: 'photo' },
  { post_id: 'p3', media_url: 'https://images.unsplash.com/photo-1746511299666-5ba663a2a5df?w=400', content_type: 'video' },
  { post_id: 'p4', media_url: 'https://images.unsplash.com/photo-1703549068359-49d854524ddd?w=400', content_type: 'photo' },
  { post_id: 'p5', media_url: 'https://images.unsplash.com/photo-1690228987673-f6e104fa653c?w=400', content_type: 'photo' },
  { post_id: 'p6', media_url: 'https://images.unsplash.com/photo-1663018084454-86fd8150f950?w=400', content_type: 'photo' }
];

const ProfilePage = () => {
  const { userId } = useParams();
  const { user, logout } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState(demoPosts);
  const [products, setProducts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  const isOwnProfile = !userId || userId === user?.user_id;

  useEffect(() => {
    loadProfile();
  }, [userId, user]);

  const loadProfile = async () => {
    try {
      if (isOwnProfile && user) {
        setProfileUser(user);
        const postsRes = await postsApi.getAll({ user_id: user.user_id });
        if (postsRes.data.length > 0) setPosts(postsRes.data);
      } else if (userId) {
        const [userRes, postsRes] = await Promise.all([
          usersApi.getProfile(userId),
          usersApi.getPosts(userId)
        ]);
        setProfileUser(userRes.data);
        if (postsRes.data.length > 0) setPosts(postsRes.data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!userId) return;
    try {
      const response = await usersApi.follow(userId);
      setIsFollowing(response.data.following);
      toast.success(response.data.following ? 'Abonné !' : 'Désabonné');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-3 border-[#00899B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const displayUser = profileUser || user;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 safe-bottom">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 mb-6 shadow-sm"
      >
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-[#00899B]">
            <AvatarImage src={displayUser?.picture} />
            <AvatarFallback className="bg-[#00899B] text-white text-3xl">
              {displayUser?.name?.[0]}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
              <h1 className="text-2xl font-serif text-[#2F2F31]">{displayUser?.name}</h1>
              
              {isOwnProfile ? (
                <div className="flex gap-2 justify-center md:justify-start">
                  <Button 
                    variant="outline" 
                    data-testid="edit-profile-btn"
                    className="rounded-full"
                  >
                    <Settings size={18} className="mr-2" />
                    Modifier
                  </Button>
                  <Button 
                    variant="ghost"
                    data-testid="logout-btn"
                    onClick={handleLogout}
                    className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={18} />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleFollow}
                  data-testid="follow-btn"
                  className={`rounded-full ${isFollowing ? 'bg-gray-200 text-[#2F2F31] hover:bg-gray-300' : 'bg-[#00899B] text-white hover:bg-[#007585]'}`}
                >
                  {isFollowing ? 'Abonné' : 'Suivre'}
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="flex justify-center md:justify-start gap-8 mb-4">
              <div className="text-center">
                <p className="font-bold text-[#2F2F31]">{displayUser?.posts_count || posts.length}</p>
                <p className="text-sm text-gray-500">Publications</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-[#2F2F31]">{displayUser?.followers_count || 0}</p>
                <p className="text-sm text-gray-500">Abonnés</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-[#2F2F31]">{displayUser?.following_count || 0}</p>
                <p className="text-sm text-gray-500">Abonnements</p>
              </div>
            </div>

            {/* Bio */}
            {displayUser?.bio && (
              <p className="text-[#2F2F31] mb-3">{displayUser.bio}</p>
            )}

            {/* Location */}
            {displayUser?.location && (
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500">
                <MapPin size={16} />
                <span>{displayUser.location}</span>
              </div>
            )}

            {/* Business Badge */}
            {displayUser?.is_business && (
              <div className="mt-3">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E97C07]/10 text-[#E97C07] text-sm font-medium">
                  <ShoppingBag size={14} />
                  Compte Professionnel
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-center bg-white rounded-full p-1 mb-6 shadow-sm">
          <TabsTrigger 
            value="posts"
            data-testid="posts-tab"
            className="flex-1 rounded-full data-[state=active]:bg-[#00899B] data-[state=active]:text-white py-3"
          >
            <Grid3X3 size={18} className="mr-2" />
            Publications
          </TabsTrigger>
          <TabsTrigger 
            value="reels"
            data-testid="reels-tab"
            className="flex-1 rounded-full data-[state=active]:bg-[#00899B] data-[state=active]:text-white py-3"
          >
            <Film size={18} className="mr-2" />
            Reels
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger 
              value="saved"
              data-testid="saved-tab"
              className="flex-1 rounded-full data-[state=active]:bg-[#00899B] data-[state=active]:text-white py-3"
            >
              <Bookmark size={18} className="mr-2" />
              Enregistré
            </TabsTrigger>
          )}
        </TabsList>

        {/* Posts Grid */}
        <TabsContent value="posts">
          <div className="profile-grid">
            {posts.map((post, index) => (
              <motion.div
                key={post.post_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                data-testid={`profile-post-${post.post_id}`}
                className="aspect-square relative group cursor-pointer overflow-hidden"
              >
                <img 
                  src={post.media_url || post.thumbnail_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {post.content_type === 'video' && (
                  <div className="absolute top-2 right-2">
                    <Film size={20} className="text-white drop-shadow-lg" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                  <div className="text-white flex items-center gap-1">
                    <span className="font-bold">{post.likes_count || 0}</span>
                    ❤️
                  </div>
                  <div className="text-white flex items-center gap-1">
                    <span className="font-bold">{post.comments_count || 0}</span>
                    💬
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-16">
              <Grid3X3 size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucune publication</p>
            </div>
          )}
        </TabsContent>

        {/* Reels Grid */}
        <TabsContent value="reels">
          <div className="profile-grid">
            {posts.filter(p => p.content_type === 'video' || p.content_type === 'reel').map((post, index) => (
              <motion.div
                key={post.post_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="aspect-[9/16] relative group cursor-pointer overflow-hidden rounded-xl"
              >
                <img 
                  src={post.media_url || post.thumbnail_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-sm">
                  <Film size={14} />
                  <span>{post.views_count || 0}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {posts.filter(p => p.content_type === 'video' || p.content_type === 'reel').length === 0 && (
            <div className="text-center py-16">
              <Film size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucun Reel</p>
            </div>
          )}
        </TabsContent>

        {/* Saved Grid */}
        <TabsContent value="saved">
          <div className="text-center py-16">
            <Bookmark size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucune publication enregistrée</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
