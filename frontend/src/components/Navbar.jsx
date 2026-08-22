import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

export default function Navbar({ onGetStarted, onGoHome, onOpenRecords, isScreeningPage, isRecordsPage }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: "Who It's For", href: '#who-its-for' },
    { name: 'Our Purpose', href: '#why-it-matters' },
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if ((isScreeningPage || isRecordsPage) && onGoHome) {
      onGoHome();
      setTimeout(() => {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    const element = document.querySelector(href);
    if (element) {
      const navHeight = 72;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navHeight,
        behavior: 'smooth',
      });
    } else if (href === '#home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header
      className="sticky top-0 z-50 w-full transition-all duration-200 border-b"
      style={{
        background: scrolled ? 'rgba(235, 241, 246, 0.95)' : '#EBF1F6',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderColor: '#D2E2F0',
        boxShadow: scrolled ? '0 4px 20px rgba(16, 42, 67, 0.02)' : 'none',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
        
        {/* Left: Brand Logo & Wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            if (onGoHome) onGoHome();
          }}
          className="flex items-center gap-2.5 group focus:outline-none cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center transition-transform group-hover:scale-[1.02] border border-[#D2E2F0] shadow-sm">
            <Heart className="w-5 h-5 text-[#2563EB] fill-[#2563EB]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#102A43]">
            Novus<span className="text-[#2563EB]">AI</span>
          </span>
        </a>

        {/* Center: Desktop Navigation */}
        {!isScreeningPage && !isRecordsPage && (
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm font-semibold transition-colors text-[#556980] hover:text-[#2563EB]"
              >
                {link.name}
              </a>
            ))}
          </nav>
        )}

        {/* Right: Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onOpenRecords}
            className="border border-[#D2E2F0] bg-white hover:bg-[#EBF1F6] text-[#102A43] text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Doctor Portal (Records)
          </button>

          <button
            onClick={onGetStarted}
            className="bg-[#102A43] hover:bg-[#071624] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            Check Risk Now
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 focus:outline-none text-[#102A43]"
            aria-label="Toggle Navigation"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b px-6 py-4 space-y-3 bg-[#EBF1F6] border-[#D2E2F0]">
          {!isScreeningPage && !isRecordsPage && navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="block text-sm font-semibold py-1.5 text-[#556980] hover:text-[#2563EB]"
            >
              {link.name}
            </a>
          ))}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (onOpenRecords) onOpenRecords();
            }}
            className="w-full border border-[#D2E2F0] bg-white hover:bg-[#EBF1F6] text-[#102A43] text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors text-center cursor-pointer"
          >
            Doctor Portal (Records)
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (onGetStarted) onGetStarted();
            }}
            className="w-full bg-[#102A43] hover:bg-[#071624] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors text-center cursor-pointer"
          >
            Check Risk Now
          </button>
        </div>
      )}
    </header>
  );
}