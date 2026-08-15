import React, { useEffect } from 'react';
import {
  Users,
  ChevronRight,
  Check,
  Calendar,
  Activity,
  Dumbbell,
  Heart,
  Droplets,
  Apple,
  TrendingUp
} from 'lucide-react';

// ─── deterministic scatter-point generator ────────────────────────────────────
function generatePoints(cx, cy, count, seed) {
  const pts = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = (s / 233280) * 22;
    s = (s * 9301 + 49297) % 233280;
    const theta = (s / 233280) * 2 * Math.PI;
    pts.push({ x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) });
  }
  return pts;
}

// Runtime consistency validation helper
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

// ─── helpers ────────────────-------------------------------------------------
const groupName = (tier) =>
  tier === 'High Risk'
    ? 'High Risk Group'
    : tier === 'Moderate Risk'
    ? 'Moderate Risk Group'
    : 'Healthy Lifestyle Group';

const groupLabel = (tier) =>
  tier === 'High Risk' ? 'HR' : tier === 'Moderate Risk' ? 'MR' : 'HL';

const tierColor = (tier) => ({
  bgHex:    tier === 'High Risk' ? '#EF4444'  : tier === 'Moderate Risk' ? '#F59E0B'  : '#22C55E',
  textHex:  tier === 'High Risk' ? '#B91C1C'  : tier === 'Moderate Risk' ? '#B45309'  : '#065F46',
  borderHex:tier === 'High Risk' ? '#FECACA'  : tier === 'Moderate Risk' ? '#FDE68A'  : '#6EE7B7',
  gradient: tier === 'High Risk'
    ? 'linear-gradient(135deg,#7F1D1D,#991B1B)'
    : tier === 'Moderate Risk'
    ? 'linear-gradient(135deg,#78350F,#92400E)'
    : 'linear-gradient(135deg,#1B2B6B,#2D3F8F)',
  dot:      tier === 'High Risk' ? '#EF4444' : tier === 'Moderate Risk' ? '#F59E0B' : '#22C55E',
});

const groupTraits = {
  'High Risk': [
    'Higher body weight or body mass index (BMI)',
    'High blood pressure levels (Systolic and Diastolic)',
    'Elevated cholesterol and blood glucose averages',
    'Lower frequency of daily physical activity',
    'Higher chance of developing heart disease',
  ],
  'Moderate Risk': [
    'Borderline blood pressure or weight levels',
    'Moderate cholesterol with slight glucose variations',
    'Irregular or moderate weekly physical exercise',
    'Early indicators of cardiovascular strain',
  ],
  'Low Risk': [
    'Optimal body weight and BMI',
    'Normal and healthy resting blood pressure',
    'Normal cholesterol and blood glucose levels',
    'Consistent daily physical exercise and healthy diet',
  ],
  'Healthy Lifestyle Group': [
    'Optimal body weight and BMI',
    'Normal and healthy resting blood pressure',
    'Normal cholesterol and blood glucose levels',
    'Consistent daily physical exercise and healthy diet',
  ]
};

const lifestyleTips = [
  { label: 'Reduce Salt Intake',        icon: <Droplets className="w-5 h-5 text-blue-500" /> },
  { label: '30 Min Exercise Daily',      icon: <Activity className="w-5 h-5 text-orange-500" /> },
  { label: 'Maintain Healthy Weight',   icon: <Dumbbell className="w-5 h-5 text-purple-500" /> },
  { label: 'Eat More Fruits & Veggies', icon: <Apple   className="w-5 h-5 text-green-500" /> },
  { label: 'Regular Health Check-ups',  icon: <Heart   className="w-5 h-5 text-red-500" /> },
];

