import subprocess
from pathlib import Path

from fastapi import HTTPException, status

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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid compression level. Allowed levels are low, medium, and high.",
        )

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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PDF compression requires Ghostscript to be installed.",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start PDF compression.",
        ) from exc

    if result.returncode != 0:
        ghostscript_error = (
            result.stderr.strip() or "Ghostscript returned a non-zero exit code."
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compress PDF. {ghostscript_error[:500]}",
        )

    if not output_path.exists() or output_path.stat().st_size == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PDF compression did not create a valid output file.",
        )

    return output_path
