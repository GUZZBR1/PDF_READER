from fastapi import FastAPI

from app.routes.image_to_pdf import router as image_to_pdf_router
from app.routes.merge import router as merge_router
from app.routes.pdf_to_image import router as pdf_to_image_router
from app.routes.remove_pages import router as remove_pages_router
from app.routes.rotate import router as rotate_router
from app.routes.split import router as split_router
from app.routes.upload import router as upload_router

app = FastAPI(title="Private PDF Tool")

app.include_router(image_to_pdf_router)
app.include_router(merge_router)
app.include_router(pdf_to_image_router)
app.include_router(remove_pages_router)
app.include_router(rotate_router)
app.include_router(split_router)
app.include_router(upload_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
