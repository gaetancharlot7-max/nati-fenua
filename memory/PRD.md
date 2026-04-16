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
- ✅ Suppression de marqueurs (CORRIGÉ - collection pulse_markers)
- ✅ Compteurs de confirmations

### Marketplace
- ✅ Annonces avec images Unsplash
- ✅ Catégories de produits

### PWA
- ✅ Bannière d'installation persistante (Landing + Feed)
- ✅ Icônes générées avec drapeau polynésien (Playwright)
- ✅ Service Worker

### UI/UX
- ✅ Thème sombre (ThemeContext + page /settings)
- ✅ Toggle Clair/Sombre/Auto dans les paramètres

## Intégrations Tierces
- Stripe (Paiements) - Clé utilisateur
- Google OAuth - Clé utilisateur
- Firebase (Push) - En attente des clés

## Changelog récent

### 2024-04-16 (Session actuelle)
- ✅ Génération des icônes PWA avec Playwright (fix du drapeau base64)
- ✅ Correction du bug "Marqueur non trouvé" sur Mana
  - Changé `db.markers` → `db.pulse_markers` dans server.py
- ✅ Implémentation du thème sombre complet
  - ThemeContext.js avec persistance
  - Page /settings avec sélecteur de thème
  - MainLayout adapté
  - Styles CSS globaux dark mode

### Sessions précédentes
- Guide de sécurité, fix iOS Safari, images Marketplace
- Tagging utilisateurs, Bannière PWA
- Mana : visibilité marqueurs, compteurs webcams

## Backlog Prioritisé

### P1 - Haute priorité
- [ ] Valider fonctionnement Mana en production (retours utilisateurs)

### P2 - Moyenne priorité
- [ ] Notifications push Firebase (requiert clés API)
- [ ] 2FA Admin (TOTP)

### P3 - Basse priorité
- [ ] Page "À propos"
- [ ] Amélioration thème sombre sur toutes les pages

### P4 - Futur
- [ ] Application mobile native (Expo)
- [ ] Publication App Store / Play Store

## Fichiers Clés
- `/app/backend/server.py` - API principale
- `/app/backend/fenua_pulse.py` - Logique carte Mana
- `/app/frontend/src/contexts/ThemeContext.js` - Gestion du thème
- `/app/frontend/src/pages/SettingsPage.js` - Page paramètres
- `/app/frontend/public/manifest.json` - Configuration PWA

## Credentials de test
- Admin: `admin@natifenua.pf` / `NatiFenua2025!`

## Notes de déploiement
L'utilisateur déploie manuellement via ZIP téléchargé depuis l'environnement de preview, puis git push vers Render. Le bouton "Save to Github" n'est pas utilisé.
