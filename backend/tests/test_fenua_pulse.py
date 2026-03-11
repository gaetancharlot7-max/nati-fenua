"""
Test suite for Hui Fenua - FENUA PULSE Features
Tests: Interactive map, Islands, Markers, Mana system, Vendor/Roulotte system
"""
import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "user1@test.com"
TEST_PASSWORD = "TestPass123!"
ADMIN_EMAIL = "admin@huifenua.pf"
ADMIN_PASSWORD = "admin123"


class TestHealthAndBasicAPIs:
    """Basic health checks and API accessibility tests"""
    
    def test_01_backend_health(self):
        """Test backend is running"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        print(f"✅ Backend health: {data.get('message', 'OK')}")

    def test_02_api_version(self):
        """Check API version info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        version = data.get('version', 'unknown')
        print(f"✅ API Version: {version}")


class TestFenuaPulseIslands:
    """Tests for Fenua Pulse island navigation API"""
    
    def test_01_get_islands(self):
        """Test /api/pulse/islands returns all islands"""
        response = requests.get(f"{BASE_URL}/api/pulse/islands")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Islands should be a list"
        assert len(data) >= 7, "Should have at least 7 islands"
        
        # Verify island structure
        for island in data:
            assert "id" in island, "Island should have 'id'"
            assert "name" in island, "Island should have 'name'"
            assert "lat" in island, "Island should have 'lat'"
            assert "lng" in island, "Island should have 'lng'"
            assert "zoom" in island, "Island should have 'zoom'"
        
        # Check for key islands
        island_ids = [i["id"] for i in data]
        expected_islands = ["tahiti", "moorea", "bora-bora", "huahine", "raiatea", "marquises", "tuamotu"]
        for expected in expected_islands:
            assert expected in island_ids, f"Missing island: {expected}"
        
        print(f"✅ Islands API: {len(data)} islands - {island_ids}")


class TestFenuaPulseMarkerTypes:
    """Tests for Fenua Pulse marker types API"""
    
    def test_01_get_marker_types(self):
        """Test /api/pulse/marker-types returns all marker types"""
        response = requests.get(f"{BASE_URL}/api/pulse/marker-types")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Marker types should be a list"
        assert len(data) >= 8, "Should have at least 8 marker types"
        
        # Verify marker type structure
        for marker_type in data:
            assert "type" in marker_type, "Marker type should have 'type'"
            assert "color" in marker_type, "Marker type should have 'color'"
            assert "icon" in marker_type, "Marker type should have 'icon'"
            assert "label" in marker_type, "Marker type should have 'label'"
            assert "duration_hours" in marker_type, "Marker type should have 'duration_hours'"
        
        # Check for key marker types
        marker_types = [m["type"] for m in data]
        expected_types = ["roulotte", "accident", "surf", "event", "live", "weather", "market", "other"]
        for expected in expected_types:
            assert expected in marker_types, f"Missing marker type: {expected}"
        
        print(f"✅ Marker Types API: {marker_types}")


class TestFenuaPulseStatus:
    """Tests for Fenua Pulse status API"""
    
    def test_01_get_pulse_status(self):
        """Test /api/pulse/status returns current pulse status"""
        response = requests.get(f"{BASE_URL}/api/pulse/status")
        assert response.status_code == 200
        data = response.json()
        
        # Verify status structure
        assert "emoji" in data, "Status should have 'emoji'"
        assert "text" in data, "Status should have 'text'"
        assert "level" in data, "Status should have 'level'"
        assert "color" in data, "Status should have 'color'"
        assert "active_count" in data, "Status should have 'active_count'"
        assert "updated_at" in data, "Status should have 'updated_at'"
        
        # Verify valid level
        assert data["level"] in ["calm", "normal", "busy", "exceptional"]
        
        print(f"✅ Pulse Status: {data['emoji']} {data['text']} (Level: {data['level']}, Active: {data['active_count']})")


