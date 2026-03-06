# Fenua Social - PRD (Product Requirements Document)

## Original Problem Statement
Création d'un réseau social local pour la Polynésie Française inspiré d'Instagram et TikTok, avec marketplace intégré, système de publicité payante, chat/messagerie, et lives en direct.

## What's Been Implemented (Mar 2026)

### ✅ Dernières corrections (06/03/2026 - Session 2)
1. **Photos téléchargées** - URLs HTTPS correctes, fichiers accessibles
2. **Upload Marketplace** - Création d'annonces avec upload photos depuis l'appareil
3. **Bouton de Likes amélioré** - Nouveau composant ReactionButton avec sélecteur hover
4. **Scroll sur Reels** - Swipe tactile haut/bas + molette souris
5. **Partage fonctionnel** - ShareModal avec WhatsApp, Messenger, Telegram, Facebook, Twitter, Email, copie lien
6. **Politique de confidentialité** - Modal obligatoire avant première publication + sélecteur de visibilité (Public/Abonnés/Privé)
7. **Live vidéo caméra** - Accès caméra du téléphone, switch front/back, micro on/off, démarrage live

### Corrections précédentes (Session 1)
- Commentaires sur photos/vidéos fonctionnels
- Ouverture des annonces Marketplace (modals)
- Page d'authentification avec nouvelles couleurs et logo
- Flèches de navigation Reels déplacées à gauche
- Upload de fichiers depuis l'appareil

### Backend (FastAPI + MongoDB) ✅
- Auth avec JWT + Google OAuth
- Posts avec réactions multiples
- Stories éphémères 24h
- Reels
- Live streaming avec WebSocket
- Chat/messagerie
- Marketplace (produits + services)
- Système publicitaire
- Upload de fichiers (images/vidéos jusqu'à 50MB)
- API Commentaires

### Frontend Web (React + Tailwind + shadcn/ui) ✅
- Landing page design tropical
- Logo animé Fenua Social
- Feed avec réactions + commentaires + partage
- Reels style TikTok avec swipe
- Live streaming avec caméra
- Chat/messagerie
- Marketplace avec création d'annonces
- Dashboard Business
- Politique de confidentialité

### Composants réutilisables créés
- `ShareModal.js` - Partage multi-plateforme
- `ReactionButton.js` - Likes avec sélecteur émoji
- `FileUploader.js` - Upload fichiers + caméra
- `PrivacySettings.js` - Confidentialité + politique

## Design System
- Couleurs: Orange (#FF6B35), Pink (#FF1493), Cyan (#00CED1), Gold (#FFD700)
- Gradients: Orange → Rose
- Logo: F stylisé avec gradient

## Tech Stack
- Backend: FastAPI, MongoDB, WebSocket
- Frontend Web: React, Tailwind CSS, shadcn/ui, Framer Motion
- Frontend Mobile: React Native, TypeScript

## Prioritized Backlog

### P0 (Done) ✅
- Toutes les fonctionnalités core
- Upload fichiers
- Partage social
- Live caméra
- Politique confidentialité

### P1 (Next)
- Notifications push temps réel
- Paiement Stripe marketplace
- Player vidéo réel pour reels
- PWA sur Play Store

### P2 (Future)
- Duets/Remix vidéo
- Filtres AR polynésiens
- Monétisation créateurs
- Publication App Store
