# Personal AI Phone Assistant — Master Build Plan

## Project Goal

Build a real mobile app that I can install on my iPhone.

The app controls a personal AI phone assistant that can:

* Answer incoming calls on my existing main phone number through call forwarding
* Ask who is calling and why
* Understand whether the caller is important
* Know my current availability
* Take messages for me
* Transfer important callers to my private second phone number
* Summarize calls
* Send those summaries to my mobile app
* Follow rules for family, recruiters, friends, unknown callers, etc.
* Eventually understand my calendar and schedule
* Eventually let me describe my availability using normal English

My phone setup will use three numbers:

```text
MAIN US MOBILE NUMBER
Public number everyone already knows
        ↓
Unconditional call forwarding
        ↓
TWILIO NUMBER
AI assistant answers here
        ↓
If caller is important
        ↓
PRIVATE SECOND US MOBILE NUMBER
Twilio transfers the call here
        ↓
My iPhone rings
```

The second US Mobile number is private and does not need to be given to anyone.

The Twilio number also does not need to be publicly shared.

Example:

I set:

> Busy — studying until 8 PM. Let family and recruiters through. Everyone else should leave a message.

Someone calls my normal US Mobile number.

The call is immediately forwarded to the Twilio AI number.

AI:

> “Hi, you've reached Bharath's assistant. May I ask who's calling and what this is regarding?”

Caller:

> “I'm Sarah from Stripe calling about his Software Engineer application.”

The assistant recognizes:

* Sarah
* Recruiter
* Stripe
* Software Engineer
* High priority

It can then transfer the call to my private second US Mobile number.

My iPhone rings.

If I don't answer, it takes a message.

Afterward my app shows:

**Sarah — Stripe Recruiter**

Calling about Software Engineer application.

Wants to schedule an interview.

Priority: High

[Call Back]

---

# Planned Technology Stack

## Mobile Application

**React Native**

Used to build the actual mobile application.

## Mobile Development Framework

**Expo**

Makes React Native development, testing and installation easier.

## Mobile Language

**TypeScript**

Main language for the mobile application.

## Backend

**Python + FastAPI**

Responsible for:

* User status
* Call rules
* Contacts
* Receiving Twilio requests
* AI processing
* Call summaries
* Database communication

## Database

**PostgreSQL through Supabase**

Stores:

* Current status
* Contacts
* Rules
* Calls
* Call summaries
* Transcripts
* Settings

## Phone System

**Twilio Programmable Voice**

Responsible for:

* AI phone number
* Receiving calls forwarded from my main number
* Routing calls
* Transferring important callers to my private second US Mobile number
* Connecting telephone audio to the backend

## AI

**OpenAI API**

Responsible for:

* Understanding callers
* Classifying calls
* Extracting intent
* Generating responses
* Creating summaries
* Converting natural-language instructions into rules

## Development Tunnel

**ngrok or Cloudflare Tunnel**

Allows Twilio to communicate with the backend while it is running locally on my Mac.

## Version Control

**Git + GitHub**

Used throughout the entire project.

## Later Infrastructure

**Docker**

Package the backend.

**AWS**

Run the backend continuously so my Mac does not need to stay on.

## Development Devices

Primary development/test device:

**iPhone SE**

Use this for:

* unfinished builds
* Expo testing
* notifications
* UI testing
* breaking things without affecting my daily phone

Daily-use/final testing device:

**iPhone 16 Pro**

Once features become stable, install the app here and test whether I would actually use it daily.

The mobile app itself does not need cellular service to work.

It only needs internet/Wi-Fi to communicate with the backend.

---

# PHASE 0 — Set Up the Project

## Target: Day 1

### Step 1 — Create GitHub repository

Create something like:

`personal-ai-phone-assistant`

Initial folders:

```text
personal-ai-phone-assistant/

mobile/
backend/
docs/
README.md
```

### Step 2 — Install development tools

Install/check:

* VS Code
* Node.js
* npm
* Git
* Python
* Expo
* Expo Go on iPhone SE
* Expo Go on iPhone 16 Pro

### Step 3 — Create project README

Write:

* What the project does
* Why I am building it
* Planned technologies
* Current status

### Step 4 — Create project board

Simple statuses:

```text
Backlog
In Progress
Done
Bugs
```

### Completion milestone

I have:

* GitHub repository
* Development environment
* Project folders
* README

**Actual completion date: __________**

---

# PHASE 1 — Build My First Mobile App

## Target: Days 1–3

