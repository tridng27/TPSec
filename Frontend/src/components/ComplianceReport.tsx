import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, AlertTriangle, XCircle, FileText, Download, ExternalLink } from 'lucide-react';

export function ComplianceReport() {
  const complianceStandards = [
    {
      id: 'pci',
      name: 'PCI DSS',
      description: 'Payment Card Industry Data Security Standard',
      score: 85,
      issues: [
        {
          severity: 'high',
          title: 'Missing required disclosure text',
          description: 'Payment forms must include PCI DSS compliance disclosure',
          requirement: 'PCI DSS 3.2.1 Section 12.8',
          location: 'payment_form.fig - Page 1',
          recommendation: 'Add "This form is PCI DSS compliant" text near payment fields'
        },
        {
          severity: 'medium',
          title: 'Card number field styling',
          description: 'Credit card input fields should use monospace font',
          requirement: 'PCI DSS Best Practices',
          location: 'payment_form.fig - Page 2',
          recommendation: 'Apply monospace font family to card number input'
        }
      ]
    },
    {
      id: 'sox',
      name: 'SOX',
      description: 'Sarbanes-Oxley Act',
      score: 92,
      issues: [
        {
          severity: 'low',
          title: 'Audit trail visibility',
          description: 'Financial data modifications should show audit information',
          requirement: 'SOX Section 302',
          location: 'dashboard.fig - Financial Summary',
          recommendation: 'Add "Last modified" and "Modified by" information'
        }
      ]
    },
    {
      id: 'gdpr',
      name: 'GDPR',
      description: 'General Data Protection Regulation',
      score: 78,
      issues: [
        {
          severity: 'high',
          title: 'Missing consent checkboxes',
          description: 'Data collection forms require explicit consent',
          requirement: 'GDPR Article 7',
          location: 'registration.fig - Sign Up Form',
          recommendation: 'Add explicit consent checkboxes for data processing'
        },
        {
          severity: 'medium',
          title: 'Data retention notice',
          description: 'Forms should indicate how long data will be stored',
          requirement: 'GDPR Article 13',
          location: 'registration.fig - Privacy Notice',
          recommendation: 'Add data retention period information'
        }
      ]
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'low': return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      default: return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Compliance Report</h1>
          <p className="text-muted-foreground">
            Detailed regulatory compliance analysis for financial services
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Generate Summary
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Action Required:</strong> 2 high-priority compliance issues found that require immediate attention.
        </AlertDescription>
      </Alert>

      {/* Compliance Standards Tabs */}
      <Tabs defaultValue="pci" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          {complianceStandards.map((standard) => (
            <TabsTrigger key={standard.id} value={standard.id} className="flex items-center gap-2">
              {standard.name}
              <Badge variant={standard.score >= 90 ? 'secondary' : standard.score >= 80 ? 'default' : 'destructive'}>
                {standard.score}%
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {complianceStandards.map((standard) => (
          <TabsContent key={standard.id} value={standard.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <h3>{standard.name}</h3>
                    <CardDescription>{standard.description}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold mb-1">{standard.score}%</div>
                    <Badge variant={standard.score >= 90 ? 'secondary' : standard.score >= 80 ? 'default' : 'destructive'}>
                      {standard.issues.length} issue{standard.issues.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {standard.issues.length === 0 ? (
                    <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-800">No compliance issues found</span>
                    </div>
                  ) : (
                    standard.issues.map((issue, index) => (
                      <Card key={index} className="border-l-4 border-l-destructive">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {getSeverityIcon(issue.severity)}
                              <h4 className="font-medium">{issue.title}</h4>
                            </div>
                            <Badge variant={getSeverityColor(issue.severity) as any}>
                              {issue.severity.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <p className="text-muted-foreground mb-3">{issue.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong className="text-foreground">Requirement:</strong>
                              <p className="text-muted-foreground">{issue.requirement}</p>
                            </div>
                            <div>
                              <strong className="text-foreground">Location:</strong>
                              <p className="text-muted-foreground">{issue.location}</p>
                            </div>
                          </div>
                          
                          <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                            <strong className="text-blue-800 text-sm">Recommendation:</strong>
                            <p className="text-blue-700 text-sm mt-1">{issue.recommendation}</p>
                          </div>
                          
                          <div className="flex gap-2 mt-3">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Standard
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Summary Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>Recommended actions to improve compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded">
              <div className="w-2 h-2 bg-destructive rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">Address High Priority Issues</p>
                <p className="text-sm text-muted-foreground">Fix 2 high-priority compliance violations</p>
              </div>
              <Button size="sm">Start Now</Button>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">Review Medium Priority Items</p>
                <p className="text-sm text-muted-foreground">3 medium-priority recommendations available</p>
              </div>
              <Button variant="outline" size="sm">Review</Button>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">Schedule Regular Audits</p>
                <p className="text-sm text-muted-foreground">Set up automated compliance checking</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}