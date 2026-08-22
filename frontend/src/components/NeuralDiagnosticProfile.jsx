import React, { useEffect } from 'react';
import {
  Brain,
  Check,
  Printer,
  Shield,
  Activity,
  TrendingUp,
  User,
  Droplets,
  Dumbbell,
  Wind,
  Calendar,
  Layers,
  Info,
  BarChart3
} from 'lucide-react';

const cholLabel = (v) =>
  v === '1' ? 'Normal' : v === '2' ? 'Above Normal' : 'Well Above Normal';

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

export default function NeuralDiagnosticProfile({
  analysisResult = {},
  formData = {},
  bmi = 0,
  bmiCategory = '',
  handlePrint,
  isEmbedded = false,
  riskTier: parentRiskTier,
  top_factors: propTopFactors,
  secondary_model_comparison: propSecondaryComparison,
}) {
  const riskTier = parentRiskTier || analysisResult.risk_tier || "Low Risk";

  useEffect(() => {
    validateRiskTier(riskTier, analysisResult.risk_tier, "risk_tier");
  }, [riskTier, analysisResult.risk_tier]);

  const isHighRisk = riskTier === "High Risk";
  const isModRisk = riskTier === "Moderate Risk";

  // Resolve top_factors (Primary XGBoost classifier SHAP factors)
  const rawTopFactors = propTopFactors || analysisResult.top_factors || [];
  
  // Format top_factors into standardized shape { feature, label, value, impact }
  const topFactors = rawTopFactors.map((tf) => {
    if (typeof tf === 'object' && tf !== null) {
      return {
        feature: tf.feature || tf.factor || 'unknown',
        label: tf.label || tf.factor || tf.feature || 'Unknown Factor',
        value: tf.value || tf.contribution || '',
        impact: (tf.impact || 'moderate').toLowerCase(),
      };
    }
    return {
      feature: String(tf),
      label: String(tf),
      value: '',
      impact: 'moderate',
    };
  });

  // Resolve secondary model comparison (PyTorch MLP)
  const secondaryModel = propSecondaryComparison || analysisResult.secondary_model_comparison || null;

  // Impact helper for primary SHAP bars
  const getImpactStyles = (impact) => {
    switch (impact) {
      case 'high':
        return {
          width: '100%',
          barBg: 'linear-gradient(90deg, #1B2B6B, #3B7CF4)',
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          label: 'High Impact',
        };
      case 'moderate':
        return {
          width: '65%',
          barBg: 'linear-gradient(90deg, #3B7CF4, #60A5FA)',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Moderate Impact',
        };
      case 'low':
      default:
        return {
          width: '35%',
          barBg: 'linear-gradient(90deg, #60A5FA, #93C5FD)',
          badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
          label: 'Low Impact',
        };
    }
  };

  const summaryRows = [
    { label: 'Age',            val: `${formData.age || '—'} years`,                     icon: <User     className="w-3.5 h-3.5 text-slate-400" /> },
    { label: 'Gender',         val: formData.gender === '1' ? 'Male' : 'Female',         icon: <User     className="w-3.5 h-3.5 text-slate-400" /> },
    { label: 'BMI',            val: `${bmi} (${bmiCategory || 'Normal'})`,               icon: <Dumbbell className="w-3.5 h-3.5 text-slate-400" /> },
    { label: 'Blood Pressure', val: `${formData.ap_hi || '—'} / ${formData.ap_lo || '—'} mmHg`, icon: <Activity className="w-3.5 h-3.5 text-slate-400" /> },
    { label: 'Cholesterol',    val: cholLabel(formData.cholesterol),                     icon: <Droplets className="w-3.5 h-3.5 text-slate-400" /> },
    { label: 'Smoking',        val: formData.smoke === '1' ? 'Yes' : 'No',                icon: <Wind     className="w-3.5 h-3.5 text-slate-400" /> },
  ];

  const content = (
    <div className="space-y-6">

      {/* ── SECTION 1: PRIMARY SHAP FACTOR BREAKDOWN ─────────────────────── */}
      <div className="bg-white border border-[#DDE4EE] rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#EEF3FF] rounded-lg text-[#3B7CF4]">
                <BarChart3 className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-extrabold text-[#1A2440]">
                Key factors from the primary risk assessment
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Direct feature attribution (SHAP) from the primary XGBoost classifier driving the official risk tier.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Primary Model
          </span>
        </div>

        {/* SHAP Factor Bars */}
        {topFactors.length === 0 ? (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500 font-medium">
            No specific factor drivers available for this screening profile.
          </div>
        ) : (
          <div className="space-y-4">
            {topFactors.map((factor, idx) => {
              const styles = getImpactStyles(factor.impact);
              return (
                <div key={idx} className="space-y-1.5 p-3 rounded-2xl bg-[#F8FAFD] border border-[#EDF2FA]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-[#1A2440]">{factor.label}</span>
                    <div className="flex items-center gap-2">
                      {factor.value && (
                        <span className="text-[11px] font-mono text-slate-600 font-semibold">{factor.value}</span>
                      )}
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${styles.badgeColor}`}>
                        {styles.label}
                      </span>
                    </div>
                  </div>
                  {/* Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: styles.width,
                        background: styles.barBg,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SECTION 2: SECONDARY MODEL REASONING (SEPARATE & COMPARATIVE) ── */}
      {secondaryModel && (
        <div className="bg-[#FAFBFD] border border-slate-200 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-slate-200 rounded-lg text-slate-700">
                <Layers className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Secondary model's reasoning (for comparison)
                </h4>
                <p className="text-[10px] text-slate-500">
                  Deep Learning PyTorch MLP output — strictly for comparative clinical reference.
                </p>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-lg bg-slate-200 text-slate-600">
              Comparative Reference
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
              <span className="block text-[9px] font-black text-slate-400 uppercase">PyTorch MLP Risk</span>
              <span className="block text-base font-extrabold text-slate-800">
                {secondaryModel.mlp_risk_score !== undefined && secondaryModel.mlp_risk_score !== null
                  ? `${secondaryModel.mlp_risk_score}%`
                  : 'N/A'}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
              <span className="block text-[9px] font-black text-slate-400 uppercase">MLP Risk Level</span>
              <span className="block text-sm font-bold text-slate-800">
                {secondaryModel.mlp_risk_level || 'N/A'}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
              <span className="block text-[9px] font-black text-slate-400 uppercase">MLP Prediction</span>
              <span className="block text-sm font-bold text-slate-800">
                {secondaryModel.mlp_prediction === 1 ? 'Disease Detected' : secondaryModel.mlp_prediction === 0 ? 'No Disease' : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 3: PATIENT BIOMETRIC SUMMARY GRID ─────────────────────── */}
      <div className="bg-white border border-[#DDE4EE] rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
          Patient Biometric Snapshot
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {summaryRows.map((r, i) => (
            <div key={i} className="border border-slate-100 rounded-2xl p-3 bg-slate-50/60 space-y-1">
              <div className="flex items-center gap-1.5">
                {r.icon}
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">{r.label}</span>
              </div>
              <span className="block text-xs font-black text-slate-900">{r.val}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );

  if (isEmbedded) {
    return <div className="p-6">{content}</div>;
  }

  return (
    <div className="min-h-screen font-sans p-4 md:p-8 space-y-8" style={{ background: '#E8ECF2', color: '#1A2440' }}>
      <div className="flex justify-between items-center border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Neural Diagnostic Profile
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Technical explainability details for primary and secondary risk models.
          </p>
        </div>
      </div>
      {content}
    </div>
  );
}
