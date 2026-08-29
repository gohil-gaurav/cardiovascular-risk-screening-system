import React from 'react';
import { Activity, Info, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ThresholdGauge({
  xgbProbabilityPct = 0,
  xgbDecisionThreshold = 0.45,
  thresholdMargin = 0,
  isAboveThreshold = false,
  thresholdProximity = "",
  riskTier = "Low Risk",
}) {
  const thresholdPct = xgbDecisionThreshold * 100;
  const patientPct = xgbProbabilityPct;
  const isHigh = riskTier === "High Risk";
  const isMod = riskTier === "Moderate Risk";

  return (
    <div className="bg-white border border-[#DDE4EE] rounded-3xl p-6 shadow-xs space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-extrabold text-[#1A2440] flex items-center gap-2">
            <span className="p-1.5 bg-[#EEF3FF] rounded-lg text-[#3B7CF4]">
              <Activity className="w-4 h-4 text-[#3B7CF4]" />
            </span>
            Decision Threshold Analysis
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            XGBoost uses a tuned threshold of {thresholdPct.toFixed(0)}% (not default 50%) for higher recall in disease detection.
          </p>
        </div>
        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
          isAboveThreshold 
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {isAboveThreshold ? 'Above Threshold' : 'Below Threshold'}
        </span>
      </div>

      {/* Three metric cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#F8FAFD] border border-[#EDF2FA] rounded-2xl p-4 text-center">
          <span className="block text-[9px] font-black text-[#9DAABB] uppercase tracking-wider mb-1">
            Raw Probability
          </span>
          <span className={`block text-2xl font-black ${
            isHigh ? 'text-rose-600' 
            : isMod ? 'text-amber-600' 
            : 'text-emerald-600'
          }`}>
            {patientPct.toFixed(1)}%
          </span>
          <span className="block text-[10px] text-slate-400 mt-0.5">
            XGBoost output
          </span>
        </div>

        <div className="bg-[#F8FAFD] border border-[#EDF2FA] rounded-2xl p-4 text-center">
          <span className="block text-[9px] font-black text-[#9DAABB] uppercase tracking-wider mb-1">
            Decision Threshold
          </span>
          <span className="block text-2xl font-black text-[#3B7CF4]">
            {thresholdPct.toFixed(0)}%
          </span>
          <span className="block text-[10px] text-slate-400 mt-0.5">
            Tuned cutoff
          </span>
        </div>

        <div className="bg-[#F8FAFD] border border-[#EDF2FA] rounded-2xl p-4 text-center">
          <span className="block text-[9px] font-black text-[#9DAABB] uppercase tracking-wider mb-1">
            Margin
          </span>
          <span className={`block text-2xl font-black ${
            thresholdMargin > 0 ? 'text-rose-600' : 'text-emerald-600'
          }`}>
            {thresholdMargin > 0 ? '+' : ''}{thresholdMargin.toFixed(1)}%
          </span>
          <span className="block text-[10px] text-slate-400 mt-0.5">
            {thresholdMargin > 0 ? 'above' : 'below'} cutoff
          </span>
        </div>
      </div>

      {/* Visual threshold bar */}
      <div className="space-y-3">
        <div className="flex justify-between text-[10px] font-bold text-slate-400">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>

        {/* Main bar container */}
        <div className="relative w-full h-8 bg-slate-100 rounded-full overflow-visible border border-slate-200">
          
          {/* Background zones: Safe zone (0 to threshold) */}
          <div 
            className="absolute left-0 top-0 h-full bg-emerald-100 rounded-l-full"
            style={{ width: `${thresholdPct}%` }}
          />
          {/* Risk zone (threshold to 100) */}
          <div 
            className="absolute top-0 h-full bg-rose-100 rounded-r-full"
            style={{ 
              left: `${thresholdPct}%`,
              width: `${100 - thresholdPct}%`
            }}
          />

          {/* Patient probability marker */}
          <div
            className="absolute top-0 h-full flex items-center justify-center"
            style={{ 
              left: `${Math.min(patientPct, 98)}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className={`w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center ${
              isAboveThreshold ? 'bg-rose-500' : 'bg-emerald-500'
            }`}>
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>

          {/* Threshold line marker */}
          <div
            className="absolute top-0 h-full flex flex-col items-center"
            style={{ 
              left: `${thresholdPct}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="w-0.5 h-full bg-[#3B7CF4] opacity-70" />
          </div>
        </div>

        {/* Labels below bar */}
        <div className="relative w-full">
          {/* Threshold label */}
          <div
            className="absolute text-[9px] font-black text-[#3B7CF4] uppercase"
            style={{ 
              left: `${thresholdPct}%`,
              transform: 'translateX(-50%)',
              top: 0
            }}
          >
            Threshold {thresholdPct.toFixed(0)}%
          </div>
          {/* Patient label */}
          <div
            className="absolute text-[9px] font-black uppercase mt-4"
            style={{ 
              left: `${Math.min(patientPct, 95)}%`,
              transform: 'translateX(-50%)',
              top: '14px',
              color: isAboveThreshold ? '#BE123C' : '#065F46'
            }}
          >
            Patient {patientPct.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Extra spacing after labels */}
      <div className="h-4" />

      {/* Proximity explanation card */}
      <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
        isAboveThreshold
          ? 'bg-rose-50 border-rose-200'
          : 'bg-emerald-50 border-emerald-200'
      }`}>
        {isAboveThreshold 
          ? <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          : <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        }
        <div className="space-y-1">
          <span className={`block text-[10px] font-black uppercase tracking-wider ${
            isAboveThreshold ? 'text-rose-700' : 'text-emerald-700'
          }`}>
            {thresholdProximity}
          </span>
          <p className={`text-xs font-semibold leading-relaxed ${
            isAboveThreshold ? 'text-rose-800' : 'text-emerald-800'
          }`}>
            {isAboveThreshold 
              ? `The model's raw probability of ${patientPct.toFixed(1)}% exceeds the tuned decision boundary of ${thresholdPct.toFixed(0)}% by ${Math.abs(thresholdMargin).toFixed(1)} percentage points, triggering a Disease classification.`
              : `The model's raw probability of ${patientPct.toFixed(1)}% falls below the tuned decision boundary of ${thresholdPct.toFixed(0)}% by ${Math.abs(thresholdMargin).toFixed(1)} percentage points, resulting in a No Disease classification.`
            }
          </p>
        </div>
      </div>

      {/* Why tuned threshold info box */}
      <div className="p-4 bg-[#EEF3FF] border border-[#C7D7F8] rounded-2xl flex items-start gap-3">
        <Info className="w-4 h-4 text-[#3B7CF4] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="block text-[10px] font-black text-[#1B2B6B] uppercase tracking-wider">
            Why {thresholdPct.toFixed(0)}% and not 50%?
          </span>
          <p className="text-xs text-[#4A5F73] font-semibold leading-relaxed">
            In cardiovascular screening, missing a true disease case (false negative) is more dangerous than a false positive. The threshold is tuned to {thresholdPct.toFixed(0)}% to maximize recall — catching more at-risk patients even if some healthy patients are flagged for follow-up.
          </p>
        </div>
      </div>

    </div>
  );
}
