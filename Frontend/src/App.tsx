import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { RealTimeProtection }  from './components/RealTimeProtection';
import { Settings } from './components/Settings';
import  FolderScan  from './components/FolderScan';

export type ViewType = 'dashboard' | 'scan'| 'realtime'| 'settings';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    // Initialize from localStorage or default to false
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
    // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save to localStorage
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleDarkModeChange = (enabled: boolean) => {
    setDarkMode(enabled);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1 overflow-auto bg-muted/20 relative">
        <div
          className={`absolute inset-0 ${currentView === 'dashboard' ? '' : 'hidden'}`}
        >
          <Dashboard/>
        </div>
        <div
          className={`absolute inset-0 ${currentView === 'scan' ? '' : 'hidden'}`}
        >
          <FolderScan/>
        </div>
        <div
          className={`absolute inset-0 ${currentView === 'realtime' ? '' : 'hidden'}`}
        >
          <RealTimeProtection/>
        </div>

        <div className={`absolute inset-0 ${currentView === 'settings' ? '' : 'hidden'}`}>
          <Settings darkMode={darkMode} onDarkModeChange={handleDarkModeChange} />
        </div>
      </main>
    </div>
  );
}