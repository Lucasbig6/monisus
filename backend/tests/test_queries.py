from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_execute_query(client, mock_superset_client, auth_headers):
    mock_superset_client.post.return_value = {
        "status": "success",
        "data": [{"col1": "value1"}],
    }
    response = await client.post(
        "/api/queries/execute",
        json={"database_id": 1, "sql": "SELECT 1"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "success"


@pytest.mark.asyncio
async def test_execute_query_unauthorized(client):
    response = await client.post(
        "/api/queries/execute",
        json={"database_id": 1, "sql": "SELECT 1"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_execute_query_with_schema(client, mock_superset_client, auth_headers):
    mock_superset_client.post.return_value = {"status": "success"}
    response = await client.post(
        "/api/queries/execute",
        json={"database_id": 1, "sql": "SELECT * FROM table", "db_schema": "public"},
        headers=auth_headers,
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_format_sql(client, mock_superset_client, auth_headers):
    mock_superset_client.post.return_value = {"result": "SELECT 1"}
    response = await client.post(
        "/api/queries/format",
        json={"sql": "select 1"},
        headers=auth_headers,
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_estimate_query(client, mock_superset_client, auth_headers):
    mock_superset_client.post.return_value = {"result": {"rows": 100}}
    response = await client.post(
        "/api/queries/estimate",
        json={"database_id": 1, "sql": "SELECT COUNT(*) FROM table"},
        headers=auth_headers,
    )
    assert response.status_code == 200
