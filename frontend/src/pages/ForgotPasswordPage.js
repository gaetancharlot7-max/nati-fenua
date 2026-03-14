import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../lib/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Veuillez entrer votre email');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/request-password-reset', { email });
      setSubmitted(true);
      toast.success('Email envoyé !');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
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
            Email envoyé !
          </h1>
          
          <p className="text-gray-600 mb-6">
            Si un compte existe avec l'email <strong>{email}</strong>, 
            vous recevrez un lien de réinitialisation dans quelques minutes.
          </p>
          
          <p className="text-sm text-gray-500 mb-6">
            Pensez à vérifier vos spams si vous ne voyez pas l'email.
          </p>
          
          <Link to="/auth">
            <Button className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493]">
              Retour à la connexion
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
        <Link 
          to="/auth" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#FF6B35] mb-6"
        >
          <ArrowLeft size={20} />
          Retour
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-[#FF6B35] to-[#FF1493] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">
            Mot de passe oublié ?
          </h1>
          <p className="text-gray-500 mt-2">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <Input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              data-testid="forgot-password-email"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white py-3 rounded-xl font-medium"
            data-testid="forgot-password-submit"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Envoyer le lien'
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Vous vous souvenez ? {' '}
          <Link to="/auth" className="text-[#FF6B35] font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
