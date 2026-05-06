from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.config import TEMP_DIR


def ensure_temp_dir() -> Path:
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    return TEMP_DIR


def generate_safe_filename(extension: str = ".pdf") -> str:
    normalized_extension = extension if extension.startswith(".") else f".{extension}"
    return f"{uuid4().hex}{normalized_extension.lower()}"


async def save_upload_file(file: UploadFile, extension: str = ".pdf") -> tuple[Path, str]:
    temp_dir = ensure_temp_dir()
    filename = generate_safe_filename(extension)
    file_path = temp_dir / filename

    with file_path.open("wb") as output_file:
        while chunk := await file.read(1024 * 1024):
            output_file.write(chunk)

    await file.seek(0)
    return file_path, filename


def safe_delete_file(file_path: Path | str) -> None:
    path = Path(file_path)

    if path.exists() and path.is_file():
        path.unlink()
