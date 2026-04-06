# 📊 PLAN DE SCALING NATI FENUA
## De 200 à 10 000 utilisateurs

---

# PLAN A : 2000 UTILISATEURS
## Budget : ~82€/mois

### Infrastructure requise

| Service | Plan | Coût mensuel |
|---------|------|--------------|
| Render Backend | Standard | 25€ |
| MongoDB Atlas | M10 | 57€ |
| Redis Upstash | Gratuit | 0€ |
| **TOTAL** | | **82€/mois** |

### Actions à effectuer

#### Étape 1 : Upgrader Render (5 minutes)
```
1. dashboard.render.com → nati-fenua-backend
2. Settings → Instance Type → Standard
3. Save Changes
```

#### Étape 2 : Upgrader MongoDB (10 minutes)
```
1. cloud.mongodb.com → Votre cluster
2. Configuration → Edit Configuration
3. Sélectionner M10 (2GB RAM, 10GB Storage)
4. Apply Changes
```

#### Étape 3 : Ajouter Redis Cache (5 minutes)
```
1. upstash.com → Créer compte gratuit
2. Create Database → nati-fenua-cache
3. Copier REDIS_URL
4. Render → Environment → Ajouter REDIS_URL
```

### Capacités attendues

| Métrique | Valeur |
|----------|--------|
| Utilisateurs simultanés | 2 000 |
| Requêtes/seconde | 500 |
| Temps de réponse moyen | < 300ms |
| Disponibilité | 99.9% |

---

# PLAN B : 10 000 UTILISATEURS
## Budget : ~355€/mois

### Infrastructure requise

| Service | Plan | Coût mensuel |
|---------|------|--------------|
| Render Backend | Pro (x1) | 85€ |
| MongoDB Atlas | M30 | 220€ |
| Redis Upstash | Pro | 30€ |
| Cloudflare CDN | Pro | 20€ |
| **TOTAL** | | **355€/mois** |

### Actions à effectuer

#### Étape 1 : Render Pro + Auto-Scaling
```
1. dashboard.render.com → Backend
2. Instance Type → Pro ($85)
3. Scaling → Auto-Scale
   - Min: 1 instance
   - Max: 3 instances
4. Health Checks → Activer
```

#### Étape 2 : MongoDB M30 + Read Replicas
```
1. cloud.mongodb.com → Cluster
2. Edit Configuration → M30
3. Options avancées:
   - Read Preference: Secondary Preferred
   - Connection Pool: 500
```

#### Étape 3 : Redis Pro
```
1. upstash.com → Database
2. Upgrade → Pay as you go
3. Configurer éviction: allkeys-lru
```

#### Étape 4 : Cloudflare CDN
```
1. cloudflare.com → Ajouter domaine
2. DNS → Proxy activé (nuage orange)
3. Caching:
   - /api/translations/* → 1 jour
   - /api/posts* → 30 secondes
   - Images → 7 jours
```

### Capacités attendues

| Métrique | Valeur |
|----------|--------|
| Utilisateurs simultanés | 10 000 |
| Requêtes/seconde | 2 000 |
| Temps de réponse moyen | < 150ms |
| Disponibilité | 99.95% |
| Cache hit rate | > 80% |

---

# COMPARATIF DES PLANS

| Palier | Users | Coût/mois | Coût/user |
|--------|-------|-----------|-----------|
| Gratuit | 200 | 0€ | 0€ |
| Standard | 2 000 | 82€ | 0.04€ |
| Pro | 10 000 | 355€ | 0.035€ |
| Enterprise | 50 000 | 1 500€ | 0.03€ |

---

# TIMELINE RECOMMANDÉE

## Phase 1 : Lancement (0-500 users)
- Rester sur plan gratuit
- Monitorer les performances
- Collecter les retours utilisateurs

## Phase 2 : Croissance (500-2000 users)
- Upgrader vers Plan A
- Activer Redis
- Optimiser le contenu

## Phase 3 : Scale (2000-10000 users)
- Upgrader vers Plan B
- Ajouter CDN
- Envisager app mobile native

---

# CONTACTS & LIENS

| Service | Lien |
|---------|------|
| Render | dashboard.render.com |
| MongoDB Atlas | cloud.mongodb.com |
| Upstash Redis | upstash.com |
| Cloudflare | cloudflare.com |
| Stripe | dashboard.stripe.com |

---

*Document Nati Fenua - Avril 2026*
