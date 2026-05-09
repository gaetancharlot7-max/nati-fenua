import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { authFetch } from '../lib/api';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * Email verification page — user enters the 6-digit code sent to their email.
 * Branched after sign-up (email/password) before redirecting to feed.
 * Skipped silently if email is already verified.
 */
const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Send a fresh code on first mount
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    sendCode();
  }, [user]);

  // Countdown for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const sendCode = async () => {
    setResending(true);
    try {
      const res = await authFetch(`${API}/api/auth/send-verification`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        if (data.message === 'Email déjà vérifié') {
          setVerified(true);
          setTimeout(() => navigate('/feed', { replace: true }), 1500);
        } else {
          toast.success('Code envoyé ! Vérifiez votre boîte mail');
          setResendCooldown(60);
        }
      } else {
        toast.error(data.detail || "Échec de l'envoi du code");
      }
    } catch {
      toast.error('Erreur réseau, réessayez');
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (idx, value) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    // Auto-focus next input
    if (digit && idx < 5) {
      document.getElementById(`code-${idx + 1}`)?.focus();
    }
    // Auto-submit when complete
    if (next.every(d => d) && next.join('').length === 6) {
      submitCode(next.join(''));
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      document.getElementById(`code-${idx - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split('');
      setCode(next);
      submitCode(pasted);
    }
  };

  const submitCode = async (fullCode) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`${API}/api/auth/verify-email`, {
        method: 'POST',
        body: JSON.stringify({ code: fullCode })
      });
      const data = await res.json();
      if (data.success) {
        setVerified(true);
        toast.success('Email vérifié ! 🌺');
        await checkAuth();
        setTimeout(() => navigate('/feed', { replace: true }), 1500);
      } else {
        toast.error(data.detail || 'Code incorrect');
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-0')?.focus();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur de vérification');
      setCode(['', '', '', '', '', '']);
    } finally {
      setSubmitting(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5F0] via-white to-[#FFE5DC] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
          data-testid="verify-success"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF1493] mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A2E] mb-2">Email vérifié !</h1>
          <p className="text-gray-600">Redirection vers votre feed…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F0] via-white to-[#FFE5DC] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 sm:p-10"
        data-testid="verify-email-page"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF1493] mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A2E] mb-2">
            Vérifiez votre email
          </h1>
          <p className="text-gray-600 text-sm">
            Nous avons envoyé un code à 6 chiffres à
          </p>
          <p className="text-[#FF6B35] font-semibold flex items-center justify-center gap-2 mt-1">
            <Mail size={14} />
            <span>{user?.email}</span>
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
          {code.map((digit, idx) => (
            <input
              key={idx}
              id={`code-${idx}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              data-testid={`code-input-${idx}`}
              autoFocus={idx === 0}
              disabled={submitting}
              className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all"
            />
          ))}
        </div>

        {submitting && (
          <div className="flex items-center justify-center gap-2 text-[#FF6B35] mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Vérification…</span>
          </div>
        )}

        <div className="text-center text-sm text-gray-500 mb-4">
          Vous n'avez rien reçu ? Vérifiez vos spams.
        </div>

        <Button
          type="button"
          onClick={sendCode}
          disabled={resending || resendCooldown > 0}
          variant="outline"
          data-testid="resend-code-btn"
          className="w-full py-5 rounded-xl border-2 border-gray-200 hover:bg-gray-50"
        >
          {resending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {resendCooldown > 0
            ? `Renvoyer le code (${resendCooldown}s)`
            : 'Renvoyer le code'}
        </Button>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigate('/feed', { replace: true })}
            data-testid="skip-verification-btn"
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Plus tard
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
