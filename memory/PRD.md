# Nati Fenua - Product Requirements Document

## Vision
Nati Fenua est le réseau social de la Polynésie Française, connectant la communauté tahitienne à travers des fonctionnalités locales uniques.

## Architecture Technique
- **Frontend**: React 18 + TailwindCSS + Firebase SDK
- **Backend**: FastAPI (Python) + Firebase Admin SDK
- **Base de données**: MongoDB Atlas
- **Déploiement**: Render (géré par l'utilisateur via ZIP/PowerShell)
- **PWA**: Manifest.json + Service Worker + Firebase Messaging

## Fonctionnalités Implémentées

### Core Social
- ✅ Authentification (JWT + Google OAuth)
- ✅ Posts avec images
- ✅ Stories éphémères
- ✅ Messagerie privée
- ✅ Profils utilisateurs
- ✅ Tagging d'utilisateurs dans les posts

### Carte Mana (Fenua Pulse)
- ✅ Marqueurs d'événements avec visibilité (Public/Amis/Privé)
- ✅ Webcams en direct
- ✅ Suppression de marqueurs (CORRIGÉ - collection pulse_markers)
- ✅ Compteurs de confirmations

### Marketplace
- ✅ Annonces avec images Unsplash
- ✅ Catégories de produits

### PWA & Notifications
- ✅ Bannière d'installation persistante (Landing + Feed)
- ✅ Icônes générées avec drapeau polynésien (Playwright)
- ✅ Service Worker Firebase
- ✅ Notifications Push Firebase (FCM)
- ✅ Composant NotificationPrompt

### UI/UX
- ✅ Thème sombre (ThemeContext + page /settings)
- ✅ Toggle Clair/Sombre/Auto dans les paramètres

## Intégrations Tierces
- Stripe (Paiements) - Clé utilisateur
- Google OAuth - Clé utilisateur
- **Firebase Cloud Messaging** - Configuré (projet nati-fenua-c66b2)

## Changelog récent

### 2024-04-17 (Session actuelle)
- ✅ Génération des icônes PWA avec Playwright (fix du drapeau base64)
- ✅ Correction du bug "Marqueur non trouvé" sur Mana
- ✅ Implémentation du thème sombre complet
- ✅ **Notifications Push Firebase**
  - Firebase Admin SDK (backend)
  - Firebase Messaging SDK (frontend)
  - Service Worker: firebase-messaging-sw.js
  - Endpoints: /api/notifications/register-token, unregister-token
  - Composant NotificationPrompt avec UX soignée

## Backlog Prioritisé

### P1 - Haute priorité
- [ ] Tester notifications en production
- [ ] Notifications automatiques (likes, commentaires, messages)

### P2 - Moyenne priorité
- [ ] 2FA Admin (TOTP)

### P3 - Basse priorité
- [ ] Page "À propos"

### P4 - Futur
- [ ] Application mobile native (Expo)

## Fichiers Clés
- `/app/backend/server.py` - API principale
- `/app/backend/push_notifications.py` - Service FCM
- `/app/backend/firebase-service-account.json` - Credentials Firebase
- `/app/frontend/src/lib/firebase.js` - Client Firebase
- `/app/frontend/public/firebase-messaging-sw.js` - Service Worker
- `/app/frontend/src/components/NotificationPrompt.js` - UI notifications
- `/app/frontend/src/contexts/ThemeContext.js` - Gestion du thème

## Firebase Configuration
- Project ID: nati-fenua-c66b2
- Messaging Sender ID: 598193673874
- VAPID Key: BIJ8pone0wnzCfmpy9SBHSR3_gux5GcvRT4m8BIFGhpwheYsOnTNbMcNCjYr9ya1AKgayk7quWG1sFjmOlT3WJE

## Credentials de test
- Admin: `admin@natifenua.pf` / `NatiFenua2025!`

## Notes de déploiement
- L'utilisateur déploie manuellement via ZIP téléchargé depuis l'environnement de preview
- Ajouter `firebase-admin` au requirements.txt sur Render Le bouton "Save to Github" n'est pas utilisé.
