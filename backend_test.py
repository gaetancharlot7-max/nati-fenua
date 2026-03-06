import requests
import sys
from datetime import datetime
import json

class FenuaSocialAPITester:
    def __init__(self, base_url="https://fenua-connect.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, success, details="", expected_status=None, actual_status=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED")
            if expected_status and actual_status:
                print(f"   Expected: {expected_status}, Got: {actual_status}")
            if details:
                print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "expected_status": expected_status,
            "actual_status": actual_status
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            self.log_result(name, success, 
                          response.text[:200] if not success else "",
                          expected_status, response.status_code)

            return success, response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text

        except requests.exceptions.RequestException as e:
            self.log_result(name, False, f"Request failed: {str(e)}")
            return False, {}
        except Exception as e:
            self.log_result(name, False, f"Unexpected error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        print("\n🔍 Testing Root Endpoint...")
        success, response = self.run_test(
            "Root endpoint welcome message",
            "GET",
            "/api/",
            200
        )
        return success

    def test_auth_registration(self):
        """Test user registration"""
        print("\n🔍 Testing User Registration...")
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "email": f"test_user_{timestamp}@fenua.pf",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}"
        }
        
        success, response = self.run_test(
            "User registration",
            "POST",
            "/api/auth/register",
            200,
            data=test_user
        )
        
        if success and 'session_token' in response:
            self.session_token = response['session_token']
            if 'user' in response and 'user_id' in response['user']:
                self.user_id = response['user']['user_id']
            print(f"   Session token obtained: {self.session_token[:20]}...")
            
        return success

    def test_auth_login(self):
        """Test user login with existing account"""
        print("\n🔍 Testing User Login...")
        
        # Create a user first for login test
        timestamp = datetime.now().strftime('%H%M%S')
        registration_data = {
            "email": f"login_test_{timestamp}@fenua.pf",
            "password": "LoginTest123!",
            "name": f"Login Test {timestamp}"
        }
        
        # Register user
        success, reg_response = self.run_test(
            "User registration for login test",
            "POST",
            "/api/auth/register",
            200,
            data=registration_data
        )
        
        if not success:
            return False
            
        # Now test login
        login_data = {
            "email": registration_data["email"],
            "password": registration_data["password"]
        }
        
        success, response = self.run_test(
            "User login",
            "POST",
            "/api/auth/login",
            200,
            data=login_data
        )
        
        return success

    def test_posts_endpoints(self):
        """Test posts related endpoints"""
        print("\n🔍 Testing Posts Endpoints...")
        
        # Test get all posts
        success, _ = self.run_test(
            "Get posts list",
            "GET",
            "/api/posts",
            200
        )
        
        if not success:
            return False
            
        # Test create post (requires auth)
        if self.session_token:
            post_data = {
                "content_type": "photo",
                "media_url": "https://images.unsplash.com/photo-1723958286930-b32795ed2bbd?w=800",
                "caption": "Test post from API testing",
                "location": "Test Location"
            }
            
            success, response = self.run_test(
                "Create post (authenticated)",
                "POST",
                "/api/posts",
                200,
                data=post_data
            )
            
            return success
        else:
            print("⚠️  Skipping authenticated post creation - no session token")
            return True

    def test_marketplace_endpoints(self):
        """Test marketplace related endpoints"""
        print("\n🔍 Testing Marketplace Endpoints...")
        
        results = []
        
        # Test get products
        success, _ = self.run_test(
            "Get marketplace products",
            "GET",
            "/api/marketplace/products",
            200
        )
        results.append(success)
        
        # Test get services
        success, _ = self.run_test(
            "Get marketplace services",
            "GET",
            "/api/marketplace/services",
            200
        )
        results.append(success)
        
        # Test get categories
        success, response = self.run_test(
            "Get marketplace categories",
            "GET",
            "/api/marketplace/categories",
            200
        )
        results.append(success)
        
        if success and isinstance(response, dict):
            if 'products' in response and 'services' in response:
                print(f"   Categories loaded: {len(response.get('products', []))} product categories, {len(response.get('services', []))} service categories")
            else:
                print("   Warning: Categories response format unexpected")
        
        return all(results)

    def test_stories_endpoint(self):
        """Test stories endpoint"""
        print("\n🔍 Testing Stories Endpoint...")
        success, _ = self.run_test(
            "Get stories",
            "GET",
            "/api/stories",
            200
        )
        return success

    def test_auth_me_endpoint(self):
        """Test auth/me endpoint"""
        print("\n🔍 Testing Auth Me Endpoint...")
        if self.session_token:
            success, _ = self.run_test(
                "Get current user info",
                "GET",
                "/api/auth/me",
                200
            )
            return success
        else:
            print("⚠️  Skipping auth/me test - no session token")
            return True

    def test_live_streams_endpoints(self):
        """Test live streaming endpoints"""
        print("\n🔍 Testing Live Streaming Endpoints...")
        
        # Test get active lives
        success, response = self.run_test(
            "Get active live streams",
            "GET",
            "/api/lives",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} active live streams")
        
        return success

    def test_chat_endpoints(self):
        """Test chat/messaging endpoints"""
        print("\n🔍 Testing Chat Endpoints...")
        
        if not self.session_token:
            print("⚠️  Skipping chat tests - no session token")
            return True
        
        # Test get conversations
        success, response = self.run_test(
            "Get conversations list",
            "GET",
            "/api/conversations",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} conversations")
        
        return success

    def test_ads_endpoints(self):
        """Test advertising system endpoints"""
        print("\n🔍 Testing Advertising Endpoints...")
        
        results = []
        
        # Test get ad pricing (public endpoint)
        success, response = self.run_test(
            "Get ad pricing packages",
            "GET",
            "/api/ads/pricing",
            200
        )
        results.append(success)
        
        if success and isinstance(response, dict):
            packages = response.get('packages', [])
            print(f"   Found {len(packages)} pricing packages")
            if packages:
                print(f"   Price range: {packages[0].get('price', 'N/A')} - {packages[-1].get('price', 'N/A')} XPF")
        
        # Test get campaigns (requires auth)
        if self.session_token:
            success, response = self.run_test(
                "Get ad campaigns (authenticated)",
                "GET",
                "/api/ads/campaigns",
                200
            )
            results.append(success)
            
            if success and isinstance(response, list):
                print(f"   User has {len(response)} ad campaigns")
        else:
            print("⚠️  Skipping authenticated ads tests - no session token")
            results.append(True)  # Don't fail the test for missing auth
        
        return all(results)

    def test_version_endpoint(self):
        """Test API version endpoint"""
        print("\n🔍 Testing API Version...")
        success, response = self.run_test(
            "Check API version",
            "GET",
            "/api/",
            200
        )
        
        if success and isinstance(response, dict):
            version = response.get('version', 'Unknown')
            print(f"   API Version: {version}")
            if version == "2.0.0":
                print("   ✅ Correct v2.0.0 version detected")
            else:
                print(f"   ⚠️  Expected v2.0.0, got {version}")
        
        return success

    def test_reactions_system(self):
        """Test multiple reactions system"""
        print("\n🔍 Testing Multiple Reactions System...")
        
        if not self.session_token:
            print("⚠️  Skipping reactions test - no session token")
            return True
        
        # First create a test post
        post_data = {
            "content_type": "photo",
            "media_url": "https://images.unsplash.com/photo-1723958286930-b32795ed2bbd?w=800",
            "caption": "Test post for reactions",
            "location": "Test Location"
        }
        
        success, post_response = self.run_test(
            "Create post for reaction testing",
            "POST",
            "/api/posts",
            200,
            data=post_data
        )
        
        if not success or not post_response.get('post_id'):
            print("   ❌ Could not create test post for reactions")
            return False
        
        post_id = post_response['post_id']
        print(f"   Created test post: {post_id}")
        
        # Test different reaction types
        reaction_types = ['like', 'love', 'fire', 'haha', 'wow']
        reactions_success = []
        
        for reaction in reaction_types:
            success, _ = self.run_test(
                f"React with {reaction}",
                "POST",
                f"/api/posts/{post_id}/react",
                200,
                data={"reaction": reaction}
            )
            reactions_success.append(success)
        
        return all(reactions_success)

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Fenua Social v2 Backend API Tests...")
        print(f"Testing against: {self.base_url}")
        print("-" * 60)

        # Test basic connectivity and version
        version_success = self.test_version_endpoint()
        root_success = self.test_root_endpoint()
        
        # Test authentication
        register_success = self.test_auth_registration()
        login_success = self.test_auth_login()
        me_success = self.test_auth_me_endpoint()
        
        # Test main features
        posts_success = self.test_posts_endpoints()
        marketplace_success = self.test_marketplace_endpoints()
        stories_success = self.test_stories_endpoint()
        
        # Test v2 new features
        lives_success = self.test_live_streams_endpoints()
        chat_success = self.test_chat_endpoints()
        ads_success = self.test_ads_endpoints()
        reactions_success = self.test_reactions_system()
        
        # Print final results
        print("\n" + "="*60)
        print("📊 FENUA SOCIAL v2 BACKEND TEST RESULTS")
        print("="*60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Categorize results
        critical_tests = [version_success, root_success, register_success, login_success]
        feature_tests = [posts_success, marketplace_success, stories_success, me_success, lives_success, chat_success, ads_success, reactions_success]
        
        critical_passed = sum(critical_tests)
        feature_passed = sum(feature_tests)
        
        print(f"\nCritical APIs: {critical_passed}/{len(critical_tests)} passed")
        print(f"v2 Feature APIs: {feature_passed}/{len(feature_tests)} passed")
        
        # Detailed breakdown
        print(f"\n📋 Feature Test Breakdown:")
        print(f"   Version Check: {'✅' if version_success else '❌'}")
        print(f"   Authentication: {'✅' if all([register_success, login_success]) else '❌'}")
        print(f"   Posts & Stories: {'✅' if all([posts_success, stories_success]) else '❌'}")
        print(f"   Multiple Reactions: {'✅' if reactions_success else '❌'}")
        print(f"   Live Streaming: {'✅' if lives_success else '❌'}")
        print(f"   Chat/Messaging: {'✅' if chat_success else '❌'}")
        print(f"   Ads System: {'✅' if ads_success else '❌'}")
        print(f"   Marketplace: {'✅' if marketplace_success else '❌'}")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All tests passed! Fenua Social v2 backend is working correctly.")
            return 0
        elif critical_passed == len(critical_tests):
            print("\n✅ Critical functionality working, some v2 features may have issues.")
            return 1
        else:
            print("\n❌ Critical API failures detected. Backend needs attention.")
            return 2

def main():
    print("Fenua Social Backend API Test Suite")
    print("====================================")
    
    tester = FenuaSocialAPITester()
    exit_code = tester.run_all_tests()
    
    return exit_code

if __name__ == "__main__":
    sys.exit(main())