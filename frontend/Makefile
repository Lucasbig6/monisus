.PHONY: dev build start lint clean help

help: ## Mostra ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Inicia servidor de desenvolvimento
	npm run dev

build: ## Builda para produção
	npm run build

start: ## Inicia servidor de produção
	npm run start

lint: ## Roda lint
	npm run lint

clean: ## Limpa cache .next
	rm -rf .next
