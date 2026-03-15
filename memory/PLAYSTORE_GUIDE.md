# Guide de Publication Play Store - Hui Fenua

## Prérequis pour le Play Store

### 1. Compte Google Play Console
- **Frais d'inscription** : 25$ (paiement unique)
- **URL** : https://play.google.com/console
- Vérification d'identité requise

### 2. Méthode de Publication : TWA (Trusted Web Activity)

L'application Hui Fenua est une PWA (Progressive Web App) complète. Pour la publier sur le Play Store, nous utilisons une TWA qui encapsule la PWA dans une application Android native.

---

## Étapes de Publication

### Étape 1 : Préparer les Assets

#### Icônes requises (déjà configurées dans manifest.json)
- 72x72 px
- 96x96 px
- 128x128 px
- 144x144 px
- 192x192 px
- 384x384 px
- 512x512 px (obligatoire pour Play Store)

#### Screenshots (à créer)
- **Téléphone** : Au moins 2 captures, 1080x1920 px
- **Tablette** : Au moins 1 capture, 2048x2732 px (optionnel)

#### Feature Graphic
- 1024x500 px (bannière promotionnelle)

### Étape 2 : Générer l'APK avec Bubblewrap

```bash
# Installer Bubblewrap (outil Google pour TWA)
npm install -g @anthropic/bubblewrap-cli

# Initialiser le projet TWA
bubblewrap init --manifest https://huifenua.com/manifest.json

# Générer l'APK signé
bubblewrap build
```

#### Configuration bubblewrap (twa-manifest.json)
```json
{
  "packageId": "com.huifenua.app",
  "host": "huifenua.com",
  "name": "Hui Fenua",
  "launcherName": "Hui Fenua",
  "display": "standalone",
  "themeColor": "#FF6B35",
  "navigationColor": "#1A1A2E",
  "backgroundColor": "#1A1A2E",
  "enableNotifications": true,
  "startUrl": "/",
  "iconUrl": "https://huifenua.com/icons/icon-512x512.png",
  "splashScreenFadeOutDuration": 300,
  "signingKey": {
    "path": "./android.keystore",
    "alias": "huifenua"
  },
  "appVersionCode": 1,
  "appVersionName": "1.0.0",
  "shortcuts": [
    {
      "name": "Fenua Pulse",
      "url": "/pulse",
      "icons": ["/icons/pulse.png"]
    },
    {
      "name": "Messages",
      "url": "/chat",
      "icons": ["/icons/chat.png"]
    }
  ],
  "webManifestUrl": "https://huifenua.com/manifest.json"
}
```

### Étape 3 : Signer l'Application

```bash
# Créer une clé de signature (à conserver précieusement!)
keytool -genkey -v -keystore android.keystore -alias huifenua -keyalg RSA -keysize 2048 -validity 10000

# Informations à fournir :
# - Nom et prénom
# - Unité organisationnelle
# - Organisation
# - Ville
# - État/Province
# - Code pays (FR)
```

**IMPORTANT** : Conservez le fichier `android.keystore` et le mot de passe en lieu sûr. Vous en aurez besoin pour chaque mise à jour.

### Étape 4 : Configuration Digital Asset Links

Pour que la TWA fonctionne correctement, vous devez prouver que vous êtes propriétaire du domaine.

1. Générez le fichier assetlinks.json :
```bash
bubblewrap fingerprint
```

2. Placez le fichier sur votre serveur :
```
https://huifenua.com/.well-known/assetlinks.json
```

Contenu du fichier :
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.huifenua.app",
    "sha256_cert_fingerprints": [
      "VOTRE_EMPREINTE_SHA256"
    ]
  }
}]
```

### Étape 5 : Publication sur Play Console

1. **Créer l'application**
   - Nom : Hui Fenua
   - Langue par défaut : Français
   - Type : Application
   - Gratuit

2. **Fiche Play Store**
   - **Titre** : Hui Fenua
   - **Description courte** (80 car) : Le réseau social de la Polynésie Française
   - **Description complète** (voir ci-dessous)
   - **Catégorie** : Social
   - **Tags** : social, polynésie, tahiti, communauté

3. **Description complète** :
```
Hui Fenua - Le réseau social de la Polynésie Française

Découvrez Hui Fenua, l'application qui connecte la communauté tahitienne à travers le monde !

FONCTIONNALITÉS :

📱 FEED SOCIAL
- Partagez photos et vidéos
- Stories qui durent 7 jours
- Réactions et commentaires
- Traduction français ↔ tahitien

🗺️ FENUA PULSE
- Carte interactive de 9 îles
- 10 webcams en direct
- Signalez en temps réel : roulottes, surf, événements, covoiturage
- Gagnez des points Mana

🚚 ROULOTTES & MARCHÉ
- Trouvez les meilleures roulottes
- Marketplace local
- Contactez directement les vendeurs

💬 MESSAGERIE
- Chat privé
- Conversations depuis Fenua Pulse

🌺 COMMUNAUTÉ LOCALE
- Conçu pour les Polynésiens
- Interface en français
- Dictionnaire tahitien intégré

Rejoignez des milliers de Polynésiens sur Hui Fenua !

Ia ora na ! 🌴
```

4. **Contenus**
   - Classement du contenu : Teen (ou approprié)
   - Politique de confidentialité : URL requise

5. **Prix et disponibilité**
   - Gratuit
   - Pays : Tous (ou France, USA, Nouvelle-Zélande pour cibler la diaspora)

---

## Checklist avant Publication

- [ ] Domaine vérifié (assetlinks.json)
- [ ] Icônes 512x512 avec fond transparent
- [ ] Screenshots téléphone (min 2)
- [ ] Feature graphic 1024x500
- [ ] Description complète en français
- [ ] Politique de confidentialité en ligne
- [ ] APK/AAB signé et testé
- [ ] Compte développeur vérifié

---

## Commandes Utiles

```bash
# Tester l'APK localement
adb install app-release.apk

# Vérifier le manifest
aapt dump badging app-release.apk

# Générer un AAB (Android App Bundle) - préféré par Google
bubblewrap build --aab
```

---

## Coûts Estimés

| Élément | Coût |
|---------|------|
| Compte Play Console | 25$ (unique) |
| Domaine (si besoin) | ~12$/an |
| Hébergement PWA | Variable |
| **Total démarrage** | **~40$** |

---

## Timeline de Publication

1. **Jour 1** : Créer compte Play Console, préparer assets
2. **Jour 2** : Générer APK avec Bubblewrap, configurer assetlinks
3. **Jour 3** : Remplir fiche Play Store, soumettre
4. **Jour 4-7** : Review Google (généralement 1-3 jours)
5. **Jour 7+** : Publication !

---

## Support

Pour toute question technique :
- Documentation Bubblewrap : https://github.com/AnthrcopoicAI/AnthrcopoicAI-AnthrcopoicAI/AnthrcopoicAI-AnthrcopoicAI
- Documentation TWA : https://developers.google.com/web/android/trusted-web-activity

---

*Document créé le 14 Mars 2026*
*Hui Fenua v1.0.0*
