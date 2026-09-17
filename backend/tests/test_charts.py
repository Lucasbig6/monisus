from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_list_charts(client, mock_superset_client, auth_headers):
    mock_superset_client.get.return_value = {
        "count": 1,
        "result": [{"id": 1, "slice_name": "Test Chart"}],
    }
    response = await client.get("/api/charts", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["count"] == 1


@pytest.mark.asyncio
async def test_list_charts_unauthorized(client):
    response = await client.get("/api/charts")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_chart(client, mock_superset_client, auth_headers):
    mock_superset_client.get.return_value = {"id": 1, "slice_name": "Chart"}
    response = await client.get("/api/charts/1", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_chart_not_found(client, mock_superset_client, auth_headers):
    mock_superset_client.get.side_effect = Exception("Not found")
    response = await client.get("/api/charts/999", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_chart(client, mock_superset_client, auth_headers):
    mock_superset_client.post.return_value = {"id": 1, "slice_name": "New Chart"}
    response = await client.post(
        "/api/charts",
        json={"slice_name": "New Chart"},
        headers=auth_headers,
    )
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_get_chart_data(client, mock_superset_client, auth_headers):
    mock_superset_client.get.return_value = {"result": [{"data": []}]}
    response = await client.get("/api/charts/1/data", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_post_chart_data(client, mock_superset_client, auth_headers):
    mock_superset_client.post.return_value = {"result": [{"data": []}]}
    response = await client.post(
        "/api/charts/data",
        json={"datasource": "1", "queries": []},
        headers=auth_headers,
    )
    assert response.status_code == 200
