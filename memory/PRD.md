# Nati Fenua - Product Requirements Document

## Vision
Nati Fenua est le réseau social de la Polynésie Française, connectant la communauté tahitienne à travers des fonctionnalités locales uniques.

## Architecture Technique
- **Frontend**: React 18 + TailwindCSS
- **Backend**: FastAPI (Python)
- **Base de données**: MongoDB Atlas
- **Déploiement**: Render (géré par l'utilisateur via ZIP/PowerShell)
- **PWA**: Manifest.json + Service Worker

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
- ✅ Suppression de marqueurs
- ✅ Compteurs de confirmations

### Marketplace
- ✅ Annonces avec images Unsplash
- ✅ Catégories de produits

### PWA
- ✅ Bannière d'installation persistante (Landing + Feed)
- ✅ Icônes générées avec drapeau polynésien (Playwright)
- ✅ Service Worker

## Intégrations Tierces
- Stripe (Paiements) - Clé utilisateur
- Google OAuth - Clé utilisateur
- Firebase (Push) - En attente

## Changelog récent

### 2024-04-16
- ✅ Génération des icônes PWA avec Playwright (fix du drapeau base64)
- ✅ Toutes les tailles d'icônes : 16, 32, 48, 64, 128, 152, 167, 180, 192, 256, 384, 512px
- ✅ Favicon.ico et apple-touch-icon.png

### Sessions précédentes
- ✅ Guide de sécurité (GUIDE_SECURITE_NATI_FENUA.html)
- ✅ Fix CSS iOS Safari (100vh → -webkit-fill-available)
- ✅ Images Marketplace Unsplash
- ✅ Tagging utilisateurs (tagged_users dans posts)
- ✅ Bannière PWA persistante
- ✅ Mana : visibilité des marqueurs
- ✅ Mana : compteurs webcams à 0
- ✅ Mana : endpoint suppression vérifié

## Backlog Prioritisé

### P1 - Haute priorité
- [ ] Valider fonctionnement Mana en production (retours utilisateurs)

### P2 - Moyenne priorité
- [ ] 2FA Admin (TOTP)
- [ ] Notifications push Firebase

### P3 - Basse priorité
- [ ] Thème sombre complet
- [ ] Page "À propos"

### P4 - Futur
- [ ] Application mobile native (Expo)
- [ ] Publication App Store / Play Store

## Fichiers Clés
- `/app/backend/server.py` - API principale
- `/app/backend/fenua_pulse.py` - Logique carte Mana
- `/app/frontend/src/pages/ManaPage.js` - Interface carte
- `/app/frontend/src/pages/CreatePostPage.js` - Création de posts
- `/app/frontend/public/manifest.json` - Configuration PWA
- `/app/frontend/public/assets/logo_nati_fenua_v2.svg` - Logo source

## Credentials de test
- Admin: `admin@natifenua.pf` / `NatiFenua2025!`

## Notes de déploiement
L'utilisateur déploie manuellement via ZIP téléchargé depuis l'environnement de preview, puis git push vers Render. Le bouton "Save to Github" n'est pas utilisé.
