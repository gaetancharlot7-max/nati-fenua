# Nati Fenua - PRD (Product Requirements Document)

## Résumé du Projet
Nati Fenua est un réseau social pour la communauté tahitienne en Polynésie française, inspiré d'Instagram et TikTok.

## Fonctionnalités Implémentées

### Phase 1 - MVP (Complète)
- **Authentification sécurisée** : Email/Mot de passe avec bcrypt, protection anti-brute force, JWT
- **Connexion Google** : OAuth 2.0 via Emergent ✅
- **Connexion Facebook** : OAuth 2.0 ✅
- **Mot de passe oublié** : Page dédiée, envoi d'email via Resend (mode simulation si pas de clé) ✅
- **Déconnexion** : Bouton visible sur le profil utilisateur ✅
- **Fil d'actualité** : Posts photo/vidéo avec lazy loading, skeleton loaders, pagination infinie
- **Stories** : Durée de vie de 7 jours dans le fil, 30 jours sur profil
- **Chat en temps réel** : Conversations et messages
- **Marché** : Produits et services

### Phase 2 - Fonctionnalités Avancées (Complète)
- **Modération de contenu** : Système de signalement avec catégories, avertissements progressifs, tableau de bord admin
- **Conformité RGPD** : Consentement cookies, export de données, suppression de compte, vérification d'âge
- **Monitoring & Analytics** : Tableau de bord admin avec statistiques
- **Traduction FR ↔ Tahitien** : Dictionnaire 163+ mots français, 157+ mots tahitiens, bouton sur chaque post ✅

### Phase 3 - Fenua Pulse avec Webcams Live (Complète)

#### Carte Interactive - 9 Îles
- Tahiti, Moorea, Bora Bora, Raiatea, **Taha'a**, Huahine, **Maupiti**, Tuamotu, Marquises

#### 10 Webcams Live
| Webcam | Île | Localisation |
|--------|-----|--------------|
| Port de Papeete | Tahiti | Centre-ville |
| Teahupo'o | Tahiti | Spot de surf |
| Baie d'Opunohu | Moorea | Nature |
| Plage de Matira | Bora Bora | Plage |
| Port d'Uturoa | Raiatea | Port |
| Baie de Haamene | Taha'a | Vanille |
| Village de Fare | Huahine | Village |
| Village de Vaiea | Maupiti | Village |
| Passe de Tiputa | Tuamotu | Plongée |
| Baie de Taiohae | Marquises | Nature |

#### Catégories de Signalement (9 types)
- 🚚 Roulotte / Vendeur
- 🔥 Accident / Route bloquée
- 🌊 Conditions surf
- 📅 Événement
- 📹 **Webcam Live**
- ☁️ Alerte météo
- 🛍️ Bonne affaire / Marché
- 🚗 **Covoiturage** ✅
- 📍 Autre signalement

#### Fonctionnalités Fenua Pulse
- **Clic sur catégorie** = voir tous les emplacements de ce type
- **Bouton "Contacter par message"** pour roulottes/marché → ouvre conversation directe ✅
- **Bouton "Appeler"** avec lien tel: pour appeler directement le vendeur ✅
- **Boutons Zoom +/-** sur la carte ✅
- **Bouton "Ma position"** pour géolocalisation ✅
- **Vidéos 5 secondes en boucle** sur chaque point webcam
- Gamification avec points Mana

### Phase 4 - Flux RSS & Presse (Complète)

#### 8 Sources RSS Polynésiennes
- Tahiti Infos ✅
- Polynésie 1ère ✅
- TNTV ✅
- Outremers 360 ✅
- Tahiti News
- Actu.fr Polynésie
- Air Tahiti Magazine
- Surf Report Tahiti

### Phase 5 - Tableau de Bord Vendeur "Ma Roulotte" (Complète)

## Architecture Technique

### Backend
- `/app/backend/server.py` - API principale FastAPI
- `/app/backend/tahitian_dictionary.py` - Dictionnaire de traduction (163 mots FR, 157 mots TAH)
- `/app/backend/fenua_pulse.py` - Carte + 10 webcams
- `/app/backend/rss_feeds.py` - 8 sources RSS
- `/app/backend/roulotte.py` - Gestion des roulottes

### Frontend
- `/app/frontend/src/pages/FeedPage.js` - Feed avec bouton traduction sur chaque post
- `/app/frontend/src/pages/ForgotPasswordPage.js` - Page mot de passe oublié
- `/app/frontend/src/pages/AuthCallback.js` - Callback OAuth Google
- `/app/frontend/src/contexts/AuthContext.js` - Gestion authentification

## Statut : Application Fonctionnelle ✅

### Testé et validé (24/03/2026)
- **Connexion** : Email/password ✅, Google (prêt) ✅
- **Mot de passe oublié** : Page et API fonctionnels ✅
- **Traduction** : 163 mots FR → TAH, bouton sur posts ✅
- **Feed** : Posts, stories, likes, commentaires ✅
- **Fenua Pulse** : Carte, webcams, catégories ✅

### Configuration requise pour production
- `RESEND_API_KEY` : Pour l'envoi réel d'emails
- `MONGO_URL` : MongoDB Atlas (configuré pour Railway)
- `DB_NAME` : `nati_fenua`

## Déploiement Railway (En cours)

### Services créés
- **grateful-presence** : Backend Python/FastAPI
- **accurate-quietude** : Frontend React

### Configuration MongoDB Atlas
- Cluster : M0FREE (gratuit)
- Région : Sydney (proche Polynésie)
- User : gaetancharlot7_db_user

### À finaliser
1. Générer domaines publics sur Railway
2. Configurer `REACT_APP_BACKEND_URL` dans le frontend
3. Tester le déploiement complet

## Prochaines Étapes

### P0 - Immédiat
- Tester la connexion Google avec un vrai compte

### P1 - Court terme
- Finaliser le déploiement Railway
- Ajouter clé API Resend pour les emails

### P2 - Moyen terme
- Enrichir le dictionnaire tahitien
- Application mobile Expo

### P3 - Long terme
- Système de publicité
- Abonnement premium

---
*Dernière mise à jour : 24 Mars 2026*
*Version : 1.0.0*
