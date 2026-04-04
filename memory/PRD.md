# Nati Fenua - Product Requirements Document

## Original Problem Statement
Application de réseau social polynésien avec flux RSS réels, webcams en direct, authentification Google OAuth, messagerie temps réel, et système publicitaire en Francs Pacifiques (XPF).

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

### Messagerie
- ✅ Chat temps réel (WebSockets v2)
- ✅ Recherche d'utilisateurs par auto-complétion
- ✅ Indicateurs de frappe et accusés de lecture

### Administration
- ✅ Page admin complète (`/admin/login`)
- ✅ Gestion des posts et marqueurs Mana

### Publicité
- ✅ Forfaits en XPF via Stripe
- ✅ Page `/advertising`

### Internationalisation
- ✅ Traductions FR/Tahitien (89 clés)
- ✅ API `/api/translations/{lang}`

### PWA (Progressive Web App)
- ✅ Installable sur mobile
- ✅ Notifications push (Firebase ready)
- ✅ Service Worker amélioré

### Modération
- ✅ Filtres mots interdits FR/Tahitien
- ✅ Détection spam automatique
- ✅ Préparé pour IA (clé API optionnelle)

### Statistiques
- ✅ Stats utilisateur `/api/users/{id}/statistics`
- ✅ Stats plateforme `/api/statistics/platform`

### Notifications
- ✅ Push Notifications Firebase (code prêt, clé requise)
- ✅ Emails Resend (code prêt, clé requise)

## Technical Stack
- Frontend: React 18
- Backend: FastAPI
- Database: MongoDB Atlas
- Hosting: Render
- Auth: Google OAuth + JWT
- Payments: Stripe (emergentintegrations)

## API Endpoints Clés
- `/api/auth/google` - OAuth Google
- `/api/auth/forgot-password` - Réinitialisation
- `/api/translations/{lang}` - Traductions
- `/api/statistics/platform` - Stats publiques
- `/api/users/{id}/statistics` - Stats utilisateur
- `/ws/v2/chat/{user_id}` - WebSocket chat

## Backlog (P3)
- Application mobile Expo (App Store/Play Store)
- Modération par IA avancée

## Last Update
2026-04-04 - v3: Modération hybride, PWA améliorée, RSS nettoyé (18 sources)
