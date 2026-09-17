from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.dependencies import get_current_token
from app.superset import dashboards as superset_dashboards

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])


@router.get("")
async def list_dashboards(
    page: int = Query(0, ge=0),
    page_size: int = Query(50, ge=1, le=200),
    token: str = Depends(get_current_token),
) -> dict[str, Any]:
    return await superset_dashboards.list_dashboards(page=page, page_size=page_size)


@router.get("/{dashboard_id}")
async def get_dashboard(
    dashboard_id: int | str,
    token: str = Depends(get_current_token),
) -> dict[str, Any]:
    try:
        return await superset_dashboards.get_dashboard(dashboard_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("", status_code=201)
async def create_dashboard(
    data: dict[str, Any],
    token: str = Depends(get_current_token),
) -> dict[str, Any]:
    return await superset_dashboards.create_dashboard(data)


@router.put("/{dashboard_id}")
async def update_dashboard(
    dashboard_id: int,
    data: dict[str, Any],
    token: str = Depends(get_current_token),
) -> dict[str, Any]:
    try:
        return await superset_dashboards.update_dashboard(dashboard_id, data)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{dashboard_id}", status_code=204)
async def delete_dashboard(
    dashboard_id: int,
    token: str = Depends(get_current_token),
) -> None:
    try:
        await superset_dashboards.delete_dashboard(dashboard_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{dashboard_id}/charts")
async def get_dashboard_charts(
    dashboard_id: int | str,
    token: str = Depends(get_current_token),
) -> Any:
    try:
        return await superset_dashboards.get_dashboard_charts(dashboard_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{dashboard_id}/datasets")
async def get_dashboard_datasets(
    dashboard_id: int | str,
    token: str = Depends(get_current_token),
) -> Any:
    try:
        return await superset_dashboards.get_dashboard_datasets(dashboard_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
