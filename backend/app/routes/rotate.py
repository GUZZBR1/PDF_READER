from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pypdf import PdfReader
from starlette.background import BackgroundTask
from starlette.responses import FileResponse

from app.services.pdf_rotate_service import ALLOWED_ROTATION_ANGLES, rotate_pdf_pages
from app.services.pdf_split_service import parse_page_ranges
from app.utils.errors import invalid_angle, invalid_file, processing_failure
from app.utils.file_utils import create_temp_output_path, safe_delete_file, save_upload_file
from app.utils.validation import validate_pdf_upload

router = APIRouter(prefix="/pdf", tags=["pdf"])


@router.post("/rotate")
async def rotate_pdf_file(
    file: UploadFile = File(...),
    pages_to_rotate: str = Form(...),
    angle: int = Form(...),
) -> FileResponse:
    saved_path: Path | None = None
    output_path: Path | None = None

    try:
        if angle not in ALLOWED_ROTATION_ANGLES:
            raise invalid_angle()

        await validate_pdf_upload(file)
        saved_path, _ = await save_upload_file(file)

        try:
            reader = PdfReader(str(saved_path))
            total_pages = len(reader.pages)
        except Exception as exc:
            raise invalid_file("Could not read uploaded PDF file.") from exc

        if pages_to_rotate.strip().lower() == "all":
            rotate_indexes = list(range(total_pages))
        else:
            rotate_indexes = parse_page_ranges(pages_to_rotate, total_pages)

        output_path = create_temp_output_path("rotated", ".pdf")
        rotate_pdf_pages(saved_path, output_path, rotate_indexes, angle)

        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename="rotated.pdf",
            background=BackgroundTask(safe_delete_file, output_path),
        )
    except HTTPException:
        if output_path is not None:
            safe_delete_file(output_path)
        raise
    except Exception as exc:
        if output_path is not None:
            safe_delete_file(output_path)
        raise processing_failure("Failed to process PDF rotate request.") from exc
    finally:
        if saved_path is not None:
            safe_delete_file(saved_path)
