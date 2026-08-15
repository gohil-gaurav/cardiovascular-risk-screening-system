import React from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Stethoscope,
  Users,
  ArrowRight,
  ClipboardList,
  MessageSquare,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

function HeartModel() {
  const meshRef = React.useRef();
  const texture = useLoader(THREE.TextureLoader, '/heart_illustration_transparent.png');

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      
      // Stop automatic X/Y rotation sways (remain forward-facing and straight by default)
      meshRef.current.rotation.y = 0;
      meshRef.current.rotation.x = 0;

      // Z-axis correction to keep the heart upright
      meshRef.current.rotation.z = -0.15; // ~ -9 degrees to straighten the tilt
      
      // 3. Heartbeat pulse animation (lub-dub rhythm, 2.6s cycle)
      const cycle = (t % 2.6) / 2.6;
      let pulse = 1.0;
      if (cycle < 0.25) {
        pulse = 1.0 + Math.sin((cycle / 0.25) * Math.PI) * 0.055;
      } else if (cycle >= 0.33 && cycle < 0.58) {
        pulse = 1.0 + Math.sin(((cycle - 0.33) / 0.25) * Math.PI) * 0.035;
      }
      meshRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group position={[0, 0.2, 0]}>
      <mesh ref={meshRef}>
        <planeGeometry args={[6.0, 5.3]} />
        <meshBasicMaterial 
          map={texture} 
          transparent={true} 
          depthWrite={false}
          side={THREE.DoubleSide} 
        />
      </mesh>
    </group>
  );
}

