# Fenua Social - PRD (Product Requirements Document)

## Original Problem Statement
Création d'un réseau social local pour la Polynésie Française inspiré d'Instagram et TikTok, avec marketplace intégré, système de publicité payante, chat/messagerie, lives en direct, et système de sécurité/modération robuste.

## What's Been Implemented

### ✅ Corrections et Intégrations (07/03/2026)
1. **Système de Sécurité Complet** - Intégration complète des composants de sécurité :
   - Route `/security` ajoutée dans App.js
   - Lien "Sécurité" dans le menu latéral (MainLayout)
   - Page de Sécurité & Confidentialité fonctionnelle
   - Score de sécurité avec recommandations
   - Paramètres de confidentialité (visibilité profil, messages, mentions, localisation)

2. **Signalement de Contenu** - Système complet inspiré des grandes plateformes :
   - Bouton "Signaler" sur chaque post (menu ...)
   - Bouton "Signaler" sur les Reels
   - Bouton "Signaler" sur les produits/services du Marketplace
   - Modal de signalement avec 10 catégories (Spam, Harcèlement, Violence, Nudité, Discours haineux, Arnaque, Faux compte, Propriété intellectuelle, Automutilation, Autre)
   - Signalements anonymes
   - Priorité automatique pour contenus sensibles (automutilation = priorité 0)

3. **Blocage d'Utilisateurs** :
   - Option "Bloquer l'utilisateur" dans le menu des posts
   - Modal de confirmation de blocage
   - Liste des utilisateurs bloqués dans les paramètres
   - Possibilité de débloquer

4. **RGPD/Confidentialité** :
   - Demande de téléchargement des données personnelles
   - Suppression de compte
   - Paramètres de confidentialité granulaires

### ✅ Corrections précédentes (06/03/2026)
- Photos téléchargées avec URLs HTTPS correctes
- Upload Marketplace depuis l'appareil
- Bouton de Likes avec sélecteur de réactions
- Scroll sur Reels (swipe + molette)
- Partage multi-plateforme (WhatsApp, Messenger, etc.)
- Politique de confidentialité
- Live vidéo avec caméra du téléphone

### Backend (FastAPI + MongoDB) ✅
- Auth avec JWT + Google OAuth
- Posts avec réactions multiples + commentaires
- Stories éphémères 24h
- Reels
- Live streaming avec WebSocket
- Chat/messagerie
- Marketplace (produits + services)
- Système publicitaire
- Upload de fichiers (images/vidéos jusqu'à 50MB)
- **Système de sécurité complet** :
  - Modération de contenu automatique
  - Rate limiting par action
  - Signalement de contenu (/api/report)
  - Blocage d'utilisateurs (/api/block)
  - Paramètres de confidentialité (/api/privacy/settings)
  - Score de sécurité (/api/security/check)
  - Conformité RGPD (data-request, delete account)

### Frontend Web (React + Tailwind + shadcn/ui) ✅
- Landing page design tropical
- Logo animé Fenua Social
- Feed avec réactions + commentaires + partage + **signalement**
- Reels style TikTok avec swipe + **signalement**
- Live streaming avec caméra
- Chat/messagerie
- Marketplace avec création d'annonces + **signalement**
- Dashboard Business
- **Page Sécurité & Confidentialité**
- Politique de confidentialité

### Composants de Sécurité
- `ReportModal.js` - Modal de signalement multi-catégories
- `BlockUserModal.js` - Modal de blocage utilisateur
- `SecuritySettingsPage.js` - Page complète de sécurité
- `security.py` - Module backend de modération

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
  - Authentication: 4/4 ✅
  - Reporting System: 5/5 ✅
  - Blocking System: 4/4 ✅
  - Privacy Settings: 6/6 ✅
  - Security Check: 1/1 ✅
  - GDPR/Data Request: 2/2 ✅
  - Auth Required: 4/4 ✅
  - Logout: 1/1 ✅

## Prioritized Backlog

### P0 (Done) ✅
- Toutes les fonctionnalités core
- Upload fichiers
- Partage social
- Live caméra
- Politique confidentialité
- **Système de sécurité et modération complet**

### P1 (Next)
- **Conversion Expo** - Application mobile facile à tester
- **Localisation** - À clarifier avec l'utilisateur (géolocalisation ou traduction ?)
- Notifications push temps réel
- Paiement Stripe marketplace
- Player vidéo réel pour reels

### P2 (Future)
- PWA sur Play Store
- Duets/Remix vidéo
- Filtres AR polynésiens
- Monétisation créateurs
- Publication App Store
- Chat en temps réel complet

## API Endpoints de Sécurité
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| /api/report | POST | Signaler un contenu |
| /api/report/types | GET | Liste des types de signalement |
| /api/block/{userId} | POST | Bloquer/Débloquer un utilisateur |
| /api/blocked | GET | Liste des utilisateurs bloqués |
| /api/security/check | GET | Score de sécurité du compte |
| /api/privacy/settings | GET/PUT | Paramètres de confidentialité |
| /api/privacy/data-request | POST | Demande de téléchargement données |
| /api/account | DELETE | Suppression du compte |

## Notes pour le Développement
- Utilisateur de test : sectest@test.com / TestPass123!
- URL Preview : https://fenua-connect.preview.emergentagent.com
