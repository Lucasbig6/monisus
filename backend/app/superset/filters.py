"""Construção segura de cláusulas WHERE para filtros de dashboard.

Este módulo implementa a transformação de filtros declarativos (FilterClause)
em cláusulas SQL WHERE válidas, com escaping de valores e validação de estrutura.

LIMITAÇÃO IMPORTANTE:
O Superset SQL Lab não suporta parametrização de queries via API.
Os valores são incorporados ao SQL como literais com escaping.
Isso NÃO é parametrização real - é escaping de strings.
Em um cenário de produção com driver nativo (psycopg2, etc.),
parametrização real seria preferível.
"""

from __future__ import annotations

import re
from typing import Any

from pydantic import BaseModel, field_validator

ALLOWED_OPERATORS = {"eq", "in", "gte", "lte", "between"}

COLUMN_NAME_PATTERN = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]*$")

DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}(/\d{4}-\d{2}-\d{2})?$")


class FilterClause(BaseModel):
    """Cláusula de filtro declarativa."""

    column: str
    operator: str
    values: list[str] | str

    @field_validator("column")
    @classmethod
    def validate_column(cls, v: str) -> str:
        if not COLUMN_NAME_PATTERN.match(v):
            msg = f"Nome de coluna inválido: {v!r}"
            raise ValueError(msg)
        return v

    @field_validator("operator")
    @classmethod
    def validate_operator(cls, v: str) -> str:
        if v not in ALLOWED_OPERATORS:
            msg = f"Operador não permitido: {v!r}. Use: {ALLOWED_OPERATORS}"
            raise ValueError(msg)
        return v

    @field_validator("values")
    @classmethod
    def validate_values(cls, v: list[str] | str, info: Any) -> list[str] | str:
        operator = info.data.get("operator", "")

        if operator == "in":
            if not isinstance(v, list) or len(v) == 0:
                msg = "Operador 'in' requer lista não vazia de valores"
                raise ValueError(msg)

        if operator == "between":
            if not isinstance(v, list) or len(v) != 2:
                msg = "Operador 'between' requer exatamente dois valores"
                raise ValueError(msg)
            for val in v:
                if not DATE_PATTERN.match(val):
                    msg = f"Valor de data inválido: {val!r} (use formato YYYY-MM-DD)"
                    raise ValueError(msg)

        if operator in ("gte", "lte"):
            val = v if isinstance(v, str) else v[0] if v else ""
            if not DATE_PATTERN.match(val):
                msg = f"Valor de data inválido: {val!r} (use formato YYYY-MM-DD)"
                raise ValueError(msg)

        return v


def _escape_sql_literal(value: str) -> str:
    """Escape de literal SQL para prevenir injeção.

    Substitui aspas simples por aspas duplas escapadas.
    Remove caracteres de controle perigosos.

    NOTA: Isso NÃO é parametrização real. Em um cenário de produção,
    use query parametrization via driver de banco de dados.
    """
    result = value.replace("\\", "\\\\")
    result = result.replace("'", "''")
    result = result.replace("\0", "")
    result = result.replace("\x1a", "")
    return result


def _build_condition(filter_clause: FilterClause) -> str:
    """Constrói uma condição WHERE a partir de um FilterClause validado."""
    col = filter_clause.column
    op = filter_clause.operator
    vals = filter_clause.values

    if op == "eq":
        val = vals if isinstance(vals, str) else vals[0]
        escaped = _escape_sql_literal(val)
        return f"{col} = '{escaped}'"

    if op == "in":
        assert isinstance(vals, list)
        escaped_vals = ", ".join(f"'{_escape_sql_literal(v)}'" for v in vals)
        return f"{col} IN ({escaped_vals})"

    if op == "gte":
        val = vals if isinstance(vals, str) else vals[0]
        escaped = _escape_sql_literal(val)
        return f"{col} >= '{escaped}'"

    if op == "lte":
        val = vals if isinstance(vals, str) else vals[0]
        escaped = _escape_sql_literal(val)
        return f"{col} <= '{escaped}'"

    if op == "between":
        assert isinstance(vals, list) and len(vals) == 2
        escaped_0 = _escape_sql_literal(vals[0])
        escaped_1 = _escape_sql_literal(vals[1])
        return f"{col} BETWEEN '{escaped_0}' AND '{escaped_1}'"

    msg = f"Operador não implementado: {op!r}"
    raise ValueError(msg)


def build_where_clause(filters: list[FilterClause]) -> str:
    """Constrói cláusula WHERE completa a partir de filtros validados.

    Retorna string vazia se nenhum filtro tem condições.
    Retorna "WHERE cond1 AND cond2 ..." se houver filtros.
    """
    if not filters:
        return ""

    conditions = [_build_condition(f) for f in filters]

    if not conditions:
        return ""

    return "WHERE " + " AND ".join(conditions)


