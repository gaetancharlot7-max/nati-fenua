# 🇳🇨 CRÉATION APPLICATION - KAMO (NOUVELLE-CALÉDONIE)

## INSTRUCTIONS POUR L'AGENT EMERGENT

Je veux créer une application de réseau social local pour la **NOUVELLE-CALÉDONIE**, 
identique en fonctionnalités et performances à "Nati Fenua" (Polynésie Française).

**IMPORTANT** : Cette application doit avoir TOUTES les mêmes fonctionnalités que Nati Fenua :
- Feed d'actualités avec RSS automatique
- Carte interactive "Mana" avec marqueurs (roulottes, woofing, événements, etc.)
- Marketplace local
- Chat temps réel (WebSockets)
- Système de Boost payant en XPF via Stripe
- Modération automatique (mots interdits + IA optionnelle)
- Notifications push (Firebase)
- Emails transactionnels (Resend)
- PWA installable
- Google OAuth + JWT Auth
- Page Média séparée pour les sources RSS (pas de stats, lien site web)

---

## 📍 INFORMATIONS NOUVELLE-CALÉDONIE

```
NOM DE L'APPLICATION : Kamo
SLOGAN : Le réseau social du Caillou
TAGLINE : Partage, connecte-toi et découvre le meilleur du Caillou
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
- Zoom par défaut : 8
```

---

## 🎨 IDENTITÉ VISUELLE KAMO

```css
/* Couleurs principales - Inspiration lagon calédonien & nickel */
:root {
  /* Couleurs primaires */
  --primary: #00A8A8;           /* Turquoise lagon */
  --primary-dark: #008080;      /* Turquoise foncé */
  --primary-light: #00CED1;     /* Cyan clair */
  
  /* Couleurs secondaires */
  --secondary: #FF6B35;         /* Orange corail */
  --accent: #FFD700;            /* Or (nickel) */
  --accent-pink: #FF1493;       /* Rose vif */
  
  /* Backgrounds */
  --background: #1A1A2E;        /* Bleu nuit */
  --surface: #16213E;           /* Bleu marine */
  --card: #FFFFFF;              /* Blanc */
  
  /* Texte */
  --text: #FFFFFF;
  --text-dark: #2F2F31;
  --text-muted: #94A3B8;
  
  /* États */
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
}

/* Logo */
LOGO_LETTER: "K"
LOGO_GRADIENT: linear-gradient(135deg, #FF6B35 0%, #FF1493 50%, #00CED1 100%)

/* Dégradés */
.gradient-primary {
  background: linear-gradient(135deg, #00A8A8 0%, #008080 100%);
}

.gradient-boost {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
}

.gradient-cta {
  background: linear-gradient(135deg, #FF6B35 0%, #FF1493 100%);
}
```

---

## 🗺️ RÉGIONS NOUVELLE-CALÉDONIE

