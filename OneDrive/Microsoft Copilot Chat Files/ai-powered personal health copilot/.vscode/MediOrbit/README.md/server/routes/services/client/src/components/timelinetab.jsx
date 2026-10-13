import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  Pill, 
  Activity, 
  Download, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle,
  X,
  Stethoscope,
  Sparkles
} from 'lucide-react';

export function TimelineTab({ 
  records, 
  patient, 
  t, 
  language,
  onSelectRecord, 
  onEditRecord, 
  onDeleteRecord, 
  onExportFhir 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocType, setSelectedDocType] = useState('all');
  const [selectedMed, setSelectedMed] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Extract unique medicines and test names for dropdown filters
  const uniqueMedicines = useMemo(() => {
    const set = new Set();
    records.forEach(r => (r.medications || []).forEach(m => {
      if (m.name) set.add(m.name);
    }));
    return Array.from(set).sort();
  }, [records]);

  const uniqueTests = useMemo(() => {
    const set = new Set();
    records.forEach(r => (r.observations || []).forEach(o => {
      if (o.testName) set.add(o.testName);
    }));
    return Array.from(set).sort();
  }, [records]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      // DocType filter
      if (selectedDocType !== 'all' && rec.documentType !== selectedDocType) {
        return false;
      }

      // Search query (case-insensitive)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesBasic = (
          (rec.title && rec.title.toLowerCase().includes(q)) ||
          (rec.facility && rec.facility.toLowerCase().includes(q)) ||
          (rec.provider && rec.provider.toLowerCase().includes(q)) ||
          (rec.rawText && rec.rawText.toLowerCase().includes(q))
        );
        const matchesMed = (rec.medications || []).some(m => m.name && m.name.toLowerCase().includes(q));
        const matchesTest = (rec.observations || []).some(o => o.testName && o.testName.toLowerCase().includes(q));
        const matchesCond = (rec.conditions || []).some(c => c.name && c.name.toLowerCase().includes(q));
        if (!matchesBasic && !matchesMed && !matchesTest && !matchesCond) return false;
      }

      // Specific Medicine filter
      if (selectedMed) {
        const hasMed = (rec.medications || []).some(m => m.name && m.name.toLowerCase() === selectedMed.toLowerCase());
        if (!hasMed) return false;
      }

      // Specific Test filter
      if (selectedTest) {
        const hasTest = (rec.observations || []).some(o => o.testName && o.testName.toLowerCase() === selectedTest.toLowerCase());
        if (!hasTest) return false;
      }

      // Date Range filter
      if (startDate && rec.documentDate < startDate) return false;
      if (endDate && rec.documentDate > endDate) return false;

      return true;
    });
  }, [records, selectedDocType, searchQuery, selectedMed, selectedTest, startDate, endDate]);

  const hasActiveFilters = selectedDocType !== 'all' || searchQuery || selectedMed || selectedTest || startDate || endDate;

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDocType('all');
    setSelectedMed('');
    setSelectedTest('');
    setStartDate('');
    setEndDate('');
  };

  const getDocTypeColor = (type) => {
    switch (type) {
      case 'lab_report': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'prescription': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'discharge_summary': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'diagnostic_report': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {t.timeline.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          {t.timeline.subtitle}
        </p>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        
        {/* Search Row */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.timeline.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2 w-full sm:w-auto text-xs text-slate-600">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700"
              title="Start Date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700"
              title="End Date"
            />
          </div>
        </div>

        {/* Document Type Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {[
            { id: 'all', label: t.docTypes.all },
            { id: 'lab_report', label: t.docTypes.lab_report },
            { id: 'prescription', label: t.docTypes.prescription },
            { id: 'discharge_summary', label: t.docTypes.discharge_summary },
            { id: 'diagnostic_report', label: t.docTypes.diagnostic_report }
          ].map(dt => (
            <button
              key={dt.id}
              onClick={() => setSelectedDocType(dt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedDocType === dt.id
                  ? 'bg-teal-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {dt.label}
            </button>
          ))}
        </div>

        {/* Specific Drug & Test Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Medicine:</span>
            <select
              value={selectedMed}
              onChange={(e) => setSelectedMed(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs"
            >
              <option value="">All Medicines</option>
              {uniqueMedicines.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Lab Test:</span>
            <select
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs"
            >
              <option value="">All Lab Tests</option>
              {uniqueTests.map(test => (
                <option key={test} value={test}>{test}</option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-teal-600 font-semibold hover:text-teal-700 text-xs ml-auto inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

      </div>

      {/* Record Feed */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">{t.timeline.noRecordsFound}</h3>
          <p className="text-xs text-slate-500 mt-1">Try relaxing your search terms or document type filters.</p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-teal-50 text-teal-700 font-medium text-xs hover:bg-teal-100 transition-colors"
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {filteredRecords.map((record) => {
            const flaggedObservations = (record.observations || []).filter(o => o.interpretation !== 'NORMAL');
            const summaryText = language === 'hi' && record.summary?.hindiSummary 
              ? record.summary.hindiSummary 
              : record.summary?.plainLanguageSummary;

            return (
              <div key={record.id} className="relative group">
                
                {/* Timeline Node Icon */}
                <div className="absolute -left-6 sm:-left-8 top-5 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-teal-600 text-teal-600 flex items-center justify-center shadow-xs">
                  {record.documentType === 'prescription' ? (
                    <Pill className="w-3.5 h-3.5" />
                  ) : record.documentType === 'lab_report' ? (
                    <Activity className="w-3.5 h-3.5" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Record Card */}
                <div className="bg-white rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all p-5">
                  
                  {/* Top Meta Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getDocTypeColor(record.documentType)}`}>
                        {t.docTypes[record.documentType] || record.documentType}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{record.documentDate}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {record.confidenceScore}% confidence
                      </span>
                      {record.provenance === 'user_edited' && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Edited by You
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Provider */}
                  <h3 
                    onClick={() => onSelectRecord(record)}
                    className="font-bold text-base text-slate-900 group-hover:text-teal-700 transition-colors cursor-pointer"
                  >
                    {record.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {record.provider} • <span className="font-medium text-slate-700">{record.facility}</span>
                  </p>

                  {/* AI Summary Preview */}
                  {summaryText && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                      <div className="flex items-center gap-1.5 text-teal-800 font-semibold mb-1 text-[11px]">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        <span>AI Plain-Language Summary ({language === 'hi' ? 'हिंदी' : 'English'})</span>
                      </div>
                      <p className="line-clamp-2">{summaryText}</p>
                    </div>
                  )}

                  {/* Highlight Tags (Flagged labs or Meds) */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {flaggedObservations.map((o, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 font-semibold text-[11px] border border-amber-200">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>{o.testName}: {o.value} {o.unit || ''} ({o.interpretation})</span>
                      </span>
                    ))}

                    {(record.medications || []).slice(0, 3).map((m, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-900 font-medium text-[11px] border border-teal-200">
                        <Pill className="w-3 h-3 text-teal-600" />
                        <span>{m.name} ({m.strength})</span>
                      </span>
                    ))}
                  </div>

                  {/* Action Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectRecord(record)}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-1"
                      >
                        <span>{t.timeline.viewDetails}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEditRecord(record)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t.actions.edit}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onExportFhir(record.id)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs transition-colors"
                        title="Download FHIR R4 JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteRecord(record.id)}
                        className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 text-xs transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}