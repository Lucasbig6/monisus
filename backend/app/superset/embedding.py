from __future__ import annotations

import logging
from typing import Any

from app.superset.client import superset_client

logger = logging.getLogger(__name__)


async def create_guest_token(
    dashboard_id: int | str,
    username: str = "guest_monisus",
    first_name: str = "MoniSUS",
    last_name: str = "Visitante",
    rls: list[dict[str, Any]] | None = None,
) -> str:
    """Gera um guest token via Superset API. Retorna o JWT string."""
    payload = {
        "user": {
            "username": username,
            "first_name": first_name,
            "last_name": last_name,
        },
        "resources": [{"type": "dashboard", "id": str(dashboard_id)}],
        "rls": rls or [],
    }
    data = await superset_client.post(
        "/api/v1/security/guest_token/",
        json=payload,
    )
    return data["token"]


async def get_embed_config(dashboard_id: int) -> dict[str, Any] | None:
    """Obtém config de embedding de um dashboard. Retorna None se não existir."""
    try:
        data = await superset_client.get(
            f"/api/v1/dashboard/{dashboard_id}/embedded",
        )
        return data.get("result")
    except Exception:
        return None


async def create_embed_config(
    dashboard_id: int,
    allowed_domains: list[str] | None = None,
) -> dict[str, Any]:
    """Cria config de embedding para um dashboard."""
    if allowed_domains is None:
        allowed_domains = ["http://localhost:3000", "http://localhost:5173"]
    data = await superset_client.post(
        f"/api/v1/dashboard/{dashboard_id}/embedded",
        json={"allowed_domains": allowed_domains},
    )
    return data.get("result", {})
