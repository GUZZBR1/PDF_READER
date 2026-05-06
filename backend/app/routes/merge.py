from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from starlette.background import BackgroundTask
from starlette.responses import FileResponse

from app.services.pdf_merge_service import merge_pdfs
from app.utils.errors import invalid_request, processing_failure
from app.utils.file_utils import create_temp_output_path, safe_delete_file, save_upload_file
from app.utils.validation import validate_pdf_upload

router = APIRouter(prefix="/pdf", tags=["pdf"])


@router.post("/merge")
async def merge_pdf_files(files: list[UploadFile] = File(...)) -> FileResponse:
    if len(files) < 2:
        raise invalid_request("At least 2 PDF files are required to merge.")

    saved_paths: list[Path] = []
    output_path: Path | None = None

    try:
        for file in files:
            await validate_pdf_upload(file)
            saved_path, _ = await save_upload_file(file)
            saved_paths.append(saved_path)

        output_path = create_temp_output_path("merged", ".pdf")
        merge_pdfs(saved_paths, output_path)

        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename="merged.pdf",
            background=BackgroundTask(safe_delete_file, output_path),
        )
    except HTTPException:
        if output_path is not None:
            safe_delete_file(output_path)
        raise
    except Exception as exc:
        if output_path is not None:
            safe_delete_file(output_path)
        raise processing_failure("Failed to process PDF merge request.") from exc
    finally:
        for saved_path in saved_paths:
            safe_delete_file(saved_path)
