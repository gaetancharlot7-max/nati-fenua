import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/admin/login`, {
        email,
        password
      });

      if (response.data.success) {
        localStorage.setItem('admin_token', response.data.token);
        localStorage.setItem('admin_email', email);
        toast.success('Connexion admin réussie');
        navigate('/admin/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] flex items-center justify-center mb-4">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Administration</h1>
            <p className="text-white/60 text-sm mt-1">Nati Fenua</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Email Admin</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@fenuasocial.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 py-6 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#FF6B35]"
                  required
                  data-testid="admin-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 py-6 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#FF6B35]"
                  required
                  data-testid="admin-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              data-testid="admin-login-btn"
              className="w-full py-6 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] hover:from-[#FF5722] hover:to-[#E91E63] text-white font-medium transition-all duration-300"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="ml-2" size={20} />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Accès réservé aux administrateurs
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
