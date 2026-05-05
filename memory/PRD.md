# Nati Fenua — PRD

## Original Problem
Application sociale polynésienne (web + PWA) avec : feed RSS médias locaux, chat, carte Mana, marketplace, AI admin assistant, advertising. Compatibilité iOS Safari critique. Déploiement Render via push GitHub vers `gaetancharlot7-max/nati-fenua`.

## Architecture
- **Backend**: FastAPI + MongoDB + Redis cache (`/app/backend/server.py` ~9300 lignes, `audit_engine.py`, `ai_agent_v2.py`, `rss_feeds.py`, `fenua_pulse.py`).
- **Frontend**: React + Tailwind + Leaflet + PWA (`/app/frontend/src/`). react-icons + lucide-react pour les icons.
- **Stripe key**: `STRIPE_API_KEY=sk_test_emergent` déjà en env (mode test gratuit Emergent).
- **EMERGENT_LLM_KEY**: configuré pour Gemini Nano Banana (génération images marketplace).

## Features récentes (mai 2026)
### Auth & Notifications
- Login + register + persistence MongoDB OK (testé curl)
- Vérification email : code 6 chiffres + endpoints `/auth/send-verification` `/auth/verify-email` (manque RESEND_API_KEY pour envoi réel)
- NotificationBell : portal React, fix ghost click iOS Safari (preventDefault sur backdrop touchend), v5 SW
- NotificationPrompt + NotificationBanner : optimistic dismiss au clic "Activer"
- Son notification : ukulélé authentique (synthèse additive 4 harmoniques + plucked-string envelope C-E-G)

### Marketplace
- 25 produits seedés (8 originaux + 10 artisanat + 7 véhicules/immobilier) avec images IA Gemini Nano Banana → `/products/prod_seed_NN.png`
- IDs déterministes + self-healing seed au démarrage (suppression auto legacy random IDs)
- Categories : perles, artisanat, monoï, vêtements, bijoux, alimentaire, déco, immobilier, terrains, véhicules, bateaux, scooters, voitures, autres
- **Filtres avancés par catégorie** : prix min/max, chambres min, surface min/max m², km max, année min, transmission (auto/manuelle), cylindrée min cc, longueur m, puissance cv
- Badges colorés sur cartes : chambres, surface (m²/ha auto), année, km, boîte, longueur, cv, cc
- Bug "flash image" fixé via `key={src}` prop sur `<img>`

### Feed RSS
- 12 sources actives (Tahiti Infos, Radio 1 podcasts, Google News Tahiti/Polynésie/Moorea/Bora-Bora, Le Monde Pacifique, Outre-mer La 1ère, etc.)
- **RSS Pool 100 articles (mai 2026)** : feed pioche dans les 100 RSS les plus récents (sans filtre date), shuffle complet sur la page 1 → garantit variété (mix dates récentes + anciennes) et "feed toujours meublé" même les jours calmes. Cleanup ne supprime jamais sous le seuil de 100.
- **Images uniques par article (mai 2026)** : `extract_image_from_content` retourne désormais `None` si rien trouvé. Pipeline 3 niveaux : (1) image dans le flux RSS, (2) `fetch_og_image()` async qui récupère le `<meta og:image>` de l'URL réelle de l'article (corrige Google News & autres aggregators sans image), (3) pool de 30 images Polynésie thématiques + hash MD5 du titre→URL pour distribution variée. Migration `fix_duplicate_images()` lancée à chaque démarrage : 95% d'unicité atteint (avant : 33% partageaient la même image).
- Dedup par `external_link` + titre normalisé (lowercase + sans accents)
- Filtre images junk (Google News favicons rejetées)

### Performance navigation (mai 2026)
- **Cache SWR** (`/app/frontend/src/lib/swrCache.js` + `useSwrQuery.js`) : pattern stale-while-revalidate. Les pages Feed, Friends, Marketplace, Mana servent les données en cache instantanément + refresh en arrière-plan. Navigation entre pages = quasi-instantanée après 1ère visite. TTL : 15-30s par défaut, 5 min pour catégories.
- Cache invalidé après actions mutatrices (accept/reject/cancel/add friend → `loadData(true)`).

