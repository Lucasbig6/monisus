from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class SupersetClient:
    def __init__(self) -> None:
        self._base_url = settings.superset_base_url
        self._username = settings.superset_username
        self._password = settings.superset_password
        self._access_token: str | None = None
        self._refresh_token: str | None = None
        self._csrf_token: str | None = None
        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            timeout=settings.superset_timeout,
            cookies={},
        )

    async def _fetch_csrf_token(self) -> None:
        try:
            response = await self._client.get(
                "/api/v1/security/csrf_token/",
                headers={"Authorization": f"Bearer {self._access_token}"},
            )
            if response.status_code == 200:
                self._csrf_token = response.json().get("result")
        except Exception:
            pass

    async def login(self) -> dict[str, Any]:
        response = await self._client.post(
            "/api/v1/security/login",
            json={
                "username": self._username,
                "password": self._password,
                "provider": "db",
                "refresh": True,
            },
        )
        response.raise_for_status()
        data = response.json()
        self._access_token = data["access_token"]
        self._refresh_token = data.get("refresh_token")
        await self._fetch_csrf_token()
        logger.info("Login no Superset realizado com sucesso")
        return data

    async def refresh(self) -> dict[str, Any]:
        if not self._refresh_token:
            return await self.login()
        try:
            response = await self._client.post(
                "/api/v1/security/refresh",
                headers={"Authorization": f"Bearer {self._refresh_token}"},
            )
            response.raise_for_status()
        except httpx.HTTPStatusError:
            logger.warning("Refresh token expirado, fazendo login completo")
            return await self.login()
        data = response.json()
        self._access_token = data["access_token"]
        self._refresh_token = data.get("refresh_token", self._refresh_token)
        await self._fetch_csrf_token()
        logger.info("Token do Superset renovado")
        return data

    async def login_as(self, username: str, password: str) -> dict[str, Any]:
        """Login with explicit credentials (for user-facing auth)."""
        response = await self._client.post(
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

    async def refresh_user_token(self, refresh_token: str) -> dict[str, Any]:
        """Refresh a user token (for user-facing auth)."""
        response = await self._client.post(
            "/api/v1/security/refresh",
            headers={"Authorization": f"Bearer {refresh_token}"},
        )
        response.raise_for_status()
        return response.json()

    async def get_current_user(self, token: str) -> dict[str, Any]:
        """Get current user info using a user-provided token."""
        response = await self._client.get(
            "/api/v1/me/",
            headers={"Authorization": f"Bearer {token}"},
        )
        response.raise_for_status()
        return response.json()

    async def _request(
        self,
        method: str,
        path: str,
        **kwargs: Any,
    ) -> httpx.Response:
        if not self._access_token:
            await self.login()

        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Bearer {self._access_token}"
        headers["Content-Type"] = "application/json"

        if self._csrf_token and method.upper() in ("POST", "PUT", "DELETE"):
            headers["X-CSRFToken"] = self._csrf_token

        response = await self._client.request(method, path, headers=headers, **kwargs)

        if response.status_code == 401:
            logger.info("Token expirado, renovando...")
            try:
                await self.refresh()
            except Exception:
                logger.warning("Refresh falhou, fazendo login completo")
                await self.login()
            headers["Authorization"] = f"Bearer {self._access_token}"
            if self._csrf_token and method.upper() in ("POST", "PUT", "DELETE"):
                headers["X-CSRFToken"] = self._csrf_token
            response = await self._client.request(method, path, headers=headers, **kwargs)

        response.raise_for_status()
        return response

    async def get(self, path: str, **kwargs: Any) -> Any:
        response = await self._request("GET", path, **kwargs)
        return response.json()

    async def post(self, path: str, **kwargs: Any) -> Any:
        response = await self._request("POST", path, **kwargs)
        return response.json()

    async def put(self, path: str, **kwargs: Any) -> Any:
        response = await self._request("PUT", path, **kwargs)
        return response.json()

    async def delete(self, path: str, **kwargs: Any) -> httpx.Response:
        return await self._request("DELETE", path, **kwargs)

    async def check_health(self) -> bool:
        """Check if Superset is reachable."""
        try:
            response = await self._client.get("/api/v1/security/csrf_token/")
            return response.status_code in (200, 401)
        except Exception:
            return False

    async def close(self) -> None:
        await self._client.aclose()


superset_client = SupersetClient()
