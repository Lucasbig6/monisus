from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import charts, dashboards, datasets, queries
from app.auth import routes as auth_routes
from app.core.config import settings
from app.superset.client import superset_client


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    try:
        await superset_client.login()
    except Exception:
        pass
    yield
    await superset_client.close()


app = FastAPI(
    title="MoniSUS API",
    description="API principal da plataforma MoniSUS - Inteligência e análise de dados do SUS",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix=settings.api_prefix)
app.include_router(dashboards.router, prefix=settings.api_prefix)
app.include_router(charts.router, prefix=settings.api_prefix)
app.include_router(datasets.router, prefix=settings.api_prefix)
app.include_router(queries.router, prefix=settings.api_prefix)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "MoniSUS API", "docs": "/docs"}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
