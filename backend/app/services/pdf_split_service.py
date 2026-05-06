import re
from pathlib import Path

from fastapi import HTTPException, status
from pypdf import PdfReader, PdfWriter

PAGE_RANGE_PATTERN = re.compile(r"^\d+(?:-\d+)?$")


def parse_page_ranges(page_ranges: str, total_pages: int) -> list[int]:
    if not page_ranges or not page_ranges.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Page ranges cannot be empty.",
        )

    selected_pages: list[int] = []
    seen_pages: set[int] = set()

    for raw_part in page_ranges.split(","):
        part = raw_part.strip()

        if not part:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Page ranges cannot contain empty entries.",
            )

        if part.startswith("-") or "--" in part:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Page numbers must be positive integers.",
            )

        if not PAGE_RANGE_PATTERN.fullmatch(part):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid page range format. Use values like 1-3,5,7-9.",
            )

        if "-" in part:
            start_page, end_page = [int(value) for value in part.split("-", 1)]
        else:
            start_page = end_page = int(part)

        if start_page < 1 or end_page < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Page numbers must be positive integers.",
            )

        if start_page > end_page:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Page range start cannot be greater than page range end.",
            )

        if end_page > total_pages:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Page range is out of bounds. PDF has {total_pages} pages.",
            )

        for page_number in range(start_page, end_page + 1):
            page_index = page_number - 1

            if page_index not in seen_pages:
                selected_pages.append(page_index)
                seen_pages.add(page_index)

    return selected_pages


def split_pdf(
    input_path: Path,
    output_path: Path,
    selected_pages: list[int],
) -> Path:
    try:
        reader = PdfReader(str(input_path))
        writer = PdfWriter()

        for page_index in selected_pages:
            writer.add_page(reader.pages[page_index])

        output_path.parent.mkdir(parents=True, exist_ok=True)

        with output_path.open("wb") as output_file:
            writer.write(output_file)

        return output_path
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to split PDF file.",
        ) from exc
