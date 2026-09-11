from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

current_status = {"mode": "Available"}


class StatusUpdate(BaseModel):
    mode: str


@app.get("/health")
def health():
    return {"status": "online"}


@app.get("/status")
def get_status():
    return current_status


@app.post("/status")
def set_status(update: StatusUpdate):
    current_status["mode"] = update.mode
    return current_status