Do NOT build AI yet.

Do NOT build Twilio yet.

Do NOT build AWS.

The only goal is:

> Get software I wrote running on a real phone.

### Step 1

Create React Native + Expo project.

### Step 2

Run it on iPhone SE first.

### Step 3

Create home screen:

```text
PERSONAL AI ASSISTANT

Current Status

AVAILABLE

[Available]
[Busy]
[Sleeping]
[In Class]
[Driving]
[Custom]
```

### Step 4

Make buttons actually work.

Tap:

`Busy`

Screen changes to:

`Current Status: BUSY`

### Step 5

Add basic visual design.

Learn:

* React components
* TypeScript basics
* props
* state
* buttons
* text inputs
* basic styling

### Step 6

Run the same app on iPhone 16 Pro.

### Completion milestone

I can physically open my own app on my phone and change my status.

**Expected: 1–3 days**

**Actual completion date: __________**

---

# PHASE 2 — Build the Backend

## Target: Days 3–5

Now create the Python backend.

### Step 1

Create FastAPI project.

Example:

```text
backend/

main.py
routes/
services/
models/
```

### Step 2

Create first API endpoint:

```text
GET /health
```

Response:

```text
{
  "status": "online"
}
```

### Step 3

Create:

```text
GET /status
POST /status
```

### Step 4

Connect React Native app to FastAPI.

Flow:

```text
Phone
 ↓
React Native
 ↓
HTTP request
 ↓
FastAPI
```

### Step 5

Tap BUSY on phone.

Backend receives:

```text
status = busy
```

### Concepts to understand

* HTTP
* API
* GET
* POST
* JSON
* requests
* responses
* frontend vs backend
* ports
* localhost

### Completion milestone

Changing my status on my phone sends information to my Python backend.

**Expected cumulative time: ~4–5 days**

**Actual completion date: __________**

---

# PHASE 3 — Add PostgreSQL

## Target: Days 5–7

Create Supabase account/project.

Use PostgreSQL.

### First table

```text
user_status

id
mode
custom_instruction
updated_at
expires_at
```

### Backend behavior

When app sends:

```text
Busy
```

FastAPI saves:

```text
mode = busy
```

to PostgreSQL.

### Test persistence

1. Set Busy.
2. Close app.
3. Restart app.
4. App requests status.
5. Still shows Busy.

### Learn

* Tables
* Rows
* Columns
* SELECT
* INSERT
* UPDATE
* DELETE
* Primary keys
* Basic SQL

### Completion milestone

My phone, Python backend and PostgreSQL database all communicate.

Architecture:

```text
React Native
     ↓
FastAPI
     ↓
PostgreSQL
```

**Expected cumulative time: ~1 week**

**Actual completion date: __________**

---

# PHASE 4 — Get a Real Twilio Phone Number

## Target: Days 7–9

Create Twilio account.

Add approximately $5–10 for testing.

Purchase one programmable U.S. number.

This Twilio number is infrastructure.

It does not need to become my public number.

My existing main US Mobile number remains the number everyone knows.

### First goal

Call the Twilio number directly during development.

Hear:

> “Hi, you've reached Bharath's assistant.”

Nothing else.

No AI yet.

### Step 1

Create Twilio incoming call webhook.

### Step 2

Use ngrok/Cloudflare Tunnel so Twilio can reach local FastAPI backend.

Architecture during development:

```text
Test phone call
   ↓
Twilio number
   ↓
Internet webhook
   ↓
FastAPI on Mac
```

### Step 3

Backend tells Twilio what to say.

### Step 4

Call it from another phone.

At this stage, do NOT forward my main US Mobile number yet.

### Completion milestone

I dial a real Twilio phone number and hear software I wrote answering the call.

**Expected cumulative time: ~7–10 days**

**Actual completion date: __________**

---

# PHASE 5 — Build Basic Call Screening

## Target: Days 9–12

Before conversational AI, make a structured version.

Assistant asks:

> “May I ask who's calling?”

Then:

> “What is this regarding?”

Then:

> “Is this urgent?”

Collect:

```text
caller_name
phone_number
reason
urgency
timestamp
```

Store it in PostgreSQL.

### Add calls table

```text
calls

id
phone_number
caller_name
reason
urgency
started_at
ended_at
status
```

### Mobile app

Add:

**Recent Calls**

Example:

```text
Sarah
Stripe recruiter

2 minutes ago

Wants to discuss Software Engineer role.
```

### Completion milestone

