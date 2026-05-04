from pathlib import Path

from fastapi import HTTPException, status
from pypdf import PdfReader, PdfWriter


def merge_pdfs(input_paths: list[Path], output_path: Path) -> Path:
    try:
        writer = PdfWriter()

        for input_path in input_paths:
            reader = PdfReader(str(input_path))

            for page in reader.pages:
                writer.add_page(page)

        output_path.parent.mkdir(parents=True, exist_ok=True)

        with output_path.open("wb") as output_file:
            writer.write(output_file)

        return output_path
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to merge PDF files.",
        ) from exc
