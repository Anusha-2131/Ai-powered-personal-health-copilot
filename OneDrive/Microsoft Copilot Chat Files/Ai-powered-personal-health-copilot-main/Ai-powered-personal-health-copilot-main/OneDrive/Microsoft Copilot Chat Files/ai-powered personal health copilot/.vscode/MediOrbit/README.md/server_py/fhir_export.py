from datetime import datetime

def export_patient_to_fhir_bundle(patient: dict, records: list = None) -> dict:
    if records is None:
        records = []

    timestamp = datetime.utcnow().isoformat() + "Z"
    entries = []

    # 1. FHIR Patient Resource
    entries.append({
        "fullUrl": f"urn:uuid:{patient.get('id')}",
        "resource": {
            "resourceType": "Patient",
            "id": patient.get("id"),
            "identifier": [{"system": "https://health-copilot.local/patients", "value": patient.get("id")}],
            "active": True,
            "name": [{"use": "official", "text": patient.get("name", "Unknown")}],
            "gender": "female" if str(patient.get("gender", "")).lower() == "female" else "male",
            "birthDate": patient.get("dob") or "1980-01-01",
            "telecom": [{"system": "phone", "value": patient.get("phone")}] if patient.get("phone") else []
        }
    })

    # 2. Iterate Records
    for rec in records:
        rec_id = rec.get("id")
        doc_url = f"urn:uuid:{rec_id}"

        # DocumentReference
        entries.append({
            "fullUrl": doc_url,
            "resource": {
                "resourceType": "DocumentReference",
                "id": rec_id,
                "status": "current",
                "type": {"text": rec.get("documentType", "other")},
                "subject": {"reference": f"urn:uuid:{patient.get('id')}", "display": patient.get("name")},
                "date": rec.get("createdAt") or timestamp,
                "description": rec.get("title")
            }
        })

        # Observations
        for obs in rec.get("observations", []):
            obs_id = obs.get("id") or f"obs-{rec_id}"
            entries.append({
                "fullUrl": f"urn:uuid:{obs_id}",
                "resource": {
                    "resourceType": "Observation",
                    "id": obs_id,
                    "status": "final",
                    "code": {"text": obs.get("testName")},
                    "subject": {"reference": f"urn:uuid:{patient.get('id')}", "display": patient.get("name")},
                    "valueString": f"{obs.get('value')} {obs.get('unit', '')}".strip(),
                    "interpretation": [{"text": obs.get("interpretation", "NORMAL")}],
                    "derivedFrom": [{"reference": doc_url}]
                }
            })

        # Medications
        for med in rec.get("medications", []):
            med_id = med.get("id") or f"med-{rec_id}"
            entries.append({
                "fullUrl": f"urn:uuid:{med_id}",
                "resource": {
                    "resourceType": "MedicationStatement",
                    "id": med_id,
                    "status": "active" if med.get("isActive", True) else "completed",
                    "medicationCodeableConcept": {"text": f"{med.get('name')} {med.get('strength', '')}".strip()},
                    "subject": {"reference": f"urn:uuid:{patient.get('id')}", "display": patient.get("name")},
                    "dosage": [{"text": f"{med.get('frequency', '')}. {med.get('instructions', '')}".strip()}],
                    "derivedFrom": [{"reference": doc_url}]
                }
            })

    return {
        "resourceType": "Bundle",
        "id": f"bundle-{patient.get('id')}",
        "type": "collection",
        "timestamp": timestamp,
        "total": len(entries),
        "entry": entries
    }

def generate_markdown_summary(patient: dict, records: list = None) -> str:
    if records is None:
        records = []

    md = f"# Personal Health Summary: {patient.get('name')}\n\n"
    md += f"**Generated:** {datetime.utcnow().strftime('%Y-%m-%d')} | **Powered by:** Personal Health Copilot (Python)\n\n"
    md += "> **NOTICE:** This report is an educational personal health organizer summary. It is NOT a medical diagnosis or treatment plan.\n\n"
    md += "## 1. Patient Demographics\n\n"
    md += f"- **Age / Gender:** {patient.get('age', 'N/A')} Y / {patient.get('gender', 'N/A')}\n"
    md += f"- **Blood Group:** {patient.get('bloodGroup', 'N/A')}\n"
    md += f"- **Preferred Language:** {'Hindi' if patient.get('preferredLanguage') == 'hi' else 'English'}\n\n"
    md += f"## 2. Health Timeline & Records ({len(records)} records)\n\n"

    for idx, r in enumerate(records):
        md += f"### {idx + 1}. {r.get('title')} ({r.get('documentDate')})\n\n"
        md += f"- **Type:** {r.get('documentType', '').upper()} | **Facility:** {r.get('facility')} | **Provider:** {r.get('provider')}\n\n"
        if r.get("summary") and r["summary"].get("plainLanguageSummary"):
            md += f"**Summary:** {r['summary']['plainLanguageSummary']}\n\n"

    return md