import React, { useState, useEffect } from 'react';
import {
  FileText,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Edit3,
  X,
  ShieldAlert,
  ArrowLeft,
  Activity,
  Heart,
  Trash2
} from 'lucide-react';
import { fetchRecords, updateRecord, deleteRecord, deleteRecordsBulk } from '../api/recordsApi';

export default function PatientRecords({ onBackToHome }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filter & Pagination state
  const [filterTab, setFilterTab] = useState('unconfirmed'); // 'unconfirmed' | 'all' | 'confirmed'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Selected record modal state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Multi-select state for bulk delete
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Load records
  const loadData = async (targetPage = page, tab = filterTab) => {
    setLoading(true);
    setError(null);
    let confirmedParam = null;
    if (tab === 'unconfirmed') confirmedParam = false;
    if (tab === 'confirmed') confirmedParam = true;

    const res = await fetchRecords({ page: targetPage, limit: 15, confirmed: confirmedParam });
    if (res.success && res.data) {
      setRecords(res.data.records || []);
      setTotalPages(res.data.pages || 1);
      setTotalRecords(res.data.total || 0);
    } else {
      setError(res.error || 'Failed to load patient records.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData(1, filterTab);
    setPage(1);
    setSelectedIds(new Set()); // clear selection when tab changes
  }, [filterTab]);


  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      loadData(newPage, filterTab);
      setSelectedIds(new Set()); // clear selection on page change
    }
  };

  const handleOpenDetail = (rec) => {
    setSelectedRecord(rec);
    setEditForm({
      age: rec.age,
      gender: rec.gender,
      height: rec.height,
      weight: rec.weight,
      ap_hi: rec.ap_hi,
      ap_lo: rec.ap_lo,
      cholesterol: rec.cholesterol,
      gluc: rec.gluc,
      smoke: rec.smoke,
      alco: rec.alco,
      active: rec.active,
      doctor_confirmed_label: rec.doctor_confirmed_label || '',
    });
  };

  const handleCloseModal = () => {
    setSelectedRecord(null);
    setEditForm(null);
  };

  const handleFormChange = (field, val) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleConfirmOutcome = (label) => {
    setEditForm((prev) => ({
      ...prev,
      doctor_confirmed_label: label,
    }));
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!selectedRecord || !editForm) return;

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      age: parseFloat(editForm.age),
      gender: parseInt(editForm.gender, 10),
      height: parseFloat(editForm.height),
      weight: parseFloat(editForm.weight),
      ap_hi: parseInt(editForm.ap_hi, 10),
      ap_lo: parseInt(editForm.ap_lo, 10),
      cholesterol: parseInt(editForm.cholesterol, 10),
      gluc: parseInt(editForm.gluc, 10),
      smoke: parseInt(editForm.smoke, 10),
      alco: parseInt(editForm.alco, 10),
      active: parseInt(editForm.active, 10),
      doctor_confirmed_label: editForm.doctor_confirmed_label || null,
    };

    const res = await updateRecord(selectedRecord.id, payload);
    setSaving(false);

    if (res.success && res.data) {
      setSuccessMsg(`Screening Record #${selectedRecord.id} updated successfully!`);
      const updatedRecord = res.data.record;
      setSelectedRecord(updatedRecord);
      // Refresh list
      loadData(page, filterTab);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setError(res.error || 'Failed to save record changes.');
    }
  };

  const handleDeleteRecord = async (recordId) => {
    const confirmed = window.confirm(
      `⚠️ Permanently delete Screening Record #${recordId}?\n\nThis action cannot be undone. The patient data will be removed from the database.`
    );
    if (!confirmed) return;

    setError(null);
    setSuccessMsg(null);
    const res = await deleteRecord(recordId);

    if (res.success) {
      setSuccessMsg(`Screening Record #${recordId} deleted successfully.`);
      handleCloseModal();
      loadData(page, filterTab);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setError(res.error || 'Failed to delete record.');
    }
  };

  // Multi-select helpers
  const allPageIds = records.map((r) => r.id);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const someSelected = allPageIds.some((id) => selectedIds.has(id)) && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allPageIds));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const confirmed = window.confirm(
      `⚠️ Permanently delete ${ids.length} selected screening record(s)?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setBulkDeleting(true);
    setError(null);
    setSuccessMsg(null);
    const res = await deleteRecordsBulk(ids);
    setBulkDeleting(false);

    if (res.success) {
      setSuccessMsg(`${res.data.deleted_count} record(s) deleted successfully.`);
      setSelectedIds(new Set());
      loadData(page, filterTab);
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setError(res.error || 'Bulk delete failed.');
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#EBF1F6] text-[#102A43] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header / Navigation */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#D2E2F0] shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl bg-[#EBF1F6] hover:bg-[#D2E2F0] text-[#102A43] transition-colors cursor-pointer"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-[#2563EB]" />
                <h1 className="text-2xl font-bold tracking-tight text-[#102A43]">
                  Patient Screening Records
                </h1>
              </div>
              <p className="text-sm text-[#556980] mt-0.5">
                Clinician Portal — Review Screening History, Confirm Outcomes & Correct Intake Metrics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData(page, filterTab)}
              disabled={loading}
              className="flex items-center gap-2 bg-[#EBF1F6] hover:bg-[#D2E2F0] text-[#102A43] text-sm font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-[#D2E2F0]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Clinician-Only Portal:</span> This view contains Protected Health Information (PHI). Outcomes confirmed here directly populate the dataset for future automated model retraining.
          </div>
        </div>

        {/* Global Feedback Banners */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl border border-[#D2E2F0] shadow-sm overflow-hidden">
          
          {/* Filter Bar */}
          <div className="p-4 border-b border-[#D2E2F0] bg-[#FAFCFF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#556980]" />
              <span className="text-sm font-semibold text-[#556980]">Filter View:</span>
              <div className="flex items-center bg-[#EBF1F6] p-1 rounded-xl border border-[#D2E2F0] text-xs font-semibold">
                <button
                  onClick={() => setFilterTab('unconfirmed')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterTab === 'unconfirmed'
                      ? 'bg-white text-[#2563EB] shadow-sm font-bold'
                      : 'text-[#556980] hover:text-[#102A43]'
                  }`}
                >
                  Needs Review (Unconfirmed)
                </button>
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterTab === 'all'
                      ? 'bg-white text-[#2563EB] shadow-sm font-bold'
                      : 'text-[#556980] hover:text-[#102A43]'
                  }`}
                >
                  All Records
                </button>
                <button
                  onClick={() => setFilterTab('confirmed')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterTab === 'confirmed'
                      ? 'bg-white text-[#2563EB] shadow-sm font-bold'
                      : 'text-[#556980] hover:text-[#102A43]'
                  }`}
                >
                  Confirmed
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Bulk Delete Action — appears only when rows are selected */}
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-60 shadow-sm animate-fade-in"
                >
                  {bulkDeleting
                    ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                  Delete Selected ({selectedIds.size})
                </button>
              )}
              <div className="text-xs font-medium text-[#556980]">
                Showing {records.length} of {totalRecords} total screenings
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#EBF1F6] border-b border-[#D2E2F0] text-[#556980] font-semibold text-xs uppercase tracking-wider">
                  {/* Select-All Checkbox */}
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-[#CBD5E1] accent-[#2563EB] cursor-pointer"
                      title={allSelected ? 'Deselect all' : 'Select all on this page'}
                    />
                  </th>
                  <th className="py-3.5 px-4">Record ID</th>
                  <th className="py-3.5 px-4">Screening Date</th>
                  <th className="py-3.5 px-4">Patient Summary</th>
                  <th className="py-3.5 px-4">Blood Pressure</th>
                  <th className="py-3.5 px-4">Chol / Gluc</th>
                  <th className="py-3.5 px-4">Predicted Risk</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2E2F0]">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-[#556980]">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#2563EB]" />
                        <span>Loading patient screening records...</span>
                      </div>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-[#556980]">
                      No patient records found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => {
                    const isConfirmed = !!rec.doctor_confirmed_label;
                    const isDisease = rec.doctor_confirmed_label === 'Disease';
                    const isRowSelected = selectedIds.has(rec.id);

                    return (
                      <tr
                        key={rec.id}
                        className={`transition-colors group cursor-pointer ${
                          isRowSelected
                            ? 'bg-blue-50 border-l-2 border-l-[#2563EB]'
                            : 'hover:bg-[#F4F8FC]'
                        }`}
                        onClick={() => handleOpenDetail(rec)}
                      >
                        {/* Row checkbox */}
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isRowSelected}
                            onChange={() => toggleSelectRow(rec.id)}
                            className="w-4 h-4 rounded border-[#CBD5E1] accent-[#2563EB] cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#102A43]">
                          #{rec.id}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#556980] whitespace-nowrap">
                          {formatDate(rec.created_at)}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#102A43]">
                          {rec.age} yrs • {rec.gender === 1 ? 'Male' : 'Female'} • BMI {rec.bmi}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-[#102A43]">
                          {rec.ap_hi} / {rec.ap_lo} mmHg
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#556980]">
                          Lvl {rec.cholesterol} / Lvl {rec.gluc}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold text-[#102A43]">
                            {rec.predicted_risk_score ? `${rec.predicted_risk_score.toFixed(1)}%` : 'N/A'}
                          </span>
                          <span className="ml-1.5 text-xs px-2 py-0.5 rounded-full bg-[#EBF1F6] text-[#556980]">
                            {String(rec.predicted_label) === '1' || rec.predicted_label === 1 || rec.predicted_label === 'Disease' ? 'Disease' : 'No Disease'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {!isConfirmed ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Needs Review
                            </span>
                          ) : isDisease ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              <UserCheck className="w-3.5 h-3.5" />
                              Confirmed: Disease
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Confirmed: No Disease
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(rec);
                            }}
                            className="inline-flex items-center gap-1 bg-[#102A43] hover:bg-[#071624] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Review / Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-[#D2E2F0] bg-[#FAFCFF] flex items-center justify-between">
            <span className="text-xs font-medium text-[#556980]">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || loading}
                className="p-2 rounded-lg bg-[#EBF1F6] hover:bg-[#D2E2F0] disabled:opacity-50 text-[#102A43] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages || loading}
                className="p-2 rounded-lg bg-[#EBF1F6] hover:bg-[#D2E2F0] disabled:opacity-50 text-[#102A43] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Record Detail & Edit Modal */}
      {selectedRecord && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#102A43]/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#D2E2F0] shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#D2E2F0] flex items-center justify-between bg-[#FAFCFF]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EBF1F6] border border-[#D2E2F0] flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#102A43]">
                    Screening Record #{selectedRecord.id}
                  </h2>
                  <p className="text-xs text-[#556980]">
                    Screened on {formatDate(selectedRecord.created_at)} • Model Version: {selectedRecord.model_version || 'v1'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-[#556980] hover:text-[#102A43] rounded-lg hover:bg-[#EBF1F6] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveChanges} className="p-6 space-y-6 flex-1">
              
              {/* Section 1: Original Model Output (Read Only) */}
              <div className="bg-[#EBF1F6] p-4 rounded-xl border border-[#D2E2F0] space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#556980]">
                  Original Prediction Output (Read-Only)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm pt-1">
                  <div>
                    <span className="text-xs text-[#556980] block">Predicted Risk Score</span>
                    <span className="font-bold text-lg text-[#102A43]">
                      {selectedRecord.predicted_risk_score ? `${selectedRecord.predicted_risk_score.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#556980] block">Predicted Classification</span>
                    <span className="font-bold text-base text-[#102A43]">
                      {String(selectedRecord.predicted_label) === '1' || selectedRecord.predicted_label === 1 || selectedRecord.predicted_label === 'Disease' ? 'Disease' : 'No Disease'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#556980] block">Current Model Version</span>
                    <span className="font-mono text-sm text-[#102A43]">
                      {selectedRecord.model_version || 'v1'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Clinician Diagnosis Outcome Confirmation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-[#102A43] flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#2563EB]" />
                    Doctor-Confirmed Diagnosis Outcome
                  </label>
                  {selectedRecord.confirmed_at && (
                    <span className="text-xs text-[#556980]">
                      Confirmed on {formatDate(selectedRecord.confirmed_at)}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleConfirmOutcome('Disease')}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      editForm.doctor_confirmed_label === 'Disease'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    Confirm Disease
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConfirmOutcome('No Disease')}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      editForm.doctor_confirmed_label === 'No Disease'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirm No Disease
                  </button>
                </div>
              </div>

              {/* Section 3: Patient Intake Data Corrections */}
              <div className="space-y-4 pt-2 border-t border-[#D2E2F0]">
                <div className="text-sm font-bold text-[#102A43] flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#2563EB]" />
                  Correct Patient Intake Metrics
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-medium">
                  
                  {/* Age */}
                  <div>
                    <label className="block text-[#556980] mb-1">Age (Years)</label>
                    <input
                      type="number"
                      value={editForm.age}
                      onChange={(e) => handleFormChange('age', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#D2E2F0] text-sm focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-[#556980] mb-1">Biological Sex</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => handleFormChange('gender', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#D2E2F0] text-sm focus:outline-none focus:border-[#2563EB] bg-white"
                    >
                      <option value={1}>Male (1)</option>
                      <option value={2}>Female (2)</option>
                    </select>
                  </div>

                  {/* Height */}
                  <div>
                    <label className="block text-[#556980] mb-1">Height (cm)</label>
                    <input
                      type="number"
                      value={editForm.height}
                      onChange={(e) => handleFormChange('height', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#D2E2F0] text-sm focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-[#556980] mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={editForm.weight}
                      onChange={(e) => handleFormChange('weight', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#D2E2F0] text-sm focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  {/* Systolic BP */}
                  <div>
                    <label className="block text-[#556980] mb-1">Systolic BP (ap_hi)</label>
                    <input
                      type="number"
                      value={editForm.ap_hi}
                      onChange={(e) => handleFormChange('ap_hi', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#D2E2F0] text-sm focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  {/* Diastolic BP */}
                  <div>
                    <label className="block text-[#556980] mb-1">Diastolic BP (ap_lo)</label>
                    <input
                      type="number"
                      value={editForm.ap_lo}
                      onChange={(e) => handleFormChange('ap_lo', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#D2E2F0] text-sm focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  {/* Cholesterol */}
                  <div>
                    <label className="block text-[#556980] mb-1">Cholesterol Level</label>
                    <select
                      value={editForm.cholesterol}
                      onChange={(e) => handleFormChange('cholesterol', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#D2E2F0] text-sm focus:outline-none focus:border-[#2563EB] bg-white"
                    >
                      <option value={1}>Normal (1)</option>
                      <option value={2}>Above Normal (2)</option>
                      <option value={3}>Well Above Normal (3)</option>
                    </select>
                  </div>

                  {/* Glucose */}
                  <div>
                    <label className="block text-[#556980] mb-1">Glucose Level</label>
                    <select
                      value={editForm.gluc}
                      onChange={(e) => handleFormChange('gluc', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#D2E2F0] text-sm focus:outline-none focus:border-[#2563EB] bg-white"
                    >
                      <option value={1}>Normal (1)</option>
                      <option value={2}>Above Normal (2)</option>
                      <option value={3}>Well Above Normal (3)</option>
                    </select>
                  </div>

                  {/* Smoking */}
                  <div>
                    <label className="block text-[#556980] mb-1">Smoking Habit</label>
                    <select
                      value={editForm.smoke}
                      onChange={(e) => handleFormChange('smoke', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#D2E2F0] text-sm focus:outline-none focus:border-[#2563EB] bg-white"
                    >
                      <option value={0}>No (0)</option>
                      <option value={1}>Yes (1)</option>
                    </select>
                  </div>

                  {/* Alcohol */}
                  <div>
                    <label className="block text-[#556980] mb-1">Alcohol Intake</label>
                    <select
                      value={editForm.alco}
                      onChange={(e) => handleFormChange('alco', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#D2E2F0] text-sm focus:outline-none focus:border-[#2563EB] bg-white"
                    >
                      <option value={0}>No (0)</option>
                      <option value={1}>Yes (1)</option>
                    </select>
                  </div>

                  {/* Active */}
                  <div>
                    <label className="block text-[#556980] mb-1">Physically Active</label>
                    <select
                      value={editForm.active}
                      onChange={(e) => handleFormChange('active', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#D2E2F0] text-sm focus:outline-none focus:border-[#2563EB] bg-white"
                    >
                      <option value={0}>No (0)</option>
                      <option value={1}>Yes (1)</option>
                    </select>
                  </div>

                </div>

                <div className="text-xs text-[#556980] italic pt-1">
                  Note: Updating Height or Weight automatically recomputes BMI. Original predicted risk scores remain unchanged to ensure audit trail integrity.
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-[#D2E2F0] flex items-center justify-between gap-3">
                {/* Delete button on the left */}
                <button
                  type="button"
                  onClick={() => handleDeleteRecord(selectedRecord.id)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 hover:border-rose-300 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Record
                </button>

                {/* Cancel + Save on the right */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2.5 rounded-xl border border-[#D2E2F0] text-sm font-semibold text-[#556980] hover:bg-[#EBF1F6] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-[#102A43] hover:bg-[#071624] text-white text-sm font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                    Save Record Changes
                  </button>
                </div>
              </div>


            </form>
          </div>
        </div>
      )}

    </div>
  );
}
