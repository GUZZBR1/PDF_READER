from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from starlette.background import BackgroundTask
from starlette.responses import FileResponse

from app.services.pdf_to_image_service import (
    SUPPORTED_OUTPUT_FORMATS,
    convert_pdf_to_images,
    create_images_zip,
)
from app.utils.errors import invalid_request, processing_failure, unsupported_format
from app.utils.file_utils import (
    create_temp_output_dir,
    create_temp_output_path,
    safe_delete_directory,
    safe_delete_file,
    save_upload_file,
)
from app.utils.validation import validate_pdf_upload

router = APIRouter(prefix="/pdf", tags=["pdf"])

MIN_DPI = 72
MAX_DPI = 300


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
            raise unsupported_format(
                "Invalid image format. Allowed formats are png and jpeg."
            )

        if dpi < MIN_DPI or dpi > MAX_DPI:
            raise invalid_request("Invalid DPI. Allowed range is 72 to 300.")

        await validate_pdf_upload(file)
        saved_path, _ = await save_upload_file(file)

        output_dir = create_temp_output_dir("pdf-images")
        output_zip_path = create_temp_output_path("pdf-images", ".zip")

        image_paths = convert_pdf_to_images(
            saved_path,
            output_dir,
            image_format=normalized_format,
            dpi=dpi,
        )
        create_images_zip(image_paths, output_zip_path)

        if output_dir is not None:
            safe_delete_directory(output_dir)

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
        raise processing_failure("Failed to process PDF to image request.") from exc
    finally:
        if saved_path is not None:
            safe_delete_file(saved_path)
        if output_dir is not None:
            safe_delete_directory(output_dir)
