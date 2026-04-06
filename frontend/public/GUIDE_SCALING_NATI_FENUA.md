# 🚀 GUIDE SCALING NATI FENUA - 2000 à 20000 USERS

## Configuration actuelle testée
- ✅ 200 utilisateurs simultanés avec plan gratuit
- ✅ Code optimisé et prêt pour le scaling

---

## 📊 ÉTAPE 1 : POUR 2000 USERS (~15 min)

### 1.1 Upgrader Render Backend

1. Aller sur https://dashboard.render.com
2. Cliquer sur **nati-fenua-backend**
3. **Settings** → **Instance Type**
4. Sélectionner **Standard** ($25/mois)
5. Cliquer **Save Changes**

### 1.2 Upgrader MongoDB Atlas

1. Aller sur https://cloud.mongodb.com
2. Cliquer sur votre **Cluster**
3. **Configuration** → **Edit Configuration**
4. Sélectionner **M10** ($57/mois)
   - 2 GB RAM
   - 10 GB Storage
   - Network isolation
5. Cliquer **Apply Changes**

### 1.3 (Optionnel) Ajouter Redis Upstash (GRATUIT)

Redis accélère les requêtes fréquentes de 10x.

1. Aller sur https://upstash.com
2. Créer un compte (gratuit)
3. **Create Database**
   - Name: `nati-fenua-cache`
   - Region: `eu-west-1` (proche de Render)
   - Type: `Regional`
4. Copier l'URL Redis : `rediss://default:xxxxx@eu1-xxxxx.upstash.io:6379`
5. Dans **Render Dashboard** → **Environment**
6. Ajouter variable : `REDIS_URL` = votre URL Upstash

**✅ Capacité estimée : 2000 users simultanés**

---

## 📊 ÉTAPE 2 : POUR 5000 USERS

### 2.1 Render : Activer Auto-Scaling

1. Dashboard Render → Backend
2. **Settings** → **Scaling**
3. Activer **Auto-Scale**
   - Min instances: 1
   - Max instances: 3
4. Save

### 2.2 MongoDB : Upgrade M20

1. Atlas → Cluster → Edit
2. Sélectionner **M20** ($140/mois)
   - 4 GB RAM
   - 20 GB Storage
   - Backups automatiques

### 2.3 Redis : Upgrade Upstash Pro

1. Upstash Dashboard → Database
2. Upgrade to **Pay as you go** ($0.2/100K commands)

**✅ Capacité estimée : 5000 users simultanés**

---

## 📊 ÉTAPE 3 : POUR 10000-20000 USERS

### 3.1 Render Pro + Multiple Instances

1. Dashboard → Backend → Settings
2. **Instance Type** → **Pro** ($85/mois)
3. **Scaling** → Manual: **2 instances**
4. Activer **Health Checks**

### 3.2 MongoDB M30 + Read Replicas

1. Atlas → Cluster → Edit
2. **M30** ($220/mois)
   - 8 GB RAM
   - 40 GB Storage
3. Activer **Analytics Node** pour requêtes lourdes

### 3.3 Cloudflare CDN

1. Créer compte https://cloudflare.com
2. Ajouter votre domaine
3. DNS → Activer le **Proxy** (nuage orange)
4. **Caching** → Cache Everything
5. **Page Rules** :
   - `*nati-fenua.com/api/health` → Cache: 1 min
   - `*nati-fenua.com/api/translations/*` → Cache: 1 day
   - `*nati-fenua.com/api/posts*` → Cache: 30 sec

### 3.4 Redis Cluster (si besoin)

Si Upstash atteint ses limites :
1. Passer à **Redis Enterprise** sur https://redis.com
2. Ou **AWS ElastiCache**

**✅ Capacité estimée : 20000 users simultanés**

---

## 💰 RÉCAPITULATIF DES COÛTS

| Palier | Render | MongoDB | Redis | CDN | TOTAL |
|--------|--------|---------|-------|-----|-------|
| 200 users | Gratuit | Gratuit | - | - | **$0** |
| 500 users | $7 | Gratuit | - | - | **$7** |
| **2000 users** | **$25** | **$57** | **$0** | - | **$82** |
| 5000 users | $25 x2 | $140 | $10 | - | **$200** |
| 10000 users | $85 | $220 | $30 | $20 | **$355** |
| **20000 users** | **$170** | **$220** | **$30** | **$20** | **$440** |

---

## 🔧 VARIABLES D'ENVIRONNEMENT RENDER

```bash
# Backend - Variables à ajouter/modifier

# MongoDB (obligatoire)
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/nati_fenua

# Redis Upstash (optionnel mais recommandé)
REDIS_URL=rediss://default:xxxxx@eu1-xxxxx.upstash.io:6379

# Rate Limiting (ajuster selon le palier)
RATE_LIMIT_ENABLED=true

# Performance
NODE_ENV=production
```

---

## 📈 MONITORING

### Endpoints de monitoring

```
GET /api/health          → Status de l'app
GET /api/performance     → Stats détaillées (temps réponse, cache, etc.)
```

### Dashboards recommandés

1. **Render Metrics** : CPU, RAM, requêtes
2. **MongoDB Atlas Metrics** : Connexions, latence
3. **Upstash Dashboard** : Commandes Redis, mémoire
4. **Cloudflare Analytics** : Trafic, cache hit rate

---

## 🆘 EN CAS D'URGENCE (Pic de trafic)

### Action immédiate (2 min)

```
1. Render Dashboard → Backend
2. Settings → Instance Type → Standard ou Pro
3. Save (effet immédiat)
```

### Si ça ne suffit pas (5 min)

```
1. Settings → Scaling → Manual: 2 instances
2. Save
```

### Si MongoDB sature (10 min)

```
1. Atlas → Cluster → Upgrade tier
2. Choisir M10/M20/M30 selon besoin
```

---

## ✅ CHECKLIST PRE-LANCEMENT

- [ ] Backend Render upgradé (Standard minimum)
- [ ] MongoDB upgradé (M10 minimum)
- [ ] Redis Upstash configuré
- [ ] Variables d'environnement vérifiées
- [ ] Test de charge effectué
- [ ] Monitoring activé
- [ ] Alertes configurées (Render + Atlas)
- [ ] Backup MongoDB activé
- [ ] Domaine personnalisé configuré
- [ ] SSL/HTTPS actif

---

*Document généré le 6 Avril 2026*
*Nati Fenua v13 - Performance Optimized*
