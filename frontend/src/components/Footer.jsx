import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer({ onGetStarted, onGoHome }) {
  const handleNavClick = (e, href) => {
    e.preventDefault();
    if (onGoHome) onGoHome();
    setTimeout(() => {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <footer className="w-full border-t border-[#D2E2F0] py-10 text-[#556980] text-xs" style={{ background: '#EBF1F6' }}>
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left: Brand & Copyright */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-[#2563EB] fill-[#2563EB]" />
            <span className="font-semibold text-[#102A43]">Novus<span className="text-[#2563EB]">AI</span></span>
          </div>
          <span className="hidden sm:inline text-[#D0DFEC]">|</span>
          <span>© {new Date().getFullYear()} NovusAI. All rights reserved.</span>
        </div>

        {/* Center: Simplified Links */}
        <div className="flex items-center gap-6">
          <a
            href="#how-it-works"
            onClick={(e) => handleNavClick(e, '#how-it-works')}
            className="hover:text-[#2563EB] transition-colors"
          >
            How It Works
          </a>
          <a
            href="#who-its-for"
            onClick={(e) => handleNavClick(e, '#who-its-for')}
            className="hover:text-[#2563EB] transition-colors"
          >
            Who It's For
          </a>
          <a
            href="#why-it-matters"
            onClick={(e) => handleNavClick(e, '#why-it-matters')}
            className="hover:text-[#2563EB] transition-colors"
          >
            Our Purpose
          </a>
        </div>

        {/* Right: Contact */}
        <div>
          <span>Support: </span>
          <a
            href="mailto:support@novusai.health"
            className="text-[#2563EB] hover:underline"
          >
            support@novusai.health
          </a>
        </div>

      </div>
    </footer>
  );
}
