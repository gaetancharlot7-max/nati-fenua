# Nati Fenua — PRD

## Original Problem
Application sociale polynésienne (web + PWA) avec : feed RSS médias locaux, chat, carte Mana, marketplace, AI admin assistant. Compatibilité iOS Safari critique.

## Architecture
- **Backend**: FastAPI + MongoDB + Redis cache (`/app/backend/server.py`, `audit_engine.py`, `ai_agent_v2.py`).
- **Frontend**: React + Tailwind + Leaflet + PWA (`/app/frontend/src/`).
- **Deploy**: Render via GitHub push (`gaetancharlot7-max/nati-fenua`).

## Recently Implemented
- 2026-04-25: Fix bug "rien ne se passe au clic sur posts vidéos/articles". Cause = projection MongoDB du smart feed `/api/posts` excluait les champs `external_link`, `link_type`, `link_title`, `link_source`, `thumbnail_url`, `reactions`, `is_rss_article`. Ajoutés à la projection (server.py L1715, L1744). Retrait du `onClick={window.open}` redondant dans FeedPage.js et FeedPageOptimized.js (cause de double-navigation/popup bloqué sur iOS Safari).
- Round 2 fixes (auto-healing comments count, seed 8 produits polynésiens, modal privacy, images cassées, label Amis).
- iOS Safari : Notification API guards, Bearer tokens forcés, cookie banner slim, PWA SW v4.
- AI Agent admin (audit_engine.py custom).
- Dark/Light toggle, Map auto-fit, RSS clickable links.

## Pending / Roadmap
- **P0**: User à pousser sur GitHub (bouton "Save to GitHub" Emergent) pour déployer sur Render.
- **P1**: Analytics tracking (vues, clics, temps passé sur articles/posts) → bubble up contenu populaire.
- **Backlog**: Refactoring `seed_data.py` et migrations server.py (becoming heavy).

## Key APIs
- `GET /api/posts?limit=20&cursor=...` → smart feed (user + RSS mix)
- `GET /api/posts/fresh?limit=20&seen_ids=...`
- `POST /api/posts/{id}/comments`
- `POST /api/posts/{id}/translate`
- `GET /api/news/latest`

## Critical Notes
- iOS Safari: éviter `target="_blank"` + `window.open` simultanés (popup bloqué).
- Toujours inclure `external_link, link_type, link_title, link_source, thumbnail_url, reactions, is_rss_article` dans toute projection MongoDB de posts.
- DB stocke `external_link` (nouveau) ET `article_url` (legacy null).
