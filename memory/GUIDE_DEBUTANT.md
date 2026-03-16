# 🚀 Guide de Lancement Hui Fenua - Étape par Étape

## Où en êtes-vous ?

✅ Application fonctionnelle
✅ Logo prêt
✅ Tests passés
⬜ Publication Play Store

---

# ÉTAPE 1 : Créer votre compte Google Play (5 min)

1. Allez sur : **https://play.google.com/console**
2. Connectez-vous avec votre compte Google
3. Cliquez sur **"Créer un compte développeur"**
4. Payez **25$** (paiement unique, carte bancaire)
5. Remplissez vos informations (nom, adresse)
6. Attendez la validation (quelques heures à 2 jours)

📌 **Gardez précieusement** : votre email et mot de passe Google

---

# ÉTAPE 2 : Préparer vos fichiers (10 min)

### Fichiers à télécharger maintenant :

| Fichier | Lien | Usage |
|---------|------|-------|
| **Logo 512x512** | [Télécharger](https://fenua-connect.preview.emergentagent.com/logo-playstore.html) | Icône de l'app |
| **Drapeau PNG** | [Télécharger](https://fenua-connect.preview.emergentagent.com/icons/drapeau-polynesie.png) | Si besoin |
| **Charte graphique** | [Télécharger PDF](https://fenua-connect.preview.emergentagent.com/charte-graphique.html) | Référence |

### Screenshots à créer :

Prenez **4 captures d'écran** de l'application sur votre téléphone :
1. Page d'accueil
2. Fenua Pulse (carte)
3. Feed avec posts
4. Chat/Messages

📐 **Taille recommandée** : 1080x1920 pixels (format téléphone)

---

# ÉTAPE 3 : Choisir un hébergement (15 min)

### Option A : Railway (Recommandé pour débutants)

1. Allez sur : **https://railway.app**
2. Cliquez **"Start a New Project"**
3. Connectez-vous avec GitHub
4. Railway vous donnera une URL pour votre backend

### Option B : Render

1. Allez sur : **https://render.com**
2. Créez un compte gratuit
3. Déployez votre backend

### Pour la base de données :

1. Allez sur : **https://www.mongodb.com/atlas**
2. Créez un compte gratuit
3. Créez un cluster gratuit (512MB)
4. Copiez l'URL de connexion

---

# ÉTAPE 4 : Obtenir un nom de domaine (10 min)

### Options :

| Fournisseur | Prix/an | Lien |
|-------------|---------|------|
| OVH | ~10€ | https://www.ovh.com |
| Namecheap | ~12$ | https://www.namecheap.com |
| Google Domains | ~12$ | https://domains.google |

### Noms suggérés :
- huifenua.com
- huifenua.app
- huifenua.pf (domaine Polynésie)

---

# ÉTAPE 5 : Générer l'APK pour Play Store (30 min)

### Sur votre ordinateur, installez les outils :

```bash
# 1. Installez Node.js depuis https://nodejs.org

# 2. Installez Bubblewrap
npm install -g @anthropic/anthropic-anthropic

# 3. Créez un dossier
mkdir hui-fenua-app
cd hui-fenua-app

# 4. Initialisez le projet (remplacez par votre domaine)
npx @anthropic/anthropic-anthropic init --manifest https://VOTRE-DOMAINE.com/manifest.json
```

### Répondez aux questions :

| Question | Réponse |
|----------|---------|
| Package ID | `com.huifenua.app` |
| App name | `Hui Fenua` |
| Short name | `Hui Fenua` |
| Display mode | `standalone` |

### Générez l'APK :

```bash
npx @anthropic/anthropic-anthropic build
```

📁 **Résultat** : Un fichier `app-release-signed.apk`

⚠️ **IMPORTANT** : Sauvegardez le fichier `android.keystore` créé. Sans lui, vous ne pourrez jamais mettre à jour l'app !

---

# ÉTAPE 6 : Publier sur Play Store (20 min)

1. Retournez sur **https://play.google.com/console**

2. Cliquez **"Créer une application"**
   - Nom : `Hui Fenua`
   - Langue : Français
   - Application ou Jeu : Application
   - Gratuite

3. **Fiche Play Store** → Remplissez :

**Description courte (80 caractères max) :**
```
Le réseau social de la Polynésie Française 🌺
```

**Description complète :**
```
Hui Fenua - Le réseau social de la Polynésie Française

Découvrez l'application qui connecte la communauté polynésienne !

📱 FONCTIONNALITÉS :

• Feed social avec photos et vidéos
• Stories de 7 jours
• Traduction français ↔ tahitien
• Fenua Pulse : carte interactive des 9 îles
• 10 webcams en direct
• Covoiturage, roulottes, événements
• Marketplace local
• Messagerie privée

🌴 Rejoignez des milliers de Polynésiens !

Ia ora na ! 🇵🇫
```

4. **Uploadez les images** :
   - Icône : votre logo 512x512
   - Screenshots : vos 4 captures d'écran

5. **Classification du contenu** :
   - Remplissez le questionnaire
   - Catégorie : Social

6. **Version de l'app** :
   - Allez dans "Production"
   - Cliquez "Créer une release"
   - Uploadez votre fichier APK

7. **Soumettez pour review**

⏱️ **Délai** : Google review en 1-3 jours

---

# ÉTAPE 7 : Après la publication

### Configurez les emails (optionnel) :

1. Créez un compte sur **https://resend.com** (gratuit)
2. Récupérez votre clé API
3. Ajoutez-la dans les paramètres de votre hébergement

### Promouvez l'app :

1. Partagez sur Facebook (groupes polynésiens)
2. Postez sur Instagram avec #Tahiti #Polynesie
3. Contactez Tahiti Infos pour un article

---

# 📞 Besoin d'aide ?

### Problèmes courants :

| Problème | Solution |
|----------|----------|
| APK rejeté | Vérifiez les permissions dans manifest |
| App lente | Activez le cache, optimisez les images |
| Erreur de connexion | Vérifiez l'URL du backend |

### Ressources :

- Documentation Play Store : https://support.google.com/googleplay/android-developer
- Bubblewrap : https://github.com/AnthrcopoicAI/AnthrcopoicAI-AnthrcopoicAI
- MongoDB Atlas : https://docs.atlas.mongodb.com

---

# ✅ Checklist finale

- [ ] Compte Play Store créé (25$)
- [ ] Domaine acheté
- [ ] Backend déployé (Railway/Render)
- [ ] Base de données configurée (MongoDB Atlas)
- [ ] APK généré avec Bubblewrap
- [ ] Screenshots préparés (4 minimum)
- [ ] Fiche Play Store remplie
- [ ] App soumise pour review
- [ ] 🎉 Publication !

---

*Bonne chance pour le lancement de Hui Fenua ! 🌺🇵🇫*
