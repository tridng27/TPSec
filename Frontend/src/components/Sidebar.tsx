import { Shield, Upload, FileCheck, AlertTriangle, Eye, BarChart3, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { ViewType } from '../App';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const navigationItems = [
    { id: 'dashboard' as ViewType, label: 'Dashboard', icon: BarChart3, badge: null },
    { id: 'upload' as ViewType, label: 'Upload Design', icon: Upload, badge: null },
    { id: 'compliance' as ViewType, label: 'Compliance', icon: FileCheck, badge: '2 Issues', badgeVariant: 'destructive' },
    { id: 'security' as ViewType, label: 'Security', icon: Shield, badge: '1 Critical', badgeVariant: 'destructive' },
    { id: 'accessibility' as ViewType, label: 'Accessibility', icon: Eye, badge: '3 Issues', badgeVariant: 'secondary' },
  ];

  return (
    <div className="w-72 bg-card border-r border-border p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-lg text-foreground">FinSecure Validator</h1>
            <p className="text-xs text-muted-foreground">
              Enterprise Security Platform
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Compliance & Security Design Validation for Financial Services
        </p>
      </div>

      <nav className="space-y-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3 h-12 px-4 py-3 text-left font-medium"
              onClick={() => onViewChange(item.id)}
            >
              <div className={`p-1.5 rounded ${isActive ? 'bg-primary/20' : 'bg-muted'}`}>
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge 
                  variant={item.badgeVariant as any || 'secondary'}
                  className="text-xs px-2 py-0.5"
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </nav>

      <div className="mt-8 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1 bg-destructive/10 rounded">
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <span className="text-sm font-semibold text-destructive">Action Required</span>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          6 regulatory issues found requiring immediate attention
        </p>
        <Button size="sm" variant="outline" className="w-full text-xs">
          Review Issues
        </Button>
      </div>
    </div>
  );
}