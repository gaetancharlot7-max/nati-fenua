#!/usr/bin/env python3
"""
Test de Charge - Nati Fenua
===========================
Test progressif de charge pour identifier les limites de l'application
"""

import asyncio
import aiohttp
import time
import json
import random
import statistics
from datetime import datetime
from collections import defaultdict
from dataclasses import dataclass, field
from typing import List, Dict, Any
import psutil
import os

# Configuration
BASE_URL = os.environ.get('TEST_URL', 'https://fenua-connect.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

# Credentials
TEST_USERS = [
    {"email": "user1@test.com", "password": "TestPass123!"},
    {"email": "user2@test.com", "password": "TestPass123!"},
]

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

class LoadTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.results = LoadTestResults()
        self.session_tokens = []
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
                if result.error:
                    self.results.error_messages.append(f"{result.endpoint}: {result.error[:100]}")

    async def make_request(self, session: aiohttp.ClientSession, method: str, endpoint: str, 
                          data: dict = None, headers: dict = None, timeout: int = 30) -> RequestResult:
        url = f"{self.api_url}{endpoint}" if endpoint.startswith('/') else endpoint
        start = time.time()
        
        try:
            async with session.request(method, url, json=data, headers=headers, 
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

    async def login(self, session: aiohttp.ClientSession, email: str, password: str) -> str:
        """Connexion et récupération du token de session"""
        result = await self.make_request(
            session, "POST", "/auth/login",
            data={"email": email, "password": password}
        )
        if result.status == 200:
            return "authenticated"
        return None

    async def user_journey(self, session: aiohttp.ClientSession, user_id: int):
        """Parcours utilisateur complet"""
        
        # 1. Page d'accueil
        await self.make_request(session, "GET", "/health")
        
        # 2. Connexion
        user = TEST_USERS[user_id % len(TEST_USERS)]
        await self.login(session, user["email"], user["password"])
        
        # 3. Feed - Récupérer les posts
        await self.make_request(session, "GET", "/posts?limit=20")
        await asyncio.sleep(random.uniform(0.1, 0.3))
        
        # 4. Stories
        await self.make_request(session, "GET", "/stories")
        
        # 5. Profil utilisateur
        await self.make_request(session, "GET", "/auth/me")
        await asyncio.sleep(random.uniform(0.1, 0.3))
        
        # 6. Marketplace - Produits
        await self.make_request(session, "GET", "/marketplace/products?limit=20")
        
        # 7. Marketplace - Services
        await self.make_request(session, "GET", "/marketplace/services?limit=10")
        
        # 8. Marketplace - Catégories
        await self.make_request(session, "GET", "/marketplace/categories")
        await asyncio.sleep(random.uniform(0.1, 0.3))
        
        # 9. Pulse - Îles
        await self.make_request(session, "GET", "/pulse/islands")
        
        # 10. Pulse - Markers
        await self.make_request(session, "GET", "/pulse/markers?island=tahiti")
        
        # 11. Pulse - Status
        await self.make_request(session, "GET", "/pulse/status")
        await asyncio.sleep(random.uniform(0.1, 0.3))
        
        # 12. Recherche utilisateurs
        await self.make_request(session, "GET", "/search/users?q=test")
        
        # 13. Recherche posts
        await self.make_request(session, "GET", "/search/posts?q=tahiti")
        
        # 14. Traduction
        await self.make_request(session, "GET", "/translate?text=bonjour&direction=fr_to_th")
        await asyncio.sleep(random.uniform(0.1, 0.3))
        
        # 15. Notifications
        await self.make_request(session, "GET", "/notifications")
        
        # 16. Conversations
        await self.make_request(session, "GET", "/conversations")
        
        # 17. RSS Feeds
        await self.make_request(session, "GET", "/rss/posts?limit=10")
        await asyncio.sleep(random.uniform(0.1, 0.3))
        
        # 18. Like un post (si existe)
        await self.make_request(session, "POST", "/posts/post_demo1/like")
        
        # 19. Actualiser le feed
        await self.make_request(session, "GET", "/posts?limit=20&skip=20")
        
        # 20. Déconnexion
        await self.make_request(session, "POST", "/auth/logout")

    async def run_concurrent_users(self, num_users: int, duration_seconds: int = 60):
        """Exécuter des utilisateurs simultanés pendant une durée donnée"""
        print(f"\n🚀 Lancement de {num_users} utilisateurs simultanés pendant {duration_seconds}s...")
        
        self.results = LoadTestResults()
        self.results.start_time = time.time()
        
        connector = aiohttp.TCPConnector(limit=min(num_users * 2, 500), limit_per_host=min(num_users, 200))
        
        async def user_loop(user_id: int, end_time: float):
            async with aiohttp.ClientSession(connector=connector) as session:
                journey_count = 0
                while time.time() < end_time:
                    try:
                        await self.user_journey(session, user_id)
                        journey_count += 1
                    except Exception as e:
                        print(f"  ⚠️ User {user_id} error: {e}")
                    await asyncio.sleep(random.uniform(0.5, 2.0))
        
        end_time = time.time() + duration_seconds
        tasks = [user_loop(i, end_time) for i in range(num_users)]
        
        # Monitor progress
        start = time.time()
        monitor_task = asyncio.create_task(self._monitor_progress(duration_seconds))
        
        await asyncio.gather(*tasks, return_exceptions=True)
        monitor_task.cancel()
        
        self.results.end_time = time.time()
        
        return self.generate_report(num_users)

    async def _monitor_progress(self, duration: int):
        """Afficher la progression"""
        try:
            for i in range(duration):
                await asyncio.sleep(5)
                rps = self.results.total_requests / (time.time() - self.results.start_time) if self.results.start_time else 0
                print(f"  📊 {self.results.total_requests} requêtes | {rps:.1f} req/s | {self.results.failed_requests} erreurs")
        except asyncio.CancelledError:
            pass

    def generate_report(self, num_users: int) -> dict:
        """Générer le rapport de test"""
        duration = self.results.end_time - self.results.start_time
        
        # Calcul des percentiles
        sorted_times = sorted(self.results.response_times) if self.results.response_times else [0]
        
        def percentile(data, p):
            k = (len(data) - 1) * p / 100
            f = int(k)
            c = f + 1 if f < len(data) - 1 else f
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
        
        # Top endpoints les plus lents
        slowest_endpoints = sorted(endpoint_stats.items(), key=lambda x: x[1]["avg_ms"], reverse=True)[:10]
        
        # Endpoints avec le plus d'erreurs
        error_endpoints = sorted(endpoint_stats.items(), key=lambda x: x[1]["errors"], reverse=True)[:10]
        
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
            "slowest_endpoints": dict(slowest_endpoints),
            "error_endpoints": dict(error_endpoints),
            "sample_errors": self.results.error_messages[:20],
            "system": {
                "cpu_percent": psutil.cpu_percent(),
                "memory_percent": psutil.virtual_memory().percent,
                "memory_used_gb": round(psutil.virtual_memory().used / (1024**3), 2),
            }
        }
        
        return report

async def run_progressive_load_test():
    """Test progressif avec montée en charge"""
    
    print("=" * 70)
    print("🔥 TEST DE CHARGE PROGRESSIF - NATI FENUA")
    print("=" * 70)
    print(f"📍 URL: {BASE_URL}")
    print(f"⏰ Démarrage: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    tester = LoadTester(BASE_URL)
    
    # Paliers de charge
    stages = [
        {"users": 5, "duration": 30, "name": "Échauffement"},
        {"users": 10, "duration": 45, "name": "Charge légère"},
        {"users": 25, "duration": 45, "name": "Charge modérée"},
        {"users": 50, "duration": 45, "name": "Charge élevée"},
        {"users": 100, "duration": 45, "name": "Stress test"},
        {"users": 150, "duration": 30, "name": "Surcharge"},
    ]
    
    all_reports = []
    degradation_threshold = None
    breaking_point = None
    
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
            print(f"   • RPS: {report['summary']['requests_per_second']}")
            print(f"   • Temps moyen: {report['response_times']['avg_ms']}ms")
            print(f"   • P95: {report['response_times']['p95_ms']}ms")
            print(f"   • Taux d'erreur: {report['summary']['error_rate_percent']}%")
            print(f"   • CPU: {report['system']['cpu_percent']}%")
            print(f"   • RAM: {report['system']['memory_percent']}%")
            
            # Détecter dégradation (P95 > 2s ou erreurs > 5%)
            if degradation_threshold is None:
                if report['response_times']['p95_ms'] > 2000 or report['summary']['error_rate_percent'] > 5:
                    degradation_threshold = stage['users']
                    print(f"\n⚠️ DÉGRADATION DÉTECTÉE à {stage['users']} utilisateurs!")
            
            # Détecter point de rupture (erreurs > 20% ou P95 > 10s)
            if breaking_point is None:
                if report['summary']['error_rate_percent'] > 20 or report['response_times']['p95_ms'] > 10000:
                    breaking_point = stage['users']
                    print(f"\n🔴 POINT DE RUPTURE DÉTECTÉ à {stage['users']} utilisateurs!")
            
            # Pause entre paliers
            print(f"\n⏸️ Pause de 10 secondes avant le prochain palier...")
            await asyncio.sleep(10)
            
        except Exception as e:
            print(f"\n❌ Erreur lors du palier {stage['name']}: {e}")
            breaking_point = stage['users']
            break
    
    # Générer rapport final
    final_report = generate_final_report(all_reports, degradation_threshold, breaking_point)
    
    # Sauvegarder le rapport
    report_path = "/app/load_test/load_test_report.json"
    with open(report_path, "w") as f:
        json.dump(final_report, f, indent=2, default=str)
    
    # Afficher rapport final
    print_final_report(final_report)
    
    return final_report

def generate_final_report(reports: List[dict], degradation: int, breaking: int) -> dict:
    """Générer le rapport final consolidé"""
    
    # Résumé par palier
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
    all_sample_errors = []
    
    for r in reports:
        for status, count in r.get("errors_by_status", {}).items():
            all_errors_by_status[status] += count
        for endpoint, stats in r.get("endpoint_stats", {}).items():
            all_errors_by_endpoint[endpoint] += stats.get("errors", 0)
        all_sample_errors.extend(r.get("sample_errors", []))
    
    # Identifier les endpoints les plus fragiles
    fragile_endpoints = sorted(all_errors_by_endpoint.items(), key=lambda x: x[1], reverse=True)[:10]
    
    # Total des requêtes
    total_requests = sum(r["summary"]["total_requests"] for r in reports)
    total_errors = sum(r["summary"]["failed_requests"] for r in reports)
    
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
            "max_rps_achieved": max(r["summary"]["requests_per_second"] for r in reports),
            "best_avg_response_ms": min(r["response_times"]["avg_ms"] for r in reports),
            "worst_p99_ms": max(r["response_times"]["p99_ms"] for r in reports),
        },
        "thresholds": {
            "degradation_starts_at_users": degradation,
            "breaking_point_at_users": breaking,
            "safe_concurrent_users": degradation - 5 if degradation else stages_summary[-1]["users"]
        },
        "stages_summary": stages_summary,
        "errors_summary": {
            "by_status": dict(all_errors_by_status),
            "by_endpoint": dict(fragile_endpoints),
        },
        "sample_errors": all_sample_errors[:30],
        "recommendations": generate_recommendations(reports, degradation, breaking, fragile_endpoints)
    }

