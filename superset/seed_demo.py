"""
MoniSUS Demo Seed Script
========================
Cria dados de demonstração no Superset para testes da integração.

Uso:
    docker exec superset_app python /app/seed_demo.py
"""

from __future__ import annotations

import json
import random
import sys
import urllib.request
import urllib.error
from datetime import date, timedelta
from typing import Any

# ---------------------------------------------------------------------------
# Configuração
# ---------------------------------------------------------------------------

SUPERSET_URL = "http://localhost:8088"
ADMIN_USER = "admin"
ADMIN_PASS = "admin123"

PG_HOST = "db"
PG_PORT = 5432
PG_ADMIN_USER = "superset"
PG_ADMIN_PASS = "superset_password"
PG_ADMIN_DB = "superset"

DEMO_DB_NAME = "monisus_demo"
DEMO_DB_USER = "superset"
DEMO_DB_PASS = "superset_password"

# ---------------------------------------------------------------------------
# Helpers HTTP (com suporte a cookies para CSRF)
# ---------------------------------------------------------------------------

import http.cookiejar

_cookie_jar = http.cookiejar.CookieJar()
_opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(_cookie_jar))


def http_request(
    method: str,
    url: str,
    data: bytes | None = None,
    headers: dict[str, str] | None = None,
) -> tuple[int, Any]:
    hdrs = headers or {}
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with _opener.open(req, timeout=30) as resp:
            body = resp.read().decode()
            try:
                return resp.status, json.loads(body)
            except json.JSONDecodeError:
                return resp.status, body
    except urllib.error.HTTPError as exc:
        body = exc.read().decode()
        print(f"  HTTP {exc.code}: {body[:500]}")
        return exc.code, body
    except Exception as exc:
        print(f"  Erro: {exc}")
        raise


def superset_api(
    method: str,
    path: str,
    token: str | None = None,
    csrf: str | None = None,
    payload: dict[str, Any] | None = None,
) -> tuple[int, Any]:
    url = f"{SUPERSET_URL}{path}"
    headers: dict[str, str] = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if csrf:
        headers["X-CSRFToken"] = csrf
        headers["Referer"] = SUPERSET_URL
    data = json.dumps(payload).encode() if payload else None
    return http_request(method, url, data=data, headers=headers)


# ---------------------------------------------------------------------------
# PostgreSQL helpers (via psycopg2)
# ---------------------------------------------------------------------------


def get_pg_connection(db_name: str = PG_ADMIN_DB):
    import psycopg2

    return psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        user=PG_ADMIN_USER,
        password=PG_ADMIN_PASS,
        dbname=db_name,
    )


def run_psql(sql: str, db_name: str = PG_ADMIN_DB) -> str:
    conn = get_pg_connection(db_name)
    try:
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(sql)
        if cur.description:
            result = cur.fetchone()
            return str(result[0]) if result else ""
        return ""
    finally:
        conn.close()


def run_psql_as_demo(sql: str) -> str:
    return run_psql(sql, DEMO_DB_NAME)


# ---------------------------------------------------------------------------
# Passo 1: Criar banco de dados demo
# ---------------------------------------------------------------------------


def create_demo_database() -> None:
    print("\n[1/7] Criando banco de dados monisus_demo...")

    exists = run_psql(
        f"SELECT 1 FROM pg_database WHERE datname = '{DEMO_DB_NAME}'"
    )
    if exists == "1":
        print("  Banco já existe, recriando...")
        conn = get_pg_connection()
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(f"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{DEMO_DB_NAME}' AND pid <> pg_backend_pid()")
        cur.execute(f"DROP DATABASE {DEMO_DB_NAME}")
        cur.execute(f"CREATE DATABASE {DEMO_DB_NAME}")
        conn.close()
    else:
        run_psql(f"CREATE DATABASE {DEMO_DB_NAME}")

    print("  OK")


# ---------------------------------------------------------------------------
# Passo 2: Criar tabela e popular dados
# ---------------------------------------------------------------------------

