const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { extractTextFromFile } = require('../services/ocrService');
const { isGeminiConfigured, processMedicalText } = require('../services/geminiService');
const { exportPatientToFhirBundle, generateMarkdownSummary } = require('../services/fhirExport');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'text/plain'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload a PDF, PNG, or JPEG file.'));
    }
  }
});

const SAMPLE_DOCUMENTS = [
  {
    id: 'sample-lab-lipid',
    title: 'Metro PathLabs - Comprehensive Metabolic Panel & Lipid Profile',
    docType: 'lab_report',
    facility: 'Metro Diagnostics & PathLabs',
    provider: 'Dr. Rajesh Gupta, MD',
    date: '2026-10-05',
    description: 'Realistic lab report showing out-of-range fasting blood glucose, HbA1c, LDL cholesterol, and normal kidney markers.',
    text: `METRO DIAGNOSTICS & PATHOLOGY LABS
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
Correlate clinically with primary physician.`
  },
  {
    id: 'sample-discharge-cardio',
    title: 'Apollo Specialty Hospital - Cardiology Discharge Summary',
    docType: 'discharge_summary',
    facility: 'Apollo Specialty Hospital',
    provider: 'Dr. Vikram Malhotra, DM',
    date: '2026-08-15',
    description: 'Cardiology discharge summary with multi-drug regimen, allergy cross-check note, and follow-up timeline.',
    text: `APOLLO SPECIALTY HOSPITAL - DISCHARGE SUMMARY
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
- Follow up in Cardiology OPD after 4 weeks with fresh lipid profile and kidney function test.
- Seek immediate emergency care for crushing chest pain or shortness of breath.`
  },
  {
    id: 'sample-rx-clinic',
    title: 'City Health Family Clinic - Acute Bronchitis Prescription',
    docType: 'prescription',
    facility: 'City Health Family Clinic',
    provider: 'Dr. Ananya Sen, MD',
    date: '2026-10-02',
    description: 'Outpatient acute prescription with antibiotic dosage, fever SOS instruction, and allergy awareness.',
    text: `CITY HEALTH FAMILY CLINIC
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
- Plenty of warm fluids. Avoid cold beverages.
- Review after 5 days or immediately if breathlessness develops.`
  },
  {
    id: 'sample-usg-liver',
    title: 'Apex Diagnostic Imaging - Abdominal Ultrasound Report',
    docType: 'diagnostic_report',
    facility: 'Apex Diagnostic Imaging',
    provider: 'Dr. Ramesh K., MD (Radiodiagnosis)',
    date: '2026-05-12',
    description: 'Ultrasound report detailing Grade 1 Fatty Liver (hepatic steatosis) with lifestyle recommendations.',
    text: `APEX DIAGNOSTIC IMAGING & SCAN CENTRE
Patient: Aarav Sharma   Age: 45 / Male   Date: 12-May-2026
ULTRASOUND WHOLE ABDOMEN REPORT

LIVER:
Liver is mildly enlarged in span (15.8 cm). Diffuse increase in parenchymal echogenicity with mild posterior beam attenuation, suggestive of Grade 1 Fatty Infiltration (Hepatic Steatosis). No focal parenchymal mass lesion seen. Intrahepatic biliary radicles are not dilated.

GALLBLADDER:
Well distended, wall thickness normal. No calculus or sludge seen.

PANCREAS & SPLEEN:
Pancreas visualized normal in size and echotexture. Spleen is normal in size (9.6 cm), no splenomegaly.

KIDNEYS:
Both kidneys are normal in size, shape, and cortical echogenicity. Corticomedullary differentiation is well preserved. No hydronephrosis or renal calculi seen. Bilateral renal margins clear.

IMPRESSION:
Grade 1 Fatty Infiltration of Liver (Hepatic Steatosis).
Advise: Clinical correlation with liver enzymes (ALT/AST), dietary carbohydrate restriction, weight management, and aerobic exercise.`
  }
];

// 1. Config status
router.get('/config', (req, res) => {
  res.json({
    geminiConfigured: isGeminiConfigured(),
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    uploadLimitMb: 10,
    serverTime: new Date().toISOString(),
    environment: 'Prototype / Educational Copilot'
  });
});

// 2. Samples
router.get('/samples', (req, res) => {
  res.json({
    success: true,
    samples: SAMPLE_DOCUMENTS
  });
});

// 3. Patients
router.get('/patients', (req, res) => {
  const patients = db.getPatients();
  res.json({ success: true, patients });
});

router.post('/patients', (req, res) => {
  try {
    const patient = db.createPatient(req.body);
    res.status(201).json({ success: true, patient });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/patients/:id', (req, res) => {
  const patient = db.getPatientById(req.params.id);
  if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
  res.json({ success: true, patient });
});

router.put('/patients/:id', (req, res) => {
  const updated = db.updatePatient(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'Patient not found' });
  res.json({ success: true, patient: updated });
});

router.delete('/patients/:id', (req, res) => {
  db.deletePatient(req.params.id);
  res.json({ success: true, message: 'Patient profile and associated records removed' });
});

