from pathlib import Path

from fastapi import HTTPException
from pypdf import PdfReader, PdfWriter

from app.utils.errors import invalid_page_ranges, missing_file, processing_failure


def remove_pdf_pages(
    input_path: Path,
    output_path: Path,
    pages_to_remove: list[int],
) -> Path:
    try:
        if not input_path.exists():
            raise missing_file("Uploaded PDF file was not found.")

        reader = PdfReader(str(input_path))
        total_pages = len(reader.pages)
        remove_indexes = set(pages_to_remove)

        if not remove_indexes:
            raise invalid_page_ranges("At least one page must be selected for removal.")

        if any(page_index < 0 or page_index >= total_pages for page_index in remove_indexes):
            raise invalid_page_ranges(
                f"Page removal selection is out of bounds. PDF has {total_pages} pages."
            )

        if len(remove_indexes) >= total_pages:
            raise invalid_page_ranges("Cannot remove all pages from a PDF.")

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
        raise processing_failure("Failed to remove pages from PDF file.") from exc
