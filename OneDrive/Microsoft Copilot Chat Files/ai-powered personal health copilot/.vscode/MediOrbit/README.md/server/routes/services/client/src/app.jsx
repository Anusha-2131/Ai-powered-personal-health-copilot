import React, { useState, useEffect, useTransition } from 'react';
import { api } from './api';
import { translations } from './translations';
import { Navbar } from './components/navbar';
import { MedicalDisclaimer } from './components/medicaldisclaimer';
import { OverviewTab } from './components/overviewtab';
import { TimelineTab } from './components/timelinetab';
import { UploadWizardTab } from './components/uploadwizardtab';
import { MedicinesTab } from './components/medicinestab';
import { LabTrendsTab } from './components/labtrendstab';
import { ProfileSettingsTab } from './components/profilesettingstab';
import { RecordDetailModal } from './components/recorddetailmodal';
import { EditRecordModal } from './components/editrecordmodal';  
import { NewPatientModal } from './components/newpatientmodal';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [language, setLanguage] = useState('en'); // 'en' or 'hi'
  
  // Data state
  const [patients, setPatients] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [samples, setSamples] = useState([]);
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState(null);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState(null);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  // Translations dictionary for active language
  const t = translations[language] || translations.en;

  // Initial load
  useEffect(() => {
    async function initData() {
      try {
        setIsLoading(true);
        const [configRes, patientsRes, samplesRes] = await Promise.all([
          api.getConfig(),
          api.getPatients(),
          api.getSamples()
        ]);

        setConfig(configRes);
        setSamples(samplesRes.samples || []);
        
        const ptList = patientsRes.patients || [];
        setPatients(ptList);

        if (ptList.length > 0) {
          const defaultPt = ptList[0];
          setActivePatient(defaultPt);
          setLanguage(defaultPt.preferredLanguage || 'en');
          
          const recRes = await api.getRecords(defaultPt.id);
          setRecords(recRes.records || []);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initData();
  }, []);

  // When active patient changes, fetch records
  const handleSelectPatient = async (patient) => {
    setActivePatient(patient);
    if (patient.preferredLanguage) {
      setLanguage(patient.preferredLanguage);
    }
    try {
      const recRes = await api.getRecords(patient.id);
      setRecords(recRes.records || []);
    } catch (err) {
      console.error('Error fetching records for patient:', err);
    }
  };

  // Record saved callback from Upload Wizard
  const handleRecordSaved = (newRecord) => {
    setRecords(prev => [newRecord, ...prev]);
    setSelectedRecordForDetail(newRecord);
    setActiveTab('timeline');
  };

  // Record updated callback
  const handleRecordUpdated = (updatedRecord) => {
    setRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    setSelectedRecordForEdit(null);
    if (selectedRecordForDetail?.id === updatedRecord.id) {
      setSelectedRecordForDetail(updatedRecord);
    }
  };

  // Record deleted callback
  const handleRecordDeleted = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await api.deleteRecord(recordId);
      if (res.success) {
        setRecords(prev => prev.filter(r => r.id !== recordId));
        if (selectedRecordForDetail?.id === recordId) {
          setSelectedRecordForDetail(null);
        }
      }
    } catch (err) {
      alert('Error deleting record: ' + err.message);
    }
  };

  // Reset to Demo Data
  const handleResetDemo = async () => {
    if (!window.confirm('Reset all records to default demo data?')) return;
    try {
      setIsLoading(true);
      await api.resetDemoData();
      const patientsRes = await api.getPatients();
      const ptList = patientsRes.patients || [];
      setPatients(ptList);
      if (ptList.length > 0) {
        setActivePatient(ptList[0]);
        const recRes = await api.getRecords(ptList[0].id);
        setRecords(recRes.records || []);
      }
    } catch (err) {
      alert('Failed to reset demo: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // New patient created
  const handlePatientCreated = (newPatient) => {
    setPatients(prev => [...prev, newPatient]);
    setActivePatient(newPatient);
    setRecords([]);
    setActiveTab('overview');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <div className="font-bold text-slate-800 text-sm">Loading Personal Health Copilot...</div>
          <p className="text-xs text-slate-500">Initializing health engine and demo database</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        t={t}
        patients={patients}
        activePatient={activePatient}
        setActivePatient={handleSelectPatient}
        config={config}
        onOpenNewPatientModal={() => setIsNewPatientModalOpen(true)}
        onOpenUpload={() => setActiveTab('upload')}
      />

      {/* Prominent Medical Safety Notice Banner */}
      <MedicalDisclaimer t={t} />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {activeTab === 'overview' && (
          <OverviewTab
            patient={activePatient}
            records={records}
            t={t}
            setActiveTab={setActiveTab}
            onSelectRecord={(rec) => setSelectedRecordForDetail(rec)}
            onQuickUpload={() => setActiveTab('upload')}
            onQuickSample={() => setActiveTab('upload')}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineTab
            records={records}
            patient={activePatient}
            t={t}
            language={language}
            onSelectRecord={(rec) => setSelectedRecordForDetail(rec)}
            onEditRecord={(rec) => setSelectedRecordForEdit(rec)}
            onDeleteRecord={handleRecordDeleted}
            onExportFhir={(recordId) => {
              window.open(api.getRecordFhirExportUrl(recordId), '_blank');
            }}
          />
        )}

        {activeTab === 'upload' && (
          <UploadWizardTab
            patient={activePatient}
            t={t}
            language={language}
            samples={samples}
            onRecordSaved={handleRecordSaved}
            onCancel={() => setActiveTab('overview')}
          />
        )}

        {activeTab === 'medicines' && (
          <MedicinesTab
            records={records}
            patient={activePatient}
            t={t}
            onSelectRecord={(rec) => {
              const fullRec = records.find(r => r.id === rec.id);
              if (fullRec) setSelectedRecordForDetail(fullRec);
            }}
          />
        )}

        {activeTab === 'labTrends' && (
          <LabTrendsTab
            records={records}
            t={t}
            onSelectRecord={(rec) => {
              const fullRec = records.find(r => r.id === rec.id);
              if (fullRec) setSelectedRecordForDetail(fullRec);
            }}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileSettingsTab
            patient={activePatient}
            config={config}
            t={t}
            language={language}
            setLanguage={setLanguage}
            onUpdatePatient={(updated) => {
              setActivePatient(updated);
              setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
            }}
            onResetDemo={handleResetDemo}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">
            Personal Health Copilot • Educational Health Record Intelligence
          </p>
          <p className="text-[11px] text-slate-400">
            {t.prototypeNotice}
          </p>
        </div>
      </footer>

      {/* Record Detail Modal */}
      {selectedRecordForDetail && (
        <RecordDetailModal
          record={selectedRecordForDetail}
          onClose={() => setSelectedRecordForDetail(null)}
          onEdit={(rec) => {
            setSelectedRecordForDetail(null);
            setSelectedRecordForEdit(rec);
          }}
          onDelete={(id) => handleRecordDeleted(id)}
          t={t}
        />
      )}

      {/* Edit Record Modal */}
      {selectedRecordForEdit && (
        <EditRecordModal
          record={selectedRecordForEdit}
          onClose={() => setSelectedRecordForEdit(null)}
          onSave={handleRecordUpdated}
          t={t}
        />
      )}

      {/* Create New Patient Modal */}
      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onPatientCreated={handlePatientCreated}
      />

    </div>
  );
}