import os

import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, Form, Response
from pydantic import BaseModel

load_dotenv()

app = FastAPI()

DATABASE_URL = os.environ["DATABASE_URL"]


def get_connection():
    return psycopg.connect(DATABASE_URL)


class StatusUpdate(BaseModel):
    mode: str


def gather_response(question: str, action: str) -> Response:
    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<Response>"
        f'<Gather input="speech" action="{action}" method="POST" '
        'speechTimeout="auto" timeout="5" actionOnEmptyResult="true">'
        f"<Say>{question}</Say>"
        "</Gather>"
        "</Response>"
    )
    return Response(content=twiml, media_type="application/xml")


@app.get("/health")
def health():
    return {"status": "online"}


@app.post("/voice")
def voice(CallSid: str = Form(...), From: str = Form(...)):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO calls (call_sid, phone_number, status)
                VALUES (%s, %s, 'in_progress')
                ON CONFLICT (call_sid) DO NOTHING;
                """,
                (CallSid, From),
            )
        conn.commit()

    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<Response>"
        "<Say>Hi, you've reached Bharath's assistant.</Say>"
        '<Gather input="speech" action="/voice/name" method="POST" '
        'speechTimeout="auto" timeout="5" actionOnEmptyResult="true">'
        "<Say>May I ask who's calling?</Say>"
        "</Gather>"
        "</Response>"
    )
    return Response(content=twiml, media_type="application/xml")


@app.post("/voice/name")
def voice_name(CallSid: str = Form(...), SpeechResult: str = Form("")):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE calls SET caller_name = %s WHERE call_sid = %s;",
                (SpeechResult or None, CallSid),
            )
        conn.commit()

    return gather_response("What is this regarding?", "/voice/reason")


@app.post("/voice/reason")
def voice_reason(CallSid: str = Form(...), SpeechResult: str = Form("")):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE calls SET reason = %s WHERE call_sid = %s;",
                (SpeechResult or None, CallSid),
            )
        conn.commit()

    return gather_response("Is this urgent?", "/voice/urgency")


@app.post("/voice/urgency")
def voice_urgency(CallSid: str = Form(...), SpeechResult: str = Form("")):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE calls
                SET urgency = %s, status = 'completed', ended_at = now()
                WHERE call_sid = %s;
                """,
                (SpeechResult or None, CallSid),
            )
        conn.commit()

    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<Response>"
        "<Say>Thanks, I'll pass that along. Goodbye.</Say>"
        "<Hangup/>"
        "</Response>"
    )
    return Response(content=twiml, media_type="application/xml")


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


@app.get("/calls")
def get_calls():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, phone_number, caller_name, reason, urgency,
                       started_at, ended_at, status
                FROM calls
                ORDER BY started_at DESC
                LIMIT 20;
                """
            )
            rows = cur.fetchall()
    return [
        {
            "id": row[0],
            "phone_number": row[1],
            "caller_name": row[2],
            "reason": row[3],
            "urgency": row[4],
            "started_at": row[5].isoformat(),
            "ended_at": row[6].isoformat() if row[6] else None,
            "status": row[7],
        }
        for row in rows
    ]
