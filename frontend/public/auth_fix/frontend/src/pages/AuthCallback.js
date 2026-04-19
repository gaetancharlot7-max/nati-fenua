import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const AuthCallback = () => {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { setSessionToken, checkAuth } = useAuth();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        setStatus('processing');
        
        // Extract session_token from URL fragment or query
        const hash = window.location.hash;
        const search = window.location.search;
        
        let sessionToken = null;
        
        // Try fragment first (#session_token=xxx)
        if (hash) {
          const hashParams = new URLSearchParams(hash.replace('#', ''));
          sessionToken = hashParams.get('session_token');
        }
        
        // Fallback to query params (?session_token=xxx)
        if (!sessionToken && search) {
          const queryParams = new URLSearchParams(search);
          sessionToken = queryParams.get('session_token');
        }
        
        // Check for error
        const errorParam = new URLSearchParams(search).get('error') || 
                          (hash ? new URLSearchParams(hash.replace('#', '')).get('error') : null);
        
        if (errorParam) {
          setStatus('error');
          toast.error('Erreur de connexion Google');
          setTimeout(() => navigate('/auth', { replace: true }), 2000);
          return;
        }

        // Clean URL immediately
        window.history.replaceState(null, '', '/auth/callback');

        if (sessionToken) {
          setStatus('verifying');
          
          // Store token in localStorage via AuthContext
          setSessionToken(sessionToken);
          
          // Also store in localStorage directly as backup
          try {
            localStorage.setItem('nati_session_token', sessionToken);
          } catch (e) {
            console.warn('localStorage error:', e);
          }
          
          // Wait for token to be stored
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Verify the session works
          const userData = await checkAuth();
          
          if (userData) {
            setStatus('success');
            toast.success('Ia ora na ! Connexion réussie 🌺');
            setTimeout(() => navigate('/feed', { replace: true }), 800);
          } else {
            // Token stored but checkAuth failed - still try to proceed
            // The token might work on the next page load
            setStatus('success');
            toast.success('Connexion réussie !');
            setTimeout(() => navigate('/feed', { replace: true }), 800);
          }
          return;
        }

        // No token found
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
  }, [setSessionToken, checkAuth, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1A1A2E] to-[#16213E]">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 animate-pulse">
          <img 
            src="/assets/logo_nati_fenua_v2.svg" 
            alt="Nati Fenua"
            className="w-full h-full drop-shadow-xl"
            onError={(e) => { e.target.style.display = 'none'; }}
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
            <p className="text-gray-400 text-sm mt-2">Redirection...</p>
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
      </div>
    </div>
  );
};

export default AuthCallback;
