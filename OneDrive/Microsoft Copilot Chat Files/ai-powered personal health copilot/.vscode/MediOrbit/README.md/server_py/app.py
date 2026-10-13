import os
import sys

# Ensure the local project directory is on the import path for sibling modules
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from dotenv import load_dotenv
from flask import Flask, request, jsonify, Response

load_dotenv()

from db import Database
from gemini_service import is_gemini_configured, process_medical_text
from fhir_export import export_patient_to_fhir_bundle, generate_markdown_summary

app = Flask(__name__)

# Basic CORS headers handler for zero external dependency requirement
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'Personal Health Copilot - Python Engine',
        'geminiConfigured': is_gemini_configured()
    })

@app.route('/api/config', methods=['GET'])
def get_config():
    return jsonify({
        'geminiConfigured': is_gemini_configured(),
        'model': os.getenv('GEMINI_MODEL', 'gemini-2.5-flash'),
        'uploadLimitMb': 10,
        'environment': 'Python Flask Backend'
    })

@app.route('/api/samples', methods=['GET'])
def get_samples():
    return jsonify({
        'success': True,
        'samples': [
            {
                'id': 'sample-lab-lipid',
                'title': 'Metro PathLabs - Metabolic Panel & Lipid Profile',
                'docType': 'lab_report',
                'facility': 'Metro Diagnostics',
                'provider': 'Dr. Rajesh Gupta, MD',
                'date': '2026-10-05',
                'description': 'Out-of-range glucose, HbA1c, and LDL with normal kidney markers.',
                'text': """METRO DIAGNOSTICS & PATHOLOGY LABS
Patient Name: Aarav Sharma   Age: 45 Y / Male   Date: 05-Oct-2026
TEST REPORT: COMPREHENSIVE METABOLIC & LIPID PANEL
Fasting Blood Sugar (FBS): 138 mg/dL (Reference Range: 70 - 99 mg/dL) [HIGH]
HbA1c (Glycated Hemoglobin): 7.4 % (Reference Range: < 5.7 %) [HIGH]
Total Cholesterol: 215 mg/dL (Reference Range: < 200 mg/dL) [HIGH]
Triglycerides: 198 mg/dL (Reference Range: < 150 mg/dL) [HIGH]
HDL Cholesterol: 42 mg/dL (Reference Range: > 40 mg/dL) [NORMAL]
LDL Cholesterol: 134 mg/dL (Reference Range: < 100 mg/dL) [HIGH]
Serum Creatinine: 0.9 mg/dL (Reference Range: 0.7 - 1.2 mg/dL) [NORMAL]
eGFR: 94 mL/min/1.73m2 (Reference Range: > 60 mL/min/1.73m2) [NORMAL]"""
            },
            {
                'id': 'sample-rx-clinic',
                'title': 'City Clinic - Acute Bronchitis Prescription',
                'docType': 'prescription',
                'facility': 'City Health Clinic',
                'provider': 'Dr. Ananya Sen, MD',
                'date': '2026-10-02',
                'description': 'Prescription with Penicillin allergy cross-check awareness.',
                'text': """CITY HEALTH FAMILY CLINIC
Patient: Aarav Sharma   Date: 02-Oct-2026
Diagnosis: Acute Bronchitis
Known Allergy: Penicillin
Rx:
1. Tab. Azithromycin 500 mg - OD x 5 days
2. Tab. Paracetamol 650 mg - SOS x 3 days
General Advice: Steam inhalation twice daily."""
            }
        ]
    })

# Patients API
@app.route('/api/patients', methods=['GET', 'POST'])
def handle_patients():
    if request.method == 'GET':
        return jsonify({'success': True, 'patients': Database.get_patients()})
    else:
        payload = request.get_json() or {}
        new_pt = Database.create_patient(payload)
        return jsonify({'success': True, 'patient': new_pt}), 201

