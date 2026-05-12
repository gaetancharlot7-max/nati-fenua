# Guide complet — Publier Nati Fenua sur l'App Store (sans Mac perso)

Ce guide te permet de publier l'app iOS de Nati Fenua sans posséder de Mac.
Tu utiliseras **MacInCloud** (~30 USD pour 1 mois) qui te suffira pour faire le build + l'upload initial.

## 📋 Pré-requis

- ✅ Compte Apple Developer (99 USD/an) — https://developer.apple.com/programs/
- ✅ Identité Apple validée (24-48h)
- ✅ Site web `nati-fenua.com` en ligne et fonctionnel (PWA installable)
- ✅ Carte bancaire pour MacInCloud (~30 USD)

## ⏱️ Temps total estimé

- Setup MacInCloud : 30 min
- Configuration Capacitor : 1h
- Build + upload Xcode : 1h
- Soumission Apple Review : 30 min
- **Total ~3-4h de travail actif**, puis Apple répond en 24-72h

---

## 🛠️ Étape 1 — Louer un Mac à distance via MacInCloud

1. Va sur https://www.macincloud.com
2. Choisis le plan **Managed Server — Pay-As-You-Go** (~30 USD pour 50h)
3. Crée ton compte, paie
4. Tu reçois par email :
   - L'adresse RDP de ton Mac à distance
   - Identifiants de connexion
5. Télécharge **Microsoft Remote Desktop** sur Windows ou **Royal TSX** sur Linux
6. Connecte-toi au Mac à distance

## 🛠️ Étape 2 — Sur le Mac à distance, installer les outils

Ouvre le **Terminal** macOS et lance :

```bash
# Installer Xcode (déjà préinstallé sur MacInCloud normalement)
# Vérifier
xcode-select --version

# Installer Homebrew si absent
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installer Node.js 20 LTS
brew install node@20
node --version  # doit afficher v20.x

# Installer Yarn
brew install yarn

# Installer CocoaPods (requis par Capacitor iOS)
sudo gem install cocoapods
pod --version
```

## 🛠️ Étape 3 — Cloner et builder Nati Fenua

```bash
cd ~/Desktop
git clone https://github.com/TON-COMPTE/nati-fenua.git
cd nati-fenua/frontend
yarn install
```

## 🛠️ Étape 4 — Installer Capacitor

```bash
cd ~/Desktop/nati-fenua/frontend
yarn add @capacitor/core @capacitor/cli @capacitor/ios
```

Crée le fichier `capacitor.config.ts` à la racine de `frontend/` :

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.natifenua.app',
  appName: 'Nati Fenua',
  // Mode: charge depuis le site web déployé (méthode TWA-like, le plus simple)
  server: {
    url: 'https://nati-fenua.com',
    cleartext: false,
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#1A1A2E'
  }
};

export default config;
```

Initialise et ajoute la plateforme iOS :

```bash
npx cap init "Nati Fenua" "com.natifenua.app" --web-dir=build
yarn build              # build de l'app React (au cas où la connexion au serveur échoue)
npx cap add ios
npx cap sync ios
```

## 🛠️ Étape 5 — Ouvrir le projet dans Xcode

```bash
npx cap open ios
```

Xcode s'ouvre avec ton projet. Effectue ces réglages :

### 5.1 — Sélectionner ton équipe Apple
- Clique sur **Nati Fenua** (icône bleue) dans le navigateur de gauche
- Onglet **Signing & Capabilities**
- **Team** : choisis ton équipe Apple Developer
- **Bundle Identifier** : `com.natifenua.app`

### 5.2 — Permissions Info.plist
Dans **Info.plist**, ajoute :

| Clé | Valeur |
|---|---|
| `NSCameraUsageDescription` | Nati Fenua utilise l'appareil photo pour publier vos photos et changer votre photo de profil |
| `NSPhotoLibraryUsageDescription` | Nati Fenua accède à vos photos pour publier sur le feed et changer votre profil |
| `NSLocationWhenInUseUsageDescription` | Nati Fenua utilise votre position pour afficher la carte Mana et les événements à proximité |
| `NSMicrophoneUsageDescription` | Nati Fenua utilise le micro pour les messages vocaux dans le chat |

### 5.3 — Universal Links
- Onglet **Signing & Capabilities** → **+ Capability** → **Associated Domains**
- Ajoute : `applinks:nati-fenua.com`

Tu auras besoin de ton **Team ID** (10 caractères) pour mettre à jour `/app/frontend/public/.well-known/apple-app-site-association` :

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TON_TEAM_ID.com.natifenua.app",
        "paths": ["*"]
      }
    ]
  }
}
```

