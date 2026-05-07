from hmac import compare_digest

from fastapi import Request
from starlette.responses import JSONResponse

from app.config import APP_PASSWORD

APP_PASSWORD_HEADER = "x-app-password"
PROTECTED_PATH_PREFIXES = ("/pdf", "/image", "/upload")


def is_protected_path(path: str) -> bool:
    return any(
        path == prefix or path.startswith(f"{prefix}/")
        for prefix in PROTECTED_PATH_PREFIXES
    )


def validate_app_password(request: Request) -> JSONResponse | None:
    if not is_protected_path(request.url.path):
        return None

    provided_password = request.headers.get(APP_PASSWORD_HEADER, "")

    if not APP_PASSWORD:
        return JSONResponse(
            status_code=401,
            content={"detail": "Private access password is not configured."},
        )

    if compare_digest(provided_password, APP_PASSWORD):
        return None

    return JSONResponse(
        status_code=401,
        content={"detail": "Invalid or missing private access password."},
    )
