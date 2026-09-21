from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_list_sources(client, mock_superset_client, auth_headers):
    mock_superset_client.get.return_value = {
        "count": 1,
        "result": [{"id": 1, "database_name": "SESAPI Produção"}],
    }
    response = await client.get("/api/sources", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["count"] == 1


@pytest.mark.asyncio
async def test_list_sources_unauthorized(client):
    response = await client.get("/api/sources")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_source(client, mock_superset_client, auth_headers):
    mock_superset_client.post.return_value = {
        "id": 1,
        "database_name": "SESAPI Produção",
    }
    response = await client.post(
        "/api/sources",
        json={
            "database_name": "SESAPI Produção",
            "host": "localhost",
            "port": 5432,
            "database": "sesapi",
            "username": "admin",
            "password": "secret",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_test_connection_success(client, mock_superset_client, auth_headers):
    mock_superset_client.post.return_value = {"message": "OK"}
    response = await client.post(
        "/api/sources/test",
        json={
            "host": "localhost",
            "port": 5432,
            "database": "sesapi",
            "username": "admin",
            "password": "secret",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True


@pytest.mark.asyncio
async def test_test_connection_failure(client, mock_superset_client, auth_headers):
    mock_superset_client.post.side_effect = Exception("Connection refused")
    response = await client.post(
        "/api/sources/test",
        json={
            "host": "invalid-host",
            "port": 5432,
            "database": "sesapi",
            "username": "admin",
            "password": "secret",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is False


@pytest.mark.asyncio
async def test_get_source_unwraps_result(client, mock_superset_client, auth_headers):
    mock_superset_client.get.return_value = {
        "result": {
            "id": 1,
            "database_name": "SESAPI Produção",
            "engine": "postgresql",
            "sqlalchemy_uri": "postgresql://admin:secret@localhost:5432/sesapi",
        }
    }
    response = await client.get("/api/sources/1", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["database_name"] == "SESAPI Produção"
    assert "sqlalchemy_uri" not in body


@pytest.mark.asyncio
async def test_get_source_not_found(client, mock_superset_client, auth_headers):
    mock_superset_client.get.side_effect = Exception("Not found")
    response = await client.get("/api/sources/999", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_source(client, mock_superset_client, auth_headers):
    mock_superset_client.put.return_value = {"id": 1, "database_name": "Updated"}
    response = await client.put(
        "/api/sources/1",
        json={"database_name": "Updated"},
        headers=auth_headers,
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_delete_source(client, mock_superset_client, auth_headers):
    response = await client.delete("/api/sources/1", headers=auth_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_get_source_datasets(client, mock_superset_client, auth_headers):
    mock_superset_client.get.return_value = {
        "count": 2,
        "result": [
            {"id": 1, "table_name": "atendimentos"},
            {"id": 2, "table_name": "internacoes"},
        ],
    }
    response = await client.get("/api/sources/1/datasets", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 2
