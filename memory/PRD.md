# Fenua Social - PRD (Product Requirements Document)

## Original Problem Statement
Création d'un réseau social local pour la Polynésie Française inspiré d'Instagram et TikTok, avec marketplace intégré, système de publicité payante, chat/messagerie, lives en direct, et système de sécurité/modération robuste.

## What's Been Implemented

### ✅ Améliorations (07/03/2026 - Session 2)
1. **Système de Notifications Complet** :
   - Notifications en temps réel quand vos amis publient du contenu
   - Badge de notification sur la cloche avec compteur
   - Dropdown des notifications avec aperçu
   - Page complète des paramètres de notifications (`/notifications/settings`)
   - 7 types de notifications configurables :
     - Publications d'amis
     - J'aime
     - Commentaires
     - Nouveaux abonnés
     - Messages
     - Lives
     - Promotions

2. **Géolocalisation Active** :
   - Bouton de localisation sur la page de création de post
   - Détection automatique de la position GPS
   - Reverse geocoding pour afficher le nom du lieu
   - Endpoint `/api/posts/nearby` pour voir les posts à proximité
   - Stockage des coordonnées GPS avec chaque post

### ✅ Corrections et Intégrations (07/03/2026 - Session 1)
1. **Système de Sécurité Complet** - Intégration complète des composants :
   - Route `/security` ajoutée
   - Lien "Sécurité" dans le menu latéral
   - Page de Sécurité & Confidentialité fonctionnelle
   - Score de sécurité avec recommandations

2. **Signalement de Contenu** :
   - Bouton "Signaler" sur posts, Reels, marketplace
   - Modal avec 10 catégories de signalement
   - Signalements anonymes
   - Priorité automatique pour contenus sensibles

3. **Blocage d'Utilisateurs** :
   - Option "Bloquer l'utilisateur"
   - Modal de confirmation
   - Liste des utilisateurs bloqués

### Backend (FastAPI + MongoDB) ✅
- Auth avec JWT + Google OAuth
- Posts avec réactions multiples + commentaires + géolocalisation
- Stories éphémères 24h
- Reels
- Live streaming avec WebSocket
- Chat/messagerie
- Marketplace (produits + services)
- Système publicitaire
- Upload de fichiers (images/vidéos jusqu'à 50MB)
- **Système de notifications complet**
- **Système de sécurité complet**

### Frontend Web (React + Tailwind + shadcn/ui) ✅
- Landing page design tropical
- Logo animé Fenua Social
- Feed avec réactions + commentaires + partage + signalement
- Reels style TikTok avec swipe + signalement
- Live streaming avec caméra
- Chat/messagerie
- Marketplace avec création d'annonces + signalement
- Dashboard Business
- **Page Notifications avec dropdown**
- **Page Paramètres de Notifications**
- **Page Sécurité & Confidentialité**
- **Géolocalisation sur création de post**

## Design System
- Couleurs: Orange (#FF6B35), Pink (#FF1493), Cyan (#00CED1), Gold (#FFD700)
- Gradients: Orange → Rose
- Logo: F stylisé avec gradient

## Tech Stack
- Backend: FastAPI, MongoDB, WebSocket
- Frontend Web: React, Tailwind CSS, shadcn/ui, Framer Motion
- Frontend Mobile: React Native (en attente de conversion Expo)

## Test Results (07/03/2026)
- **Backend Security Tests: 100% (27/27 passed)**
- **Notifications API: Working** ✅
- **Geolocation API: Working** ✅

## API Endpoints Principaux

### Notifications
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| /api/notifications | GET | Liste des notifications |
| /api/notifications/unread-count | GET | Nombre de notifications non lues |
| /api/notifications/read | POST | Marquer comme lues |
| /api/notifications/settings | GET/PUT | Paramètres des notifications |
| /api/notifications/subscribe | POST | S'abonner aux push |

### Géolocalisation
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| /api/posts/nearby | GET | Posts à proximité (lat, lng, radius) |
| /api/posts | POST | Créer un post avec coordonnées |

### Sécurité
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| /api/report | POST | Signaler un contenu |
| /api/block/{userId} | POST | Bloquer/Débloquer |
| /api/security/check | GET | Score de sécurité |
| /api/privacy/settings | GET/PUT | Paramètres de confidentialité |

## Prioritized Backlog

### P0 (Completed) ✅
- Toutes les fonctionnalités core
- Système de sécurité et modération
- **Notifications quand les amis publient**
- **Géolocalisation des posts**

### P1 (Next)
- **Conversion Expo** - Application mobile facile à tester
- Notifications push navigateur (Web Push API)
- Live streaming réel (actuellement caméra locale)
- Paiement Stripe marketplace

### P2 (Future)
- PWA sur Play Store
- Chat en temps réel complet
- Duets/Remix vidéo
- Filtres AR polynésiens
- Monétisation créateurs

## Notes pour le Développement
- Utilisateurs de test :
  - user1@test.com / TestPass123! (Teanui)
  - user2@test.com / TestPass123! (Moana)
- URL Preview : https://fenua-connect.preview.emergentagent.com
