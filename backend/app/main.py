from fastapi import FastAPI

from app.routes.upload import router as upload_router

app = FastAPI(title="Private PDF Tool")

app.include_router(upload_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