MUNICIPIOS = [
    "Teresina", "Parnaíba", "Piripiri", "Floriano", "Campo Maior",
    "Bom Jesus", "Unai", "José de Freitas", "Altos", "Beneditinos",
    "Coivaras", "Curralinhos", "Lagoa Alegre", "Lagoa do Piauí",
    "Miguel Alves", "Miguel Batista", "Nazária", "Novo Santo Antônio",
    "Paulistana", "São Pedro do Piauí", "Vera Mendes", "Vila Nova do Piauí",
    "Palmeiral", "Passagem Franca do Piauí",
]

UNIDADES_SAUDE = [
    ("UBS Centro", "UBS"),
    ("UBS Jardim Europa", "UBS"),
    ("UBS Vila Nova", "UBS"),
    ("UBS Santa Luzia", "UBS"),
    ("UBS Boa Vista", "UBS"),
    ("UPA Norte", "UPA"),
    ("UPA Sul", "UPA"),
    ("UPA Leste", "UPA"),
    ("Hospital São Lucas", "Hospital"),
    ("Hospital Santa Casa", "Hospital"),
    ("AMA Teresina", "AMA"),
    ("AMA Parnaíba", "AMA"),
]

PROCEDIMENTOS = [
    "Consulta Médica",
    "Consulta Enfermagem",
    "Vacinação",
    "Exame Laboratorial",
    "Raio-X",
    "Ultrassom",
    "Eletrocardiograma",
    "Odontologia",
    "Pré-Natal",
    "Acolhimento",
]

CUSTOS = {
    "Consulta Médica": (80, 250),
    "Consulta Enfermagem": (40, 120),
    "Vacinação": (15, 60),
    "Exame Laboratorial": (30, 150),
    "Raio-X": (100, 350),
    "Ultrassom": (150, 500),
    "Eletrocardiograma": (80, 200),
    "Odontologia": (60, 200),
    "Pré-Natal": (100, 300),
    "Acolhimento": (20, 80),
}


