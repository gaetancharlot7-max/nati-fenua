import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, ArrowLeft, Send, MoreHorizontal, Flag, Trash2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { postsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const PostDetailPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      const [postRes, commentsRes] = await Promise.all([
        postsApi.getById(postId),
        postsApi.getComments(postId)
      ]);
      setPost(postRes.data);
      setLikesCount(postRes.data.likes_count || 0);
      setComments(commentsRes.data || []);
    } catch (error) {
      console.error('Error loading post:', error);
      toast.error('Publication non trouvée');
      navigate('/feed');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await postsApi.like(postId);
      setLiked(response.data.liked);
      setLikesCount(prev => response.data.liked ? prev + 1 : prev - 1);
    } catch (error) {
      toast.error('Erreur lors du like');
    }
  };

  const handleSave = async () => {
    try {
      const response = await postsApi.save(postId);
      setSaved(response.data.saved);
      toast.success(response.data.saved ? 'Publication enregistrée' : 'Publication retirée');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await postsApi.addComment(postId, newComment);
      setComments([...comments, {
        comment_id: Date.now(),
        content: newComment,
        user: user,
        created_at: new Date().toISOString()
      }]);
      setNewComment('');
      toast.success('Commentaire ajouté');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-semibold">Publication</h1>
      </div>

      {/* Post Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl overflow-hidden shadow-lg"
      >
        {/* Post Header */}
        <div className="p-4 flex items-center justify-between">
          <Link to={`/profile/${post.user_id}`} className="flex items-center gap-3">
            <Avatar className="w-12 h-12 rounded-xl">
              <AvatarImage src={post.user?.picture} className="rounded-xl" />
              <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white rounded-xl">
                {post.user?.name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-[#1A1A2E]">{post.user?.name || 'Utilisateur'}</p>
              <p className="text-gray-500 text-sm">{formatDate(post.created_at)}</p>
            </div>
          </Link>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Post Media */}
        {post.media_url && (
          <div className="aspect-square">
            {post.content_type === 'video' ? (
              <video 
                src={post.media_url} 
                className="w-full h-full object-cover"
                controls
              />
            ) : (
              <img 
                src={post.media_url} 
                alt={post.caption || 'Post'}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        {/* Post Actions */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleLike}
                data-testid="like-btn"
                className="p-2 rounded-full hover:bg-gray-100 transition-all"
              >
                <Heart 
                  size={26} 
                  className={liked ? 'text-red-500 fill-red-500' : 'text-[#1A1A2E]'}
                  strokeWidth={1.5}
                />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100">
                <MessageCircle size={26} strokeWidth={1.5} />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Share2 size={26} strokeWidth={1.5} />
              </button>
            </div>
            <button 
              onClick={handleSave}
              data-testid="save-btn"
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Bookmark 
                size={26} 
                className={saved ? 'text-[#FF6B35] fill-[#FF6B35]' : 'text-[#1A1A2E]'}
                strokeWidth={1.5}
              />
            </button>
          </div>

          {/* Likes count */}
          <p className="font-bold text-[#1A1A2E] mb-2">{likesCount} J'aime</p>

          {/* Caption */}
          {post.caption && (
            <p className="text-[#1A1A2E] mb-4">
              <Link to={`/profile/${post.user_id}`} className="font-bold mr-2">
                {post.user?.name}
              </Link>
              {post.caption}
            </p>
          )}

          {/* Comments */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <p className="font-semibold mb-4">{comments.length} commentaire{comments.length !== 1 ? 's' : ''}</p>
            
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.comment_id} className="flex gap-3">
                  <Avatar className="w-8 h-8 rounded-lg">
                    <AvatarImage src={comment.user?.picture} className="rounded-lg" />
                    <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white text-xs rounded-lg">
                      {comment.user?.name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm">
                      <span className="font-bold">{comment.user?.name || 'Utilisateur'}</span>{' '}
                      {comment.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(comment.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add comment */}
            <form onSubmit={handleComment} className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
              <Avatar className="w-10 h-10 rounded-xl">
                <AvatarImage src={user?.picture} className="rounded-xl" />
                <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white rounded-xl">
                  {user?.name?.[0]}
                </AvatarFallback>
              </Avatar>
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className="flex-1 rounded-full"
              />
              <Button 
                type="submit" 
                disabled={!newComment.trim()}
                className="rounded-full bg-[#FF6B35] hover:bg-[#FF5722]"
              >
                <Send size={18} />
              </Button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PostDetailPage;
