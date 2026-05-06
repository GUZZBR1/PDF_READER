import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.config import TEMP_DIR


def ensure_temp_dir() -> Path:
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    return TEMP_DIR


def _is_in_temp_dir(path: Path) -> bool:
    try:
        resolved_path = path.resolve()
        temp_root = TEMP_DIR.resolve()
        resolved_path.relative_to(temp_root)
    except ValueError:
        return False

    return resolved_path != temp_root


def normalize_extension(extension: str = ".pdf") -> str:
    normalized_extension = extension.strip().lower()

    if not normalized_extension:
        normalized_extension = ".pdf"

    if not normalized_extension.startswith("."):
        normalized_extension = f".{normalized_extension}"

    if "/" in normalized_extension or "\\" in normalized_extension:
        raise ValueError("File extension cannot contain path separators.")

    if not normalized_extension[1:].isalnum():
        raise ValueError("File extension must contain only letters and numbers.")

    return normalized_extension


def generate_safe_filename(extension: str = ".pdf") -> str:
    return f"{uuid4().hex}{normalize_extension(extension)}"


def create_temp_output_path(prefix: str, extension: str = ".pdf") -> Path:
    temp_dir = ensure_temp_dir()
    safe_prefix = _safe_prefix(prefix)
    filename = f"{safe_prefix}-{generate_safe_filename(extension)}"
    return temp_dir / filename


def create_temp_output_dir(prefix: str) -> Path:
    temp_dir = ensure_temp_dir()
    safe_prefix = _safe_prefix(prefix)
    output_dir = temp_dir / f"{safe_prefix}-{uuid4().hex}"
    output_dir.mkdir(parents=True, exist_ok=False)
    return output_dir


def _safe_prefix(prefix: str) -> str:
    normalized_prefix = prefix.strip().lower().replace("_", "-")
    safe_prefix = "".join(
        character if character.isalnum() or character == "-" else "-"
        for character in normalized_prefix
    ).strip("-")

    return safe_prefix or "output"


async def save_upload_file(file: UploadFile, extension: str = ".pdf") -> tuple[Path, str]:
    temp_dir = ensure_temp_dir()
    filename = generate_safe_filename(extension)
    file_path = temp_dir / filename

    try:
        with file_path.open("wb") as output_file:
            while chunk := await file.read(1024 * 1024):
                output_file.write(chunk)
    except Exception:
        safe_delete_file(file_path)
        raise

    await file.seek(0)
    return file_path, filename


def safe_delete_file(file_path: Path | str) -> None:
    path = Path(file_path)

    if path.exists() and path.is_file() and _is_in_temp_dir(path):
        path.unlink()


def safe_delete_directory(directory_path: Path | str) -> None:
    path = Path(directory_path)

    if path.exists() and path.is_dir() and _is_in_temp_dir(path):
        shutil.rmtree(path)
