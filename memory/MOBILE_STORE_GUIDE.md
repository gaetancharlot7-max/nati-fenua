# 🌺 Nati Fenua — Compatibilité Play Store & App Store

Ce document liste tous les fichiers, configurations et étapes pour que **Nati Fenua** soit publiable sur **Google Play Store** (Android) et **Apple App Store** (iOS).

---

## ✅ Statut actuel

| Élément | Play Store | App Store |
|---|---|---|
| PWA manifest valide | ✅ `/public/manifest.json` | ✅ |
| Service Worker | ✅ `/public/service-worker.js` | ✅ |
| HTTPS prod | ✅ `nati-fenua.com` | ✅ |
| Icônes 192/384/512 + maskable | ✅ `/public/icons/` | ✅ |
| Apple touch icons (152, 167, 180) | — | ✅ `/public/icons/` |
| iOS splash screens | — | ✅ `/public/splash/` |
| `assetlinks.json` (TWA Android) | ✅ `/public/.well-known/assetlinks.json` | — |
| `apple-app-site-association` (Universal Links) | — | ✅ `/public/.well-known/apple-app-site-association` |
| Politique de confidentialité publique | ✅ `/legal` | ✅ `/legal` |
| Page suppression compte publique | ✅ `/account/delete-request` | ✅ |
| Métadonnées Open Graph | ✅ `index.html` | ✅ |

---

## 📦 GOOGLE PLAY STORE — Méthode TWA (Trusted Web Activity)

### Pourquoi TWA ?
- Pas besoin de réécrire l'app en Kotlin/Java
- Votre PWA s'exécute en plein écran (sans barre URL Chrome) dans un wrapper Android
- Les mises à jour web sont instantanées sans repasser en revue Play Store

### Étapes complètes

#### 1. Compte Google Play Console — `25 USD` paiement unique
- Créer compte : https://play.google.com/console/signup
- Valider identité (carte ID + 1-3 jours de revue Google)
- Valider numéro de téléphone via SMS

#### 2. Générer le bundle Android (AAB) via PWABuilder
1. Aller sur https://www.pwabuilder.com
2. Saisir : `https://nati-fenua.com`
3. Score PWA : doit être **> 80** (vérifier "Manifest", "Service Worker", "Security")
4. Cliquer **"Package for stores"** → **"Android"**
5. Choisir **"Trusted Web Activity"** (pas le mode "Hybrid")
6. Remplir :
   - Package name : `com.natifenua.app`
   - App name : `Nati Fenua`
   - Display mode : `Standalone`
