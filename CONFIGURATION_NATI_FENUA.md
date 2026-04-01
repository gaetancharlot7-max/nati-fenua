# Configuration Nati Fenua - Documentation Complète

## Informations de Déploiement

**Date de création** : 31 Mars 2026  
**Application** : Nati Fenua - Réseau Social Polynésien  
**Stack** : React 18.2.0 + FastAPI + MongoDB Atlas

---

## 1. MongoDB Atlas

### Connexion
```
URL de connexion (production) : Configurée dans les variables d'environnement Render
Base de données : nati_fenua
```

### Collections principales
- `users` - Utilisateurs
- `posts` - Publications
- `user_sessions` - Sessions de connexion
- `messages` - Messages privés
- `products` - Produits marketplace

---

## 2. Render - Déploiement

### URLs de Production
- **Frontend** : `https://nati-fenua-frontend.onrender.com`
- **Backend** : `https://nati-fenua-backend.onrender.com`

### Services
| Service | Type | Runtime | Région |
|---------|------|---------|--------|
| nati-fenua-frontend | Static Site | - | Global |
| nati-fenua-backend | Web Service | Python 3 | Oregon |

### Variables d'environnement Backend (à configurer sur Render)
```
MONGO_URL=<votre_url_mongodb_atlas>
DB_NAME=nati_fenua
CORS_ORIGINS=https://nati-fenua-frontend.onrender.com
GOOGLE_CLIENT_ID=795265896237-vbtdva4ubl9r203j79dj7jcctd7s3d2g.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://nati-fenua-backend.onrender.com/api/auth/google/callback
FRONTEND_URL=https://nati-fenua-frontend.onrender.com
```

### Variables d'environnement Frontend (à configurer sur Render)
```
REACT_APP_BACKEND_URL=https://nati-fenua-backend.onrender.com
```

---

## 3. Google OAuth 2.0

### Console Google Cloud
- **Projet** : Nati fenua
- **URL Console** : https://console.cloud.google.com/apis/credentials?project=nati-fenua

### Identifiants OAuth
```
Client ID    : 795265896237-vbtdva4ubl9r203j79dj7jcctd7s3d2g.apps.googleusercontent.com
Client Secret: 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
```

### Configuration OAuth
- **Type** : Application Web
- **Nom** : nati fenua web

### Origines JavaScript autorisées
```
https://nati-fenua-frontend.onrender.com
```

### URI de redirection autorisés
```
https://nati-fenua-backend.onrender.com/api/auth/google/callback
```

---

## 4. Fonctionnalités Activées

### Authentification
- [x] Inscription email/mot de passe
- [x] Connexion email/mot de passe
- [x] Connexion Google OAuth 2.0
- [ ] Connexion Facebook (désactivée)
- [ ] Mot de passe oublié (nécessite clé Resend)

### Réseau Social
- [x] Publications (posts)
- [x] Stories
- [x] Flux RSS polynésiens (35 sources)
- [x] Commentaires
- [x] Réactions (like, love, fire, etc.)
- [x] Partage
- [x] Messages privés
- [x] Notifications

### Carte Mana (ex-Pulse)
- [x] Carte interactive Leaflet
- [x] Marqueurs par île
- [x] Webcams publiques
- [x] Système de badges

### Marketplace
- [x] Produits
- [x] Catégories
- [x] Recherche

---

## 5. Flux RSS Configurés (35 sources)

### Médias d'actualité
- Tahiti Infos
- Polynésie 1ère
- TNTV
- La Dépêche de Tahiti
- Outremers 360
- Radio 1 Tahiti

### Surf & Sports
- Surf Report Tahiti
- Magic Seaweed Tahiti
- Surfline Teahupo'o
- Fédération Tahitienne de Surf
- Va'a News
- Fédération de Football
- Fédération de Voile

### Culture
- Heiva i Tahiti
- Te Fare Tauhiti Nui
- Musée de Tahiti
- Conservatoire Artistique
- Festival du Film Océanien (FIFO)

### Emploi
- Emploi Polynésie
- SEFI
- Indeed Polynésie

### Météo
- Météo France Polynésie
- Météo Marine

---

## 6. Comptes de Test

```
Email    : user1@test.com
Password : TestPass123!
```

---

## 7. Instructions de Déploiement

### Étape 1 : Télécharger les fichiers
1. Téléchargez `final-backend.zip` depuis l'app preview
2. Téléchargez `final-frontend.zip` depuis l'app preview

### Étape 2 : Mettre à jour le repo GitHub
```bash
# Backend
cd nati-fenua/backend
rm -rf *
unzip final-backend.zip
git add .
git commit -m "Update backend with Google OAuth"
git push

# Frontend
cd nati-fenua/frontend
rm -rf *
unzip final-frontend.zip
git add .
git commit -m "Update frontend with Google OAuth"
git push
```

### Étape 3 : Configurer les variables d'environnement sur Render
1. Allez sur https://dashboard.render.com
2. Cliquez sur `nati-fenua-backend`
3. Allez dans `Environment`
4. Ajoutez les variables (voir section 2)
5. Cliquez sur `Save Changes`
6. Le service va redémarrer automatiquement

### Étape 4 : Vérifier le déploiement
1. Allez sur https://nati-fenua-frontend.onrender.com
2. Cliquez sur "Continuer avec Google"
3. Connectez-vous avec votre compte Google
4. Vous devriez être redirigé vers le fil d'actualité

---

## 8. Dépannage

### La connexion Google ne fonctionne pas
1. Vérifiez que les variables d'environnement sont correctement configurées sur Render
2. Vérifiez que les URIs de redirection dans Google Cloud Console sont corrects
3. Vérifiez les logs du backend sur Render

### Les images RSS ne s'affichent pas
1. Rafraîchissez les flux RSS : `POST /api/rss/refresh`
2. Vérifiez que le backend peut accéder aux sources RSS

### Le frontend affiche une page blanche
1. Vérifiez la variable `REACT_APP_BACKEND_URL`
2. Vérifiez les logs de build dans Render

---

## 9. Contacts & Support

- **GitHub Repository** : gaetancharlot7-max/nati-fenua
- **Render Dashboard** : https://dashboard.render.com
- **Google Cloud Console** : https://console.cloud.google.com/apis/credentials?project=nati-fenua

---

*Document généré automatiquement - Nati Fenua v2.0*
