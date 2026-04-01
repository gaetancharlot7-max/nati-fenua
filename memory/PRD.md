# Nati Fenua - Product Requirements Document

## Project Overview
**Application** : Réseau social polynésien "Nati Fenua"  
**Stack** : React 18.2.0 (Frontend) + FastAPI (Backend) + MongoDB Atlas (Database)  
**Status** : Prêt pour déploiement Render

---

## Dernières modifications (31 Mars 2026)

### Google OAuth natif
- ✅ Client ID : `795265896237-vbtdva4ubl9r203j79dj7jcctd7s3d2g.apps.googleusercontent.com`
- ✅ Routes `/api/auth/google` et `/api/auth/google/callback`
- ✅ Facebook retiré

### Flux RSS améliorés
- ✅ **1 seul post par article** (pas de doublons)
- ✅ **Maximum 5 posts par source**
- ✅ **Mélange aléatoire** de toutes les sources
- ✅ 35 sources configurées

---

## Fichiers à télécharger

| Fichier | URL |
|---------|-----|
| Documentation | https://fenua-connect.preview.emergentagent.com/CONFIGURATION_NATI_FENUA.md |
| Backend | https://fenua-connect.preview.emergentagent.com/final-backend.zip |
| Frontend | https://fenua-connect.preview.emergentagent.com/final-frontend.zip |

---

## Variables Render Backend

```
GOOGLE_CLIENT_ID=795265896237-vbtdva4ubl9r203j79dj7jcctd7s3d2g.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://nati-fenua-backend.onrender.com/api/auth/google/callback
FRONTEND_URL=https://nati-fenua-frontend.onrender.com
```

---

## Test Credentials
- Email: `user1@test.com`
- Password: `TestPass123!`

---

*Dernière mise à jour : 31 Mars 2026*
