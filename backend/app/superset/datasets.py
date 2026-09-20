from __future__ import annotations

from typing import Any

from app.superset.client import superset_client


async def list_datasets(page: int = 0, page_size: int = 50) -> dict[str, Any]:
    return await superset_client.get(
        "/api/v1/dataset/",
        params={"q": f"(page:{page},page_size:{page_size})"},
    )


async def get_dataset(dataset_id: int | str) -> dict[str, Any]:
    response = await superset_client.get(f"/api/v1/dataset/{dataset_id}")
    result = response.get("result")
    if result is None:
        msg = f"Resposta inválida do Superset para dataset {dataset_id}: campo 'result' ausente"
        raise ValueError(msg)
    return result


async def get_dataset_columns(dataset_id: int) -> dict[str, Any]:
    response = await superset_client.get(f"/api/v1/dataset/{dataset_id}")
    result = response.get("result")
    if result is None:
        msg = f"Resposta inválida do Superset para dataset {dataset_id}: campo 'result' ausente"
        raise ValueError(msg)
    return result


async def get_distinct_values(dataset_id: int, column_name: str) -> dict[str, Any]:
    return await superset_client.get(
        f"/api/v1/dataset/distinct/{column_name}",
        params={"q": f"(dataset_id:{dataset_id})"},
    )


async def refresh_columns(dataset_id: int) -> dict[str, Any]:
    return await superset_client.put(f"/api/v1/dataset/{dataset_id}/refresh")
