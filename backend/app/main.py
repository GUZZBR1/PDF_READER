from fastapi import FastAPI

app = FastAPI(title="Private PDF Tool")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
