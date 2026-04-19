# Gunicorn configuration for Nati Fenua
# Optimized for 5000+ concurrent users on Render

import multiprocessing
import os

# Server socket
bind = "0.0.0.0:8001"
backlog = 2048

# Workers - CPU-bound formula adjusted for async
# For Render: use 2-4 workers per CPU core
workers = int(os.environ.get("WEB_CONCURRENCY", multiprocessing.cpu_count() * 2 + 1))
worker_class = "uvicorn.workers.UvicornWorker"  # Async workers for FastAPI

# Threads per worker (for sync workers only, not needed with uvicorn)
# threads = 4

# Worker connections - max simultaneous clients per worker
worker_connections = 1000

# Timeout - seconds to wait for requests
timeout = 120
graceful_timeout = 30
keepalive = 5

# Max requests before worker restart (prevents memory leaks)
max_requests = 10000
max_requests_jitter = 1000

# Logging
accesslog = "-"
errorlog = "-"
loglevel = os.environ.get("LOG_LEVEL", "info")
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "nati_fenua"

# Preload app for faster worker startup (uses more memory)
preload_app = True

# Server hooks
def on_starting(server):
    print("🚀 Nati Fenua starting with Gunicorn...")
    print(f"   Workers: {workers}")
    print(f"   Worker class: {worker_class}")
    print(f"   Max connections/worker: {worker_connections}")

def worker_int(worker):
    print(f"⚠️ Worker {worker.pid} received INT signal")

def worker_abort(worker):
    print(f"❌ Worker {worker.pid} aborted")

def post_fork(server, worker):
    print(f"✅ Worker {worker.pid} spawned")