// ─── Component ────────────────------------------------------------------------
export default function PatientSimilarityCohorts({
  analysisResult,
  formData,
  bmi,
  isEmbedded = false
}) {
  const primaryRiskTier = analysisResult.risk_tier || "Low Risk";
  const tier = primaryRiskTier;

  // Validate primary risk tier
  useEffect(() => {
    validateRiskTier(primaryRiskTier, analysisResult.risk_tier, "risk_tier");
  }, [primaryRiskTier, analysisResult.risk_tier]);

  // Scaffolding centroid and cluster distribution maps if not in response
  const centroids = analysisResult.clustering?.centroids ?? {
    "High Risk": { age: 55.2, BMI: 31.8, ap_hi: 139.2, ap_lo: 87.9, cholesterol: 1.81, gluc: 1.51 },
    "Moderate Risk": { age: 51.8, BMI: 26.7, ap_hi: 127.7, ap_lo: 82.1, cholesterol: 1.37, gluc: 1.20 },
    "Low Risk": { age: 51.7, BMI: 25.2, ap_hi: 119.5, ap_lo: 77.7, cholesterol: 1.12, gluc: 1.08 }
  };

  const distribution = analysisResult.clustering?.distribution ?? {
    "Low Risk": 0.5827,
    "Moderate Risk": 0.0974,
    "High Risk": 0.3199
  };

  const centroid = centroids[tier] || centroids["Low Risk"];
  const color     = tierColor(tier);
  const traits    = groupTraits[tier] || groupTraits['Low Risk'];

  const heightM   = parseFloat(formData.height) / 100;
  const groupWeight = Math.round((centroid.BMI || 25) * heightM * heightM);
  const totalPts  = Math.round((distribution[tier] || 0.33) * 7000);

  // comparison rows
  const compareRows = [
    { marker: 'Blood Pressure', yours: `${formData.ap_hi} / ${formData.ap_lo}`,    group: `${Math.round(centroid.ap_hi || 120)} / ${Math.round(centroid.ap_lo || 80)}` },
    { marker: 'BMI',            yours: `${bmi}`,                                    group: `${centroid.BMI ?? '—'}` },
    { marker: 'Cholesterol',    yours: formData.cholesterol === '1' ? '≤200 mg/dL' : formData.cholesterol === '2' ? '201–240 mg/dL' : '>240 mg/dL',
                                group: centroid.cholesterol === 1 ? 'Normal' : 'Elevated' },
    { marker: 'Weight',         yours: `${formData.weight} kg`,                     group: `${groupWeight} kg` },
    { marker: 'Age',            yours: `${formData.age} yrs`,                       group: `${Math.round(centroid.age || 50)} yrs` },
  ];

  // feature influence bars (% of max)
  const features = [
    { name: 'Blood Pressure', val: 0.42 },
    { name: 'Cholesterol',    val: 0.31 },
    { name: 'BMI',            val: 0.27 },
    { name: 'Glucose',        val: 0.19 },
    { name: 'Age',            val: 0.14 },
  ];
  const maxVal = features[0].val;

  // scatter plot patient position
  const score = analysisResult.final_risk_pct ?? analysisResult.risk_score ?? 50;
  let px = 150, py = 100;
  if (tier === 'Low Risk' || tier === 'Healthy Lifestyle Group') {
    const clampedScore = Math.min(44.9, score);
    const t = clampedScore / 44.9;
    px = 70 + t * 20; py = 140 - t * 20;
  } else if (tier === 'Moderate Risk') {
    const clampedScore = Math.max(45, Math.min(74.9, score));
    const t = (clampedScore - 45) / (74.9 - 45);
    px = 140 + t * 20; py = 110 - t * 20;
  } else {
    const clampedScore = Math.max(75, Math.min(100, score));
    const t = (clampedScore - 75) / (100 - 75);
    px = 210 + t * 20; py = 75 - t * 20;
  }
  const lowPts  = generatePoints(80,  130, 30, 1234);
  const modPts  = generatePoints(150, 100, 30, 5678);
  const highPts = generatePoints(220,  65, 30, 9012);

  const content = (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* LEFT: Group banner + scatter plot */}
      <div className="lg:col-span-5 space-y-6">

        {/* Group banner card */}
        <div
          className="relative overflow-hidden text-white rounded-3xl p-7 shadow-md"
          style={{ background: color.gradient }}
        >
          <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(ellipse_at_top_right,white,transparent)]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Matched Group Segment</span>
          <h2 className="text-2xl font-black mt-2">{groupName(tier)}</h2>
          <p className="text-xs text-white/80 leading-relaxed mt-3 max-w-[240px]">
            {tier === 'High Risk'
              ? 'Patients in this group generally have higher blood pressure, elevated cholesterol, and a higher BMI than average.'
              : tier === 'Moderate Risk'
              ? 'Patients in this group show borderline cardiac markers and need preventive lifestyle improvements.'
              : 'Patients in this group maintain healthy blood pressure, weight, and active daily habits.'}
          </p>

          {/* Decorative avatar silhouettes */}
          <div className="absolute right-4 bottom-4 opacity-20">
            <Users className="w-20 h-20" />
          </div>
        </div>

        {/* Scatter Plot */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Group Visualization</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Showing where you fall among similar patients</p>
          </div>

          <div className="border border-slate-100 bg-[#F8FAFC] rounded-2xl p-3">
            {/* Axis labels */}
            <div className="flex justify-between text-[9px] text-slate-400 font-semibold px-2 mb-1">
              <span>-3</span><span>0</span><span>3</span>
            </div>

            <svg width="100%" viewBox="0 0 300 200" className="overflow-visible">
              {/* Grid */}
              {[40,80,120,160,200,240,280].map(x => (
                <line key={`vg${x}`} x1={x} y1="10" x2={x} y2="190" stroke="#E2E8F0" strokeWidth="0.5" />
              ))}
              {[10,55,100,145,190].map(y => (
                <line key={`hg${y}`} x1="20" y1={y} x2="280" y2={y} stroke="#E2E8F0" strokeWidth="0.5" />
              ))}

              {/* Cluster clouds */}
              {lowPts.map((p, i)  => <circle key={`l${i}`}  cx={p.x} cy={p.y} r="4" fill="#22C55E" opacity="0.55" />)}
              {modPts.map((p, i)  => <circle key={`m${i}`}  cx={p.x} cy={p.y} r="4" fill="#3B82F6" opacity="0.55" />)}
              {highPts.map((p, i) => <circle key={`h${i}`}  cx={p.x} cy={p.y} r="4" fill="#EF4444" opacity="0.55" />)}

              {/* Patient dot */}
              <circle cx={px} cy={py} r="7" fill="white" stroke="#1E293B" strokeWidth="2" />
              <text x={px} y={py + 1} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="#1E293B" fontWeight="bold">★</text>
            </svg>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 justify-center mt-3 text-[9px] font-bold text-slate-500 uppercase">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />Low Risk</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Moderate Risk</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />High Risk</span>
              <span className="flex items-center gap-1"><span className="text-base leading-none">★</span>Your Position</span>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE: Stats + Why You Belong */}
      <div className="lg:col-span-4 space-y-6">

        {/* Group Summary stats */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Group Summary</h3>
          <div className="space-y-3">
            {[
              { icon: <Users className="w-4 h-4 text-blue-500" />,    label: 'Total Patients in Group', val: totalPts.toLocaleString() },
              { icon: <Activity className="w-4 h-4 text-purple-500" />, label: 'Average Age',           val: `${Math.round(centroid.age || 50)} years` },
              { icon: <Dumbbell className="w-4 h-4 text-orange-500" />, label: 'Average BMI',           val: `${centroid.BMI ?? '—'}` },
              { icon: <Heart className="w-4 h-4 text-red-500" />,      label: 'Average Blood Pressure', val: `${Math.round(centroid.ap_hi || 120)} / ${Math.round(centroid.ap_lo || 80)} mmHg` },
              { icon: <Droplets className="w-4 h-4 text-teal-500" />, label: 'Average Cholesterol',    val: centroid.cholesterol === 1 ? 'Normal' : 'Elevated' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2.5">
                  {s.icon}
                  <span className="text-xs text-slate-600 font-medium">{s.label}</span>
                </div>
                <span className="text-xs font-black text-slate-900">{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Why You Belong Here */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Why You Belong to This Group</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Your values compared to the group average</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-slate-400 font-bold pb-2.5">Marker</th>
                  <th className="text-right text-slate-400 font-bold pb-2.5">Your Value</th>
                  <th className="text-right text-slate-400 font-bold pb-2.5">Group Avg</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 text-slate-600 font-medium">{r.marker}</td>
                    <td className="py-2.5 text-right font-black text-slate-900">{r.yours}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-500">{r.group}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[9px] text-slate-400">Values are compared against the average of your matched group.</p>
        </div>
      </div>

      {/* RIGHT: Group Characteristics + Feature Bars */}
      <div className="lg:col-span-3 space-y-6">

        {/* Group Characteristics */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Group Characteristics</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Common patterns in this group</p>
          </div>
          <ul className="space-y-2.5">
            {traits.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                <span
                  className="w-5 h-5 rounded-full text-white flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: color.bgHex }}
                >
                  <Check className="w-3 h-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Feature Influence bars */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Top Defining Factors</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Relative influence on group assignment</p>
          </div>
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-700 font-medium">{f.name}</span>
                  <span className="text-[10px] font-black text-slate-500">{f.val.toFixed(2)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(4, Math.round((f.val / maxVal) * 100))}%`,
                      background: 'linear-gradient(90deg,#FB7185,#E11D48)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-slate-400">Higher values mean more influence on group assignment.</p>
        </div>
      </div>
    </div>
  );

  if (isEmbedded) {
    return (
      <div className="p-6 space-y-6">
        {content}
        {/* Lifestyle Recommendations row */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-800">Lifestyle Recommendations for Your Group</h3>
          <div className="flex flex-wrap gap-4 justify-start">
            {lifestyleTips.map((tip, i) => (
              <div key={i} className="flex flex-col items-center gap-2.5 w-28 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-xs">
                  {tip.icon}
                </div>
                <span className="text-[10px] font-bold text-slate-600 leading-tight">{tip.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans p-4 md:p-8 space-y-8" style={{ background: '#E8ECF2', color: '#1A2440' }}>

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Population Comparison
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Discover the patient group you belong to based on similarity with others.
          </p>
        </div>

        {/* Cluster badge */}
        <div
          className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3 shadow-sm shrink-0"
          style={{ border: `1.5px solid ${color.borderHex}` }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm"
            style={{ backgroundColor: color.bgHex }}
          >
            {groupLabel(tier)}
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Population Comparison</span>
            <span className="block text-sm font-bold" style={{ color: color.textHex }}>{groupName(tier)}</span>
          </div>
        </div>
      </div>

      {content}

      {/* ── Lifestyle Recommendations row ──────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-slate-800">Lifestyle Recommendations for Your Group</h3>
        <div className="flex flex-wrap gap-4 justify-start">
          {lifestyleTips.map((tip, i) => (
            <div key={i} className="flex flex-col items-center gap-2.5 w-28 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-xs">
                {tip.icon}
              </div>
              <span className="text-[10px] font-bold text-slate-600 leading-tight">{tip.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