def create_table_and_data() -> None:
    print("\n[2/7] Criando tabela demo_atendimentos...")

    run_psql_as_demo("DROP TABLE IF EXISTS demo_atendimentos")

    run_psql_as_demo("""
        CREATE TABLE demo_atendimentos (
            id SERIAL PRIMARY KEY,
            data_atendimento DATE NOT NULL,
            municipio VARCHAR(100) NOT NULL,
            uf CHAR(2) DEFAULT 'PI',
            unidade_saude VARCHAR(150) NOT NULL,
            tipo_unidade VARCHAR(50) NOT NULL,
            procedimento VARCHAR(150) NOT NULL,
            quantidade_atendimentos INTEGER NOT NULL,
            internacoes INTEGER DEFAULT 0,
            custo_total NUMERIC(12,2) DEFAULT 0
        )
    """)

    print("  Inserindo dados DEMO (~3200 registros)...")

    import psycopg2

    random.seed(42)
    start_date = date(2026, 1, 1)
    end_date = date(2026, 9, 18)

    conn = psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        user=DEMO_DB_USER,
        password=DEMO_DB_PASS,
        dbname=DEMO_DB_NAME,
    )
    conn.autocommit = True
    cur = conn.cursor()

    for _ in range(3200):
        d = start_date + timedelta(days=random.randint(0, (end_date - start_date).days))
        mun = random.choice(MUNICIPIOS)
        unidade, tipo = random.choice(UNIDADES_SAUDE)
        proc = random.choice(PROCEDIMENTOS)
        qtd = random.randint(1, 45)
        custo_min, custo_max = CUSTOS[proc]
        custo = round(random.uniform(custo_min, custo_max) * qtd, 2)
        internacoes = random.randint(0, 3) if proc in ("Consulta Médica", "Acolhimento") else 0

        cur.execute(
            """INSERT INTO demo_atendimentos
               (data_atendimento, municipio, uf, unidade_saude, tipo_unidade,
                procedimento, quantidade_atendimentos, internacoes, custo_total)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (d, mun, "PI", unidade, tipo, proc, qtd, internacoes, custo),
        )

    conn.close()

    count = run_psql_as_demo("SELECT COUNT(*) FROM demo_atendimentos")
    print(f"  OK — {count} registros inseridos")


# ---------------------------------------------------------------------------
# Passo 3: Autenticar no Superset
# ---------------------------------------------------------------------------


def authenticate() -> tuple[str, str]:
    print("\n[3/7] Autenticando no Superset...")

    # Login via API para obter token JWT
    code, data = superset_api(
        "POST",
        "/api/v1/security/login",
        payload={"username": ADMIN_USER, "password": ADMIN_PASS, "provider": "db", "refresh": True},
    )
    if code != 200 or not isinstance(data, dict):
        print(f"  Falha no login: {data}")
        sys.exit(1)

    token = data["access_token"]

    # Login via cookie de sessão (necessário para CSRF)
    login_url = f"{SUPERSET_URL}/login/"
    login_data = json.dumps({"username": ADMIN_USER, "password": ADMIN_PASS}).encode()
    http_request("POST", login_url, data=login_data, headers={"Content-Type": "application/json"})

    # Obter CSRF token
    code, data = superset_api(
        "GET",
        "/api/v1/security/csrf_token/",
        token=token,
    )
    csrf = data.get("result", "") if isinstance(data, dict) else ""

    print("  OK")
    return token, csrf


# ---------------------------------------------------------------------------
# Passo 4: Registrar banco no Superset
# ---------------------------------------------------------------------------


def cleanup_existing(token: str, csrf: str) -> None:
    """Remove recursos existentes para recriar limpo."""
    print("\n[3/7] Limpando recursos existentes...")

    # Remover charts
    code, data = superset_api("GET", "/api/v1/chart/?q=(page_size:200)", token=token)
    if code == 200 and isinstance(data, dict):
        for chart in data.get("result", []):
            name = chart.get("slice_name", "")
            if any(k in name for k in ["Atendimento", "Município", "Custo", "Procedimento", "Indicadores", "Evolução"]):
                superset_api("DELETE", f"/api/v1/chart/{chart['id']}", token=token, csrf=csrf)
                print(f"  Removido chart: {name}")

    # Remover dashboards
    code, data = superset_api("GET", "/api/v1/dashboard/?q=(page_size:100)", token=token)
    if code == 200 and isinstance(data, dict):
        for dash in data.get("result", []):
            if "MoniSUS" in (dash.get("dashboard_title") or ""):
                superset_api("DELETE", f"/api/v1/dashboard/{dash['id']}", token=token, csrf=csrf)
                print(f"  Removido dashboard: {dash['dashboard_title']}")

    # Remover datasets
    code, data = superset_api("GET", "/api/v1/dataset/?q=(page_size:200)", token=token)
    if code == 200 and isinstance(data, dict):
        for ds in data.get("result", []):
            if ds.get("table_name") == "demo_atendimentos":
                superset_api("DELETE", f"/api/v1/dataset/{ds['id']}", token=token, csrf=csrf)
                print(f"  Removido dataset: demo_atendimentos")

    # Remover banco demo
    code, data = superset_api("GET", "/api/v1/database/?q=(page_size:100)", token=token)
    if code == 200 and isinstance(data, dict):
        for db in data.get("result", []):
            if db.get("database_name") == DEMO_DB_NAME:
                superset_api("DELETE", f"/api/v1/database/{db['id']}", token=token, csrf=csrf)
                print(f"  Removido database: {DEMO_DB_NAME}")

    print("  OK")


def register_database(token: str, csrf: str) -> int:
    print("\n[4/7] Registrando banco monisus_demo no Superset...")

    code, data = superset_api(
        "POST",
        "/api/v1/database/",
        token=token,
        csrf=csrf,
        payload={
            "database_name": DEMO_DB_NAME,
            "sqlalchemy_uri": f"postgresql://{DEMO_DB_USER}:{DEMO_DB_PASS}@{PG_HOST}:{PG_PORT}/{DEMO_DB_NAME}",
            "expose_in_sqllab": True,
            "allow_ctas": True,
            "allow_cvas": True,
            "allow_dml": True,
            "allow_file_upload": False,
            "configuration_method": "sqlalchemy_form",
        },
    )
    if code not in (200, 201) or not isinstance(data, dict):
        print(f"  Falha ao criar banco: {data}")
        sys.exit(1)

    db_id = data["id"]
    print(f"  OK (id={db_id})")
    return db_id


# ---------------------------------------------------------------------------
# Passo 5: Criar dataset
# ---------------------------------------------------------------------------


def create_dataset(token: str, csrf: str, db_id: int) -> int:
    print("\n[5/7] Criando dataset demo_atendimentos...")

    code, data = superset_api(
        "POST",
        "/api/v1/dataset/",
        token=token,
        csrf=csrf,
        payload={
            "database": db_id,
            "table_name": "demo_atendimentos",
            "schema": "public",
        },
    )
    if code not in (200, 201) or not isinstance(data, dict):
        print(f"  Falha ao criar dataset: {data}")
        sys.exit(1)

    ds_id = data["id"]
    print(f"  OK (id={ds_id})")
    return ds_id


# ---------------------------------------------------------------------------
# Passo 6: Criar dashboard (antes dos charts para associar)
# ---------------------------------------------------------------------------


def create_dashboard(token: str, csrf: str) -> int:
    print("\n[6/7] Criando dashboard...")

    code, data = superset_api(
        "POST",
        "/api/v1/dashboard/",
        token=token,
        csrf=csrf,
        payload={
            "dashboard_title": "MoniSUS — Demonstração de Saúde",
            "slug": "monisus-demo",
            "published": True,
            "position_json": "",
            "json_metadata": json.dumps({
                "timed_refresh_immune_slices": [],
                "expanded_slices": {},
                "refresh_frequency": 0,
                "color_scheme": "",
                "label_colors": {},
                "shared_label_colors": {},
                "cross_filters_enabled": True,
            }),
        },
    )
    if code not in (200, 201) or not isinstance(data, dict):
        print(f"  Falha ao criar dashboard: {data}")
        sys.exit(1)

    dash_id = data["id"]
    print(f"  OK (id={dash_id})")
    return dash_id


# ---------------------------------------------------------------------------
# Passo 7: Criar charts
# ---------------------------------------------------------------------------


def create_charts(token: str, csrf: str, ds_id: int, dash_id: int) -> list[int]:
    print("\n[7/7] Criando charts...")

    chart_specs = [
        {
            "slice_name": "Evolução de Atendimentos por Mês",
            "viz_type": "echarts_area",
            "params": {
                "x_axis": "data_atendimento",
                "time_grain_sqla": "P1M",
                "metrics": [{"label": "Atendimentos", "expressionType": "SQL", "sqlExpression": "SUM(quantidade_atendimentos)"}],
                "row_limit": 10000,
                "show_legend": True,
            },
        },
        {
            "slice_name": "Atendimentos por Município",
            "viz_type": "echarts_bar",
            "params": {
                "groupby": ["municipio"],
                "metrics": [{"label": "Atendimentos", "expressionType": "SQL", "sqlExpression": "SUM(quantidade_atendimentos)"}],
                "row_limit": 50,
                "order_desc": True,
                "show_legend": False,
            },
        },
        {
            "slice_name": "Custo Total por Unidade de Saúde",
            "viz_type": "echarts_bar",
            "params": {
                "groupby": ["unidade_saude"],
                "metrics": [{"label": "Custo Total", "expressionType": "SQL", "sqlExpression": "ROUND(SUM(custo_total)::numeric, 2)"}],
                "row_limit": 50,
                "order_desc": True,
                "show_legend": False,
            },
        },
        {
            "slice_name": "Distribuição por Procedimento",
            "viz_type": "pie",
            "params": {
                "groupby": ["procedimento"],
                "metrics": [{"label": "Atendimentos", "expressionType": "SQL", "sqlExpression": "SUM(quantidade_atendimentos)"}],
                "row_limit": 50,
                "show_labels": True,
                "show_legend": True,
                "label_type": "key_value_percent",
            },
        },
        {
            "slice_name": "Evolução do Custo Total",
            "viz_type": "echarts_line",
            "params": {
                "x_axis": "data_atendimento",
                "time_grain_sqla": "P1M",
                "metrics": [{"label": "Custo Total", "expressionType": "SQL", "sqlExpression": "ROUND(SUM(custo_total)::numeric, 2)"}],
                "row_limit": 10000,
                "show_legend": True,
            },
        },
        {
            "slice_name": "Tabela de Indicadores",
            "viz_type": "table",
            "params": {
                "all_columns": ["municipio", "unidade_saude", "procedimento", "quantidade_atendimentos", "internacoes", "custo_total"],
                "row_limit": 200,
                "page_length": 20,
            },
        },
    ]

    chart_ids: list[int] = []
    for spec in chart_specs:
        code, data = superset_api(
            "POST",
            "/api/v1/chart/",
            token=token,
            csrf=csrf,
            payload={
                "slice_name": spec["slice_name"],
                "viz_type": spec["viz_type"],
                "datasource_id": ds_id,
                "datasource_type": "table",
                "params": json.dumps(spec["params"]),
                "dashboards": [dash_id],
            },
        )
        if code in (200, 201) and isinstance(data, dict):
            cid = data["id"]
            chart_ids.append(cid)
            print(f"  {spec['slice_name']} (id={cid})")
        else:
            print(f"  Falha ao criar '{spec['slice_name']}': {data}")

    print(f"  OK — {len(chart_ids)} charts criados")
    return chart_ids


# ---------------------------------------------------------------------------
# Passo 7b: Gerar query_context para cada chart
# ---------------------------------------------------------------------------


def generate_query_contexts(token: str, csrf: str, chart_ids: list[int]) -> None:
    """Gera query_context via Superset interno e salva via PATCH."""
    print("\n  Gerando query_context para cada chart...")

    for cid in chart_ids:
        code, data = superset_api("GET", f"/api/v1/chart/{cid}", token=token, csrf=csrf)
        if code != 200 or not isinstance(data, dict):
            print(f"    Chart {cid}: falha ao buscar ({data})")
            continue

        result = data.get("result", {})
        params_str = result.get("params") or "{}"
        viz_type = result.get("viz_type", "")
        ds_id = result.get("datasource_id", 0)
        ds_type = result.get("datasource_type", "table")

        try:
            fd = json.loads(params_str)
        except (json.JSONDecodeError, TypeError):
            fd = {}

        metrics = fd.get("metrics", [])
        row_limit = fd.get("row_limit", 10000)

        columns: list = []
        extras: dict = {"having": "", "where": ""}

        if fd.get("x_axis"):
            time_grain = fd.get("time_grain_sqla", "P1M")
            columns.append({
                "timeGrain": time_grain,
                "columnType": "BASE_AXIS",
                "sqlExpression": fd["x_axis"],
                "label": fd["x_axis"],
                "expressionType": "SQL",
            })
            extras["time_grain_sqla"] = time_grain

        if fd.get("groupby"):
            columns.extend(fd["groupby"])

        if fd.get("all_columns"):
            columns.extend(fd["all_columns"])

        query = {
            "columns": columns,
            "metrics": metrics,
            "row_limit": row_limit,
            "time_range": "No filter",
            "order_desc": True,
            "series_columns": [],
            "series_limit": 0,
            "series_limit_metric": None,
            "extras": extras,
            "post_processing": [],
        }

        query_context = json.dumps({
            "datasource": {"id": ds_id, "type": ds_type},
            "force": False,
            "queries": [query],
            "form_data": fd,
            "result_format": "json",
            "result_type": "full",
        })

        code, _ = superset_api(
            "PUT",
            f"/api/v1/chart/{cid}",
            token=token,
            csrf=csrf,
            payload={"query_context": query_context},
        )
        status = "OK" if code in (200, 201) else f"FAIL ({code})"
        print(f"    Chart {cid} ({viz_type}): {status}")


# ---------------------------------------------------------------------------
# Atualizar position_json do dashboard com IDs reais dos charts
# ---------------------------------------------------------------------------


def update_dashboard_layout(
    token: str, csrf: str, dash_id: int, chart_ids: list[int]
) -> None:
    print("\n  Atualizando layout do dashboard...")

    if len(chart_ids) < 6:
        print("  Pulando layout (nem todos os charts foram criados)")
        return

    c = chart_ids

    position_json = {
        "DASHBOARD_VERSION_KEY": "v2",
        "ROOT_ID": {"type": "ROOT", "id": "ROOT_ID", "children": ["GRID_ID"]},
        "GRID_ID": {
            "type": "GRID",
            "id": "GRID_ID",
            "children": ["ROW-1", "ROW-2", "ROW-3"],
            "parents": ["ROOT_ID"],
        },
        "HEADER_ID": {
            "type": "HEADER",
            "id": "HEADER_ID",
            "meta": {"text": "MoniSUS — Demonstração de Saúde"},
        },
        "ROW-1": {
            "type": "ROW",
            "id": "ROW-1",
            "children": ["CHART-0", "CHART-1"],
            "parents": ["ROOT_ID", "GRID_ID"],
            "meta": {"background": "BACKGROUND_TRANSPARENT"},
        },
        "CHART-0": {
            "type": "CHART",
            "id": "CHART-0",
            "children": [],
            "parents": ["ROOT_ID", "GRID_ID", "ROW-1"],
            "meta": {"width": 6, "height": 50, "chartId": c[0]},
        },
        "CHART-1": {
            "type": "CHART",
            "id": "CHART-1",
            "children": [],
            "parents": ["ROOT_ID", "GRID_ID", "ROW-1"],
            "meta": {"width": 6, "height": 50, "chartId": c[1]},
        },
        "ROW-2": {
            "type": "ROW",
            "id": "ROW-2",
            "children": ["CHART-2", "CHART-3"],
            "parents": ["ROOT_ID", "GRID_ID"],
            "meta": {"background": "BACKGROUND_TRANSPARENT"},
        },
        "CHART-2": {
            "type": "CHART",
            "id": "CHART-2",
            "children": [],
            "parents": ["ROOT_ID", "GRID_ID", "ROW-2"],
            "meta": {"width": 6, "height": 50, "chartId": c[2]},
        },
        "CHART-3": {
            "type": "CHART",
            "id": "CHART-3",
            "children": [],
            "parents": ["ROOT_ID", "GRID_ID", "ROW-2"],
            "meta": {"width": 6, "height": 50, "chartId": c[3]},
        },
        "ROW-3": {
            "type": "ROW",
            "id": "ROW-3",
            "children": ["CHART-4", "CHART-5"],
            "parents": ["ROOT_ID", "GRID_ID"],
            "meta": {"background": "BACKGROUND_TRANSPARENT"},
        },
        "CHART-4": {
            "type": "CHART",
            "id": "CHART-4",
            "children": [],
            "parents": ["ROOT_ID", "GRID_ID", "ROW-3"],
            "meta": {"width": 6, "height": 50, "chartId": c[4]},
        },
        "CHART-5": {
            "type": "CHART",
            "id": "CHART-5",
            "children": [],
            "parents": ["ROOT_ID", "GRID_ID", "ROW-3"],
            "meta": {"width": 6, "height": 50, "chartId": c[5]},
        },
    }

    superset_api(
        "PUT",
        f"/api/v1/dashboard/{dash_id}",
        token=token,
        csrf=csrf,
        payload={"position_json": json.dumps(position_json)},
    )
    print("  OK")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    print("=" * 60)
    print("  MoniSUS — Seed de Dados DEMO")
    print("=" * 60)

    create_demo_database()
    create_table_and_data()
    token, csrf = authenticate()
    cleanup_existing(token, csrf)
    db_id = register_database(token, csrf)
    ds_id = create_dataset(token, csrf, db_id)
    dash_id = create_dashboard(token, csrf)
    chart_ids = create_charts(token, csrf, ds_id, dash_id)
    generate_query_contexts(token, csrf, chart_ids)
    update_dashboard_layout(token, csrf, dash_id, chart_ids)

    print("\n" + "=" * 60)
    print("  RESUMO")
    print("=" * 60)
    print(f"  Database:  {DEMO_DB_NAME} (id={db_id})")
    print(f"  Dataset:   demo_atendimentos (id={ds_id})")
    print(f"  Dashboard: MoniSUS — Demonstração de Saúde (id={dash_id})")
    print(f"  Charts:    {len(chart_ids)} criados (ids={chart_ids})")
    print(f"  Superset:  {SUPERSET_URL}/superset/dashboard/{dash_id}/")
    print("=" * 60)


if __name__ == "__main__":
    main()
