from __future__ import annotations

import logging
from typing import Any

import httpx

from app.superset.client import superset_client
from app.superset.errors import extract_superset_error
from app.superset.queries import validar_sql

logger = logging.getLogger(__name__)


async def materialize_query(
    database_id: int,
    sql: str,
    schema: str | None,
    table_name: str,
) -> dict[str, Any]:
    """Materializa o resultado de uma query SELECT/WITH em uma tabela física.

    Utiliza o endpoint CTAS do Superset SQL Lab:
    POST /api/v1/sqllab/execute/ com select_as_cta=True.

    Levanta ValueError se o database não permitir CTAS.
    """
    validar_sql(sql)

    payload: dict[str, Any] = {
        "database_id": database_id,
        "sql": sql,
        "runAsync": False,
        "select_as_cta": True,
        "ctas_method": "TABLE",
        "tmp_table_name": table_name,
    }
    if schema:
        payload["schema"] = schema

    try:
        return await superset_client.post("/api/v1/sqllab/execute/", json=payload)
    except httpx.HTTPStatusError as e:
        detail = extract_superset_error(e)

        status = e.response.status_code
        if status in (400, 403):
            if "CTAS" in detail.upper() or "create table" in detail.lower():
                raise ValueError(
                    "Esta fonte de dados não permite materialização (CTAS). "
                    "Contacte o administrador para habilitar CREATE TABLE AS nesta fonte."
                ) from e
            raise ValueError(detail or "Erro ao materializar query.") from e

        raise ValueError(detail or "Erro ao materializar query no Superset.") from e