```python
REGIONS = {
    # === GRAND NOUMÉA ===
    "noumea": {
        "name": "Nouméa",
        "lat": -22.2758,
        "lng": 166.4580,
        "keywords": ["nouméa", "noumea", "anse vata", "baie des citrons", "centre ville", 
                     "quartier latin", "motor pool", "pk", "magenta", "receiving", "orphelinat",
                     "vallée des colons", "faubourg blanchot", "tina", "ouemo", "n'géa"]
    },
    "dumbea": {
        "name": "Dumbéa",
        "lat": -22.1500,
        "lng": 166.4500,
        "keywords": ["dumbéa", "dumbea", "koutio", "auteuil", "koé", "nassandou", "dumbéa sur mer"]
    },
    "mont-dore": {
        "name": "Mont-Dore",
        "lat": -22.2667,
        "lng": 166.5667,
        "keywords": ["mont-dore", "mont dore", "plum", "yahoué", "robinson", "la coulée", 
                     "boulari", "saint-louis", "pont des français", "prony"]
    },
    "paita": {
        "name": "Païta",
        "lat": -22.1333,
        "lng": 166.3667,
        "keywords": ["païta", "paita", "tontouta", "aéroport", "naia", "tamoa", "port laguerre"]
    },
    
    # === PROVINCE SUD ===
    "bourail": {
        "name": "Bourail",
        "lat": -21.5667,
        "lng": 165.5000,
        "keywords": ["bourail", "poé", "gouaro", "roche percée", "deva", "téné", "moindou"]
    },
    "thio": {
        "name": "Thio",
        "lat": -21.6167,
        "lng": 166.2167,
        "keywords": ["thio", "mine", "nickel", "bota méré", "st-philippo", "plateau"]
    },
    "yate": {
        "name": "Yaté",
        "lat": -22.1500,
        "lng": 166.9333,
        "keywords": ["yaté", "yate", "goro", "prony", "rivière bleue", "lac de yaté", "wadiana"]
    },
    "canala": {
        "name": "Canala",
        "lat": -21.5167,
        "lng": 165.9667,
        "keywords": ["canala", "nakéty", "gelima", "méré", "kuiné"]
    },
    
    # === PROVINCE NORD ===
    "kone": {
        "name": "Koné",
        "lat": -21.0594,
        "lng": 164.8658,
        "keywords": ["koné", "kone", "province nord", "voh", "koniambo", "pouembout"]
    },
    "poindimie": {
        "name": "Poindimié",
        "lat": -20.9333,
        "lng": 165.3333,
        "keywords": ["poindimié", "poindimie", "tiéti", "ponérihouen", "houaïlou"]
    },
    "koumac": {
        "name": "Koumac",
        "lat": -20.5667,
        "lng": 164.2833,
        "keywords": ["koumac", "nord", "kaala-gomen", "ouégoa", "poum", "boat pass"]
    },
    "hienghene": {
        "name": "Hienghène",
        "lat": -20.6833,
        "lng": 164.9333,
        "keywords": ["hienghène", "hienghene", "poule couveuse", "lindéralique", "koulnoué", "touho"]
    },
    
    # === ÎLES LOYAUTÉ ===
    "lifou": {
        "name": "Lifou",
        "lat": -20.9167,
        "lng": 167.2500,
        "keywords": ["lifou", "wé", "loyauté", "drehu", "xepenehe", "luecila", "jokin", "mu"]
    },
    "mare": {
        "name": "Maré",
        "lat": -21.5000,
        "lng": 168.0000,
        "keywords": ["maré", "mare", "tadine", "nengone", "la roche", "cengeite", "wabao"]
    },
    "ouvea": {
        "name": "Ouvéa",
        "lat": -20.6500,
        "lng": 166.5667,
        "keywords": ["ouvéa", "ouvea", "fayaoué", "mouli", "iaai", "lékiny", "gossanah", "takedji"]
    },
    
    # === ÎLE DES PINS ===
    "ile-des-pins": {
        "name": "Île des Pins",
        "lat": -22.6167,
        "lng": 167.4833,
        "keywords": ["île des pins", "ile des pins", "kunie", "vao", "kuto", "oro", "kanumera", 
                     "baie d'upi", "piscine naturelle", "pic n'ga"]
    }
}
```

---

## 📰 SOURCES RSS NOUVELLE-CALÉDONIE

