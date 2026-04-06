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

        // Clean up URL immediately to prevent confusion
        window.history.replaceState(null, '', '/feed');

        if (sessionToken) {
          // Native Google OAuth - session already created, just verify
          // Re-check auth to load user data (cookie is already set)
          if (checkAuth) await checkAuth();
          toast.success('Ia ora na ! Connexion réussie 🌺');
          navigate('/feed', { replace: true });
          return;
        }

        if (sessionId) {
          // Legacy Emergent Auth flow
          await exchangeSession(sessionId);
          toast.success('Ia ora na ! Connexion réussie 🌺');
          navigate('/feed', { replace: true });
          return;
        }

        // No session found
        toast.error('Session invalide');
        navigate('/auth', { replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Erreur de connexion');
        navigate('/auth', { replace: true });
      }
    };

    processSession();
  }, [exchangeSession, checkAuth, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1A1A2E] to-[#16213E]">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-[#FF6B35] via-[#FF1493] to-[#00CED1] rounded-2xl flex items-center justify-center animate-pulse">
          <span className="text-4xl font-serif text-white">N</span>
        </div>
        <div className="w-12 h-12 border-4 border-[#00CED1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white font-medium text-lg">Connexion en cours...</p>
        <p className="text-gray-400 text-sm mt-2">Ia ora na ! 🌺</p>
      </div>
    </div>
  );
};

export default AuthCallback;
