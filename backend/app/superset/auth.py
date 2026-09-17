from __future__ import annotations

from typing import Any

from app.superset.client import superset_client


async def login(username: str, password: str) -> dict[str, Any]:
    response = await superset_client._client.post(
        "/api/v1/security/login",
        json={
            "username": username,
            "password": password,
            "provider": "db",
            "refresh": True,
        },
    )
    response.raise_for_status()
    return response.json()


async def refresh_token(refresh_token: str) -> dict[str, Any]:
    response = await superset_client._client.post(
        "/api/v1/security/refresh",
        json={"refresh_token": refresh_token},
    )
    response.raise_for_status()
    return response.json()


async def get_me(token: str) -> dict[str, Any]:
    response = await superset_client._client.get(
        "/api/v1/me/",
        headers={"Authorization": f"Bearer {token}"},
    )
    response.raise_for_status()
    return response.json()
