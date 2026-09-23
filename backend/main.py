import json
import os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, Form, HTTPException, Response
from openai import OpenAI
from pydantic import BaseModel

load_dotenv()

app = FastAPI()

DATABASE_URL = os.environ["DATABASE_URL"]
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_MODEL = "gpt-4o-mini"
TRANSFER_PHONE_NUMBER = os.environ.get("TRANSFER_PHONE_NUMBER")
LOCAL_TIMEZONE = ZoneInfo("America/New_York")

openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

CALLER_TYPES = [
    "family",
    "friend",
    "recruiter",
    "delivery",
    "apartment",
    "unknown",
    "spam",
]
CONTACT_PRIORITIES = ["critical", "high", "normal", "low"]


def get_connection():
    return psycopg.connect(DATABASE_URL)


def decide_action(caller_type: str, priority: str, mode: str) -> str:
    """Rule engine from the build plan's Phase 8 decision matrix.

    Contacts give the ground-truth caller_type (relationship); priority is
    always the AI's per-call read on urgency, not the contact's own
    priority field — a family emergency should transfer even for a
    generally low-priority contact.
    """
    if caller_type == "spam":
        return "REJECT"

    mode_key = (mode or "").strip().lower()
    if mode_key not in ("available", "busy", "sleeping"):
        # In Class / Driving / Custom / anything else the plan doesn't give
        # an explicit matrix for: treat like Busy as the safe default.
        mode_key = "busy"

    # User-requested override: when Available, an urgent call transfers
    # regardless of who it's from — spam is the only exception, handled
    # above. This goes beyond the plan's own matrix (which only transfers
    # family/recruiter/friend when Available), added after live testing
    # showed an urgent unknown caller should still get through.
    if mode_key == "available" and priority == "high":
        return "TRANSFER"

    if caller_type in ("delivery", "apartment"):
        return "TAKE_MESSAGE"

    if mode_key == "available":
        if caller_type in ("family", "recruiter", "friend"):
            return "TRANSFER"
        return "SCREEN"  # unknown

    if mode_key == "busy":
        if caller_type in ("family", "recruiter"):
            return "TRANSFER"
        return "TAKE_MESSAGE"  # friend, unknown

    # sleeping
    if caller_type == "family" and priority == "high":
        return "TRANSFER"
    return "TAKE_MESSAGE"


def find_contact_by_phone(phone_number: str):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, name, relationship, priority FROM contacts WHERE phone_number = %s;",
                (phone_number,),
            )
            return cur.fetchone()


def get_current_mode() -> str:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT mode FROM user_status ORDER BY id LIMIT 1;")
            row = cur.fetchone()
    return row[0] if row else "busy"


def get_full_status():
    """Returns (mode, custom_instruction, expires_at, custom_transfer_types,
    custom_urgent_transfers) for the single user_status row."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT mode, custom_instruction, expires_at,
                       custom_transfer_types, custom_urgent_transfers
                FROM user_status ORDER BY id LIMIT 1;
                """
            )
            row = cur.fetchone()
    return row if row else ("busy", None, None, None, None)


def decide_action_for_call(caller_type: str, priority: str) -> str:
    """Like decide_action, but checks for an active natural-language custom
    rule (Phase 10) first — a rule set via 'Tell my assistant: ...' fully
    overrides the normal mode matrix while it hasn't expired."""
    if caller_type == "spam":
        return "REJECT"

    mode, _custom_instruction, expires_at, transfer_types, urgent_transfers = (
        get_full_status()
    )

    if expires_at is not None and expires_at > datetime.now(timezone.utc):
        if urgent_transfers and priority == "high":
            return "TRANSFER"
        if transfer_types and caller_type in transfer_types:
            return "TRANSFER"
        return "TAKE_MESSAGE"

    return decide_action(caller_type, priority, mode)


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


