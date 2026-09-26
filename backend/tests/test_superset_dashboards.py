from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_list_dashboards(client, mock_superset_client, auth_headers):
    mock_superset_client.get.return_value = {
        "count": 2,
        "result": [{"id": 1, "dashboard_title": "Test"}],
    }
    response = await client.get("/api/superset/dashboards", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 2


@pytest.mark.asyncio
async def test_list_dashboards_unauthorized(client):
    response = await client.get("/api/superset/dashboards")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_dashboard(client, mock_superset_client, auth_headers):
    mock_superset_client.get.return_value = {"id": 1, "dashboard_title": "Test"}
    response = await client.get("/api/superset/dashboards/1", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == 1


@pytest.mark.asyncio
async def test_get_dashboard_not_found(client, mock_superset_client, auth_headers):
    mock_superset_client.get.side_effect = Exception("Not found")
    response = await client.get("/api/superset/dashboards/999", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_dashboard(client, mock_superset_client, auth_headers):
    mock_superset_client.post.return_value = {"id": 1, "dashboard_title": "New"}
    response = await client.post(
        "/api/superset/dashboards",
        json={"dashboard_title": "New"},
        headers=auth_headers,
    )
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_update_dashboard(client, mock_superset_client, auth_headers):
    mock_superset_client.put.return_value = {"id": 1, "dashboard_title": "Updated"}
    response = await client.put(
        "/api/superset/dashboards/1",
        json={"dashboard_title": "Updated"},
        headers=auth_headers,
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_delete_dashboard(client, mock_superset_client, auth_headers):
    response = await client.delete("/api/superset/dashboards/1", headers=auth_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_get_dashboard_charts(client, mock_superset_client, auth_headers):
    mock_superset_client.get.return_value = [{"id": 1, "slice_name": "Chart 1"}]
    response = await client.get("/api/superset/dashboards/1/charts", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_dashboard_datasets(client, mock_superset_client, auth_headers):
    mock_superset_client.get.return_value = [{"id": 1, "table_name": "Dataset 1"}]
    response = await client.get("/api/superset/dashboards/1/datasets", headers=auth_headers)
    assert response.status_code == 200
