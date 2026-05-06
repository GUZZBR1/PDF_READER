from pathlib import Path

from fastapi import HTTPException, status
from PIL import Image, UnidentifiedImageError

SUPPORTED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def convert_images_to_pdf(
    image_paths: list[Path],
    output_path: Path,
) -> Path:
    if not image_paths:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one image is required to create a PDF.",
        )

    converted_images: list[Image.Image] = []

    try:
        for image_path in image_paths:
            if image_path.suffix.lower() not in SUPPORTED_IMAGE_EXTENSIONS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Only JPG, PNG, and WEBP image files are supported.",
                )

            with Image.open(image_path) as image:
                converted_images.append(image.convert("RGB"))

        output_path.parent.mkdir(parents=True, exist_ok=True)
        first_image, *additional_images = converted_images
        first_image.save(
            output_path,
            "PDF",
            save_all=True,
            append_images=additional_images,
        )

        return output_path
    except HTTPException:
        raise
    except UnidentifiedImageError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more uploaded files could not be read as images.",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to convert images to PDF.",
        ) from exc
    finally:
        for image in converted_images:
            image.close()