class TestFenuaPulseMarkers:
    """Tests for Fenua Pulse markers API"""
    
    def test_01_get_markers(self):
        """Test /api/pulse/markers returns markers list"""
        response = requests.get(f"{BASE_URL}/api/pulse/markers")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Markers should be a list"
        print(f"✅ Markers API: {len(data)} active markers")
    
    def test_02_get_markers_with_filter(self):
        """Test markers with type filter"""
        response = requests.get(f"{BASE_URL}/api/pulse/markers?types=roulotte,surf")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all returned markers are of filtered types
        for marker in data:
            assert marker.get("marker_type") in ["roulotte", "surf"], "Marker should be filtered type"
        
        print(f"✅ Filtered Markers: {len(data)} roulotte/surf markers")
    
    def test_03_get_markers_by_island(self):
        """Test markers filtered by island"""
        response = requests.get(f"{BASE_URL}/api/pulse/markers?island=tahiti")
        assert response.status_code == 200
        data = response.json()
        
        print(f"✅ Tahiti Markers: {len(data)} markers")


class TestRouletteSystem:
    """Tests for Roulotte/Vendor system API"""
    
    def test_01_get_cuisine_types(self):
        """Test /api/roulotte/cuisine-types returns cuisine list"""
        response = requests.get(f"{BASE_URL}/api/roulotte/cuisine-types")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Cuisine types should be a list"
        assert len(data) >= 10, "Should have at least 10 cuisine types"
        
        # Verify structure
        for cuisine in data:
            assert "id" in cuisine, "Cuisine should have 'id'"
            assert "label" in cuisine, "Cuisine should have 'label'"
        
        cuisine_ids = [c["id"] for c in data]
        expected_cuisines = ["tahitien", "chinois", "francais", "pizza", "burger", "poisson"]
        for expected in expected_cuisines:
            assert expected in cuisine_ids, f"Missing cuisine type: {expected}"
        
        print(f"✅ Cuisine Types: {cuisine_ids}")
    
    def test_02_get_payment_methods(self):
        """Test /api/roulotte/payment-methods returns payment options"""
        response = requests.get(f"{BASE_URL}/api/roulotte/payment-methods")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Payment methods should be a list"
        
        # Verify structure
        for method in data:
            assert "id" in method, "Method should have 'id'"
            assert "label" in method, "Method should have 'label'"
            assert "icon" in method, "Method should have 'icon'"
        
        method_ids = [m["id"] for m in data]
        expected_methods = ["cash", "card"]
        for expected in expected_methods:
            assert expected in method_ids, f"Missing payment method: {expected}"
        
        print(f"✅ Payment Methods: {method_ids}")
    
    def test_03_search_roulottes(self):
        """Test searching for roulottes"""
        response = requests.get(f"{BASE_URL}/api/roulotte/search")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Search results should be a list"
        print(f"✅ Roulotte Search: {len(data)} results")
    
    def test_04_get_open_roulottes(self):
        """Test getting currently open roulottes"""
        response = requests.get(f"{BASE_URL}/api/roulotte/open")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Open roulottes should be a list"
        print(f"✅ Open Roulottes: {len(data)} currently open")


