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

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

/* ── Shared token colours ─────────────────────────────────────────────────── */
const C = {
  bg:        '#E8ECF2',   // page background  – silver-blue
  bgAlt:     '#F0F3F8',   // alternate sections
  card:      '#FFFFFF',
  border:    '#DDE4EE',
  navy:      '#1B2B6B',   // deep midnight navy  (primary)
  navyDark:  '#0E1840',
  blue:      '#3B7CF4',   // bright blue accent
  purple:    '#6355F5',   // purple accent
  text:      '#1A2440',   // main body text
  textMuted: '#637082',   // secondary text
  label:     '#9DAABB',   // tiny labels / uppercase
  inputBg:   '#F3F6FA',
};

export default function LandingPage({ onStartScreening }) {
  return (
    <div className="w-full overflow-hidden font-sans" style={{ background: C.bg, color: C.text }}>

      {/* ── 1. HERO ──────────────────────────────────────────────────────── */}
      <section id="home" className="relative py-20 lg:py-28 border-b"
        style={{ background: C.card, borderColor: C.border }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* LEFT */}
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}
              className="lg:col-span-6 space-y-6">

              <motion.div variants={fadeUp}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide border"
                style={{ background: '#EEF3FF', color: C.navy, borderColor: '#C7D7F8' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.blue }}></span>
                AI-Powered Cardiovascular Risk Screening
              </motion.div>

              <motion.h1 variants={fadeUp}
                className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.15]"
                style={{ color: C.text }}>
                Predict Cardiovascular Risk{' '}
                <span style={{ color: C.blue }}>Before It Becomes Critical.</span>
              </motion.h1>

              <motion.p variants={fadeUp}
                className="text-base sm:text-lg leading-relaxed font-normal max-w-xl"
                style={{ color: C.textMuted }}>
                Empowering healthcare professionals with intelligent cardiovascular risk prediction.
                Analyze patient health records, identify risk levels, and support early diagnosis with confidence.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button onClick={onStartScreening}
                  className="inline-flex items-center justify-center gap-2 text-white font-bold px-7 py-3.5 rounded-xl transition-all shadow-md cursor-pointer text-sm active:scale-95"
                  style={{ background: `linear-gradient(135deg,${C.blue},${C.purple})`, boxShadow: `0 4px 20px rgba(59,124,244,0.35)` }}>
                  Start Screening
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a href="#features"
                  className="inline-flex items-center justify-center gap-2 font-bold px-6 py-3.5 rounded-xl transition-colors cursor-pointer text-sm border"
                  style={{ background: C.card, color: C.navy, borderColor: C.border }}>
                  Learn More
                </a>
              </motion.div>
            </motion.div>

            {/* RIGHT: MOCK DASHBOARD CARD */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6">
              <div className="rounded-2xl p-6 sm:p-7 border"
                style={{ background: C.card, borderColor: C.border, boxShadow: '0 4px 32px rgba(26,36,64,0.10)' }}>

                {/* Card header */}
                <div className="flex items-center justify-between pb-5 border-b" style={{ borderColor: C.border }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold text-sm"
                      style={{ background: `linear-gradient(135deg,${C.blue},${C.purple})` }}>
                      P-82
                    </div>
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: C.text }}>Patient Risk Assessment</h3>
                      <p className="text-xs" style={{ color: C.textMuted }}>ID: #CRSS-892401 · Male, 56y</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    High Risk
                  </span>
                </div>

                {/* Score row */}
                <div className="grid grid-cols-2 gap-4 py-5 border-b" style={{ borderColor: C.border }}>
                  <div className="p-4 rounded-xl border" style={{ background: C.inputBg, borderColor: C.border }}>
                    <span className="text-xs font-semibold" style={{ color: C.textMuted }}>Patient Risk Score</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-extrabold" style={{ color: C.text }}>82%</span>
                      <span className="text-xs font-bold text-red-600">High Risk</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border" style={{ background: C.inputBg, borderColor: C.border }}>
                    <span className="text-xs font-semibold" style={{ color: C.textMuted }}>AI Confidence</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-extrabold" style={{ color: C.text }}>96.4%</span>
                      <span className="text-xs font-semibold" style={{ color: C.textMuted }}>Optimal</span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 py-5 border-b" style={{ borderColor: C.border }}>
                  {[
                    { label: 'Heart Rate',    value: '78',      unit: 'BPM'   },
                    { label: 'Blood Pressure',value: '138/88',  unit: 'mmHg'  },
                    { label: 'Cholesterol',   value: '242',     unit: 'mg/dL' },
                  ].map(m => (
                    <div key={m.label} className="space-y-1">
                      <span className="text-[11px] font-semibold" style={{ color: C.label }}>{m.label}</span>
                      <p className="text-sm font-bold" style={{ color: C.text }}>
                        {m.value} <span className="text-[11px] font-normal" style={{ color: C.textMuted }}>{m.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>

                {/* ECG */}
                <div className="pt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold" style={{ color: C.textMuted }}>Live ECG Signal</span>
                    <span className="font-bold flex items-center gap-1" style={{ color: C.text }}>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      Real-Time
                    </span>
                  </div>
                  <div className="h-16 rounded-xl p-2 relative overflow-hidden flex items-center"
                    style={{ background: `linear-gradient(135deg,${C.navy},${C.navyDark})`, border: `1px solid ${C.navyDark}` }}>
                    <svg className="w-full h-full" viewBox="0 0 500 60" preserveAspectRatio="none">
                      <path
                        d="M0 30 L50 30 L60 30 L70 10 L80 50 L90 20 L100 35 L110 30 L160 30 L170 30 L180 5 L190 55 L200 15 L210 35 L220 30 L270 30 L280 30 L290 10 L300 50 L310 20 L320 35 L330 30 L380 30 L390 30 L400 5 L410 55 L420 15 L430 35 L440 30 L500 30"
                        fill="none" stroke="#93C5FD" strokeWidth="2.2"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* Footer row */}
                <div className="mt-4 pt-3 flex items-center justify-between text-xs rounded-lg px-3 py-2 border"
                  style={{ background: C.inputBg, borderColor: C.border, color: C.textMuted }}>
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: C.blue }} />
                    Ensemble Decision Engine
                  </span>
                  <span className="font-bold" style={{ color: C.blue }}>Completed</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. TRUSTED BY ────────────────────────────────────────────────── */}
      <section className="py-16 border-b" style={{ background: C.bgAlt, borderColor: C.border }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center space-y-8">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.label }}>
            Trusted by Healthcare Professionals
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
            {[
              { icon: <Building2 className="w-5 h-5" />, label: 'Hospitals' },
              { icon: <Stethoscope className="w-5 h-5" />, label: 'Clinics' },
              { icon: <FlaskConical className="w-5 h-5" />, label: 'Research Labs' },
              { icon: <Award className="w-5 h-5" />, label: 'Healthcare Orgs' },
            ].map(item => (
              <div key={item.label}
                className="flex items-center justify-center gap-2 font-bold text-sm border py-3.5 px-4 rounded-xl"
                style={{ background: C.card, borderColor: C.border, color: C.navy, boxShadow: '0 1px 6px rgba(26,36,64,0.06)' }}>
                <span style={{ color: C.blue }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. FEATURES ──────────────────────────────────────────────────── */}
      <section id="features" className="py-24 border-b" style={{ background: C.card, borderColor: C.border }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: C.text }}>
              Everything You Need for Cardiovascular Risk Screening
            </h2>
            <p className="text-base" style={{ color: C.textMuted }}>
              Comprehensive tools designed to streamline risk calculation, diagnostic insights, and patient record management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Brain className="w-6 h-6" />, title: 'AI Prediction',      desc: 'Machine learning-powered cardiovascular risk prediction.' },
              { icon: <Users className="w-6 h-6" />, title: 'Patient Management', desc: 'Securely manage patient records and health history.' },
              { icon: <Activity className="w-6 h-6" />, title: 'Health Analytics', desc: 'Monitor patient health trends using interactive analytics.' },
              { icon: <Shield className="w-6 h-6" />, title: 'Secure & Reliable', desc: 'Built with privacy and healthcare data security in mind.' },
            ].map((f, i) => (
              <motion.div key={i} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
                className="rounded-2xl p-7 border flex flex-col gap-4 transition-all"
                style={{ background: C.card, borderColor: C.border, boxShadow: '0 2px 12px rgba(26,36,64,0.05)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: '#EEF3FF', color: C.blue }}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold" style={{ color: C.text }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 border-b" style={{ background: C.bgAlt, borderColor: C.border }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: C.text }}>
              How NovusAI Works
            </h2>
            <p className="text-base" style={{ color: C.textMuted }}>
              A simple 4-step workflow that integrates seamlessly into clinical patient care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: <Users className="w-5 h-5" />,    title: 'Upload Patient Information', desc: 'Input patient health records, blood pressure, cholesterol, and physiological data.' },
              { step: '02', icon: <Brain className="w-5 h-5" />,    title: 'AI Processes Health Data',   desc: 'Intelligent algorithms process multi-parametric health metrics in real time.' },
              { step: '03', icon: <Activity className="w-5 h-5" />, title: 'Risk Score Generated',       desc: 'Calculates precise cardiovascular risk score and identifies potential risk factors.' },
              { step: '04', icon: <Shield className="w-5 h-5" />,   title: 'Clinical Decision Support',  desc: 'Provides actionable recommendations to support early clinical diagnosis.' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-6 border space-y-4"
                style={{ background: C.card, borderColor: C.border, boxShadow: '0 2px 10px rgba(26,36,64,0.05)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg"
                    style={{ background: '#EEF3FF', color: C.navy }}>
                    Step {s.step}
                  </span>
                  <span style={{ color: C.label }}>{s.icon}</span>
                </div>
                <h3 className="text-base font-bold" style={{ color: C.text }}>{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: C.textMuted }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. STATISTICS ────────────────────────────────────────────────── */}
      <section className="py-20 border-b" style={{ background: C.card, borderColor: C.border }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10,000+', label: 'Patient Records' },
              { value: '95%',     label: 'Prediction Accuracy' },
              { value: '50+',     label: 'Healthcare Professionals' },
              { value: '24/7',    label: 'System Availability' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}
                className="space-y-2">
                <div className="text-4xl sm:text-5xl font-extrabold tracking-tight"
                  style={{ color: C.navy }}>{s.value}</div>
                <p className="text-sm font-semibold" style={{ color: C.textMuted }}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. WHY CHOOSE ────────────────────────────────────────────────── */}
      <section id="why-choose" className="py-24 border-b" style={{ background: C.bgAlt, borderColor: C.border }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left checklist */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg border"
                  style={{ background: '#EEF3FF', color: C.navy, borderColor: '#C7D7F8' }}>
                  Why Choose NovusAI
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: C.text }}>
                  Intelligent Risk Screening Built for Healthcare
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>
                  Combining medical precision with advanced machine learning to deliver fast, reliable, and secure patient risk evaluations.
                </p>
              </div>
              <div className="space-y-3">
                {['AI-Powered Screening','Early Disease Detection','Fast Predictions','Secure Patient Data','Accurate Risk Assessment','Modern Dashboard'].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3.5 rounded-xl border"
                    style={{ background: C.card, borderColor: C.border, boxShadow: '0 1px 6px rgba(26,36,64,0.05)' }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: '#EEF3FF' }}>
                      <CheckCircle2 className="w-4 h-4" style={{ color: C.blue }} />
                    </div>
                    <span className="text-sm font-bold" style={{ color: C.text }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Dashboard mockup */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl shadow-xl border overflow-hidden"
                style={{ background: C.navy, border: `1px solid ${C.navyDark}` }}>
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b"
                  style={{ background: C.navyDark, borderColor: 'rgba(255,255,255,0.08)' }}>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px] font-mono text-white/50 ml-2">novusai.health/dashboard</span>
                </div>

                {/* Dashboard content */}
                <div className="p-5 space-y-5" style={{ background: C.card }}>
                  <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: C.border }}>
                    <div>
                      <h4 className="text-sm font-bold" style={{ color: C.text }}>Cardiovascular Analytics Dashboard</h4>
                      <p className="text-[11px]" style={{ color: C.textMuted }}>Real-Time Patient Risk Telemetry</p>
                    </div>
                    <span className="px-2.5 py-1 text-white text-[11px] font-bold rounded-lg"
                      style={{ background: `linear-gradient(135deg,${C.blue},${C.purple})` }}>
                      System Active
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Avg BP Index',   value: '124 / 82', pct: '66%', color: C.blue   },
                      { label: 'High Risk Rate', value: '14.2%',    pct: '33%', color: '#EF4444' },
                      { label: 'Inference Time', value: '<100 ms',  pct: '25%', color: '#22C55E' },
                    ].map(m => (
                      <div key={m.label} className="p-3 rounded-xl border" style={{ background: C.inputBg, borderColor: C.border }}>
                        <span className="text-[10px] font-medium" style={{ color: C.label }}>{m.label}</span>
                        <p className="text-base font-bold mt-0.5" style={{ color: C.text }}>{m.value}</p>
                        <div className="w-full h-1.5 rounded-full mt-2" style={{ background: C.border }}>
                          <div className="h-1.5 rounded-full" style={{ width: m.pct, background: m.color }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.label }}>Recent Patient Records</span>
                    <div className="rounded-xl overflow-hidden border divide-y" style={{ borderColor: C.border }}>
                      <div className="flex items-center justify-between p-2.5 text-xs" style={{ background: C.inputBg }}>
                        <span className="font-semibold" style={{ color: C.text }}>#CRSS-1049 (Age 62)</span>
                        <span style={{ color: C.textMuted }}>Chol: 210 mg/dL</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold">Moderate</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 text-xs" style={{ background: C.card }}>
                        <span className="font-semibold" style={{ color: C.text }}>#CRSS-1050 (Age 45)</span>
                        <span style={{ color: C.textMuted }}>Chol: 180 mg/dL</span>
                        <span className="px-2 py-0.5 text-white rounded-md font-bold"
                          style={{ background: `linear-gradient(135deg,${C.blue},${C.purple})` }}>Low Risk</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. CTA ───────────────────────────────────────────────────────── */}
      <section id="contact" className="py-24" style={{ background: C.card }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="rounded-3xl p-10 sm:p-14 text-center text-white space-y-6"
            style={{ background: `linear-gradient(135deg,${C.navy},${C.navyDark})`, boxShadow: `0 8px 48px rgba(27,43,107,0.35)` }}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight">
              Start Intelligent Cardiovascular Screening Today
            </h2>
            <p className="text-base sm:text-lg max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Improve healthcare decisions with AI-powered cardiovascular risk prediction and early disease detection.
            </p>
            <button onClick={onStartScreening}
              className="inline-block font-extrabold text-sm px-9 py-4 rounded-xl transition-all cursor-pointer"
              style={{ background: 'white', color: C.navy, boxShadow: '0 4px 16px rgba(255,255,255,0.15)' }}>
              Get Started →
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
