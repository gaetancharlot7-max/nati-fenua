import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, UserCheck, UserX, Clock, ArrowLeft,
  Check, X, Loader2, MessageCircle, ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const FriendsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [friendsRes, sentRes, receivedRes] = await Promise.all([
        fetch(`${API}/api/friends`, { credentials: 'include' }),
        fetch(`${API}/api/friends/requests/sent`, { credentials: 'include' }),
        fetch(`${API}/api/friends/requests/received`, { credentials: 'include' })
      ]);

      if (friendsRes.ok) setFriends(await friendsRes.json());
      if (sentRes.ok) setSentRequests(await sentRes.json());
      if (receivedRes.ok) setReceivedRequests(await receivedRes.json());
    } catch (error) {
      console.error('Error loading friends data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    setActionLoading(requestId);
    try {
      const response = await fetch(`${API}/api/friends/request/${requestId}/accept`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Demande acceptée !');
        loadData();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Erreur');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'acceptation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId) => {
    setActionLoading(requestId);
    try {
      const response = await fetch(`${API}/api/friends/request/${requestId}/reject`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Demande refusée');
        setReceivedRequests(prev => prev.filter(r => r.request_id !== requestId));
      } else {
        toast.error('Erreur');
      }
    } catch (error) {
      toast.error('Erreur lors du refus');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (requestId) => {
    setActionLoading(requestId);
    try {
      const response = await fetch(`${API}/api/friends/request/${requestId}/cancel`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Demande annulée');
        setSentRequests(prev => prev.filter(r => r.request_id !== requestId));
      } else {
        toast.error('Erreur');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'annulation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir retirer cet ami ?')) return;
    
    setActionLoading(friendId);
    try {
      const response = await fetch(`${API}/api/friends/${friendId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Ami retiré');
        setFriends(prev => prev.filter(f => f.user_id !== friendId));
      } else {
        toast.error('Erreur');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { id: 'friends', label: 'Amis', icon: Users, count: friends.length },
    { id: 'received', label: 'Reçues', icon: UserPlus, count: receivedRequests.length },
    { id: 'sent', label: 'Envoyées', icon: Clock, count: sentRequests.length }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] to-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#FF6B35] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 safe-bottom">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Mes Amis</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-2xl shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon size={18} />
            <span className="text-sm font-medium">{tab.label}</span>
            {tab.count > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* Friends List */}
        {activeTab === 'friends' && (
          <motion.div
            key="friends"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            {friends.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Aucun ami pour le moment</p>
                <p className="text-sm text-gray-400 mt-1">Explorez et envoyez des demandes d'amis !</p>
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.user_id}
                  className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4"
                >
                  <img
                    src={friend.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=FF6B35&color=fff`}
                    alt={friend.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                    onClick={() => navigate(`/profile/${friend.user_id}`)}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-bold text-[#1A1A2E] cursor-pointer hover:text-[#FF6B35] truncate"
                      onClick={() => navigate(`/profile/${friend.user_id}`)}
                    >
                      {friend.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      Amis depuis {new Date(friend.friends_since).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/chat/${friend.user_id}`)}
                      className="rounded-full"
                    >
                      <MessageCircle size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveFriend(friend.user_id)}
                      disabled={actionLoading === friend.user_id}
                      className="rounded-full text-red-500 border-red-200 hover:bg-red-50"
                    >
                      {actionLoading === friend.user_id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <UserX size={16} />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* Received Requests */}
        {activeTab === 'received' && (
          <motion.div
            key="received"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            {receivedRequests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl">
                <UserPlus size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Aucune demande reçue</p>
              </div>
            ) : (
              receivedRequests.map((request) => (
                <div
                  key={request.request_id}
                  className="bg-white rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={request.sender?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.sender?.name || '?')}&background=FF6B35&color=fff`}
                      alt={request.sender?.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow cursor-pointer"
                      onClick={() => navigate(`/profile/${request.sender?.user_id}`)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#1A1A2E] truncate">{request.sender?.name}</p>
                      <p className="text-xs text-gray-400">
                        Demande reçue le {new Date(request.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => handleAccept(request.request_id)}
                      disabled={actionLoading === request.request_id}
                      className="flex-1 bg-gradient-to-r from-[#00CED1] to-[#006994] hover:opacity-90"
                    >
                      {actionLoading === request.request_id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <Check size={18} className="mr-2" />
                          Accepter
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleReject(request.request_id)}
                      disabled={actionLoading === request.request_id}
                      variant="outline"
                      className="flex-1 text-red-500 border-red-200 hover:bg-red-50"
                    >
                      <X size={18} className="mr-2" />
                      Refuser
                    </Button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* Sent Requests */}
        {activeTab === 'sent' && (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            {sentRequests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl">
                <Clock size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Aucune demande envoyée</p>
              </div>
            ) : (
              sentRequests.map((request) => (
                <div
                  key={request.request_id}
                  className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4"
                >
                  <img
                    src={request.receiver?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.receiver?.name || '?')}&background=FF6B35&color=fff`}
                    alt={request.receiver?.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow cursor-pointer"
                    onClick={() => navigate(`/profile/${request.receiver?.user_id}`)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1A1A2E] truncate">{request.receiver?.name}</p>
                    <div className="flex items-center gap-2 text-xs text-amber-600">
                      <Clock size={12} />
                      En attente
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancel(request.request_id)}
                    disabled={actionLoading === request.request_id}
                    className="text-gray-500"
                  >
                    {actionLoading === request.request_id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      'Annuler'
                    )}
                  </Button>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FriendsPage;