router.post('/patients/reset-demo', (req, res) => {
  const demoData = db.resetToDemo();
  res.json({ success: true, message: 'Database reset to default demo records', demoData });
});

// 4. Records
router.get('/records', (req, res) => {
  const { patientId, docType, q, medicine, test, startDate, endDate } = req.query;
  if (!patientId) {
    return res.status(400).json({ success: false, error: 'patientId is required' });
  }
  const records = db.getRecords(patientId, { docType, q, medicine, test, startDate, endDate });
  res.json({ success: true, count: records.length, records });
});

router.get('/records/:id', (req, res) => {
  const record = db.getRecordById(req.params.id);
  if (!record) return res.status(404).json({ success: false, error: 'Record not found' });
  res.json({ success: true, record });
});

// 5. File Upload (PDF, PNG, JPG)
router.post('/upload', upload.single('document'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded or invalid file format' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    file: {
      fileName: req.file.originalname,
      serverFileName: req.file.filename,
      filePath: req.file.path,
      fileUrl,
      mimeType: req.file.mimetype,
      size: req.file.size
    }
  });
});

// 6. Extraction & Processing Pipeline (Dry Run / Draft)
router.post('/process', async (req, res) => {
  try {
    const { filePath, rawText, docType, patientId, userConsent } = req.body;

    if (!userConsent) {
      return res.status(403).json({
        success: false,
        error: 'User consent required to process healthcare data with AI / OCR tools.'
      });
    }

    let textToProcess = rawText || '';
    let ocrMeta = { sourceMethod: 'manual_text', confidence: 95, isScanned: false };

    if (filePath) {
      const mimeType = req.body.mimeType || 'application/pdf';
      const ocrResult = await extractTextFromFile(filePath, mimeType);
      textToProcess = ocrResult.text;
      ocrMeta = ocrResult;
    }

    if (!textToProcess || textToProcess.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No readable text could be extracted from this document. Please enter or paste text manually.'
      });
    }

    const patientProfile = patientId ? db.getPatientById(patientId) : null;
    const extractionResult = await processMedicalText(textToProcess, docType, patientProfile);

    if (ocrMeta.confidence) {
      extractionResult.confidenceScore = Math.min(extractionResult.confidenceScore || 90, ocrMeta.confidence);
    }
    extractionResult.isScanned = ocrMeta.isScanned;
    extractionResult.ocrMethod = ocrMeta.sourceMethod;

    res.json({
      success: true,
      draftRecord: extractionResult
    });
  } catch (error) {
    console.error('[Process Error]', error);
    res.status(500).json({
      success: false,
      error: `Document processing failed: ${error.message}`
    });
  }
});

// 7. Save Approved / Edited Record
router.post('/records', (req, res) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      return res.status(400).json({ success: false, error: 'patientId is required' });
    }
    const record = db.createRecord(req.body);
    res.status(201).json({ success: true, record });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 8. Update Record
router.put('/records/:id', (req, res) => {
  const updated = db.updateRecord(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'Record not found' });
  res.json({ success: true, record: updated });
});

// 9. Delete Record
router.delete('/records/:id', (req, res) => {
  const record = db.getRecordById(req.params.id);
  if (!record) return res.status(404).json({ success: false, error: 'Record not found' });

  if (record.fileUrl) {
    const localFile = path.join(__dirname, '..', record.fileUrl);
    if (fs.existsSync(localFile)) {
      try { fs.unlinkSync(localFile); } catch (e) { console.warn('Could not delete local file:', e); }
    }
  }

  db.deleteRecord(req.params.id);
  res.json({ success: true, message: 'Record deleted successfully' });
});

// 10. FHIR R4 Single Record
router.get('/records/:id/export/fhir', (req, res) => {
  const record = db.getRecordById(req.params.id);
  if (!record) return res.status(404).json({ success: false, error: 'Record not found' });
  const patient = db.getPatientById(record.patientId) || { id: record.patientId, name: 'Patient' };

  const bundle = exportPatientToFhirBundle(patient, [record]);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="FHIR-Record-${record.id}.json"`);
  res.send(JSON.stringify(bundle, null, 2));
});

// 11. Complete FHIR R4 Bundle
router.get('/export/patient/:id/fhir', (req, res) => {
  const patient = db.getPatientById(req.params.id);
  if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

  const records = db.getRecords(patient.id);
  const bundle = exportPatientToFhirBundle(patient, records);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="FHIR-HealthRecord-${patient.name.replace(/\s+/g, '_')}.json"`);
  res.send(JSON.stringify(bundle, null, 2));
});

// 12. Printable Markdown Health Summary
router.get('/export/patient/:id/markdown', (req, res) => {
  const patient = db.getPatientById(req.params.id);
  if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

  const records = db.getRecords(patient.id);
  const markdownReport = generateMarkdownSummary(patient, records);

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="HealthSummary-${patient.name.replace(/\s+/g, '_')}.md"`);
  res.send(markdownReport);
});

module.exports = router;