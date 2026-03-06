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
- Système publicitaire payant avec ciblage
- Analytics et collecte de données

## What's Been Implemented (Jan 2026)
### Backend (FastAPI + MongoDB)
- ✅ Auth avec JWT + Google OAuth (Emergent Auth)
- ✅ Posts avec réactions multiples (like, love, fire, haha, wow)
- ✅ Stories éphémères 24h
- ✅ Reels (vidéos courtes)
- ✅ Live streaming avec WebSocket
- ✅ Chat/messagerie avec WebSocket
- ✅ Marketplace (produits + services)
- ✅ Système publicitaire complet (campagnes, ciblage, pricing)
- ✅ Analytics et tracking

### Frontend (React + Tailwind + shadcn/ui)
- ✅ Landing page avec design vibrant tropical
- ✅ Logo animé Fenua Social
- ✅ Feed avec réactions multiples
- ✅ Page Reels style TikTok
- ✅ Page Live streaming
- ✅ Chat/messagerie
- ✅ Marketplace
- ✅ Dashboard Business
- ✅ Création de publicités avec ciblage

## Design System
- Couleurs: Orange (#FF6B35), Pink (#FF1493), Cyan (#00CED1), Gold (#FFD700)
- Gradients tropicaux
- Logo: F stylisé avec gradient

## Prioritized Backlog
### P0 (Done)
- Auth, Feed, Stories, Reels, Live, Chat, Marketplace, Ads

### P1 (Next)
- Notifications push en temps réel
- Système de paiement Stripe pour marketplace et ads
- Upload d'images réel (actuellement URL)
- Algorithme de recommandation

### P2 (Future)
- Duets/Remix vidéo
- Filtres AR polynésiens
- Monétisation créateurs
- App mobile native

## Tech Stack
- Backend: FastAPI, MongoDB, WebSocket
- Frontend: React, Tailwind CSS, shadcn/ui, Framer Motion
- Auth: JWT + Emergent Google OAuth
