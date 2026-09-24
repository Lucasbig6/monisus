# Plano MVP SAÚDE360 — demonstração

Status: **ETAPA 1 implementada e validada** (2026-09-24). ETapas 2–6 **não** executadas — aguardando validação do usuário.

### ETAPA 1 — arquivos alterados
- `backend/app/superset/sources.py` — `get_database_datasets` pagina e filtra por `database.id`; `delete_database` reutiliza o helper
- `backend/tests/test_sources.py` — teste de filtro por database
- `frontend/lib/api/datasets.ts` — `datasetDisplayName` + `description?` em `DatasetListItem`
- `frontend/lib/explorer/sql.ts` — `generatePreviewSql` com `isValidIdentifier`
- `frontend/components/explorer/dataset-selector.tsx` — nome amigável
- `frontend/app/(authenticated)/explorar/page.tsx` — `?datasetId=`, preview auto, refetch com catch, seleção pós-publish
- `frontend/app/(authenticated)/fontes/[id]/page.tsx` — erro visível + nome amigável

### ETAPA 1 — validação
- `make test`: 141 passed
- ESLint nos arquivos alterados: limpo; ruff: limpo; `tsc --noEmit`: limpo
- E2E API: publish id 11 → list count 5 → source datasets 200 → colunas → preview 24 linhas
- Páginas `/explorar`, `/fontes/4`, `/inicio`: HTTP 200
- Dívida lint pré-existente: `components/preparar/object-browser.tsx` (`set-state-in-effect`) — não tocado

Ordem obrigatória do usuário. Sem refatoração estrutural, sem LangGraph, sem novas arquiteturas.

---

## Diagnóstico ETAPA 1 (investigado ao vivo — sem假设)

Ambiente: backend `:8000` ok, Superset `:8088` ok, DB 4 `monisus_demo` com `allow_ctas=true`.

| Passo | Status |
|---|---|
| `POST /api/datasets/publish` (CTAS + dataset Superset) | ✅ funciona (id 10 criado só para diagnóstico) |
| `GET /api/datasets` (dropdown Explorar) | ✅ `count: 4` |
| `GET /api/datasets/{id}` + colunas | ✅ |
| `POST /api/queries/execute` na tabela publicada | ✅ |
| `GET /api/sources/{id}/datasets` | ❌ **400** `Filter column: database_id not allowed to filter` → backend vira 404 → frontend `catch` silencioso → card “Nenhum dataset publicado” |
| Link Fonte → Explorar `?datasetId=` | ❌ `explorar/page.tsx` só lê `analysisId` |
| Nome exibido | ⚠️ só `table_name` (`monisus_ds_...`); nome amigável invisível |
| Refetch pós-publish | ⚠️ sem `.catch` e não seleciona o novo dataset |
| Preview de dados ao abrir dataset | ❌ inexistente (precisa escrever SQL) |

Arquivos-chave do bug:
- `backend/app/superset/sources.py:147-154` — filtro proibido
- `backend/app/superset/sources.py:96-115` — mesmo filtro no delete
- `frontend/app/(authenticated)/fontes/[id]/page.tsx:102-103` — catch silencioso
- `frontend/app/(authenticated)/fontes/[id]/page.tsx:400` — `?datasetId=`
- `frontend/app/(authenticated)/explorar/page.tsx:39,169-171` — não lê `datasetId`; refetch frágil
- `frontend/components/explorer/dataset-selector.tsx:54` — só `table_name`

Decisões do usuário:
1. Aplicar ETAPA 1 completa (backend + frontend).
2. Catálogo = dropdown `/explorar` + seção na Fonte (sem rota `/datasets` nova).
3. Dashboards: renomear rotas para `/dashboards` e `/dashboard/:id` **na etapa 4** (depois do fluxo estável).

---

## ETAPA 1 — Dataset publicado → catálogo → abrir → tabela

### 1.1 Backend — `backend/app/superset/sources.py`

Substituir `get_database_datasets` (filtro `database_id` proibido) por listagem paginada + filtro em Python:

