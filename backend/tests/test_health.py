from __future__ import annotations

from unittest.mock import AsyncMock

import pytest


@pytest.mark.asyncio
async def test_root(client):
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "MoniSUS API"


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_health_superset_ok(client, mock_superset_client):
    mock_superset_client.check_health = AsyncMock(return_value=True)
    response = await client.get("/health/superset")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["superset"] == "connected"


@pytest.mark.asyncio
async def test_health_superset_unavailable(client, mock_superset_client):
    mock_superset_client.check_health = AsyncMock(return_value=False)
    response = await client.get("/health/superset")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "degraded"
    assert data["superset"] == "unavailable"
