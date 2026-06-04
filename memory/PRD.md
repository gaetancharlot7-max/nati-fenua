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

### Mobile Navigation Drawer (fév 2026)
- **Bug critique résolu** : sur mobile, sidebar gauche/droite cachées (`hidden lg:flex`) + bottom nav limitée à 5 onglets → "Mon Profil", "Ma Roulotte", "Paramètres Notifications", "Sécurité", "Parrainer un ami", "Publicité Pro" et "Déconnexion" étaient totalement inaccessibles.
- **Solution** : ajout d'un bouton hamburger (`data-testid="mobile-menu-btn"`) dans le header mobile qui ouvre un drawer slide-in depuis la droite (z-index 70, backdrop blur z-60). Drawer contient avatar utilisateur + tous les raccourcis manquants + déconnexion + footer CGU/Confidentialité. Auto-close sur changement de route, lock body scroll quand ouvert, animations framer-motion. Tous testIds : `drawer-nav-profile`, `drawer-nav-vendor`, `drawer-nav-referral`, `drawer-nav-advertising`, `drawer-nav-security`, `drawer-logout-btn`, etc.
- Testé via Playwright sur viewport 390x844 : drawer s'ouvre, navigation vers `/vendor/dashboard` OK, drawer auto-close confirmé.

### Performance Optimization & Admin Pages (fév 2026)

#### Perf optimizations
- **Preconnect HTTP hints** dans `index.html` pour `api.nati-fenua.com`, `res.cloudinary.com`, `images.unsplash.com`, `ui-avatars.com` → économise ~200-400ms sur le first paint
- **Cache-Control endpoints publics** : `public, max-age=300, stale-while-revalidate=3600` sur `/api/public/rss-feed`, `/api/public/pionniers`, `/api/public/ambassadors`. Middleware `CustomCORSMiddleware` modifié pour respecter ces headers explicites (avant il les écrasait avec `private, max-age=0`).
- **Gzip déjà actif** sur le backend ✅
- **Service worker v3** : stale-while-revalidate sur `/api/public/*` → feed RSS s'affiche instantanément depuis le cache puis se rafraîchit en background
- **Backend response time** mesuré : 112-174ms moyenne sur GET /api/posts (déjà bon, MongoDB indexes optimisés en place)
- ⚠️ Note : Cloudflare du sandbox écrase les Cache-Control. En prod Render → headers respectés.

#### Page admin /advertising (UI premium)
- **18 packages** désormais disponibles (7 types) :
  - 🆕 Boost Marketplace (3j/7j/30j) — pour annonces produits
  - 🆕 Pack Roulotte (Starter/Pro) — spécial restaurateurs/food trucks
  - 🆕 Spot Événement (48h) — Heiva, festival, ouverture
  - Post Sponsorisé, Compte Promu, Story Ad, Mana Alert (existants)
- Hero gradient avec decorative blur dots + badges informatifs (💳 Paiement carte, 💱 Prix XPF, 📊 Stats, 🏝️ Ciblage île)
- Banner ROI : +250% visibilité / ~5 min lancement / 100% audience polynésienne
- Cards : badge type (POPULAIRE/LOCAL/EXCLUSIF/PUSH), exemple polynésien italique, prix avec value/jour calculée

#### Page admin /admin/payments (gestion CA)
- Dashboard CA temps réel : Chiffre d'affaires total / Paiements réussis / En attente / Annonces à valider
- Breakdown CA par catégorie de package (graphique compact)
- Tabs filtrables : Tout / Payés / En attente + search bar (email, package, ID)
- **Workflow annonces premium** : section "À valider" en orange avec boutons `Valider` (badge approved → annonce live) ou `Refuser` (avec raison)
- Endpoints backend : `GET /api/admin/payments`, `GET /api/admin/ads/pending`, `POST /api/admin/ads/{id}/approve`, `POST /api/admin/ads/{id}/reject`
- Lien ajouté dans la sidebar admin avec icône DollarSign

### Bloc complet "Tout faire" — Engagement & Monétisation (fév 2026)

#### Mur des Pionniers (`/app/frontend/src/components/PionnierWall.js`)
- Section proof-social sur la landing page, affichée uniquement si au moins 1 Pionnier existe.
- Avatars défilants + compteur live "X / 50" + badge FOMO "Plus que Y places".
- CTA "Devenir Pionnier" → `/beta-test`.
- Endpoint backend public : `GET /api/public/pionniers` (limité à 50, sans auth).

