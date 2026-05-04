from pathlib import Path

from fastapi import HTTPException, UploadFile, status

DEFAULT_MAX_FILE_SIZE = 25 * 1024 * 1024
PDF_CONTENT_TYPES = {"application/pdf", "application/x-pdf"}


def validate_pdf_extension(file: UploadFile) -> None:
    filename = file.filename or ""

    if Path(filename).suffix.lower() != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files with a .pdf extension are allowed.",
        )


def validate_pdf_content_type(file: UploadFile) -> None:
    if not file.content_type:
        return

    if file.content_type.lower() not in PDF_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file content type. Only application/pdf is allowed.",
        )


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
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File is too large. Maximum size is {max_size_mb}MB.",
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
