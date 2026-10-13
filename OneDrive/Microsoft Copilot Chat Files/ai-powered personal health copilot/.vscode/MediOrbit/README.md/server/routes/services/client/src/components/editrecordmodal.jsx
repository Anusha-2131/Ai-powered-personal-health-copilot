import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Activity, Pill } from 'lucide-react';
import { api } from '../api';

export function EditRecordModal({ record, onClose, onSave, t }) {
  const [formData, setFormData] = useState({
    title: record.title || '',
    documentDate: record.documentDate || '',
    facility: record.facility || '',
    provider: record.provider || '',
    documentType: record.documentType || 'other',
    observations: record.observations ? JSON.parse(JSON.stringify(record.observations)) : [],
    medications: record.medications ? JSON.parse(JSON.stringify(record.medications)) : []
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateObservation = (index, field, value) => {
    const updated = [...formData.observations];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, observations: updated });
  };

  const handleRemoveObservation = (index) => {
    setFormData({
      ...formData,
      observations: formData.observations.filter((_, i) => i !== index)
    });
  };

  const handleAddObservation = () => {
    setFormData({
      ...formData,
      observations: [
        ...formData.observations,
        {
          id: `obs-edit-${Date.now()}`,
          testName: 'New Test',
          value: '0',
          unit: 'mg/dL',
          referenceRangeText: 'Normal Range',
          interpretation: 'NORMAL',
          explanation: '',
          needsReview: false
        }
      ]
    });
  };

  const handleUpdateMedication = (index, field, value) => {
    const updated = [...formData.medications];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, medications: updated });
  };

  const handleRemoveMedication = (index) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index)
    });
  };

  const handleAddMedication = () => {
    setFormData({
      ...formData,
      medications: [
        ...formData.medications,
        {
          id: `med-edit-${Date.now()}`,
          name: 'New Medicine',
          strength: '500 mg',
          dosage: '1 tablet',
          frequency: 'Once daily',
          instructions: 'Take with food',
          isActive: true
        }
      ]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.updateRecord(record.id, formData);
      if (res.success) {
        onSave(res.record);
      } else {
        alert(res.error || 'Failed to update record');
      }
    } catch (err) {
      alert('Error updating record: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900">Edit Health Record</h3>
            <p className="text-xs text-slate-500">Correct clinical values, doctor notes, or medications.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="font-semibold block mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                required
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Date</label>
              <input
                type="date"
                value={formData.documentDate}
                onChange={(e) => setFormData({ ...formData, documentDate: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Facility</label>
              <input
                type="text"
                value={formData.facility}
                onChange={(e) => setFormData({ ...formData, facility: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Provider</label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>
          </div>

          {/* Observations / Lab Tests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>Lab Observations ({formData.observations.length})</span>
              </h4>
              <button
                type="button"
                onClick={handleAddObservation}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Test</span>
              </button>
            </div>

            <div className="space-y-2">
              {formData.observations.map((obs, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <input
                    type="text"
                    value={obs.testName}
                    onChange={(e) => handleUpdateObservation(idx, 'testName', e.target.value)}
                    placeholder="Test Name"
                    className="flex-2 min-w-[120px] px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-medium"
                  />
                  <input
                    type="text"
                    value={obs.value}
                    onChange={(e) => handleUpdateObservation(idx, 'value', e.target.value)}
                    placeholder="Value"
                    className="w-20 px-2 py-1 rounded-lg border border-slate-200 bg-white font-bold"
                  />
                  <input
                    type="text"
                    value={obs.unit || ''}
                    onChange={(e) => handleUpdateObservation(idx, 'unit', e.target.value)}
                    placeholder="Unit"
                    className="w-20 px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-600"
                  />
                  <input
                    type="text"
                    value={obs.referenceRangeText || ''}
                    onChange={(e) => handleUpdateObservation(idx, 'referenceRangeText', e.target.value)}
                    placeholder="Reference Range"
                    className="w-32 px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-600"
                  />
                  <select
                    value={obs.interpretation}
                    onChange={(e) => handleUpdateObservation(idx, 'interpretation', e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-semibold"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="LOW">LOW</option>
                    <option value="OUT_OF_RANGE">OUT_OF_RANGE</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveObservation(idx)}
                    className="text-red-500 hover:text-red-600"
                    aria-label="Remove observation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Medications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-4 h-4 text-violet-600" />
                <span>Medications ({formData.medications.length})</span>
              </h4>
              <button
                type="button"
                onClick={handleAddMedication}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medication</span>
              </button>
            </div>

            <div className="space-y-2">
              {formData.medications.map((med, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <input
                    type="text"
                    value={med.name || ''}
                    onChange={(e) => handleUpdateMedication(idx, 'name', e.target.value)}
                    placeholder="Medication Name"
                    className="flex-2 min-w-[140px] px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-medium"
                  />
                  <input
                    type="text"
                    value={med.strength || ''}
                    onChange={(e) => handleUpdateMedication(idx, 'strength', e.target.value)}
                    placeholder="Strength"
                    className="w-24 px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-600"
                  />
                  <input
                    type="text"
                    value={med.dosage || ''}
                    onChange={(e) => handleUpdateMedication(idx, 'dosage', e.target.value)}
                    placeholder="Dosage"
                    className="w-24 px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-600"
                  />
                  <input
                    type="text"
                    value={med.frequency || ''}
                    onChange={(e) => handleUpdateMedication(idx, 'frequency', e.target.value)}
                    placeholder="Frequency"
                    className="w-28 px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-600"
                  />
                  <input
                    type="text"
                    value={med.instructions || ''}
                    onChange={(e) => handleUpdateMedication(idx, 'instructions', e.target.value)}
                    placeholder="Instructions"
                    className="min-w-[140px] flex-1 px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-600"
                  />
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={!!med.isActive}
                      onChange={(e) => handleUpdateMedication(idx, 'isActive', e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300"
                    />
                    Active
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(idx)}
                    className="text-red-500 hover:text-red-600"
                    aria-label="Remove medication"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 font-semibold flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
