# 🇳🇨 CRÉATION APPLICATION - CAILLOU CONNECT (NOUVELLE-CALÉDONIE)

## INSTRUCTIONS POUR L'AGENT EMERGENT

Je veux créer une application de réseau social local pour la **NOUVELLE-CALÉDONIE**, 
basée sur l'architecture de "Nati Fenua" (Polynésie Française).

---

## 📍 INFORMATIONS NOUVELLE-CALÉDONIE

```
NOM DE L'APPLICATION : Caillou Connect
SLOGAN : Le réseau social du Caillou
DESCRIPTION : Réseau social local pour les Calédoniens - Actualités, carte interactive, marketplace et messagerie

DEVISE : Franc Pacifique (XPF)
TAUX : 1 EUR = 119.33 XPF

LANGUES :
- Principale : Français
- Secondaire : Drehu (langue kanak de Lifou)

CENTRE DE LA CARTE :
- Latitude : -22.2758
- Longitude : 166.4580
- Ville : Nouméa
```

---

## 🗺️ RÉGIONS À CONFIGURER

```python
REGIONS = {
    "noumea": {
        "name": "Nouméa",
        "lat": -22.2758,
        "lng": 166.4580,
        "keywords": ["nouméa", "noumea", "anse vata", "baie des citrons", "centre ville", "quartier latin", "motor pool", "pk"]
    },
    "dumbea": {
        "name": "Dumbéa",
        "lat": -22.1500,
        "lng": 166.4500,
        "keywords": ["dumbéa", "dumbea", "koutio", "auteuil"]
    },
    "mont-dore": {
        "name": "Mont-Dore",
        "lat": -22.2667,
        "lng": 166.5667,
        "keywords": ["mont-dore", "mont dore", "plum", "yahoué", "robinson"]
    },
    "paita": {
        "name": "Païta",
        "lat": -22.1333,
        "lng": 166.3667,
        "keywords": ["païta", "paita", "tontouta"]
    },
    "bourail": {
        "name": "Bourail",
        "lat": -21.5667,
        "lng": 165.5000,
        "keywords": ["bourail", "poé", "gouaro", "roche percée"]
    },
    "kone": {
        "name": "Koné",
        "lat": -21.0594,
        "lng": 164.8658,
        "keywords": ["koné", "kone", "province nord"]
    },
    "poindimie": {
        "name": "Poindimié",
        "lat": -20.9333,
        "lng": 165.3333,
        "keywords": ["poindimié", "poindimie", "tiéti"]
    },
    "koumac": {
        "name": "Koumac",
        "lat": -20.5667,
        "lng": 164.2833,
        "keywords": ["koumac", "nord"]
    },
    "lifou": {
        "name": "Lifou",
        "lat": -20.9167,
        "lng": 167.2500,
        "keywords": ["lifou", "wé", "loyauté", "drehu"]
    },
    "mare": {
        "name": "Maré",
        "lat": -21.5000,
        "lng": 168.0000,
        "keywords": ["maré", "mare", "tadine", "nengone"]
    },
    "ouvea": {
        "name": "Ouvéa",
        "lat": -20.6500,
        "lng": 166.5667,
        "keywords": ["ouvéa", "ouvea", "fayaoué", "mouli", "iaai"]
    },
    "ile-des-pins": {
        "name": "Île des Pins",
        "lat": -22.6167,
        "lng": 167.4833,
        "keywords": ["île des pins", "ile des pins", "kunie", "vao", "kuto", "oro"]
    },
    "thio": {
        "name": "Thio",
        "lat": -21.6167,
        "lng": 166.2167,
        "keywords": ["thio", "mine", "nickel"]
    },
    "canala": {
        "name": "Canala",
        "lat": -21.5167,
        "lng": 165.9667,
        "keywords": ["canala", "nakéty"]
    },
    "hienghene": {
        "name": "Hienghène",
        "lat": -20.6833,
        "lng": 164.9333,
        "keywords": ["hienghène", "hienghene", "poule couveuse", "lindéralique"]
    }
}
```

---

## 📰 SOURCES RSS NOUVELLE-CALÉDONIE

