import subprocess
from pathlib import Path

from app.utils.errors import (
    invalid_compression_level,
    missing_file,
    processing_failure,
)

COMPRESSION_SETTINGS = {
    "low": "/printer",
    "medium": "/ebook",
    "high": "/screen",
}


def compress_pdf(
    input_path: Path,
    output_path: Path,
    compression_level: str = "medium",
) -> Path:
    normalized_level = compression_level.strip().lower()

    if normalized_level not in COMPRESSION_SETTINGS:
        raise invalid_compression_level()

    if not input_path.exists():
        raise missing_file("Uploaded PDF file was not found.")

    output_path.parent.mkdir(parents=True, exist_ok=True)

    command = [
        "gs",
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        f"-dPDFSETTINGS={COMPRESSION_SETTINGS[normalized_level]}",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        f"-sOutputFile={output_path}",
        str(input_path),
    ]

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError as exc:
        raise processing_failure(
            "PDF compression requires Ghostscript to be installed."
        ) from exc
    except Exception as exc:
        raise processing_failure("Failed to start PDF compression.") from exc

    if result.returncode != 0:
        ghostscript_error = (
            result.stderr.strip() or "Ghostscript returned a non-zero exit code."
        )
        raise processing_failure(f"Failed to compress PDF. {ghostscript_error[:500]}")

    if not output_path.exists() or output_path.stat().st_size == 0:
        raise processing_failure("PDF compression did not create a valid output file.")

    return output_path
