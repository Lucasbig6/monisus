"""Testes para o módulo de filtros SQL."""

from __future__ import annotations

import pytest

from app.superset.filters import (
    FilterClause,
    _escape_sql_literal,
    _find_top_level_where,
    build_where_clause,
    inject_where_clause,
)


class TestFilterClause:
    """Testes para validação do FilterClause."""

    def test_valid_select_filter(self) -> None:
        f = FilterClause(column="municipio", operator="eq", values="Teresina")
        assert f.column == "municipio"
        assert f.operator == "eq"

    def test_valid_in_filter(self) -> None:
        f = FilterClause(
            column="municipio", operator="in", values=["Teresina", "Picos"]
        )
        assert f.values == ["Teresina", "Picos"]

    def test_valid_between_filter(self) -> None:
        f = FilterClause(
            column="data",
            operator="between",
            values=["2024-01-01", "2024-12-31"],
        )
        assert f.values == ["2024-01-01", "2024-12-31"]

    def test_invalid_column_name(self) -> None:
        with pytest.raises(ValueError, match="Nome de coluna inválido"):
            FilterClause(column="'; DROP TABLE--", operator="eq", values="test")

    def test_invalid_column_with_space(self) -> None:
        with pytest.raises(ValueError, match="Nome de coluna inválido"):
            FilterClause(column="col name", operator="eq", values="test")

    def test_invalid_operator(self) -> None:
        with pytest.raises(ValueError, match="Operador não permitido"):
            FilterClause(column="col", operator="DELETE", values="x")

    def test_in_requires_list(self) -> None:
        with pytest.raises(ValueError, match="requer lista não vazia"):
            FilterClause(column="col", operator="in", values="single")

    def test_in_requires_non_empty_list(self) -> None:
        with pytest.raises(ValueError, match="requer lista não vazia"):
            FilterClause(column="col", operator="in", values=[])

    def test_between_requires_two_values(self) -> None:
        with pytest.raises(ValueError, match="exatamente dois valores"):
            FilterClause(column="col", operator="between", values=["a"])

    def test_between_requires_valid_dates(self) -> None:
        with pytest.raises(ValueError, match="Valor de data inválido"):
            FilterClause(
                column="col", operator="between", values=["not-a-date", "also-not"]
            )

    def test_gte_requires_valid_date(self) -> None:
        with pytest.raises(ValueError, match="Valor de data inválido"):
            FilterClause(column="col", operator="gte", values="not-a-date")


class TestEscapeSqlLiteral:
    """Testes para escape de literais SQL."""

    def test_simple_string(self) -> None:
        assert _escape_sql_literal("hello") == "hello"

    def test_single_quote(self) -> None:
        assert _escape_sql_literal("O'Brien") == "O''Brien"

    def test_backslash(self) -> None:
        assert _escape_sql_literal("a\\b") == "a\\\\b"

    def test_null_byte(self) -> None:
        assert _escape_sql_literal("a\0b") == "ab"

    def test_control_char(self) -> None:
        assert _escape_sql_literal("a\x1ab") == "ab"


class TestBuildWhereClause:
    """Testes para construção de WHERE clause."""

    def test_empty_filters(self) -> None:
        assert build_where_clause([]) == ""

    def test_eq_filter(self) -> None:
        filters = [FilterClause(column="municipio", operator="eq", values="Teresina")]
        result = build_where_clause(filters)
        assert result == "WHERE municipio = 'Teresina'"

    def test_in_filter(self) -> None:
        filters = [
            FilterClause(
                column="municipio", operator="in", values=["Teresina", "Picos"]
            )
        ]
        result = build_where_clause(filters)
        assert "WHERE municipio IN ('Teresina', 'Picos')" == result

    def test_between_filter(self) -> None:
        filters = [
            FilterClause(
                column="data",
                operator="between",
                values=["2024-01-01", "2024-12-31"],
            )
        ]
        result = build_where_clause(filters)
        assert result == "WHERE data BETWEEN '2024-01-01' AND '2024-12-31'"

    def test_multiple_filters(self) -> None:
        filters = [
            FilterClause(column="municipio", operator="eq", values="Teresina"),
            FilterClause(
                column="data",
                operator="between",
                values=["2024-01-01", "2024-12-31"],
            ),
        ]
        result = build_where_clause(filters)
        assert "municipio = 'Teresina'" in result
        assert "data BETWEEN '2024-01-01' AND '2024-12-31'" in result
        assert " AND " in result  # join between conditions

    def test_escape_in_values(self) -> None:
        filters = [
            FilterClause(
                column="nome", operator="eq", values="O'Brien's Shop"
            )
        ]
        result = build_where_clause(filters)
        assert "O''Brien''s Shop" in result


