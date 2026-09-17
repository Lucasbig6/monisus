from __future__ import annotations

from typing import Any

from app.superset.client import superset_client


async def execute_query(
    database_id: int,
    sql: str,
    schema: str | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "database_id": database_id,
        "sql": sql,
        "runAsync": False,
    }
    if schema:
        payload["schema"] = schema
    return await superset_client.post("/api/v1/sqllab/execute/", json=payload)


async def format_sql(sql: str) -> dict[str, Any]:
    return await superset_client.post(
        "/api/v1/sqllab/format_sql/",
        json={"sql": sql},
    )


async def estimate_query(database_id: int, sql: str) -> dict[str, Any]:
    return await superset_client.post(
        "/api/v1/sqllab/estimate/",
        json={"database_id": database_id, "sql": sql},
    )
