from __future__ import annotations

import pytest
from httpx import HTTPStatusError, Request, Response

from app.superset.materialize import materialize_query


@pytest.mark.asyncio
async def test_materialize_query_success(client, mock_superset_client):
    mock_superset_client.post.return_value = {
        "status": "success",
        "query_id": 123,
        "data": [],
    }
    result = await materialize_query(
        database_id=4,
        sql="SELECT 1 AS col",
        schema="public",
        table_name="monisus_ds_teste_a1b2c3",
    )
    assert result["status"] == "success"

    call_args = mock_superset_client.post.call_args
    assert call_args[0][0] == "/api/v1/sqllab/execute/"
    payload = call_args[1]["json"]
    assert payload["database_id"] == 4
    assert payload["sql"] == "SELECT 1 AS col"
    assert payload["schema"] == "public"
    assert payload["select_as_cta"] is True
    assert payload["ctas_method"] == "TABLE"
    assert payload["tmp_table_name"] == "monisus_ds_teste_a1b2c3"
    assert payload["runAsync"] is False


@pytest.mark.asyncio
async def test_materialize_query_no_schema(client, mock_superset_client):
    mock_superset_client.post.return_value = {"status": "success"}
    await materialize_query(
        database_id=4,
        sql="SELECT 1",
        schema=None,
        table_name="monisus_ds_teste_x1y2z3",
    )
    payload = mock_superset_client.post.call_args[1]["json"]
    assert "schema" not in payload


@pytest.mark.asyncio
async def test_materialize_query_ctas_blocked(client, mock_superset_client):
    req = Request("POST", "http://test/api/v1/sqllab/execute/")
    resp = Response(
        status_code=403,
        request=req,
        json={
            "errors": [
                {
                    "message": (
                        "This database does not allow creating tables "
                        "from queries (CTAS)."
                    ),
                }
            ]
        },
    )
    mock_superset_client.post.side_effect = HTTPStatusError(
        message="403 Forbidden", request=req, response=resp
    )

    with pytest.raises(ValueError, match="não permite materialização"):
        await materialize_query(
            database_id=6,
            sql="SELECT 1",
            schema="public",
            table_name="monisus_ds_teste_blocked",
        )


@pytest.mark.asyncio
async def test_materialize_query_generic_error(client, mock_superset_client):
    req = Request("POST", "http://test/api/v1/sqllab/execute/")
    resp = Response(
        status_code=500,
        request=req,
        json={"errors": [{"message": "Internal server error"}]},
    )
    mock_superset_client.post.side_effect = HTTPStatusError(
        message="500 Internal Server Error", request=req, response=resp
    )

    with pytest.raises(ValueError, match="Internal server error"):
        await materialize_query(
            database_id=4,
            sql="SELECT 1",
            schema="public",
            table_name="monisus_ds_teste_error",
        )
