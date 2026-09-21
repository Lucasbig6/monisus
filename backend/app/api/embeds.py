from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth.dependencies import get_current_token
from app.superset import embedding

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/embeds", tags=["Embeds"])


class GuestTokenRequest(BaseModel):
    dashboard_id: int | str


class GuestTokenResponse(BaseModel):
    token: str


class EmbedInfoResponse(BaseModel):
    dashboard_id: int
    uuid: str | None = None
    guest_token: str


@router.post("/guest-token", response_model=GuestTokenResponse)
async def get_guest_token(
    body: GuestTokenRequest,
    token: str = Depends(get_current_token),
) -> GuestTokenResponse:
    try:
        guest_token = await embedding.create_guest_token(body.dashboard_id)
        return GuestTokenResponse(token=guest_token)
    except Exception:
        logger.exception(
            "Erro ao gerar guest token para dashboard %s", body.dashboard_id,
        )
        raise HTTPException(
            status_code=502,
            detail="Não foi possível gerar o guest token do Superset.",
        )


@router.post("/{dashboard_id}/setup", response_model=EmbedInfoResponse)
async def setup_embedding(
    dashboard_id: int,
    token: str = Depends(get_current_token),
) -> EmbedInfoResponse:
    """Configura embedding e gera guest token em uma única chamada."""
    try:
        config = await embedding.get_embed_config(dashboard_id)
        if not config:
            config = await embedding.create_embed_config(dashboard_id)

        guest_token = await embedding.create_guest_token(dashboard_id)

        return EmbedInfoResponse(
            dashboard_id=dashboard_id,
            uuid=config.get("uuid"),
            guest_token=guest_token,
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception(
            "Erro ao configurar embedding para dashboard %s", dashboard_id,
        )
        raise HTTPException(
            status_code=502,
            detail="Não foi possível configurar o embedding do Superset.",
        )
