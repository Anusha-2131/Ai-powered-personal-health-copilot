import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { api } from '../api';

export function NewPatientModal({ isOpen, onClose, onPatientCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    bloodGroup: '',
    phone: '',
    email: '',
    preferredLanguage: 'en',
    emergencyContact: { name: '', relationship: '', phone: '' },
    knownConditions: [],
    allergies: []
  });

  const [allergyInput, setAllergyInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter patient name');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.createPatient(formData);
      if (res.success) {
        onPatientCreated(res.patient);
        onClose();
      } else {
        alert(res.error || 'Failed to create patient profile');
      }
    } catch (err) {
      alert('Error creating profile: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-base text-slate-900">
            <User className="w-5 h-5 text-teal-600" />
            <span>Create New Patient Profile</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Rahul Verma"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="40"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Blood Group</label>
              <input
                type="text"
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                placeholder="B+"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Preferred Language</label>
            <select
              value={formData.preferredLanguage}
              onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Known Allergies (comma-separated)</label>
            <input
              type="text"
              value={allergyInput}
              onChange={(e) => {
                setAllergyInput(e.target.value);
                setFormData({
                  ...formData,
                  allergies: e.target.value
                    .split(',')
                    .map(s => ({ substance: s.trim(), reaction: 'Sensitivity' }))
                    .filter(a => a.substance)
                });
              }}
              placeholder="e.g. Penicillin, Peanuts, Sulfa"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold shadow-xs transition-colors"
            >
              Create Profile
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}