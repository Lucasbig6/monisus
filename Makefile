.PHONY: dev dev-f dev-b build lint test stop stop-f stop-b superset-up superset-down superset-seed db-up db-down db-migrate db-seed down clean help

help: ## Mostra ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Inicia frontend + backend
	@make dev-f & make dev-b

dev-f: ## Inicia apenas frontend
	$(MAKE) -C frontend dev

dev-b: ## Inicia apenas backend
	$(MAKE) -C backend dev

stop: ## Para frontend + backend
	@make stop-f || true
	@make stop-b || true

stop-f: ## Para apenas frontend
	@pkill -f "next dev" 2>/dev/null && echo "Frontend parado" || echo "Frontend não rodando"

stop-b: ## Para apenas backend
	@pkill -f "uvicorn" 2>/dev/null && echo "Backend parado" || echo "Backend não rodando"

build: ## Builda frontend
	$(MAKE) -C frontend build

lint: ## Roda lint em todos
	$(MAKE) -C frontend lint
	$(MAKE) -C backend lint

test: ## Roda testes em todos
	$(MAKE) -C backend test

superset-up: ## Sobe Superset (Docker)
	cd superset && docker compose up -d

superset-down: ## Para Superset
	cd superset && docker compose down

superset-seed: ## Popula dados DEMO no Superset
	@echo "Recriando container Superset com volume do seed..."
	cd superset && docker compose up -d --build superset
	@echo "Aguardando Superset ficar pronto..."
	@sleep 5
	@echo "Executando seed..."
	docker exec superset_app python /app/seed_demo.py

db-up: ## Sobe o PostgreSQL do Saude360 (porta 5433)
	docker compose up -d saude360-postgres

db-down: ## Para o PostgreSQL do Saude360
	docker compose stop saude360-postgres

db-migrate: ## Aplica migrations do Alembic no banco do Saude360
	cd backend && .venv/bin/alembic upgrade head

db-seed: ## Seed inicial (roles + usuário admin)
	cd backend && .venv/bin/python -m app.db.seed

down: ## Para tudo (frontend + backend + superset)
	@make stop
	@make superset-down

clean: ## Limpa caches
	$(MAKE) -C frontend clean
	$(MAKE) -C backend clean
