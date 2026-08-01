import React, { useState, useEffect } from 'react';
import api from '../api/api';
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
  const [activeTab, setActiveTab] = useState('risk'); // 'risk' | 'similarity' | 'neural'

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

  const handleRunScreening = async (e) => {
    if (e) e.preventDefault();
    setAnalyzing(true);
    setLoadingProgress(0);
    setLoadingCountdown(3);
    setLoadingStep(0);

    const intervalTime = 25; // 2500ms total duration
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 1;
      setLoadingProgress(progress);
      
      const secondsLeft = Math.max(1, 3 - Math.floor((progress * 2.5) / 100));
      setLoadingCountdown(secondsLeft);

      if (progress < 25) {
        setLoadingStep(0); // "Reading patient physiological metrics..."
      } else if (progress < 50) {
        setLoadingStep(1); // "Scaling features and matching baseline..."
      } else if (progress < 75) {
        setLoadingStep(2); // "Running dual-model consensus (XGBoost & PyTorch)..."
      } else {
        setLoadingStep(3); // "Extracting SHAP explainability matrices..."
      }

      if (progress >= 100) {
        clearInterval(progressInterval);
      }
    }, intervalTime);

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

      const response = await api.post("/predict", payload);

      // Enforce the 2.5s premium heartbeat animation
      await new Promise((resolve) => setTimeout(resolve, 2500));
      clearInterval(progressInterval);
      setLoadingProgress(100);

      if (response.data && response.data.status === "success") {
        window.analysisResult = response.data;
        setAnalysisResult(response.data);
      } else {
        throw new Error("Invalid prediction response");
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error("API error:", error);
      alert(
        error.response?.data?.detail ||
        "Failed to connect to the prediction server. Please verify that the FastAPI backend is running."
      );
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
    "Executing dual-model consensus algorithm (XGBoost + MLP)...",
    "Running SHAP explainer matrices in log-odds space..."
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
    <div className="min-h-screen bg-[#FAFAF5] text-[#003631] font-sans pb-24 relative selection:bg-[#FFEDA8]">
      {/* Dynamic Printing Style overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          header, footer, form, button, .no-print {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-shadow: none !important;
            border: 1px solid #E2E8F0 !important;
            background: white !important;
            padding: 16px !important;
            margin-bottom: 16px !important;
          }
        }
      `}} />

      {/* SCREENING HEADER NAVBAR */}
      <header className="bg-[#003631] text-[#FFEDA8] sticky top-0 z-50 border-b border-[#002623] shadow-md no-print">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 bg-[#002623] hover:bg-[#004a44] text-[#FFEDA8] text-xs font-semibold px-4 py-2.5 rounded-xl transition-all border border-[#FFEDA8]/20 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
            <div className="h-6 w-px bg-[#FFEDA8]/20 hidden sm:block"></div>
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-emerald-500 rounded-lg">
                <Brain className="w-5 h-5 text-[#003631]" />
              </span>
              <span className="text-lg font-bold tracking-tight text-white">
                Novus<span className="text-[#FFEDA8]">AI</span> Clinical Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFEDA8]/10 text-[#FFEDA8] text-xs font-medium border border-[#FFEDA8]/20">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Dual Consensus Active
            </span>
          </div>
        </div>
      </header>

      {/* PAGE CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-8 space-y-8">
        
        {/* SECTION 1: HERO HEADER */}
        <div className="bg-white border border-[#E4E9E5] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 no-print">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFEDA8] text-[#003631] text-xs font-extrabold tracking-wide uppercase">
              <Stethoscope className="w-3.5 h-3.5" />
              Explainable AI Clinical Decision Platform
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#003631] tracking-tight">
              Patient Cardiovascular Risk Screening System
            </h1>
            <p className="text-sm sm:text-base text-[#003631]/80 max-w-3xl leading-relaxed">
              Predict cardiovascular disease risk using Artificial Intelligence and explain every prediction with Explainable AI (SHAP).
            </p>
          </div>

          <div className="flex flex-row lg:flex-col sm:flex-row gap-3 self-start lg:self-center shrink-0">
            <button
              onClick={() => handleLoadTemplate('low')}
              type="button"
              className="text-xs font-bold px-4 py-3 rounded-xl border border-[#003631]/20 hover:bg-[#003631]/5 transition-all text-[#003631] cursor-pointer flex items-center gap-2 bg-emerald-50/50 hover:border-emerald-500/50"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Load Low Risk Example
            </button>
            <button
              onClick={() => handleLoadTemplate('high')}
              type="button"
              className="text-xs font-bold px-4 py-3 rounded-xl border border-[#003631]/20 hover:bg-[#003631]/5 transition-all text-[#003631] cursor-pointer flex items-center gap-2 bg-rose-50/50 hover:border-rose-500/50"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Load High Risk Example
            </button>
          </div>
        </div>

        {/* SECTION 2: PATIENT INFORMATION FORM */}
        <div className="bg-white border border-[#E4E9E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 no-print">
          <div className="flex items-center justify-between pb-4 border-b border-[#E4E9E5]">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5.5 h-5.5 text-[#003631]" />
              <h2 className="text-lg font-bold text-[#003631]">Patient Information Form</h2>
            </div>
            <span className="text-xs font-mono font-bold bg-[#FAFAF5] px-3 py-1 rounded-lg border border-[#E4E9E5] text-[#003631]/60">
              TELEMETRY ID: {formData.patientId}
            </span>
          </div>

          <form onSubmit={handleRunScreening} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Basic Fields */}
              <div>
                <label className="block text-xs font-extrabold text-[#003631] mb-2 uppercase tracking-wider">Patient Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-[#E4E9E5] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#003631]/20 focus:border-[#003631] bg-[#FAFAF5] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#003631] mb-2 uppercase tracking-wider">Age (Years)</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className="w-full px-4 py-3 border border-[#E4E9E5] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#003631]/20 focus:border-[#003631] bg-[#FAFAF5] transition-all"
                  required
                  min="1"
                  max="120"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#003631] mb-2 uppercase tracking-wider">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-4 py-3 border border-[#E4E9E5] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#003631]/20 focus:border-[#003631] bg-[#FAFAF5] transition-all"
                >
                  <option value="1">Male</option>
                  <option value="2">Female</option>
                </select>
              </div>
            </div>

            {/* Physiological attributes */}
            <div className="pt-2">
              <h3 className="text-xs font-extrabold text-[#003631]/50 uppercase tracking-widest mb-4">Physiological Measurements</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-bold text-[#003631] mb-2">Height (cm)</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                    className="w-full px-4 py-3 border border-[#E4E9E5] rounded-xl text-sm font-medium focus:outline-none focus:border-[#003631] transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#003631] mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="w-full px-4 py-3 border border-[#E4E9E5] rounded-xl text-sm font-medium focus:outline-none focus:border-[#003631] transition-all"
                    required
                  />
                </div>

                <div className="relative">
                  <label className="block text-xs font-bold text-[#003631] mb-2">BMI (Auto calculated)</label>
                  <div className={`w-full px-4 py-3 border rounded-xl text-sm font-extrabold flex items-center justify-between transition-all ${bmiColor}`}>
                    <span>{bmi > 0 ? bmi : '--'}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider">{bmiCategory}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#003631] mb-2">Systolic BP (mmHg)</label>
                    <input
                      type="number"
                      value={formData.ap_hi}
                      onChange={(e) => handleInputChange('ap_hi', e.target.value)}
                      className="w-full px-3 py-3 border border-[#E4E9E5] rounded-xl text-xs font-medium focus:outline-none focus:border-[#003631] transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#003631] mb-2">Diastolic BP (mmHg)</label>
                    <input
                      type="number"
                      value={formData.ap_lo}
                      onChange={(e) => handleInputChange('ap_lo', e.target.value)}
                      className="w-full px-3 py-3 border border-[#E4E9E5] rounded-xl text-xs font-medium focus:outline-none focus:border-[#003631] transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Lifestyle and Medical */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <h3 className="text-xs font-extrabold text-[#003631]/50 uppercase tracking-widest mb-4">Medical Parameters</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#003631] mb-2">Cholesterol Level</label>
                    <select
                      value={formData.cholesterol}
                      onChange={(e) => handleInputChange('cholesterol', e.target.value)}
                      className="w-full px-4 py-3 border border-[#E4E9E5] rounded-xl text-sm focus:outline-none focus:border-[#003631] bg-white transition-all font-semibold"
                    >
                      <option value="1">Normal</option>
                      <option value="2">Above Normal</option>
                      <option value="3">Well Above Normal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#003631] mb-2">Glucose Level</label>
                    <select
                      value={formData.gluc}
                      onChange={(e) => handleInputChange('gluc', e.target.value)}
                      className="w-full px-4 py-3 border border-[#E4E9E5] rounded-xl text-sm focus:outline-none focus:border-[#003631] bg-white transition-all font-semibold"
                    >
                      <option value="1">Normal</option>
                      <option value="2">Above Normal</option>
                      <option value="3">Well Above Normal</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-extrabold text-[#003631]/50 uppercase tracking-widest mb-4">Lifestyle Factors</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#003631] mb-2">Smoking</label>
                    <select
                      value={formData.smoke}
                      onChange={(e) => handleInputChange('smoke', e.target.value)}
                      className="w-full px-3 py-3 border border-[#E4E9E5] rounded-xl text-xs focus:outline-none focus:border-[#003631] bg-white transition-all font-semibold"
                    >
                      <option value="0">No</option>
                      <option value="1">Yes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#003631] mb-2">Alcohol Intake</label>
                    <select
                      value={formData.alco}
                      onChange={(e) => handleInputChange('alco', e.target.value)}
                      className="w-full px-3 py-3 border border-[#E4E9E5] rounded-xl text-xs focus:outline-none focus:border-[#003631] bg-white transition-all font-semibold"
                    >
                      <option value="0">No</option>
                      <option value="1">Yes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#003631] mb-2">Physical Activity</label>
                    <select
                      value={formData.active}
                      onChange={(e) => handleInputChange('active', e.target.value)}
                      className="w-full px-3 py-3 border border-[#E4E9E5] rounded-xl text-xs focus:outline-none focus:border-[#003631] bg-white transition-all font-semibold"
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Run Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={analyzing}
                className={`w-full text-[#FFEDA8] font-extrabold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-3 text-base ${
                  analyzing ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#003631] hover:bg-[#002623] hover:shadow-lg cursor-pointer'
                }`}
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-5.5 h-5.5 animate-spin text-[#FFEDA8]" />
                    Analyzing Patient Telemetry ({loadingProgress}%)...
                  </>
                ) : (
                  <>
                    <Brain className="w-5.5 h-5.5 text-[#FFEDA8]" />
                    Run AI Cardiovascular Risk Evaluation
                  </>
                )}
              </button>
            </div>

            {/* Simple Inline Loader */}
            {analyzing && (
              <div className="mt-6 p-5 bg-[#FAFAF5] border border-emerald-500/20 rounded-2xl space-y-3 animate-pulse">
                <div className="flex items-center justify-between text-xs font-bold text-[#003631]">
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 animate-pulse" />
                    {loadingMessages[loadingStep]}
                  </span>
                  <span>{loadingProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* COMPLETE AI REPORT LAYOUT */}
        {analysisResult && !analyzing && (
          <div className="space-y-8 print-container">
            {/* View Selector Tabs */}
            <div className="flex flex-col sm:flex-row border-b border-[#E4E9E5] bg-white rounded-3xl p-2 gap-2 no-print shadow-xs">
              {[
                { id: 'risk', label: 'Disease Risk Screening', desc: 'Primary Health Risk Assessment', icon: Activity },
                { id: 'similarity', label: 'Patient Similarity Cohorts', desc: 'Patient Group Matching', icon: UserCheck },
                { id: 'neural', label: 'Neural Diagnostic Profile', desc: 'Advanced Pattern Analysis', icon: Brain }
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center gap-3.5 p-4 rounded-2xl text-left transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#003631] text-[#FFEDA8] shadow-md' 
                        : 'bg-white text-[#003631] hover:bg-[#FAFAF5]'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${isActive ? 'bg-[#002623] text-[#FFEDA8]' : 'bg-[#FAFAF5] text-[#003631]'}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-sm font-black tracking-tight">{tab.label}</span>
                      <span className={`block text-[10px] ${isActive ? 'text-[#FFEDA8]/75' : 'text-[#003631]/60'} font-semibold`}>{tab.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Patient Header Summary (Print Only) */}
            <div className="hidden print:block border-b-2 border-slate-300 pb-4 mb-6">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 uppercase">Cardiac Risk Assessment Report</h1>
                  <p className="text-sm text-slate-600 font-medium">NovusAI Engine • HIPAA Compliant Diagnostic Data</p>
                </div>
                <div className="text-right font-mono text-xs">
                  <p><strong>Patient Name:</strong> {formData.name}</p>
                  <p><strong>Patient ID:</strong> {formData.patientId}</p>
                  <p><strong>Date Generated:</strong> {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* PAGE 1 */}
            {activeTab === 'risk' && (
              <DiseaseRiskScreening
                analysisResult={analysisResult}
                formData={formData}
                bmi={bmi}
                bmiCategory={bmiCategory}
                handlePrint={handlePrint}
              />
            )}

            {/* PAGE 2 */}
            {activeTab === 'similarity' && (
              <PatientSimilarityCohorts
                analysisResult={analysisResult}
                formData={formData}
                bmi={bmi}
              />
            )}

            {/* PAGE 3 */}
            {activeTab === 'neural' && (
              <NeuralDiagnosticProfile
                analysisResult={analysisResult}
                formData={formData}
                bmi={bmi}
                bmiCategory={bmiCategory}
                handlePrint={handlePrint}
              />
            )}
          </div>
        )}

      </main>
    </div>
  );
}
