import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { FileUpload } from './components/FileUpload';
import { ComplianceReport } from './components/ComplianceReport';
import { SecurityFindings } from './components/SecurityFindings';
import { AccessibilityReport } from './components/AccessibilityReport';

export type ViewType = 'dashboard' | 'upload' | 'compliance' | 'security' | 'accessibility';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard uploadedFiles={uploadedFiles} />;
      case 'upload':
        return <FileUpload onFileUpload={(fileName) => setUploadedFiles(prev => [...prev, fileName])} />;
      case 'compliance':
        return <ComplianceReport />;
      case 'security':
        return <SecurityFindings />;
      case 'accessibility':
        return <AccessibilityReport />;
      default:
        return <Dashboard uploadedFiles={uploadedFiles} />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 overflow-auto bg-muted/20">
        {renderView()}
      </main>
    </div>
  );
}