```python
RSS_FEEDS = [
    # === MÉDIAS LOCAUX PRINCIPAUX ===
    {
        "name": "Les Nouvelles Calédoniennes",
        "url": "https://www.lnc.nc/rss",
        "region": "noumea",
        "account_id": "lnc_nc",
        "logo": "https://www.lnc.nc/sites/all/themes/lnc/favicon.ico",
        "website": "https://www.lnc.nc",
        "categories": ["actualité", "politique", "société"],
        "feed_type": "media"
    },
    {
        "name": "NC la 1ère",
        "url": "https://la1ere.francetvinfo.fr/nouvellecaledonie/rss",
        "region": "noumea",
        "account_id": "nc_la1ere",
        "logo": "https://la1ere.francetvinfo.fr/image/nc1ere.png",
        "website": "https://la1ere.francetvinfo.fr/nouvellecaledonie",
        "categories": ["actualité", "télévision", "info"],
        "feed_type": "media"
    },
    {
        "name": "Caledonia",
        "url": "https://caledonia.nc/feed/",
        "region": "noumea",
        "account_id": "caledonia_nc",
        "logo": "https://caledonia.nc/favicon.ico",
        "website": "https://caledonia.nc",
        "categories": ["actualité", "culture", "lifestyle"],
        "feed_type": "media"
    },
    
    # === OUTRE-MER & PACIFIQUE ===
    {
        "name": "Outremers 360",
        "url": "https://outremers360.com/feed/",
        "region": "noumea",
        "account_id": "outremers360",
        "logo": "https://outremers360.com/wp-content/uploads/2020/01/logo-outremers360.png",
        "website": "https://outremers360.com",
        "categories": ["actualité", "outre-mer", "économie"],
        "feed_type": "media"
    },
    {
        "name": "Le Monde Pacifique",
        "url": "https://www.lemonde.fr/asie-pacifique/rss_full.xml",
        "region": "noumea",
        "account_id": "lemonde_pacifique",
        "logo": "https://www.lemonde.fr/img/favicon/icon-180.png",
        "website": "https://www.lemonde.fr/asie-pacifique/",
        "categories": ["actualité", "international"],
        "feed_type": "media"
    },
    
    # === SPORT & SURF ===
    {
        "name": "World Surf League",
        "url": "https://www.worldsurfleague.com/rss/news",
        "region": "noumea",
        "account_id": "wsl_surf",
        "logo": "https://www.worldsurfleague.com/favicon.ico",
        "website": "https://www.worldsurfleague.com",
        "categories": ["surf", "sport", "compétition"],
        "feed_type": "sport"
    },
    
    # === ENVIRONNEMENT ===
    {
        "name": "Ocean Conservancy",
        "url": "https://oceanconservancy.org/feed/",
        "region": "noumea",
        "account_id": "ocean_conservancy",
        "logo": "https://oceanconservancy.org/favicon.ico",
        "website": "https://oceanconservancy.org",
        "categories": ["environnement", "océan", "lagon"],
        "feed_type": "environnement"
    }
]

# Configuration RSS
RSS_CONFIG = {
    "fetch_interval_hours": 12,      # Récupération 2x par jour
    "max_articles_per_feed": 10,     # Max articles par source
    "article_expiry_hours": 48,      # Expiration après 48h
    "retry_failed_feeds": True,
    "timeout_seconds": 30
}
```

---

## 🗣️ TRADUCTIONS FRANÇAIS / DREHU

