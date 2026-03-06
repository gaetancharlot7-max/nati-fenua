import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const AuthCallback = () => {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { exchangeSession } = useAuth();

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', ''));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          toast.error('Session invalide');
          navigate('/auth');
          return;
        }

        // Exchange session_id for user data
        await exchangeSession(sessionId);
        
        toast.success('Ia ora na ! Connexion réussie');
        
        // Clear the hash and navigate
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/feed', { replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Erreur de connexion');
        navigate('/auth');
      }
    };

    processSession();
  }, [exchangeSession, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF4E6]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#00899B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#2F2F31] font-medium">Connexion en cours...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
