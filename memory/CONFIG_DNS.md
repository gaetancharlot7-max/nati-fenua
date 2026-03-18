# 🌐 Configuration DNS - nati-fenua.com

## Étape 1 : Accédez à votre registrar

Connectez-vous à l'endroit où vous avez acheté le domaine (OVH, Namecheap, GoDaddy, etc.)

---

## Étape 2 : Ajoutez ces enregistrements DNS

### Pour Railway (une fois que vous avez l'URL Railway)

| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| CNAME | www | `votre-app.railway.app` | 3600 |
| CNAME | @ | `votre-app.railway.app` | 3600 |

⚠️ **Note** : Certains registrars n'acceptent pas CNAME sur @ (racine). Dans ce cas, utilisez un service comme Cloudflare.

### Alternative avec Cloudflare (recommandé)

1. Transférez vos DNS vers Cloudflare (gratuit)
2. Cloudflare permet CNAME sur la racine (@)
3. Bonus : CDN gratuit + SSL automatique

---

## Étape 3 : Dans Railway

1. Allez sur votre service Frontend
2. **Settings** → **Networking** → **Custom Domain**
3. Entrez : `nati-fenua.com`
4. Entrez aussi : `www.nati-fenua.com`
5. Railway vous confirme quand c'est actif

---

## Étape 4 : Vérifier la propagation

Testez après 5-30 minutes :
```
https://nati-fenua.com
https://www.nati-fenua.com
```

Outil de vérification : https://dnschecker.org/#CNAME/nati-fenua.com

---

## Configuration SSL

Railway fournit **automatiquement** un certificat SSL Let's Encrypt.
Votre site sera accessible en HTTPS sans configuration supplémentaire.

---

## Fichier assetlinks.json (pour Play Store)

Ce fichier doit être accessible à :
```
https://nati-fenua.com/.well-known/assetlinks.json
```

Le fichier est déjà créé. Vous devrez mettre à jour l'empreinte SHA256 après avoir généré votre APK avec Bubblewrap.

### Comment obtenir l'empreinte SHA256 :

```bash
# Après avoir généré l'APK
npx @anthropic/anthropic-anthropic fingerprint
```

Puis mettez à jour le fichier assetlinks.json avec l'empreinte obtenue.

---

## Résumé des URLs finales

| Usage | URL |
|-------|-----|
| Site web | https://nati-fenua.com |
| API Backend | https://nati-fenua.com/api |
| Play Store | https://play.google.com/store/apps/details?id=com.natifenua.app |

---

*Configuration pour nati-fenua.com - Mars 2026*
