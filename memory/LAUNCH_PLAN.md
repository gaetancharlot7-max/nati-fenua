# Plan de Lancement - Hui Fenua

## 1. Résumé du Projet

**Hui Fenua** - Le réseau social de la Polynésie Française
- Application web PWA (Progressive Web App)
- Cible : Polynésiens locaux et diaspora mondiale
- Fonctionnalités : Feed social, Stories, Fenua Pulse (carte), Marketplace, Chat

---

## 2. Budget et Coûts

### Coûts de lancement (One-time)

| Élément | Coût | Notes |
|---------|------|-------|
| Google Play Console | 25$ | Paiement unique |
| Apple Developer | 99$/an | Optionnel pour iOS |
| Nom de domaine | 12$/an | huifenua.com ou .pf |
| **Total lancement** | **~40$** | Sans iOS |

### Coûts mensuels (Exploitation)

| Service | Gratuit | Payant | Notes |
|---------|---------|--------|-------|
| **Hébergement** | | | |
| - MongoDB Atlas | 0$ (512MB) | 9$/mois (2GB) | Base de données |
| - Railway/Render | 0$ (limité) | 5-20$/mois | Backend |
| - Vercel/Netlify | 0$ | 20$/mois | Frontend |
| **Emails** | | | |
| - Resend | 0$ (3000/mois) | 20$/mois | Transactionnel |
| **Stockage médias** | | | |
| - Cloudinary | 0$ (25GB) | 89$/mois | Images/Vidéos |
| **Total mensuel** | **0$** | **~50-150$/mois** | Selon trafic |

### Estimation par nombre d'utilisateurs

| Utilisateurs | Coût mensuel estimé |
|--------------|---------------------|
| 0 - 1,000 | 0$ (gratuit) |
| 1,000 - 5,000 | 20-50$/mois |
| 5,000 - 20,000 | 50-150$/mois |
| 20,000+ | 150-500$/mois |

---

## 3. Timeline de Lancement

### Phase 1 : Préparation (Semaine 1)
- [ ] Finaliser les tests de l'application
- [ ] Créer les comptes (Play Store, hébergement)
- [ ] Préparer les assets (screenshots, descriptions)
- [ ] Configurer le domaine

### Phase 2 : Déploiement (Semaine 2)
- [ ] Déployer le backend sur Railway/Render
- [ ] Déployer le frontend sur Vercel
- [ ] Configurer MongoDB Atlas
- [ ] Configurer les emails (Resend)
- [ ] Tester en production

### Phase 3 : Publication (Semaine 3)
- [ ] Générer l'APK avec Bubblewrap (TWA)
- [ ] Soumettre sur Google Play Store
- [ ] Attendre la review (1-3 jours)
- [ ] Publication !

### Phase 4 : Lancement Marketing (Semaine 4)
- [ ] Annonce sur les réseaux sociaux
- [ ] Contact médias locaux (Tahiti Infos, TNTV)
- [ ] Partenariats influenceurs polynésiens

---

## 4. Flux RSS à Intégrer

### Actualités Polynésie

| Source | URL RSS | Catégorie |
|--------|---------|-----------|
| Tahiti Infos | https://www.tahiti-infos.com/xml/syndication.rss | Actualités |
| La Dépêche de Tahiti | https://www.ladepeche.pf/feed/ | Actualités |
| TNTV | https://www.tntv.pf/feed/ | Actualités/Vidéos |
| Radio 1 | https://www.radio1.pf/feed/ | Actualités |
| Polynésie 1ère | https://la1ere.francetvinfo.fr/polynesie/rss | Actualités |

### Sport & Culture

| Source | URL RSS | Catégorie |
|--------|---------|-----------|
| Surf Report Tahiti | À rechercher | Surf |
| Fédération Tahitienne de Va'a | À rechercher | Pirogue |

### Météo

| Source | API | Usage |
|--------|-----|-------|
| Météo France Polynésie | API publique | Alertes météo |
| Windy | API gratuite | Conditions surf |

