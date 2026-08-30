import React, { useState, useEffect } from 'react';

import {
  Users,
  Check,
  Activity,
  Dumbbell,
  Heart,
  Droplets,
  Info,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Loader2
} from 'lucide-react';
import { fetchAISuggestions } from '../api/api';

const traitMap = {
  'High Risk': [
    'Higher biological strain across blood pressure parameters',
    'Elevated cholesterol or glucose measurements',
    'Higher average BMI compared to healthy reference cohorts',
    'Potential requirement for supervised clinical evaluation',
  ],
  'Moderate Risk': [
    'Borderline blood pressure or weight parameters',
    'Slight cholesterol or glucose elevations',
    'Variability in physical activity routines',
    'Responds well to structured preventive lifestyle adjustments',
  ],
  'Low Risk': [
    'Optimal resting blood pressure ranges',
    'Healthy body mass index and cholesterol profiles',
    'Active daily lifestyle and healthy dietary habits',
    'Low historical correlation with cardiac events',
  ],
};

export default function PatientSimilarityCohorts({
  analysisResult = {},
  formData = {},
  bmi = 0,
  isEmbedded = false,
  population_comparison_tier: propPopulationTier,
  clustering_confidence: propClusteringConfidence,
  clusterExplanation = "",
  valueExplanations = {},
  cohort_traits: propCohortTraits,
}) {
  // Extract population comparison tier
  const populationTier =
    propPopulationTier ||
    analysisResult.population_comparison_tier ||
    analysisResult.clustering?.risk_tier ||
    "Low Risk";

  // AI Suggestions state
  const [suggestions, setSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    const riskScore =
      analysisResult.final_risk_pct ??
      analysisResult.risk_score ??
      0;
    const tier =
      propPopulationTier ||
      analysisResult.population_comparison_tier ||
      analysisResult.clustering?.risk_tier ||
      "Low Risk";
    const primaryDriver =
      (analysisResult.primary_drivers?.[0]?.factor) ||
      (analysisResult.top_factors?.[0]?.label) ||
      null;

    if (!riskScore && tier === 'Low Risk') return; // skip if no real data

    setSuggestionsLoading(true);
    fetchAISuggestions({
      risk_tier: tier,
      risk_score: riskScore,
      age: formData.age ? parseInt(formData.age) : undefined,
      bmi: bmi ? parseFloat(bmi) : undefined,
      smoker: formData.smoke !== undefined ? formData.smoke === '1' || formData.smoke === 1 : undefined,
      active: formData.active !== undefined ? formData.active === '1' || formData.active === 1 : undefined,
      cholesterol: formData.cholesterol ? parseInt(formData.cholesterol) : undefined,
      glucose: formData.gluc ? parseInt(formData.gluc) : undefined,
      ap_hi: formData.ap_hi ? parseInt(formData.ap_hi) : undefined,
      ap_lo: formData.ap_lo ? parseInt(formData.ap_lo) : undefined,
      primary_driver: primaryDriver,
    }).then((res) => {
      setSuggestionsLoading(false);
      if (res.success && res.data?.suggestions) {
        setSuggestions(res.data);
      }
    });
  }, [analysisResult, formData, bmi]);

  // Extract GMM clustering confidence breakdown
  const confidenceData =
    propClusteringConfidence ||
    analysisResult.clustering_confidence ||
    analysisResult.clustering?.confidence ||
    null;

  // Safe fallback for probabilities if confidence object is not present
  const conf = confidenceData || {
    "Low Risk": populationTier === "Low Risk" ? 0.85 : 0.08,
    "Moderate Risk": populationTier === "Moderate Risk" ? 0.85 : 0.08,
    "High Risk": populationTier === "High Risk" ? 0.85 : 0.08,
  };

  const lowProb = typeof conf["Low Risk"] === 'number' ? conf["Low Risk"] : 0;
  const modProb = typeof conf["Moderate Risk"] === 'number' ? conf["Moderate Risk"] : 0;
  const highProb = typeof conf["High Risk"] === 'number' ? conf["High Risk"] : 0;

  // Calculate percentages (sum to 100% or normalized)
  const totalConf = (lowProb + modProb + highProb) || 1;
  const lowPct = Math.round((lowProb / totalConf) * 100);
  const modPct = Math.round((modProb / totalConf) * 100);
  const highPct = Math.round((highProb / totalConf) * 100);

  // Check if profile is borderline (top two probabilities are close)
  const sortedProbs = [
    { tier: "Low Risk", pct: lowPct, raw: lowProb },
    { tier: "Moderate Risk", pct: modPct, raw: modProb },
    { tier: "High Risk", pct: highPct, raw: highProb },
  ].sort((a, b) => b.raw - a.raw);

  const top1 = sortedProbs[0];
  const top2 = sortedProbs[1];
  const isBorderline = (top1.raw >= 0.35 && top2.raw >= 0.35) || (top1.raw - top2.raw < 0.20 && top1.raw < 0.70);

  // Color mapping for population tier badge
  const isHigh = populationTier === "High Risk";
  const isMod = populationTier === "Moderate Risk";
  let tierBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let tierGradient = "linear-gradient(135deg, #065F46, #047857)";

  if (isHigh) {
    tierBadgeColor = "bg-rose-50 text-rose-700 border-rose-200";
    tierGradient = "linear-gradient(135deg, #991B1B, #B91C1C)";
  } else if (isMod) {
    tierBadgeColor = "bg-amber-50 text-amber-700 border-amber-200";
    tierGradient = "linear-gradient(135deg, #92400E, #B45309)";
  }

  // Dynamic LLM Cohort Traits with hardcoded traitMap fallback
  const rawCohortTraits = propCohortTraits || analysisResult.cohort_traits;
  const traits = (Array.isArray(rawCohortTraits) && rawCohortTraits.length > 0)
    ? rawCohortTraits
    : (traitMap[populationTier] || traitMap['Low Risk']);

  const content = (
    <div className="space-y-6">

      {/* ── EXPLANATORY DISCLAIMER LINE ─────────────────────────────────── */}
      <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3 text-xs text-blue-900 font-semibold leading-relaxed">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          This shows how this patient compares to broader population groups (Unsupervised K-Means & GMM Clustering) and may differ from the primary risk score above.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT COLUMN: COHORT BANNER + GMM CONFIDENCE BREAKDOWN ───────── */}
        <div className="lg:col-span-6 space-y-6">

          {/* Matched Cohort Card */}
          <div
            className="relative overflow-hidden text-white rounded-3xl p-6 shadow-xs space-y-3"
            style={{ background: tierGradient }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                Unsupervised Population Cohort
              </span>
              <Users className="w-5 h-5 text-white/80" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Matched Cohort: {populationTier}
            </h2>
            <p className="text-xs text-white/90 leading-relaxed font-medium">
              Based on overall feature similarity, this patient clusters closest to the {populationTier} population benchmark.
            </p>
          </div>

          {/* GMM Confidence Breakdown Card */}
          <div className="bg-white border border-[#DDE4EE] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                GMM Cluster Membership Confidence
              </h3>
              <span className="text-[10px] font-bold text-slate-500">Soft Assignment</span>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Gaussian Mixture Model (GMM) probability distribution across population clusters:
            </p>

            {/* Stacked Bar */}
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 p-0.5 border border-slate-200">
              <div
                style={{ width: `${lowPct}%` }}
                className="bg-emerald-500 h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                title={`Low Risk: ${lowPct}%`}
              />
              <div
                style={{ width: `${modPct}%` }}
                className="bg-amber-500 h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                title={`Moderate Risk: ${modPct}%`}
              />
              <div
                style={{ width: `${highPct}%` }}
                className="bg-rose-500 h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                title={`High Risk: ${highPct}%`}
              />
            </div>

            {/* Three Percentage Badges */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-0.5">
                <span className="block text-[9px] font-black text-emerald-800 uppercase">Low Risk</span>
                <span className="block text-sm font-extrabold text-emerald-700">{lowPct}%</span>
              </div>
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl space-y-0.5">
                <span className="block text-[9px] font-black text-amber-800 uppercase">Moderate Risk</span>
                <span className="block text-sm font-extrabold text-amber-700">{modPct}%</span>
              </div>
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl space-y-0.5">
                <span className="block text-[9px] font-black text-rose-800 uppercase">High Risk</span>
                <span className="block text-sm font-extrabold text-rose-700">{highPct}%</span>
              </div>
            </div>

            {/* Borderline Note */}
            {isBorderline && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold rounded-2xl flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>This patient's profile is borderline between two risk groups.</span>
              </div>
            )}
          </div>

          {/* ── AI LIFESTYLE SUGGESTIONS (left column, below GMM) ── */}
          <div className="rounded-3xl overflow-hidden border border-[#DDE4EE] shadow-xs flex flex-col">
            {/* Header */}
            <div
              className="flex items-center gap-3 px-5 py-3.5"
              style={{
                background: isHigh
                  ? 'linear-gradient(135deg,#7F1D1D,#991B1B)'
                  : isMod
                  ? 'linear-gradient(135deg,#78350F,#92400E)'
                  : 'linear-gradient(135deg,#064E3B,#065F46)',
              }}
            >
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/60">
                  AI-Generated · Personalised
                </p>
                <h3 className="text-[13px] font-extrabold text-white leading-tight truncate">
                  {suggestions?.title || 'Your Daily Heart Health Plan'}
                </h3>
              </div>
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest shrink-0">
                LLM
              </span>
            </div>

            {/* Body */}
            <div className="bg-white p-5 space-y-3 flex-1">
              {suggestionsLoading ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: isHigh ? '#DC2626' : isMod ? '#D97706' : '#059669' }}
                  />
                  <p className="text-xs font-semibold text-slate-400">Generating your plan...</p>
                  <div className="w-full space-y-2 pt-1">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="flex items-center gap-2.5 animate-pulse">
                        <div className="w-7 h-7 rounded-xl bg-slate-100 shrink-0" />
                        <div className="h-2.5 bg-slate-100 rounded-full" style={{ width: `${65 + (i % 3) * 12}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : suggestions ? (
                <>
                  {suggestions.intro && (
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      {suggestions.intro}
                    </p>
                  )}
                  <ul className="space-y-2">
                    {suggestions.suggestions.map((item, idx) => {
                      const iconMap = {
                        heart: '❤️', walk: '🚶', food: '🥗',
                        sleep: '😴', stress: '🧘', doctor: '🩺',
                        water: '💧', smoke: '🚭', alcohol: '🍹',
                      };
                      const emoji = iconMap[item.icon] || '✅';
                      const col = isHigh
                        ? { bg: '#FEF2F2', border: '#FCA5A5' }
                        : isMod
                        ? { bg: '#FFFBEB', border: '#FCD34D' }
                        : { bg: '#ECFDF5', border: '#6EE7B7' };
                      return (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl border text-xs font-semibold text-slate-800"
                          style={{ background: col.bg, borderColor: col.border }}
                        >
                          <span className="text-sm leading-none mt-0.5 shrink-0">{emoji}</span>
                          <span className="leading-relaxed">{item.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="text-[8px] text-slate-300 font-semibold text-right pt-1">
                    {suggestions.fallback_used
                      ? 'General guidelines · Not personalised'
                      : `By ${suggestions.provider_used} · Not a prescription`}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-300 font-semibold text-center py-4">
                  Run a screening to see your plan.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN: COHORT CHARACTERISTICS + BIOMETRIC DATA ──────── */}
        <div className="lg:col-span-6 space-y-6">

          {/* Cohort Characteristics */}
          <div className="bg-white border border-[#DDE4EE] rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Matched Cohort Characteristics
            </h3>

            {clusterExplanation ? (
              <div className="p-4 bg-[#EEF3FF] border border-[#C7D7F8] rounded-2xl">
                <p className="text-xs text-[#1B2B6B] font-semibold leading-relaxed">
                  {clusterExplanation}
                </p>
              </div>
            ) : null}

            <ul className="space-y-2.5">
              {traits.map((trait, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-semibold">
                  <span className="w-4 h-4 rounded-full bg-[#EEF3FF] text-[#3B7CF4] border border-[#C7D7F8] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                  {trait}
                </li>
              ))}
            </ul>
          </div>

          {/* Patient Biometrics Comparison */}
          <div className="bg-white border border-[#DDE4EE] rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Patient Biometrics Summary
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#F8FAFD] border border-[#EDF2FA] rounded-xl space-y-1">
                <span className="block text-[9px] font-black text-slate-400 uppercase">Age / Gender</span>
                <span className="block font-extrabold text-slate-800">
                  {formData.age || '—'} yrs · {formData.gender === '1' ? 'Male' : 'Female'}
                </span>
              </div>
              <div className="p-3 bg-[#F8FAFD] border border-[#EDF2FA] rounded-xl space-y-1">
                <span className="block text-[9px] font-black text-slate-400 uppercase">BMI</span>
                <span className="block font-extrabold text-slate-800">{bmi || '—'}</span>
              </div>
              <div className="p-3 bg-[#F8FAFD] border border-[#EDF2FA] rounded-xl space-y-1">
                <span className="block text-[9px] font-black text-slate-400 uppercase">Blood Pressure</span>
                <span className="block font-extrabold text-slate-800">
                  {formData.ap_hi || '—'} / {formData.ap_lo || '—'} mmHg
                </span>
              </div>
              <div className="p-3 bg-[#F8FAFD] border border-[#EDF2FA] rounded-xl space-y-1">
                <span className="block text-[9px] font-black text-slate-400 uppercase">Cholesterol</span>
                <span className="block font-extrabold text-slate-800">
                  {formData.cholesterol === '1' ? 'Normal' : formData.cholesterol === '2' ? 'Above Normal' : 'Well Above Normal'}
                </span>
              </div>
            </div>
          </div>

          {Object.keys(valueExplanations).length > 0 && (
            <div className="bg-white border border-[#DDE4EE] rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-[#3B7CF4]" />
                Health Indicators — Plain Language
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                AI-generated explanations for this patient's key health values:
              </p>
              <div className="space-y-2">
                {Object.entries(valueExplanations).map(([key, explanation]) => {
                  const labelMap = {
                    smoke: "🚬 Smoking",
                    active: "🏃 Physical Activity",
                    cholesterol: "🩸 Cholesterol",
                    gluc: "🍬 Glucose",
                    blood_pressure: "❤️ Blood Pressure",
                    bmi: "⚖️ BMI"
                  };
                  const label = labelMap[key] || key;
                  return (
                    <div
                      key={key}
                      className="flex items-start gap-3 p-3 bg-[#F8FAFD] border border-[#EDF2FA] rounded-xl"
                    >
                      <div className="flex-1">
                        <span className="block text-[10px] font-black text-[#637082] uppercase tracking-wider">
                          {label}
                        </span>
                        <span className="block text-xs font-semibold text-[#2C3B4E] mt-0.5">
                          {explanation}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
            Population Similarity Cohorts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Unsupervised clustering comparison against broader population datasets.
          </p>
        </div>
      </div>
      {content}
    </div>
  );
}
