from pathlib import Path
from typing import List
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from starlette.background import BackgroundTask
from starlette.responses import FileResponse

from app.services.pdf_merge_service import merge_pdfs
from app.utils.file_utils import ensure_temp_dir, safe_delete_file, save_upload_file
from app.utils.validation import validate_pdf_upload

router = APIRouter(prefix="/pdf", tags=["pdf"])


@router.post("/merge")
async def merge_pdf_files(files: List[UploadFile] = File(...)) -> FileResponse:
    if len(files) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 PDF files are required to merge.",
        )

    saved_paths: list[Path] = []
    output_path: Path | None = None

    try:
        for file in files:
            await validate_pdf_upload(file)
            saved_path, _ = await save_upload_file(file)
            saved_paths.append(saved_path)

        output_path = ensure_temp_dir() / f"merged-{uuid4().hex}.pdf"
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process PDF merge request.",
        ) from exc
    finally:
        for saved_path in saved_paths:
            safe_delete_file(saved_path)