Someone can call my AI number, provide information, and the information appears inside my mobile app.

**Expected cumulative time: ~10–12 days**

**Actual completion date: __________**

---

# PHASE 6 — Add Real AI Conversation

## Target: Days 12–16

Now connect OpenAI.

Instead of rigid:

> Press 1.

The caller can speak normally.

Assistant:

> “Hi, you've reached Bharath's assistant. May I ask who's calling and what this is regarding?”

Caller:

> “Hey, this is Mike. Tell him we're playing basketball tonight at eight.”

AI extracts:

```text
Name: Mike
Type: Friend
Intent: Message
Priority: Normal
Message: Basketball tonight at 8 PM
```

Another caller:

> “Hi, this is Sarah from Stripe regarding his Software Engineer application.”

AI:

```text
Name: Sarah
Type: Recruiter
Company: Stripe
Intent: Recruiting
Priority: High
```

### Learn

* LLM API calls
* prompts
* structured outputs
* JSON schemas
* AI classification
* latency
* hallucination prevention
* error handling

### Important rule

AI should NOT have unlimited authority.

It classifies and recommends.

Rules decide important actions.

### Completion milestone

The assistant can conduct a basic natural-language phone conversation and understand why someone called.

**Expected cumulative time: ~2 weeks**

**Actual completion date: __________**

---

# PHASE 7 — Build Call Summaries

## Target: Days 15–18

After every call, generate:

```text
CALL SUMMARY

Caller:
Sarah Patel

Company:
Stripe

Type:
Recruiter

Reason:
Software Engineer application

Summary:
Sarah would like Bharath to schedule a
30-minute technical interview.

Priority:
HIGH

Recommended action:
Call back today.
```

Store the result.

Show it inside the app.

Add:

```text
[Call Back]
[Dismiss]
```

Later:

```text
[Add Reminder]
[Add to Calendar]
```

### Completion milestone

My assistant turns phone calls into useful structured information instead of voicemail recordings.

**Actual completion date: __________**

---

# PHASE 8 — Contacts and Rules Engine

## Target: Week 3

Create contacts.

Example:

```text
Mom
Relationship: Family
Priority: Critical

Mike
Relationship: Friend
Priority: Normal
```

Create caller types:

```text
family
friend
recruiter
delivery
apartment
unknown
spam
```

Create actions:

```text
TRANSFER
TAKE_MESSAGE
SCREEN
REJECT
ASK_ME
```

Example rules:

```text
Family → Always transfer

Recruiters → Transfer unless Do Not Disturb

Friends → Transfer when Available

Unknown → Screen

Spam → Reject
```

Rules should depend on current mode.

Example:

### Available

```text
Family → Transfer
Recruiter → Transfer
Friend → Transfer
Unknown → Screen
```

### Busy

```text
Family → Transfer
Recruiter → Transfer
Friend → Message
Unknown → Message
```

### Sleeping

```text
Family emergency → Transfer
Everyone else → Message
```

### Completion milestone

My assistant behaves differently depending on who calls and what I am doing.

**Expected cumulative time: ~3 weeks**

**Actual completion date: __________**

---

# PHASE 9 — Transfer Important Calls to My Private Number

## Target: Week 3

This is where the three-number architecture becomes important.

My numbers are:

```text
1. MAIN US MOBILE NUMBER
Public number everybody already knows

2. TWILIO NUMBER
AI infrastructure number

3. PRIVATE SECOND US MOBILE NUMBER
Only used for the AI to reach me
```

During development, callers still call the Twilio number directly.

When a caller should reach me:

```text
Caller
  ↓
Twilio AI
  ↓
Rule says TRANSFER
  ↓
Twilio calls my PRIVATE second US Mobile number
  ↓
My iPhone rings
```

Do NOT transfer the call to my main US Mobile number.

Eventually my main number will forward all calls to Twilio, so transferring back to the main number could create a forwarding loop.

Assistant might say:

> “I'll try to connect you now.”

If I answer:

connect call.

If I don't answer:

> “He isn't available right now. Would you like to leave a message?”

### Test carefully

Test:

* successful transfer
* no answer
* busy
* declined call
* invalid number
* caller hangs up

### Completion milestone

The AI assistant can actually decide whether my private US Mobile number should ring.

**Actual completion date: __________**

---

# PHASE 9.5 — Forward My Main Number to the AI

## Target: After Phase 9 is reliable

Only do this after I trust the system.

Enable unconditional call forwarding on my main US Mobile number.