def classify_call(call_sid: str) -> str | None:
    """Classifies the call and writes ai_*/decided_action to the DB.

    Called synchronously from /voice/urgency (the caller is still on the
    line waiting) so the decision — including whether to transfer — is
    known before the call ends, not after. Returns the decided_action, or
    None if classification couldn't run (no API key, or a failure).
    """
    if openai_client is None:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE calls SET ai_error = %s WHERE call_sid = %s;",
                    ("OPENAI_API_KEY not configured", call_sid),
                )
            conn.commit()
        return None

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT caller_name, reason, urgency, phone_number FROM calls WHERE call_sid = %s;",
                (call_sid,),
            )
            row = cur.fetchone()

    if row is None:
        return None

    raw_intro, _raw_reason, raw_urgency, phone_number = row
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
            timeout=10,
        )
        result = json.loads(response.output_text)

        contact = find_contact_by_phone(phone_number)
        matched_contact_id = contact[0] if contact else None
        effective_type = contact[2] if contact else result["caller_type"]

        decided_action = decide_action_for_call(effective_type, result["priority"])

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE calls
                    SET ai_name = %s, ai_company = %s, ai_type = %s,
                        ai_intent = %s, ai_priority = %s, ai_message = %s,
                        ai_recommended_action = %s, ai_error = NULL,
                        decided_action = %s, matched_contact_id = %s
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
                        decided_action,
                        matched_contact_id,
                        call_sid,
                    ),
                )
            conn.commit()
        return decided_action
    except Exception as exc:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE calls SET ai_error = %s WHERE call_sid = %s;",
                    (str(exc)[:500], call_sid),
                )
            conn.commit()
        return None


class StatusUpdate(BaseModel):
    mode: str


class ContactCreate(BaseModel):
    name: str
    phone_number: str
    relationship: str
    priority: str = "normal"


def gather_response(question: str, action: str) -> Response:
    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<Response>"
        f'<Gather input="speech" action="{action}" method="POST" '
        'speechTimeout="2" timeout="5" actionOnEmptyResult="true">'
        f"<Say>{question}</Say>"
        "</Gather>"
        "</Response>"
    )
    return Response(content=twiml, media_type="application/xml")


def transfer_twiml(caller_name: str | None) -> Response:
    """TwiML that dials TRANSFER_PHONE_NUMBER live, with a completion
    callback so a no-answer/busy/declined transfer doesn't just drop the
    caller — see /voice/transfer-complete."""
    greeting = (
        f"Thanks {caller_name}, let me try to connect you to Bharath now."
        if caller_name
        else "Let me try to connect you to Bharath now."
    )
    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<Response>"
        f"<Say>{greeting}</Say>"
        '<Dial action="/voice/transfer-complete" method="POST" timeout="20">'
        f"{TRANSFER_PHONE_NUMBER}"
        "</Dial>"
        "</Response>"
    )
    return Response(content=twiml, media_type="application/xml")


@app.get("/health")
def health():
    return {"status": "online"}


MAX_SILENCE_RETRIES = 2


