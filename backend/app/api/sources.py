from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth.dependencies import get_current_token
from app.superset import sources as superset_sources

router = APIRouter(prefix="/sources", tags=["Sources"])


class CreateSourceRequest(BaseModel):
    database_name: str
    engine: str = "postgresql"
    host: str
    port: int = 5432
    database: str
    username: str
    password: str


class UpdateSourceRequest(BaseModel):
    database_name: str | None = None
    host: str | None = None
    port: int | None = None
    database: str | None = None
    username: str | None = None
    password: str | None = None


class TestConnectionRequest(BaseModel):
    host: str
    port: int = 5432
    database: str
    username: str
    password: str


@router.get("")
async def list_sources(
    token: str = Depends(get_current_token),
) -> dict[str, Any]:
    return await superset_sources.list_databases()


@router.post("", status_code=201)
async def create_source(
    request: CreateSourceRequest,
    token: str = Depends(get_current_token),
) -> dict[str, Any]:
    try:
        return await superset_sources.create_database(request.model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/test")
async def test_source_connection(
    request: TestConnectionRequest,
    token: str = Depends(get_current_token),
) -> dict[str, Any]:
    return await superset_sources.test_connection(request.model_dump())


@router.get("/{source_id}")
async def get_source(
    source_id: int,
    token: str = Depends(get_current_token),
) -> dict[str, Any]:
    try:
        return await superset_sources.get_database(source_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{source_id}")
async def update_source(
    source_id: int,
    request: UpdateSourceRequest,
    token: str = Depends(get_current_token),
) -> dict[str, Any]:
    try:
        data = request.model_dump(exclude_unset=True)
        return await superset_sources.update_database(source_id, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{source_id}", status_code=204)
async def delete_source(
    source_id: int,
    token: str = Depends(get_current_token),
) -> None:
    try:
        await superset_sources.delete_database(source_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{source_id}/datasets")
async def get_source_datasets(
    source_id: int,
    token: str = Depends(get_current_token),
) -> dict[str, Any]:
    try:
        return await superset_sources.get_database_datasets(source_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
