import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, AlertTriangle, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * Public page (no auth required) where any user can request account deletion.
 *
 * Required by Google Play Store policy (since 2024) — apps must offer a way to
 * request data deletion **without requiring a sign-in**, accessible from a public
 * URL listed in the Play Store listing.
 *
 * Listed in the Play Console at:
 *   Data safety → "Account deletion URL" = https://nati-fenua.com/account/delete-request
 */
const AccountDeletePage = () => {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (confirmText.trim().toUpperCase() !== 'SUPPRIMER') {
      toast.error('Tapez SUPPRIMER en majuscules pour confirmer');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/account/delete-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), reason: reason.trim() })
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.detail || 'Erreur lors de la demande. Réessayez plus tard.');
      }
    } catch (err) {
      toast.error('Erreur réseau. Réessayez plus tard.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5F0] via-white to-[#FFE5DC] flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-8 sm:p-10 text-center"
          data-testid="delete-request-success"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF1493] mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A2E] mb-4">Demande reçue</h1>
          <p className="text-gray-600 mb-2">
            Mauruuru ! Votre demande de suppression de compte a bien été enregistrée.
          </p>
          <p className="text-gray-600 mb-6">
            Vous recevrez un email de confirmation à <strong>{email}</strong> dans les 48 heures.
            La suppression définitive interviendra sous 30 jours, conformément au RGPD.
          </p>
          <Link to="/">
            <Button className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white rounded-xl px-8 py-6">
              Retour à l'accueil
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F0] via-white to-[#FFE5DC] px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          data-testid="back-home-link"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#FF6B35] mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Retour à l'accueil</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-100">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A2E]">
              Supprimer mon compte
            </h1>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900 space-y-2">
                <p className="font-semibold">Action irréversible</p>
                <p>La suppression de votre compte entraînera :</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>la suppression définitive de votre profil, photos, publications, stories et messages</li>
                  <li>le retrait de toutes vos annonces marketplace</li>
                  <li>la perte de votre liste d'amis et de votre historique de chat</li>
                </ul>
                <p>
                  Conformément au RGPD, certaines données peuvent être conservées jusqu'à 30 jours
                  pour des raisons légales (logs de sécurité anonymisés). Au-delà, tout est effacé.
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            Vous pouvez aussi supprimer votre compte directement depuis l'application
            (<Link to="/settings/privacy" className="text-[#FF6B35] underline">Réglages → Confidentialité</Link>)
            si vous êtes connecté. Si ce n'est pas possible, utilisez ce formulaire.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="delete-request-form">
            <div>
              <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                Email du compte à supprimer <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  data-testid="delete-email-input"
                  className="pl-10 py-6 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                Raison de la suppression <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Aidez-nous à nous améliorer en quelques mots…"
                data-testid="delete-reason-input"
                rows={3}
                className="rounded-xl resize-none"
                maxLength={500}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                Pour confirmer, tapez <span className="font-mono text-red-600 font-bold">SUPPRIMER</span> en majuscules <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                required
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="SUPPRIMER"
                data-testid="delete-confirm-input"
                className="py-6 rounded-xl font-mono uppercase tracking-wider"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || confirmText.trim().toUpperCase() !== 'SUPPRIMER'}
              data-testid="delete-submit-btn"
              className="w-full py-6 rounded-xl bg-red-600 hover:bg-red-700 text-white text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours…
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Demander la suppression définitive
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Vous recevrez un email de confirmation sous 48h. La suppression définitive
              intervient sous 30 jours conformément au RGPD.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AccountDeletePage;
