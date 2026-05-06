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
- Runtime: Docker Compose for the backend service

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

## Backend Startup

Recommended backend startup:

```bash
docker compose up --build
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

`docker-compose.yml` currently builds and runs the backend service only. The
frontend runs through the local Next.js scripts during MVP development.

Backend system dependencies are installed in `backend/Dockerfile`:

- `ghostscript`
- `poppler-utils`

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

## Development Notes

- The backend writes uploaded and generated files under `backend/app/temp`.
- Temporary uploads are deleted after processing.
- Download files are cleaned with response background tasks.
- Frontend requests are centralized in `frontend/src/lib/api.ts`.
- Shared frontend file helpers live in `frontend/src/lib/files.ts`.
- No authentication, database, cloud storage, OCR, queues, or user accounts are
  included in this MVP.
