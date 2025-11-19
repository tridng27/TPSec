import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Shield, AlertTriangle, Eye, Lock, Key, Database, AlertCircle } from 'lucide-react';

export function SecurityFindings() {
  const securityCategories = [
    {
      id: 'data-protection',
      name: 'Data Protection',
      icon: Database,
      count: 3,
      critical: 1,
      findings: [
        {
          severity: 'critical',
          title: 'Sensitive Data Visible in Design',
          description: 'Social Security Numbers are displayed in plain text in mockup',
          impact: 'High risk of data exposure if design is shared',
          location: 'user_profile.fig - Account Information',
          recommendation: 'Replace with masked placeholder (XXX-XX-1234)',
          category: 'PII Exposure'
        },
        {
          severity: 'high',
          title: 'Password Field Visibility',
          description: 'Password fields show actual text instead of masking',
          impact: 'Passwords visible during screen sharing or documentation',
          location: 'login.fig - Sign In Form',
          recommendation: 'Use bullet points or asterisks to mask password',
          category: 'Authentication'
        },
        {
          severity: 'medium',
          title: 'Credit Card Number Format',
          description: 'Full credit card numbers displayed without masking',
          impact: 'PCI DSS compliance violation if exposed',
          location: 'payment.fig - Card Details',
          recommendation: 'Show only last 4 digits (****-****-****-1234)',
          category: 'Payment Security'
        }
      ]
    },
    {
      id: 'authentication',
      name: 'Authentication',
      icon: Lock,
      count: 2,
      critical: 0,
      findings: [
        {
          severity: 'high',
          title: 'Missing Two-Factor Authentication',
          description: 'Login flow does not include 2FA options',
          impact: 'Reduced account security for financial applications',
          location: 'login.fig - Authentication Flow',
          recommendation: 'Add 2FA setup and verification screens',
          category: 'Multi-Factor Auth'
        },
        {
          severity: 'medium',
          title: 'Password Strength Indicator Missing',
          description: 'No visual feedback for password strength',
          impact: 'Users may create weak passwords',
          location: 'registration.fig - Create Account',
          recommendation: 'Add password strength meter with requirements',
          category: 'Password Policy'
        }
      ]
    },
    {
      id: 'privacy',
      name: 'Privacy Controls',
      icon: Eye,
      count: 1,
      critical: 0,
      findings: [
        {
          severity: 'medium',
          title: 'Privacy Settings Not Prominent',
          description: 'Data sharing controls are buried in settings',
          impact: 'Users may not be aware of privacy options',
          location: 'settings.fig - Privacy Section',
          recommendation: 'Move privacy controls to main account page',
          category: 'User Control'
        }
      ]
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default: return <Shield className="h-4 w-4 text-green-500" />;
    }
  };

  const totalFindings = securityCategories.reduce((sum, cat) => sum + cat.count, 0);
  const totalCritical = securityCategories.reduce((sum, cat) => sum + cat.critical, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Security Findings</h1>
          <p className="text-muted-foreground">
            Security vulnerabilities and data protection issues found in designs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Security Guide
          </Button>
        </div>
      </div>

      {/* Critical Alert */}
      {totalCritical > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Security Issue:</strong> {totalCritical} critical security vulnerability found that requires immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Findings</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFindings}</div>
            <p className="text-xs text-muted-foreground">
              Across {securityCategories.length} security categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalCritical}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
            <p className="text-xs text-muted-foreground">
              Based on industry standards
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Categories */}
      <Tabs defaultValue="data-protection" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          {securityCategories.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {category.name}
                {category.critical > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {category.critical}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {securityCategories.map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className="h-5 w-5" />
                  {category.name}
                  <Badge variant="outline">{category.count} finding{category.count !== 1 ? 's' : ''}</Badge>
                </CardTitle>
                <CardDescription>
                  Security issues related to {category.name.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.findings.map((finding, index) => (
                    <Card key={index} className={`border-l-4 ${
                      finding.severity === 'critical' || finding.severity === 'high' 
                        ? 'border-l-destructive' 
                        : 'border-l-yellow-500'
                    }`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(finding.severity)}
                            <h4 className="font-medium">{finding.title}</h4>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={getSeverityColor(finding.severity) as any}>
                              {finding.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {finding.category}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground mb-3">{finding.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <strong className="text-foreground">Impact:</strong>
                            <p className="text-muted-foreground">{finding.impact}</p>
                          </div>
                          <div>
                            <strong className="text-foreground">Location:</strong>
                            <p className="text-muted-foreground">{finding.location}</p>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-green-50 rounded border border-green-200">
                          <strong className="text-green-800 text-sm">Recommendation:</strong>
                          <p className="text-green-700 text-sm mt-1">{finding.recommendation}</p>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm">
                            Mark as Fixed
                          </Button>
                          <Button variant="outline" size="sm">
                            View Guidelines
                          </Button>
                          {finding.severity === 'critical' && (
                            <Button size="sm" variant="destructive">
                              Priority Fix
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Security Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Security Best Practices for Financial UI Design</CardTitle>
          <CardDescription>Guidelines to prevent common security issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Data Protection
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Never display real SSNs, even in mockups</li>
                <li>• Mask credit card numbers (show last 4 digits only)</li>
                <li>• Use placeholder data that looks realistic but isn't real</li>
                <li>• Implement proper field masking for sensitive inputs</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Authentication
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Always include 2FA in financial applications</li>
                <li>• Show password strength indicators</li>
                <li>• Design clear session timeout warnings</li>
                <li>• Include secure logout confirmation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}