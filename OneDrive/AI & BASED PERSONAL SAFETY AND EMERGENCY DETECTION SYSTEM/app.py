import math
import os
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, request


BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = Path(os.environ.get("SAFETY_DB_PATH", BASE_DIR / "safety.db"))
PHONE_PATTERN = re.compile(r"^[+\d][\d\s().-]{5,24}$")

app = Flask(__name__, static_folder="static", static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024


def connect_db():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_db():
    with connect_db() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                relationship TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kind TEXT NOT NULL CHECK (kind IN ('sos', 'check-in')),
                message TEXT NOT NULL DEFAULT '',
                risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'emergency')),
                risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
                latitude REAL,
                longitude REAL,
                created_at TEXT NOT NULL
            );
            """
        )


def utc_now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def analyze_risk(message, concern):
    """A transparent demo heuristic, not a trained or validated emergency detector."""
    score = {"low": 0, "medium": 35, "high": 70}[concern]
    normalized = message.casefold()
    urgent_terms = ("help me", "can't breathe", "cannot breathe", "unconscious", "injured")
    distress_terms = ("unsafe", "scared", "followed", "threat", "hurt", "lost")

    if any(term in normalized for term in urgent_terms):
        score = max(score, 85)
    elif any(term in normalized for term in distress_terms):
        score = max(score, 55)

    level = "high" if score >= 70 else "medium" if score >= 35 else "low"
    return min(score, 100), level


def optional_location(data):
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    if latitude is None and longitude is None:
        return None, None
    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except (TypeError, ValueError):
        raise ValueError("Location must contain valid latitude and longitude.")
    if not math.isfinite(latitude) or not math.isfinite(longitude):
        raise ValueError("Location must contain valid latitude and longitude.")
    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        raise ValueError("Location is outside the valid coordinate range.")
    return latitude, longitude


def alert_json(row):
    result = dict(row)
    if result["latitude"] is not None and result["longitude"] is not None:
        result["map_url"] = (
            f"https://www.openstreetmap.org/?mlat={result['latitude']}"
            f"&mlon={result['longitude']}#map=16/{result['latitude']}/{result['longitude']}"
        )
    else:
        result["map_url"] = None
    return result


@app.get("/")
def index():
    return app.send_static_file("index.html")


@app.get("/api/dashboard")
def dashboard():
    with connect_db() as connection:
        contact_count = connection.execute(
            "SELECT COUNT(*) AS count FROM contacts"
        ).fetchone()["count"]
        rows = connection.execute(
            "SELECT * FROM alerts ORDER BY id DESC LIMIT 8"
        ).fetchall()
        latest = connection.execute(
            "SELECT created_at FROM alerts WHERE kind = 'check-in' ORDER BY id DESC LIMIT 1"
        ).fetchone()
    return jsonify(
        contact_count=contact_count,
        latest_check_in=latest["created_at"] if latest else None,
        alerts=[alert_json(row) for row in rows],
    )


@app.get("/api/contacts")
def list_contacts():
    with connect_db() as connection:
        rows = connection.execute(
            "SELECT id, name, phone, relationship FROM contacts ORDER BY name COLLATE NOCASE"
        ).fetchall()
    return jsonify(contacts=[dict(row) for row in rows])


@app.post("/api/contacts")
def add_contact():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error="Provide contact details as JSON."), 400
    name = data.get("name", "")
    phone = data.get("phone", "")
    relationship = data.get("relationship", "")
    if not all(isinstance(value, str) for value in (name, phone, relationship)):
        return jsonify(error="Name, phone, and relationship must be text."), 400
    name = name.strip()
    phone = phone.strip()
    relationship = relationship.strip()
    if not name or len(name) > 80:
        return jsonify(error="Name is required and must be 80 characters or fewer."), 400
    if not PHONE_PATTERN.fullmatch(phone):
        return jsonify(error="Enter a valid phone number (6–25 characters)."), 400
    if len(relationship) > 60:
        return jsonify(error="Relationship must be 60 characters or fewer."), 400

    with connect_db() as connection:
        cursor = connection.execute(
            "INSERT INTO contacts (name, phone, relationship, created_at) VALUES (?, ?, ?, ?)",
            (name, phone, relationship, utc_now()),
        )
        contact = connection.execute(
            "SELECT id, name, phone, relationship FROM contacts WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
    return jsonify(contact=dict(contact)), 201


@app.delete("/api/contacts/<int:contact_id>")
def delete_contact(contact_id):
    with connect_db() as connection:
        cursor = connection.execute("DELETE FROM contacts WHERE id = ?", (contact_id,))
    if cursor.rowcount == 0:
        return jsonify(error="Contact not found."), 404
    return "", 204


@app.post("/api/check-in")
def check_in():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error="Provide check-in details as JSON."), 400
    message = data.get("message", "")
    concern = data.get("concern", "low")
    if not isinstance(message, str):
        return jsonify(error="Check-in note must be text."), 400
    message = message.strip()
    if len(message) > 1000:
        return jsonify(error="Check-in note must be 1,000 characters or fewer."), 400
    if concern not in ("low", "medium", "high"):
        return jsonify(error="Concern must be low, medium, or high."), 400
    try:
        latitude, longitude = optional_location(data)
    except ValueError as error:
        return jsonify(error=str(error)), 400

    score, level = analyze_risk(message, concern)
    with connect_db() as connection:
        cursor = connection.execute(
            """
            INSERT INTO alerts
                (kind, message, risk_level, risk_score, latitude, longitude, created_at)
            VALUES ('check-in', ?, ?, ?, ?, ?, ?)
            """,
            (message, level, score, latitude, longitude, utc_now()),
        )
        row = connection.execute(
            "SELECT * FROM alerts WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    return jsonify(alert=alert_json(row)), 201


@app.post("/api/sos")
def create_sos():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error="Confirm SOS from the app to create an alert."), 400
    message = data.get("message", "")
    if not isinstance(message, str):
        return jsonify(error="SOS note must be text."), 400
    message = message.strip()
    if len(message) > 1000:
        return jsonify(error="SOS note must be 1,000 characters or fewer."), 400
    try:
        latitude, longitude = optional_location(data)
    except ValueError as error:
        return jsonify(error=str(error)), 400

    with connect_db() as connection:
        cursor = connection.execute(
            """
            INSERT INTO alerts
                (kind, message, risk_level, risk_score, latitude, longitude, created_at)
            VALUES ('sos', ?, 'emergency', 100, ?, ?, ?)
            """,
            (message, latitude, longitude, utc_now()),
        )
        row = connection.execute(
            "SELECT * FROM alerts WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    return jsonify(alert=alert_json(row)), 201


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify(error="Request is too large."), 413


initialize_db()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")), debug=False)
