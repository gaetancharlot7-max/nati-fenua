# Guide d'Optimisation - Nati Fenua
## Pour une expérience utilisateur optimale

---

## ✅ Optimisations déjà en place

### Backend (FastAPI)
- [x] **GZip Compression** - Réduit la bande passante de 70%
- [x] **Rate Limiting** - 200 req/min par IP
- [x] **Gunicorn** - 4 workers pour paralléliser
- [x] **Cache en mémoire** - Réponses rapides
- [x] **30 Index MongoDB** - Requêtes optimisées

### Frontend (React)
- [x] **Lazy Loading** - Pages chargées à la demande
- [x] **Code Splitting** - Bundle divisé
- [x] **PWA** - Service Worker pour cache offline

---

## 🚀 Checklist avant déploiement

### 1. Variables d'environnement (Backend)
```env
# /app/backend/.env
MONGO_URL=mongodb+srv://USER:PASS@cluster.mongodb.net/natifenua
DB_NAME=natifenua
JWT_SECRET=votre_secret_tres_long_et_securise_minimum_32_caracteres
RESEND_API_KEY=re_xxxx  # Pour les emails
SENDER_EMAIL=noreply@natifenua.com
```

### 2. Variables d'environnement (Frontend)
```env
# /app/frontend/.env
REACT_APP_BACKEND_URL=https://nati-fenua.com.com
```

### 3. Build de production
```bash
cd /app/frontend
yarn build
```

---

## 📊 Métriques de performance cibles

| Métrique | Cible | Actuel |
|----------|-------|--------|
| First Contentful Paint | < 1.5s | ✅ |
| Time to Interactive | < 3s | ✅ |
| Largest Contentful Paint | < 2.5s | ✅ |
| Cumulative Layout Shift | < 0.1 | ✅ |

---

## 🔧 Configuration Railway recommandée

### Plan Pro (20$/mois)
```yaml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "cd backend && gunicorn -w 4 -k uvicorn.workers.UvicornWorker server:app --bind 0.0.0.0:8001"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[env]
PYTHON_VERSION = "3.11"
```

### Ressources recommandées
| Utilisateurs | RAM | CPU | Coût |
|--------------|-----|-----|------|
| 0-500 | 512 MB | 0.5 vCPU | 5$/mois |
| 500-2000 | 1 GB | 1 vCPU | 15$/mois |
| 2000-10000 | 2 GB | 2 vCPU | 40$/mois |

---

## 🗄️ MongoDB Atlas - Configuration

### Cluster recommandé
- **M0** (Gratuit) : 0-1000 utilisateurs
- **M2** (9$/mois) : 1000-10000 utilisateurs
- **M5** (25$/mois) : 10000+ utilisateurs

### Index critiques (déjà créés)
- users: email, user_id
- posts: created_at, user_id, island
- conversations: participants
- messages: conversation_id, created_at

---

## 🌐 Configuration DNS (votre domaine)

### Records à ajouter
```
Type    Nom     Valeur
A       @       IP_RAILWAY
CNAME   www     votre-app.railway.app
```

### SSL/HTTPS
- Railway fournit SSL automatiquement
- Certificat Let's Encrypt inclus

---

## 📱 Configuration PWA

### Manifest.json ✅
- Nom: Nati Fenua
- Icônes: 72px à 512px
- Theme: #FF6B35
- Background: #1A1A2E

### Service Worker ✅
- Cache des assets statiques
- Mode offline basique

---

## 🔒 Sécurité

### Headers recommandés (déjà en place)
- CORS configuré
- Rate limiting actif
- JWT avec expiration 7 jours
- Mots de passe hashés (bcrypt)

### À faire en production
- [ ] Activer HTTPS only
- [ ] Configurer CSP headers
- [ ] Activer les logs de sécurité

---

## 📈 Monitoring recommandé

### Gratuit
- **Railway Metrics** - CPU, RAM, requêtes
- **MongoDB Atlas** - Performance DB

### Payant (optionnel)
- **Sentry** - Erreurs frontend/backend
- **LogRocket** - Sessions utilisateurs

---

## 🚀 Commandes de déploiement

### Railway (recommandé)
```bash
# 1. Installer Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialiser
railway init

# 4. Déployer
railway up
```

### Ou via GitHub
1. Connecter le repo GitHub à Railway
2. Railway déploie automatiquement à chaque push

---

*Document créé le 17 Mars 2026*
*Nati Fenua v1.0.0*