@app.post("/voice")
def voice(CallSid: str = Form(...), From: str = Form(...)):
    contact = find_contact_by_phone(From)
    is_known_spam = contact is not None and contact[2] == "spam"

    if is_known_spam:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO calls (call_sid, phone_number, status,
                        decided_action, matched_contact_id, ended_at)
                    VALUES (%s, %s, 'completed', 'REJECT', %s, now())
                    ON CONFLICT (call_sid) DO NOTHING;
                    """,
                    (CallSid, From, contact[0]),
                )
            conn.commit()
        twiml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            "<Response><Hangup/></Response>"
        )
        return Response(content=twiml, media_type="application/xml")

    # Known, non-spam contact: if the mode + relationship alone already
    # decides TRANSFER (true for every case the plan's matrix defines
    # except a sleeping family member, which needs a live urgency check we
    # haven't built yet — that case falls through to the normal flow
    # below), skip the interrogation entirely and act immediately.
    if contact is not None:
        preliminary_action = decide_action_for_call(contact[2], "normal")
        if preliminary_action == "TRANSFER":
            with get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO calls (call_sid, phone_number, status,
                            ai_name, ai_type, decided_action, matched_contact_id)
                        VALUES (%s, %s, 'in_progress', %s, %s, 'TRANSFER', %s)
                        ON CONFLICT (call_sid) DO NOTHING;
                        """,
                        (CallSid, From, contact[1], contact[2], contact[0]),
                    )
                conn.commit()

            if TRANSFER_PHONE_NUMBER:
                return transfer_twiml(contact[1])

            with get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE calls SET status = 'completed', ended_at = now()
                        WHERE call_sid = %s;
                        """,
                        (CallSid,),
                    )
                conn.commit()
            twiml = (
                '<?xml version="1.0" encoding="UTF-8"?>'
                "<Response>"
                f"<Say>Hi {contact[1]}, I'll let Bharath know right away.</Say>"
                "</Response>"
            )
            return Response(content=twiml, media_type="application/xml")

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
        'speechTimeout="2" timeout="5" actionOnEmptyResult="true">'
        "<Say>May I ask who's calling and what this is regarding?</Say>"
        "</Gather>"
        "</Response>"
    )
    return Response(content=twiml, media_type="application/xml")


@app.post("/voice/intro")
def voice_intro(
    CallSid: str = Form(...), SpeechResult: str = Form(""), retry: int = 0
):
    if not SpeechResult.strip() and retry < MAX_SILENCE_RETRIES:
        return gather_response(
            "Sorry, I didn't catch that. Who's calling and what is this regarding?",
            f"/voice/intro?retry={retry + 1}",
        )

    if not SpeechResult.strip():
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE calls
                    SET status = 'no_response', ended_at = now()
                    WHERE call_sid = %s;
                    """,
                    (CallSid,),
                )
            conn.commit()
        twiml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            "<Response>"
            "<Say>I'm having trouble hearing you. Please try calling back. Goodbye.</Say>"
            "<Hangup/>"
            "</Response>"
        )
        return Response(content=twiml, media_type="application/xml")

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE calls SET caller_name = %s, reason = %s WHERE call_sid = %s;",
                (SpeechResult, SpeechResult, CallSid),
            )
        conn.commit()

    return gather_response("Is this urgent?", "/voice/urgency")


@app.post("/voice/urgency")
def voice_urgency(
    CallSid: str = Form(...),
    SpeechResult: str = Form(""),
    retry: int = 0,
):
    if not SpeechResult.strip() and retry < MAX_SILENCE_RETRIES:
        return gather_response(
            "Sorry, I didn't catch that. Is this urgent?",
            f"/voice/urgency?retry={retry + 1}",
        )

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE calls SET urgency = %s WHERE call_sid = %s;",
                (SpeechResult or None, CallSid),
            )
        conn.commit()

    # Classify synchronously (the caller is still on the line) so we know
    # whether to transfer before deciding how to end the call.
    decided_action = classify_call(CallSid)

    if decided_action == "TRANSFER" and TRANSFER_PHONE_NUMBER:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT ai_name FROM calls WHERE call_sid = %s;", (CallSid,)
                )
                name_row = cur.fetchone()
        return transfer_twiml(name_row[0] if name_row else None)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE calls SET status = 'completed', ended_at = now()
                WHERE call_sid = %s;
                """,
                (CallSid,),
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


@app.post("/voice/transfer-complete")
def voice_transfer_complete(
    CallSid: str = Form(...), DialCallStatus: str = Form("")
):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE calls
                SET transfer_result = %s, status = 'completed', ended_at = now()
                WHERE call_sid = %s;
                """,
                (DialCallStatus or None, CallSid),
            )
        conn.commit()

    if DialCallStatus == "completed":
        # Answered, and the bridged call has now ended on its own — nothing
        # more to say.
        twiml = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
        return Response(content=twiml, media_type="application/xml")

    # busy / no-answer / failed / canceled — the caller already gave their
    # name and reason during the Q&A, so relay that rather than asking
    # them to repeat it into a voicemail.
    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<Response>"
        "<Say>He isn't available right now, but I've already let him know "
        "you called. He'll follow up soon. Goodbye.</Say>"
        "<Hangup/>"
        "</Response>"
    )
    return Response(content=twiml, media_type="application/xml")