```python
TRANSLATIONS = {
    # === Navigation ===
    "nav.home": {"fr": "Accueil", "dh": "Hnagejë"},
    "nav.explore": {"fr": "Explorer", "dh": "Öni"},
    "nav.map": {"fr": "Carte", "dh": "Karte"},
    "nav.messages": {"fr": "Messages", "dh": "Ithanata"},
    "nav.profile": {"fr": "Profil", "dh": "Profil"},
    "nav.marketplace": {"fr": "Marché", "dh": "Maketr"},
    "nav.notifications": {"fr": "Notifications", "dh": "Alerte"},
    
    # === Salutations ===
    "greeting.hello": {"fr": "Bonjour", "dh": "Bozu"},
    "greeting.welcome": {"fr": "Bienvenue sur Kamo", "dh": "Hna kapa eö kowe Kamo"},
    "greeting.goodbye": {"fr": "Au revoir", "dh": "Edröle"},
    "greeting.thanks": {"fr": "Merci", "dh": "Öketre"},
    "greeting.please": {"fr": "S'il te plaît", "dh": "Atraqatr"},
    "greeting.yes": {"fr": "Oui", "dh": "Eje"},
    "greeting.no": {"fr": "Non", "dh": "Ohie"},
    
    # === Carte Mana ===
    "mana.title": {"fr": "Carte du Caillou", "dh": "Karte ne la nöj"},
    "mana.subtitle": {"fr": "Découvrez les bons plans près de chez vous", "dh": "Öni la itre ewekë ka loi easenyi"},
    "mana.roulotte": {"fr": "Roulotte", "dh": "Roulotte"},
    "mana.food_truck": {"fr": "Food Truck", "dh": "Food Truck"},
    "mana.event": {"fr": "Événement", "dh": "Ewekë"},
    "mana.market": {"fr": "Bonne Affaire", "dh": "Matre ka loi"},
    "mana.woofing": {"fr": "Woofing", "dh": "Woofing"},
    "mana.surf": {"fr": "Spot Surf", "dh": "Surf"},
    "mana.alert": {"fr": "Alerte", "dh": "Alerte"},
    "mana.webcam": {"fr": "Webcam", "dh": "Webcam"},
    "mana.carpool": {"fr": "Covoiturage", "dh": "Waco isi"},
    
    # === Actions ===
    "action.post": {"fr": "Publier", "dh": "Cinyihan"},
    "action.like": {"fr": "J'aime", "dh": "Hnimi"},
    "action.comment": {"fr": "Commenter", "dh": "Qaja"},
    "action.share": {"fr": "Partager", "dh": "Hamën"},
    "action.send": {"fr": "Envoyer", "dh": "Upe kowe"},
    "action.search": {"fr": "Rechercher", "dh": "Thele"},
    "action.filter": {"fr": "Filtrer", "dh": "Filtre"},
    "action.boost": {"fr": "Booster", "dh": "Boost"},
    "action.save": {"fr": "Enregistrer", "dh": "Hamën kö"},
    "action.cancel": {"fr": "Annuler", "dh": "Canga"},
    "action.confirm": {"fr": "Confirmer", "dh": "Nyipici"},
    "action.delete": {"fr": "Supprimer", "dh": "Apatrene"},
    "action.edit": {"fr": "Modifier", "dh": "Saze"},
    
    # === Auth ===
    "auth.login": {"fr": "Connexion", "dh": "Hane kö"},
    "auth.register": {"fr": "Inscription", "dh": "Hmekën"},
    "auth.logout": {"fr": "Déconnexion", "dh": "Köte trij"},
    "auth.password": {"fr": "Mot de passe", "dh": "Ëje ka huna"},
    "auth.email": {"fr": "Email", "dh": "Email"},
    "auth.forgot_password": {"fr": "Mot de passe oublié ?", "dh": "Hnëmec la ëje ?"},
    
    # === Marketplace ===
    "market.sell": {"fr": "Vendre", "dh": "Salemë"},
    "market.buy": {"fr": "Acheter", "dh": "Saze"},
    "market.price": {"fr": "Prix", "dh": "Mani"},
    "market.contact": {"fr": "Contacter", "dh": "Ithanata"},
    "market.negotiable": {"fr": "Négociable", "dh": "Troa ithanata"},
    "market.sold": {"fr": "Vendu", "dh": "Hna salem"},
    "market.available": {"fr": "Disponible", "dh": "Hetre kö"},
    
    # === Catégories Marketplace ===
    "category.electronics": {"fr": "Électronique", "dh": "Électronique"},
    "category.vehicles": {"fr": "Véhicules", "dh": "Waco"},
    "category.furniture": {"fr": "Meubles", "dh": "Itre ewekë ne hnahag"},
    "category.clothing": {"fr": "Vêtements", "dh": "Itre ihetre"},
    "category.sports": {"fr": "Sports", "dh": "Sports"},
    "category.services": {"fr": "Services", "dh": "Huliwa"},
    "category.other": {"fr": "Autres", "dh": "Itre xa ketre"},
    
    # === Régions ===
    "region.noumea": {"fr": "Nouméa", "dh": "Numea"},
    "region.lifou": {"fr": "Lifou", "dh": "Drehu"},
    "region.mare": {"fr": "Maré", "dh": "Nengone"},
    "region.ouvea": {"fr": "Ouvéa", "dh": "Iaai"},
    "region.pins": {"fr": "Île des Pins", "dh": "Kunie"},
    "region.nord": {"fr": "Province Nord", "dh": "Nöj ne Nörd"},
    "region.sud": {"fr": "Province Sud", "dh": "Nöj ne Süd"},
    "region.loyaute": {"fr": "Îles Loyauté", "dh": "Nöj ne Loyauté"},
    "region.bourail": {"fr": "Bourail", "dh": "Bourail"},
    "region.kone": {"fr": "Koné", "dh": "Koné"},
    
    # === Temps ===
    "time.today": {"fr": "Aujourd'hui", "dh": "Kö lai"},
    "time.yesterday": {"fr": "Hier", "dh": "Ngöne hë"},
    "time.now": {"fr": "Maintenant", "dh": "Ba kö"},
    "time.minutes_ago": {"fr": "il y a {n} minutes", "dh": "qaane {n} minut"},
    "time.hours_ago": {"fr": "il y a {n} heures", "dh": "qaane {n} heure"},
    "time.days_ago": {"fr": "il y a {n} jours", "dh": "qaane {n} drai"},
    
    # === États ===
    "state.loading": {"fr": "Chargement...", "dh": "Hna inine..."},
    "state.error": {"fr": "Une erreur est survenue", "dh": "Hetre ewekë ka tru"},
    "state.success": {"fr": "Succès !", "dh": "Ka loi !"},
    "state.empty": {"fr": "Aucun résultat", "dh": "Pëkö ketre"},
    "state.near": {"fr": "À proximité", "dh": "Easenyi"},
    
    # === Notifications ===
    "notif.new_message": {"fr": "Nouveau message de {name}", "dh": "Ithanata ka hnyawa qaathei {name}"},
    "notif.new_like": {"fr": "{name} a aimé votre publication", "dh": "{name} la hnimi la itus i eö"},
    "notif.new_comment": {"fr": "{name} a commenté votre publication", "dh": "{name} la qaja koi la itus i eö"},
    "notif.new_follower": {"fr": "{name} vous suit maintenant", "dh": "{name} la xötrei eö ba kö"},
    
    # === Boost ===
    "boost.title": {"fr": "Booster votre visibilité", "dh": "Atrune la nyine goeë eö"},
    "boost.description": {"fr": "Apparaissez en tête de liste", "dh": "Troa hë eö ngöne la qaan"},
    "boost.success": {"fr": "Boost activé !", "dh": "Hna atrune !"},
    "boost.duration": {"fr": "Durée : {hours} heures", "dh": "Ijine : {hours} heure"}
}
```

