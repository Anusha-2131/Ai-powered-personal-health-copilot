const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, 'data', 'health_db.json');

const INITIAL_DEMO_DATA = {
  patients: [
    {
      id: 'patient-aarav-sharma-101',
      name: 'Aarav Sharma',
      dob: '1981-06-14',
      age: 45,
      gender: 'Male',
      bloodGroup: 'B+',
      phone: '+91 98765 43210',
      email: 'aarav.sharma@example.com',
      preferredLanguage: 'en', // 'en' or 'hi'
      emergencyContact: {
        name: 'Sunita Sharma',
        relationship: 'Spouse',
        phone: '+91 98765 43211'
      },
      knownConditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension', 'Dyslipidemia'],
      allergies: [
        { id: 'alg-1', substance: 'Penicillin', reaction: 'Skin hives, pruritus', severity: 'moderate' }
      ],
      createdAt: '2026-01-10T10:00:00.000Z'
    },
    {
      id: 'patient-sarah-jenkins-102',
      name: 'Sarah Jenkins',
      dob: '1992-03-22',
      age: 34,
      gender: 'Female',
      bloodGroup: 'A+',
      phone: '+1 555-019-2834',
      email: 'sarah.jenkins@example.com',
      preferredLanguage: 'en',
      emergencyContact: {
        name: 'Mark Jenkins',
        relationship: 'Brother',
        phone: '+1 555-019-2835'
      },
      knownConditions: ['Subclinical Hypothyroidism', 'Mild Asthma'],
      allergies: [
        { id: 'alg-2', substance: 'Sulfa Drugs', reaction: 'Facial swelling', severity: 'severe' }
      ],
      createdAt: '2026-02-15T10:00:00.000Z'
    }
  ],
  records: [
    {
      id: 'rec-lab-cmp-lipid-001',
      patientId: 'patient-aarav-sharma-101',
      title: 'Comprehensive Metabolic Panel & Lipid Profile',
      documentType: 'lab_report',
      documentDate: '2026-10-05',
      facility: 'Metro Diagnostics & PathLabs',
      provider: 'Dr. Rajesh Gupta, MD (Pathology)',
      originalFileName: 'Metro_Lab_CMP_Lipid_Oct2026.pdf',
      fileUrl: null,
      mimeType: 'application/pdf',
      confidenceScore: 96,
      provenance: 'extracted',
      status: 'reviewed',
      createdAt: '2026-10-05T14:30:00.000Z',
      updatedAt: '2026-10-05T14:30:00.000Z',
      rawText: `METRO DIAGNOSTICS & PATHOLOGY LABS
Patient Name: Aarav Sharma   Age: 45 Y / Male   Date: 05-Oct-2026
Referred By: Dr. S. K. Roy, MD (Internal Medicine)
TEST REPORT: COMPREHENSIVE METABOLIC & LIPID PANEL

Fasting Blood Sugar (FBS): 138 mg/dL (Reference Range: 70 - 99 mg/dL) [HIGH]
HbA1c (Glycated Hemoglobin): 7.4 % (Reference Range: < 5.7 %) [HIGH]
Estimated Average Glucose: 166 mg/dL (Reference Range: 70 - 126 mg/dL) [HIGH]
Total Cholesterol: 215 mg/dL (Reference Range: < 200 mg/dL) [HIGH]
Triglycerides: 198 mg/dL (Reference Range: < 150 mg/dL) [HIGH]
HDL Cholesterol: 42 mg/dL (Reference Range: > 40 mg/dL) [NORMAL]
LDL Cholesterol: 134 mg/dL (Reference Range: < 100 mg/dL) [HIGH]
Serum Creatinine: 0.9 mg/dL (Reference Range: 0.7 - 1.2 mg/dL) [NORMAL]
eGFR: 94 mL/min/1.73m2 (Reference Range: > 60 mL/min/1.73m2) [NORMAL]
Blood Urea Nitrogen (BUN): 16 mg/dL (Reference Range: 7 - 20 mg/dL) [NORMAL]
Serum Potassium: 4.4 mmol/L (Reference Range: 3.5 - 5.1 mmol/L) [NORMAL]
Serum Sodium: 139 mmol/L (Reference Range: 135 - 145 mmol/L) [NORMAL]

Note: Fasting glucose and HbA1c suggest elevated glycaemia. Lipid panel shows elevated LDL and triglycerides.
Correlate clinically with primary physician.`,
      observations: [
        {
          id: 'obs-1',
          testName: 'Fasting Blood Sugar (FBS)',
          value: '138',
          unit: 'mg/dL',
          referenceRangeLow: '70',
          referenceRangeHigh: '99',
          referenceRangeText: '70 - 99 mg/dL',
          interpretation: 'HIGH',
          explanation: 'Fasting blood glucose measures blood sugar after not eating overnight. 138 mg/dL is above the standard non-diabetic range (70-99 mg/dL) and indicates elevated circulating sugar.',
          needsReview: false
        },
        {
          id: 'obs-2',
          testName: 'HbA1c (Glycated Hemoglobin)',
          value: '7.4',
          unit: '%',
          referenceRangeLow: '4.0',
          referenceRangeHigh: '5.6',
          referenceRangeText: '< 5.7 %',
          interpretation: 'HIGH',
          explanation: 'HbA1c reflects average blood sugar control over the past 2 to 3 months. A value of 7.4% is elevated above the healthy reference (<5.7%), indicating room for closer glycemic management.',
          needsReview: false
        },
        {
          id: 'obs-3',
          testName: 'Total Cholesterol',
          value: '215',
          unit: 'mg/dL',
          referenceRangeLow: '120',
          referenceRangeHigh: '199',
          referenceRangeText: '< 200 mg/dL',
          interpretation: 'HIGH',
          explanation: 'Total cholesterol represents the overall amount of cholesterol in the blood. 215 mg/dL is slightly above the desirable threshold of 200 mg/dL.',
          needsReview: false
        },
        {
          id: 'obs-4',
          testName: 'LDL Cholesterol',
          value: '134',
          unit: 'mg/dL',
          referenceRangeLow: '50',
          referenceRangeHigh: '99',
          referenceRangeText: '< 100 mg/dL',
          interpretation: 'HIGH',
          explanation: 'LDL is commonly known as "bad" cholesterol. 134 mg/dL is above the optimal target (<100 mg/dL), which doctors typically evaluate in cardiovascular risk profiles.',
          needsReview: false
        },
        {
          id: 'obs-5',
          testName: 'Triglycerides',
          value: '198',
          unit: 'mg/dL',
          referenceRangeLow: '40',
          referenceRangeHigh: '149',
          referenceRangeText: '< 150 mg/dL',
          interpretation: 'HIGH',
          explanation: 'Triglycerides are blood fats influenced by carbohydrate intake and metabolism. 198 mg/dL is borderline high.',
          needsReview: false
        },
        {
          id: 'obs-6',
          testName: 'HDL Cholesterol',
          value: '42',
          unit: 'mg/dL',
          referenceRangeLow: '40',
          referenceRangeHigh: '70',
          referenceRangeText: '> 40 mg/dL',
          interpretation: 'NORMAL',
          explanation: 'HDL is the protective cholesterol. 42 mg/dL meets the minimum baseline target.',
          needsReview: false
        },
        {
          id: 'obs-7',
          testName: 'Serum Creatinine',
          value: '0.9',
          unit: 'mg/dL',
          referenceRangeLow: '0.7',
          referenceRangeHigh: '1.2',
          referenceRangeText: '0.7 - 1.2 mg/dL',
          interpretation: 'NORMAL',
          explanation: 'Creatinine is a waste product filtered by healthy kidneys. 0.9 mg/dL reflects normal kidney filtration capacity.',
          needsReview: false
        },
        {
          id: 'obs-8',
          testName: 'eGFR',
          value: '94',
          unit: 'mL/min/1.73m2',
          referenceRangeLow: '60',
          referenceRangeHigh: '120',
          referenceRangeText: '> 60 mL/min/1.73m2',
          interpretation: 'NORMAL',
          explanation: 'Estimated Glomerular Filtration Rate. 94 indicates excellent renal filtration.',
          needsReview: false
        }
      ],
      medications: [],
      conditions: [
        { id: 'c-1', name: 'Type 2 Diabetes Mellitus', status: 'active', notes: 'Elevated fasting glucose & HbA1c', needsReview: false },
        { id: 'c-2', name: 'Dyslipidemia', status: 'active', notes: 'Elevated total cholesterol, LDL, and triglycerides', needsReview: false }
      ],
      allergies: [],
      encounter: {
        serviceType: 'Diagnostic Pathology Test',
        providerName: 'Dr. Rajesh Gupta, MD',
        facilityName: 'Metro Diagnostics & PathLabs',
        visitDate: '2026-10-05',
        followUpDate: '2026-10-15',
        followUpInstructions: 'Review lab results with primary treating physician Dr. S. K. Roy.'
      },
      summary: {
        plainLanguageSummary: 'This lab report checks your blood sugar levels, kidney function, and blood lipids (cholesterol). Your kidney markers (Creatinine and eGFR) are healthy and functioning normally. However, both your 3-month blood sugar (HbA1c at 7.4%) and fasting sugar (138 mg/dL) are above the expected range, showing that blood sugar management requires medical attention. Additionally, your LDL cholesterol and triglycerides are mildly elevated. These values are common in metabolic conditions and should be reviewed together with your doctor to adjust diet, exercise, or medications.',
        hindiSummary: 'यह लैब रिपोर्ट आपके रक्त शर्करा (शुगर), गुर्दे (किडनी) की कार्यप्रणाली और कोलेस्ट्रॉल की जांच करती है। आपकी किडनी के संकेत (क्रिएटिनिन और eGFR) पूरी तरह सामान्य और स्वस्थ हैं। हालांकि, आपका 3 महीने का औसत शुगर (HbA1c 7.4%) और खाली पेट शुगर (138 mg/dL) सामान्य सीमा से अधिक हैं। इसके अलावा आपका एलडीएल कोलेस्ट्रॉल और ट्राइग्लिसराइड भी थोड़ा बढ़ा हुआ है। कृपया इन परिणामों को अपने डॉक्टर को दिखाएं ताकि वे आहार या दवाओं में आवश्यक मार्गदर्शन कर सकें।',
        keyTakeaways: [
          'Kidney filtration markers (Creatinine 0.9, eGFR 94) are in a healthy, normal range.',
          'HbA1c of 7.4% and fasting blood sugar of 138 mg/dL indicate above-target blood glucose.',
          'LDL cholesterol (134 mg/dL) and triglycerides (198 mg/dL) are elevated and warrant lifestyle or statin review.',
          'Bring these lab numbers to your scheduled follow-up with your primary physician.'
        ],
        questionsForDoctor: [
          'Does my current HbA1c level of 7.4% warrant an adjustment to my diabetes medication or dosage?',
          'What is my individualized target for LDL cholesterol considering my overall cardiovascular profile?',
          'Should I schedule an appointment with a registered clinical dietitian for carbohydrate management?',
          'When would you like me to repeat the HbA1c and lipid test panel?'
        ],
        outOfRangeExplanations: [
          {
            testName: 'HbA1c',
            value: '7.4 %',
            normalRange: '< 5.7 %',
            generalMeaning: 'Shows average blood glucose over the last 90 days. Levels above 6.5% are consistent with diabetes requiring treatment monitoring.',
            recommendation: 'Discuss diabetes management plan and glycemic targets with your doctor.'
          },
          {
            testName: 'Fasting Blood Sugar',
            value: '138 mg/dL',
            normalRange: '70 - 99 mg/dL',
            generalMeaning: 'Morning fasting blood sugar is elevated above the normal fasting ceiling.',
            recommendation: 'Log morning readings for 1 week and review with your physician.'
          },
          {
            testName: 'LDL Cholesterol',
            value: '134 mg/dL',
            normalRange: '< 100 mg/dL',
            generalMeaning: 'Higher levels of LDL can gradually deposit plaque along arterial walls over years.',
            recommendation: 'Evaluate cardiovascular risk with your doctor; discuss dietary fiber and lipid-lowering therapy.'
          }
        ],
        disclaimer: 'This summary is generated by AI to help you understand your medical records. It is NOT medical advice, a diagnosis, or a treatment plan. Always consult a licensed healthcare professional before making any health or medication decisions. In case of emergency or severe symptoms, call local emergency services immediately.',
        generatedBy: 'local-medical-heuristics',
        generatedAt: '2026-10-05T14:31:00.000Z'
      }
    },
    {
      id: 'rec-discharge-cardio-002',
      patientId: 'patient-aarav-sharma-101',
      title: 'Hospital Discharge Summary - Cardiology Observation',
      documentType: 'discharge_summary',
      documentDate: '2026-08-15',
      facility: 'City Specialty Hospital - Department of Cardiology',
      provider: 'Dr. Vikram Malhotra, DM (Cardiology)',
      originalFileName: 'Discharge_Summary_Cardiology_Aug2026.pdf',
      fileUrl: null,
      mimeType: 'application/pdf',
      confidenceScore: 94,
      provenance: 'extracted',
      status: 'reviewed',
      createdAt: '2026-08-15T11:00:00.000Z',
      updatedAt: '2026-08-15T11:00:00.000Z',
      rawText: `CITY SPECIALTY HOSPITAL - DISCHARGE SUMMARY
Patient: Aarav Sharma   Age: 45 / Male   IP No: CS-2026-8841
Admission Date: 13-Aug-2026    Discharge Date: 15-Aug-2026
Consultant: Dr. Vikram Malhotra, MD, DM (Cardiology)

REASON FOR ADMISSION:
45-year-old male admitted with exertional chest tightness and elevated blood pressure (160/100 mmHg).
ECG: Normal sinus rhythm, no acute ischemic ST-T changes.
Troponin-I: Negative (<0.01 ng/mL). 2D Echocardiogram: LVEF 60%, mild concentric LVH, no regional wall motion abnormalities.

FINAL DIAGNOSES:
1. Essential Hypertension (Uncontrolled at admission, stabilized)
2. Type 2 Diabetes Mellitus
3. Dyslipidemia

DISCHARGE MEDICATIONS:
1. Tab. Lisinopril 10 mg - Oral - Once daily (Morning) - 30 days
2. Tab. Metformin 500 mg - Oral - Twice daily with meals - 30 days
3. Tab. Atorvastatin 20 mg - Oral - Once daily at bedtime - 30 days
4. Tab. Aspirin 75 mg - Oral - Once daily post lunch - 30 days

ALLERGIES NOTED:
Patient reported rash to Penicillin. Penicillin-class antibiotics contraindicated.

FOLLOW-UP INSTRUCTIONS:
- Monitor home BP twice daily and maintain log.
- Low sodium (<2g/day) and diabetic diet.
- Follow up in Cardiology OPD after 4 weeks (15-Sep-2026) with fresh lipid profile and kidney function test.
- Seek immediate emergency care for crushing chest pain, radiating pain to left arm or jaw, or shortness of breath.`,
      observations: [
        {
          id: 'obs-d1',
          testName: 'Blood Pressure at Discharge',
          value: '128/82',
          unit: 'mmHg',
          referenceRangeLow: '90/60',
          referenceRangeHigh: '130/80',
          referenceRangeText: '< 130/80 mmHg',
          interpretation: 'NORMAL',
          explanation: 'Discharge blood pressure showed good response to anti-hypertensive therapy.',
          needsReview: false
        },
        {
          id: 'obs-d2',
          testName: 'Troponin-I',
          value: '<0.01',
          unit: 'ng/mL',
          referenceRangeLow: '0',
          referenceRangeHigh: '0.04',
          referenceRangeText: '< 0.04 ng/mL',
          interpretation: 'NORMAL',
          explanation: 'Cardiac troponin is normal, ruling out acute heart muscle damage.',
          needsReview: false
        },
        {
          id: 'obs-d3',
          testName: 'Left Ventricular Ejection Fraction (LVEF)',
          value: '60',
          unit: '%',
          referenceRangeLow: '50',
          referenceRangeHigh: '70',
          referenceRangeText: '50 - 70 %',
          interpretation: 'NORMAL',
          explanation: 'Echo confirmed healthy heart pumping ability.',
          needsReview: false
        }
      ],
      medications: [
        {
          id: 'med-1',
          name: 'Lisinopril',
          strength: '10 mg',
          dosage: '1 tablet (10 mg)',
          route: 'Oral',
          frequency: 'Once daily (Morning)',
          duration: '30 days',
          instructions: 'Take in the morning with a full glass of water. Monitor blood pressure regularly.',
          indication: 'Essential Hypertension',
          isActive: true,
          needsReview: false
        },
        {
          id: 'med-2',
          name: 'Metformin',
          strength: '500 mg',
          dosage: '1 tablet (500 mg)',
          route: 'Oral',
          frequency: 'Twice daily',
          duration: '30 days',
          instructions: 'Take with or immediately after breakfast and dinner to reduce stomach upset.',
          indication: 'Type 2 Diabetes Mellitus',
          isActive: true,
          needsReview: false
        },
        {
          id: 'med-3',
          name: 'Atorvastatin',
          strength: '20 mg',
          dosage: '1 tablet (20 mg)',
          route: 'Oral',
          frequency: 'Once daily at bedtime',
          duration: '30 days',
          instructions: 'Take at night. Avoid excessive grapefruit consumption.',
          indication: 'Dyslipidemia / Cardiovascular Protection',
          isActive: true,
          needsReview: false
        },
        {
          id: 'med-4',
          name: 'Aspirin',
          strength: '75 mg',
          dosage: '1 tablet (75 mg)',
          route: 'Oral',
          frequency: 'Once daily post lunch',
          duration: '30 days',
          instructions: 'Take with or after food. Report unusual bruising or black stools.',
          indication: 'Cardiovascular Prophylaxis',
          isActive: true,
          needsReview: false
        }
      ],
      conditions: [
        { id: 'c-3', name: 'Essential Hypertension', status: 'active', notes: 'Stabilized on Lisinopril 10mg', needsReview: false },
        { id: 'c-4', name: 'Dyslipidemia', status: 'active', notes: 'On Atorvastatin 20mg', needsReview: false }
      ],
      allergies: [
        { id: 'alg-rec-1', substance: 'Penicillin', reaction: 'Skin hives / rash', severity: 'moderate', needsReview: false }
      ],
      encounter: {
        serviceType: 'Inpatient Cardiology Discharge',
        providerName: 'Dr. Vikram Malhotra, DM',
        facilityName: 'City Specialty Hospital',
        visitDate: '2026-08-15',
        followUpDate: '2026-09-15',
        followUpInstructions: 'Follow up in OPD in 4 weeks. Keep daily blood pressure log and follow low sodium diet.'
      },
      summary: {
        plainLanguageSummary: 'You were admitted to the cardiology department for chest discomfort and high blood pressure, where heart tests (ECG, Troponin, and Echocardiogram) ruled out any heart attack or heart muscle damage. Your pumping function is normal at 60%. You have been discharged with stabilized blood pressure on four medications: Lisinopril for blood pressure, Metformin for blood sugar, Atorvastatin for cholesterol, and low-dose Aspirin. Make sure to take your medicines consistently, log your blood pressure at home, and see Dr. Malhotra in 4 weeks.',
        hindiSummary: 'सीने में तकलीफ और उच्च रक्तचाप (हाई बीपी) के कारण आपको अस्पताल में भर्ती किया गया था। डॉक्टरों द्वारा की गई जांच (ईसीजी, ट्रोपोनिन और इकोकार्डियोग्राम) में दिल का दौरा पूरी तरह से खारिज हो गया और दिल की पंपिंग सामान्य (60%) पाई गई। आपको बीपी स्थिर होने पर छुट्टी दी गई है। आपको चार दवाइयां दी गई हैं: लिसिनोप्रिल (बीपी के लिए), मेटफॉर्मिन (शुगर के लिए), एटोरवास्टेटिन (कोलेस्ट्रॉल के लिए), और एस्पिरिन। कृपया नियमित बीपी नापें और 4 सप्ताह में डॉक्टर से दोबारा मिलें।',
        keyTakeaways: [
          'Heart enzymes (Troponin) and heart pump capacity (Ejection fraction 60%) were normal; no heart attack.',
          'Blood pressure stabilized down to 128/82 mmHg before discharge.',
          'Four daily maintenance medications prescribed for BP, glucose, cholesterol, and heart protection.',
          'Schedule a follow-up appointment in 4 weeks with home BP logs.'
        ],
        questionsForDoctor: [
          'What blood pressure numbers should prompt me to call your clinic between visits?',
          'How frequently should I log my home blood pressure readings (morning vs evening)?',
          'Are there any specific side effects of Lisinopril or Atorvastatin I should watch out for?'
        ],
        outOfRangeExplanations: [],
        disclaimer: 'This summary is generated by AI to help you understand your medical records. It is NOT medical advice, a diagnosis, or a treatment plan. Always consult a licensed healthcare professional before making any health or medication decisions. In case of emergency or severe symptoms, call local emergency services immediately.',
        generatedBy: 'local-medical-heuristics',
        generatedAt: '2026-08-15T11:05:00.000Z'
      }
    },
    {
      id: 'rec-rx-bronchitis-003',
      patientId: 'patient-aarav-sharma-101',
      title: 'Outpatient Prescription - Acute Bronchitis',
      documentType: 'prescription',
      documentDate: '2026-10-02',
      facility: 'City Health Family Clinic',
      provider: 'Dr. Ananya Sen, MD (General Medicine)',
      originalFileName: 'Clinic_Prescription_Oct2026.pdf',
      fileUrl: null,
      mimeType: 'application/pdf',
      confidenceScore: 92,
      provenance: 'extracted',
      status: 'reviewed',
      createdAt: '2026-10-02T16:00:00.000Z',
      updatedAt: '2026-10-02T16:00:00.000Z',
      rawText: `CITY HEALTH FAMILY CLINIC
Dr. Ananya Sen, MD (General Medicine)   Reg No: MED-65412
Patient: Aarav Sharma   Age: 45 / M   Date: 02-Oct-2026
Known History: T2DM, HTN. Known Drug Allergy: Penicillin (severe rash)

Chief Complaints: Productive cough with yellowish sputum x 4 days, low-grade fever (99.8 F), throat irritation.
Chest Exam: Bilateral rhonchi, no crepitations. SpO2: 98% on room air.
Diagnosis: Acute Bronchitis

Rx (Prescription):
1. Tab. Azithromycin 500 mg - 1 tab OD x 5 days (1 hour before or 2 hours after food)
2. Tab. Paracetamol 650 mg - 1 tab SOS (maximum TDS if fever > 100 F) x 3 days
3. Tab. Levocetirizine 5 mg - 1 tab HS (bedtime) x 5 days
4. Syrup Ambroxol 30mg/5ml - 10 ml TDS after meals x 5 days

General Advice:
- Warm saline gargles & steam inhalation twice daily.
- Plenty of warm fluids. Avoid cold beverages and air-conditioning.
- Review after 5 days or immediately if breathlessness, chest pain, or high fever occurs.`,
      observations: [
        {
          id: 'obs-rx1',
          testName: 'Oxygen Saturation (SpO2)',
          value: '98',
          unit: '%',
          referenceRangeLow: '95',
          referenceRangeHigh: '100',
          referenceRangeText: '95 - 100 %',
          interpretation: 'NORMAL',
          explanation: 'Oxygen level in the blood is within healthy room-air limits.',
          needsReview: false
        },
        {
          id: 'obs-rx2',
          testName: 'Body Temperature',
          value: '99.8',
          unit: '°F',
          referenceRangeLow: '97.0',
          referenceRangeHigh: '99.0',
          referenceRangeText: '< 99.0 °F',
          interpretation: 'HIGH',
          explanation: 'Low-grade fever consistent with acute respiratory airway inflammation.',
          needsReview: false
        }
      ],
      medications: [
        {
          id: 'med-5',
          name: 'Azithromycin',
          strength: '500 mg',
          dosage: '1 tablet (500 mg)',
          route: 'Oral',
          frequency: 'Once daily (OD)',
          duration: '5 days',
          instructions: 'Take once a day for 5 days, either 1 hour before or 2 hours after food. Complete full 5-day course.',
          indication: 'Acute Bronchitis (Macrolide antibiotic; safe with penicillin allergy)',
          isActive: false,
          needsReview: false
        },
        {
          id: 'med-6',
          name: 'Paracetamol',
          strength: '650 mg',
          dosage: '1 tablet (650 mg)',
          route: 'Oral',
          frequency: 'As needed (SOS), max 3 times daily',
          duration: '3 days',
          instructions: 'Take only if fever rises above 100°F or for body aches.',
          indication: 'Fever and pain relief',
          isActive: false,
          needsReview: false
        },
        {
          id: 'med-7',
          name: 'Levocetirizine',
          strength: '5 mg',
          dosage: '1 tablet (5 mg)',
          route: 'Oral',
          frequency: 'Once daily at bedtime (HS)',
          duration: '5 days',
          instructions: 'Take at night. May cause mild drowsiness.',
          indication: 'Cough, throat irritation, and allergic symptoms',
          isActive: false,
          needsReview: false
        },
        {
          id: 'med-8',
          name: 'Ambroxol Syrup',
          strength: '30 mg / 5 mL',
          dosage: '10 mL',
          route: 'Oral',
          frequency: 'Three times daily (TDS)',
          duration: '5 days',
          instructions: 'Take 10 mL after meals. Helps loosen chest phlegm.',
          indication: 'Mucolytic for productive cough',
          isActive: false,
          needsReview: false
        }
      ],
      conditions: [
        { id: 'c-5', name: 'Acute Bronchitis', status: 'resolved', notes: 'Diagnosed 02-Oct-2026', needsReview: false }
      ],
      allergies: [
        { id: 'alg-rec-2', substance: 'Penicillin', reaction: 'Severe rash', severity: 'moderate', needsReview: false }
      ],
      encounter: {
        serviceType: 'Outpatient Clinic Consultation',
        providerName: 'Dr. Ananya Sen, MD',
        facilityName: 'City Health Family Clinic',
        visitDate: '2026-10-02',
        followUpDate: '2026-10-07',
        followUpInstructions: 'Review after 5 days if cough or fever persists. Seek urgent attention if breathing difficulty develops.'
      },
      summary: {
        plainLanguageSummary: 'You were evaluated for a 4-day cough and low-grade fever, diagnosed as acute bronchitis (airway inflammation). Because of your known Penicillin allergy, Dr. Sen appropriately selected Azithromycin (a macrolide class antibiotic, not penicillin). Make sure to finish the complete 5-day antibiotic course even if you start feeling better sooner. Use Paracetamol only as needed for fever over 100°F, take the anti-allergy pill at bedtime, and use steam inhalation.',
        hindiSummary: 'आपको 4 दिनों से खांसी और हल्के बुखार के लिए देखा गया और एक्यूट ब्रोंकाइटिस (श्वासनली में सूजन) का निदान हुआ। आपकी पेनिसिलिन एलर्जी को ध्यान में रखते हुए डॉक्टर ने सुरक्षित विकल्प के रूप में एजिथ्रोमाइसिन एंटीबायोटिक दिया है। 5 दिनों का एंटीबायोटिक कोर्स पूरा करें भले ही आप पहले ठीक महसूस करने लगें। बुखार होने पर ही पैरासिटामोल लें, रात को एलर्जी की गोली लें और गर्म पानी का भाप लें।',
        keyTakeaways: [
          'Acute bronchitis diagnosed; oxygen level (SpO2 98%) is normal and reassuring.',
          'Complete the entire 5-day Azithromycin course without stopping early.',
          'Penicillin was properly avoided due to documented allergy safety alert.',
          'Contact clinic if shortness of breath or fever persists past 3 days.'
        ],
        questionsForDoctor: [
          'If my cough lingers slightly after completing the 5 days of Azithromycin, is that expected with bronchitis?',
          'Does Azithromycin interact with my daily diabetes or blood pressure medications?'
        ],
        outOfRangeExplanations: [
          {
            testName: 'Body Temperature',
            value: '99.8 °F',
            normalRange: '< 99.0 °F',
            generalMeaning: 'Indicates a mild low-grade fever caused by airway infection.',
            recommendation: 'Rest, hydrate, and use fever medicine only as advised.'
          }
        ],
        disclaimer: 'This summary is generated by AI to help you understand your medical records. It is NOT medical advice, a diagnosis, or a treatment plan. Always consult a licensed healthcare professional before making any health or medication decisions. In case of emergency or severe symptoms, call local emergency services immediately.',
        generatedBy: 'local-medical-heuristics',
        generatedAt: '2026-10-02T16:05:00.000Z'
      }
    }
  ]
};

function ensureDbFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_DEMO_DATA, null, 2), 'utf-8');
  }
}

function readDb() {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB, resetting to initial seed:', err);
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_DEMO_DATA, null, 2), 'utf-8');
    return INITIAL_DEMO_DATA;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB:', err);
    throw err;
  }
}

// Database Helpers
const db = {
  resetToDemo() {
    writeDb(INITIAL_DEMO_DATA);
    return INITIAL_DEMO_DATA;
  },

  getPatients() {
    const data = readDb();
    return data.patients || [];
  },

  getPatientById(id) {
    const data = readDb();
    return (data.patients || []).find(p => p.id === id);
  },

  createPatient(patient) {
    const data = readDb();
    const newPatient = {
      id: patient.id || `patient-${uuidv4().slice(0, 8)}`,
      name: patient.name || 'Anonymous User',
      dob: patient.dob || '',
      age: patient.age || null,
      gender: patient.gender || 'Not specified',
      bloodGroup: patient.bloodGroup || '',
      phone: patient.phone || '',
      email: patient.email || '',
      preferredLanguage: patient.preferredLanguage || 'en',
      emergencyContact: patient.emergencyContact || { name: '', relationship: '', phone: '' },
      knownConditions: patient.knownConditions || [],
      allergies: patient.allergies || [],
      createdAt: new Date().toISOString()
    };
    data.patients = data.patients || [];
    data.patients.push(newPatient);
    writeDb(data);
    return newPatient;
  },

  updatePatient(id, updates) {
    const data = readDb();
    const index = (data.patients || []).findIndex(p => p.id === id);
    if (index === -1) return null;
    data.patients[index] = {
      ...data.patients[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    writeDb(data);
    return data.patients[index];
  },

  deletePatient(id) {
    const data = readDb();
    data.patients = (data.patients || []).filter(p => p.id !== id);
    // Also delete associated records
    data.records = (data.records || []).filter(r => r.patientId !== id);
    writeDb(data);
    return true;
  },

  getRecords(patientId, query = {}) {
    const data = readDb();
    let records = (data.records || []).filter(r => r.patientId === patientId);

    // Filter by docType
    if (query.docType && query.docType !== 'all') {
      records = records.filter(r => r.documentType === query.docType);
    }

    // Filter by search query (title, facility, provider, medicine, test name, condition)
    if (query.q) {
      const q = query.q.toLowerCase().trim();
      records = records.filter(r => {
        const matchesBasic = (
          (r.title && r.title.toLowerCase().includes(q)) ||
          (r.facility && r.facility.toLowerCase().includes(q)) ||
          (r.provider && r.provider.toLowerCase().includes(q)) ||
          (r.rawText && r.rawText.toLowerCase().includes(q))
        );
        const matchesMed = (r.medications || []).some(m => m.name && m.name.toLowerCase().includes(q));
        const matchesTest = (r.observations || []).some(o => o.testName && o.testName.toLowerCase().includes(q));
        const matchesCond = (r.conditions || []).some(c => c.name && c.name.toLowerCase().includes(q));
        return matchesBasic || matchesMed || matchesTest || matchesCond;
      });
    }

    // Filter by test name specifically
    if (query.test) {
      const t = query.test.toLowerCase().trim();
      records = records.filter(r => (r.observations || []).some(o => o.testName && o.testName.toLowerCase().includes(t)));
    }

    // Filter by medicine specifically
    if (query.medicine) {
      const m = query.medicine.toLowerCase().trim();
      records = records.filter(r => (r.medications || []).some(med => med.name && med.name.toLowerCase().includes(m)));
    }

    // Filter by date range
    if (query.startDate) {
      records = records.filter(r => r.documentDate >= query.startDate);
    }
    if (query.endDate) {
      records = records.filter(r => r.documentDate <= query.endDate);
    }

    // Date-ordered descending by documentDate
    records.sort((a, b) => new Date(b.documentDate || b.createdAt) - new Date(a.documentDate || a.createdAt));

    return records;
  },

  getRecordById(id) {
    const data = readDb();
    return (data.records || []).find(r => r.id === id);
  },

  createRecord(record) {
    const data = readDb();
    const newRecord = {
      id: record.id || `rec-${uuidv4()}`,
      patientId: record.patientId,
      title: record.title || 'Medical Record',
      documentType: record.documentType || 'other',
      documentDate: record.documentDate || new Date().toISOString().slice(0, 10),
      facility: record.facility || 'Unspecified Clinic / Facility',
      provider: record.provider || 'Unspecified Physician',
      originalFileName: record.originalFileName || null,
      fileUrl: record.fileUrl || null,
      mimeType: record.mimeType || 'text/plain',
      confidenceScore: typeof record.confidenceScore === 'number' ? record.confidenceScore : 90,
      provenance: record.provenance || 'extracted',
      status: record.status || 'reviewed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rawText: record.rawText || '',
      observations: record.observations || [],
      medications: record.medications || [],
      conditions: record.conditions || [],
      allergies: record.allergies || [],
      encounter: record.encounter || {},
      summary: record.summary || null
    };

    data.records = data.records || [];
    data.records.push(newRecord);
    writeDb(data);
    return newRecord;
  },

  updateRecord(id, updates) {
    const data = readDb();
    const index = (data.records || []).findIndex(r => r.id === id);
    if (index === -1) return null;
    data.records[index] = {
      ...data.records[index],
      ...updates,
      provenance: 'user_edited',
      updatedAt: new Date().toISOString()
    };
    writeDb(data);
    return data.records[index];
  },

  deleteRecord(id) {
    const data = readDb();
    data.records = (data.records || []).filter(r => r.id !== id);
    writeDb(data);
    return true;
  }
};

module.exports = db;