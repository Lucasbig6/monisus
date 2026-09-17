import os

SQLALCHEMY_DATABASE_URI = os.environ.get(
    "SQLALCHEMY_DATABASE_URI",
    "postgresql://superset:superset_password@db:5432/superset",
)

FAB_API_SWAGGER_UI = True

ENABLE_CORS = True
CORS_OPTIONS = {
    'supports_credentials': True,
    'allow_headers': ['*'],
    'resources': ['/api/*'],
    'origins': ['http://localhost:3000', 'http://127.0.0.1:3000']
}

FEATURE_FLAGS = {
    "EMBEDDED_SUPERSET": True,
    "ENABLE_EXPLORE_JSON": True,
    "GLOBAL_ASYNC_QUERIES": True,
}

REDIS_URL = "redis://redis:6379/0"

CACHE_CONFIG = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_DEFAULT_TIMEOUT": 300,
    "CACHE_KEY_PREFIX": "superset_",
    "CACHE_REDIS_URL": "redis://redis:6379/0",
}

DATA_CACHE_CONFIG = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_DEFAULT_TIMEOUT": 300,
    "CACHE_KEY_PREFIX": "superset_data_",
    "CACHE_REDIS_URL": "redis://redis:6379/0",
}

GLOBAL_ASYNC_QUERIES_CACHE_BACKEND = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_DEFAULT_TIMEOUT": 300,
    "CACHE_KEY_PREFIX": "superset_async_",
    "CACHE_REDIS_URL": "redis://redis:6379/0",
}

GLOBAL_ASYNC_QUERIES_JWT_SECRET = "chave_jwt_supersegura_monisus_ambiente_dev_2026"
GLOBAL_ASYNC_QUERIES_JWT_COOKIE_NAME = "superset_async_token"
GLOBAL_ASYNC_QUERIES_JWT_COOKIE_SECURE = False
GLOBAL_ASYNC_QUERIES_JWT_COOKIE_SAMESITE = "Lax"
GLOBAL_ASYNC_QUERIES_JWT_COOKIE_DOMAIN = None
GLOBAL_ASYNC_QUERIES_REDIS_STREAM_PREFIX = "superset_"
GLOBAL_ASYNC_QUERIES_REDIS_STREAM_LIMIT = 500
GLOBAL_ASYNC_QUERIES_REDIS_STREAM_LIMIT_FIREHOSE = 500

class CeleryConfig:
    broker_url = "redis://redis:6379/0"
    result_backend = "redis://redis:6379/0"
    imports = ("sql_lab",)
    task_annotations = {
        "sql_lab.get_sql_results": {"rate_limit": "100/s"},
    }

CELERY_CONFIG = CeleryConfig
