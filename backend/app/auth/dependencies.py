from __future__ import annotations

import logging

import httpx
from fastapi import Header, HTTPException

from app.superset.client import superset_client

logger = logging.getLogger(__name__)


async def get_current_token(authorization: str = Header(...)) -> str:
    """Extract Bearer token from Authorization header and validate it against Superset."""
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

    try:
        await superset_client.get_current_user(token)
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code in (401, 403):
            raise HTTPException(
                status_code=401,
                detail="Token inválido ou expirado",
            ) from exc
        logger.error("Erro inesperado ao validar token: %s", exc.response.status_code)
        raise HTTPException(
            status_code=502,
            detail="Erro ao comunicar com o serviço de autenticação",
        ) from exc
    except httpx.ConnectError:
        logger.error("Superset indisponível para validação de token")
        raise HTTPException(
            status_code=503,
            detail="Serviço de autenticação indisponível",
        ) from None
    except Exception:
        logger.exception("Erro inesperado na validação do token")
        raise HTTPException(
            status_code=502,
            detail="Erro interno na validação do token",
        ) from None

    return token
