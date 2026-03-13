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
- **Carte interactive en temps réel** avec 9 îles :
  - Tahiti, Moorea, Bora Bora, Raiatea, **Taha'a**, Huahine, **Maupiti**, Tuamotu, Marquises
  - Filtres par type de signalement (roulottes, accidents, surf, événements, météo, marché, etc.)
  - **Clic sur catégorie = voir tous les emplacements de cette catégorie**
  - Bouton de localisation GPS
  - Création de signalements géolocalisés
  
- **Système Vendeurs/Roulottes** :
  - Création de profil vendeur
  - Bouton "Je suis ouvert" pour apparaître sur la carte
  - Gestion du menu avec création, modification et suppression de plats
  - **Bouton "Contacter" avec lien téléphone et page vendeur**
  - Système d'avis clients
  - Notifications push pour abonnés

- **Gamification (Mana)** :
  - Points Mana gagnés pour les contributions
  - Classement par île
  - Validation communautaire des signalements

### Live Streaming (Complète)
- Liste des lives en cours
- Page de visionnage avec chat en direct
- Bouton de démarrage de live
- Compteur de spectateurs et likes

### Phase 4 - Publication Automatique & Presse (NOUVELLE - Complète)

#### Flux RSS - Vrais Articles de Presse
- **Sources intégrées** :
  - Tahiti Infos ✅
  - Polynésie 1ère ✅
  - TNTV ✅
  - Radio 1 Tahiti (partiellement)
  - La Dépêche de Tahiti (partiellement)
- **Fonctionnalités** :
  - Récupération automatique des articles
  - Détection automatique de l'île concernée
  - Publication comme posts avec lien vers l'article original
  - Comptes médias vérifiés créés automatiquement
  - Nettoyage des liens YouTube non fonctionnels

#### Publication Automatique Locale
- 20-30 posts générés quotidiennement
- Couverture des 9 îles polynésiennes
- Mix de contenus : photos, articles locaux
- Comptes bot vérifiés pour chaque île

### APIs de Contenu
- `GET /api/news/latest` - Derniers articles de presse
- `GET /api/content/island/{island_id}` - Contenu par île
- `POST /api/admin/rss/fetch` - Récupérer les flux RSS
- `POST /api/admin/cleanup/youtube` - Nettoyer liens YouTube

## Architecture Technique

### Backend (FastAPI)
- `/app/backend/server.py` - Routes principales
- `/app/backend/rss_feeds.py` - **NOUVEAU** : Intégration flux RSS
- `/app/backend/auto_publisher.py` - Publication automatique
- `/app/backend/fenua_pulse.py` - Logique Fenua Pulse (9 îles)
- `/app/backend/roulotte.py` - Système vendeurs

### Frontend (React)
- `/app/frontend/src/pages/PulsePage.js` - Carte avec filtres cliquables et bouton contacter
- `/app/frontend/src/pages/FeedPage.js` - Fil d'actualité avec articles de presse
- `/app/frontend/src/pages/AdminAutoPublishPage.js` - Gestion publication auto

### Base de données
- MongoDB avec collections : users, posts, stories, vendors, pulse_markers, etc.

## Statut actuel : Application Fonctionnelle

### Testé et validé ✅
- Carte Fenua Pulse avec 9 îles (Tahiti, Moorea, Bora Bora, Raiatea, Taha'a, Huahine, Maupiti, Tuamotu, Marquises)
- Filtres par catégorie au clic
- Flux RSS avec vrais articles de presse polynésiens
- Publication automatique quotidienne
- Live streaming fonctionnel
- CORS configuré pour production
- Requêtes DB optimisées (N+1 corrigé)

### Prêt pour déploiement ✅
- Health check passé
- Variables d'environnement configurées
- Pas de valeurs hardcodées

## Tâches Futures (Backlog)

### P1 - Court terme
- Ajouter plus de sources RSS locales
- Améliorer la détection d'île dans les articles

### P2 - Moyen terme
- Système de publicité complet
- Fonctionnalités "Duets/Remix"
- Collections de contenus

### P3 - Long terme
- Application mobile Expo
- Publication App Store / Play Store

---
*Dernière mise à jour : 13 Mars 2026*
