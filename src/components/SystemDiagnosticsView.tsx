import React, { useState, useEffect, Component } from "react";
import { 
  Activity, 
  Server, 
  Database, 
  Mail, 
  Layers, 
  Clock, 
  RefreshCw, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  HardDrive, 
  Send, 
  Terminal, 
  Trash2, 
  Play, 
  Cpu, 
  Radio, 
  Search, 
  BarChart3, 
  Check, 
  ShieldAlert, 
  Filter,
  ArrowUpRight,
  Info
} from "lucide-react";

export interface DiagnosticsData {
  timestamp: string;
  server: {
    status: string;
    uptimeSeconds: number;
    uptimeFormatted: string;
    nodeVersion: string;
    platform: string;
    pid: number;
    environment: string;
    memory: {
      rssMb: string;
      heapUsedMb: string;
      heapTotalMb: string;
      heapPercent: number;
    };
  };
  firestore: {
    status: string;
    isOnline: boolean;
    projectId: string;
    databaseId: string;
    pingMs: number;
    readsCount: number;
    writesCount: number;
    mode: string;
  };
  smtp: Array<{
    centerId: string;
    centerName: string;
    code?: string;
    smtpStatus: "Configured" | "Using System Default" | "Not Configured";
    host: string;
    port: number;
    userEmail: string;
    senderEmail: string;
    totalSentLogs: number;
  }>;
  queue: {
    status: string;
    pendingDirtyCollectionsCount: number;
    dirtyCollections: string[];
    emailQueuePendingCount: number;
    emailQueueDeliveredCount: number;
    isSyncing: boolean;
    hasPendingSync: boolean;
  };
  backup: {
    lastBackupTime: string;
    backupCount: number;
    lastBackupFilename: string;
    totalBackupSizeBytes: number;
  };
  sync: {
    lastSyncTime: string;
    syncStatus: string;
    syncError: string | null;
  };
  apiResponseTime: {
    avgMs: number;
    minMs: number;
    maxMs: number;
    p95Ms: number;
    totalRequestsTracked: number;
  };
  firestoreReadWriteCount: {
    reads: number;
    writes: number;
    estimatedDailyQuotaUsedPercent: number;
  };
  recentErrors: Array<{
    id: string;
    timestamp: string;
    endpoint: string;
    method: string;
    statusCode: number;
    message: string;
    stack?: string;
    centerId?: string;
  }>;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMsg: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  declare state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      errorMsg: ""
    };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, errorMsg: error?.message || "Unknown rendering exception" };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("SystemDiagnosticsView render error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-rose-50 border-2 border-rose-200 rounded-3xl text-rose-900 text-xs font-semibold space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-700">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Diagnostics Telemetry Render Safeguard</span>
          </div>
          <p>Notice: The system telemetry view caught an issue while rendering: {this.state.errorMsg}</p>
          <button
            onClick={() => (this as any).setState({ hasError: false })}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs"
          >
            Retry Loading Telemetry View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function SystemDiagnosticsContent() {
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5); // seconds
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "smtp" | "queue" | "errors">("overview");

  // Filter and Search for Error Logs
  const [errorSearch, setErrorSearch] = useState("");
  const [errorFilterLevel, setErrorFilterLevel] = useState<"all" | "5xx" | "4xx">("all");

  // Action States
  const [testingSmtpCenterId, setTestingSmtpCenterId] = useState<string | null>(null);
  const [smtpTestResult, setSmtpTestResult] = useState<{ centerId: string; success: boolean; message: string } | null>(null);
  const [isTriggeringBackup, setIsTriggeringBackup] = useState(false);
  const [backupResultMsg, setBackupResultMsg] = useState<string | null>(null);
  const [isTriggeringSync, setIsTriggeringSync] = useState(false);
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);
  const [isClearingErrors, setIsClearingErrors] = useState(false);

  const fetchDiagnostics = async () => {
    try {
      setLoading(prev => prev && !data);
      const res = await fetch("/api/erp/diagnostics");
      if (!res.ok) {
        throw new Error(`Diagnostics endpoint error (${res.status})`);
      }
      const json = await res.json();
      if (json.success && json.diagnostics) {
        setData(json.diagnostics);
        setError(null);
      } else {
        throw new Error(json.error || "Failed to load system diagnostics.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to Diagnostics service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchDiagnostics();
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Action Handlers
  const handleTestSmtp = async (centerId: string, centerName: string) => {
    setTestingSmtpCenterId(centerId);
    setSmtpTestResult(null);
    try {
      const res = await fetch("/api/erp/diagnostics/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centerId })
      });
      const json = await res.json();
      setSmtpTestResult({
        centerId,
        success: json.success,
        message: json.message || json.error || "SMTP verification complete."
      });
    } catch (err: any) {
      setSmtpTestResult({
        centerId,
        success: false,
        message: "Failed to perform SMTP test: " + err.message
      });
    } finally {
      setTestingSmtpCenterId(null);
    }
  };

  const handleTriggerBackup = async () => {
    setIsTriggeringBackup(true);
    setBackupResultMsg(null);
    try {
      const res = await fetch("/api/erp/backups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "manual_diagnostics" })
      });
      const json = await res.json();
      if (json.success) {
        setBackupResultMsg(`✅ System Backup Created! File: ${json.backup?.id || "Snapshot"}`);
        fetchDiagnostics();
      } else {
        setBackupResultMsg(`❌ Backup Failed: ${json.error}`);
      }
    } catch (err: any) {
      setBackupResultMsg(`❌ Backup Trigger Error: ${err.message}`);
    } finally {
      setIsTriggeringBackup(false);
    }
  };

  const handleTriggerSync = async () => {
    setIsTriggeringSync(true);
    setSyncResultMsg(null);
    try {
      const res = await fetch("/api/erp/diagnostics/trigger-sync", {
        method: "POST"
      });
      const json = await res.json();
      if (json.success) {
        setSyncResultMsg("✅ Database & Cloud State Synchronized Successfully!");
        fetchDiagnostics();
      } else {
        setSyncResultMsg(`❌ Sync Error: ${json.error}`);
      }
    } catch (err: any) {
      setSyncResultMsg(`❌ Sync Trigger Exception: ${err.message}`);
    } finally {
      setIsTriggeringSync(false);
    }
  };

  const handleClearErrors = async () => {
    if (!confirm("Are you sure you want to clear all recent error logs?")) return;
    setIsClearingErrors(true);
    try {
      const res = await fetch("/api/erp/diagnostics/clear-errors", {
        method: "POST"
      });
      const json = await res.json();
      if (json.success) {
        fetchDiagnostics();
      }
    } catch (err: any) {
      alert("Failed to clear error logs: " + err.message);
    } finally {
      setIsClearingErrors(false);
    }
  };

  const filteredErrors = (data?.recentErrors || []).filter(err => {
    if (!err) return false;
    const matchesSearch = 
      (err.endpoint || "").toLowerCase().includes(errorSearch.toLowerCase()) ||
      (err.message || "").toLowerCase().includes(errorSearch.toLowerCase()) ||
      (err.centerId && err.centerId.toLowerCase().includes(errorSearch.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (errorFilterLevel === "5xx") return err.statusCode >= 500;
    if (errorFilterLevel === "4xx") return err.statusCode >= 400 && err.statusCode < 500;
    return true;
  });

  const recentErrorsCount = data?.recentErrors?.length || 0;
  const smtpCount = data?.smtp?.length || 0;

  return (
    <div className="space-y-6 font-sans">
      {/* Diagnostics Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <Activity className="w-64 h-64 text-indigo-400" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 flex items-center justify-center">
                <Activity className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <h2 className="text-xl font-black tracking-tight text-white font-display flex items-center gap-2">
                  System Diagnostics & Health Telemetry
                  <span className="text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-semibold">
                    Super Admin Only
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Real-time infrastructure pulse, Firestore telemetry, SMTP health per academy, queue backlog, and exception logs.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 text-xs text-slate-200 px-2 font-medium">
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-400 animate-ping" : "bg-slate-400"}`} />
              <span>Live Monitor</span>
            </div>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                autoRefresh 
                  ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400/40" 
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {autoRefresh ? "Auto-Refresh On" : "Paused"}
            </button>

            <select
              value={refreshInterval}
              onChange={e => setRefreshInterval(Number(e.target.value))}
              disabled={!autoRefresh}
              className="bg-slate-800/80 border border-slate-700 text-slate-200 text-xs rounded-xl px-2 py-1.5 outline-none font-semibold"
            >
              <option value={3}>3s</option>
              <option value={5}>5s</option>
              <option value={10}>10s</option>
              <option value={30}>30s</option>
            </select>

            <button
              onClick={fetchDiagnostics}
              disabled={loading}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
              title="Manual Refresh Now"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border-2 border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchDiagnostics} className="px-3 py-1 bg-rose-600 text-white rounded-xl text-xs hover:bg-rose-700">
            Retry Connection
          </button>
        </div>
      )}

      {/* Loading Skeleton if no data yet */}
      {loading && !data && (
        <div className="bg-white p-12 rounded-3xl border-2 border-slate-100 text-center shadow-xs space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <h3 className="text-sm font-extrabold text-slate-800">Connecting to System Telemetry Engine...</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Gathering server status, Firestore latency, queue metrics, and SMTP state...
          </p>
        </div>
      )}

      {/* Primary Telemetry Stat Cards Grid (9 Core Indicators) */}
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-3">
            {/* 1. Server Status */}
            <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Server Status</span>
                <Server className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{data?.server?.status || "Operational"}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono truncate">
                  {data?.server?.uptimeFormatted || "--"}
                </p>
              </div>
            </div>

            {/* 2. Firestore Status */}
            <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Firestore</span>
                <Database className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="mt-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                  <span className={`w-2.5 h-2.5 rounded-full ${data?.firestore?.isOnline ? "bg-emerald-500" : "bg-amber-500"}`} />
                  <span className="truncate">{data?.firestore?.isOnline ? "Cloud Active" : "Local Engine"}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  {data?.firestore?.pingMs !== undefined ? `${data.firestore.pingMs} ms ping` : "--"}
                </p>
              </div>
            </div>

            {/* 3. SMTP Status */}
            <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">SMTP Per Center</span>
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2">
                <div className="flex items-center gap-1 text-xs font-extrabold text-slate-900">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>
                    {data?.smtp ? data.smtp.filter(s => s.smtpStatus === "Configured").length : 0}/{smtpCount} Centers
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  Custom SMTP
                </p>
              </div>
            </div>

            {/* 4. Queue Status */}
            <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Queue Status</span>
                <Layers className="w-4 h-4 text-purple-600" />
              </div>
              <div className="mt-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>{data?.queue?.status || "Healthy"}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  {data?.queue?.pendingDirtyCollectionsCount || 0} Dirty Queue
                </p>
              </div>
            </div>

            {/* 5. Last Backup Time */}
            <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Last Backup</span>
                <HardDrive className="w-4 h-4 text-teal-600" />
              </div>
              <div className="mt-2">
                <div className="text-xs font-extrabold text-slate-900 truncate">
                  {data?.backup?.lastBackupTime ? data.backup.lastBackupTime.split("T")[0] : "Saved"}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  {data?.backup?.backupCount || 0} Snapshots
                </p>
              </div>
            </div>

            {/* 6. Last Sync Time */}
            <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Last Sync</span>
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="mt-2">
                <div className="text-xs font-extrabold text-slate-900 truncate">
                  {data?.sync?.lastSyncTime ? new Date(data.sync.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "In Sync"}
                </div>
                <p className="text-[10px] text-emerald-600 font-extrabold mt-0.5">
                  Synced & Safe
                </p>
              </div>
            </div>

            {/* 7. API Response Time */}
            <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">API Latency</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2">
                <div className="text-sm font-black text-slate-900 font-mono">
                  {data?.apiResponseTime?.avgMs || 0} ms
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  Avg API Speed
                </p>
              </div>
            </div>

            {/* 8. Firestore Read/Write */}
            <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Read / Write</span>
                <BarChart3 className="w-4 h-4 text-sky-600" />
              </div>
              <div className="mt-2">
                <div className="text-xs font-black text-slate-900 font-mono">
                  {data?.firestoreReadWriteCount?.reads || 0} R / {data?.firestoreReadWriteCount?.writes || 0} W
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  Operations Count
                </p>
              </div>
            </div>

            {/* 9. Recent Errors Log */}
            <div className={`p-3.5 rounded-2xl border-2 shadow-xs flex flex-col justify-between transition-all ${
              recentErrorsCount > 0 
                ? "bg-rose-50/60 border-rose-200" 
                : "bg-white border-slate-100"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Recent Errors</span>
                <ShieldAlert className={`w-4 h-4 ${recentErrorsCount > 0 ? "text-rose-600" : "text-emerald-500"}`} />
              </div>
              <div className="mt-2">
                <div className={`text-sm font-black font-mono ${recentErrorsCount > 0 ? "text-rose-700" : "text-emerald-600"}`}>
                  {recentErrorsCount}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  Logged Exceptions
                </p>
              </div>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center border-b border-slate-200 gap-2 pb-px overflow-x-auto">
            <button
              onClick={() => setActiveSubTab("overview")}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === "overview"
                  ? "border-indigo-600 text-indigo-900 bg-indigo-50/50 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-indigo-600"
              }`}
            >
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>Core Infrastructure & Database Engine</span>
            </button>

            <button
              onClick={() => setActiveSubTab("smtp")}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === "smtp"
                  ? "border-indigo-600 text-indigo-900 bg-indigo-50/50 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-indigo-600"
              }`}
            >
              <Mail className="w-4 h-4 text-blue-600" />
              <span>SMTP Status (Per Center / Academy)</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                {smtpCount}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab("queue")}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === "queue"
                  ? "border-indigo-600 text-indigo-900 bg-indigo-50/50 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-indigo-600"
              }`}
            >
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Queue, Backups & Sync Pipeline</span>
            </button>

            <button
              onClick={() => setActiveSubTab("errors")}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === "errors"
                  ? "border-rose-600 text-rose-900 bg-rose-50/50 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-rose-600"
              }`}
            >
              <AlertTriangle className={`w-4 h-4 ${recentErrorsCount > 0 ? "text-rose-600" : "text-slate-400"}`} />
              <span>Recent Error Log</span>
              {recentErrorsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                  {recentErrorsCount}
                </span>
              )}
            </button>
          </div>

          {/* SUB-TAB 1: CORE INFRASTRUCTURE & DATABASE ENGINE */}
          {activeSubTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              {/* Server Runtime Panel */}
              <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-600" />
                    Server Health & Process Runtime
                  </h3>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    🟢 Active PID #{data?.server?.pid || "3000"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase font-black">System Uptime</span>
                    <p className="text-sm font-extrabold text-slate-900 mt-1 font-mono">
                      {data?.server?.uptimeFormatted || "0s"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase font-black">Node.js Version</span>
                    <p className="text-sm font-extrabold text-slate-900 mt-1 font-mono">
                      {data?.server?.nodeVersion || "v20.x"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase font-black">Platform & Arch</span>
                    <p className="text-sm font-extrabold text-slate-900 mt-1 font-mono">
                      {data?.server?.platform || "linux (x64)"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase font-black">Runtime Environment</span>
                    <p className="text-sm font-extrabold text-slate-900 mt-1 font-mono uppercase">
                      {data?.server?.environment || "production"}
                    </p>
                  </div>
                </div>

                {/* RAM & Memory Bar */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className="text-slate-700">Heap Memory Consumption</span>
                    <span className="font-mono text-indigo-900">
                      {data?.server?.memory?.heapUsedMb || 0} MB / {data?.server?.memory?.heapTotalMb || 0} MB ({data?.server?.memory?.heapPercent || 0}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, data?.server?.memory?.heapPercent || 10)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                    <span>RSS Memory: {data?.server?.memory?.rssMb || 0} MB</span>
                    <span>Max Safe Container Memory: 2048 MB</span>
                  </div>
                </div>
              </div>

              {/* Firestore Telemetry & Operations Panel */}
              <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-600" />
                    Firestore Engine & Operations Telemetry
                  </h3>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1 ${
                    data?.firestore?.isOnline 
                      ? "bg-emerald-100 text-emerald-800" 
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {data?.firestore?.isOnline ? "🟢 Firestore Online" : "🟡 Embedded Local Mode"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase font-black">Target Cloud Project</span>
                    <p className="text-xs font-extrabold text-slate-900 mt-1 font-mono truncate" title={data?.firestore?.projectId || ""}>
                      {data?.firestore?.projectId || "gen-lang-client"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase font-black">Firestore Latency Ping</span>
                    <p className="text-xs font-extrabold text-emerald-700 mt-1 font-mono">
                      ⚡ {data?.firestore?.pingMs !== undefined ? `${data.firestore.pingMs} ms` : "0 ms"}
                    </p>
                  </div>

                  <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <span className="text-[10px] text-indigo-700 uppercase font-black">Total Reads Count</span>
                    <p className="text-base font-black text-indigo-900 mt-1 font-mono">
                      {data?.firestoreReadWriteCount?.reads || 0}
                    </p>
                  </div>

                  <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100">
                    <span className="text-[10px] text-purple-700 uppercase font-black">Total Writes Count</span>
                    <p className="text-base font-black text-purple-900 mt-1 font-mono">
                      {data?.firestoreReadWriteCount?.writes || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-extrabold">
                    <span className="text-slate-700">Estimated Free Daily Quota Used</span>
                    <span className="font-mono text-slate-900">{data?.firestoreReadWriteCount?.estimatedDailyQuotaUsedPercent || 0}% of 50,000 Reads</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, data?.firestoreReadWriteCount?.estimatedDailyQuotaUsedPercent || 1)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                    💡 High-performance dual-write caching is active. All reads serve from local memory cache instantly with background cloud synchronization.
                  </p>
                </div>
              </div>

              {/* API Performance Gauge Card */}
              <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-xs space-y-4 md:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    API Response Time Latency Distribution
                  </h3>
                  <span className="text-xs font-mono text-slate-500 font-semibold">
                    Tracked {data?.apiResponseTime?.totalRequestsTracked || 0} Recent Endpoints
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
                    <span className="text-[10px] uppercase font-black text-emerald-800">Min Latency</span>
                    <div className="text-xl font-black text-emerald-950 font-mono mt-1">{data?.apiResponseTime?.minMs || 0} ms</div>
                  </div>

                  <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl">
                    <span className="text-[10px] uppercase font-black text-indigo-800">Avg API Speed</span>
                    <div className="text-xl font-black text-indigo-950 font-mono mt-1">{data?.apiResponseTime?.avgMs || 0} ms</div>
                  </div>

                  <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl">
                    <span className="text-[10px] uppercase font-black text-purple-800">P95 Latency</span>
                    <div className="text-xl font-black text-purple-950 font-mono mt-1">{data?.apiResponseTime?.p95Ms || 0} ms</div>
                  </div>

                  <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl">
                    <span className="text-[10px] uppercase font-black text-amber-800">Max Latency</span>
                    <div className="text-xl font-black text-amber-950 font-mono mt-1">{data?.apiResponseTime?.maxMs || 0} ms</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: SMTP STATUS PER CENTER */}
          {activeSubTab === "smtp" && (
            <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-xs space-y-5 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    Multi-Tenant SMTP Configuration & Delivery Status (Per Center)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Overview of custom SMTP servers configured for each franchise center. Each center can send custom branded fee receipts and notifications.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Configured: {data?.smtp?.filter(s => s.smtpStatus === "Configured").length || 0}</span>
                  <span className="text-slate-300">|</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>System Default: {data?.smtp?.filter(s => s.smtpStatus === "Using System Default").length || 0}</span>
                </div>
              </div>

              {smtpTestResult && (
                <div className={`p-4 rounded-2xl border-2 text-xs font-semibold flex items-center justify-between ${
                  smtpTestResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"
                }`}>
                  <div className="flex items-center gap-2">
                    {smtpTestResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                    <span><strong>SMTP Test Result ({smtpTestResult.centerId}):</strong> {smtpTestResult.message}</span>
                  </div>
                  <button onClick={() => setSmtpTestResult(null)} className="p-1 hover:bg-black/5 rounded-lg text-slate-500">
                    Dismiss
                  </button>
                </div>
              )}

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-wider">
                      <th className="p-3.5">Center Name & ID</th>
                      <th className="p-3.5">SMTP Status</th>
                      <th className="p-3.5">SMTP Server Host & Port</th>
                      <th className="p-3.5">User / Auth Email</th>
                      <th className="p-3.5">Sender Email</th>
                      <th className="p-3.5 text-center">Dispatches</th>
                      <th className="p-3.5 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(data?.smtp || []).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">
                          No centers registered yet.
                        </td>
                      </tr>
                    ) : (
                      (data?.smtp || []).map((c) => (
                        <tr key={c.centerId} className="hover:bg-indigo-50/20 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900">
                            <div>{c.centerName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {c.centerId}</div>
                          </td>

                          <td className="p-3.5">
                            {c.smtpStatus === "Configured" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Configured & Active
                              </span>
                            ) : c.smtpStatus === "Using System Default" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                Using System Default
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                Not Configured
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 font-mono text-slate-700">
                            {c.host}:{c.port}
                          </td>

                          <td className="p-3.5 font-mono text-slate-700 truncate max-w-[180px]">
                            {c.userEmail}
                          </td>

                          <td className="p-3.5 text-slate-600 truncate max-w-[180px]">
                            {c.senderEmail}
                          </td>

                          <td className="p-3.5 text-center font-bold font-mono text-slate-900">
                            {c.totalSentLogs}
                          </td>

                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleTestSmtp(c.centerId, c.centerName)}
                              disabled={testingSmtpCenterId === c.centerId}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] transition-all shadow-xs active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5"
                            >
                              {testingSmtpCenterId === c.centerId ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Testing...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Test Connection</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: QUEUE, BACKUPS & SYNC PIPELINE */}
          {activeSubTab === "queue" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              {/* Database Backup Management Panel */}
              <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-teal-600" />
                    Automated Database Backup Engine
                  </h3>
                  <button
                    onClick={handleTriggerBackup}
                    disabled={isTriggeringBackup}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {isTriggeringBackup ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating Backup...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Run Manual Backup Now</span>
                      </>
                    )}
                  </button>
                </div>

                {backupResultMsg && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                    {backupResultMsg}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase font-black">Last System Backup</span>
                    <p className="text-xs font-extrabold text-slate-900 mt-1 font-mono">
                      {data?.backup?.lastBackupTime || "Active Safeguard"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase font-black">Total Backup Snapshots</span>
                    <p className="text-xs font-extrabold text-slate-900 mt-1 font-mono">
                      {data?.backup?.backupCount || 0} Files
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Automated daily backups are stored securely in both cloud Firestore chunks and local disk snapshots (`backups/`). Safety backups are also generated before any restoration or database migration.
                </p>
              </div>

              {/* Sync & Queue Pipeline Panel */}
              <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    Background Queue & Cloud Sync Pipeline
                  </h3>
                  <button
                    onClick={handleTriggerSync}
                    disabled={isTriggeringSync}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {isTriggeringSync ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Syncing...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Force Cloud Sync Now</span>
                      </>
                    )}
                  </button>
                </div>

                {syncResultMsg && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                    {syncResultMsg}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase font-black">Last Sync Time</span>
                    <p className="text-xs font-extrabold text-slate-900 mt-1 font-mono">
                      {data?.sync?.lastSyncTime ? new Date(data.sync.lastSyncTime).toLocaleString() : "Realtime active"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase font-black">Dirty Collections Queue</span>
                    <p className="text-xs font-extrabold text-purple-900 mt-1 font-mono">
                      {data?.queue?.pendingDirtyCollectionsCount || 0} Pending
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                  <span className="text-[10px] text-slate-500 uppercase font-black block mb-1">Queue Health Status</span>
                  <div className="flex items-center gap-2 font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{data?.queue?.status || "Optimal"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 4: RECENT ERRORS LOG */}
          {activeSubTab === "errors" && (
            <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-xs space-y-5 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-rose-950 font-display flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    Recent System & API Error Log (50 Most Recent)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time capture of HTTP 4xx/5xx responses, failed database queries, SMTP timeouts, and uncaught backend exceptions.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearErrors}
                    disabled={isClearingErrors || recentErrorsCount === 0}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold transition-all disabled:opacity-40 inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Error Log</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search error logs by endpoint, message, or center ID..."
                    value={errorSearch}
                    onChange={e => setErrorSearch(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-800 text-xs font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 font-bold text-slate-600">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span>Status Filter:</span>
                  <button
                    onClick={() => setErrorFilterLevel("all")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      errorFilterLevel === "all" ? "bg-indigo-600 text-white font-black" : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setErrorFilterLevel("5xx")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      errorFilterLevel === "5xx" ? "bg-rose-600 text-white font-black" : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    5xx Server
                  </button>
                  <button
                    onClick={() => setErrorFilterLevel("4xx")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      errorFilterLevel === "4xx" ? "bg-amber-600 text-white font-black" : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    4xx Client
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-wider">
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">HTTP Code</th>
                      <th className="p-3.5">Endpoint / Action</th>
                      <th className="p-3.5">Context / Center</th>
                      <th className="p-3.5">Error Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredErrors.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                          {recentErrorsCount === 0
                            ? "🎉 No recent system errors logged! Operations are running smoothly."
                            : "No error logs match your current search filter."}
                        </td>
                      </tr>
                    ) : (
                      filteredErrors.map((err) => (
                        <tr key={err.id} className="hover:bg-rose-50/20 transition-colors">
                          <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                            {err.timestamp ? new Date(err.timestamp).toLocaleString() : "--"}
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
                              (err.statusCode || 500) >= 500 
                                ? "bg-rose-100 text-rose-800 border border-rose-200" 
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}>
                              {err.statusCode || 500}
                            </span>
                          </td>

                          <td className="p-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {err.endpoint || "/api"}
                          </td>

                          <td className="p-3.5 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                            {err.centerId || "Global"}
                          </td>

                          <td className="p-3.5 text-rose-900 font-mono text-[11px] leading-relaxed max-w-md break-words">
                            {err.message || "Unknown error"}
                            {err.stack && (
                              <details className="mt-1">
                                <summary className="text-[10px] text-slate-500 hover:text-slate-700 cursor-pointer underline">
                                  View Stack Trace
                                </summary>
                                <pre className="text-[9px] bg-slate-900 text-slate-200 p-2 rounded-lg mt-1 overflow-x-auto font-mono">
                                  {err.stack}
                                </pre>
                              </details>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function SystemDiagnosticsView() {
  return (
    <ErrorBoundary>
      <SystemDiagnosticsContent />
    </ErrorBoundary>
  );
}

export default SystemDiagnosticsView;