---

## 🚫 MOTS INTERDITS MODÉRATION (Nouvelle-Calédonie)

```python
FORBIDDEN_WORDS = {
    # === Insultes françaises standard ===
    "connard", "connasse", "salaud", "salope", "putain", "pute", "merde",
    "enculé", "enculer", "nique", "niquer", "ntm", "fdp", "pd",
    "bâtard", "batard", "bordel", "crétin", "débile", "abruti",
    "ta gueule", "ferme ta gueule", "ftg", "bouffon", "tg", "stfu",
    "fils de pute", "fdp", "sac à merde", "trouduc", "couillon",
    
    # === Termes racistes/discriminatoires locaux NC ===
    "caldoche de merde", "kanak de merde", "sale caldoche", "sale kanak",
    "zoreille de merde", "sale zoreille", "métro de merde", "sale métro",
    "pied noir de merde", "gens de couleur", "indépendantiste de merde",
    "loyaliste de merde",
    
    # === Termes haineux généraux ===
    "nègre", "négro", "bougnoule", "youpin", "bicot", "chinetoque",
    "bridé", "face de citron", "bamboula", "macaque",
    
    # === Violence & menaces ===
    "je vais te tuer", "je te tue", "crève", "mort aux", "on va te buter",
    "ta mort", "je te défonce", "je t'explose", "je te casse",
    
    # === Spam & arnaques ===
    "gagne de l'argent", "deviens riche", "bitcoin gratuit", "crypto gratuit",
    "clique ici", "argent facile", "investissement garanti", "mlm",
    "travail à domicile facile", "revenus passifs garantis"
}

# Expressions en Drehu à modérer (optionnel, exemples)
FORBIDDEN_WORDS_DREHU = {
    # Ajouter si nécessaire
}
```

---

## 💰 TARIFS BOOST (en XPF)