def generate_recommendations(reports: List[dict], degradation: int, breaking: int, fragile_endpoints: list) -> List[str]:
    """Générer des recommandations basées sur les résultats"""
    recommendations = []
    
    # Recommandations basées sur les seuils
    if degradation and degradation <= 50:
        recommendations.append("🔴 CRITIQUE: L'application commence à se dégrader à seulement {0} utilisateurs. Optimisation urgente requise.".format(degradation))
    elif degradation and degradation <= 100:
        recommendations.append("🟡 ATTENTION: Dégradation détectée à {0} utilisateurs. Prévoir des optimisations avant mise en production.".format(degradation))
    
    # Recommandations sur les endpoints fragiles
    if fragile_endpoints:
        top_fragile = fragile_endpoints[0]
        recommendations.append(f"🔧 Endpoint le plus fragile: {top_fragile[0]} ({top_fragile[1]} erreurs). Investiguer en priorité.")
    
    # Recommandations générales
    last_report = reports[-1] if reports else None
    if last_report:
        if last_report["response_times"]["p95_ms"] > 3000:
            recommendations.append("⚡ Temps de réponse P95 élevé. Considérer: mise en cache, optimisation des requêtes DB, CDN.")
        
        if last_report["summary"]["timeouts"] > 0:
            recommendations.append("⏱️ Timeouts détectés. Vérifier: connection pooling, timeouts serveur, capacité DB.")
        
        if last_report["system"]["cpu_percent"] > 80:
            recommendations.append("💻 CPU élevé. Considérer: scaling horizontal, optimisation du code, workers supplémentaires.")
        
        if last_report["system"]["memory_percent"] > 80:
            recommendations.append("🧠 Mémoire élevée. Investiguer: fuites mémoire, cache trop grand, garbage collection.")
    
    # Optimisations recommandées
    recommendations.extend([
        "📊 Ajouter un système de cache Redis pour les données fréquemment accédées",
        "🔄 Implémenter du rate limiting par IP pour éviter les abus",
        "📈 Configurer un load balancer pour distribution de charge",
        "🗄️ Optimiser les index MongoDB pour les requêtes lentes"
    ])
    
    return recommendations

