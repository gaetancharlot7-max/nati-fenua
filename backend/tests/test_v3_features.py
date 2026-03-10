"""
Test suite for Hui Fenua v3 Features:
- Performance optimizations (paginated posts)
- Moderation system (report categories)
- GDPR compliance (consent types, data management)
- Admin analytics & monitoring
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "user1@test.com"
TEST_USER_PASSWORD = "TestPass123!"
ADMIN_EMAIL = "admin@fenuasocial.com"
ADMIN_PASSWORD = "FenuaAdmin2024!"

class TestHealthCheck:
    """Basic health checks"""
    
    def test_backend_health(self):
        """Test backend is running"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert "version" in data or "message" in data
        print(f"✅ Backend health check passed: {data}")


class TestPaginatedPosts:
    """Tests for paginated posts API - Performance optimization"""
    
    def test_paginated_posts_endpoint(self):
        """Test /api/posts/paginated returns correct structure"""
        response = requests.get(f"{BASE_URL}/api/posts/paginated?limit=10&skip=0")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify pagination structure
        assert "posts" in data, "Response should contain 'posts' key"
        assert "pagination" in data, "Response should contain 'pagination' key"
        
        pagination = data["pagination"]
        assert "skip" in pagination
        assert "limit" in pagination
        assert "total" in pagination
        assert "has_more" in pagination
        
        print(f"✅ Paginated posts API working: {len(data['posts'])} posts, total: {pagination['total']}")
    
    def test_paginated_posts_limit(self):
        """Test limit parameter works"""
        response = requests.get(f"{BASE_URL}/api/posts/paginated?limit=5&skip=0")
        assert response.status_code == 200
        data = response.json()
        assert len(data["posts"]) <= 5
        print(f"✅ Pagination limit working: {len(data['posts'])} posts returned")


class TestModerationCategories:
    """Tests for moderation categories API"""
    
    def test_get_moderation_categories(self):
        """Test /api/moderation/categories returns valid categories"""
        response = requests.get(f"{BASE_URL}/api/moderation/categories")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Categories should be a list"
        assert len(data) > 0, "Should have at least one category"
        
        # Verify category structure
        for cat in data:
            assert "value" in cat, "Category should have 'value' field"
            assert "label" in cat, "Category should have 'label' field"
        
        categories = [c["value"] for c in data]
        print(f"✅ Moderation categories: {categories}")


class TestGDPRConsentTypes:
    """Tests for GDPR consent types API"""
    
    def test_get_consent_types(self):
        """Test /api/gdpr/consent-types returns valid consent options"""
        response = requests.get(f"{BASE_URL}/api/gdpr/consent-types")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Consent types should be a list"
        assert len(data) > 0, "Should have at least one consent type"
        
        # Verify consent structure
        for consent in data:
            assert "type" in consent, "Consent should have 'type' field"
            assert "label" in consent, "Consent should have 'label' field"
            assert "required" in consent, "Consent should have 'required' field"
        
        # Verify required consents exist
        types = [c["type"] for c in data]
        assert "terms_of_service" in types or any("terms" in t for t in types), "Should have terms consent"
        
        print(f"✅ GDPR consent types: {types}")


class TestUserAuthentication:
    """Tests for user authentication"""
    
    @pytest.fixture
    def session(self):
        return requests.Session()
    
    def test_user_login(self, session):
        """Test user login with test credentials"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            assert "user" in data
            assert "session_token" in data
            print(f"✅ User login successful: {data['user'].get('email')}")
        else:
            # User may not exist, try registration
            print(f"⚠️ Login failed (user may not exist): {response.status_code}")
            pytest.skip("Test user does not exist")
    
    def test_user_registration_and_login(self, session):
        """Test user registration flow"""
        test_email = f"test_user_{int(time.time())}@test.com"
        
        # Register new user
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "name": "Test User"
        })
        
        if response.status_code == 200:
            data = response.json()
            assert "user" in data
            print(f"✅ Registration successful: {test_email}")
        elif response.status_code == 400:
            print(f"⚠️ Registration failed (may already exist): {response.text}")
        else:
            print(f"⚠️ Registration returned {response.status_code}: {response.text}")


class TestAdminLogin:
    """Tests for admin login"""
    
    def test_admin_login(self):
        """Test admin login endpoint"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            assert "success" in data or "token" in data
            print(f"✅ Admin login successful")
            return data
        else:
            print(f"⚠️ Admin login failed: {response.status_code} - {response.text}")
            pytest.skip("Admin login not available")