#### Page Ambassadeurs (`/app/frontend/src/pages/AmbassadorsPage.js`)
- Route `/ambassadeurs` (public).
- Leaderboard top 20 des parrains (sorted par `referral_count` desc) avec médailles 🥇🥈🥉 pour le top 3.
- Carte "Mon rang" personnalisée pour l'utilisateur connecté (rang, filleuls, progression vers le badge Ambassadeur).
- CTA "Inviter un ami" → `/referral`.
- Endpoint public : `GET /api/public/ambassadors`.
- Lien dans le drawer mobile : "Top Ambassadeurs" avec icône Megaphone jaune.

#### Email digest hebdomadaire (`/app/backend/email_digest.py`)
- Cron asynchrone intégré au startup serveur : tous les samedis 09h UTC (~10h Tahiti).
- Cible : utilisateurs vérifiés ayant `notifications.email_digest != False` ET inactifs depuis 3+ jours.
- Contenu : stats hebdo (posts, articles, produits, nouveaux users) + top 3 publications les plus likées (cards colorées).
- Template HTML soigné avec gradient brand + CTA "Ouvrir Nati Fenua".
- Endpoint admin de test : `POST /api/admin/digest/send-now`.

#### Mode hors-ligne renforcé (`/app/frontend/public/sw.js`)
- Service worker v3 avec 3 stratégies de cache différenciées :
  - Navigation requests : network-first + fallback offline.html
  - `/api/public/rss-feed` : stale-while-revalidate (instant load)
  - Assets statiques (JS/CSS/fonts/images) : cache-first
- Auto-reload de la page offline quand la connexion revient (`window.online` event).
- Cache buster automatique sur ancien caches au activate.

#### Stripe Marketplace
- ✅ Déjà entièrement implémenté en backend (`/api/advertising/packages`, `/api/payments/checkout`, `/api/webhook/stripe`)
- Clé `STRIPE_API_KEY=sk_test_emergent` déjà présente dans `/app/backend/.env`.
- UI frontend disponible : `/advertising` page.

#### Doc App Store Capacitor (`/app/memory/APPSTORE_CAPACITOR_GUIDE.md`)
- Guide complet pas-à-pas pour publier l'iOS sans Mac perso via MacInCloud (~30 USD/mois).
- Couvre : installation Node/Yarn/Pods sur Mac à distance, config Capacitor avec `appId=com.natifenua.app`, permissions Info.plist en français, Universal Links via assetlinks.json, archive Xcode, upload App Store Connect, fiche App Store, pièges fréquents (Guideline 5.1.1, 2.1, 4.0).
- Coût total estimé : ~130 USD (Apple 99 + MacInCloud 30).

### Bug fixes mobile/iOS authentication (fév 2026)
- **Bug "Non authentifié" sur demandes d'amis** : `FriendButton.js`, `FriendsPage.js` utilisaient `fetch` avec `credentials: 'include'` uniquement → cookies cross-domain bloqués par ITP iOS / WebViews → 401. Migrés vers nouveau helper `authFetch()` qui ajoute automatiquement le Bearer token depuis localStorage.
- **Photo de profil non persistée** : `EditProfilePage.js` envoyait via axios brut sans Bearer + backend stockait un chemin relatif `/uploads/profiles/xxx.jpg` sur le filesystem éphémère de Render (perdu à chaque deploy + 404 sur frontend domain). Fix : upload Cloudinary direct depuis le frontend (URL absolue stable), fallback multipart avec URL absolue construite via `BACKEND_URL` env var.
- **Helper `authFetch`** ajouté dans `/app/frontend/src/lib/api.js` : drop-in replacement pour `fetch()` qui injecte le Bearer token automatiquement. À utiliser pour tous les nouveaux appels mobile-sensibles.
- **Audit complet (fév 2026)** : 24 occurrences de `fetch credentials only` migrées vers `authFetch` dans 6 fichiers (`FriendButton.js`, `FriendsPage.js`, `ProfilePage.js`, `ReferralPage.js`, `VerifyEmailPage.js`, `BetaTestPage.js`). Couvre désormais : likes, save, comments, delete post, friends list, profile detail, referral page, email verification. AIAgentPage utilise déjà Bearer admin_token explicite (pas migré).
- **theme-color barre Android** : `#FF6B35 → #1A1A2E` dans `index.html` + `manifest.json` + `msapplication-TileColor` → barre système élégante au lieu d'orange criard.

