import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const AuthCallback = () => {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { exchangeSession, checkAuth } = useAuth();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        setStatus('processing');
        
        // Extract session_token from URL fragment OR query params
        // Fragment: #session_token=xxx
        // Query: ?session_token=xxx (fallback for some browsers)
        const hash = window.location.hash;
        const search = window.location.search;
        
        let sessionToken = null;
        let sessionId = null;
        
        // Try fragment first
        if (hash) {
          const hashParams = new URLSearchParams(hash.replace('#', ''));
          sessionToken = hashParams.get('session_token');
          sessionId = hashParams.get('session_id');
        }
        
        // Fallback to query params
        if (!sessionToken && !sessionId && search) {
          const queryParams = new URLSearchParams(search);
          sessionToken = queryParams.get('session_token');
          sessionId = queryParams.get('session_id');
        }
        
        // Check for error
        const errorParam = new URLSearchParams(search).get('error') || 
                          new URLSearchParams(hash.replace('#', '')).get('error');
        
        if (errorParam) {
          setStatus('error');
          toast.error('Erreur de connexion Google');
          setTimeout(() => navigate('/auth', { replace: true }), 2000);
          return;
        }

        // Clean up URL immediately
        window.history.replaceState(null, '', '/auth/callback');

        if (sessionToken) {
          setStatus('verifying');
          
          // For iOS Safari: Store token in localStorage as backup
          try {
            localStorage.setItem('pending_session_token', sessionToken);
          } catch (e) {
            console.warn('localStorage not available');
          }
          
          // Wait a moment for cookie to be set, then verify
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Re-check auth to load user data
          if (checkAuth) {
            const authResult = await checkAuth();
            if (authResult) {
              setStatus('success');
              toast.success('Ia ora na ! Connexion réussie 🌺');
              
              // Clean up
              try {
                localStorage.removeItem('pending_session_token');
              } catch (e) {}
              
              // Redirect to feed
              setTimeout(() => {
                navigate('/feed', { replace: true });
              }, 500);
              return;
            }
          }
          
          // If checkAuth failed but we have token, still try to proceed
          setStatus('success');
          toast.success('Ia ora na ! Connexion réussie 🌺');
          setTimeout(() => {
            navigate('/feed', { replace: true });
          }, 500);
          return;
        }

        if (sessionId) {
          setStatus('verifying');
          // Legacy Emergent Auth flow
          await exchangeSession(sessionId);
          setStatus('success');
          toast.success('Ia ora na ! Connexion réussie 🌺');
          setTimeout(() => {
            navigate('/feed', { replace: true });
          }, 500);
          return;
        }

        // No session found - redirect back to auth
        setStatus('error');
        toast.error('Session invalide - veuillez réessayer');
        setTimeout(() => navigate('/auth', { replace: true }), 2000);
        
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        toast.error('Erreur de connexion');
        setTimeout(() => navigate('/auth', { replace: true }), 2000);
      }
    };

    processSession();
  }, [exchangeSession, checkAuth, navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1A1A2E] to-[#16213E]">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 animate-pulse">
          <img 
            src="/assets/logo_nati_fenua_v2.svg" 
            alt="Nati Fenua"
            className="w-full h-full drop-shadow-xl"
          />
        </div>
        
        {status === 'processing' && (
          <>
            <div className="w-12 h-12 border-4 border-[#00CED1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white font-medium text-lg">Connexion en cours...</p>
          </>
        )}
        
        {status === 'verifying' && (
          <>
            <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white font-medium text-lg">Vérification...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-medium text-lg">Connexion réussie !</p>
            <p className="text-gray-400 text-sm mt-2">Redirection vers l'accueil...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-white font-medium text-lg">Erreur de connexion</p>
            <p className="text-gray-400 text-sm mt-2">Redirection...</p>
          </>
        )}
        
        <p className="text-gray-500 text-xs mt-6">Ia ora na ! 🌺</p>
      </div>
    </div>
  );
};

export default AuthCallback;
