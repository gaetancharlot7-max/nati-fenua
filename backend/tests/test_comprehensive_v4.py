"""
Comprehensive Test Suite for Hui Fenua - Testing before Play Store Launch
Tests: Auth, Email Verification, Feed, Fenua Pulse, Marketplace, Chat, PWA

Run: pytest /app/backend/tests/test_comprehensive_v4.py -v --tb=short --junitxml=/app/test_reports/pytest/pytest_v4_results.xml
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://fenua-connect.preview.emergentagent.com').rstrip('/')


class TestAPIHealth:
    """Test basic API health and accessibility"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data or "version" in data
        print(f"✅ API root working: {data}")
    
    def test_manifest_json_accessible(self):
        """Test PWA manifest.json is accessible"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "icons" in data
        print(f"✅ manifest.json accessible: name={data.get('name')}")
    
    def test_service_worker_accessible(self):
        """Test PWA service-worker.js is accessible"""
        response = requests.get(f"{BASE_URL}/service-worker.js")
        assert response.status_code == 200
        assert "addEventListener" in response.text or "self" in response.text
        print("✅ service-worker.js accessible")


class TestAuthentication:
    """Test authentication endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "user1@test.com",
            "password": "TestPass123!"
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token") or data.get("session_token")
        return None
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "user1@test.com",
            "password": "TestPass123!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data or "access_token" in data or "user" in data
        print(f"✅ Login successful for user1@test.com")
    
    def test_login_invalid_password(self):
        """Test login with invalid password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "user1@test.com",
            "password": "WrongPassword123!"
        })
        assert response.status_code in [401, 400]
        print("✅ Invalid password rejected correctly")
    
    def test_login_invalid_email_format(self):
        """Test login with invalid email format"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid-email",
            "password": "TestPass123!"
        })
        assert response.status_code in [400, 401, 422]
        print("✅ Invalid email format rejected")
    
    def test_register_new_user(self):
        """Test user registration"""
        unique_email = f"test_register_{int(time.time())}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123!",
            "name": "Test User Registration"
        })
        # Accept 201 or 200 for successful registration, or 429 for rate limit
        assert response.status_code in [200, 201, 429]
        print(f"✅ Registration endpoint working (status: {response.status_code})")
    
    def test_get_current_user(self, auth_token):
        """Test getting current user info"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data or "email" in data
        print(f"✅ Get current user works: {data.get('name', data.get('email'))}")
    
    def test_logout(self, auth_token):
        """Test logout endpoint"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code in [200, 204]
        print("✅ Logout endpoint works")


class TestEmailVerification:
    """Test email verification endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "user1@test.com",
            "password": "TestPass123!"
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token") or data.get("session_token")
        return None
    
    def test_send_verification_requires_auth(self):
        """Test send-verification requires authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/send-verification")
        assert response.status_code in [401, 403]
        print("✅ send-verification requires authentication")
    
    def test_send_verification_with_auth(self, auth_token):
        """Test sending email verification code"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        response = requests.post(
            f"{BASE_URL}/api/auth/send-verification",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Accept 200 success, or 429 rate limit
        assert response.status_code in [200, 429]
        if response.status_code == 200:
            data = response.json()
            assert "success" in data or "message" in data
            # Since Resend is mocked, we should get the code back
            if data.get("code"):
                print(f"✅ Verification code sent (MOCKED): {data.get('code')}")
            else:
                print(f"✅ Verification sent: {data.get('message')}")
        else:
            print("✅ Rate limited (expected for repeated tests)")
    
    def test_verify_email_requires_auth(self):
        """Test verify-email requires authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/verify-email", json={
            "code": "123456"
        })
        assert response.status_code in [401, 403]
        print("✅ verify-email requires authentication")
    
    def test_verify_email_invalid_code(self, auth_token):
        """Test verify-email with invalid code"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-email",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"code": "000000"}
        )
        # Should fail with invalid code
        assert response.status_code in [400, 404]
        print("✅ Invalid verification code rejected")
    
    def test_verification_status(self, auth_token):
        """Test verification status endpoint"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/auth/verification-status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "email_verified" in data or "verified" in data or "status" in data
        print(f"✅ Verification status: {data}")


