import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Megaphone, FileText, User, Film, MapPin, Bell, 
  CreditCard, Check, Star, Zap, ChevronRight, AlertCircle,
  ShoppingBag, Truck, PartyPopper, TrendingUp
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
      id: 'marketplace_boost',
      title: 'Boost Marketplace',
      icon: ShoppingBag,
      color: 'from-emerald-500 to-teal-500',
      badge: '⚡ POPULAIRE',
      description: "Faites remonter votre annonce en tête de la Marketplace polynésienne",
      example: '🏝️ Ex: location bungalow Moorea, voiture occasion, planche de surf',
      features: [
        'Annonce épinglée en haut des résultats',
        'Badge "Boost" doré qui attire l\'œil',
        'Notifications aux acheteurs intéressés',
        'Statistiques de vues et de clics'
      ],
      prices: [
        { id: 'marketplace_3days', duration: '3 jours', price: 500, discount: null, value: '~170 XPF / jour' },
        { id: 'marketplace_7days', duration: '7 jours', price: 1000, discount: '-29%', value: '~143 XPF / jour' },
        { id: 'marketplace_30days', duration: '30 jours', price: 3500, discount: '-50%', value: '~117 XPF / jour' }
      ]
    },
    {
      id: 'roulotte_pack',
      title: 'Pack Roulotte',
      icon: Truck,
      color: 'from-orange-500 to-red-500',
      badge: '🍔 LOCAL',
      description: "Spécial roulottes, snacks, restaurateurs et food trucks du Fenua",
      example: '🍱 Idéal pour : roulotte de poisson cru, food truck Vaitape, snack de quartier',
      features: [
        'Post sponsorisé + Mana Alerts inclus',
        'Apparition prioritaire dans "Où manger ?"',
        'Carte Mana avec marqueur boost',
        'Pack tout-en-un, économisez 30%'
      ],
      prices: [
        { id: 'roulotte_starter', duration: 'Starter — 7 jours', price: 2000, discount: 'Best deal', value: '3 services inclus' },
        { id: 'roulotte_pro', duration: 'Pro — 30 jours', price: 6500, discount: '-46%', value: '5 services inclus' }
      ]
    },
    {
      id: 'post_sponsorise',
      title: 'Post Sponsorisé',
      icon: FileText,
      color: 'from-purple-500 to-blue-500',
      badge: null,
      description: 'Votre publication apparaît dans le fil de tous les utilisateurs',
      example: '📸 Ex: ouverture d\'un commerce, soldes, nouvelle prestation',
      features: [
        'Apparition dans le fil "Pour Toi"',
        'Badge "Sponsorisé" discret',
        'Statistiques détaillées',
        'Ciblage par île possible'
      ],
      prices: [
        { id: 'post_1day', duration: '1 jour', price: 300, discount: null, value: 'Test rapide' },
        { id: 'post_7days', duration: '7 jours', price: 1500, discount: '-29%', value: '~214 XPF / jour' },
        { id: 'post_30days', duration: '30 jours', price: 5000, discount: '-44%', value: '~167 XPF / jour' }
      ]
    },
    {
      id: 'event_spotlight',
      title: 'Spot Événement',
      icon: PartyPopper,
      color: 'from-pink-500 to-purple-500',
      badge: '🎉 EXCLUSIF',
      description: 'Mise en avant 48h pour vos événements spéciaux',
      example: '🎊 Ex: Heiva, anniversaire, ouverture, festival, mariage, concert',
      features: [
        'Bannière en tête de feed pendant 48h',
        'Notification push aux îles ciblées',
        'Compte à rebours animé sur le post',
        'Idéal pour évènements ponctuels'
      ],
      prices: [
        { id: 'event_spotlight', duration: '48h intensives', price: 1500, discount: null, value: 'Tout en un' }
      ]
    },
    {
      id: 'mana_alert',
      title: 'Mana Alert',
      icon: Bell,
      color: 'from-cyan-500 to-blue-500',
      badge: '📢 PUSH',
      description: 'Notification push envoyée aux utilisateurs d\'une île ou de toute la Polynésie',
      example: '⚡ Ex: braderie, déstockage, événement de dernière minute',
      features: [
        'Notification instantanée sur téléphone',
        'Ciblage par île (Tahiti, Moorea, etc.)',
        'Marqueur prioritaire sur Mana',
        'Idéal pour offres flash et urgences'
      ],
      prices: [
        { id: 'mana_alert_1', duration: '1 notification', price: 200, discount: null, value: 'Test' },
        { id: 'mana_alert_5', duration: 'Pack 5', price: 800, discount: '-20%', value: '160 XPF / push' },
        { id: 'mana_alert_10', duration: 'Pack 10', price: 1500, discount: '-25%', value: '150 XPF / push' }
      ],
      isAlert: true
    },
    {
      id: 'compte_promu',
      title: 'Compte Promu',
      icon: User,
      color: 'from-blue-500 to-teal-500',
      badge: null,
      description: 'Votre profil est suggéré pour gagner des abonnés',
      example: '👤 Ex: créateur de contenu, artisan, photographe, entreprise locale',
      features: [
        'Suggestion dans "Personnes à suivre"',
        '+50% de visibilité',
        'Badge "Recommandé" temporaire',
        'Statistiques de nouveaux abonnés'
      ],
      prices: [
        { id: 'account_1day', duration: '1 jour', price: 500, discount: null, value: null },
        { id: 'account_7days', duration: '7 jours', price: 2500, discount: '-29%', value: '~357 XPF / jour' },
        { id: 'account_30days', duration: '30 jours', price: 8000, discount: '-47%', value: '~267 XPF / jour' }
      ]
    },
    {
      id: 'story_ad',
      title: 'Story Ad',
      icon: Film,
      color: 'from-yellow-500 to-orange-500',
      badge: null,
      description: 'Publicité plein écran entre les stories des utilisateurs',
      example: '🎬 Ex: lancement de produit, teaser événement, vidéo promo',
      features: [
        'Format plein écran immersif',
        'Bouton cliquable vers votre site',
        'Ciblage par île, âge, intérêts',
        'Durée 15 secondes max'
      ],
      prices: [
        { id: 'story_1day', duration: '1 jour', price: 800, discount: null, value: null },
        { id: 'story_7days', duration: '7 jours', price: 4000, discount: '-29%', value: '~571 XPF / jour' },
        { id: 'story_30days', duration: '30 jours', price: 12000, discount: '-50%', value: '~400 XPF / jour' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#FF6B35] via-[#FF1493] to-[#9400D3] py-12 px-4 relative overflow-hidden">
        {/* Decorative blur dots */}
        <div className="absolute top-4 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-10 w-40 h-40 bg-cyan-400/20 rounded-full blur-3xl"></div>

        <div className="max-w-4xl mx-auto text-center text-white relative z-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Megaphone size={40} />
            <h1 className="text-3xl md:text-5xl font-black">Publicité <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">Pro</span></h1>
          </div>
          <p className="text-lg opacity-95 max-w-2xl mx-auto leading-relaxed">
            Touchez les <strong>Polynésiens connectés</strong> sur Nati Fenua — le réseau social local n°1 🌺
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-5 text-xs">
            <span className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 font-medium">💳 Paiement carte sécurisé</span>
            <span className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 font-medium">💱 Tous les prix en XPF</span>
            <span className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 font-medium">📊 Stats temps réel</span>
            <span className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 font-medium">🏝️ Ciblage par île</span>
          </div>
        </div>
      </div>

      {/* Why advertise — ROI banner */}
      <div className="max-w-6xl mx-auto px-4 -mt-4 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-5 grid grid-cols-3 gap-3 sm:gap-4 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-black text-[#FF1493]">+250%</p>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-1 uppercase tracking-wider">de visibilité moyenne</p>
          </div>
          <div className="border-x border-gray-200">
            <p className="text-2xl sm:text-3xl font-black text-[#FF6B35]">~5 min</p>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-1 uppercase tracking-wider">pour lancer une pub</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-[#9400D3]">100%</p>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-1 uppercase tracking-wider">audience polynésienne</p>
          </div>
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
              <div className={`bg-gradient-to-r ${pkg.color} p-6 text-white relative`}>
                {pkg.badge && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/25 backdrop-blur-sm rounded-full text-[10px] font-black tracking-wider">
                    {pkg.badge}
                  </span>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <pkg.icon size={28} />
                  <h2 className="text-xl font-bold">{pkg.title}</h2>
                </div>
                <p className="text-sm opacity-95 mb-2">{pkg.description}</p>
                {pkg.example && (
                  <p className="text-xs opacity-80 italic bg-black/15 rounded-lg px-2.5 py-1.5 mt-2">{pkg.example}</p>
                )}
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
                    data-testid={`buy-package-${price.id}`}
                    className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-[#FF6B35] hover:bg-[#FF6B35]/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${pkg.color} flex items-center justify-center flex-shrink-0`}>
                        <Zap size={18} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-[#1A1A2E]">{price.duration}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {price.discount && (
                            <span className={`text-xs font-bold ${price.discount === 'Best deal' ? 'text-[#FF1493]' : 'text-green-600'}`}>
                              {price.discount}
                            </span>
                          )}
                          {price.value && (
                            <span className="text-[10px] text-gray-400">{price.value}</span>
                          )}
                        </div>
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
