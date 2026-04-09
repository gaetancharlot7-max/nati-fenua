import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [searchParams] = useSearchParams();

  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Check for OAuth errors
  const oauthError = searchParams.get('error');
  if (oauthError) {
    toast.error('Erreur de connexion Facebook. Veuillez réessayer.');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('Ia ora na ! Connexion réussie');
      } else {
        await register(formData.email, formData.password, formData.name);
        toast.success('Maeva ! Compte créé avec succès');
      }
      navigate('/feed');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  // Facebook login removed - using Google OAuth only

  // Nati Fenua Logo Component - Logo personnalisé SVG
  const NatiFenuaLogo = ({ size = 'md' }) => {
    const sizes = {
      sm: 'w-10 h-10',
      md: 'w-14 h-14',
      lg: 'w-16 h-16'
    };
    
    return (
      <div className="relative rotate-3">
        <img 
          src="/assets/logo_nati_fenua_custom.svg" 
          alt="Nati Fenua"
          className={`${sizes[size]} drop-shadow-lg`}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1703549068359-49d854524ddd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwyfHx0YWhpdGklMjBidW5nYWxvdyUyMG92ZXJ3YXRlcnxlbnwwfHx8fDE3NzI3ODk3NTl8MA&ixlib=rb-4.1.0&q=85)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35]/80 via-[#FF1493]/60 to-transparent"></div>
        </div>
        
        <div className="relative z-10 p-12 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <NatiFenuaLogo size="md" />
            <h1 className="text-3xl font-black text-white">
              Nati <span className="text-white/90">Fenua</span>
            </h1>
          </div>
          
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Bienvenue sur le réseau social polynésien
            </h2>
            <p className="text-white/80 text-lg">
              Partagez, connectez-vous et découvrez le meilleur de nos îles.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-b from-[#FFF5E6] to-white">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <NatiFenuaLogo size="md" />
            <h1 className="text-3xl font-black">
              <span className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] bg-clip-text text-transparent">Nati</span>
              <span className="text-[#1A1A2E]"> Fenua</span>
            </h1>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">
              {isLogin ? 'Connexion' : 'Inscription'}
            </h2>
            <p className="text-gray-500 mb-8">
              {isLogin 
                ? 'Heureux de vous revoir !' 
                : 'Créez votre compte Nati Fenua'}
            </p>

            {/* Google Login Button */}
            <Button
              type="button"
              variant="outline"
              data-testid="google-login-btn"
              onClick={handleGoogleLogin}
              className="w-full mb-6 py-6 rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-all"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </Button>

            {/* Facebook login removed - Google OAuth only */}

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">ou</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#1A1A2E]">Nom complet</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                      id="name"
                      data-testid="name-input"
                      type="text"
                      placeholder="Votre nom"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-12 py-6 rounded-xl border-gray-200 focus:border-[#FF6B35] focus:ring-[#FF6B35]"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#1A1A2E]">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="email"
                    data-testid="email-input"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-12 py-6 rounded-xl border-gray-200 focus:border-[#FF6B35] focus:ring-[#FF6B35]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#1A1A2E]">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="password"
                    data-testid="password-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-12 pr-12 py-6 rounded-xl border-gray-200 focus:border-[#FF6B35] focus:ring-[#FF6B35]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="text-right">
                  <a 
                    href="/forgot-password" 
                    className="text-sm text-[#FF6B35] hover:underline"
                    data-testid="forgot-password-link"
                  >
                    Mot de passe oublié ?
                  </a>
                </div>
              )}

              <Button
                type="submit"
                data-testid="submit-auth-btn"
                disabled={loading}
                className="w-full py-6 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] hover:from-[#FF5722] hover:to-[#E91E63] text-white font-medium transition-all duration-300"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    {isLogin ? 'Se connecter' : "S'inscrire"}
                    <ArrowRight className="ml-2" size={20} />
                  </>
                )}
              </Button>
            </form>

            <p className="text-center mt-6 text-gray-500">
              {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                data-testid="toggle-auth-btn"
                className="ml-2 text-[#FF6B35] font-medium hover:underline"
              >
                {isLogin ? "S'inscrire" : "Se connecter"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
