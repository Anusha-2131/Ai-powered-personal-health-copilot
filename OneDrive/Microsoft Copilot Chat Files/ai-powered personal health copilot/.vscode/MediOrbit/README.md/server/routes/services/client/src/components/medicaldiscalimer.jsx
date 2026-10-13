import React, { useState } from 'react';
import { ShieldAlert, PhoneCall, ChevronDown, ChevronUp } from 'lucide-react';

export function MedicalDisclaimer({ t }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-amber-50/80 border-b border-amber-200/80 text-amber-950 text-xs px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong className="font-semibold text-amber-900">{t.disclaimer.title}:</strong>{' '}
            {t.disclaimer.text.slice(0, 160)}...
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-amber-800 underline font-semibold hover:text-amber-950 inline-flex items-center gap-0.5 ml-1"
          >
            {isExpanded ? 'Less' : 'Read Full Safety Notice'}
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-amber-800 shrink-0 font-medium bg-amber-100/60 px-2 py-0.5 rounded border border-amber-200">
          <PhoneCall className="w-3 h-3 text-red-600" />
          <span>Severe symptoms? Call 112 / 911 immediately</span>
        </div>
      </div>

      {isExpanded && (
        <div className="max-w-7xl mx-auto mt-2.5 pt-2 border-t border-amber-200/60 text-amber-900 text-xs leading-relaxed space-y-1.5">
          <p>{t.disclaimer.text}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 font-normal text-[11px] text-amber-800">
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-amber-900">•</span>
              <span><strong>No Medication Alteration:</strong> Never stop, begin, or adjust prescription doses without clinical supervision.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-amber-900">•</span>
              <span><strong>Reference Range Context:</strong> Out-of-range lab values are informative data points for doctor consultations, not definitive diagnoses.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-amber-900">•</span>
              <span><strong>Prototype Status:</strong> This application is a local educational demo. Health records are stored securely on your local computer.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}