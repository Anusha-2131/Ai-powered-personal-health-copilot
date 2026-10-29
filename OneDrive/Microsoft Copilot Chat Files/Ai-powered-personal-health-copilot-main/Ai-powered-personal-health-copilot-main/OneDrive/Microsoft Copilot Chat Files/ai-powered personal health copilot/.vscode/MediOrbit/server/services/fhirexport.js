/**
 * Maps internal data model into a valid FHIR R4 Collection Bundle
 * @param {object} patient - Patient profile
 * @param {Array<object>} records - Array of records
 * @returns {object} FHIR R4 Bundle
 */
function exportPatientToFhirBundle(patient, records = []) {
  const bundleId = `urn:uuid:bundle-${patient.id}`;
  const timestamp = new Date().toISOString();

  const entries = [];

  // 1. FHIR Patient Resource
  entries.push({
    fullUrl: `urn:uuid:${patient.id}`,
    resource: {
      resourceType: 'Patient',
      id: patient.id,
      identifier: [
        {
          system: 'https://health-copilot.local/patients',
          value: patient.id
        }
      ],
      active: true,
      name: [
        {
          use: 'official',
          text: patient.name,
          family: patient.name.split(' ').slice(1).join(' ') || patient.name,
          given: [patient.name.split(' ')[0]]
        }
      ],
      gender: (patient.gender || '').toLowerCase() === 'female' ? 'female' : 'male',
      birthDate: patient.dob || '1980-01-01',
      telecom: [
        ...(patient.phone ? [{ system: 'phone', value: patient.phone, use: 'mobile' }] : []),
        ...(patient.email ? [{ system: 'email', value: patient.email, use: 'home' }] : [])
      ],
      communication: [
        {
          language: {
            coding: [
              {
                system: 'urn:ietf:bcp:47',
                code: patient.preferredLanguage === 'hi' ? 'hi' : 'en',
                display: patient.preferredLanguage === 'hi' ? 'Hindi' : 'English'
              }
            ]
          },
          preferred: true
        }
      ],
      contact: patient.emergencyContact?.name ? [
        {
          relationship: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
                  code: 'C',
                  display: 'Emergency Contact'
                }
              ],
              text: patient.emergencyContact.relationship || 'Emergency Contact'
            }
          ],
          name: { text: patient.emergencyContact.name },
          telecom: patient.emergencyContact.phone ? [
            { system: 'phone', value: patient.emergencyContact.phone }
          ] : []
        }
      ] : []
    }
  });

  // 2. Map Each Record and its Sub-Entities
  records.forEach((record, recIdx) => {
    const docRefId = `urn:uuid:${record.id}`;

    // DocumentReference Resource
    entries.push({
      fullUrl: docRefId,
      resource: {
        resourceType: 'DocumentReference',
        id: record.id,
        status: 'current',
        docStatus: 'final',
        type: {
          coding: [
            {
              system: 'http://loinc.org',
              code: mapDocTypeToLoinc(record.documentType),
              display: record.title
            }
          ],
          text: record.documentType
        },
        subject: {
          reference: `urn:uuid:${patient.id}`,
          display: patient.name
        },
        date: record.createdAt || timestamp,
        author: [
          {
            display: record.provider || 'Healthcare Provider'
          }
        ],
        custodian: {
          display: record.facility || 'Healthcare Organization'
        },
        description: record.title,
        content: [
          {
            attachment: {
              contentType: record.mimeType || 'text/plain',
              title: record.originalFileName || record.title,
              url: record.fileUrl || undefined
            }
          }
        ]
      }
    });

    // Observation Resources (Lab values & vitals)
    (record.observations || []).forEach((obs, obsIdx) => {
      const obsId = `urn:uuid:${obs.id || `obs-${record.id}-${obsIdx}`}`;
      entries.push({
        fullUrl: obsId,
        resource: {
          resourceType: 'Observation',
          id: obs.id || `obs-${record.id}-${obsIdx}`,
          status: 'final',
          category: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                  code: record.documentType === 'lab_report' ? 'laboratory' : 'vital-signs',
                  display: record.documentType === 'lab_report' ? 'Laboratory' : 'Vital Signs'
                }
              ]
            }
          ],
          code: {
            text: obs.testName
          },
          subject: {
            reference: `urn:uuid:${patient.id}`,
            display: patient.name
          },
          effectiveDateTime: record.documentDate || timestamp,
          valueString: `${obs.value} ${obs.unit || ''}`.trim(),
          interpretation: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                  code: obs.interpretation === 'HIGH' ? 'H' : obs.interpretation === 'LOW' ? 'L' : 'N',
                  display: obs.interpretation
                }
              ],
              text: obs.interpretation
            }
          ],
          referenceRange: obs.referenceRangeText ? [
            {
              text: obs.referenceRangeText,
              low: obs.referenceRangeLow ? { value: parseFloat(obs.referenceRangeLow) } : undefined,
              high: obs.referenceRangeHigh ? { value: parseFloat(obs.referenceRangeHigh) } : undefined
            }
          ] : [],
          note: obs.explanation ? [{ text: obs.explanation }] : [],
          derivedFrom: [{ reference: docRefId }]
        }
      });
    });

    // MedicationStatement Resources
    (record.medications || []).forEach((med, medIdx) => {
      const medId = `urn:uuid:${med.id || `med-${record.id}-${medIdx}`}`;
      entries.push({
        fullUrl: medId,
        resource: {
          resourceType: 'MedicationStatement',
          id: med.id || `med-${record.id}-${medIdx}`,
          status: med.isActive ? 'active' : 'completed',
          medicationCodeableConcept: {
            text: `${med.name} ${med.strength || ''}`.trim()
          },
          subject: {
            reference: `urn:uuid:${patient.id}`,
            display: patient.name
          },
          effectiveDateTime: record.documentDate || timestamp,
          dosage: [
            {
              text: `${med.dosage || ''} ${med.frequency || ''} for ${med.duration || ''}. ${med.instructions || ''}`.trim(),
              route: { text: med.route || 'Oral' }
            }
          ],
          reasonCode: med.indication ? [{ text: med.indication }] : [],
          derivedFrom: [{ reference: docRefId }]
        }
      });
    });

    // Condition Resources
    (record.conditions || []).forEach((cond, condIdx) => {
      const condId = `urn:uuid:${cond.id || `cond-${record.id}-${condIdx}`}`;
      entries.push({
        fullUrl: condId,
        resource: {
          resourceType: 'Condition',
          id: cond.id || `cond-${record.id}-${condIdx}`,
          clinicalStatus: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                code: cond.status || 'active'
              }
            ]
          },
          code: {
            text: cond.name
          },
          subject: {
            reference: `urn:uuid:${patient.id}`,
            display: patient.name
          },
          recordedDate: record.documentDate || timestamp,
          note: cond.notes ? [{ text: cond.notes }] : [],
          evidence: [{ detail: [{ reference: docRefId }] }]
        }
      });
    });

    // AllergyIntolerance Resources
    (record.allergies || []).forEach((alg, algIdx) => {
      const algId = `urn:uuid:${alg.id || `alg-${record.id}-${algIdx}`}`;
      entries.push({
        fullUrl: algId,
        resource: {
          resourceType: 'AllergyIntolerance',
          id: alg.id || `alg-${record.id}-${algIdx}`,
          clinicalStatus: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
                code: 'active'
              }
            ]
          },
          verificationStatus: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
                code: 'confirmed'
              }
            ]
          },
          code: { text: alg.substance },
          patient: {
            reference: `urn:uuid:${patient.id}`,
            display: patient.name
          },
          reaction: [
            {
              manifestation: [{ text: alg.reaction || 'Sensitivity' }],
              severity: alg.severity || 'moderate'
            }
          ]
        }
      });
    });
  });

  return {
    resourceType: 'Bundle',
    id: `bundle-${patient.id}`,
    type: 'collection',
    timestamp,
    meta: {
      lastUpdated: timestamp,
      source: 'Personal Health Copilot - FHIR R4 Engine'
    },
    total: entries.length,
    entry: entries
  };
}

