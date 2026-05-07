from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response

from app.config import get_allowed_origins
from app.routes.compress import router as compress_router
from app.routes.image_to_pdf import router as image_to_pdf_router
from app.routes.merge import router as merge_router
from app.routes.pdf_to_image import router as pdf_to_image_router
from app.routes.remove_pages import router as remove_pages_router
from app.routes.rotate import router as rotate_router
from app.routes.split import router as split_router
from app.routes.upload import router as upload_router
from app.utils.auth import validate_app_password

app = FastAPI(
    title="Private PDF Tool",
    description="Private backend API for personal PDF utilities.",
    version="0.1.0",
)


@app.middleware("http")
async def require_private_password(request: Request, call_next) -> Response:
    if request.method == "OPTIONS":
        return await call_next(request)

    auth_error = validate_app_password(request)

    if auth_error is not None:
        return auth_error

    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(compress_router)
app.include_router(image_to_pdf_router)
app.include_router(merge_router)
app.include_router(pdf_to_image_router)
app.include_router(remove_pages_router)
app.include_router(rotate_router)
app.include_router(split_router)
app.include_router(upload_router)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "private-pdf-tool"}
