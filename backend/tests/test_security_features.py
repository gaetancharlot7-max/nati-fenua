"""
Test suite for Fenua Social Security & Reporting Features
Tests: Authentication, Reporting, Blocking, Privacy Settings, Security Check
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_EMAIL = f"sectest_{uuid.uuid4().hex[:8]}@test.com"
TEST_PASSWORD = "TestPass123!"
TEST_USER_NAME = "Security Tester"


class TestAuthentication:
    """Test authentication endpoints for security features testing"""
    
    session_token = None
    user_id = None
    
    def test_01_api_root(self):
        """Verify API is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"API accessible: {data.get('message')}")
    
    def test_02_register_user(self):
        """Register a new test user"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_USER_NAME
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "session_token" in data
        TestAuthentication.session_token = data["session_token"]
        TestAuthentication.user_id = data["user"]["user_id"]
        print(f"User registered: {TEST_EMAIL}")
    
    def test_03_login_user(self):
        """Login with test credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "session_token" in data
        assert "user" in data
        TestAuthentication.session_token = data["session_token"]
        print(f"User logged in: {data['user']['name']}")
    
    def test_04_get_current_user(self):
        """Get current authenticated user"""
        headers = {"Authorization": f"Bearer {TestAuthentication.session_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_EMAIL
        print(f"Current user verified: {data['name']}")


class TestReportingSystem:
    """Test content reporting functionality"""
    
    def get_auth_headers(self):
        return {"Authorization": f"Bearer {TestAuthentication.session_token}"}
    
    def test_01_get_report_types(self):
        """Verify all report types are available"""
        response = requests.get(f"{BASE_URL}/api/report/types")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        
        # Check for expected report types
        report_values = [r["value"] for r in data]
        expected_types = ["spam", "harassment", "violence", "nudity", "hate_speech", 
                         "scam", "fake_account", "intellectual_property", "self_harm", "other"]
        for expected in expected_types:
            assert expected in report_values, f"Missing report type: {expected}"
        
        print(f"Found {len(data)} report types: {report_values}")
    
    def test_02_report_content_spam(self):
        """Report content as spam"""
        response = requests.post(
            f"{BASE_URL}/api/report",
            headers=self.get_auth_headers(),
            json={
                "content_type": "post",
                "content_id": "test_post_123",
                "report_type": "spam",
                "description": "Test spam report"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "report_id" in data
        print(f"Spam report submitted: {data['report_id']}")
    
    def test_03_report_content_harassment(self):
        """Report content as harassment"""
        response = requests.post(
            f"{BASE_URL}/api/report",
            headers=self.get_auth_headers(),
            json={
                "content_type": "comment",
                "content_id": "test_comment_456",
                "report_type": "harassment",
                "description": "Test harassment report"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Harassment report submitted: {data['report_id']}")
    
    def test_04_report_self_harm(self):
        """Report self-harm content (highest priority)"""
        response = requests.post(
            f"{BASE_URL}/api/report",
            headers=self.get_auth_headers(),
            json={
                "content_type": "post",
                "content_id": "test_post_urgent",
                "report_type": "self_harm",
                "description": "Test urgent report"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Self-harm report submitted (high priority): {data['report_id']}")
    
    def test_05_report_invalid_type(self):
        """Attempt to report with invalid type"""
        response = requests.post(
            f"{BASE_URL}/api/report",
            headers=self.get_auth_headers(),
            json={
                "content_type": "post",
                "content_id": "test_post",
                "report_type": "invalid_type",
                "description": "Invalid report"
            }
        )
        assert response.status_code == 400
        print("Invalid report type correctly rejected")


class TestBlockingSystem:
    """Test user blocking functionality"""
    
    blocked_user_id = None
    
    def get_auth_headers(self):
        return {"Authorization": f"Bearer {TestAuthentication.session_token}"}
    
    def test_01_block_user(self):
        """Block a user"""
        # Create a fake user ID to block
        fake_user_id = f"user_fake{uuid.uuid4().hex[:8]}"
        TestBlockingSystem.blocked_user_id = fake_user_id
        
        response = requests.post(
            f"{BASE_URL}/api/block/{fake_user_id}",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert data["blocked"] == True
        print(f"User blocked: {fake_user_id}")
    
    def test_02_get_blocked_users(self):
        """Get list of blocked users"""
        response = requests.get(
            f"{BASE_URL}/api/blocked",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Blocked users count: {len(data)}")
    
    def test_03_unblock_user(self):
        """Unblock a previously blocked user (toggle)"""
        response = requests.post(
            f"{BASE_URL}/api/block/{TestBlockingSystem.blocked_user_id}",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert data["blocked"] == False
        print(f"User unblocked: {TestBlockingSystem.blocked_user_id}")
    
    def test_04_cannot_block_self(self):
        """Verify user cannot block themselves"""
        response = requests.post(
            f"{BASE_URL}/api/block/{TestAuthentication.user_id}",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 400
        print("Self-blocking correctly prevented")


class TestPrivacySettings:
    """Test privacy settings functionality"""
    
    def get_auth_headers(self):
        return {"Authorization": f"Bearer {TestAuthentication.session_token}"}
    
    def test_01_get_privacy_settings(self):
        """Get current privacy settings"""
        response = requests.get(
            f"{BASE_URL}/api/privacy/settings",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify default settings structure
        assert "profile_visibility" in data
        assert "show_activity_status" in data
        assert "allow_messages_from" in data
        assert "allow_mentions" in data
        assert "allow_tagging" in data
        assert "show_location" in data
        
        print(f"Privacy settings retrieved: visibility={data['profile_visibility']}")
    
    def test_02_update_profile_visibility(self):
        """Update profile visibility to private"""
        response = requests.put(
            f"{BASE_URL}/api/privacy/settings",
            headers=self.get_auth_headers(),
            json={"profile_visibility": "private"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("Profile visibility updated to private")
    
    def test_03_update_activity_status(self):
        """Toggle activity status visibility"""
        response = requests.put(
            f"{BASE_URL}/api/privacy/settings",
            headers=self.get_auth_headers(),
            json={"show_activity_status": False}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("Activity status visibility disabled")
    
    def test_04_update_messages_setting(self):
        """Update who can send messages"""
        response = requests.put(
            f"{BASE_URL}/api/privacy/settings",
            headers=self.get_auth_headers(),
            json={"allow_messages_from": "followers"}
        )
        assert response.status_code == 200
        print("Messages setting updated to followers only")
    
    def test_05_update_location_privacy(self):
        """Update location privacy to hidden"""
        response = requests.put(
            f"{BASE_URL}/api/privacy/settings",
            headers=self.get_auth_headers(),
            json={"show_location": "hidden"}
        )
        assert response.status_code == 200
        print("Location privacy set to hidden")
    
    def test_06_verify_settings_persistence(self):
        """Verify settings are persisted"""
        response = requests.get(
            f"{BASE_URL}/api/privacy/settings",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify our updates persisted
        assert data["profile_visibility"] == "private"
        assert data["show_activity_status"] == False
        assert data["allow_messages_from"] == "followers"
        assert data["show_location"] == "hidden"
        print("Settings persistence verified")


class TestSecurityCheck:
    """Test security check functionality"""
    
    def get_auth_headers(self):
        return {"Authorization": f"Bearer {TestAuthentication.session_token}"}
    
    def test_01_security_check(self):
        """Get account security status"""
        response = requests.get(
            f"{BASE_URL}/api/security/check",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify security check structure
        assert "security_score" in data
        assert "checks" in data
        assert "recommendations" in data
        
        # Verify checks contain expected fields
        checks = data["checks"]
        assert "strong_password" in checks
        assert "blocked_users_count" in checks
        assert "reports_made" in checks
        
        print(f"Security score: {data['security_score']}%")
        print(f"Recommendations: {[r for r in data['recommendations'] if r]}")


class TestDataRequest:
    """Test GDPR data request functionality"""
    
    def get_auth_headers(self):
        return {"Authorization": f"Bearer {TestAuthentication.session_token}"}
    
    def test_01_request_data_download(self):
        """Request data download (GDPR compliance)"""
        response = requests.post(
            f"{BASE_URL}/api/privacy/data-request",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "request_id" in data
        print(f"Data request submitted: {data['request_id']}")
    
    def test_02_rate_limit_data_request(self):
        """Verify rate limiting on data requests"""
        response = requests.post(
            f"{BASE_URL}/api/privacy/data-request",
            headers=self.get_auth_headers()
        )
        # Should fail due to rate limiting (once per week)
        assert response.status_code == 429
        print("Data request rate limiting working correctly")


class TestAuthenticationRequired:
    """Test endpoints require authentication"""
    
    def test_01_report_requires_auth(self):
        """Report endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/report", json={
            "content_type": "post",
            "content_id": "test",
            "report_type": "spam"
        })
        assert response.status_code == 401
        print("Report endpoint correctly requires auth")
    
    def test_02_block_requires_auth(self):
        """Block endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/block/some_user")
        assert response.status_code == 401
        print("Block endpoint correctly requires auth")
    
    def test_03_privacy_settings_requires_auth(self):
        """Privacy settings requires authentication"""
        response = requests.get(f"{BASE_URL}/api/privacy/settings")
        assert response.status_code == 401
        print("Privacy settings endpoint correctly requires auth")
    
    def test_04_security_check_requires_auth(self):
        """Security check requires authentication"""
        response = requests.get(f"{BASE_URL}/api/security/check")
        assert response.status_code == 401
        print("Security check endpoint correctly requires auth")


class TestLogout:
    """Test logout functionality"""
    
    def test_01_logout(self):
        """Logout user"""
        headers = {"Authorization": f"Bearer {TestAuthentication.session_token}"}
        response = requests.post(f"{BASE_URL}/api/auth/logout", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Déconnecté"
        print("User logged out successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
