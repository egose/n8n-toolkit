SHELL := /bin/bash
.DEFAULT_GOAL := help
.PHONY: help up down destroy reset logs logs-follow ps

DAEMON ?= false
COMPOSE := docker compose -f ./sandbox/docker-compose.yml
DOCKERFILE := packages/agent/Dockerfile
IMAGE := dfft-agent:latest

UP_FLAGS := up --build --remove-orphans
ifeq ($(DAEMON),true)
	UP_FLAGS += -d
endif

DOWN_FLAGS := down
DESTROY_FLAGS := down --volumes --rmi all --remove-orphans
LOGS_FLAGS := logs --tail=50

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## start the stack (DAEMON=true for detached)
	$(COMPOSE) $(UP_FLAGS)

down: ## stop the stack
	$(COMPOSE) $(DOWN_FLAGS)

destroy: ## stop + remove containers, volumes, and images
	$(COMPOSE) $(DESTROY_FLAGS)
	docker volume rm n8tool_mongodb_data n8tool_postgres_data n8tool_redis_data n8tool_gitea_data n8tool_seaweedfs_data || true
	docker image prune -f

reset: destroy up ## destroy then up

logs: ## show recent logs (tail=50)
	$(COMPOSE) $(LOGS_FLAGS)

logs-follow: ## tail logs live
	$(COMPOSE) logs -f

ps: ## list running compose services
	$(COMPOSE) ps