Final architecture:

```text
Someone calls my MAIN NUMBER
        ↓
US Mobile forwards immediately
        ↓
TWILIO AI NUMBER
        ↓
AI screens caller
        ↓
Important?
   ↙          ↘
 Yes          No
 ↓             ↓
Twilio        Message/
calls         summary
PRIVATE
number
 ↓
iPhone rings
```

My main number does NOT ring first.

All incoming calls go directly to the AI.

My private second US Mobile number is the only number Twilio uses when the AI wants to reach me.

People calling me continue using the same main number they have always known.

They do not need to know the Twilio number.

They do not need to know the private second number.

### Completion milestone

Someone calls my normal existing phone number and the AI answers immediately without my iPhone ringing first.

**Actual completion date: __________**

---

# PHASE 10 — Custom Natural-Language Mode

## Target: Week 4

Add:

```text
Tell my assistant:
____________________________
```

I type:

> I'm studying until 8 PM. Let recruiters and family through but take messages from everyone else.

AI converts it into structured configuration:

```text
mode: busy
expires_at: 8 PM

allow:
family
recruiter

others:
take_message
```

Another:

> I'm traveling until Sunday. Only interrupt me if it's urgent.

System automatically creates temporary rules.

### Important

Show me what the AI interpreted BEFORE applying complicated instructions.

Example:

```text
I understood:

Mode: Traveling
Until: Sunday

Urgent callers → Transfer
Others → Message

[Confirm]
```

### Completion milestone

I can control my phone assistant using normal English.

**Actual completion date: __________**

---

# PHASE 11 — Push Notifications

## Target: Week 4

When an important call occurs:

phone notification:

```text
🔴 Recruiter Call

Sarah — Stripe

Regarding your Software Engineer application.

Wants callback today.
```

Tap notification → opens call details.

Also support:

```text
Missed urgent call
New message
Transferred call
AI needs clarification
```

### Completion milestone

I don't need to constantly open the app to know what happened.

**Actual completion date: __________**

---

# PHASE 12 — Improve Mobile App

## Target: Week 4

Create polished screens.

### Home

```text
Current Mode
Recent important calls
Quick status controls
```

### Calls

Complete call history.

### Call Details

Transcript
Summary
Caller
Priority
Action taken

### Contacts

Manage people and priorities.

### Rules

Control behavior.

### Settings

Store:

```text
Main US Mobile number
Twilio assistant number
Private transfer number
AI voice
Privacy settings
Notifications
```

### Custom Assistant

Natural-language instruction box.

### Device use

Use iPhone SE primarily during development.

Once stable, install on iPhone 16 Pro and use it as my real daily interface.

### Completion milestone

App feels like an actual application rather than a development demo.

**Expected cumulative time: ~4 weeks**

**Actual completion date: __________**

---

# PHASE 13 — Google Calendar Integration

## Target: Week 5

Connect calendar.

Assistant can see availability—not necessarily private calendar details.

Example:

```text
2:00–3:15
Busy

3:15–5:00
Available
```

During class:

```text
Mode automatically → In Class
```

After class:

```text
Mode → Available
```

Allow manual override.

Example:

> Ignore my calendar today. I'm available.

### Future scheduling ability

Recruiter:

> “Can Bharath meet tomorrow at 3?”

Assistant checks availability.

Instead of automatically booking:

> “It looks like he may be available. I can send him your request.”

My phone receives:

```text
Sarah — Stripe

Meeting requested:
Tomorrow, 3 PM

[Accept]
[Decline]
```

### Completion milestone

Assistant understands my real availability without me constantly changing status.

**Actual completion date: __________**

---

# PHASE 14 — Security and Privacy

## Target: Week 5

Before treating this as résumé quality:

### Secrets

Never commit:

* OpenAI keys
* Twilio credentials
* Supabase passwords
* OAuth tokens
* private transfer number if repo is public

Use:

```text
.env
```

and `.gitignore`.

### Authentication

App should authenticate with backend.

### Database

Restrict access.

### Call transcripts

Decide retention.

Possibly:

```text
Store summary permanently.
Delete raw transcript after X days.
```

### Caller privacy

Don't tell callers:

> “Bharath is sleeping.”

Say:

> “Bharath isn't currently available.”

### Phone-number privacy

Do not reveal:

* private second US Mobile number
* internal Twilio routing information

### Logging

Avoid logging sensitive information unnecessarily.

### AI limitations

AI cannot independently reveal:

