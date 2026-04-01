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
```bash
MONGO_URL=<votre_url_mongodb_atlas>
DB_NAME=nati_fenua
CORS_ORIGINS=https://nati-fenua-frontend.onrender.com
GOOGLE_CLIENT_ID=795265896237-vbtdva4ubl9r203j79dj7jcctd7s3d2g.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://nati-fenua-backend.onrender.com/api/auth/google/callback
FRONTEND_URL=https://nati-fenua-frontend.onrender.com
```

### Variables d'environnement Frontend (à configurer sur Render)
```bash
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

## 4. Flux RSS - Configuration

### Règles de publication
| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| max_posts_per_source | 5 | Maximum 5 articles par média |
| max_total_posts | 50 | Maximum 50 articles au total |
| Doublons | Ignorés | 1 seul post par URL d'article |
| Ordre | Aléatoire | Les sources sont mélangées |

### Sources configurées (35 médias)

#### Médias d'actualité
- Tahiti Infos
- Polynésie 1ère
- TNTV
- La Dépêche de Tahiti
- Outremers 360
- Radio 1 Tahiti
- Tahiti Nui TV
- Actu.fr Polynésie

#### Surf & Sports nautiques
- Surf Report Tahiti
- Magic Seaweed Tahiti
- Surfline Teahupo'o
- Tahiti Surf Club
- Fédération Tahitienne de Surf

#### Autres Sports
- Va'a News
- Fédération Tahitienne de Football
- Fédération Tahitienne de Voile
- Fédération Polynésienne de Natation

#### Culture & Traditions
- Heiva i Tahiti
- Te Fare Tauhiti Nui
- Musée de Tahiti
- Conservatoire Artistique
- Académie Tahitienne
- Festival du Film Océanien (FIFO)

#### Emploi
- Emploi Polynésie
- SEFI Polynésie
- Pôle Emploi Tahiti
- LinkedIn Tahiti
- Indeed Polynésie

#### Météo
- Météo France Polynésie
- Météo Marine Polynésie
- Windy Tahiti

#### Tourisme & Environnement
- Air Tahiti Magazine
- Tahiti Tourisme
- Environnement Polynésie
- Te Mana o te Moana

---

## 5. Fonctionnalités Activées

### Authentification
- [x] Inscription email/mot de passe
- [x] Connexion email/mot de passe
- [x] **Connexion Google OAuth 2.0 native**
- [ ] Connexion Facebook (désactivée)
- [ ] Mot de passe oublié (nécessite clé Resend)

### Réseau Social
- [x] Publications (posts)
- [x] Stories
- [x] Flux RSS polynésiens (35 sources, max 5/source)
- [x] Commentaires
- [x] Réactions (like, love, fire, etc.)
- [x] Partage
- [x] Messages privés
- [x] Notifications

### Carte Mana (ex-Pulse)
- [x] Carte interactive Leaflet
- [x] Îles : Tahiti, Moorea, Bora Bora, Raiatea, Tahaa, Huahine, Maupiti, Tuamotu, Marquises, Gambier, Australes
- [x] Webcams publiques intégrées
- [x] Système de badges

### Marketplace
- [x] Produits avec catégories
- [x] Recherche et filtres

---

## 6. Comptes de Test

```
Email    : user1@test.com
Password : TestPass123!
```

---

## 7. Instructions de Déploiement

### Étape 1 : Télécharger les fichiers
Téléchargez depuis l'environnement preview :
- `final-backend.zip`
- `final-frontend.zip`
- `CONFIGURATION_NATI_FENUA.md`

### Étape 2 : Mettre à jour le repo GitHub

```bash
# Cloner le repo (si pas déjà fait)
git clone https://github.com/gaetancharlot7-max/nati-fenua.git
cd nati-fenua

# Backend
cd backend
rm -rf *
unzip ~/Downloads/final-backend.zip -d .
git add .
git commit -m "Update backend - Google OAuth + RSS improvements"
git push

# Frontend
cd ../frontend
rm -rf * 
unzip ~/Downloads/final-frontend.zip -d .
git add .
git commit -m "Update frontend - Google OAuth + RSS display"
git push
```

### Étape 3 : Configurer les variables d'environnement sur Render

1. Allez sur https://dashboard.render.com
2. Cliquez sur `nati-fenua-backend`
3. Allez dans **Environment**
4. Ajoutez/mettez à jour ces variables :

```
GOOGLE_CLIENT_ID=795265896237-vbtdva4ubl9r203j79dj7jcctd7s3d2g.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://nati-fenua-backend.onrender.com/api/auth/google/callback
FRONTEND_URL=https://nati-fenua-frontend.onrender.com
```

5. Cliquez sur **Save Changes**
6. Le service va redémarrer automatiquement

### Étape 4 : Vérifier le déploiement

1. Allez sur https://nati-fenua-frontend.onrender.com
2. Cliquez sur **"Continuer avec Google"**
3. Connectez-vous avec votre compte Google
4. Vous devriez être redirigé vers le fil d'actualité

---

## 8. API Endpoints Utiles

### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/auth/register | Inscription |
| POST | /api/auth/login | Connexion email |
| GET | /api/auth/google | Connexion Google |
| GET | /api/auth/google/callback | Callback Google |
| GET | /api/auth/me | Utilisateur connecté |
| POST | /api/auth/logout | Déconnexion |

### Flux RSS
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/rss/refresh | Rafraîchir les flux RSS |
| GET | /api/rss/stats | Statistiques RSS |

### Posts
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/posts | Liste des posts |
| POST | /api/posts | Créer un post |
| GET | /api/posts/{id} | Détail d'un post |

---

## 9. Dépannage

### La connexion Google ne fonctionne pas
1. Vérifiez que les variables d'environnement sont correctement configurées sur Render
2. Vérifiez que les URIs de redirection dans Google Cloud Console sont corrects :
   - Origine JS : `https://nati-fenua-frontend.onrender.com`
   - Redirect URI : `https://nati-fenua-backend.onrender.com/api/auth/google/callback`
3. Vérifiez les logs du backend sur Render

### Les flux RSS ne se mettent pas à jour
1. Appelez manuellement : `POST /api/rss/refresh`
2. Vérifiez les logs pour voir quelles sources répondent
3. Certaines sources peuvent être temporairement indisponibles

### Le frontend affiche une page blanche
1. Vérifiez la variable `REACT_APP_BACKEND_URL` sur Render (frontend)
2. Vérifiez les logs de build dans Render
3. Vérifiez que le backend est accessible

---

## 10. Contacts & Liens

- **GitHub Repository** : https://github.com/gaetancharlot7-max/nati-fenua
- **Render Dashboard** : https://dashboard.render.com
- **Google Cloud Console** : https://console.cloud.google.com/apis/credentials?project=nati-fenua
- **Frontend Production** : https://nati-fenua-frontend.onrender.com
- **Backend Production** : https://nati-fenua-backend.onrender.com

---

*Document généré automatiquement - Nati Fenua v2.1 - 31 Mars 2026*
