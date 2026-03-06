# Fenua Social - Application Mobile React Native

Le réseau social de la Polynésie Française 🌺

## Prérequis

### Pour tous les systèmes
- Node.js >= 18
- Yarn
- Git

### Pour Android
- JDK 17
- Android Studio
- Android SDK (API 34)
- Variables d'environnement configurées:
  ```bash
  export ANDROID_HOME=$HOME/Android/Sdk
  export PATH=$PATH:$ANDROID_HOME/emulator
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  ```

### Pour iOS (macOS uniquement)
- Xcode 15+
- CocoaPods
- Ruby

## Installation

```bash
# Cloner et installer les dépendances
cd /app/mobile/FenuaSocial
yarn install

# Pour iOS uniquement
cd ios && pod install && cd ..
```

## Configuration API

Modifier l'URL de l'API dans `src/services/api.ts`:
```typescript
const API_URL = 'https://votre-api.com/api';
```

## Lancer l'application

### Mode développement

```bash
# Démarrer Metro Bundler
yarn start

# Dans un autre terminal:

# Android
yarn android

# iOS
yarn ios
```

### Build de production

#### Android APK
```bash
cd android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

#### Android Bundle (Play Store)
```bash
cd android
./gradlew bundleRelease
# Bundle: android/app/build/outputs/bundle/release/app-release.aab
```

#### iOS (Archive)
```bash
cd ios
xcodebuild -workspace FenuaSocial.xcworkspace -scheme FenuaSocial -configuration Release archive
```

## Structure du projet

```
FenuaSocial/
├── android/                 # Code natif Android
├── ios/                     # Code natif iOS
├── src/
│   ├── components/          # Composants réutilisables
│   ├── contexts/            # Contextes React (Auth)
│   ├── navigation/          # Configuration navigation
│   ├── screens/             # Écrans de l'app
│   │   ├── FeedScreen.tsx
│   │   ├── ReelsScreen.tsx
│   │   ├── LiveScreen.tsx
│   │   ├── CreateScreen.tsx
│   │   ├── MarketplaceScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   └── NotificationsScreen.tsx
│   └── services/            # API services
├── App.tsx                  # Point d'entrée
└── package.json
```

## Fonctionnalités

- ✅ Feed avec stories et posts
- ✅ Reels (vidéos courtes style TikTok)
- ✅ Lives en direct
- ✅ Marketplace (produits locaux)
- ✅ Chat/Messagerie
- ✅ Profil utilisateur
- ✅ Recherche
- ✅ Notifications
- ✅ Authentification (Email + Google)

## Couleurs de la marque

- Orange: `#FF6B35`
- Pink: `#FF1493`
- Cyan: `#00CED1`
- Background: `#FFF5E6`
- Dark: `#1A1A2E`

## Dépannage

### Android - Erreur de SDK
```bash
# Accepter les licences
sdkmanager --licenses
```

### iOS - Erreur de pods
```bash
cd ios
pod deintegrate
pod install
```

### Metro - Cache
```bash
yarn start --reset-cache
```

## Publication

### Google Play Store
1. Créer un keystore de release
2. Configurer `android/gradle.properties`
3. `./gradlew bundleRelease`
4. Uploader sur Play Console

### Apple App Store
1. Configurer les certificats dans Xcode
2. Archive depuis Xcode
3. Uploader via Transporter ou Xcode

---

Développé avec ❤️ pour la Polynésie Française
