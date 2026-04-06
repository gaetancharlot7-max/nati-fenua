# 📱 CHECKLIST PUBLICATION APP STORES
## Google Play Store & Apple App Store

---

# PRÉREQUIS GÉNÉRAUX

## ✅ Comptes développeur à créer

| Store | Frais | Lien |
|-------|-------|------|
| **Google Play Console** | 25$ (une fois) | https://play.google.com/console |
| **Apple Developer Program** | 99$/an | https://developer.apple.com/programs |

---

# PARTIE 1 : GOOGLE PLAY STORE

## 📋 Checklist complète

### 1. Compte Google Play Console
- [ ] Créer un compte Google dédié (nati.fenua.app@gmail.com)
- [ ] S'inscrire sur Google Play Console (25$ une fois)
- [ ] Vérifier l'identité (carte d'identité)
- [ ] Configurer le profil développeur

### 2. Préparer l'application
- [ ] Convertir le PWA en APK avec **PWABuilder** (https://pwabuilder.com)
  ```
  1. Aller sur pwabuilder.com
  2. Entrer l'URL: https://nati-fenua.com
  3. Cliquer "Package for stores"
  4. Télécharger l'APK Android
  ```
- [ ] OU créer une app native avec **Expo/React Native**
- [ ] Générer la clé de signature (keystore)
- [ ] Tester sur plusieurs appareils Android

### 3. Assets graphiques requis
- [ ] **Icône app** : 512x512 px (PNG, 32-bit)
- [ ] **Feature graphic** : 1024x500 px (bannière promotionnelle)
- [ ] **Screenshots** : minimum 2, max 8
  - Téléphone : 1080x1920 px (ou 16:9)
  - Tablette 7" : 1200x1920 px
  - Tablette 10" : 1600x2560 px
- [ ] **Vidéo promo** (optionnel) : YouTube URL

### 4. Informations à fournir
- [ ] **Nom de l'app** : Nati Fenua (max 30 caractères)
- [ ] **Description courte** : 80 caractères max
  ```
  Le réseau social polynésien - Actualités, carte interactive & marketplace
  ```
- [ ] **Description longue** : 4000 caractères max
- [ ] **Catégorie** : Social
- [ ] **Tags** : polynésie, tahiti, réseau social, actualités, marketplace
- [ ] **Email de contact** : support@nati-fenua.com
- [ ] **Politique de confidentialité** : URL obligatoire
- [ ] **Conditions d'utilisation** : URL recommandée

### 5. Questionnaire de conformité
- [ ] Remplir le questionnaire de contenu
- [ ] Déclarer les permissions utilisées (caméra, localisation, etc.)
- [ ] Déclarer les achats in-app (boosts Stripe)
- [ ] Data Safety form (RGPD)

### 6. Publication
- [ ] Choisir les pays : France, Polynésie française
- [ ] Prix : Gratuit
- [ ] Soumettre pour review (2-7 jours)

---

# PARTIE 2 : APPLE APP STORE

## 📋 Checklist complète

### 1. Compte Apple Developer
- [ ] Créer un Apple ID dédié
- [ ] S'inscrire au Apple Developer Program (99$/an)
- [ ] Si entreprise : certificat D-U-N-S requis
- [ ] Accepter les contrats dans App Store Connect

### 2. Préparer l'application
- [ ] Convertir avec **PWABuilder** pour iOS
  ```
  1. pwabuilder.com → Package for iOS
  2. Télécharger le projet Xcode
  3. Ouvrir dans Xcode (Mac requis)
  4. Build & Archive
  ```
- [ ] OU créer une app native avec **Expo/React Native**
- [ ] Certificat de distribution Apple
- [ ] Provisioning profile
- [ ] Tester sur TestFlight

### 3. Assets graphiques requis
- [ ] **Icône app** : 1024x1024 px (PNG, sans transparence)
- [ ] **Screenshots iPhone** :
  - iPhone 6.7" : 1290x2796 px
  - iPhone 6.5" : 1284x2778 px
  - iPhone 5.5" : 1242x2208 px
- [ ] **Screenshots iPad** (si supporté) :
  - iPad Pro 12.9" : 2048x2732 px
- [ ] **App Preview Video** (optionnel) : 15-30 sec

### 4. Informations à fournir
- [ ] **Nom** : Nati Fenua (30 caractères max)
- [ ] **Sous-titre** : 30 caractères max
  ```
  Le réseau social du Fenua
  ```
- [ ] **Description** : 4000 caractères max
- [ ] **Mots-clés** : 100 caractères max (séparés par virgules)
  ```
  polynésie,tahiti,réseau social,actualités,marketplace,fenua
  ```
- [ ] **Catégorie principale** : Social Networking
- [ ] **Catégorie secondaire** : Lifestyle
- [ ] **URL support** : https://nati-fenua.com/support
- [ ] **URL marketing** : https://nati-fenua.com
- [ ] **Politique de confidentialité** : URL obligatoire

### 5. App Privacy (obligatoire depuis iOS 14)
- [ ] Déclarer toutes les données collectées
- [ ] Types : Identifiants, Localisation, Contacts, etc.
- [ ] Usage : Analytics, Publicité, Fonctionnalités app

### 6. Review Guidelines
- [ ] Pas de contenu interdit
- [ ] Achats in-app via Apple Pay (30% commission Apple)
- [ ] Login avec Apple si login social proposé
- [ ] Compte de test pour les reviewers

### 7. Publication
- [ ] Soumettre via App Store Connect
- [ ] Review : 24h - 7 jours
- [ ] Répondre aux rejets éventuels

---

# PARTIE 3 : STRIPE - CONFIGURATION PAIEMENTS

## Liens Stripe

| Page | URL |
|------|-----|
| **Dashboard** | https://dashboard.stripe.com |
| **Clés API** | https://dashboard.stripe.com/apikeys |
| **Webhooks** | https://dashboard.stripe.com/webhooks |
| **Produits** | https://dashboard.stripe.com/products |
| **Paiements** | https://dashboard.stripe.com/payments |

## Configuration pour les stores

### Pour Google Play
- [ ] Stripe fonctionne directement ✅
- [ ] Pas de commission Google sur Stripe

### Pour Apple App Store
⚠️ **ATTENTION** : Apple exige Apple Pay pour les achats in-app
- [ ] Option 1 : Utiliser Apple Pay (30% commission)
- [ ] Option 2 : Rediriger vers le site web pour payer
- [ ] Option 3 : Les boosts sont des "consommables numériques" = Apple Pay obligatoire

---

# PARTIE 4 : ASSETS À PRÉPARER

## Icônes

```
/icons/
├── icon-1024x1024.png    (App Store)
├── icon-512x512.png      (Play Store)
├── icon-192x192.png      (PWA)
├── icon-180x180.png      (Apple Touch)
└── icon-72x72.png        (Android Legacy)
```

## Screenshots à capturer

1. **Page d'accueil / Feed**
2. **Carte Mana** (marqueurs visibles)
3. **Marketplace**
4. **Chat / Messagerie**
5. **Profil utilisateur**
6. **Page de connexion**

## Textes marketing

### Description courte (80 car.)
```
Le réseau social polynésien - Actualités, carte interactive & marketplace
```

### Description longue
```
🌺 NATI FENUA - Le réseau social 100% polynésien

Rejoignez la communauté du Fenua ! Nati Fenua est l'application qui connecte 
tous les Polynésiens autour de leurs passions et de leur quotidien.

✨ FONCTIONNALITÉS :

📰 ACTUALITÉS LOCALES
- Suivez l'actu de Tahiti Infos, TNTV, Polynésie 1ère
- Publications de la communauté
- Partagez vos moments

🗺️ CARTE MANA
- Trouvez les roulottes près de chez vous
- Spots de surf en temps réel
- Événements et bons plans
- Woofing et covoiturage

🛒 MARKETPLACE
- Achetez et vendez localement
- Contactez les vendeurs directement
- Boostez vos annonces

💬 MESSAGERIE
- Chat en temps réel
- Partagez photos et vidéos
- Notifications instantanées

🌴 PAR ET POUR LES POLYNÉSIENS
- Interface en Français et Tahitien
- Adapté à la vie locale
- Respectueux de la culture du Fenua

Téléchargez Nati Fenua et rejoignez votre communauté !

Ia ora na ! 🌺
```

---

# TIMELINE RECOMMANDÉE

| Semaine | Action |
|---------|--------|
| S1 | Créer comptes développeur (Google + Apple) |
| S1 | Préparer tous les assets graphiques |
| S2 | Générer APK/IPA avec PWABuilder |
| S2 | Tester sur appareils réels |
| S3 | Soumettre sur Google Play |
| S3 | Soumettre sur App Store |
| S4 | Répondre aux reviews si rejet |
| S5 | Publication live ! 🎉 |

---

# COÛTS RÉCAPITULATIFS

| Élément | Coût |
|---------|------|
| Google Play Console | 25$ (une fois) |
| Apple Developer Program | 99$/an |
| Mac pour Xcode (si pas déjà) | ~1000€ ou location cloud |
| **Total année 1** | **~150€** |

---

*Document Nati Fenua - Checklist App Stores*
*Avril 2026*