```python
RSS_FEEDS = [
    # === MÉDIAS LOCAUX ===
    {
        "name": "Les Nouvelles Calédoniennes",
        "url": "https://www.lnc.nc/rss",
        "region": "noumea",
        "account_id": "lnc_nc",
        "logo": "https://www.lnc.nc/favicon.ico",
        "categories": ["actualité", "politique", "société"],
        "feed_type": "media"
    },
    {
        "name": "NC la 1ère",
        "url": "https://la1ere.francetvinfo.fr/nouvellecaledonie/rss",
        "region": "noumea",
        "account_id": "nc_la1ere",
        "logo": "https://la1ere.francetvinfo.fr/image/nc1ere.png",
        "categories": ["actualité", "télévision", "info"],
        "feed_type": "media"
    },
    {
        "name": "Outremers 360",
        "url": "https://outremers360.com/feed/",
        "region": "noumea",
        "account_id": "outremers360",
        "logo": "https://outremers360.com/wp-content/uploads/2020/01/logo-outremers360.png",
        "categories": ["actualité", "outre-mer", "économie"],
        "feed_type": "media"
    },
    
    # === SOURCES PACIFIQUE ===
    {
        "name": "Le Monde Pacifique",
        "url": "https://www.lemonde.fr/asie-pacifique/rss_full.xml",
        "region": "noumea",
        "account_id": "lemonde_pacifique",
        "logo": "https://www.lemonde.fr/img/favicon/icon-180.png",
        "categories": ["actualité", "international"],
        "feed_type": "media"
    },
    
    # === SPORT ===
    {
        "name": "World Surf League",
        "url": "https://www.worldsurfleague.com/rss/news",
        "region": "noumea",
        "account_id": "wsl_surf",
        "logo": "https://www.worldsurfleague.com/favicon.ico",
        "categories": ["surf", "sport"],
        "feed_type": "sport"
    },
    
    # === ENVIRONNEMENT ===
    {
        "name": "Ocean Conservancy",
        "url": "https://oceanconservancy.org/feed/",
        "region": "noumea",
        "account_id": "ocean_conservancy",
        "logo": "https://oceanconservancy.org/favicon.ico",
        "categories": ["environnement", "océan", "lagon"],
        "feed_type": "environnement"
    }
]
```

---

## 🗣️ TRADUCTIONS FRANÇAIS / DREHU

```python
TRANSLATIONS = {
    # Navigation
    "nav.home": {"fr": "Accueil", "dh": "Hnagejë"},
    "nav.explore": {"fr": "Explorer", "dh": "Öni"},
    "nav.map": {"fr": "Carte", "dh": "Karte"},
    "nav.messages": {"fr": "Messages", "dh": "Ithanata"},
    "nav.profile": {"fr": "Profil", "dh": "Profil"},
    "nav.marketplace": {"fr": "Marché", "dh": "Maketr"},
    
    # Salutations
    "greeting.hello": {"fr": "Bonjour", "dh": "Bozu"},
    "greeting.welcome": {"fr": "Bienvenue", "dh": "Hna kapa eö"},
    "greeting.goodbye": {"fr": "Au revoir", "dh": "Edröle"},
    "greeting.thanks": {"fr": "Merci", "dh": "Öketre"},
    
    # Carte Mana
    "mana.title": {"fr": "Carte du Caillou", "dh": "Karte ne la nöj"},
    "mana.roulotte": {"fr": "Roulotte", "dh": "Roulotte"},
    "mana.food_truck": {"fr": "Food Truck", "dh": "Food Truck"},
    "mana.event": {"fr": "Événement", "dh": "Ewekë"},
    "mana.market": {"fr": "Bonne Affaire", "dh": "Matre ka loi"},
    "mana.woofing": {"fr": "Woofing", "dh": "Woofing"},
    "mana.surf": {"fr": "Spot Surf", "dh": "Surf"},
    "mana.alert": {"fr": "Alerte", "dh": "Alerte"},
    "mana.webcam": {"fr": "Webcam", "dh": "Webcam"},
    
    # Actions
    "action.post": {"fr": "Publier", "dh": "Cinyihan"},
    "action.like": {"fr": "J'aime", "dh": "Hnimi"},
    "action.comment": {"fr": "Commenter", "dh": "Qaja"},
    "action.share": {"fr": "Partager", "dh": "Hamën"},
    "action.send": {"fr": "Envoyer", "dh": "Upe kowe"},
    "action.search": {"fr": "Rechercher", "dh": "Thele"},
    "action.filter": {"fr": "Filtrer", "dh": "Filtre"},
    "action.boost": {"fr": "Booster", "dh": "Boost"},
    
    # Auth
    "auth.login": {"fr": "Connexion", "dh": "Hane kö"},
    "auth.register": {"fr": "Inscription", "dh": "Hmekën"},
    "auth.logout": {"fr": "Déconnexion", "dh": "Köte trij"},
    "auth.password": {"fr": "Mot de passe", "dh": "Ëje ka huna"},
    
    # Marketplace
    "market.sell": {"fr": "Vendre", "dh": "Salemë"},
    "market.buy": {"fr": "Acheter", "dh": "Saze"},
    "market.price": {"fr": "Prix", "dh": "Mani"},
    "market.contact": {"fr": "Contacter", "dh": "Ithanata"},
    
    # Régions
    "region.noumea": {"fr": "Nouméa", "dh": "Numea"},
    "region.lifou": {"fr": "Lifou", "dh": "Drehu"},
    "region.mare": {"fr": "Maré", "dh": "Nengone"},
    "region.ouvea": {"fr": "Ouvéa", "dh": "Iaai"},
    "region.pins": {"fr": "Île des Pins", "dh": "Kunie"},
    "region.nord": {"fr": "Province Nord", "dh": "Nöj ne Nörd"},
    "region.sud": {"fr": "Province Sud", "dh": "Nöj ne Süd"},
    "region.loyaute": {"fr": "Îles Loyauté", "dh": "Nöj ne Loyauté"},
    
    # Divers
    "misc.today": {"fr": "Aujourd'hui", "dh": "Kö lai"},
    "misc.yesterday": {"fr": "Hier", "dh": "Ngöne hë"},
    "misc.now": {"fr": "Maintenant", "dh": "Ba kö"},
    "misc.near": {"fr": "À proximité", "dh": "Easenyi"}
}
```

