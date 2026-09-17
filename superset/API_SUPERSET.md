# Superset API - Referencia Completa

> Base URL: `http://localhost:8088/api/v1`
> Swagger UI: `http://localhost:8088/swagger/v1`
> Credenciais: `admin` / `admin123`

## Autenticacao

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `POST` | `/security/login` | Login (retorna JWT) |
| `POST` | `/security/refresh` | Renovar JWT |
| `GET` | `/security/csrf_token/` | Obter token CSRF |
| `POST` | `/security/guest_token/` | Gerar token de visitante |

---

## Dashboards (~35 endpoints)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/dashboard/` | Listar dashboards |
| `POST` | `/dashboard/` | Criar dashboard |
| `GET` | `/dashboard/{id_or_slug}` | Obter dashboard |
| `PUT` | `/dashboard/{pk}` | Atualizar dashboard |
| `DELETE` | `/dashboard/{pk}` | Deletar dashboard |
| `DELETE` | `/dashboard/` | Deletar multiplos |
| `POST` | `/dashboard/{id_or_slug}/copy/` | Copiar dashboard |
| `GET` | `/dashboard/{id_or_slug}/charts` | Graficos do dashboard |
| `GET` | `/dashboard/{id_or_slug}/datasets` | Datasets do dashboard |
| `GET` | `/dashboard/{id_or_slug}/tabs` | Abas do dashboard |
| `POST` | `/dashboard/{pk}/favorites/` | Marcar como favorito |
| `DELETE` | `/dashboard/{pk}/favorites/` | Remover dos favoritos |
| `GET` | `/dashboard/favorite_status/` | Status de favoritos |
| `POST` | `/dashboard/{pk}/cache_dashboard_screenshot/` | Cachear screenshot |
| `GET` | `/dashboard/{pk}/screenshot/{digest}/` | Obter screenshot |
| `GET` | `/dashboard/{pk}/thumbnail/{digest}/` | Obter thumbnail |
| `POST` | `/dashboard/{pk}/export_xlsx/` | Exportar dados para Excel |
| `GET` | `/dashboard/export/` | Exportar dashboards (YAML) |
| `POST` | `/dashboard/import/` | Importar dashboards |
| `GET` | `/dashboard/_info` | Metadados |
| `GET` | `/dashboard/related/{column_name}` | Campos relacionados |
| **Embedding** | | |
| `GET` | `/dashboard/{id_or_slug}/embedded` | Obter config de embed |
| `POST` | `/dashboard/{id_or_slug}/embedded` | Criar config de embed |
| `PUT` | `/dashboard/{id_or_slug}/embedded` | Atualizar config de embed |
| `DELETE` | `/dashboard/{id_or_slug}/embedded` | Deletar config de embed |
| `GET` | `/embedded_dashboard/{uuid}` | Config de dashboard embutido |
| **Permalink** | | |
| `POST` | `/dashboard/{pk}/permalink` | Criar link permanente |
| `GET` | `/dashboard/permalink/{key}` | Obter link permanente |
| **Filtros** | | |
| `POST` | `/dashboard/{pk}/filter_state` | Criar estado de filtro |
| `GET` | `/dashboard/{pk}/filter_state/{key}` | Obter estado de filtro |
| `PUT` | `/dashboard/{pk}/filter_state/{key}` | Atualizar estado de filtro |
| `DELETE` | `/dashboard/{pk}/filter_state/{key}` | Deletar estado de filtro |
| `PUT` | `/dashboard/{pk}/filters` | Atualizar filtros nativos |
| `PUT` | `/dashboard/{pk}/colors` | Atualizar cores |
| `PUT` | `/dashboard/{pk}/chart_customizations` | Customizar graficos |
| **Versionamento** | | |
| `GET` | `/dashboard/{uuid}/versions/` | Historico de versoes |
| `GET` | `/dashboard/{uuid}/versions/{version_uuid}/` | Snapshot de versao |
| `POST` | `/dashboard/{uuid}/versions/{version_uuid}/restore` | Reverter versao |
| `GET` | `/dashboard/{uuid}/activity/` | Stream de atividade |
| `POST` | `/dashboard/{uuid}/restore` | Restaurar soft-deleted |
| `POST` | `/dashboard/{uuid}/purge` | Deletar permanentemente |

