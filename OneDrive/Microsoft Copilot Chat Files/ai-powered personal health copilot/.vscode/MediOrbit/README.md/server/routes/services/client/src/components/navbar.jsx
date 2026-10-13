import React from 'react';
import { 
  HeartPulse, 
  Languages, 
  User, 
  Cpu, 
  Plus, 
  UploadCloud,
  ChevronDown
} from 'lucide-react';

export function Navbar({ 
  activeTab, 
  setActiveTab, 
  language, 
  setLanguage, 
  t, 
  patients, 
  activePatient, 
  setActivePatient, 
  config,
  onOpenNewPatientModal,
  onOpenUpload
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  {t.appTitle}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  FHIR Copilot
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* AI Status Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 border-slate-200 text-slate-600">
              <Cpu className={`w-3.5 h-3.5 ${config?.geminiConfigured ? 'text-teal-600' : 'text-amber-500'}`} />
              <span>
                {config?.geminiConfigured ? t.aiActiveBadge : t.demoModeBadge}
              </span>
            </div>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
              title={t.actions.switchLanguage}
            >
              <Languages className="w-3.5 h-3.5 text-teal-600" />
              <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            {/* Patient Switcher */}
            <div className="relative group">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-medium cursor-pointer transition-colors">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span className="max-w-[110px] truncate">{activePatient?.name || 'Select Profile'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>

              {/* Patient Dropdown Menu */}
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 hidden group-hover:block z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Patient Profile
                </div>
                {patients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setActivePatient(p)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-teal-50 transition-colors ${
                      p.id === activePatient?.id ? 'font-bold text-teal-800 bg-teal-50/50' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.age ? `${p.age} Y / ` : ''}{p.gender}</div>
                    </div>
                    {p.id === activePatient?.id && (
                      <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                    )}
                  </button>
                ))}
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={onOpenNewPatientModal}
                    className="w-full text-left px-3 py-2 text-xs text-teal-600 hover:bg-teal-50 flex items-center gap-1.5 font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Profile</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Upload Button */}
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium shadow-xs transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">{t.actions.uploadRecord}</span>
            </button>

          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-100 py-1.5 overflow-x-auto text-xs font-medium">
          {[
            { id: 'overview', label: t.nav.overview },
            { id: 'timeline', label: t.nav.timeline },
            { id: 'upload', label: t.nav.upload },
            { id: 'medicines', label: t.nav.medicines },
            { id: 'labTrends', label: t.nav.labTrends },
            { id: 'profile', label: t.nav.profile },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-teal-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}