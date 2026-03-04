# Device Telemetry Monitor — run locally or via Docker

IMAGE_NAME := device-telemetry-monitor
PORT := 3000

# Run dev server locally (npm run dev)
run:
	npm run dev

# Build production locally
build:
	npm run build

# Start production server locally (after build)
start:
	npm run start

# --- Docker ---

# Build Docker image
docker-build:
	docker build -t $(IMAGE_NAME):latest .

# Run container (port 3000). Backend on host: set BACKEND_URL so app can reach it.
# On Docker Desktop (Mac/Windows): host.docker.internal
docker-run:
	docker run --rm -p $(PORT):3000 \
		-e BACKEND_URL=http://host.docker.internal:8080 \
		$(IMAGE_NAME):latest

# Run with custom backend URL
# Example: make docker-run-backend BACKEND_URL=http://192.168.1.10:8080
docker-run-backend:
	docker run --rm -p $(PORT):3000 \
		-e BACKEND_URL=$(BACKEND_URL) \
		$(IMAGE_NAME):latest

.PHONY: run build start docker-build docker-run docker-run-backend
