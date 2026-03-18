# 🚀 Guide de Déploiement Nati Fenua - Étape par Étape

## Vous avez déjà :
- ✅ Compte Google Developer
- ✅ Logos prêts
- ✅ Nom de domaine

---

# ÉTAPE 1 : Créer un compte Railway (5 min)

1. Allez sur **https://railway.app**
2. Cliquez **"Start a New Project"**
3. Choisissez **"Login with GitHub"**
4. Autorisez Railway

📌 Railway offre **5$/mois de crédits gratuits**

---

# ÉTAPE 2 : Préparer le code pour le déploiement

### Télécharger le code source

Je vais créer un fichier ZIP avec tout le code. Mais d'abord, vous devez :

1. **Créer un compte GitHub** (si pas déjà fait) : https://github.com
2. **Créer un nouveau repository** nommé `nati-fenua`

---

# ÉTAPE 3 : Configurer Railway

### A. Créer le projet Backend

1. Dans Railway, cliquez **"New Project"**
2. Choisissez **"Deploy from GitHub repo"**
3. Sélectionnez votre repo `nati-fenua`
4. Railway détecte automatiquement Python

### B. Variables d'environnement Backend

Dans Railway → votre service → **Variables**, ajoutez :

```
MONGO_URL = (voir étape 4)
DB_NAME = natifenua
JWT_SECRET = GenerezUneLongueChaineAleatoire123456789
CORS_ORIGINS = https://votre-domaine.com
```

### C. Créer le service Frontend

1. Cliquez **"New Service"** → **"GitHub Repo"**
2. Sélectionnez le même repo
3. Dans **Settings** → **Root Directory** : `/frontend`

### D. Variables d'environnement Frontend

```
REACT_APP_BACKEND_URL = https://votre-backend.railway.app
```

---

# ÉTAPE 4 : Configurer MongoDB Atlas (gratuit)

1. Allez sur **https://www.mongodb.com/atlas**
2. Créez un compte gratuit
3. Cliquez **"Build a Database"**
4. Choisissez **M0 FREE** (gratuit)
5. Région : **Paris (eu-west)** ou la plus proche
6. Nom du cluster : `natifenua-cluster`

### Créer un utilisateur database

1. **Database Access** → **Add New Database User**
2. Username : `natifenua_admin`
3. Password : générez un mot de passe fort (notez-le !)
4. Rôle : **Read and write to any database**

### Autoriser les connexions

1. **Network Access** → **Add IP Address**
2. Cliquez **"Allow Access from Anywhere"** (0.0.0.0/0)

### Récupérer l'URL de connexion

1. **Database** → **Connect** → **Connect your application**
2. Copiez l'URL qui ressemble à :
```
mongodb+srv://natifenua_admin:VOTRE_MOT_DE_PASSE@natifenua-cluster.xxxxx.mongodb.net/natifenua
```
3. Remplacez `<password>` par votre vrai mot de passe
4. Ajoutez cette URL dans Railway (variable `MONGO_URL`)

---

# ÉTAPE 5 : Connecter votre domaine

### Dans Railway

1. Allez sur votre service **Frontend**
2. **Settings** → **Networking** → **Custom Domain**
3. Entrez votre domaine : `natifenua.com` (ou votre domaine)
4. Railway vous donne un enregistrement CNAME

### Chez votre registrar (OVH, Namecheap, etc.)

Ajoutez ces enregistrements DNS :

| Type | Nom | Valeur |
|------|-----|--------|
| CNAME | www | votre-app.railway.app |
| CNAME | @ | votre-app.railway.app |

⏱️ Propagation DNS : 5 min à 48h

---

# ÉTAPE 6 : Générer l'APK Play Store (30 min)

### Sur votre ordinateur

1. **Installez Node.js** : https://nodejs.org (version LTS)

2. **Ouvrez un terminal** et tapez :

```bash
# Installer Bubblewrap
npm install -g @anthropic/anthropic-anthropic

# Créer un dossier
mkdir nati-fenua-app
cd nati-fenua-app

# Initialiser (remplacez par votre domaine)
npx @anthropic/anthropic-anthropic init --manifest https://VOTRE-DOMAINE.com/manifest.json
```

3. **Répondez aux questions** :

| Question | Votre réponse |
|----------|---------------|
| Package ID | `com.natifenua.app` |
| App name | `Nati Fenua` |
| Short name | `Nati Fenua` |
| Host | `VOTRE-DOMAINE.com` |
| Start URL | `/` |
| Theme color | `#FF6B35` |
| Background | `#1A1A2E` |
| Display | `standalone` |

4. **Générer l'APK** :

```bash
npx @anthropic/anthropic-anthropic build
```

📁 Résultat : `app-release-signed.apk`

⚠️ **IMPORTANT** : Sauvegardez le fichier `android.keystore` ! Sans lui, impossible de mettre à jour l'app.

---

# ÉTAPE 7 : Publier sur Play Store (20 min)

1. Allez sur **https://play.google.com/console**

2. **Créer une application**
   - Nom : `Nati Fenua`
   - Langue : Français
   - Type : Application
   - Gratuite

3. **Fiche Play Store**

**Description courte** (80 car max) :
```
Le réseau social de la Polynésie Française 🌺
```

**Description complète** :
```
Nati Fenua - Le réseau social de la Polynésie Française

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

4. **Uploadez vos fichiers**
   - Icône 512x512 (votre logo N)
   - Screenshots (4 minimum)
   - Feature graphic

5. **Production** → **Releases** → **Create new release**
   - Uploadez votre APK
   - Ajoutez les notes de version

6. **Soumettez pour review**

⏱️ Review Google : 1-7 jours

---

# ✅ Checklist finale

- [ ] Railway configuré
- [ ] MongoDB Atlas connecté
- [ ] Domaine lié à Railway
- [ ] APK généré avec Bubblewrap
- [ ] android.keystore sauvegardé
- [ ] Screenshots préparés
- [ ] Fiche Play Store remplie
- [ ] App soumise

---

# 📊 Après le lancement

### Surveiller les métriques
- **Railway** : CPU, RAM, logs
- **MongoDB Atlas** : Performance DB
- **Play Console** : Téléchargements, notes

### Coûts mensuels estimés
| Utilisateurs | Coût total |
|--------------|------------|
| 0-500 | 0-5$/mois |
| 500-2000 | 15-25$/mois |
| 2000-10000 | 40-70$/mois |

---

# 🆘 Besoin d'aide ?

- Documentation Railway : https://docs.railway.app
- MongoDB Atlas : https://docs.atlas.mongodb.com
- Play Console : https://support.google.com/googleplay/android-developer

---

*Bonne chance pour le lancement de Nati Fenua ! 🌺🇵🇫*
