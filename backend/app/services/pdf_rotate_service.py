from pathlib import Path

from fastapi import HTTPException, status
from pypdf import PdfReader, PdfWriter

ALLOWED_ROTATION_ANGLES = {90, 180, 270}


def rotate_pdf_pages(
    input_path: Path,
    output_path: Path,
    pages_to_rotate: list[int],
    angle: int,
) -> Path:
    if angle not in ALLOWED_ROTATION_ANGLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid rotation angle. Allowed angles are 90, 180, and 270.",
        )

    try:
        reader = PdfReader(str(input_path))
        total_pages = len(reader.pages)
        rotate_indexes = set(pages_to_rotate)

        if not rotate_indexes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one page must be selected for rotation.",
            )

        if any(page_index < 0 or page_index >= total_pages for page_index in rotate_indexes):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Page rotation selection is out of bounds. PDF has {total_pages} pages.",
            )

        writer = PdfWriter()

        for page_index, page in enumerate(reader.pages):
            if page_index in rotate_indexes:
                page.rotate(angle)

            writer.add_page(page)

        output_path.parent.mkdir(parents=True, exist_ok=True)

        with output_path.open("wb") as output_file:
            writer.write(output_file)

        return output_path
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to rotate PDF pages.",
        ) from exc
