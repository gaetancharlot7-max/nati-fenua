# Test Credentials — Nati Fenua

## Production Admin (sandbox + prod)
- **Admin**: `admin@natifenua.pf` / `NatiFenua2025!`
  - Login: `POST /api/admin/login` → returns `{success, token}` (use as `Authorization: Bearer <token>`)

## Demo User Account (Apple App Review compliant)
- **Demo**: `demo@nati-fenua.com` / `DemoFenua2026!`
  - Used for Apple App Review (Guideline 2.1) and Google Play store listing
  - `is_demo=true`, `is_email_verified=true`
  - Pre-seeded with 3 posts (Bora Bora, Heiva, Moorea Belvédère)
  - `referral_code=32ZTFSAR`

## 10 Beta Tester Accounts (generated Feb 2026)
All with password: `Test1234@`
- teiva.mauri@gmail.com
- (9 others — created by `/tmp/create_test_accounts.py`)

## Mobile drawer test account
- `mobiletest@nati.local` / `TestPass123!`

## Notes
- Admin auth uses `verify_admin_token(request)` reading `Authorization: Bearer <admin_token>`
- User auth uses `require_auth(request)` reading session cookie or `Authorization: Bearer <session_token>`
- Two different token types — do NOT mix them
