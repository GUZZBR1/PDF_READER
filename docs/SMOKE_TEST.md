# Smoke Test Checklist

Run this checklist after a deployment, rebuild, or runtime dependency change.
Use real local files and verify each downloaded output opens correctly.

## Test Files

Prepare:

- small PDF
- multi-page PDF with at least 10 pages
- larger PDF
- image-heavy PDF
- JPG image
- PNG image
- WEBP image

## Environment

Start the app:

```bash
docker compose up -d --build
```

Check services:

```bash
docker compose ps
curl http://127.0.0.1:8000/health
```

Open the frontend at the configured URL, usually:

```text
http://localhost:3000
```

## Login

- Open the frontend.
- Confirm unauthenticated access redirects to `/login`.
- Enter the configured `APP_PASSWORD`.
- Confirm the homepage loads.
- Confirm no password is displayed in the UI.

## Merge PDFs

- Open Merge PDFs.
- Upload at least two PDFs.
- Start the merge.
- Confirm the button disables or shows loading while processing.
- Download the merged PDF.
- Open the result and confirm page order matches the upload order.

## Split PDF

Use a multi-page PDF.

- Split with `1-3`.
- Split with `5`.
- Split with `1-3,5,8-10`.
- Open each downloaded PDF.
- Confirm the resulting pages match the requested ranges.
- Try an invalid range and confirm a visible error message appears.

## Remove Pages

- Upload a multi-page PDF.
- Remove a middle page or range.
- Download the result.
- Confirm removed pages are absent and remaining pages stay in order.
- Try an invalid page input and confirm a visible error message appears.

## Rotate PDF

- Upload a PDF with visible page orientation.
- Rotate all pages.
- Download and confirm all pages rotated.
- Rotate specific pages only.
- Download and confirm only selected pages changed.
- Test supported angles and confirm invalid inputs are rejected.

## Image to PDF

- Upload JPG, PNG, and WEBP images.
- Reorder images if the UI supports it.
- Convert to PDF.
- Open the downloaded PDF.
- Confirm image order and orientation match the UI order.

## PDF to Image

- Upload a multi-page PDF.
- Export PNG.
- Export JPEG.
- Test more than one DPI value.
- Open each ZIP.
- Confirm one image exists per exported page.
- Confirm image filenames and formats are correct.

## Compress PDF

- Upload the same PDF for each level.
- Run low compression.
- Run medium compression.
- Run high compression.
- Compare output file sizes.
- Open each compressed PDF and confirm it is readable.
- Note that some already-optimized PDFs may not shrink significantly.

## Logout

- Click logout.
- Confirm the app redirects to `/login`.
- Confirm tool pages redirect to `/login` until the password is entered again.

## Temp Cleanup Check

After running all tools, inspect the backend temp directory:

```bash
docker compose exec backend find /app/app/temp -mindepth 1 -maxdepth 1 -print
```

Expected result:

- no stale uploaded PDFs
- no stale generated PDFs
- no stale image export folders
- no stale ZIP files

If files remain after downloads complete, inspect backend logs:

```bash
docker compose logs --tail=200 backend
```

## Runtime Dependency Checks

Run inside the backend container:

```bash
docker compose exec backend gs --version
docker compose exec backend pdftoppm -v
docker compose exec backend python -c "import fastapi, pypdf, PIL, pdf2image"
```

All commands should complete without missing binary or import errors.
