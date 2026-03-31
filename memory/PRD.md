# Nati Fenua - Product Requirements Document

## Project Overview
**Application** : Réseau social polynésien "Nati Fenua"  
**Stack** : React 18.2.0 (Frontend) + FastAPI (Backend) + MongoDB Atlas (Database)  
**Status** : Déployé sur Render, corrections RSS validées

---

## Original Problem Statement
L'utilisateur souhaitait déployer son application Nati Fenua sur Render et ensuite enrichir le fil d'actualité avec de vrais flux RSS polynésiens, renommer "Pulse" en "Mana", et améliorer l'affichage des médias.

---

## Core Features Implemented

### Authentication
- [x] Login/Logout avec sessions sécurisées
- [x] Inscription complète (nom, adresse, localisation)
- [ ] Social Login Google/Facebook (nécessite OAuth natif pour Render)
- [ ] Mot de passe oublié (clé Resend nécessaire)

### Social Features
- [x] Posts, Stories, Reels, Lives
- [x] Feed personnalisé avec flux RSS locaux
- [x] Notifications
- [x] Conversations/Chat (UI complète avec emojis et images)
- [x] Profils utilisateurs avec liens cliquables

### Flux RSS (35 sources)
- [x] Tahiti Infos, Polynésie 1ère, TNTV, La Dépêche
- [x] Médias surf (Surf Report, Magic Seaweed, Surfline)
- [x] Culture (Heiva, Musée de Tahiti, FIFO)
- [x] Emploi (SEFI, Indeed, LinkedIn)
- [x] Météo (Météo France Polynésie)

### Mana (ex-Pulse)
- [x] Carte Leaflet interactive
- [x] Îles : Tahiti, Moorea, Bora Bora, Raiatea, Tahaa, Huahine, Maupiti, Tuamotu, Marquises, Gambier, Australes
- [x] Webcams publiques intégrées

### Marketplace
- [x] Produits avec catégories
- [x] Recherche et filtres

---

## Bug Fixes (31 Mars 2026)

### Correction des miniatures RSS (RÉSOLU)
**Problème** : Les articles partagés via RSS affichaient un carré gris au lieu d'une miniature.

**Solution appliquée** :
1. **Backend** (`rss_feeds.py`) : Amélioration de `extract_image_from_content()` avec fallbacks multiples :
   - og:image, twitter:image
   - media:content, enclosures
   - Logo de la source comme fallback
   - Images placeholder thématiques (surf, météo, culture)

2. **Frontend** (`FeedPage.js`) : Refonte de `ArticleLinkPreview` :
   - Affichage de l'image en grand (aspect-video)
   - Badge source sur l'image
   - Titre de l'article sous l'image
   - Gestion des erreurs d'image avec fallback

**Tests** : 100% passés (backend et frontend)

---

## Pending Tasks

### P0 - Bloquant
- [ ] Déployer les corrections RSS sur Render (ZIPs prêts)

### P1 - Court terme
- [ ] OAuth Google natif pour Render (bloqué - nécessite clés Google Cloud)
- [ ] Fonction "Mot de passe oublié" (nécessite clé API Resend)

### P2 - Moyen terme
- [ ] Système de traduction FR/Tahitien complet (actuellement mocké)
- [ ] Refactoring server.py (5000+ lignes)

---

## Backlog (Future)
- [ ] Application mobile Expo
- [ ] WebSocket pour chat temps réel
- [ ] Notifications push
- [ ] Système de paiement Marketplace

---

## Architecture

```
/app/
├── backend/
│   ├── server.py             # API monolithique
│   ├── rss_feeds.py          # Parseur RSS amélioré
│   ├── fenua_pulse.py        # Carte Mana (îles, webcams)
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── FeedPage.js   # ArticleLinkPreview amélioré
│       │   └── ManaPage.js
│       └── components/
```

---

## Test Credentials
- Email: `user1@test.com`
- Password: `TestPass123!`

---

## Download URLs (pour déploiement Render)
- Backend: `https://fenua-connect.preview.emergentagent.com/final-backend.zip`
- Frontend: `https://fenua-connect.preview.emergentagent.com/final-frontend.zip`

---

## Known Issues
- Social Login (Google/Facebook) : Ne fonctionne pas sur Render car Emergent Auth rejette les domaines externes
- Traduction : Système mocké (dictionnaire statique)

---

*Dernière mise à jour : 31 Mars 2026*