---

## 🚫 MOTS INTERDITS MODÉRATION (Nouvelle-Calédonie)

```python
FORBIDDEN_WORDS = {
    # Insultes françaises standard
    "connard", "connasse", "salaud", "salope", "putain", "pute", "merde",
    "enculé", "enculer", "nique", "niquer", "ntm", "fdp", "pd",
    "bâtard", "batard", "bordel", "crétin", "débile", "abruti",
    "ta gueule", "ferme ta gueule", "ftg", "bouffon",
    
    # Termes racistes/discriminatoires locaux
    "caldoche de merde", "kanak de merde", "sale caldoche", "sale kanak",
    "zoreille de merde", "sale zoreille", "métro de merde",
    
    # Termes haineux généraux
    "nègre", "négro", "bougnoule", "youpin", "bicot",
    
    # Violence
    "je vais te tuer", "je te tue", "crève", "mort aux",
    
    # Spam
    "gagne de l'argent", "deviens riche", "bitcoin gratuit",
    "clique ici", "argent facile"
}
```

---

## 💰 TARIFS BOOST (en XPF)

```python
BOOST_PRICES = {
    "roulotte": {
        "price_xpf": 300,
        "price_eur": 2.51,
        "duration_hours": 8,
        "description": "8 heures en tête de liste"
    },
    "market": {
        "price_xpf": 300,
        "price_eur": 2.51,
        "duration_hours": 8,
        "description": "8 heures en tête de liste"
    },
    "woofing_standard": {
        "price_xpf": 300,
        "price_eur": 2.51,
        "duration_hours": 24,
        "description": "24 heures de visibilité"
    },
    "woofing_premium": {
        "price_xpf": 1500,
        "price_eur": 12.57,
        "duration_hours": 168,  # 7 jours
        "description": "1 semaine complète"
    },
    "product_marketplace": {
        "price_xpf": 300,
        "price_eur": 2.51,
        "duration_hours": 24,
        "description": "24 heures en tête du marché"
    }
}

# Durées normales (sans boost)
MARKER_DURATIONS = {
    "roulotte": 3,      # 3 heures
    "food_truck": 3,    # 3 heures  
    "market": 3,        # 3 heures
    "woofing": 24,      # 24 heures
    "event": 24,        # 24 heures
    "surf": 4,          # 4 heures
    "alert": 4,         # 4 heures
    "carpool": 8,       # 8 heures
    "webcam": 999999    # Permanent
}
```

---

## 🎨 THÈME VISUEL

