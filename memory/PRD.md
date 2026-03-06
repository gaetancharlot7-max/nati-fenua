# Fenua Social - PRD (Product Requirements Document)

## Original Problem Statement
Création d'un réseau social local pour la Polynésie Française inspiré d'Instagram et TikTok, avec marketplace intégré, système de publicité payante, chat/messagerie, et lives en direct.

## What's Been Implemented (Mar 2026)

### ✅ Corrections appliquées le 06/03/2026
1. **Commentaires sur photos/vidéos** - Système de commentaires complet avec modal et input inline
2. **Ouverture des annonces Marketplace** - Modals détaillés pour produits et services avec infos vendeur
3. **Page d'authentification** - Nouvelles couleurs (gradient orange/rose) et nouveau logo Fenua
4. **Flèches de navigation Reels** - Déplacées à gauche (ne chevauchent plus les boutons de partage)
5. **Upload de fichiers** - Possibilité d'uploader des photos/vidéos directement depuis l'appareil

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
- **NOUVEAU: Upload de fichiers** (images et vidéos jusqu'à 50MB)
- **NOUVEAU: Commentaires API** fonctionnels

### Frontend Web (React + Tailwind + shadcn/ui) ✅
- Landing page avec design vibrant tropical
- Logo animé Fenua Social
- Feed avec réactions multiples + **système de commentaires**
- Page Reels style TikTok (flèches à gauche)
- Page Live streaming
- Chat/messagerie
- **Marketplace avec modals de détail** (clic = ouverture annonce)
- Dashboard Business (onglet séparé dans sidebar)
- **Page auth avec couleurs et logo corrects**
- **Page création avec upload depuis l'appareil**

### PWA (Progressive Web App) ✅
- manifest.json configuré
- Service Worker (sw.js)
- Icônes PWA

### Application Mobile React Native ✅
Structure complète avec tous les écrans

## Design System
- Couleurs: Orange (#FF6B35), Pink (#FF1493), Cyan (#00CED1), Gold (#FFD700)
- Gradients tropicaux orange → rose
- Logo: F stylisé avec gradient dans carré arrondi

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
- Corrections: commentaires, modals marketplace, couleurs auth, flèches reels, upload fichiers

### P1 (Next)
- Notifications push en temps réel
- Système de paiement Stripe pour marketplace
- Vidéo player réel pour les reels (actuellement images)

### P2 (Future)
- Duets/Remix vidéo
- Filtres AR polynésiens
- Monétisation créateurs
- Publication sur App Store / Play Store