* personal address
* passwords
* financial details
* private schedule information
* immigration details
* other sensitive data

### Completion milestone

I can explain the privacy/security decisions I made.

**Actual completion date: __________**

---

# PHASE 15 — Testing

## Target: Week 5

Create scenarios.

### Scenario 1 — Friend

> Basketball tonight?

Expected:

Message.

### Scenario 2 — Recruiter

> Calling about an interview.

Expected:

High priority.

### Scenario 3 — Family emergency

Expected:

Immediate transfer to private second number.

### Scenario 4 — Spam

Expected:

Reject/screen.

### Scenario 5 — Unknown legitimate caller

Expected:

Collect information.

### Scenario 6 — AI does not understand

Expected:

Ask clarification.

### Scenario 7 — Backend unavailable

Expected:

Fallback voicemail/message.

### Scenario 8 — OpenAI API unavailable

Expected:

Fallback phone menu.

### Scenario 9 — Database fails

Expected:

Call still handled gracefully.

### Scenario 10 — Private transfer number doesn't answer

Expected:

Return to assistant and take message.

### Scenario 11 — Main number forwarding

Call main US Mobile number.

Expected:

Main iPhone does not ring first.

Call immediately reaches Twilio AI.

### Scenario 12 — Forwarding loop prevention

AI transfers important caller.

Expected:

Twilio calls private second US Mobile number.

It must NOT call main number.

### Completion milestone

System doesn't only work under perfect conditions.

**Actual completion date: __________**

---

# PHASE 16 — Docker

## Target: Week 5–6

Learn:

```text
Dockerfile
image
container
port
volume
docker compose
```

Containerize FastAPI backend.

Goal:

```text
docker compose up
```

starts backend consistently.

### Completion milestone

Backend is portable and doesn't depend on my Mac configuration.

**Actual completion date: __________**

---

# PHASE 17 — AWS Deployment

## Target: Week 6

Do this LAST.

Move backend from Mac to cloud.

Possible AWS concepts to learn:

```text
EC2
IAM
CloudWatch
S3 if needed
DNS / HTTPS
```

Supabase can continue hosting PostgreSQL initially.

Do NOT unnecessarily move everything to AWS just to say I used AWS.

Main goal:

```text
Mac turned OFF

        ↓

Someone calls my MAIN US Mobile number

        ↓

Call forwards to Twilio

        ↓

Assistant STILL WORKS
```

### Completion milestone

My assistant runs 24/7 independently of my laptop.

**Expected cumulative time: ~6 weeks**

**Actual completion date: __________**

---

# PHASE 18 — GitHub and Résumé Polish

## Target: End of Week 6

Create professional README.

Include:

### Problem

Traditional voicemail records audio but doesn't understand or act on calls.

### Solution

Personal AI call assistant that:

* works behind an existing phone number through forwarding
* understands caller intent
* considers user availability
* follows configurable priority rules
* transfers important calls to a private number
* summarizes conversations
* surfaces actionable information

### Architecture diagram

```text
                    Main US Mobile Number
                             ↓
                       Call Forwarding
                             ↓
                           Twilio
                             ↓
                          FastAPI
                        ↙         ↘
                  PostgreSQL     OpenAI
                        ↑
                  React Native App


If important:

Twilio
  ↓
Private second US Mobile number
  ↓
iPhone
```

### Screenshots

* Home screen
* Call history
* Call details
* Rules
* Custom AI mode

### Demo video

2–3 minutes.

Show:

1. Set Busy in mobile app.
2. Call my main phone number.
3. Main number forwards directly to AI.
4. Pretend to be recruiter.
5. AI screens call.
6. Assistant transfers to private second number.
7. iPhone rings.
8. Open mobile app.
9. Show AI-generated summary.

For public demo purposes, use fake/redacted phone numbers.

### GitHub cleanup

Remove:

* secrets
* real phone numbers
* private transfer number
* real transcripts
* personal data

Add fake demo information.

### Résumé bullets

Example:

**Personal AI Call Assistant**

Built and deployed a cross-platform AI call-screening application using React Native, TypeScript, FastAPI, PostgreSQL and Twilio, enabling real-time caller classification, priority-based routing and automated conversation summaries.

Designed a three-number call-routing architecture integrating carrier call forwarding with programmable voice infrastructure to screen all incoming calls before selectively transferring high-priority callers to a private line.

Integrated LLM-based natural-language rule configuration and structured call-intent extraction; containerized backend services with Docker and deployed cloud infrastructure for continuous availability.

