from __future__ import annotations

import logging

import jwt
from fastapi import Header, HTTPException

from app.core.config import settings

logger = logging.getLogger(__name__)


def validate_access_token(token: str) -> dict:
    """Validate a Superset-issued JWT locally (signature, expiry, type)."""
    try:
        return jwt.decode(
            token,
            settings.superset_secret_key,
            algorithms=["HS256"],
            options={"verify_exp": True},
        )
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=401,
            detail="Token expirado",
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=401,
            detail="Token inválido",
        ) from exc


async def get_current_token(authorization: str = Header(...)) -> str:
    """Extract Bearer token from Authorization header and validate it locally."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Formato de autorização inválido",
        )
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Token de autorização vazio",
        )

    claims = validate_access_token(token)
    if claims.get("type") != "access":
        raise HTTPException(
            status_code=401,
            detail="Token de tipo inválido",
        )

    return token
