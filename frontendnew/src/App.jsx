import React, { useState } from 'react';
import Sidebar from "./components/Sidebar.jsx";
import TopNavbar from "./components/TopNavbar.jsx";
import AuthScreen from "./components/AuthScreen.jsx";
import OnboardingScreen from "./components/OnboardingScreen.jsx";
import DiagnosticScreen from "./components/DiagnosticScreen.jsx";
import DashboardView from "./components/DashboardView.jsx";
import RoadmapView from "./components/RoadmapView.jsx";
import PracticeView from "./components/PracticeView.jsx";
import ResourcesView from "./components/ResourcesView.jsx";
import AnalyticsView from "./components/AnalyticsView.jsx";
import InstituteAdminView from "./components/InstituteAdminView.jsx";
import { initialUserData, learningModules } from "./data/platformData.js";

export default function App() {
  const [currentView, setCurrentView] = useState('auth'); // 'auth' | 'onboarding' | 'diagnostic' | 'dashboard'
  const [activeNav, setActiveNav] = useState('dashboard');
  const [userData, setUserData] = useState(initialUserData);
  const [modules, setModules] = useState(learningModules);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Top Navbar */}
      <TopNavbar userData={userData} currentView={currentView} setCurrentView={setCurrentView} />

      {/* Main Body */}
      {currentView === 'auth' ? (
        <AuthScreen onComplete={() => setCurrentView('onboarding')} />
      ) : currentView === 'onboarding' ? (
        <OnboardingScreen onComplete={() => setCurrentView('diagnostic')} />
      ) : currentView === 'diagnostic' ? (
        <DiagnosticScreen onComplete={() => setCurrentView('dashboard')} />
      ) : (
        /* Full Platform App Dashboard Layout */
        <div className="flex flex-1">
          <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />
          
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {activeNav === 'dashboard' && <DashboardView userData={userData} modules={modules} onNavigate={setActiveNav} />}
            {activeNav === 'roadmap' && <RoadmapView modules={modules} />}
            {activeNav === 'practice' && <PracticeView />}
            {activeNav === 'resources' && <ResourcesView />}
            {activeNav === 'analytics' && <AnalyticsView userData={userData} />}
            {activeNav === 'institute' && <InstituteAdminView />}
            {(activeNav === 'planner' || activeNav === 'careers' || activeNav === 'badges') && (
              <DashboardView userData={userData} modules={modules} onNavigate={setActiveNav} />
            )}
          </main>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#060a12] py-4 text-center text-xs text-slate-500">
        AI Upskilling Platform • Learning Modules & Resources
      </footer>

    </div>
  );
}