---

## Charts (~26 endpoints)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/chart/` | Listar graficos |
| `POST` | `/chart/` | Criar grafico |
| `GET` | `/chart/{id_or_uuid}` | Obter grafico |
| `PUT` | `/chart/{pk}` | Atualizar grafico |
| `DELETE` | `/chart/{pk}` | Deletar grafico |
| `DELETE` | `/chart/` | Deletar multiplos |
| `GET` | `/chart/{pk}/data/` | Dados do grafico |
| `POST` | `/chart/data` | Consultar dados do grafico |
| `PUT` | `/chart/warm_up_cache` | Aquecer cache |
| `POST` | `/chart/{pk}/favorites/` | Marcar como favorito |
| `DELETE` | `/chart/{pk}/favorites/` | Remover dos favoritos |
| `GET` | `/chart/favorite_status/` | Status de favoritos |
| `GET` | `/chart/{pk}/cache_screenshot/` | Cachear screenshot |
| `GET` | `/chart/{pk}/screenshot/{digest}/` | Obter screenshot |
| `GET` | `/chart/{pk}/thumbnail/{digest}/` | Obter thumbnail |
| `GET` | `/chart/{pk}/deck_layers/` | Sub-campos deck.gl |
| `GET` | `/chart/export/` | Exportar graficos (YAML) |
| `POST` | `/chart/import/` | Importar graficos |
| `GET` | `/chart/_info` | Metadados |
| `GET` | `/chart/related/{column_name}` | Campos relacionados |
| **Versionamento** | | |
| `GET` | `/chart/{uuid}/versions/` | Historico de versoes |
| `GET` | `/chart/{uuid}/versions/{version_uuid}/` | Snapshot de versao |
| `POST` | `/chart/{uuid}/versions/{version_uuid}/restore` | Reverter versao |
| `GET` | `/chart/{uuid}/activity/` | Stream de atividade |
| `POST` | `/chart/{uuid}/restore` | Restaurar soft-deleted |
| `POST` | `/chart/{uuid}/purge` | Deletar permanentemente |

---

## Datasets (~27 endpoints)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/dataset/` | Listar datasets |
| `POST` | `/dataset/` | Criar dataset |
| `GET` | `/dataset/{id_or_uuid}` | Obter dataset |
| `PUT` | `/dataset/{pk}` | Atualizar dataset |
| `DELETE` | `/dataset/{pk}` | Deletar dataset |
| `DELETE` | `/dataset/` | Deletar multiplos |
| `PUT` | `/dataset/{pk}/refresh` | Atualizar colunas |
| `GET` | `/dataset/{pk}/drill_info/` | Info de drill-down |
| `GET` | `/dataset/distinct/{column_name}` | Valores distintos |
| `POST` | `/dataset/duplicate` | Duplicar dataset |
| `GET` | `/dataset/{id_or_uuid}/related_objects` | Graficos/dashboards relacionados |
| `POST` | `/dataset/get_or_create/` | Obter ou criar tabela |
| `DELETE` | `/dataset/{pk}/column/{column_id}` | Deletar coluna |
| `DELETE` | `/dataset/{pk}/metric/{metric_id}` | Deletar metrica |
| `PUT` | `/dataset/warm_up_cache` | Aquecer cache |
| `GET` | `/dataset/export/` | Exportar datasets (YAML) |
| `POST` | `/dataset/import/` | Importar datasets |
| `GET` | `/dataset/_info` | Metadados |
| `GET` | `/dataset/related/{column_name}` | Campos relacionados |
| **Versionamento** | | |
| `GET` | `/dataset/{uuid}/versions/` | Historico de versoes |
| `GET` | `/dataset/{uuid}/versions/{version_uuid}/` | Snapshot de versao |
| `POST` | `/dataset/{uuid}/versions/{version_uuid}/restore` | Reverter versao |
| `GET` | `/dataset/{uuid}/activity/` | Stream de atividade |
| `POST` | `/dataset/{uuid}/restore` | Restaurar soft-deleted |
| `POST` | `/dataset/{uuid}/purge` | Deletar permanentemente |
| `GET` | `/dataset/{uuid}/purge-impact` | Impacto do purge |

---

