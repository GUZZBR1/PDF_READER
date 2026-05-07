import os
from pathlib import Path

TEMP_DIR = Path(__file__).resolve().parent / "temp"

DEFAULT_ALLOWED_ORIGINS = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
)


def get_allowed_origins() -> list[str]:
    configured_origins = os.getenv("ALLOWED_ORIGINS", "")

    if not configured_origins.strip():
        return list(DEFAULT_ALLOWED_ORIGINS)

    return [
        origin.strip()
        for origin in configured_origins.split(",")
        if origin.strip()
    ]
