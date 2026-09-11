import os

import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel

load_dotenv()

app = FastAPI()

DATABASE_URL = os.environ["DATABASE_URL"]


def get_connection():
    return psycopg.connect(DATABASE_URL)


class StatusUpdate(BaseModel):
    mode: str


@app.get("/health")
def health():
    return {"status": "online"}


@app.get("/status")
def get_status():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT mode FROM user_status ORDER BY id LIMIT 1;"
            )
            row = cur.fetchone()
    return {"mode": row[0]}


@app.post("/status")
def set_status(update: StatusUpdate):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE user_status
                SET mode = %s, updated_at = now()
                WHERE id = (SELECT id FROM user_status ORDER BY id LIMIT 1)
                RETURNING mode;
                """,
                (update.mode,),
            )
            row = cur.fetchone()
        conn.commit()
    return {"mode": row[0]}
