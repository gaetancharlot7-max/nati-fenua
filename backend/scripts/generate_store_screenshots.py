"""Auto-capture Play Store / App Store screenshots in correct dimensions.

Captures 8 key pages as logged-in demo user.
Outputs:
  - /app/frontend/public/store-assets/playstore/  (1080x2400 — Android phone)
  - /app/frontend/public/store-assets/appstore/   (1290x2796 — iPhone 6.7")

Run:
  python3 /app/backend/scripts/generate_store_screenshots.py
"""
import asyncio
import os
import sys
from pathlib import Path
from playwright.async_api import async_playwright

BASE = os.environ.get("PREVIEW_URL", "https://fenua-chat-debug.preview.emergentagent.com")
DEMO_EMAIL = "demo@nati-fenua.com"
DEMO_PASSWORD = "DemoFenua2026!"

OUT_PLAYSTORE = Path("/app/frontend/public/store-assets/playstore")
OUT_APPSTORE = Path("/app/frontend/public/store-assets/appstore")
OUT_PLAYSTORE.mkdir(parents=True, exist_ok=True)
OUT_APPSTORE.mkdir(parents=True, exist_ok=True)

PAGES = [
    ("01-feed", "/feed", "Feed actualités"),
    ("02-mana", "/mana", "Carte Mana"),
    ("03-marketplace", "/marketplace", "Marketplace"),
    ("04-friends", "/friends", "Amis"),
    ("05-profile", "/profile", "Profil"),
    ("06-chat", "/chat", "Messages"),
    ("07-create", "/create", "Créer un post"),
    ("08-beta", "/beta-test", "Programme Pionniers")
]

VIEWPORTS = {
    "playstore": {"width": 1080, "height": 2400, "device_scale_factor": 1, "out": OUT_PLAYSTORE},
    "appstore": {"width": 1290, "height": 2796, "device_scale_factor": 1, "out": OUT_APPSTORE}
}


async def login_and_capture(playwright, store_name: str, vp: dict):
    browser = await playwright.chromium.launch(args=["--no-sandbox", "--disable-gpu"])
    context = await browser.new_context(
        viewport={"width": vp["width"], "height": vp["height"]},
        device_scale_factor=vp["device_scale_factor"],
        user_agent=("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/123.0 Mobile Safari/537.36")
        if store_name == "playstore" else
        ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 "
         "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")
    )
    page = await context.new_page()

    # Login
    print(f"\n[{store_name}] Logging in as demo...")
    await page.goto(f"{BASE}/auth", wait_until="domcontentloaded", timeout=30000)
    await page.evaluate("localStorage.setItem('nati_fenua_onboarding_seen', '1')")
    await page.evaluate("localStorage.setItem('cookie-consent', '{\"accepted\":true}')")
    await page.fill('input[type="email"]', DEMO_EMAIL)
    await page.fill('input[type="password"]', DEMO_PASSWORD)
    await page.click('button[type="submit"]', force=True)
    await page.wait_for_timeout(3500)

    # Dismiss cookie banner if present
    try:
        accept = await page.query_selector('button:has-text("Accepter")')
        if accept:
            await accept.click(force=True)
            await page.wait_for_timeout(500)
    except Exception:
        pass

    out_dir = vp["out"]
    for slug, route, label in PAGES:
        try:
            print(f"  → {label} ({route})")
            # Use load instead of domcontentloaded to avoid ERR_ABORTED when
            # multiple background fetches are in-flight from the previous page.
            try:
                await page.goto(f"{BASE}{route}", wait_until="load", timeout=20000)
            except Exception:
                # Retry with networkidle on abort
                await page.wait_for_timeout(1000)
                await page.goto(f"{BASE}{route}", wait_until="commit", timeout=15000)
            await page.wait_for_timeout(3000)
            try:
                await page.wait_for_function("!document.querySelector('[data-loading=\"true\"]')", timeout=2000)
            except Exception:
                pass
            await page.screenshot(path=str(out_dir / f"{slug}.png"), full_page=False)
        except Exception as e:
            print(f"  ⚠️  Failed {label}: {e}")

    await browser.close()


async def main():
    async with async_playwright() as pw:
        for store_name, vp in VIEWPORTS.items():
            await login_and_capture(pw, store_name, vp)
            print(f"✅ {store_name} screenshots saved to {vp['out']}")

    print("\n🎉 Done! Upload from:")
    print(f"  Play Store: {OUT_PLAYSTORE}")
    print(f"  App Store:  {OUT_APPSTORE}")


if __name__ == "__main__":
    asyncio.run(main())
