from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.dependencies import get_current_token
from app.superset import datasets as superset_datasets

router = APIRouter(prefix="/datasets", tags=["Datasets"])


@router.get("")
async def list_datasets(
    page: int = Query(0, ge=0),
    page_size: int = Query(50, ge=1, le=200),
    token: str = Depends(get_current_token),
) -> dict[str, Any]:
    return await superset_datasets.list_datasets(page=page, page_size=page_size)


@router.get("/{dataset_id}")
async def get_dataset(
    dataset_id: int | str,
    token: str = Depends(get_current_token),
) -> dict[str, Any]:
    try:
        return await superset_datasets.get_dataset(dataset_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{dataset_id}/columns")
async def get_dataset_columns(
    dataset_id: int,
    token: str = Depends(get_current_token),
) -> dict[str, Any]:
    try:
        return await superset_datasets.get_dataset_columns(dataset_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{dataset_id}/distinct/{column_name}")
async def get_distinct_values(
    dataset_id: int,
    column_name: str,
    token: str = Depends(get_current_token),
) -> dict[str, Any]:
    try:
        return await superset_datasets.get_distinct_values(dataset_id, column_name)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{dataset_id}/refresh")
async def refresh_columns(
    dataset_id: int,
    token: str = Depends(get_current_token),
) -> dict[str, Any]:
    try:
        return await superset_datasets.refresh_columns(dataset_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
