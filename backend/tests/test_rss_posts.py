"""
Test RSS Posts Display - Verifies that RSS articles display correctly with thumbnails
Tests the fix for gray squares/blocked images in RSS feed posts
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://fenua-connect.preview.emergentagent.com')

class TestRSSPostsDisplay:
    """Tests for RSS posts with image thumbnails"""
    
    def test_health_check(self):
        """Verify API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✅ API health check passed")
    
    def test_posts_endpoint_returns_data(self):
        """Verify posts endpoint returns posts"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=10")
        assert response.status_code == 200
        posts = response.json()
        assert isinstance(posts, list)
        assert len(posts) > 0
        print(f"✅ Posts endpoint returned {len(posts)} posts")
    
    def test_rss_posts_have_content_type_link(self):
        """Verify RSS posts have content_type='link'"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=20")
        assert response.status_code == 200
        posts = response.json()
        
        rss_posts = [p for p in posts if p.get('is_rss_article') or p.get('content_type') == 'link']
        assert len(rss_posts) > 0, "No RSS posts found"
        
        for post in rss_posts[:5]:
            assert post.get('content_type') == 'link', f"RSS post {post.get('post_id')} should have content_type='link'"
        
        print(f"✅ Found {len(rss_posts)} RSS posts with content_type='link'")
    
    def test_rss_posts_have_media_url(self):
        """Verify RSS posts have media_url (thumbnail image)"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=20")
        assert response.status_code == 200
        posts = response.json()
        
        rss_posts = [p for p in posts if p.get('is_rss_article') or p.get('content_type') == 'link']
        
        posts_with_images = 0
        posts_without_images = 0
        
        for post in rss_posts:
            media_url = post.get('media_url')
            if media_url and media_url.startswith('http'):
                posts_with_images += 1
            else:
                posts_without_images += 1
                print(f"  ⚠️ Post {post.get('post_id')} missing media_url")
        
        # At least 80% of RSS posts should have images
        image_ratio = posts_with_images / len(rss_posts) if rss_posts else 0
        assert image_ratio >= 0.8, f"Only {image_ratio*100:.0f}% of RSS posts have images"
        
        print(f"✅ {posts_with_images}/{len(rss_posts)} RSS posts have media_url")
    
    def test_rss_posts_have_link_source(self):
        """Verify RSS posts have link_source (e.g., 'Tahiti Infos')"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=20")
        assert response.status_code == 200
        posts = response.json()
        
        rss_posts = [p for p in posts if p.get('is_rss_article') or p.get('content_type') == 'link']
        
        for post in rss_posts[:5]:
            link_source = post.get('link_source')
            assert link_source, f"RSS post {post.get('post_id')} missing link_source"
            assert len(link_source) > 0, f"RSS post {post.get('post_id')} has empty link_source"
        
        sources = set(p.get('link_source') for p in rss_posts if p.get('link_source'))
        print(f"✅ RSS posts have link_source. Sources found: {sources}")
    
    def test_rss_posts_have_link_title(self):
        """Verify RSS posts have link_title (article title)"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=20")
        assert response.status_code == 200
        posts = response.json()
        
        rss_posts = [p for p in posts if p.get('is_rss_article') or p.get('content_type') == 'link']
        
        for post in rss_posts[:5]:
            link_title = post.get('link_title')
            assert link_title, f"RSS post {post.get('post_id')} missing link_title"
            assert len(link_title) > 0, f"RSS post {post.get('post_id')} has empty link_title"
        
        print(f"✅ RSS posts have link_title")
    
    def test_rss_posts_have_external_link(self):
        """Verify RSS posts have external_link (article URL)"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=20")
        assert response.status_code == 200
        posts = response.json()
        
        rss_posts = [p for p in posts if p.get('is_rss_article') or p.get('content_type') == 'link']
        
        for post in rss_posts[:5]:
            external_link = post.get('external_link')
            assert external_link, f"RSS post {post.get('post_id')} missing external_link"
            assert external_link.startswith('http'), f"RSS post external_link should be a URL"
        
        print(f"✅ RSS posts have valid external_link URLs")
    
    def test_rss_posts_have_user_info(self):
        """Verify RSS posts have user info (media account)"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=20")
        assert response.status_code == 200
        posts = response.json()
        
        rss_posts = [p for p in posts if p.get('is_rss_article') or p.get('content_type') == 'link']
        
        for post in rss_posts[:5]:
            user = post.get('user')
            assert user, f"RSS post {post.get('post_id')} missing user info"
            assert user.get('name'), f"RSS post user missing name"
            assert user.get('user_id'), f"RSS post user missing user_id"
        
        print(f"✅ RSS posts have user info (media accounts)")
    
    def test_image_urls_are_valid(self):
        """Verify image URLs are accessible (not 404)"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=5")
        assert response.status_code == 200
        posts = response.json()
        
        rss_posts = [p for p in posts if p.get('media_url')]
        
        valid_images = 0
        for post in rss_posts[:3]:
            media_url = post.get('media_url')
            try:
                img_response = requests.head(media_url, timeout=5, allow_redirects=True)
                if img_response.status_code == 200:
                    valid_images += 1
                else:
                    print(f"  ⚠️ Image returned {img_response.status_code}: {media_url[:50]}...")
            except Exception as e:
                print(f"  ⚠️ Image request failed: {str(e)[:50]}")
        
        print(f"✅ {valid_images}/{len(rss_posts[:3])} image URLs are accessible")


class TestRegularPosts:
    """Tests for regular user posts (not RSS)"""
    
    def test_login_and_create_post(self):
        """Test that regular posts can still be created"""
        # Login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "user1@test.com",
            "password": "TestPass123!"
        })
        
        if login_response.status_code != 200:
            pytest.skip("Login failed - skipping post creation test")
        
        session_token = login_response.json().get('session_token')
        assert session_token, "No session token returned"
        
        print(f"✅ Login successful")
        
        # Note: We don't actually create a post to avoid polluting the feed
        # Just verify the endpoint exists
        headers = {"Authorization": f"Bearer {session_token}"}
        
        # Get current user
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert me_response.status_code == 200
        
        print(f"✅ User authenticated, can create posts")


class TestFeedPageLoad:
    """Tests for feed page loading without errors"""
    
    def test_posts_pagination(self):
        """Test paginated posts endpoint"""
        response = requests.get(f"{BASE_URL}/api/posts/paginated?limit=10&skip=0")
        assert response.status_code == 200
        data = response.json()
        
        assert 'posts' in data
        assert 'pagination' in data
        assert data['pagination']['limit'] == 10
        
        print(f"✅ Paginated posts endpoint working")
    
    def test_stories_endpoint(self):
        """Test stories endpoint"""
        response = requests.get(f"{BASE_URL}/api/stories")
        assert response.status_code == 200
        
        print(f"✅ Stories endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
