from pathlib import Path
from typing import List
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from starlette.background import BackgroundTask
from starlette.responses import FileResponse

from app.services.image_to_pdf_service import convert_images_to_pdf
from app.utils.file_utils import ensure_temp_dir, safe_delete_file, save_upload_file
from app.utils.validation import validate_image_upload

router = APIRouter(prefix="/image", tags=["image"])


@router.post("/to-pdf")
async def image_to_pdf(files: List[UploadFile] = File(...)) -> FileResponse:
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one image file is required.",
        )

    saved_paths: list[Path] = []
    output_path: Path | None = None

    try:
        for file in files:
            await validate_image_upload(file)
            extension = Path(file.filename or "").suffix.lower()
            saved_path, _ = await save_upload_file(file, extension=extension)
            saved_paths.append(saved_path)

        output_path = ensure_temp_dir() / f"images-to-pdf-{uuid4().hex}.pdf"
        convert_images_to_pdf(saved_paths, output_path)

        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename="images.pdf",
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
            detail="Failed to process image to PDF request.",
        ) from exc
    finally:
        for saved_path in saved_paths:
            safe_delete_file(saved_path)
