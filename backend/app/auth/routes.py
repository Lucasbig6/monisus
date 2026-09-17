from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.superset import auth as superset_auth

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
async def login(request: LoginRequest) -> dict[str, Any]:
    try:
        return await superset_auth.login(
            username=request.username,
            password=request.password,
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Credenciais inválidas: {e}")


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/refresh")
async def refresh(request: RefreshRequest) -> dict[str, Any]:
    try:
        return await superset_auth.refresh_token(refresh_token=request.refresh_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Erro ao renovar token: {e}")


@router.get("/me")
async def get_me(token: str) -> dict[str, Any]:
    try:
        return await superset_auth.get_me(token=token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
