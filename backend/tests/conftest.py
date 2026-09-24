from __future__ import annotations

from unittest.mock import AsyncMock, patch

import jwt
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.main import app


def make_token(**claims) -> str:
    payload = {
        "sub": "1",
        "type": "access",
        "fresh": True,
        "iat": 1790000000,
        "nbf": 1790000000,
        "exp": 4102444800,
        **claims,
    }
    return jwt.encode(payload, settings.superset_secret_key, algorithm="HS256")


@pytest.fixture
def mock_superset_client():
    """Mock SupersetClient for all tests."""
    client = AsyncMock()
    client.login = AsyncMock()
    client.close = AsyncMock()
    client.check_health = AsyncMock(return_value=True)
    client.get = AsyncMock(return_value={"count": 0, "result": []})
    client.post = AsyncMock(return_value={})
    client.put = AsyncMock(return_value={})
    client.delete = AsyncMock(return_value=AsyncMock(status_code=204))
    client.get_current_user = AsyncMock(
        return_value={"username": "admin", "first_name": "Admin", "last_name": "User"}
    )
    client.login_as = AsyncMock(
        return_value={"access_token": "test_token", "refresh_token": "test_refresh"}
    )
    client.refresh_user_token = AsyncMock(
        return_value={"access_token": "new_token", "refresh_token": "new_refresh"}
    )
    return client


@pytest.fixture
def auth_headers() -> dict[str, str]:
    """Valid authorization headers."""
    return {"Authorization": f"Bearer {make_token()}"}


@pytest.fixture
async def client(mock_superset_client):
    """Async test client with mocked SupersetClient."""
    patches = [
        patch("app.main.superset_client", mock_superset_client),
        patch("app.superset.client.superset_client", mock_superset_client),
        patch("app.superset.dashboards.superset_client", mock_superset_client),
        patch("app.superset.charts.superset_client", mock_superset_client),
        patch("app.superset.datasets.superset_client", mock_superset_client),
        patch("app.superset.queries.superset_client", mock_superset_client),
        patch("app.superset.sources.superset_client", mock_superset_client),
        patch("app.superset.auth.superset_client", mock_superset_client),
        patch("app.superset.materialize.superset_client", mock_superset_client),
    ]
    for p in patches:
        p.start()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    for p in patches:
        p.stop()