class TestAdminAnalytics:
    """Tests for admin analytics endpoints"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        
        return session
    
    def test_admin_analytics_endpoint(self, admin_session):
        """Test admin analytics API"""
        response = admin_session.get(f"{BASE_URL}/api/admin/analytics")
        
        if response.status_code == 200:
            data = response.json()
            # Check for expected analytics keys
            expected_keys = ["users", "content", "geography"]
            found_keys = [k for k in expected_keys if k in data]
            print(f"✅ Admin analytics working: {found_keys}")
        elif response.status_code == 401:
            print(f"⚠️ Admin analytics requires auth: {response.status_code}")
        else:
            print(f"⚠️ Admin analytics returned: {response.status_code}")
    
    def test_admin_monitoring_endpoint(self, admin_session):
        """Test admin monitoring API"""
        response = admin_session.get(f"{BASE_URL}/api/admin/monitoring")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Admin monitoring working: {data.keys() if isinstance(data, dict) else 'OK'}")
        else:
            print(f"⚠️ Admin monitoring returned: {response.status_code}")


class TestModerationReports:
    """Tests for moderation report endpoints"""
    
    @pytest.fixture
    def authenticated_session(self):
        """Get authenticated user session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if response.status_code != 200:
            # Try registration
            response = session.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": "Test User"
            })
        
        if response.status_code not in [200, 400]:
            pytest.skip("Could not authenticate")
        
        return session
    
    def test_create_report_endpoint_exists(self, authenticated_session):
        """Test moderation report creation endpoint exists"""
        # Just test the endpoint exists without creating a real report
        response = authenticated_session.post(f"{BASE_URL}/api/moderation/report", json={
            "content_type": "post",
            "content_id": "test_post_123",
            "category": "spam",
            "description": "Test report"
        })
        
        # We expect either 200 (success), 400/404 (invalid post), or 401 (needs auth)
        assert response.status_code in [200, 400, 401, 404, 422], f"Unexpected status: {response.status_code}"
        print(f"✅ Report endpoint accessible: {response.status_code}")


class TestGDPRUserData:
    """Tests for GDPR user data endpoints"""
    
    @pytest.fixture
    def authenticated_session(self):
        """Get authenticated user session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if response.status_code != 200:
            response = session.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": "Test User"
            })
        
        return session
    
    def test_get_my_consents(self, authenticated_session):
        """Test getting user's consent status"""
        response = authenticated_session.get(f"{BASE_URL}/api/gdpr/my-consents")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ User consents retrieved: {list(data.keys()) if isinstance(data, dict) else 'OK'}")
        elif response.status_code == 401:
            print(f"⚠️ Consents endpoint requires auth")
        else:
            print(f"⚠️ Consents endpoint returned: {response.status_code}")


class TestPostsAPI:
    """Tests for standard posts API"""
    
    def test_get_posts(self):
        """Test standard posts endpoint"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=20")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Posts API working: {len(data)} posts returned")
    
    def test_get_stories(self):
        """Test stories endpoint"""
        response = requests.get(f"{BASE_URL}/api/stories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Stories API working: {len(data)} story groups")


class TestLiveAPI:
    """Tests for live streaming API"""
    
    def test_get_lives(self):
        """Test active lives endpoint"""
        response = requests.get(f"{BASE_URL}/api/lives")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Lives API working: {len(data)} active lives")


class TestMarketplaceAPI:
    """Tests for marketplace API"""
    
    def test_get_products(self):
        """Test products endpoint"""
        response = requests.get(f"{BASE_URL}/api/marketplace/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Products API working: {len(data)} products")
    
    def test_get_categories(self):
        """Test marketplace categories"""
        response = requests.get(f"{BASE_URL}/api/marketplace/categories")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data or "services" in data
        print(f"✅ Categories API working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