class TestFenuaPulseLeaderboard:
    """Tests for Fenua Pulse leaderboard API"""
    
    def test_01_get_weekly_leaderboard(self):
        """Test weekly leaderboard endpoint"""
        response = requests.get(f"{BASE_URL}/api/pulse/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Leaderboard should be a list"
        
        # Verify leaderboard structure if not empty
        for entry in data:
            assert "rank" in entry, "Entry should have 'rank'"
            assert "user" in entry, "Entry should have 'user'"
        
        print(f"✅ Weekly Leaderboard: {len(data)} contributors")
    
    def test_02_get_leaderboard_by_island(self):
        """Test leaderboard filtered by island"""
        response = requests.get(f"{BASE_URL}/api/pulse/leaderboard?island=tahiti")
        assert response.status_code == 200
        data = response.json()
        
        print(f"✅ Tahiti Leaderboard: {len(data)} contributors")


class TestFenuaPulseBadges:
    """Tests for badges system API"""
    
    def test_01_get_badges_list(self):
        """Test /api/pulse/badges returns all badges"""
        response = requests.get(f"{BASE_URL}/api/pulse/badges")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Badges should be a list"
        assert len(data) >= 5, "Should have at least 5 badges"
        
        # Verify badge structure
        for badge in data:
            assert "badge_id" in badge, "Badge should have 'badge_id'"
            assert "name" in badge, "Badge should have 'name'"
            assert "description" in badge, "Badge should have 'description'"
            assert "icon" in badge, "Badge should have 'icon'"
        
        badge_ids = [b["badge_id"] for b in data]
        print(f"✅ Badges: {badge_ids}")


class TestFenuaPulseStats:
    """Tests for Fenua Pulse statistics API"""
    
    def test_01_get_fenua_stats(self):
        """Test /api/pulse/stats returns fenua statistics"""
        response = requests.get(f"{BASE_URL}/api/pulse/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify stats structure
        assert "weekly_reports" in data, "Stats should have 'weekly_reports'"
        assert "most_active_island" in data, "Stats should have 'most_active_island'"
        assert "top_surf_spot" in data, "Stats should have 'top_surf_spot'"
        assert "updated_at" in data, "Stats should have 'updated_at'"
        
        print(f"✅ Fenua Stats: Weekly reports={data['weekly_reports']}, Most active={data['most_active_island']}")


class TestPaginatedPosts:
    """Tests for paginated posts API"""
    
    def test_01_paginated_posts(self):
        """Test /api/posts/paginated endpoint"""
        response = requests.get(f"{BASE_URL}/api/posts/paginated?limit=10&skip=0")
        assert response.status_code == 200
        data = response.json()
        
        assert "posts" in data, "Response should contain 'posts'"
        assert "pagination" in data, "Response should contain 'pagination'"
        
        pagination = data["pagination"]
        assert "skip" in pagination
        assert "limit" in pagination
        assert "total" in pagination
        assert "has_more" in pagination
        
        print(f"✅ Paginated Posts: {len(data['posts'])} posts, total={pagination['total']}, has_more={pagination['has_more']}")


class TestAuthenticatedEndpoints:
    """Tests requiring authentication"""
    
    session_token = None
    user_id = None
    
    def get_auth_headers(self):
        return {"Authorization": f"Bearer {TestAuthenticatedEndpoints.session_token}"}
    
    def test_01_login(self):
        """Login with test credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        assert "session_token" in data
        assert "user" in data
        
        TestAuthenticatedEndpoints.session_token = data["session_token"]
        TestAuthenticatedEndpoints.user_id = data["user"]["user_id"]
        
        print(f"✅ Login successful: {data['user']['name']}")
    
    def test_02_get_mana_balance(self):
        """Test getting user's mana balance"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/mana",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "balance" in data, "Mana response should have 'balance'"
        print(f"✅ Mana Balance: {data['balance']} Mana")
    
    def test_03_get_my_vendor_profile(self):
        """Test getting own vendor profile"""
        response = requests.get(
            f"{BASE_URL}/api/roulotte/profile/me",
            headers=self.get_auth_headers()
        )
        
        # May return 404 if no vendor profile exists
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Vendor Profile: {data.get('name', 'Found')}")
        elif response.status_code == 404:
            print("✅ No vendor profile (expected for non-vendor)")
        else:
            assert False, f"Unexpected status: {response.status_code}"
    
    def test_04_get_user_badges(self):
        """Test getting user's badges"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/my-badges",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Badges should be a list"
        print(f"✅ User Badges: {len(data)} badges earned")


class TestVendorDashboardAPI:
    """Tests for vendor dashboard without creating a profile"""
    
    def test_01_vendor_profile_requires_auth(self):
        """Test vendor profile endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/roulotte/profile/me")
        assert response.status_code == 401
        print("✅ Vendor profile requires auth")
    
    def test_02_open_roulotte_requires_auth(self):
        """Test opening roulotte requires authentication"""
        response = requests.post(f"{BASE_URL}/api/roulotte/open", json={
            "lat": -17.6509,
            "lng": -149.4260
        })
        assert response.status_code == 401
        print("✅ Open roulotte requires auth")


class TestAdminLogin:
    """Tests for admin login"""
    
    def test_01_admin_login(self):
        """Test admin login endpoint"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Admin login successful: {data['user']['name']}")
        else:
            print(f"⚠️ Admin login returned: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
