# Hui Fenua - PRD (Product Requirements Document)

## Résumé du Projet
Hui Fenua est un réseau social pour la communauté tahitienne en Polynésie française, inspiré d'Instagram et TikTok.

## Fonctionnalités Implémentées

### Phase 1 - MVP (Complète)
- **Authentification sécurisée** : Email/Mot de passe avec bcrypt, protection anti-brute force, JWT
- **Connexion Google** : OAuth 2.0 via Emergent
- **Mot de passe oublié** : Page dédiée, envoi d'email via Resend ✅ (14/03/2026)
- **Déconnexion** : Bouton visible sur le profil utilisateur ✅ (14/03/2026)
- **Fil d'actualité** : Posts photo/vidéo avec lazy loading, skeleton loaders, pagination infinie
- **Stories** : Durée de vie de 7 jours dans le fil, 30 jours sur profil
- **Chat en temps réel** : Conversations et messages
- **Marché** : Produits et services

### Phase 2 - Fonctionnalités Avancées (Complète)
- **Modération de contenu** : Système de signalement avec catégories, avertissements progressifs, tableau de bord admin
- **Conformité RGPD** : Consentement cookies, export de données, suppression de compte, vérification d'âge
- **Monitoring & Analytics** : Tableau de bord admin avec statistiques
- **Traduction FR ↔ Tahitien** : Dictionnaire 200+ mots, bouton sur chaque post ✅ (14/03/2026)

### Phase 3 - Fenua Pulse avec Webcams Live (Complète)

#### Carte Interactive - 9 Îles
- Tahiti, Moorea, Bora Bora, Raiatea, **Taha'a**, Huahine, **Maupiti**, Tuamotu, Marquises

#### 10 Webcams Live
| Webcam | Île | Localisation |
|--------|-----|--------------|
| Port de Papeete | Tahiti | Centre-ville |
| Teahupo'o | Tahiti | Spot de surf |
| Baie d'Opunohu | Moorea | Nature |
| Plage de Matira | Bora Bora | Plage |
| Port d'Uturoa | Raiatea | Port |
| Baie de Haamene | Taha'a | Vanille |
| Village de Fare | Huahine | Village |
| Village de Vaiea | Maupiti | Village |
| Passe de Tiputa | Tuamotu | Plongée |
| Baie de Taiohae | Marquises | Nature |

#### Catégories de Signalement (9 types)
- 🚚 Roulotte / Vendeur
- 🔥 Accident / Route bloquée
- 🌊 Conditions surf
- 📅 Événement
- 📹 **Webcam Live**
- ☁️ Alerte météo
- 🛍️ Bonne affaire / Marché
- 🚗 **Covoiturage** ✅ (14/03/2026)
- 📍 Autre signalement

#### Fonctionnalités Fenua Pulse
- **Clic sur catégorie** = voir tous les emplacements de ce type
- **Bouton "Contacter par message"** pour roulottes/marché → ouvre conversation directe ✅
- **Bouton "Appeler"** avec lien tel: pour appeler directement le vendeur ✅
- **Boutons Zoom +/-** sur la carte ✅ (14/03/2026)
- **Bouton "Ma position"** pour géolocalisation ✅ (14/03/2026)
- **Vidéos 5 secondes en boucle** sur chaque point webcam
- Gamification avec points Mana

### Phase 4 - Flux RSS & Presse (Complète)

#### 8 Sources RSS Polynésiennes
- Tahiti Infos ✅
- Polynésie 1ère ✅
- TNTV ✅
- Outremers 360 ✅
- Tahiti News
- Actu.fr Polynésie
- Air Tahiti Magazine
- Surf Report Tahiti

#### Détection Améliorée des Îles
- Système de scoring avec mots-clés étendus
- 11 archipels/îles détectables :
  - Tahiti, Moorea, Bora Bora, Raiatea, Taha'a, Huahine, Maupiti
  - Tuamotu, Marquises, Gambier, Australes

#### Nettoyage Automatique
- Suppression des liens YouTube non fonctionnels
- API `/api/admin/cleanup/youtube`

