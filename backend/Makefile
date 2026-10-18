.PHONY: run build test db-up db-down tidy

run:
	go run ./cmd/api

build:
	go build -o bin/api ./cmd/api

test:
	go test ./...

db-up:
	docker compose up -d postgres

db-down:
	docker compose down

tidy:
	go mod tidy
