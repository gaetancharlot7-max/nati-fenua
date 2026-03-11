# Hui Fenua - PRD (Product Requirements Document)

## Résumé du Projet
Hui Fenua est un réseau social pour la communauté tahitienne en Polynésie française, inspiré d'Instagram et TikTok.

## Fonctionnalités Implémentées

### Phase 1 - MVP (Complète)
- **Authentification sécurisée** : Email/Mot de passe avec bcrypt, protection anti-brute force, JWT
- **Connexion Google** : OAuth 2.0 via Emergent
- **Fil d'actualité** : Posts photo/vidéo avec lazy loading, skeleton loaders, pagination infinie
- **Stories** : Durée de vie de 7 jours dans le fil, 30 jours sur profil
- **Chat en temps réel** : Conversations et messages
- **Marché** : Produits et services

### Phase 2 - Fonctionnalités Avancées (Complète)
- **Modération de contenu** : Système de signalement avec catégories, avertissements progressifs, tableau de bord admin
- **Conformité RGPD** : Consentement cookies, export de données, suppression de compte, vérification d'âge
- **Monitoring & Analytics** : Tableau de bord admin avec statistiques d'utilisation et monitoring technique

### Phase 3 - Fenua Pulse (Complète)
- **Carte interactive en temps réel** :
  - Affichage de Tahiti, Moorea, Bora Bora et autres îles
  - Filtres par type de signalement (roulottes, accidents, surf, événements, météo, etc.)
  - Bouton de localisation GPS
  - Création de signalements géolocalisés
  
- **Système Vendeurs/Roulottes** :
  - Création de profil vendeur
  - Bouton "Je suis ouvert" pour apparaître sur la carte
  - Gestion du menu avec création, modification et suppression de plats
  - Onglets Dashboard / Menu / Paramètres
  - Système d'avis clients
  - Abonnements aux vendeurs avec notifications

- **Gamification (Mana)** :
  - Points Mana gagnés pour les contributions
  - Classement par île
  - Validation communautaire des signalements

### Live Streaming (Complète)
- Liste des lives en cours
- Page de visionnage avec chat en direct
- Bouton de démarrage de live
- Compteur de spectateurs et likes

## Architecture Technique

### Backend (FastAPI)
- `/app/backend/server.py` - Routes principales
- `/app/backend/auth_security.py` - Sécurité et authentification
- `/app/backend/fenua_pulse.py` - Logique Fenua Pulse
- `/app/backend/roulotte.py` - Système vendeurs
- `/app/backend/moderation.py` - Modération
- `/app/backend/gdpr.py` - Conformité RGPD
- `/app/backend/analytics.py` - Analytics

### Frontend (React)
- `/app/frontend/src/pages/FeedPage.js` - Fil d'actualité
- `/app/frontend/src/pages/PulsePage.js` - Carte Fenua Pulse
- `/app/frontend/src/pages/LivePage.js` - Liste des lives
- `/app/frontend/src/pages/LiveViewPage.js` - Visionnage d'un live
- `/app/frontend/src/pages/VendorDashboardPage.js` - Dashboard vendeur

### Base de données
- MongoDB avec collections : users, posts, stories, conversations, messages, vendors, pulse_markers, etc.

## Statut actuel : Application Fonctionnelle

### Testé et validé
- Carte Fenua Pulse
- Page Live avec visionnage
- Fil d'actualité avec stories
- Dashboard vendeur avec onglets de modification
- APIs backend (pulse, lives, posts, roulotte)

### Issues connues (P2)
- Connexion Facebook non fonctionnelle (redirection)

## Tâches Futures (Backlog)

### P1 - Court terme
- Finaliser le système de publicité
- Améliorer le chat en temps réel

### P2 - Moyen terme
- Fonctionnalités "Duets/Remix"
- Collections de contenus
- Système d'abonnement premium pour créateurs

### P3 - Long terme
- Application mobile Expo
- Publication App Store / Play Store

---
*Dernière mise à jour : 11 Mars 2026*
