import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { AlertTriangle, CheckCircle, Shield, Eye, FileCheck, Clock } from 'lucide-react';

interface DashboardProps {
  uploadedFiles: string[];
}

export function Dashboard({ uploadedFiles }: DashboardProps) {
  const complianceScore = 72;
  const securityScore = 85;
  const accessibilityScore = 78;

  const recentScans = [
    { name: 'Login_Flow_v2.fig', status: 'completed', issues: 3, timestamp: '10 min ago' },
    { name: 'Dashboard_Mobile.fig', status: 'scanning', issues: 0, timestamp: '5 min ago' },
    { name: 'Payment_Form.fig', status: 'completed', issues: 7, timestamp: '2 hours ago' },
  ];

  const criticalIssues = [
    { type: 'Security', description: 'Password field not properly masked in design', severity: 'Critical' },
    { type: 'Compliance', description: 'Missing required disclosure text for PCI DSS', severity: 'High' },
    { type: 'Accessibility', description: 'Color contrast ratio below WCAG AA standard', severity: 'Medium' },
  ];

  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-3 text-foreground">Compliance Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Enterprise-grade design validation status and compliance metrics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileCheck className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base font-semibold">Compliance Score</CardTitle>
                </div>
                <Badge variant={complianceScore >= 80 ? 'secondary' : 'destructive'} className="text-xs">
                  {complianceScore >= 80 ? 'Good' : 'Needs Attention'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold mb-3 text-foreground">{complianceScore}%</div>
              <Progress value={complianceScore} className="mb-3 h-2" />
              <p className="text-sm text-muted-foreground">
                SOX, PCI DSS, GDPR compliance standards
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Security Score</CardTitle>
                </div>
                <Badge variant={securityScore >= 80 ? 'secondary' : 'destructive'} className="text-xs">
                  {securityScore >= 80 ? 'Secure' : 'At Risk'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold mb-3 text-foreground">{securityScore}%</div>
              <Progress value={securityScore} className="mb-3 h-2" />
              <p className="text-sm text-muted-foreground">
                Data protection & privacy safeguards
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">Accessibility Score</CardTitle>
                </div>
                <Badge variant={accessibilityScore >= 80 ? 'secondary' : 'destructive'} className="text-xs">
                  {accessibilityScore >= 80 ? 'Accessible' : 'Needs Work'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold mb-3 text-foreground">{accessibilityScore}%</div>
              <Progress value={accessibilityScore} className="mb-3 h-2" />
              <p className="text-sm text-muted-foreground">
                WCAG 2.1 AA compliance standards
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Scans */}
          <Card className="shadow-sm border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Recent Scans</CardTitle>
              <CardDescription className="text-base">
                Latest design validation results and security assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recentScans.map((scan, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${scan.status === 'completed' ? 'bg-green-100' : 'bg-blue-100'}`}>
                        {scan.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{scan.name}</p>
                        <p className="text-sm text-muted-foreground">{scan.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {scan.issues > 0 && (
                        <Badge variant="destructive" className="px-3 py-1">
                          {scan.issues} issues
                        </Badge>
                      )}
                      <Badge 
                        variant={scan.status === 'completed' ? 'secondary' : 'outline'}
                        className="px-3 py-1 capitalize"
                      >
                        {scan.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Critical Issues */}
          <Card className="shadow-sm border-2 border-destructive/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-destructive">Critical Issues</CardTitle>
                  <CardDescription className="text-base">
                    Security vulnerabilities requiring immediate attention
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {criticalIssues.map((issue, index) => (
                  <div key={index} className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                    <div className="flex items-start gap-4">
                      <div className="p-1.5 bg-destructive/10 rounded">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-foreground">{issue.type}</span>
                          <Badge 
                            variant={issue.severity === 'Critical' ? 'destructive' : 
                                    issue.severity === 'High' ? 'destructive' : 'secondary'}
                            className="px-2 py-0.5"
                          >
                            {issue.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{issue.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Status */}
        {uploadedFiles.length > 0 && (
          <Card className="shadow-sm border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Uploaded Files ({uploadedFiles.length})</CardTitle>
              <CardDescription className="text-base">
                Files currently being processed or awaiting security scan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileCheck className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-foreground">{file}</span>
                    </div>
                    <Badge variant="outline" className="px-3 py-1">Processing</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}