#!/usr/bin/env python3
"""
Hui Fenua - Test de Charge v2 avec 200 Bots Simultanés
======================================================
Version améliorée avec pool de comptes et meilleure gestion des erreurs.
"""

import asyncio
import aiohttp
import random
import string
import time
import json
import statistics
from datetime import datetime
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
import sys

# Configuration
API_URL = "https://fenua-connect.preview.emergentagent.com/api"
NUM_BOTS = 200
BATCH_SIZE = 25  # Bots par batch
MAX_CONCURRENT = 50  # Connexions simultanées max

# Comptes de test pré-existants (seront créés si nécessaires)
TEST_ACCOUNTS_BASE = [
    ("user1@test.com", "TestPass123!"),
    ("user2@test.com", "TestPass123!"),
    ("admin@test.com", "AdminPass123!"),
]

@dataclass
class TestResult:
    endpoint: str
    method: str
    status_code: int
    response_time_ms: float
    success: bool
    error_message: Optional[str] = None
    validated: bool = False
    bot_id: int = 0

@dataclass 
class EndpointStats:
    endpoint: str
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    response_times: List[float] = field(default_factory=list)
    status_codes: Dict[int, int] = field(default_factory=lambda: defaultdict(int))
    validation_passed: int = 0
    validation_failed: int = 0
    errors: List[str] = field(default_factory=list)

