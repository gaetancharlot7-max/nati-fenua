import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronLeft, Search, HelpCircle, Shield, CreditCard, Users, Settings, MessageCircle, MapPin, ShoppingBag, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/input';

const FAQPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (id) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const faqCategories = [
    {
      id: 'general',
      title: 'Questions Générales',
      icon: HelpCircle,
      color: 'from-blue-500 to-cyan-500',
      questions: [
        {
          id: 'what-is',
          question: "Qu'est-ce que Nati Fenua ?",
          answer: "Nati Fenua est le premier réseau social polynésien. 'Nati' signifie lien/connexion et 'Fenua' signifie terre/pays en tahitien. Notre mission est de connecter la communauté polynésienne locale et la diaspora à travers le partage de contenus, la messagerie, le marketplace et la carte interactive Mana."
        },
        {
          id: 'free',
          question: "L'application est-elle gratuite ?",
          answer: "Oui, Nati Fenua est entièrement gratuit pour les utilisateurs. Vous pouvez créer un compte, publier du contenu, envoyer des messages et utiliser toutes les fonctionnalités sans frais. Seules les options publicitaires pour les professionnels sont payantes."
        },
        {
          id: 'who-can',
          question: "Qui peut utiliser Nati Fenua ?",
          answer: "Toute personne âgée de 13 ans ou plus peut créer un compte. L'application est ouverte à tous, mais elle est particulièrement conçue pour la communauté polynésienne et ceux qui s'y intéressent."
        },
        {
          id: 'languages',
          question: "En quelles langues l'application est-elle disponible ?",
          answer: "L'application est actuellement disponible en français. Nous travaillons sur l'ajout du tahitien et de l'anglais dans les prochaines mises à jour."
        }
      ]
    },
    {
      id: 'account',
      title: 'Compte & Connexion',
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      questions: [
        {
          id: 'create-account',
          question: "Comment créer un compte ?",
          answer: "Vous pouvez créer un compte de deux façons :\n\n1. **Email & Mot de passe** : Cliquez sur 'S'inscrire', entrez votre email, créez un mot de passe sécurisé et choisissez un nom d'utilisateur.\n\n2. **Google** : Cliquez sur 'Se connecter avec Google' pour une inscription rapide avec votre compte Google existant."
        },
        {
          id: 'forgot-password',
          question: "J'ai oublié mon mot de passe, que faire ?",
          answer: "Sur la page de connexion, cliquez sur 'Mot de passe oublié'. Entrez votre adresse email et vous recevrez un lien de réinitialisation. Vérifiez vos spams si vous ne recevez pas l'email."
        },
        {
          id: 'delete-account',
          question: "Comment supprimer mon compte ?",
          answer: "Allez dans Paramètres > RGPD & Confidentialité > Supprimer mon compte. Cette action est irréversible et supprimera toutes vos données (posts, messages, photos). Conformément au RGPD, la suppression sera effective sous 30 jours."
        },
        {
          id: 'private-profile',
          question: "Comment rendre mon profil privé ?",
          answer: "Allez dans Paramètres > Confidentialité > Visibilité du profil et sélectionnez 'Privé'. Seuls vos amis pourront voir vos publications."
        }
      ]
    },
    {
      id: 'content',
      title: 'Publications & Stories',
      icon: MessageCircle,
      color: 'from-purple-500 to-pink-500',
      questions: [
        {
          id: 'post-types',
          question: "Quels types de contenus puis-je publier ?",
          answer: "Vous pouvez publier :\n\n• **Photos** : Images au format JPG, PNG, WebP (max 10MB)\n• **Vidéos** : Clips jusqu'à 2 minutes (max 100MB)\n• **Stories** : Contenus éphémères visibles 24h\n• **Texte** : Publications textuelles avec ou sans média\n• **Liens** : Partagez des liens YouTube, sites web, etc."
        },
        {
          id: 'delete-post',
          question: "Comment supprimer une publication ?",
          answer: "Sur votre publication, cliquez sur les 3 points (⋮) en haut à droite, puis sélectionnez 'Supprimer'. Vous pouvez aussi supprimer depuis votre profil en cliquant sur la photo puis l'icône poubelle."
        },
        {
          id: 'story-duration',
          question: "Combien de temps une story reste-t-elle visible ?",
          answer: "Les stories sont visibles pendant 24 heures après leur publication. Passé ce délai, elles disparaissent automatiquement."
        },
        {
          id: 'report-content',
          question: "Comment signaler un contenu inapproprié ?",
          answer: "Cliquez sur les 3 points (⋮) sur le contenu concerné et sélectionnez 'Signaler'. Choisissez la raison du signalement. Notre équipe de modération examinera le contenu sous 24h."
        }
      ]
    },
    {
      id: 'privacy',
      title: 'Confidentialité & Sécurité',
      icon: Shield,
      color: 'from-red-500 to-orange-500',
      questions: [
        {
          id: 'data-collected',
          question: "Quelles données collectez-vous ?",
          answer: "Nous collectons :\n\n• **Données de compte** : Email, nom, photo de profil\n• **Contenu** : Publications, messages, commentaires\n• **Données techniques** : Adresse IP, type d'appareil, navigateur\n• **Localisation** : Uniquement si vous l'autorisez, pour la carte Mana\n\nToutes ces données sont traitées conformément au RGPD."
        },
        {
          id: 'data-usage',
          question: "Comment mes données sont-elles utilisées ?",
          answer: "Vos données sont utilisées pour :\n\n• Fournir nos services (profil, publications, messagerie)\n• Améliorer l'expérience utilisateur\n• Assurer la sécurité de la plateforme\n• Envoyer des notifications (si autorisé)\n\nNous ne vendons JAMAIS vos données à des tiers."
        },
        {
          id: 'data-export',
          question: "Comment exporter mes données ?",
          answer: "Allez dans Paramètres > RGPD & Confidentialité > Exporter mes données. Vous recevrez un fichier ZIP contenant toutes vos données sous 48h."
        },
        {
          id: 'block-user',
          question: "Comment bloquer un utilisateur ?",
          answer: "Allez sur le profil de l'utilisateur, cliquez sur les 3 points (⋮) et sélectionnez 'Bloquer'. L'utilisateur bloqué ne pourra plus voir votre profil ni vous contacter."
        }
      ]
    },
    {
      id: 'marketplace',
      title: 'Marketplace',
      icon: ShoppingBag,
      color: 'from-yellow-500 to-amber-500',
      questions: [
        {
          id: 'sell-products',
          question: "Comment vendre sur le Marketplace ?",
          answer: "Allez dans Marketplace > Créer une annonce. Ajoutez des photos, un titre, une description, le prix en XPF et la catégorie. Votre annonce sera visible après vérification (généralement sous 1h)."
        },
        {
          id: 'payment',
          question: "Comment fonctionne le paiement ?",
          answer: "Actuellement, les transactions se font directement entre acheteur et vendeur (espèces, virement). Nous travaillons sur l'intégration d'un système de paiement sécurisé."
        },
        {
          id: 'report-seller',
          question: "Comment signaler un vendeur frauduleux ?",
          answer: "Cliquez sur 'Signaler' sur l'annonce ou le profil du vendeur. Décrivez le problème en détail. Notre équipe enquêtera et prendra les mesures nécessaires."
        }
      ]
    },
    {
      id: 'mana',
      title: 'Carte Mana',
      icon: MapPin,
      color: 'from-teal-500 to-cyan-500',
      questions: [
        {
          id: 'what-is-mana',
          question: "Qu'est-ce que la carte Mana ?",
          answer: "La carte Mana est une carte interactive de la Polynésie française. Elle affiche en temps réel :\n\n• Les webcams publiques\n• Les événements locaux\n• Les alertes (trafic, météo)\n• Les roulottes ouvertes\n• Les points d'intérêt"
        },
        {
          id: 'add-marker',
          question: "Comment ajouter un marqueur ?",
          answer: "Sur la carte, cliquez sur le bouton '+' puis sélectionnez le type de marqueur (événement, alerte, POI). Remplissez les informations et validez. Les marqueurs sont vérifiés par la communauté."
        },
        {
          id: 'mana-points',
          question: "Que sont les points Mana ?",
          answer: "Les points Mana récompensent vos contributions à la carte. Vous gagnez des points en ajoutant des marqueurs, confirmant des alertes ou signalant des informations erronées. Plus vous avez de points, plus vous êtes reconnu comme un membre actif !"
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      color: 'from-indigo-500 to-violet-500',
      questions: [
        {
          id: 'push-notif',
          question: "Comment activer les notifications push ?",
          answer: "Allez dans Paramètres > Notifications et activez les notifications souhaitées. Assurez-vous d'avoir autorisé les notifications dans les paramètres de votre navigateur/téléphone."
        },
        {
          id: 'disable-notif',
          question: "Comment désactiver certaines notifications ?",
          answer: "Allez dans Paramètres > Notifications. Vous pouvez désactiver individuellement les notifications pour les likes, commentaires, messages, abonnés, etc."
        }
      ]
    },
    {
      id: 'technical',
      title: 'Problèmes Techniques',
      icon: Settings,
      color: 'from-gray-500 to-slate-500',
      questions: [
        {
          id: 'app-slow',
          question: "L'application est lente, que faire ?",
          answer: "Essayez ces solutions :\n\n1. Rafraîchissez la page (F5)\n2. Videz le cache de votre navigateur\n3. Vérifiez votre connexion internet\n4. Désactivez les extensions de navigateur\n5. Essayez un autre navigateur"
        },
        {
          id: 'images-not-loading',
          question: "Les images ne s'affichent pas",
          answer: "Ce problème peut avoir plusieurs causes :\n\n• Connexion internet instable\n• Cache du navigateur corrompu (videz-le)\n• Bloqueur de publicités (désactivez-le pour notre site)\n\nSi le problème persiste, contactez-nous."
        },
        {
          id: 'contact-support',
          question: "Comment contacter le support ?",
          answer: "Vous pouvez nous contacter par email à support@natifenua.pf ou via le formulaire de contact dans Paramètres > Aide & Support. Nous répondons généralement sous 24h."
        }
      ]
    }
  ];

  // Filter questions based on search
  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/settings" className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-2xl font-bold">Foire Aux Questions</h1>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Rechercher une question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 py-6 rounded-2xl bg-white text-gray-900 border-0 shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucune question trouvée pour "{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredCategories.map((category) => (
              <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Category Header */}
                <div className={`bg-gradient-to-r ${category.color} p-4 flex items-center gap-3`}>
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <category.icon size={20} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">{category.title}</h2>
                  <span className="ml-auto text-white/70 text-sm">{category.questions.length} questions</span>
                </div>

                {/* Questions */}
                <div className="divide-y divide-gray-100">
                  {category.questions.map((item) => (
                    <div key={item.id} className="border-b border-gray-100 last:border-0">
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className="font-medium text-gray-900 pr-4">{item.question}</span>
                        <motion.div
                          animate={{ rotate: openItems[item.id] ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                        </motion.div>
                      </button>
                      
                      <AnimatePresence>
                        {openItems[item.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 text-gray-600 whitespace-pre-line">
                              {item.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-r from-[#1A1A2E] to-[#16213E] rounded-2xl p-8 text-white text-center">
          <h3 className="text-xl font-bold mb-2">Vous n'avez pas trouvé votre réponse ?</h3>
          <p className="text-white/70 mb-6">Notre équipe est là pour vous aider</p>
          <a 
            href="mailto:support@natifenua.pf"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF1493] rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            <MessageCircle size={20} />
            Contacter le support
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
