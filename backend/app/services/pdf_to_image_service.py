from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

from fastapi import HTTPException, status
from pdf2image import convert_from_path
from pdf2image.exceptions import PDFInfoNotInstalledError, PDFPageCountError, PDFSyntaxError

SUPPORTED_OUTPUT_FORMATS = {"png", "jpeg"}


def convert_pdf_to_images(
    input_path: Path,
    output_dir: Path,
    image_format: str = "png",
    dpi: int = 200,
) -> list[Path]:
    normalized_format = image_format.strip().lower()

    if normalized_format not in SUPPORTED_OUTPUT_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Allowed formats are png and jpeg.",
        )

    try:
        output_dir.mkdir(parents=True, exist_ok=True)
        pages = convert_from_path(
            str(input_path),
            dpi=dpi,
            fmt=normalized_format,
        )
        image_paths: list[Path] = []

        for index, page in enumerate(pages, start=1):
            image_path = output_dir / f"page-{index}.{normalized_format}"
            page.save(image_path, normalized_format.upper())
            image_paths.append(image_path)
            page.close()

        return image_paths
    except PDFInfoNotInstalledError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PDF to image conversion requires poppler-utils to be installed.",
        ) from exc
    except (PDFPageCountError, PDFSyntaxError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read uploaded PDF file.",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to convert PDF to images.",
        ) from exc


def create_images_zip(
    image_paths: list[Path],
    output_zip_path: Path,
) -> Path:
    if not image_paths:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No images were generated from the PDF.",
        )

    try:
        output_zip_path.parent.mkdir(parents=True, exist_ok=True)

        with ZipFile(output_zip_path, "w", compression=ZIP_DEFLATED) as zip_file:
            for image_path in image_paths:
                zip_file.write(image_path, arcname=image_path.name)

        return output_zip_path
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create images ZIP file.",
        ) from exc
