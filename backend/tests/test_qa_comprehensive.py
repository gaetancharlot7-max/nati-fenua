"""
Comprehensive QA Test Suite for Nati Fenua - Polynesian Social Network
Tests: Authentication, Profile, Feed/Posts, Messaging, Stories, Marketplace, Pulse, RSS
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://fenua-connect.preview.emergentagent.com')

# Test credentials
TEST_USER_EMAIL = "user1@test.com"
TEST_USER_PASSWORD = "TestPass123!"
NEW_USER_EMAIL = f"test_qa_{int(time.time())}@test.com"
NEW_USER_PASSWORD = "TestQA123!"


class TestHealthAndBasics:
    """Basic health check and API availability tests"""
    
    def test_health_endpoint(self):
        """Test API health check"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["app"] == "Nati Fenua"
        print("✅ Health endpoint working")
    
    def test_api_docs_available(self):
        """Test API documentation is accessible"""
        response = requests.get(f"{BASE_URL}/api/docs")
        assert response.status_code == 200
        print("✅ API docs accessible")


class TestAuthentication:
    """Authentication flow tests: Register, Login, Logout"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "session_token" in data
        assert data["user"]["email"] == TEST_USER_EMAIL
        print(f"✅ Login successful for {TEST_USER_EMAIL}")
        return data["session_token"]
    
    def test_login_invalid_password(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": "WrongPassword123!"
        })
        assert response.status_code == 401
        print("✅ Invalid password correctly rejected")
    
    def test_login_invalid_email(self):
        """Test login with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "SomePassword123!"
        })
        assert response.status_code == 401
        print("✅ Non-existent email correctly rejected")
    
    def test_register_new_user(self):
        """Test user registration"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": NEW_USER_EMAIL,
            "password": NEW_USER_PASSWORD,
            "name": "Test QA User",
            "address": "123 Test Street, Papeete"
        })
        # May return 200 (success) or 400 (email already exists)
        assert response.status_code in [200, 400, 429]
        if response.status_code == 200:
            data = response.json()
            assert "user" in data
            print(f"✅ Registration successful for {NEW_USER_EMAIL}")
        else:
            print(f"✅ Registration endpoint working (status: {response.status_code})")
    
    def test_get_current_user(self):
        """Test getting current user info"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        token = login_response.json().get("session_token")
        
        # Get user info
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        print("✅ Get current user working")
    
    def test_logout(self):
        """Test logout"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        token = login_response.json().get("session_token")
        
        # Logout
        response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        print("✅ Logout working")
    
    def test_password_reset_request(self):
        """Test password reset request"""
        response = requests.post(f"{BASE_URL}/api/auth/request-password-reset", json={
            "email": TEST_USER_EMAIL
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("✅ Password reset request working")


class TestUserProfile:
    """User profile tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        return response.json().get("session_token")
    
    @pytest.fixture
    def user_id(self, auth_token):
        """Get current user ID"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        return response.json().get("user_id")
    
    def test_get_user_profile(self, auth_token, user_id):
        """Test getting user profile"""
        response = requests.get(
            f"{BASE_URL}/api/users/{user_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "name" in data
        print(f"✅ Get user profile working for {user_id}")
    
    def test_get_user_posts(self, auth_token, user_id):
        """Test getting user's posts"""
        response = requests.get(
            f"{BASE_URL}/api/users/{user_id}/posts",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("✅ Get user posts working")


class TestFeedAndPosts:
    """Feed and posts tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        return response.json().get("session_token")
    
    def test_get_feed_posts(self):
        """Test getting feed posts"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=20")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Feed posts working - {len(data)} posts returned")
    
    def test_get_paginated_posts(self):
        """Test paginated posts endpoint"""
        response = requests.get(f"{BASE_URL}/api/posts/paginated?limit=10&skip=0")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        assert "pagination" in data
        print("✅ Paginated posts working")
    
    def test_create_post(self, auth_token):
        """Test creating a post"""
        response = requests.post(
            f"{BASE_URL}/api/posts",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "content_type": "photo",
                "media_url": "https://images.unsplash.com/photo-1723958286930-b32795ed2bbd?w=800",
                "caption": "Test post from QA suite 🌺 #TestPost",
                "location": "Papeete, Tahiti"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "post_id" in data
        print(f"✅ Create post working - post_id: {data['post_id']}")
        return data["post_id"]
    
    def test_like_post(self, auth_token):
        """Test liking a post"""
        # Get a post first
        posts_response = requests.get(f"{BASE_URL}/api/posts?limit=1")
        posts = posts_response.json()
        if len(posts) > 0:
            post_id = posts[0]["post_id"]
            response = requests.post(
                f"{BASE_URL}/api/posts/{post_id}/like",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert response.status_code == 200
            print(f"✅ Like post working for {post_id}")
        else:
            print("⚠️ No posts available to like")
    
    def test_react_to_post(self, auth_token):
        """Test reacting to a post"""
        posts_response = requests.get(f"{BASE_URL}/api/posts?limit=1")
        posts = posts_response.json()
        if len(posts) > 0:
            post_id = posts[0]["post_id"]
            response = requests.post(
                f"{BASE_URL}/api/posts/{post_id}/react",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={"reaction": "love"}
            )
            assert response.status_code == 200
            print(f"✅ React to post working for {post_id}")
    
    def test_get_post_comments(self):
        """Test getting post comments"""
        posts_response = requests.get(f"{BASE_URL}/api/posts?limit=1")
        posts = posts_response.json()
        if len(posts) > 0:
            post_id = posts[0]["post_id"]
            response = requests.get(f"{BASE_URL}/api/posts/{post_id}/comments")
            assert response.status_code == 200
            assert isinstance(response.json(), list)
            print(f"✅ Get comments working for {post_id}")
    
    def test_add_comment(self, auth_token):
        """Test adding a comment"""
        posts_response = requests.get(f"{BASE_URL}/api/posts?limit=1")
        posts = posts_response.json()
        if len(posts) > 0:
            post_id = posts[0]["post_id"]
            response = requests.post(
                f"{BASE_URL}/api/posts/{post_id}/comments",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={"content": "Test comment from QA 🌴"}
            )
            assert response.status_code == 200
            print(f"✅ Add comment working for {post_id}")


class TestStories:
    """Stories tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        return response.json().get("session_token")
    
    def test_get_stories(self):
        """Test getting stories"""
        response = requests.get(f"{BASE_URL}/api/stories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Get stories working - {len(data)} story groups")
    
    def test_create_story(self, auth_token):
        """Test creating a story"""
        response = requests.post(
            f"{BASE_URL}/api/stories",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "media_url": "https://images.unsplash.com/photo-1723958286930-b32795ed2bbd?w=800",
                "media_type": "image",
                "duration": 5
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "story_id" in data
        print(f"✅ Create story working - story_id: {data['story_id']}")


class TestMessaging:
    """Messaging/Chat tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        return response.json().get("session_token")
    
    def test_get_conversations_requires_auth(self):
        """Test that conversations require authentication"""
        response = requests.get(f"{BASE_URL}/api/conversations")
        assert response.status_code == 401
        print("✅ Conversations require auth")
    
    def test_get_conversations(self, auth_token):
        """Test getting conversations"""
        response = requests.get(
            f"{BASE_URL}/api/conversations",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Get conversations working - {len(data)} conversations")


class TestMarketplace:
    """Marketplace tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        return response.json().get("session_token")
    
    def test_get_products(self):
        """Test getting marketplace products"""
        response = requests.get(f"{BASE_URL}/api/marketplace/products?limit=20")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Get products working - {len(data)} products")
    
    def test_get_services(self):
        """Test getting marketplace services"""
        response = requests.get(f"{BASE_URL}/api/marketplace/services?limit=20")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Get services working - {len(data)} services")
    
    def test_get_categories(self):
        """Test getting marketplace categories"""
        response = requests.get(f"{BASE_URL}/api/marketplace/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print("✅ Get categories working")
    
    def test_create_product(self, auth_token):
        """Test creating a product"""
        response = requests.post(
            f"{BASE_URL}/api/marketplace/products",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "Test Product QA",
                "description": "Test product from QA suite",
                "price": 5000,
                "category": "autre",
                "images": ["https://images.unsplash.com/photo-1760969485983-c7b370a1532f?w=400"],
                "location": "Papeete"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "product_id" in data
        print(f"✅ Create product working - product_id: {data['product_id']}")


class TestFenuaPulse:
    """Fenua Pulse (Map) tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        return response.json().get("session_token")
    
    def test_get_islands(self):
        """Test getting islands list"""
        response = requests.get(f"{BASE_URL}/api/pulse/islands")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 5  # At least 5 islands
        print(f"✅ Get islands working - {len(data)} islands")
    
    def test_get_marker_types(self):
        """Test getting marker types"""
        response = requests.get(f"{BASE_URL}/api/pulse/marker-types")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Check for carpool type
        types = [t["type"] for t in data]
        assert "carpool" in types
        print(f"✅ Get marker types working - {len(data)} types including carpool")
    
    def test_get_markers(self):
        """Test getting markers"""
        response = requests.get(f"{BASE_URL}/api/pulse/markers?island=tahiti")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Get markers working - {len(data)} markers on Tahiti")
    
    def test_get_pulse_status(self):
        """Test getting pulse status"""
        response = requests.get(f"{BASE_URL}/api/pulse/status")
        assert response.status_code == 200
        data = response.json()
        assert "text" in data
        assert "emoji" in data
        print("✅ Get pulse status working")
    
    def test_filter_markers_by_type(self):
        """Test filtering markers by type"""
        response = requests.get(f"{BASE_URL}/api/pulse/markers?types=carpool")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Filter markers by type working - {len(data)} carpool markers")


class TestTranslation:
    """Translation tests (French <-> Tahitian)"""
    
    def test_translate_fr_to_tahitian(self):
        """Test French to Tahitian translation"""
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": "Bonjour, comment ça va ?",
            "direction": "fr_to_tah"
        })
        assert response.status_code == 200
        data = response.json()
        assert "translated" in data
        print(f"✅ FR->TAH translation working: '{data['translated']}'")
    
    def test_translate_tahitian_to_fr(self):
        """Test Tahitian to French translation"""
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": "Ia ora na",
            "direction": "tah_to_fr"
        })
        assert response.status_code == 200
        data = response.json()
        assert "translated" in data
        print(f"✅ TAH->FR translation working: '{data['translated']}'")
    
    def test_get_dictionary_stats(self):
        """Test getting dictionary stats"""
        response = requests.get(f"{BASE_URL}/api/translate/dictionary")
        assert response.status_code == 200
        data = response.json()
        assert "total_words" in data or "words_count" in data or isinstance(data, dict)
        print("✅ Dictionary stats working")


class TestNotifications:
    """Notifications tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        return response.json().get("session_token")
    
    def test_get_notifications(self, auth_token):
        """Test getting notifications"""
        response = requests.get(
            f"{BASE_URL}/api/notifications?limit=20",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Get notifications working - {len(data)} notifications")
    
    def test_get_unread_count(self, auth_token):
        """Test getting unread notification count"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/unread-count",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        print(f"✅ Unread count working - {data['count']} unread")


class TestSearch:
    """Search functionality tests"""
    
    def test_search_users(self):
        """Test searching users"""
        response = requests.get(f"{BASE_URL}/api/search/users?q=test")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Search users working - {len(data)} results")
    
    def test_search_posts(self):
        """Test searching posts"""
        response = requests.get(f"{BASE_URL}/api/search/posts?q=tahiti")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Search posts working - {len(data)} results")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
