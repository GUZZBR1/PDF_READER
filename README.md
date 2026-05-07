# Private PDF Tool

Private PDF Tool is a small local-first MVP for common PDF operations. It uses a
FastAPI backend for file processing and a Next.js frontend for the tool
workspace.

## Features

- Merge multiple PDFs into one file
- Split selected PDF pages into a new PDF
- Remove selected PDF pages
- Rotate all pages or selected page ranges
- Convert JPG, PNG, and WEBP images to a PDF
- Export PDF pages as PNG or JPEG images in a ZIP file
- Compress PDFs with low, medium, or high compression levels

## Tech Stack

- Backend: FastAPI, Python, PyPDF, Pillow, pdf2image
- Frontend: Next.js, React, TypeScript, App Router
- System tools: Ghostscript for compression, poppler-utils for PDF-to-image
- Runtime: Docker Compose for backend and frontend services

## Local Setup

Install frontend dependencies once:

```bash
cd frontend
npm install
```

The frontend uses `http://localhost:8000` by default. Override the backend URL
when needed:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

`NEXT_PUBLIC_BACKEND_BASE_URL` is still supported for compatibility.

## Docker Startup

Recommended MVP startup:

```bash
docker compose up --build
```

This starts:

- backend API: `http://localhost:8000`
- frontend app: `http://localhost:3000`

Health check:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "private-pdf-tool"
}
```

Copy `.env.example` to `.env` when deploying with custom URLs:

```bash
cp .env.example .env
```

Edit `.env` and replace `APP_PASSWORD` with a private value before exposing the
app.

Important: `NEXT_PUBLIC_API_URL` is compiled into the frontend image at build
time. Rebuild the frontend image after changing it.

Set `APP_PASSWORD` before using the protected tools. If it is empty, the
backend starts but protected tool routes return `401`.

## Environment Variables

| Variable | Used by | Default | Purpose |
| --- | --- | --- | --- |
| `APP_PASSWORD` | backend runtime | empty | Shared private password required for tool API requests |
| `NEXT_PUBLIC_API_URL` | frontend build | `http://localhost:8000` | Public browser URL for the backend API |
| `NEXT_PUBLIC_AUTH_ENABLED` | frontend build | `true` | Enables the frontend login gate |
| `NEXT_PUBLIC_BACKEND_BASE_URL` | frontend build | none | Legacy frontend API URL fallback |
| `ALLOWED_ORIGINS` | backend runtime | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated CORS origins |

For a remote VPS, `localhost` means the user's own machine in browser-side
JavaScript. Set `NEXT_PUBLIC_API_URL` to the public backend URL, such as
`http://your-vps-ip:8000`, and set `ALLOWED_ORIGINS` to the public frontend URL
before rebuilding. For a domain deployment, use the public HTTPS URLs.

## Private Access

This MVP uses lightweight shared-password protection for private deployments
only. It is not a full SaaS authentication system.

Frontend behavior:

- `/login` asks for the shared password.
- The password is stored in browser `localStorage`.
- Homepage and all tool pages redirect to `/login` when
  `NEXT_PUBLIC_AUTH_ENABLED=true` and no password is stored.
- Logout clears the stored password and redirects to `/login`.

Backend behavior:

- `/health` remains public.
- `/pdf/*`, `/image/*`, and `/upload/*` require the `x-app-password` header.
- Missing or invalid passwords return `401` with a JSON error message.
- No users, registration, database, sessions, or password reset flow exist.

Security limitations:

- Use HTTPS or a trusted private network before exposing this publicly.
- Anyone with browser/device access can inspect or clear the localStorage value.
- Rotating the password requires updating `APP_PASSWORD` and restarting the
  backend.
- Changing `NEXT_PUBLIC_AUTH_ENABLED` requires rebuilding the frontend image.

## Backend Startup

For backend-only Docker development:

```bash
APP_PASSWORD=replace-with-a-private-password docker compose up backend --build
```

The backend API runs on:

```text
http://localhost:8000
```

