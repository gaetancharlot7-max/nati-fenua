# Nati Fenua - Product Requirements Document

## Project Overview
**Application** : Réseau social polynésien "Nati Fenua"  
**Stack** : React (Frontend) + FastAPI (Backend) + MongoDB Atlas (Database)  
**Status** : Validé techniquement, prêt pour déploiement Render

---

## Original Problem Statement
L'utilisateur souhaite finaliser et déployer son application de réseau social "Nati Fenua". La priorité était de valider la stabilité du backend via des tests de charge exhaustifs avant d'autoriser la mise en production.

---

## Core Features Implemented

### Authentication
- [x] Login/Logout avec sessions sécurisées
- [x] Inscription complète (nom, adresse, localisation)
- [ ] Social Login Google/Facebook (configuration Render nécessaire)
- [ ] Mot de passe oublié (clé Resend nécessaire)

### Social Features
- [x] Posts, Stories, Reels, Lives
- [x] Feed personnalisé
- [x] Notifications
- [x] Conversations/Chat (UI complète avec emojis et images)
- [x] Profils utilisateurs avec bouton Message

### Marketplace
- [x] Produits avec catégories
- [x] Recherche produits
- [x] Filtres et pagination

### Pulse (Cartographie)
- [x] Carte Leaflet interactive
- [x] Marqueurs par île
- [x] Système de badges et mana
- [x] Carte fixe (ne cache plus la navigation)

### Content
- [x] News/Actualités
- [x] Traduction FR/Tahitien (mockée)
- [x] Flux RSS

### UI/UX
- [x] Cookie Banner repositionné
- [x] Navigation fluide
- [x] Design responsive

---

## Technical Validation (28 Mars 2026)

### Test de Charge - Résultats

**Test via Reverse Proxy Emergent :**
| Palier | RPS | Erreur 403 | Erreurs App |
|--------|-----|------------|-------------|
| 5 users | 46.7 | 5.63% | 0 |
| 10 users | 25.6 | 4.59% | 0 |
| 25 users | 49.1 | 3.19% | 0 |

**Test Direct (localhost) :**
- 8,064 requêtes
- 0% erreur
- 537.6 RPS
- P99: 173ms

**Verdict : APPLICATION STABLE**

---

## Pending Tasks (P0/P1)

### P0 - Immédiat
- [x] ~~Test de charge final~~
- [ ] Déploiement Render (backend + frontend)

### P1 - Court terme
- [ ] Configuration Social Login sur URL Render
- [ ] Test de charge post-déploiement

### P2 - Moyen terme
- [ ] Fonctionnalité "Mot de passe oublié" (clé Resend)
- [ ] Logique de traduction complète (actuellement mockée)
- [ ] Refactoring server.py (5000+ lignes → modules)

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
│   ├── server.py             # API monolithique (5000+ lignes)
│   ├── db_optimization.py    # Connexion/index MongoDB
│   ├── cache.py              # Cache mémoire
│   └── redis_cache.py        # Connecteur Redis
├── frontend/
│   └── src/
│       ├── components/
│       └── pages/
└── load_test/
    ├── load_test_final.py
    ├── test_direct.py
    └── RAPPORT_VALIDATION_FINALE.md
```

---

## Key Integrations
- MongoDB Atlas (Database)
- Leaflet (Maps)
- Emergent-managed Google Auth (à configurer sur Render)

---

## Test Credentials
- Email: `user1@test.com`
- Password: `TestPass123!`

---

## Reports
- `/app/load_test/RAPPORT_VALIDATION_FINALE.md`
- `/app/load_test/load_test_final_report.json`
- `/app/load_test/direct_test_report.json`

---

*Dernière mise à jour : 28 Mars 2026*
