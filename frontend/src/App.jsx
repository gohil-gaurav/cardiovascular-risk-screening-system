import React, { useState } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ScreeningPage from './components/ScreeningPage';
import PatientRecords from './pages/PatientRecords';
import Footer from './components/Footer';

function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'screening' | 'records'

  const handleOpenScreening = () => {
    setCurrentPage('screening');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenRecords = () => {
    setCurrentPage('records');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF5] text-[#003631] flex flex-col font-sans selection:bg-[#FFEDA8] selection:text-[#003631]">
      {currentPage === 'home' ? (
        <>
          <Navbar
            onGetStarted={handleOpenScreening}
            onGoHome={handleGoHome}
            onOpenRecords={handleOpenRecords}
            isScreeningPage={false}
            isRecordsPage={false}
          />
          <main className="flex-1">
            <LandingPage onStartScreening={handleOpenScreening} />
          </main>
          <Footer onGetStarted={handleOpenScreening} onGoHome={handleGoHome} />
        </>
      ) : currentPage === 'screening' ? (
        <main className="flex-1">
          <ScreeningPage onBackToHome={handleGoHome} />
        </main>
      ) : (
        <>
          <Navbar
            onGetStarted={handleOpenScreening}
            onGoHome={handleGoHome}
            onOpenRecords={handleOpenRecords}
            isScreeningPage={false}
            isRecordsPage={true}
          />
          <main className="flex-1">
            <PatientRecords onBackToHome={handleGoHome} />
          </main>
        </>
      )}
    </div>
  );
}

export default App;