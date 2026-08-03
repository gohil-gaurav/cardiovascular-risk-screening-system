import React, { useState, useEffect } from 'react';
import { Activity, Brain } from 'lucide-react';

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
      className={`sticky top-0 z-50 w-full transition-all duration-200 border-b`}
      style={{
        background: scrolled ? 'rgba(255, 255, 255, 0.95)' : '#FFFFFF',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderColor: '#DDE4EE',
        boxShadow: '0 1px 8px rgba(26, 36, 64, 0.06)'
      }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            if (onGoHome) onGoHome();
          }}
          className="flex items-center gap-3 group focus:outline-none cursor-pointer"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #3B7CF4, #6355F5)' }}
          >
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight" style={{ color: '#1B2B6B' }}>
            Novus<span style={{ color: '#3B7CF4' }}>AI</span>
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
                className="text-sm font-semibold transition-colors hover:opacity-100"
                style={{ color: '#637082' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1B2B6B')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#637082')}
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
            className="text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #3B7CF4, #6355F5)',
              boxShadow: '0 4px 16px rgba(59, 124, 244, 0.3)'
            }}
          >
            Get Started
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 focus:outline-none"
            style={{ color: '#1B2B6B' }}
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
        <div className="md:hidden border-b px-6 py-4 space-y-3" style={{ background: '#FFFFFF', borderColor: '#DDE4EE' }}>
          {!isScreeningPage && navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="block text-base font-semibold py-1"
              style={{ color: '#1B2B6B' }}
            >
              {link.name}
            </a>
          ))}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (onGetStarted) onGetStarted();
            }}
            className="w-full mt-2 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors text-center cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #3B7CF4, #6355F5)' }}
          >
            Get Started
          </button>
        </div>
      )}
    </header>
  );
}