from pathlib import Path

from fastapi import UploadFile, status

from app.utils.errors import invalid_file, unsupported_format

DEFAULT_MAX_FILE_SIZE = 25 * 1024 * 1024
PDF_CONTENT_TYPES = {"application/pdf", "application/x-pdf"}
IMAGE_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def validate_pdf_extension(file: UploadFile) -> None:
    filename = file.filename or ""

    if Path(filename).suffix.lower() != ".pdf":
        raise invalid_file("Only PDF files with a .pdf extension are allowed.")


def validate_pdf_content_type(file: UploadFile) -> None:
    if not file.content_type:
        return

    if file.content_type.lower() not in PDF_CONTENT_TYPES:
        raise invalid_file("Invalid file content type. Only application/pdf is allowed.")


async def validate_file_size(
    file: UploadFile,
    max_size: int = DEFAULT_MAX_FILE_SIZE,
) -> None:
    total_size = 0
    chunk_size = 1024 * 1024

    try:
        while chunk := await file.read(chunk_size):
            total_size += len(chunk)

            if total_size > max_size:
                max_size_mb = max_size // (1024 * 1024)
                raise invalid_file(
                    detail=f"File is too large. Maximum size is {max_size_mb}MB.",
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                )
    finally:
        await file.seek(0)


async def validate_pdf_upload(
    file: UploadFile,
    max_size: int = DEFAULT_MAX_FILE_SIZE,
) -> None:
    validate_pdf_extension(file)
    validate_pdf_content_type(file)
    await validate_file_size(file, max_size=max_size)


def validate_image_extension(file: UploadFile) -> None:
    filename = file.filename or ""

    if Path(filename).suffix.lower() not in IMAGE_EXTENSIONS:
        raise unsupported_format("Only JPG, PNG, and WEBP image files are allowed.")


def validate_image_content_type(file: UploadFile) -> None:
    if not file.content_type:
        return

    if file.content_type.lower() not in IMAGE_CONTENT_TYPES:
        raise unsupported_format(
            "Invalid image content type. Only JPEG, PNG, and WEBP images are allowed."
        )


async def validate_image_upload(
    file: UploadFile,
    max_size: int = DEFAULT_MAX_FILE_SIZE,
) -> None:
    validate_image_extension(file)
    validate_image_content_type(file)
    await validate_file_size(file, max_size=max_size)
