#!/usr/bin/env python3
"""
Diagnostic des endpoints - Test individuel de chaque route
"""

import asyncio
import aiohttp
import time
import json
from datetime import datetime

BASE_URL = "https://fenua-chat-debug.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

# All public endpoints to test
PUBLIC_ENDPOINTS = [
    ("GET", "/health"),
    ("GET", "/ping"),
    ("GET", "/posts?limit=10"),
    ("GET", "/stories"),
    ("GET", "/reels"),
    ("GET", "/lives"),
    ("GET", "/news/latest?limit=10"),
    ("GET", "/rss/posts?limit=10"),
    ("GET", "/rss/sources"),
    ("GET", "/marketplace/products?limit=10"),
    ("GET", "/marketplace/services?limit=10"),
    ("GET", "/marketplace/categories"),
    ("GET", "/pulse/islands"),
    ("GET", "/pulse/markers?island=tahiti"),
    ("GET", "/pulse/status"),
    ("GET", "/pulse/marker-types"),
    ("GET", "/pulse/leaderboard"),
    ("GET", "/search/products?q=test"),
    ("GET", "/search/users?q=test"),
    ("GET", "/search/posts?q=test"),
    ("GET", "/translate?text=bonjour&direction=fr_to_tah"),
    ("GET", "/translate/dictionary"),
    ("GET", "/translate/phrases"),
]

# Protected endpoints (need auth)
PROTECTED_ENDPOINTS = [
    ("GET", "/auth/me"),
    ("GET", "/feed?limit=10"),
    ("GET", "/notifications"),
    ("GET", "/notifications/unread-count"),
    ("GET", "/conversations"),
    ("GET", "/saved"),
    ("GET", "/pulse/mana"),
    ("GET", "/pulse/badges/me"),
]

async def test_endpoint(session, method, endpoint, auth_cookie=None):
    url = f"{API_URL}{endpoint}"
    start = time.time()
    
    try:
        headers = {}
        if auth_cookie:
            headers['Cookie'] = auth_cookie
            
        async with session.request(method, url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as response:
            elapsed = (time.time() - start) * 1000
            body = await response.text()
            return {
                "endpoint": endpoint,
                "method": method,
                "status": response.status,
                "time_ms": round(elapsed, 2),
                "body_preview": body[:100] if response.status >= 400 else "OK"
            }
    except Exception as e:
        return {
            "endpoint": endpoint,
            "method": method,
            "status": 0,
            "time_ms": (time.time() - start) * 1000,
            "error": str(e)[:100]
        }

async def login(session):
    """Login and get session cookie"""
    url = f"{API_URL}/auth/login"
    try:
        async with session.post(url, json={"email": "user1@test.com", "password": "TestPass123!"}) as response:
            if response.status == 200:
                cookies = response.cookies
                cookie_str = "; ".join([f"{k}={v.value}" for k, v in cookies.items()])
                return cookie_str
    except:
        pass
    return None

async def run_diagnostic():
    print("=" * 70)
    print("🔍 DIAGNOSTIC DES ENDPOINTS - NATI FENUA")
    print("=" * 70)
    print(f"URL: {BASE_URL}")
    print(f"Heure: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    connector = aiohttp.TCPConnector(limit=10)
    
    async with aiohttp.ClientSession(connector=connector) as session:
        
        # Test public endpoints
        print("\n📡 ENDPOINTS PUBLICS")
        print("-" * 70)
        print(f"{'Endpoint':<45} {'Status':>8} {'Time':>10}")
        print("-" * 70)
        
        public_results = []
        for method, endpoint in PUBLIC_ENDPOINTS:
            result = await test_endpoint(session, method, endpoint)
            public_results.append(result)
            
            status_icon = "✅" if result["status"] == 200 else "❌"
            print(f"{status_icon} {endpoint:<43} {result['status']:>8} {result['time_ms']:>8.0f}ms")
            
            if result["status"] != 200:
                print(f"   └── {result.get('body_preview', result.get('error', 'Unknown'))}")
        
        # Login
        print("\n🔐 AUTHENTIFICATION")
        print("-" * 70)
        
        auth_cookie = await login(session)
        if auth_cookie:
            print(f"✅ Login réussi")
        else:
            print(f"❌ Login échoué")
        
        # Test protected endpoints
        print("\n🔒 ENDPOINTS PROTÉGÉS")
        print("-" * 70)
        print(f"{'Endpoint':<45} {'Status':>8} {'Time':>10}")
        print("-" * 70)
        
        protected_results = []
        for method, endpoint in PROTECTED_ENDPOINTS:
            result = await test_endpoint(session, method, endpoint, auth_cookie)
            protected_results.append(result)
            
            status_icon = "✅" if result["status"] == 200 else "❌"
            print(f"{status_icon} {endpoint:<43} {result['status']:>8} {result['time_ms']:>8.0f}ms")
            
            if result["status"] != 200:
                print(f"   └── {result.get('body_preview', result.get('error', 'Unknown'))}")
        
        # Summary
        all_results = public_results + protected_results
        success = sum(1 for r in all_results if r["status"] == 200)
        failed = len(all_results) - success
        avg_time = sum(r["time_ms"] for r in all_results) / len(all_results)
        
        print("\n" + "=" * 70)
        print("📊 RÉSUMÉ")
        print("=" * 70)
        print(f"Total endpoints testés: {len(all_results)}")
        print(f"Succès (200): {success}")
        print(f"Échecs: {failed}")
        print(f"Taux de succès: {success/len(all_results)*100:.1f}%")
        print(f"Temps moyen: {avg_time:.0f}ms")
        
        # List failed endpoints
        if failed > 0:
            print("\n❌ ENDPOINTS EN ÉCHEC:")
            for r in all_results:
                if r["status"] != 200:
                    print(f"  - {r['endpoint']}: {r['status']}")
        
        return all_results

if __name__ == "__main__":
    asyncio.run(run_diagnostic())