export default function LandingPage({ onStartScreening }) {
  const [webglSupported, setWebglSupported] = React.useState(true);

  React.useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const supported = !!(
        window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      setWebglSupported(supported);
    } catch (e) {
      setWebglSupported(false);
    }
  }, []);

  return (
    <div className="w-full font-sans selection:bg-[#D2E2F0] selection:text-[#0F2C59]" style={{ background: '#EBF1F6', color: '#2C3B4E' }}>
      
      {/* ── 1. HERO SECTION ────────────────────────────────────────────────── */}
      <section id="home" className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28 border-b border-[#D2E2F0]" style={{ background: '#EBF1F6' }}>
        {/* Ambient lighting reflections */}
        <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-white rounded-full filter blur-[120px] opacity-50 -z-10 pointer-events-none" />
        <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] bg-[#FAFBFD] rounded-full filter blur-[100px] opacity-40 -z-10 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left: Headline & Subtext */}
            <motion.div 
              initial="hidden" 
              animate="visible" 
              variants={staggerContainer}
              className="lg:col-span-7 space-y-6 text-left"
            >
              <motion.div 
                variants={fadeUp}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border border-[#D2E2F0] bg-white text-[#2563EB] shadow-sm"
              >
                <Heart className="w-3.5 h-3.5 fill-[#2563EB] text-[#2563EB]" />
                NovusAI Heart Health
              </motion.div>

              <motion.h1 
                variants={fadeUp}
                className="text-4xl md:text-5xl font-bold tracking-tight text-[#102A43] leading-[1.15]"
              >
                Know Your Heart Health <span className="text-[#2563EB]">in Minutes</span>
              </motion.h1>

              <motion.p 
                variants={fadeUp}
                className="text-base md:text-lg text-[#4A5F73] leading-relaxed max-w-xl font-medium"
              >
                NovusAI helps healthcare workers screen cardiovascular risk and explain results clearly to patients, especially in rural clinics with limited access to specialists.
              </motion.p>

              <motion.div 
                variants={fadeUp}
                className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
              >
                <button 
                  onClick={onStartScreening}
                  className="inline-flex items-center justify-center gap-2 bg-[#102A43] hover:bg-[#071624] text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer text-base"
                >
                  Check Risk Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </motion.div>

            {/* Right: Interactive 3D Heart Visual */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="lg:col-span-5 flex justify-center items-center relative w-full h-[320px] md:h-[400px]"
            >
              {webglSupported ? (
                <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
                  <Canvas
                    camera={{ position: [0, 0, 3.2], fov: 50 }}
                    gl={{ alpha: true, antialias: true }}
                    style={{ background: 'transparent' }}
                  >
                    <ambientLight intensity={1.2} />
                    <directionalLight position={[5, 5, 5]} intensity={1.8} />
                    <pointLight position={[-5, -5, -5]} intensity={0.8} color="#93C5FD" />
                    
                    <React.Suspense fallback={null}>
                      <HeartModel />
                    </React.Suspense>
                  </Canvas>
                </div>
              ) : (
                <div className="w-80 h-80 flex items-center justify-center relative overflow-visible" style={{ perspective: 1000 }}>
                  <div className="absolute inset-0 bg-radial from-white/40 to-transparent opacity-60 -z-10" />
                  <motion.img 
                    src="/heart_illustration_transparent.png" 
                    alt="Heart" 
                    className="w-72 h-72 object-contain select-none z-10"
                    animate={{ 
                      rotateY: [-35, 35, -35],
                      rotateZ: -12,
                      y: [-8, 8, -8]
                    }}
                    transition={{ 
                      rotateY: { repeat: Infinity, duration: 8, ease: "easeInOut" },
                      y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                    }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. HOW IT WORKS ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 border-b border-[#D2E2F0]" style={{ background: '#EBF1F6' }}>
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-bold text-[#102A43]">How It Works</h2>
            <p className="text-[#4A5F73] text-sm md:text-base font-medium">
              A straightforward process that gets you clear answers in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: <ClipboardList className="w-5 h-5 text-[#2563EB]" />,
                bg: 'bg-[#E6F0FA]',
                title: 'Enter Patient Details',
                desc: 'Input basic details like age, blood pressure, cholesterol levels, and general daily habits.',
              },
              {
                step: '2',
                icon: <Activity className="w-5 h-5 text-[#E06A55]" />,
                bg: 'bg-[#FDF2F0]',
                title: 'Get Instant Risk Rating',
                desc: 'See a clear risk result showing if a check-up or specialist care is recommended.',
              },
              {
                step: '3',
                icon: <MessageSquare className="w-5 h-5 text-[#2563EB]" />,
                bg: 'bg-[#E6F0FA]',
                title: 'See Simple Explanation',
                desc: 'Read a plain-language summary to explain the results clearly to the patient, like a doctor would.',
              },
            ].map((s, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-xl p-6 border border-[#D2E2F0] shadow-[0_4px_20px_rgba(16,42,67,0.02)] flex flex-col items-start space-y-4"
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                    {s.icon}
                  </div>
                  <span className="text-2xl font-bold text-[#D0DFEC]">0{s.step}</span>
                </div>
                <h3 className="text-base font-bold text-[#102A43]">{s.title}</h3>
                <p className="text-xs md:text-sm text-[#556980] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. WHO IT'S FOR ────────────────────────────────────────────────── */}
      <section id="who-its-for" className="py-20 border-b border-[#D2E2F0]" style={{ background: '#EBF1F6' }}>
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-[#102A43]">Who It's For</h2>
            <p className="text-[#4A5F73] text-sm md:text-base font-medium">
              Providing clarity and support for everyone involved in cardiovascular checks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card for Doctors/Clinic Staff */}
            <div className="bg-white rounded-2xl p-8 border border-[#D2E2F0] shadow-[0_4px_20px_rgba(16,42,67,0.02)] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#E6F0FA] flex items-center justify-center text-[#2563EB]">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#102A43]">Doctors & Clinic Staff</h3>
                <p className="text-sm md:text-base text-[#556980] leading-relaxed">
                  Screen patient risk quickly during visits and guide treatment paths with confidence, especially in clinics far from heart specialists.
                </p>
              </div>
              <div className="text-xs font-semibold text-[#102A43] bg-[#E6F0FA] py-2 px-3.5 rounded-lg inline-block w-fit">
                Screen risk in minutes during routine visits
              </div>
            </div>

            {/* Card for Patients */}
            <div className="bg-white rounded-2xl p-8 border border-[#D2E2F0] shadow-[0_4px_20px_rgba(16,42,67,0.02)] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#FDF2F0] flex items-center justify-center text-[#E06A55]">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#102A43]">Patients & Families</h3>
                <p className="text-sm md:text-base text-[#556980] leading-relaxed">
                  Understand your cardiovascular health in warm, clear, and reassuring language without confusing terms.
                </p>
              </div>
              <div className="text-xs font-semibold text-[#E06A55] bg-[#FDF2F0] py-2 px-3.5 rounded-lg inline-block w-fit">
                Get clear, jargon-free health updates
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. OUR PURPOSE ───────────────────────────────────────── */}
      <section id="why-it-matters" className="py-20 border-b border-[#D2E2F0]" style={{ background: '#EBF1F6' }}>
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <div className="bg-white border border-[#D2E2F0] rounded-3xl p-8 md:p-12 shadow-[0_4px_24px_rgba(16,42,67,0.02)] space-y-6">
            <div className="w-12 h-12 bg-[#FDF2F0] rounded-full flex items-center justify-center mx-auto border border-[#D2E2F0]">
              <Heart className="w-6 h-6 text-[#E06A55] fill-[#E06A55]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#102A43] max-w-2xl mx-auto">
              Supporting Clinics Where Care is Needed Most
            </h2>
            <p className="text-sm md:text-base text-[#556980] leading-relaxed max-w-2xl mx-auto">
              This screening tool is built to support local healthcare workers in communities with limited access to heart specialists. It does not replace a doctor's diagnosis, but helps identify risk early and guides patients toward necessary care, giving clinics a reliable assistant.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
