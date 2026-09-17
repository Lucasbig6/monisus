from __future__ import annotations

import httpx
import pytest


@pytest.mark.asyncio
async def test_login_success(client, mock_superset_client):
    mock_superset_client.login_as.return_value = {
        "access_token": "abc123",
        "refresh_token": "refresh123",
    }
    response = await client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_invalid_credentials(client, mock_superset_client):
    mock_superset_client.login_as.side_effect = httpx.HTTPStatusError(
        message="Unauthorized",
        request=httpx.Request("POST", "http://test"),
        response=httpx.Response(status_code=401),
    )
    response = await client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "wrong"},
    )
    assert response.status_code == 401
    assert "Credenciais inválidas" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_no_internal_exception_leaked(client, mock_superset_client):
    mock_superset_client.login_as.side_effect = RuntimeError("database connection refused")
    response = await client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "wrong"},
    )
    assert response.status_code == 502
    assert "database connection refused" not in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_superset_unavailable(client, mock_superset_client):
    mock_superset_client.login_as.side_effect = httpx.ConnectError("Connection refused")
    response = await client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "wrong"},
    )
    assert response.status_code == 503


@pytest.mark.asyncio
async def test_refresh_success(client, mock_superset_client):
    mock_superset_client.refresh_user_token.return_value = {
        "access_token": "new_token",
        "refresh_token": "new_refresh",
    }
    response = await client.post(
        "/api/auth/refresh",
        json={"refresh_token": "old_refresh"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_refresh_invalid_token(client, mock_superset_client):
    mock_superset_client.refresh_user_token.side_effect = httpx.HTTPStatusError(
        message="Unauthorized",
        request=httpx.Request("POST", "http://test"),
        response=httpx.Response(status_code=401),
    )
    response = await client.post(
        "/api/auth/refresh",
        json={"refresh_token": "invalid"},
    )
    assert response.status_code == 401
    assert "refresh" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_refresh_no_internal_exception_leaked(client, mock_superset_client):
    mock_superset_client.refresh_user_token.side_effect = RuntimeError("internal error")
    response = await client.post(
        "/api/auth/refresh",
        json={"refresh_token": "invalid"},
    )
    assert response.status_code == 502
    assert "internal error" not in response.json()["detail"]


@pytest.mark.asyncio
async def test_me_with_valid_token(client, mock_superset_client):
    mock_superset_client.get_current_user.return_value = {
        "username": "admin",
        "first_name": "Admin",
    }
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer valid_token"},
    )
    assert response.status_code == 200
    assert response.json()["username"] == "admin"


@pytest.mark.asyncio
async def test_me_without_token(client):
    response = await client.get("/api/auth/me")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_me_with_invalid_token(client, mock_superset_client):
    mock_superset_client.get_current_user.side_effect = httpx.HTTPStatusError(
        message="Unauthorized",
        request=httpx.Request("GET", "http://test"),
        response=httpx.Response(status_code=401),
    )
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid_token"},
    )
    assert response.status_code == 401
    assert "Token inválido" in response.json()["detail"]


@pytest.mark.asyncio
async def test_me_with_forbidden_token(client, mock_superset_client):
    mock_superset_client.get_current_user.side_effect = httpx.HTTPStatusError(
        message="Forbidden",
        request=httpx.Request("GET", "http://test"),
        response=httpx.Response(status_code=403),
    )
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer forbidden_token"},
    )
    assert response.status_code == 401
    assert "Token inválido" in response.json()["detail"]


@pytest.mark.asyncio
async def test_me_with_malformed_header(client):
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": "InvalidFormat"},
    )
    assert response.status_code == 401
    assert "inválido" in response.json()["detail"]


@pytest.mark.asyncio
async def test_me_with_empty_token(client):
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer "},
    )
    assert response.status_code == 401
    assert "vazio" in response.json()["detail"]


@pytest.mark.asyncio
async def test_me_superset_unavailable(client, mock_superset_client):
    mock_superset_client.get_current_user.side_effect = httpx.ConnectError(
        "Connection refused"
    )
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer any_token"},
    )
    assert response.status_code == 503


@pytest.mark.asyncio
async def test_me_no_internal_exception_leaked(client, mock_superset_client):
    mock_superset_client.get_current_user.side_effect = RuntimeError("stack trace here")
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer any_token"},
    )
    assert response.status_code == 502
    assert "stack trace here" not in response.json()["detail"]
