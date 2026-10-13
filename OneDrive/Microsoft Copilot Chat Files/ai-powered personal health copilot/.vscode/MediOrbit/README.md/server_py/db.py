import json
import os
import uuid
from datetime import datetime

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'server', 'data', 'health_db.json')

def ensure_db():
    if not os.path.exists(DATA_FILE):
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump({"patients": [], "records": []}, f, indent=2)

def read_db():
    ensure_db()
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading DB: {e}")
        return {"patients": [], "records": []}

def write_db(data):
    ensure_db()
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

class Database:
    @staticmethod
    def get_patients():
        return read_db().get("patients", [])

    @staticmethod
    def get_patient_by_id(patient_id):
        patients = Database.get_patients()
        for p in patients:
            if p.get("id") == patient_id:
                return p
        return None

    @staticmethod
    def create_patient(payload):
        db = read_db()
        new_pt = {
            "id": payload.get("id") or f"patient-{uuid.uuid4().hex[:8]}",
            "name": payload.get("name") or "Anonymous User",
            "dob": payload.get("dob") or "",
            "age": payload.get("age"),
            "gender": payload.get("gender") or "Not specified",
            "bloodGroup": payload.get("bloodGroup") or "",
            "phone": payload.get("phone") or "",
            "email": payload.get("email") or "",
            "preferredLanguage": payload.get("preferredLanguage") or "en",
            "emergencyContact": payload.get("emergencyContact") or {"name": "", "relationship": "", "phone": ""},
            "knownConditions": payload.get("knownConditions") or [],
            "allergies": payload.get("allergies") or [],
            "createdAt": datetime.utcnow().isoformat() + "Z"
        }
        db.setdefault("patients", []).append(new_pt)
        write_db(db)
        return new_pt

    @staticmethod
    def update_patient(patient_id, updates):
        db = read_db()
        patients = db.get("patients", [])
        for idx, p in enumerate(patients):
            if p.get("id") == patient_id:
                p.update(updates)
                p["updatedAt"] = datetime.utcnow().isoformat() + "Z"
                patients[idx] = p
                write_db(db)
                return p
        return None

    @staticmethod
    def delete_patient(patient_id):
        db = read_db()
        db["patients"] = [p for p in db.get("patients", []) if p.get("id") != patient_id]
        db["records"] = [r for r in db.get("records", []) if r.get("patientId") != patient_id]
        write_db(db)
        return True

    @staticmethod
    def get_records(patient_id, doc_type=None, q=None, medicine=None, test=None, start_date=None, end_date=None):
        db = read_db()
        records = [r for r in db.get("records", []) if r.get("patientId") == patient_id]

        if doc_type and doc_type != 'all':
            records = [r for r in records if r.get("documentType") == doc_type]

        if q:
            q_lower = q.lower().strip()
            def matches(r):
                base = any(q_lower in str(r.get(field, '')).lower() for field in ['title', 'facility', 'provider', 'rawText'])
                meds = any(q_lower in str(m.get('name', '')).lower() for m in r.get('medications', []))
                tests = any(q_lower in str(o.get('testName', '')).lower() for o in r.get('observations', []))
                conds = any(q_lower in str(c.get('name', '')).lower() for c in r.get('conditions', []))
                return base or meds or tests or conds
            records = [r for r in records if matches(r)]

        if test:
            t_lower = test.lower().strip()
            records = [r for r in records if any(t_lower in str(o.get('testName', '')).lower() for o in r.get('observations', []))]

        if medicine:
            m_lower = medicine.lower().strip()
            records = [r for r in records if any(m_lower in str(med.get('name', '')).lower() for med in r.get('medications', []))]

        if start_date:
            records = [r for r in records if (r.get("documentDate") or '') >= start_date]

        if end_date:
            records = [r for r in records if (r.get("documentDate") or '') <= end_date]

        records.sort(key=lambda r: r.get("documentDate") or r.get("createdAt") or "", reverse=True)
        return records

    @staticmethod
    def get_record_by_id(record_id):
        records = read_db().get("records", [])
        for r in records:
            if r.get("id") == record_id:
                return r
        return None

    @staticmethod
    def create_record(payload):
        db = read_db()
        new_record = {
            "id": payload.get("id") or f"rec-{uuid.uuid4().hex[:12]}",
            "patientId": payload.get("patientId"),
            "title": payload.get("title") or "Medical Record",
            "documentType": payload.get("documentType") or "other",
            "documentDate": payload.get("documentDate") or datetime.utcnow().strftime("%Y-%m-%d"),
            "facility": payload.get("facility") or "Unspecified Clinic / Facility",
            "provider": payload.get("provider") or "Unspecified Physician",
            "originalFileName": payload.get("originalFileName"),
            "fileUrl": payload.get("fileUrl"),
            "mimeType": payload.get("mimeType") or "text/plain",
            "confidenceScore": payload.get("confidenceScore", 90),
            "provenance": payload.get("provenance") or "extracted",
            "status": payload.get("status") or "reviewed",
            "createdAt": datetime.utcnow().isoformat() + "Z",
            "updatedAt": datetime.utcnow().isoformat() + "Z",
            "rawText": payload.get("rawText") or "",
            "observations": payload.get("observations") or [],
            "medications": payload.get("medications") or [],
            "conditions": payload.get("conditions") or [],
            "allergies": payload.get("allergies") or [],
            "encounter": payload.get("encounter") or {},
            "summary": payload.get("summary") or None
        }
        db.setdefault("records", []).append(new_record)
        write_db(db)
        return new_record

    @staticmethod
    def update_record(record_id, updates):
        db = read_db()
        records = db.get("records", [])
        for idx, r in enumerate(records):
            if r.get("id") == record_id:
                r.update(updates)
                r["provenance"] = "user_edited"
                r["updatedAt"] = datetime.utcnow().isoformat() + "Z"
                records[idx] = r
                write_db(db)
                return r
        return None

    @staticmethod
    def delete_record(record_id):
        db = read_db()
        db["records"] = [r for r in db.get("records", []) if r.get("id") != record_id]
        write_db(db)
        return True