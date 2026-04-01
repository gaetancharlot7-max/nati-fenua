# Nati Fenua - Product Requirements Document

## Project Overview
**Application** : Réseau social polynésien "Nati Fenua"  
**Stack** : React 18.2.0 (Frontend) + FastAPI (Backend) + MongoDB Atlas (Database)  
**Status** : Déployé sur Render, Google OAuth natif configuré

---

## Original Problem Statement
L'utilisateur souhaitait déployer son application Nati Fenua sur Render, enrichir le fil d'actualité avec de vrais flux RSS polynésiens, configurer la connexion Google OAuth native (sans Emergent Auth).

---

## Core Features Implemented

### Authentication
- [x] Login/Logout avec sessions sécurisées
- [x] Inscription email/mot de passe
- [x] **Connexion Google OAuth 2.0 native** (configuré pour Render)
- [ ] Connexion Facebook (désactivée volontairement)
- [ ] Mot de passe oublié (nécessite clé API Resend)

### Social Features
- [x] Posts, Stories, Reels, Lives
- [x] Feed personnalisé avec flux RSS locaux (35 sources)
- [x] Notifications
- [x] Conversations/Chat
- [x] Profils utilisateurs avec liens cliquables

### Carte Mana (ex-Pulse)
- [x] Carte Leaflet interactive
- [x] Îles : Tahiti, Moorea, Bora Bora, Raiatea, etc.
- [x] Webcams publiques intégrées

### Marketplace
- [x] Produits avec catégories
- [x] Recherche et filtres

---

## Configuration Google OAuth (31 Mars 2026)

### Identifiants Google Cloud
```
Client ID    : 795265896237-vbtdva4ubl9r203j79dj7jcctd7s3d2g.apps.googleusercontent.com
Client Secret: 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
```

### URLs configurées
- Origine JS autorisée : `https://nati-fenua-frontend.onrender.com`
- URI de redirection : `https://nati-fenua-backend.onrender.com/api/auth/google/callback`

---

## Déploiement Render

### URLs de Production
- **Frontend** : `https://nati-fenua-frontend.onrender.com`
- **Backend** : `https://nati-fenua-backend.onrender.com`

### Variables d'environnement Backend
```
GOOGLE_CLIENT_ID=795265896237-vbtdva4ubl9r203j79dj7jcctd7s3d2g.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://nati-fenua-backend.onrender.com/api/auth/google/callback
FRONTEND_URL=https://nati-fenua-frontend.onrender.com
```

---

## Pending Tasks

### P0 - Immédiat
- [x] ~~Retirer Facebook, garder Google~~
- [x] ~~Configurer Google OAuth natif~~
- [ ] Déployer sur Render (ZIPs prêts)

### P1 - Court terme
- [ ] Fonction "Mot de passe oublié" (clé API Resend)
- [ ] Système de traduction FR/Tahitien complet

### P2 - Moyen terme
- [ ] Refactoring server.py (5000+ lignes)

---

## Backlog (Future)
- [ ] Application mobile Expo
- [ ] WebSocket pour chat temps réel
- [ ] Notifications push

---

## Test Credentials
- Email: `user1@test.com`
- Password: `TestPass123!`

---

## Documentation
- `/app/CONFIGURATION_NATI_FENUA.md` - Guide complet de configuration

---

*Dernière mise à jour : 31 Mars 2026*
