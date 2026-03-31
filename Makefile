.PHONY: dev qa prod down logs mock-api

## ── 로컬 개발 (hot-reload, port 4000) ────────────────────────────────────────
dev:
	docker compose -p econ-dev -f docker-compose.dev.yml up --build

## ── QA 환경 (빌드된 nginx, port 4100) ────────────────────────────────────────
qa:
	docker compose -p econ-qa -f docker-compose.staging.yml up --build

## ── PROD 환경 (빌드된 nginx, port 3200) ──────────────────────────────────────
prod:
	docker compose -p econ-prod up --build

## ── 모든 환경 종료 ────────────────────────────────────────────────────────────
down:
	docker compose -p econ-dev -f docker-compose.dev.yml down 2>/dev/null; \
	docker compose -p econ-qa -f docker-compose.staging.yml down 2>/dev/null; \
	docker compose -p econ-prod down 2>/dev/null; true

## ── Mock API 단독 실행 (Docker 없이) ─────────────────────────────────────────
mock-api:
	cd mock-api && npm install && node server.js

## ── 로그 확인 ─────────────────────────────────────────────────────────────────
logs-dev:
	docker compose -p econ-dev -f docker-compose.dev.yml logs -f

logs-qa:
	docker compose -p econ-qa -f docker-compose.staging.yml logs -f

logs-prod:
	docker compose -p econ-prod logs -f
