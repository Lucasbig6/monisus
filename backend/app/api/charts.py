from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.superset import charts as superset_charts

router = APIRouter(prefix="/charts", tags=["Charts"])


@router.get("")
async def list_charts(
    page: int = Query(0, ge=0),
    page_size: int = Query(50, ge=1, le=200),
) -> dict[str, Any]:
    return await superset_charts.list_charts(page=page, page_size=page_size)


@router.get("/{chart_id}")
async def get_chart(chart_id: int | str) -> dict[str, Any]:
    try:
        return await superset_charts.get_chart(chart_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("", status_code=201)
async def create_chart(data: dict[str, Any]) -> dict[str, Any]:
    return await superset_charts.create_chart(data)


@router.put("/{chart_id}")
async def update_chart(chart_id: int, data: dict[str, Any]) -> dict[str, Any]:
    try:
        return await superset_charts.update_chart(chart_id, data)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{chart_id}", status_code=204)
async def delete_chart(chart_id: int) -> None:
    try:
        await superset_charts.delete_chart(chart_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{chart_id}/data")
async def get_chart_data(chart_id: int) -> dict[str, Any]:
    try:
        return await superset_charts.get_chart_data(chart_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/data")
async def post_chart_data(data: dict[str, Any]) -> dict[str, Any]:
    return await superset_charts.post_chart_data(data)
