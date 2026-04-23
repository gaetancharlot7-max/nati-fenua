#!/usr/bin/env python3
"""
Hui Fenua - Test de Charge avec 200 Bots Simultanés
====================================================
Test complet de l'API avec validation fonctionnelle et métriques de performance.
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
from typing import Dict, List, Optional
from collections import defaultdict
import sys

# Configuration
API_URL = "https://fenua-chat-debug.preview.emergentagent.com/api"
NUM_BOTS = 200  # 200 bots simultanés
TEST_DURATION_MINUTES = 10  # Test standard de 10 minutes
REQUESTS_PER_BOT = 50  # Chaque bot fait environ 50 requêtes

@dataclass
class TestResult:
    endpoint: str
    method: str
    status_code: int
    response_time_ms: float
    success: bool
    error_message: Optional[str] = None
    validated: bool = False

@dataclass
class BotStats:
    bot_id: int
    user_id: Optional[str] = None
    session_token: Optional[str] = None
    requests_made: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    results: List[TestResult] = field(default_factory=list)

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

class LoadTester:
    def __init__(self):
        self.bots: List[BotStats] = []
        self.endpoint_stats: Dict[str, EndpointStats] = defaultdict(lambda: EndpointStats(""))
        self.start_time: float = 0
        self.end_time: float = 0
        self.total_requests: int = 0
        self.test_accounts: List[dict] = []
        self.conversations_created: List[str] = []
        self.posts_created: List[str] = []
        
    def generate_email(self, bot_id: int) -> str:
        return f"loadtest_bot{bot_id}_{random.randint(1000,9999)}@test.com"
    
    def generate_password(self) -> str:
        return "LoadTest123!"
    
    def generate_name(self) -> str:
        names = ["Teva", "Moana", "Hina", "Maui", "Vaiana", "Teiki", "Poerava", "Taina", "Mahana", "Raiarii"]
        return random.choice(names) + str(random.randint(100, 999))

    async def make_request(
        self, 
        session: aiohttp.ClientSession, 
        method: str, 
        endpoint: str, 
        bot: BotStats,
        data: Optional[dict] = None,
        validate_fn: Optional[callable] = None
    ) -> TestResult:
        """Make an API request and record metrics"""
        url = f"{API_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        cookies = {}
        
        if bot.session_token:
            cookies["session_token"] = bot.session_token
        
        start_time = time.time()
        
        try:
            if method == "GET":
                async with session.get(url, headers=headers, cookies=cookies, timeout=30) as response:
                    status_code = response.status
                    try:
                        response_data = await response.json()
                    except:
                        response_data = await response.text()
            elif method == "POST":
                async with session.post(url, json=data, headers=headers, cookies=cookies, timeout=30) as response:
                    status_code = response.status
                    try:
                        response_data = await response.json()
                    except:
                        response_data = await response.text()
            elif method == "PUT":
                async with session.put(url, json=data, headers=headers, cookies=cookies, timeout=30) as response:
                    status_code = response.status
                    try:
                        response_data = await response.json()
                    except:
                        response_data = await response.text()
            elif method == "DELETE":
                async with session.delete(url, headers=headers, cookies=cookies, timeout=30) as response:
                    status_code = response.status
                    try:
                        response_data = await response.json()
                    except:
                        response_data = await response.text()
            else:
                raise ValueError(f"Unknown method: {method}")
            
            response_time_ms = (time.time() - start_time) * 1000
            success = 200 <= status_code < 400
            
            # Validate response if validation function provided
            validated = False
            if validate_fn and success:
                try:
                    validated = validate_fn(response_data)
                except:
                    validated = False
            
            result = TestResult(
                endpoint=endpoint,
                method=method,
                status_code=status_code,
                response_time_ms=response_time_ms,
                success=success,
                validated=validated
            )
            
            # Store session token if login/register
            if success and isinstance(response_data, dict):
                if "session_token" in response_data:
                    bot.session_token = response_data["session_token"]
                if "user" in response_data and "user_id" in response_data["user"]:
                    bot.user_id = response_data["user"]["user_id"]
            
            return result, response_data
            
        except asyncio.TimeoutError:
            response_time_ms = (time.time() - start_time) * 1000
            return TestResult(
                endpoint=endpoint,
                method=method,
                status_code=0,
                response_time_ms=response_time_ms,
                success=False,
                error_message="Timeout"
            ), None
        except Exception as e:
            response_time_ms = (time.time() - start_time) * 1000
            return TestResult(
                endpoint=endpoint,
                method=method,
                status_code=0,
                response_time_ms=response_time_ms,
                success=False,
                error_message=str(e)
            ), None

    def record_result(self, bot: BotStats, result: TestResult):
        """Record a test result"""
        bot.results.append(result)
        bot.requests_made += 1
        
        if result.success:
            bot.successful_requests += 1
        else:
            bot.failed_requests += 1
        
        # Update endpoint stats
        stats = self.endpoint_stats[result.endpoint]
        if not stats.endpoint:
            stats.endpoint = result.endpoint
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
        
        self.total_requests += 1

    async def run_bot_scenario(self, session: aiohttp.ClientSession, bot: BotStats):
        """Run a complete test scenario for one bot"""
        
        # ========== 1. AUTHENTIFICATION ==========
        print(f"[Bot {bot.bot_id}] Starting authentication tests...")
        
        # 1.1 Register new user
        email = self.generate_email(bot.bot_id)
        password = self.generate_password()
        name = self.generate_name()
        
        result, data = await self.make_request(
            session, "POST", "/auth/register",
            bot,
            data={"email": email, "password": password, "name": name},
            validate_fn=lambda r: "user" in r and "session_token" in r
        )
        self.record_result(bot, result)
        
        if not result.success:
            # Try login with existing test account
            result, data = await self.make_request(
                session, "POST", "/auth/login",
                bot,
                data={"email": "user1@test.com", "password": "TestPass123!"},
                validate_fn=lambda r: "user" in r and "session_token" in r
            )
            self.record_result(bot, result)
        
        if not bot.session_token:
            print(f"[Bot {bot.bot_id}] Failed to authenticate, skipping remaining tests")
            return
        
        self.test_accounts.append({"email": email, "user_id": bot.user_id})
        
        # 1.2 Get current user profile
        result, _ = await self.make_request(
            session, "GET", "/auth/me",
            bot,
            validate_fn=lambda r: "user_id" in r
        )
        self.record_result(bot, result)
        
        await asyncio.sleep(random.uniform(0.1, 0.3))
        
        # ========== 2. FIL D'ACTUALITÉ ==========
        print(f"[Bot {bot.bot_id}] Testing feed...")
        
        # 2.1 Get feed
        result, feed_data = await self.make_request(
            session, "GET", "/feed?page=1&per_page=10",
            bot,
            validate_fn=lambda r: isinstance(r, dict) and "posts" in r
        )
        self.record_result(bot, result)
        
        # 2.2 Get stories
        result, _ = await self.make_request(
            session, "GET", "/stories",
            bot,
            validate_fn=lambda r: isinstance(r, list)
        )
        self.record_result(bot, result)
        
        # 2.3 Create a post
        result, post_data = await self.make_request(
            session, "POST", "/posts",
            bot,
            data={
                "content": f"Test post from bot {bot.bot_id} - {datetime.now().isoformat()}",
                "media_urls": [],
                "tags": ["loadtest", "bot"]
            },
            validate_fn=lambda r: "post_id" in r
        )
        self.record_result(bot, result)
        
        post_id = None
        if result.success and post_data:
            post_id = post_data.get("post_id")
            self.posts_created.append(post_id)
        
        await asyncio.sleep(random.uniform(0.1, 0.3))
        
        # 2.4 Like a post (if we have posts in feed)
        if feed_data and isinstance(feed_data, dict) and feed_data.get("posts"):
            random_post = random.choice(feed_data["posts"])
            if "post_id" in random_post:
                result, _ = await self.make_request(
                    session, "POST", f"/posts/{random_post['post_id']}/like",
                    bot,
                    validate_fn=lambda r: "likes_count" in r or "success" in r
                )
                self.record_result(bot, result)
        
        # 2.5 Comment on a post
        if post_id:
            result, _ = await self.make_request(
                session, "POST", f"/posts/{post_id}/comment",
                bot,
                data={"content": f"Comment from bot {bot.bot_id}"},
                validate_fn=lambda r: "comment_id" in r or "success" in r
            )
            self.record_result(bot, result)
        
        await asyncio.sleep(random.uniform(0.1, 0.3))
        
        # ========== 3. FENUA PULSE (CARTE) ==========
        print(f"[Bot {bot.bot_id}] Testing Fenua Pulse...")
        
        # 3.1 Get islands
        result, _ = await self.make_request(
            session, "GET", "/pulse/islands",
            bot,
            validate_fn=lambda r: isinstance(r, list) and len(r) > 0
        )
        self.record_result(bot, result)
        
        # 3.2 Get marker types
        result, _ = await self.make_request(
            session, "GET", "/pulse/marker-types",
            bot,
            validate_fn=lambda r: isinstance(r, list) and len(r) > 0
        )
        self.record_result(bot, result)
        
        # 3.3 Get markers for Tahiti
        result, markers_data = await self.make_request(
            session, "GET", "/pulse/markers?island=tahiti",
            bot,
            validate_fn=lambda r: isinstance(r, list)
        )
        self.record_result(bot, result)
        
        # 3.4 Get markers for different types
        marker_types = ["roulotte", "surf", "event", "webcam", "accident"]
        for mtype in random.sample(marker_types, 2):
            result, _ = await self.make_request(
                session, "GET", f"/pulse/markers?types={mtype}",
                bot,
                validate_fn=lambda r: isinstance(r, list)
            )
            self.record_result(bot, result)
        
        # 3.5 Create a marker
        result, _ = await self.make_request(
            session, "POST", "/pulse/markers",
            bot,
            data={
                "marker_type": "event",
                "title": f"Test event bot {bot.bot_id}",
                "description": "Load test event",
                "lat": -17.5320 + random.uniform(-0.1, 0.1),
                "lng": -149.5685 + random.uniform(-0.1, 0.1),
                "island": "tahiti"
            },
            validate_fn=lambda r: "marker_id" in r
        )
        self.record_result(bot, result)
        
        # 3.6 Get pulse status
        result, _ = await self.make_request(
            session, "GET", "/pulse/status",
            bot,
            validate_fn=lambda r: isinstance(r, dict)
        )
        self.record_result(bot, result)
        
        # 3.7 Get leaderboard
        result, _ = await self.make_request(
            session, "GET", "/pulse/leaderboard",
            bot,
            validate_fn=lambda r: isinstance(r, list)
        )
        self.record_result(bot, result)
        
        await asyncio.sleep(random.uniform(0.1, 0.3))
        
        # ========== 4. MESSAGERIE ==========
        print(f"[Bot {bot.bot_id}] Testing messaging...")
        
        # 4.1 Get conversations
        result, convs_data = await self.make_request(
            session, "GET", "/conversations",
            bot,
            validate_fn=lambda r: isinstance(r, list)
        )
        self.record_result(bot, result)
        
        # 4.2 Create a new conversation with a random user
        other_user_id = None
        if len(self.test_accounts) > 1:
            other_account = random.choice([a for a in self.test_accounts if a.get("user_id") != bot.user_id])
            other_user_id = other_account.get("user_id")
        
        if not other_user_id:
            other_user_id = "user_41d7bb1c8367"  # user2@test.com
        
        if other_user_id and other_user_id != bot.user_id:
            result, conv_data = await self.make_request(
                session, "POST", "/conversations",
                bot,
                data={"user_id": other_user_id},
                validate_fn=lambda r: "conversation_id" in r
            )
            self.record_result(bot, result)
            
            conv_id = None
            if result.success and conv_data:
                conv_id = conv_data.get("conversation_id")
                self.conversations_created.append(conv_id)
            
            # 4.3 Send a message
            if conv_id:
                result, _ = await self.make_request(
                    session, "POST", f"/conversations/{conv_id}/messages",
                    bot,
                    data={"content": f"Hello from bot {bot.bot_id}! Time: {datetime.now().isoformat()}"},
                    validate_fn=lambda r: "message_id" in r
                )
                self.record_result(bot, result)
                
                # 4.4 Get messages
                result, _ = await self.make_request(
                    session, "GET", f"/conversations/{conv_id}/messages",
                    bot,
                    validate_fn=lambda r: isinstance(r, list)
                )
                self.record_result(bot, result)
        
        await asyncio.sleep(random.uniform(0.1, 0.3))
        
        # ========== 5. MARCHÉ ==========
        print(f"[Bot {bot.bot_id}] Testing marketplace...")
        
        # 5.1 Get products
        result, _ = await self.make_request(
            session, "GET", "/market/products",
            bot,
            validate_fn=lambda r: isinstance(r, list) or isinstance(r, dict)
        )
        self.record_result(bot, result)
        
        # 5.2 Get services
        result, _ = await self.make_request(
            session, "GET", "/market/services",
            bot,
            validate_fn=lambda r: isinstance(r, list) or isinstance(r, dict)
        )
        self.record_result(bot, result)
        
        await asyncio.sleep(random.uniform(0.1, 0.3))
        
        # ========== 6. ROULOTTES ==========
        print(f"[Bot {bot.bot_id}] Testing roulottes...")
        
        # 6.1 Get nearby roulottes
        result, _ = await self.make_request(
            session, "GET", "/roulotte/nearby?lat=-17.532&lng=-149.5685&radius=50",
            bot,
            validate_fn=lambda r: isinstance(r, list)
        )
        self.record_result(bot, result)
        
        # 6.2 Check if user has vendor profile
        result, vendor_data = await self.make_request(
            session, "GET", "/roulotte/profile/me",
            bot
        )
        self.record_result(bot, result)
        
        # 6.3 If no vendor profile, create one
        if result.status_code == 404 or (vendor_data and vendor_data.get("detail")):
            result, _ = await self.make_request(
                session, "POST", "/roulotte/profile",
                bot,
                data={
                    "name": f"Roulotte Bot {bot.bot_id}",
                    "cuisine_type": random.choice(["local", "chinese", "french", "japanese"]),
                    "description": "Test roulotte from load test",
                    "phone": f"8712{random.randint(1000, 9999)}",
                    "usual_hours": "11h-14h",
                    "payment_methods": ["cash"]
                },
                validate_fn=lambda r: "vendor_id" in r
            )
            self.record_result(bot, result)
        
        await asyncio.sleep(random.uniform(0.1, 0.3))
        
        # ========== 7. NOTIFICATIONS ==========
        print(f"[Bot {bot.bot_id}] Testing notifications...")
        
        result, _ = await self.make_request(
            session, "GET", "/notifications",
            bot,
            validate_fn=lambda r: isinstance(r, list) or isinstance(r, dict)
        )
        self.record_result(bot, result)
        
        # ========== 8. RECHERCHE ==========
        print(f"[Bot {bot.bot_id}] Testing search...")
        
        search_terms = ["tahiti", "roulotte", "surf", "moana", "maui"]
        result, _ = await self.make_request(
            session, "GET", f"/search?q={random.choice(search_terms)}",
            bot,
            validate_fn=lambda r: isinstance(r, dict) or isinstance(r, list)
        )
        self.record_result(bot, result)
        
        # ========== 9. PROFIL UTILISATEUR ==========
        print(f"[Bot {bot.bot_id}] Testing user profile...")
        
        # 9.1 Get own profile
        if bot.user_id:
            result, _ = await self.make_request(
                session, "GET", f"/users/{bot.user_id}",
                bot,
                validate_fn=lambda r: "user_id" in r or "name" in r
            )
            self.record_result(bot, result)
        
        # ========== 10. RÉPÉTITION DE TESTS ALÉATOIRES ==========
        print(f"[Bot {bot.bot_id}] Running random stress tests...")
        
        # Run more random requests to fill the test duration
        for _ in range(20):
            await asyncio.sleep(random.uniform(0.5, 2.0))
            
            # Choose random endpoint to test
            test_choice = random.choice([
                ("GET", "/feed?page=1&per_page=10"),
                ("GET", "/pulse/markers?island=tahiti"),
                ("GET", "/stories"),
                ("GET", "/conversations"),
                ("GET", "/pulse/islands"),
                ("GET", "/pulse/leaderboard"),
                ("GET", "/notifications"),
            ])
            
            result, _ = await self.make_request(session, test_choice[0], test_choice[1], bot)
            self.record_result(bot, result)
        
        print(f"[Bot {bot.bot_id}] Completed all tests!")

    async def run_all_bots(self):
        """Run all bots in parallel"""
        print(f"\n{'='*60}")
        print(f"🚀 DÉMARRAGE DU TEST DE CHARGE - {NUM_BOTS} BOTS SIMULTANÉS")
        print(f"{'='*60}\n")
        
        self.start_time = time.time()
        
        # Create bot stats
        self.bots = [BotStats(bot_id=i) for i in range(NUM_BOTS)]
        
        # Create aiohttp session with connection pooling
        connector = aiohttp.TCPConnector(limit=100, limit_per_host=50)
        timeout = aiohttp.ClientTimeout(total=60)
        
        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            # Run bots in batches to avoid overwhelming the server
            batch_size = 20
            for i in range(0, NUM_BOTS, batch_size):
                batch = self.bots[i:i+batch_size]
                print(f"\n📦 Launching batch {i//batch_size + 1}/{(NUM_BOTS + batch_size - 1)//batch_size} ({len(batch)} bots)")
                
                tasks = [self.run_bot_scenario(session, bot) for bot in batch]
                await asyncio.gather(*tasks, return_exceptions=True)
                
                # Small delay between batches
                await asyncio.sleep(1)
        
        self.end_time = time.time()
        
        print(f"\n{'='*60}")
        print(f"✅ TEST TERMINÉ - Génération du rapport...")
        print(f"{'='*60}\n")

    def generate_report(self) -> dict:
        """Generate detailed test report"""
        duration = self.end_time - self.start_time
        
        # Aggregate all response times
        all_response_times = []
        for stats in self.endpoint_stats.values():
            all_response_times.extend(stats.response_times)
        
        # Calculate overall metrics
        total_success = sum(bot.successful_requests for bot in self.bots)
        total_failed = sum(bot.failed_requests for bot in self.bots)
        
        report = {
            "test_info": {
                "date": datetime.now().isoformat(),
                "duration_seconds": round(duration, 2),
                "num_bots": NUM_BOTS,
                "api_url": API_URL
            },
            "summary": {
                "total_requests": self.total_requests,
                "successful_requests": total_success,
                "failed_requests": total_failed,
                "success_rate_percent": round((total_success / self.total_requests * 100) if self.total_requests > 0 else 0, 2),
                "requests_per_second": round(self.total_requests / duration, 2) if duration > 0 else 0
            },
            "response_times": {
                "min_ms": round(min(all_response_times), 2) if all_response_times else 0,
                "max_ms": round(max(all_response_times), 2) if all_response_times else 0,
                "avg_ms": round(statistics.mean(all_response_times), 2) if all_response_times else 0,
                "median_ms": round(statistics.median(all_response_times), 2) if all_response_times else 0,
                "p95_ms": round(sorted(all_response_times)[int(len(all_response_times) * 0.95)] if all_response_times else 0, 2),
                "p99_ms": round(sorted(all_response_times)[int(len(all_response_times) * 0.99)] if all_response_times else 0, 2)
            },
            "endpoints": {},
            "errors": [],
            "bot_performance": {
                "avg_requests_per_bot": round(self.total_requests / NUM_BOTS, 2) if NUM_BOTS > 0 else 0,
                "avg_success_rate_per_bot": round(statistics.mean([b.successful_requests / b.requests_made * 100 if b.requests_made > 0 else 0 for b in self.bots]), 2)
            }
        }
        
        # Endpoint breakdown
        for endpoint, stats in sorted(self.endpoint_stats.items()):
            if stats.response_times:
                report["endpoints"][endpoint] = {
                    "total_requests": stats.total_requests,
                    "success": stats.successful_requests,
                    "failed": stats.failed_requests,
                    "success_rate_percent": round(stats.successful_requests / stats.total_requests * 100 if stats.total_requests > 0 else 0, 2),
                    "avg_response_ms": round(statistics.mean(stats.response_times), 2),
                    "median_response_ms": round(statistics.median(stats.response_times), 2),
                    "p95_response_ms": round(sorted(stats.response_times)[int(len(stats.response_times) * 0.95)] if stats.response_times else 0, 2),
                    "validation_passed": stats.validation_passed,
                    "validation_failed": stats.validation_failed,
                    "status_codes": dict(stats.status_codes)
                }
        
        # Collect errors
        error_counts = defaultdict(int)
        for bot in self.bots:
            for result in bot.results:
                if not result.success and result.error_message:
                    error_counts[f"{result.endpoint}: {result.error_message}"] += 1
        
        report["errors"] = [{"error": k, "count": v} for k, v in sorted(error_counts.items(), key=lambda x: -x[1])[:20]]
        
        return report

    def print_report(self, report: dict):
        """Print formatted report to console"""
        print("\n" + "="*80)
        print("📊 RAPPORT DE TEST DE CHARGE - HUI FENUA")
        print("="*80)
        
        info = report["test_info"]
        print(f"\n📅 Date: {info['date']}")
        print(f"⏱️  Durée: {info['duration_seconds']} secondes")
        print(f"🤖 Bots: {info['num_bots']}")
        print(f"🌐 API: {info['api_url']}")
        
        print("\n" + "-"*40)
        print("📈 RÉSUMÉ GLOBAL")
        print("-"*40)
        summary = report["summary"]
        print(f"  Total requêtes:     {summary['total_requests']:,}")
        print(f"  ✅ Succès:          {summary['successful_requests']:,}")
        print(f"  ❌ Échecs:          {summary['failed_requests']:,}")
        print(f"  📊 Taux de succès:  {summary['success_rate_percent']}%")
        print(f"  ⚡ Req/seconde:     {summary['requests_per_second']}")
        
        print("\n" + "-"*40)
        print("⏱️  TEMPS DE RÉPONSE")
        print("-"*40)
        times = report["response_times"]
        print(f"  Min:     {times['min_ms']:.2f} ms")
        print(f"  Max:     {times['max_ms']:.2f} ms")
        print(f"  Moyenne: {times['avg_ms']:.2f} ms")
        print(f"  Médiane: {times['median_ms']:.2f} ms")
        print(f"  P95:     {times['p95_ms']:.2f} ms")
        print(f"  P99:     {times['p99_ms']:.2f} ms")
        
        print("\n" + "-"*40)
        print("🔗 PERFORMANCE PAR ENDPOINT")
        print("-"*40)
        
        # Sort endpoints by total requests
        sorted_endpoints = sorted(report["endpoints"].items(), key=lambda x: -x[1]["total_requests"])
        
        for endpoint, stats in sorted_endpoints[:15]:
            status = "✅" if stats["success_rate_percent"] >= 95 else "⚠️" if stats["success_rate_percent"] >= 80 else "❌"
            print(f"\n  {status} {endpoint}")
            print(f"     Requêtes: {stats['total_requests']} | Succès: {stats['success_rate_percent']}%")
            print(f"     Temps: avg={stats['avg_response_ms']:.0f}ms, med={stats['median_response_ms']:.0f}ms, p95={stats['p95_response_ms']:.0f}ms")
            if stats["validation_passed"] > 0 or stats["validation_failed"] > 0:
                print(f"     Validation: ✓{stats['validation_passed']} | ✗{stats['validation_failed']}")
        
        if report["errors"]:
            print("\n" + "-"*40)
            print("❌ ERREURS LES PLUS FRÉQUENTES")
            print("-"*40)
            for error in report["errors"][:10]:
                print(f"  [{error['count']}x] {error['error'][:70]}")
        
        print("\n" + "="*80)
        print("✅ FIN DU RAPPORT")
        print("="*80 + "\n")

async def main():
    tester = LoadTester()
    
    try:
        await tester.run_all_bots()
        report = tester.generate_report()
        tester.print_report(report)
        
        # Save report to file
        report_path = "/app/test_reports/load_test_report.json"
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)
        print(f"📄 Rapport JSON sauvegardé: {report_path}")
        
        return report
        
    except KeyboardInterrupt:
        print("\n⚠️ Test interrompu par l'utilisateur")
        return None

if __name__ == "__main__":
    asyncio.run(main())