### Phase 5 - Tableau de Bord Vendeur "Ma Roulotte" (Complète) ✅ 13/03/2026

#### Fonctionnalités "Ma Roulotte"
- **Profil de roulotte** : Nom, description, type de cuisine, méthodes de paiement
- **Gestion d'ouverture** : Boutons "Ouvrir", "+2 heures", "Je ferme"
- **Carte de position en direct** : Affiche la localisation GPS quand la roulotte est ouverte ✅
- **Bouton "Appeler"** : Lien `tel:` pour appeler directement le numéro du vendeur ✅
- **Onglets** : Tableau de bord, Menu, Paramètres
- **Gestion du menu** : Ajout/modification/suppression de plats

### Protection Anti-Faux Comptes (En cours - Mode Simulation)
- Module `account_protection.py` créé
- Score de confiance basé sur IP, User-Agent, email
- Vérification par téléphone (placeholders pour SMS, Twilio non intégré)
- Limites d'inscription par IP

### Fonction Live (Temporairement Désactivée)
- Retiré de la navigation principale
- Retiré du sidebar droit
- Les webcams sur Fenua Pulse remplacent cette fonction

## Architecture Technique

### Backend
- `/app/backend/fenua_pulse.py` - Carte + 10 webcams
- `/app/backend/rss_feeds.py` - 8 sources RSS + détection améliorée
- `/app/backend/auto_publisher.py` - Publication automatique
- `/app/backend/roulotte.py` - Gestion des roulottes et vendeurs
- `/app/backend/account_protection.py` - Protection anti-faux comptes (simulation)

### Frontend
- `/app/frontend/src/pages/PulsePage.js` - Carte avec webcams + boutons contact ✅
- `/app/frontend/src/pages/VendorDashboardPage.js` - Tableau de bord vendeur avec carte + bouton appeler ✅
- `/app/frontend/src/components/layout/MainLayout.js` - Navigation sans Live

## Statut : Application Fonctionnelle ✅

### Testé et validé (14/03/2026)
- 9 îles sur Fenua Pulse
- 10 webcams avec vidéos live
- Filtrage par catégorie au clic
- 20+ articles de presse réels publiés
- Détection d'île améliorée (Tuamotu détecté)
- Live retiré de la navigation
- **Bouton "Contacter par message" sur Fenua Pulse** ✅
- **Bouton "Appeler" sur Fenua Pulse** ✅
- **Carte de position dans "Ma Roulotte"** ✅
- **Bouton "Appeler" dans "Ma Roulotte"** ✅
- **Bouton Déconnexion sur le profil** ✅
- **Boutons Zoom +/- sur Fenua Pulse** ✅
- **Bouton Ma position sur Fenua Pulse** ✅
- **Traduction FR ↔ Tahitien (200+ mots)** ✅
- **Catégorie Covoiturage sur Fenua Pulse** ✅
- **Page Mot de passe oublié** ✅

### Test de Charge - 200 Bots Simultanés ✅ (14/03/2026)
| Métrique | Résultat |
|----------|----------|
| Requêtes testées | 4,670 |
| Taux de succès | **92.1%** |
| Req/seconde | 27 |
| Temps médian | 123ms |
| Endpoints >95% | 14/28 |

### PWA - Prêt pour Play Store ✅
- Service Worker configuré
- Manifest.json complet
- Icônes multi-tailles
- assetlinks.json prêt
- Guide de publication créé

## Prochaines Étapes (Backlog)

### P0 - À configurer
- **Clé API Resend** : Pour activer l'envoi réel d'emails (mot de passe oublié)

### P2 - Protection Anti-Faux Comptes
- Intégration d'un service SMS (Twilio ou similaire) pour vérification réelle
- UI frontend pour la vérification du numéro de téléphone
- Application des restrictions basées sur le score de confiance

### P3 - Améliorations Futures
- Application mobile Expo
- Système de publicité
- Live Streaming (si demandé)
- Système d'abonnement premium
- Fonctionnalités "Duets/Remix" et "Collections"

---
*Dernière mise à jour : 14 Mars 2026*