---

## 5. Checklist Pré-Lancement

### Technique
- [x] Application fonctionnelle
- [x] Tests de charge passés (200 utilisateurs)
- [x] PWA configurée (manifest, service worker)
- [x] Logo et icônes prêts
- [ ] Domaine configuré
- [ ] SSL/HTTPS actif
- [ ] Base de données en production
- [ ] Sauvegardes automatiques

### Légal
- [ ] Mentions légales
- [ ] Politique de confidentialité (RGPD)
- [ ] CGU (Conditions Générales d'Utilisation)
- [ ] Déclaration CNIL (si applicable)

### Contenu
- [x] 20+ articles de presse intégrés
- [x] 10 webcams Fenua Pulse
- [x] Dictionnaire tahitien (200+ mots)
- [ ] Comptes utilisateurs de test supprimés
- [ ] Contenu de démonstration nettoyé

### Play Store
- [x] Icône 512x512
- [x] Feature Graphic 1024x500
- [ ] Screenshots (min 2)
- [ ] Description courte (80 caractères)
- [ ] Description longue
- [ ] Catégorie : Social
- [ ] Classification du contenu

---

## 6. Stratégie Marketing

### Cibles prioritaires

1. **Polynésiens locaux (Tahiti, Moorea)**
   - Facebook groups polynésiens
   - Partenariats roulottes/commerces locaux

2. **Diaspora (France, Nouvelle-Zélande, USA)**
   - Associations polynésiennes
   - Événements culturels (Heiva)

3. **Touristes et amoureux de la Polynésie**
   - Hashtags Instagram/TikTok
   - Blogs voyage

### Canaux de promotion

| Canal | Action | Coût |
|-------|--------|------|
| Facebook | Groupes polynésiens | Gratuit |
| Instagram | Posts + Reels | Gratuit |
| TikTok | Vidéos courtes | Gratuit |
| Radio locale | Interview | Gratuit/Payant |
| Presse locale | Communiqué | Gratuit |
| Influenceurs | Partenariats | Variable |

### Messages clés

- "Le réseau social 100% polynésien"
- "Fenua Pulse : La carte live de nos îles"
- "Trouvez les meilleures roulottes"
- "Connectez-vous avec la communauté"

---

## 7. Métriques de Succès

### KPIs à suivre

| Métrique | Objectif Mois 1 | Objectif Mois 6 |
|----------|-----------------|-----------------|
| Téléchargements | 500 | 5,000 |
| Utilisateurs actifs/jour | 100 | 1,000 |
| Posts créés | 200 | 5,000 |
| Note Play Store | 4.0+ | 4.5+ |

### Outils de suivi
- Google Analytics (trafic web)
- Play Console (téléchargements Android)
- Tableau de bord admin (métriques internes)

---

## 8. Support et Maintenance

### Support utilisateurs
- Email : support@huifenua.com
- Page FAQ dans l'application
- Réponse sous 24-48h

### Maintenance technique
- Mises à jour de sécurité : mensuel
- Nouvelles fonctionnalités : trimestriel
- Sauvegardes : quotidien

---

## 9. Risques et Mitigation

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Serveurs surchargés | Moyenne | Élevé | Auto-scaling, CDN |
| Contenu inapproprié | Élevée | Moyen | Modération, signalement |
| Peu d'adoption | Moyenne | Élevé | Marketing ciblé |
| Concurrence | Faible | Moyen | Fonctionnalités locales uniques |

---

## 10. Contacts Utiles

### Médias Polynésie
- Tahiti Infos : redaction@tahiti-infos.com
- TNTV : contact@tntv.pf
- Polynésie 1ère : polynesie@francetv.fr

### Partenaires potentiels
- Office du Tourisme de Polynésie
- Chambre de Commerce de Polynésie
- Associations culturelles

---

*Document créé le 16 Mars 2026*
*Hui Fenua v1.0.0*