```python
async def get_database_datasets(database_id: int) -> dict[str, Any]:
    page = 0
    page_size = 200
    matched: list[dict[str, Any]] = []
    total_count = 0
    while True:
        response = await superset_client.get(
            "/api/v1/dataset/",
            params={"q": f"(page:{page},page_size:{page_size})"},
        )
        result = response.get("result") or []
        if page == 0:
            total_count = int(response.get("count") or 0)
        for ds in result:
            db = ds.get("database") or {}
            if db.get("id") == database_id:
                matched.append(ds)
        page += 1
        if not result or page * page_size >= total_count:
            break
    return {"count": len(matched), "result": matched}
```

`delete_database` passa a chamar `get_database_datasets(database_id)` (mesmo helper).

Atualizar `backend/tests/test_sources.py::test_get_source_datasets` para o mock devolver `database.id` e assertar filtro.

### 1.2 Frontend — nome amigável

Helper em `frontend/lib/api/datasets.ts` (ou local):

```ts
export function datasetDisplayName(ds: {
  table_name: string
  description?: string | null
}): string {
  if (ds.description?.trim()) return ds.description.trim()
  return ds.table_name
    .replace(/^monisus_ds_/, "")
    .replace(/_[0-9a-f]{6}$/, "")
    .replace(/_/g, " ")
}
```

Usar em `dataset-selector.tsx` e nos cards de `fontes/[id]/page.tsx`.

Opcional mínimo (backend): em `publish_dataset`, se `description` vazio, persistir `name` como description para o display. Preferir só frontend primeiro (menos risco).

### 1.3 Frontend — `explorar/page.tsx`

1. Ler `datasetId` da URL (`searchParams.get("datasetId")`).
2. Após `listDatasets` carregar, se houver `datasetId`, achar no array e `handleSelectDataset`.
3. `handleDatasetPublished(datasetId)`:
   - `listDatasets().then(...).catch(...)` com erro visível;
   - dataset novo no array → `handleSelectDataset(novo)`.
4. Em `handleSelectDataset`, após colunas: **preview** `SELECT * FROM {table_name} LIMIT 100` via `executeQuery` (mesmo caminho do SQL manual), preenchendo `result` para a tabela aparecer.
5. Guardar nome amigável no state do dataset selecionado se necessário.

### 1.4 Frontend — `fontes/[id]/page.tsx`

- Trocar `catch {}` por state de erro (`datasetsError`) e banner igual aos demais.
- Card continua linkando `/explorar?datasetId=${dataset.id}` com display name amigável.

### 1.5 Teste manual ETAPA 1

1. Publish a partir do Explorar → toast/confirm OK.
2. Dropdown mostra nome amigável.
3. `/fontes/4` lista os datasets (não vazio).
4. Clique “Explorar dados” → dataset pré-selecionado + colunas + tabela LIMIT 100.
5. Visual/SQL continuam funcionando.
6. `make test` (backend) + lint frontend.

**Critérios de aceite ETAPA 1:** 1 confirmação · 2 lista · 3 abre · 4 colunas · 5 tabela · 6 reutilizável no Explorer.

Dívida (depois): `allow_ctas: False` em fontes novas (`sources.py:59`); timeout CTAS sem catch; sem rollback CTAS órfão; sem rota `/datasets`.

---

## ETAPA 2 — Exploração (`/explorar`)

Manter experiência atual. Abordagem mínima:
- Abas: ordenar/rotugar **SQL · Agente IA · Visual** (hoje: Construtor, Agente de IA, Consulta SQL) — só labels/ordem em `exploration-tabs.tsx`.
- SQL: SELECT/WITH + tabela (já ok).
- Visual: dimensão, métrica, agregação, tipo de gráfico (já ok em builder + visualization-panel).
- IA: manter `AiAgentTab` placeholder; **não** LangGraph.

Testar após ETAPA 1.

---

## ETAPA 3 — Salvar análise e gráfico