@app.get("/status")
def get_status():
    mode, custom_instruction, expires_at, transfer_types, urgent_transfers = (
        get_full_status()
    )
    return {
        "mode": mode,
        "custom_instruction": custom_instruction,
        "expires_at": expires_at.isoformat() if expires_at else None,
        "custom_transfer_types": transfer_types,
        "custom_urgent_transfers": urgent_transfers,
    }


@app.post("/status")
def set_status(update: StatusUpdate):
    # Manually picking a status button always cancels any active
    # natural-language custom rule (Phase 10) — an explicit choice wins.
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE user_status
                SET mode = %s, custom_instruction = NULL, expires_at = NULL,
                    custom_transfer_types = NULL, custom_urgent_transfers = NULL,
                    updated_at = now()
                WHERE id = (SELECT id FROM user_status ORDER BY id LIMIT 1)
                RETURNING mode;
                """,
                (update.mode,),
            )
            row = cur.fetchone()
        conn.commit()
    return {"mode": row[0]}


CUSTOM_STATUS_SCHEMA = {
    "type": "object",
    "properties": {
        "mode_label": {
            "type": "string",
            "description": "A short 1-3 word label for the state, e.g. 'Studying', 'Traveling', 'In a Meeting'.",
        },
        "expires_at": {
            "type": ["string", "null"],
            "description": "ISO 8601 timestamp with timezone offset for when this stops applying, or null if no end time was given.",
        },
        "transfer_types": {
            "type": "array",
            "items": {"type": "string", "enum": CALLER_TYPES},
            "description": "Caller types that should be let through while this is active. Only include types explicitly or clearly implied as OK — don't include ones not mentioned.",
        },
        "urgent_always_transfers": {
            "type": "boolean",
            "description": "True if any urgent caller should be let through regardless of type.",
        },
        "summary": {
            "type": "string",
            "description": "One sentence summarizing what was understood, to show the user for confirmation before applying.",
        },
    },
    "required": [
        "mode_label",
        "expires_at",
        "transfer_types",
        "urgent_always_transfers",
        "summary",
    ],
    "additionalProperties": False,
}


def custom_status_instructions() -> str:
    now_local = datetime.now(timezone.utc).astimezone(LOCAL_TIMEZONE)
    return (
        "You convert a person's plain-English description of their current "
        "availability into structured call-screening rules for their phone "
        "assistant. The current date/time is "
        f"{now_local.strftime('%A, %B %d, %Y %I:%M %p %Z')}. Resolve relative "
        "times ('until 8 PM', 'until Sunday') against this and always include "
        "a timezone offset in expires_at. If nothing suggests an end time, "
        "expires_at is null. transfer_types should only include caller types "
        "explicitly or clearly implied as OK to interrupt for."
    )


class NaturalStatusRequest(BaseModel):
    instruction: str


@app.post("/status/interpret")
def interpret_status(body: NaturalStatusRequest):
    if openai_client is None:
        raise HTTPException(
            status_code=503, detail="OPENAI_API_KEY not configured"
        )
    response = openai_client.responses.create(
        model=OPENAI_MODEL,
        instructions=custom_status_instructions(),
        input=body.instruction,
        text={
            "format": {
                "type": "json_schema",
                "name": "custom_status",
                "schema": CUSTOM_STATUS_SCHEMA,
                "strict": True,
            }
        },
        timeout=10,
    )
    result = json.loads(response.output_text)
    result["instruction"] = body.instruction
    return result


class ApplyCustomStatus(BaseModel):
    instruction: str
    mode_label: str
    expires_at: str | None
    transfer_types: list[str]
    urgent_always_transfers: bool


@app.post("/status/apply-custom")
def apply_custom_status(body: ApplyCustomStatus):
    parsed_expires_at = None
    if body.expires_at:
        try:
            parsed_expires_at = datetime.fromisoformat(body.expires_at)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="expires_at must be a valid ISO 8601 timestamp",
            )
        if parsed_expires_at.tzinfo is None:
            parsed_expires_at = parsed_expires_at.replace(tzinfo=LOCAL_TIMEZONE)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE user_status
                SET mode = %s, custom_instruction = %s, expires_at = %s,
                    custom_transfer_types = %s, custom_urgent_transfers = %s,
                    updated_at = now()
                WHERE id = (SELECT id FROM user_status ORDER BY id LIMIT 1)
                RETURNING mode, custom_instruction, expires_at,
                          custom_transfer_types, custom_urgent_transfers;
                """,
                (
                    body.mode_label,
                    body.instruction,
                    parsed_expires_at,
                    body.transfer_types,
                    body.urgent_always_transfers,
                ),
            )
            row = cur.fetchone()
        conn.commit()
    return {
        "mode": row[0],
        "custom_instruction": row[1],
        "expires_at": row[2].isoformat() if row[2] else None,
        "custom_transfer_types": row[3],
        "custom_urgent_transfers": row[4],
    }