```python
BOOST_PRICES = {
    # === Carte Mana - Roulottes ===
    "roulotte": {
        "price_xpf": 300,
        "price_eur": 2.51,
        "duration_hours": 8,
        "description": "8 heures en tête de liste",
        "stripe_product_name": "Boost Roulotte 8h"
    },
    
    # === Carte Mana - Bonnes Affaires ===
    "market": {
        "price_xpf": 300,
        "price_eur": 2.51,
        "duration_hours": 8,
        "description": "8 heures en tête de liste",
        "stripe_product_name": "Boost Bonne Affaire 8h"
    },
    
    # === Carte Mana - Woofing Standard ===
    "woofing_standard": {
        "price_xpf": 300,
        "price_eur": 2.51,
        "duration_hours": 24,
        "description": "24 heures de visibilité",
        "stripe_product_name": "Boost Woofing 24h"
    },
    
    # === Carte Mana - Woofing Premium (1 semaine) ===
    "woofing_premium": {
        "price_xpf": 1500,
        "price_eur": 12.57,
        "duration_hours": 168,  # 7 jours
        "description": "1 semaine complète de visibilité",
        "stripe_product_name": "Boost Woofing 7 jours"
    },
    
    # === Marketplace - Produits ===
    "product_marketplace": {
        "price_xpf": 300,
        "price_eur": 2.51,
        "duration_hours": 24,
        "description": "24 heures en tête du marché",
        "stripe_product_name": "Boost Produit Marketplace 24h"
    }
}

# Durées standard (sans boost) pour les marqueurs Mana
MARKER_DURATIONS = {
    "roulotte": 3,      # 3 heures (durée d'un service)
    "food_truck": 3,    # 3 heures  
    "market": 3,        # 3 heures (bonne affaire flash)
    "woofing": 24,      # 24 heures
    "event": 24,        # 24 heures (ou jusqu'à fin événement)
    "surf": 4,          # 4 heures (conditions surf)
    "alert": 4,         # 4 heures (alerte temporaire)
    "carpool": 8,       # 8 heures (trajet du jour)
    "webcam": 999999    # Permanent (ajouté par admin)
}
```

---

## 📱 MANIFEST.JSON (PWA)

```json
{
  "name": "Kamo",
  "short_name": "Kamo",
  "description": "Le réseau social de la Nouvelle-Calédonie - Actualités, carte interactive, marketplace et messagerie",
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
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
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
      "short_name": "Post",
      "url": "/create",
      "icons": [{ "src": "/icons/icon-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "Carte du Caillou",
      "short_name": "Carte",
      "url": "/mana",
      "icons": [{ "src": "/icons/icon-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "Messages",
      "short_name": "Chat",
      "url": "/chat",
      "icons": [{ "src": "/icons/icon-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "Marketplace",
      "short_name": "Marché",
      "url": "/marketplace",
      "icons": [{ "src": "/icons/icon-96x96.png", "sizes": "96x96" }]
    }
  ],
  "related_applications": [],
  "prefer_related_applications": false,
  "id": "com.kamo.app"
}
```

---

## 🏗️ ARCHITECTURE TECHNIQUE

```
FRONTEND : React 18 + TailwindCSS + Shadcn/UI + Framer Motion
BACKEND : FastAPI (Python 3.11+) + WebSockets
DATABASE : MongoDB Atlas (cluster gratuit M0 suffit pour démarrer)
HOSTING : Render.com (gratuit pour commencer)
PAIEMENTS : Stripe (via emergentintegrations pour la clé)
AUTH : Google OAuth + JWT custom
NOTIFICATIONS : Firebase Cloud Messaging (gratuit, illimité)
EMAILS : Resend (gratuit jusqu'à 3000/mois)
MODERATION IA : OpenAI API (optionnel)
CARTES : Leaflet / OpenStreetMap (gratuit)
```

### Structure Backend
```
backend/
├── server.py              # API principale FastAPI (routes, auth, posts, chat)
├── fenua_pulse.py         # Logique carte Mana (remplacer "fenua" par "kamo")
├── rss_feeds.py           # Configuration et parsing flux RSS
├── auto_moderation.py     # Modération automatique (mots interdits)
├── websocket_manager.py   # Gestion chat temps réel
├── translations.py        # Dictionnaire traductions FR/Drehu
├── push_notifications.py  # Firebase Cloud Messaging
├── email_service.py       # Intégration Resend
├── requirements.txt       # Dépendances Python
└── .env                   # Variables d'environnement
```