function mapDocTypeToLoinc(docType) {
  switch (docType) {
    case 'lab_report': return '11502-2';
    case 'prescription': return '57833-6';
    case 'discharge_summary': return '18842-5';
    case 'diagnostic_report': return '30954-2';
    default: return '34108-1';
  }
}

/**
 * Generates human-readable printable summary in markdown
 */
function generateMarkdownSummary(patient, records = []) {
  let md = `# Personal Health Summary: ${patient.name}\n\n`;
  md += `**Generated:** ${new Date().toLocaleDateString()} | **Powered by:** Personal Health Copilot\n\n`;
  md += `> **NOTICE:** This report is an educational personal health organizer summary. It is NOT a medical diagnosis or treatment plan. Always consult your physician regarding health matters.\n\n`;
  md += `## 1. Patient Demographics & Baseline\n\n`;
  md += `- **Age / Gender:** ${patient.age || 'N/A'} Y / ${patient.gender || 'N/A'}\n`;
  md += `- **Blood Group:** ${patient.bloodGroup || 'Not specified'}\n`;
  md += `- **Preferred Language:** ${patient.preferredLanguage === 'hi' ? 'Hindi (हिंदी)' : 'English'}\n`;
  md += `- **Known Chronic Conditions:** ${(patient.knownConditions || []).join(', ') || 'None recorded'}\n`;
  md += `- **Documented Allergies:** ${(patient.allergies || []).map(a => `${a.substance} (${a.reaction || 'allergic'})`).join(', ') || 'No known allergies'}\n`;
  md += `- **Emergency Contact:** ${patient.emergencyContact?.name || 'N/A'} (${patient.emergencyContact?.relationship || 'Contact'}) - ${patient.emergencyContact?.phone || 'N/A'}\n\n`;

  md += `## 2. Health Timeline & Records (${records.length} records)\n\n`;

  records.forEach((rec, idx) => {
    md += `### ${idx + 1}. ${rec.title} (${rec.documentDate})\n\n`;
    md += `- **Type:** ${rec.documentType.toUpperCase()} | **Facility:** ${rec.facility} | **Provider:** ${rec.provider}\n`;

    if (rec.summary?.plainLanguageSummary) {
      md += `\n**AI Plain-Language Summary:**\n${rec.summary.plainLanguageSummary}\n`;
    }

    if (rec.observations && rec.observations.length > 0) {
      md += `\n**Key Observations / Test Results:**\n\n`;
      md += `| Test Name | Result | Normal Range | Status |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      rec.observations.forEach(o => {
        md += `| ${o.testName} | ${o.value} ${o.unit || ''} | ${o.referenceRangeText || 'N/A'} | **${o.interpretation}** |\n`;
      });
      md += `\n`;
    }

    if (rec.medications && rec.medications.length > 0) {
      md += `\n**Prescribed Medications:**\n\n`;
      rec.medications.forEach(m => {
        md += `- **${m.name}** (${m.strength}): ${m.dosage || ''}, ${m.frequency || ''}. Instructions: ${m.instructions || ''}\n`;
      });
      md += `\n`;
    }

    if (rec.summary?.questionsForDoctor && rec.summary.questionsForDoctor.length > 0) {
      md += `\n**Questions to Ask Doctor:**\n`;
      rec.summary.questionsForDoctor.forEach(q => {
        md += `- ${q}\n`;
      });
      md += `\n`;
    }

    md += `---\n\n`;
  });

  return md;
}

module.exports = {
  exportPatientToFhirBundle,
  generateMarkdownSummary
};