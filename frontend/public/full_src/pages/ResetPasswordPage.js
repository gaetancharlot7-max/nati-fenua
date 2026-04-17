import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../lib/api';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password || password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { 
        token, 
        new_password: password 
      });
      setSuccess(true);
      toast.success('Mot de passe modifié avec succès !');
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (detail === 'Token invalide ou expiré') {
        setTokenValid(false);
      }
      toast.error(detail || 'Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-4">
            Lien invalide ou expiré
          </h1>
          
          <p className="text-gray-600 mb-6">
            Ce lien de réinitialisation n'est plus valide. 
            Les liens expirent après 1 heure.
          </p>
          
          <Link to="/forgot-password">
            <Button className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] mb-3">
              Demander un nouveau lien
            </Button>
          </Link>
          
          <Link to="/auth" className="text-gray-500 hover:text-[#FF6B35]">
            Retour à la connexion
          </Link>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-4">
            Mot de passe modifié !
          </h1>
          
          <p className="text-gray-600 mb-6">
            Votre mot de passe a été réinitialisé avec succès. 
            Vous pouvez maintenant vous connecter.
          </p>
          
          <Link to="/auth">
            <Button className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493]">
              Se connecter
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-[#FF6B35] to-[#FF1493] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">
            Nouveau mot de passe
          </h1>
          <p className="text-gray-500 mt-2">
            Choisissez un mot de passe sécurisé
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-10"
                data-testid="reset-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum 8 caractères
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le mot de passe
            </label>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full"
              data-testid="reset-password-confirm"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white py-3 rounded-xl font-medium"
            data-testid="reset-password-submit"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Réinitialiser le mot de passe'
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
