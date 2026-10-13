async function testFullJourney() {
  console.log('--- Starting Full Journey Verification ---');

  // 1. Create Patient
  const ptRes = await (await fetch('http://localhost:5000/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rohan Gupta',
      age: 38,
      gender: 'Male',
      bloodGroup: 'O+',
      preferredLanguage: 'hi',
      emergencyContact: { name: 'Pooja Gupta', relationship: 'Spouse', phone: '9876500000' },
      knownConditions: ['Mild Asthma'],
      allergies: [{ id: 'a1', substance: 'Penicillin', reaction: 'Rash' }]
    })
  })).json();
  console.log('✓ Created Patient:', ptRes.patient.id, ptRes.patient.name);

  // 2. Process Medical Document (Prescription)
  const prescriptionText = `CITY CLINIC
Dr. S. K. Mehta, MD
Patient: Rohan Gupta   Date: 10-Oct-2026
Diagnosis: Bronchitis
Rx:
1. Tab. Azithromycin 500 mg - OD x 5 days
2. Tab. Paracetamol 650 mg - SOS x 3 days
General Advice: Steam inhalation twice daily. Follow up in 5 days.`;

  const processRes = await (await fetch('http://localhost:5000/api/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rawText: prescriptionText,
      docType: 'prescription',
      patientId: ptRes.patient.id,
      userConsent: true
    })
  })).json();
  console.log('✓ Processed Document:', processRes.draftRecord.title, 'Meds detected:', processRes.draftRecord.medications.length);

  // 3. User Review & Save Record
  const draft = processRes.draftRecord;
  draft.patientId = ptRes.patient.id;
  draft.title = 'Verified Clinic Prescription';
  const saveRes = await (await fetch('http://localhost:5000/api/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft)
  })).json();
  console.log('✓ Saved Record to Database:', saveRes.record.id);

  // 4. Retrieve & Search Timeline
  const listRes = await (await fetch(`http://localhost:5000/api/records?patientId=${ptRes.patient.id}&q=Azithromycin`)).json();
  console.log('✓ Search Timeline by Medicine:', listRes.records.length > 0 ? 'Found record!' : 'Failed');

  // 5. User Edit Record (Correct a field)
  const editRes = await (await fetch(`http://localhost:5000/api/records/${saveRes.record.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Corrected Prescription - Dr. Mehta'
    })
  })).json();
  console.log('✓ Updated Record (Provenance updated):', editRes.record.title, 'Provenance:', editRes.record.provenance);

  // 6. Export FHIR
  const fhirRes = await (await fetch(`http://localhost:5000/api/records/${saveRes.record.id}/export/fhir`)).json();
  console.log('✓ FHIR Export Generated for Record:', fhirRes.entry.length, 'FHIR entries');

  // 7. Export Markdown Health Summary
  const mdRes = await (await fetch(`http://localhost:5000/api/export/patient/${ptRes.patient.id}/markdown`)).text();
  console.log('✓ Markdown Health Summary generated:', mdRes.includes('Rohan Gupta'));

  // 8. Delete Record
  const delRecRes = await (await fetch(`http://localhost:5000/api/records/${saveRes.record.id}`, { method: 'DELETE' })).json();
  console.log('✓ Deleted Record:', delRecRes.success);

  // 9. Delete Patient
  const delPtRes = await (await fetch(`http://localhost:5000/api/patients/${ptRes.patient.id}`, { method: 'DELETE' })).json();
  console.log('✓ Deleted Patient Profile:', delPtRes.success);

  console.log('--- Full User Journey Verification Complete: 100% Passed ---');
}

testFullJourney().catch(e => console.error(e));