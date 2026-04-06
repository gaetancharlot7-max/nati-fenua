# Nati Fenua - Product Requirements Document

## Original Problem Statement
Application de réseau social polynésien avec flux RSS réels, webcams en direct, authentification Google OAuth, messagerie temps réel, système publicitaire en Francs Pacifiques (XPF), et notifications push.

## Core Features Implemented

### Authentication
- ✅ Google OAuth (Production sur Render)
- ✅ JWT-based custom auth
- ✅ Password reset via email (Resend)

### Feed & Content
- ✅ Flux RSS polynésiens (18 sources fiables, 2x/jour, expire après 48h)
- ✅ Publications utilisateurs avec likes/commentaires
- ✅ Modération hybride (filtres mots + préparé IA)

### Carte Mana
- ✅ Webcams en direct (liens externes pour iframes bloquées)
- ✅ Marqueurs sur carte polynésienne
- ✅ Alertes Mana
- ✅ **Boost 300 XPF** pour roulottes et bonnes affaires

### Messagerie
- ✅ Chat temps réel (WebSockets v2)
- ✅ Recherche d'utilisateurs par auto-complétion
- ✅ Indicateurs de frappe et accusés de lecture
- ✅ **Notifications push** quand message reçu (app fermée)

### Administration
- ✅ Page admin complète (`/admin/login`)
- ✅ Gestion des posts et marqueurs Mana

### Publicité
- ✅ Forfaits en XPF via Stripe
- ✅ Page `/advertising`
- ✅ Boost marker 300 XPF (24h visibilité)

### Internationalisation
- ✅ Traductions FR/Tahitien (89 clés)
- ✅ API `/api/translations/{lang}`

### PWA (Progressive Web App)
- ✅ Installable sur mobile
- ✅ Notifications push (Firebase ready)
- ✅ Service Worker amélioré
- ✅ Banner demande permission notifications

### Modération
- ✅ Filtres mots interdits FR/Tahitien
- ✅ Détection spam automatique
- ✅ Préparé pour IA (clé API optionnelle)

### Statistiques
- ✅ Stats utilisateur `/api/users/{id}/statistics`
- ✅ Stats plateforme `/api/statistics/platform`

### Notifications Push
- ✅ Firebase Cloud Messaging (GRATUIT)
- ✅ Notifications messages
- ✅ Notifications boost roulottes/market
- ✅ Banner permission automatique

## Technical Stack
- Frontend: React 18
- Backend: FastAPI
- Database: MongoDB Atlas
- Hosting: Render
- Auth: Google OAuth + JWT
- Payments: Stripe (emergentintegrations)
- Push: Firebase Cloud Messaging

## Variables d'environnement Render
- `MONGO_URL` - MongoDB Atlas
- `GOOGLE_CLIENT_ID` - OAuth
- `GOOGLE_CLIENT_SECRET` - OAuth
- `STRIPE_API_KEY` - Paiements
- `FIREBASE_SERVER_KEY` - Push notifications (optionnel)
- `RESEND_API_KEY` - Emails (optionnel)
- `MODERATION_AI_KEY` - IA modération (optionnel)

## Backlog (P3)
- Application mobile Expo (App Store/Play Store)
- Modération par IA avancée

## Templates Territoires Créés
- **TEMPLATE_KAMO_NOUVELLE_CALEDONIE.md** : Template complet pour créer "Kamo" (NC)
  - Régions : Nouméa, Dumbéa, Mont-Dore, Païta, Bourail, Koné, Lifou, Maré, Ouvéa, Île des Pins...
  - RSS : LNC, NC la 1ère, Caledonia, Outremers 360...
  - Traductions : Français/Drehu
  - Même architecture et performances que Nati Fenua

## Last Update
2026-04-06 - v12: Page Média séparée (sans stats, lien site web) + Template Kamo NC