## Databases (~30 endpoints)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/database/` | Listar databases |
| `POST` | `/database/` | Criar database |
| `GET` | `/database/{pk}` | Obter database |
| `PUT` | `/database/{pk}` | Atualizar database |
| `DELETE` | `/database/{pk}` | Deletar database |
| `POST` | `/database/test_connection/` | Testar conexao |
| `POST` | `/database/validate_parameters/` | Validar parametros |
| `GET` | `/database/available/` | Databases disponiveis |
| `GET` | `/database/{pk}/connection` | Info de conexao |
| `GET` | `/database/{pk}/schemas/` | Listar schemas |
| `GET` | `/database/{pk}/catalogs/` | Listar catalogs |
| `GET` | `/database/{pk}/tables/` | Listar tabelas |
| `GET` | `/database/{pk}/table_metadata/` | Metadados de tabela |
| `GET` | `/database/{pk}/table/{table}/{schema}/` | Metadados de tabela especifica |
| `GET` | `/database/{pk}/select_star/{table}/` | SELECT * de tabela |
| `GET` | `/database/{pk}/select_star/{table}/{schema}/` | SELECT * (com schema) |
| `GET` | `/database/{pk}/function_names/` | Funcoes SQL disponiveis |
| `GET` | `/database/{pk}/schemas_access_for_file_upload/` | Schemas para upload |
| `POST` | `/database/{pk}/validate_sql/` | Validar SQL |
| `POST` | `/database/{pk}/upload/` | Upload de arquivo para tabela |
| `POST` | `/database/{pk}/sync_permissions/` | Sincronizar permissoes |
| `GET` | `/database/{pk}/related_objects/` | Objetos relacionados |
| `POST` | `/database/upload_metadata/` | Metadados de upload |
| `GET` | `/database/oauth2/` | Tokens OAuth2 |
| `GET` | `/database/export/` | Exportar databases (ZIP) |
| `POST` | `/database/import/` | Importar databases |
| `GET` | `/database/_info` | Metadados |
| `GET` | `/database/related/{column_name}` | Campos relacionados |

---

## SQL Lab (~7 endpoints)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `POST` | `/sqllab/execute/` | Executar query SQL |
| `GET` | `/sqllab/results/` | Obter resultados |
| `GET` | `/sqllab/export/{client_id}/` | Exportar resultados (CSV) |
| `POST` | `/sqllab/export_streaming/` | Exportar resultados (streaming) |
| `POST` | `/sqllab/estimate/` | Estimar custo da query |
| `POST` | `/sqllab/format_sql/` | Formatar SQL |
| `GET` | `/sqllab/` | Bootstrap do SQL Lab |

---

## Saved Queries (~11 endpoints)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/saved_query/` | Listar queries salvas |
| `POST` | `/saved_query/` | Criar query salva |
| `GET` | `/saved_query/{pk}` | Obter query salva |
| `PUT` | `/saved_query/{pk}` | Atualizar query salva |
| `DELETE` | `/saved_query/{pk}` | Deletar query salva |
| `DELETE` | `/saved_query/` | Deletar multiplos |
| `GET` | `/saved_query/distinct/{column_name}` | Valores distintos |
| `GET` | `/saved_query/export/` | Exportar (YAML) |
| `POST` | `/saved_query/import/` | Importar |
| `GET` | `/saved_query/_info` | Metadados |
| `GET` | `/saved_query/related/{column_name}` | Campos relacionados |

---

## Queries (~6 endpoints)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/query/` | Listar queries |
| `GET` | `/query/{pk}` | Obter query |
| `POST` | `/query/stop` | Parar query em execucao |
| `GET` | `/query/distinct/{column_name}` | Valores distintos |
| `GET` | `/query/updated_since` | Queries atualizadas desde |
| `GET` | `/query/related/{column_name}` | Campos relacionados |

---

## Datasources (~6 endpoints)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/datasource/` | Listar datasources |
| `GET` | `/datasource/{type}/{id}` | Obter metadados do datasource |
| `GET` | `/datasource/{type}/{id}/column/{col}/values/` | Valores de coluna |
| `POST` | `/datasource/{type}/{id}/compatible` | Metricas/dimensoes compativeis |
| `POST` | `/datasource/{type}/{id}/query` | Consulta por defs semanticas |
| `POST` | `/datasource/{type}/{id}/validate_expression/` | Validar expressao SQL |

