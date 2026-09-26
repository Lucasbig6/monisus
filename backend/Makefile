.PHONY: dev test lint format install clean help check-venv

help: ## Mostra ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

check-venv:
	@test -x .venv/bin/uvicorn || { echo "Erro: backend/.venv não encontrado. Rode: make -C backend install"; exit 1; }

dev: check-venv ## Inicia servidor com reload
	.venv/bin/uvicorn app.main:app --reload

test: check-venv ## Roda testes
	.venv/bin/pytest

lint: check-venv ## Verifica código com ruff
	.venv/bin/ruff check .

format: ## Formata código com ruff
	.venv/bin/ruff format .

install: ## Instala dependências
	pip install -e ".[dev]"

clean: ## Limpa caches
	rm -rf .pytest_cache .ruff_cache __pycache__ app/__pycache__ tests/__pycache__
