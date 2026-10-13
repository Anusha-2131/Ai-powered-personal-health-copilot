const { v4: uuidv4 } = require('uuid');

// Standard Lab Test Dictionary with Reference Ranges and Explanations
const LAB_DICTIONARY = [
  {
    pattern: /(?:fasting\s+blood\s+(?:sugar|glucose)|fbs|fbg|fasting\s+glucose)/i,
    name: 'Fasting Blood Sugar (FBS)',
    unit: 'mg/dL',
    low: 70,
    high: 99,
    rangeText: '70 - 99 mg/dL',
    meaningHigh: 'Fasting blood sugar is higher than the standard normal range. Elevated values may be seen in prediabetes, diabetes, or due to stress or acute illness.',
    meaningLow: 'Fasting blood sugar is below 70 mg/dL (hypoglycemia), which can cause shakiness, sweating, or dizziness.',
    generalExplanation: 'Measures blood glucose level after at least 8 hours of fasting.'
  },
  {
    pattern: /(?:post\s*prandial\s+(?:blood\s+)?(?:sugar|glucose)|ppbs)/i,
    name: 'Postprandial Blood Glucose (PPBS)',
    unit: 'mg/dL',
    low: 70,
    high: 139,
    rangeText: '< 140 mg/dL',
    meaningHigh: 'Blood sugar 2 hours after a meal is elevated above desirable limits.',
    meaningLow: 'Blood sugar is lower than expected after meals.',
    generalExplanation: 'Measures how your body processes carbohydrates 2 hours following a meal.'
  },
  {
    pattern: /(?:hba1c|glycated\s+hemoglobin|glycosylated\s+hemoglobin)/i,
    name: 'HbA1c (Glycated Hemoglobin)',
    unit: '%',
    low: 4.0,
    high: 5.6,
    rangeText: '< 5.7 %',
    meaningHigh: 'HbA1c of 5.7%-6.4% indicates prediabetes; 6.5% or above suggests diabetes. It shows average blood glucose over the last 2-3 months.',
    meaningLow: 'HbA1c is below typical reference thresholds; discuss with clinician if taking diabetes medications.',
    generalExplanation: 'Reflects average glucose bonded to red blood cells over the preceding 90 days.'
  },
  {
    pattern: /(?:total\s+cholesterol|cholesterol\s+total)/i,
    name: 'Total Cholesterol',
    unit: 'mg/dL',
    low: 100,
    high: 199,
    rangeText: '< 200 mg/dL',
    meaningHigh: 'Total cholesterol is elevated. Higher levels are associated with increased long-term cardiovascular risk.',
    meaningLow: 'Total cholesterol is lower than standard reference baselines.',
    generalExplanation: 'Sum of circulating HDL, LDL, and VLDL cholesterol in the bloodstream.'
  },
  {
    pattern: /(?:ldl(?:\s+cholesterol)?|low\s+density\s+lipoprotein)/i,
    name: 'LDL Cholesterol',
    unit: 'mg/dL',
    low: 50,
    high: 99,
    rangeText: '< 100 mg/dL',
    meaningHigh: 'LDL is considered "bad" cholesterol. Elevated levels can gradually form plaque inside blood vessels.',
    meaningLow: 'LDL is very low, which is generally protective for cardiovascular health.',
    generalExplanation: 'Carries cholesterol particles to tissues; target goals depend on personal heart risk factors.'
  },
  {
    pattern: /(?:hdl(?:\s+cholesterol)?|high\s+density\s+lipoprotein)/i,
    name: 'HDL Cholesterol',
    unit: 'mg/dL',
    low: 40,
    high: 80,
    rangeText: '> 40 mg/dL',
    meaningHigh: 'High HDL is generally considered protective for heart health ("good" cholesterol).',
    meaningLow: 'HDL is below the protective threshold of 40 mg/dL. Aerobic exercise and healthy fats can help raise it.',
    generalExplanation: 'Carries excess cholesterol away from blood vessels back to the liver.'
  },
  {
    pattern: /(?:triglycerides|triglyceride)/i,
    name: 'Triglycerides',
    unit: 'mg/dL',
    low: 40,
    high: 149,
    rangeText: '< 150 mg/dL',
    meaningHigh: 'Elevated triglycerides can be influenced by diet, simple sugars, alcohol, or metabolic syndrome.',
    meaningLow: 'Triglycerides are lower than average reference limits.',
    generalExplanation: 'A type of blood fat stored in fat cells used for energy between meals.'
  },
  {
    pattern: /(?:serum\s+creatinine|creatinine|s\.creatinine)/i,
    name: 'Serum Creatinine',
    unit: 'mg/dL',
    low: 0.7,
    high: 1.2,
    rangeText: '0.7 - 1.2 mg/dL',
    meaningHigh: 'Elevated creatinine suggests decreased kidney filtration capacity or dehydration.',
    meaningLow: 'Low creatinine can reflect low muscle mass or high fluid intake.',
    generalExplanation: 'A normal waste product from muscle breakdown cleared exclusively by healthy kidneys.'
  },
  {
    pattern: /(?:egfr|estimated\s+gfr|glomerular\s+filtration)/i,
    name: 'eGFR',
    unit: 'mL/min/1.73m2',
    low: 60,
    high: 130,
    rangeText: '> 60 mL/min/1.73m2',
    meaningHigh: 'eGFR is well within healthy kidney filtering capacity.',
    meaningLow: 'eGFR below 60 mL/min indicates impaired kidney filtration and requires medical evaluation.',
    generalExplanation: 'Calculated estimate of how efficiently kidneys filter waste from blood.'
  },
  {
    pattern: /(?:blood\s+urea\s+nitrogen|bun|serum\s+urea|urea)/i,
    name: 'Blood Urea Nitrogen (BUN)',
    unit: 'mg/dL',
    low: 7,
    high: 20,
    rangeText: '7 - 20 mg/dL',
    meaningHigh: 'High BUN can reflect dehydration, high protein intake, or reduced kidney clearance.',
    meaningLow: 'Low BUN can occur with low protein diets or severe liver issues.',
    generalExplanation: 'Measures nitrogen from urea, a waste byproduct of protein metabolism.'
  },
  {
    pattern: /(?:serum\s+potassium|potassium|k\+)/i,
    name: 'Serum Potassium',
    unit: 'mmol/L',
    low: 3.5,
    high: 5.1,
    rangeText: '3.5 - 5.1 mmol/L',
    meaningHigh: 'High potassium (hyperkalemia) can affect heart rhythm and requires prompt medical attention.',
    meaningLow: 'Low potassium (hypokalemia) can cause muscle cramps and heart arrhythmias.',
    generalExplanation: 'An essential electrolyte regulating nerve signals and heart rhythm.'
  },
  {
    pattern: /(?:serum\s+sodium|sodium|na\+)/i,
    name: 'Serum Sodium',
    unit: 'mmol/L',
    low: 135,
    high: 145,
    rangeText: '135 - 145 mmol/L',
    meaningHigh: 'High sodium (hypernatremia) usually signals dehydration or fluid loss.',
    meaningLow: 'Low sodium (hyponatremia) can occur with fluid overload or certain medications.',
    generalExplanation: 'Key electrolyte that balances water distribution throughout the body.'
  },
  {
    pattern: /(?:hemoglobin|hb|hgb)/i,
    name: 'Hemoglobin',
    unit: 'g/dL',
    low: 12.0,
    high: 17.0,
    rangeText: '12.0 - 17.0 g/dL',
    meaningHigh: 'Elevated hemoglobin can occur with chronic smoking, sleep apnea, or high altitude living.',
    meaningLow: 'Low hemoglobin indicates anemia, which may cause fatigue, pale skin, or shortness of breath.',
    generalExplanation: 'The iron-rich protein in red blood cells that carries oxygen to body tissues.'
  },
  {
    pattern: /(?:platelet\s+count|platelets|plt)/i,
    name: 'Platelet Count',
    unit: 'x10^3/mcL',
    low: 150,
    high: 450,
    rangeText: '150 - 450 x10^3/mcL',
    meaningHigh: 'High platelets (thrombocytosis) can arise from inflammation or infection.',
    meaningLow: 'Low platelets (thrombocytopenia) can increase bruising or bleeding tendencies.',
    generalExplanation: 'Cell fragments essential for blood clotting and wound repair.'
  },
  {
    pattern: /(?:wbc|white\s+blood\s+cell|total\s+leukocyte\s+count|tlc)/i,
    name: 'White Blood Cell Count (WBC)',
    unit: 'x10^3/mcL',
    low: 4.0,
    high: 11.0,
    rangeText: '4.0 - 11.0 x10^3/mcL',
    meaningHigh: 'Elevated WBC (leukocytosis) frequently indicates an immune response to infection or inflammation.',
    meaningLow: 'Low WBC (leukopenia) may increase vulnerability to infections.',
    generalExplanation: 'Immune defense cells that fight bacterial and viral infections.'
  },
  {
    pattern: /(?:tsh|thyroid\s+stimulating\s+hormone)/i,
    name: 'Thyroid Stimulating Hormone (TSH)',
    unit: 'mIU/L',
    low: 0.4,
    high: 4.2,
    rangeText: '0.4 - 4.2 mIU/L',
    meaningHigh: 'Elevated TSH suggests an underactive thyroid gland (hypothyroidism), often causing sluggishness or cold sensitivity.',
    meaningLow: 'Low TSH suggests an overactive thyroid (hyperthyroidism), often causing rapid heartbeat or unintentional weight loss.',
    generalExplanation: 'Pituitary hormone directing the thyroid gland to produce metabolic hormones.'
  },
  {
    pattern: /(?:vitamin\s+d|25-hydroxy\s+vitamin\s+d|vit\s+d)/i,
    name: 'Vitamin D (25-OH)',
    unit: 'ng/mL',
    low: 30,
    high: 100,
    rangeText: '30 - 100 ng/mL',
    meaningHigh: 'High vitamin D is usually secondary to excessive high-dose supplementation.',
    meaningLow: 'Vitamin D insufficiency or deficiency is common and can affect bone density and immune vitality.',
    generalExplanation: 'Fat-soluble vitamin vital for calcium absorption, bone strength, and immune function.'
  },
  {
    pattern: /(?:vitamin\s+b12|vit\s+b12|cobalamin)/i,
    name: 'Vitamin B12',
    unit: 'pg/mL',
    low: 200,
    high: 900,
    rangeText: '200 - 900 pg/mL',
    meaningHigh: 'High B12 is usually benign or related to supplements.',
    meaningLow: 'Low B12 can cause fatigue, tingling sensations in hands or feet (neuropathy), and anemia.',
    generalExplanation: 'Essential vitamin for red blood cell production and nerve health.'
  },
  {
    pattern: /(?:sgpt|alt|alanine\s+aminotransferase)/i,
    name: 'ALT / SGPT',
    unit: 'U/L',
    low: 7,
    high: 45,
    rangeText: '< 45 U/L',
    meaningHigh: 'Elevated ALT is a sensitive marker of liver cell irritation or fatty liver changes.',
    meaningLow: 'Low ALT is generally normal with no clinical significance.',
    generalExplanation: 'Enzyme located predominantly in liver cells; releases into blood during liver stress.'
  },
  {
    pattern: /(?:sgot|ast|aspartate\s+aminotransferase)/i,
    name: 'AST / SGOT',
    unit: 'U/L',
    low: 8,
    high: 40,
    rangeText: '< 40 U/L',
    meaningHigh: 'Elevated AST can reflect liver inflammation, muscle injury, or strenuous exercise.',
    meaningLow: 'Low AST is generally normal.',
    generalExplanation: 'Enzyme found in liver, heart, and muscle tissue.'
  },
  {
    pattern: /(?:blood\s+pressure|bp)/i,
    name: 'Blood Pressure',
    unit: 'mmHg',
    low: 90,
    high: 130,
    rangeText: '< 130/80 mmHg',
    meaningHigh: 'Blood pressure is elevated above the ideal resting threshold.',
    meaningLow: 'Blood pressure is lower than normal resting boundaries.',
    generalExplanation: 'Measures the force of circulating blood against artery walls.'
  },
  {
    pattern: /(?:oxygen\s+saturation|spo2)/i,
    name: 'Oxygen Saturation (SpO2)',
    unit: '%',
    low: 95,
    high: 100,
    rangeText: '95 - 100 %',
    meaningHigh: 'Normal healthy oxygen saturation on room air.',
    meaningLow: 'SpO2 below 95% indicates reduced oxygen in arterial blood and warrants clinical evaluation.',
    generalExplanation: 'Percentage of hemoglobin molecules carrying oxygen.'
  }
];