7. Télécharger le ZIP qui contient :
   - `app-release-bundle.aab` ← celui qu'on upload sur Play Store
   - `signing.keystore` ← **À CONSERVER PRÉCIEUSEMENT** (perdu = vous ne pourrez plus mettre à jour l'app)
   - `signing-key-info.txt` ← passwords du keystore
   - **SHA-256 fingerprint** (dans le fichier `signing-key-info.txt` ou affiché sur PWABuilder)

#### 3. Mettre à jour `assetlinks.json` avec le SHA-256
```bash
# Dans /app/frontend/public/.well-known/assetlinks.json
# Remplacer "REMPLACER_PAR_VOTRE_EMPREINTE_SHA256" par la vraie empreinte
```
Push GitHub → Render redéploie → vérifier accès :
```
https://nati-fenua.com/.well-known/assetlinks.json
```

#### 4. Préparer les assets visuels Play Store

| Asset | Dimensions | Statut |
|---|---|---|
| Icône app | 512×512 PNG (alpha removed) | ✅ Existe `/icons/nati-fenua-512.png` |
| Feature graphic | 1024×500 PNG | 🔴 À créer (Canva ou Gemini) |
| Phone screenshots | min 2, idéal 8 — 1080×1920 | 🔴 À capturer |
| Tablet screenshots (optionnel) | 7" : 1024×600, 10" : 1280×800 | ⏸️ Plus tard |
| Promotional video (optionnel) | YouTube link | ⏸️ Plus tard |

#### 5. Créer la fiche Play Store
1. Play Console → **Create app**
   - Default language : `Français (France)`
   - App name : `Nati Fenua`
   - App or game : `App`
   - Free or paid : `Free`
   - Acknowledge declarations
2. Fiche store → **Main store listing**
   - Description courte / longue : voir `PLAYSTORE_LISTING.md`
   - Upload icône, feature graphic, screenshots
3. **Sécurité des données** : voir tableau dans `PLAYSTORE_LISTING.md`
4. **Cible audience** : 13+
5. **Contenu** : remplir le questionnaire (pas de violence/sexe/drogue/etc.)
6. **Publicités** : non (pour l'instant)
7. **Politique de confidentialité** : `https://nati-fenua.com/legal`
8. **URL suppression compte** : `https://nati-fenua.com/account/delete-request`

#### 6. Upload AAB & soumission revue
- **Production → Releases → Create new release**
- Upload le `.aab`
- Notes de version FR + EN
- **Save → Review → Send for review**
- ⏱️ Délai : 1-7 jours (TWA passent souvent en 24-48h)

---

## 🍎 APPLE APP STORE — Méthode Capacitor

### Pourquoi Capacitor (et pas TWA-like) ?
Apple **n'accepte pas les TWA**. Il faut un wrapper iOS natif. Capacitor (de l'équipe Ionic) est le standard pour wrap une PWA dans un projet Xcode.

### Étapes complètes

#### 1. Compte Apple Developer — `99 USD/an`
- Créer compte : https://developer.apple.com/programs/
- Valider identité (souvent 24h)
- Linker à App Store Connect

#### 2. Préparer le projet Capacitor
À faire sur un **Mac** (obligatoire pour build iOS) :
```bash
# Cloner le repo Nati Fenua
git clone https://github.com/...

# Installer Capacitor
cd frontend
yarn add @capacitor/core @capacitor/cli @capacitor/ios

# Initialiser
npx cap init "Nati Fenua" "com.natifenua.app" --web-dir=build

# Build le frontend React
yarn build

# Ajouter la plateforme iOS
npx cap add ios

# Sync les fichiers web vers le projet iOS
npx cap sync ios

# Ouvrir Xcode
npx cap open ios
```

#### 3. Configurer Capacitor (`capacitor.config.json`)
```json
{
  "appId": "com.natifenua.app",
  "appName": "Nati Fenua",
  "webDir": "build",
  "server": {
    "url": "https://nati-fenua.com",
    "cleartext": false
  },
  "ios": {
    "scheme": "Nati Fenua",
    "contentInset": "always",
    "limitsNavigationsToAppBoundDomains": false
  }
}
```

#### 4. Configurer Universal Links (iOS 9+)
- Le fichier `apple-app-site-association` est déjà créé dans `/app/frontend/public/.well-known/`
- ⚠️ Une fois votre **Team ID Apple** récupéré (depuis developer.apple.com → Account → Membership), remplacez `TEAMID` dans le fichier
- Ce fichier doit être servi avec `Content-Type: application/json` (Render le fait automatiquement)

#### 5. Préparer les assets visuels App Store

| Asset | Dimensions | Statut |
|---|---|---|
| App icon | 1024×1024 PNG (no alpha, no rounded corners) | ✅ Existe (à régénérer en 1024) |
| Screenshots iPhone 6.7" | 1290×2796 px (min 3) | 🔴 À faire |
| Screenshots iPhone 6.5" | 1242×2688 px (min 3, optionnel si 6.7" fournis) | 🔴 À faire |
| Screenshots iPhone 5.5" | 1242×2208 px (min 3) | 🔴 À faire |
| Screenshots iPad 12.9" (optionnel) | 2048×2732 px | ⏸️ |
| Promotional preview video (optionnel) | 30s max | ⏸️ |

#### 6. Permissions iOS (Info.plist)
À ajouter dans `ios/App/App/Info.plist` :
```xml
<key>NSCameraUsageDescription</key>
<string>Nati Fenua a besoin de l'appareil photo pour publier vos stories et photos.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Nati Fenua a besoin d'accès à vos photos pour les publier.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Nati Fenua utilise votre position pour afficher les annonces et événements proches.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Nati Fenua peut utiliser le microphone pour les notes vocales.</string>
```

#### 7. Build & Upload via Xcode
1. Xcode → Product → Archive
2. Window → Organizer → Distribute App → App Store Connect → Upload
3. Attendre le processing (~10-30 min)

#### 8. App Store Connect — Fiche
1. https://appstoreconnect.apple.com → **My Apps → +** → New App
   - Platform : iOS
   - Name : `Nati Fenua`
   - Primary language : Français
   - Bundle ID : `com.natifenua.app`
   - SKU : `natifenua-001`
2. **App Information** : description, mots-clés, URL support, URL marketing
3. **Pricing** : Free
4. **App Privacy** : remplir le questionnaire (similaire à Play Store)
5. **Version 1.0** : Upload screenshots + sélectionner le build uploadé via Xcode
6. **Submit for Review**
7. ⏱️ Délai : 1-3 jours en moyenne

---

