from __future__ import annotations

from typing import Any

import httpx

_SENSITIVE_KEYS = {"sqlalchemy_uri", "password", "extra", "masked_encrypted_extra"}


class SupersetAPIError(Exception):
    def __init__(self, detail: str) -> None:
        self.detail = detail
        super().__init__(detail)


def sanitize_database(db: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in db.items() if k not in _SENSITIVE_KEYS}


def extract_superset_error(e: httpx.HTTPStatusError) -> str:
    try:
        body = e.response.json()
        errors = body.get("errors", [])
        if errors:
            return errors[0].get("message", "")
        msg = body.get("message", "")
        if isinstance(msg, dict):
            parts = [f"{k}: {v}" for k, v in msg.items()]
            return "; ".join(parts)
        if msg:
            return str(msg)
    except Exception:
        pass
    return ""
