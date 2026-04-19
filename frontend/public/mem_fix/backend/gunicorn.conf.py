# Gunicorn configuration for Nati Fenua
# Optimized for Render Free tier (512MB RAM)

import os

# Server socket
bind = "0.0.0.0:8001"
backlog = 1024

# Workers - REDUCED for 512MB RAM
# Free tier: 1 worker with uvicorn async
workers = int(os.environ.get("WEB_CONCURRENCY", 1))
worker_class = "uvicorn.workers.UvicornWorker"

# Timeout
timeout = 120
graceful_timeout = 30
keepalive = 2

# Max requests before worker restart (prevents memory leaks)
max_requests = 1000
max_requests_jitter = 100

# Logging
accesslog = "-"
errorlog = "-"
loglevel = os.environ.get("LOG_LEVEL", "warning")

# Process naming
proc_name = "nati_fenua"

# DO NOT preload app to save memory
preload_app = False