```css
/* Couleurs principales - Inspiration lagon calédonien */
:root {
  --primary: #00A8A8;        /* Turquoise lagon */
  --primary-dark: #008080;   /* Turquoise foncé */
  --secondary: #FF6B35;      /* Orange corail */
  --accent: #FFD700;         /* Or (nickel) */
  --background: #1A1A2E;     /* Bleu nuit */
  --surface: #16213E;        /* Bleu marine */
  --text: #FFFFFF;
  --text-muted: #94A3B8;
}

/* Dégradé principal */
.gradient-primary {
  background: linear-gradient(135deg, #00A8A8 0%, #008080 100%);
}

/* Dégradé boost */
.gradient-boost {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
}
```

---

## 📱 MANIFEST.JSON (PWA)

```json
{
  "name": "Caillou Connect",
  "short_name": "Caillou",
  "description": "Le réseau social de la Nouvelle-Calédonie - Actualités, carte, marketplace",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1A1A2E",
  "theme_color": "#00A8A8",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "fr",
  "categories": ["social", "lifestyle", "news"],
  "icons": [
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Créer un post",
      "url": "/create",
      "icons": [{ "src": "/icons/icon-512x512.png", "sizes": "512x512" }]
    },
    {
      "name": "Carte du Caillou",
      "url": "/mana",
      "icons": [{ "src": "/icons/icon-512x512.png", "sizes": "512x512" }]
    },
    {
      "name": "Messages",
      "url": "/chat",
      "icons": [{ "src": "/icons/icon-512x512.png", "sizes": "512x512" }]
    }
  ],
  "id": "com.caillouconnect.app"
}
```

---

## 🏗️ ARCHITECTURE TECHNIQUE REQUISE

```
FRONTEND : React 18 + TailwindCSS + Shadcn/UI
BACKEND : FastAPI (Python 3.11+)
DATABASE : MongoDB Atlas
HOSTING : Render.com
PAIEMENTS : Stripe
AUTH : Google OAuth + JWT
NOTIFICATIONS : Firebase Cloud Messaging (gratuit)
EMAILS : Resend (gratuit)
```

---

## ✅ FONCTIONNALITÉS À IMPLÉMENTER

### 1. AUTHENTIFICATION
- [x] Email/Mot de passe avec JWT
- [x] Google OAuth
- [x] Réinitialisation mot de passe par email
- [x] Profils utilisateurs avec photo, bio, région

### 2. FEED D'ACTUALITÉS
- [x] Posts utilisateurs (texte, images)
- [x] Intégration RSS automatique (2x/jour)
- [x] Expiration RSS après 48h
- [x] Likes et commentaires
- [x] Partage de posts
- [x] Filtres par catégorie

### 3. CARTE INTERACTIVE "MANA"
- [x] Types de marqueurs : Roulotte, Food truck, Événement, Bonne affaire, Woofing, Surf, Alerte, Webcam
- [x] Filtres par type et région
- [x] Géolocalisation utilisateur
- [x] Bouton "Contacter" pour roulottes/vendeurs
- [x] Système de boost payant

### 4. MARKETPLACE
- [x] Création d'annonces (produits)
- [x] Catégories (bijoux, vêtements, électronique, etc.)
- [x] Photos multiples
- [x] Contact vendeur par messagerie
- [x] Boost payant (24h en tête)

### 5. MESSAGERIE
- [x] Chat temps réel (WebSocket)
- [x] Conversations privées
- [x] Indicateurs de frappe
- [x] Accusés de lecture
- [x] Recherche d'utilisateurs

### 6. SYSTÈME DE BOOST
- [x] Roulotte : 300 XPF / 8h
- [x] Bonne Affaire : 300 XPF / 8h
- [x] Woofing : 300 XPF / 24h OU 1500 XPF / 7 jours
- [x] Marketplace : 300 XPF / 24h
- [x] Paiement Stripe
- [x] Webhook pour activation automatique

### 7. MODÉRATION
- [x] Filtre mots interdits
- [x] Détection spam
- [x] Signalement utilisateurs
- [x] (Optionnel) Modération IA

### 8. NOTIFICATIONS
- [x] Push notifications (Firebase)
- [x] Emails transactionnels (Resend)

### 9. ADMINISTRATION
- [x] Dashboard admin
- [x] Gestion des posts
- [x] Gestion des marqueurs
- [x] Statistiques plateforme

