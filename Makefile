.PHONY: dev dev-f dev-b build lint test stop stop-f stop-b superset-up superset-down down clean help

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

down: ## Para tudo (frontend + backend + superset)
	@make stop
	@make superset-down

clean: ## Limpa caches
	$(MAKE) -C frontend clean
	$(MAKE) -C backend clean