---

## Seguranca & Controle de Acesso (~50 endpoints)

### Autenticacao & Usuarios

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/me/` | Informacoes do usuario atual |
| `PUT` | `/me/` | Atualizar perfil |
| `GET` | `/me/preferences/` | Preferencias do usuario |

### Usuarios

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/security/users/` | Listar usuarios |
| `POST` | `/security/users/` | Criar usuario |
| `GET` | `/security/users/{pk}` | Obter usuario |
| `PUT` | `/security/users/{pk}` | Atualizar usuario |
| `DELETE` | `/security/users/{pk}` | Deletar usuario |
| `DELETE` | `/security/users/{pk}/sessions` | Deletar sessoes |
| `GET` | `/security/users/_info` | Metadados |

### Roles

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/security/roles/` | Listar roles |
| `POST` | `/security/roles/` | Criar role |
| `GET` | `/security/roles/{pk}` | Obter role |
| `PUT` | `/security/roles/{pk}` | Atualizar role |
| `DELETE` | `/security/roles/{pk}` | Deletar role |
| `PUT` | `/security/roles/{id}/groups` | Atualizar grupos da role |
| `POST` | `/security/roles/{id}/permissions` | Criar permissoes da role |
| `GET` | `/security/roles/{id}/permissions/` | Obter permissoes da role |
| `PUT` | `/security/roles/{id}/users` | Atualizar usuarios da role |
| `GET` | `/security/roles/search/` | Buscar roles |

### Grupos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/security/groups/` | Listar grupos |
| `POST` | `/security/groups/` | Criar grupo |
| `GET` | `/security/groups/{pk}` | Obter grupo |
| `PUT` | `/security/groups/{pk}` | Atualizar grupo |
| `DELETE` | `/security/groups/{pk}` | Deletar grupo |

### Permissoes & Recursos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/security/permissions/` | Listar permissoes |
| `GET` | `/security/permissions/{pk}` | Obter permissao |
| `GET` | `/security/resources/` | Listar recursos |
| `POST` | `/security/resources/` | Criar recurso |
| `GET` | `/security/resources/{pk}` | Obter recurso |
| `PUT` | `/security/resources/{pk}` | Atualizar recurso |
| `DELETE` | `/security/resources/{pk}` | Deletar recurso |
| `GET` | `/security/permissions-resources/` | Listar perm-recurso |
| `POST` | `/security/permissions-resources/` | Criar perm-recurso |
| `GET` | `/security/permissions-resources/{pk}` | Obter perm-recurso |
| `PUT` | `/security/permissions-resources/{pk}` | Atualizar perm-recurso |
| `DELETE` | `/security/permissions-resources/{pk}` | Deletar perm-recurso |

### Row Level Security (RLS)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/rowlevelsecurity/` | Listar regras RLS |
| `POST` | `/rowlevelsecurity/` | Criar regra RLS |
| `GET` | `/rowlevelsecurity/{pk}` | Obter regra RLS |
| `PUT` | `/rowlevelsecurity/{pk}` | Atualizar regra RLS |
| `DELETE` | `/rowlevelsecurity/{pk}` | Deletar regra RLS |
| `DELETE` | `/rowlevelsecurity/` | Deletar multiplos |

---

## Tags (~15 endpoints)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/tag/` | Listar tags |
| `POST` | `/tag/` | Criar tag |
| `GET` | `/tag/{pk}` | Obter tag |
| `PUT` | `/tag/{pk}` | Atualizar tag |
| `DELETE` | `/tag/{pk}` | Deletar tag |
| `DELETE` | `/tag/` | Deletar multiplos |
| `POST` | `/tag/bulk_create` | Criar tags em massa |
| `POST` | `/tag/{object_type}/{object_id}/` | Adicionar tag a objeto |
| `DELETE` | `/tag/{object_type}/{object_id}/{tag}/` | Remover tag de objeto |
| `POST` | `/tag/{pk}/favorites/` | Favoritar tag |
| `DELETE` | `/tag/{pk}/favorites/` | Desfavoritar tag |
| `GET` | `/tag/favorite_status/` | Status de favoritos |
| `GET` | `/tag/get_objects/` | Objetos de uma tag |
| `GET` | `/tag/_info` | Metadados |
| `GET` | `/tag/related/{column_name}` | Campos relacionados |