// Common Medications Knowledge
const KNOWN_MEDS = [
  { name: 'Metformin', class: 'Biguanide', defaultDose: '500 mg', route: 'Oral', freq: 'Twice daily with meals', indication: 'Type 2 Diabetes' },
  { name: 'Lisinopril', class: 'ACE Inhibitor', defaultDose: '10 mg', route: 'Oral', freq: 'Once daily (Morning)', indication: 'Hypertension' },
  { name: 'Atorvastatin', class: 'Statin', defaultDose: '20 mg', route: 'Oral', freq: 'Once daily at bedtime', indication: 'Dyslipidemia / Cholesterol' },
  { name: 'Amlodipine', class: 'Calcium Channel Blocker', defaultDose: '5 mg', route: 'Oral', freq: 'Once daily', indication: 'Hypertension' },
  { name: 'Losartan', class: 'ARB', defaultDose: '50 mg', route: 'Oral', freq: 'Once daily', indication: 'Hypertension' },
  { name: 'Azithromycin', class: 'Macrolide Antibiotic', defaultDose: '500 mg', route: 'Oral', freq: 'Once daily for 5 days', indication: 'Bacterial Infection' },
  { name: 'Amoxicillin', class: 'Penicillin Antibiotic', defaultDose: '500 mg', route: 'Oral', freq: 'Three times daily', indication: 'Bacterial Infection' },
  { name: 'Paracetamol', class: 'Antipyretic / Analgesic', defaultDose: '650 mg', route: 'Oral', freq: 'As needed for fever (SOS)', indication: 'Fever and pain relief' },
  { name: 'Ibuprofen', class: 'NSAID', defaultDose: '400 mg', route: 'Oral', freq: 'After food as needed', indication: 'Pain & inflammation' },
  { name: 'Levocetirizine', class: 'Antihistamine', defaultDose: '5 mg', route: 'Oral', freq: 'Once daily at bedtime', indication: 'Allergy & cough symptoms' },
  { name: 'Cetirizine', class: 'Antihistamine', defaultDose: '10 mg', route: 'Oral', freq: 'Once daily at bedtime', indication: 'Allergy relief' },
  { name: 'Pantoprazole', class: 'Proton Pump Inhibitor', defaultDose: '40 mg', route: 'Oral', freq: 'Once daily before breakfast', indication: 'Acid reflux / Gastritis' },
  { name: 'Omeprazole', class: 'Proton Pump Inhibitor', defaultDose: '20 mg', route: 'Oral', freq: 'Once daily before breakfast', indication: 'Acid reflux / GERD' },
  { name: 'Levothyroxine', class: 'Thyroid Hormone', defaultDose: '50 mcg', route: 'Oral', freq: 'Once daily early morning empty stomach', indication: 'Hypothyroidism' },
  { name: 'Aspirin', class: 'Antiplatelet', defaultDose: '75 mg', route: 'Oral', freq: 'Once daily post lunch', indication: 'Cardiovascular Protection' },
  { name: 'Ambroxol', class: 'Mucolytic', defaultDose: '30 mg / 5 mL', route: 'Oral', freq: 'Three times daily after meals', indication: 'Productive Cough' }
];