### Structure Frontend
```
frontend/
├── public/
│   ├── manifest.json      # PWA config
│   ├── service-worker.js  # Cache & offline
│   └── icons/             # Icônes PWA
├── src/
│   ├── pages/
│   │   ├── LandingPage.js
│   │   ├── AuthPage.js
│   │   ├── FeedPage.js
│   │   ├── ManaPage.js         # Carte interactive
│   │   ├── MarketplacePage.js
│   │   ├── ChatPage.js
│   │   ├── ProfilePage.js
│   │   ├── MediaPage.js        # Page médias (pas de stats)
│   │   ├── AdminDashboardPage.js
│   │   └── ...
│   ├── components/
│   │   ├── ui/                 # Shadcn components
│   │   ├── NotificationBanner.js
│   │   └── ...
│   ├── hooks/
│   │   └── usePushNotifications.js
│   ├── contexts/
│   │   └── AuthContext.js
│   └── lib/
│       └── api.js
└── package.json
```

---

## ✅ FONCTIONNALITÉS À IMPLÉMENTER

### 1. AUTHENTIFICATION
- [x] Email/Mot de passe avec JWT
- [x] Google OAuth (bouton "Continuer avec Google")
- [x] Réinitialisation mot de passe par email (Resend)
- [x] Profils utilisateurs avec photo, bio, région

### 2. FEED D'ACTUALITÉS
- [x] Posts utilisateurs (texte, images, vidéos)
- [x] Intégration RSS automatique (2x/jour)
- [x] Expiration RSS après 48h
- [x] Likes avec réactions multiples (❤️ 🔥 😂 ✨ 👍)
- [x] Commentaires
- [x] Partage de posts
- [x] Filtres par catégorie
- [x] **Page Média** séparée (sans stats, avec lien site web)

### 3. CARTE INTERACTIVE "MANA"
- [x] Types de marqueurs : Roulotte, Food truck, Événement, Bonne affaire, Woofing, Surf, Alerte, Webcam, Covoiturage
- [x] Filtres par type et région
- [x] Géolocalisation utilisateur
- [x] Bouton "Contacter" pour roulottes/vendeurs
- [x] Système de boost payant (300-1500 XPF)
- [x] Expiration automatique des marqueurs

### 4. MARKETPLACE
- [x] Création d'annonces (produits)
- [x] Catégories (bijoux, vêtements, électronique, véhicules, etc.)
- [x] Photos multiples
- [x] Contact vendeur par messagerie
- [x] Boost payant (24h en tête)
- [x] Marquer comme vendu

### 5. MESSAGERIE
- [x] Chat temps réel (WebSocket)
- [x] Conversations privées
- [x] Indicateurs de frappe ("X est en train d'écrire...")
- [x] Accusés de lecture (✓✓)
- [x] Recherche d'utilisateurs
- [x] Notifications push quand message reçu

### 6. SYSTÈME DE BOOST (Stripe)
- [x] Roulotte : 300 XPF / 8h
- [x] Bonne Affaire : 300 XPF / 8h
- [x] Woofing : 300 XPF / 24h OU 1500 XPF / 7 jours
- [x] Marketplace : 300 XPF / 24h
- [x] Paiement Stripe sécurisé
- [x] Webhook pour activation automatique du boost

### 7. MODÉRATION
- [x] Filtre mots interdits (liste locale)
- [x] Détection spam automatique
- [x] Signalement utilisateurs
- [x] (Optionnel) Modération IA avec OpenAI

### 8. NOTIFICATIONS
- [x] Push notifications (Firebase) - GRATUIT
- [x] Emails transactionnels (Resend) - GRATUIT
- [x] Banner demande permission au premier login

### 9. ADMINISTRATION
- [x] Dashboard admin (/admin/login)
- [x] Gestion des posts (supprimer, masquer)
- [x] Gestion des marqueurs Mana
- [x] Statistiques plateforme
- [x] Gestion des utilisateurs

### 10. PWA
- [x] Installable sur mobile (iOS/Android)
- [x] Service Worker pour cache
- [x] Manifest.json complet
- [x] Splash screen

### 11. TRADUCTIONS
- [x] Interface bilingue FR/Drehu
- [x] Bouton de traduction sur les posts
- [x] Préférences utilisateur

---

