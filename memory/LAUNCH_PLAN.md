# 🚀 PLAN DE LANCEMENT - HUI FENUA
## Réseau Social pour la Communauté Tahitienne

---

# 📋 TABLE DES MATIÈRES

1. [Résumé du Projet](#résumé-du-projet)
2. [Fonctionnalités Complètes](#fonctionnalités-complètes)
3. [Architecture Technique](#architecture-technique)
4. [Budget et Frais](#budget-et-frais)
5. [Flux RSS Réels](#flux-rss-réels)
6. [Contraintes et Risques](#contraintes-et-risques)
7. [Plan de Test](#plan-de-test)
8. [Timeline de Lancement](#timeline-de-lancement)
9. [Checklist de Lancement](#checklist-de-lancement)

---

# 📱 RÉSUMÉ DU PROJET

**Hui Fenua** est un réseau social dédié à la communauté polynésienne, combinant les meilleures fonctionnalités d'Instagram et TikTok avec des outils locaux uniques.

### Vision
Connecter les Polynésiens à travers le monde autour de leur culture, leur langue et leur terre (fenua).

### Public Cible
- Résidents de Polynésie française (~280 000 personnes)
- Diaspora polynésienne (France métropolitaine, USA, Nouvelle-Zélande)
- Touristes et amoureux de la Polynésie
- Professionnels locaux (roulottes, artisans, guides)

---

# 🛠️ FONCTIONNALITÉS COMPLÈTES

## 1. Authentification & Sécurité
| Fonctionnalité | Statut | Description |
|----------------|--------|-------------|
| Inscription email/mot de passe | ✅ | Validation email, hash bcrypt |
| Connexion Google OAuth | ✅ | Via Emergent Auth |
| **Mot de passe oublié** | ✅ | Email via Resend avec lien de réinitialisation |
| Protection anti-bruteforce | ✅ | 5 tentatives max, blocage 15 min |
| Sessions multiples | ✅ | Gestion et déconnexion à distance |
| **Déconnexion depuis profil** | ✅ | Bouton visible sur le profil |
| Rate Limiting | ✅ | 200 req/min par IP |

## 2. Fil d'Actualité (Feed)
| Fonctionnalité | Statut | Description |
|----------------|--------|-------------|
| Posts photo/vidéo | ✅ | Upload et affichage optimisé |
| Carrousel multi-images | ✅ | Navigation swipe |
| Likes & Réactions | ✅ | Like, love, haha, wow |
| Commentaires | ✅ | Imbriqués avec réponses |
| Partage | ✅ | Réseaux sociaux + copie lien |
| Signalement | ✅ | Avec catégories (spam, haine, etc.) |
| **Traduction FR ↔ Tahitien** | ✅ | Dictionnaire intégré 200+ mots |
| Lazy Loading | ✅ | Pagination infinie |
| Skeleton Loaders | ✅ | UX améliorée |

## 3. Stories
| Fonctionnalité | Statut | Description |
|----------------|--------|-------------|
| Création de stories | ✅ | Photo/vidéo avec texte |
| Durée de vie 24h | ✅ | Suppression automatique |
| Vues comptabilisées | ✅ | Liste des viewers |
| Réponses privées | ✅ | Via messagerie |

## 4. Fenua Pulse (Carte Interactive)
| Fonctionnalité | Statut | Description |
|----------------|--------|-------------|
| 9 îles couvertes | ✅ | Tahiti, Moorea, Bora Bora, Raiatea, Taha'a, Huahine, Maupiti, Tuamotu, Marquises |
| 10 Webcams live | ✅ | Vidéos en direct de sites emblématiques |
| Marqueurs par catégorie | ✅ | Roulottes, surf, événements, accidents, météo, marché |
| **Zoom +/-** | ✅ | Boutons de zoom sur la carte |
| **Ma position** | ✅ | Géolocalisation |
| Filtrage par catégorie | ✅ | Un clic = voir tout ce type |
| **Bouton Contacter** | ✅ | Message direct au vendeur |
| **Bouton Appeler** | ✅ | Lien tel: pour appel direct |
| Système de Mana (points) | ✅ | Gamification |
| Leaderboard | ✅ | Top contributeurs |

## 5. Roulottes (Ma Roulotte)
| Fonctionnalité | Statut | Description |
|----------------|--------|-------------|
| Création profil vendeur | ✅ | Nom, cuisine, horaires |
| Ouverture/Fermeture | ✅ | Visible sur Fenua Pulse |
| **Carte de position** | ✅ | Mini-carte avec localisation GPS |
| **Bouton Appeler** | ✅ | Lien tel: dans dashboard |
| Menu du jour | ✅ | Mise à jour en temps réel |
| Gestion du menu | ✅ | CRUD complet |
| Statistiques | ✅ | Vues, followers |

## 6. Messagerie
| Fonctionnalité | Statut | Description |
|----------------|--------|-------------|
| Conversations 1-to-1 | ✅ | Chat privé |
| Envoi de messages | ✅ | Texte |
| Indicateur non-lu | ✅ | Badge de comptage |
| Contact depuis Pulse | ✅ | Création automatique de conversation |

## 7. Marché (Marketplace)
| Fonctionnalité | Statut | Description |
|----------------|--------|-------------|
| Listing produits | ✅ | Perles, artisanat, monoï... |
| Listing services | ✅ | Transport, tourisme, beauté... |
| Catégorisation | ✅ | 8 catégories produits, 6 services |
| Contact vendeur | ✅ | Via messagerie |

## 8. Publication Automatique
| Fonctionnalité | Statut | Description |
|----------------|--------|-------------|
| Bot de contenu | ✅ | Publication quotidienne |
| Flux RSS intégrés | ✅ | 8 sources polynésiennes |
| Détection d'île | ✅ | 11 îles/archipels détectables |
| Contenu généré | ✅ | Fun facts, météo, marées |

## 9. Traduction
| Fonctionnalité | Statut | Description |
|----------------|--------|-------------|
| Français → Tahitien | ✅ | 200+ mots/expressions |
| Tahitien → Français | ✅ | Dictionnaire inversé |
| Traduction de posts | ✅ | Bouton sur chaque post |
| Phrases courantes | ✅ | Pour l'apprentissage |

## 10. Administration
| Fonctionnalité | Statut | Description |
|----------------|--------|-------------|
| Dashboard admin | ✅ | Statistiques globales |
| Modération de contenu | ✅ | Signalements, warnings, bans |
| Gestion utilisateurs | ✅ | Ban, unban, vérification |
| Analytics | ✅ | Graphiques et métriques |
| Monitoring | ✅ | Performance en temps réel |
| Auto-publish dashboard | ✅ | Contrôle des publications bot |
| **Stats cache** | ✅ | Performance cache Redis/mémoire |
| **Optimisation DB** | ✅ | Recréation des index |

## 11. Conformité RGPD
| Fonctionnalité | Statut | Description |
|----------------|--------|-------------|
| Consentement cookies | ✅ | Banner avec choix |
| Export de données | ✅ | Téléchargement JSON |
| Suppression de compte | ✅ | Droit à l'oubli |
| Politique de confidentialité | ✅ | Page légale |
| CGU | ✅ | Conditions d'utilisation |

---

# 🏗️ ARCHITECTURE TECHNIQUE

## Stack Technologique
```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React.js + TailwindCSS + Framer Motion + React-Leaflet     │
│  Shadcn/UI Components + Sonner Toasts                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  FastAPI + Python 3.11 + Uvicorn (4 workers)                │
│  GZip + Rate Limiting + Cache TTL                           │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    MongoDB      │ │  Cache Mémoire  │ │    Resend       │
│  (Atlas M10+)   │ │   (TTL LRU)     │ │    (Emails)     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Fichiers Clés
```
/app/
├── backend/
│   ├── server.py              # API principale (4500+ lignes)
│   ├── cache.py               # Cache mémoire TTL
│   ├── redis_cache.py         # Cache Redis (prêt)
│   ├── db_optimization.py     # Index MongoDB (26 index)
│   ├── tahitian_dictionary.py # Traduction FR/TAH
│   ├── fenua_pulse.py         # Carte + Webcams
│   ├── roulotte.py            # Gestion vendeurs
│   ├── auto_publisher.py      # Publication automatique
│   ├── rss_feeds.py           # Flux RSS
│   ├── moderation.py          # Modération
│   ├── gdpr.py                # Conformité RGPD
│   └── analytics.py           # Analytics
│
├── frontend/
│   └── src/
│       ├── pages/             # 30+ pages
│       ├── components/        # Composants réutilisables
│       ├── contexts/          # AuthContext, etc.
│       └── lib/api.js         # Client API
│
└── memory/
    └── PRD.md                 # Documentation produit
```

---

# 💰 BUDGET ET FRAIS

## Frais Mensuels de Production

| Service | Gratuit | 1000 users | 5000 users | Notes |
|---------|---------|------------|------------|-------|
| **Hébergement** | | | | |
| Railway/Render (Backend) | $5 | $20 | $50 | Scaling automatique |
| Vercel (Frontend) | $0 | $20 | $20 | Pro plan |
| **Base de Données** | | | | |
| MongoDB Atlas | $0 (M0) | $60 (M10) | $200 (M30) | Replica set |
| **Cache** | | | | |
| Upstash Redis | $0 | $10 | $50 | Serverless |
| **Emails** | | | | |
| Resend | $0 | $20 | $50 | Password reset, notifications |
| **Domaine** | | | | |
| huifenua.com | $12/an | $12/an | $12/an | |
| **CDN/SSL** | | | | |
| Cloudflare | $0 | $0 | $20 | Pro pour analytics |
| **Stockage Média** | | | | |
| Cloudinary | $0 | $50 | $150 | Images/Vidéos |
| | | | | |
| **TOTAL MENSUEL** | **~$5** | **~$180** | **~$540** | |
| **TOTAL ANNUEL** | **~$72** | **~$2,160** | **~$6,480** | |

## Frais Ponctuels

| Élément | Coût | Notes |
|---------|------|-------|
| Logo professionnel | $100-500 | Optionnel |
| App Store (iOS) | $99/an | Pour app mobile |
| Play Store (Android) | $25 (une fois) | Pour app mobile |
| Certificat SSL | $0 | Inclus via Cloudflare |

## Budget Recommandé pour Lancement

| Phase | Durée | Budget Mensuel |
|-------|-------|----------------|
| Beta (100 users) | 2 mois | ~$20/mois |
| Soft Launch (500 users) | 2 mois | ~$100/mois |
| Public Launch (2000 users) | 6 mois | ~$250/mois |
| Croissance (5000+ users) | Ongoing | ~$500+/mois |

---

# 📰 FLUX RSS RÉELS

## Sources Intégrées (8 flux actifs)

| Source | URL | Type | Fiabilité |
|--------|-----|------|-----------|
| **Tahiti Infos** | `https://www.tahiti-infos.com/xml/syndication.rss` | Actualités générales | ⭐⭐⭐⭐⭐ |
| **Polynésie 1ère** | `https://la1ere.francetvinfo.fr/polynesie/rss` | France TV | ⭐⭐⭐⭐⭐ |
| **TNTV** | `https://www.tntv.pf/feed/` | TV locale | ⭐⭐⭐⭐ |
| **Outremers 360** | `https://outremers360.com/feed/` | Outre-mer | ⭐⭐⭐⭐ |
| Tahiti News | `https://tahitinews.co/feed/` | Actualités | ⭐⭐⭐ |
| Actu.fr Polynésie | `https://actu.fr/polynesie-francaise/feed` | Régional | ⭐⭐⭐ |
| Air Tahiti Magazine | RSS non disponible | Voyage | ❌ |
| Surf Report Tahiti | RSS non disponible | Sport | ❌ |

## Détection Automatique des Îles

Le système analyse le contenu des articles pour détecter les îles mentionnées :

- **Tahiti** : Papeete, Faa'a, Punaauia, Teahupo'o...
- **Moorea** : Opunohu, Temae, Haapiti...
- **Bora Bora** : Matira, Vaitape, Nunue...
- **Raiatea** : Uturoa, Taputapuatea...
- **Taha'a** : Vanille, Haamene...
- **Huahine** : Fare, Maeva, Faie...
- **Maupiti** : Vaiea, Tereia...
- **Tuamotu** : Rangiroa, Fakarava, Tiputa...
- **Marquises** : Nuku Hiva, Hiva Oa, Taiohae...

---

# ⚠️ CONTRAINTES ET RISQUES

## Contraintes Techniques

| Contrainte | Impact | Mitigation |
|------------|--------|------------|
| Bande passante Polynésie | Latence élevée | CDN Cloudflare, cache agressif |
| Connectivité mobile | 3G/4G variable | PWA optimisée, mode offline partiel |
| Stockage média | Coût élevé | Compression, quotas utilisateur |
| Multi-langues | FR/TAH/EN | Dictionnaire intégré, pas de ML |

## Contraintes Légales

| Contrainte | Obligation | Statut |
|------------|------------|--------|
| RGPD | Consentement, export, suppression | ✅ Implémenté |
| LCEN | Mentions légales, modération | ✅ Pages légales |
| Droit à l'image | Modération contenu | ✅ Signalement |
| Données mineurs | 13+ ans minimum | ⚠️ Vérification basique |

## Risques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Spam/Bots | Haute | Moyen | Rate limiting, captcha |
| Contenu inapproprié | Moyenne | Haut | Modération + signalement |
| Surcharge serveur | Moyenne | Haut | Auto-scaling, cache |
| Concurrence | Faible | Moyen | Focus communauté locale |
| Coûts imprévus | Moyenne | Moyen | Monitoring, alertes |

---

# 🧪 PLAN DE TEST

## Tests Automatisés

### Test de Charge (Implémenté)
```bash
# Script: /app/backend/tests/load_test_v2.py
# 200 bots simultanés
# Résultat: 92.1% succès
```

### Tests Fonctionnels à Effectuer

| Module | Tests | Priorité |
|--------|-------|----------|
| **Authentification** | | |
| - Inscription | Email valide, mot de passe fort | P0 |
| - Connexion | Email/Google | P0 |
| - Mot de passe oublié | Email reçu, lien valide | P0 |
| - Déconnexion | Session terminée | P0 |
| **Feed** | | |
| - Création post | Photo, vidéo, texte | P0 |
| - Like/Unlike | Compteur mis à jour | P1 |
| - Commentaire | Ajout, suppression | P1 |
| - Traduction | FR→TAH, TAH→FR | P1 |
| **Fenua Pulse** | | |
| - Affichage carte | 9 îles | P0 |
| - Filtres | Par catégorie | P1 |
| - Zoom +/- | Fonctionnel | P1 |
| - Création marker | Avec localisation | P1 |
| - Contact vendeur | Ouvre messagerie | P1 |
| **Roulottes** | | |
| - Création profil | Formulaire complet | P1 |
| - Ouverture/Fermeture | Marker sur carte | P1 |
| - Menu | CRUD complet | P2 |
| **Messagerie** | | |
| - Conversation | Création, liste | P1 |
| - Messages | Envoi, réception | P1 |
| **Marché** | | |
| - Liste produits | Avec pagination | P2 |
| - Filtres | Par catégorie | P2 |
| **Admin** | | |
| - Dashboard | Statistiques | P1 |
| - Modération | Signalements | P1 |
| - Ban utilisateur | Effectif | P1 |

## Tests Manuels Recommandés

### Mobile (Priorité Haute)
- [ ] iPhone Safari
- [ ] iPhone Chrome
- [ ] Android Chrome
- [ ] Android Samsung Internet

### Desktop
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Performance
- [ ] Lighthouse score > 80
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 4s

---

# 📅 TIMELINE DE LANCEMENT

## Phase 1: Pre-Launch (2 semaines)

| Semaine | Tâches |
|---------|--------|
| S1 | Tests internes, corrections bugs |
| S1 | Configuration Resend (emails) |
| S1 | Tests de charge final |
| S2 | Documentation utilisateur |
| S2 | Préparation communication |
| S2 | Recrutement beta-testeurs (50 personnes) |

## Phase 2: Beta Fermée (4 semaines)

| Semaine | Tâches |
|---------|--------|
| S3 | Lancement beta 50 utilisateurs |
| S3 | Collecte feedback |
| S4 | Corrections prioritaires |
| S4 | Extension beta 200 utilisateurs |
| S5 | Optimisations performance |
| S6 | Préparation soft launch |

## Phase 3: Soft Launch (4 semaines)

| Semaine | Tâches |
|---------|--------|
| S7 | Ouverture publique limitée (500 users) |
| S7 | Monitoring intensif |
| S8 | Ajustements scaling |
| S9 | Extension à 1000 utilisateurs |
| S10 | Préparation marketing |

## Phase 4: Public Launch

| Tâches |
|--------|
| Annonce officielle |
| Campagne réseaux sociaux |
| Partenariats locaux (roulottes, artisans) |
| PR locale (Tahiti Infos, TNTV) |

---

# ✅ CHECKLIST DE LANCEMENT

## Infrastructure

- [ ] MongoDB Atlas M10+ configuré
- [ ] Redis Upstash configuré
- [ ] Resend API key ajoutée
- [ ] Domaine huifenua.com configuré
- [ ] SSL actif
- [ ] CDN Cloudflare activé
- [ ] Backup automatique MongoDB
- [ ] Monitoring (Uptime Robot)

## Configuration

- [ ] Variables d'environnement production
- [ ] CORS configuré pour domaine final
- [ ] Rate limiting ajusté
- [ ] Logs centralisés
- [ ] Alertes email configurées

## Sécurité

- [ ] Audit de sécurité basique
- [ ] Headers de sécurité (CSP, HSTS)
- [ ] Validation entrées utilisateur
- [ ] Protection XSS/CSRF

## Légal

- [ ] Mentions légales à jour
- [ ] CGU validées
- [ ] Politique de confidentialité RGPD
- [ ] Cookie banner fonctionnel

## Contenu

- [ ] Contenu initial (posts demo)
- [ ] Webcams testées et fonctionnelles
- [ ] Flux RSS actifs
- [ ] Dictionnaire tahitien vérifié

## Marketing

- [ ] Page Facebook Hui Fenua
- [ ] Compte Instagram
- [ ] Communiqué de presse
- [ ] Liste influenceurs locaux

## Support

- [ ] Email support configuré
- [ ] FAQ créée
- [ ] Process de modération documenté

---

# 📞 CONTACTS & RESSOURCES

## Ressources Techniques

- **MongoDB Atlas**: [cloud.mongodb.com](https://cloud.mongodb.com)
- **Upstash Redis**: [upstash.com](https://upstash.com)
- **Resend**: [resend.com](https://resend.com)
- **Cloudflare**: [cloudflare.com](https://cloudflare.com)

## Ressources Locales

- **Tahiti Infos**: Contact presse
- **TNTV**: Relations médias
- **Chambre de Commerce**: Partenariats entreprises
- **Mairies**: Événements locaux

---

*Document créé le 14 Mars 2026*
*Dernière mise à jour: 14 Mars 2026*

---

🌺 **Mauruuru roa !** 🌺
