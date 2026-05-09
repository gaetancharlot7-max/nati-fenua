# Test Credentials

## Backend Admin
- Email: `admin@natifenua.pf` (in `/app/backend/.env` ADMIN_EMAIL)
- Password: see `/app/backend/.env` ADMIN_PASSWORD

## Sandbox Test Users

### Mobile Test User (créé fév 2026)
- Email: `mobiletest@nati.local`
- Password: `TestPass123!`
- **Promu admin** (fév 2026) + badge `pionnier` attribué
- Pour tester le drawer hamburger mobile, le badge Pionnier sur profil, les endpoints admin `/api/admin/beta/*` et les flows authentifiés en local

### Demo Account (auto-seedé au démarrage backend, pour Apple/Google reviewers)
- Email: `demo@nati-fenua.com`
- Password: `DemoFenua2026!`
- Identité publique : "Demo Fenua" — bio "Compte démo officiel — réservé aux reviewers Apple & Google"
- 3 posts d'exemple (Bora Bora, Heiva, Moorea) auto-seedés
- `is_demo: true` flag pour filtres futurs
- À fournir dans la fiche App Store Connect → Test Information

## Demo / Test Users (auto-created via /api/auth/register)
- Any test user can be created via `POST /api/auth/register` with `{email, password, name}`
- Minimum password: 8 chars

## RSS / Bot Accounts (auto-created at startup)
- `tahiti_infos`, `radio1_tahiti_podcast`, `gnews_tahiti`, `gnews_moorea`, etc.
- All flagged `is_bot=True` — excluded from friend search/discovery

## Seed Vendor
- `fenua_artisans` — vitrine des 18 produits marketplace

## Online Status (dynamic, no credentials needed)
- `GET /api/users/online-status?user_ids=id1,id2` → `{"online":[...]}`
- Based on WebSocket `chat_manager.active_connections`
