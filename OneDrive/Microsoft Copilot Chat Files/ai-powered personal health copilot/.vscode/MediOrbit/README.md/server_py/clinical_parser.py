import re
import uuid
from datetime import datetime

LAB_DICTIONARY = [
    {
        'pattern': re.compile(r'(?:fasting\s+blood\s+(?:sugar|glucose)|fbs|fbg|fasting\s+glucose)', re.I),
        'name': 'Fasting Blood Sugar (FBS)',
        'unit': 'mg/dL',
        'low': 70.0,
        'high': 99.0,
        'rangeText': '70 - 99 mg/dL',
        'meaningHigh': 'Fasting blood sugar is higher than the standard normal range.',
        'meaningLow': 'Fasting blood sugar is below 70 mg/dL (hypoglycemia).',
        'generalExplanation': 'Measures blood glucose level after at least 8 hours of fasting.'
    },
    {
        'pattern': re.compile(r'(?:hba1c|glycated\s+hemoglobin|glycosylated\s+hemoglobin)', re.I),
        'name': 'HbA1c (Glycated Hemoglobin)',
        'unit': '%',
        'low': 4.0,
        'high': 5.6,
        'rangeText': '< 5.7 %',
        'meaningHigh': 'HbA1c of 5.7%-6.4% indicates prediabetes; 6.5%+ indicates diabetes.',
        'meaningLow': 'HbA1c is below typical reference thresholds.',
        'generalExplanation': 'Reflects average glucose bonded to red blood cells over 90 days.'
    },
    {
        'pattern': re.compile(r'(?:total\s+cholesterol|cholesterol\s+total)', re.I),
        'name': 'Total Cholesterol',
        'unit': 'mg/dL',
        'low': 100.0,
        'high': 199.0,
        'rangeText': '< 200 mg/dL',
        'meaningHigh': 'Total cholesterol is elevated.',
        'meaningLow': 'Total cholesterol is lower than standard reference baselines.',
        'generalExplanation': 'Sum of circulating HDL, LDL, and VLDL cholesterol.'
    },
    {
        'pattern': re.compile(r'(?:ldl(?:\s+cholesterol)?|low\s+density\s+lipoprotein)', re.I),
        'name': 'LDL Cholesterol',
        'unit': 'mg/dL',
        'low': 50.0,
        'high': 99.0,
        'rangeText': '< 100 mg/dL',
        'meaningHigh': 'LDL is considered bad cholesterol.',
        'meaningLow': 'LDL is low, which is cardioprotective.',
        'generalExplanation': 'Carries cholesterol particles to tissues.'
    },
    {
        'pattern': re.compile(r'(?:serum\s+creatinine|creatinine|s\.creatinine)', re.I),
        'name': 'Serum Creatinine',
        'unit': 'mg/dL',
        'low': 0.7,
        'high': 1.2,
        'rangeText': '0.7 - 1.2 mg/dL',
        'meaningHigh': 'Elevated creatinine suggests decreased kidney filtration.',
        'meaningLow': 'Low creatinine can reflect low muscle mass.',
        'generalExplanation': 'Normal waste product filtered by healthy kidneys.'
    }
]

KNOWN_MEDS = [
    {'name': 'Metformin', 'class': 'Biguanide', 'defaultDose': '500 mg', 'route': 'Oral', 'freq': 'Twice daily with meals', 'indication': 'Type 2 Diabetes'},
    {'name': 'Lisinopril', 'class': 'ACE Inhibitor', 'defaultDose': '10 mg', 'route': 'Oral', 'freq': 'Once daily (Morning)', 'indication': 'Hypertension'},
    {'name': 'Atorvastatin', 'class': 'Statin', 'defaultDose': '20 mg', 'route': 'Oral', 'freq': 'Once daily at bedtime', 'indication': 'Dyslipidemia'},
    {'name': 'Azithromycin', 'class': 'Macrolide Antibiotic', 'defaultDose': '500 mg', 'route': 'Oral', 'freq': 'Once daily for 5 days', 'indication': 'Bacterial Infection'},
    {'name': 'Amoxicillin', 'class': 'Penicillin Antibiotic', 'defaultDose': '500 mg', 'route': 'Oral', 'freq': 'Three times daily', 'indication': 'Bacterial Infection'},
    {'name': 'Paracetamol', 'class': 'Antipyretic / Analgesic', 'defaultDose': '650 mg', 'route': 'Oral', 'freq': 'As needed for fever (SOS)', 'indication': 'Fever relief'}
]

