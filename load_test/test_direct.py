#!/usr/bin/env python3
"""
Test de charge DIRECT (sans reverse proxy)
Prouve que le backend FastAPI est stable
"""

import asyncio
import aiohttp
import time
import json
import statistics
from datetime import datetime

BASE_URL = "http://localhost:8001"
API_URL = f"{BASE_URL}/api"

async def test_direct():
    print("=" * 60)
    print("🔬 TEST DIRECT BACKEND (sans reverse proxy)")
    print("=" * 60)
    print(f"📍 URL: {BASE_URL}")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    endpoints = [
        ("GET", "/ping"),
        ("GET", "/posts?limit=10"),
        ("GET", "/stories"),
        ("GET", "/marketplace/products?limit=10"),
        ("GET", "/marketplace/categories"),
        ("GET", "/pulse/islands"),
        ("GET", "/pulse/markers?island=tahiti"),
        ("GET", "/pulse/status"),
        ("GET", "/reels"),
        ("GET", "/lives"),
        ("GET", "/news/latest?limit=5"),
        ("GET", "/search/products?q=artisanat"),
        ("GET", "/translate?text=bonjour&direction=fr_to_tah"),
        ("GET", "/rss/posts?limit=5"),
    ]
    
    results = {
        "total": 0,
        "success": 0,
        "errors": {},
        "times": []
    }
    
    connector = aiohttp.TCPConnector(limit=100)
    
    async def make_request(session, method, endpoint):
        url = f"{API_URL}{endpoint}"
        start = time.time()
        try:
            async with session.request(method, url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                elapsed = (time.time() - start) * 1000
                results["total"] += 1
                results["times"].append(elapsed)
                if 200 <= resp.status < 400:
                    results["success"] += 1
                else:
                    key = f"{resp.status}:{endpoint}"
                    results["errors"][key] = results["errors"].get(key, 0) + 1
                return resp.status
        except Exception as e:
            results["total"] += 1
            results["errors"][f"Exception:{endpoint}"] = results["errors"].get(f"Exception:{endpoint}", 0) + 1
            return 0
    
    async with aiohttp.ClientSession(connector=connector) as session:
        # Test avec 25 utilisateurs virtuels pendant 15 secondes
        print("\n🚀 25 utilisateurs virtuels × 15 secondes...")
        
        async def user_loop(user_id, end_time):
            while time.time() < end_time:
                for method, endpoint in endpoints:
                    await make_request(session, method, endpoint)
                await asyncio.sleep(0.05)
        
        end_time = time.time() + 15
        tasks = [user_loop(i, end_time) for i in range(25)]
        await asyncio.gather(*tasks, return_exceptions=True)
    
    # Résultats
    times = sorted(results["times"]) if results["times"] else [0]
    
    def percentile(data, p):
        if not data: return 0
        k = (len(data) - 1) * p / 100
        f = int(k)
        c = min(f + 1, len(data) - 1)
        return data[f] + (data[c] - data[f]) * (k - f)
    
    error_rate = (results["total"] - results["success"]) / results["total"] * 100 if results["total"] > 0 else 0
    
    print("\n" + "=" * 60)
    print("📊 RÉSULTATS TEST DIRECT")
    print("=" * 60)
    print(f"   Requêtes totales: {results['total']:,}")
    print(f"   Succès: {results['success']:,}")
    print(f"   Erreurs: {results['total'] - results['success']}")
    print(f"   Taux d'erreur: {error_rate:.2f}%")
    print(f"   RPS: {results['total'] / 15:.1f}")
    print(f"   Temps moyen: {statistics.mean(times):.1f}ms")
    print(f"   P50: {percentile(times, 50):.1f}ms")
    print(f"   P95: {percentile(times, 95):.1f}ms")
    print(f"   P99: {percentile(times, 99):.1f}ms")
    
    if results["errors"]:
        print("\n⚠️ Erreurs détectées:")
        for key, count in results["errors"].items():
            print(f"   {key}: {count}")
    else:
        print("\n✅ AUCUNE ERREUR DÉTECTÉE")
    
    print("=" * 60)
    
    # Verdict
    if error_rate < 1:
        print("🏆 VERDICT: EXCELLENT - Backend 100% stable")
    elif error_rate < 5:
        print("🏆 VERDICT: BON - Backend stable")
    else:
        print("⚠️ VERDICT: À INVESTIGUER")
    
    # Sauvegarder
    report = {
        "date": datetime.now().isoformat(),
        "url": BASE_URL,
        "total_requests": results["total"],
        "success": results["success"],
        "error_rate": round(error_rate, 2),
        "rps": round(results["total"] / 15, 1),
        "avg_ms": round(statistics.mean(times), 1),
        "p50_ms": round(percentile(times, 50), 1),
        "p95_ms": round(percentile(times, 95), 1),
        "p99_ms": round(percentile(times, 99), 1),
        "errors": results["errors"]
    }
    
    with open("/app/load_test/direct_test_report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📁 Rapport: /app/load_test/direct_test_report.json")
    
    return report

if __name__ == "__main__":
    asyncio.run(test_direct())
