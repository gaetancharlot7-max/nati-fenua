import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Newspaper, ShoppingBag, MapPinned, Users, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';

const ONBOARDING_KEY = 'nati_fenua_onboarding_seen';

const slides = [
  {
    icon: Newspaper,
    title: 'Toute la Polynésie en un seul fil',
    description:
      "Tahiti Infos, Radio 1, Outre-mer La 1ère… L'actualité du Fenua se renouvelle en continu, pour ne plus jamais rater l'essentiel.",
    color: 'from-[#FF6B35] to-[#FF8C61]',
    emoji: '📰'
  },
  {
    icon: ShoppingBag,
    title: 'Marketplace local',
    description:
      "Vendez et achetez en Polynésie : véhicules, immobilier, électronique, services. Filtres avancés, contact direct vendeur.",
    color: 'from-[#FF1493] to-[#FF6B9D]',
    emoji: '🛒'
  },
  {
    icon: MapPinned,
    title: 'Mana — la carte vivante',
    description:
      "Webcams en direct, événements, covoiturages, signalements communautaires. Le Fenua en temps réel sous vos yeux.",
    color: 'from-[#00CED1] to-[#48D1CC]',
    emoji: '🗺️'
  },
  {
    icon: Users,
    title: 'Restez connectés au Fenua',
    description:
      "Retrouvez vos amis, votre famille, votre communauté de Tahiti aux Tuamotu. Chat, stories, demandes d'amis.",
    color: 'from-[#9333EA] to-[#C084FC]',
    emoji: '🌺'
  }
];

/**
 * First-visit onboarding tour — shows 4 slides explaining Nati Fenua's value.
 * Stored in localStorage so it never repeats.
 * Bypassable with "Passer" button.
 */
const OnboardingTour = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const slide = slides[step];

  const finish = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, '1');
    } catch {}
    onComplete?.();
  };

  const next = () => {
    if (step < slides.length - 1) {
      setStep(s => s + 1);
    } else {
      finish();
    }
  };

  const Icon = slide.icon;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#FFF5F0] via-white to-[#FFE5DC] flex items-center justify-center px-4 py-8"
      data-testid="onboarding-tour"
    >
      <button
        type="button"
        onClick={finish}
        data-testid="onboarding-skip"
        className="absolute top-6 right-6 text-sm text-gray-500 hover:text-gray-800 underline"
      >
        Passer
      </button>

      <div className="max-w-md w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 text-center"
          >
            <div className="text-6xl mb-4">{slide.emoji}</div>
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${slide.color} mb-6`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A2E] mb-3">
              {slide.title}
            </h2>
            <p className="text-gray-600 text-base leading-relaxed mb-8">
              {slide.description}
            </p>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all ${
                    i === step
                      ? 'w-8 bg-gradient-to-r from-[#FF6B35] to-[#FF1493]'
                      : 'w-2 bg-gray-200'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={next}
              data-testid="onboarding-next"
              className="w-full py-6 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              {step === slides.length - 1 ? (
                <>
                  Maeva ! Commencer
                  <Sparkles className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * Wrapper hook: shows onboarding on first authenticated visit.
 * Usage in a top-level layout:
 *   const { showOnboarding, dismissOnboarding } = useOnboarding(user);
 *   {showOnboarding && <OnboardingTour onComplete={dismissOnboarding} />}
 */
export const useOnboarding = (user) => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user) return;
    try {
      const seen = localStorage.getItem(ONBOARDING_KEY);
      if (!seen) setShowOnboarding(true);
    } catch {}
  }, [user]);

  const dismissOnboarding = () => setShowOnboarding(false);

  return { showOnboarding, dismissOnboarding };
};

export default OnboardingTour;
