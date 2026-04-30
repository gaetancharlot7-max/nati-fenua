import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Megaphone, FileText, User, Film, MapPin, Bell, 
  CreditCard, Check, Star, Zap, ChevronRight, AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdvertisingPage = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState('1day');
  const [loading, setLoading] = useState(false);
  const [manaCredits, setManaCredits] = useState(0);

  useEffect(() => {
    loadPackages();
    if (user?.user_id) {
      loadManaCredits();
    }
  }, [user]);

  const loadPackages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/advertising/packages`);
      const data = await response.json();
      setPackages(data.packages || []);
    } catch (error) {
      console.error('Error loading packages:', error);
    }
  };

  const loadManaCredits = async () => {
    try {
      const response = await fetch(`${API_URL}/api/mana/alert/credits/${user.user_id}`);
      const data = await response.json();
      setManaCredits(data.credits || 0);
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  };

  const handlePayment = async (packageId) => {
    if (!user) {
      toast.error('Veuillez vous connecter');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: packageId,
          origin_url: window.location.origin,
          user_id: user.user_id
        })
      });

      const data = await response.json();
      
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        toast.error('Erreur lors de la création du paiement');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const packageTypes = [
    {
      id: 'post_sponsorise',
      title: 'Post Sponsorisé',
      icon: FileText,
      color: 'from-purple-500 to-blue-500',
      description: 'Votre publication apparaît dans le fil de tous les utilisateurs',
      features: [
        'Apparition dans le fil "Pour Toi"',
        'Badge "Sponsorisé" discret',
        'Statistiques détaillées',
        'Ciblage par île possible'
      ],
      prices: [
        { id: 'post_1day', duration: '1 jour', price: 300, discount: null },
        { id: 'post_7days', duration: '7 jours', price: 1500, discount: '-29%' },
        { id: 'post_30days', duration: '30 jours', price: 5000, discount: '-44%' }
      ]
    },
    {
      id: 'compte_promu',
      title: 'Compte Promu',
      icon: User,
      color: 'from-blue-500 to-teal-500',
      description: 'Votre profil est suggéré pour gagner des abonnés',
      features: [
        'Suggestion dans "Personnes à suivre"',
        '+50% de visibilité',
        'Badge "Recommandé" temporaire',
        'Statistiques de nouveaux abonnés'
      ],
      prices: [
        { id: 'account_1day', duration: '1 jour', price: 500, discount: null },
        { id: 'account_7days', duration: '7 jours', price: 2500, discount: '-29%' },
        { id: 'account_30days', duration: '30 jours', price: 8000, discount: '-47%' }
      ]
    },
    {
      id: 'story_ad',
      title: 'Story Ad',
      icon: Film,
      color: 'from-pink-500 to-orange-500',
      description: 'Publicité plein écran entre les stories',
      features: [
        'Format plein écran immersif',
        'Bouton cliquable vers votre site',
        'Ciblage par île, âge, intérêts',
        'Durée 15 secondes max'
      ],
      prices: [
        { id: 'story_1day', duration: '1 jour', price: 800, discount: null },
        { id: 'story_7days', duration: '7 jours', price: 4000, discount: '-29%' },
        { id: 'story_30days', duration: '30 jours', price: 12000, discount: '-50%' }
      ]
    },
    {
      id: 'mana_alert',
      title: 'Mana Alert',
      icon: Bell,
      color: 'from-orange-500 to-red-500',
      description: 'Notification push à tous les utilisateurs d\'une île',
      features: [
        'Notification instantanée',
        'Ciblage par île',
        'Marqueur prioritaire sur Mana',
        'Idéal pour événements locaux'
      ],
      prices: [
        { id: 'mana_alert_1', duration: '1 notification', price: 200, discount: null },
        { id: 'mana_alert_5', duration: '5 notifications', price: 800, discount: '-20%' },
        { id: 'mana_alert_10', duration: '10 notifications', price: 1500, discount: '-25%' }
      ],
      isAlert: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF6B35] via-[#FF1493] to-[#00CED1] py-12 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Megaphone size={40} />
            <h1 className="text-3xl md:text-4xl font-black">Publicité Pro</h1>
          </div>
          <p className="text-lg opacity-90">
            Boostez votre visibilité sur Nati Fenua
          </p>
          <p className="text-sm mt-2 opacity-75">
            Prix en Franc Pacifique (XPF) • Paiement sécurisé par carte
          </p>
        </div>
      </div>

      {/* Mana Credits Banner */}
      {user && manaCredits > 0 && (
        <div className="max-w-4xl mx-auto px-4 -mt-6">
          <div className="bg-white rounded-2xl shadow-lg p-4 border-l-4 border-[#FF6B35] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="text-[#FF6B35]" size={24} />
              <div>
                <p className="font-semibold text-[#1A1A2E]">Vos crédits Mana Alert</p>
                <p className="text-sm text-gray-500">Notifications disponibles</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-[#FF6B35]">{manaCredits}</div>
          </div>
        </div>
      )}

      {/* Packages */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {packageTypes.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
            >
              {/* Package Header */}
              <div className={`bg-gradient-to-r ${pkg.color} p-6 text-white`}>
                <div className="flex items-center gap-3 mb-2">
                  <pkg.icon size={28} />
                  <h2 className="text-xl font-bold">{pkg.title}</h2>
                  {pkg.isAlert && (
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                      NOUVEAU
                    </span>
                  )}
                </div>
                <p className="text-sm opacity-90">{pkg.description}</p>
              </div>

              {/* Features */}
              <div className="p-6 border-b border-gray-100">
                <ul className="space-y-2">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={16} className="text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricing Options */}
              <div className="p-6 space-y-3">
                {pkg.prices.map((price) => (
                  <button
                    key={price.id}
                    onClick={() => handlePayment(price.id)}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-[#FF6B35] hover:bg-[#FF6B35]/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${pkg.color} flex items-center justify-center`}>
                        <Zap size={18} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-[#1A1A2E]">{price.duration}</p>
                        {price.discount && (
                          <span className="text-xs text-green-600 font-medium">{price.discount}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-[#FF6B35]">
                        {price.price.toLocaleString()} XPF
                      </span>
                      <ChevronRight size={20} className="text-gray-400 group-hover:text-[#FF6B35] transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Payment Info */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <CreditCard className="text-[#FF6B35] flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-[#1A1A2E] mb-2">Paiement sécurisé</h3>
              <p className="text-sm text-gray-600">
                Tous les paiements sont traités de manière sécurisée via Stripe. 
                Nous acceptons les cartes Visa, Mastercard, et American Express.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/100px-Visa_Inc._logo.svg.png" alt="Visa" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/100px-Mastercard-logo.svg.png" alt="Mastercard" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/American_Express_logo.svg/100px-American_Express_logo.svg.png" alt="Amex" className="h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-[#1A1A2E] mb-4">Questions fréquentes</h3>
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow">
              <p className="font-semibold text-[#1A1A2E]">Comment fonctionne le ciblage par île ?</p>
              <p className="text-sm text-gray-600 mt-1">
                Votre publicité sera affichée en priorité aux utilisateurs de l'île sélectionnée, 
                tout en restant visible pour les autres utilisateurs de Polynésie.
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow">
              <p className="font-semibold text-[#1A1A2E]">Qu'est-ce que Mana Alert ?</p>
              <p className="text-sm text-gray-600 mt-1">
                Mana Alert envoie une notification push instantanée à tous les utilisateurs d'une île. 
                Idéal pour les événements, promotions flash ou annonces importantes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvertisingPage;