class LoadTesterV2:
    def __init__(self):
        self.endpoint_stats: Dict[str, EndpointStats] = {}
        self.all_results: List[TestResult] = []
        self.start_time: float = 0
        self.end_time: float = 0
        self.total_requests: int = 0
        self.authenticated_sessions: List[Tuple[str, str]] = []  # (session_token, user_id)
        self.lock = asyncio.Lock()
        self.progress = {"completed": 0, "total": 0}
        
    async def authenticate_pool(self, session: aiohttp.ClientSession, num_accounts: int = 20) -> List[Tuple[str, str]]:
        """Create a pool of authenticated sessions"""
        sessions = []
        
        print(f"🔐 Création du pool de {num_accounts} sessions authentifiées...")
        
        # First try existing test accounts
        for email, password in TEST_ACCOUNTS_BASE:
            try:
                async with session.post(
                    f"{API_URL}/auth/login",
                    json={"email": email, "password": password},
                    timeout=30
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        if "session_token" in data:
                            sessions.append((data["session_token"], data["user"]["user_id"]))
                            print(f"  ✅ {email} connecté")
            except Exception as e:
                print(f"  ⚠️ {email}: {str(e)[:50]}")
        
        # Create additional accounts if needed
        for i in range(num_accounts - len(sessions)):
            email = f"loadbot_{i}_{random.randint(1000,9999)}@test.com"
            password = "LoadTest123!"
            name = f"LoadBot{i}"
            
            try:
                # Try to register
                async with session.post(
                    f"{API_URL}/auth/register",
                    json={"email": email, "password": password, "name": name},
                    timeout=30
                ) as response:
                    if response.status in [200, 201]:
                        data = await response.json()
                        if "session_token" in data:
                            sessions.append((data["session_token"], data["user"]["user_id"]))
                    elif response.status == 400:
                        # Account might already exist, try login
                        async with session.post(
                            f"{API_URL}/auth/login",
                            json={"email": email, "password": password},
                            timeout=30
                        ) as login_resp:
                            if login_resp.status == 200:
                                data = await login_resp.json()
                                if "session_token" in data:
                                    sessions.append((data["session_token"], data["user"]["user_id"]))
            except Exception as e:
                pass
            
            if len(sessions) >= num_accounts:
                break
            
            await asyncio.sleep(0.1)
        
        print(f"  📊 {len(sessions)} sessions créées")
        return sessions

    async def make_request(
        self,
        session: aiohttp.ClientSession,
        method: str,
        endpoint: str,
        session_token: Optional[str] = None,
        data: Optional[dict] = None,
        validate_fn: Optional[callable] = None,
        bot_id: int = 0
    ) -> Tuple[TestResult, Optional[dict]]:
        """Make an API request and record metrics"""
        url = f"{API_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        cookies = {}
        
        if session_token:
            cookies["session_token"] = session_token
        
        start_time = time.time()
        response_data = None
        
        try:
            if method == "GET":
                async with session.get(url, headers=headers, cookies=cookies, timeout=30) as response:
                    status_code = response.status
                    try:
                        response_data = await response.json()
                    except:
                        response_data = None
            elif method == "POST":
                async with session.post(url, json=data, headers=headers, cookies=cookies, timeout=30) as response:
                    status_code = response.status
                    try:
                        response_data = await response.json()
                    except:
                        response_data = None
            elif method == "PUT":
                async with session.put(url, json=data, headers=headers, cookies=cookies, timeout=30) as response:
                    status_code = response.status
                    try:
                        response_data = await response.json()
                    except:
                        response_data = None
            elif method == "DELETE":
                async with session.delete(url, headers=headers, cookies=cookies, timeout=30) as response:
                    status_code = response.status
                    try:
                        response_data = await response.json()
                    except:
                        response_data = None
            else:
                raise ValueError(f"Unknown method: {method}")
            
            response_time_ms = (time.time() - start_time) * 1000
            success = 200 <= status_code < 400
            
            validated = False
            if validate_fn and success and response_data:
                try:
                    validated = validate_fn(response_data)
                except:
                    validated = False
            
            return TestResult(
                endpoint=endpoint,
                method=method,
                status_code=status_code,
                response_time_ms=response_time_ms,
                success=success,
                validated=validated,
                bot_id=bot_id
            ), response_data
            
        except asyncio.TimeoutError:
            response_time_ms = (time.time() - start_time) * 1000
            return TestResult(
                endpoint=endpoint,
                method=method,
                status_code=0,
                response_time_ms=response_time_ms,
                success=False,
                error_message="Timeout",
                bot_id=bot_id
            ), None
        except Exception as e:
            response_time_ms = (time.time() - start_time) * 1000
            return TestResult(
                endpoint=endpoint,
                method=method,
                status_code=0,
                response_time_ms=response_time_ms,
                success=False,
                error_message=str(e)[:100],
                bot_id=bot_id
            ), None

    def record_result(self, result: TestResult):
        """Record a test result"""
        async def _record():
            async with self.lock:
                self.all_results.append(result)
                self.total_requests += 1
                
                if result.endpoint not in self.endpoint_stats:
                    self.endpoint_stats[result.endpoint] = EndpointStats(endpoint=result.endpoint)
                
                stats = self.endpoint_stats[result.endpoint]
                stats.total_requests += 1
                stats.response_times.append(result.response_time_ms)
                stats.status_codes[result.status_code] += 1
                
                if result.success:
                    stats.successful_requests += 1
                    if result.validated:
                        stats.validation_passed += 1
                    else:
                        stats.validation_failed += 1
                else:
                    stats.failed_requests += 1
                    if result.error_message:
                        stats.errors.append(result.error_message)
        
        asyncio.create_task(_record())

    async def run_bot_tests(
        self,
        session: aiohttp.ClientSession,
        bot_id: int,
        session_token: str,
        user_id: str
    ):
        """Run all tests for a single bot"""
        
        tests = [
            # ===== PUBLIC ENDPOINTS =====
            ("GET", "/pulse/islands", None, lambda r: isinstance(r, list)),
            ("GET", "/pulse/marker-types", None, lambda r: isinstance(r, list)),
            ("GET", "/pulse/markers?island=tahiti", None, lambda r: isinstance(r, list)),
            ("GET", "/pulse/status", None, lambda r: isinstance(r, dict)),
            ("GET", "/pulse/leaderboard", None, lambda r: isinstance(r, list)),
            
            # ===== AUTHENTICATED ENDPOINTS =====
            ("GET", "/auth/me", None, lambda r: "user_id" in r),
            ("GET", "/feed?page=1&per_page=10", None, lambda r: "posts" in r),
            ("GET", "/stories", None, lambda r: isinstance(r, list)),
            ("GET", "/conversations", None, lambda r: isinstance(r, list)),
            ("GET", "/notifications", None, lambda r: isinstance(r, (list, dict))),
            
            # ===== FENUA PULSE TESTS =====
            ("GET", "/pulse/markers?types=roulotte", None, lambda r: isinstance(r, list)),
            ("GET", "/pulse/markers?types=webcam", None, lambda r: isinstance(r, list)),
            ("GET", "/pulse/markers?types=surf", None, lambda r: isinstance(r, list)),
            ("GET", "/pulse/markers?types=event", None, lambda r: isinstance(r, list)),
            
            # ===== ROULOTTE TESTS =====
            ("GET", "/roulotte/nearby?lat=-17.532&lng=-149.5685&radius=50", None, lambda r: isinstance(r, list)),
            
            # ===== MARKET TESTS =====
            ("GET", "/market/products", None, lambda r: isinstance(r, (list, dict))),
            ("GET", "/market/services", None, lambda r: isinstance(r, (list, dict))),
            
            # ===== SEARCH TEST =====
            ("GET", f"/search?q=tahiti", None, lambda r: isinstance(r, (list, dict))),
            
            # ===== USER PROFILE =====
            ("GET", f"/users/{user_id}", None, lambda r: "user_id" in r or "name" in r),
        ]
        
        # Execute tests with small random delays
        for method, endpoint, data, validate_fn in tests:
            result, _ = await self.make_request(
                session, method, endpoint,
                session_token=session_token,
                data=data,
                validate_fn=validate_fn,
                bot_id=bot_id
            )
            self.record_result(result)
            await asyncio.sleep(random.uniform(0.05, 0.15))
        
        # ===== WRITE OPERATIONS (less frequent) =====
        
        # Create a post
        result, post_data = await self.make_request(
            session, "POST", "/posts",
            session_token=session_token,
            data={
                "content": f"Test post from bot {bot_id} - {datetime.now().isoformat()}",
                "media_urls": [],
                "tags": ["loadtest"]
            },
            validate_fn=lambda r: "post_id" in r,
            bot_id=bot_id
        )
        self.record_result(result)
        
        # Create a marker on the map
        result, _ = await self.make_request(
            session, "POST", "/pulse/markers",
            session_token=session_token,
            data={
                "marker_type": "event",
                "title": f"Load test event {bot_id}",
                "description": "Test event from load test",
                "lat": -17.5320 + random.uniform(-0.05, 0.05),
                "lng": -149.5685 + random.uniform(-0.05, 0.05),
                "island": "tahiti"
            },
            validate_fn=lambda r: "marker_id" in r,
            bot_id=bot_id
        )
        self.record_result(result)
        
        # Like a random post from feed
        result, feed_data = await self.make_request(
            session, "GET", "/feed?page=1&per_page=5",
            session_token=session_token,
            bot_id=bot_id
        )
        if result.success and feed_data and "posts" in feed_data and feed_data["posts"]:
            random_post = random.choice(feed_data["posts"])
            if "post_id" in random_post:
                result, _ = await self.make_request(
                    session, "POST", f"/posts/{random_post['post_id']}/like",
                    session_token=session_token,
                    bot_id=bot_id
                )
                self.record_result(result)
        
        # Update progress
        async with self.lock:
            self.progress["completed"] += 1
            if self.progress["completed"] % 20 == 0:
                pct = self.progress["completed"] / self.progress["total"] * 100
                print(f"  📊 Progression: {self.progress['completed']}/{self.progress['total']} bots ({pct:.0f}%)")

    async def run_load_test(self):
        """Run the complete load test"""
        print("\n" + "="*60)
        print("🚀 HUI FENUA - TEST DE CHARGE V2")
        print(f"   {NUM_BOTS} bots | ~50 000 requêtes | ~10 minutes")
        print("="*60 + "\n")
        
        self.start_time = time.time()
        self.progress["total"] = NUM_BOTS
        
        # Create connection pool
        connector = aiohttp.TCPConnector(limit=MAX_CONCURRENT, limit_per_host=MAX_CONCURRENT)
        timeout = aiohttp.ClientTimeout(total=60)
        
        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            # Create authenticated session pool
            self.authenticated_sessions = await self.authenticate_pool(session, min(NUM_BOTS // 4, 50))
            
            if not self.authenticated_sessions:
                print("❌ Impossible de créer des sessions authentifiées!")
                return
            
            print(f"\n🏃 Lancement de {NUM_BOTS} bots en batches de {BATCH_SIZE}...")
            print("-"*50)
            
            # Run bots in batches
            for batch_num in range(0, NUM_BOTS, BATCH_SIZE):
                batch_end = min(batch_num + BATCH_SIZE, NUM_BOTS)
                current_batch_size = batch_end - batch_num
                
                print(f"\n📦 Batch {batch_num // BATCH_SIZE + 1}: Bots {batch_num + 1}-{batch_end}")
                
                tasks = []
                for bot_id in range(batch_num, batch_end):
                    # Assign a session from the pool (round-robin)
                    session_token, user_id = self.authenticated_sessions[bot_id % len(self.authenticated_sessions)]
                    tasks.append(self.run_bot_tests(session, bot_id, session_token, user_id))
                
                await asyncio.gather(*tasks, return_exceptions=True)
                
                # Small delay between batches
                await asyncio.sleep(0.5)
            
            # Additional stress test - rapid fire requests
            print("\n⚡ Phase de stress test (requêtes rapides)...")
            stress_tasks = []
            for _ in range(100):
                session_token, user_id = random.choice(self.authenticated_sessions)
                endpoint = random.choice([
                    "/pulse/markers?island=tahiti",
                    "/feed?page=1&per_page=10",
                    "/pulse/islands",
                    "/stories",
                    "/conversations",
                    "/pulse/leaderboard",
                ])
                stress_tasks.append(
                    self.make_request(session, "GET", endpoint, session_token=session_token, bot_id=999)
                )
            
            stress_results = await asyncio.gather(*stress_tasks, return_exceptions=True)
            for result in stress_results:
                if isinstance(result, tuple):
                    self.record_result(result[0])
        
        self.end_time = time.time()
        
        # Wait for all recording tasks to complete
        await asyncio.sleep(1)
        
        print("\n" + "="*60)
        print("✅ TEST TERMINÉ - Génération du rapport...")
        print("="*60)

    def generate_report(self) -> dict:
        """Generate comprehensive test report"""
        duration = self.end_time - self.start_time
        
        all_response_times = []
        for stats in self.endpoint_stats.values():
            all_response_times.extend(stats.response_times)
        
        total_success = sum(s.successful_requests for s in self.endpoint_stats.values())
        total_failed = sum(s.failed_requests for s in self.endpoint_stats.values())
        
        report = {
            "test_info": {
                "date": datetime.now().isoformat(),
                "duration_seconds": round(duration, 2),
                "num_bots": NUM_BOTS,
                "api_url": API_URL,
                "batch_size": BATCH_SIZE,
                "max_concurrent": MAX_CONCURRENT
            },
            "summary": {
                "total_requests": self.total_requests,
                "successful_requests": total_success,
                "failed_requests": total_failed,
                "success_rate_percent": round((total_success / self.total_requests * 100) if self.total_requests > 0 else 0, 2),
                "requests_per_second": round(self.total_requests / duration, 2) if duration > 0 else 0,
                "authenticated_sessions": len(self.authenticated_sessions)
            },
            "response_times": {},
            "endpoints": {},
            "errors_summary": []
        }
        
        if all_response_times:
            sorted_times = sorted(all_response_times)
            report["response_times"] = {
                "min_ms": round(min(all_response_times), 2),
                "max_ms": round(max(all_response_times), 2),
                "avg_ms": round(statistics.mean(all_response_times), 2),
                "median_ms": round(statistics.median(all_response_times), 2),
                "p95_ms": round(sorted_times[int(len(sorted_times) * 0.95)], 2) if len(sorted_times) > 20 else 0,
                "p99_ms": round(sorted_times[int(len(sorted_times) * 0.99)], 2) if len(sorted_times) > 100 else 0,
                "total_samples": len(all_response_times)
            }
        
        for endpoint, stats in sorted(self.endpoint_stats.items()):
            if stats.response_times:
                sorted_ep_times = sorted(stats.response_times)
                report["endpoints"][endpoint] = {
                    "total_requests": stats.total_requests,
                    "success": stats.successful_requests,
                    "failed": stats.failed_requests,
                    "success_rate_percent": round(stats.successful_requests / stats.total_requests * 100 if stats.total_requests > 0 else 0, 2),
                    "avg_response_ms": round(statistics.mean(stats.response_times), 2),
                    "median_response_ms": round(statistics.median(stats.response_times), 2),
                    "p95_response_ms": round(sorted_ep_times[int(len(sorted_ep_times) * 0.95)], 2) if len(sorted_ep_times) > 20 else round(max(sorted_ep_times), 2),
                    "min_response_ms": round(min(stats.response_times), 2),
                    "max_response_ms": round(max(stats.response_times), 2),
                    "validation_passed": stats.validation_passed,
                    "validation_failed": stats.validation_failed,
                    "status_codes": dict(stats.status_codes)
                }
        
        # Aggregate errors
        error_counts = defaultdict(int)
        for stats in self.endpoint_stats.values():
            for error in stats.errors:
                error_counts[error] += 1
        
        report["errors_summary"] = [
            {"error": k, "count": v} 
            for k, v in sorted(error_counts.items(), key=lambda x: -x[1])[:15]
        ]
        
        return report

    def print_report(self, report: dict):
        """Print formatted report"""
        print("\n" + "="*70)
        print("📊 RAPPORT DÉTAILLÉ - TEST DE CHARGE HUI FENUA")
        print("="*70)
        
        info = report["test_info"]
        print(f"""
┌─────────────────────────────────────────────────────────┐
│ 📅 Date:             {info['date'][:19]}              │
│ ⏱️  Durée:            {info['duration_seconds']:>6.1f} secondes                      │
│ 🤖 Bots:             {info['num_bots']:>6}                                │
│ 🔗 Sessions auth:    {report['summary']['authenticated_sessions']:>6}                                │
│ 🌐 API:              {info['api_url'][:40]}    │
└─────────────────────────────────────────────────────────┘
""")
        
        summary = report["summary"]
        success_emoji = "✅" if summary["success_rate_percent"] >= 95 else "⚠️" if summary["success_rate_percent"] >= 80 else "❌"
        
        print(f"""
┌─────────────────── RÉSUMÉ GLOBAL ────────────────────────┐
│                                                          │
│  📊 Total requêtes:     {summary['total_requests']:>10,}                       │
│  ✅ Succès:             {summary['successful_requests']:>10,}                       │
│  ❌ Échecs:             {summary['failed_requests']:>10,}                       │
│  {success_emoji} Taux de succès:     {summary['success_rate_percent']:>10.2f}%                      │
│  ⚡ Requêtes/seconde:   {summary['requests_per_second']:>10.2f}                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
""")
        
        if report["response_times"]:
            times = report["response_times"]
            print(f"""
┌─────────────────── TEMPS DE RÉPONSE ─────────────────────┐
│                                                          │
│  ⏱️  Min:       {times['min_ms']:>8.2f} ms                              │
│  ⏱️  Max:       {times['max_ms']:>8.2f} ms                              │
│  ⏱️  Moyenne:   {times['avg_ms']:>8.2f} ms                              │
│  ⏱️  Médiane:   {times['median_ms']:>8.2f} ms                              │
│  ⏱️  P95:       {times['p95_ms']:>8.2f} ms                              │
│  ⏱️  P99:       {times['p99_ms']:>8.2f} ms                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
""")
        
        print("\n┌─────────────────── PERFORMANCE PAR ENDPOINT ─────────────────────┐\n")
        
        sorted_endpoints = sorted(
            report["endpoints"].items(),
            key=lambda x: -x[1]["total_requests"]
        )
        
        for endpoint, stats in sorted_endpoints[:20]:
            status = "✅" if stats["success_rate_percent"] >= 95 else "⚠️" if stats["success_rate_percent"] >= 80 else "❌"
            print(f"  {status} {endpoint}")
            print(f"     📊 Requêtes: {stats['total_requests']:,} | Succès: {stats['success_rate_percent']:.1f}%")
            print(f"     ⏱️  Temps: avg={stats['avg_response_ms']:.0f}ms | med={stats['median_response_ms']:.0f}ms | p95={stats['p95_response_ms']:.0f}ms")
            if stats.get("validation_passed", 0) > 0 or stats.get("validation_failed", 0) > 0:
                print(f"     ✓ Validation: {stats['validation_passed']} passés | {stats['validation_failed']} échoués")
            print()
        
        if report["errors_summary"]:
            print("┌─────────────────── ERREURS FRÉQUENTES ─────────────────────┐\n")
            for error in report["errors_summary"][:10]:
                print(f"  [{error['count']:>4}x] {error['error'][:55]}")
            print()
        
        print("└──────────────────────────────────────────────────────────────────┘")
        print("\n" + "="*70)
        print("✅ FIN DU RAPPORT")
        print("="*70 + "\n")

async def main():
    tester = LoadTesterV2()
    
    try:
        await tester.run_load_test()
        report = tester.generate_report()
        tester.print_report(report)
        
        # Save report
        report_path = "/app/test_reports/load_test_v2_report.json"
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2, default=str)
        print(f"📄 Rapport JSON sauvegardé: {report_path}")
        
        # Print summary verdict
        success_rate = report["summary"]["success_rate_percent"]
        if success_rate >= 95:
            print("\n🎉 VERDICT: EXCELLENT - La plateforme supporte bien la charge!")
        elif success_rate >= 80:
            print("\n⚠️ VERDICT: ACCEPTABLE - Quelques problèmes sous forte charge")
        else:
            print("\n❌ VERDICT: PROBLÈMES DÉTECTÉS - Optimisations nécessaires")
        
        return report
        
    except KeyboardInterrupt:
        print("\n⚠️ Test interrompu")
        return None

if __name__ == "__main__":
    asyncio.run(main())
