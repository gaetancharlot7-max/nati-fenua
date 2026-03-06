# Fenua Social - PRD (Product Requirements Document)

## Original Problem Statement
Création d'un réseau social local pour la Polynésie Française inspiré d'Instagram et TikTok, avec marketplace intégré, système de publicité payante, chat/messagerie, et lives en direct.

## User Personas
1. **Utilisateur Local** - Polynésien souhaitant partager sa vie et rester connecté avec sa communauté
2. **Commerçant Local** - Vendeur de produits locaux (perles, monoï, artisanat)
3. **Entreprise** - Business local souhaitant faire de la publicité ciblée
4. **Créateur de Contenu** - Influenceur polynésien partageant des reels et lives

## Core Requirements
- Authentification double (Email + Google OAuth)
- Feed avec photos, vidéos, stories, reels
- Live streaming en direct
- Chat/messagerie privée
- Marketplace (produits + services)
- Système publicitaire payant avec ciblage (onglet Business séparé)
- Analytics et collecte de données

## What's Been Implemented (Mar 2026)

### Backend (FastAPI + MongoDB) ✅
- Auth avec JWT + Google OAuth (Emergent Auth)
- Posts avec réactions multiples (like, love, fire, haha, wow)
- Stories éphémères 24h
- Reels (vidéos courtes)
- Live streaming avec WebSocket
- Chat/messagerie avec WebSocket
- Marketplace (produits + services)
- Système publicitaire complet (campagnes, ciblage, pricing)
- Analytics et tracking

### Frontend Web (React + Tailwind + shadcn/ui) ✅
- Landing page avec design vibrant tropical
- Logo animé Fenua Social
- Feed avec réactions multiples
- Page Reels style TikTok
- Page Live streaming
- Chat/messagerie
- Marketplace
- Dashboard Business (onglet séparé dans sidebar)
- Création de publicités avec ciblage

### PWA (Progressive Web App) ✅
- manifest.json configuré
- Service Worker (sw.js)
- Icônes PWA

### Application Mobile React Native ✅
Structure complète avec:
- Navigation (bottom tabs + stack)
- 11 écrans complets:
  - FeedScreen (avec stories et posts)
  - ReelsScreen (style TikTok)
  - LiveScreen (streams en direct)
  - CreateScreen (création de contenu)
  - MarketplaceScreen (produits locaux)
  - ProfileScreen (profil utilisateur)
  - ChatScreen (messagerie)
  - SearchScreen (recherche)
  - NotificationsScreen (notifications)
  - AuthScreen + LandingScreen
- AuthContext pour l'authentification
- Services API configurés
- Configuration complète (babel, metro, tsconfig)

## Design System
- Couleurs: Orange (#FF6B35), Pink (#FF1493), Cyan (#00CED1), Gold (#FFD700)
- Gradients tropicaux
- Logo: F stylisé avec gradient

## Tech Stack
- Backend: FastAPI, MongoDB, WebSocket
- Frontend Web: React, Tailwind CSS, shadcn/ui, Framer Motion
- Frontend Mobile: React Native, TypeScript
- Auth: JWT + Emergent Google OAuth

## Prioritized Backlog

### P0 (Done) ✅
- Auth, Feed, Stories, Reels, Live, Chat, Marketplace, Ads
- PWA
- Structure complète app mobile React Native

### P1 (Next)
- Build et test de l'app mobile sur simulateur/appareil
- Notifications push en temps réel
- Système de paiement Stripe pour marketplace
- Upload d'images réel (actuellement URL)

### P2 (Future)
- Duets/Remix vidéo
- Filtres AR polynésiens
- Monétisation créateurs
- Publication sur App Store / Play Store

## Notes Techniques
- L'onglet Business/Publicité est accessible via le sidebar (pas sur landing page)
- L'app mobile nécessite un environnement de build (Xcode/Android Studio)
- Chat et Live utilisent des mocks côté mobile (WebSocket à implémenter)
