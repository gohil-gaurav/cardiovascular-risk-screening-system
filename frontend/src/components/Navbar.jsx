import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

export default function Navbar({ onGetStarted, onGoHome, isScreeningPage }) {
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
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'About', href: '#why-choose' },
    { name: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (isScreeningPage && onGoHome) {
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
      className={`sticky top-0 z-50 w-full transition-all duration-200 border-b border-[#E4E9E5] ${
        scrolled ? 'bg-[#FAFAF5]/95 backdrop-blur-md shadow-xs' : 'bg-[#FAFAF5]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            if (onGoHome) onGoHome();
          }}
          className="flex items-center gap-2.5 group focus:outline-none cursor-pointer"
        >
          <img src="/logo.jpeg" alt="NovusAI Logo" className="w-14 h-14 object-contain rounded-lg transition-transform group-hover:scale-105" />
          <span className="text-xl font-bold tracking-tight text-[#003631]">
            Novus<span className="text-[#003631]">AI</span>
          </span>
        </a>

        {/* Center: Desktop Navigation */}
        {!isScreeningPage && (
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm font-semibold text-[#003631]/70 hover:text-[#003631] transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>
        )}

        {/* Right: Primary Button */}
        <div className="hidden md:flex items-center">
          <button
            onClick={onGetStarted}
            className="bg-[#003631] hover:bg-[#002623] text-[#FFEDA8] text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            Get Started
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[#003631] hover:text-[#002623] p-2 focus:outline-none"
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
        <div className="md:hidden bg-[#FAFAF5] border-b border-[#E4E9E5] px-6 py-4 space-y-3">
          {!isScreeningPage && navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="block text-base font-semibold text-[#003631]/80 hover:text-[#003631] py-1"
            >
              {link.name}
            </a>
          ))}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (onGetStarted) onGetStarted();
            }}
            className="w-full mt-2 bg-[#003631] hover:bg-[#002623] text-[#FFEDA8] text-sm font-bold px-5 py-2.5 rounded-xl transition-colors text-center cursor-pointer"
          >
            Get Started
          </button>
        </div>
      )}
    </header>
  );
}