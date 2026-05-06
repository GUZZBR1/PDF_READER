from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

from fastapi import HTTPException
from pdf2image import convert_from_path
from pdf2image.exceptions import PDFInfoNotInstalledError, PDFPageCountError, PDFSyntaxError

from app.utils.errors import (
    invalid_file,
    missing_file,
    processing_failure,
    unsupported_format,
)

SUPPORTED_OUTPUT_FORMATS = {"png", "jpeg"}


def convert_pdf_to_images(
    input_path: Path,
    output_dir: Path,
    image_format: str = "png",
    dpi: int = 200,
) -> list[Path]:
    normalized_format = image_format.strip().lower()

    if normalized_format not in SUPPORTED_OUTPUT_FORMATS:
        raise unsupported_format(
            "Invalid image format. Allowed formats are png and jpeg."
        )

    try:
        if not input_path.exists():
            raise missing_file("Uploaded PDF file was not found.")

        output_dir.mkdir(parents=True, exist_ok=True)
        generated_paths = convert_from_path(
            str(input_path),
            dpi=dpi,
            fmt=normalized_format,
            output_folder=str(output_dir),
            output_file="page",
            paths_only=True,
        )
        image_paths: list[Path] = []

        for index, generated_path in enumerate(generated_paths, start=1):
            image_path = output_dir / f"page-{index}.{normalized_format}"
            Path(generated_path).replace(image_path)
            image_paths.append(image_path)

        return image_paths
    except PDFInfoNotInstalledError as exc:
        raise processing_failure(
            "PDF to image conversion requires poppler-utils to be installed."
        ) from exc
    except (PDFPageCountError, PDFSyntaxError) as exc:
        raise invalid_file("Could not read uploaded PDF file.") from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise processing_failure("Failed to convert PDF to images.") from exc


def create_images_zip(
    image_paths: list[Path],
    output_zip_path: Path,
) -> Path:
    if not image_paths:
        raise processing_failure("No images were generated from the PDF.")

    try:
        output_zip_path.parent.mkdir(parents=True, exist_ok=True)

        with ZipFile(output_zip_path, "w", compression=ZIP_DEFLATED) as zip_file:
            for image_path in image_paths:
                zip_file.write(image_path, arcname=image_path.name)

        return output_zip_path
    except Exception as exc:
        raise processing_failure("Failed to create images ZIP file.") from exc