---

## Annotation Layers (~14 endpoints)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/annotation_layer/` | Listar camadas |
| `POST` | `/annotation_layer/` | Criar camada |
| `GET` | `/annotation_layer/{pk}` | Obter camada |
| `PUT` | `/annotation_layer/{pk}` | Atualizar camada |
| `DELETE` | `/annotation_layer/{pk}` | Deletar camada |
| `GET` | `/annotation_layer/{pk}/annotation/` | Listar anotacoes |
| `POST` | `/annotation_layer/{pk}/annotation/` | Criar anotacao |
| `GET` | `/annotation_layer/{pk}/annotation/{id}` | Obter anotacao |
| `PUT` | `/annotation_layer/{pk}/annotation/{id}` | Atualizar anotacao |
| `DELETE` | `/annotation_layer/{pk}/annotation/{id}` | Deletar anotacao |

---

## Reports & Scheduling (~13 endpoints)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/report/` | Listar report schedules |
| `POST` | `/report/` | Criar schedule |
| `GET` | `/report/{pk}` | Obter schedule |
| `PUT` | `/report/{pk}` | Atualizar schedule |
| `DELETE` | `/report/{pk}` | Deletar schedule |
| `POST` | `/report/{pk}/execute` | Executar imediatamente |
| `GET` | `/report/{pk}/log/` | Logs de execucao |
| `GET` | `/report/{pk}/log/{log_id}` | Log especifico |
| `POST` | `/report/subscribe` | Inscrever-se no report |
| `GET` | `/report/slack_channels/` | Canais Slack disponiveis |
| `GET` | `/report/related/{column_name}` | Campos relacionados |

---

## Temas (~15 endpoints)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/theme/` | Listar temas |
| `POST` | `/theme/` | Criar tema |
| `GET` | `/theme/{pk}` | Obter tema |
| `PUT` | `/theme/{pk}` | Atualizar tema |
| `DELETE` | `/theme/{pk}` | Deletar tema |
| `GET` | `/theme/{pk}/logo/` | Logo do tema |
| `GET` | `/theme/{pk}/favicon/` | Favicon do tema |
| `GET` | `/theme/export/` | Exportar temas (YAML) |
| `POST` | `/theme/import/` | Importar temas |

---

## CSS Templates (~8 endpoints)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/css_template/` | Listar templates CSS |
| `POST` | `/css_template/` | Criar template |
| `GET` | `/css_template/{pk}` | Obter template |
| `PUT` | `/css_template/{pk}` | Atualizar template |
| `DELETE` | `/css_template/{pk}` | Deletar template |

---

## Explore (~5 endpoints)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/explore/` | Montar info de exploracao |
| `POST` | `/explore/form_data` | Criar form data |
| `GET` | `/explore/form_data/{key}` | Obter form data |
| `PUT` | `/explore/form_data/{key}` | Atualizar form data |
| `DELETE` | `/explore/form_data/{key}` | Deletar form data |
| `POST` | `/explore/permalink` | Criar link permanente |
| `GET` | `/explore/permalink/{key}` | Obter link permanente |

---

## Import/Export & Admin

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/assets/export/` | Exportar todos os assets |
| `POST` | `/assets/import/` | Importar multiplos assets |
| `POST` | `/cachekey/invalidate` | Invalidar cache |
| `GET` | `/log/` | Listar logs |
| `GET` | `/log/{pk}` | Obter log |
| `GET` | `/log/recent_activity/` | Atividade recente |

---

## Misc

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/menu/` | Menu de navegacao |
| `GET` | `/async_event/` | Stream SSE de eventos |
| `GET` | `/advanced_data_type/convert` | Converter tipo avancado |
| `GET` | `/advanced_data_type/types` | Listar tipos avancados |
| `GET` | `/_openapi` | Spec OpenAPI |

---

## Total: ~280+ endpoints

> Spec OpenAPI completa: `http://localhost:8088/api/v1/_openapi`
> Documentacao oficial: https://superset.apache.org/docs/api/
