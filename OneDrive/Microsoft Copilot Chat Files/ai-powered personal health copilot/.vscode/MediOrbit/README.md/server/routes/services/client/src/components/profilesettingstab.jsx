import React, { useState } from 'react';
import { 
  User, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  X, 
  Cpu, 
  Phone,
  AlertTriangle
} from 'lucide-react';
import { api } from '../api';

export function ProfileSettingsTab({ 
  patient, 
  config, 
  t, 
  language,
  setLanguage,
  onUpdatePatient, 
  onResetDemo 
}) {
  const [formData, setFormData] = useState({
    name: patient?.name || '',
    dob: patient?.dob || '',
    age: patient?.age || '',
    gender: patient?.gender || 'Male',
    bloodGroup: patient?.bloodGroup || '',
    phone: patient?.phone || '',
    email: patient?.email || '',
    preferredLanguage: patient?.preferredLanguage || 'en',
    emergencyContact: {
      name: patient?.emergencyContact?.name || '',
      relationship: patient?.emergencyContact?.relationship || '',
      phone: patient?.emergencyContact?.phone || ''
    },
    knownConditions: patient?.knownConditions || [],
    allergies: patient?.allergies || []
  });

  const [newCondition, setNewCondition] = useState('');
  const [newAllergySubstance, setNewAllergySubstance] = useState('');
  const [newAllergyReaction, setNewAllergyReaction] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.updatePatient(patient.id, formData);
      if (updated.success) {
        onUpdatePatient(updated.patient);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      alert('Error updating profile: ' + err.message);
    }
  };

  const handleAddCondition = () => {
    if (newCondition.trim()) {
      setFormData(prev => ({
        ...prev,
        knownConditions: [...prev.knownConditions, newCondition.trim()]
      }));
      setNewCondition('');
    }
  };

  const handleRemoveCondition = (index) => {
    setFormData(prev => ({
      ...prev,
      knownConditions: prev.knownConditions.filter((_, i) => i !== index)
    }));
  };

  const handleAddAllergy = () => {
    if (newAllergySubstance.trim()) {
      setFormData(prev => ({
        ...prev,
        allergies: [
          ...prev.allergies,
          {
            id: `alg-${Date.now()}`,
            substance: newAllergySubstance.trim(),
            reaction: newAllergyReaction.trim() || 'Sensitivity',
            severity: 'moderate'
          }
        ]
      }));
      setNewAllergySubstance('');
      setNewAllergyReaction('');
    }
  };

  const handleRemoveAllergy = (index) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {t.profile.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          {t.profile.subtitle}
        </p>
      </div>

      {/* Main Profile Form Card */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" />
            <span>{t.profile.demographics}</span>
          </h3>
          {saveSuccess && (
            <div className="text-emerald-700 font-semibold text-xs flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Changes Saved!</span>
            </div>
          )}
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">{t.profile.fullName}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">{t.profile.dateOfBirth}</label>
            <input
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">{t.profile.age}</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">{t.profile.gender}</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other / Non-binary</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">{t.profile.bloodGroup}</label>
            <input
              type="text"
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              placeholder="e.g. B+, O-, A+"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">{t.profile.preferredLang}</label>
            <select
              value={formData.preferredLanguage}
              onChange={(e) => {
                setFormData({ ...formData, preferredLanguage: e.target.value });
                setLanguage(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-teal-600" />
            <span>{t.profile.emergencyContact}</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <input
              type="text"
              placeholder="Contact Person Name"
              value={formData.emergencyContact.name}
              onChange={(e) => setFormData({
                ...formData,
                emergencyContact: { ...formData.emergencyContact, name: e.target.value }
              })}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              placeholder="Relationship (e.g. Spouse, Sibling)"
              value={formData.emergencyContact.relationship}
              onChange={(e) => setFormData({
                ...formData,
                emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
              })}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="tel"
              placeholder="Emergency Phone Number"
              value={formData.emergencyContact.phone}
              onChange={(e) => setFormData({
                ...formData,
                emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
              })}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Known Conditions Management */}
        <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
          <label className="font-bold text-slate-900 block">{t.profile.conditions}</label>
          <div className="flex flex-wrap gap-2">
            {formData.knownConditions.map((cond, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-50 text-teal-900 border border-teal-200 font-medium">
                <span>{cond}</span>
                <button type="button" onClick={() => handleRemoveCondition(idx)} className="text-teal-700 hover:text-teal-950">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 max-w-md pt-1">
            <input
              type="text"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              placeholder="Add condition (e.g. Type 2 Diabetes)"
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="button"
              onClick={handleAddCondition}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold"
            >
              Add
            </button>
          </div>
        </div>

        {/* Known Allergies Management */}
        <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
          <label className="font-bold text-slate-900 block">{t.profile.allergies}</label>
          <div className="flex flex-wrap gap-2">
            {formData.allergies.map((alg, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
                <span>{alg.substance} ({alg.reaction})</span>
                <button type="button" onClick={() => handleRemoveAllergy(idx)} className="text-amber-700 hover:text-amber-950">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 max-w-lg pt-1">
            <input
              type="text"
              value={newAllergySubstance}
              onChange={(e) => setNewAllergySubstance(e.target.value)}
              placeholder="Allergen (e.g. Penicillin, Sulfa)"
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              value={newAllergyReaction}
              onChange={(e) => setNewAllergyReaction(e.target.value)}
              placeholder="Reaction (e.g. Skin hives)"
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="button"
              onClick={handleAddAllergy}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold shrink-0"
            >
              Add Allergy
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            {t.actions.saveChanges}
          </button>
        </div>

      </form>

      {/* AI & Security Configuration Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Cpu className="w-4 h-4 text-teal-600" />
            <span>{t.profile.apiConfigTitle}</span>
          </h3>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            config?.geminiConfigured ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            {config?.geminiConfigured ? 'Gemini 2.5 Active' : 'Offline Heuristics Mode'}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {config?.geminiConfigured 
            ? 'Your Gemini API key is configured securely on the server. Summaries and entity extractions utilize Gemini 2.5 Flash with deterministic fallback.'
            : t.profile.apiConfigHelp
          }
        </p>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1 font-mono text-slate-700">
          <div className="text-[11px] text-slate-400 uppercase font-sans font-semibold mb-1">Configuration Path:</div>
          <div>File: <code>health-copilot/.env</code></div>
          <div>Variable: <code>GEMINI_API_KEY=your_key_here</code></div>
          <div>Model: <code>GEMINI_MODEL={config?.model || 'gemini-2.5-flash'}</code></div>
        </div>
      </div>

      {/* Health Data Portability Card (FHIR R4 & Markdown Export) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Download className="w-4 h-4 text-teal-600" />
            <span>{t.profile.exportTitle}</span>
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
            FHIR R4 Ready
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {t.profile.exportDesc}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href={api.getFhirExportUrl(patient?.id)}
            download
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition-colors inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{t.actions.exportFhir}</span>
          </a>

          <a
            href={api.getMarkdownExportUrl(patient?.id)}
            download
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs transition-colors inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{t.actions.exportSummary}</span>
          </a>
        </div>
      </div>

      {/* Danger Zone: Reset & Wipe */}
      <div className="bg-red-50/50 rounded-3xl border border-red-200 p-6 sm:p-8 space-y-4">
        <h3 className="font-bold text-red-950 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span>{t.profile.dangerTitle}</span>
        </h3>
        <p className="text-xs text-red-900 leading-relaxed">
          {t.profile.dangerDesc}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={onResetDemo}
            className="px-4 py-2 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-red-800 font-semibold text-xs transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.actions.resetDemo}</span>
          </button>
        </div>
      </div>

    </div>
  );
}