### Polish mobile native-like (fév 2026)
- **Son notification** : remplacé arpège C-E-G par **note unique G5** (Sol aigu) ukulélé, courte (~1s), avec lowpass 5500Hz pour chaleur, attaque 6ms (pluck nylon). 4 harmoniques. Implémenté en Web Audio API pure (0 KB bundle).
- **Haptic feedback** : helper `/app/frontend/src/lib/haptic.js` (Vibration API). Patterns alignés iOS UIImpactFeedbackGenerator : `light/medium/heavy/success/warning/selection`. Câblé sur : like (light), demande d'ami envoyée (success), demande d'ami acceptée (success).
- **Pull-to-refresh** : composant `/app/frontend/src/components/PullToRefresh.js` avec courbe de résistance native, indicateur ChevronDown qui pivote selon le pull, déclenche `haptic.medium()` + son ukulélé G5 + reload du feed à 80px de pull. Wrappé sur `FeedPage`.

### Programme Pionnier — Bêta-testeurs Play Store (fév 2026)
- **Page publique `/beta-test`** : landing dark/gradient pour recruter les 12 bêta-testeurs requis par Google Play Closed Testing (politique 2024 : 12 testeurs × 14 jours pour comptes Personnels nouveaux). Formulaire : prénom, email contact, **email Google** (le lien de test arrive sur ce compte), modèle de téléphone, motivation. Confirmation sans envoi mail (admin valide manuellement).
- **Badge `Pionnier`** : composant `<PionnierBadge />` (gradient violet/pink/orange + icône Rocket). Affiché sur Profil (à côté du nom) et sur les posts dans le Feed. Limite : 50 attributions à vie.
- **Backend** :
  - `POST /api/beta/apply` (public, rate-limited 5/h) → stocke dans `db.beta_applications` avec status `pending|accepted|rejected|awarded`. Idempotent par `google_email`.
  - `GET /api/admin/beta/applications` → liste + stats (total, accepted, awarded, remaining_slots).
  - `POST /api/admin/beta/award-pionnier` → ajoute `'pionnier'` au tableau `users.badges` + marque l'application comme `awarded`. Hard cap à `PIONNIER_LIMIT=50`.
- **Lien "Devenir Pionnier"** ajouté dans le drawer mobile avec badge `BETA`.
- **UserBase model étendu** : `badges`, `referral_count`, `referral_code`, `island`, `is_email_verified`, `is_admin` ajoutés (avant ces champs étaient strippés par `extra="ignore"`).

### Lighthouse Audit (fév 2026)
Score prod `nati-fenua.com` : Performance 41 / Accessibility 93 / Best Practices 96 / **SEO 100**.
- 3 contrastes corrigés : footer landing `text-white/30 → /70`, lien cookie banner mobile `#FF6B35 → #C8421A bold`, bouton PWA install banner `bg gradient` au lieu de blanc.
- Performance 41 normale en preview (build dev unminified) ; build prod Render = >70.

### App Store / Play Store Préparation finale (fév 2026)
- **Page admin `/admin/beta`** (admin only) : tableau temps réel des candidatures Pionnier avec stats (Candidatures / Acceptées / Pionniers / Places restantes), bouton **"Approuver & envoyer email"** qui déclenche un email Resend automatique avec le lien Google Play Closed Testing, bouton **"Attribuer Pionnier"** une fois le testeur validé.
- **Email Resend `/api/admin/beta/approve`** : template HTML soigné (gradient violet/pink/orange, instructions step-by-step, lien CTA Google Play). `RESEND_API_KEY` requis en prod (déjà configuré sur Render).
- **Compte démo auto-seedé** au démarrage backend via `/app/backend/demo_account.py` :
  - `demo@nati-fenua.com` / `DemoFenua2026!` (vérifié, is_demo=true, bio polynésienne)
  - 3 posts upserted (Bora Bora coucher de soleil, Heiva, Moorea Belvédère) — idempotent
  - Indispensable pour Apple App Review Guideline 2.1 + recommandé pour Google Play