@app.get("/calls")
def get_calls(limit: int = 20):
    limit = max(1, min(limit, 500))
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT calls.id, calls.phone_number, calls.caller_name,
                       calls.reason, calls.urgency, calls.started_at,
                       calls.ended_at, calls.status,
                       calls.ai_name, calls.ai_company, calls.ai_type,
                       calls.ai_intent, calls.ai_priority, calls.ai_message,
                       calls.ai_error, calls.ai_recommended_action,
                       calls.dismissed_at, calls.decided_action,
                       calls.matched_contact_id, contacts.name,
                       calls.transfer_result
                FROM calls
                LEFT JOIN contacts ON contacts.id = calls.matched_contact_id
                ORDER BY calls.started_at DESC
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
            "decided_action": row[17],
            "matched_contact_id": row[18],
            "matched_contact_name": row[19],
            "transfer_result": row[20],
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


@app.get("/contacts")
def get_contacts():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, name, phone_number, relationship, priority, created_at
                FROM contacts
                ORDER BY name;
                """
            )
            rows = cur.fetchall()
    return [
        {
            "id": row[0],
            "name": row[1],
            "phone_number": row[2],
            "relationship": row[3],
            "priority": row[4],
            "created_at": row[5].isoformat(),
        }
        for row in rows
    ]


@app.post("/contacts")
def create_contact(contact: ContactCreate):
    if contact.relationship not in CALLER_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"relationship must be one of {CALLER_TYPES}",
        )
    if contact.priority not in CONTACT_PRIORITIES:
        raise HTTPException(
            status_code=400,
            detail=f"priority must be one of {CONTACT_PRIORITIES}",
        )

    with get_connection() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute(
                    """
                    INSERT INTO contacts (name, phone_number, relationship, priority)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, name, phone_number, relationship, priority, created_at;
                    """,
                    (
                        contact.name,
                        contact.phone_number,
                        contact.relationship,
                        contact.priority,
                    ),
                )
            except psycopg.errors.UniqueViolation:
                raise HTTPException(
                    status_code=409,
                    detail="A contact with this phone number already exists",
                )
            row = cur.fetchone()
        conn.commit()
    return {
        "id": row[0],
        "name": row[1],
        "phone_number": row[2],
        "relationship": row[3],
        "priority": row[4],
        "created_at": row[5].isoformat(),
    }


@app.delete("/contacts/{contact_id}")
def delete_contact(contact_id: int):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM contacts WHERE id = %s;", (contact_id,))
            deleted = cur.rowcount
        conn.commit()
    if deleted == 0:
        return Response(status_code=404)
    return {"deleted": True}
