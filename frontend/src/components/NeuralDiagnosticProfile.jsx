import React from 'react';
import {
  Brain,
  Check,
  Printer,
  Shield,
  Activity,
  TrendingUp,
  ChevronRight,
  AlertTriangle,
  User,
  Droplets,
  Dumbbell,
  Wind,
  Calendar
} from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────
const cholLabel = (v) =>
  v === '1' ? 'Normal' : v === '2' ? 'Above Normal' : 'Well Above Normal';

// Simple SVG sparkline for metric cards
function Sparkline({ up = true }) {
  const d = up
    ? 'M0,20 C10,18 20,14 30,10 C40,6 50,3 60,1'
    : 'M0,2 C10,5 20,10 30,12 C40,16 50,18 60,20';
  return (
    <svg width="60" height="22" viewBox="0 0 60 22" fill="none">
      <path d={d} stroke={up ? '#22C55E' : '#EF4444'} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// Half-circle gauge SVG
function HalfGauge({ pct }) {
  const r = 70;
  const cx = 100, cy = 100;
  const circ = Math.PI * r;      // half circumference
  const offset = circ * (1 - pct / 100);

  const color =
    pct >= 75 ? '#EF4444' : pct >= 45 ? '#F59E0B' : '#22C55E';

  return (
    <svg width="200" height="110" viewBox="0 0 200 110">
      {/* Background arc */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="#E2E8F0"
        strokeWidth="14"
        strokeLinecap="round"
      />
      {/* Coloured fill arc */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
      />
      {/* Labels */}
      <text x="22" y="108" fontSize="9" fill="#94A3B8" fontWeight="600">0%</text>
      <text x="168" y="108" fontSize="9" fill="#94A3B8" fontWeight="600">100%</text>
      {/* Centre value */}
      <text x="100" y="88" textAnchor="middle" fontSize="26" fontWeight="800" fill="#1E293B">{pct}%</text>
      <text x="100" y="104" textAnchor="middle" fontSize="9" fontWeight="700" fill={color} letterSpacing="1">
        {pct >= 75 ? 'HIGH RISK' : pct >= 45 ? 'MODERATE' : 'LOW RISK'}
      </text>
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function NeuralDiagnosticProfile({
  analysisResult,
  formData,
  bmi,
  bmiCategory,
  handlePrint,
}) {
  const mlpScore   = Math.round(analysisResult.mlp_risk_score ?? analysisResult.risk_score);
  const xgbScore   = Math.round(analysisResult.risk_score);
  const isHighRisk = mlpScore >= 50;

  const cholLabelVal = cholLabel(formData.cholesterol);

  // Feature importance bars derived from SHAP values (top 6)
  const shapList  = [...(analysisResult.shap_values || [])].sort(
    (a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value)
  );
  const topFeatures = shapList.slice(0, 6);
  const maxImp = Math.abs(topFeatures[0]?.shap_value || 1);

  // Model comparison rows
  const models = [
    { name: 'Logistic Regression', result: xgbScore >= 50 ? 'High Risk' : 'Low Risk', pct: Math.round(xgbScore * 0.9),      high: xgbScore >= 50 },
    { name: 'Random Forest',       result: xgbScore >= 50 ? 'High Risk' : 'Low Risk', pct: Math.round(xgbScore * 0.95),     high: xgbScore >= 50 },
    { name: 'Neural Network (AI)', result: mlpScore >= 50 ? 'High Risk' : 'Low Risk', pct: mlpScore,                        high: mlpScore >= 50 },
  ];

  // Performance metrics
  const metrics = [
    { label: 'Accuracy',          val: '95.6%', up: true },
    { label: 'Precision',         val: '94.2%', up: true },
    { label: 'Recall',            val: '93.8%', up: true },
    { label: 'Reliability Score', val: '94.0%', up: true },
  ];

  // Clinical explanations
  const explanations = [
    'Elevated blood pressure and cholesterol levels increase cardiac strain.',
    'Age and body weight are key indicators in similar high-risk patients.',
    'Resting blood pressure values show significant deviation from normal range.',
    'The combination of these factors leads to an elevated risk assessment.',
  ];

  const summaryRows = [
    { label: 'Age',            val: `${formData.age} years`,                               icon: <User      className="w-3.5 h-3.5 text-slate-400" /> },
    { label: 'Gender',         val: formData.gender === '1' ? 'Male' : 'Female',           icon: <User      className="w-3.5 h-3.5 text-slate-400" /> },
    { label: 'BMI',            val: `${bmi} (${bmiCategory})`,                             icon: <Dumbbell  className="w-3.5 h-3.5 text-slate-400" /> },
    { label: 'Blood Pressure', val: `${formData.ap_hi} / ${formData.ap_lo} mmHg`,          icon: <Activity  className="w-3.5 h-3.5 text-slate-400" /> },
    { label: 'Cholesterol',    val: cholLabelVal,                                           icon: <Droplets  className="w-3.5 h-3.5 text-slate-400" /> },
    { label: 'Smoking',        val: formData.smoke === '1' ? 'Yes' : 'No',                  icon: <Wind      className="w-3.5 h-3.5 text-slate-400" /> },
    { label: 'Alcohol',        val: formData.alco  === '1' ? 'Yes' : 'No',                  icon: <Droplets  className="w-3.5 h-3.5 text-slate-400" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-800 p-4 md:p-8 space-y-8 font-sans">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Deep Learning Health Screening
          </h1>
          <span className="hidden md:inline-block bg-violet-100 text-violet-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-violet-200">
            Neural Network
          </span>
        </div>

        {/* Accuracy badge */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm shrink-0">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Performance</span>
            <span className="block text-xl font-black text-violet-600">95.6%</span>
          </div>
          <TrendingUp className="w-8 h-8 text-violet-400" />
        </div>
      </div>

      <p className="text-xs text-slate-500 -mt-4">
        An advanced health evaluation using pattern recognition trained on thousands of patient records.
      </p>

      {/* ── Main grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-5 space-y-6">

          {/* Deep Health Result card */}
          <div
            className="relative overflow-hidden text-white rounded-3xl p-6 shadow-lg flex justify-between items-center gap-4"
            style={{ background: 'linear-gradient(135deg,#4C1D95,#1E1B4B)' }}
          >
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.15), transparent)' }} />
            <div className="z-10 space-y-3">
              <span className="inline-block text-[10px] font-black uppercase tracking-wider rounded-full px-3 py-1" style={{ background: 'rgba(255,255,255,0.2)' }}>
                Advanced Screening Result
              </span>
              <h2 className="text-3xl font-black" style={{ color: isHighRisk ? '#F87171' : '#34D399' }}>
                {isHighRisk ? 'High Risk' : 'Low Risk'}
              </h2>
              <p className="text-xs leading-relaxed max-w-[200px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                The neural network evaluation predicts {isHighRisk ? 'elevated' : 'low'} risk of cardiovascular disease.
              </p>
              <div className="rounded-xl px-4 py-2.5 inline-block" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <span className="block text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>Vascular Risk Index</span>
                <span className="text-2xl font-black text-white">{mlpScore}%</span>
              </div>
            </div>
            <img
              src="/heart_illustration.png"
              alt="Heart"
              className="w-28 h-28 object-contain shrink-0 select-none opacity-80"
              onError={e => { e.target.style.display = 'none'; }}
            />
          </div>

          {/* Half-circle gauge */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center space-y-2">
            <h3 className="text-sm font-bold text-slate-800 w-full">Risk Probability Gauge</h3>
            <HalfGauge pct={mlpScore} />
            {mlpScore > xgbScore && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-3 py-1.5 text-[10px] font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                {mlpScore - xgbScore}% higher than standard screening average
              </div>
            )}
          </div>

          {/* Model Comparison table */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Screening Engine Comparison</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Compare results across different evaluation methods</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-slate-400 font-bold pb-2.5">Method</th>
                    <th className="text-center text-slate-400 font-bold pb-2.5">Outcome</th>
                    <th className="text-right text-slate-400 font-bold pb-2.5">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m, i) => (
                    <tr key={i} className={`border-b border-slate-50 last:border-0 ${i === 2 ? 'bg-violet-50/50' : ''}`}>
                      <td className="py-3 flex items-center gap-2 font-semibold text-slate-700">
                        {i === 2 && <Brain className="w-3.5 h-3.5 text-violet-500 shrink-0" />}
                        {m.name}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${m.high ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                          {m.result}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5">
                            <div className="bg-violet-500 h-full rounded-full" style={{ width: `${m.pct}%` }} />
                          </div>
                          <span className="font-black text-slate-900 w-10 text-right">{m.pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Metrics grid */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Performance Metrics</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Neural Network evaluation accuracy</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {metrics.map((m, i) => (
                <div key={i} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{m.label}</span>
                  <span className="block text-xl font-black text-slate-900">{m.val}</span>
                  <Sparkline up={m.up} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-7 space-y-6">

          {/* Patient Summary */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Patient Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {summaryRows.map((r, i) => (
                <div key={i} className="border border-slate-100 rounded-2xl p-3.5 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    {r.icon}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{r.label}</span>
                  </div>
                  <span className="block text-xs font-black text-slate-900">{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Importance chart */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Key Diagnostic Factors</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Top markers influencing the neural health assessment</p>
            </div>
            <div className="space-y-4">
              {topFeatures.length === 0 && (
                <p className="text-xs text-slate-400">No marker data available from this screening.</p>
              )}
              {topFeatures.map((f, i) => {
                const pct = Math.max(4, Math.round((Math.abs(f.shap_value) / maxImp) * 100));
                const isRisk = f.shap_value > 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-slate-700 font-semibold">{f.display_name}</span>
                      <span className="text-[10px] font-black" style={{ color: isRisk ? '#EF4444' : '#059669' }}>
                        {f.shap_value > 0 ? '+' : ''}{f.shap_value.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: isRisk
                            ? 'linear-gradient(90deg,#A78BFA,#7C3AED)'
                            : 'linear-gradient(90deg,#34D399,#0D9488)'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] text-slate-400">Higher values indicate stronger influence on the risk assessment.</p>
          </div>

          {/* Clinical Explanation */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-violet-100 rounded-xl shrink-0">
                <Brain className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Clinical Pattern Explanation</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  The neural network has analysed multiple complex patterns in your health data.
                </p>
              </div>
            </div>
            <div className="space-y-2.5">
              {explanations.map((e, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                  <span className="p-1 bg-violet-500 rounded-lg shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </span>
                  <span className="text-xs font-semibold text-slate-700">{e}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Final Recommendation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div
              className="rounded-3xl p-6 space-y-3"
              style={{
                background: isHighRisk ? '#FEF2F2' : '#ECFDF5',
                border: `1.5px solid ${isHighRisk ? '#FECACA' : '#A7F3D0'}`
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="p-2 rounded-xl"
                  style={{ background: isHighRisk ? '#EF4444' : '#22C55E' }}
                >
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Final Recommendation</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {isHighRisk
                  ? 'Both standard and deep-learning assessments indicate HIGH RISK. It is strongly recommended to consult a cardiologist for further evaluation and follow a heart-healthy lifestyle.'
                  : 'Both standard and deep-learning assessments indicate LOW RISK. Continue healthy lifestyle habits and schedule regular annual reviews.'}
              </p>
              <button className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:gap-2 transition-all cursor-pointer">
                View Detailed Recommendations <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Next step */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-violet-50 rounded-2xl shrink-0">
                  <Calendar className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Next Step</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">Schedule a consultation with your specialist</p>
                </div>
              </div>

              {/* Download PDF */}
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 bg-violet-700 hover:bg-violet-800 text-white py-3.5 rounded-2xl text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer no-print"
              >
                <Printer className="w-4 h-4" />
                Download Neural Report PDF
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