## 🌐 OPTIMISATIONS COMMUNES (déjà faites ✅)

### Fichiers de routage et metadata
- ✅ `manifest.json` complet (id, name, start_url, icons maskable, shortcuts, screenshots)
- ✅ `service-worker.js` avec stratégie cache offline
- ✅ Apple touch icons (152, 167, 180)
- ✅ iOS splash screens (4 tailles)
- ✅ `theme-color`, `mobile-web-app-capable`, `apple-mobile-web-app-*` meta tags
- ✅ `viewport` avec `viewport-fit=cover` (notch iOS)
- ✅ Preconnect/dns-prefetch pour CDN images

### iOS Safari spécifique (gérés)
- ✅ Service Worker registration retardée 2s (évite blocage iOS)
- ✅ `padding: env(safe-area-inset-*)` partout (notch + home indicator)
- ✅ `font-size: 16px` sur inputs (évite zoom auto iOS)
- ✅ `-webkit-tap-highlight-color: transparent` (pas de surlignage gris)
- ✅ Cookies cross-subdomain via `COOKIE_DOMAIN=.nati-fenua.com`
- ✅ Session token dans URL fragment OAuth (compatible Safari ITP)
- ✅ React Portals pour notifications bell (évite ghost clicks iOS)

### Android spécifique (gérés)
- ✅ Manifest `display: standalone` + `orientation: portrait`
- ✅ Maskable icons (`purpose: maskable any`)
- ✅ Shortcuts manifest (raccourcis long-press icône)
- ✅ Color scheme `theme_color: #FF6B35`

---

## 📋 CHECKLIST PRÉ-SOUMISSION

### Avant Play Store
- [ ] Compte Play Console créé (25 USD payés)
- [ ] Identité validée par Google
- [ ] Domaine `nati-fenua.com` actif et stable
- [ ] PWABuilder score > 80
- [ ] AAB généré et keystore sauvegardé
- [ ] `assetlinks.json` avec SHA-256 réel pushé en prod
- [ ] Feature graphic 1024×500 créé
- [ ] 4-8 screenshots téléphone capturés
- [ ] Description FR + EN finalisée
- [ ] `app-ads.txt` (pas nécessaire si pas de pub)
- [ ] Soumission revue → délai 1-7 jours

### Avant App Store
- [ ] Compte Apple Developer (99 USD/an payés)
- [ ] Mac disponible avec Xcode 15+
- [ ] Capacitor configuré
- [ ] Team ID inséré dans `apple-app-site-association`
- [ ] Certificat de distribution + provisioning profile
- [ ] Permissions Info.plist configurées
- [ ] Build archivé + uploadé via Xcode
- [ ] Screenshots iPhone (6.7" + 5.5" min)
- [ ] Description FR finalisée
- [ ] Privacy policy URL valide
- [ ] Soumission revue → délai 1-3 jours

---

## 🛠️ COMMANDES UTILES

### Tester l'éligibilité PWA
```bash
# Lighthouse depuis Chrome DevTools
# DevTools → Lighthouse → "Progressive Web App" → Generate report
# Doit être à 100/100
```

### Vérifier `assetlinks.json` après push
```bash
curl https://nati-fenua.com/.well-known/assetlinks.json | jq
# Doit retourner du JSON valide avec votre SHA-256
```

### Vérifier `apple-app-site-association` après push
```bash
curl -H "Accept: application/json" https://nati-fenua.com/.well-known/apple-app-site-association
# Doit retourner du JSON valide
```

### Bouger le manifest depuis le navigateur
```js
// Dans Chrome DevTools Console sur nati-fenua.com
fetch('/manifest.json').then(r => r.json()).then(console.log)
```

---

## 💡 BONNES PRATIQUES (lessons learned)

1. **NE JAMAIS perdre le keystore Android** — sauvegarder dans 3 endroits différents (Drive, Dropbox, USB chiffré). Sans lui, vous ne pourrez plus pousser de mises à jour de l'app.

2. **Tester d'abord en internal testing** avant production — Play Store et App Store ont tous deux un canal "Internal" ou "TestFlight" pour tester avec 100-1000 utilisateurs avant lancement public.

3. **Préparer une vidéo de présentation** — Apple et Google adorent. Augmente le taux de conversion de 30%.

4. **Localiser** — proposer la fiche en FR + EN minimum. Pour la Polynésie, ajouter aussi `fr-PF` (français Polynésie) en métadonnées.

5. **App Review** : être proactif si rejet — répondre dans les 24h avec un correctif clair.

---

🌺 **Mauruuru et bonne chance pour le lancement !**
