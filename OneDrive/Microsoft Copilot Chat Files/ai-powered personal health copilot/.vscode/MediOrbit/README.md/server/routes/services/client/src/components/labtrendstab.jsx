import React, { useState, useMemo } from 'react';
import {
  Activity,
  Search,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export function LabTrendsTab({
  records,
  t,
  onSelectRecord
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const allObservations = useMemo(() => {
    const list = [];
    records.forEach(rec => {
      (rec.observations || []).forEach(obs => {
        list.push({
          ...obs,
          recordId: rec.id,
          recordTitle: rec.title,
          recordDate: rec.documentDate,
          facility: rec.facility
        });
      });
    });
    return list;
  }, [records]);

  const groupedByTest = useMemo(() => {
    const map = new Map();
    allObservations.forEach(obs => {
      const name = obs.testName || 'Unknown Test';
      if (!map.has(name)) {
        map.set(name, []);
      }
      map.get(name).push(obs);
    });

    map.forEach(arr => {
      arr.sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate));
    });

    return Array.from(map.entries()).map(([testName, entries]) => ({
      testName,
      latest: entries[0],
      history: entries
    }));
  }, [allObservations]);

  const filteredGroups = useMemo(() => {
    return groupedByTest.filter(group => {
      const isFlagged = group.latest.interpretation !== 'NORMAL';
      if (filterStatus === 'flagged' && !isFlagged) return false;
      if (filterStatus === 'normal' && isFlagged) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = group.testName.toLowerCase().includes(q);
        const matchesVal = group.latest.value?.toLowerCase().includes(q);
        const matchesExp = group.latest.explanation?.toLowerCase().includes(q);
        if (!matchesName && !matchesVal && !matchesExp) return false;
      }
      return true;
    });
  }, [groupedByTest, filterStatus, searchQuery]);

  const renderRangeGauge = (obs) => {
    const low = parseFloat(obs.referenceRangeLow);
    const high = parseFloat(obs.referenceRangeHigh);
    const val = parseFloat(obs.value?.replace(/[<>]/g, ''));

    if (isNaN(low) || isNaN(high) || isNaN(val)) {
      return (
        <div className="text-[11px] text-slate-500 font-medium">
          Reference Range: {obs.referenceRangeText || 'Stated on report'}
        </div>
      );
    }

    const minBound = Math.max(0, low * 0.7);
    const maxBound = high * 1.3;
    const totalSpan = maxBound - minBound;

    const normalStartPct = Math.max(0, ((low - minBound) / totalSpan) * 100);
    const normalEndPct = Math.min(100, ((high - minBound) / totalSpan) * 100);
    const normalWidthPct = normalEndPct - normalStartPct;

    const valuePct = Math.max(5, Math.min(95, ((val - minBound) / totalSpan) * 100));

    return (
      <div className="space-y-1.5 mt-2">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Low ({obs.referenceRangeLow})</span>
          <span className="font-semibold text-slate-600">Standard: {obs.referenceRangeText}</span>
          <span>High ({obs.referenceRangeHigh})</span>
        </div>

        <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className="absolute top-0 bottom-0 bg-emerald-100 border-x border-emerald-200"
            style={{
              left: `${normalStartPct}%`,
              width: `${Math.max(normalWidthPct, 4)}%`
            }}
          />
          <div
            className="absolute top-0 bottom-0 rounded-full bg-sky-500 shadow-sm"
            style={{
              left: `${Math.max(0, valuePct - 2.5)}%`,
              width: '5%'
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>Your value: {obs.value}</span>
          <span>{obs.interpretation || 'Result'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">Lab Trends</h3>
            <p className="text-xs text-slate-500">Track values over time</p>
          </div>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t?.('searchLabs') || 'Search labs'}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${filterStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('flagged')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${filterStatus === 'flagged' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Flagged
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('normal')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${filterStatus === 'normal' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Normal
        </button>
      </div>

      <div className="space-y-3">
        {filteredGroups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No lab trends match your filters.
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.testName} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`h-2.5 w-2.5 rounded-full ${group.latest.interpretation !== 'NORMAL' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800 truncate">{group.testName}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{group.latest.facility || 'Facility not listed'}</span>
                      <span>•</span>
                      <span>{group.latest.recordDate || 'Unknown date'}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectRecord?.(group.latest.recordId)}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200"
                >
                  View
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 rounded-xl bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Latest result</div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-slate-800">{group.latest.value}</span>
                      <span className={`text-[11px] font-medium ${group.latest.interpretation !== 'NORMAL' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {group.latest.interpretation || 'Normal'}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-semibold text-sky-700">
                    {group.history.length} entries
                  </div>
                </div>

                {renderRangeGauge(group.latest)}
              </div>

              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-2">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-slate-500">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Recent history
                </div>

                <div className="space-y-2">
                  {group.history.slice(0, 4).map((entry) => (
                    <button
                      key={`${entry.recordId}-${entry.recordDate}`}
                      type="button"
                      onClick={() => onSelectRecord?.(entry.recordId)}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-left hover:bg-slate-100"
                    >
                      <div>
                        <div className="text-xs font-medium text-slate-700">{entry.value}</div>
                        <div className="text-[10px] text-slate-500">{entry.recordDate}</div>
                      </div>
                      <div className={`text-[10px] font-medium ${entry.interpretation !== 'NORMAL' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {entry.interpretation || 'Normal'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
