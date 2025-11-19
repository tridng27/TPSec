import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, Palette, MousePointer, Keyboard, Volume2, AlertTriangle, CheckCircle } from 'lucide-react';

export function AccessibilityReport() {
  const accessibilityCategories = [
    {
      id: 'visual',
      name: 'Visual',
      icon: Eye,
      score: 72,
      issues: [
        {
          severity: 'high',
          title: 'Insufficient Color Contrast',
          description: 'Text on background has contrast ratio of 3.2:1 (minimum 4.5:1)',
          guideline: 'WCAG 2.1 AA - 1.4.3 Contrast (Minimum)',
          location: 'dashboard.fig - Account Balance Text',
          impact: 'Users with visual impairments may not be able to read the text',
          recommendation: 'Darken text color to #2D2D2D or lighter background to improve contrast'
        },
        {
          severity: 'medium',
          title: 'Small Touch Targets',
          description: 'Interactive elements are smaller than 44x44px minimum',
          guideline: 'WCAG 2.1 AA - 2.5.5 Target Size',
          location: 'mobile_nav.fig - Menu Icons',
          impact: 'Difficult for users with motor impairments to tap accurately',
          recommendation: 'Increase button size to at least 44x44px with adequate spacing'
        },
        {
          severity: 'medium',
          title: 'Missing Focus Indicators',
          description: 'Interactive elements lack visible focus indicators',
          guideline: 'WCAG 2.1 AA - 2.4.7 Focus Visible',
          location: 'form_elements.fig - Input Fields',
          impact: 'Keyboard users cannot identify which element has focus',
          recommendation: 'Add visible focus rings or outlines to all interactive elements'
        }
      ]
    },
    {
      id: 'motor',
      name: 'Motor',
      icon: MousePointer,
      score: 85,
      issues: [
        {
          severity: 'medium',
          title: 'Close Proximity of Action Buttons',
          description: 'Delete and Save buttons are too close together',
          guideline: 'WCAG 2.1 AA - 2.5.5 Target Size',
          location: 'settings.fig - Action Buttons',
          impact: 'Risk of accidental deletion for users with motor impairments',
          recommendation: 'Add 8px minimum spacing between destructive and primary actions'
        }
      ]
    },
    {
      id: 'cognitive',
      name: 'Cognitive',
      icon: Volume2,
      score: 80,
      issues: [
        {
          severity: 'high',
          title: 'Complex Error Messages',
          description: 'Error text uses technical jargon and complex language',
          guideline: 'WCAG 2.1 AA - 3.3.3 Error Suggestion',
          location: 'forms.fig - Validation Messages',
          impact: 'Users with cognitive disabilities may not understand how to fix errors',
          recommendation: 'Use plain language and provide specific, actionable guidance'
        },
        {
          severity: 'medium',
          title: 'Missing Progress Indicators',
          description: 'Multi-step processes lack progress indication',
          guideline: 'WCAG 2.1 AA - 3.2.2 On Input',
          location: 'onboarding.fig - Account Setup',
          impact: 'Users may feel lost or abandon the process',
          recommendation: 'Add step indicators showing current progress and remaining steps'
        }
      ]
    },
    {
      id: 'keyboard',
      name: 'Keyboard',
      icon: Keyboard,
      score: 78,
      issues: [
        {
          severity: 'high',
          title: 'Missing Skip Links',
          description: 'No skip navigation links for keyboard users',
          guideline: 'WCAG 2.1 AA - 2.4.1 Bypass Blocks',
          location: 'main_layout.fig - Header Navigation',
          impact: 'Keyboard users must tab through all navigation to reach content',
          recommendation: 'Add "Skip to main content" link at the beginning of the page'
        },
        {
          severity: 'medium',
          title: 'Tab Order Issues',
          description: 'Logical tab order not followed in form layouts',
          guideline: 'WCAG 2.1 AA - 2.4.3 Focus Order',
          location: 'checkout.fig - Payment Form',
          impact: 'Confusing navigation flow for keyboard and screen reader users',
          recommendation: 'Ensure tab order follows visual layout and logical flow'
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
      case 'high': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'low': return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      default: return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const overallScore = Math.round(
    accessibilityCategories.reduce((sum, cat) => sum + cat.score, 0) / accessibilityCategories.length
  );

  const totalIssues = accessibilityCategories.reduce((sum, cat) => sum + cat.issues.length, 0);
  const highPriorityIssues = accessibilityCategories.reduce(
    (sum, cat) => sum + cat.issues.filter(issue => issue.severity === 'high').length, 0
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Accessibility Report</h1>
          <p className="text-muted-foreground">
            WCAG 2.1 AA compliance analysis and accessibility recommendations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            WCAG Guide
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {highPriorityIssues > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Accessibility Issues Found:</strong> {highPriorityIssues} high-priority issues that may prevent users with disabilities from accessing your application.
          </AlertDescription>
        </Alert>
      )}

      {/* Accessibility Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{overallScore}%</div>
            <Progress value={overallScore} className="mb-2" />
            <p className="text-xs text-muted-foreground">WCAG 2.1 AA compliance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIssues}</div>
            <p className="text-xs text-muted-foreground">
              Across {accessibilityCategories.length} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{highPriorityIssues}</div>
            <p className="text-xs text-muted-foreground">
              Critical accessibility barriers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Standards</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold mb-1">WCAG 2.1 AA</div>
            <div className="text-sm font-bold">Section 508</div>
            <p className="text-xs text-muted-foreground">Compliance targets</p>
          </CardContent>
        </Card>
      </div>

      {/* Accessibility Categories */}
      <Tabs defaultValue="visual" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          {accessibilityCategories.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {category.name}
                <Badge variant={category.score >= 90 ? 'secondary' : category.score >= 80 ? 'default' : 'destructive'}>
                  {category.score}%
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {accessibilityCategories.map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className="h-5 w-5" />
                  {category.name} Accessibility
                  <Badge variant="outline">{category.issues.length} issue{category.issues.length !== 1 ? 's' : ''}</Badge>
                </CardTitle>
                <CardDescription>
                  Score: {category.score}% - Issues affecting users with {category.name.toLowerCase()} disabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.issues.map((issue, index) => (
                    <Card key={index} className={`border-l-4 ${
                      issue.severity === 'high' ? 'border-l-destructive' : 'border-l-yellow-500'
                    }`}>
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <strong className="text-foreground">WCAG Guideline:</strong>
                            <p className="text-muted-foreground">{issue.guideline}</p>
                          </div>
                          <div>
                            <strong className="text-foreground">Location:</strong>
                            <p className="text-muted-foreground">{issue.location}</p>
                          </div>
                        </div>
                        
                        <div className="mb-3 p-3 bg-red-50 rounded border border-red-200">
                          <strong className="text-red-800 text-sm">Impact:</strong>
                          <p className="text-red-700 text-sm mt-1">{issue.impact}</p>
                        </div>
                        
                        <div className="p-3 bg-green-50 rounded border border-green-200">
                          <strong className="text-green-800 text-sm">Recommendation:</strong>
                          <p className="text-green-700 text-sm mt-1">{issue.recommendation}</p>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm">
                            Test with Tools
                          </Button>
                          <Button variant="outline" size="sm">
                            View Examples
                          </Button>
                          {issue.severity === 'high' && (
                            <Button size="sm">
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

      {/* Accessibility Testing Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Testing Tools</CardTitle>
          <CardDescription>Tools to validate accessibility compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Automated Testing</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• axe DevTools - Browser extension for accessibility testing</li>
                <li>• WAVE - Web accessibility evaluation tool</li>
                <li>• Lighthouse - Built-in Chrome accessibility audit</li>
                <li>• Color Oracle - Color blindness simulator</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Manual Testing</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Screen reader testing (NVDA, JAWS, VoiceOver)</li>
                <li>• Keyboard navigation testing</li>
                <li>• Color contrast analyzer</li>
                <li>• User testing with disabled users</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Fixes */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Accessibility Wins</CardTitle>
          <CardDescription>Simple changes that improve accessibility significantly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded">
              <Palette className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium">Fix Color Contrast</p>
                <p className="text-sm text-muted-foreground">Ensure 4.5:1 ratio for normal text, 3:1 for large text</p>
              </div>
              <Button size="sm">Fix Now</Button>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded">
              <Keyboard className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium">Add Focus Indicators</p>
                <p className="text-sm text-muted-foreground">Make keyboard focus visible on all interactive elements</p>
              </div>
              <Button size="sm">Add Focus</Button>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded">
              <MousePointer className="h-5 w-5 text-purple-600" />
              <div className="flex-1">
                <p className="font-medium">Increase Touch Targets</p>
                <p className="text-sm text-muted-foreground">Make buttons at least 44x44px for mobile</p>
              </div>
              <Button size="sm">Resize</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}