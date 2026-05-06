from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from starlette.background import BackgroundTask
from starlette.responses import FileResponse

from app.services.pdf_compress_service import COMPRESSION_SETTINGS, compress_pdf
from app.utils.errors import invalid_compression_level, processing_failure
from app.utils.file_utils import create_temp_output_path, safe_delete_file, save_upload_file
from app.utils.validation import validate_pdf_upload

router = APIRouter(prefix="/pdf", tags=["pdf"])


@router.post("/compress")
async def compress_pdf_file(
    file: UploadFile = File(...),
    compression_level: str = Form("medium"),
) -> FileResponse:
    saved_path: Path | None = None
    output_path: Path | None = None
    normalized_level = compression_level.strip().lower()

    try:
        if normalized_level not in COMPRESSION_SETTINGS:
            raise invalid_compression_level()

        await validate_pdf_upload(file)
        saved_path, _ = await save_upload_file(file)

        output_path = create_temp_output_path("compressed", ".pdf")
        compress_pdf(saved_path, output_path, compression_level=normalized_level)

        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename="compressed.pdf",
            background=BackgroundTask(safe_delete_file, output_path),
        )
    except HTTPException:
        if output_path is not None:
            safe_delete_file(output_path)
        raise
    except Exception as exc:
        if output_path is not None:
            safe_delete_file(output_path)
        raise processing_failure("Failed to process PDF compress request.") from exc
    finally:
        if saved_path is not None:
            safe_delete_file(saved_path)
