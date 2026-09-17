from __future__ import annotations

from typing import Any

from app.superset.client import superset_client


async def list_charts(page: int = 0, page_size: int = 50) -> dict[str, Any]:
    return await superset_client.get(
        "/api/v1/chart/",
        params={"q": f"(page:{page},page_size:{page_size})"},
    )


async def get_chart(chart_id: int | str) -> dict[str, Any]:
    return await superset_client.get(f"/api/v1/chart/{chart_id}")


async def create_chart(data: dict[str, Any]) -> dict[str, Any]:
    return await superset_client.post("/api/v1/chart/", json=data)


async def update_chart(chart_id: int, data: dict[str, Any]) -> dict[str, Any]:
    return await superset_client.put(f"/api/v1/chart/{chart_id}", json=data)


async def delete_chart(chart_id: int) -> Any:
    return await superset_client.delete(f"/api/v1/chart/{chart_id}")


async def get_chart_data(chart_id: int) -> dict[str, Any]:
    return await superset_client.get(f"/api/v1/chart/{chart_id}/data/")


async def post_chart_data(data: dict[str, Any]) -> dict[str, Any]:
    return await superset_client.post("/api/v1/chart/data", json=data)
