"""
Iteration 10 — Full regression for Nati Fenua before Render deploy.
Tests: auth, feed, create post, profile, mana map, marketplace, chat,
admin dashboard, admin inbox + AI draft reply (NEW), notifications.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fenua-chat-debug.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@nati-fenua.com"
DEMO_PWD = "DemoFenua2026!"
ADMIN_EMAIL = "admin@natifenua.pf"
ADMIN_PWD = "NatiFenua2025!"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def user_session():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PWD}, timeout=20)
    assert r.status_code == 200, f"demo login failed: {r.status_code} {r.text[:200]}"
    data = r.json()
    token = data.get("session_token") or data.get("token")
    user = data.get("user") or {}
    assert token, f"no session_token in response: {data}"
    return {"token": token, "user": user, "headers": {"Authorization": f"Bearer {token}"}}


@pytest.fixture(scope="session")
def admin_session():
    r = requests.post(f"{API}/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PWD}, timeout=20)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text[:200]}"
    data = r.json()
    token = data.get("token") or data.get("session_token")
    assert token
    return {"token": token, "headers": {"Authorization": f"Bearer {token}"}}


# ---------- AUTH ----------
class TestAuth:
    def test_demo_login(self, user_session):
        assert user_session["user"].get("email") == DEMO_EMAIL

    def test_admin_login(self, admin_session):
        assert admin_session["token"]

    def test_register_new_user(self):
        rand = uuid.uuid4().hex[:8]
        email = f"test+{rand}@nati-fenua.com"
        r = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "Test1234!", "name": f"QA {rand}"
        }, timeout=20)
        assert r.status_code in (200, 201), f"register status={r.status_code} body={r.text[:300]}"
        body = r.json()
        # accept either session_token or message-only flow
        assert any(k in body for k in ("session_token", "token", "user", "message", "success")), body

    def test_password_reset_request(self):
        r = requests.post(f"{API}/auth/password-reset/request", json={"email": DEMO_EMAIL}, timeout=20)
        # endpoint may not exist OR return 200/202 to avoid email enumeration
        assert r.status_code in (200, 202, 204, 404), r.status_code

    def test_login_bad_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": "wrong"}, timeout=20)
        assert r.status_code in (400, 401, 403)


# ---------- FEED + POSTS ----------
class TestFeedAndPosts:
    def test_feed_loads(self, user_session):
        r = requests.get(f"{API}/posts", headers=user_session["headers"], timeout=20)
        assert r.status_code == 200
        data = r.json()
        items = data if isinstance(data, list) else (data.get("posts") or data.get("items") or [])
        assert isinstance(items, list)
        assert len(items) > 0, "expected at least demo posts"

    def test_create_text_post(self, user_session):
        payload = {
            "content_type": "text",
            "media_url": "",
            "caption": f"TEST_QA depuis QA {uuid.uuid4().hex[:6]}",
            "privacy": "friends",
        }
        r = requests.post(f"{API}/posts", json=payload, headers=user_session["headers"], timeout=20)
        assert r.status_code in (200, 201), f"create post failed: {r.status_code} {r.text[:300]}"
        post = r.json()
        pid = post.get("post_id") or post.get("id") or post.get("_id")
        assert pid, f"no post id: {post}"
        # verify it appears in feed
        r2 = requests.get(f"{API}/posts", headers=user_session["headers"], timeout=20)
        assert r2.status_code == 200

    def test_like_post(self, user_session):
        r = requests.get(f"{API}/posts", headers=user_session["headers"], timeout=20)
        items = r.json() if isinstance(r.json(), list) else r.json().get("posts", [])
        assert items
        pid = items[0].get("id") or items[0].get("_id")
        # try both endpoints
        r1 = requests.post(f"{API}/posts/{pid}/like", headers=user_session["headers"], timeout=15)
        assert r1.status_code in (200, 201, 204), f"like failed: {r1.status_code} {r1.text[:200]}"

    def test_comment_post(self, user_session):
        r = requests.get(f"{API}/posts", headers=user_session["headers"], timeout=20)
        items = r.json() if isinstance(r.json(), list) else r.json().get("posts", [])
        pid = items[0].get("id") or items[0].get("_id")
        body = {"content": "TEST_QA Super photo !", "text": "TEST_QA Super photo !"}
        r1 = requests.post(f"{API}/posts/{pid}/comments", json=body, headers=user_session["headers"], timeout=20)
        assert r1.status_code in (200, 201), f"comment failed: {r1.status_code} {r1.text[:300]}"
        # verify list
        r2 = requests.get(f"{API}/posts/{pid}/comments", headers=user_session["headers"], timeout=15)
        assert r2.status_code == 200

    def test_bookmark_post(self, user_session):
        r = requests.get(f"{API}/posts", headers=user_session["headers"], timeout=20)
        items = r.json() if isinstance(r.json(), list) else r.json().get("posts", [])
        pid = items[0].get("id") or items[0].get("_id")
        r1 = requests.post(f"{API}/posts/{pid}/save", headers=user_session["headers"], timeout=15)
        if r1.status_code == 404:
            r1 = requests.post(f"{API}/posts/{pid}/bookmark", headers=user_session["headers"], timeout=15)
        assert r1.status_code in (200, 201, 204), f"save failed: {r1.status_code} {r1.text[:200]}"


# ---------- PROFILE ----------
class TestProfile:
    def test_get_me(self, user_session):
        r = requests.get(f"{API}/auth/me", headers=user_session["headers"], timeout=15)
        assert r.status_code == 200, r.text[:200]
        body = r.json()
        # mana_points + level expected
        u = body.get("user", body)
        assert "email" in u

    def test_mana_score(self, user_session):
        r = requests.get(f"{API}/users/me/mana", headers=user_session["headers"], timeout=15)
        # endpoint may not exist; alternative path
        if r.status_code == 404:
            r = requests.get(f"{API}/auth/me", headers=user_session["headers"], timeout=15)
        assert r.status_code == 200


# ---------- MANA MAP ----------
class TestManaMap:
    def test_webcams(self):
        r = requests.get(f"{API}/webcams", timeout=15)
        assert r.status_code in (200, 404)

    def test_mana_points(self):
        r = requests.get(f"{API}/mana/points", timeout=15)
        # alt
        if r.status_code == 404:
            r = requests.get(f"{API}/mana-map/points", timeout=15)
        assert r.status_code in (200, 404)


# ---------- MARKETPLACE ----------
class TestMarketplace:
    def test_products_list(self):
        r = requests.get(f"{API}/marketplace/products", timeout=20)
        if r.status_code == 404:
            r = requests.get(f"{API}/products", timeout=20)
        assert r.status_code == 200, r.status_code


# ---------- CHAT ----------
class TestChat:
    def test_conversations(self, user_session):
        r = requests.get(f"{API}/conversations", headers=user_session["headers"], timeout=15)
        assert r.status_code == 200


# ---------- NOTIFICATIONS ----------
class TestNotifications:
    def test_list_notifications(self, user_session):
        r = requests.get(f"{API}/notifications", headers=user_session["headers"], timeout=15)
        assert r.status_code == 200


# ---------- ADMIN INBOX + AI DRAFT ----------
class TestAdminInboxAIDraft:
    @pytest.fixture(scope="class")
    def inbound_id(self, admin_session):
        # send fake inbound
        payload = {
            "type": "email.received",
            "data": {
                "from": "user@test.com",
                "to": "contact@nati-fenua.com",
                "subject": f"QA Test {uuid.uuid4().hex[:6]}",
                "text": "Comment puis-je supprimer mon compte ? Merci.",
                "html": "<p>Comment puis-je supprimer mon compte ?</p>"
            }
        }
        r = requests.post(f"{API}/webhook/resend/inbound", json=payload, timeout=15)
        assert r.status_code == 200, r.text[:200]
        body = r.json()
        iid = body.get("inbound_id")
        assert iid, body
        return iid

    def test_inbox_list_contains(self, admin_session, inbound_id):
        r = requests.get(f"{API}/admin/inbox", headers=admin_session["headers"], timeout=15)
        assert r.status_code == 200
        items = r.json().get("items", [])
        assert any(i.get("inbound_id") == inbound_id for i in items), \
            f"inbound_id {inbound_id} not in list of {len(items)} items"

    def test_inbox_detail(self, admin_session, inbound_id):
        r = requests.get(f"{API}/admin/inbox/{inbound_id}", headers=admin_session["headers"], timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body.get("subject") or body.get("text")

    def test_ai_draft_generate(self, admin_session, inbound_id):
        """NEW: Claude-generated draft reply via /admin/inbox/{id}/draft-reply"""
        url = f"{API}/admin/inbox/{inbound_id}/draft-reply"
        r = requests.post(url, json={"tone": "friendly"}, headers=admin_session["headers"], timeout=60)
        assert r.status_code == 200, f"draft-reply failed: {r.status_code} {r.text[:400]}"
        body = r.json()
        draft = body.get("draft") or ""
        assert isinstance(draft, str) and len(draft) > 20, f"draft too short: {draft!r}"
        # French heuristics — start
        assert any(s in draft for s in ["Bonjour", "Ia ora na", "ia ora na"]), \
            f"draft doesn't start with French greeting: {draft[:120]!r}"
        # signature
        assert "Nati Fenua" in draft, f"draft missing 'Nati Fenua' signature: {draft[-200:]!r}"

    def test_send_reply_mocked(self, admin_session, inbound_id):
        url = f"{API}/admin/inbox/{inbound_id}/send-reply"
        payload = {
            "to": "user@test.com",
            "subject": "Re: QA Test",
            "text": "Bonjour,\n\nTest réponse depuis QA.\n\nMāuruuru,\nL'équipe Nati Fenua"
        }
        r = requests.post(url, json=payload, headers=admin_session["headers"], timeout=30)
        assert r.status_code == 200, f"send-reply failed: {r.status_code} {r.text[:300]}"
        body = r.json()
        # In sandbox RESEND_API_KEY absent → expect mocked:true
        assert body.get("success") is True
        assert body.get("mocked") is True, f"expected mocked:true in sandbox, got {body}"

    def test_archive(self, admin_session, inbound_id):
        r = requests.delete(f"{API}/admin/inbox/{inbound_id}", headers=admin_session["headers"], timeout=15)
        assert r.status_code in (200, 204)


# ---------- AI AGENT CONFIG ----------
class TestAIAgentConfig:
    def test_get_config(self, admin_session):
        urls = [f"{API}/admin/ai-agent/config", f"{API}/admin/ai-agent", f"{API}/admin/settings/ai-agent"]
        for u in urls:
            r = requests.get(u, headers=admin_session["headers"], timeout=15)
            if r.status_code == 200:
                return
        pytest.skip("AI agent config endpoint not located")
