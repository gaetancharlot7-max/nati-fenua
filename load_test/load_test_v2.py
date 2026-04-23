#!/usr/bin/env python3
"""
Test de Charge V2 - Nati Fenua
==============================
Test optimisé avec gestion correcte des sessions et appels aux bons endpoints
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
BASE_URL = os.environ.get('TEST_URL', 'https://fenua-chat-debug.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

# Test credentials
TEST_EMAIL = "user1@test.com"
TEST_PASSWORD = "TestPass123!"

@dataclass
class RequestResult:
    endpoint: str
    method: str
    status: int
    response_time: float
    error: str = None
    timestamp: float = field(default_factory=time.time)

@dataclass
class LoadTestResults:
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    timeouts: int = 0
    response_times: List[float] = field(default_factory=list)
    errors_by_endpoint: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    errors_by_status: Dict[int, int] = field(default_factory=lambda: defaultdict(int))
    requests_by_endpoint: Dict[str, List[float]] = field(default_factory=lambda: defaultdict(list))
    error_messages: List[str] = field(default_factory=list)
    start_time: float = 0
    end_time: float = 0

class LoadTesterV2:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.results = LoadTestResults()
        self.lock = asyncio.Lock()
        
    async def record_result(self, result: RequestResult):
        async with self.lock:
            self.results.total_requests += 1
            self.results.response_times.append(result.response_time)
            self.results.requests_by_endpoint[result.endpoint].append(result.response_time)
            
            if result.status == 0:  # Timeout
                self.results.timeouts += 1
                self.results.failed_requests += 1
                self.results.errors_by_endpoint[result.endpoint] += 1
            elif 200 <= result.status < 400:
                self.results.successful_requests += 1
            else:
                self.results.failed_requests += 1
                self.results.errors_by_status[result.status] += 1
                self.results.errors_by_endpoint[result.endpoint] += 1
                if result.error and len(self.results.error_messages) < 50:
                    self.results.error_messages.append(f"{result.endpoint}: {result.error[:100]}")

    async def make_request(self, session: aiohttp.ClientSession, method: str, endpoint: str, 
                          data: dict = None, timeout: int = 30) -> RequestResult:
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
                await self.record_result(result)
                return result
                
        except asyncio.TimeoutError:
            result = RequestResult(
                endpoint=endpoint,
                method=method,
                status=0,
                response_time=timeout,
                error="Timeout"
            )
            await self.record_result(result)
            return result
            
        except Exception as e:
            response_time = time.time() - start
            result = RequestResult(
                endpoint=endpoint,
                method=method,
                status=0,
                response_time=response_time,
                error=str(e)[:200]
            )
            await self.record_result(result)
            return result

    async def login_user(self, session: aiohttp.ClientSession) -> bool:
        """Login and get session cookie"""
        result = await self.make_request(
            session, "POST", "/auth/login",
            data={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        return result.status == 200

    async def public_journey(self, session: aiohttp.ClientSession):
        """Parcours public (sans authentification)"""
        
        # 1. Health check
        await self.make_request(session, "GET", "/health")
        
        # 2. Get posts (public)
        await self.make_request(session, "GET", "/posts?limit=20")
        await asyncio.sleep(random.uniform(0.05, 0.15))
        
        # 3. Stories
        await self.make_request(session, "GET", "/stories")
        
        # 4. Marketplace products
        await self.make_request(session, "GET", "/marketplace/products?limit=20")
        
        # 5. Marketplace services
        await self.make_request(session, "GET", "/marketplace/services?limit=10")
        
        # 6. Categories
        await self.make_request(session, "GET", "/marketplace/categories")
        await asyncio.sleep(random.uniform(0.05, 0.15))
        
        # 7. Pulse - Islands
        await self.make_request(session, "GET", "/pulse/islands")
        
        # 8. Pulse - Markers
        await self.make_request(session, "GET", "/pulse/markers?island=tahiti")
        
        # 9. Pulse - Status
        await self.make_request(session, "GET", "/pulse/status")
        await asyncio.sleep(random.uniform(0.05, 0.15))
        
        # 10. Search products
        await self.make_request(session, "GET", "/search/products?q=artisanat")
        
        # 11. Translation (GET - corrigé)
        await self.make_request(session, "GET", "/translate?text=bonjour&direction=fr_to_tah")
        
        # 12. RSS posts (nouveau endpoint)
        await self.make_request(session, "GET", "/rss/posts?limit=10")
        
        # 13. RSS sources
        await self.make_request(session, "GET", "/rss/sources")
        await asyncio.sleep(random.uniform(0.05, 0.15))
        
        # 14. News latest
        await self.make_request(session, "GET", "/news/latest?limit=10")
        
        # 15. Reels
        await self.make_request(session, "GET", "/reels")
        
        # 16. Lives
        await self.make_request(session, "GET", "/lives")

    async def authenticated_journey(self, session: aiohttp.ClientSession):
        """Parcours authentifié"""
        
        # Login first
        login_success = await self.login_user(session)
        if not login_success:
            return  # Skip authenticated actions if login failed
        
        await asyncio.sleep(random.uniform(0.1, 0.2))
        
        # 1. Get current user
        await self.make_request(session, "GET", "/auth/me")
        
        # 2. Feed
        await self.make_request(session, "GET", "/feed?limit=20")
        
        # 3. Notifications
        await self.make_request(session, "GET", "/notifications")
        
        # 4. Unread count
        await self.make_request(session, "GET", "/notifications/unread-count")
        await asyncio.sleep(random.uniform(0.05, 0.15))
        
        # 5. Conversations
        await self.make_request(session, "GET", "/conversations")
        
        # 6. Saved posts
        await self.make_request(session, "GET", "/saved")
        
        # 7. Search users
        await self.make_request(session, "GET", "/search/users?q=test")
        
        # 8. Search posts
        await self.make_request(session, "GET", "/search/posts?q=tahiti")
        await asyncio.sleep(random.uniform(0.05, 0.15))
        
        # 9. Pulse mana
        await self.make_request(session, "GET", "/pulse/mana")
        
        # 10. Pulse badges
        await self.make_request(session, "GET", "/pulse/badges/me")
        
        # 11. Pulse leaderboard
        await self.make_request(session, "GET", "/pulse/leaderboard")
        
        # 12. Translation dictionary
        await self.make_request(session, "GET", "/translate/dictionary")
        await asyncio.sleep(random.uniform(0.05, 0.15))
        
        # 13. Translation phrases
        await self.make_request(session, "GET", "/translate/phrases")
        
        # 14. Logout
        await self.make_request(session, "POST", "/auth/logout")

    async def mixed_journey(self, session: aiohttp.ClientSession, user_id: int):
        """Parcours mixte: public puis authentifié"""
        
        # 70% public, 30% authenticated
        if random.random() < 0.7:
            await self.public_journey(session)
        else:
            await self.authenticated_journey(session)

    async def run_concurrent_users(self, num_users: int, duration_seconds: int = 60):
        """Exécuter des utilisateurs simultanés pendant une durée donnée"""
        print(f"\n🚀 Lancement de {num_users} utilisateurs simultanés pendant {duration_seconds}s...")
        
        self.results = LoadTestResults()
        self.results.start_time = time.time()
        
        # Configure connection pooling
        connector = aiohttp.TCPConnector(
            limit=min(num_users * 2, 500),
            limit_per_host=min(num_users, 200),
            ttl_dns_cache=300,
            enable_cleanup_closed=True
        )
        
        # Cookie jar for session management
        cookie_jar = aiohttp.CookieJar(unsafe=True)
        
        async def user_loop(user_id: int, end_time: float):
            async with aiohttp.ClientSession(
                connector=connector, 
                cookie_jar=aiohttp.CookieJar(unsafe=True)
            ) as session:
                journey_count = 0
                while time.time() < end_time:
                    try:
                        await self.mixed_journey(session, user_id)
                        journey_count += 1
                    except Exception as e:
                        pass  # Continue silently
                    await asyncio.sleep(random.uniform(0.3, 1.0))
        
        end_time = time.time() + duration_seconds
        tasks = [user_loop(i, end_time) for i in range(num_users)]
        
        # Monitor progress
        monitor_task = asyncio.create_task(self._monitor_progress(duration_seconds))
        
        await asyncio.gather(*tasks, return_exceptions=True)
        monitor_task.cancel()
        
        self.results.end_time = time.time()
        
        return self.generate_report(num_users)

    async def _monitor_progress(self, duration: int):
        """Afficher la progression"""
        try:
            for i in range(duration // 5 + 1):
                await asyncio.sleep(5)
                elapsed = time.time() - self.results.start_time
                rps = self.results.total_requests / elapsed if elapsed > 0 else 0
                error_rate = (self.results.failed_requests / self.results.total_requests * 100) if self.results.total_requests > 0 else 0
                print(f"  📊 {self.results.total_requests} req | {rps:.1f} rps | {error_rate:.1f}% erreurs | {self.results.timeouts} timeouts")
        except asyncio.CancelledError:
            pass

    def generate_report(self, num_users: int) -> dict:
        """Générer le rapport de test"""
        duration = self.results.end_time - self.results.start_time
        
        # Calcul des percentiles
        sorted_times = sorted(self.results.response_times) if self.results.response_times else [0]
        
        def percentile(data, p):
            if not data:
                return 0
            k = (len(data) - 1) * p / 100
            f = int(k)
            c = min(f + 1, len(data) - 1)
            return data[f] + (data[c] - data[f]) * (k - f)
        
        # Stats par endpoint
        endpoint_stats = {}
        for endpoint, times in self.results.requests_by_endpoint.items():
            if times:
                sorted_endpoint_times = sorted(times)
                endpoint_stats[endpoint] = {
                    "requests": len(times),
                    "avg_ms": round(statistics.mean(times) * 1000, 2),
                    "p95_ms": round(percentile(sorted_endpoint_times, 95) * 1000, 2),
                    "errors": self.results.errors_by_endpoint.get(endpoint, 0),
                    "error_rate": round(self.results.errors_by_endpoint.get(endpoint, 0) / len(times) * 100, 2)
                }
        
        report = {
            "summary": {
                "concurrent_users": num_users,
                "duration_seconds": round(duration, 2),
                "total_requests": self.results.total_requests,
                "successful_requests": self.results.successful_requests,
                "failed_requests": self.results.failed_requests,
                "timeouts": self.results.timeouts,
                "requests_per_second": round(self.results.total_requests / duration, 2) if duration > 0 else 0,
                "error_rate_percent": round(self.results.failed_requests / self.results.total_requests * 100, 2) if self.results.total_requests > 0 else 0,
            },
            "response_times": {
                "avg_ms": round(statistics.mean(self.results.response_times) * 1000, 2) if self.results.response_times else 0,
                "min_ms": round(min(self.results.response_times) * 1000, 2) if self.results.response_times else 0,
                "max_ms": round(max(self.results.response_times) * 1000, 2) if self.results.response_times else 0,
                "p50_ms": round(percentile(sorted_times, 50) * 1000, 2),
                "p95_ms": round(percentile(sorted_times, 95) * 1000, 2),
                "p99_ms": round(percentile(sorted_times, 99) * 1000, 2),
            },
            "errors_by_status": dict(self.results.errors_by_status),
            "endpoint_stats": endpoint_stats,
            "sample_errors": self.results.error_messages[:20],
            "system": {
                "cpu_percent": psutil.cpu_percent(),
                "memory_percent": psutil.virtual_memory().percent,
                "memory_used_gb": round(psutil.virtual_memory().used / (1024**3), 2),
            }
        }
        
        return report


def generate_final_report(reports: List[dict]) -> dict:
    """Générer le rapport final consolidé"""
    
    # Détecter les seuils
    degradation = None
    breaking_point = None
    
    for r in reports:
        if degradation is None and (r['response_times']['p95_ms'] > 2000 or r['summary']['error_rate_percent'] > 10):
            degradation = r['summary']['concurrent_users']
        if breaking_point is None and (r['summary']['error_rate_percent'] > 30 or r['response_times']['p95_ms'] > 10000):
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
            "error_rate": r["summary"]["error_rate_percent"],
            "timeouts": r["summary"]["timeouts"],
        })
    
    # Agrégation des erreurs
    all_errors_by_status = defaultdict(int)
    all_errors_by_endpoint = defaultdict(int)
    
    for r in reports:
        for status, count in r.get("errors_by_status", {}).items():
            all_errors_by_status[status] += count
        for endpoint, stats in r.get("endpoint_stats", {}).items():
            all_errors_by_endpoint[endpoint] += stats.get("errors", 0)
    
    fragile_endpoints = sorted(all_errors_by_endpoint.items(), key=lambda x: x[1], reverse=True)[:10]
    
    total_requests = sum(r["summary"]["total_requests"] for r in reports)
    total_errors = sum(r["summary"]["failed_requests"] for r in reports)
    
    # Recommandations
    recommendations = []
    if degradation and degradation <= 25:
        recommendations.append(f"⚠️ Dégradation détectée à {degradation} utilisateurs - optimisation recommandée")
    if breaking_point and breaking_point <= 50:
        recommendations.append(f"🔴 Point de rupture à {breaking_point} utilisateurs - scaling requis")
    
    # Ajouter recommandations basées sur les erreurs
    if 429 in all_errors_by_status and all_errors_by_status[429] > 100:
        recommendations.append("📊 Rate limiting actif - configuration correcte pour la sécurité")
    if 401 in all_errors_by_status:
        recommendations.append(f"🔐 {all_errors_by_status[401]} erreurs d'authentification - vérifier la gestion des sessions")
    
    return {
        "test_info": {
            "date": datetime.now().isoformat(),
            "url": BASE_URL,
            "stages_count": len(reports),
            "total_duration_minutes": sum(r["summary"]["duration_seconds"] for r in reports) / 60
        },
        "overall_metrics": {
            "total_requests": total_requests,
            "total_errors": total_errors,
            "overall_error_rate": round(total_errors / total_requests * 100, 2) if total_requests > 0 else 0,
            "max_rps_achieved": max(r["summary"]["requests_per_second"] for r in reports) if reports else 0,
            "best_avg_response_ms": min(r["response_times"]["avg_ms"] for r in reports) if reports else 0,
            "worst_p99_ms": max(r["response_times"]["p99_ms"] for r in reports) if reports else 0,
        },
        "thresholds": {
            "degradation_starts_at_users": degradation,
            "breaking_point_at_users": breaking_point,
            "safe_concurrent_users": (degradation - 5) if degradation else (stages_summary[-1]["users"] if stages_summary else 0)
        },
        "stages_summary": stages_summary,
        "errors_summary": {
            "by_status": dict(all_errors_by_status),
            "by_endpoint": dict(fragile_endpoints),
        },
        "recommendations": recommendations
    }


def print_final_report(report: dict):
    """Afficher le rapport final formaté"""
    
    print("\n")
    print("=" * 70)
    print("📊 RAPPORT FINAL DE TEST DE CHARGE V2")
    print("=" * 70)
    
    print("\n## RÉSUMÉ EXÉCUTIF")
    print("-" * 40)
    print(f"• Date: {report['test_info']['date']}")
    print(f"• Durée totale: {report['test_info']['total_duration_minutes']:.1f} minutes")
    print(f"• Requêtes totales: {report['overall_metrics']['total_requests']:,}")
    print(f"• RPS max atteint: {report['overall_metrics']['max_rps_achieved']:.1f}")
    print(f"• Taux d'erreur global: {report['overall_metrics']['overall_error_rate']:.2f}%")
    
    print("\n## SEUILS DE PERFORMANCE")
    print("-" * 40)
    thresholds = report['thresholds']
    print(f"• 🟢 Utilisateurs SAFE: {thresholds['safe_concurrent_users'] or 'Non déterminé'}")
    print(f"• 🟡 Dégradation: {thresholds['degradation_starts_at_users'] or 'Non atteint'} users")
    print(f"• 🔴 Rupture: {thresholds['breaking_point_at_users'] or 'Non atteint'} users")
    
    print("\n## MÉTRIQUES PAR PALIER")
    print("-" * 70)
    print(f"{'Palier':<15} {'Users':>6} {'RPS':>8} {'Avg(ms)':>10} {'P95(ms)':>10} {'Erreur%':>10}")
    print("-" * 70)
    for stage in report['stages_summary']:
        print(f"{stage['stage']:<15} {stage['users']:>6} {stage['rps']:>8.1f} {stage['avg_ms']:>10.1f} {stage['p95_ms']:>10.1f} {stage['error_rate']:>9.2f}%")
    
    print("\n## ERREURS PAR CODE HTTP")
    print("-" * 40)
    for status, count in sorted(report['errors_summary']['by_status'].items()):
        print(f"• HTTP {status}: {count} erreurs")
    
    if report.get('recommendations'):
        print("\n## RECOMMANDATIONS")
        print("-" * 40)
        for rec in report['recommendations']:
            print(f"  {rec}")
    
    print("\n" + "=" * 70)


async def run_progressive_load_test():
    """Test progressif avec montée en charge"""
    
    print("=" * 70)
    print("🔥 TEST DE CHARGE V2 - NATI FENUA (Optimisé)")
    print("=" * 70)
    print(f"📍 URL: {BASE_URL}")
    print(f"⏰ Démarrage: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    tester = LoadTesterV2(BASE_URL)
    
    # Paliers de charge optimisés
    stages = [
        {"users": 5, "duration": 30, "name": "Échauffement"},
        {"users": 10, "duration": 40, "name": "Léger"},
        {"users": 25, "duration": 40, "name": "Modéré"},
        {"users": 50, "duration": 40, "name": "Élevé"},
        {"users": 100, "duration": 40, "name": "Stress"},
        {"users": 150, "duration": 30, "name": "Surcharge"},
    ]
    
    all_reports = []
    
    for stage in stages:
        print(f"\n{'='*50}")
        print(f"📈 PALIER: {stage['name']} ({stage['users']} utilisateurs)")
        print(f"{'='*50}")
        
        try:
            report = await tester.run_concurrent_users(stage["users"], stage["duration"])
            report["stage_name"] = stage["name"]
            all_reports.append(report)
            
            # Afficher résumé du palier
            print(f"\n✅ Palier terminé:")
            print(f"   • Requêtes: {report['summary']['total_requests']}")
            print(f"   • RPS: {report['summary']['requests_per_second']:.1f}")
            print(f"   • Temps moyen: {report['response_times']['avg_ms']:.1f}ms")
            print(f"   • P95: {report['response_times']['p95_ms']:.1f}ms")
            print(f"   • Taux d'erreur: {report['summary']['error_rate_percent']:.2f}%")
            
            # Pause entre paliers
            print(f"\n⏸️ Pause de 8 secondes...")
            await asyncio.sleep(8)
            
        except Exception as e:
            print(f"\n❌ Erreur lors du palier {stage['name']}: {e}")
            break
    
    # Générer rapport final
    final_report = generate_final_report(all_reports)
    
    # Sauvegarder le rapport
    report_path = "/app/load_test/load_test_v2_report.json"
    with open(report_path, "w") as f:
        json.dump(final_report, f, indent=2, default=str)
    
    # Afficher rapport final
    print_final_report(final_report)
    
    print(f"\n📁 Rapport sauvegardé: {report_path}")
    
    return final_report


if __name__ == "__main__":
    asyncio.run(run_progressive_load_test())
