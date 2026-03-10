# Hui Fenua - Product Requirements Document

## Overview
Application réseau social pour la communauté polynésienne de Polynésie française, inspirée d'Instagram et TikTok.

## Core Features

### Authentication
- ✅ Email/Password registration and login (bcrypt hashing)
- ✅ Google Social Login 
- ⚠️ Facebook Login (URL callback configuration needed)
- ✅ Brute-force protection (5 attempts limit)
- ✅ Rate limiting (100 requests/minute)
- ✅ JWT session management
- ✅ "Logout from all devices" feature

### Main Features
- ✅ Social feed with posts (photos, videos, links)
- ✅ Stories (24h expiration)
- ✅ Real-time chat
- ✅ Marketplace (Marché)
- ✅ User profiles with privacy settings
- ✅ Content sharing
- 🔄 Live streaming (UI only, WebRTC pending)

### FENUA PULSE (NEW - March 2025)
Interactive real-time map of French Polynesia showing what's happening now.

#### Map Features
- ✅ Interactive map centered on Tahiti (Leaflet.js + OpenStreetMap)
- ✅ Quick navigation to islands (Tahiti, Moorea, Bora Bora, Huahine, Raiatea, Marquises, Tuamotu)
- ✅ Color-coded markers by type:
  - 🟠 Orange: Roulottes/vendors
  - 🔴 Red: Accidents/road closures
  - 🔵 Blue: Surf conditions
  - 🟢 Green: Events
  - 🟣 Purple: Live streams
  - ⚪ Gray: Weather alerts
- ✅ Filter buttons to show/hide marker types
- ✅ "Near me" button with GPS location
- ✅ Auto-expiration after 4 hours

#### Roulotte/Vendor System
- ✅ Special vendor profiles
- ✅ "I'm open now" button with real-time map visibility
- ✅ Menu management with prices (XPF)
- ✅ Review system (1-5 stars)
- ✅ "Coup de cœur du Fenua" badge for 4.5+ ratings
- ✅ Subscriber notifications when vendor opens
- ✅ Payment methods (Cash, Card, Bank Transfer, Fenua Tokens)

#### Community Reporting
- ✅ Quick report creation (30 seconds max)
- ✅ Community validation ("C'est vrai!" / "Faux")
- ✅ Auto-hide after 3 denials
- ✅ "Verified" badge after 5 confirmations
- ✅ Pulse status indicator (calm/normal/busy/exceptional)

#### Gamification (Mana Points)
- ✅ Mana rewards for contributions
- ✅ Badge system (Explorateur, Gardien, Gourmet, Surfeur, etc.)
- ✅ Weekly leaderboard by island
- ✅ Mana spending for boosts and rewards

### Performance Optimizations
- ✅ Lazy loading for images/videos
- ✅ Skeleton loaders during loading
- ✅ Infinite scroll pagination (10 posts at a time)
- ✅ Adaptive video quality (360p/720p/1080p based on connection)
- ✅ Offline mode banner
- ✅ Local caching for profiles

### Content Moderation
- ✅ Report button on all content
- ✅ Report categories (Inappropriate, Harassment, Spam, Misinformation, Copyright)
- ✅ Progressive warning system (warning → 7-day suspension → ban)
- ✅ Admin moderation dashboard

### GDPR Compliance
- ✅ Cookie consent banner
- ✅ Age verification (13+ required, 16+ for no parental consent)
- ✅ Consent management
- ✅ Data export (ZIP download)
- ✅ Account deletion (30-day grace period)
- ✅ Privacy policy and Terms of Service pages

### Admin Dashboard
- ✅ User management
- ✅ Content moderation
- ✅ Analytics (users, content, geography by island)
- ✅ System monitoring (DB status, API response time, storage)
- ✅ Storage management
- ✅ Advertising system (disabled/mocked)

## Tech Stack
- **Backend**: FastAPI, Python, MongoDB
- **Frontend**: React.js, TailwindCSS, Framer Motion
- **Maps**: Leaflet.js with OpenStreetMap
- **Auth**: bcrypt, JWT
- **Mobile**: Expo (React Native) - pending verification

## API Endpoints

### Fenua Pulse
- `GET /api/pulse/islands` - Get island list with coordinates
- `GET /api/pulse/marker-types` - Get marker type definitions
- `GET /api/pulse/status` - Get current pulse status
- `GET /api/pulse/markers` - Get active markers (with filters)
- `POST /api/pulse/markers` - Create new marker
- `POST /api/pulse/markers/{id}/confirm` - Confirm/deny marker
- `GET /api/pulse/leaderboard` - Get weekly leaderboard
- `GET /api/pulse/mana` - Get user mana balance
- `GET /api/pulse/badges/me` - Get user badges

### Roulotte/Vendor
- `GET /api/roulotte/cuisine-types` - Get cuisine type list
- `GET /api/roulotte/payment-methods` - Get payment methods
- `POST /api/roulotte/profile` - Create/update vendor profile
- `GET /api/roulotte/profile/me` - Get own vendor profile
- `POST /api/roulotte/open` - Signal roulotte is open
- `POST /api/roulotte/close` - Signal roulotte is closed
- `POST /api/roulotte/menu` - Add menu item
- `POST /api/roulotte/{id}/review` - Add review
- `POST /api/roulotte/{id}/subscribe` - Subscribe to roulotte

## Pending Tasks (P0-P3)

### P1 - High Priority
- Fix Facebook Login callback URL configuration
- Implement Live Streaming with WebRTC

### P2 - Medium Priority
- Live content moderation system
- Complete advertising system

### P3 - Low Priority
- Verify Expo mobile app functionality
- Clarify story lifetime rules (24h vs 3d+30d)

## Future/Backlog
- Duets/Remix features
- Collections
- Premium subscriptions for creators
- App Store / Play Store publishing
- Enhanced real-time chat
- Push notifications

## File Structure
```
/app/
├── backend/
│   ├── server.py           # Main FastAPI app
│   ├── auth_security.py    # Security utilities
│   ├── media_processing.py # Media compression
│   ├── moderation.py       # Content moderation
│   ├── gdpr.py            # GDPR compliance
│   ├── analytics.py       # Analytics & monitoring
│   ├── fenua_pulse.py     # Fenua Pulse service
│   └── roulotte.py        # Vendor/roulotte service
├── frontend/src/
│   ├── pages/
│   │   ├── PulsePage.js       # Fenua Pulse map
│   │   ├── VendorDashboardPage.js # Vendor dashboard
│   │   ├── AdminAnalyticsPage.js
│   │   ├── AdminMonitoringPage.js
│   │   └── GDPRSettingsPage.js
│   ├── components/
│   │   ├── SkeletonLoader.js
│   │   ├── LazyImage.js
│   │   └── CookieBanner.js
│   └── hooks/
│       └── useInfiniteScroll.js
└── mobile/
    └── FenuaSocial/  # Expo project (needs renaming to HuiFenua)
```

---
Last updated: March 10, 2025
