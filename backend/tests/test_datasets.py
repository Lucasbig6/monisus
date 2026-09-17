from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_list_datasets(client, mock_superset_client, auth_headers):
    mock_superset_client.get.return_value = {
        "count": 1,
        "result": [{"id": 1, "table_name": "Test Dataset"}],
    }
    response = await client.get("/api/datasets", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["count"] == 1


@pytest.mark.asyncio
async def test_list_datasets_unauthorized(client):
    response = await client.get("/api/datasets")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_dataset(client, mock_superset_client, auth_headers):
    mock_superset_client.get.return_value = {"id": 1, "table_name": "Dataset"}
    response = await client.get("/api/datasets/1", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_dataset_not_found(client, mock_superset_client, auth_headers):
    mock_superset_client.get.side_effect = Exception("Not found")
    response = await client.get("/api/datasets/999", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_dataset_columns(client, mock_superset_client, auth_headers):
    mock_superset_client.get.return_value = {
        "columns": [{"column_name": "id", "type": "INTEGER"}],
    }
    response = await client.get("/api/datasets/1/columns", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_distinct_values(client, mock_superset_client, auth_headers):
    mock_superset_client.get.return_value = {"distinct_columns": ["value1", "value2"]}
    response = await client.get(
        "/api/datasets/1/distinct/status", headers=auth_headers
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_refresh_columns(client, mock_superset_client, auth_headers):
    mock_superset_client.put.return_value = {"result": "success"}
    response = await client.put("/api/datasets/1/refresh", headers=auth_headers)
    assert response.status_code == 200
