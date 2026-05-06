from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pypdf import PdfReader
from starlette.background import BackgroundTask
from starlette.responses import FileResponse

from app.services.pdf_remove_pages_service import remove_pdf_pages
from app.services.pdf_split_service import parse_page_ranges
from app.utils.errors import invalid_file, invalid_page_ranges, processing_failure
from app.utils.file_utils import create_temp_output_path, safe_delete_file, save_upload_file
from app.utils.validation import validate_pdf_upload

router = APIRouter(prefix="/pdf", tags=["pdf"])


@router.post("/remove-pages")
async def remove_pages_from_pdf(
    file: UploadFile = File(...),
    pages_to_remove: str = Form(...),
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
            raise invalid_file("Could not read uploaded PDF file.") from exc

        remove_indexes = parse_page_ranges(pages_to_remove, total_pages)

        if len(remove_indexes) >= total_pages:
            raise invalid_page_ranges("Cannot remove all pages from a PDF.")

        output_path = create_temp_output_path("removed-pages", ".pdf")
        remove_pdf_pages(saved_path, output_path, remove_indexes)

        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename="removed-pages.pdf",
            background=BackgroundTask(safe_delete_file, output_path),
        )
    except HTTPException:
        if output_path is not None:
            safe_delete_file(output_path)
        raise
    except Exception as exc:
        if output_path is not None:
            safe_delete_file(output_path)
        raise processing_failure("Failed to process PDF remove-pages request.") from exc
    finally:
        if saved_path is not None:
            safe_delete_file(saved_path)
