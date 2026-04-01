import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const AuthCallback = () => {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { exchangeSession, checkAuth } = useAuth();

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        // Extract session_token from URL fragment (native Google OAuth)
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', ''));
        const sessionToken = params.get('session_token');
        const sessionId = params.get('session_id');

        if (sessionToken) {
          // Native Google OAuth - session already created, just verify
          toast.success('Ia ora na ! Connexion réussie');
          window.history.replaceState(null, '', window.location.pathname);
          // Re-check auth to load user data (cookie is already set)
          if (checkAuth) await checkAuth();
          navigate('/feed', { replace: true });
          return;
        }

        if (sessionId) {
          // Legacy Emergent Auth flow
          await exchangeSession(sessionId);
          toast.success('Ia ora na ! Connexion réussie');
          window.history.replaceState(null, '', window.location.pathname);
          navigate('/feed', { replace: true });
          return;
        }

        // No session found
        toast.error('Session invalide');
        navigate('/auth');
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Erreur de connexion');
        navigate('/auth');
      }
    };

    processSession();
  }, [exchangeSession, checkAuth, navigate]);

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