## 📋 VARIABLES D'ENVIRONNEMENT RENDER

### Backend (.env)
```bash
# === DATABASE ===
MONGO_URL=mongodb+srv://user:password@cluster.mongodb.net/kamo_db?retryWrites=true&w=majority
DB_NAME=kamo_db

# === SECURITY ===
JWT_SECRET=votre_secret_jwt_super_long_et_securise_minimum_32_caracteres
ADMIN_SECRET=admin_secret_pour_dashboard

# === GOOGLE OAUTH ===
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=https://votre-backend.onrender.com/api/auth/google/callback

# === STRIPE (Paiements) ===
STRIPE_API_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# === FIREBASE (Push Notifications - GRATUIT) ===
FIREBASE_SERVER_KEY=AAAA:xxxxx

# === RESEND (Emails - GRATUIT) ===
RESEND_API_KEY=re_xxxxx

# === OPENAI (Modération IA - OPTIONNEL) ===
MODERATION_AI_KEY=sk-xxxxx

# === FRONTEND URL ===
FRONTEND_URL=https://votre-frontend.onrender.com
```

### Frontend (.env)
```bash
REACT_APP_BACKEND_URL=https://votre-backend.onrender.com
```

---

## 🚀 ÉTAPES DE DÉPLOIEMENT

### 1. Créer les comptes (gratuits)
1. **MongoDB Atlas** : https://www.mongodb.com/cloud/atlas/register
   - Créer un cluster M0 (gratuit)
   - Créer un utilisateur DB
   - Whitelister IP 0.0.0.0/0
   - Récupérer la connection string

2. **Google Cloud Console** : https://console.cloud.google.com
   - Créer un projet "Kamo"
   - Activer OAuth 2.0
   - Créer des identifiants OAuth (Web Application)
   - Ajouter les URIs de redirection

3. **Stripe** : https://dashboard.stripe.com
   - Créer un compte
   - Récupérer les clés API (test puis live)
   - Configurer le webhook

4. **Firebase** (optionnel pour push) : https://console.firebase.google.com
   - Créer un projet
   - Aller dans Project Settings > Cloud Messaging
   - Récupérer la Server Key

5. **Resend** (optionnel pour emails) : https://resend.com
   - Créer un compte
   - Récupérer la clé API

### 2. Déployer sur Render
1. Connecter votre repo GitHub à Render
2. Créer un **Web Service** pour le backend (Python)
3. Créer un **Static Site** pour le frontend (React)
4. Configurer toutes les variables d'environnement
5. Déployer !

---

## ⚠️ NOTES IMPORTANTES POUR L'AGENT

1. **ZIP téléchargeable** : L'utilisateur ne peut PAS utiliser "Save to Github". 
   Toujours fournir un fichier ZIP avec les commandes PowerShell pour déployer.

2. **Même architecture que Nati Fenua** : Copier la structure exacte, juste adapter :
   - Nom : "Nati Fenua" → "Kamo"
   - Couleurs : Garder le même style mais adapter le turquoise
   - Régions : Polynésie → Nouvelle-Calédonie
   - Traductions : Tahitien → Drehu
   - RSS : Sources polynésiennes → Sources calédoniennes

3. **emergentintegrations** : Utiliser ce module pour Stripe (déjà dans requirements.txt)

4. **Tester les flux RSS** avant de livrer - certains peuvent être morts

5. **Page Média** : Ne pas oublier la page `/media/:mediaId` sans statistiques

---

## 🎯 RÉSUMÉ DE LA MISSION

Créer **Kamo**, le réseau social de la Nouvelle-Calédonie avec :
- Feed d'actualités (RSS locaux NC + posts utilisateurs)
- Carte interactive du Caillou (roulottes, événements, woofing, etc.)
- Marketplace local
- Messagerie temps réel (WebSockets)
- Système de boost payant en XPF (Stripe)
- Modération automatique
- Traductions FR/Drehu
- Notifications push (Firebase)
- Emails (Resend)
- PWA installable

**Performances identiques à Nati Fenua** - même code, même architecture, juste adapté à la Nouvelle-Calédonie.

---

**COMMENCER LE DÉVELOPPEMENT !** 🚀🇳🇨