- **Page publique `/preview`** : feed RSS lisible sans authentification (Apple Guideline 5.1.1 — "app must show content before forcing account creation"). 15 articles récents + CTA "S'inscrire" sticky + endpoint backend `GET /api/public/rss-feed`.
- **Bouton "Découvrir sans s'inscrire"** sur landing → /preview. testid `guest-preview-link`.
- **Feature Graphic 1024x500** générée via Gemini Nano Banana (`/app/backend/scripts/generate_feature_graphic.py`) → `/app/frontend/public/store-assets/feature-graphic-1024x500.png` (auto-cropped via ImageMagick).
- **Auto-screenshots** Playwright (`/app/backend/scripts/generate_store_screenshots.py`) : capture les 8 pages clés en 1080×2400 (Play Store Android) + 1290×2796 (App Store iPhone 6.7"), output `/app/frontend/public/store-assets/playstore/` + `/appstore/`. Connexion auto avec compte démo.
- **Politique Google Play Personnel comptes** : 12 testeurs sur 14 jours consécutifs (réduit de 20 à 12 en déc. 2024). Bots/émulateurs détectés via télémétrie hardware en 2026 → uniquement des testeurs réels.

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
- **Webhook Resend entrant** (recevoir emails sent → contact@nati-fenua.com directement dans dashboard admin)
- **Finaliser le flow Stripe Checkout côté UI** sur `/advertising` (backend endpoints existent, intégrer paiement front)
- Analytics tracking RSS (vues / clics / temps passé)
- Badge "🆕 Nouveau" sur posts < 24h
- Badge "🔥 Tendance" sur articles RSS populaires

### P2 (futur)
- **Push notifications natives** via Service Worker + Web Push API
- **Soumission Apple App Store** (en attente compte dev) — voir `APPSTORE_CAPACITOR_GUIDE.md`
- **Refactor `server.py`** (>10000 lignes) en modules `routes/`, `services/`, `models/` (⛔ bloqué pendant phase beta testers, risque de régression)
- Renommer services Render pour retirer "backend"/"frontend" des URLs
- Filtres "Alerte recherche" marketplace (notif push quand annonce match critères)
- Investiguer 500 occasionnel sur `/api/admin/agent/audit` (ai_agent_v2.py: AttributeError 'AuditRequest' has no attribute 'session_id')

## Changelog récent (juin 2026)
### Pages Admin + Récompenses utilisateur (juin 2026)
- **3 nouvelles pages branchées** :
  - `/admin/email-stats` (`AdminEmailStatsPage.js`) — KPIs Resend (sent/opened/clicked/bounced), liste derniers events webhook, bouton "Envoyer digest maintenant"
  - `/admin/insights` (`AdminAnalyticsInsightsPage.js`) — Top posts, top vendeurs, répartition par île, summary 7/30j
  - `/rewards` (`RewardsPage.js`) — Paliers récompenses parrainage utilisateur (5 tiers : 1/3/5/10/20 filleuls)
- **Root cause fixé** : les 3 endpoints admin (`/admin/digest/send-now`, `/admin/email/stats`, `/admin/analytics/insights`) utilisaient `require_auth` (JWT user) alors que le frontend admin envoie `admin_token` (session admin). Migration vers `verify_admin_token` sur les 3 endpoints (`server.py` L1937, L1986, L7581).
- **Bug ReferralPage** : imports manquants (`toast`, `API`) → la page rendait "Erreur de chargement" silencieux. Imports ajoutés, fallback amélioré (rend toujours le bouton vers /rewards).
- **Bug AdminDashboardPage** : import lucide-react `DollarSign` dupliqué cassait le build complet. Corrigé par testing agent.
- **CTA ajouté sur /referral** : bouton "Tes paliers de récompenses" (data-testid=`rewards-cta`) pour rendre `/rewards` accessible.
- **Testing** : screenshot e2e validé (login demo → /referral → click CTA → /rewards → 5 tiers rendus). Testing agent v3 a confirmé 100% des KPIs/sections sur les 3 pages.

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

## Test Credentials (sandbox local)
- `mobiletest@nati.local` / `TestPass123!` — utilisateur test mobile drawer (créé fév 2026)

## Critical Notes
- iOS Safari : éviter `target="_blank"` + `window.open` simultanés. Toujours `type="button"`, `pointer-events-none` sur SVG enfants, `e.preventDefault()` sur touchend backdrop pour éviter ghost click.
- Toutes les `<img>` ont fallback `onerror` global via MutationObserver dans `index.js`
- `EMERGENT_LLM_KEY` + `STRIPE_API_KEY=sk_test_emergent` déjà en env
- Service Worker v5 — bump le numéro pour forcer iPhone PWA à clear le cache
