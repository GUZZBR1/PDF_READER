from pathlib import Path

from fastapi import APIRouter, File, UploadFile

from app.utils.file_utils import safe_delete_file, save_upload_file
from app.utils.validation import validate_pdf_upload

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/pdf")
async def upload_pdf(file: UploadFile = File(...)) -> dict[str, str]:
    file_path: Path | None = None

    await validate_pdf_upload(file)

    try:
        file_path, filename = await save_upload_file(file)

        return {
            "message": "PDF uploaded successfully",
            "filename": filename,
        }
    finally:
        if file_path is not None:
            safe_delete_file(file_path)