### 10. PWA
- [x] Installable sur mobile
- [x] Service Worker
- [x] Manifest.json

---

## 📋 VARIABLES D'ENVIRONNEMENT RENDER

### Backend (.env)
```
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/caillou_connect
DB_NAME=caillou_connect
JWT_SECRET=votre_secret_jwt_super_long_et_securise

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# Stripe
STRIPE_API_KEY=sk_live_xxx

# Optionnel
FIREBASE_SERVER_KEY=xxx
RESEND_API_KEY=re_xxx
MODERATION_AI_KEY=sk-xxx
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://caillou-connect-backend.onrender.com
```

---

## 🚀 INSTRUCTIONS DE DÉPLOIEMENT

1. Créer compte MongoDB Atlas (gratuit)
2. Créer projet Google Cloud + OAuth
3. Créer compte Stripe
4. Créer services sur Render :
   - Backend : Web Service Python
   - Frontend : Static Site React
5. Configurer variables d'environnement
6. Déployer

---

## ⚠️ IMPORTANT POUR L'AGENT

1. **Fournir des fichiers ZIP téléchargeables** car l'utilisateur ne peut pas utiliser "Save to Github"

2. **Suivre l'architecture exacte de Nati Fenua** (documentation ci-dessous)

3. **Tester les endpoints principaux** avant de livrer

4. **Adapter les couleurs** au thème turquoise/lagon

5. **Vérifier les flux RSS** - certains peuvent être morts

---

## 📚 DOCUMENTATION TECHNIQUE DE RÉFÉRENCE (NATI FENUA)

### Structure des fichiers Backend
```
backend/
├── server.py              # API principale FastAPI
├── fenua_pulse.py         # Logique carte Mana
├── rss_feeds.py           # Flux RSS
├── auto_moderation.py     # Modération
├── websocket_manager.py   # Chat temps réel
├── translations.py        # Traductions
├── push_notifications.py  # Firebase
├── email_service.py       # Resend
└── requirements.txt
```

### Structure des fichiers Frontend
```
frontend/
├── public/
│   ├── manifest.json
│   ├── service-worker.js
│   └── icons/
├── src/
│   ├── pages/
│   │   ├── FeedPage.js
│   │   ├── ManaPage.js
│   │   ├── MarketplacePage.js
│   │   ├── ChatPage.js
│   │   ├── ProfilePage.js
│   │   ├── AuthPage.js
│   │   └── AdminDashboardPage.js
│   ├── components/
│   │   ├── ui/
│   │   └── NotificationBanner.js
│   ├── hooks/
│   │   └── usePushNotifications.js
│   ├── contexts/
│   │   └── AuthContext.js
│   └── lib/
│       └── api.js
└── package.json
```

### Dépendances Backend (requirements.txt)
```
fastapi>=0.110.0
uvicorn>=0.25.0
motor>=3.3.0
pymongo>=4.5.0
bcrypt>=4.1.0
passlib>=1.7.4
python-jose>=3.5.0
PyJWT>=2.8.0
pydantic>=2.5.0
httpx>=0.25.0
aiohttp>=3.9.0
python-dotenv>=1.0.0
pillow>=10.0.0
feedparser>=6.0.0
beautifulsoup4>=4.12.0
python-dateutil>=2.8.0
slowapi>=0.1.9
resend>=0.7.0
--extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
emergentintegrations
```

### Dépendances Frontend (package.json principales)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.x",
    "axios": "^1.x",
    "framer-motion": "^10.x",
    "lucide-react": "^0.x",
    "tailwindcss": "^3.x",
    "@radix-ui/react-*": "latest",
    "sonner": "^1.x",
    "leaflet": "^1.x",
    "react-leaflet": "^4.x"
  }
}
```

---

## 🎯 RÉSUMÉ DE LA MISSION

Créer **Caillou Connect**, le réseau social de la Nouvelle-Calédonie avec :
- Feed d'actualités (RSS locaux + posts utilisateurs)
- Carte interactive du Caillou (roulottes, événements, woofing, etc.)
- Marketplace local
- Messagerie temps réel
- Système de boost payant en XPF
- Modération automatique
- Traductions FR/Drehu
- PWA installable

Le tout déployé sur Render avec MongoDB Atlas.

---

MERCI DE COMMENCER LE DÉVELOPPEMENT ! 🚀
