const { parseClinicalText } = require('./clinicalparser');

/**
 * Checks if Gemini API key is configured
 */
function isGeminiConfigured() {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim() !== '' && key !== 'your_gemini_api_key_here');
}

/**
 * Processes medical text using Gemini API with fallback to local clinical parser
 * @param {string} text - Raw OCR or manual clinical text
 * @param {string} docType - Declared document type
 * @param {object} patientProfile - Patient profile for allergy and context
 * @returns {Promise<object>} Structured extraction with bilingual summaries
 */
async function processMedicalText(text, docType = 'other', patientProfile = null) {
  if (!isGeminiConfigured()) {
    console.log('[AI Service] No GEMINI_API_KEY detected in environment. Running in Demo / Local Heuristics mode.');
    const result = parseClinicalText(text, docType, patientProfile);
    result.summary.generatedBy = 'local-medical-heuristics (Demo Mode)';
    return result;
  }

  const apiKey = process.env.GEMINI_API_KEY.trim();
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const prompt = `You are a specialized clinical data structuring and patient-communication AI assistant for "Personal Health Copilot".
Analyze the following healthcare document text and extract structured FHIR-inspired clinical entities.

CRITICAL CLINICAL & SAFETY RULES:
1. STRICT TRUTHFULNESS: Never invent missing values, diagnoses, dosages, or reference ranges. If text is unreadable or absent, do not guess. Mark uncertain fields with "needsReview": true.
2. REFERENCE RANGES: For lab tests, compare values strictly against the stated reference ranges. Classify as "NORMAL", "HIGH", "LOW", or "OUT_OF_RANGE".
3. NON-ALARMING & OBJECTIVE: Explain out-of-range results calmly in plain everyday language without catastrophic or alarming terminology.
4. MEDICAL DISCLAIMER: Emphasize that this is an AI summary and NOT a medical diagnosis or treatment plan. Never instruct the user to alter, start, or stop medications. Advise discussing findings with a qualified clinician.
5. MULTILINGUAL SUPPORT: Provide plain-language explanations in BOTH English and natural, easy-to-understand Hindi (सरल हिंदी). Keep clinical drug names, measurements, and units faithful to the source.
6. PATIENT SAFETY & ALLERGIES: Document any noted allergies. If patient has known allergies (e.g. Penicillin) and prescribed drugs cross-react, flag an alert.

Patient Context:
Name: ${patientProfile?.name || 'Unknown'}
Age: ${patientProfile?.age || 'Unknown'}
Known Conditions: ${(patientProfile?.knownConditions || []).join(', ') || 'None'}
Known Allergies: ${(patientProfile?.allergies || []).map(a => a.substance).join(', ') || 'None'}
Declared Document Type: ${docType}

Input Document Text:
"""
${text}
"""

Return ONLY a valid JSON object matching this exact schema:
{
  "title": "String - Descriptive title of record",
  "documentType": "lab_report | prescription | discharge_summary | diagnostic_report | other",
  "documentDate": "YYYY-MM-DD",
  "facility": "String - Clinic / Hospital / Lab name",
  "provider": "String - Attending doctor name",
  "confidenceScore": 85,
  "observations": [
    {
      "id": "obs-1",
      "testName": "String",
      "value": "String",
      "unit": "String",
      "referenceRangeLow": "String",
      "referenceRangeHigh": "String",
      "referenceRangeText": "String",
      "interpretation": "NORMAL | HIGH | LOW | OUT_OF_RANGE",
      "explanation": "Plain language explanation of what this test measures and what this result means",
      "needsReview": false
    }
  ],
  "medications": [
    {
      "id": "med-1",
      "name": "String",
      "strength": "String",
      "dosage": "String",
      "route": "Oral | Topical | Inhalation | etc",
      "frequency": "String",
      "duration": "String",
      "instructions": "String",
      "indication": "String",
      "isActive": true,
      "needsReview": false
    }
  ],
  "conditions": [
    {
      "id": "cond-1",
      "name": "String",
      "status": "active | resolved",
      "notes": "String",
      "needsReview": false
    }
  ],
  "allergies": [
    {
      "id": "alg-1",
      "substance": "String",
      "reaction": "String",
      "severity": "mild | moderate | severe",
      "needsReview": false
    }
  ],
  "encounter": {
    "serviceType": "String",
    "providerName": "String",
    "facilityName": "String",
    "visitDate": "YYYY-MM-DD",
    "followUpDate": "YYYY-MM-DD or null",
    "followUpInstructions": "String"
  },
  "summary": {
    "plainLanguageSummary": "English summary explaining the document in clear, reassuring, patient-accessible terms",
    "hindiSummary": "सरल और स्पष्ट हिंदी में सारांश (Plain language Hindi summary)",
    "keyTakeaways": ["Key bullet point 1", "Key bullet point 2"],
    "questionsForDoctor": ["Thoughtful question 1 to ask physician", "Question 2"],
    "outOfRangeExplanations": [
      {
        "testName": "String",
        "value": "String",
        "normalRange": "String",
        "generalMeaning": "String",
        "recommendation": "Discuss with clinician"
      }
    ],
    "disclaimer": "This summary is generated by AI to help you understand your medical records. It is NOT medical advice, a diagnosis, or a treatment plan. Always consult a licensed healthcare professional before making any health or medication decisions. In case of emergency or severe symptoms, call local emergency services immediately."
  }
}`;

  try {
    console.log(`[AI Service] Calling Gemini API (${modelName})...`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[AI Service] Gemini API returned status ${response.status}: ${errText}. Falling back to local parser.`);
      const fallbackResult = parseClinicalText(text, docType, patientProfile);
      fallbackResult.summary.generatedBy = 'local-medical-heuristics (Gemini API Fallback)';
      return fallbackResult;
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Empty response from Gemini API');
    }

    const cleanJson = candidateText.replace(/^```json/i, '').replace(/```$/i, '').trim();
    const parsedData = JSON.parse(cleanJson);

    parsedData.rawText = text;
    if (parsedData.summary) {
      parsedData.summary.generatedBy = `Gemini (${modelName})`;
      parsedData.summary.generatedAt = new Date().toISOString();
    }

    return parsedData;
  } catch (error) {
    console.warn('[AI Service] Gemini API call exception, falling back to local clinical parser:', error.message);
    const fallbackResult = parseClinicalText(text, docType, patientProfile);
    fallbackResult.summary.generatedBy = 'local-medical-heuristics (Demo Fallback)';
    return fallbackResult;
  }
}

module.exports = {
  isGeminiConfigured,
  processMedicalText
};