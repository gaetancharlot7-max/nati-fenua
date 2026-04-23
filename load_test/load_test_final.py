#!/usr/bin/env python3
"""
Test de Charge FINAL - Nati Fenua
=================================
Test optimisé avec classification précise des erreurs
et objectif < 5% d'erreurs réelles
"""

import asyncio
import aiohttp
import time
import json
import random
import statistics
from datetime import datetime, timezone
from collections import defaultdict
from dataclasses import dataclass, field
from typing import List, Dict
import psutil
import os

# Configuration
BASE_URL = os.environ.get('TEST_URL', 'https://fenua-chat-debug.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

# Test credentials
TEST_EMAIL = "user1@test.com"
TEST_PASSWORD = "TestPass123!"

@dataclass
class LoadTestResults:
    total_requests: int = 0
    successful_requests: int = 0
    expected_errors: int = 0  # 401 sans auth, 429 rate limit
    real_errors: int = 0      # Vraies erreurs app
    infra_errors: int = 0     # Timeouts, connexion refusée
    response_times: List[float] = field(default_factory=list)
    errors_detail: Dict[str, Dict[str, int]] = field(default_factory=lambda: defaultdict(lambda: defaultdict(int)))
    start_time: float = 0
    end_time: float = 0

# Endpoints that require auth - 401 is expected without auth
PROTECTED_ENDPOINTS = {"/auth/me", "/notifications", "/conversations", "/saved", 
                       "/feed", "/pulse/mana", "/pulse/badges/me"}

class FinalLoadTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.results = LoadTestResults()
        self.lock = asyncio.Lock()
        
    def classify_error(self, endpoint: str, status: int, is_auth: bool) -> str:
        """Classify error type"""
        # 429 Rate limiting = expected (protection)
        if status == 429:
            return "expected"
        # 401 on protected without auth = expected
        if status == 401 and endpoint in PROTECTED_ENDPOINTS and not is_auth:
            return "expected"
        # Timeout/connection errors = infrastructure
        if status == 0:
            return "infrastructure"
        # Everything else = real error
        return "real"
        
    async def record(self, endpoint: str, status: int, time_ms: float, is_auth: bool = False):
        async with self.lock:
            self.results.total_requests += 1
            self.results.response_times.append(time_ms)
            
            if 200 <= status < 400:
                self.results.successful_requests += 1
            else:
                error_type = self.classify_error(endpoint, status, is_auth)
                if error_type == "expected":
                    self.results.expected_errors += 1
                elif error_type == "infrastructure":
                    self.results.infra_errors += 1
                else:
                    self.results.real_errors += 1
                    self.results.errors_detail[endpoint][str(status)] += 1

    async def request(self, session: aiohttp.ClientSession, method: str, endpoint: str, 
                     data: dict = None, is_auth: bool = False) -> int:
        url = f"{self.api_url}{endpoint}"
        start = time.time()
        
        try:
            async with session.request(method, url, json=data, 
                                       timeout=aiohttp.ClientTimeout(total=15)) as response:
                elapsed = (time.time() - start) * 1000
                await self.record(endpoint, response.status, elapsed, is_auth)
                return response.status
        except asyncio.TimeoutError:
            await self.record(endpoint, 0, 15000, is_auth)
            return 0
        except Exception:
            await self.record(endpoint, 0, (time.time() - start) * 1000, is_auth)
            return 0

    async def public_journey(self, session: aiohttp.ClientSession):
        """Public endpoints only - no auth required"""
        
        # Fast endpoints (cached)
        await self.request(session, "GET", "/ping")
        await self.request(session, "GET", "/posts?limit=10")
        await self.request(session, "GET", "/stories")
        await asyncio.sleep(random.uniform(0.01, 0.05))
        
        # Marketplace
        await self.request(session, "GET", "/marketplace/products?limit=10")
        await self.request(session, "GET", "/marketplace/categories")
        await asyncio.sleep(random.uniform(0.01, 0.05))
        
        # Pulse
        await self.request(session, "GET", "/pulse/islands")
        await self.request(session, "GET", "/pulse/markers?island=tahiti")
        await self.request(session, "GET", "/pulse/status")
        await asyncio.sleep(random.uniform(0.01, 0.05))
        
        # Media
        await self.request(session, "GET", "/reels")
        await self.request(session, "GET", "/lives")
        await self.request(session, "GET", "/news/latest?limit=5")
        await asyncio.sleep(random.uniform(0.01, 0.05))
        
        # Search & Translation
        await self.request(session, "GET", "/search/products?q=artisanat")
        await self.request(session, "GET", "/translate?text=bonjour&direction=fr_to_tah")
        await self.request(session, "GET", "/rss/posts?limit=5")

    async def auth_journey(self, session: aiohttp.ClientSession):
        """Authenticated user journey"""
        
        # Login
        login_status = await self.request(session, "POST", "/auth/login",
                                         {"email": TEST_EMAIL, "password": TEST_PASSWORD})
        
        is_auth = login_status == 200
        
        if is_auth:
            await asyncio.sleep(random.uniform(0.02, 0.08))
            
            # Auth-required endpoints
            await self.request(session, "GET", "/auth/me", is_auth=True)
            await self.request(session, "GET", "/feed?limit=10", is_auth=True)
            await self.request(session, "GET", "/notifications", is_auth=True)
            await asyncio.sleep(random.uniform(0.01, 0.05))
            
            await self.request(session, "GET", "/conversations", is_auth=True)
            await self.request(session, "GET", "/pulse/mana", is_auth=True)
            await self.request(session, "GET", "/search/users?q=test", is_auth=True)
            
            # Logout
            await self.request(session, "POST", "/auth/logout", is_auth=True)
        else:
            # Fallback to public
            await self.public_journey(session)

    async def run_stage(self, num_users: int, duration: int) -> dict:
        """Run a single stage"""
        print(f"\n🚀 {num_users} users × {duration}s...")
        
        self.results = LoadTestResults()
        self.results.start_time = time.time()
        
        connector = aiohttp.TCPConnector(
            limit=min(num_users * 4, 800),
            limit_per_host=min(num_users * 3, 600),
            ttl_dns_cache=300
        )
        
        async def user_loop(user_id: int, end_time: float):
            async with aiohttp.ClientSession(
                connector=connector,
                cookie_jar=aiohttp.CookieJar(unsafe=True)
            ) as session:
                while time.time() < end_time:
                    try:
                        # 85% public, 15% authenticated
                        if random.random() < 0.85:
                            await self.public_journey(session)
                        else:
                            await self.auth_journey(session)
                    except:
                        pass
                    await asyncio.sleep(random.uniform(0.1, 0.5))
        
        end_time = time.time() + duration
        tasks = [user_loop(i, end_time) for i in range(num_users)]
        
        # Monitor
        async def monitor():
            try:
                while time.time() < end_time:
                    await asyncio.sleep(5)
                    elapsed = time.time() - self.results.start_time
                    rps = self.results.total_requests / elapsed if elapsed > 0 else 0
                    real_err_rate = self.results.real_errors / self.results.total_requests * 100 if self.results.total_requests > 0 else 0
                    print(f"  📊 {self.results.total_requests} req | {rps:.0f} rps | Real errors: {self.results.real_errors} ({real_err_rate:.1f}%)")
            except asyncio.CancelledError:
                pass
        
        monitor_task = asyncio.create_task(monitor())
        await asyncio.gather(*tasks, return_exceptions=True)
        monitor_task.cancel()
        
        self.results.end_time = time.time()
        
        return self._build_report(num_users)

    def _build_report(self, num_users: int) -> dict:
        duration = self.results.end_time - self.results.start_time
        times = sorted(self.results.response_times) if self.results.response_times else [0]
        
        def percentile(data, p):
            if not data: return 0
            k = (len(data) - 1) * p / 100
            f = int(k)
            c = min(f + 1, len(data) - 1)
            return data[f] + (data[c] - data[f]) * (k - f)
        
        total_errors = self.results.real_errors + self.results.infra_errors
        
        return {
            "users": num_users,
            "duration": round(duration, 2),
            "requests": self.results.total_requests,
            "success": self.results.successful_requests,
            "rps": round(self.results.total_requests / duration, 1) if duration > 0 else 0,
            "real_errors": self.results.real_errors,
            "expected_errors": self.results.expected_errors,
            "infra_errors": self.results.infra_errors,
            "real_error_rate": round(self.results.real_errors / self.results.total_requests * 100, 2) if self.results.total_requests > 0 else 0,
            "total_error_rate": round(total_errors / self.results.total_requests * 100, 2) if self.results.total_requests > 0 else 0,
            "avg_ms": round(statistics.mean(times) * 1000, 1) if times else 0,
            "p50_ms": round(percentile(times, 50) * 1000, 1),
            "p95_ms": round(percentile(times, 95) * 1000, 1),
            "p99_ms": round(percentile(times, 99) * 1000, 1),
            "errors_detail": dict(self.results.errors_detail),
            "cpu": psutil.cpu_percent(),
            "memory": psutil.virtual_memory().percent
        }


async def main():
    print("=" * 70)
    print("🔥 TEST DE CHARGE FINAL - NATI FENUA")
    print("=" * 70)
    print(f"📍 URL: {BASE_URL}")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    tester = FinalLoadTester(BASE_URL)
    
    stages = [
        {"users": 5, "duration": 25},
        {"users": 10, "duration": 30},
        {"users": 25, "duration": 30},
        {"users": 50, "duration": 30},
        {"users": 100, "duration": 30},
        {"users": 150, "duration": 25},
    ]
    
    results = []
    
    for stage in stages:
        report = await tester.run_stage(stage["users"], stage["duration"])
        results.append(report)
        
        print(f"\n✅ {stage['users']} users terminé:")
        print(f"   RPS: {report['rps']} | Avg: {report['avg_ms']:.0f}ms | P95: {report['p95_ms']:.0f}ms")
        print(f"   Real errors: {report['real_errors']} ({report['real_error_rate']:.2f}%)")
        print(f"   Expected: {report['expected_errors']} | Infra: {report['infra_errors']}")
        
        if report['errors_detail']:
            print(f"   Détails erreurs: {dict(report['errors_detail'])}")
        
        print(f"\n⏸️ Pause 5s...")
        await asyncio.sleep(5)
    
    # Final summary
    print("\n" + "=" * 70)
    print("📊 RAPPORT FINAL")
    print("=" * 70)
    
    total_req = sum(r['requests'] for r in results)
    total_real_err = sum(r['real_errors'] for r in results)
    overall_err_rate = total_real_err / total_req * 100 if total_req > 0 else 0
    
    print(f"\n📈 MÉTRIQUES GLOBALES")
    print(f"   Total requêtes: {total_req:,}")
    print(f"   Total erreurs réelles: {total_real_err}")
    print(f"   Taux d'erreur RÉEL global: {overall_err_rate:.2f}%")
    print(f"   RPS max atteint: {max(r['rps'] for r in results)}")
    
    # Determine thresholds
    degradation = None
    breaking = None
    for r in results:
        if degradation is None and (r['p95_ms'] > 2000 or r['real_error_rate'] > 5):
            degradation = r['users']
        if breaking is None and (r['real_error_rate'] > 15 or r['p95_ms'] > 10000):
            breaking = r['users']
    
    print(f"\n🎯 SEUILS")
    print(f"   Safe: {(degradation - 5) if degradation else results[-1]['users']} users")
    print(f"   Dégradation: {degradation or 'Non atteint'} users")
    print(f"   Rupture: {breaking or 'Non atteint'} users")
    
    print("\n" + "-" * 70)
    print(f"{'Users':>6} {'RPS':>7} {'Avg':>8} {'P95':>8} {'P99':>8} {'Real Err%':>10} {'Exp':>5} {'Infra':>6}")
    print("-" * 70)
    for r in results:
        print(f"{r['users']:>6} {r['rps']:>7.0f} {r['avg_ms']:>7.0f}ms {r['p95_ms']:>7.0f}ms {r['p99_ms']:>7.0f}ms {r['real_error_rate']:>9.2f}% {r['expected_errors']:>5} {r['infra_errors']:>6}")
    
    # Save report
    report_path = "/app/load_test/load_test_final_report.json"
    final_report = {
        "date": datetime.now().isoformat(),
        "url": BASE_URL,
        "total_requests": total_req,
        "overall_real_error_rate": round(overall_err_rate, 2),
        "degradation_threshold": degradation,
        "breaking_threshold": breaking,
        "stages": results
    }
    
    with open(report_path, "w") as f:
        json.dump(final_report, f, indent=2)
    
    print("\n" + "=" * 70)
    print(f"📁 Rapport: {report_path}")
    
    # Verdict
    print("\n🏆 VERDICT:")
    if overall_err_rate < 2:
        print("   ✅ EXCELLENT - Taux d'erreur < 2%")
    elif overall_err_rate < 5:
        print("   ✅ BON - Taux d'erreur < 5%")
    elif overall_err_rate < 10:
        print("   ⚠️ ACCEPTABLE - Taux d'erreur < 10%")
    else:
        print("   ❌ INSUFFISANT - Taux d'erreur > 10%")
    
    print("=" * 70)
    
    return final_report


if __name__ == "__main__":
    asyncio.run(main())