class TestFeedPosts:
    """Test feed and posts endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "user1@test.com",
            "password": "TestPass123!"
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token") or data.get("session_token")
        return None
    
    def test_get_posts(self):
        """Test getting posts feed"""
        response = requests.get(f"{BASE_URL}/api/posts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Feed posts: {len(data)} posts")
    
    def test_get_stories(self):
        """Test getting stories"""
        response = requests.get(f"{BASE_URL}/api/stories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Stories: {len(data)} stories")
    
    def test_translate_endpoint(self, auth_token):
        """Test translation endpoint"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        response = requests.post(
            f"{BASE_URL}/api/translate",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"text": "bonjour", "direction": "fr_to_tah"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "translated" in data
        print(f"✅ Translation: bonjour -> {data.get('translated')}")


class TestFenuaPulse:
    """Test Fenua Pulse map endpoints"""
    
    def test_get_islands(self):
        """Test getting islands list"""
        response = requests.get(f"{BASE_URL}/api/pulse/islands")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✅ Islands: {len(data)} islands loaded")
    
    def test_get_marker_types(self):
        """Test getting marker types"""
        response = requests.get(f"{BASE_URL}/api/pulse/marker-types")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Check for carpool category
        type_names = [t.get('type') for t in data]
        assert 'carpool' in type_names, "Carpool category should be present"
        print(f"✅ Marker types: {type_names}")
    
    def test_get_markers(self):
        """Test getting active markers"""
        response = requests.get(f"{BASE_URL}/api/pulse/markers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Active markers: {len(data)} markers")
    
    def test_get_pulse_status(self):
        """Test getting pulse status"""
        response = requests.get(f"{BASE_URL}/api/pulse/status")
        assert response.status_code == 200
        data = response.json()
        assert "emoji" in data or "text" in data or "active_count" in data
        print(f"✅ Pulse status: {data.get('text', 'OK')}")
    
    def test_filter_markers_by_type(self):
        """Test filtering markers by carpool type"""
        response = requests.get(f"{BASE_URL}/api/pulse/markers?types=carpool")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Carpool markers filter works: {len(data)} markers")
    
    def test_filter_markers_by_island(self):
        """Test filtering markers by island"""
        response = requests.get(f"{BASE_URL}/api/pulse/markers?island=tahiti")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Island filter (Tahiti) works: {len(data)} markers")


class TestMarketplace:
    """Test marketplace endpoints"""
    
    def test_get_products(self):
        """Test getting marketplace products"""
        response = requests.get(f"{BASE_URL}/api/marketplace/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Marketplace products: {len(data)} products")
    
    def test_get_categories(self):
        """Test getting marketplace categories"""
        response = requests.get(f"{BASE_URL}/api/marketplace/categories")
        assert response.status_code == 200
        data = response.json()
        # Categories might be a dict with 'products' and 'services' keys
        assert isinstance(data, (list, dict))
        if isinstance(data, dict):
            assert "products" in data or "services" in data
        print(f"✅ Marketplace categories loaded")


class TestChat:
    """Test chat/messages endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "user1@test.com",
            "password": "TestPass123!"
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token") or data.get("session_token")
        return None
    
    def test_get_conversations_requires_auth(self):
        """Test conversations endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/conversations")
        assert response.status_code in [401, 403]
        print("✅ Conversations requires authentication")
    
    def test_get_conversations(self, auth_token):
        """Test getting conversations"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/conversations",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ User conversations: {len(data)} conversations")


class TestForgotPassword:
    """Test forgot password endpoint"""
    
    def test_request_password_reset_valid_email(self):
        """Test password reset with valid email"""
        response = requests.post(f"{BASE_URL}/api/auth/request-password-reset", json={
            "email": "user1@test.com"
        })
        # Accept 200 success or 429 rate limit
        assert response.status_code in [200, 429]
        if response.status_code == 200:
            data = response.json()
            assert "success" in data or "message" in data
            print(f"✅ Password reset request accepted")
        else:
            print("✅ Rate limited (expected for security)")
    
    def test_request_password_reset_invalid_email(self):
        """Test password reset with invalid email format"""
        response = requests.post(f"{BASE_URL}/api/auth/request-password-reset", json={
            "email": "not-an-email"
        })
        assert response.status_code in [400, 422]
        print("✅ Invalid email rejected for password reset")
    
    def test_request_password_reset_unknown_email(self):
        """Test password reset with unknown email (security: should not reveal)"""
        response = requests.post(f"{BASE_URL}/api/auth/request-password-reset", json={
            "email": "unknown-user-xyz@test.com"
        })
        # Should return 200 to prevent email enumeration
        assert response.status_code in [200, 429]
        print("✅ Unknown email handled correctly (no enumeration)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
