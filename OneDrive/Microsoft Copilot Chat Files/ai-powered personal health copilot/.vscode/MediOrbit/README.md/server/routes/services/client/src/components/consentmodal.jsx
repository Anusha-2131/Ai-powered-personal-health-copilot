import React from 'react';
import { Shield, CheckCircle, AlertTriangle, X } from 'lucide-react';

export function ConsentModal({ isOpen, onClose, onConfirm, t }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-base">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Shield className="w-5 h-5" />
            </div>
            <span>{t.consent.title}</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>{t.consent.description}</p>

          {/* Privacy & Security Safeguards */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-teal-600" />
              <span>Privacy & Security Safeguards</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
              <li>API keys and authentication credentials are maintained on the secure server side only.</li>
              <li>Data is processed exclusively for parsing and summarizing your selected document.</li>
              <li>You have full control to edit or delete extracted records at any time.</li>
              <li>You can export your health data into standard FHIR R4 JSON or markdown anytime.</li>
            </ul>
          </div>

          {/* Educational Prototype Notice */}
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Educational Prototype:</strong> AI summaries are generated to aid your personal understanding. They do not replace evaluation by a qualified medical professional.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
          >
            {t.actions.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            I Consent & Proceed
          </button>
        </div>

      </div>
    </div>
  );
}