import { BarChart3, ShieldCheck, FolderSearch } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { type ViewType } from '../App';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const navigationItems = [
    { id: 'dashboard' as ViewType, label: 'Dashboard', icon: BarChart3, badge: null, badgeVariant: undefined },
    { id: 'scan' as ViewType, label: 'Scan', icon: FolderSearch, badge: null, badgeVariant: undefined },
  ];

  return (
    <div className="w-72 bg-card border-r border-border p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-lg text-foreground">TPSecurity</h1>
            <p className="text-xs text-muted-foreground">
              Security Platform
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Security Application for Threat Detection and Management
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
    </div>
  );
}