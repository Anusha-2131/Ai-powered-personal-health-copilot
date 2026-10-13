import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Pill, 
  Activity, 
  Download, 
  Edit3, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api';

export function RecordDetailModal({ 
  record, 
  onClose, 
  onEdit, 
  onDelete, 
  t 
}) {
  const [langTab, setLangTab] = useState('en');
  if (!record) return null;

  const summary = record.summary || {};
  const activeSummary = langTab === 'hi' && summary.hindiSummary ? summary.hindiSummary : summary.plainLanguageSummary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-400/20">
              {t.docTypes[record.documentType] || record.documentType}
            </span>
            <span className="text-xs text-slate-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span>{record.documentDate}</span>
            </span>
            <span className="text-xs text-slate-400">
              • {record.confidenceScore}% confidence
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {record.title}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {record.provider} • <span className="font-semibold text-teal-200">{record.facility}</span>
          </p>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
          
          <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Provenance: {record.provenance === 'user_edited' ? 'Verified & Edited by User' : 'OCR / AI Extracted from source'}</span>
            </span>
            <span>Recorded: {new Date(record.createdAt).toLocaleDateString()}</span>
          </div>

          {/* AI Summary */}
          <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-teal-950 text-xs sm:text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>AI Plain-Language Explanation</span>
              </div>

              <div className="flex p-0.5 bg-white/80 rounded-xl border border-teal-200 text-[11px]">
                <button
                  onClick={() => setLangTab('en')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    langTab === 'en' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLangTab('hi')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    langTab === 'hi' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  सरल हिंदी
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
              {activeSummary || 'No summary available.'}
            </p>

            {summary.keyTakeaways?.length > 0 && (
              <div className="pt-2 border-t border-teal-200/60 space-y-1">
                <div className="font-bold text-teal-950 text-xs">Key Clinical Highlights:</div>
                <ul className="list-disc pl-5 space-y-0.5 text-slate-700 text-xs">
                  {summary.keyTakeaways.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Out-of-Range Lab Explanations */}
          {summary.outOfRangeExplanations?.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
              <div className="font-bold text-amber-950 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Understanding Flagged Lab Values</span>
              </div>
              <div className="space-y-2">
                {summary.outOfRangeExplanations.map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-amber-200/70 text-xs">
                    <div className="font-bold text-amber-950 flex items-center justify-between">
                      <span>{item.testName}: {item.value}</span>
                      <span className="text-[11px] font-normal text-slate-500">Normal: {item.normalRange}</span>
                    </div>
                    <p className="text-slate-700 mt-1">{item.generalMeaning}</p>
                    <p className="text-amber-800 font-semibold mt-1">Recommendation: {item.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lab Tests Table */}
          {record.observations?.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>Laboratory Tests & Measurements ({record.observations.length})</span>
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-3">Test Name</th>
                      <th className="p-3">Value</th>
                      <th className="p-3">Standard Range</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {record.observations.map((obs, idx) => (
                      <tr key={idx} className={obs.interpretation !== 'NORMAL' ? 'bg-amber-50/40' : ''}>
                        <td className="p-3 font-medium text-slate-900">{obs.testName}</td>
                        <td className="p-3 font-bold text-slate-900">{obs.value} {obs.unit || ''}</td>
                        <td className="p-3 text-slate-500">{obs.referenceRangeText || 'N/A'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            obs.interpretation === 'HIGH' ? 'bg-amber-100 text-amber-900' :
                            obs.interpretation === 'LOW' ? 'bg-blue-100 text-blue-900' :
                            'bg-emerald-50 text-emerald-800'
                          }`}>
                            {obs.interpretation}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Medications */}
          {record.medications?.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <Pill className="w-4 h-4 text-teal-600" />
                <span>Prescribed Medications ({record.medications.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {record.medications.map((m, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1">
                    <div className="font-bold text-slate-900">{m.name} ({m.strength})</div>
                    <div className="text-teal-700 font-semibold">{m.frequency} • {m.duration}</div>
                    <div className="text-slate-600">{m.instructions}</div>
                    {m.indication && <div className="text-slate-400 text-[11px]">Indication: {m.indication}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions to Ask Doctor */}
          {summary.questionsForDoctor?.length > 0 && (
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
              <div className="font-bold text-blue-950 text-xs flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Questions to Ask Your Doctor at Your Next Visit</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-700 text-xs">
                {summary.questionsForDoctor.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw Text */}
          {record.rawText && (
            <details className="text-xs text-slate-500 pt-2 border-t border-slate-100">
              <summary className="font-semibold text-slate-700 cursor-pointer hover:text-slate-900">
                View Raw OCR / Document Text
              </summary>
              <pre className="mt-2 p-3 rounded-xl bg-slate-100 text-[11px] font-mono text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {record.rawText}
              </pre>
            </details>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <a
            href={api.getRecordFhirExportUrl(record.id)}
            download
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export FHIR R4 (JSON)</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(record)}
              className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors inline-flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t.actions.edit}</span>
            </button>
            <button
              onClick={() => onDelete(record.id)}
              className="px-3 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 font-semibold text-xs transition-colors inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.actions.delete}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              {t.actions.close}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}