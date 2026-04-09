# Nati Fenua - Product Requirements Document

## Original Problem Statement
Application de réseau social polynésien avec flux RSS réels, webcams en direct, authentification Google OAuth, messagerie temps réel, système publicitaire en Francs Pacifiques (XPF), et notifications push.

## Last Update: 9 Avril 2025

### Recent Changes (Session actuelle)
- ✅ **Logo personnalisé v2 intégré** - SVG avec "N" stylisé et drapeau polynésien
- ✅ **Slogan turquoise** - "Le seul réseau qui nous ressemble" 
- ✅ **Landing Page nettoyée** - Retiré musique et "Reels/Vidéos"
- ✅ **Messagerie améliorée** - Menu 3 points fonctionnel avec suppression de conversation
- ✅ **Profil corrigé** - Filtrage des posts RSS, clic vers post, navigation
- ✅ **Stories complètes** - Visualisation modal + suppression pour propriétaire
- ✅ **Mana corrigé** - Suppression signalement par propriétaire, votes fonctionnels
- ✅ **Amis corrigé** - Rechargement des compteurs après follow/unfollow
- ✅ **Image paréo** - Nouvelle image pour le marketplace

### Core Features Implemented
1. **Authentification** - Google OAuth + JWT custom
2. **Fil d'actualité** - Posts, réactions, commentaires, partage
3. **Stories** - Création, visualisation 24h, suppression
4. **Messagerie** - Chat temps réel WebSocket, emojis, images
5. **Marketplace** - Produits, services, paiements XPF
6. **Mana (Carte)** - Signalements, webcams, roulottes, woofing
7. **Système de Boost** - Paiements Stripe en XPF
8. **Notifications** - Sons polynésiens, badges non-lus
9. **Admin** - Dashboard modération, analytics

### API Endpoints Ajoutés
- `DELETE /api/conversations/{id}` - Supprimer une conversation
- `DELETE /api/stories/{id}` - Supprimer une story
- `DELETE /api/pulse/markers/{id}` - Supprimer un signalement Mana

### Technical Stack
- **Frontend**: React 18, TailwindCSS, Framer Motion, Shadcn/UI
- **Backend**: FastAPI, Motor (MongoDB async)
- **Database**: MongoDB Atlas
- **Auth**: Google OAuth + JWT
- **Payments**: Stripe (via emergentintegrations)
- **Hosting**: Render

### Files Modified This Session
- `/app/frontend/src/pages/LandingPage.js` - Logo, slogan, nettoyage
- `/app/frontend/src/pages/ChatPage.js` - Menu suppression conversation
- `/app/frontend/src/pages/ProfilePage.js` - Filtrage posts, navigation
- `/app/frontend/src/pages/FeedPage.js` - StoryItem avec modal viewer
- `/app/frontend/src/pages/ManaPage.js` - Suppression signalements
- `/app/frontend/src/lib/api.js` - Nouvelles méthodes delete
- `/app/backend/server.py` - Endpoints delete

### Upcoming Tasks (P1)
- Configuration clés API production (Stripe Live, Firebase, Resend)
- Lancement beta privée 50 testeurs

### Future Tasks (P2/P3)
- Application mobile Expo
- Stories temporaires améliorées
- Thème sombre complet
- Refactoring server.py (>7000 lignes)

### Known Issues
- Webcams peuvent être bloquées par certains navigateurs (bouton "Ouvrir dans nouvel onglet" disponible)
- Push notifications et emails attendent les clés API sur Render