@app.route('/api/patients/<patient_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_patient(patient_id):
    if request.method == 'GET':
        pt = Database.get_patient_by_id(patient_id)
        if not pt: return jsonify({'success': False, 'error': 'Not found'}), 404
        return jsonify({'success': True, 'patient': pt})
    elif request.method == 'PUT':
        updated = Database.update_patient(patient_id, request.get_json() or {})
        return jsonify({'success': True, 'patient': updated})
    elif request.method == 'DELETE':
        Database.delete_patient(patient_id)
        return jsonify({'success': True, 'message': 'Patient deleted'})

# Records API
@app.route('/api/records', methods=['GET', 'POST'])
def handle_records():
    if request.method == 'GET':
        pt_id = request.args.get('patientId')
        if not pt_id:
            return jsonify({'success': False, 'error': 'patientId is required'}), 400
        records = Database.get_records(
            pt_id,
            doc_type=request.args.get('docType'),
            q=request.args.get('q'),
            medicine=request.args.get('medicine'),
            test=request.args.get('test'),
            start_date=request.args.get('startDate'),
            end_date=request.args.get('endDate')
        )
        return jsonify({'success': True, 'count': len(records), 'records': records})
    else:
        payload = request.get_json() or {}
        if not payload.get('patientId'):
            return jsonify({'success': False, 'error': 'patientId is required'}), 400
        new_rec = Database.create_record(payload)
        return jsonify({'success': True, 'record': new_rec}), 201

@app.route('/api/records/<record_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_record(record_id):
    if request.method == 'GET':
        rec = Database.get_record_by_id(record_id)
        if not rec: return jsonify({'success': False, 'error': 'Not found'}), 404
        return jsonify({'success': True, 'record': rec})
    elif request.method == 'PUT':
        updated = Database.update_record(record_id, request.get_json() or {})
        return jsonify({'success': True, 'record': updated})
    elif request.method == 'DELETE':
        Database.delete_record(record_id)
        return jsonify({'success': True, 'message': 'Record deleted'})

# Processing API (Ingestion Pipeline)
@app.route('/api/process', methods=['POST'])
def process_document():
    payload = request.get_json() or {}
    if not payload.get('userConsent'):
        return jsonify({'success': False, 'error': 'User consent is required'}), 403

    raw_text = payload.get('rawText') or ''
    doc_type = payload.get('docType') or 'other'
    patient_id = payload.get('patientId')
    patient_profile = Database.get_patient_by_id(patient_id) if patient_id else None

    if not raw_text.strip():
        return jsonify({'success': False, 'error': 'No document text provided'}), 400

    draft_record = process_medical_text(raw_text, doc_type, patient_profile)
    return jsonify({'success': True, 'draftRecord': draft_record})

# FHIR and Markdown Exports
@app.route('/api/records/<record_id>/export/fhir', methods=['GET'])
def export_record_fhir(record_id):
    rec = Database.get_record_by_id(record_id)
    if not rec: return jsonify({'success': False, 'error': 'Not found'}), 404
    pt = Database.get_patient_by_id(rec.get('patientId')) or {'id': rec.get('patientId'), 'name': 'Patient'}
    bundle = export_patient_to_fhir_bundle(pt, [rec])
    return Response(
        response=str(jsonify(bundle).get_data(as_text=True)),
        status=200,
        mimetype="application/json",
        headers={"Content-Disposition": f"attachment;filename=FHIR-Record-{record_id}.json"}
    )

@app.route('/api/export/patient/<patient_id>/fhir', methods=['GET'])
def export_patient_fhir(patient_id):
    pt = Database.get_patient_by_id(patient_id)
    if not pt: return jsonify({'success': False, 'error': 'Not found'}), 404
    records = Database.get_records(patient_id)
    bundle = export_patient_to_fhir_bundle(pt, records)
    return Response(
        response=str(jsonify(bundle).get_data(as_text=True)),
        status=200,
        mimetype="application/json",
        headers={"Content-Disposition": f"attachment;filename=FHIR-HealthRecord-{patient_id}.json"}
    )

@app.route('/api/export/patient/<patient_id>/markdown', methods=['GET'])
def export_patient_markdown(patient_id):
    pt = Database.get_patient_by_id(patient_id)
    if not pt: return jsonify({'success': False, 'error': 'Not found'}), 404
    records = Database.get_records(patient_id)
    md = generate_markdown_summary(pt, records)
    return Response(
        response=md,
        status=200,
        mimetype="text/markdown",
        headers={"Content-Disposition": f"attachment;filename=HealthSummary-{patient_id}.md"}
    )

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"=================================================")
    print(f"  Personal Health Copilot - Python Flask Backend")
    print(f"  Running on: http://localhost:{port}")
    print(f"  Gemini Configured: {is_gemini_configured()}")
    print(f"=================================================")
    app.run(host='0.0.0.0', port=port, debug=True)