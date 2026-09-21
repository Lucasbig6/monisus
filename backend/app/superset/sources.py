from __future__ import annotations

import logging
from typing import Any
from urllib.parse import quote_plus

from app.superset.client import superset_client

logger = logging.getLogger(__name__)

_SENSITIVE_KEYS = {"sqlalchemy_uri", "password", "extra", "masked_encrypted_extra"}


def _sanitize_database(db: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in db.items() if k not in _SENSITIVE_KEYS}


def _build_sqlalchemy_uri(
    *,
    host: str,
    port: int,
    database: str,
    username: str,
    password: str,
) -> str:
    user = quote_plus(username)
    pwd = quote_plus(password)
    return f"postgresql://{user}:{pwd}@{host}:{port}/{database}"


async def list_databases() -> dict[str, Any]:
    response = await superset_client.get(
        "/api/v1/database/",
        params={"q": "(page:0,page_size:100)"},
    )
    return response


async def get_database(database_id: int) -> dict[str, Any]:
    response = await superset_client.get(f"/api/v1/database/{database_id}")
    result = response.get("result")
    if result is None:
        msg = f"Database {database_id} não encontrado"
        raise ValueError(msg)
    return _sanitize_database(result)


async def create_database(data: dict[str, Any]) -> dict[str, Any]:
    payload = {
        "database_name": data["database_name"],
        "engine": data.get("engine", "postgresql"),
        "sqlalchemy_uri": _build_sqlalchemy_uri(
            host=data["host"],
            port=data["port"],
            database=data["database"],
            username=data["username"],
            password=data["password"],
        ),
        "expose_in_sqllab": True,
        "allow_ctas": False,
        "allow_cvas": True,
        "allow_dml": False,
        "allow_run_async": False,
    }
    response = await superset_client.post("/api/v1/database/", json=payload)
    return response


async def update_database(database_id: int, data: dict[str, Any]) -> dict[str, Any]:
    payload: dict[str, Any] = {}
    if "database_name" in data:
        payload["database_name"] = data["database_name"]
    if all(k in data for k in ("host", "port", "database", "username", "password")):
        payload["sqlalchemy_uri"] = _build_sqlalchemy_uri(
            host=data["host"],
            port=data["port"],
            database=data["database"],
            username=data["username"],
            password=data["password"],
        )
    response = await superset_client.put(
        f"/api/v1/database/{database_id}", json=payload
    )
    return response


async def delete_database(database_id: int) -> Any:
    return await superset_client.delete(f"/api/v1/database/{database_id}")


async def test_connection(data: dict[str, Any]) -> dict[str, Any]:
    payload = {
        "database_name": data.get("database_name", "test"),
        "engine": data.get("engine", "postgresql"),
        "sqlalchemy_uri": _build_sqlalchemy_uri(
            host=data["host"],
            port=data["port"],
            database=data["database"],
            username=data["username"],
            password=data["password"],
        ),
    }
    try:
        await superset_client.post(
            "/api/v1/database/test_connection", json=payload
        )
        return {"success": True, "message": "Conexão realizada com sucesso."}
    except Exception:
        logger.debug("Teste de conexão falhou")
        return {"success": False, "message": "Não foi possível conectar ao banco."}


async def get_database_datasets(database_id: int) -> dict[str, Any]:
    response = await superset_client.get(
        "/api/v1/dataset/",
        params={
            "q": f"(filters:!((col:database_id,opr:eq,value:'{database_id}')))"
        },
    )
    return response