### Chat & Friends
- **Online status v2 (mai 2026)** : heartbeat-based — frontend POST `/api/users/heartbeat` toutes les 45s via AuthContext + sur visibilitychange. Backend considère "online" si `last_seen_at < 2 min` OU WebSocket actif. Fix bug: avant, personne n'apparaissait en ligne car pas de client WS frontend.
- Menu 3-points header chat : "Supprimer la conversation"
- 4ᵉ onglet "Découvrir" sur /friends : recherche debounced + tous comptes inscrits + bouton "+ Ajouter"
- `/api/users/search` accepte q vide → retourne tous users non-bot
- **Fix 404 demande d'ami (mai 2026)** : Ajout route `POST /api/friends/request/{receiver_id}` (path param) en plus de l'existante `POST /api/friends/request` (body). Le frontend utilisait la variante path → causait 404 + demandes jamais créées en DB.

### OAuth
- Google OAuth : callback cross-subdomain via `{frontend_url}/auth/callback#session_token=XXX` (iOS Safari compatible)
- **Facebook OAuth (mai 2026)** : réactivé. Bouton bleu #1877F2 dans AuthPage.js. `loginWithFacebook()` dans AuthContext. Redirection backend alignée sur le pattern Google (URL fragment). Env vars sur Render : `FACEBOOK_CLIENT_ID=892564653832475`, `FACEBOOK_CLIENT_SECRET`. Meta App ID `892564653832475` — mode dev, redirect URI `https://api.nati-fenua.com/api/auth/facebook/callback`.

### Custom domain production
- Frontend : `nati-fenua.com` (via Render)
- Backend : `api.nati-fenua.com` (CNAME vers `nati-fenua-backend.onrender.com` — SSL auto Render)
- `natifenua.com` (sans tiret) → redirection 301 vers `nati-fenua.com`

### Mana (Pulse)
- 8 webcams (Tahiti × 5, Raiatea, Huahine, Rangiroa) — Bora Bora + Moorea retirées
- Panel webcams plein écran à l'ouverture du filtre 📹 — autoplay simultané
- **Covoiturage enrichi** : modal de création avec champs Départ + Destination + Date + Heure + Places + Prix + Tél (optionnel). Affichage formaté sur popup marker + bouton "Appeler"

### ShareModal v2
- Email retiré
- Vrais logos officiels (react-icons) : WhatsApp, Messenger, Telegram, Facebook, X moderne, Instagram (gradient)
- Bouton "Sur Nati Fenua" : repost dans le feed perso
- Bouton "Envoyer à un ami" : sub-view recherche debounced + envoi DM via chatApi

## Pending / Roadmap
### P0 (immédiat)
- Push GitHub → Render redéploie avec tous les fixes ci-dessus
- Réponse user attendue sur Resend (vérif email réel) + Stripe cas d'usage (boost / premium / pub)

### P1 (à venir)
- Implémenter Resend pour envoi réel des codes de vérif email
- Implémenter Stripe Checkout : boost annonces marketplace + Premium subscription
- Analytics tracking RSS (vues / clics / temps passé)
- Badge "🆕 Nouveau" sur posts < 24h
- Badge "🔥 Tendance" sur articles RSS populaires

### Backlog
- Refactor `seed_data.py` + alléger `server.py` (becoming heavy)
- Migrer `EditProfilePage.js` + `NotificationSettingsPage.js` vers `api` instance (Bearer iOS)
- Audio player inline pour podcasts Radio 1
- Renommer services Render pour retirer "backend"/"frontend" des URLs
- Filtres "Alerte recherche" marketplace (notif push quand annonce match critères)

## Key APIs
- `GET /api/posts?limit=20&cursor=...` smart feed
- `GET /api/posts/fresh?limit=20&seen_ids=...`
- `GET /api/marketplace/products?category=&min_price=&min_rooms=&...` (filtres avancés)
- `GET /api/marketplace/categories`
- `GET /api/users/discover?limit=20`
- `GET /api/users/online-status?user_ids=id1,id2`
- `GET /api/users/search?q=&limit=`
- `GET /api/notifications?page=1&limit=15`
- `POST /api/notifications/{id}/read`
- `POST /api/pulse/markers` (avec extra_data carpool : departure, destination, date, time, seats, price, phone)
- `GET /api/pulse/markers?types=webcam`

## Critical Notes
- iOS Safari : éviter `target="_blank"` + `window.open` simultanés. Toujours `type="button"`, `pointer-events-none` sur SVG enfants, `e.preventDefault()` sur touchend backdrop pour éviter ghost click.
- Toutes les `<img>` ont fallback `onerror` global via MutationObserver dans `index.js`
- `EMERGENT_LLM_KEY` + `STRIPE_API_KEY=sk_test_emergent` déjà en env
- Service Worker v5 — bump le numéro pour forcer iPhone PWA à clear le cache
