"""Testes para o endpoint execute-filtered."""

from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_execute_filtered_no_filters(client, mock_superset_client, auth_headers):
    mock_superset_client.post.return_value = {"status": "success", "data": []}
    response = await client.post(
        "/api/queries/execute-filtered",
        json={"database_id": 1, "sql": "SELECT * FROM tabela", "filters": []},
        headers=auth_headers,
    )
    assert response.status_code == 200
    mock_superset_client.post.assert_awaited_once()


@pytest.mark.asyncio
async def test_execute_filtered_with_eq(client, mock_superset_client, auth_headers):
    mock_superset_client.post.return_value = {"status": "success", "data": []}
    response = await client.post(
        "/api/queries/execute-filtered",
        json={
            "database_id": 1,
            "sql": "SELECT * FROM tabela",
            "filters": [
                {"column": "municipio", "operator": "eq", "values": "Teresina"}
            ],
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    sql_sent = mock_superset_client.post.call_args.kwargs.get("json", {}).get("sql", "")
    assert "WHERE" in sql_sent
    assert "municipio = 'Teresina'" in sql_sent


@pytest.mark.asyncio
async def test_execute_filtered_with_in(client, mock_superset_client, auth_headers):
    mock_superset_client.post.return_value = {"status": "success", "data": []}
    response = await client.post(
        "/api/queries/execute-filtered",
        json={
            "database_id": 1,
            "sql": "SELECT * FROM tabela",
            "filters": [
                {"column": "municipio", "operator": "in", "values": ["Teresina", "Picos"]}
            ],
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    sql_sent = mock_superset_client.post.call_args.kwargs.get("json", {}).get("sql", "")
    assert "IN ('Teresina', 'Picos')" in sql_sent


@pytest.mark.asyncio
async def test_execute_filtered_with_between(client, mock_superset_client, auth_headers):
    mock_superset_client.post.return_value = {"status": "success", "data": []}
    response = await client.post(
        "/api/queries/execute-filtered",
        json={
            "database_id": 1,
            "sql": "SELECT * FROM tabela",
            "filters": [
                {"column": "data", "operator": "between", "values": ["2024-01-01", "2024-12-31"]}
            ],
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    sql_sent = mock_superset_client.post.call_args.kwargs.get("json", {}).get("sql", "")
    assert "BETWEEN '2024-01-01' AND '2024-12-31'" in sql_sent


@pytest.mark.asyncio
async def test_execute_filtered_existing_where(client, mock_superset_client, auth_headers):
    mock_superset_client.post.return_value = {"status": "success", "data": []}
    response = await client.post(
        "/api/queries/execute-filtered",
        json={
            "database_id": 1,
            "sql": "SELECT * FROM tabela WHERE original = 'cond'",
            "filters": [
                {"column": "municipio", "operator": "eq", "values": "Teresina"}
            ],
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    sql_sent = mock_superset_client.post.call_args.kwargs.get("json", {}).get("sql", "")
    assert "original = 'cond'" in sql_sent
    assert "municipio = 'Teresina'" in sql_sent
    assert "AND" in sql_sent


@pytest.mark.asyncio
async def test_execute_filtered_invalid_column(client, mock_superset_client, auth_headers):
    """Coluna com caracteres ilegais - Pydantic valida e retorna 422."""
    response = await client.post(
        "/api/queries/execute-filtered",
        json={
            "database_id": 1,
            "sql": "SELECT * FROM tabela",
            "filters": [{"column": "'; DROP TABLE--", "operator": "eq", "values": "x"}],
        },
        headers=auth_headers,
    )
    assert response.status_code == 422
    mock_superset_client.post.assert_not_awaited()


@pytest.mark.asyncio
async def test_execute_filtered_invalid_operator(client, mock_superset_client, auth_headers):
    """Operador não existe no enum - Pydantic valida e retorna 422."""
    response = await client.post(
        "/api/queries/execute-filtered",
        json={
            "database_id": 1,
            "sql": "SELECT * FROM tabela",
            "filters": [{"column": "col", "operator": "DELETE", "values": "x"}],
        },
        headers=auth_headers,
    )
    assert response.status_code == 422
    mock_superset_client.post.assert_not_awaited()


@pytest.mark.asyncio
async def test_execute_filtered_between_one_value(client, mock_superset_client, auth_headers):
    """Between com valor único - Pydantic valida e retorna 422."""
    response = await client.post(
        "/api/queries/execute-filtered",
        json={
            "database_id": 1,
            "sql": "SELECT * FROM tabela",
            "filters": [{"column": "data", "operator": "between", "values": ["2024-01-01"]}],
        },
        headers=auth_headers,
    )
    assert response.status_code == 422
    mock_superset_client.post.assert_not_awaited()


@pytest.mark.asyncio
async def test_execute_filtered_between_invalid_dates(client, mock_superset_client, auth_headers):
    """Between com datas inválidas - Pydantic valida e retorna 422."""
    response = await client.post(
        "/api/queries/execute-filtered",
        json={
            "database_id": 1,
            "sql": "SELECT * FROM tabela",
            "filters": [
                {"column": "data", "operator": "between", "values": ["not-a-date", "also-not"]}
            ],
        },
        headers=auth_headers,
    )
    assert response.status_code == 422
    mock_superset_client.post.assert_not_awaited()


@pytest.mark.asyncio
async def test_execute_filtered_in_empty_list(client, mock_superset_client, auth_headers):
    """In com lista vazia - Pydantic valida e retorna 422."""
    response = await client.post(
        "/api/queries/execute-filtered",
        json={
            "database_id": 1,
            "sql": "SELECT * FROM tabela",
            "filters": [{"column": "col", "operator": "in", "values": []}],
        },
        headers=auth_headers,
    )
    assert response.status_code == 422
    mock_superset_client.post.assert_not_awaited()


@pytest.mark.asyncio
async def test_execute_filtered_in_string_not_list(client, mock_superset_client, auth_headers):
    """In com string em vez de lista - Pydantic valida e retorna 422."""
    response = await client.post(
        "/api/queries/execute-filtered",
        json={
            "database_id": 1,
            "sql": "SELECT * FROM tabela",
            "filters": [{"column": "col", "operator": "in", "values": "single"}],
        },
        headers=auth_headers,
    )
    assert response.status_code == 422
    mock_superset_client.post.assert_not_awaited()


@pytest.mark.asyncio
async def test_execute_filtered_escape_quotes(client, mock_superset_client, auth_headers):
    mock_superset_client.post.return_value = {"status": "success", "data": []}
    response = await client.post(
        "/api/queries/execute-filtered",
        json={
            "database_id": 1,
            "sql": "SELECT * FROM tabela",
            "filters": [{"column": "nome", "operator": "eq", "values": "O'Brien"}],
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    sql_sent = mock_superset_client.post.call_args.kwargs.get("json", {}).get("sql", "")
    assert "O''Brien" in sql_sent
