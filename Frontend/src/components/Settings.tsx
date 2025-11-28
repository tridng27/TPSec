import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Settings as SettingsIcon, Moon, Sun, Monitor } from 'lucide-react';
import { Badge } from './ui/badge';

interface SettingsProps {
  darkMode: boolean;
  onDarkModeChange: (enabled: boolean) => void;
}

export function Settings({ darkMode, onDarkModeChange }: SettingsProps) {
  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <SettingsIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
              <p className="text-lg text-muted-foreground mt-1">
                Customize your application preferences
              </p>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <Card className="shadow-sm border-2">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Monitor className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Appearance</CardTitle>
                <CardDescription className="text-base mt-1">
                  Customize the visual appearance of the application
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dark Mode Toggle */}
            <div className="space-y-4">
              <div>
                <Label className="font-semibold text-base">Theme Mode</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose between light and dark theme for the interface
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Light Mode Option */}
                <button
                  onClick={() => onDarkModeChange(false)}
                  className={`relative flex items-center gap-4 p-6 rounded-lg border-2 transition-all ${
                    !darkMode
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <div className={`p-3 rounded-lg ${!darkMode ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Sun className={`h-6 w-6 ${!darkMode ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-base">Light Mode</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Bright and clean interface
                    </p>
                  </div>
                  {!darkMode && (
                    <Badge variant="default" className="absolute top-4 right-4">
                      Active
                    </Badge>
                  )}
                </button>

                {/* Dark Mode Option */}
                <button
                  onClick={() => onDarkModeChange(true)}
                  className={`relative flex items-center gap-4 p-6 rounded-lg border-2 transition-all ${
                    darkMode
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Moon className={`h-6 w-6 ${darkMode ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-base">Dark Mode</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Reduced eye strain in low light
                    </p>
                  </div>
                  {darkMode && (
                    <Badge variant="default" className="absolute top-4 right-4">
                      Active
                    </Badge>
                  )}
                </button>
              </div>
            </div>

            {/* Preview Section */}
            <div className="space-y-3 pt-4 border-t">
              <Label className="font-semibold text-base">Theme Preview</Label>
              <div className="bg-muted/30 rounded-lg p-6 border-2 border-border">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Sample Card Title</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        This is how cards and text will appear with your selected theme
                      </p>
                    </div>
                    <Badge variant="secondary">Preview</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-primary/10 rounded p-3 text-center">
                      <p className="text-sm font-semibold text-primary">Primary</p>
                    </div>
                    <div className="bg-secondary rounded p-3 text-center">
                      <p className="text-sm font-semibold">Secondary</p>
                    </div>
                    <div className="bg-muted rounded p-3 text-center">
                      <p className="text-sm font-semibold text-muted-foreground">Muted</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
