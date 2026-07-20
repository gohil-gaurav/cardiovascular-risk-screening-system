import React from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Users,
  Activity,
  Shield,
  CheckCircle2,
  ArrowRight,
  Stethoscope,
  Building2,
  FlaskConical,
  Award,
} from 'lucide-react';

/* --------------------------------------------------------------------------
   Framer Motion Animation Variants
   -------------------------------------------------------------------------- */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPage({ onStartScreening }) {
  return (
    <div className="w-full bg-[#FAFAF5] text-[#003631] overflow-hidden font-sans">

      {/* ------------------------------------------------------------------ */}
      {/* 1. HERO SECTION                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section id="home" className="relative py-20 lg:py-28 bg-white border-b border-[#E4E9E5]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* HERO LEFT COLUMN */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="lg:col-span-6 space-y-6"
            >
              {/* Small Badge with Butter Yellow & Dark Green */}
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFEDA8] text-[#003631] text-xs font-bold tracking-wide border border-[#003631]/10">
                <span className="w-2 h-2 rounded-full bg-[#003631] animate-pulse"></span>
                AI-Powered Cardiovascular Risk Screening
              </motion.div>

              {/* Large Heading */}
              <motion.h1
                variants={fadeUp}
                className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-[#003631] tracking-tight leading-[1.15]"
              >
                Predict Cardiovascular Risk Before It Becomes Critical.
              </motion.h1>

              {/* Description */}
              <motion.p
                variants={fadeUp}
                className="text-base sm:text-lg text-[#003631]/75 leading-relaxed font-normal max-w-xl"
              >
                Empowering healthcare professionals with intelligent cardiovascular risk prediction using machine learning. Analyze patient health records, identify risk levels, and support early diagnosis with confidence.
              </motion.p>

              {/* Action Buttons */}
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button
                  onClick={onStartScreening}
                  className="inline-flex items-center justify-center gap-2 bg-[#003631] hover:bg-[#002623] text-[#FFEDA8] font-bold px-7 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer text-sm"
                >
                  Start Screening
                  <ArrowRight className="w-4 h-4 text-[#FFEDA8]" />
                </button>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-[#FAFAF5] text-[#003631] border border-[#003631]/20 font-bold px-6 py-3.5 rounded-xl transition-colors cursor-pointer text-sm"
                >
                  Learn More
                </a>
              </motion.div>
            </motion.div>

            {/* HERO RIGHT COLUMN: REALISTIC MEDICAL DASHBOARD CARD */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6"
            >
              <div className="bg-white border border-[#E4E9E5] rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow">
                
                {/* Dashboard Card Header */}
                <div className="flex items-center justify-between pb-5 border-b border-[#E4E9E5]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#003631] text-[#FFEDA8] flex items-center justify-center font-bold text-sm">
                      P-82
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#003631]">Patient Risk Assessment</h3>
                      <p className="text-xs text-[#003631]/60">ID: #CRSS-892401 • Male, 56y</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    High Risk
                  </span>
                </div>

                {/* Score & Risk Gauge Row */}
                <div className="grid grid-cols-2 gap-4 py-5 border-b border-[#E4E9E5]">
                  <div className="bg-[#FAFAF5] p-4 rounded-xl border border-[#E4E9E5]">
                    <span className="text-xs font-semibold text-[#003631]/70">Patient Risk Score</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-extrabold text-[#003631]">82%</span>
                      <span className="text-xs font-bold text-red-600">High Risk</span>
                    </div>
                  </div>

                  <div className="bg-[#FAFAF5] p-4 rounded-xl border border-[#E4E9E5]">
                    <span className="text-xs font-semibold text-[#003631]/70">AI Confidence</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-extrabold text-[#003631]">96.4%</span>
                      <span className="text-xs text-[#003631]/60 font-semibold">Optimal</span>
                    </div>
                  </div>
                </div>

                {/* Patient Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 py-5 border-b border-[#E4E9E5]">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[#003631]/60">Heart Rate</span>
                    <p className="text-sm font-bold text-[#003631] flex items-center gap-1">
                      78 <span className="text-[11px] font-normal text-[#003631]/60">BPM</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[#003631]/60">Blood Pressure</span>
                    <p className="text-sm font-bold text-[#003631]">
                      138/88 <span className="text-[11px] font-normal text-[#003631]/60">mmHg</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[#003631]/60">Cholesterol</span>
                    <p className="text-sm font-bold text-[#003631]">
                      242 <span className="text-[11px] font-normal text-[#003631]/60">mg/dL</span>
                    </p>
                  </div>
                </div>

                {/* Animated ECG Waveform Monitor */}
                <div className="pt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#003631]/70">Live Lead II ECG Signal</span>
                    <span className="text-[#003631] font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
                      Real-Time Monitoring
                    </span>
                  </div>

                  <div className="h-16 bg-[#003631] rounded-xl p-2 relative overflow-hidden flex items-center border border-[#002623]">
                    <svg className="w-full h-full text-[#FFEDA8]" viewBox="0 0 500 60" preserveAspectRatio="none">
                      <path
                        d="M0 30 L50 30 L60 30 L70 10 L80 50 L90 20 L100 35 L110 30 L160 30 L170 30 L180 5 L190 55 L200 15 L210 35 L220 30 L270 30 L280 30 L290 10 L300 50 L310 20 L320 35 L330 30 L380 30 L390 30 L400 5 L410 55 L420 15 L430 35 L440 30 L500 30"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* AI Status Footer */}
                <div className="mt-4 pt-3 flex items-center justify-between text-xs text-[#003631]/70 bg-[#FAFAF5] rounded-lg px-3 py-2 border border-[#E4E9E5]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#003631]" />
                    Ensemble Decision Engine
                  </span>
                  <span className="font-bold text-[#003631]">Completed</span>
                </div>

              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. TRUSTED SECTION                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 bg-[#FAFAF5] border-b border-[#E4E9E5]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center space-y-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#003631]/70">
            Trusted by Healthcare Professionals
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-center opacity-85">
            <div className="flex items-center justify-center gap-2 font-bold text-[#003631] text-sm sm:text-base border border-[#E4E9E5] bg-white py-3.5 px-4 rounded-xl shadow-xs">
              <Building2 className="w-5 h-5 text-[#003631]" />
              <span>Hospitals</span>
            </div>
            <div className="flex items-center justify-center gap-2 font-bold text-[#003631] text-sm sm:text-base border border-[#E4E9E5] bg-white py-3.5 px-4 rounded-xl shadow-xs">
              <Stethoscope className="w-5 h-5 text-[#003631]" />
              <span>Clinics</span>
            </div>
            <div className="flex items-center justify-center gap-2 font-bold text-[#003631] text-sm sm:text-base border border-[#E4E9E5] bg-white py-3.5 px-4 rounded-xl shadow-xs">
              <FlaskConical className="w-5 h-5 text-[#003631]" />
              <span>Research Labs</span>
            </div>
            <div className="flex items-center justify-center gap-2 font-bold text-[#003631] text-sm sm:text-base border border-[#E4E9E5] bg-white py-3.5 px-4 rounded-xl shadow-xs">
              <Award className="w-5 h-5 text-[#003631]" />
              <span>Healthcare Orgs</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. FEATURES SECTION                                                */}
      {/* ------------------------------------------------------------------ */}
      <section id="features" className="py-24 bg-white border-b border-[#E4E9E5]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#003631] tracking-tight">
              Everything You Need for Cardiovascular Risk Screening
            </h2>
            <p className="text-base text-[#003631]/70">
              Comprehensive tools designed to streamline risk calculation, diagnostic insights, and patient record management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-[#E4E9E5] rounded-xl p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#FFEDA8] text-[#003631] flex items-center justify-center border border-[#003631]/10">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#003631]">AI Prediction</h3>
                <p className="text-sm text-[#003631]/70 leading-relaxed">
                  Machine learning-powered cardiovascular risk prediction.
                </p>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-[#E4E9E5] rounded-xl p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#FFEDA8] text-[#003631] flex items-center justify-center border border-[#003631]/10">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#003631]">Patient Management</h3>
                <p className="text-sm text-[#003631]/70 leading-relaxed">
                  Securely manage patient records and health history.
                </p>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-[#E4E9E5] rounded-xl p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#FFEDA8] text-[#003631] flex items-center justify-center border border-[#003631]/10">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#003631]">Health Analytics</h3>
                <p className="text-sm text-[#003631]/70 leading-relaxed">
                  Monitor patient health trends using interactive analytics.
                </p>
              </div>
            </motion.div>

            {/* Card 4 */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-[#E4E9E5] rounded-xl p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#FFEDA8] text-[#003631] flex items-center justify-center border border-[#003631]/10">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#003631]">Secure & Reliable</h3>
                <p className="text-sm text-[#003631]/70 leading-relaxed">
                  Built with privacy and healthcare data security in mind.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. HOW IT WORKS SECTION                                            */}
      {/* ------------------------------------------------------------------ */}
      <section id="how-it-works" className="py-24 bg-[#FAFAF5] border-b border-[#E4E9E5]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#003631] tracking-tight">
              How CardioVision Works
            </h2>
            <p className="text-base text-[#003631]/70">
              A simple 4-step workflow that integrates seamlessly into clinical patient care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="bg-white border border-[#E4E9E5] rounded-xl p-6 space-y-4 relative shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#003631] bg-[#FFEDA8] px-2.5 py-1 rounded-md">Step 01</span>
                <Users className="w-5 h-5 text-[#003631]/50" />
              </div>
              <h3 className="text-base font-bold text-[#003631]">Upload Patient Information</h3>
              <p className="text-xs text-[#003631]/70 leading-relaxed">
                Input patient health records, blood pressure, cholesterol, and physiological data.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-[#E4E9E5] rounded-xl p-6 space-y-4 relative shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#003631] bg-[#FFEDA8] px-2.5 py-1 rounded-md">Step 02</span>
                <Brain className="w-5 h-5 text-[#003631]/50" />
              </div>
              <h3 className="text-base font-bold text-[#003631]">AI Processes Health Data</h3>
              <p className="text-xs text-[#003631]/70 leading-relaxed">
                Intelligent machine learning algorithms process multi-parametric health metrics.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-[#E4E9E5] rounded-xl p-6 space-y-4 relative shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#003631] bg-[#FFEDA8] px-2.5 py-1 rounded-md">Step 03</span>
                <Activity className="w-5 h-5 text-[#003631]/50" />
              </div>
              <h3 className="text-base font-bold text-[#003631]">Risk Prediction Generated</h3>
              <p className="text-xs text-[#003631]/70 leading-relaxed">
                Calculates precise cardiovascular risk score and identifies potential risk factors.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-[#E4E9E5] rounded-xl p-6 space-y-4 relative shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#003631] bg-[#FFEDA8] px-2.5 py-1 rounded-md">Step 04</span>
                <Shield className="w-5 h-5 text-[#003631]/50" />
              </div>
              <h3 className="text-base font-bold text-[#003631]">Clinical Decision Support</h3>
              <p className="text-xs text-[#003631]/70 leading-relaxed">
                Provides actionable recommendations to support early clinical diagnosis.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. STATISTICS SECTION                                              */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 bg-white border-b border-[#E4E9E5]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="space-y-2">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#003631] tracking-tight">10,000+</div>
              <p className="text-sm font-semibold text-[#003631]/70">Patient Records</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }} className="space-y-2">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#003631] tracking-tight">95%</div>
              <p className="text-sm font-semibold text-[#003631]/70">Prediction Accuracy</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }} className="space-y-2">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#003631] tracking-tight">50+</div>
              <p className="text-sm font-semibold text-[#003631]/70">Healthcare Professionals</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.3 }} className="space-y-2">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#003631] tracking-tight">24/7</div>
              <p className="text-sm font-semibold text-[#003631]/70">System Availability</p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 6. WHY CHOOSE CARDIOVISION                                         */}
      {/* ------------------------------------------------------------------ */}
      <section id="why-choose" className="py-24 bg-[#FAFAF5] border-b border-[#E4E9E5]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Checklist */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#003631] bg-[#FFEDA8] px-3 py-1 rounded-md">Why Choose CardioVision</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#003631] tracking-tight">
                  Intelligent Risk Screening Built for Healthcare
                </h2>
                <p className="text-sm text-[#003631]/70 leading-relaxed">
                  Combining medical precision with advanced machine learning to deliver fast, reliable, and secure patient risk evaluations.
                </p>
              </div>

              <div className="space-y-3.5">
                {[
                  "AI-Powered Screening",
                  "Early Disease Detection",
                  "Fast Predictions",
                  "Secure Patient Data",
                  "Accurate Risk Assessment",
                  "Modern Dashboard",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-[#E4E9E5] shadow-xs">
                    <div className="w-5 h-5 rounded-full bg-[#FFEDA8] text-[#003631] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-[#003631]" />
                    </div>
                    <span className="text-sm font-bold text-[#003631]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Laptop Mockup */}
            <div className="lg:col-span-7">
              {/* Laptop Shell */}
              <div className="bg-[#003631] p-3.5 rounded-2xl shadow-xl border border-[#002623]">
                {/* Laptop Top Bar */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-[#002623] rounded-t-xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px] font-mono text-[#FFEDA8]/80 ml-2">cardiovision.health/dashboard</span>
                </div>

                {/* Laptop Display Content */}
                <div className="bg-white rounded-b-xl p-5 space-y-5 text-[#003631] font-sans">
                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E4E9E5]">
                    <div>
                      <h4 className="text-sm font-bold text-[#003631]">Cardiovascular Analytics Dashboard</h4>
                      <p className="text-[11px] text-[#003631]/60">Real-Time Patient Risk Telemetry</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-[#FFEDA8] text-[#003631] text-[11px] font-bold rounded-md border border-[#003631]/10">System Active</span>
                    </div>
                  </div>

                  {/* Telemetry Charts Mock */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#FAFAF5] p-3 rounded-lg border border-[#E4E9E5]">
                      <span className="text-[10px] text-[#003631]/60 font-medium">Avg BP Index</span>
                      <p className="text-base font-bold text-[#003631]">124 / 82</p>
                      <div className="w-full bg-[#E4E9E5] h-1.5 rounded-full mt-2">
                        <div className="bg-[#003631] h-1.5 rounded-full w-2/3"></div>
                      </div>
                    </div>
                    <div className="bg-[#FAFAF5] p-3 rounded-lg border border-[#E4E9E5]">
                      <span className="text-[10px] text-[#003631]/60 font-medium">High Risk Rate</span>
                      <p className="text-base font-bold text-[#003631]">14.2%</p>
                      <div className="w-full bg-[#FFEDA8] h-1.5 rounded-full mt-2">
                        <div className="bg-[#003631] h-1.5 rounded-full w-1/3"></div>
                      </div>
                    </div>
                    <div className="bg-[#FAFAF5] p-3 rounded-lg border border-[#E4E9E5]">
                      <span className="text-[10px] text-[#003631]/60 font-medium">Inference Time</span>
                      <p className="text-base font-bold text-[#003631]">&lt;100 ms</p>
                      <div className="w-full bg-[#E4E9E5] h-1.5 rounded-full mt-2">
                        <div className="bg-[#003631] h-1.5 rounded-full w-1/4"></div>
                      </div>
                    </div>
                  </div>

                  {/* Patient List */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-[#003631] uppercase tracking-wider">Recent Patient Records</span>
                    <div className="divide-y divide-[#E4E9E5] border border-[#E4E9E5] rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-2.5 bg-[#FAFAF5] text-xs">
                        <span className="font-semibold text-[#003631]">#CRSS-1049 (Age 62)</span>
                        <span className="text-[#003631]/70">Chol: 210 mg/dL</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-bold">Moderate</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-white text-xs">
                        <span className="font-semibold text-[#003631]">#CRSS-1050 (Age 45)</span>
                        <span className="text-[#003631]/70">Chol: 180 mg/dL</span>
                        <span className="px-2 py-0.5 bg-[#FFEDA8] text-[#003631] rounded-md font-bold">Low Risk</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 7. CALL TO ACTION SECTION                                          */}
      {/* ------------------------------------------------------------------ */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="bg-[#003631] rounded-2xl p-10 sm:p-14 text-center text-[#FFEDA8] space-y-6 shadow-md border border-[#002623]">
            
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight text-white">
              Start Intelligent Cardiovascular Screening Today
            </h2>

            <p className="text-[#FFEDA8]/80 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Improve healthcare decisions with AI-powered cardiovascular risk prediction and early disease detection.
            </p>

            <div className="pt-2">
              <button
                onClick={onStartScreening}
                className="bg-[#FFEDA8] hover:bg-[#ffe585] text-[#003631] font-extrabold text-sm px-9 py-4 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Get Started
              </button>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