Hoje só existe **Salvar análise** (`query-result.tsx` → `saveAnalysis` com `chartType`).

Plano mínimo:
1. Em modo gráfico (`viewMode === "chart"`), expor **“Salvar gráfico”** (reutilizar `SaveAnalysisDialog`).
2. Em modo tabela, manter **“Salvar análise”**.
3. Storage: mesmo `localStorage` `monisus_analyses` — gráfico = `chartType !== "table"`. Sem versionamento.
4. Listagem: em `/analises` separar seções (ou badges) Análises vs Gráficos conforme `chartType`.

Arquivos: `query-result.tsx`, `save-analysis-dialog.tsx`, `analises/page.tsx`, talvez `lib/types/analysis.ts` (campo opcional `kind` se precisar — preferir derivar de `chartType`).

---

## ETAPA 4 — Dashboard

Hoje: `/paineis` + `/paineis/[id]` com `DashboardBuilder` (react-grid-layout, modo edição toggle). Widget referencia `analysisId`.

Plano:
1. Renomear rotas para **`/dashboards`** e **`/dashboard/:id`** (decisão do usuário).
   - Mover/renomear `app/(authenticated)/paineis` → `dashboards` com segmento `dashboard` para `/dashboard/:id` (Next: `app/(authenticated)/dashboards/page.tsx` e `app/(authenticated)/dashboard/[id]/page.tsx`).
   - Atualizar sidebar, links em `inicio`, `dashboard-builder`, `analises`, etc.
2. **Página própria de visualização**: `/dashboard/:id` abre em modo **view** (grid + filtros + refresh), sem chrome de edição; botão “Editar” leva a `/dashboard/:id/editar` ou toggle como hoje — mínimo: manter toggle mas garantir que a rota é página própria (já é).
3. Gráfico salvo (ETAPA 3) → “Adicionar ao Dashboard” já existe via `AddAnalysisDialog` — renomear copy para “Adicionar gráfico/análise”.
4. Layout grid 2 colunas já suportado pelo `ResponsiveGridLayout`.

Não implementar compartilhamento/embed agora.

---

## ETAPA 5 — Tela início `/inicio`

Reestruturar com identidade teal atual (não copiar Superset):

```
Olá, usuário
[ Buscar dashboards, análises, gráficos e datasets... ]  // busca local mínima ou estática se pesado
Recentes  (dashboards, análises, gráficos, datasets — dados reais)
Dashboards [Favoritos][Meus][Todos] + Dashboard   // se favoritos não existirem, simplificar para Meus/Todos ou só lista
Gráficos  ...
Análises
Conjuntos de Dados  (GET /api/datasets)
```

Dados reais: localStorage dashboards/análises + `listDatasets()`. Sem dados falsos.

---

## ETAPA 6 — Polimento

- loading/empty/error consistentes
- toast de sucesso (hoje banners inline — padronizar; sem lib nova se não houver)
- nomenclatura: Dashboard/Dataset/Análise/Gráfico
- espaçamento, botões, navegação
- checagem final do fluxo MVP ponta a ponta

---

## Fluxo final de aceite

LOGIN → INÍCIO → FONTES → dataset → EXPLORAR → SQL → executar → resultado → SALVAR COMO DATASET → catálogo → abrir → tabela → criar gráfico → salvar gráfico → Dashboard → adicionar gráfico → abrir Dashboard em página própria.

---

## Fora do escopo (depois)

- LangGraph / agente IA completo
- refatoração de pastas / novas abstrações
- versionamento de análises
- compartilhamento/embed de dashboard
- migração storage localStorage → backend
- rota `/datasets` dedicada
- fix `allow_ctas` em criação de fontes (dívida)

---

## Comandos de verificação

```bash
make test          # backend
make lint          # frontend + backend
# manual: fluxo ETAPA 1 no browser
```

Dataset de diagnóstico id 10: **não removido** (usuário escolheu só aplicar ETAPA 1 sem cleanup explícito); pode apagar no Superset se desejar.
