from __future__ import annotations

from typing import Any

from app.superset.client import superset_client


async def list_dashboards(page: int = 0, page_size: int = 50) -> dict[str, Any]:
    return await superset_client.get(
        "/api/v1/dashboard/",
        params={"q": f"(page:{page},page_size:{page_size})"},
    )


async def get_dashboard(dashboard_id: int | str) -> dict[str, Any]:
    return await superset_client.get(f"/api/v1/dashboard/{dashboard_id}")


async def create_dashboard(data: dict[str, Any]) -> dict[str, Any]:
    return await superset_client.post("/api/v1/dashboard/", json=data)


async def update_dashboard(dashboard_id: int, data: dict[str, Any]) -> dict[str, Any]:
    return await superset_client.put(f"/api/v1/dashboard/{dashboard_id}", json=data)


async def delete_dashboard(dashboard_id: int) -> Any:
    return await superset_client.delete(f"/api/v1/dashboard/{dashboard_id}")


async def get_dashboard_charts(dashboard_id: int | str) -> dict[str, Any]:
    return await superset_client.get(f"/api/v1/dashboard/{dashboard_id}/charts")


async def get_dashboard_datasets(dashboard_id: int | str) -> dict[str, Any]:
    return await superset_client.get(f"/api/v1/dashboard/{dashboard_id}/datasets")
