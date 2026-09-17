from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth.dependencies import get_current_token
from app.superset import queries as superset_queries

router = APIRouter(prefix="/queries", tags=["Queries"])


class ExecuteQueryRequest(BaseModel):
    database_id: int
    sql: str
    db_schema: str | None = None


@router.post("/execute")
async def execute_query(
    request: ExecuteQueryRequest,
    token: str = Depends(get_current_token),
) -> dict[str, Any]:
    return await superset_queries.execute_query(
        database_id=request.database_id,
        sql=request.sql,
        schema=request.db_schema,
    )


class FormatSqlRequest(BaseModel):
    sql: str


@router.post("/format")
async def format_sql(
    request: FormatSqlRequest,
    token: str = Depends(get_current_token),
) -> dict[str, Any]:
    return await superset_queries.format_sql(sql=request.sql)


class EstimateQueryRequest(BaseModel):
    database_id: int
    sql: str


@router.post("/estimate")
async def estimate_query(
    request: EstimateQueryRequest,
    token: str = Depends(get_current_token),
) -> dict[str, Any]:
    return await superset_queries.estimate_query(
        database_id=request.database_id,
        sql=request.sql,
    )
