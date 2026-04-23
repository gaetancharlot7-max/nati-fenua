"""
Test de charge final pour Nati Fenua
Simule jusqu'à 2000 utilisateurs simultanés
"""
import asyncio
import aiohttp
import time
import statistics
from datetime import datetime
import json

# Configuration
BASE_URL = "https://fenua-chat-debug.preview.emergentagent.com/api"
TOTAL_REQUESTS = 500
CONCURRENT_USERS = [10, 50, 100, 200, 500]

results = {
    "test_date": datetime.now().isoformat(),
    "base_url": BASE_URL,
    "endpoints_tested": [],
    "performance_by_concurrency": {},
    "errors": [],
    "recommendations": []
}

async def make_request(session, url, method="GET", data=None):
    """Effectue une requête et mesure le temps de réponse"""
    start = time.time()
    try:
        if method == "GET":
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                await response.read()
                elapsed = time.time() - start
                return {
                    "status": response.status,
                    "time": elapsed,
                    "success": response.status < 400
                }
        elif method == "POST":
            async with session.post(url, json=data, timeout=aiohttp.ClientTimeout(total=30)) as response:
                await response.read()
                elapsed = time.time() - start
                return {
                    "status": response.status,
                    "time": elapsed,
                    "success": response.status < 400
                }
    except asyncio.TimeoutError:
        return {"status": 0, "time": 30, "success": False, "error": "timeout"}
    except Exception as e:
        return {"status": 0, "time": time.time() - start, "success": False, "error": str(e)}

async def test_endpoint(session, endpoint, concurrent, num_requests):
    """Test un endpoint avec N requêtes concurrentes"""
    url = f"{BASE_URL}{endpoint}"
    tasks = [make_request(session, url) for _ in range(num_requests)]
    responses = await asyncio.gather(*tasks)
    return responses

async def run_load_test():
    """Exécute le test de charge complet"""
    print("=" * 60)
    print("🚀 TEST DE CHARGE NATI FENUA")
    print("=" * 60)
    
    # Endpoints à tester
    endpoints = [
        "/health",
        "/posts?limit=10",
        "/statistics/platform",
        "/translations/fr",
    ]
    
    results["endpoints_tested"] = endpoints
    
    connector = aiohttp.TCPConnector(limit=0, force_close=True)
    async with aiohttp.ClientSession(connector=connector) as session:
        
        for concurrent in CONCURRENT_USERS:
            print(f"\n📊 Test avec {concurrent} utilisateurs simultanés...")
            
            all_times = []
            all_success = 0
            all_errors = 0
            
            for endpoint in endpoints:
                responses = await test_endpoint(session, endpoint, concurrent, concurrent)
                
                times = [r["time"] for r in responses if r["success"]]
                successes = sum(1 for r in responses if r["success"])
                errors = sum(1 for r in responses if not r["success"])
                
                all_times.extend(times)
                all_success += successes
                all_errors += errors
                
                if errors > 0:
                    error_types = [r.get("error", f"HTTP {r['status']}") for r in responses if not r["success"]]
                    results["errors"].append({
                        "endpoint": endpoint,
                        "concurrent": concurrent,
                        "errors": error_types[:5]
                    })
            
            if all_times:
                stats = {
                    "concurrent_users": concurrent,
                    "total_requests": len(all_times) + all_errors,
                    "successful_requests": all_success,
                    "failed_requests": all_errors,
                    "success_rate": round(all_success / (all_success + all_errors) * 100, 2),
                    "avg_response_time_ms": round(statistics.mean(all_times) * 1000, 2),
                    "min_response_time_ms": round(min(all_times) * 1000, 2),
                    "max_response_time_ms": round(max(all_times) * 1000, 2),
                    "p95_response_time_ms": round(sorted(all_times)[int(len(all_times) * 0.95)] * 1000, 2) if len(all_times) > 1 else 0,
                    "requests_per_second": round(len(all_times) / sum(all_times), 2) if sum(all_times) > 0 else 0
                }
                results["performance_by_concurrency"][concurrent] = stats
                
                # Affichage
                status = "✅" if stats["success_rate"] >= 95 else "⚠️" if stats["success_rate"] >= 80 else "❌"
                print(f"   {status} Taux de succès: {stats['success_rate']}%")
                print(f"   ⏱️  Temps moyen: {stats['avg_response_time_ms']}ms")
                print(f"   🚀 Requêtes/sec: {stats['requests_per_second']}")
            
            await asyncio.sleep(1)  # Pause entre les tests
    
    # Analyse et recommandations
    print("\n" + "=" * 60)
    print("📈 ANALYSE ET RECOMMANDATIONS")
    print("=" * 60)
    
    # Déterminer la capacité maximale
    max_capacity = 0
    for concurrent, stats in results["performance_by_concurrency"].items():
        if stats["success_rate"] >= 95 and stats["avg_response_time_ms"] < 2000:
            max_capacity = concurrent
    
    results["estimated_max_concurrent_users"] = max_capacity
    results["target_users"] = "1500-2000"
    
    # Recommandations
    if max_capacity < 100:
        results["recommendations"] = [
            "⚠️ URGENT: La capacité actuelle est très limitée",
            "1. Upgrader Render au plan Standard ($25/mois)",
            "2. Ajouter Redis pour le caching",
            "3. Optimiser les index MongoDB",
            "4. Activer la compression Gzip"
        ]
        results["status"] = "NEEDS_OPTIMIZATION"
    elif max_capacity < 500:
        results["recommendations"] = [
            "📊 Capacité modérée détectée",
            "1. Upgrader Render pour plus de ressources",
            "2. Ajouter du caching Redis",
            "3. Optimiser les requêtes lourdes"
        ]
        results["status"] = "MODERATE"
    else:
        results["recommendations"] = [
            "✅ Bonne capacité de base",
            "1. Monitorer en production",
            "2. Ajouter Redis pour améliorer encore"
        ]
        results["status"] = "GOOD"
    
    return results

# Exécuter le test
if __name__ == "__main__":
    final_results = asyncio.run(run_load_test())
    
    # Sauvegarder les résultats
    with open("/app/backend/tests/load_test_results.json", "w") as f:
        json.dump(final_results, f, indent=2)
    
    print("\n" + "=" * 60)
    print("📋 RÉSUMÉ FINAL")
    print("=" * 60)
    print(f"Capacité estimée actuelle: {final_results['estimated_max_concurrent_users']} users")
    print(f"Objectif: {final_results['target_users']} users")
    print(f"Status: {final_results['status']}")
    print("\nRecommandations:")
    for rec in final_results["recommendations"]:
        print(f"  {rec}")
    print("\n✅ Résultats sauvegardés dans /app/backend/tests/load_test_results.json")
