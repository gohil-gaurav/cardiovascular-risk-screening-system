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
  valueExplanations = {},
  mlp_primary_drivers: propMlpPrimaryDrivers,
  mlp_protective_factors: propMlpProtectiveFactors,
  mlp_shap_values: propMlpShapValues,
  mlp_risk_score: propMlpRiskScore,
  mlp_risk_level: propMlpRiskLevel,
  mlp_prediction: propMlpPrediction,
}) {
  const riskTier = parentRiskTier || analysisResult.risk_tier || "Low Risk";

  useEffect(() => {
    validateRiskTier(riskTier, analysisResult.risk_tier, "risk_tier");
  }, [riskTier, analysisResult.risk_tier]);

  const isHighRisk = riskTier === "High Risk";
  const isModRisk = riskTier === "Moderate Risk";

  // Resolve secondary model comparison (PyTorch MLP)
  const secondaryModel = propSecondaryComparison || analysisResult.secondary_model_comparison || null;

  const mlpPrimaryDrivers = propMlpPrimaryDrivers || 
    analysisResult.mlp_primary_drivers || []
  const mlpProtectiveFactors = propMlpProtectiveFactors || 
    analysisResult.mlp_protective_factors || []
  const mlpShapValues = propMlpShapValues || 
    analysisResult.mlp_shap_values || []
  const mlpRiskScore = propMlpRiskScore ?? 
    analysisResult.mlp_risk_score ?? null
  const mlpRiskLevel = propMlpRiskLevel || 
    analysisResult.mlp_risk_level || null
  const mlpPrediction = propMlpPrediction ?? 
    analysisResult.mlp_prediction ?? null

  const mlpFactorsForDisplay = mlpPrimaryDrivers.map((driver) => ({
    feature: driver.factor,
    label: driver.factor,
    value: driver.contribution,
    impact: driver.importance_pct >= 50 ? 'high' 
      : driver.importance_pct >= 20 ? 'moderate' 
      : 'low',
    importance_pct: driver.importance_pct,
  }))

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

  const featureKeyMap = {
    "Blood Pressure": "blood_pressure",
    "ap_hi": "blood_pressure",
    "ap_lo": "blood_pressure",
    "Cholesterol": "cholesterol",
    "cholesterol": "cholesterol",
    "BMI": "bmi",
    "bmi": "bmi",
    "Smoking": "smoke",
    "smoke": "smoke",
    "Activity": "active",
    "active": "active",
    "Glucose": "gluc",
    "gluc": "gluc",
    "Age": "age",
    "Gender": "gender",
  };

  const getValueExplanation = (factorLabel, factorFeature) => {
    const key1 = featureKeyMap[factorLabel] || null;
    const key2 = featureKeyMap[factorFeature] || null;
    return valueExplanations[key1] || 
           valueExplanations[key2] || 
           null;
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

      {(mlpRiskScore !== null || mlpRiskLevel) && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#F8FAFD] border border-[#EDF2FA] rounded-2xl p-4 text-center">
            <span className="block text-[9px] font-black text-[#9DAABB] uppercase tracking-wider mb-1">
              MLP Risk Score
            </span>
            <span className={`block text-2xl font-black ${
              mlpRiskScore >= 75 ? 'text-rose-600' 
              : mlpRiskScore >= 45 ? 'text-amber-600' 
              : 'text-emerald-600'
            }`}>
              {mlpRiskScore !== null ? `${Math.round(mlpRiskScore)}%` : '—'}
            </span>
          </div>
          <div className="bg-[#F8FAFD] border border-[#EDF2FA] rounded-2xl p-4 text-center">
            <span className="block text-[9px] font-black text-[#9DAABB] uppercase tracking-wider mb-1">
              MLP Risk Level
            </span>
            <span className={`block text-sm font-black ${
              mlpRiskLevel === 'High Risk' ? 'text-rose-600'
              : mlpRiskLevel === 'Moderate Risk' ? 'text-amber-600'
              : 'text-emerald-600'
            }`}>
              {mlpRiskLevel || '—'}
            </span>
          </div>
          <div className="bg-[#F8FAFD] border border-[#EDF2FA] rounded-2xl p-4 text-center">
            <span className="block text-[9px] font-black text-[#9DAABB] uppercase tracking-wider mb-1">
              MLP Prediction
            </span>
            <span className={`block text-sm font-black ${
              mlpPrediction === 1 ? 'text-rose-600' : 'text-emerald-600'
            }`}>
              {mlpPrediction === 1 ? 'Disease Detected' 
               : mlpPrediction === 0 ? 'No Disease' 
               : '—'}
            </span>
          </div>
        </div>
      )}

      {/* ── SECTION 1: PRIMARY SHAP FACTOR BREAKDOWN ─────────────────────── */}
      <div className="bg-white border border-[#DDE4EE] rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#EEF3FF] rounded-lg text-[#3B7CF4]">
                <BarChart3 className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-extrabold text-[#1A2440]">
                Deep Learning Risk Factor Analysis
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Feature attribution from PyTorch MLP Neural Network (SHAP DeepExplainer) — independent deep learning analysis.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Deep Learning Model
          </span>
        </div>

        {/* SHAP Factor Bars */}
        {mlpFactorsForDisplay.length === 0 ? (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500 font-medium">
            No specific factor drivers available for this screening profile.
          </div>
        ) : (
          <div className="space-y-4">
            {mlpFactorsForDisplay.map((factor, idx) => {
              const styles = getImpactStyles(factor.impact);
              const dynamicWidth = factor.importance_pct 
                ? `${Math.min(factor.importance_pct, 100)}%`
                : styles.width;

              const valueExplanation = getValueExplanation(
                factor.label, 
                factor.feature
              );

              return (
                <div key={idx} className="space-y-1.5 p-3 rounded-2xl bg-[#F8FAFD] border border-[#EDF2FA]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-[#1A2440]">{factor.label}</span>
                    <div className="flex items-center gap-2">
                      {factor.importance_pct !== undefined ? (
                        <span className="text-[11px] font-mono text-slate-600 font-semibold">
                          {factor.importance_pct}% importance
                        </span>
                      ) : factor.value ? (
                        <span className="text-[11px] font-mono text-slate-600 font-semibold">
                          {factor.value}
                        </span>
                      ) : null}
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
                        width: dynamicWidth,
                        background: styles.barBg,
                      }}
                    />
                  </div>
                  {valueExplanation && (
                    <p className="text-[10px] text-slate-500 italic font-medium pt-1">
                      {valueExplanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {mlpProtectiveFactors.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[#EDF2FA]">
            <h4 className="text-xs font-black text-[#1B2B6B] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              Deep Learning Protective Factors
            </h4>
            <div className="space-y-3">
              {mlpProtectiveFactors.map((factor, idx) => (
                <div key={idx} 
                  className="flex items-center gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                  </div>
                  <div className="flex-1">
                    <span className="block text-xs font-semibold text-[#2C3B4E]">
                      {factor.factor}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-600 font-bold shrink-0">
                    {factor.contribution}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 2: SECONDARY MODEL REASONING (SEPARATE & COMPARATIVE) ── */}
      {(analysisResult.risk_score !== undefined || secondaryModel) && (
        <div className="bg-[#FAFBFD] border border-slate-200 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-slate-200 rounded-lg text-slate-700">
                <Layers className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  XGBoost Primary Classifier (for comparison)
                </h4>
                <p className="text-[10px] text-slate-500">
                  XGBoost prediction — the official primary risk score used for the patient-facing report.
                </p>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700">
              Primary Classifier
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
              <span className="block text-[9px] font-black text-slate-400 uppercase">XGBoost Risk Score</span>
              <span className="block text-base font-extrabold text-slate-800">
                {analysisResult.risk_score !== undefined && analysisResult.risk_score !== null
                  ? `${Math.round(analysisResult.risk_score)}%`
                  : 'N/A'}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
              <span className="block text-[9px] font-black text-slate-400 uppercase">XGBoost Risk Level</span>
              <span className="block text-sm font-bold text-slate-800">
                {analysisResult.risk_level || 'N/A'}
              </span>
            </div>
            <div className="bg-[#FFFFFF] border border-slate-200 rounded-xl p-3 space-y-1">
              <span className="block text-[9px] font-black text-slate-400 uppercase">XGBoost Prediction</span>
              <span className="block text-sm font-bold text-slate-800">
                {analysisResult.prediction === 1 ? 'Disease Detected' : analysisResult.prediction === 0 ? 'No Disease' : 'N/A'}
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
