import React from 'react';
import {
  Activity,
  Check,
  Printer,
  Shield,
  TrendingUp,
  Calendar,
  ChevronRight,
  Heart,
  User,
  Droplets,
  Wind,
  Dumbbell,
  AlertTriangle
} from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────────────────────

const cholLabel = (v) =>
  v === '1' ? 'Normal' : v === '2' ? 'Above Normal' : 'Well Above Normal';

const genderLabel = (v) => (v === '1' ? 'Male' : 'Female');

// ─── Component ────────────────────────────────────────────────────────────────

export default function DiseaseRiskScreening({
  analysisResult,
  formData,
  bmi,
  bmiCategory,
  handlePrint,
}) {
  const isHighRisk  = analysisResult.prediction === 1;
  const score       = Math.round(analysisResult.risk_score);
  const circumference = 2 * Math.PI * 40;

  const riskColor   = isHighRisk ? '#EF4444' : '#22C55E';
  const riskBg      = isHighRisk ? 'from-red-500 to-rose-600' : 'from-emerald-500 to-teal-600';

  // patient facts for summary table
  const summaryRows = [
    { label: 'Age',            val: `${formData.age} years` },
    { label: 'Gender',         val: genderLabel(formData.gender) },
    { label: 'Height',         val: `${formData.height} cm` },
    { label: 'Weight',         val: `${formData.weight} kg` },
    { label: 'BMI',            val: `${bmi} (${bmiCategory})` },
    { label: 'Blood Pressure', val: `${formData.ap_hi} / ${formData.ap_lo} mmHg` },
    { label: 'Cholesterol',    val: cholLabel(formData.cholesterol) },
    { label: 'Smoking',        val: formData.smoke === '1' ? 'Yes' : 'No' },
    { label: 'Alcohol',        val: formData.alco  === '1' ? 'Yes' : 'No' },
  ];

  // risk factor flags
  const factors = [
    { label: 'High Blood Pressure', desc: 'Increased vascular wall stress',    active: parseInt(formData.ap_hi) > 130,        icon: <Activity className="w-4 h-4" /> },
    { label: 'High Cholesterol',    desc: 'Elevated lipid concentration',       active: parseInt(formData.cholesterol) >= 2,   icon: <Droplets className="w-4 h-4" /> },
    { label: 'High BMI',            desc: 'Above healthy body-weight range',    active: bmi > 25,                              icon: <Dumbbell className="w-4 h-4" /> },
    { label: 'Age above 50',        desc: 'Natural arterial stiffening risk',   active: parseInt(formData.age) > 50,           icon: <User className="w-4 h-4" /> },
    { label: 'Active Smoker',       desc: 'Tobacco toxins damage artery walls', active: formData.smoke === '1',                icon: <Wind className="w-4 h-4" /> },
  ];

  const recommendations = [
    'Consult a cardiologist for a comprehensive cardiac review',
    'Monitor your blood pressure at least twice each week',
    'Exercise for at least 30 minutes every day (brisk walk)',
    'Reduce sodium intake — aim for under 2,000 mg per day',
    'Follow a heart-healthy diet rich in fruits and vegetables',
    'Start a smoking-cessation programme if you currently smoke',
  ];

  // comparison bar data — population average ~42 %
  const popAvg = 42;

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-800 p-4 md:p-8 space-y-8 font-sans">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Disease Risk Screening
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cardiovascular health evaluation based on patient physiological markers.
          </p>
        </div>

        {/* Accuracy badge */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm shrink-0">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Screening Accuracy</span>
            <span className="block text-xl font-black text-emerald-600">94.2%</span>
          </div>
          <TrendingUp className="w-8 h-8 text-emerald-400" />
        </div>
      </div>

      {/* ── Main 3-column grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT COLUMN ─── Prediction + Confidence + Patient Summary */}
        <div className="lg:col-span-4 space-y-6">

          {/* Prediction Result card */}
          <div
            className="relative overflow-hidden rounded-3xl p-6 text-white shadow-md flex items-center justify-between gap-4"
            style={{ background: isHighRisk ? 'linear-gradient(135deg,#EF4444,#E11D48)' : 'linear-gradient(135deg,#22C55E,#0D9488)' }}
          >
            <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(ellipse_at_top_right,white,transparent)]" />
            <div className="z-10 space-y-3">
              <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-white/20 rounded-full px-3 py-1">
                Screening Outcome
              </span>
              <h2 className="text-3xl font-black leading-tight">
                {isHighRisk ? 'High Risk' : 'Low Risk'}
              </h2>
              <p className="text-xs text-white/80 leading-relaxed max-w-[180px]">
                {isHighRisk
                  ? 'Your markers show an elevated risk of cardiovascular disease.'
                  : 'Your markers align with a low cardiovascular risk profile.'}
              </p>
              <div className="pt-1">
                <span className="block text-[10px] text-white/70 font-bold uppercase tracking-widest">Vascular Strain Score</span>
                <span className="text-3xl font-black">{score}%</span>
              </div>
            </div>
            <img
              src="/heart_illustration.png"
              alt="Heart"
              className="w-28 h-28 object-contain shrink-0 select-none"
              onError={e => { e.target.style.display = 'none'; }}
            />
          </div>

          {/* Confidence gauge */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center space-y-4">
            <h3 className="text-sm font-bold text-slate-800 w-full">Assessment Confidence</h3>
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#E2E8F0" strokeWidth="8" fill="none" />
                <circle
                  cx="50" cy="50" r="40"
                  stroke={riskColor}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - score / 100)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900">{score}%</span>
                <span className="text-[9px] font-black uppercase tracking-widest mt-0.5"
                  style={{ color: riskColor }}>
                  {isHighRisk ? 'High Confidence' : 'Low Risk Confidence'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center leading-relaxed px-2">
              The screening engine is <strong>{score}%</strong> confident in this evaluation.
            </p>
          </div>

          {/* Patient Summary */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Patient Summary</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {summaryRows.map(r => (
                <div key={r.label} className="py-2.5 flex justify-between items-center gap-2">
                  <span className="text-slate-500 font-medium">{r.label}</span>
                  <span className="text-slate-900 font-bold text-right">{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MIDDLE COLUMN ─── Risk Factors + Recommendations */}
        <div className="lg:col-span-5 space-y-6">

          {/* Key Risk Factors */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Key Risk Factors</h3>
            <div className="space-y-3">
              {factors.map((f, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                    f.active
                      ? 'bg-red-50 border-red-100'
                      : 'bg-slate-50 border-slate-100 opacity-50'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${f.active ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{f.label}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              These indicators are the primary contributors to overall cardiac stress.
            </p>
          </div>

          {/* Recommendations */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Recommendations</h3>
            <div className="space-y-2.5">
              {recommendations.map((rec, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3.5 hover:border-blue-200 transition-all">
                  <span className="p-1 bg-blue-500 rounded-lg shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </span>
                  <span className="text-xs font-semibold text-slate-700">{rec}</span>
                </div>
              ))}
            </div>
            <button className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all cursor-pointer mt-1">
              View Full Recommendations <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── RIGHT COLUMN ─── Bar Chart + Action Banner + Next Step */}
        <div className="lg:col-span-3 space-y-6">

          {/* Risk Overview bar chart */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Risk Overview</h3>

            {/* Legend */}
            <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> Your Risk</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Avg. Population</span>
            </div>

            {/* Bars */}
            <div className="flex items-end justify-around h-44 pt-2 gap-4">
              {/* Your risk */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <span className="text-sm font-black text-red-600">{score}%</span>
                <div
                  className="w-full rounded-t-xl transition-all duration-1000"
                  style={{
                    height: `${Math.max(8, Math.round(score * 1.1))}px`,
                    maxHeight: '140px',
                    background: 'linear-gradient(180deg,#EF4444,#F43F5E)',
                    boxShadow: '0 4px 12px rgba(239,68,68,0.25)'
                  }}
                />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide text-center">Your Risk</span>
              </div>
              {/* Population avg */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <span className="text-sm font-black text-blue-600">{popAvg}%</span>
                <div
                  className="w-full rounded-t-xl"
                  style={{
                    height: `${Math.max(8, Math.round(popAvg * 1.1))}px`,
                    maxHeight: '140px',
                    background: 'linear-gradient(180deg,#3B82F6,#06B6D4)',
                    boxShadow: '0 4px 12px rgba(59,130,246,0.25)'
                  }}
                />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide text-center">Avg Cohort</span>
              </div>
            </div>
          </div>

          {/* Action banner */}
          <div
            className="relative overflow-hidden text-white rounded-3xl p-5 shadow-sm space-y-4"
            style={{ background: 'linear-gradient(135deg,#2563EB,#4338CA)' }}
          >
            <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/15 rounded-xl shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-black text-sky-200">Take Control</h4>
                <p className="text-xs font-medium text-white/80 mt-0.5 leading-relaxed">
                  Small, consistent daily steps lead to a much healthier tomorrow.
                </p>
              </div>
            </div>
            <button className="w-full bg-white text-indigo-900 py-2.5 rounded-xl text-xs font-extrabold hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm">
              View Health Tips <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Next step card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-2xl shrink-0">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Next Step</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">Schedule a check-up with your doctor</p>
            </div>
          </div>

          {/* Download PDF */}
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-3.5 rounded-2xl text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer no-print"
          >
            <Printer className="w-4 h-4" />
            Download PDF Report
          </button>
        </div>
      </div>
    </div>
  );
}
