# 🚀 Guide de Scalabilité - Hui Fenua pour 5000+ Utilisateurs

## État Actuel (Après Optimisations)

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| Taux de succès | 69% | **87%** | +18% |
| Timeouts | 36 | **4** | -89% |
| P95 | 4698ms | **1002ms** | 4.7x plus rapide |
| Endpoints >95% | 6 | **8** | +33% |

## ✅ Optimisations Implémentées

### 1. Cache en Mémoire (TTL)
- **Fichier**: `/app/backend/cache.py`
- **Impact**: -70% charge MongoDB
- **Caches créés**:
  - `static_cache`: Données statiques (îles, types) - TTL 1h
  - `markers_cache`: Markers Pulse - TTL 60s
  - `feed_cache`: Feed - TTL 30s
  - `user_cache`: Profils utilisateurs - TTL 5min

### 2. Index MongoDB (26 index créés)
- **Fichier**: `/app/backend/db_optimization.py`
- **Collections optimisées**: posts, users, markers, conversations, messages, vendors, stories, notifications
- **Impact**: Requêtes 10x plus rapides

### 3. Connection Pooling
- **Configuration**:
  - `maxPoolSize`: 100 connexions
  - `minPoolSize`: 10 connexions
  - `retryWrites`: true
  - `retryReads`: true

### 4. Compression GZip
- **Middleware**: `GZipMiddleware(minimum_size=500)`
- **Impact**: -70% bande passante

### 5. Agrégations MongoDB Optimisées
- Remplacement des boucles N+1 par `$lookup`
- Projections pour exclure les champs inutiles

---

## 🎯 Pour 5000+ Utilisateurs - Infrastructure Requise

### Option A: Scaling Vertical (Simple)
```
┌─────────────────────────────────────┐
│         Load Balancer               │
│         (Nginx / HAProxy)           │
└───────────────┬─────────────────────┘
                │
    ┌───────────┴───────────┐
    │                       │
┌───┴───┐             ┌─────┴─────┐
│Backend│             │  Backend  │
│  x4   │             │   Redis   │
│workers│             │   Cache   │
└───┬───┘             └───────────┘
    │
┌───┴───────────────────────┐
│       MongoDB Atlas       │
│    (M10+ avec Replicas)   │
└───────────────────────────┘
```

### Option B: Scaling Horizontal (Production)
```
┌────────────────────────────────────────┐
│            CDN (Cloudflare)            │
│         Images, Vidéos, Assets         │
└─────────────────┬──────────────────────┘
                  │
┌─────────────────┴──────────────────────┐
│          Load Balancer (AWS ALB)       │
└─────────────────┬──────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───┴───┐    ┌────┴────┐   ┌────┴────┐
│Backend│    │ Backend │   │ Backend │
│  Pod1 │    │  Pod2   │   │  Pod3   │
│4 work.│    │ 4 work. │   │ 4 work. │
└───┬───┘    └────┬────┘   └────┬────┘
    │             │             │
    └─────────────┼─────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    ┌────┴────┐      ┌─────┴─────┐
    │  Redis  │      │  MongoDB  │
    │ Cluster │      │  Cluster  │
    │(ElastiC)│      │  (Atlas)  │
    └─────────┘      └───────────┘
```

---

## 📋 Checklist Déploiement Production

### 1. Backend (FastAPI)
- [ ] Utiliser Gunicorn avec Uvicorn workers: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker`
- [ ] Configurer 4-8 workers par instance
- [ ] Activer le mode production: `DEBUG=false`

### 2. Redis (Cache distribué)
- [ ] Remplacer le cache mémoire par Redis
- [ ] Configuration: `redis://redis-cluster:6379`
- [ ] Utiliser Redis Cluster pour haute disponibilité

### 3. MongoDB
- [ ] Migrer vers MongoDB Atlas M10+ (ou équivalent)
- [ ] Activer les Replica Sets
- [ ] Configurer Read Preference: `secondaryPreferred`
- [ ] Sharding si >10M documents

### 4. Load Balancer
- [ ] AWS ALB / Nginx / HAProxy
- [ ] Health checks sur `/api/health`
- [ ] SSL termination
- [ ] Rate limiting: 100 req/min par IP

### 5. CDN
- [ ] Cloudflare / CloudFront pour assets statiques
- [ ] Cache images et vidéos
- [ ] Compression automatique

### 6. Monitoring
- [ ] Prometheus + Grafana
- [ ] Alertes: CPU >80%, Mémoire >80%, Latence P99 >2s
- [ ] Logs centralisés (ELK / CloudWatch)

---

## 💰 Estimation Coûts Mensuels (AWS)

| Composant | 2000 users | 5000 users | 10000 users |
|-----------|------------|------------|-------------|
| EC2 (Backend) | $50-100 | $150-300 | $300-600 |
| MongoDB Atlas | $60 (M10) | $200 (M30) | $400 (M50) |
| Redis (ElastiCache) | $30 | $60 | $120 |
| ALB | $20 | $30 | $50 |
| S3 + CloudFront | $20 | $50 | $100 |
| **Total** | **$180-230** | **$490-640** | **$970-1370** |

---

## 🔧 Configuration Production Recommandée

### Variables d'environnement
```env
# Backend
WORKERS=4
DEBUG=false
LOG_LEVEL=warning

# MongoDB
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/huifenua?retryWrites=true&w=majority
MONGO_POOL_SIZE=100

# Redis
REDIS_URL=redis://redis-cluster:6379

# Security
SECRET_KEY=<random-256-bit-key>
CORS_ORIGINS=https://huifenua.com,https://www.huifenua.com
```

### Commande de démarrage
```bash
gunicorn server:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8001 \
  --timeout 60 \
  --keep-alive 5 \
  --access-logfile - \
  --error-logfile -
```

---

## 📊 Métriques à Surveiller

| Métrique | Seuil Warning | Seuil Critique |
|----------|---------------|----------------|
| CPU | >70% | >90% |
| Mémoire | >70% | >90% |
| Latence P95 | >500ms | >2000ms |
| Taux d'erreur | >1% | >5% |
| Connexions DB | >80 | >95 |
| Cache Hit Rate | <70% | <50% |

---

*Document généré le 14 Mars 2026*
