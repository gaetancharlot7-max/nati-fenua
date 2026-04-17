import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Grid3X3, Bookmark, ShoppingBag, MapPin, LogOut, MessageCircle, Cog, Users, X, UserPlus, UserMinus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { usersApi, postsApi, marketplaceApi } from '../lib/api';
import { toast } from 'sonner';
import FriendButton from '../components/FriendButton';

// Demo posts
const demoPosts = [];

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingFollow, setLoadingFollow] = useState(false);

  const isOwnProfile = !userId || userId === user?.user_id;

  useEffect(() => {
    loadProfile();
  }, [userId, user]);

  const loadProfile = async () => {
    try {
      if (isOwnProfile && user) {
        setProfileUser(user);
        // Use dedicated endpoint for user's posts
        const postsRes = await usersApi.getPosts(user.user_id);
        if (postsRes.data?.posts) {
          setPosts(postsRes.data.posts);
        } else if (postsRes.data && Array.isArray(postsRes.data)) {
          setPosts(postsRes.data);
        } else {
          setPosts([]);
        }
      } else if (userId) {
        const [userRes, postsRes] = await Promise.all([
          usersApi.getProfile(userId),
          usersApi.getPosts(userId)
        ]);
        setProfileUser(userRes.data);
        
        // Handle private profile
        if (postsRes.data?.error === 'private') {
          setPosts([]);
        } else if (postsRes.data?.posts) {
          setPosts(postsRes.data.posts);
        } else if (postsRes.data && Array.isArray(postsRes.data)) {
          setPosts(postsRes.data);
        } else {
          setPosts([]);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!userId) return;
    try {
      const response = await usersApi.follow(userId);
      setIsFollowing(response.data.following);
      toast.success(response.data.following ? 'Ami ajouté !' : 'Ami retiré');
      // Recharger le profil pour mettre à jour les compteurs
      loadProfile();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const loadFollowers = async () => {
    const targetUserId = userId || user?.user_id;
    if (!targetUserId) return;
    
    setLoadingFollow(true);
    try {
      const response = await usersApi.getFollowers(targetUserId);
      setFollowers(response.data || []);
    } catch (error) {
      console.error('Error loading followers:', error);
    } finally {
      setLoadingFollow(false);
    }
  };

  const loadFollowing = async () => {
    const targetUserId = userId || user?.user_id;
    if (!targetUserId) return;
    
    setLoadingFollow(true);
    try {
      const response = await usersApi.getFollowing(targetUserId);
      setFollowing(response.data || []);
    } catch (error) {
      console.error('Error loading following:', error);
    } finally {
      setLoadingFollow(false);
    }
  };

  const handleShowFollowers = () => {
    setShowFollowersModal(true);
    loadFollowers();
  };

  const handleShowFollowing = () => {
    setShowFollowingModal(true);
    loadFollowing();
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
                    onClick={() => navigate('/profile/edit')}
                    className="rounded-full"
                  >
                    <Settings size={18} className="mr-2" />
                    Modifier
                  </Button>
                  <Button 
                    variant="outline"
                    data-testid="settings-btn"
                    onClick={() => navigate('/settings')}
                    className="rounded-full"
                  >
                    <Cog size={18} className="mr-2" />
                    Parametres
                  </Button>
                  <Button 
                    variant="outline"
                    data-testid="logout-btn"
                    onClick={() => {
                      logout();
                      navigate('/');
                      toast.success('Déconnexion réussie');
                    }}
                    className="rounded-full text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    <LogOut size={18} className="mr-2" />
                    Déconnexion
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 justify-center md:justify-start">
                  <FriendButton 
                    userId={userId} 
                    data-testid="friend-btn"
                  />
                  <Button
                    onClick={() => navigate(`/chat?user=${userId}`)}
                    data-testid="send-message-btn"
                    className="rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white hover:opacity-90"
                  >
                    <MessageCircle size={18} className="mr-2" />
                    Message
                  </Button>
                </div>
              )}
            </div>

            {/* Stats - Cliquables */}
            <div className="flex justify-center md:justify-start gap-8 mb-4">
              <div className="text-center">
                <p className="font-bold text-[#2F2F31]">{displayUser?.posts_count || posts.length}</p>
                <p className="text-sm text-gray-500">Publications</p>
              </div>
              <button 
                onClick={handleShowFollowers}
                className="text-center hover:opacity-70 transition-opacity"
                data-testid="followers-btn"
              >
                <p className="font-bold text-[#2F2F31]">{displayUser?.followers_count || 0}</p>
                <p className="text-sm text-gray-500">Amis</p>
              </button>
              <button 
                onClick={handleShowFollowing}
                className="text-center hover:opacity-70 transition-opacity"
                data-testid="following-btn"
              >
                <p className="font-bold text-[#2F2F31]">{displayUser?.following_count || 0}</p>
                <p className="text-sm text-gray-500">Abonnements</p>
              </button>
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

            {/* Private Account Badge */}
            {displayUser?.is_private && !isOwnProfile && !displayUser?.is_friend && (
              <div className="mt-3">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
                  <Settings size={14} />
                  Compte privé
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Private Profile Message */}
      {displayUser?.is_private && !isOwnProfile && !displayUser?.is_friend && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-sm text-center mb-6"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Settings size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">Ce compte est privé</h3>
          <p className="text-gray-500 mb-4">
            Envoyez une demande d'ami pour voir les publications, photos et la liste d'amis de {displayUser?.name}.
          </p>
          <FriendButton userId={userId} size="lg" />
        </motion.div>
      )}

      {/* Content Tabs - Only show if profile is accessible */}
      {(isOwnProfile || displayUser?.can_view_content || displayUser?.is_friend || !displayUser?.is_private) && (
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
            {posts.filter(p => !p.is_rss && !p.is_external).map((post, index) => (
              <motion.div
                key={post.post_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                data-testid={`profile-post-${post.post_id}`}
                onClick={() => navigate(`/post/${post.post_id}`)}
                className="aspect-square relative group cursor-pointer overflow-hidden rounded-xl"
              >
                <img 
                  src={post.media_url || post.thumbnail_url || 'https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?w=400'}
                  alt=""
                  className="w-full h-full object-cover"
                />
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

          {posts.filter(p => !p.is_rss && !p.is_external).length === 0 && (
            <div className="text-center py-16">
              <Grid3X3 size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucune publication</p>
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
      )}

      {/* Followers Modal */}
      <AnimatePresence>
        {showFollowersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFollowersModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden max-h-[80vh]"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-bold text-lg">Amis ({followers.length})</h3>
                <button 
                  onClick={() => setShowFollowersModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[60vh] p-4">
                {loadingFollow ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-3 border-[#00899B] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : followers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Aucun ami pour le moment</p>
                ) : (
                  <div className="space-y-3">
                    {followers.map((follower) => (
                      <Link
                        key={follower.user_id}
                        to={`/profile/${follower.user_id}`}
                        onClick={() => setShowFollowersModal(false)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={follower.picture} />
                          <AvatarFallback className="bg-[#00899B] text-white">
                            {follower.name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-[#2F2F31]">{follower.name}</p>
                          {follower.bio && (
                            <p className="text-sm text-gray-500 line-clamp-1">{follower.bio}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Following Modal */}
      <AnimatePresence>
        {showFollowingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFollowingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden max-h-[80vh]"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-bold text-lg">Abonnements ({following.length})</h3>
                <button 
                  onClick={() => setShowFollowingModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[60vh] p-4">
                {loadingFollow ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-3 border-[#00899B] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : following.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Aucun abonnement pour le moment</p>
                ) : (
                  <div className="space-y-3">
                    {following.map((followedUser) => (
                      <Link
                        key={followedUser.user_id}
                        to={`/profile/${followedUser.user_id}`}
                        onClick={() => setShowFollowingModal(false)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={followedUser.picture} />
                          <AvatarFallback className="bg-[#00899B] text-white">
                            {followedUser.name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-[#2F2F31]">{followedUser.name}</p>
                          {followedUser.bio && (
                            <p className="text-sm text-gray-500 line-clamp-1">{followedUser.bio}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
