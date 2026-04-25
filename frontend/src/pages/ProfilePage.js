import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Grid3X3, Bookmark, ShoppingBag, MapPin, LogOut, MessageCircle, X, Heart, Send, MoreHorizontal, ChevronLeft, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import FriendButton from '../components/FriendButton';

const API = process.env.REACT_APP_BACKEND_URL;

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  
  // Friends modal
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  
  // Post detail modal
  const [selectedPost, setSelectedPost] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const isOwnProfile = !userId || userId === user?.user_id;
  const targetUserId = userId || user?.user_id;

  useEffect(() => {
    if (targetUserId) {
      loadProfile();
    }
  }, [targetUserId, user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // Load profile data
      const profileRes = await fetch(`${API}/api/users/${targetUserId}`, {
        credentials: 'include'
      });
      
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfileUser(profileData);
      }

      // Load user's posts (filtered by user_id in backend)
      const postsRes = await fetch(`${API}/api/users/${targetUserId}/posts`, {
        credentials: 'include'
      });
      
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        // Handle both array and object response
        if (postsData.posts) {
          setPosts(postsData.posts);
        } else if (Array.isArray(postsData)) {
          setPosts(postsData);
        } else {
          setPosts([]);
        }
      }

      // Load saved posts if own profile
      if (isOwnProfile) {
        const savedRes = await fetch(`${API}/api/saved`, {
          credentials: 'include'
        });
        
        if (savedRes.ok) {
          const savedData = await savedRes.json();
          setSavedPosts(Array.isArray(savedData) ? savedData : []);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load friends list
  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      const response = await fetch(`${API}/api/friends`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setFriends(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleShowFriends = () => {
    setShowFriendsModal(true);
    loadFriends();
  };

  // Post detail modal functions
  const openPostModal = async (post) => {
    setSelectedPost(post);
    setPostComments([]);
    loadComments(post.post_id);
  };

  const closePostModal = () => {
    setSelectedPost(null);
    setPostComments([]);
    setNewComment('');
  };

  const loadComments = async (postId) => {
    setLoadingComments(true);
    try {
      const response = await fetch(`${API}/api/posts/${postId}/comments`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPostComments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLikePost = async () => {
    if (!selectedPost) return;
    
    try {
      const response = await fetch(`${API}/api/posts/${selectedPost.post_id}/like`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedPost(prev => ({
          ...prev,
          likes_count: data.likes_count,
          user_liked: data.liked
        }));
        // Update in posts list too
        setPosts(prev => prev.map(p => 
          p.post_id === selectedPost.post_id 
            ? { ...p, likes_count: data.likes_count, user_liked: data.liked }
            : p
        ));
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedPost) return;
    
    setSubmittingComment(true);
    try {
      const response = await fetch(`${API}/api/posts/${selectedPost.post_id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newComment.trim() })
      });
      
      if (response.ok) {
        const comment = await response.json();
        setPostComments(prev => [...prev, comment]);
        setNewComment('');
        setSelectedPost(prev => ({
          ...prev,
          comments_count: (prev.comments_count || 0) + 1
        }));
        toast.success('Commentaire ajouté');
      }
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSavePost = async () => {
    if (!selectedPost) return;
    
    try {
      const response = await fetch(`${API}/api/posts/${selectedPost.post_id}/save`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.saved ? 'Post enregistré' : 'Post retiré des enregistrements');
        // Reload saved posts if on own profile
        if (isOwnProfile) {
          const savedRes = await fetch(`${API}/api/saved`, { credentials: 'include' });
          if (savedRes.ok) {
            const savedData = await savedRes.json();
            setSavedPosts(Array.isArray(savedData) ? savedData : []);
          }
        }
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const displayUser = profileUser || user;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] to-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#FF6B35] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 safe-bottom">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 shadow-sm mb-6"
      >
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-28 h-28 border-4 border-white shadow-xl">
              <AvatarImage src={displayUser?.picture} />
              <AvatarFallback className="bg-gradient-to-br from-[#FF6B35] to-[#FF1493] text-white text-3xl">
                {displayUser?.name?.[0]}
              </AvatarFallback>
            </Avatar>
            {displayUser?.is_verified && (
              <div className="absolute bottom-1 right-1 w-7 h-7 bg-gradient-to-r from-[#00CED1] to-[#006994] rounded-full flex items-center justify-center border-2 border-white">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[#1A1A2E]">{displayUser?.name}</h1>
              {isOwnProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/settings')}
                  className="rounded-full"
                >
                  <Settings size={18} />
                </Button>
              )}
            </div>

            {/* Stats - Friends count is clickable */}
            <div className="flex justify-center md:justify-start gap-8 my-4">
              <div className="text-center">
                <p className="font-bold text-[#2F2F31]">{posts.length}</p>
                <p className="text-sm text-gray-500">Publications</p>
              </div>
              <button 
                onClick={handleShowFriends}
                className="text-center hover:opacity-70 transition-opacity"
                data-testid="friends-count-btn"
              >
                <p className="font-bold text-[#2F2F31]">{profileUser?.friends_count || displayUser?.friends_count || 0}</p>
                <p className="text-sm text-gray-500">Amis</p>
              </button>
            </div>

            {/* Bio */}
            {displayUser?.bio && (
              <p className="text-[#2F2F31] mb-3">{displayUser.bio}</p>
            )}

            {/* Location */}
            {displayUser?.location && (
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 mb-3">
                <MapPin size={16} />
                <span>{displayUser.location}</span>
              </div>
            )}

            {/* Actions */}
            {isOwnProfile ? (
              <div className="flex gap-2 justify-center md:justify-start">
                <Button
                  onClick={() => navigate('/profile/edit')}
                  data-testid="edit-profile-btn"
                  variant="outline"
                  className="rounded-full"
                >
                  Modifier le profil
                </Button>
                <Button
                  onClick={logout}
                  variant="ghost"
                  className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <LogOut size={18} />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 justify-center md:justify-start">
                <FriendButton userId={targetUserId} />
                <Button
                  onClick={() => navigate(`/chat?user=${targetUserId}`)}
                  className="rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white"
                >
                  <MessageCircle size={18} className="mr-2" />
                  Message
                </Button>
              </div>
            )}

            {/* Private account badge */}
            {profileUser?.is_private && !isOwnProfile && !profileUser?.is_friend && (
              <div className="mt-3">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
                  <Settings size={14} />
                  Compte privé
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Private Profile Message */}
      {profileUser?.is_private && !isOwnProfile && !profileUser?.is_friend && (
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
            Envoyez une demande d'ami pour voir les publications de {displayUser?.name}.
          </p>
          <FriendButton userId={targetUserId} size="lg" />
        </motion.div>
      )}

      {/* Content Tabs */}
      {(isOwnProfile || profileUser?.can_view_content || profileUser?.is_friend || !profileUser?.is_private) && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-center bg-white rounded-full p-1 mb-6 shadow-sm">
            <TabsTrigger 
              value="posts"
              className="flex-1 rounded-full data-[state=active]:bg-[#00899B] data-[state=active]:text-white py-3"
            >
              <Grid3X3 size={18} className="mr-2" />
              Publications
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger 
                value="saved"
                className="flex-1 rounded-full data-[state=active]:bg-[#00899B] data-[state=active]:text-white py-3"
              >
                <Bookmark size={18} className="mr-2" />
                Enregistré
              </TabsTrigger>
            )}
          </TabsList>

          {/* Posts Grid */}
          <TabsContent value="posts">
            <div className="grid grid-cols-3 gap-1 md:gap-3">
              {posts.map((post, index) => (
                <motion.div
                  key={post.post_id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => openPostModal(post)}
                  className="aspect-square relative group cursor-pointer overflow-hidden rounded-xl bg-gray-100"
                >
                  {post.media_url ? (
                    <img 
                      src={post.media_url}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-post.svg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3">
                      <p className="text-xs text-gray-600 line-clamp-4">{post.caption}</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <div className="text-white flex items-center gap-1">
                      <Heart size={18} fill="white" />
                      <span className="font-bold">{post.likes_count || 0}</span>
                    </div>
                    <div className="text-white flex items-center gap-1">
                      <MessageCircle size={18} fill="white" />
                      <span className="font-bold">{post.comments_count || 0}</span>
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

          {/* Saved Posts Grid */}
          <TabsContent value="saved">
            {savedPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 md:gap-3">
                {savedPosts.map((post, index) => (
                  <motion.div
                    key={post.post_id || index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => openPostModal(post)}
                    className="aspect-square relative group cursor-pointer overflow-hidden rounded-xl bg-gray-100"
                  >
                    {post.media_url ? (
                      <img 
                        src={post.media_url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-post.svg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-3">
                        <p className="text-xs text-gray-600 line-clamp-4">{post.caption}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Bookmark size={24} className="text-white" fill="white" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Bookmark size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Aucune publication enregistrée</p>
                <p className="text-sm text-gray-400 mt-2">Enregistrez des posts en cliquant sur le signet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Friends Modal */}
      <AnimatePresence>
        {showFriendsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFriendsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden max-h-[80vh]"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-bold text-lg">Amis ({friends.length})</h3>
                <button 
                  onClick={() => setShowFriendsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[60vh] p-4">
                {loadingFriends ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 text-[#00899B] animate-spin" />
                  </div>
                ) : friends.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Aucun ami pour le moment</p>
                ) : (
                  <div className="space-y-3">
                    {friends.map((friend) => (
                      <Link
                        key={friend.user_id}
                        to={`/profile/${friend.user_id}`}
                        onClick={() => setShowFriendsModal(false)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={friend.picture} />
                          <AvatarFallback className="bg-[#00899B] text-white">
                            {friend.name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-[#2F2F31]">{friend.name}</p>
                          {friend.friends_since && (
                            <p className="text-xs text-gray-400">
                              Amis depuis {new Date(friend.friends_since).toLocaleDateString('fr-FR')}
                            </p>
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

      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 md:p-4"
            onClick={closePostModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden max-h-[95vh] flex flex-col md:flex-row"
            >
              {/* Image Section */}
              <div className="md:w-1/2 bg-black flex items-center justify-center relative">
                {selectedPost.media_url ? (
                  <img 
                    src={selectedPost.media_url}
                    alt=""
                    className="max-h-[40vh] md:max-h-[90vh] w-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-post.svg';
                    }}
                  />
                ) : (
                  <div className="p-8 text-white text-center">
                    <p className="text-lg">{selectedPost.caption}</p>
                  </div>
                )}
                
                {/* Close button on mobile */}
                <button
                  onClick={closePostModal}
                  className="absolute top-2 right-2 md:hidden p-2 bg-black/50 rounded-full text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Details Section */}
              <div className="md:w-1/2 flex flex-col max-h-[55vh] md:max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <Link 
                    to={`/profile/${selectedPost.user_id}`}
                    className="flex items-center gap-3"
                    onClick={closePostModal}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedPost.user?.picture || displayUser?.picture} />
                      <AvatarFallback className="bg-[#FF6B35] text-white">
                        {(selectedPost.user?.name || displayUser?.name)?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-[#1A1A2E]">
                      {selectedPost.user?.name || displayUser?.name}
                    </span>
                  </Link>
                  <div className="flex items-center gap-2">
                    {/* Delete button - only for own posts */}
                    {(selectedPost.user_id === user?.user_id || isOwnProfile) && (
                      <button
                        onClick={async () => {
                          if (window.confirm('Voulez-vous vraiment supprimer cette publication ?')) {
                            try {
                              const token = localStorage.getItem('nati_session_token');
                              const res = await fetch(`${API}/api/posts/${selectedPost.post_id}`, {
                                method: 'DELETE',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json'
                                },
                                credentials: 'include'
                              });
                              if (res.ok) {
                                setPosts(prev => prev.filter(p => p.post_id !== selectedPost.post_id));
                                setSelectedPost(null);
                                toast.success('Publication supprimée');
                              } else {
                                throw new Error('Erreur');
                              }
                            } catch (error) {
                              toast.error('Erreur lors de la suppression');
                            }
                          }
                        }}
                        className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                    <button
                      onClick={closePostModal}
                      className="hidden md:block p-2 hover:bg-gray-100 rounded-full"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Caption */}
                {selectedPost.caption && selectedPost.media_url && (
                  <div className="p-4 border-b">
                    <p className="text-[#1A1A2E]">{selectedPost.caption}</p>
                  </div>
                )}

                {/* Comments */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingComments ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                  ) : postComments.length === 0 ? (
                    <p className="text-center text-gray-400 py-4">Aucun commentaire</p>
                  ) : (
                    postComments.map((comment) => (
                      <div key={comment.comment_id} className="flex gap-3">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={comment.user?.picture} />
                          <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                            {comment.user?.name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm">
                            <Link 
                              to={`/profile/${comment.user_id}`}
                              onClick={closePostModal}
                              className="font-bold text-[#1A1A2E] hover:underline mr-2"
                            >
                              {comment.user?.name || 'Utilisateur'}
                            </Link>
                            {comment.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Actions */}
                <div className="border-t p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <button
                      onClick={handleLikePost}
                      className="hover:opacity-70 transition-opacity"
                    >
                      <Heart 
                        size={24} 
                        className={selectedPost.user_liked ? 'text-red-500 fill-red-500' : 'text-[#1A1A2E]'}
                      />
                    </button>
                    <button className="hover:opacity-70 transition-opacity">
                      <MessageCircle size={24} className="text-[#1A1A2E]" />
                    </button>
                    <button
                      onClick={handleSavePost}
                      className="ml-auto hover:opacity-70 transition-opacity"
                    >
                      <Bookmark size={24} className="text-[#1A1A2E]" />
                    </button>
                  </div>
                  <p className="font-bold text-sm mb-2">{selectedPost.likes_count || 0} J'aime</p>
                  <p className="text-xs text-gray-400 mb-3">
                    {new Date(selectedPost.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>

                  {/* Comment input */}
                  {user && (
                    <form onSubmit={handleSubmitComment} className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Ajouter un commentaire..."
                        className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#00899B]"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!newComment.trim() || submittingComment}
                        className="rounded-full bg-[#00899B] hover:bg-[#007585]"
                      >
                        {submittingComment ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
