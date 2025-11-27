import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  FolderOpen,
  Shield,
  CheckCircle,
  AlertCircle,
  Play,
  Loader2,
  Plus,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { ScanApi } from "../api/scanApi";
import { ProtectionApi } from "../api/protectionApi";
import { DetectionApi } from "../api/detectionApi";

// declare the injected electron API on the Window interface so TypeScript knows about it
declare global {
  interface Window {
    __electron?: {
      selectFolder?: () => Promise<string[]>;
    };
  }
}

interface FolderScanProps {
  onFolderScan?: (folderPath: string) => void;
}

type ScanState = "idle" | "starting" | "scanning" | "completed" | "error";

interface ScanStatus {
  status: ScanState;
  progress: number;
  scannedFiles?: number;
  totalFiles?: number;
  maliciousCount?: number;
  currentFolder?: string;
}

export default function FolderScan({ onFolderScan }: FolderScanProps) {
  const [folders, setFolders] = useState<string[]>([]);
  const [newFolder, setNewFolder] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [realtimeProtection, setRealtimeProtection] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [maliciousList, setMaliciousList] = useState<any[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [minScore, setMinScore] = useState(0.1);

  // chạy animation progress mỗi khi scanStatus.progress thay đổi
  useEffect(() => {
    if (scanStatus?.progress !== undefined) {
      setAnimatedProgress(scanStatus.progress);
    }
  }, [scanStatus?.progress]);

  // store active poll interval id so we can clear it safely
  const pollRef = useRef<number | null>(null);

  // Normalize windows path separators to forward slashes
  const normalizePath = (p: string) => p.replace(/\\/g, "/");

  const addFolder = () => {
    if (!newFolder) return;
    const path = normalizePath(newFolder.trim());
    if (!folders.includes(path)) {
      setFolders((s) => [...s, path]);
      setNewFolder("");
    }
  };

  const removeFolder = (path: string) => {
    setFolders((s) => s.filter((f) => f !== path));
  };

  const handleBrowse = async () => {
    if (!window.__electron?.selectFolder) return;

    const folderPaths: string[] = await window.__electron.selectFolder();
    if (!folderPaths || folderPaths.length === 0) return;

    folderPaths.forEach((folderPath) => {
      const normalized = normalizePath(folderPath);
      if (!folders.includes(normalized)) setFolders((s) => [...s, normalized]);
      console.log("Selected folder path via IPC:", normalized);
    });
  };

  // Start a new batch scan using backend API
  const startBatchScan = async () => {
    if (!folders.length) return;
    // prevent double-start if already scanning
    if (scanning || (scanStatus && scanStatus.status === "starting")) return;

    // reset scanStatus và animatedProgress trước khi bắt đầu
    setScanStatus({ status: "starting", progress: 0, scannedFiles: 0, totalFiles: 0, maliciousCount: 0, currentFolder: "" });
    setAnimatedProgress(0);
    setScanning(true);

    try {
      const normalized = folders.map((f) => normalizePath(f));

      // notify parent individually (optional)
      if (onFolderScan) normalized.forEach((p) => onFolderScan(p));

      console.log("📤 Sending folders to backend:", normalized);
      await ScanApi.startScan(normalized);
      await new Promise((res) => setTimeout(res, 200));
      startPolling();

    } catch (err) {
      console.error("startBatchScan error:", err);
      setScanStatus({ status: "error", progress: 0 });
      setScanning(false);
    }
  };

  const startPolling = () => {
  // clear any existing poller
  if (pollRef.current) {
    window.clearInterval(pollRef.current);
    pollRef.current = null;
  }

  // mỗi tick = 1 lần gọi API
  const tick = async () => {
    try {
      const resp = await ScanApi.getScanStatus();
      if (!resp) return;

      const status = resp.status || "scanning";

      const newStatus: ScanStatus = {
        status: status,
        progress: Number(resp.progress ?? 0),
        scannedFiles: resp.scanned_files ?? 0,
        totalFiles: resp.total_files ?? 0,
        maliciousCount: resp.malicious_count ?? 0,
        currentFolder: resp.current_folder ?? "",
      };

      setScanStatus(newStatus);
      setAnimatedProgress(newStatus.progress);

      // nếu scan complete thì dừng polling
      if (status === "completed" || status === "error") {
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = null;
        setScanning(false);
      }
    } catch (err) {
      console.error("Polling error:", err);
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
      setScanning(false);
      setScanStatus({ status: "error", progress: 0 });
    }
  };

  // chạy tick ngay lập tức
  tick();

  // sau mỗi 1 giây sẽ gọi API 1 lần
  pollRef.current = window.setInterval(tick, 1000);
};
  // Allow user to start a fresh scan UI state
  const startNewScan = () => {
    // clear polling if any
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setScanStatus(null);
    setAnimatedProgress(0);
    setShowReport(false);      
    setMaliciousList([]);
  };

  useEffect(() => {
    return () => {
      // cleanup on unmount
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  const startRealtimeProtection = async () => {
    if (folders.length === 0) return;

    try {
      // Nếu hiện đang OFF → bật bình thường
      if (!realtimeProtection) {
        const normalized = folders.map((f) => normalizePath(f));

        console.log("🔰 Starting protection for:", normalized);
        await ProtectionApi.startProtection(normalized);

        setRealtimeProtection(true);
        return;
      }

      // --- Nếu Protection đang bật → hỏi người dùng trước khi tắt ---
      const confirmStop = window.confirm("Real-time protection is currently enabled.\nDo you want to turn it off?");
      if (!confirmStop) return;

      console.log("🛑 Stopping protection...");
      await ProtectionApi.stopProtection();
      setRealtimeProtection(false);

    } catch (err) {
      console.error("Realtime protection error:", err);
    }
  };

  const loadMaliciousReport = async () => {
    try {
      const res = await DetectionApi.getDetections();
      console.log("API response:", res);

      const list = Array.isArray(res?.detections) ? res.detections : [];

      const filtered = list
        .filter((item: any) => item.ml_score >= minScore)
        .map((item: any) => ({
          detection_type: item.detection_type,
          file_path: item.file_path,
          file_name: item.file_name,
          action: item.action,
          detection_reason: item.detection_reason,
          scanned_at: item.scanned_at,
        }));

      setMaliciousList(filtered);
      setShowReport(true);
    } catch (err) {
      console.error("Error loading report:", err);
    }
  };

  const totalFiles = scanStatus?.totalFiles ?? 0;
  const malicious = scanStatus?.maliciousCount ?? 0;
  const successRate = totalFiles === 0 ? 0 : Math.round(((totalFiles - malicious) / totalFiles) * 100);

  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-3 text-foreground">Scan Design Folders</h1>
          <p className="text-lg text-muted-foreground">
            Configure and scan multiple design folders for comprehensive compliance and security validation
          </p>
        </div>

        <Card className="shadow-sm border-2">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Folder Configuration</CardTitle>
                <CardDescription className="text-base mt-1">
                  Add custom folders or select from common design file locations
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="folder-path" className="font-semibold">
                Add Custom Folder Path
              </Label>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Input
                    id="folder-path"
                    type="text"
                    placeholder="C:/Users/Admin/Documents/Design"
                    value={newFolder}
                    onChange={(e) => setNewFolder(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addFolder()}
                    className="h-12 px-4 text-base"
                    disabled={scanning}
                  />
                </div>

                <Button size="lg" variant="outline" className="px-6 h-12" onClick={addFolder} disabled={scanning || !newFolder}>
                  <Plus className="mr-2 h-5 w-5" />
                  Add
                </Button>

                <Button size="lg" variant="outline" className="px-6 h-12" onClick={handleBrowse} disabled={scanning}>
                  Browse
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">Enter the full path to your folder or browse to select</p>
            </div>

            <div className="space-y-3">
              <Label className="font-semibold">Selected Folders ({folders.length})</Label>

              <div className="bg-muted/30 rounded-lg p-4 border-2 border-border min-h-[200px] max-h-[400px] overflow-y-auto">
                {folders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[180px] text-center">
                    <FolderOpen className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No folders selected</p>
                    <p className="text-sm text-muted-foreground mt-1">Add folders to begin scanning</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {folders.map((folder, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-card p-4 rounded-lg border-2 border-border hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2 bg-primary/10 rounded">
                            <FolderOpen className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-mono text-foreground truncate">{folder}</span>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFolder(folder)}
                          disabled={scanning}
                          className="ml-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button size="lg" className="flex-1 h-12" onClick={startBatchScan} disabled={scanning || folders.length === 0}>
                {scanning ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Start Batch Scan
                  </>
                )}
              </Button>

              <Button size="lg" variant={realtimeProtection ? "secondary" : "outline"} className="flex-1 h-12" onClick={startRealtimeProtection} disabled={folders.length === 0}>
                <ShieldCheck className="mr-2 h-5 w-5" />
                {realtimeProtection ? "Protection Active" : "Enable Real-time Protection"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {realtimeProtection && (
          <Card className="shadow-sm border-2 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600 rounded-lg">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 dark:text-green-100">Real-time Protection Enabled</h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Continuously monitoring {folders.length} folder{folders.length !== 1 ? "s" : ""} for compliance violations
                  </p>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {scanStatus && (
          <Card className="shadow-sm border-2">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">Scan Progress</CardTitle>
                {scanStatus.status === "completed" && (
                  <Badge variant="secondary" className="text-base px-4 py-1">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Scan Complete
                  </Badge>
                )}
                {(scanStatus.status === "scanning" || scanStatus.status === "starting") && (
                  <Badge variant="outline" className="text-base px-4 py-1">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {scanStatus.status === "starting" ? "Initializing..." : "Scanning..."}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="p-6 bg-muted/30 rounded-lg border-2 border-border space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-semibold text-base text-foreground mb-1">{scanStatus.status === "completed" ? "Scan Completed" : "Currently Scanning"}</p>
                    {scanStatus.currentFolder && <p className="text-sm text-muted-foreground font-mono">{scanStatus.currentFolder}</p>}
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-base text-foreground">{scanStatus.scannedFiles} / {scanStatus.totalFiles}</p>
                    <p className="text-sm text-muted-foreground">Files processed</p>
                  </div>
                </div>

                {scanStatus && (scanning || scanStatus.status !== "idle") && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">
                        {scanStatus.status === "completed"
                          ? "Analysis complete"
                          : "Running scan..."}
                      </span>
                      <span className="font-semibold">{Math.round(animatedProgress)}%</span>
                    </div>

                    <Progress value={animatedProgress} className="h-3 transition-all duration-500 ease-out" />
                  </div>
                )}
              </div>

              {scanStatus.status === "completed" && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Total Issues</p>
                          <p className="text-3xl font-semibold">{malicious}</p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-destructive" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Files Scanned</p>
                          <p className="text-3xl font-semibold">{totalFiles}</p>
                        </div>
                        <FolderOpen className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Folders</p>
                          <p className="text-3xl font-semibold">{folders.length}</p>
                        </div>
                        <Shield className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                          <p className="text-3xl font-semibold">{successRate}%</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {scanStatus.status === "completed" && (
                <div className="flex gap-3">
                  <Button size="lg" variant="outline" className="flex-1 h-12" onClick={startNewScan}>
                    Start New Scan
                  </Button>
                  <Button size="lg" className="flex-1 h-12" onClick={loadMaliciousReport}>
                    View Detailed Issues
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {showReport && (
        <Card className="mt-8 border-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Detailed Malware Report</CardTitle>
            <CardDescription>Showing files flagged as malicious or risky</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Bộ lọc */}
            <div className="flex items-center gap-4">
              <Label className="font-medium">Minimum Score:</Label>
              <Input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-32"
              />
              <Button variant="outline" onClick={loadMaliciousReport}>
                Apply Filter
              </Button>
            </div>

            {/* Danh sách malware */}
            <div className="space-y-4">
              {maliciousList.length === 0 ? (
                <p className="text-muted-foreground">No malicious items found with current filter.</p>
              ) : (
                maliciousList.map((item, index) => (
                  <Card
                    key={index}
                    className="border-2 border-border hover:border-destructive/40 transition-colors"
                  >
                    <CardContent className="p-5 space-y-3">
                      <div className="flex justify-between items-center">
                        <Badge variant="destructive">{item.action}</Badge>
                        <span className="text-sm text-muted-foreground">{item.scanned_at}</span>
                      </div>

                      <p className="font-semibold text-foreground">{item.file_name}</p>
                      <p className="font-mono text-sm text-muted-foreground break-all">
                        {item.file_path}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <Shield className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">
                          Reason: {item.detection_reason}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