def parse_clinical_text(text: str, declared_doc_type: str = 'other', patient_profile: dict = None) -> dict:
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    doc_type = declared_doc_type if declared_doc_type and declared_doc_type != 'other' else 'other'

    if doc_type == 'other':
        if re.search(r'(?:lab\s+report|pathology|lipid\s+panel|test\s+report)', text, re.I):
            doc_type = 'lab_report'
        elif re.search(r'(?:discharge\s+summary|admission\s+date)', text, re.I):
            doc_type = 'discharge_summary'
        elif re.search(r'(?:rx|prescription|tab\.|cap\.)', text, re.I):
            doc_type = 'prescription'

    doc_date = datetime.utcnow().strftime('%Y-%m-%d')
    date_match = re.search(r'(?:date|dated|dt)[:\s]*([0-9]{1,2}[-/.][0-9]{1,2}[-/.][0-9]{2,4})', text, re.I)
    if date_match:
        doc_date = date_match.group(1).strip()

    facility = 'General Medical Facility'
    provider = 'Attending Physician'

    fac_match = re.search(r'(?:hospital|clinic|pathlabs?|diagnostics?)[:\s]*([^\n,]+)', text, re.I)
    if fac_match:
        facility = fac_match.group(0).strip()[:60]

    dr_match = re.search(r'(?:dr\.|doctor|consultant)[:\s]*([A-Za-z\s.,]+)', text, re.I)
    if dr_match:
        provider = dr_match.group(1).strip().split('\n')[0][:50]
        if not provider.lower().startswith('dr.'):
            provider = f"Dr. {provider}"

    observations = []
    processed_tests = set()

    for item in LAB_DICTIONARY:
        if item['pattern'].search(text):
            for line in lines:
                if item['pattern'].search(line) and item['name'] not in processed_tests:
                    processed_tests.add(item['name'])
                    val_match = re.search(r'[:\s]\s*([<>]?\s*\d+(?:\.\d+)?)\s*(mg/dL|%|mmol/L)?', line, re.I) or re.search(r'(\d+(?:\.\d+)?)', line)
                    if val_match:
                        raw_val = val_match.group(1).replace(' ', '')
                        unit = (val_match.group(2) if len(val_match.groups()) > 1 and val_match.group(2) else None) or item['unit']
                        try:
                            num_val = float(re.sub(r'[<>]', '', raw_val))
                            interpretation = 'NORMAL'
                            explanation = item['generalExplanation']
                            if 'high' in item and num_val > item['high']:
                                interpretation = 'HIGH'
                                explanation = item['meaningHigh']
                            elif 'low' in item and num_val < item['low']:
                                interpretation = 'LOW'
                                explanation = item['meaningLow']
                        except Exception:
                            interpretation = 'NORMAL'
                            explanation = item['generalExplanation']

                        observations.append({
                            'id': f"obs-{uuid.uuid4().hex[:6]}",
                            'testName': item['name'],
                            'value': raw_val,
                            'unit': unit,
                            'referenceRangeLow': str(item.get('low', '')),
                            'referenceRangeHigh': str(item.get('high', '')),
                            'referenceRangeText': item['rangeText'],
                            'interpretation': interpretation,
                            'explanation': explanation,
                            'needsReview': interpretation != 'NORMAL'
                        })
                        break

    medications = []
    for km in KNOWN_MEDS:
        if re.search(rf"\b{km['name']}\b", text, re.I):
            medications.append({
                'id': f"med-{uuid.uuid4().hex[:6]}",
                'name': km['name'],
                'strength': km['defaultDose'],
                'dosage': f"1 dose ({km['defaultDose']})",
                'route': km['route'],
                'frequency': km['freq'],
                'duration': 'As prescribed',
                'instructions': f"Take {km['defaultDose']} orally.",
                'indication': km['indication'],
                'isActive': True,
                'needsReview': False
            })

    allergies = []
    alg_match = re.search(r'(?:allergy|allergies|allergic\s+to)[:\s]*([^\n.]+)', text, re.I)
    if alg_match:
        allergies.append({
            'id': f"alg-{uuid.uuid4().hex[:6]}",
            'substance': alg_match.group(1).strip()[:40],
            'reaction': 'Documented allergy',
            'severity': 'moderate',
            'needsReview': False
        })

    allergy_alert = None
    all_allergies = list(allergies)
    if patient_profile and patient_profile.get('allergies'):
        all_allergies.extend(patient_profile['allergies'])

    for pa in all_allergies:
        sub = str(pa.get('substance', '')).lower()
        if 'penicillin' in sub:
            if any(re.search(r'amoxicillin|ampicillin|augmentin|penicillin', m['name'], re.I) for m in medications):
                allergy_alert = f"Safety Alert: Prescribed medication matches documented allergy to {pa.get('substance')}! Confirm immediately."

    flagged = [o for o in observations if o['interpretation'] != 'NORMAL']

    summary_obj = generate_summary(doc_type, facility, provider, doc_date, observations, flagged, medications, allergy_alert)

    return {
        'title': f"{doc_type.replace('_', ' ').title()} - {facility} ({doc_date})",
        'documentType': doc_type,
        'documentDate': doc_date,
        'facility': facility,
        'provider': provider,
        'rawText': text,
        'confidenceScore': 92,
        'observations': observations,
        'medications': medications,
        'conditions': [],
        'allergies': allergies,
        'encounter': {
            'serviceType': 'Healthcare Encounter',
            'providerName': provider,
            'facilityName': facility,
            'visitDate': doc_date,
            'followUpInstructions': 'Follow up with physician as advised.'
        },
        'summary': summary_obj
    }

