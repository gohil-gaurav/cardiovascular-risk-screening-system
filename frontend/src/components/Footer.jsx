import React from 'react';
import { Activity } from 'lucide-react';

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
    <footer className="bg-[#003631] text-[#FFEDA8] border-t border-[#002623]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-[#FFEDA8]/15">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <img src="/logo.jpeg" alt="NovusAI Logo" className="w-9 h-9 object-contain rounded-md" />
              <span className="text-xl font-bold tracking-tight text-white">
                Novus<span className="text-[#FFEDA8]">AI</span>
              </span>
            </div>
            <p className="text-sm text-[#FFEDA8]/70 leading-relaxed max-w-sm">
              Empowering healthcare professionals with intelligent cardiovascular risk prediction and early disease detection using machine learning.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-sm text-[#FFEDA8]/80">
              <li>
                <a
                  href="#features"
                  onClick={(e) => handleNavClick(e, '#features')}
                  className="hover:text-white transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#why-choose"
                  onClick={(e) => handleNavClick(e, '#why-choose')}
                  className="hover:text-white transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <button
                  onClick={onGetStarted}
                  className="hover:text-white transition-colors text-left font-bold text-[#FFEDA8] cursor-pointer"
                >
                  Risk Screening Engine →
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Social */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Resources & Privacy
            </h4>
            <ul className="space-y-2.5 text-sm text-[#FFEDA8]/80">
              <li>
                <a
                  href="#privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Privacy Policy: NovusAI adheres to strict HIPAA & GDPR data processing standards.");
                  }}
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  GitHub Repository
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FFEDA8]/60">
          <p>© 2027 NovusAI. All rights reserved.</p>
          <p>Designed for Hospitals, Clinicians & Healthcare Researchers</p>
        </div>
      </div>
    </footer>
  );
}
