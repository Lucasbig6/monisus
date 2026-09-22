from __future__ import annotations

import logging
from typing import Any

import httpx

from app.superset.client import superset_client

logger = logging.getLogger(__name__)


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


async def create_dataset(
    database_id: int,
    table_name: str,
    schema: str | None = None,
    description: str | None = None,
) -> dict[str, Any]:
    """Registra uma tabela existente como dataset no Superset."""
    payload: dict[str, Any] = {
        "database": database_id,
        "table_name": table_name,
        "schema": schema or "",
    }
    try:
        response = await superset_client.post("/api/v1/dataset/", json=payload)
        result = response.get("data") or response.get("result") or response
        dataset_id = result.get("id") if isinstance(result, dict) else None

        if dataset_id and description:
            try:
                await superset_client.put(
                    f"/api/v1/dataset/{dataset_id}",
                    json={"description": description},
                )
            except Exception:
                logger.debug("Não foi possível definir descrição no dataset %s", dataset_id)

        return result
    except httpx.HTTPStatusError as e:
        detail = ""
        try:
            body = e.response.json()
            errors = body.get("errors", [])
            if errors:
                detail = errors[0].get("message", "")
            elif "message" in body:
                detail = str(body["message"])
        except Exception:
            pass
        logger.warning("Criação de dataset falhou: %s", detail)
        raise ValueError(detail or "Erro ao criar dataset no Superset.") from e
