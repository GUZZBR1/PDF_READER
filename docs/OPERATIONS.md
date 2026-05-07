# Operations Guide

This guide covers routine operation for a private Docker Compose deployment.

## Start

From the repository directory:

```bash
docker compose up -d --build
```

Use `--build` after code changes, Dockerfile changes, dependency changes, or
frontend environment changes.

## Stop

Stop containers without removing them:

```bash
docker compose stop
```

Stop and remove the Compose containers and network:

```bash
docker compose down
```

The app stores uploaded files only as temporary data. The configured backend
temp directory is tmpfs in Docker Compose, so temporary files are cleared when
the backend container stops.

## Restart

Restart both services:

```bash
docker compose restart
```

Restart one service:

```bash
docker compose restart backend
docker compose restart frontend
```

## View Logs

All services:

```bash
docker compose logs -f
```

Backend only:

```bash
docker compose logs -f backend
```

Frontend only:

```bash
docker compose logs -f frontend
```

Recent logs:

```bash
docker compose logs --tail=200 backend
```

## Update from GitHub

From the repository directory:

```bash
git checkout main
git pull origin main
docker compose up -d --build
```

Then check:

```bash
docker compose ps
curl http://127.0.0.1:8000/health
```

Run the smoke checklist after updates:

```text
docs/SMOKE_TEST.md
```

## Rebuild Containers

Rebuild everything:

```bash
docker compose build --no-cache
docker compose up -d
```

Rebuild only the frontend after changing `NEXT_PUBLIC_API_URL` or
`NEXT_PUBLIC_AUTH_ENABLED`:

```bash
docker compose build frontend
docker compose up -d frontend
```

Rebuild only the backend after changing Python code or backend dependencies:

```bash
docker compose build backend
docker compose up -d backend
```

## Clean Docker Cache Safely

Inspect disk usage first:

```bash
docker system df
```

Remove unused build cache:

```bash
docker builder prune
```

Remove dangling images:

```bash
docker image prune
```

Avoid broad cleanup commands such as `docker system prune --volumes` unless you
understand what else is running on the host. This app does not require named
volumes, but the host may run other services that do.

## Rotate or Change APP_PASSWORD

1. Edit `.env`.
2. Replace `APP_PASSWORD` with the new strong value.
3. Restart the backend:

```bash
docker compose up -d --force-recreate backend
```

4. In each browser, click logout or clear the saved password.
5. Log in with the new password.

No database migration is needed. There are no user accounts or sessions.

## Known Runtime Dependencies

Backend container:

- Python 3.11 slim image
- FastAPI and Python dependencies from `backend/requirements.txt`
- Ghostscript for PDF compression
- Poppler utilities for PDF-to-image conversion

Frontend container:

- Node 22 slim image
- Next.js production build
- Public frontend environment variables compiled at build time

Validate backend tools:

```bash
docker compose exec backend gs --version
docker compose exec backend pdftoppm -v
docker compose exec backend python -c "import fastapi, pypdf, PIL, pdf2image"
```

## Health Checks

Backend health endpoint:

```bash
curl http://127.0.0.1:8000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "private-pdf-tool"
}
```

Compose health status:

```bash
docker compose ps
```

## Common Issues

`APP_PASSWORD` error at startup:

- Create `.env`.
- Set a non-empty `APP_PASSWORD`.
- Start again.

Frontend points to the wrong backend:

- Set `NEXT_PUBLIC_API_URL` to the browser-reachable backend URL.
- Rebuild the frontend container.

CORS blocks requests:

- Set `ALLOWED_ORIGINS` to the exact frontend URL.
- Restart the backend.

Tool route returns `401`:

- Confirm the browser was logged in with the current `APP_PASSWORD`.
- Use logout and log in again after password rotation.

PDF-to-image or compression fails:

- Confirm Poppler and Ghostscript are available inside the backend container.
- Rebuild the backend image if dependencies are missing.
