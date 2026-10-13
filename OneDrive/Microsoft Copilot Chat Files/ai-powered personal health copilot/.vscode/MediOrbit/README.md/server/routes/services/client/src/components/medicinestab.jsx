import React, { useState, useMemo } from 'react';
import { 
  Pill, 
  Clock, 
  Search, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export function MedicinesTab({ 
  records, 
  patient, 
  t, 
  onSelectRecord 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // 'all' | 'active' | 'completed'

  // Extract all medications across all records
  const medicationsList = useMemo(() => {
    const list = [];
    records.forEach(rec => {
      (rec.medications || []).forEach(med => {
        list.push({
          ...med,
          recordId: rec.id,
          recordTitle: rec.title,
          recordDate: rec.documentDate,
          facility: rec.facility,
          provider: rec.provider
        });
      });
    });
    return list;
  }, [records]);

  // Check allergy cross-reactivity against patient profile allergies
  const patientAllergies = patient?.allergies || [];
  const allergyAlerts = useMemo(() => {
    const alerts = [];
    patientAllergies.forEach(alg => {
      const sub = (alg.substance || '').toLowerCase();
      if (sub.includes('penicillin')) {
        medicationsList.forEach(m => {
          if (/amoxicillin|ampicillin|penicillin|augmentin/i.test(m.name)) {
            alerts.push({
              medName: m.name,
              allergySubstance: alg.substance,
              reaction: alg.reaction,
              recordTitle: m.recordTitle
            });
          }
        });
      }
      if (sub.includes('sulfa')) {
        medicationsList.forEach(m => {
          if (/bactrim|septra|sulfamethoxazole/i.test(m.name)) {
            alerts.push({
              medName: m.name,
              allergySubstance: alg.substance,
              reaction: alg.reaction,
              recordTitle: m.recordTitle
            });
          }
        });
      }
    });
    return alerts;
  }, [patientAllergies, medicationsList]);

  // Filtered medications
  const filteredMeds = useMemo(() => {
    return medicationsList.filter(m => {
      if (filterActive === 'active' && m.isActive === false) return false;
      if (filterActive === 'completed' && m.isActive !== false) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.name?.toLowerCase().includes(q);
        const matchesInd = m.indication?.toLowerCase().includes(q);
        const matchesInst = m.instructions?.toLowerCase().includes(q);
        if (!matchesName && !matchesInd && !matchesInst) return false;
      }
      return true;
    });
  }, [medicationsList, filterActive, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {t.medicines.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          {t.medicines.subtitle}
        </p>
      </div>

      {/* Allergy Cross-Check Alert Banner if detected */}
      {allergyAlerts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 text-red-950 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-sm text-red-900">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <span>{t.medicines.allergyAlertTitle}</span>
          </div>
          {allergyAlerts.map((alt, idx) => (
            <p key={idx} className="text-xs text-red-900 leading-relaxed">
              <strong>Caution:</strong> The prescribed medicine <strong>{alt.medName}</strong> in "{alt.recordTitle}" may cross-react with documented patient allergy to <strong>{alt.allergySubstance}</strong> ({alt.reaction}). Always verify with your pharmacist or prescribing doctor before taking.
            </p>
          ))}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.medicines.searchPlaceholder || 'Search medicines'}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterActive('all')}
              className={`px-3 py-2 text-xs font-medium rounded-xl border ${filterActive === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterActive('active')}
              className={`px-3 py-2 text-xs font-medium rounded-xl border ${filterActive === 'active' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setFilterActive('completed')}
              className={`px-3 py-2 text-xs font-medium rounded-xl border ${filterActive === 'completed' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200'}`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Medicine Cards */}
      {filteredMeds.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          <Pill className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="font-medium text-slate-700">No medicines found</p>
          <p className="text-sm mt-1">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMeds.map((med, idx) => (
            <div key={`${med.recordId}-${med.name}-${idx}`} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900">{med.name}</h3>
                    {med.isActive === false ? (
                      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-amber-100 text-amber-700 border border-amber-200">Completed</span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Active</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{med.recordDate || 'Unknown date'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectRecord?.(med.recordId)}
                  className="inline-flex items-center gap-1 self-start rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View record
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Indication</p>
                  <p className="mt-1 text-slate-700">{med.indication || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Instructions</p>
                  <p className="mt-1 text-slate-700">{med.instructions || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Prescribed by</p>
                  <p className="mt-1 text-slate-700">{med.provider || 'Not available'}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Facility</p>
                  <p className="mt-1 text-slate-700">{med.facility || 'Not available'}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span className="rounded-full bg-slate-100 px-2 py-1">{med.recordTitle || 'Record'}</span>
                {med.dosage && <span className="rounded-full bg-slate-100 px-2 py-1">{med.dosage}</span>}
                {med.frequency && <span className="rounded-full bg-slate-100 px-2 py-1">{med.frequency}</span>}
                {med.route && <span className="rounded-full bg-slate-100 px-2 py-1">{med.route}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}