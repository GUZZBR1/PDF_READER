import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from starlette.background import BackgroundTask
from starlette.responses import FileResponse

from app.services.pdf_to_image_service import (
    SUPPORTED_OUTPUT_FORMATS,
    convert_pdf_to_images,
    create_images_zip,
)
from app.utils.file_utils import ensure_temp_dir, safe_delete_file, save_upload_file
from app.utils.validation import validate_pdf_upload

router = APIRouter(prefix="/pdf", tags=["pdf"])

MIN_DPI = 72
MAX_DPI = 300


def delete_directory(directory_path: Path) -> None:
    if directory_path.exists() and directory_path.is_dir():
        shutil.rmtree(directory_path)


@router.post("/to-image")
async def pdf_to_image(
    file: UploadFile = File(...),
    image_format: str = Form("png"),
    dpi: int = Form(200),
) -> FileResponse:
    saved_path: Path | None = None
    output_dir: Path | None = None
    output_zip_path: Path | None = None
    normalized_format = image_format.strip().lower()

    try:
        if normalized_format not in SUPPORTED_OUTPUT_FORMATS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image format. Allowed formats are png and jpeg.",
            )

        if dpi < MIN_DPI or dpi > MAX_DPI:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid DPI. Allowed range is 72 to 300.",
            )

        await validate_pdf_upload(file)
        saved_path, _ = await save_upload_file(file)

        temp_dir = ensure_temp_dir()
        output_dir = temp_dir / f"pdf-images-{uuid4().hex}"
        output_zip_path = temp_dir / f"pdf-images-{uuid4().hex}.zip"

        image_paths = convert_pdf_to_images(
            saved_path,
            output_dir,
            image_format=normalized_format,
            dpi=dpi,
        )
        create_images_zip(image_paths, output_zip_path)

        if output_dir is not None:
            delete_directory(output_dir)

        return FileResponse(
            path=output_zip_path,
            media_type="application/zip",
            filename="pdf-images.zip",
            background=BackgroundTask(safe_delete_file, output_zip_path),
        )
    except HTTPException:
        if output_zip_path is not None:
            safe_delete_file(output_zip_path)
        raise
    except Exception as exc:
        if output_zip_path is not None:
            safe_delete_file(output_zip_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process PDF to image request.",
        ) from exc
    finally:
        if saved_path is not None:
            safe_delete_file(saved_path)
        if output_dir is not None:
            delete_directory(output_dir)
