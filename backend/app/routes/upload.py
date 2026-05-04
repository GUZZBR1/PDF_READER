from fastapi import APIRouter, File, UploadFile

from app.utils.file_utils import save_upload_file
from app.utils.validation import validate_pdf_upload

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/pdf")
async def upload_pdf(file: UploadFile = File(...)) -> dict[str, str]:
    await validate_pdf_upload(file)
    file_path, filename = await save_upload_file(file)

    return {
        "message": "PDF uploaded successfully",
        "filename": filename,
        "path": str(file_path),
    }
