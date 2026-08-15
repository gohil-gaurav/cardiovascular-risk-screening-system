import React, { useState, useEffect } from 'react';
import {
  Activity,
  Check,
  Shield,
  Heart,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Brain,
  Users,
  Info,
  Clock,
  Printer
} from 'lucide-react';
import NeuralDiagnosticProfile from './NeuralDiagnosticProfile';
import PatientSimilarityCohorts from './PatientSimilarityCohorts';

const genderLabel = (v) => (v === '1' ? 'Male' : 'Female');
const cholLabel = (v) =>
  v === '1' ? 'Normal' : v === '2' ? 'Above Normal' : 'Well Above Normal';

// Runtime consistency validation helper
const validateRiskTier = (renderedTier, expectedTier, fieldName) => {
  if (import.meta.env.DEV) {
    const validTiers = ["Low Risk", "Moderate Risk", "High Risk"];
    if (validTiers.includes(renderedTier) && renderedTier !== expectedTier) {
      console.warn(
        `[NovusAI Consistency Warning]: Component rendered risk tier label "${renderedTier}" ` +
        `which does not match the source-of-truth risk_tier "${expectedTier}". ` +
        `It was bound to or derived from "${fieldName}" instead of the API risk_tier.`
      );
    }
  }
};

export default function DiseaseRiskScreening({
  analysisResult,
  formData,
  bmi,
  bmiCategory,
  handlePrint,
}) {
  const [showDoctorView, setShowDoctorView] = useState(false);
  const [clinicianTab, setClinicianTab] = useState('similarity'); // 'similarity' | 'neural'

  // Safety fallbacks for /api/screen endpoint properties
  const riskTier = analysisResult.risk_tier || "Low Risk";
  const finalRiskPct = Math.round(analysisResult.final_risk_pct ?? analysisResult.risk_score ?? 0);
  const patientSummary = analysisResult.patient_summary || "Screening completed. Review details below.";
  const keyFactors = analysisResult.key_factors || [];
  const suggestedNextStep = analysisResult.suggested_next_step || "Consult with your healthcare practitioner.";
  const fallbackUsed = analysisResult.fallback_used ?? false;
  const populationTier = analysisResult.population_comparison_tier || "Low Risk";

  // Runtime consistency check for primary risk tier
  useEffect(() => {
    validateRiskTier(riskTier, analysisResult.risk_tier, "risk_tier");
  }, [riskTier, analysisResult.risk_tier]);

  // Tier-specific styles
  const isHigh = riskTier === "High Risk";
  const isMod = riskTier === "Moderate Risk";

  let tierBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let tierGradient = "from-emerald-500 to-teal-600";
  let riskTextColor = "text-emerald-600";
  
  if (isHigh) {
    tierBadgeColor = "bg-rose-50 text-rose-700 border-rose-200";
    tierGradient = "from-rose-500 to-red-600";
    riskTextColor = "text-rose-600";
  } else if (isMod) {
    tierBadgeColor = "bg-amber-50 text-amber-700 border-amber-200";
    tierGradient = "from-amber-500 to-orange-600";
    riskTextColor = "text-amber-600";
  }

  // Soft gauge parameters
  const strokeRadius = 40;
  const strokeCircumference = 2 * Math.PI * strokeRadius;
  const strokeOffset = strokeCircumference * (1 - finalRiskPct / 100);

  return (
    <div className="space-y-8 font-sans selection:bg-[#D2E2F0]">
      
      {/* ─── 1. PATIENT SCREENING REPORT CARD ─── */}
      <div className="bg-white rounded-3xl border border-[#DDE4EE] shadow-[0_4px_20px_rgba(26,36,64,0.05)] overflow-hidden">
        
        {/* Soft Top Gradient Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-[#3B7CF4] to-[#6355F5]" />
        
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-[#EDF0F7]">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EEF3FF] text-[#1B2B6B] border border-[#C7D7F8]">
                <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                NovusAI Report Summary
              </span>
              <h2 className="text-xl md:text-2xl font-black text-[#1A2440] tracking-tight">
                Cardiovascular Screening Summary
              </h2>
            </div>
            
            <div className="flex items-center gap-3 bg-[#F3F6FA] border border-[#D8E1ED] px-4 py-2 rounded-2xl">
              <div className="text-left">
                <span className="block text-[9px] font-black text-[#9DAABB] uppercase tracking-wider">Patient Name</span>
                <span className="block text-sm font-bold text-[#1A2440]">{formData.name}</span>
              </div>
            </div>
          </div>

          {/* Core Risk Grid (Soft Gauge + Badges + Patient Summary) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Soft Gauge & Badge */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center space-y-4 py-4 bg-[#F8FAFD] rounded-3xl border border-[#EDF2FA]">
              
              <span className="text-[11px] font-black text-[#637082] uppercase tracking-widest">Calculated Risk Index</span>
              
              {/* Soft Gauge SVG */}
              <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r={strokeRadius} 
                    stroke="#E6EFFC" strokeWidth="8" fill="none" 
                  />
                  <circle
                    cx="50" cy="50" r={strokeRadius}
                    stroke={`url(#riskGradient-${finalRiskPct})`}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={strokeCircumference}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id={`riskGradient-${finalRiskPct}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B7CF4" />
                      <stop offset="100%" stopColor="#6355F5" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-[#1A2440]">{finalRiskPct}%</span>
                  <span className="text-[10px] font-extrabold text-[#637082] uppercase tracking-wider mt-0.5">
                    Consensus
                  </span>
                </div>
              </div>

              {/* Dynamic Large Risk Badge */}
              <div className={`px-5 py-2 rounded-full border text-sm font-black tracking-wide ${tierBadgeColor}`}>
                {riskTier}
              </div>

            </div>

            {/* Right: Summary narrative, Factors and Next Step */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Patient Summary Card */}
              <div className="bg-[#FAFBFD] border border-[#E6EEF8] rounded-2xl p-5 space-y-3 relative">
                {fallbackUsed && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] rounded-xl font-bold">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Showing a standard summary — detailed AI explanation temporarily unavailable</span>
                  </div>
                )}
                <h4 className="text-xs font-black text-[#1B2B6B] uppercase tracking-widest flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-[#3B7CF4]" />
                  Heart Health Assessment Summary
                </h4>
                <p className="text-sm text-[#4A5F73] leading-relaxed font-semibold">
                  {patientSummary}
                </p>
              </div>

              {/* Key Factors Chips */}
              {keyFactors.length > 0 && (
                <div className="space-y-2">
                  <span className="block text-[10px] font-black text-[#9DAABB] uppercase tracking-widest">Key Risk Indicators</span>
                  <div className="flex flex-wrap gap-2">
                    {keyFactors.map((factor, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EBF1F6] text-[#2C3B4E] border border-[#D2E2F0] hover:scale-[1.02] transition-all"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3B7CF4]" />
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Next Step callout */}
              <div className="bg-[#EEF3FF] border border-[#C7D7F8] rounded-2xl p-5 flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl shrink-0 border border-[#C7D7F8] text-[#3B7CF4]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="block text-[9px] font-black text-[#1B2B6B] uppercase tracking-widest">Suggested Next Step</span>
                  <p className="text-xs font-bold text-[#1A2440] leading-relaxed">{suggestedNextStep}</p>
                </div>
              </div>

            </div>

          </div>

          {/* Disclaimer line */}
          <div className="flex items-center justify-between pt-4 border-t border-[#EDF0F7] text-[11px] text-[#637082] font-semibold">
            <span className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#9DAABB]" />
              This is a screening result, not a medical diagnosis. Please consult your doctor for medical advice.
            </span>
            <button 
              onClick={handlePrint}
              className="text-xs text-[#3B7CF4] font-bold hover:underline cursor-pointer flex items-center gap-1.5 no-print"
            >
              <Printer className="w-4 h-4" /> Print Report
            </button>
          </div>

        </div>

      </div>

      {/* ─── 2. CLINICIAN TECHNICAL DETAILS TOGGLE ─── */}
      <div className="no-print flex flex-col items-center">
        <button
          onClick={() => setShowDoctorView(!showDoctorView)}
          className="group flex items-center gap-2 px-6 py-3 rounded-2xl border font-bold text-xs transition-all shadow-sm active:scale-98 cursor-pointer"
          style={{
            background: showDoctorView ? '#102A43' : '#FFFFFF',
            color: showDoctorView ? '#FFFFFF' : '#102A43',
            borderColor: showDoctorView ? '#102A43' : '#DDE4EE',
          }}
        >
          <span>{showDoctorView ? 'Hide Technical Details' : 'View Technical Details (Clinician View)'}</span>
          {showDoctorView ? (
            <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
          ) : (
            <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
          )}
        </button>
      </div>

      {/* ─── 3. DOCTOR'S CLINICAL DETAILS SECTION ─── */}
      {showDoctorView && (
        <div className="bg-[#FAFBFD] border border-[#DDE4EE] rounded-3xl p-6 md:p-8 space-y-8 animate-fade-in no-print">
          
          {/* Clinician Banner */}
          <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#E2E8F0] text-slate-700">
                Clinician Portal
              </span>
              <h3 className="text-base font-extrabold text-slate-800">
                Population & Feature Diagnostics
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Analysis compared against broader diagnostic populations (Unsupervised KMeans Clustering).
              </p>
            </div>
            
            {/* Population comparison card */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 shadow-xs flex items-center gap-3 shrink-0 relative group">
              <div className="p-2 bg-[#E0F2FE] rounded-lg text-[#0369A1]">
                <Users className="w-5 h-5" />
              </div>
              <div className="relative">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  Population Comparison
                  <Info className="w-3 h-3 text-[#9DAABB] cursor-help" />
                </span>
                <span className="block text-sm font-bold text-slate-800">{riskTier}</span>
              </div>
              
              {/* Floating Tooltip */}
              <div className="absolute bottom-full mb-2 right-0 hidden group-hover:flex flex-col bg-slate-800 text-white text-[10px] p-2.5 rounded-lg shadow-lg w-56 z-50 leading-relaxed transition-all">
                This compares the patient to broader population groups and may differ from the overall risk result.
              </div>
            </div>
          </div>

          {/* Clinician Sub-tab selector */}
          <div className="border-b border-[#EDF0F7] flex gap-6">
            <button 
              onClick={() => setClinicianTab('similarity')}
              className={`pb-3 font-bold text-xs tracking-wide uppercase border-b-2 cursor-pointer transition-all ${
                clinicianTab === 'similarity' 
                  ? 'border-[#3B7CF4] text-[#3B7CF4]' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Matched Similarity Cohorts
            </button>
            <button 
              onClick={() => setClinicianTab('neural')}
              className={`pb-3 font-bold text-xs tracking-wide uppercase border-b-2 cursor-pointer transition-all ${
                clinicianTab === 'neural' 
                  ? 'border-[#3B7CF4] text-[#3B7CF4]' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Neural Diagnostic Profile
            </button>
          </div>

          {/* Render embedded components */}
          <div className="rounded-2xl overflow-hidden border border-[#EBEFF5] bg-white">
            {clinicianTab === 'similarity' ? (
              <PatientSimilarityCohorts 
                analysisResult={analysisResult} 
                formData={formData} 
                bmi={bmi}
                isEmbedded={true}
              />
            ) : (
              <NeuralDiagnosticProfile 
                analysisResult={analysisResult} 
                formData={formData} 
                bmi={bmi} 
                bmiCategory={bmiCategory} 
                handlePrint={handlePrint}
                isEmbedded={true}
                riskTier={riskTier}
              />
            )}
          </div>

        </div>
      )}

    </div>
  );
}
