import json
import os

import psycopg
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, Form, Response
from openai import OpenAI
from pydantic import BaseModel

load_dotenv()

app = FastAPI()

DATABASE_URL = os.environ["DATABASE_URL"]
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_MODEL = "gpt-4o-mini"

openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


def get_connection():
    return psycopg.connect(DATABASE_URL)


CALL_CLASSIFICATION_SCHEMA = {
    "type": "object",
    "properties": {
        "caller_name": {
            "type": ["string", "null"],
            "description": "The caller's first name, or null if never stated.",
        },
        "company": {
            "type": ["string", "null"],
            "description": "Company/organization the caller represents, or null if none.",
        },
        "caller_type": {
            "type": "string",
            "enum": [
                "family",
                "friend",
                "recruiter",
                "delivery",
                "apartment",
                "unknown",
                "spam",
            ],
            "description": "Best-guess category. Use 'unknown' if it can't be determined from the transcript.",
        },
        "intent": {
            "type": "string",
            "description": "Short phrase for why they're calling, e.g. 'job opportunity', 'social invite'.",
        },
        "priority": {
            "type": "string",
            "enum": ["high", "normal", "low"],
            "description": "Use 'normal' unless the transcript clearly signals urgency or importance.",
        },
        "message": {
            "type": "string",
            "description": "One-sentence message to relay to Bharath, in the caller's own words where possible.",
        },
        "recommended_action": {
            "type": "string",
            "description": (
                "Short recommendation for Bharath, e.g. 'Call back today', "
                "'No action needed', 'Reply when free'. This is a suggestion "
                "only — Bharath decides what actually happens."
            ),
        },
    },
    "required": [
        "caller_name",
        "company",
        "caller_type",
        "intent",
        "priority",
        "message",
        "recommended_action",
    ],
    "additionalProperties": False,
}

CLASSIFICATION_INSTRUCTIONS = (
    "You are screening a phone call for Bharath's personal assistant. "
    "You will receive the caller's raw spoken answers to two questions: "
    "who's calling and what it's regarding, and whether it's urgent. "
    "Never invent a name, company, or detail that wasn't stated or clearly "
    "implied. caller_name and company must come directly from what was said "
    "— use null if not given. caller_type may be reasonably inferred from "
    "context (e.g. someone discussing a job application or interview is a "
    "'recruiter' even if they never say the word); use 'unknown' only when "
    "there's genuinely no signal either way."
)


def classify_call(call_sid: str) -> None:
    if openai_client is None:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE calls SET ai_error = %s WHERE call_sid = %s;",
                    ("OPENAI_API_KEY not configured", call_sid),
                )
            conn.commit()
        return

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT caller_name, reason, urgency FROM calls WHERE call_sid = %s;",
                (call_sid,),
            )
            row = cur.fetchone()

    if row is None:
        return

    raw_intro, _raw_reason, raw_urgency = row
    transcript = (
        f"When asked who's calling and what it's regarding, the caller said: "
        f"{raw_intro or '(no answer)'}\n"
        f"When asked if it's urgent, the caller said: {raw_urgency or '(no answer)'}"
    )

    try:
        response = openai_client.responses.create(
            model=OPENAI_MODEL,
            instructions=CLASSIFICATION_INSTRUCTIONS,
            input=transcript,
            text={
                "format": {
                    "type": "json_schema",
                    "name": "call_classification",
                    "schema": CALL_CLASSIFICATION_SCHEMA,
                    "strict": True,
                }
            },
            timeout=15,
        )
        result = json.loads(response.output_text)

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE calls
                    SET ai_name = %s, ai_company = %s, ai_type = %s,
                        ai_intent = %s, ai_priority = %s, ai_message = %s,
                        ai_recommended_action = %s, ai_error = NULL
                    WHERE call_sid = %s;
                    """,
                    (
                        result["caller_name"],
                        result["company"],
                        result["caller_type"],
                        result["intent"],
                        result["priority"],
                        result["message"],
                        result["recommended_action"],
                        call_sid,
                    ),
                )
            conn.commit()
    except Exception as exc:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE calls SET ai_error = %s WHERE call_sid = %s;",
                    (str(exc)[:500], call_sid),
                )
            conn.commit()


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
        '<Gather input="speech" action="/voice/intro" method="POST" '
        'speechTimeout="auto" timeout="5" actionOnEmptyResult="true">'
        "<Say>May I ask who's calling and what this is regarding?</Say>"
        "</Gather>"
        "</Response>"
    )
    return Response(content=twiml, media_type="application/xml")


@app.post("/voice/intro")
def voice_intro(CallSid: str = Form(...), SpeechResult: str = Form("")):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE calls SET caller_name = %s, reason = %s WHERE call_sid = %s;",
                (SpeechResult or None, SpeechResult or None, CallSid),
            )
        conn.commit()

    return gather_response("Is this urgent?", "/voice/urgency")


@app.post("/voice/urgency")
def voice_urgency(
    background_tasks: BackgroundTasks,
    CallSid: str = Form(...),
    SpeechResult: str = Form(""),
):
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

    background_tasks.add_task(classify_call, CallSid)

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
def get_calls(limit: int = 20):
    limit = max(1, min(limit, 500))
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, phone_number, caller_name, reason, urgency,
                       started_at, ended_at, status,
                       ai_name, ai_company, ai_type, ai_intent,
                       ai_priority, ai_message, ai_error,
                       ai_recommended_action, dismissed_at
                FROM calls
                ORDER BY started_at DESC
                LIMIT %s;
                """,
                (limit,),
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
            "ai_name": row[8],
            "ai_company": row[9],
            "ai_type": row[10],
            "ai_intent": row[11],
            "ai_priority": row[12],
            "ai_message": row[13],
            "ai_error": row[14],
            "ai_recommended_action": row[15],
            "dismissed_at": row[16].isoformat() if row[16] else None,
        }
        for row in rows
    ]


@app.post("/calls/{call_id}/dismiss")
def dismiss_call(call_id: int):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE calls
                SET dismissed_at = now()
                WHERE id = %s
                RETURNING dismissed_at;
                """,
                (call_id,),
            )
            row = cur.fetchone()
        conn.commit()
    if row is None:
        return Response(status_code=404)
    return {"dismissed_at": row[0].isoformat()}


@app.delete("/calls/old")
def delete_old_calls(days: int = 30):
    days = max(1, min(days, 3650))
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                DELETE FROM calls
                WHERE started_at < now() - make_interval(days => %s);
                """,
                (days,),
            )
            deleted = cur.rowcount
        conn.commit()
    return {"deleted": deleted}
