import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  FileText, 
  FolderOpen, 
  Clock, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Eye,
  FileWarning,
  ShieldCheck,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { ProtectionApi } from "../api/protectionApi";

// Type Definitions
interface ProtectionStatus {
  status: 'running' | 'stopped' | string;
  uptime_seconds: number;
  event_counts: {
    scanned: number;
    malicious: number;
    [key: string]: number;
  };
  monitored_folders: string[];
}

interface FileEvent {
  event_type: string;
  file_name: string;
  file_path: string;
  timestamp: string;
  ml_score: number | null;
  action?: 'allow' | 'potential_malicious' | 'skipped' | string;
}

interface Statistics {
  event_counts: Record<string, number>;
  total_events: number;
  monitored_folders: string[];
  cache_size: number;
}

declare global {
  interface Window {
    __electron?: {
      selectFolder?: () => Promise<string[]>;
    };
  }
}

export function RealTimeProtection() {
  const [protectionStatus, setProtectionStatus] = useState<ProtectionStatus | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [recentEvents, setRecentEvents] = useState<FileEvent[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [newFolder, setNewFolder] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper functions for folder management
  const normalize = (p: string) => p.replace(/\\/g, '/');

  const addFolder = () => {
    if (!newFolder) return;
    const path = normalize(newFolder.trim());
    if (!folders.includes(path)) setFolders((p) => [...p, path]);
    setNewFolder('');
  };

  const removeFolder = (path: string) => {
    setFolders((p) => p.filter((f) => f !== path));
  };

  const handleBrowse = async () => {
    if (!window.__electron?.selectFolder) return;
    const paths = await window.__electron.selectFolder();
    paths?.forEach((p) => {
      const n = normalize(p);
      if (!folders.includes(n)) setFolders((s) => [...s, n]);
    });
  };

  const toggleProtection = async () => {
    if (folders.length === 0) return;
    setLoading(true);

    try {
      if (!enabled) {
        // Call API to start protection
        console.log('Starting protection for folders:', folders);
        setEnabled(true);
      } else {
        const confirmStop = window.confirm('Disable real-time protection?');
        if (!confirmStop) {
          setLoading(false);
          return;
        }
        // Call API to stop protection
        console.log('Stopping protection');
        setEnabled(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch Protection Status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await ProtectionApi.statusProtection();
        setProtectionStatus(data);
      } catch {
        console.debug("Protection status unavailable");
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const data = await ProtectionApi.statisticsProtection();
        setStatistics(data);
      } catch {
        console.debug("Statistics unavailable");
      }
    };
    fetchStatistics();
    const interval = setInterval(fetchStatistics, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Recent Events
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const data = await ProtectionApi.recenteventProtection();
        setRecentEvents(data.events ?? []);
      } catch {
        console.debug("Recent events unavailable");
      }
    };
    fetchRecent();
    const interval = setInterval(fetchRecent, 10000);
    return () => clearInterval(interval);
  }, []);

  // Helper Functions
  const formatUptime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'modified':
        return <FileWarning className="h-4 w-4 text-blue-600" />;
      case 'moved':
        return <FolderOpen className="h-4 w-4 text-orange-600" />;
      case 'deleted':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (action?: string) => {
    if (!action) return null;

    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      allow: { variant: 'secondary', icon: <CheckCircle className="h-3 w-3" />, label: 'Safe' },
      potential_malicious: { variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" />, label: 'Threat' },
      skipped: { variant: 'outline', icon: null, label: 'Skipped' },
    };

    const config = variants[action] || { variant: 'outline', icon: null, label: action };

    return (
      <Badge variant={config.variant} className="text-xs px-2 py-0.5 gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="p-8 space-y-6 bg-background min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-lg">
                <Activity className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-foreground">Real-time Protection Monitor</h1>
                <p className="text-lg text-muted-foreground mt-1">
                  Live file system activity and compliance threat detection
                </p>
              </div>
            </div>

            {(protectionStatus || enabled) && (
              <Badge 
                variant={(protectionStatus?.status === 'running' || enabled) ? 'default' : 'destructive'}
                className="text-base px-6 py-2.5 shadow-md"
              >
                <Shield className="mr-2 h-5 w-5" />
                {(protectionStatus?.status === 'running' || enabled) ? 'PROTECTED' : 'INACTIVE'}
              </Badge>
            )}
          </div>
        </div>

        {/* Protection Setup Card */}
        <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-muted/20 mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Protection Configuration</CardTitle>
                <CardDescription className="text-base mt-1">
                  Configure folders to monitor for real-time threat detection
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add folder */}
            <div className="space-y-3">
              <Label className="font-semibold">Add Folder to Monitor</Label>
              <div className="flex gap-3">
                <Input
                  value={newFolder}
                  placeholder="C:/Projects/DesignFolder"
                  onChange={(e) => setNewFolder(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addFolder()}
                  disabled={loading}
                  className="flex-1"
                />
                <Button onClick={addFolder} disabled={!newFolder || loading} size="default">
                  <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
                <Button variant="outline" onClick={handleBrowse} disabled={loading}>
                  <FolderOpen className="w-4 h-4 mr-2" /> Browse
                </Button>
              </div>
            </div>

            {/* Folder list */}
            <div className="space-y-3">
              <Label className="font-semibold">
                Monitored Folders ({folders.length})
              </Label>
              <div className="bg-muted/40 border-2 border-dashed border-border p-4 rounded-lg max-h-[240px] overflow-y-auto">
                {folders.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      No folders selected. Add a folder to enable protection.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click "Add" or "Browse" to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {folders.map((path, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-card border-2 p-3 rounded-lg hover:border-primary/40 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-1.5 bg-green-600/10 rounded">
                            <Shield className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="truncate font-mono text-sm">{path}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFolder(path)}
                          disabled={loading}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Toggle protection */}
            <div className="pt-2">
              <Button
                className="w-full h-14 text-lg shadow-md"
                disabled={folders.length === 0 || loading}
                variant={enabled ? 'secondary' : 'default'}
                onClick={toggleProtection}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Processing...
                  </>
                ) : (
                  <>
                    {enabled ? (
                      <>
                        <XCircle className="mr-2 h-5 w-5" />
                        Disable Protection
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Enable Real-time Protection
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>

            {enabled && (
              <Card className="border-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 shadow-md">
                <CardContent className="p-5 flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <div className="p-2.5 bg-green-600 rounded-lg shadow-md">
                      <ShieldCheck className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        Real-time Protection Active
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        All folders are being monitored
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-700 dark:text-green-400 border-green-400 dark:border-green-600 bg-green-100 dark:bg-green-900/30">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse" />
                    Live
                  </Badge>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Status Overview Cards */}
        {(protectionStatus || statistics) && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-2 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-card to-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      Files Scanned
                    </p>
                    <p className="text-3xl font-semibold text-primary">
                      {protectionStatus?.event_counts.scanned || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Eye className="h-7 w-7 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-card to-destructive/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Threats Detected
                    </p>
                    <p className="text-3xl font-semibold text-destructive">
                      {protectionStatus?.event_counts.malicious || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-destructive/10 rounded-xl">
                    <AlertTriangle className="h-7 w-7 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-card to-blue-600/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Uptime
                    </p>
                    <p className="text-xl font-semibold text-blue-600">
                      {protectionStatus ? formatUptime(protectionStatus.uptime_seconds) : '0h 0m 0s'}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-600/10 rounded-xl">
                    <Clock className="h-7 w-7 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-card to-green-600/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                      <FolderOpen className="h-3.5 w-3.5" />
                      Monitored Folders
                    </p>
                    <p className="text-3xl font-semibold text-green-600">
                      {protectionStatus?.monitored_folders.length || folders.length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-600/10 rounded-xl">
                    <FolderOpen className="h-7 w-7 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Statistics Panel */}
          {statistics && (
            <Card className="shadow-lg border-2 bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-md">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Live Activity Statistics
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      Real-time file system event counts
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/40 rounded-xl p-4 border-2 h-[400px] overflow-y-auto space-y-3">
                  {Object.entries(statistics.event_counts).map(([type, count]) => (
                    <div
                      key={type}
                      className="flex justify-between items-center p-4 bg-card rounded-lg border-2 hover:border-primary/40 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          {getEventIcon(type)}
                        </div>
                        <span className="capitalize font-medium">{type}</span>
                      </div>
                      <span className="font-semibold text-2xl text-primary">{count}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center bg-gradient-to-r from-primary/10 to-blue-600/10 p-4 rounded-lg border-2 border-primary font-semibold text-lg shadow-md">
                    <span className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Total Events
                    </span>
                    <span className="text-2xl text-primary">{statistics.total_events}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Events History */}
          <Card className="shadow-lg border-2 bg-gradient-to-br from-card to-blue-600/5">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-600/20 to-blue-600/10 rounded-xl shadow-md">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">Recent Events History</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Last 20 scanned files
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/40 rounded-xl p-4 border-2 h-[400px] overflow-y-auto">
                {recentEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="p-4 bg-blue-600/10 rounded-full mb-4">
                      <FileText className="h-12 w-12 text-blue-600" />
                    </div>
                    <p className="font-semibold text-foreground">No recent events</p>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                      Events will appear here once scanning begins
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentEvents.map((event, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-card p-3 rounded-lg border-2 border-border hover:border-blue-600/30 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2 bg-muted rounded-lg">
                            {getEventIcon(event.event_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {event.file_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {event.event_type} • {formatTimestamp(event.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="ml-3 flex items-center gap-2">
                          {event.ml_score !== null && (
                            <span className="text-xs font-semibold text-blue-600 bg-blue-600/10 px-2 py-1 rounded">
                              {(event.ml_score * 100).toFixed(0)}%
                            </span>
                          )}
                          {getActionBadge(event.action)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Monitored Folders Status */}
        {protectionStatus && protectionStatus.monitored_folders.length > 0 && (
          <Card className="shadow-lg border-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-600/30 mt-6">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-green-600/20 to-emerald-600/10 rounded-xl shadow-md">
                  <ShieldCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Active Protection Zones
                  </CardTitle>
                  <CardDescription className="text-base mt-1 text-green-700 dark:text-green-300">
                    {protectionStatus.monitored_folders.length} folder{protectionStatus.monitored_folders.length !== 1 ? 's' : ''} under continuous real-time monitoring
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {protectionStatus.monitored_folders.map((folder, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-card p-4 rounded-lg border-2 border-green-600/20 hover:border-green-600/40 hover:shadow-md transition-all group"
                  >
                    <div className="p-2 bg-green-600/10 rounded-lg group-hover:bg-green-600/20 transition-colors">
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-sm font-mono text-foreground truncate flex-1">
                      {folder}
                    </span>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connection Status Footer */}
        <Card className="shadow-md border-2 mt-6 bg-gradient-to-r from-card via-muted/20 to-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-sm">
              {protectionStatus && (
                <Badge variant="outline" className="text-xs shadow-sm">
                  <Clock className="h-3 w-3 mr-1" />
                  Updated {new Date().toLocaleTimeString()}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