/**
 * Parses raw text and structures into FHIR-inspired clinical entities
 * @param {string} text - Raw OCR or manual text
 * @param {string} declaredDocType - User-selected document type
 * @param {object} patientProfile - Patient profile for allergy cross-referencing
 * @returns {object} Extracted structured record with confidence scores
 */
function parseClinicalText(text, declaredDocType = 'other', patientProfile = null) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = text.toLowerCase();

  // 1. Detect Document Type
  let detectedDocType = declaredDocType && declaredDocType !== 'other' ? declaredDocType : 'other';
  if (detectedDocType === 'other') {
    if (/(?:lab\s+report|pathology|metabolic|lipid\s+panel|test\s+report|reference\s+range)/i.test(text)) {
      detectedDocType = 'lab_report';
    } else if (/(?:discharge\s+summary|admission\s+date|discharge\s+date|ip\s+no|hospital\s+course)/i.test(text)) {
      detectedDocType = 'discharge_summary';
    } else if (/(?:rx|prescription|tab\.|cap\.|syrup|dosage|take\s+after\s+food)/i.test(text)) {
      detectedDocType = 'prescription';
    } else if (/(?:ultrasound|x-ray|mri|ct\s+scan|imaging|echocardiogram)/i.test(text)) {
      detectedDocType = 'diagnostic_report';
    }
  }

  // 2. Extract Document Date
  let docDate = new Date().toISOString().slice(0, 10);
  const dateRegex = /(?:date|dated|dt)[:\s]*([0-9]{1,2}[-/.][0-9]{1,2}[-/.][0-9]{2,4}|[0-9]{1,2}[-\s](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-\s][0-9]{2,4})/i;
  const dateMatch = text.match(dateRegex);
  if (dateMatch && dateMatch[1]) {
    try {
      const parsed = new Date(dateMatch[1]);
      if (!isNaN(parsed.getTime())) {
        docDate = parsed.toISOString().slice(0, 10);
      }
    } catch {
      // keep default
    }
  }

  // 3. Extract Facility & Provider
  let facility = 'General Medical Facility';
  let provider = 'Attending Physician';

  const facilityMatch = text.match(/(?:hospital|clinic|pathlabs?|diagnostics?|medical\s+centre|health\s+care)[:\s]*([^\n,]+)/i) ||
    text.match(/^([A-Z][A-Za-z0-9\s&]+(?:HOSPITAL|CLINIC|LABS|DIAGNOSTICS|HEALTH))/m);
  if (facilityMatch) {
    facility = facilityMatch[0].trim().slice(0, 60);
  }

  const doctorMatch = text.match(/(?:dr\.|doctor|consultant|referred\s+by)[:\s]*([A-Za-z\s.,]+(?:MD|DM|MBBS|MS|DNB)?)/i);
  if (doctorMatch && doctorMatch[1]) {
    provider = doctorMatch[1].trim().split('\n')[0].slice(0, 50);
    if (!provider.toLowerCase().startsWith('dr.')) {
      provider = `Dr. ${provider}`;
    }
  }

  // 4. Extract Observations / Lab Tests
  const observations = [];
  const processedTests = new Set();

  for (const item of LAB_DICTIONARY) {
    if (item.pattern.test(text)) {
      // Look for line or nearby tokens containing value
      for (const line of lines) {
        if (item.pattern.test(line)) {
          // Extract numeric value (including decimals or <, > signs)
          const valMatch = line.match(/[:\s]\s*([<>]?\s*\d+(?:\.\d+)?)\s*(mg\/dL|%|mmol\/L|g\/dL|mL\/min|mIU\/L|ng\/mL|pg\/mL|U\/L|mmHg|°F)?/i) ||
            line.match(/(\d+(?:\.\d+)?)/);

          if (valMatch && !processedTests.has(item.name)) {
            processedTests.add(item.name);
            const rawVal = valMatch[1].replace(/\s+/g, '');
            const numVal = parseFloat(rawVal.replace(/[<>]/g, ''));
            const unit = valMatch[2] || item.unit;

            let interpretation = 'NORMAL';
            let explanation = item.generalExplanation;

            if (!isNaN(numVal)) {
              if (item.high && numVal > item.high) {
                interpretation = 'HIGH';
                explanation = item.meaningHigh;
              } else if (item.low && numVal < item.low) {
                interpretation = 'LOW';
                explanation = item.meaningLow;
              }
            }

            observations.push({
              id: `obs-${uuidv4().slice(0, 6)}`,
              testName: item.name,
              value: rawVal,
              unit: unit,
              referenceRangeLow: String(item.low || ''),
              referenceRangeHigh: String(item.high || ''),
              referenceRangeText: item.rangeText,
              interpretation: interpretation,
              explanation: explanation,
              needsReview: interpretation !== 'NORMAL'
            });
            break;
          }
        }
      }
    }
  }

  // Blood Pressure special pattern (e.g. 130/80 mmHg or 120 / 80)
  const bpMatch = text.match(/(?:bp|blood\s+pressure)[:\s]*(\d{2,3}\s*\/\s*\d{2,3})\s*(?:mmhg)?/i);
  if (bpMatch && !processedTests.has('Blood Pressure')) {
    processedTests.add('Blood Pressure');
    const bpVal = bpMatch[1].replace(/\s+/g, '');
    const [sys, dia] = bpVal.split('/').map(n => parseInt(n, 10));
    let bpInterp = 'NORMAL';
    let bpExpl = 'Resting blood pressure is within recommended limits.';
    if (sys > 130 || dia > 80) {
      bpInterp = 'HIGH';
      bpExpl = 'Blood pressure reading is higher than optimal resting target (<130/80 mmHg).';
    }
    observations.push({
      id: `obs-bp-${uuidv4().slice(0, 6)}`,
      testName: 'Blood Pressure',
      value: bpVal,
      unit: 'mmHg',
      referenceRangeLow: '90/60',
      referenceRangeHigh: '130/80',
      referenceRangeText: '< 130/80 mmHg',
      interpretation: bpInterp,
      explanation: bpExpl,
      needsReview: bpInterp !== 'NORMAL'
    });
  }

  // 5. Extract Medications
  const medications = [];
  const processedMeds = new Set();

  for (const km of KNOWN_MEDS) {
    const medRegex = new RegExp(`\\b${km.name}\\b`, 'i');
    if (medRegex.test(text)) {
      processedMeds.add(km.name.toLowerCase());
      // Find matching line for dosage details
      let dosage = km.defaultDose;
      let frequency = km.freq;
      let duration = 'Ongoing / 30 days';
      let instructions = `Take ${km.defaultDose} orally as directed by physician.`;

      for (const line of lines) {
        if (medRegex.test(line)) {
          // Check for dosage (e.g. 500 mg, 10mg)
          const doseMatch = line.match(/(\d+\s*(?:mg|mcg|ml|g))/i);
          if (doseMatch) dosage = doseMatch[1];

          // Check for frequency
          if (/\b(?:OD|once\s+daily|1\s+time)\b/i.test(line)) frequency = 'Once daily';
          else if (/\b(?:BD|twice\s+daily|BID|2\s+times)\b/i.test(line)) frequency = 'Twice daily';
          else if (/\b(?:TDS|TID|three\s+times)\b/i.test(line)) frequency = 'Three times daily';
          else if (/\b(?:HS|bedtime|night)\b/i.test(line)) frequency = 'Once daily at bedtime';
          else if (/\b(?:SOS|prn|as\s+needed)\b/i.test(line)) frequency = 'As needed (SOS)';

          // Check for duration (e.g. 5 days, 1 month)
          const durMatch = line.match(/(\d+\s*(?:days?|weeks?|months?))/i);
          if (durMatch) duration = durMatch[1];

          // Check instructions (with meals, empty stomach)
          if (/after\s+(?:food|meals)/i.test(line)) instructions = 'Take after meals.';
          else if (/before\s+(?:food|meals|breakfast)/i.test(line)) instructions = 'Take before meals on an empty stomach.';
          else if (/with\s+(?:food|meals)/i.test(line)) instructions = 'Take with food or meals.';
          break;
        }
      }

      medications.push({
        id: `med-${uuidv4().slice(0, 6)}`,
        name: km.name,
        strength: dosage,
        dosage: `1 dose (${dosage})`,
        route: km.route,
        frequency: frequency,
        duration: duration,
        instructions: instructions,
        indication: km.indication,
        isActive: true,
        needsReview: false
      });
    }
  }

  // Also extract generic "Tab. / Cap." prescription patterns
  const rxLineRegex = /(?:tab\.|cap\.|syrup|inj\.)\s+([A-Za-z0-9\-]+)\s*(\d+\s*(?:mg|mcg|ml))?/gi;
  let rxMatch;
  while ((rxMatch = rxLineRegex.exec(text)) !== null) {
    const medName = rxMatch[1];
    if (medName.length > 2 && !processedMeds.has(medName.toLowerCase())) {
      processedMeds.add(medName.toLowerCase());
      const dose = rxMatch[2] || 'As prescribed';
      medications.push({
        id: `med-gen-${uuidv4().slice(0, 6)}`,
        name: medName.charAt(0).toUpperCase() + medName.slice(1),
        strength: dose,
        dosage: dose,
        route: 'Oral',
        frequency: 'As directed by physician',
        duration: 'As advised',
        instructions: 'Follow prescription instructions.',
        indication: 'Prescribed medication',
        isActive: true,
        needsReview: true // Flag for user confirmation
      });
    }
  }

  // 6. Extract Diagnoses / Conditions
  const conditions = [];
  const conditionList = [
    { pattern: /(?:type\s*2\s*diabetes|t2dm|diabetes\s+mellitus)/i, name: 'Type 2 Diabetes Mellitus' },
    { pattern: /(?:essential\s+hypertension|hypertension|htn|high\s+bp)/i, name: 'Essential Hypertension' },
    { pattern: /(?:dyslipidemia|hypercholesterolemia|high\s+cholesterol)/i, name: 'Dyslipidemia' },
    { pattern: /(?:acute\s+bronchitis|bronchitis)/i, name: 'Acute Bronchitis' },
    { pattern: /(?:asthma|bronchial\s+asthma)/i, name: 'Bronchial Asthma' },
    { pattern: /(?:hypothyroidism|thyroid\s+deficiency)/i, name: 'Hypothyroidism' },
    { pattern: /(?:fatty\s+liver|hepatic\s+steatosis)/i, name: 'Hepatic Steatosis (Fatty Liver)' },
    { pattern: /(?:gerd|acid\s+reflux|gastritis)/i, name: 'Gastroesophageal Reflux Disease (GERD)' }
  ];

  for (const c of conditionList) {
    if (c.pattern.test(text)) {
      conditions.push({
        id: `cond-${uuidv4().slice(0, 6)}`,
        name: c.name,
        status: 'active',
        notes: `Identified in document dated ${docDate}`,
        needsReview: false
      });
    }
  }

  // 7. Extract Allergies & Check Cross-Reactivity
  const allergies = [];
  const allergyMatch = text.match(/(?:allergy|allergies|allergic\s+to|known\s+allergy)[:\s]*([^\n.]+)/i);
  if (allergyMatch && allergyMatch[1]) {
    const rawAllergy = allergyMatch[1].trim();
    if (!/none|nil|no\s+known/i.test(rawAllergy)) {
      allergies.push({
        id: `alg-${uuidv4().slice(0, 6)}`,
        substance: rawAllergy.slice(0, 40),
        reaction: 'Documented sensitivity',
        severity: 'moderate',
        needsReview: false
      });
    }
  }

  // Cross-reactivity allergy alert check
  let allergyAlert = null;
  const patientAllergies = [
    ...(patientProfile?.allergies || []),
    ...allergies
  ];

  for (const pa of patientAllergies) {
    const sub = (pa.substance || '').toLowerCase();
    if (sub.includes('penicillin')) {
      // Check if document contains penicillin derivatives (amoxicillin, ampicillin, augmentin)
      const hasPenicillinDrug = medications.some(m => /amoxicillin|ampicillin|augmentin|penicillin/i.test(m.name));
      if (hasPenicillinDrug) {
        allergyAlert = `Safety Alert: Prescribed medication matches documented allergy to ${pa.substance}! Confirm immediately with prescribing clinician.`;
      }
    }
  }

  // 8. Follow-up / Encounter
  let followUpInstructions = 'Follow up with your healthcare provider as scheduled.';
  let followUpDate = null;
  const followUpMatch = text.match(/(?:follow\s*up|review)[:\s]*([^\n.]+)/i);
  if (followUpMatch && followUpMatch[1]) {
    followUpInstructions = followUpMatch[1].trim();
  }

  // 9. Flagged Out of Range Tests
  const flaggedObservations = observations.filter(o => o.interpretation !== 'NORMAL');

  // 10. Generate Plain-Language Bilingual Summaries
  const summaries = generateRuleBasedSummary({
    docType: detectedDocType,
    facility,
    provider,
    date: docDate,
    observations,
    flaggedObservations,
    medications,
    conditions,
    allergies,
    allergyAlert,
    followUpInstructions
  });

  // Calculate extraction confidence score
  let confidenceScore = 92;
  const unreviewedCount = observations.filter(o => o.needsReview).length + medications.filter(m => m.needsReview).length;
  if (unreviewedCount > 3) confidenceScore -= 12;
  if (observations.length === 0 && medications.length === 0 && conditions.length === 0) confidenceScore = 50;

  return {
    title: formatDocumentTitle(detectedDocType, facility, docDate),
    documentType: detectedDocType,
    documentDate: docDate,
    facility,
    provider,
    rawText: text,
    confidenceScore: Math.max(40, confidenceScore),
    observations,
    medications,
    conditions,
    allergies,
    encounter: {
      serviceType: getServiceType(detectedDocType),
      providerName: provider,
      facilityName: facility,
      visitDate: docDate,
      followUpDate,
      followUpInstructions
    },
    summary: summaries
  };
}

