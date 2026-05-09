import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Rocket, Smartphone, Trophy, Send, CheckCircle2, Clock, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import PionnierBadge from '../components/PionnierBadge';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * /beta-test — public landing page to recruit 12+ beta testers
 * for Google Play Closed Testing program (14-day requirement).
 * Form posts to /api/beta/apply.
 */
const BetaTestPage = () => {
  const [form, setForm] = useState({ email: '', name: '', google_email: '', device: '', motivation: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.google_email) {
      toast.error('Email et compte Google requis');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/beta/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setSubmitted(true);
        toast.success('Candidature envoyée 🌺');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.detail || 'Erreur lors de l\'envoi');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1A2E] via-[#16213E] to-[#0F1729] text-white">
      {/* Top bar */}
      <header className="px-4 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white" data-testid="beta-back-link">
          <ArrowLeft size={20} />
          <span className="text-sm">Retour</span>
        </Link>
        <span className="text-xs text-white/40 tracking-wider uppercase">Programme Bêta</span>
      </header>

      {/* Hero */}
      <section className="px-4 pt-8 pb-12 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14 }}
          className="inline-flex w-20 h-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#9400D3] via-[#FF1493] to-[#FF6B35] shadow-2xl shadow-pink-500/40 mb-6"
        >
          <Rocket size={36} strokeWidth={2} className="text-white" />
        </motion.div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 leading-tight">
          Deviens <span className="bg-gradient-to-r from-[#FF6B35] via-[#FF1493] to-[#9400D3] bg-clip-text text-transparent">Pionnier</span>
          <br />de Nati Fenua
        </h1>
        <p className="text-base sm:text-lg text-white/70 max-w-xl mx-auto mb-6">
          On lance bientôt l'app sur Google Play Store 🌺 et on recherche <strong className="text-white">12 bêta-testeurs polynésiens</strong> pour valider la version Android avant la sortie publique.
        </p>
        <div className="flex justify-center gap-2">
          <PionnierBadge size="lg" animate />
        </div>
      </section>

      {/* Why */}
      <section className="px-4 py-10 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center">Ce que tu reçois</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card icon={<Trophy className="text-[#FFD700]" size={28} />} title="Badge exclusif">
            Le badge <PionnierBadge size="xs" /> à vie sur ton profil. Limité aux 50 premiers.
          </Card>
          <Card icon={<Smartphone className="text-[#00CED1]" size={28} />} title="Accès anticipé">
            Reçois l'app Android via Play Store avant tout le monde. Tu testes les nouveautés en avant-première.
          </Card>
          <Card icon={<Users className="text-[#FF1493]" size={28} />} title="Voix du Fenua">
            Tes retours façonnent l'app. Les 3 retours les plus utiles obtiennent en prime un badge <strong>Ambassadeur</strong>.
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-10 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center">Comment ça marche</h2>
        <div className="space-y-3">
          <Step n="1" title="Tu candidates" body="Remplis le formulaire ci-dessous (1 minute)." />
          <Step n="2" title="On te valide" body="Sous 48h, tu reçois un email avec le lien de test Google Play." />
          <Step n="3" title="Tu installes l'app" body="Tu acceptes l'invitation, l'app s'installe via Play Store comme une vraie app." />
          <Step n="4" title="Tu utilises pendant 14 jours" body="Pas besoin d'être actif tous les jours — quelques minutes par semaine suffisent." />
          <Step n="5" title="Tu reçois ton badge Pionnier" body="Une fois l'app validée par Google, ton badge apparaît à vie sur ton profil." />
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-white/50">
          <Clock size={16} /> Programme actif jusqu'à publication officielle (~2-4 semaines).
        </div>
      </section>

      {/* Form */}
      <section className="px-4 py-10 max-w-2xl mx-auto">
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8">
          <h2 className="text-2xl font-black mb-2">Candidater au programme</h2>
          <p className="text-sm text-white/60 mb-6">Tes infos restent privées et servent uniquement à t'inscrire au test fermé Google Play.</p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
              data-testid="beta-success"
            >
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Candidature reçue 🌺</h3>
              <p className="text-white/70 text-sm mb-6">
                Tu recevras un email sous 48h avec le lien de test Google Play.<br />Mauruuru d'aider à construire Nati Fenua !
              </p>
              <Link to="/feed" className="inline-block text-[#FF6B35] hover:underline text-sm font-semibold">
                Retourner au feed →
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="beta-application-form">
              <Field label="Ton prénom *">
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Hinano"
                  data-testid="beta-name-input"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B35]"
                />
              </Field>
              <Field label="Email de contact *" hint="Pour recevoir notre confirmation.">
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ton.email@exemple.com"
                  data-testid="beta-email-input"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B35]"
                />
              </Field>
              <Field label="Ton compte Google (Gmail) *" hint="C'est avec ce compte que tu accéderas au test sur Play Store.">
                <input
                  type="email"
                  required
                  value={form.google_email}
                  onChange={(e) => setForm({ ...form, google_email: e.target.value })}
                  placeholder="ton.compte@gmail.com"
                  data-testid="beta-google-email-input"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B35]"
                />
              </Field>
              <Field label="Téléphone Android utilisé" hint="Optionnel, pour qu'on identifie les bugs spécifiques.">
                <input
                  type="text"
                  value={form.device}
                  onChange={(e) => setForm({ ...form, device: e.target.value })}
                  placeholder="Samsung Galaxy A53, Xiaomi Redmi Note 12, etc."
                  data-testid="beta-device-input"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B35]"
                />
              </Field>
              <Field label="Pourquoi veux-tu tester ?" hint="Optionnel — un mot suffit.">
                <textarea
                  rows={3}
                  value={form.motivation}
                  onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                  placeholder="Je vis à Tahiti et j'aime soutenir les projets locaux 🌴"
                  data-testid="beta-motivation-input"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B35] resize-none"
                />
              </Field>

              <Button
                type="submit"
                disabled={submitting}
                data-testid="beta-submit-btn"
                className="w-full bg-gradient-to-r from-[#FF6B35] via-[#FF1493] to-[#9400D3] hover:opacity-90 text-white font-bold py-6 rounded-xl text-base shadow-lg shadow-pink-500/30"
              >
                {submitting ? 'Envoi…' : (
                  <span className="inline-flex items-center gap-2">
                    <Send size={18} /> Devenir Pionnier
                  </span>
                )}
              </Button>
              <p className="text-xs text-white/40 text-center">
                En candidatant, tu acceptes que tes infos soient utilisées uniquement pour le programme bêta.
                <Link to="/legal" className="underline hover:text-white/60"> Confidentialité</Link>.
              </p>
            </form>
          )}
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-white/30">
        © 2026 Nati Fenua · <Link to="/legal" className="hover:text-white/50">CGU</Link>
      </footer>
    </div>
  );
};

const Card = ({ icon, title, children }) => (
  <div className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
    <div className="mb-3">{icon}</div>
    <h3 className="font-bold mb-2">{title}</h3>
    <p className="text-sm text-white/60 leading-relaxed">{children}</p>
  </div>
);

const Step = ({ n, title, body }) => (
  <div className="flex gap-4 items-start rounded-2xl bg-white/5 border border-white/10 p-4">
    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF1493] text-white font-black flex items-center justify-center">
      {n}
    </div>
    <div>
      <h4 className="font-bold mb-1">{title}</h4>
      <p className="text-sm text-white/60">{body}</p>
    </div>
  </div>
);

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-semibold text-white/80 mb-1.5">{label}</label>
    {children}
    {hint && <p className="text-xs text-white/40 mt-1">{hint}</p>}
  </div>
);

export default BetaTestPage;
