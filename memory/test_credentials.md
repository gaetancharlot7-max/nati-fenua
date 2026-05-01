# Test Credentials

## Backend Admin
- Email: `admin@natifenua.pf` (in `/app/backend/.env` ADMIN_EMAIL)
- Password: see `/app/backend/.env` ADMIN_PASSWORD

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
