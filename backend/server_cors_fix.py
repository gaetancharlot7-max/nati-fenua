# CORS Fix - Copy this to replace the CORS section in server.py
cors_origins = [
    "https://accurate-quietude-production-ff09.up.railway.app",
    "https://grateful-presence-production-50e7.up.railway.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
_cors_env = os.environ.get('CORS_ORIGINS', '').strip()
if _cors_env and _cors_env != '*':
    cors_origins = [o.strip() for o in _cors_env.split(',') if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
