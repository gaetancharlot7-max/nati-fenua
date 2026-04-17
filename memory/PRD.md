# Nati Fenua - Product Requirements Document

## Vision
Nati Fenua est le réseau social de la Polynésie Française, connectant la communauté tahitienne.

## Architecture
- **Frontend**: React 18 + TailwindCSS + Firebase SDK
- **Backend**: FastAPI + Firebase Admin SDK
- **DB**: MongoDB Atlas
- **Déploiement**: Render (ZIP/PowerShell)

## Fonctionnalités Implémentées

### Core Social
- ✅ Auth (JWT + Google OAuth)
- ✅ Posts, Stories, Messagerie
- ✅ Tagging utilisateurs

### Carte Mana
- ✅ Marqueurs avec visibilité (Public/Amis/Privé)
- ✅ Suppression de marqueurs (corrigé)

### PWA & Notifications
- ✅ Icônes avec drapeau polynésien
- ✅ Notifications Push Firebase (likes, commentaires, follows, messages)
- ✅ Bannière d'installation

### UI/UX
- ✅ Thème sombre (toggle Clair/Sombre/Auto)
- ✅ Feed : réactions détaillées par type
- ✅ Feed : compteur commentaires mis à jour
- ✅ Feed : lien "Voir" vers posts enregistrés

## Firebase
- Project: nati-fenua-c66b2
- Messaging Sender ID: 598193673874

## Changelog 2024-04-17
- ✅ Icônes PWA (Playwright)
- ✅ Thème sombre
- ✅ Notifications Push Firebase
- ✅ Corrections Feed (commentaires, réactions, save)

## Backlog
- [ ] 2FA Admin (TOTP)
- [ ] Page "À propos"

## Credentials test
Admin: `admin@natifenua.pf` / `NatiFenua2025!` Le bouton "Save to Github" n'est pas utilisé.