function formatDocumentTitle(docType, facility, date) {
  const typeMap = {
    lab_report: 'Laboratory Diagnostic Report',
    prescription: 'Outpatient Prescription',
    discharge_summary: 'Hospital Discharge Summary',
    diagnostic_report: 'Diagnostic Imaging / Evaluation',
    other: 'Medical Record'
  };
  return `${typeMap[docType] || 'Medical Record'} - ${facility} (${date})`;
}

function getServiceType(docType) {
  switch (docType) {
    case 'lab_report': return 'Pathology & Diagnostic Laboratory';
    case 'prescription': return 'Outpatient Consultation';
    case 'discharge_summary': return 'Inpatient Hospital Stay';
    case 'diagnostic_report': return 'Diagnostic Radiology / Imaging';
    default: return 'Healthcare Encounter';
  }
}

/**
 * Generates plain-language bilingual summary (English & Hindi)
 */
function generateRuleBasedSummary(data) {
  const { docType, facility, provider, date, observations, flaggedObservations, medications, conditions, allergies, allergyAlert, followUpInstructions } = data;

  // English Summary Builder
  let englishSummary = '';
  let hindiSummary = '';
  const keyTakeaways = [];
  const questionsForDoctor = [];
  const outOfRangeExplanations = [];

  if (docType === 'lab_report') {
    if (flaggedObservations.length > 0) {
      const flaggedNames = flaggedObservations.map(o => `${o.testName} (${o.value} ${o.unit}, flag: ${o.interpretation})`).join(', ');
      englishSummary = `This diagnostic test from ${facility} evaluated key health markers. While several values are within healthy normal ranges, the following test(s) fall outside standard reference benchmarks: ${flaggedNames}. Having values outside reference ranges does not automatically constitute a medical emergency, but it indicates areas to discuss with ${provider}.`;

      hindiSummary = `यह लैब रिपोर्ट आपके स्वास्थ्य संकेतकों की जांच करती है। कुछ जांच परिणाम सामान्य सीमा के भीतर हैं, लेकिन निम्नलिखित मान सामान्य संदर्भ सीमा से बाहर हैं: ${flaggedNames}। संदर्भ सीमा से बाहर होने का अर्थ तत्काल कोई आपातकाल नहीं है, लेकिन यह दर्शाता है कि आपको ${provider} से परामर्श करना चाहिए ताकि उचित देखभाल की जा सके।`;
    } else {
      englishSummary = `This diagnostic test from ${facility} evaluated your health markers. All identified test values are currently within standard healthy reference ranges. Keep this record in your health timeline for comparison with future tests.`;
      hindiSummary = `यह लैब रिपोर्ट दर्शाती है कि आपके सभी जांच परिणाम सामान्य संदर्भ सीमाओं के भीतर हैं। भविष्य की तुलना के लिए इस रिकॉर्ड को सुरक्षित रखें।`;
    }

    flaggedObservations.forEach(o => {
      keyTakeaways.push(`${o.testName} is flagged as ${o.interpretation} at ${o.value} ${o.unit} (standard range: ${o.referenceRangeText}).`);
      questionsForDoctor.push(`What lifestyle adjustments or medications do you recommend to bring my ${o.testName} closer to target range?`);
      outOfRangeExplanations.push({
        testName: o.testName,
        value: `${o.value} ${o.unit}`,
        normalRange: o.referenceRangeText,
        generalMeaning: o.explanation,
        recommendation: `Discuss this finding with your physician during your next consultation.`
      });
    });

    questionsForDoctor.push(`When should this lab panel be repeated to monitor progress?`);

  } else if (docType === 'prescription') {
    const medNames = medications.map(m => m.name).join(', ') || 'prescribed items';
    englishSummary = `This prescription from ${provider} outlines your treatment plan, including: ${medNames}. Please follow the exact frequency, duration, and meal instructions specified for each medication. Do not discontinue antibiotics before the prescribed course is finished, even if you feel better.`;

    hindiSummary = `यह पर्चा (${provider}) द्वारा निर्धारित आपकी दवाओं का विवरण देता है: ${medNames}। कृपया प्रत्येक दवा के लिए बताए गए समय, अवधि और भोजन के निर्देशों का सावधानीपूर्वक पालन करें। एंटीबायोटिक दवाओं का कोर्स पूरा होने से पहले दवा बंद न करें।`;

    medications.forEach(m => {
      keyTakeaways.push(`${m.name} (${m.strength}): ${m.frequency} - ${m.instructions}`);
    });

    questionsForDoctor.push('Are there any specific food items, supplements, or over-the-counter drugs I should avoid while taking these medications?');
    questionsForDoctor.push('What common side effects should I be mindful of?');

  } else if (docType === 'discharge_summary') {
    englishSummary = `This hospital discharge summary from ${facility} documents your recent hospital stay, clinical stabilization, and transition to home recovery. It details your confirmed diagnoses, discharge medications, and essential follow-up timeline.`;

    hindiSummary = `यह डिस्चार्ज सारांश अस्पताल में आपके इलाज, स्वास्थ्य में सुधार और घर पर देखभाल के निर्देशों को दर्शाता है। इसमें आपकी दवाओं और डॉक्टर से दोबारा मिलने की तारीख का विवरण शामिल है।`;

    keyTakeaways.push(`Discharged from ${facility} under the care of ${provider}.`);
    if (medications.length > 0) {
      keyTakeaways.push(`Prescribed ${medications.length} discharge maintenance medication(s). Review schedule carefully.`);
    }
    if (followUpInstructions) {
      keyTakeaways.push(`Follow-up instructions: ${followUpInstructions}`);
    }

    questionsForDoctor.push('What specific symptoms or vital changes indicate that I should contact your clinic before my scheduled follow-up?');
    questionsForDoctor.push('When is it safe for me to resume regular physical exercise and driving?');

  } else {
    englishSummary = `This medical document from ${facility} dated ${date} has been organized into your health timeline. Review extracted items to ensure accurate ongoing records.`;
    hindiSummary = `यह चिकित्सा दस्तावेज आपकी स्वास्थ्य समयरेखा में सुरक्षित कर लिया गया है। कृपया निकाले गए विवरणों की समीक्षा करें।`;
    keyTakeaways.push(`Document registered from ${facility}.`);
    questionsForDoctor.push('How does this record correlate with my long-term healthcare plan?');
  }

  if (allergyAlert) {
    keyTakeaways.unshift(allergyAlert);
    questionsForDoctor.unshift('Verify allergy safety: Does this prescription contain any penicillin-class compounds?');
  }

  return {
    plainLanguageSummary: englishSummary,
    hindiSummary: hindiSummary,
    keyTakeaways: keyTakeaways.slice(0, 5),
    questionsForDoctor: questionsForDoctor.slice(0, 4),
    outOfRangeExplanations,
    disclaimer: 'This plain-language summary is generated by AI to help you understand your medical records. It is NOT a medical diagnosis, treatment plan, or professional medical advice. Never adjust your medications without discussing them with a licensed healthcare professional. For acute, sudden, or severe symptoms, seek urgent emergency medical attention.',
    generatedBy: 'local-medical-heuristics',
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  parseClinicalText,
  generateRuleBasedSummary,
  LAB_DICTIONARY,
  KNOWN_MEDS
};