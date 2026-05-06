from pathlib import Path

from fastapi import HTTPException, status
from pypdf import PdfReader, PdfWriter


def remove_pdf_pages(
    input_path: Path,
    output_path: Path,
    pages_to_remove: list[int],
) -> Path:
    try:
        reader = PdfReader(str(input_path))
        total_pages = len(reader.pages)
        remove_indexes = set(pages_to_remove)

        if not remove_indexes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one page must be selected for removal.",
            )

        if any(page_index < 0 or page_index >= total_pages for page_index in remove_indexes):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Page removal selection is out of bounds. PDF has {total_pages} pages.",
            )

        if len(remove_indexes) >= total_pages:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove all pages from a PDF.",
            )

        writer = PdfWriter()

        for page_index, page in enumerate(reader.pages):
            if page_index not in remove_indexes:
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
            detail="Failed to remove pages from PDF file.",
        ) from exc
