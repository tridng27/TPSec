import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, FileCheck, } from 'lucide-react';
import { DetectionApi } from "../api/detectionApi";

export function Dashboard() {
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [criticalIssues, setCriticalIssues] = useState<any[]>([]);

  function toLocalDate(timestamp: string) {
    const utc = timestamp.endsWith("Z") ? timestamp : timestamp + "Z";
    return new Date(utc);
  }

  function timeAgo(timestamp: string) {
    const local = toLocalDate(timestamp);
    const diff = Date.now() - local.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }

    const getSeverity = (score: number) => {
    if (score >= 0.1) return "Critical";
    if (score >= 0.01) return "High";
    if (score >= 0.001) return "Medium";
    return null;
  };

  function formatDate(timestamp: string) {
    return toLocalDate(timestamp).toLocaleString("vi-VN", {
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  const trimText = (text: string, max: number = 40) => {
    if (!text) return "";
    return text.length > max ? text.slice(0, max) + "..." : text;
  };

  React.useEffect(() => {
    let interval: any;
    const load = async () => {
      try {
        // Load Recent Scans (existing API)
        const res = await DetectionApi.getDetections();
        const items = Array.isArray(res?.detections) ? res.detections : [];

        const formatted = items.map((item: any) => ({
          file_name: item.file_name,
          scanned_at: item.scanned_at
        }))
        .slice(0, 5);

        setRecentScans(formatted);

        // Load Critical Issues from malicious API
        const malicious = await DetectionApi.getMalicious();
        const list = Array.isArray(malicious?.detections) ? malicious.detections : [];

        interface RawMalicious {
          file_name: string;
          scanned_at: string;
          ml_score: number;
          [key: string]: any;
        }

        interface ProcessedIssue {
          file_name: string;
          scanned_at: string;
          ml_score: number;
          severity: 'Critical' | 'High' | 'Medium';
          description: string;
        }

        const processed = (list as RawMalicious[])
          .map((item: RawMalicious) => ({
            file_name: item.file_name,
            scanned_at: item.scanned_at,
            ml_score: item.ml_score,
            severity: getSeverity(item.ml_score),
            description: `File flagged with a machine learning threat score of ${item.ml_score}.`
          }))
          .filter((x): x is ProcessedIssue => x.severity !== null)
          .slice(0, 4);

        setCriticalIssues(processed);

      } catch (err) {
        console.error("Failed loading dashboard data:", err);
      }
    };

    load();
    interval = setInterval(load, 5000);
    return () => clearInterval(interval); // cleanup
  }, []);

  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-3 text-foreground">Compliance Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Enterprise-grade design validation status and compliance metrics
          </p>
        </div>

        {/* Grid: Recent Scans & Critical Issues */}
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
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <FileCheck className="h-5 w-5 text-blue-600" />
                      </div>

                      <div>
                        <p className="font-medium text-foreground">{trimText(scan.file_name, 20)}</p>
                        <p className="text-sm text-muted-foreground">
                          {timeAgo(scan.scanned_at)}
                        </p>
                      </div>
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
                {criticalIssues.map((item, index) => (
                  <div key={index} className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                    <div className="flex items-start gap-4">

                      {/* Icon */}
                      <div className="p-1.5 bg-destructive/10 rounded">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-foreground">{trimText(item.file_name, 20)}</span>

                          <Badge
                            variant={
                              item.severity === 'Critical'
                                ? 'destructive'
                                : item.severity === 'High'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="px-2 py-0.5"
                          >
                            {item.severity}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {formatDate(item.scanned_at)}
                        </p>

                        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
