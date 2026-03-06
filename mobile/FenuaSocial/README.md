# Fenua Social - Application Mobile React Native

## 📱 Description
Application mobile native pour Fenua Social, le réseau social de la Polynésie Française.

## 🚀 Prérequis

### Pour le développement
- Node.js 18+
- Yarn
- React Native CLI
- Xcode (pour iOS - Mac uniquement)
- Android Studio (pour Android)

### Comptes développeur (pour publication)
- **Apple Developer Program**: $99/an - https://developer.apple.com
- **Google Play Console**: $25 (une fois) - https://play.google.com/console

## 📦 Installation

```bash
# Cloner le projet
cd /app/mobile/FenuaSocial

# Installer les dépendances
yarn install

# iOS uniquement - installer les pods
cd ios && pod install && cd ..
```

## 🏃 Lancer l'application

### Mode développement

```bash
# Android
yarn android

# iOS (Mac uniquement)
yarn ios

# Metro bundler
yarn start
```

### Build de production

#### Android (APK/AAB)
```bash
cd android
./gradlew assembleRelease      # APK
./gradlew bundleRelease        # AAB pour Play Store
```
L'APK sera dans: `android/app/build/outputs/apk/release/`

#### iOS (IPA)
1. Ouvrir `ios/FenuaSocial.xcworkspace` dans Xcode
2. Sélectionner "Any iOS Device"
3. Product > Archive
4. Distribute App > App Store Connect

## 📲 Publication sur les stores

### Google Play Store
1. Créer un compte sur https://play.google.com/console ($25)
2. Créer une nouvelle application
3. Remplir les informations (description, captures d'écran)
4. Uploader le fichier .aab
5. Soumettre pour révision

### Apple App Store
1. S'inscrire à Apple Developer Program ($99/an)
2. Créer l'app sur App Store Connect
3. Configurer les métadonnées (description, captures)
4. Uploader via Xcode ou Transporter
5. Soumettre pour révision Apple

## 🔧 Configuration

### Variables d'environnement
Créer un fichier `.env`:
```
API_URL=https://votre-api.com/api
```

### Firebase (Notifications Push)
1. Créer un projet sur https://console.firebase.google.com
2. Ajouter les apps iOS et Android
3. Télécharger `google-services.json` (Android) et `GoogleService-Info.plist` (iOS)
4. Placer les fichiers dans les dossiers respectifs

## 📁 Structure du projet

```
FenuaSocial/
├── App.tsx                 # Point d'entrée
├── src/
│   ├── contexts/          # Context API (Auth)
│   ├── navigation/        # React Navigation
│   ├── screens/           # Écrans de l'app
│   ├── components/        # Composants réutilisables
│   ├── services/          # API et services
│   └── assets/            # Images, fonts
├── android/               # Code natif Android
├── ios/                   # Code natif iOS
└── package.json
```

## ✨ Fonctionnalités

- ✅ Authentification (Email + OAuth)
- ✅ Feed avec posts et réactions
- ✅ Stories éphémères
- ✅ Reels (vidéos courtes)
- ✅ Lives en direct
- ✅ Messagerie privée
- ✅ Marketplace local
- ✅ Notifications push
- ✅ Mode hors ligne (PWA)

## 🎨 Design System

### Couleurs
- Orange: `#FF6B35`
- Pink: `#FF1493`
- Cyan: `#00CED1`
- Purple: `#9400D3`
- Gold: `#FFD700`
- Dark: `#1A1A2E`

### Fonts
- Outfit (Regular, Medium, SemiBold, Bold, ExtraBold)

## 📞 Support

Pour toute question: support@fenuasocial.pf

---
Fait avec ❤️ en Polynésie Française
