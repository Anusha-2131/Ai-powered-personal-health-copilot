# Saferly — Personal Safety Demo

A small full-stack personal-safety app with a responsive web frontend, a Flask JSON API, and a local SQLite database. It includes trusted-contact management, voluntary safety check-ins, optional location sharing, an SOS event log, and a transparent rule-based risk estimate.

## Requirements

- Python 3.10 or later
- Flask 3.x (installed from `requirements.txt`)
- A modern browser

## Run locally

From this folder, in PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

Open <http://127.0.0.1:5000>. The app creates `safety.db` in this folder on first run. Set `SAFETY_DB_PATH` to use a different SQLite file, or set `PORT` to change the local port.

## What it does

- Add and remove trusted contacts (name, phone number, and optional relationship).
- Save a check-in with an optional note, concern level, and browser location after explicit permission.
- Create an SOS record only after the user confirms the action.
- Review the eight most recent check-ins and SOS records.
- Assess check-in text using a small, readable keyword/concern heuristic.
- Optionally use browser speech recognition for a one-time voice phrase; any SOS still requires confirmation.
- Open a trusted contact's phone or messaging app, or open the device calling app for a number you enter. You review and initiate every call or message.
- Display device-provided coordinates after you choose to request location permission.

## Important safety and privacy limits

This is a learning/demo application, not a monitored safety service. It does **not** send SMS messages itself, call contacts itself, contact emergency services, or detect emergencies in the background. Phone and messaging links open your device's app and require you to complete the action there. Browser speech-recognition availability and processing depend on the browser and its privacy settings. The risk score is a simple heuristic, not a validated AI model, medical assessment, or guarantee of safety. If there is immediate danger, contact your local emergency number directly.

The app has no login, authorization, encryption-at-rest configuration, or production deployment hardening. Run it only on a trusted device with localhost access. Do not expose the development server to a public network or store real sensitive information in this demo.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard` | Recent activity and dashboard summary |
| `GET` | `/api/contacts` | List trusted contacts |
| `POST` | `/api/contacts` | Add a contact |
| `DELETE` | `/api/contacts/<id>` | Remove a contact |
| `POST` | `/api/check-in` | Create a check-in and heuristic risk estimate |
| `POST` | `/api/sos` | Record a user-confirmed SOS alert |
