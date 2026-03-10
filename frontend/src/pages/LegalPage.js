import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Shield, Lock, Users, AlertTriangle, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';

const LegalPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('cgu');

  const sections = [
    { id: 'cgu', label: 'Conditions Générales', icon: FileText },
    { id: 'privacy', label: 'Politique de Confidentialité', icon: Lock },
    { id: 'cookies', label: 'Politique des Cookies', icon: Shield },
    { id: 'mentions', label: 'Mentions Légales', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-[#1A1A2E]">Informations Légales</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Section Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#FF6B35]'
              }`}
            >
              <section.icon size={18} />
              {section.label}
            </button>
          ))}
        </div>

        {/* CGU Section */}
        {activeSection === 'cgu' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-[#1A1A2E] mb-6 flex items-center gap-3">
              <FileText className="text-[#FF6B35]" />
              Conditions Générales d'Utilisation
            </h2>
            <p className="text-gray-500 mb-6">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

            <div className="prose prose-gray max-w-none space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">1. Objet</h3>
                <p className="text-gray-600">
                  Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités 
                  et conditions d'utilisation de la plateforme Hui Fenua, réseau social dédié à la communauté 
                  polynésienne.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">2. Acceptation des CGU</h3>
                <p className="text-gray-600">
                  L'inscription et l'utilisation de Hui Fenua impliquent l'acceptation pleine et entière 
                  des présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser 
                  la plateforme.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">3. Description du service</h3>
                <p className="text-gray-600">
                  Hui Fenua est un réseau social permettant aux utilisateurs de :
                </p>
                <ul className="list-disc pl-6 text-gray-600 mt-2 space-y-1">
                  <li>Partager des photos, vidéos et stories</li>
                  <li>Interagir avec d'autres utilisateurs (likes, commentaires, messages)</li>
                  <li>Participer à des lives en direct</li>
                  <li>Utiliser la marketplace pour acheter/vendre des produits et services</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">4. Inscription et compte</h3>
                <p className="text-gray-600">
                  Pour utiliser Hui Fenua, vous devez créer un compte en fournissant des informations exactes. 
                  Vous êtes responsable de la confidentialité de vos identifiants de connexion.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">5. Contenus interdits</h3>
                <p className="text-gray-600">Il est strictement interdit de publier :</p>
                <ul className="list-disc pl-6 text-gray-600 mt-2 space-y-1">
                  <li>Contenus à caractère pornographique ou sexuellement explicite</li>
                  <li>Contenus incitant à la haine, la violence ou la discrimination</li>
                  <li>Contenus diffamatoires ou portant atteinte à la vie privée</li>
                  <li>Contenus violant les droits d'auteur ou de propriété intellectuelle</li>
                  <li>Spam, arnaques ou contenus frauduleux</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">6. Modération</h3>
                <p className="text-gray-600">
                  Hui Fenua se réserve le droit de supprimer tout contenu ne respectant pas les présentes CGU 
                  et de suspendre ou supprimer les comptes des utilisateurs contrevenants.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">7. Propriété intellectuelle</h3>
                <p className="text-gray-600">
                  Les utilisateurs conservent la propriété de leurs contenus. En publiant sur Hui Fenua, 
                  vous accordez une licence non-exclusive permettant la diffusion de vos contenus sur la plateforme.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">8. Limitation de responsabilité</h3>
                <p className="text-gray-600">
                  Hui Fenua ne peut être tenu responsable des contenus publiés par les utilisateurs, 
                  ni des transactions effectuées via la marketplace.
                </p>
              </section>
            </div>
          </motion.div>
        )}

        {/* Privacy Policy Section */}
        {activeSection === 'privacy' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-[#1A1A2E] mb-6 flex items-center gap-3">
              <Lock className="text-[#FF6B35]" />
              Politique de Confidentialité
            </h2>
            <p className="text-gray-500 mb-6">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

            <div className="prose prose-gray max-w-none space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">1. Données collectées</h3>
                <p className="text-gray-600">Nous collectons les données suivantes :</p>
                <ul className="list-disc pl-6 text-gray-600 mt-2 space-y-1">
                  <li>Informations de profil (nom, email, photo)</li>
                  <li>Contenus publiés (photos, vidéos, messages)</li>
                  <li>Données de connexion et d'utilisation</li>
                  <li>Localisation (si autorisée)</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">2. Utilisation des données</h3>
                <p className="text-gray-600">Vos données sont utilisées pour :</p>
                <ul className="list-disc pl-6 text-gray-600 mt-2 space-y-1">
                  <li>Fournir et améliorer nos services</li>
                  <li>Personnaliser votre expérience</li>
                  <li>Assurer la sécurité de la plateforme</li>
                  <li>Vous envoyer des notifications (avec votre consentement)</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">3. Partage des données</h3>
                <p className="text-gray-600">
                  Nous ne vendons jamais vos données personnelles. Nous pouvons partager certaines 
                  données avec des prestataires de services dans le cadre strict du fonctionnement 
                  de la plateforme.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">4. Vos droits (RGPD)</h3>
                <p className="text-gray-600">Conformément au RGPD, vous disposez des droits suivants :</p>
                <ul className="list-disc pl-6 text-gray-600 mt-2 space-y-1">
                  <li>Droit d'accès à vos données</li>
                  <li>Droit de rectification</li>
                  <li>Droit à l'effacement (droit à l'oubli)</li>
                  <li>Droit à la portabilité</li>
                  <li>Droit d'opposition</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">5. Sécurité</h3>
                <p className="text-gray-600">
                  Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles 
                  pour protéger vos données : chiffrement, authentification sécurisée, sauvegardes régulières.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">6. Conservation des données</h3>
                <p className="text-gray-600">
                  Vos données sont conservées pendant la durée de votre inscription. 
                  En cas de suppression de compte, vos données sont effacées immédiatement.
                </p>
              </section>
            </div>
          </motion.div>
        )}

        {/* Cookies Section */}
        {activeSection === 'cookies' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-[#1A1A2E] mb-6 flex items-center gap-3">
              <Shield className="text-[#FF6B35]" />
              Politique des Cookies
            </h2>

            <div className="prose prose-gray max-w-none space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">1. Qu'est-ce qu'un cookie ?</h3>
                <p className="text-gray-600">
                  Un cookie est un petit fichier texte stocké sur votre appareil lors de votre visite 
                  sur notre site. Il nous permet de mémoriser vos préférences et d'améliorer votre expérience.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">2. Types de cookies utilisés</h3>
                <ul className="list-disc pl-6 text-gray-600 mt-2 space-y-2">
                  <li><strong>Cookies essentiels</strong> : nécessaires au fonctionnement (authentification)</li>
                  <li><strong>Cookies de préférences</strong> : mémorisent vos choix (langue, thème)</li>
                  <li><strong>Cookies analytiques</strong> : nous aident à comprendre l'utilisation du site</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">3. Gestion des cookies</h3>
                <p className="text-gray-600">
                  Vous pouvez à tout moment modifier vos préférences de cookies dans les paramètres 
                  de votre navigateur ou dans les paramètres de votre compte Hui Fenua.
                </p>
              </section>
            </div>
          </motion.div>
        )}

        {/* Legal Mentions Section */}
        {activeSection === 'mentions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-[#1A1A2E] mb-6 flex items-center gap-3">
              <Users className="text-[#FF6B35]" />
              Mentions Légales
            </h2>

            <div className="prose prose-gray max-w-none space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">Éditeur</h3>
                <p className="text-gray-600">
                  Hui Fenua<br />
                  Réseau social pour la Polynésie Française<br />
                  Contact : contact@huifenua.pf
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">Hébergement</h3>
                <p className="text-gray-600">
                  La plateforme est hébergée de manière sécurisée avec des sauvegardes régulières 
                  et une protection des données conforme au RGPD.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">Contact</h3>
                <p className="text-gray-600">
                  Pour toute question concernant vos données personnelles ou l'utilisation de la plateforme, 
                  vous pouvez nous contacter via les paramètres de l'application ou par email.
                </p>
              </section>
            </div>
          </motion.div>
        )}

        {/* Contact Section */}
        <div className="mt-8 bg-gradient-to-r from-[#FF6B35]/10 to-[#FF1493]/10 rounded-3xl p-6 border border-[#FF6B35]/20">
          <div className="flex items-start gap-4">
            <Mail className="text-[#FF6B35] flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-[#1A1A2E]">Une question ?</h3>
              <p className="text-gray-600 mt-1">
                Contactez-nous pour toute demande concernant vos droits ou ces documents légaux.
              </p>
              <Button
                onClick={() => navigate('/chat')}
                className="mt-4 bg-gradient-to-r from-[#FF6B35] to-[#FF1493]"
              >
                Nous contacter
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
