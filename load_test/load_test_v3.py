#!/usr/bin/env python3
"""
Test de Charge V3 - Nati Fenua
==============================
Test optimisé avec classification précise des erreurs
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
from typing import List, Dict, Any, Optional
import psutil
import os

# Configuration
BASE_URL = os.environ.get('TEST_URL', 'https://fenua-connect.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

# Test credentials
TEST_EMAIL = "user1@test.com"
TEST_PASSWORD = "TestPass123!"

# Error classification
ERROR_CATEGORIES = {
    "expected": [],      # Errors that are normal (e.g., 401 for unauthenticated protected routes)
    "application": [],   # Real application errors (bugs)
    "infrastructure": [], # Server/network errors
    "test_scenario": []  # Errors due to test setup
}

@dataclass
class RequestResult:
    endpoint: str
    method: str
    status: int
    response_time: float
    error: str = None
    category: str = "success"  # success, expected, application, infrastructure, test_scenario

@dataclass
class LoadTestResults:
    total_requests: int = 0
    successful_requests: int = 0
    expected_errors: int = 0
    application_errors: int = 0
    infrastructure_errors: int = 0
    test_scenario_errors: int = 0
    timeouts: int = 0
    response_times: List[float] = field(default_factory=list)
    errors_by_endpoint: Dict[str, Dict[str, int]] = field(default_factory=lambda: defaultdict(lambda: defaultdict(int)))
    requests_by_endpoint: Dict[str, List[float]] = field(default_factory=lambda: defaultdict(list))
    error_details: List[Dict] = field(default_factory=list)
    start_time: float = 0
    end_time: float = 0

# Endpoints that require authentication - 401 is expected without auth
PROTECTED_ENDPOINTS = [
    "/auth/me", "/notifications", "/conversations", "/saved",
    "/pulse/mana", "/pulse/badges/me", "/feed"
]

# Endpoints that may return empty data - not an error
OPTIONAL_DATA_ENDPOINTS = [
    "/reels", "/lives", "/news/latest", "/stories", "/rss/posts"
]

class LoadTesterV3:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.results = LoadTestResults()
        self.lock = asyncio.Lock()
        
    def classify_error(self, endpoint: str, status: int, is_authenticated: bool) -> str:
        """Classify error into categories"""
        
        # 401 on protected endpoints without auth = expected
        if status == 401 and endpoint in PROTECTED_ENDPOINTS and not is_authenticated:
            return "expected"
        
        # 429 Rate limiting = expected (protection working)
        if status == 429:
            return "expected"
        
        # 404 on known endpoints = application error
        if status == 404:
            return "application"
        
        # 405 Method not allowed = application error
        if status == 405:
            return "application"
        
        # 500+ = infrastructure error
        if status >= 500:
            return "infrastructure"
        
        # 400 Bad request = could be test scenario or application
        if status == 400:
            return "test_scenario"
        
        # 403 Forbidden = depends on context
        if status == 403:
            # Admin routes = expected
            if "/admin" in endpoint:
                return "expected"
            return "application"
        
        # Other 4xx = application error
        if 400 <= status < 500:
            return "application"
        
        return "application"
        
    async def record_result(self, result: RequestResult, is_authenticated: bool = False):
        async with self.lock:
            self.results.total_requests += 1
            self.results.response_times.append(result.response_time)
            self.results.requests_by_endpoint[result.endpoint].append(result.response_time)
            
            if result.status == 0:  # Timeout
                self.results.timeouts += 1
                self.results.infrastructure_errors += 1
                result.category = "infrastructure"
            elif 200 <= result.status < 400:
                self.results.successful_requests += 1
                result.category = "success"
            else:
                # Classify the error
                category = self.classify_error(result.endpoint, result.status, is_authenticated)
                result.category = category
                
                if category == "expected":
                    self.results.expected_errors += 1
                elif category == "application":
                    self.results.application_errors += 1
                elif category == "infrastructure":
                    self.results.infrastructure_errors += 1
                else:
                    self.results.test_scenario_errors += 1
                
                self.results.errors_by_endpoint[result.endpoint][category] += 1
                
                if len(self.results.error_details) < 100:
                    self.results.error_details.append({
                        "endpoint": result.endpoint,
                        "status": result.status,
                        "category": category,
                        "error": result.error[:100] if result.error else None
                    })

    async def make_request(self, session: aiohttp.ClientSession, method: str, endpoint: str, 
                          data: dict = None, timeout: int = 30, is_authenticated: bool = False) -> RequestResult:
        url = f"{self.api_url}{endpoint}"
        start = time.time()
        
        try:
            async with session.request(method, url, json=data, 
                                       timeout=aiohttp.ClientTimeout(total=timeout)) as response:
                response_time = time.time() - start
                try:
                    body = await response.text()
                except:
                    body = ""
                    
                result = RequestResult(
                    endpoint=endpoint,
                    method=method,
                    status=response.status,
                    response_time=response_time,
                    error=body[:200] if response.status >= 400 else None
                )
                await self.record_result(result, is_authenticated)
                return result
                
        except asyncio.TimeoutError:
            result = RequestResult(
                endpoint=endpoint,
                method=method,
                status=0,
                response_time=timeout,
                error="Timeout",
                category="infrastructure"
            )
            await self.record_result(result, is_authenticated)
            return result
            
        except Exception as e:
            response_time = time.time() - start
            result = RequestResult(
                endpoint=endpoint,
                method=method,
                status=0,
                response_time=response_time,
                error=str(e)[:200],
                category="infrastructure"
            )
            await self.record_result(result, is_authenticated)
            return result

    async def public_journey(self, session: aiohttp.ClientSession):
        """Parcours public UNIQUEMENT - endpoints sans authentification"""
        
        # Health check
        await self.make_request(session, "GET", "/health")
        
        # Posts publics
        await self.make_request(session, "GET", "/posts?limit=20")
        await asyncio.sleep(random.uniform(0.02, 0.08))
        
        # Stories
        await self.make_request(session, "GET", "/stories")
        
        # Marketplace
        await self.make_request(session, "GET", "/marketplace/products?limit=20")
        await self.make_request(session, "GET", "/marketplace/services?limit=10")
        await self.make_request(session, "GET", "/marketplace/categories")
        await asyncio.sleep(random.uniform(0.02, 0.08))
        
        # Pulse (tous publics)
        await self.make_request(session, "GET", "/pulse/islands")
        await self.make_request(session, "GET", "/pulse/markers?island=tahiti")
        await self.make_request(session, "GET", "/pulse/status")
        await self.make_request(session, "GET", "/pulse/marker-types")
        await asyncio.sleep(random.uniform(0.02, 0.08))
        
        # Search (publics)
        await self.make_request(session, "GET", "/search/products?q=artisanat")
        
        # Translation
        await self.make_request(session, "GET", "/translate?text=bonjour&direction=fr_to_tah")
        
        # RSS
        await self.make_request(session, "GET", "/rss/posts?limit=10")
        await self.make_request(session, "GET", "/rss/sources")
        await asyncio.sleep(random.uniform(0.02, 0.08))
        
        # News
        await self.make_request(session, "GET", "/news/latest?limit=10")
        
        # Reels et Lives (publics)
        await self.make_request(session, "GET", "/reels")
        await self.make_request(session, "GET", "/lives")
        
        # Leaderboard
        await self.make_request(session, "GET", "/pulse/leaderboard")

    async def authenticated_journey(self, session: aiohttp.ClientSession):
        """Parcours authentifié"""
        
        # Login
        login_result = await self.make_request(
            session, "POST", "/auth/login",
            data={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        is_authenticated = login_result.status == 200
        
        if not is_authenticated:
            # If login failed, do public journey instead
            await self.public_journey(session)
            return
        
        await asyncio.sleep(random.uniform(0.05, 0.1))
        
        # Endpoints authentifiés
        await self.make_request(session, "GET", "/auth/me", is_authenticated=True)
        await self.make_request(session, "GET", "/feed?limit=20", is_authenticated=True)
        await self.make_request(session, "GET", "/notifications", is_authenticated=True)
        await self.make_request(session, "GET", "/notifications/unread-count", is_authenticated=True)
        await asyncio.sleep(random.uniform(0.02, 0.08))
        
        await self.make_request(session, "GET", "/conversations", is_authenticated=True)
        await self.make_request(session, "GET", "/saved", is_authenticated=True)
        await asyncio.sleep(random.uniform(0.02, 0.08))
        
        await self.make_request(session, "GET", "/search/users?q=test", is_authenticated=True)
        await self.make_request(session, "GET", "/search/posts?q=tahiti", is_authenticated=True)
        
        await self.make_request(session, "GET", "/pulse/mana", is_authenticated=True)
        await self.make_request(session, "GET", "/pulse/badges/me", is_authenticated=True)
        await asyncio.sleep(random.uniform(0.02, 0.08))
        
        # Logout
        await self.make_request(session, "POST", "/auth/logout", is_authenticated=True)

    async def run_concurrent_users(self, num_users: int, duration_seconds: int = 60):
        """Exécuter des utilisateurs simultanés"""
        print(f"\n🚀 {num_users} utilisateurs pendant {duration_seconds}s...")
        
        self.results = LoadTestResults()
        self.results.start_time = time.time()
        
        connector = aiohttp.TCPConnector(
            limit=min(num_users * 3, 600),
            limit_per_host=min(num_users * 2, 400),
            ttl_dns_cache=300,
            enable_cleanup_closed=True
        )
        
        async def user_loop(user_id: int, end_time: float):
            async with aiohttp.ClientSession(
                connector=connector, 
                cookie_jar=aiohttp.CookieJar(unsafe=True)
            ) as session:
                while time.time() < end_time:
                    try:
                        # 80% public, 20% authenticated
                        if random.random() < 0.8:
                            await self.public_journey(session)
                        else:
                            await self.authenticated_journey(session)
                    except Exception:
                        pass
                    await asyncio.sleep(random.uniform(0.2, 0.8))
        
        end_time = time.time() + duration_seconds
        tasks = [user_loop(i, end_time) for i in range(num_users)]
        
        monitor_task = asyncio.create_task(self._monitor_progress(duration_seconds))
        await asyncio.gather(*tasks, return_exceptions=True)
        monitor_task.cancel()
        
        self.results.end_time = time.time()
        return self.generate_report(num_users)

    async def _monitor_progress(self, duration: int):
        try:
            for _ in range(duration // 5 + 1):
                await asyncio.sleep(5)
                elapsed = time.time() - self.results.start_time
                rps = self.results.total_requests / elapsed if elapsed > 0 else 0
                
                # Calculate real error rate (excluding expected errors)
                real_errors = self.results.application_errors + self.results.infrastructure_errors
                real_error_rate = (real_errors / self.results.total_requests * 100) if self.results.total_requests > 0 else 0
                
                print(f"  📊 {self.results.total_requests} req | {rps:.1f} rps | App errors: {self.results.application_errors} | Infra: {self.results.infrastructure_errors} | Real error rate: {real_error_rate:.1f}%")
        except asyncio.CancelledError:
            pass

    def generate_report(self, num_users: int) -> dict:
        duration = self.results.end_time - self.results.start_time
        sorted_times = sorted(self.results.response_times) if self.results.response_times else [0]
        
        def percentile(data, p):
            if not data:
                return 0
            k = (len(data) - 1) * p / 100
            f = int(k)
            c = min(f + 1, len(data) - 1)
            return data[f] + (data[c] - data[f]) * (k - f)
        
        # Real errors = application + infrastructure (not expected or test scenario)
        real_errors = self.results.application_errors + self.results.infrastructure_errors
        total_errors = real_errors + self.results.expected_errors + self.results.test_scenario_errors
        
        # Endpoint stats
        endpoint_stats = {}
        for endpoint, times in self.results.requests_by_endpoint.items():
            if times:
                sorted_endpoint_times = sorted(times)
                errors_detail = dict(self.results.errors_by_endpoint.get(endpoint, {}))
                total_endpoint_errors = sum(errors_detail.values())
                endpoint_stats[endpoint] = {
                    "requests": len(times),
                    "avg_ms": round(statistics.mean(times) * 1000, 2),
                    "p95_ms": round(percentile(sorted_endpoint_times, 95) * 1000, 2),
                    "errors": total_endpoint_errors,
                    "errors_by_category": errors_detail,
                    "error_rate": round(total_endpoint_errors / len(times) * 100, 2)
                }
        
        report = {
            "summary": {
                "concurrent_users": num_users,
                "duration_seconds": round(duration, 2),
                "total_requests": self.results.total_requests,
                "successful_requests": self.results.successful_requests,
                "requests_per_second": round(self.results.total_requests / duration, 2) if duration > 0 else 0,
            },
            "errors": {
                "total_errors": total_errors,
                "real_errors": real_errors,
                "expected_errors": self.results.expected_errors,
                "application_errors": self.results.application_errors,
                "infrastructure_errors": self.results.infrastructure_errors,
                "test_scenario_errors": self.results.test_scenario_errors,
                "timeouts": self.results.timeouts,
                "real_error_rate_percent": round(real_errors / self.results.total_requests * 100, 2) if self.results.total_requests > 0 else 0,
                "total_error_rate_percent": round(total_errors / self.results.total_requests * 100, 2) if self.results.total_requests > 0 else 0,
            },
            "response_times": {
                "avg_ms": round(statistics.mean(self.results.response_times) * 1000, 2) if self.results.response_times else 0,
                "min_ms": round(min(self.results.response_times) * 1000, 2) if self.results.response_times else 0,
                "max_ms": round(max(self.results.response_times) * 1000, 2) if self.results.response_times else 0,
                "p50_ms": round(percentile(sorted_times, 50) * 1000, 2),
                "p95_ms": round(percentile(sorted_times, 95) * 1000, 2),
                "p99_ms": round(percentile(sorted_times, 99) * 1000, 2),
            },
            "endpoint_stats": endpoint_stats,
            "error_details": self.results.error_details[:30],
            "system": {
                "cpu_percent": psutil.cpu_percent(),
                "memory_percent": psutil.virtual_memory().percent,
            }
        }
        
        return report


def print_report(report: dict, stage_name: str):
    print(f"\n✅ {stage_name}:")
    print(f"   • Requêtes: {report['summary']['total_requests']}")
    print(f"   • RPS: {report['summary']['requests_per_second']:.1f}")
    print(f"   • Temps moyen: {report['response_times']['avg_ms']:.1f}ms")
    print(f"   • P95: {report['response_times']['p95_ms']:.1f}ms")
    print(f"   • Erreurs réelles: {report['errors']['real_errors']} ({report['errors']['real_error_rate_percent']:.2f}%)")
    print(f"   • Erreurs attendues: {report['errors']['expected_errors']}")
    print(f"   • App errors: {report['errors']['application_errors']}, Infra: {report['errors']['infrastructure_errors']}")


def generate_final_report(reports: List[dict]) -> dict:
    degradation = None
    breaking_point = None
    
    for r in reports:
        real_error_rate = r['errors']['real_error_rate_percent']
        p95 = r['response_times']['p95_ms']
        
        if degradation is None and (p95 > 2000 or real_error_rate > 5):
            degradation = r['summary']['concurrent_users']
        if breaking_point is None and (real_error_rate > 15 or p95 > 10000):
            breaking_point = r['summary']['concurrent_users']
    
    stages_summary = []
    for r in reports:
        stages_summary.append({
            "stage": r.get("stage_name", "Unknown"),
            "users": r["summary"]["concurrent_users"],
            "total_requests": r["summary"]["total_requests"],
            "rps": r["summary"]["requests_per_second"],
            "avg_ms": r["response_times"]["avg_ms"],
            "p50_ms": r["response_times"]["p50_ms"],
            "p95_ms": r["response_times"]["p95_ms"],
            "p99_ms": r["response_times"]["p99_ms"],
            "real_error_rate": r["errors"]["real_error_rate_percent"],
            "expected_errors": r["errors"]["expected_errors"],
            "app_errors": r["errors"]["application_errors"],
            "infra_errors": r["errors"]["infrastructure_errors"],
            "timeouts": r["errors"]["timeouts"],
        })
    
    total_requests = sum(r["summary"]["total_requests"] for r in reports)
    total_real_errors = sum(r["errors"]["real_errors"] for r in reports)
    
    return {
        "test_info": {
            "date": datetime.now().isoformat(),
            "url": BASE_URL,
            "stages_count": len(reports),
        },
        "overall_metrics": {
            "total_requests": total_requests,
            "total_real_errors": total_real_errors,
            "overall_real_error_rate": round(total_real_errors / total_requests * 100, 2) if total_requests > 0 else 0,
            "max_rps_achieved": max(r["summary"]["requests_per_second"] for r in reports) if reports else 0,
        },
        "thresholds": {
            "degradation_starts_at_users": degradation,
            "breaking_point_at_users": breaking_point,
            "safe_concurrent_users": (degradation - 5) if degradation else (stages_summary[-1]["users"] if stages_summary else 0)
        },
        "stages_summary": stages_summary,
    }


async def run_test():
    print("=" * 70)
    print("🔥 TEST DE CHARGE V3 - NATI FENUA (Classification des erreurs)")
    print("=" * 70)
    print(f"📍 URL: {BASE_URL}")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    tester = LoadTesterV3(BASE_URL)
    
    stages = [
        {"users": 5, "duration": 30, "name": "Échauffement"},
        {"users": 10, "duration": 35, "name": "Léger"},
        {"users": 25, "duration": 35, "name": "Modéré"},
        {"users": 50, "duration": 35, "name": "Élevé"},
        {"users": 100, "duration": 35, "name": "Stress"},
        {"users": 150, "duration": 25, "name": "Surcharge"},
    ]
    
    all_reports = []
    
    for stage in stages:
        print(f"\n{'='*50}")
        print(f"📈 PALIER: {stage['name']} ({stage['users']} users)")
        print(f"{'='*50}")
        
        try:
            report = await tester.run_concurrent_users(stage["users"], stage["duration"])
            report["stage_name"] = stage["name"]
            all_reports.append(report)
            print_report(report, stage["name"])
            
            print(f"\n⏸️ Pause 6s...")
            await asyncio.sleep(6)
            
        except Exception as e:
            print(f"\n❌ Erreur: {e}")
            break
    
    final_report = generate_final_report(all_reports)
    
    # Save report
    report_path = "/app/load_test/load_test_v3_report.json"
    with open(report_path, "w") as f:
        json.dump(final_report, f, indent=2, default=str)
    
    # Print final summary
    print("\n" + "=" * 70)
    print("📊 RAPPORT FINAL V3")
    print("=" * 70)
    print(f"\n• Requêtes totales: {final_report['overall_metrics']['total_requests']:,}")
    print(f"• RPS max: {final_report['overall_metrics']['max_rps_achieved']:.1f}")
    print(f"• Taux d'erreur RÉEL: {final_report['overall_metrics']['overall_real_error_rate']:.2f}%")
    print(f"• Safe users: {final_report['thresholds']['safe_concurrent_users']}")
    print(f"• Dégradation: {final_report['thresholds']['degradation_starts_at_users']} users")
    print(f"• Rupture: {final_report['thresholds']['breaking_point_at_users']} users")
    
    print("\n" + "-" * 70)
    print(f"{'Palier':<12} {'Users':>6} {'RPS':>8} {'Avg':>8} {'P95':>8} {'Real Err%':>10} {'App Err':>8} {'Infra':>7}")
    print("-" * 70)
    for s in final_report['stages_summary']:
        print(f"{s['stage']:<12} {s['users']:>6} {s['rps']:>8.1f} {s['avg_ms']:>7.0f}ms {s['p95_ms']:>7.0f}ms {s['real_error_rate']:>9.2f}% {s['app_errors']:>8} {s['infra_errors']:>7}")
    
    print("\n" + "=" * 70)
    print(f"📁 Rapport: {report_path}")
    print("=" * 70)
    
    return final_report


if __name__ == "__main__":
    asyncio.run(run_test())