class TestInjectWhereClause:
    """Testes para injeção de WHERE clause em SQL."""

    def test_no_where_simple(self) -> None:
        sql = "SELECT * FROM tabela"
        where = "WHERE col = 'val'"
        result = inject_where_clause(sql, where)
        assert result == "SELECT * FROM tabela WHERE col = 'val'"

    def test_no_where_with_order(self) -> None:
        sql = "SELECT * FROM tabela ORDER BY id"
        where = "WHERE col = 'val'"
        result = inject_where_clause(sql, where)
        assert "WHERE col = 'val'" in result
        assert "ORDER BY id" in result

    def test_no_where_with_limit(self) -> None:
        sql = "SELECT * FROM tabela LIMIT 10"
        where = "WHERE col = 'val'"
        result = inject_where_clause(sql, where)
        assert "WHERE col = 'val'" in result
        assert "LIMIT 10" in result

    def test_no_where_with_group_by(self) -> None:
        sql = "SELECT col, COUNT(*) FROM tabela GROUP BY col"
        where = "WHERE col = 'val'"
        result = inject_where_clause(sql, where)
        assert "WHERE col = 'val'" in result
        assert "GROUP BY col" in result

    def test_existing_where(self) -> None:
        sql = "SELECT * FROM tabela WHERE original = 'condition'"
        where = "WHERE new = 'filter'"
        result = inject_where_clause(sql, where)
        assert "original = 'condition'" in result
        assert "new = 'filter'" in result
        assert "AND" in result

    def test_empty_where_clause(self) -> None:
        sql = "SELECT * FROM tabela"
        result = inject_where_clause(sql, "")
        assert result == "SELECT * FROM tabela"

    def test_preserves_semicolon(self) -> None:
        sql = "SELECT * FROM tabela;"
        where = "WHERE col = 'val'"
        result = inject_where_clause(sql, where)
        assert "WHERE col = 'val'" in result
        assert result.rstrip().endswith("'val'")

    def test_complex_query_with_cte(self) -> None:
        sql = "WITH cte AS (SELECT * FROM t1 WHERE x = 1) SELECT * FROM cte ORDER BY id"
        where = "WHERE y = 'filter'"
        result = inject_where_clause(sql, where)
        assert "WHERE y = 'filter'" in result
        assert "ORDER BY id" in result
        # O WHERE dentro do CTE não deve ser afetado
        assert "x = 1" in result


class TestFindTopLevelWhere:
    """Testes para busca de WHERE no nível principal."""

    def test_no_where(self) -> None:
        assert _find_top_level_where("SELECT * FROM t") == -1

    def test_simple_where(self) -> None:
        pos = _find_top_level_where("SELECT * FROM t WHERE x = 1")
        assert pos == 16

    def test_where_in_subquery(self) -> None:
        sql = "SELECT * FROM (SELECT * FROM t WHERE x = 1) sub"
        assert _find_top_level_where(sql) == -1

    def test_where_after_parentheses(self) -> None:
        sql = "SELECT * FROM (SELECT 1) sub WHERE x = 1"
        pos = _find_top_level_where(sql)
        assert pos != -1