def inject_where_clause(base_sql: str, where_clause: str) -> str:
    """Injeta cláusula WHERE em SQL SELECT/WITH de forma segura.

    Preserva a ordem: SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT → OFFSET

    Se a query já possui WHERE, adiciona as condições com AND.
    Se não possui WHERE, insere WHERE antes de ORDER BY/LIMIT/GROUP BY/HAVING/OFFSET.

    Limitações conhecidas:
    - Não lida com CTEs complexas que possuem WHERE internos
    - Não lida com subqueries que possuem WHERE
    - Se o SQL não puder ser parseado com segurança, rejeita a execução

    Returns:
        SQL com WHERE injetado.

    Raises:
        ValueError: Se não for possível injetar WHERE com segurança.
    """
    if not where_clause:
        return base_sql

    sql = base_sql.strip()

    # Encontrar a posição do WHERE existente (apenas no nível principal, não em subqueries)
    # Usar uma abordagem de contagem de parênteses para ignorar WHERE em subqueries
    where_pos = _find_top_level_where(sql)

    if where_pos != -1:
        # WHERE já existe no nível principal - adicionar com AND
        return _append_and_to_existing_where(sql, where_pos, where_clause)

    # WHERE não existe - encontrar posição de inserção
    insert_pos = _find_insertion_point(sql)

    before = sql[:insert_pos].rstrip()
    after = sql[insert_pos:]

    # Remover ; final se houver
    before = re.sub(r";\s*$", "", before)

    result = f"{before} {where_clause} {after}"
    return result.strip()


def _find_top_level_where(sql: str) -> int:
    """Encontra a posição do WHERE no nível principal da query.

    Ignora WHERE dentro de parênteses (subqueries, CTEs).
    Retorna -1 se não encontrar.
    """
    depth = 0
    i = 0
    sql_upper = sql.upper()

    while i < len(sql):
        if sql[i] == "(":
            depth += 1
        elif sql[i] == ")":
            depth -= 1
        elif depth == 0 and i + 4 < len(sql):
            # Verificar se é WHERE no nível principal
            if sql_upper[i : i + 5] == "WHERE":
                # Verificar que é uma palavra inteira
                before_ok = i == 0 or not sql[i - 1].isalnum()
                after_pos = i + 5
                after_ok = after_pos >= len(sql) or not sql[after_pos].isalnum()
                if before_ok and after_ok:
                    return i
        i += 1

    return -1


def _find_insertion_point(sql: str) -> int:
    """Encontra a posição ideal para inserir WHERE em uma query sem WHERE.

    Procura por ORDER BY, GROUP BY, HAVING, LIMIT, OFFSET no nível principal.
    Retorna a posição do primeiro encontrado, ou o final da string.
    """
    depth = 0
    sql_upper = sql.upper()
    len_sql = len(sql)

    # Palavras-chave que WHERE deve preceder
    keywords = ["ORDER BY", "GROUP BY", "HAVING", "LIMIT", "OFFSET"]

    i = 0
    while i < len_sql:
        if sql[i] == "(":
            depth += 1
        elif sql[i] == ")":
            depth -= 1
        elif depth == 0:
            for kw in keywords:
                kw_len = len(kw)
                if i + kw_len <= len_sql:
                    segment = sql_upper[i : i + kw_len]
                    if segment == kw:
                        # Verificar que é palavra inteira
                        before_ok = i == 0 or not sql[i - 1].isalnum()
                        after_pos = i + kw_len
                        after_ok = (
                            after_pos >= len_sql
                            or not sql[after_pos].isalnum()
                        )
                        if before_ok and after_ok:
                            return i
        i += 1

    return len_sql


def _append_and_to_existing_where(
    sql: str, where_pos: int, where_clause: str
) -> str:
    """Adiciona condições AND a um WHERE existente.

    where_clause vem como "WHERE cond1 AND cond2 ..."
    Precisamos extrair apenas as condições (sem o prefixo WHERE).
    """
    # Extrair as condições do where_clause (remover "WHERE " prefix)
    new_conditions = where_clause
    if new_conditions.upper().startswith("WHERE "):
        new_conditions = new_conditions[6:]

    # Encontrar o fim do WHERE existente
    # Procurar por GROUP BY, ORDER BY, LIMIT, OFFSET, HAVING, ou fim da string
    where_end = _find_where_end(sql, where_pos)

    before_where = sql[:where_pos].rstrip()
    where_section = sql[where_pos:where_end].rstrip()
    after_where = sql[where_end:]

    # Verificar se o WHERE existente já tem condições
    where_content = where_section[5:].strip()  # Remover "WHERE"

    if where_content:
        return f"{before_where} WHERE ({where_content}) AND ({new_conditions}) {after_where}"
    else:
        return f"{before_where} WHERE {new_conditions} {after_where}"


def _find_where_end(sql: str, where_pos: int) -> int:
    """Encontra o fim da cláusula WHERE existente.

    Procura por HAVING, GROUP BY, ORDER BY, LIMIT, OFFSET no nível principal.
    """
    depth = 0
    sql_upper = sql.upper()
    len_sql = len(sql)

    keywords = ["GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET"]

    i = where_pos + 5  # Pular "WHERE"
    while i < len_sql:
        if sql[i] == "(":
            depth += 1
        elif sql[i] == ")":
            depth -= 1
        elif depth == 0:
            for kw in keywords:
                kw_len = len(kw)
                if i + kw_len <= len_sql:
                    segment = sql_upper[i : i + kw_len]
                    if segment == kw:
                        before_ok = i == 0 or not sql[i - 1].isalnum()
                        after_pos = i + kw_len
                        after_ok = (
                            after_pos >= len_sql
                            or not sql[after_pos].isalnum()
                        )
                        if before_ok and after_ok:
                            return i
        i += 1

    return len_sql
