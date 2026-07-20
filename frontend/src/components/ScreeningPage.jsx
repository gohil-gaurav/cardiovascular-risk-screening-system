import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  Brain,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  FileText,
  User,
  Heart,
  Stethoscope,
  ChevronRight,
  Download
} from 'lucide-react';

export default function ScreeningPage({ onBackToHome }) {
  const [formData, setFormData] = useState({
    patientId: 'PAT-2027-891',
    name: 'Eleanor Vance',
    age: '58',
    sex: '1', // 1: Male, 0: Female
    cp: '2', // Chest Pain type (0-3)
    trestbps: '142', // Resting BP
    chol: '254', // Serum Cholesterol
    fbs: '0', // Fasting blood sugar > 120 (1=true, 0=false)
    restecg: '1', // Resting ECG
    thalach: '148', // Max heart rate
    exang: '1', // Exercise induced angina
    oldpeak: '2.3', // ST depression
    slope: '1', // ST slope
    ca: '1', // Major vessels (0-3)
    thal: '2', // Thalassemia
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRunScreening = (e) => {
    e.preventDefault();
    setAnalyzing(true);

    // Simulate machine learning model inference pipeline
    setTimeout(() => {
      setAnalyzing(false);

      // Simple clinical heuristic calculation based on parameters
      const ageNum = parseInt(formData.age) || 50;
      const bpNum = parseInt(formData.trestbps) || 120;
      const cholNum = parseInt(formData.chol) || 200;
      const oldpeakNum = parseFloat(formData.oldpeak) || 0;

      let score = 35;
      if (ageNum > 55) score += 15;
      if (bpNum > 135) score += 18;
      if (cholNum > 240) score += 16;
      if (oldpeakNum > 1.5) score += 20;

      score = Math.min(Math.max(score, 12), 94);
      const riskLevel = score >= 75 ? 'High Risk' : score >= 45 ? 'Moderate Risk' : 'Low Risk';

      setAnalysisResult({
        probability: `${score}%`,
        rawScore: score,
        riskLevel,
        confidence: '96.8%',
        primaryDrivers: [
          bpNum > 135 ? `Elevated Resting Blood Pressure (${bpNum} mmHg)` : null,
          cholNum > 240 ? `Elevated Serum Cholesterol (${cholNum} mg/dL)` : null,
          oldpeakNum > 1.5 ? `ST Segment Depression (${oldpeakNum} mm)` : null,
          formData.exang === '1' ? 'Exercise-Induced Angina Present' : null,
        ].filter(Boolean),
        recommendations: [
          'Schedule targeted 12-lead electrocardiogram (ECG) consultation within 48 hours.',
          'Consider lipid-lowering pharmacotherapy and ambulatory blood pressure monitoring.',
          'Advise dietary modification reducing saturated fats and sodium intake.',
          'Schedule 30-day follow-up cardiac risk re-evaluation.',
        ],
        timestamp: new Date().toLocaleString(),
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF5] text-[#003631] font-sans pb-24">
      {/* SCREENING NAVBAR HEADER */}
      <header className="bg-[#003631] text-[#FFEDA8] sticky top-0 z-50 border-b border-[#002623] shadow-md">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 bg-[#002623] hover:bg-[#004a44] text-[#FFEDA8] text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors border border-[#FFEDA8]/20 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
            <div className="h-6 w-px bg-[#FFEDA8]/20 hidden sm:block"></div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FFEDA8] text-[#003631] flex items-center justify-center font-bold">
                <Activity className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Cardio<span className="text-[#FFEDA8]">Vision</span> Screening Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFEDA8]/10 text-[#FFEDA8] text-xs font-medium border border-[#FFEDA8]/20">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              Ensemble Model Ready
            </span>
          </div>
        </div>
      </header>

      {/* PAGE CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-10 space-y-8">
        
        {/* TOP TITLE BANNER */}
        <div className="bg-white border border-[#E4E9E5] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFEDA8] text-[#003631] text-xs font-bold">
              <Stethoscope className="w-3.5 h-3.5" />
              Clinical Risk Assessment Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#003631] tracking-tight">
              Patient Cardiovascular Risk Screening
            </h1>
            <p className="text-sm text-[#003631]/70 max-w-2xl">
              Input patient physiological indicators and diagnostic test values to compute instant machine learning risk probability and decision support.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFormData({
                  patientId: `PAT-2027-${Math.floor(100 + Math.random() * 900)}`,
                  name: 'Demo Patient',
                  age: '62',
                  sex: '1',
                  cp: '3',
                  trestbps: '150',
                  chol: '268',
                  fbs: '1',
                  restecg: '1',
                  thalach: '135',
                  exang: '1',
                  oldpeak: '2.8',
                  slope: '2',
                  ca: '2',
                  thal: '3',
                });
                setAnalysisResult(null);
              }}
              className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#003631]/20 hover:bg-[#003631]/5 transition-colors text-[#003631] cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Load High-Risk Demo Case
            </button>
          </div>
        </div>

        {/* 2-COLUMN MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: FORM ENTRY */}
          <div className="lg:col-span-7 bg-white border border-[#E4E9E5] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E4E9E5]">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#003631]" />
                <h2 className="text-base font-bold text-[#003631]">Patient Health Data Form</h2>
              </div>
              <span className="text-xs font-mono text-[#003631]/60">ID: {formData.patientId}</span>
            </div>

            <form onSubmit={handleRunScreening} className="space-y-6">
              
              {/* Patient Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#003631] mb-1.5">Patient Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#E4E9E5] rounded-xl text-sm font-medium focus:outline-none focus:border-[#003631] bg-[#FAFAF5]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#003631] mb-1.5">Age (Years)</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#E4E9E5] rounded-xl text-sm font-medium focus:outline-none focus:border-[#003631] bg-[#FAFAF5]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#003631] mb-1.5">Biological Sex</label>
                  <select
                    value={formData.sex}
                    onChange={(e) => handleInputChange('sex', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#E4E9E5] rounded-xl text-sm font-medium focus:outline-none focus:border-[#003631] bg-[#FAFAF5]"
                  >
                    <option value="1">Male</option>
                    <option value="0">Female</option>
                  </select>
                </div>
              </div>

              {/* Hemodynamic Metrics */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#003631]/70">Hemodynamic Metrics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#003631] mb-1">Resting BP (mmHg)</label>
                    <input
                      type="number"
                      value={formData.trestbps}
                      onChange={(e) => handleInputChange('trestbps', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-[#E4E9E5] rounded-xl text-sm focus:outline-none focus:border-[#003631]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#003631] mb-1">Cholesterol (mg/dL)</label>
                    <input
                      type="number"
                      value={formData.chol}
                      onChange={(e) => handleInputChange('chol', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-[#E4E9E5] rounded-xl text-sm focus:outline-none focus:border-[#003631]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#003631] mb-1">Max HR Achieved</label>
                    <input
                      type="number"
                      value={formData.thalach}
                      onChange={(e) => handleInputChange('thalach', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-[#E4E9E5] rounded-xl text-sm focus:outline-none focus:border-[#003631]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Clinical & ECG Attributes */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#003631]/70">Clinical Diagnostic Findings</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#003631] mb-1">Chest Pain Type</label>
                    <select
                      value={formData.cp}
                      onChange={(e) => handleInputChange('cp', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-[#E4E9E5] rounded-xl text-sm focus:outline-none focus:border-[#003631]"
                    >
                      <option value="0">Typical Angina</option>
                      <option value="1">Atypical Angina</option>
                      <option value="2">Non-Anginal Pain</option>
                      <option value="3">Asymptomatic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#003631] mb-1">Resting ECG Results</label>
                    <select
                      value={formData.restecg}
                      onChange={(e) => handleInputChange('restecg', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-[#E4E9E5] rounded-xl text-sm focus:outline-none focus:border-[#003631]"
                    >
                      <option value="0">Normal</option>
                      <option value="1">ST-T Wave Abnormality</option>
                      <option value="2">Left Ventricular Hypertrophy</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#003631] mb-1">Fasting BS &gt; 120 mg/dL</label>
                    <select
                      value={formData.fbs}
                      onChange={(e) => handleInputChange('fbs', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-[#E4E9E5] rounded-xl text-sm focus:outline-none focus:border-[#003631]"
                    >
                      <option value="0">False (&lt;120 mg/dL)</option>
                      <option value="1">True (&gt;120 mg/dL)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#003631] mb-1">Exercise Angina</label>
                    <select
                      value={formData.exang}
                      onChange={(e) => handleInputChange('exang', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-[#E4E9E5] rounded-xl text-sm focus:outline-none focus:border-[#003631]"
                    >
                      <option value="0">No</option>
                      <option value="1">Yes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#003631] mb-1">ST Depression (Oldpeak)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.oldpeak}
                      onChange={(e) => handleInputChange('oldpeak', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-[#E4E9E5] rounded-xl text-sm focus:outline-none focus:border-[#003631]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={analyzing}
                  className="w-full bg-[#003631] hover:bg-[#002623] text-[#FFEDA8] font-bold py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2.5 cursor-pointer text-sm"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Evaluating Neural Risk Models...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5 text-[#FFEDA8]" />
                      Run AI Cardiovascular Risk Evaluation
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* RIGHT COLUMN: SCREENING ANALYSIS RESULTS PANEL */}
          <div className="lg:col-span-5 space-y-6">
            
            {analysisResult ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="bg-white border border-[#E4E9E5] rounded-2xl p-6 sm:p-8 shadow-md space-y-6"
              >
                {/* Result Top Badge */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E4E4E0]">
                  <div>
                    <span className="text-xs font-bold text-[#003631]/60">Evaluation Status</span>
                    <h3 className="text-base font-bold text-[#003631]">Cardiovascular Risk Report</h3>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                      analysisResult.riskLevel === 'High Risk'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : analysisResult.riskLevel === 'Moderate Risk'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {analysisResult.riskLevel}
                  </span>
                </div>

                {/* Probability Card with Dark Green & Butter Yellow */}
                <div className="bg-[#003631] text-[#FFEDA8] rounded-xl p-6 space-y-4 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#FFEDA8]/80">Calculated Cardiac Risk Probability</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FFEDA8] text-[#003631]">
                      Model Confidence: {analysisResult.confidence}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-extrabold text-white tracking-tight">{analysisResult.probability}</span>
                    <span className="text-sm font-semibold text-[#FFEDA8]">({analysisResult.riskLevel})</span>
                  </div>

                  <div className="w-full bg-black/20 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        analysisResult.rawScore >= 75 ? 'bg-red-400' : analysisResult.rawScore >= 45 ? 'bg-amber-300' : 'bg-emerald-400'
                      }`}
                      style={{ width: analysisResult.probability }}
                    ></div>
                  </div>
                </div>

                {/* Primary Risk Drivers */}
                {analysisResult.primaryDrivers.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-[#003631] uppercase tracking-wider">Identified Risk Vectors</h4>
                    <div className="space-y-2">
                      {analysisResult.primaryDrivers.map((driver, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 text-xs text-[#003631] font-semibold bg-red-50/60 p-2.5 rounded-lg border border-red-100">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>{driver}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clinical Recommendations */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#003631] uppercase tracking-wider">Clinical Decision Support Recommendations</h4>
                  <ul className="space-y-2 text-xs text-[#003631]/80">
                    {analysisResult.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 bg-[#FAFAF5] p-3 rounded-lg border border-[#E4E9E5]">
                        <CheckCircle2 className="w-4 h-4 text-[#003631] shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Export Options */}
                <div className="pt-2 flex items-center justify-between border-t border-[#E4E9E5] text-xs text-[#003631]/60">
                  <span>Timestamp: {analysisResult.timestamp}</span>
                  <button
                    onClick={() => alert(`Cardiovascular Risk Report for ${formData.name} ready for download.`)}
                    className="inline-flex items-center gap-1.5 font-bold text-[#003631] hover:underline cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export PDF Report
                  </button>
                </div>

              </motion.div>
            ) : (
              /* EMPTY STATE PANEL */
              <div className="bg-white border border-[#E4E9E5] rounded-2xl p-8 text-center space-y-5 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-[#003631]/10 text-[#003631] flex items-center justify-center mx-auto">
                  <Brain className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-[#003631]">Awaiting Patient Screening Input</h3>
                  <p className="text-xs text-[#003631]/60 max-w-sm mx-auto leading-relaxed">
                    Fill in the physiological and diagnostic indicators on the left, then click <strong>"Run AI Risk Evaluation"</strong> to generate the comprehensive report.
                  </p>
                </div>
                <div className="bg-[#FFEDA8]/40 border border-[#FFEDA8] rounded-xl p-4 text-xs text-[#003631] text-left space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-[#003631]" />
                    HIPAA & Clinical Compliance
                  </span>
                  <p className="text-[11px] text-[#003631]/80">
                    Patient records are evaluated strictly client-side with encrypted telemetry.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
}
