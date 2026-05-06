from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pypdf import PdfReader
from starlette.background import BackgroundTask
from starlette.responses import FileResponse

from app.services.pdf_split_service import parse_page_ranges, split_pdf
from app.utils.file_utils import ensure_temp_dir, safe_delete_file, save_upload_file
from app.utils.validation import validate_pdf_upload

router = APIRouter(prefix="/pdf", tags=["pdf"])


@router.post("/split")
async def split_pdf_file(
    file: UploadFile = File(...),
    page_ranges: str = Form(...),
) -> FileResponse:
    saved_path: Path | None = None
    output_path: Path | None = None

    try:
        await validate_pdf_upload(file)
        saved_path, _ = await save_upload_file(file)

        try:
            reader = PdfReader(str(saved_path))
            total_pages = len(reader.pages)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not read uploaded PDF file.",
            ) from exc

        selected_pages = parse_page_ranges(page_ranges, total_pages)
        output_path = ensure_temp_dir() / f"split-{uuid4().hex}.pdf"
        split_pdf(saved_path, output_path, selected_pages)

        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename="split.pdf",
            background=BackgroundTask(safe_delete_file, output_path),
        )
    except HTTPException:
        if output_path is not None:
            safe_delete_file(output_path)
        raise
    except Exception as exc:
        if output_path is not None:
            safe_delete_file(output_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process PDF split request.",
        ) from exc
    finally:
        if saved_path is not None:
            safe_delete_file(saved_path)