def generate_summary(doc_type, facility, provider, date, observations, flagged, medications, allergy_alert):
    en_sum = ""
    hi_sum = ""
    takeaways = []
    questions = []
    out_of_range = []

    if doc_type == 'lab_report':
        if flagged:
            flagged_str = ", ".join([f"{o['testName']} ({o['value']} {o['unit']}, {o['interpretation']})" for o in flagged])
            en_sum = f"This diagnostic report from {facility} evaluated key health markers. Several values are outside reference benchmarks: {flagged_str}. Discuss these with {provider}."
            hi_sum = f"यह लैब रिपोर्ट आपके स्वास्थ्य संकेतकों की जांच करती है। कुछ परिणाम संदर्भ सीमा से बाहर हैं: {flagged_str}। अपने डॉक्टर {provider} से परामर्श करें।"
        else:
            en_sum = f"All evaluated tests from {facility} are currently within healthy reference limits."
            hi_sum = f"यह लैब रिपोर्ट दर्शाती है कि आपके सभी जांच परिणाम सामान्य संदर्भ सीमाओं के भीतर हैं।"

        for o in flagged:
            takeaways.append(f"{o['testName']} is flagged as {o['interpretation']} at {o['value']} {o['unit']}.")
            questions.append(f"What adjustments are recommended for {o['testName']}?")
            out_of_range.append({
                'testName': o['testName'],
                'value': f"{o['value']} {o['unit']}",
                'normalRange': o['referenceRangeText'],
                'generalMeaning': o['explanation'],
                'recommendation': 'Discuss finding with physician during next consultation.'
            })
    elif doc_type == 'prescription':
        med_str = ", ".join([m['name'] for m in medications]) or "prescribed medicines"
        en_sum = f"This prescription from {provider} details your treatment plan: {med_str}. Follow dosing instructions carefully."
        hi_sum = f"यह पर्चा ({provider}) द्वारा सुझाई गई दवाओं का विवरण देता है: {med_str}। समय और खुराक का पालन करें।"
        for m in medications:
            takeaways.append(f"{m['name']} ({m['strength']}): {m['frequency']}")
        questions.append("What common side effects should I be mindful of?")
    else:
        en_sum = f"Medical record from {facility} registered to your health timeline."
        hi_sum = f"यह चिकित्सा दस्तावेज आपकी स्वास्थ्य समयरेखा में सुरक्षित कर लिया गया है।"
        takeaways.append(f"Document recorded from {facility}.")

    if allergy_alert:
        takeaways.insert(0, allergy_alert)
        questions.insert(0, "Does this prescription contain any penicillin derivatives?")

    return {
        'plainLanguageSummary': en_sum,
        'hindiSummary': hi_sum,
        'keyTakeaways': takeaways[:5],
        'questionsForDoctor': questions[:4],
        'outOfRangeExplanations': out_of_range,
        'disclaimer': 'This summary is generated by AI to help you understand your medical records. It is NOT a medical diagnosis, treatment plan, or professional medical advice.',
        'generatedBy': 'local-python-clinical-heuristics',
        'generatedAt': datetime.utcnow().isoformat() + "Z"
    }