---

# Optional PHASE 19 — Make It Actually Better Than a Portfolio Project

Only after everything above works.

Potential features:

### Smart status expiration

> Busy for 2 hours.

Automatically returns Available.

### Calendar scheduling

Allow trusted people to request time slots.

### Contact learning

Recognize recurring callers.

### Voicemail import

Process normal voicemail messages.

### Spam intelligence

Build caller reputation system.

### Multiple AI personalities

Professional
Casual
Minimal

### Different outgoing greetings

Recruiter:

> “Hi, you've reached Bharath's assistant.”

Friend:

> “Hey! Bharath can't answer right now.”

### Daily digest

```text
Today:

11 calls

2 recruiters
3 friends
1 apartment
5 spam

Important:
Stripe wants interview
Apartment maintenance tomorrow
```

### Search

> Show me all recruiter calls this month.

### Analytics

```text
Calls received
Calls screened
Calls transferred
Spam blocked
Average duration
```

### Automatic call-forwarding controls

Investigate whether any part of switching carrier forwarding behavior can safely be automated.

Do not make this a core requirement unless platform/carrier support makes it practical.

### Multi-user support

ONLY if I eventually want other people using it.

Do not build this initially.

---

# What NOT to Build Initially

Avoid scope creep.

Do NOT start with:

* App Store publishing
* Public SaaS
* Multiple users
* Kubernetes
* Complex AWS architecture
* Custom ML models
* Facial recognition
* SMS assistant
* Email assistant
* WhatsApp integration
* Desktop app
* Browser extension
* Perfect calendar automation
* Carrier-level replacement of iPhone call handling
* Automatic carrier forwarding configuration

Those can happen later.

---

# Expected Timeline

Assuming approximately 2–3 focused hours/day:

### Days 1–3

First mobile app running on iPhone SE.

### Days 4–7

Backend + PostgreSQL working.

### Days 7–10

Real Twilio number answers calls.

### Days 10–16

AI can talk to callers and generate summaries.

### Week 3

Rules + contacts + transfer to private second US Mobile number.

### End of Week 3 / early Week 4

Enable forwarding from main US Mobile number once the system is reliable.

### Week 4

Natural-language instructions + notifications + polished app.

### Week 5

Calendar + security + testing.

### Week 6

Docker + AWS + GitHub + demo + résumé.

---

# Milestones That Actually Matter

Instead of obsessing about dates, track these moments:

### Milestone 1

**I installed an app I built on my iPhone SE.**

Date: __________

### Milestone 2

**My app communicated with my Python backend.**

Date: __________

### Milestone 3

**My phone saved information to PostgreSQL.**

Date: __________

### Milestone 4

**I called a real Twilio number and heard my software answer.**

Date: __________

### Milestone 5

**I had a real conversation with my AI assistant over the phone.**

Date: __________

### Milestone 6

**A call appeared inside my mobile app automatically.**

Date: __________

### Milestone 7

**My AI assistant transferred a real call to my private second US Mobile number.**

Date: __________

### Milestone 8

**I called my existing main US Mobile number and the AI answered immediately through forwarding.**

Date: __________

### Milestone 9

**My assistant followed a rule I wrote in natural language.**

Date: __________

### Milestone 10

**My assistant used my calendar to understand availability.**

Date: __________

### Milestone 11

**My Mac was turned off and the assistant still worked.**

Date: __________

### Milestone 12

**Project officially went on my résumé/GitHub.**

Date: __________

---

# My Baseline Prediction

Start date: __________________

First installed mobile app:

**1–3 days**

Working app + backend + database:

**~1 week**

First real AI call:

**~2 weeks**

First successful AI → private-number transfer:

**~3 weeks**

Main number completely screened by AI:

**~3–4 weeks**

Something I would actually personally use:

**~3–4 weeks**

Strong résumé project:

**~4–6 weeks**

Actual completion date:

---

Actual number of days:

---

---

# Main Rule While Building

AI is allowed.

AI should be used heavily.

But I should understand each major piece before moving on.

Instead of asking:

> Build the entire project.

Ask:

> Help me build this next specific feature. Explain what we're changing, why we're changing it, and how the important pieces work.

For every major feature I should be able to answer:

1. What does this component do?
2. Why do I need it?
3. What talks to it?
4. What data goes in?
5. What comes out?
6. What can fail?
7. How would I debug it?

If I can answer those seven questions, I'm actually learning the system rather than just owning AI-generated code.
