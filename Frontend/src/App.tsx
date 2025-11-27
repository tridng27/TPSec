import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import  FolderScan  from './components/FolderScan';

export type ViewType = 'dashboard' | 'scan';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [scannedFolders, setScannedFolders] = useState<string[]>([]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard uploadedFiles={scannedFolders} />;
      case 'scan':
        return <FolderScan onFolderScan={(folderPath) => setScannedFolders(prev => [...prev, folderPath])} />;
      default:
        return <Dashboard uploadedFiles={scannedFolders} />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1 overflow-auto bg-muted/20 relative">
        <div
          className={`absolute inset-0 ${currentView === 'dashboard' ? '' : 'hidden'}`}
        >
          <Dashboard uploadedFiles={scannedFolders} />
        </div>

        <div
          className={`absolute inset-0 ${currentView === 'scan' ? '' : 'hidden'}`}
        >
          <FolderScan
            onFolderScan={(folderPath) => setScannedFolders(prev => [...prev, folderPath])}
          />
        </div>
      </main>
    </div>
  );
}