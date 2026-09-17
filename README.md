# Monisus

## Superset

Dashboard de BI baseado em [Apache Superset](https://superset.apache.org/).

### Stack

- **Apache Superset** - Plataforma de visualizacao de dados
- **PostgreSQL 15** - Banco de dados de metadados
- **Redis 7** - Cache e async queries

### Iniciar

```bash
cd superset
docker compose up -d
```

### Acessar

- **URL:** http://localhost:8088
- **Login:** `admin`
- **Senha:** `admin123`

### API

- **Swagger UI:** http://localhost:8088/swagger/v1
- **Documentacao:** `superset/API_SUPERSET.md`