def print_final_report(report: dict):
    """Afficher le rapport final formaté"""
    
    print("\n")
    print("=" * 70)
    print("📊 RAPPORT FINAL DE TEST DE CHARGE")
    print("=" * 70)
    
    print("\n## RÉSUMÉ EXÉCUTIF")
    print("-" * 40)
    print(f"• Date: {report['test_info']['date']}")
    print(f"• Durée totale: {report['test_info']['total_duration_minutes']:.1f} minutes")
    print(f"• Requêtes totales: {report['overall_metrics']['total_requests']:,}")
    print(f"• RPS max atteint: {report['overall_metrics']['max_rps_achieved']}")
    print(f"• Taux d'erreur global: {report['overall_metrics']['overall_error_rate']}%")
    
    print("\n## SEUILS DE PERFORMANCE")
    print("-" * 40)
    thresholds = report['thresholds']
    print(f"• 🟢 Utilisateurs simultanés SAFE: {thresholds['safe_concurrent_users']}")
    print(f"• 🟡 Dégradation commence à: {thresholds['degradation_starts_at_users'] or 'Non atteint'} utilisateurs")
    print(f"• 🔴 Point de rupture: {thresholds['breaking_point_at_users'] or 'Non atteint'} utilisateurs")
    
    print("\n## MÉTRIQUES PAR PALIER")
    print("-" * 40)
    print(f"{'Palier':<15} {'Users':>6} {'RPS':>8} {'Avg(ms)':>10} {'P95(ms)':>10} {'Erreur%':>10}")
    print("-" * 65)
    for stage in report['stages_summary']:
        print(f"{stage['stage']:<15} {stage['users']:>6} {stage['rps']:>8.1f} {stage['avg_ms']:>10.1f} {stage['p95_ms']:>10.1f} {stage['error_rate']:>9.2f}%")
    
    print("\n## ERREURS PAR CODE HTTP")
    print("-" * 40)
    for status, count in sorted(report['errors_summary']['by_status'].items()):
        print(f"• HTTP {status}: {count} erreurs")
    
    print("\n## ENDPOINTS LES PLUS FRAGILES")
    print("-" * 40)
    for endpoint, errors in list(report['errors_summary']['by_endpoint'].items())[:5]:
        print(f"• {endpoint}: {errors} erreurs")
    
    print("\n## RECOMMANDATIONS")
    print("-" * 40)
    for rec in report['recommendations']:
        print(f"  {rec}")
    
    print("\n" + "=" * 70)
    print("📁 Rapport complet sauvegardé: /app/load_test/load_test_report.json")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_progressive_load_test())
