from __future__ import annotations

from typing import Any

from app.superset.client import superset_client


async def login(username: str, password: str) -> dict[str, Any]:
    return await superset_client.login_as(username, password)


async def refresh_token(refresh_token: str) -> dict[str, Any]:
    return await superset_client.refresh_user_token(refresh_token)


async def get_me(token: str) -> dict[str, Any]:
    return await superset_client.get_current_user(token)
