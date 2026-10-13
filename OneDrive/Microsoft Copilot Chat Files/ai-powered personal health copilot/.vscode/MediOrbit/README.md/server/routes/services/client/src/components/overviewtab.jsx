import React from 'react';
import { 
  FileText, 
  Pill, 
  Activity, 
  Calendar, 
  AlertTriangle, 
  ShieldCheck, 
  Stethoscope, 
  User, 
  Phone,
  ChevronRight,
  UploadCloud,
  FileCheck2
} from 'lucide-react';

export function OverviewTab({ 
  patient, 
  records, 
  t, 
  setActiveTab, 
  onSelectRecord, 
  onQuickUpload, 
  onQuickSample 
}) {
  const totalRecords = records.length;
  
  const allMedications = records.flatMap(r => r.medications || []);
  const activeMeds = allMedications.filter(m => m.isActive !== false);

  const allObservations = records.flatMap(r => r.observations || []);
  const flaggedLabs = allObservations.filter(o => o.interpretation && o.interpretation !== 'NORMAL');

  const followUps = records
    .filter(r => r.encounter?.followUpDate || r.encounter?.followUpInstructions)
    .map(r => ({
      recordId: r.id,
      title: r.title,
      facility: r.facility,
      provider: r.provider,
      date: r.encounter.followUpDate || 'As advised',
      instructions: r.encounter.followUpInstructions
    }));

  return (
    <div className="space-y-6">
      
      {/* Patient Welcome Header */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 text-xs font-semibold uppercase tracking-wider mb-3 border border-teal-400/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>FHIR Structured Health Record</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            {t.overview.welcome} {patient?.name || 'Aarav Sharma'}
          </h1>
          <p className="text-teal-100 text-xs sm:text-sm leading-relaxed mb-5">
            {t.overview.summarySubtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-teal-100/90 pt-1 border-t border-teal-600/50">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
              <User className="w-3.5 h-3.5 text-teal-300" />
              <span>{patient?.age ? `${patient.age} yrs` : '45 yrs'} • {patient?.gender || 'Male'} • Blood: {patient?.bloodGroup || 'B+'}</span>
            </div>
            {patient?.emergencyContact?.name && (
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
                <Phone className="w-3.5 h-3.5 text-teal-300" />
                <span>Contact: {patient.emergencyContact.name} ({patient.emergencyContact.relationship})</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-teal-500/20 text-teal-200 px-3 py-1.5 rounded-xl border border-teal-400/30">
              <span>Lang: {patient?.preferredLanguage === 'hi' ? 'Hindi (हिंदी)' : 'English'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Allergies & Chronic Conditions Alert Pill */}
      {(patient?.allergies?.length > 0 || patient?.knownConditions?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patient?.allergies?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-amber-950 mb-0.5">
                  {t.overview.allergiesWarning}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {patient.allergies.map((alg, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100/80 text-amber-900 font-semibold border border-amber-300/60">
                      {alg.substance} ({alg.reaction || 'allergic'})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {patient?.knownConditions?.length > 0 && (
            <div className="bg-teal-50/80 border border-teal-200/80 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-teal-100 text-teal-800 shrink-0 mt-0.5">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-teal-950 mb-0.5">
                  {t.overview.conditionsOverview}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {patient.knownConditions.map((cond, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-100/70 text-teal-900 font-medium border border-teal-200">
                      {cond}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveTab('timeline')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.overview.totalRecords}</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalRecords}</div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>View timeline</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        <div 
          onClick={() => setActiveTab('medicines')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.overview.activeMeds}</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-100 transition-colors">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeMeds.length}</div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>View prescriptions</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        <div 
          onClick={() => setActiveTab('labTrends')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.overview.outOfRangeLabs}</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-100 transition-colors">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{flaggedLabs.length}</div>
          <p className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
            <span>Review non-urgent markers</span>
            <ChevronRight className="w-3 h-3 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.overview.upcomingFollowups}</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{followUps.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Extracted from records
          </p>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 shrink-0">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <div className="font-semibold text-sm">Have a new prescription or lab test?</div>
            <div className="text-xs text-slate-400">Upload a PDF/Image or try one of our realistic fictional clinical test cases.</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            onClick={onQuickSample}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            {t.actions.trySample}
          </button>
          <button
            onClick={onQuickUpload}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{t.actions.uploadRecord}</span>
          </button>
        </div>
      </div>

      {/* Two-Column Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Health Records */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-teal-600" />
              <span>{t.overview.recentRecords}</span>
            </div>
            <button
              onClick={() => setActiveTab('timeline')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>View all ({totalRecords})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {records.slice(0, 3).map(rec => (
              <div
                key={rec.id}
                onClick={() => onSelectRecord(rec)}
                className="p-3.5 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {t.docTypes[rec.documentType] || rec.documentType}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs mt-1.5 group-hover:text-teal-700 transition-colors">
                      {rec.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {rec.facility} • {rec.documentDate}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Medications Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" />
              <span>{t.overview.activeMedicationsSummary}</span>
            </div>
            <button
              onClick={() => setActiveTab('medicines')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>Schedule Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeMeds.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              {t.overview.noMeds}
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeMeds.slice(0, 4).map((med, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{med.name} <span className="font-normal text-slate-600">({med.strength})</span></div>
                    <div className="text-[11px] text-slate-500">{med.frequency} • {med.instructions}</div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Upcoming Follow-ups Panel */}
      {followUps.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{t.overview.upcomingVisits}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {followUps.map((f, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-100 text-xs">
                <div className="font-semibold text-blue-950 flex items-center justify-between">
                  <span>{f.provider} ({f.facility})</span>
                  <span className="text-[11px] font-bold text-blue-700">{f.date}</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">{f.instructions}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}