"""Iteration 9 — Inbound Resend Webhook + Admin Inbox tests."""
import os
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "nati_fenua")

ADMIN_EMAIL = "admin@natifenua.pf"
ADMIN_PASSWORD = "NatiFenua2025!"
DEMO_EMAIL = "demo@nati-fenua.com"
DEMO_PASSWORD = "DemoFenua2026!"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/admin/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    tok = r.json().get("token")
    assert tok
    return tok


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def mongo_db():
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    return client[DB_NAME]


# ---------- 1. Inbound webhook (no auth) ----------
class TestInboundWebhook:
    def test_inbound_nested_payload(self, mongo_db):
        payload = {
            "type": "email.received",
            "data": {
                "from": "TEST_alice@example.com",
                "to": ["contact@nati-fenua.com"],
                "subject": "TEST_NESTED Bonjour Nati Fenua",
                "text": "Ceci est un email de test (nested).",
                "html": "<p>Ceci est un email de test (nested).</p>",
                "headers": {"Message-Id": "<test-nested@example.com>"},
                "attachments": [{"filename": "a.pdf", "content_type": "application/pdf", "size": 123}],
            },
        }
        r = requests.post(f"{BASE_URL}/api/webhook/resend/inbound", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("received") is True
        assert data.get("inbound_id", "").startswith("in_")
        # Verify mongo persistence
        doc = mongo_db.inbound_emails.find_one({"inbound_id": data["inbound_id"]})
        assert doc is not None
        assert doc["from"] == "TEST_alice@example.com"
        assert doc["subject"].startswith("TEST_NESTED")
        assert doc["read"] is False
        assert doc["archived"] is False
        assert len(doc["attachments"]) == 1
        # store for cleanup
        pytest.nested_inbound_id = data["inbound_id"]

    def test_inbound_flat_payload(self, mongo_db):
        payload = {
            "from": "TEST_bob@example.com",
            "to": "contact@nati-fenua.com",
            "subject": "TEST_FLAT Question marketplace",
            "text": "Bonjour, j'aimerais savoir...",
        }
        r = requests.post(f"{BASE_URL}/api/webhook/resend/inbound", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("received") is True
        doc = mongo_db.inbound_emails.find_one({"inbound_id": data["inbound_id"]})
        assert doc is not None
        assert doc["from"] == "TEST_bob@example.com"
        pytest.flat_inbound_id = data["inbound_id"]


# ---------- 2. Admin Inbox endpoints ----------
class TestAdminInbox:
    def test_list_inbox(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/inbox", headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "items" in data and isinstance(data["items"], list)
        assert "total" in data and "unread" in data and "page" in data
        # ensure at least the 2 we just inserted are listed (unless seeded earlier)
        assert data["total"] >= 2
        # ensure html/headers stripped in list view
        if data["items"]:
            sample = data["items"][0]
            assert "html" not in sample
            assert "headers" not in sample
            assert "_id" not in sample

    def test_list_filter_unread(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/inbox?filter_read=unread",
                         headers=admin_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        for it in data["items"]:
            assert it["read"] is False

    def test_list_search(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/inbox?q=TEST_NESTED",
                         headers=admin_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["total"] >= 1
        assert any("TEST_NESTED" in it["subject"] for it in data["items"])

    def test_list_pagination(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/inbox?page=1&limit=1",
                         headers=admin_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["limit"] == 1
        assert len(data["items"]) <= 1

    def test_get_inbox_item_marks_read(self, admin_headers, mongo_db):
        iid = getattr(pytest, "nested_inbound_id", None)
        assert iid, "previous test must have created an inbound"
        r = requests.get(f"{BASE_URL}/api/admin/inbox/{iid}", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["inbound_id"] == iid
        assert data["read"] is True
        assert "html" in data  # full body returned here
        assert "_id" not in data
        # verify persisted
        doc = mongo_db.inbound_emails.find_one({"inbound_id": iid})
        assert doc["read"] is True

    def test_toggle_read(self, admin_headers, mongo_db):
        iid = getattr(pytest, "nested_inbound_id", None)
        # toggle to unread
        r = requests.post(f"{BASE_URL}/api/admin/inbox/{iid}/read",
                          headers=admin_headers, json={"read": False}, timeout=15)
        assert r.status_code == 200
        assert r.json()["read"] is False
        doc = mongo_db.inbound_emails.find_one({"inbound_id": iid})
        assert doc["read"] is False
        # back to read
        r = requests.post(f"{BASE_URL}/api/admin/inbox/{iid}/read",
                          headers=admin_headers, json={"read": True}, timeout=15)
        assert r.status_code == 200
        assert r.json()["read"] is True

    def test_archive(self, admin_headers, mongo_db):
        iid = getattr(pytest, "flat_inbound_id", None)
        r = requests.delete(f"{BASE_URL}/api/admin/inbox/{iid}",
                            headers=admin_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["success"] is True
        doc = mongo_db.inbound_emails.find_one({"inbound_id": iid})
        assert doc["archived"] is True
        # archived must not appear in default list
        r2 = requests.get(f"{BASE_URL}/api/admin/inbox", headers=admin_headers, timeout=15)
        assert all(it["inbound_id"] != iid for it in r2.json()["items"])

    def test_inbox_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/inbox", timeout=15)
        assert r.status_code in (401, 403), f"expected 401/403, got {r.status_code}"

    def test_get_404(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/inbox/in_doesnotexist",
                         headers=admin_headers, timeout=15)
        assert r.status_code == 404


# ---------- 3. Cleanup ----------
def test_cleanup(mongo_db):
    nid = getattr(pytest, "nested_inbound_id", None)
    fid = getattr(pytest, "flat_inbound_id", None)
    for x in [nid, fid]:
        if x:
            mongo_db.inbound_emails.delete_one({"inbound_id": x})
    # Clean admin notifications generated
    mongo_db.notifications.delete_many({"type": "inbound_email",
                                        "data.inbound_id": {"$in": [nid, fid]}})
    assert True
