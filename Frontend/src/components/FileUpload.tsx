import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Upload, FileImage, CheckCircle, AlertCircle, X, Shield } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (fileName: string) => void;
}

interface UploadedFile {
  name: string;
  size: string;
  status: 'uploading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  issues?: number;
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const simulateFileProcessing = (fileName: string) => {
    const newFile: UploadedFile = {
      name: fileName,
      size: `${Math.floor(Math.random() * 5 + 1)}.${Math.floor(Math.random() * 9)}MB`,
      status: 'uploading',
      progress: 0,
    };

    setFiles(prev => [...prev, newFile]);
    onFileUpload(fileName);

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setFiles(prev => prev.map(file => {
        if (file.name === fileName && file.status === 'uploading') {
          const newProgress = file.progress + Math.random() * 30;
          if (newProgress >= 100) {
            clearInterval(uploadInterval);
            
            // Start analysis phase
            setTimeout(() => {
              setFiles(prev => prev.map(f => 
                f.name === fileName 
                  ? { ...f, status: 'analyzing', progress: 0 }
                  : f
              ));

              // Simulate analysis
              const analysisInterval = setInterval(() => {
                setFiles(prev => prev.map(f => {
                  if (f.name === fileName && f.status === 'analyzing') {
                    const newProgress = f.progress + Math.random() * 25;
                    if (newProgress >= 100) {
                      clearInterval(analysisInterval);
                      return { 
                        ...f, 
                        status: 'completed', 
                        progress: 100, 
                        issues: Math.floor(Math.random() * 8) 
                      };
                    }
                    return { ...f, progress: newProgress };
                  }
                  return f;
                }));
              }, 500);
            }, 1000);

            return { ...file, status: 'uploading', progress: 100 };
          }
          return { ...file, progress: newProgress };
        }
        return file;
      }));
    }, 200);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(file => {
      simulateFileProcessing(file.name);
    });
  }, [onFileUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(file => {
      simulateFileProcessing(file.name);
    });
  };

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <FileImage className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (file: UploadedFile) => {
    switch (file.status) {
      case 'uploading':
        return <Badge variant="outline">Uploading</Badge>;
      case 'analyzing':
        return <Badge variant="outline">Analyzing</Badge>;
      case 'completed':
        return (
          <div className="flex gap-2">
            <Badge variant="secondary">Complete</Badge>
            {file.issues && file.issues > 0 && (
              <Badge variant="destructive" className="text-xs">
                {file.issues} issues
              </Badge>
            )}
          </div>
        );
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-3 text-foreground">Upload Design Files</h1>
          <p className="text-lg text-muted-foreground">
            Secure upload for design mockups requiring compliance and security validation
          </p>
        </div>

        {/* Upload Area */}
        <Card className="shadow-sm border-2">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Secure Design File Upload</CardTitle>
                <CardDescription className="text-base mt-1">
                  Enterprise-grade encryption • Supported formats: .fig, .sketch, .xd, .pdf, .png, .jpg
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                isDragOver 
                  ? 'border-primary bg-primary/5 scale-[1.02]' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-6">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                Drop your design files here
              </h3>
              <p className="text-muted-foreground mb-6 text-base">
                Files are encrypted during transit and processing for maximum security
              </p>
              <Button size="lg" className="px-8 py-3" asChild>
                <label className="cursor-pointer">
                  Browse Files Securely
                  <input
                    type="file"
                    multiple
                    accept=".fig,.sketch,.xd,.pdf,.png,.jpg,.jpeg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Processing Files */}
        {files.length > 0 && (
          <Card className="shadow-sm border-2">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold">Processing Files</CardTitle>
              <CardDescription className="text-base">
                Files being securely uploaded and analyzed for compliance violations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {files.map((file, index) => (
                  <div key={index} className="border-2 rounded-xl p-6 bg-card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-muted">
                          {getStatusIcon(file.status)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-base">{file.name}</p>
                          <p className="text-sm text-muted-foreground">{file.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(file)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.name)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {(file.status === 'uploading' || file.status === 'analyzing') && (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground font-medium">
                            {file.status === 'uploading' ? 'Secure upload in progress...' : 'AI-powered compliance analysis...'}
                          </span>
                          <span className="font-semibold">{Math.round(file.progress)}%</span>
                        </div>
                        <Progress value={file.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security & Compliance Guidelines */}
        <Card className="shadow-sm border-2 bg-muted/20">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Security & Compliance Standards</CardTitle>
                <CardDescription className="text-base mt-1">
                  Industry-leading validation against financial services regulations
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Regulatory Standards
                </h4>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    PCI DSS (Payment Card Industry Data Security)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    SOX (Sarbanes-Oxley Act Compliance)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    GDPR (General Data Protection Regulation)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    WCAG 2.1 AA (Web Accessibility Guidelines)
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Security Validation
                </h4>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    Sensitive data field identification & masking
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    Required regulatory disclosure validation
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    Color contrast & accessibility compliance
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    Interactive element security assessment
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}