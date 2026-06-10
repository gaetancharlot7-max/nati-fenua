"""
Iteration 8 - Release features tests
- POST /api/payments/checkout (Stripe)
- GET /api/advertising/packages
- Referral reward unlock flow → in-app notification reward_unlocked

Cleans up its own data (TEST_ user prefix + reset demo referral_count).
"""

import os
import uuid
import time
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # Fallback: read from frontend .env (testing in same container)
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.strip().split("=", 1)[1]
    except Exception:
        pass
BASE_URL = (BASE_URL or "").rstrip("/")

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "nati_fenua")

DEMO_USER_ID = "394b8e71-c3fd-46c7-8835-c13bc1e6729e"
DEMO_REFERRAL_CODE = "32ZTFSAR"


@pytest.fixture(scope="module")
def db():
    client = MongoClient(MONGO_URL)
    yield client[DB_NAME]
    client.close()


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------------- /api/advertising/packages ----------------

class TestAdvertisingPackages:
    def test_packages_list_returns_min_15(self, api):
        r = api.get(f"{BASE_URL}/api/advertising/packages", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "packages" in data
        pkgs = data["packages"]
        assert isinstance(pkgs, list)
        assert len(pkgs) >= 15, f"Expected >=15 packages, got {len(pkgs)}"
        # each must contain id, name, amount, type
        for p in pkgs:
            assert "package_id" in p, f"missing id: {p}"
            assert "name" in p, f"missing name: {p}"
            assert "amount" in p, f"missing amount: {p}"
            assert "type" in p, f"missing type: {p}"
            assert isinstance(p["amount"], (int, float))


# ---------------- /api/payments/checkout ----------------

class TestStripeCheckout:
    def test_checkout_invalid_package_returns_400(self, api):
        r = api.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "package_id": "definitely_invalid_xyz",
                "origin_url": "https://test.com",
                "user_id": "demo_user",
            },
            timeout=15,
        )
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"

    def test_checkout_valid_marketplace_7days(self, api, db):
        r = api.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "package_id": "marketplace_7days",
                "origin_url": "https://test.com",
                "user_id": "demo_user",
            },
            timeout=30,
        )
        assert r.status_code == 200, f"checkout failed: {r.status_code} {r.text}"
        data = r.json()
        assert "checkout_url" in data
        assert "session_id" in data
        assert isinstance(data["checkout_url"], str)
        assert data["checkout_url"].startswith("https://checkout.stripe.com/"), (
            f"checkout_url is not a Stripe URL: {data['checkout_url']}"
        )
        # payment_transactions row should be created in DB
        tx = db.payment_transactions.find_one({"session_id": data["session_id"]})
        assert tx is not None, "payment_transactions row not created"
        assert tx["package_id"] == "marketplace_7days"
        assert tx["payment_status"] == "pending"
        assert tx["user_id"] == "demo_user"


# ---------------- Reward unlock flow ----------------

class TestRewardUnlockFlow:
    def _cleanup(self, db, email):
        db.users.delete_many({"email": email})
        # Reset demo referral_count
        db.users.update_one(
            {"user_id": DEMO_USER_ID},
            {"$set": {"referral_count": 0, "claimed_rewards": []}},
        )
        # Remove any leftover reward_unlocked notifications for demo from previous tests
        db.notifications.delete_many(
            {"user_id": DEMO_USER_ID, "type": {"$in": ["reward_unlocked", "new_referral"]}}
        )

    def test_register_with_referral_triggers_reward_unlocked(self, api, db):
        unique = uuid.uuid4().hex[:8]
        email = f"reftest_{unique}@example.com"

        # Ensure clean state
        db.users.update_one(
            {"user_id": DEMO_USER_ID}, {"$set": {"referral_count": 0, "claimed_rewards": []}}
        )
        db.notifications.delete_many(
            {"user_id": DEMO_USER_ID, "type": "reward_unlocked"}
        )

        try:
            payload = {
                "email": email,
                "password": "TestPass123!",
                "name": f"RefTest {unique}",
                "referral_code": DEMO_REFERRAL_CODE,
            }
            r = api.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=30)
            assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text}"

            # Wait a moment for async post-registration tasks
            time.sleep(1.5)

            # (a) reward_unlocked notification exists for demo (threshold=1)
            notif = db.notifications.find_one(
                {"user_id": DEMO_USER_ID, "type": "reward_unlocked"}
            )
            assert notif is not None, "reward_unlocked notification was not created"
            assert "Première invitation" in notif["title"], (
                f"unexpected title: {notif['title']}"
            )
            assert notif["title"].startswith("🎁"), notif["title"]
            assert notif.get("data", {}).get("tier_code") == "first_referral"

            # (b) referrer.referral_count == 1
            referrer = db.users.find_one({"user_id": DEMO_USER_ID}, {"referral_count": 1})
            assert referrer["referral_count"] == 1, (
                f"expected referral_count=1, got {referrer.get('referral_count')}"
            )

        finally:
            self._cleanup(db, email)