Remplace `TON_TEAM_ID` par celui affiché dans Apple Developer Portal → Membership.

### 5.4 — Build et tester sur simulateur
- Choisis **iPhone 15 Pro Max** comme simulateur en haut
- Clique sur ▶️ (bouton Play)
- L'app doit s'ouvrir sur le simulateur et charger nati-fenua.com

## 🛠️ Étape 6 — Archive et upload App Store Connect

### 6.1 — Créer l'app sur App Store Connect
1. Va sur https://appstoreconnect.apple.com
2. **My Apps** → **+** → **New App**
3. Renseigne :
   - Platform : iOS
   - Name : **Nati Fenua**
   - Primary Language : Français
   - Bundle ID : `com.natifenua.app`
   - SKU : `natifenua-001`

### 6.2 — Archive dans Xcode
- Choisis **Any iOS Device (arm64)** en haut (pas un simulateur)
- Menu **Product** → **Archive**
- Attendre 5-15 min selon ton Mac
- Le Organizer s'ouvre automatiquement
- Clique **Distribute App** → **App Store Connect** → **Upload**
- Suis les étapes (signing automatique)

### 6.3 — Compléter la fiche App Store Connect
Une fois le build uploadé (apparition dans App Store Connect ~30 min) :

| Section | Contenu |
|---|---|
| **App Information** | Catégorie : Réseaux sociaux. Content Rating : 12+ |
| **Pricing** | Free |
| **App Privacy** | Renseigne ce qui est collecté (email, nom, localisation optionnelle, photos uploadées) |
| **Test Information** | Email : `demo@nati-fenua.com` / Password : `DemoFenua2026!` |
| **Notes for Apple Review** | "L'app utilise un compte démo prérempli. Vous pouvez aussi cliquer 'Continuer en invité' sur la landing pour voir le feed sans inscription." |
| **Screenshots iPhone 6.7"** | Upload depuis `/app/frontend/public/store-assets/appstore/` |
| **Description** | (voir `/app/memory/PLAYSTORE_LISTING.md`, adapter en gardant le ton) |
| **Keywords** | Polynésie, Tahiti, Fenua, réseau social, marketplace, mana |
| **Support URL** | https://nati-fenua.com/legal |
| **Marketing URL** | https://nati-fenua.com |

### 6.4 — Soumettre pour Review
- Clique **Add for Review** → **Submit to App Review**
- Apple répond en 24-72h

## 🚨 Pièges fréquents à éviter

1. **❌ Refus "5.1.1 — needs guest mode"** → Mais on a déjà `/preview` 🎉 ! Précise dans Review Notes : "Tap 'Découvrir sans s'inscrire' on landing"
2. **❌ Refus "2.1 — missing demo account"** → Renseigne `demo@nati-fenua.com / DemoFenua2026!`
3. **❌ Refus "4.0 — minimum functionality"** → L'app ne doit pas être qu'une simple webview. Ajoute au moins une feature native (push notifications, partage natif) avant soumission si Apple chipote
4. **❌ Permissions sans description** → Toutes les permissions Info.plist DOIVENT avoir une description en français claire
5. **❌ Bundle ID conflict** → Vérifie qu'il est unique dans Apple Developer Portal

## 💰 Coût total

| Item | Prix |
|---|---|
| Apple Developer (1 an) | 99 USD |
| MacInCloud (1 mois) | ~30 USD |
| **Total** | **~130 USD** |

Une fois publié, tu pourras pousser des mises à jour depuis n'importe où — pas besoin de re-louer un Mac (sauf si tu changes la version native).

## 🎯 Alternative gratuite

Si tu connais quelqu'un avec un Mac, demande-lui de te prêter 1h pour faire les étapes 5-6.
Ou utilise le **Mac d'un FabLab / coworking** (Tahiti en a plusieurs).

---

## ❓ Support

- Apple Developer Support : https://developer.apple.com/support/
- Capacitor Docs : https://capacitorjs.com/docs/ios
- Stack Overflow `[capacitor-ios]` tag

Bon vent ! 🌺