Health check:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "private-pdf-tool"
}
```

## Frontend Startup

In a second terminal:

```bash
cd frontend
npm run dev
```

Open:

```text
http://localhost:3000
```

Production build check:

```bash
cd frontend
npm run typecheck
npm run build
```

## Docker Usage

`docker-compose.yml` builds production-style images for both services. It does
not bind-mount source code by default, so it is closer to a small VPS runtime
than a hot-reload development setup.

Backend system dependencies are installed in `backend/Dockerfile`:

- `ghostscript`
- `poppler-utils`

The backend temp directory is mounted as container tmpfs at `/app/app/temp`.
Uploads and generated downloads should be removed by the app after each
response, and the tmpfs avoids persisting temporary files between container
restarts.

Runtime dependency checks:

```bash
docker compose exec backend gs --version
docker compose exec backend pdftoppm -v
docker compose exec backend python -c "import fastapi, pypdf, PIL, pdf2image"
```

## API Routes

| Method | Route | Purpose | Form fields |
| --- | --- | --- | --- |
| `GET` | `/health` | Service health | none |
| `POST` | `/upload/pdf` | Validate PDF upload | `file` |
| `POST` | `/pdf/merge` | Merge PDFs | `files` |
| `POST` | `/pdf/split` | Extract pages | `file`, `page_ranges` |
| `POST` | `/pdf/remove-pages` | Remove pages | `file`, `pages_to_remove` |
| `POST` | `/pdf/rotate` | Rotate pages | `file`, `pages_to_rotate`, `angle` |
| `POST` | `/image/to-pdf` | Convert images to PDF | `files` |
| `POST` | `/pdf/to-image` | Convert PDF to image ZIP | `file`, `image_format`, `dpi` |
| `POST` | `/pdf/compress` | Compress PDF | `file`, `compression_level` |

## Frontend Routes

- `/`
- `/merge`
- `/split`
- `/remove-pages`
- `/rotate`
- `/image-to-pdf`
- `/pdf-to-image`
- `/compress`

## Smoke Test Checklist

Before first deployment, run a full browser smoke test with Docker and the
frontend service running:

```bash
docker compose up --build
```

Use representative local files:

- small PDF
- multi-page PDF
- larger PDF
- image-heavy PDF
- JPG image
- PNG image
- WEBP image

Validate each frontend tool downloads an output file:

- Merge two or more PDFs and confirm page order
- Split with `1-3`, `5`, and `1-3,5,8-10`
- Remove selected pages and confirm remaining pages
- Rotate all pages and selected page ranges
- Convert JPG, PNG, and WEBP images to one PDF after reordering
- Convert a PDF to PNG and JPEG ZIP outputs at multiple DPI values
- Compress the same PDF with low, medium, and high levels and compare sizes

After each backend run, confirm the container temp directory is empty or only
contains `.gitkeep`:

```bash
docker compose exec backend find /app/app/temp -maxdepth 1 -type f -print
```

## Troubleshooting

- If the frontend loads but conversions fail, confirm the backend is reachable
  at `http://localhost:8000/health`.
- If browser requests are blocked by CORS, set `ALLOWED_ORIGINS` to the frontend
  origin, for example `https://pdf.example.com`.
- If the frontend calls the wrong backend URL, set `NEXT_PUBLIC_API_URL` and
  rebuild with `docker compose up --build`.
- If PDF-to-image fails in Docker, rebuild the backend image and confirm
  `poppler-utils` is installed.
- If compression fails in Docker, rebuild the backend image and confirm
  `ghostscript` is installed.
- If running outside Docker, the host machine must provide the Python
  dependencies in `backend/requirements.txt`, Ghostscript, and Poppler.
- `NEXT_PUBLIC_API_URL` controls the frontend backend URL. It defaults to
  `http://localhost:8000`.

## Production Notes

- This MVP exposes frontend and backend as separate ports: `3000` and `8000`.
- Put a reverse proxy or TLS termination in front of the services when deploying
  publicly.
- Keep uploaded files local to the backend container; no cloud storage or
  database is used.
- Rebuild after changing public frontend environment variables.
- Run the full smoke checklist after every deployment image rebuild.

## Development Notes

- The backend writes uploaded and generated files under `backend/app/temp`.
- Temporary uploads are deleted after processing.
- Download files are cleaned with response background tasks.
- Frontend requests are centralized in `frontend/src/lib/api.ts`.
- Shared frontend file helpers live in `frontend/src/lib/files.ts`.
- Authentication is a lightweight shared-password gate only; no database, cloud
  storage, OCR, queues, or user accounts are included in this MVP.
