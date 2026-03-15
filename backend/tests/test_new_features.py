"""
Test Suite for Hui Fenua New Features
=====================================
Tests: Déconnexion, Traduction FR/TAH, Catégorie Covoiturage, Mot de passe oublié
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "user1@test.com"
TEST_USER_PASSWORD = "TestPass123!"


class TestTranslationAPI:
    """Tests for French ↔ Tahitian Translation API"""
    
    def test_translate_endpoint_exists(self):
        """Test POST /api/translate endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/translate",
            json={"text": "Bonjour", "direction": "fr_to_tah"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ POST /api/translate endpoint exists")
    
    def test_translate_french_to_tahitian(self):
        """Test translation from French to Tahitian"""
        response = requests.post(
            f"{BASE_URL}/api/translate",
            json={
                "text": "Bonjour comment ça va",
                "direction": "fr_to_tah"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "translated" in data, "Response should contain 'translated'"
        assert "original" in data, "Response should contain 'original'"
        assert "direction" in data, "Response should contain 'direction'"
        assert "words_translated" in data, "Response should contain 'words_translated'"
        
        # Verify translation result
        assert data["direction"] == "fr_to_tah"
        assert "ia ora na" in data["translated"].lower(), "Expected 'ia ora na' in translation"
        assert data["words_translated"] > 0, "At least some words should be translated"
        
        print(f"✅ French to Tahitian: '{data['original']}' → '{data['translated']}'")
        print(f"   Words translated: {data['words_translated']}/{data['total_words']}")
    
    def test_translate_tahitian_to_french(self):
        """Test translation from Tahitian to French"""
        response = requests.post(
            f"{BASE_URL}/api/translate",
            json={
                "text": "Ia ora na mauruuru",
                "direction": "tah_to_fr"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["direction"] == "tah_to_fr"
        assert "bonjour" in data["translated"].lower() or "merci" in data["translated"].lower(), \
            "Expected translation to contain 'bonjour' or 'merci'"
        
        print(f"✅ Tahitian to French: '{data['original']}' → '{data['translated']}'")
    
    def test_translate_empty_text(self):
        """Test translation with empty text returns error"""
        response = requests.post(
            f"{BASE_URL}/api/translate",
            json={"text": "", "direction": "fr_to_tah"}
        )
        assert response.status_code == 400, "Empty text should return 400"
        print("✅ Empty text returns 400 error")
    
    def test_translate_invalid_direction(self):
        """Test translation with invalid direction returns error"""
        response = requests.post(
            f"{BASE_URL}/api/translate",
            json={"text": "Bonjour", "direction": "invalid"}
        )
        assert response.status_code == 400, "Invalid direction should return 400"
        print("✅ Invalid direction returns 400 error")
    
    def test_translate_dictionary_stats(self):
        """Test GET /api/translate/dictionary returns stats"""
        response = requests.get(f"{BASE_URL}/api/translate/dictionary")
        assert response.status_code == 200
        data = response.json()
        
        assert "french_words" in data
        assert "tahitian_words" in data
        assert data["french_words"] > 100, "Dictionary should have 100+ French words"
        
        print(f"✅ Dictionary stats: {data['french_words']} French words, {data['tahitian_words']} Tahitian words")
    
    def test_translate_common_phrases(self):
        """Test GET /api/translate/phrases returns common phrases"""
        response = requests.get(f"{BASE_URL}/api/translate/phrases")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 5, "Should have at least 5 common phrases"
        
        # Check structure of phrases
        if data:
            phrase = data[0]
            assert "french" in phrase
            assert "tahitian" in phrase
        
        print(f"✅ Common phrases endpoint returns {len(data)} phrases")


class TestCarpoolCategory:
    """Tests for new Covoiturage (Carpool) category on Fenua Pulse"""
    
    def test_marker_types_includes_carpool(self):
        """Test GET /api/pulse/marker-types includes 'carpool'"""
        response = requests.get(f"{BASE_URL}/api/pulse/marker-types")
        assert response.status_code == 200
        
        types = response.json()
        type_names = [t["type"] for t in types]
        
        assert "carpool" in type_names, "Marker types should include 'carpool'"
        
        # Verify carpool details
        carpool_type = next((t for t in types if t["type"] == "carpool"), None)
        assert carpool_type is not None
        assert carpool_type["color"] == "#10B981", "Carpool color should be emerald (#10B981)"
        assert carpool_type["label"] == "Covoiturage", "Carpool label should be 'Covoiturage'"
        
        print(f"✅ Carpool category found: {carpool_type}")
    
    def test_all_marker_types_present(self):
        """Test all expected marker types are present"""
        response = requests.get(f"{BASE_URL}/api/pulse/marker-types")
        assert response.status_code == 200
        
        types = response.json()
        type_names = [t["type"] for t in types]
        
        expected_types = ["roulotte", "accident", "surf", "event", "webcam", 
                         "weather", "market", "carpool", "other"]
        
        for expected in expected_types:
            assert expected in type_names, f"Missing marker type: {expected}"
        
        print(f"✅ All {len(expected_types)} marker types present: {type_names}")


class TestPasswordReset:
    """Tests for password reset (Mot de passe oublié) feature"""
    
    def test_request_password_reset_endpoint(self):
        """Test POST /api/auth/request-password-reset endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/auth/request-password-reset",
            json={"email": "test@example.com"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "message" in data
        
        print(f"✅ Password reset request: {data['message']}")
    
    def test_password_reset_invalid_email_format(self):
        """Test password reset with invalid email format"""
        response = requests.post(
            f"{BASE_URL}/api/auth/request-password-reset",
            json={"email": "invalid-email"}
        )
        assert response.status_code == 400, "Invalid email should return 400"
        print("✅ Invalid email format returns 400")
    
    def test_password_reset_empty_email(self):
        """Test password reset with empty email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/request-password-reset",
            json={"email": ""}
        )
        assert response.status_code == 400, "Empty email should return 400"
        print("✅ Empty email returns 400")
    
    def test_password_reset_nonexistent_email(self):
        """Test password reset for non-existent email (should still succeed to prevent enumeration)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/request-password-reset",
            json={"email": "nonexistent_user_12345@example.com"}
        )
        # Should return success to prevent email enumeration attacks
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        
        print("✅ Non-existent email returns success (prevents enumeration)")


class TestLogoutEndpoints:
    """Tests for logout functionality"""
    
    def test_logout_endpoint_exists(self):
        """Test POST /api/auth/logout endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/auth/logout")
        # Should return 200 even without auth
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ Logout endpoint: {data['message']}")
    
    def test_logout_with_session(self):
        """Test logout with valid session"""
        # First login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
        )
        
        if login_response.status_code == 200:
            session = requests.Session()
            cookies = login_response.cookies
            
            # Now logout
            logout_response = session.post(
                f"{BASE_URL}/api/auth/logout",
                cookies=cookies
            )
            assert logout_response.status_code == 200
            print("✅ Logout with session works correctly")
        else:
            print(f"⚠️ Could not test logout with session (login failed)")
    
    def test_logout_all_devices_requires_auth(self):
        """Test POST /api/auth/logout-all requires authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/logout-all")
        # Should return 401 without auth
        assert response.status_code == 401
        print("✅ Logout all devices requires authentication")


class TestIntegration:
    """Integration tests for authentication flow"""
    
    def test_login_and_access_me(self):
        """Test login and access /api/auth/me"""
        # Login
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
        )
        
        if login_response.status_code == 200:
            data = login_response.json()
            token = data.get("session_token")
            
            # Access /me with token
            me_response = session.get(
                f"{BASE_URL}/api/auth/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert me_response.status_code == 200
            user_data = me_response.json()
            assert user_data.get("email") == TEST_USER_EMAIL
            print(f"✅ Login + auth/me works: {user_data.get('name')}")
        else:
            print(f"⚠️ Login test skipped (status: {login_response.status_code})")
    
    def test_translate_post_requires_valid_post(self):
        """Test POST /api/posts/{post_id}/translate with invalid post"""
        response = requests.post(
            f"{BASE_URL}/api/posts/invalid_post_id/translate",
            json={"direction": "fr_to_tah"}
        )
        assert response.status_code == 404, "Invalid post should return 404"
        print("✅ Translate post with invalid ID returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
