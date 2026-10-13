import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  Loader2, 
  Layers, 
  RefreshCw,
  FileCheck,
  ShieldCheck,
  Languages
} from 'lucide-react';
import { api } from '../api';

export function UploadWizardTab({ 
  patient, 
  t, 
  language, 
  samples, 
  onRecordSaved, 
  onCancel 
}) {
  const [inputMode, setInputMode] = useState('sample'); // 'sample' | 'upload' | 'paste'
  const [docType, setDocType] = useState('lab_report');
  
  // Input contents
  const [selectedSample, setSelectedSample] = useState(samples[0]?.id || '');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [manualText, setManualText] = useState('');
  const [userConsent, setUserConsent] = useState(true);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [processingError, setProcessingError] = useState(null);

  // Review & Edit state
  const [isReviewing, setIsReviewing] = useState(false);
  const [draftRecord, setDraftRecord] = useState(null);
  const [summaryLangTab, setSummaryLangTab] = useState('en');
  const [isSaving, setIsSaving] = useState(false);

  // Update selected sample default
  useEffect(() => {
    if (samples && samples.length > 0 && !selectedSample) {
      setSelectedSample(samples[0].id);
      setManualText(samples[0].text);
      setDocType(samples[0].docType);
    }
  }, [samples]);

  const handleSelectSample = (sampleId) => {
    setSelectedSample(sampleId);
    const found = samples.find(s => s.id === sampleId);
    if (found) {
      setManualText(found.text);
      setDocType(found.docType);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.');
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleStartProcessing = async () => {
    if (!userConsent) {
      alert('Please check the user consent box to continue.');
      return;
    }

    setIsProcessing(true);
    setProcessingError(null);
    setProcessStep(1);

    try {
      let uploadResult = null;
      let textPayload = manualText;

      // Step 1: Upload if file
      if (inputMode === 'upload' && uploadedFile) {
        setProcessStep(1);
        uploadResult = await api.uploadFile(uploadedFile);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload document');
        }
      }

      // Step 2: OCR / Text extraction
      setProcessStep(2);
      await new Promise(r => setTimeout(r, 600));

      // Step 3: Clinical parsing & reference range
      setProcessStep(3);
      await new Promise(r => setTimeout(r, 600));

      // Step 4: AI structuring & bilingual summary
      setProcessStep(4);

      const processPayload = {
        filePath: uploadResult?.file?.filePath || null,
        mimeType: uploadResult?.file?.mimeType || 'text/plain',
        rawText: textPayload,
        docType: docType,
        patientId: patient?.id,
        userConsent: true
      };

      const result = await api.processDocument(processPayload);

      if (!result.success) {
        throw new Error(result.error || 'Processing failed');
      }

      setProcessStep(5);
      await new Promise(r => setTimeout(r, 400));

      // Prepare draft record for user review & editing
      const draft = {
        ...result.draftRecord,
        patientId: patient?.id,
        originalFileName: uploadResult?.file?.fileName || (inputMode === 'sample' ? 'Sample_Record.txt' : 'Manual_Input.txt'),
        fileUrl: uploadResult?.file?.fileUrl || null,
        mimeType: uploadResult?.file?.mimeType || 'text/plain'
      };

      setDraftRecord(draft);
      setIsReviewing(true);
    } catch (err) {
      console.error('Processing error:', err);
      setProcessingError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Draft editing helpers
  const handleUpdateDraftField = (field, value) => {
    setDraftRecord(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateObservation = (index, field, value) => {
    setDraftRecord(prev => {
      const updated = [...prev.observations];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, observations: updated };
    });
  };

  const handleRemoveObservation = (index) => {
    setDraftRecord(prev => ({
      ...prev,
      observations: prev.observations.filter((_, i) => i !== index)
    }));
  };

  const handleAddObservation = () => {
    setDraftRecord(prev => ({
      ...prev,
      observations: [
        ...(prev.observations || []),
        {
          id: `obs-custom-${Date.now()}`,
          testName: 'New Test',
          value: '0',
          unit: 'mg/dL',
          referenceRangeText: 'Normal Range',
          interpretation: 'NORMAL',
          explanation: 'User added test',
          needsReview: false
        }
      ]
    }));
  };

  const handleUpdateMedication = (index, field, value) => {
    setDraftRecord(prev => {
      const updated = [...prev.medications];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, medications: updated };
    });
  };

  const handleRemoveMedication = (index) => {
    setDraftRecord(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const handleAddMedication = () => {
    setDraftRecord(prev => ({
      ...prev,
      medications: [
        ...(prev.medications || []),
        {
          id: `med-custom-${Date.now()}`,
          name: 'New Medication',
          strength: '500 mg',
          dosage: '1 tab',
          frequency: 'Once daily',
          instructions: 'Take after meals',
          isActive: true,
          needsReview: false
        }
      ]
    }));
  };

  // Save approved draft to database
  const handleSaveDraft = async () => {
    if (!draftRecord) return;
    setIsSaving(true);
    try {
      const saved = await api.saveRecord(draftRecord);
      if (saved.success) {
        onRecordSaved(saved.record);
      } else {
        alert(saved.error || 'Failed to save record');
      }
    } catch (err) {
      alert('Error saving record: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {t.uploadWizard.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          {t.uploadWizard.subtitle}
        </p>
      </div>

      {/* STEP 1 & 2: Input & Processing Section (If not in review) */}
      {!isReviewing && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* Input Method Selector Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl max-w-lg">
            <button
              onClick={() => setInputMode('sample')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                inputMode === 'sample' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.uploadWizard.tabSample}
            </button>
            <button
              onClick={() => setInputMode('upload')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                inputMode === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.uploadWizard.tabUpload}
            </button>
            <button
              onClick={() => setInputMode('paste')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                inputMode === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.uploadWizard.tabPaste}
            </button>
          </div>

          {/* Mode 1: Fictional Sample Presets */}
          {inputMode === 'sample' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700">
                Choose a pre-verified fictional case to demonstrate OCR & AI extraction instantly:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {samples.map(sample => {
                  const isSelected = selectedSample === sample.id;
                  return (
                    <div
                      key={sample.id}
                      onClick={() => handleSelectSample(sample.id)}
                      className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/40 shadow-xs ring-1 ring-teal-500'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {t.docTypes[sample.docType] || sample.docType}
                        </span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-teal-600" />}
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs mt-2">
                        {sample.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {sample.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode 2: File Upload (PDF, PNG, JPG) */}
          {inputMode === 'upload' && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 hover:border-teal-400 rounded-3xl p-8 text-center bg-slate-50/50 hover:bg-teal-50/20 transition-all cursor-pointer relative">
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 mx-auto flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="font-bold text-slate-800 text-sm">
                  {uploadedFile ? uploadedFile.name : t.uploadWizard.dropzoneTitle}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {t.uploadWizard.dropzoneHint}
                </p>
                {uploadedFile && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>File Selected ({(uploadedFile.size / 1024).toFixed(0)} KB)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode 3: Manual Text Paste */}
          {inputMode === 'paste' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                Paste or enter clinical document text:
              </label>
              <textarea
                rows={8}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Paste lab report values, prescription drugs, or discharge summary notes here..."
                className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-800 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          {/* Document Type Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="text-xs">
              <label className="font-bold text-slate-700 block mb-1">
                {t.uploadWizard.selectDocType}:
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 font-medium"
              >
                <option value="lab_report">{t.docTypes.lab_report}</option>
                <option value="prescription">{t.docTypes.prescription}</option>
                <option value="discharge_summary">{t.docTypes.discharge_summary}</option>
                <option value="diagnostic_report">{t.docTypes.diagnostic_report}</option>
                <option value="other">{t.docTypes.other}</option>
              </select>
            </div>

            {/* Consent Checkbox */}
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                id="consentCheck"
                checked={userConsent}
                onChange={(e) => setUserConsent(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <label htmlFor="consentCheck" className="cursor-pointer font-medium">
                {t.consent.checkbox}
              </label>
            </div>
          </div>

          {/* Processing Progress Status */}
          {isProcessing && (
            <div className="p-6 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="font-bold text-teal-950 text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                  <span>{t.uploadWizard.processingTitle}</span>
                </div>
                <span className="text-xs font-semibold text-teal-800">
                  Step {processStep} of 5
                </span>
              </div>

              {/* Progress Steps list */}
              <div className="space-y-2 text-xs text-slate-700">
                {[
                  { step: 1, text: t.uploadWizard.step1 },
                  { step: 2, text: t.uploadWizard.step2 },
                  { step: 3, text: t.uploadWizard.step3 },
                  { step: 4, text: t.uploadWizard.step4 },
                  { step: 5, text: t.uploadWizard.step5 },
                ].map(s => {
                  const isDone = processStep > s.step;
                  const isCurrent = processStep === s.step;
                  return (
                    <div key={s.step} className="flex items-center gap-2.5">
                      {isDone ? (
                        <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-teal-600 animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <span className={isCurrent ? 'font-bold text-teal-900' : isDone ? 'text-slate-600' : 'text-slate-400'}>
                        {s.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Processing Error Notice */}
          {processingError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong>Processing Error:</strong> {processingError}
              </div>
            </div>
          )}

          {/* Submit Action Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleStartProcessing}
              disabled={isProcessing || !userConsent || (inputMode === 'upload' && !uploadedFile)}
              className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <span>Analyze & Review Extraction</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* STEP 3: INTERACTIVE REVIEW & FIELD CORRECTION SCREEN */}
      {isReviewing && draftRecord && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in">
          
          {/* Top Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[11px] font-semibold border border-teal-200 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Verification & Correction Stage</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {t.uploadWizard.reviewTitle}
              </h3>
              <p className="text-xs text-slate-500">
                {t.uploadWizard.reviewSubtitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                draftRecord.confidenceScore >= 80 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {draftRecord.confidenceScore}% Extraction Confidence
              </span>
            </div>
          </div>

          {/* Editable Document Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Record Title</label>
              <input
                type="text"
                value={draftRecord.title}
                onChange={(e) => handleUpdateDraftField('title', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">{t.uploadWizard.editDate}</label>
              <input
                type="date"
                value={draftRecord.documentDate}
                onChange={(e) => handleUpdateDraftField('documentDate', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">{t.uploadWizard.editFacility}</label>
              <input
                type="text"
                value={draftRecord.facility}
                onChange={(e) => handleUpdateDraftField('facility', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">{t.uploadWizard.editProvider}</label>
              <input
                type="text"
                value={draftRecord.provider}
                onChange={(e) => handleUpdateDraftField('provider', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs"
              />
            </div>
          </div>

          {/* Extracted Lab Tests Table (Editable) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <span>{t.uploadWizard.extractedTests}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                  {draftRecord.observations?.length || 0}
                </span>
              </h4>
              <button
                onClick={handleAddObservation}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.actions.addTest}</span>
              </button>
            </div>

            {(!draftRecord.observations || draftRecord.observations.length === 0) ? (
              <p className="text-xs text-slate-400 italic">No lab observations detected in this record.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-3">Test Name</th>
                      <th className="p-3">Value</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3">Reference Range</th>
                      <th className="p-3">Interpretation</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {draftRecord.observations.map((obs, idx) => (
                      <tr key={obs.id || idx} className={obs.needsReview ? 'bg-amber-50/40' : ''}>
                        <td className="p-3">
                          <input
                            type="text"
                            value={obs.testName}
                            onChange={(e) => handleUpdateObservation(idx, 'testName', e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white font-medium"
                          />
                        </td>
                        <td className="p-3 w-28">
                          <input
                            type="text"
                            value={obs.value}
                            onChange={(e) => handleUpdateObservation(idx, 'value', e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white font-bold"
                          />
                        </td>
                        <td className="p-3 w-24">
                          <input
                            type="text"
                            value={obs.unit || ''}
                            onChange={(e) => handleUpdateObservation(idx, 'unit', e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-600"
                          />
                        </td>
                        <td className="p-3 w-36">
                          <input
                            type="text"
                            value={obs.referenceRangeText || ''}
                            onChange={(e) => handleUpdateObservation(idx, 'referenceRangeText', e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-600"
                          />
                        </td>
                        <td className="p-3 w-32">
                          <select
                            value={obs.interpretation}
                            onChange={(e) => handleUpdateObservation(idx, 'interpretation', e.target.value)}
                            className={`w-full px-2 py-1 rounded-lg border text-xs font-semibold ${
                              obs.interpretation === 'HIGH' ? 'bg-amber-50 text-amber-900 border-amber-300' :
                              obs.interpretation === 'LOW' ? 'bg-blue-50 text-blue-900 border-blue-300' :
                              'bg-emerald-50 text-emerald-900 border-emerald-300'
                            }`}
                          >
                            <option value="NORMAL">NORMAL</option>
                            <option value="HIGH">HIGH</option>
                            <option value="LOW">LOW</option>
                            <option value="OUT_OF_RANGE">OUT_OF_RANGE</option>
                          </select>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRemoveObservation(idx)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                            title="Remove test"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Extracted Medications Table (Editable) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <span>{t.uploadWizard.extractedMeds}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                  {draftRecord.medications?.length || 0}
                </span>
              </h4>
              <button
                onClick={handleAddMedication}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.actions.addMedication}</span>
              </button>
            </div>

            {(!draftRecord.medications || draftRecord.medications.length === 0) ? (
              <p className="text-xs text-slate-400 italic">No prescription medications detected in this record.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-3">Medicine</th>
                      <th className="p-3">Strength</th>
                      <th className="p-3">Frequency</th>
                      <th className="p-3">Instructions</th>
                      <th className="p-3">Active?</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {draftRecord.medications.map((med, idx) => (
                      <tr key={med.id || idx}>
                        <td className="p-3">
                          <input
                            type="text"
                            value={med.name}
                            onChange={(e) => handleUpdateMedication(idx, 'name', e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white font-semibold"
                          />
                        </td>
                        <td className="p-3 w-28">
                          <input
                            type="text"
                            value={med.strength}
                            onChange={(e) => handleUpdateMedication(idx, 'strength', e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white"
                          />
                        </td>
                        <td className="p-3 w-40">
                          <input
                            type="text"
                            value={med.frequency}
                            onChange={(e) => handleUpdateMedication(idx, 'frequency', e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={med.instructions}
                            onChange={(e) => handleUpdateMedication(idx, 'instructions', e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white"
                          />
                        </td>
                        <td className="p-3 w-20 text-center">
                          <input
                            type="checkbox"
                            checked={med.isActive !== false}
                            onChange={(e) => handleUpdateMedication(idx, 'isActive', e.target.checked)}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRemoveMedication(idx)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* AI Bilingual Summaries (English & Hindi) */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Generated Plain-Language Summaries</span>
              </div>

              {/* Language toggle tab */}
              <div className="flex p-0.5 bg-slate-200/80 rounded-xl text-xs">
                <button
                  onClick={() => setSummaryLangTab('en')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    summaryLangTab === 'en' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setSummaryLangTab('hi')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    summaryLangTab === 'hi' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  हिंदी (Hindi)
                </button>
              </div>
            </div>

            {summaryLangTab === 'en' ? (
              <textarea
                rows={4}
                value={draftRecord.summary?.plainLanguageSummary || ''}
                onChange={(e) => setDraftRecord(prev => ({
                  ...prev,
                  summary: { ...prev.summary, plainLanguageSummary: e.target.value }
                }))}
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 leading-relaxed font-sans"
              />
            ) : (
              <textarea
                rows={4}
                value={draftRecord.summary?.hindiSummary || ''}
                onChange={(e) => setDraftRecord(prev => ({
                  ...prev,
                  summary: { ...prev.summary, hindiSummary: e.target.value }
                }))}
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 leading-relaxed font-sans"
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={() => {
                setIsReviewing(false);
                setDraftRecord(null);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              {t.actions.discard}
            </button>

            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>{t.uploadWizard.saveButton}</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}