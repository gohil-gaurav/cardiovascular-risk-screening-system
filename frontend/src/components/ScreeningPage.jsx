import React, { useState, useEffect } from 'react';
import { submitScreening } from '../api/screenApi';
import { motion, AnimatePresence } from 'framer-motion';
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
  Download,
  Printer,
  Share2,
  TrendingUp,
  TrendingDown,
  Info,
  AlertCircle,
  Check,
  UserCheck,
  Zap,
  Shield,
  Apple
} from 'lucide-react';
import DiseaseRiskScreening    from './DiseaseRiskScreening';
import PatientSimilarityCohorts from './PatientSimilarityCohorts';
import NeuralDiagnosticProfile  from './NeuralDiagnosticProfile';

const generatePoints = (cx, cy, count, seed) => {
  const points = [];
  let currentSeed = seed;
  for (let i = 0; i < count; i++) {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    const r = (currentSeed / 233280) * 20;
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    const theta = (currentSeed / 233280) * 2 * Math.PI;
    points.push({
      x: cx + r * Math.cos(theta),
      y: cy + r * Math.sin(theta)
    });
  }
  return points;
};

export default function ScreeningPage({ onBackToHome }) {
  // Patient Form Data
  const [formData, setFormData] = useState({
    patientId: 'PAT-2027-891',
    name: 'Eleanor Vance',
    age: '58',
    gender: '1', // 1: Male, 2: Female
    height: '165',
    weight: '70',
    ap_hi: '130',
    ap_lo: '80',
    cholesterol: '1', // 1: Normal, 2: Above Normal, 3: Well Above Normal
    gluc: '1',        // 1: Normal, 2: Above Normal, 3: Well Above Normal
    smoke: '0',       // 0: No, 1: Yes
    alco: '0',        // 0: No, 1: Yes
    active: '1',      // 0: No, 1: Yes
  });

  const [bmi, setBmi] = useState(25.7);
  const [bmiCategory, setBmiCategory] = useState('Overweight');
  const [bmiColor, setBmiColor] = useState('text-amber-600 bg-amber-50 border-amber-200');

  const [analyzing, setAnalyzing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0); 
  const [loadingCountdown, setLoadingCountdown] = useState(3);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Auto-calculate BMI
  useEffect(() => {
    const h = parseFloat(formData.height);
    const w = parseFloat(formData.weight);
    if (h > 0 && w > 0) {
      const heightM = h / 100;
      const computedBmi = w / (heightM * heightM);
      const roundedBmi = parseFloat(computedBmi.toFixed(1));
      setBmi(roundedBmi);

      if (roundedBmi < 18.5) {
        setBmiCategory('Underweight');
        setBmiColor('text-blue-600 bg-blue-50 border-blue-200');
      } else if (roundedBmi < 25) {
        setBmiCategory('Healthy Weight');
        setBmiColor('text-emerald-600 bg-emerald-50 border-emerald-200');
      } else if (roundedBmi < 30) {
        setBmiCategory('Overweight');
        setBmiColor('text-amber-600 bg-amber-50 border-amber-200');
      } else {
        setBmiCategory('Obese');
        setBmiColor('text-rose-600 bg-rose-50 border-rose-200');
      }
    } else {
      setBmi(0);
      setBmiCategory('Invalid measurements');
      setBmiColor('text-slate-400 bg-slate-50 border-slate-200');
    }
  }, [formData.height, formData.weight]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLoadTemplate = (type) => {
    const randomId = `PAT-2026-${Math.floor(100 + Math.random() * 900)}`;
    if (type === 'low') {
      setFormData({
        patientId: randomId,
        name: 'Eleanor Vance',
        age: '30',
        gender: '2',
        height: '160',
        weight: '55',
        ap_hi: '110',
        ap_lo: '70',
        cholesterol: '1',
        gluc: '1',
        smoke: '0',
        alco: '0',
        active: '1',
      });
    } else {
      setFormData({
        patientId: randomId,
        name: 'Demo Patient',
        age: '62',
        gender: '1',
        height: '172',
        weight: '94',
        ap_hi: '160',
        ap_lo: '100',
        cholesterol: '3',
        gluc: '2',
        smoke: '1',
        alco: '1',
        active: '0',
      });
    }
    setAnalysisResult(null);
  };

  const validateForm = () => {
    const age = parseFloat(formData.age);
    const height = parseFloat(formData.height);
    const weight = parseFloat(formData.weight);
    const ap_hi = parseInt(formData.ap_hi, 10);
    const ap_lo = parseInt(formData.ap_lo, 10);

    if (isNaN(age) || age < 1 || age > 120) {
      return 'Please enter a valid age between 1 and 120 years.';
    }
    if (isNaN(height) || height < 50 || height > 250) {
      return 'Please enter a valid height between 50 and 250 cm.';
    }
    if (isNaN(weight) || weight < 10 || weight > 300) {
      return 'Please enter a valid weight between 10 and 300 kg.';
    }
    if (isNaN(ap_hi) || ap_hi <= 0) {
      return 'Please enter a valid positive systolic blood pressure (ap_hi).';
    }
    if (isNaN(ap_lo) || ap_lo <= 0) {
      return 'Please enter a valid positive diastolic blood pressure (ap_lo).';
    }
    if (ap_hi <= ap_lo) {
      return 'Systolic blood pressure (ap_hi) must be higher than diastolic blood pressure (ap_lo).';
    }
    return null;
  };

  const handleRunScreening = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setAnalyzing(true);
    setLoadingProgress(0);
    setLoadingCountdown(5);
    setLoadingStep(0);

    // Slowly advance the progress bar to 95% and keep it there until the request resolves
    let progress = 0;
    const progressInterval = setInterval(() => {
      if (progress < 30) {
        progress += 2;
      } else if (progress < 60) {
        progress += 0.8;
      } else if (progress < 85) {
        progress += 0.4;
      } else if (progress < 95) {
        progress += 0.15;
      }
      
      const roundedProgress = Math.min(95, Math.floor(progress));
      setLoadingProgress(roundedProgress);

      if (roundedProgress < 20) {
        setLoadingStep(0);
      } else if (roundedProgress < 40) {
        setLoadingStep(1);
      } else if (roundedProgress < 60) {
        setLoadingStep(2);
      } else if (roundedProgress < 80) {
        setLoadingStep(3);
      } else {
        setLoadingStep(4);
      }
    }, 150);

    try {
      const payload = {
        age: parseFloat(formData.age),
        gender: parseInt(formData.gender),
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        ap_hi: parseInt(formData.ap_hi),
        ap_lo: parseInt(formData.ap_lo),
        cholesterol: parseInt(formData.cholesterol),
        gluc: parseInt(formData.gluc),
        smoke: parseInt(formData.smoke),
        alco: parseInt(formData.alco),
        active: parseInt(formData.active),
      };

      const result = await submitScreening(payload);

      clearInterval(progressInterval);

      if (result.success) {
        setLoadingProgress(100);
        // Add a tiny delay for visual polish
        await new Promise((resolve) => setTimeout(resolve, 300));
        setAnalysisResult(result.data);
      } else {
        setErrorMessage(result.error || "We couldn't process this screening — please try again.");
        setAnalysisResult(null);
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Screening execution error:", error);
      setErrorMessage("We couldn't process this screening — please try again.");
      setAnalysisResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  // Helper to determine Metric Badges (Card 3)
  const getMetricStatus = (key, value) => {
    if (key === 'Age') {
      const ageVal = parseInt(value);
      if (ageVal < 45) return { status: 'Normal', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      if (ageVal <= 60) return { status: 'Warning', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      return { status: 'Critical', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (key === 'BMI') {
      const bmiVal = parseFloat(value);
      if (bmiVal < 25) return { status: 'Normal', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      if (bmiVal < 30) return { status: 'Warning', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      return { status: 'Critical', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (key === 'Blood Pressure') {
      const hi = parseInt(formData.ap_hi);
      const lo = parseInt(formData.ap_lo);
      if (hi < 120 && lo < 80) return { status: 'Normal', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      if (hi < 140 && lo < 90) return { status: 'Warning', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      return { status: 'Critical', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (key === 'Cholesterol') {
      const val = parseInt(value);
      if (val === 1) return { status: 'Normal', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      if (val === 2) return { status: 'Warning', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      return { status: 'Critical', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (key === 'Glucose') {
      const val = parseInt(value);
      if (val === 1) return { status: 'Normal', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      if (val === 2) return { status: 'Warning', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      return { status: 'Critical', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (key === 'Physical Activity') {
      const val = parseInt(value);
      if (val === 1) return { status: 'Normal', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      return { status: 'Warning', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { status: 'Normal', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  // Generate dynamic clinical summary narrative (Card 8)
  const getDynamicClinicalSummary = () => {
    if (!analysisResult) return '';
    const prob = analysisResult.risk_score;
    const name = formData.name;
    const level = analysisResult.risk_level;
    
    // Sort SHAP features to get text for the top risk drivers
    const drivers = analysisResult.primary_drivers.map(d => d.factor.toLowerCase()).slice(0, 3).join(", ");
    const protections = analysisResult.protective_factors.map(p => p.factor.toLowerCase()).slice(0, 2).join(", ");
    
    let summaryText = `The patient has a predicted cardiovascular disease risk probability of ${Math.round(prob)}%. The prediction is mainly driven by ${drivers || 'elevated physiological parameters'}.`;
    
    if (protections) {
      summaryText += ` Protective lifestyle factors such as ${protections} reduce overall risk.`;
    }
    
    if (level === 'High Risk') {
      summaryText += ` The model recommends further clinical evaluation and regular blood pressure monitoring.`;
    } else if (level === 'Moderate Risk') {
      summaryText += ` Standard lifestyle modifications and blood pressure monitoring are advised to manage cumulative risk factors.`;
    } else {
      summaryText += ` The model recommends maintaining current healthy habits and schedule standard periodic follow-up checks.`;
    }
    
    return summaryText;
  };

  // SHAP Waterfall calculations (Card 7)
  const getWaterfallSteps = () => {
    if (!analysisResult) return [];
    
    const baseLogOdds = analysisResult.shap_base_value_logodds;
    const shapList = analysisResult.shap_values;
    
    // Sort SHAP values by absolute impact (descending)
    const sortedShap = [...shapList].sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value));
    
    // Standard Sigmoid math
    const logOddsToProb = (lo) => 1 / (1 + Math.exp(-lo));
    
    let currentLogOdds = baseLogOdds;
    const steps = [];
    
    // Base step
    steps.push({
      label: "Baseline Average",
      value: "",
      change: 0,
      prob: logOddsToProb(baseLogOdds) * 100,
      prevProb: logOddsToProb(baseLogOdds) * 100,
      type: 'base'
    });
    
    // Feature steps
    sortedShap.forEach((item) => {
      const prevLogOdds = currentLogOdds;
      currentLogOdds += item.shap_value;
      const prevProb = logOddsToProb(prevLogOdds) * 100;
      const newProb = logOddsToProb(currentLogOdds) * 100;
      
      steps.push({
        label: item.display_name,
        value: item.value,
        change: item.shap_value,
        prob: newProb,
        prevProb: prevProb,
        type: item.shap_value > 0 ? 'increase' : 'decrease'
      });
    });
    
    return steps;
  };

  // Feature Importance data (Card 6)
  const getFeatureImportanceList = () => {
    if (!analysisResult) return [];
    return [...analysisResult.shap_values].sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value));
  };

  // Recommendation Icons mapper
  const getRecommendationIcon = (iconName) => {
    switch (iconName) {
      case 'sodium':
        return <Apple className="w-5 h-5 text-amber-500" />;
      case 'bp':
        return <Activity className="w-5 h-5 text-red-500" />;
      case 'doctor':
        return <Stethoscope className="w-5 h-5 text-indigo-500" />;
      case 'weight':
        return <Sparkles className="w-5 h-5 text-emerald-500" />;
      case 'activity':
        return <Heart className="w-5 h-5 text-rose-500" />;
      case 'cholesterol':
        return <ShieldCheck className="w-5 h-5 text-teal-500" />;
      case 'smoke':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <Check className="w-5 h-5 text-blue-500" />;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `Cardiovascular Risk Evaluation Report for ${formData.name}. Predicted Risk: ${analysisResult?.risk_score}%.`;
    if (navigator.share) {
      navigator.share({
        title: 'NovusAI Cardiac Screening Report',
        text: text,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert('Report summary copied to clipboard!');
    }
  };

  const loadingMessages = [
    "Reading patient physiological indicators...",
    "Scaling and normalizing biometric properties...",
    "Executing consensus model validation (XGBoost + MLP)...",
    "Running explainability feature matrices...",
    "Synthesizing results using clinical communication model..."
  ];

  const baseAge = parseInt(formData.age) || 50;
  const riskScore = analysisResult?.risk_score || 50;
  const vascularAgeOffset = Math.round((riskScore - 40) * 0.25);
  const vascularAge = Math.max(18, baseAge + vascularAgeOffset);
  
  let heartGrade = 'C';
  let gradeColor = 'text-amber-600 bg-amber-50 border-amber-200';
  let gradeDesc = 'Moderate';
  let gradeAdvice = 'Lifestyle adjustments recommended to improve heart score.';
  
  if (riskScore < 20) {
    heartGrade = 'A';
    gradeColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
    gradeDesc = 'Excellent';
    gradeAdvice = 'Your cardiovascular system is in outstanding condition. Maintain current healthy patterns.';
  } else if (riskScore < 40) {
    heartGrade = 'B';
    gradeColor = 'text-emerald-500 bg-emerald-50/50 border-emerald-100';
    gradeDesc = 'Good';
    gradeAdvice = 'Solid cardiac markers. Minor lifestyle adjustments can optimize health further.';
  } else if (riskScore < 65) {
    heartGrade = 'C';
    gradeColor = 'text-amber-500 bg-amber-50/30 border-amber-100';
    gradeDesc = 'Moderate';
    gradeAdvice = 'Elevated vascular markers detected. Standard diet and exercise adjustments are recommended.';
  } else if (riskScore < 80) {
    heartGrade = 'D';
    gradeColor = 'text-orange-600 bg-orange-50 border-orange-200';
    gradeDesc = 'Caution';
    gradeAdvice = 'Substantial vascular strain. Consider consulting a physician for a target care pathway.';
  } else {
    heartGrade = 'F';
    gradeColor = 'text-rose-600 bg-rose-50 border-rose-200';
    gradeDesc = 'Critical';
    gradeAdvice = 'High cardiodiagnostic strain. Immediate physician consultation and a managed care plan are advised.';
  }

  const getImpactLevel = (val) => {
    const a = Math.abs(val);
    if (a >= 0.40) return { label: 'Critical', color: 'text-rose-600 bg-rose-50 border-rose-200', cells: 4 };
    if (a >= 0.15) return { label: 'High', color: 'text-orange-600 bg-orange-50 border-orange-200', cells: 3 };
    if (a >= 0.05) return { label: 'Moderate', color: 'text-amber-600 bg-amber-50 border-amber-200', cells: 2 };
    return { label: 'Low Impact', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', cells: 1 };
  };

  const getFactorExplanation = (feature, value, isAmplifier) => {
    if (isAmplifier) {
      switch (feature) {
        case 'ap_hi': return 'High pressure strains arterial walls.';
        case 'ap_lo': return 'High resting pressure strains the heart.';
        case 'cholesterol': return 'Elevated lipids lead to plaque buildup.';
        case 'gluc': return 'High blood sugar damages blood vessels.';
        case 'age': return 'Natural aging increases vascular stiffness.';
        case 'weight':
        case 'BMI': return 'Higher weight increases cardiac workload.';
        case 'smoke': return 'Tobacco toxins damage artery linings.';
        case 'alco': return 'Alcohol increases vascular resistance.';
        case 'active': return 'Lack of exercise reduces cardiac fitness.';
        default: return 'Contributes to baseline cardiac stress.';
      }
    } else {
      switch (feature) {
        case 'smoke': return 'Not smoking protects arterial walls.';
        case 'active': return 'Regular exercise strengthens cardiac tissue.';
        case 'gluc': return 'Healthy blood sugar prevents vascular damage.';
        case 'cholesterol': return 'Optimal lipids prevent arterial blockages.';
        case 'ap_hi': return 'Healthy blood pressure protects arteries.';
        case 'ap_lo': return 'Healthy resting BP supports cardiac recovery.';
        case 'alco': return 'Avoiding alcohol supports arterial elasticity.';
        case 'weight':
        case 'BMI': return 'Healthy weight supports smooth circulation.';
        default: return 'Supports standard cardiovascular health.';
      }
    }
  };

  const riskAmplifiers = (analysisResult?.shap_values || [])
    .filter(item => item.shap_value > 0)
    .sort((a, b) => b.shap_value - a.shap_value);

  const riskDefenders = (analysisResult?.shap_values || [])
    .filter(item => item.shap_value <= 0)
    .sort((a, b) => a.shap_value - b.shap_value);

  return (
    <div className="min-h-screen font-sans pb-24 relative" style={{ background: '#E8ECF2', color: '#1A2440' }}>
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background-color: white !important; color: black !important; }
          header, footer, form, button, .no-print { display: none !important; }
          .print-container { width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .print-card { page-break-inside: avoid !important; break-inside: avoid !important; border: 1px solid #D8E1ED !important; background: white !important; padding: 16px !important; margin-bottom: 16px !important; }
        }
      `}} />

      {/* ── NAVBAR ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 no-print"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #DDE4EE', boxShadow: '0 1px 8px rgba(26,36,64,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBackToHome}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all cursor-pointer border"
              style={{ background: '#F3F6FA', color: '#637082', borderColor: '#D8E1ED' }}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="h-5 w-px hidden sm:block" style={{ background: '#DDE4EE' }}></div>
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#3B7CF4,#6355F5)' }}>
                <Brain className="w-4 h-4 text-white" />
              </span>
              <span className="text-sm font-extrabold tracking-tight" style={{ color: '#1B2B6B' }}>
                NovusAI <span style={{ color: '#3B7CF4' }}>Clinical</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: '#EEF3FF', color: '#1B2B6B', border: '1px solid #C7D7F8' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              System Online
            </span>
          </div>
        </div>
      </header>

      {/* ── MAIN ───────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">

        {/* HERO CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 no-print"
          style={{ border: '1px solid #DDE4EE', boxShadow: '0 2px 16px rgba(26,36,64,0.06)' }}>
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border"
              style={{ background: '#EEF3FF', color: '#1B2B6B', borderColor: '#C7D7F8' }}>
              <Stethoscope className="w-3.5 h-3.5" />
              HealthTech · AI Clinical Decision Platform
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: '#1A2440' }}>
              Patient Cardiovascular Risk Screening
            </h1>
            <p className="text-sm leading-relaxed max-w-2xl" style={{ color: '#637082' }}>
              Evaluate cardiovascular disease risk using Artificial Intelligence — with clear, plain-language explanations for every result.
            </p>
          </div>
          <div className="flex flex-row lg:flex-col sm:flex-row gap-3 shrink-0">
            <button onClick={() => handleLoadTemplate('low')} type="button"
              className="text-xs font-bold px-4 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2"
              style={{ background: '#F0FDF9', color: '#065F46', borderColor: '#A7F3D0' }}>
              <UserCheck className="w-4 h-4" />Low Risk Example
            </button>
            <button onClick={() => handleLoadTemplate('high')} type="button"
              className="text-xs font-bold px-4 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2"
              style={{ background: '#FEF2F2', color: '#991B1B', borderColor: '#FECACA' }}>
              <AlertTriangle className="w-4 h-4" />High Risk Example
            </button>
          </div>
        </div>

        {/* PATIENT FORM */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 space-y-6 no-print"
          style={{ border: '1px solid #DDE4EE', boxShadow: '0 2px 16px rgba(26,36,64,0.06)' }}>
          <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: '#EDF0F7' }}>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl" style={{ background: '#EEF3FF' }}>
                <FileText className="w-4 h-4" style={{ color: '#3B7CF4' }} />
              </div>
              <h2 className="text-base font-bold" style={{ color: '#1A2440' }}>Patient Information Form</h2>
            </div>
            <span className="text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border tracking-wider"
              style={{ background: '#F3F6FA', color: '#9DAABB', borderColor: '#D8E1ED' }}>
              ID: {formData.patientId}
            </span>
          </div>

          <form onSubmit={handleRunScreening} className="space-y-6">
            {/* Patient Details */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#9DAABB' }}>Patient Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#637082' }}>Full Name</label>
                  <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all outline-none border"
                    style={{ background: '#F3F6FA', borderColor: '#D8E1ED', color: '#1A2440' }} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#637082' }}>Age (Years)</label>
                  <input type="number" value={formData.age} onChange={(e) => handleInputChange('age', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all outline-none border"
                    style={{ background: '#F3F6FA', borderColor: '#D8E1ED', color: '#1A2440' }} required min="1" max="120" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#637082' }}>Gender</label>
                  <select value={formData.gender} onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all outline-none border"
                    style={{ background: '#F3F6FA', borderColor: '#D8E1ED', color: '#1A2440' }}>
                    <option value="1">Male</option>
                    <option value="2">Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Physiological */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#9DAABB' }}>Physiological Measurements</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#637082' }}>Height (cm)</label>
                  <input type="number" value={formData.height} onChange={(e) => handleInputChange('height', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold outline-none border"
                    style={{ background: '#F3F6FA', borderColor: '#D8E1ED', color: '#1A2440' }} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#637082' }}>Weight (kg)</label>
                  <input type="number" value={formData.weight} onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold outline-none border"
                    style={{ background: '#F3F6FA', borderColor: '#D8E1ED', color: '#1A2440' }} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#637082' }}>BMI (Auto)</label>
                  <div className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-bold flex items-center justify-between ${bmiColor}`}>
                    <span>{bmi > 0 ? bmi : '—'}</span>
                    <span className="text-[10px] uppercase font-black tracking-wider">{bmiCategory}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#637082' }}>Systolic BP</label>
                    <input type="number" value={formData.ap_hi} onChange={(e) => handleInputChange('ap_hi', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold outline-none border"
                      style={{ background: '#F3F6FA', borderColor: '#D8E1ED', color: '#1A2440' }} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#637082' }}>Diastolic BP</label>
                    <input type="number" value={formData.ap_lo} onChange={(e) => handleInputChange('ap_lo', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold outline-none border"
                      style={{ background: '#F3F6FA', borderColor: '#D8E1ED', color: '#1A2440' }} required />
                  </div>
                </div>
              </div>
            </div>

            {/* Medical + Lifestyle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#9DAABB' }}>Medical Parameters</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Cholesterol Level', key: 'cholesterol', opts: [['1','Normal'],['2','Above Normal'],['3','Well Above Normal']] },
                    { label: 'Glucose Level',     key: 'gluc',        opts: [['1','Normal'],['2','Above Normal'],['3','Well Above Normal']] },
                  ].map(s => (
                    <div key={s.key}>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#637082' }}>{s.label}</label>
                      <select value={formData[s.key]} onChange={(e) => handleInputChange(s.key, e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold outline-none border"
                        style={{ background: '#F3F6FA', borderColor: '#D8E1ED', color: '#1A2440' }}>
                        {s.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#9DAABB' }}>Lifestyle Factors</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Smoking',  key: 'smoke',  opts: [['0','No'],['1','Yes']] },
                    { label: 'Alcohol',  key: 'alco',   opts: [['0','No'],['1','Yes']] },
                    { label: 'Activity', key: 'active', opts: [['1','Active'],['0','Inactive']] },
                  ].map(s => (
                    <div key={s.key}>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#637082' }}>{s.label}</label>
                      <select value={formData[s.key]} onChange={(e) => handleInputChange(s.key, e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold outline-none border"
                        style={{ background: '#F3F6FA', borderColor: '#D8E1ED', color: '#1A2440' }}>
                        {s.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div className="flex-1">{errorMessage}</div>
                <button type="button" onClick={() => setErrorMessage(null)} className="text-xs underline cursor-pointer hover:text-rose-900">Dismiss</button>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <button type="submit" disabled={analyzing}
                className="w-full text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-sm active:scale-[0.99]"
                style={{
                  background: analyzing ? '#9DAABB' : 'linear-gradient(135deg,#3B7CF4,#6355F5)',
                  cursor: analyzing ? 'not-allowed' : 'pointer',
                  boxShadow: analyzing ? 'none' : '0 4px 24px rgba(59,124,244,0.40)'
                }}>
                {analyzing ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" />Analysing Patient Data ({loadingProgress}%)…</>
                ) : (
                  <><Brain className="w-5 h-5" />Run AI Cardiovascular Risk Evaluation</>
                )}
              </button>
            </div>

            {/* Progress */}
            {analyzing && (
              <div className="p-4 rounded-2xl space-y-2.5 border"
                style={{ background: '#EEF3FF', borderColor: '#C7D7F8' }}>
                <div className="flex items-center justify-between text-xs font-bold" style={{ color: '#1A2440' }}>
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 animate-pulse" />
                    {loadingMessages[loadingStep]}
                  </span>
                  <span style={{ color: '#3B7CF4' }} className="font-black">{loadingProgress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#C7D7F8' }}>
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${loadingProgress}%`, background: 'linear-gradient(90deg,#3B7CF4,#6355F5)' }} />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* RESULTS */}
        {analysisResult && !analyzing && (
          <div className="space-y-6 print-container animate-fade-in">
            {/* Print header */}
            <div className="hidden print:block border-b-2 border-slate-300 pb-4 mb-6">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 uppercase">Cardiac Risk Assessment Report</h1>
                  <p className="text-sm text-slate-600 font-medium">NovusAI Engine · Confidential Medical Data</p>
                </div>
                <div className="text-right font-mono text-xs">
                  <p><strong>Patient Name:</strong> {formData.name}</p>
                  <p><strong>Patient ID:</strong> {formData.patientId}</p>
                  <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <DiseaseRiskScreening 
              analysisResult={analysisResult} 
              formData={formData} 
              bmi={bmi} 
              bmiCategory={bmiCategory} 
              handlePrint={handlePrint} 
            />
          </div>
        )}
      </main>
    </div>
  );
}
