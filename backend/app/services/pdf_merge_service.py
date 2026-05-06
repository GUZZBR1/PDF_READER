from pathlib import Path

from fastapi import HTTPException
from pypdf import PdfReader, PdfWriter

from app.utils.errors import missing_file, processing_failure


def merge_pdfs(input_paths: list[Path], output_path: Path) -> Path:
    try:
        writer = PdfWriter()

        for input_path in input_paths:
            if not input_path.exists():
                raise missing_file("One or more uploaded PDF files were not found.")

            reader = PdfReader(str(input_path))

            for page in reader.pages:
                writer.add_page(page)

        output_path.parent.mkdir(parents=True, exist_ok=True)

        with output_path.open("wb") as output_file:
            writer.write(output_file)

        return output_path
    except HTTPException:
        raise
    except Exception as exc:
        raise processing_failure("Failed to merge PDF files.") from exc
