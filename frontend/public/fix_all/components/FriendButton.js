import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Clock, Loader2, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const FriendButton = ({ userId, onStatusChange, size = 'default', className = '' }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user && userId && user.user_id !== userId) {
      loadStatus();
    } else {
      setLoading(false);
    }
  }, [user, userId]);

  const loadStatus = async () => {
    try {
      const response = await fetch(`${API}/api/friends/status/${userId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
        setRequestId(data.request_id);
      }
    } catch (error) {
      console.error('Error loading friendship status:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API}/api/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId })
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatus('request_sent');
        setRequestId(data.request_id);
        toast.success('Demande envoyée !');
        onStatusChange?.('request_sent');
      } else {
        toast.error(data.detail || 'Erreur');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setActionLoading(false);
    }
  };

  const cancelRequest = async () => {
    if (!requestId) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`${API}/api/friends/request/${requestId}/cancel`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setStatus('none');
        setRequestId(null);
        toast.success('Demande annulée');
        onStatusChange?.('none');
      }
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const acceptRequest = async () => {
    if (!requestId) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`${API}/api/friends/request/${requestId}/accept`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setStatus('friends');
        toast.success('Vous êtes maintenant amis !');
        onStatusChange?.('friends');
      }
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const rejectRequest = async () => {
    if (!requestId) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`${API}/api/friends/request/${requestId}/reject`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setStatus('none');
        setRequestId(null);
        toast.success('Demande refusée');
        onStatusChange?.('none');
      }
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  // Don't show for own profile or if not logged in
  if (!user || user.user_id === userId) {
    return null;
  }

  if (loading) {
    return (
      <Button disabled size={size} className={`rounded-full ${className}`}>
        <Loader2 size={16} className="animate-spin" />
      </Button>
    );
  }

  // Already friends
  if (status === 'friends') {
    return (
      <Button
        size={size}
        variant="outline"
        className={`rounded-full bg-green-50 text-green-600 border-green-200 hover:bg-green-100 ${className}`}
        disabled
      >
        <UserCheck size={16} className="mr-2" />
        Ami
      </Button>
    );
  }

  // Request sent - waiting for response
  if (status === 'request_sent') {
    return (
      <Button
        size={size}
        variant="outline"
        onClick={cancelRequest}
        disabled={actionLoading}
        className={`rounded-full bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 ${className}`}
      >
        {actionLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            <Clock size={16} className="mr-2" />
            En attente
          </>
        )}
      </Button>
    );
  }

  // Request received - show accept/reject
  if (status === 'request_received') {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Button
          size={size}
          onClick={acceptRequest}
          disabled={actionLoading}
          className="rounded-full bg-gradient-to-r from-[#00CED1] to-[#006994]"
        >
          {actionLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Check size={16} className="mr-1" />
              Accepter
            </>
          )}
        </Button>
        <Button
          size={size}
          variant="outline"
          onClick={rejectRequest}
          disabled={actionLoading}
          className="rounded-full text-red-500 border-red-200 hover:bg-red-50"
        >
          <X size={16} />
        </Button>
      </div>
    );
  }

  // No relationship - show add button
  return (
    <Button
      size={size}
      onClick={sendRequest}
      disabled={actionLoading}
      className={`rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] hover:opacity-90 ${className}`}
    >
      {actionLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <>
          <UserPlus size={16} className="mr-2" />
          Ajouter
        </>
      )}
    </Button>
  );
};

export default FriendButton;
