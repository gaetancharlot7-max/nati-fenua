// k6 Load Test Script for Nati Fenua - 5000 Users
// Run with: k6 run --vus 5000 --duration 5m k6_load_test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const feedLatency = new Trend('feed_latency');
const profileLatency = new Trend('profile_latency');
const chatLatency = new Trend('chat_latency');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://nati-fenua-backend.onrender.com/api';

// Test scenarios
export const options = {
  stages: [
    { duration: '1m', target: 500 },   // Ramp up to 500 users
    { duration: '2m', target: 2000 },  // Ramp up to 2000 users
    { duration: '3m', target: 5000 },  // Peak at 5000 users
    { duration: '2m', target: 5000 },  // Stay at 5000 users
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    'http_req_duration{endpoint:feed}': ['p(95)<700', 'p(99)<1500'],
    'http_req_duration{endpoint:profile}': ['p(95)<500', 'p(99)<1000'],
    'errors': ['rate<0.01'],           // Error rate < 1%
    'http_req_failed': ['rate<0.001'], // 5xx errors < 0.1%
  },
};

// Simulated user sessions (would be real in production)
const testUsers = [
  { email: 'test1@natifenua.pf', session: 'session_1' },
  { email: 'test2@natifenua.pf', session: 'session_2' },
  { email: 'test3@natifenua.pf', session: 'session_3' },
];

export default function () {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  
  // Simulate different user behaviors
  const action = Math.random();
  
  if (action < 0.5) {
    // 50% - Browse feed (most common action)
    testFeed();
  } else if (action < 0.75) {
    // 25% - View profile
    testProfile();
  } else if (action < 0.9) {
    // 15% - Check notifications
    testNotifications();
  } else {
    // 10% - Chat/messages
    testChat();
  }
  
  // Random sleep between requests (simulate real user)
  sleep(Math.random() * 3 + 1);
}

function testFeed() {
  const start = Date.now();
  
  // Test cursor pagination
  const cursor = null;
  const res = http.get(`${BASE_URL}/posts?limit=20${cursor ? '&cursor=' + cursor : ''}`, {
    tags: { endpoint: 'feed' },
  });
  
  feedLatency.add(Date.now() - start);
  
  const success = check(res, {
    'feed status 200': (r) => r.status === 200,
    'feed has posts': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data) && data.length > 0;
      } catch {
        return false;
      }
    },
    'feed response time OK': (r) => r.timings.duration < 700,
  });
  
  errorRate.add(!success);
}

function testProfile() {
  const start = Date.now();
  
  // Random user profile
  const userIds = ['user_001', 'user_002', 'user_003'];
  const userId = userIds[Math.floor(Math.random() * userIds.length)];
  
  const res = http.get(`${BASE_URL}/users/${userId}`, {
    tags: { endpoint: 'profile' },
  });
  
  profileLatency.add(Date.now() - start);
  
  const success = check(res, {
    'profile status 200 or 404': (r) => r.status === 200 || r.status === 404,
    'profile response time OK': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
  
  // Also fetch user posts
  if (res.status === 200) {
    const postsRes = http.get(`${BASE_URL}/users/${userId}/posts?limit=20`, {
      tags: { endpoint: 'profile_posts' },
    });
    
    check(postsRes, {
      'profile posts status 200': (r) => r.status === 200,
    });
  }
}

function testNotifications() {
  const res = http.get(`${BASE_URL}/notifications?limit=20`, {
    tags: { endpoint: 'notifications' },
    headers: {
      'Cookie': 'session_token=test_session',
    },
  });
  
  check(res, {
    'notifications status 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
}

function testChat() {
  const start = Date.now();
  
  const res = http.get(`${BASE_URL}/conversations`, {
    tags: { endpoint: 'chat' },
    headers: {
      'Cookie': 'session_token=test_session',
    },
  });
  
  chatLatency.add(Date.now() - start);
  
  check(res, {
    'chat status 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
}

// Test story of actions
export function testActions() {
  // Like a post
  const likeRes = http.post(`${BASE_URL}/posts/post_001/like`, null, {
    tags: { endpoint: 'like' },
    headers: {
      'Cookie': 'session_token=test_session',
    },
  });
  
  check(likeRes, {
    'like action': (r) => r.status === 200 || r.status === 401,
  });
}

// Summary handler
export function handleSummary(data) {
  return {
    'k6_results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const metrics = data.metrics;
  let summary = '\n=== NATI FENUA LOAD TEST RESULTS ===\n\n';
  
  summary += `Total requests: ${metrics.http_reqs?.values?.count || 0}\n`;
  summary += `Error rate: ${(metrics.errors?.values?.rate * 100 || 0).toFixed(2)}%\n`;
  summary += `HTTP failures: ${(metrics.http_req_failed?.values?.rate * 100 || 0).toFixed(4)}%\n\n`;
  
  summary += '--- Response Times ---\n';
  summary += `Feed p95: ${metrics['http_req_duration{endpoint:feed}']?.values?.['p(95)']?.toFixed(0) || 'N/A'}ms\n`;
  summary += `Feed p99: ${metrics['http_req_duration{endpoint:feed}']?.values?.['p(99)']?.toFixed(0) || 'N/A'}ms\n`;
  summary += `Profile p95: ${metrics['http_req_duration{endpoint:profile}']?.values?.['p(95)']?.toFixed(0) || 'N/A'}ms\n`;
  
  summary += '\n--- Thresholds ---\n';
  const thresholds = data.thresholds || {};
  for (const [name, result] of Object.entries(thresholds)) {
    summary += `${name}: ${result.ok ? '✅ PASS' : '❌ FAIL'}\n`;
  }
  
  return summary;
}
