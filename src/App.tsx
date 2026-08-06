import React, { useState, useEffect, useRef, useMemo } from "react";
import { Center, Teacher, Student, CRMLead, AttendanceRecord, FeeRecord, ExpenseRecord, HomeworkRecord, ExamRecord, StudentPracticeAssignment, StudentPracticeSubmission, AcademyLeaderboardEntry, TeacherTrainee } from "./types";
import SuperAdminView from "./components/SuperAdminView";
import CenterAdminView from "./components/CenterAdminView";
import TeacherView from "./components/TeacherView";
import ManagerTeacherView from "./components/ManagerTeacherView";
import CrmView from "./components/CrmView";
import PracticeGeneratorView from "./components/PracticeGeneratorView";
import DeveloperBlueprintView from "./components/DeveloperBlueprintView";
import StudentPortalView from "./components/StudentPortalView";
import PublicParentForm from "./components/PublicParentForm";
import PublicStudentRegisterForm from "./components/PublicStudentRegisterForm";
import PublicMaterialOrderForm from "./components/PublicMaterialOrderForm";
import PublicCompetitionRegisterModal from "./components/PublicCompetitionRegisterModal";
import LandingPageView from "./components/LandingPageView";
import { LayoutDashboard, Users, GraduationCap, PhoneCall, Sparkles, Database, Shield, BookOpen, UserCheck, Settings, RefreshCw, LogIn, Trophy, LogOut, Lock, Mail, User, Camera, Clipboard, Check, Smartphone, Download, Bell, ChevronDown, Globe, WifiOff, ShieldAlert } from "lucide-react";
import { getPendingCount, processPendingQueue } from "./utils/offlineQueue";

function DatabaseHealthBadge({
  status,
  dbMode,
  lastSyncTime,
  pendingCount,
  onManualSync
}: {
  status: string;
  dbMode?: string;
  lastSyncTime: string;
  pendingCount: number;
  onManualSync: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  let badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20";
  let dotColor = "bg-emerald-500 animate-pulse";
  let icon = <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;

  if (status === "Syncing...") {
    badgeStyle = "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20";
    dotColor = "bg-amber-400 animate-ping";
    icon = <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />;
  } else if (status === "Offline") {
    badgeStyle = "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750";
    dotColor = "bg-slate-400";
    icon = <WifiOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  } else if (status === "Sync Error") {
    badgeStyle = "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20";
    dotColor = "bg-rose-500 animate-bounce";
    icon = <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
  }

  const formatSyncTime = (iso: string) => {
    if (!iso) return "Not synced yet";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const diffMs = Date.now() - d.getTime();
    if (diffMs < 60000) return "Just now";
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer active:scale-95 ${badgeStyle}`}
        title="Live Database Health & Sync Status Indicator"
      >
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        {icon}
        <span className="hidden sm:inline font-mono font-bold">{status}</span>
        {pendingCount > 0 && (
          <span className="bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full text-[9px] font-black font-mono">
            {pendingCount}
          </span>
        )}
      </button>

      {showTooltip && (
        <>
          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowTooltip(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-slate-950/95 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 text-xs text-slate-300 space-y-3 animate-scale-up backdrop-blur-md text-left">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-black text-slate-200 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-400" />
                Database Health Status
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${badgeStyle}`}>
                {status}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Primary Database:</span>
                <span className="font-mono text-indigo-300 font-bold">{dbMode || "Local Database Engine"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Successful Sync:</span>
                <span className="font-mono font-bold text-slate-200">{formatSyncTime(lastSyncTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pending Local Queue:</span>
                <span className={`font-mono font-bold ${pendingCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {pendingCount > 0 ? `${pendingCount} item(s) queued` : "0 items (In Sync)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Restore Policy:</span>
                <span className="text-emerald-400 font-bold">✓ Safe Merge Only</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowTooltip(false);
                onManualSync();
              }}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Force Immediate Sync</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  // Master SaaS User Roles Switcher
  type Role = "Super Admin" | "Center Admin" | "Teacher" | "Marketing / Sales Staff" | "Abacus Content Engine" | "Developer Blueprint" | "Student" | "Manager + Teacher";

  // Unified Centralized Authentication State
  interface LoggedInUser {
    role: Role;
    email: string;
    id?: string;
    name: string;
    photo?: string;
    centerId?: string;
  }
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(() => {
    const saved = localStorage.getItem("erp_logged_in_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [currentRole, setCurrentRole] = useState<Role>(() => {
    const saved = localStorage.getItem("erp_logged_in_user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        return u.role;
      } catch (e) {
        return "Center Admin";
      }
    }
    return "Center Admin";
  });

  // Active sub-dashboard tab for Center Admin and Manager + Teacher roles
  const [activeDashboardTab, setActiveDashboardTab] = useState<"admin" | "teacher">("admin");

  const [loginEmail, setLoginEmail] = useState(() => {
    return localStorage.getItem("erp_remembered_email") || "";
  });
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return !!localStorage.getItem("erp_remembered_email");
  });

  // Profile & Security states
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [profileTimezone, setProfileTimezone] = useState("local");
  const [profileSaving, setProfileSaving] = useState(false);

  // Forgot password states
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  // Multi-Tenant ERP Master Database States
  const [centers, setCenters] = useState<Center[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [homework, setHomework] = useState<HomeworkRecord[]>([]);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [practiceAssignments, setPracticeAssignments] = useState<StudentPracticeAssignment[]>([]);
  const [practiceSubmissions, setPracticeSubmissions] = useState<StudentPracticeSubmission[]>([]);
  const [leaderboard, setLeaderboard] = useState<AcademyLeaderboardEntry[]>([]);
  const [studentFeePlans, setStudentFeePlans] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [promotionRequests, setPromotionRequests] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [materialProducts, setMaterialProducts] = useState<any[]>([]);
  const [materialOrders, setMaterialOrders] = useState<any[]>([]);
  const [shippingSettings, setShippingSettings] = useState<any>(null);
  const [landingConfig, setLandingConfig] = useState<any>(null);
  const [paymentPlans, setPaymentPlans] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [timingChangeRequests, setTimingChangeRequests] = useState<any[]>([]);
  const [teacherTrainees, setTeacherTrainees] = useState<TeacherTrainee[]>([]);

  // Strict Dual-Role Check: Only users who are in the database as a student AND have a Center Admin account
  const isDualStudentAndCenterAdmin = useMemo(() => {
    if (!currentUser || !currentUser.email) return false;
    const emailLower = currentUser.email.trim().toLowerCase();

    const isCenterAdminAccount = currentUser.role === "Center Admin" ||
                                  currentUser.role === "Manager + Teacher" ||
                                  centers.some(c => c.email?.trim().toLowerCase() === emailLower || c.id === currentUser.id);

    const isStudentInDb = students.some(s => s.email?.trim().toLowerCase() === emailLower || s.id === currentUser.id);

    return isCenterAdminAccount && isStudentInDb;
  }, [currentUser, centers, students]);

  const getSelectableRoles = (): Role[] => {
    if (!currentUser) return [];
    const origRole = currentUser.role;

    if (origRole === "Super Admin") {
      return ["Super Admin", "Center Admin", "Teacher", "Marketing / Sales Staff", "Abacus Content Engine", "Developer Blueprint"];
    }

    // STRICT USER MANDATE:
    // Only users in database as student AND having an account of Center Admin get role switching option between Center Admin and Student
    if (isDualStudentAndCenterAdmin) {
      return ["Center Admin", "Student"];
    }

    return [origRole];
  };

  const [loading, setLoading] = useState(true);
  const [isDataSyncing, setIsDataSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);

  // Rate limiting and fetch deduplication refs
  const rateLimitCooldownUntilRef = useRef<number>(0);
  const isFetchingDataRef = useRef<boolean>(false);

  // Database Health and Sync Indicator States
  const [dbHealthStatus, setDbHealthStatus] = useState<"Connected" | "Syncing..." | "Offline" | "Sync Error">("Connected");
  const [dbModeStr, setDbModeStr] = useState<string>("Local Database Engine (Active)");
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  const fetchDbStatus = async () => {
    if (Date.now() < rateLimitCooldownUntilRef.current) return;
    try {
      const localPending = getPendingCount();
      setPendingSyncCount(localPending);

      if (!navigator.onLine) {
        setDbHealthStatus("Offline");
        return;
      }

      const res = await fetch("/api/erp/db-status");
      if (res.status === 429) {
        rateLimitCooldownUntilRef.current = Date.now() + 30000;
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setDbHealthStatus(data.status);
          if (data.mode) setDbModeStr(data.mode);
          if (data.lastSuccessfulSyncTime) setLastSyncTime(data.lastSuccessfulSyncTime);
          if (data.pendingSyncCount !== undefined) {
            setPendingSyncCount(data.pendingSyncCount + localPending);
          }
        }
      }
    } catch (err) {
      if (!navigator.onLine) {
        setDbHealthStatus("Offline");
      }
    }
  };

  // Center Admin / Manager sub-tab state controlled globally for deep-linking
  const [centerSubTab, setCenterSubTab] = useState<"Teachers" | "Students" | "Fees" | "Expenses" | "PnL" | "FeeSetup" | "NotificationPreferences" | "CRM" | "ConceptWorksheets" | "AOS Subscription" | "Materials" | "ActivityLog" | "Backups" | "TimingApprovals" | "OrderMaterials" | "Certificates">("Students");

  // Real-time Lead Notification State
  const [activeLeadNotification, setActiveLeadNotification] = useState<CRMLead | null>(null);
  const [formConfig, setFormConfig] = useState<any>(null);

  // PWA (Progressive Web App) Install States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);

  // Minimal Top Menu Dropdown States
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState<boolean>(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState<boolean>(false);

  const getQuickActions = () => {
    const actions: { label: string; icon: string; onClick: () => void }[] = [];
    
    if (currentRole === "Student") {
      actions.push({
        label: "Speed Drills",
        icon: "🧮",
        onClick: () => {
          document.getElementById("practice-section")?.scrollIntoView({ behavior: "smooth" });
          setShowMenuDropdown(false);
        }
      });
      actions.push({
        label: "Homework Tasks",
        icon: "📝",
        onClick: () => {
          document.getElementById("assignments-section")?.scrollIntoView({ behavior: "smooth" });
          setShowMenuDropdown(false);
        }
      });
      actions.push({
        label: "Hall of Fame",
        icon: "🏆",
        onClick: () => {
          document.getElementById("hall-of-fame-section")?.scrollIntoView({ behavior: "smooth" });
          setShowMenuDropdown(false);
        }
      });
    } else if (currentRole === "Center Admin" || currentRole === "Super Admin" || currentRole === "Manager + Teacher") {
      actions.push({
        label: "Admin Workspace",
        icon: "💼",
        onClick: () => {
          setActiveDashboardTab("admin");
          setShowMenuDropdown(false);
        }
      });
      actions.push({
        label: "Teacher Workspace",
        icon: "📚",
        onClick: () => {
          setActiveDashboardTab("teacher");
          setShowMenuDropdown(false);
        }
      });
    } else if (currentRole === "Marketing / Sales Staff") {
      actions.push({
        label: "CRM Inbox Leads",
        icon: "📊",
        onClick: () => {
          document.getElementById("crm-inbox-section")?.scrollIntoView({ behavior: "smooth" });
          setShowMenuDropdown(false);
        }
      });
    }
    
    return actions;
  };

  const handleClearStudentNotifs = async () => {
    const studentObj = students.find(s => s.id === currentUser?.id || s.email?.toLowerCase() === currentUser?.email?.toLowerCase());
    if (!studentObj) return;
    try {
      const res = await fetch("/api/erp/notifications/read-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: studentObj.id })
      });
      if ((await res.json()).success) {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getAcademyName = () => {
    let name = "My Abacus Academy";
    if (formConfig && formConfig.heading) {
      name = formConfig.heading;
      name = name.replace(/\s*(?:CRM Desk|CRM|Desk|Form|Registration|Portal|Learning Suite|Management)\b/gi, "").trim();
    }
    if (name) {
      localStorage.setItem("academy_name", name);
    }
    return name || "My Abacus Academy";
  };

  const getActiveCenterBranding = () => {
    // If logged in, prioritize the user's center
    const userCenterId = currentUser?.centerId || (currentUser?.role === "Center Admin" ? currentUser?.id : null);
    
    if (userCenterId) {
      const found = centers.find(c => c.id === userCenterId);
      if (found) {
        return {
          name: found.name,
          logo: found.logo || null
        };
      }
    }
    
    // Before login: Always "My Abacus Academy" with no custom logo
    return {
      name: "My Abacus Academy",
      logo: null
    };
  };

  // Web Audio API Synthesizer Chime for real-time lead alert
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // First high-quality chime (lower pitch)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain1.gain.setValueAtTime(0, audioCtx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.3);

      // Second chime (higher pitch, slightly delayed for a pleasant mobile alert feel)
      setTimeout(() => {
        try {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
          gain2.gain.setValueAtTime(0, audioCtx.currentTime);
          gain2.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
          gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.5);
        } catch (err) {
          console.error("Audio trigger error", err);
        }
      }, 120);
    } catch (e) {
      console.error("Failed to generate notification chime:", e);
    }
  };

  // Selective sync timestamp reference to track incremental delta updates
  const lastSyncTimestampRef = useRef<number>(0);

  // Helper for selective merging of delta updates into existing state collections by record ID
  const mergeDeltaList = <T extends { id?: string | number }>(prevList: T[], deltaList: T[]): T[] => {
    if (!deltaList || !Array.isArray(deltaList) || deltaList.length === 0) return prevList || [];
    if (!prevList || !Array.isArray(prevList) || prevList.length === 0) return deltaList;
    
    const map = new Map<string, T>();
    prevList.forEach(item => {
      if (item && item.id !== undefined && item.id !== null) {
        map.set(String(item.id), item);
      }
    });

    let hasChanges = false;
    deltaList.forEach(item => {
      if (item && item.id !== undefined && item.id !== null) {
        const key = String(item.id);
        const existing = map.get(key);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(item)) {
          map.set(key, item);
          hasChanges = true;
        }
      }
    });

    return hasChanges ? Array.from(map.values()) : prevList;
  };

  // Fetch initial or incremental datasets from the Express/Vite backend database using timestamps
  const loadData = async (retries = 1, forceFullSync = false) => {
    if (Date.now() < rateLimitCooldownUntilRef.current) {
      setLoading(false);
      setIsDataSyncing(false);
      return;
    }

    if (isFetchingDataRef.current) {
      return;
    }

    isFetchingDataRef.current = true;
    setIsDataSyncing(true);
    let retryScheduled = false;
    try {
      const since = forceFullSync ? 0 : lastSyncTimestampRef.current;
      const headers: Record<string, string> = {};
      if (currentUser?.email) {
        headers["x-logged-in-user-email"] = currentUser.email;
      }
      if (since > 0) {
        headers["x-last-sync-timestamp"] = String(since);
      }

      const res = await fetch(`/api/erp/data?since=${since}`, { headers });
      
      if (res.status === 429) {
        console.warn("[RATE LIMIT] 429 Rate limit response detected. Activating 30s cooldown.");
        rateLimitCooldownUntilRef.current = Date.now() + 30000;
        setDbHealthStatus("Connected");
        return;
      }

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const rawText = await res.text();
      if (rawText.includes("Rate exceeded")) {
        console.warn("[RATE LIMIT] Text 'Rate exceeded' detected. Activating 30s cooldown.");
        rateLimitCooldownUntilRef.current = Date.now() + 30000;
        setDbHealthStatus("Connected");
        return;
      }

      let json: any = null;
      try {
        json = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error("Invalid JSON response received from server");
      }

      if (json && json.success && json.data) {
        setSyncError(false);
        setDbHealthStatus("Connected");
        const d = json.data;
        const isDelta = Boolean(json.isIncremental);

        if (json.serverTimestamp) {
          lastSyncTimestampRef.current = json.serverTimestamp;
        }

        if (isDelta) {
          // Selective delta update merge
          setCenters(prev => mergeDeltaList(prev, d.centers || []));
          setTeachers(prev => mergeDeltaList(prev, d.teachers || []));
          setStudents(prev => mergeDeltaList(prev, d.students || []));
          setAttendance(prev => mergeDeltaList(prev, d.attendance || []));
          setFees(prev => mergeDeltaList(prev, d.fees || []));
          setExpenses(prev => mergeDeltaList(prev, d.expenses || []));
          setHomework(prev => mergeDeltaList(prev, d.homework || []));
          setExams(prev => mergeDeltaList(prev, d.exams || []));
          setPracticeAssignments(prev => mergeDeltaList(prev, d.practiceAssignments || []));
          setPracticeSubmissions(prev => mergeDeltaList(prev, d.practiceSubmissions || []));
          setLeaderboard(prev => mergeDeltaList(prev, d.leaderboard || []));
          setStudentFeePlans(prev => mergeDeltaList(prev, d.studentFeePlans || []));
          setCourses(prev => mergeDeltaList(prev, d.courses || []));
          setPromotionRequests(prev => mergeDeltaList(prev, d.promotionRequests || []));
          setMaterials(prev => mergeDeltaList(prev, d.materials || []));
          setMaterialProducts(prev => mergeDeltaList(prev, d.materialProducts || []));
          setMaterialOrders(prev => mergeDeltaList(prev, d.materialOrders || []));
          setPaymentPlans(prev => mergeDeltaList(prev, d.paymentPlans || []));
          setActivityLogs(prev => mergeDeltaList(prev, d.activityLogs || []));
          setTimingChangeRequests(prev => mergeDeltaList(prev, d.timingChangeRequests || []));
          setTeacherTrainees(prev => mergeDeltaList(prev, d.teacherTrainees || []));
          if (d.shippingSettings) setShippingSettings(d.shippingSettings);
          if (d.landingConfig) setLandingConfig(d.landingConfig);
        } else {
          // Full dataset update
          setCenters(prev => JSON.stringify(prev) !== JSON.stringify(d.centers) ? d.centers : prev);
          setTeachers(prev => JSON.stringify(prev) !== JSON.stringify(d.teachers) ? d.teachers : prev);
          setStudents(prev => JSON.stringify(prev) !== JSON.stringify(d.students) ? d.students : prev);
          setAttendance(prev => JSON.stringify(prev) !== JSON.stringify(d.attendance) ? d.attendance : prev);
          setFees(prev => JSON.stringify(prev) !== JSON.stringify(d.fees) ? d.fees : prev);
          setExpenses(prev => JSON.stringify(prev) !== JSON.stringify(d.expenses) ? d.expenses : prev);
          setHomework(prev => JSON.stringify(prev) !== JSON.stringify(d.homework) ? d.homework : prev);
          setExams(prev => JSON.stringify(prev) !== JSON.stringify(d.exams) ? d.exams : prev);
          setPracticeAssignments(prev => JSON.stringify(prev) !== JSON.stringify(d.practiceAssignments || []) ? (d.practiceAssignments || []) : prev);
          setPracticeSubmissions(prev => JSON.stringify(prev) !== JSON.stringify(d.practiceSubmissions || []) ? (d.practiceSubmissions || []) : prev);
          setLeaderboard(prev => JSON.stringify(prev) !== JSON.stringify(d.leaderboard || []) ? (d.leaderboard || []) : prev);
          setStudentFeePlans(prev => JSON.stringify(prev) !== JSON.stringify(d.studentFeePlans || []) ? (d.studentFeePlans || []) : prev);
          setCourses(prev => JSON.stringify(prev) !== JSON.stringify(d.courses || []) ? (d.courses || []) : prev);
          setPromotionRequests(prev => JSON.stringify(prev) !== JSON.stringify(d.promotionRequests || []) ? (d.promotionRequests || []) : prev);
          setMaterials(prev => JSON.stringify(prev) !== JSON.stringify(d.materials || []) ? (d.materials || []) : prev);
          setMaterialProducts(prev => JSON.stringify(prev) !== JSON.stringify(d.materialProducts || []) ? (d.materialProducts || []) : prev);
          setMaterialOrders(prev => JSON.stringify(prev) !== JSON.stringify(d.materialOrders || []) ? (d.materialOrders || []) : prev);
          setShippingSettings(prev => JSON.stringify(prev) !== JSON.stringify(d.shippingSettings || null) ? (d.shippingSettings || null) : prev);
          setLandingConfig(prev => JSON.stringify(prev) !== JSON.stringify(d.landingConfig || null) ? (d.landingConfig || null) : prev);
          setPaymentPlans(prev => JSON.stringify(prev) !== JSON.stringify(d.paymentPlans || []) ? (d.paymentPlans || []) : prev);
          setActivityLogs(prev => JSON.stringify(prev) !== JSON.stringify(d.activityLogs || []) ? (d.activityLogs || []) : prev);
          setTimingChangeRequests(prev => JSON.stringify(prev) !== JSON.stringify(d.timingChangeRequests || []) ? (d.timingChangeRequests || []) : prev);
          setTeacherTrainees(prev => JSON.stringify(prev) !== JSON.stringify(d.teacherTrainees || []) ? (d.teacherTrainees || []) : prev);
        }

        if (d.formConfig && d.formConfig.length > 0) {
          setFormConfig(prev => JSON.stringify(prev) !== JSON.stringify(d.formConfig[0]) ? d.formConfig[0] : prev);
        }

        // Compare leads length and values to detect new arrivals in real-time
        setLeads((prevLeads) => {
          const deltaLeads = d.leads || [];
          if (prevLeads && prevLeads.length > 0 && deltaLeads.length > 0) {
            const newLeads = deltaLeads.filter((newL: CRMLead) => !prevLeads.some((oldL: CRMLead) => oldL.id === newL.id));
            if (newLeads.length > 0) {
              const latestLead = newLeads[newLeads.length - 1];
              
              const isCenterAdmin = currentRole === "Center Admin";
              const isSalesOrMarketing = currentRole === "Marketing / Sales Staff";
              const isSuperAdmin = currentRole === "Super Admin";
              const isTeacherWithAccess = currentRole === "Teacher" && !!currentUser?.permitLeadAccess;
              
              const isAuthorizedRole = isSuperAdmin || isCenterAdmin || isSalesOrMarketing || isTeacherWithAccess;
              const isAssociatedCenter = isSuperAdmin || (currentUser?.centerId && latestLead.centerId === currentUser.centerId);

              if (isAuthorizedRole && isAssociatedCenter) {
                setActiveLeadNotification(latestLead);
                playNotificationSound();
              }
            }
          }
          return isDelta ? mergeDeltaList(prevLeads, deltaLeads) : deltaLeads;
        });

        // Sync the current user's details (photo, name, timezone) from freshly loaded data
        if (currentUser) {
          let updatedUserObj: any = null;
          const emailLower = currentUser.email?.toLowerCase();
          
          if (currentUser.role === "Super Admin") {
            const adminMatch = d.admins?.find((a: any) => a.email?.toLowerCase() === emailLower);
            if (adminMatch) {
              updatedUserObj = {
                ...currentUser,
                name: adminMatch.name,
                photo: adminMatch.photo || "",
                timezone: adminMatch.timezone || "local"
              };
            }
          } else if (currentUser.role === "Center Admin") {
            const centerMatch = d.centers?.find((c: any) => c.email?.toLowerCase() === emailLower || c.id === currentUser.id);
            if (centerMatch) {
              updatedUserObj = {
                ...currentUser,
                name: centerMatch.ownerName,
                photo: centerMatch.photo || "",
                timezone: centerMatch.timezone || "local"
              };
            }
          } else if (currentUser.role === "Teacher" || currentUser.role === "Manager + Teacher") {
            const teacherMatch = d.teachers?.find((t: any) => t.email?.toLowerCase() === emailLower || t.id === currentUser.id);
            if (teacherMatch) {
              updatedUserObj = {
                ...currentUser,
                name: teacherMatch.name,
                photo: teacherMatch.photo || "",
                timezone: teacherMatch.timezone || "local"
              };
            }
          } else if (currentUser.role === "Student") {
            const studentMatch = d.students?.find((s: any) => s.email?.toLowerCase() === emailLower || s.id === currentUser.id);
            if (studentMatch) {
              updatedUserObj = {
                ...currentUser,
                name: studentMatch.studentName,
                photo: studentMatch.photo || "",
                timezone: studentMatch.timezone || "local"
              };
            }
          }

          if (updatedUserObj && (
            updatedUserObj.name !== currentUser.name ||
            updatedUserObj.photo !== currentUser.photo ||
            updatedUserObj.timezone !== currentUser.timezone
          )) {
            setCurrentUser(updatedUserObj);
            localStorage.setItem("erp_logged_in_user", JSON.stringify(updatedUserObj));
          }
        }
      } else {
        throw new Error(json?.error || "Invalid multi-tenant dataset response structure");
      }
    } catch (err: any) {
      console.error("Failed to fetch initial multi-tenant datasets", err);
      const msg = String(err?.message || err);
      if (msg.includes("429") || msg.includes("Rate exceeded")) {
        rateLimitCooldownUntilRef.current = Date.now() + 30000;
      } else if (retries > 0) {
        retryScheduled = true;
        setTimeout(() => {
          loadData(retries - 1, forceFullSync);
        }, 5000);
      } else {
        setSyncError(true);
      }
    } finally {
      isFetchingDataRef.current = false;
      if (!retryScheduled) {
        setLoading(false);
        setIsDataSyncing(false);
      }
    }
  };

  useEffect(() => {
    loadData();
    fetchDbStatus();

    const handleOnline = async () => {
      if (Date.now() < rateLimitCooldownUntilRef.current) return;
      console.log("[OFFLINE RECOVERY] Network restored. Processing offline queue...");
      setDbHealthStatus("Syncing...");
      const result = await processPendingQueue();
      if (result.processed > 0) {
        console.log(`[OFFLINE RECOVERY] Synced ${result.processed} offline requests.`);
      }
      await loadData(0, true);
      await fetchDbStatus();
    };

    const handleOffline = () => {
      setDbHealthStatus("Offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Poll for db health and queue recovery every 60 seconds (throttled)
    const interval = setInterval(async () => {
      if (Date.now() < rateLimitCooldownUntilRef.current) return;
      if (getPendingCount() > 0 && navigator.onLine) {
        await processPendingQueue();
        await loadData();
      }
      await fetchDbStatus();
    }, 60000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Listen to browser PWA install triggers
  // Listen to browser PWA install triggers
  useEffect(() => {
    // Check if the event was already captured globally
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    // Set up a listener for React lifecycle
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPrompt = e;
      console.log("[PWA] Captured beforeinstallprompt event");
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as any);

    // Register a callback in case the global listener fires before this effect but after checking
    (window as any).onBeforeInstallPromptCaptured = (e: any) => {
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      (window as any).deferredPrompt = null;
      console.log("[PWA] Application successfully installed on device");
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as any);
      window.removeEventListener("appinstalled", handleAppInstalled);
      delete (window as any).onBeforeInstallPromptCaptured;
    };
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] User response to installation: ${outcome}`);
        setDeferredPrompt(null);
        (window as any).deferredPrompt = null;
      } catch (err) {
        console.error("Installation prompt failed:", err);
      }
    } else {
      // Check if we are currently embedded inside an iframe
      if (window.self !== window.top) {
        const confirmNewTab = window.confirm("To install this app directly, please open it in a new window or tab. Would you like to open it now?");
        if (confirmNewTab) {
          window.open(window.location.href, "_blank");
        }
      } else {
        alert("PWA direct installation is supported on Android/Chrome, Edge, and Windows. If you are on an iPhone/iPad, click the Share button in Safari, then select 'Add to Home Screen' to install.");
      }
    }
  };

  // Log centralized CRM and operation events
  const logActivity = async (action: string, details: string, centerId?: string) => {
    try {
      const activeCenterId = centerId || currentUser?.centerId || "C001";
      const activeCenter = (centers || []).find(c => c.id === activeCenterId);
      const activeCenterName = activeCenter?.name || "Main Center";
      await fetch("/api/erp/activity-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: currentUser?.name || "System User",
          role: currentUser?.role || "Center Admin",
          action,
          centerId: activeCenterId,
          centerName: activeCenterName,
          details
        })
      });
      loadData();
    } catch (e) {
      console.error("Failed to log activity", e);
    }
  };

  // Sync operations with Express Backend
  const handleAddCenter = async (payload: Partial<Center>) => {
    try {
      const res = await fetch("/api/erp/add-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setCenters(prev => [...prev, data.center]);
      }
    } catch (e) {
      console.error("Failed adding center", e);
    }
  };

  const handleAddTeacher = async (payload: Partial<Teacher>) => {
    try {
      const res = await fetch("/api/erp/add-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setTeachers(prev => [...prev, data.teacher]);
        return data.teacher;
      }
    } catch (e) {
      console.error("Failed adding teacher", e);
    }
    return null;
  };

  const handleAddStudent = async (payload: Partial<Student>) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (currentUser?.email) {
        headers["x-logged-in-user-email"] = currentUser.email;
      }
      const res = await fetch("/api/erp/add-student", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setStudents(prev => {
          const exists = prev.some(s => s.id === data.student.id);
          if (exists) {
            return prev.map(s => s.id === data.student.id ? data.student : s);
          }
          return [...prev, data.student];
        });
        logActivity("Student Creation", `Created student: ${data.student.studentName} (ID: ${data.student.id})`, payload.centerId);
        return data.student;
      } else {
        throw new Error(data.error || "Failed to add student on server.");
      }
    } catch (e: any) {
      console.error("Failed adding student", e);
      throw e;
    }
  };

  const handleEditStudent = async (payload: Partial<Student>) => {
    try {
      const res = await fetch("/api/erp/edit-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setStudents(prev => prev.map(s => s.id === payload.id ? { ...s, ...data.student } : s));
        logActivity("Student Edit", `Updated student details: ${data.student.studentName} (ID: ${data.student.id})`, payload.centerId);
      }
    } catch (e) {
      console.error("Failed editing student", e);
    }
  };

  const handleUpdateStudentFeePlan = async (id: string, monthlyFee: number) => {
    try {
      const res = await fetch("/api/erp/update-student-fee-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, monthlyFee })
      });
      const data = await res.json();
      if (data.success) {
        setStudentFeePlans(data.studentFeePlans);
        loadData();
      }
    } catch (e) {
      console.error("Failed to update student fee plan", e);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const targetS = students.find(s => s.id === studentId);
      const res = await fetch("/api/erp/delete-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: studentId })
      });
      const data = await res.json();
      if (data.success) {
        setStudents(prev => prev.filter(s => s.id !== studentId));
        logActivity("Student Delete", `Deleted student: ${targetS ? targetS.studentName : studentId} (ID: ${studentId})`, targetS?.centerId);
      }
    } catch (e) {
      console.error("Failed deleting student", e);
    }
  };

  const handleAddLead = async (payload: Partial<CRMLead>) => {
    if (!payload || (!payload.name && !payload.parentMobile && !payload.email && !payload.parentName)) {
      console.warn("[CRM] handleAddLead ignored empty payload");
      return;
    }
    try {
      const res = await fetch("/api/erp/add-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.lead) {
        setLeads(prev => {
          const exists = prev.some(l => l.id === data.lead.id);
          if (exists) {
            return prev.map(l => l.id === data.lead.id ? data.lead : l);
          }
          return [data.lead, ...prev];
        });
        logActivity(data.isExisting ? "Lead Inquiry Entry Added" : "Lead Creation", `Registered enquiry for: ${data.lead.name} (${data.lead.parentMobile || data.lead.email})`, payload.centerId);
      }
    } catch (e) {
      console.error("Failed adding CRM lead", e);
    }
  };

  const handleMarkAttendance = async (records: any[], date?: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const dateVal = date || today;
      const res = await fetch("/api/erp/add-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records, date: dateVal })
      });
      const data = await res.json();
      if (data.success) {
        // Sync local
        setAttendance(prev => {
          const filtered = prev.filter(a => !(a.date === dateVal && records.some(r => r.studentId === a.studentId)));
          const newRecs = records.map(r => ({
            studentId: r.studentId,
            date: dateVal,
            status: r.status as "Present" | "Absent",
            level: r.level,
            batch: r.batch
          }));
          return [...filtered, ...newRecs];
        });
        logActivity("Attendance Changes", `Marked attendance for ${records.length} students on ${dateVal}`);
        if (data.warning) {
          alert(data.warning);
        }
      }
    } catch (e) {
      console.error("Failed logging attendance", e);
    }
  };

  const handlePayFee = async (feeId: string, paidDate?: string, paymentMethod?: string, referenceNumber?: string) => {
    try {
      const feeRec = fees.find(f => f.id === feeId);
      const res = await fetch("/api/erp/pay-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeId, paidDate, paymentMethod, referenceNumber })
      });
      const data = await res.json();
      if (data.success) {
        const finalPaidDate = paidDate || data.fee?.paidDate || new Date().toISOString().split("T")[0];
        setFees(prev =>
          prev.map(f => f.id === feeId ? {
            ...f,
            status: "Paid",
            paidDate: finalPaidDate,
            paymentMethod: paymentMethod || f.paymentMethod,
            referenceNumber: referenceNumber || f.referenceNumber
          } : f)
        );
        const baseAmt = Number(feeRec?.amount) || 0;
        const discAmt = Number(feeRec?.discount) || 0;
        const netAmt = Math.max(0, baseAmt - discAmt);
        logActivity(
          "Invoice Paid",
          `Invoice (ID: ${feeId}) for ${feeRec?.studentName || "Student"} of net amount ₹${netAmt} (Base: ₹${baseAmt}, Disc: -₹${discAmt}) marked as Paid via ${paymentMethod || "Direct"}${referenceNumber ? ` (Ref: ${referenceNumber})` : ""}`,
          feeRec?.centerId
        );
      }
    } catch (e) {
      console.error("Failed processing fee payment", e);
    }
  };

  const handleAddExpense = async (payload: Partial<ExpenseRecord>) => {
    try {
      const res = await fetch("/api/erp/add-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setExpenses(prev => [...prev, data.expense]);
      }
    } catch (e) {
      console.error("Failed logging center expense", e);
    }
  };

  const handleAddFee = async (feePayload: Partial<FeeRecord>) => {
    try {
      const res = await fetch("/api/erp/create-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feePayload)
      });
      const data = await res.json();
      if (data.success) {
        setFees(prev => [data.fee, ...prev]);
        logActivity("Invoice Creation", `Created invoice: ID ${data.fee.id} for ${data.fee.studentName} of amount ₹${data.fee.amount}`, data.fee.centerId);
        return data.fee;
      }
    } catch (e) {
      console.error("Failed adding fee invoice", e);
    }
  };

  const handleDeleteFee = async (feeId: string) => {
    try {
      const feeRec = fees.find(f => f.id === feeId);
      const res = await fetch("/api/erp/delete-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeId })
      });
      const data = await res.json();
      if (data.success) {
        setFees(prev => prev.filter(f => f.id !== feeId));
        logActivity("Invoice Delete", `Deleted invoice ID ${feeId} of student ${feeRec?.studentName || "Unknown"}`, feeRec?.centerId);
        return true;
      } else {
        throw new Error(data.error || "Failed to delete fee invoice.");
      }
    } catch (e: any) {
      console.error("Failed deleting fee invoice", e);
      throw e;
    }
  };

  const handleUnpayFee = async (feeId: string) => {
    try {
      const feeRec = fees.find(f => f.id === feeId);
      const res = await fetch("/api/erp/unpay-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeId })
      });
      const data = await res.json();
      if (data.success) {
        setFees(prev => prev.map(f => f.id === feeId ? data.fee : f));
        logActivity("Invoice Edit", `Marked invoice ID ${feeId} as Unpaid`, feeRec?.centerId);
        return data.fee;
      }
    } catch (e) {
      console.error("Failed to unpay fee invoice", e);
    }
    return null;
  };

  const handleUpdateFee = async (payload: { feeId: string; amount?: number; discount?: number; month?: string; status?: string }) => {
    try {
      const res = await fetch("/api/erp/update-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setFees(prev => prev.map(f => f.id === payload.feeId ? data.fee : f));
        logActivity("Invoice Edit", `Updated invoice ID ${payload.feeId}: amount ₹${payload.amount || data.fee.amount}, month ${payload.month || data.fee.month}`, data.fee.centerId);
        return data.fee;
      }
    } catch (e) {
      console.error("Failed to update fee invoice", e);
    }
    return null;
  };

  const handleOpenProfileModal = () => {
    if (!currentUser) return;
    setProfileName(currentUser.name);
    setProfilePhoto(currentUser.photo || "");
    setProfileTimezone(currentUser.timezone || "local");
    
    // Find password from local state datasets
    let currentPass = "password123";
    const email = currentUser.email.toLowerCase();
    
    if (currentUser.role === "Super Admin") {
      if (email === "genipluskids@gmail.com") {
        currentPass = "geniplus@2026";
      } else {
        currentPass = "password123";
      }
    } else if (currentUser.role === "Center Admin") {
      const match = centers.find(c => c.email.toLowerCase() === email);
      if (match && match.password) currentPass = match.password;
    } else if (currentUser.role === "Teacher") {
      const match = teachers.find(t => t.email.toLowerCase() === email);
      if (match && match.password) currentPass = match.password;
    } else if (currentUser.role === "Student") {
      const match = students.find(s => s.email.toLowerCase() === email);
      if (match && match.password) currentPass = match.password;
    }
    setProfilePassword(currentPass);
    setProfileModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setProfileSaving(true);
    try {
      const res = await fetch("/api/erp/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          role: currentUser.role,
          name: profileName,
          password: profilePassword,
          photo: profilePhoto,
          timezone: profileTimezone
        })
      });
      const data = await res.json();
      if (data.success) {
        // Update current logged in state
        const updated = {
          ...currentUser,
          name: profileName,
          photo: profilePhoto,
          timezone: profileTimezone
        };
        setCurrentUser(updated);
        localStorage.setItem("erp_logged_in_user", JSON.stringify(updated));

        // Re-load data from server to keep all directory tables in sync
        await loadData();
        setProfileModalOpen(false);
        alert("Your profile and password have been successfully updated!");
      } else {
        alert(data.error || "Failed to update profile. Please try again.");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      alert("A network error occurred while updating your profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const compressImageBase64 = (base64Str: string, maxWidth: number, maxHeight: number, quality: number = 0.75): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
    });
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          // Compress profile photo to max 250x250 to ensure extremely lightweight DB storage
          const compressed = await compressImageBase64(reader.result as string, 250, 250, 0.75);
          setProfilePhoto(compressed);
        } catch (err) {
          console.error("Error compressing profile photo:", err);
          setProfilePhoto(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccessMessage(null);

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("Passwords do not match. Please re-enter them.");
      return;
    }

    setForgotSubmitting(true);
    try {
      const res = await fetch("/api/erp/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          newPassword: forgotNewPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setForgotSuccessMessage(data.message);
        setForgotEmail("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
        // Reload datasets so passwords sync on backend
        loadData();
      } else {
        setForgotError(data.error || "Could not reset password.");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setForgotError("An error occurred. Please verify your internet connection.");
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleCentralLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSubmitting(true);

    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword;

    if (rememberMe) {
      localStorage.setItem("erp_remembered_email", email);
    } else {
      localStorage.removeItem("erp_remembered_email");
    }

    try {
      const response = await fetch("/api/erp/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (data.success && data.user) {
        const matchedUser = data.user;
        setCurrentUser(matchedUser);
        setCurrentRole(matchedUser.role);
        setActiveDashboardTab("admin");
        localStorage.setItem("erp_logged_in_user", JSON.stringify(matchedUser));

        // Sync old localized view logins to avoid double logins inside views:
        if (matchedUser.role === "Super Admin") {
          localStorage.setItem("superadmin_is_logged_in", "true");
        } else if (matchedUser.role === "Center Admin") {
          localStorage.setItem("centeradmin_is_logged_in", "true");
        } else if (matchedUser.role === "Teacher") {
          localStorage.setItem("teacher_is_logged_in", "true");
          localStorage.setItem("teacher_logged_in_id", matchedUser.id || "T001");
        } else if (matchedUser.role === "Manager + Teacher") {
          localStorage.setItem("teacher_is_logged_in", "true");
          localStorage.setItem("teacher_logged_in_id", matchedUser.id || "T001");
        } else if (matchedUser.role === "Student") {
          localStorage.setItem("student_is_logged_in", "true");
          localStorage.setItem("student_logged_in_id", matchedUser.id || "S001");
        }

        setLoginEmail("");
        setLoginPassword("");

        // Force page refresh on login so client loads fresh data without old cached/cookie state
        window.location.reload();
      } else {
        setLoginError(data.error || "Invalid email or password. Please verify and try again.");
      }
    } catch (err: any) {
      setLoginError("Failed to connect to the login server. Please try again.");
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleCentralLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("erp_logged_in_user");
    localStorage.removeItem("superadmin_is_logged_in");
    localStorage.removeItem("centeradmin_is_logged_in");
    localStorage.removeItem("teacher_is_logged_in");
    localStorage.removeItem("teacher_logged_in_id");
    localStorage.removeItem("student_is_logged_in");
    localStorage.removeItem("student_logged_in_id");
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="text-sm font-semibold text-gray-500 font-display">Initializing My Abacus Academy Cloud ERP...</span>
      </div>
    );
  }

  const isPublicFormRoute = window.location.pathname.includes("parent-enquiry-form") || 
                             window.location.search.includes("parent-enquiry-form") ||
                             window.location.search.includes("view=parent-enquiry-form") ||
                             window.location.search.includes("form=parent-enquiry");

  if (isPublicFormRoute) {
    return <PublicParentForm />;
  }

  const isStudentRegisterRoute = window.location.pathname.includes("student-register") || 
                                 window.location.search.includes("student-register") ||
                                 window.location.search.includes("view=student-register") ||
                                 window.location.search.includes("form=student-register");

  if (isStudentRegisterRoute) {
    return <PublicStudentRegisterForm />;
  }

  const isPublicOrderRoute = window.location.pathname.includes("order-materials") || 
                             window.location.search.includes("order-materials") ||
                             window.location.search.includes("view=order-materials") ||
                             window.location.search.includes("form=order-materials");

  if (isPublicOrderRoute) {
    return <PublicMaterialOrderForm />;
  }

  const isPublicCompRoute = window.location.pathname.includes("competition-register") || 
                            window.location.search.includes("competition-register") ||
                            window.location.search.includes("view=competition-register");

  if (isPublicCompRoute) {
    const urlParams = new URLSearchParams(window.location.search);
    const compId = urlParams.get("comp") || "";
    const centerId = urlParams.get("center") || "C001";
    return (
      <PublicCompetitionRegisterModal
        competitionId={compId}
        centerId={centerId}
        onBackToApp={() => {
          window.location.href = "/";
        }}
      />
    );
  }

  const isLandingPageRoute = window.location.pathname.includes("landing") || 
                             window.location.search.includes("view=landing") ||
                             window.location.search.includes("features");

  if (isLandingPageRoute) {
    return <LandingPageView landingConfig={landingConfig} paymentPlans={paymentPlans} />;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white" id="central-login-screen">
        {/* Decorative ambient background gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500 blur-[120px]" />
        </div>

        <div className="w-full max-w-md bg-slate-850 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            {getActiveCenterBranding().logo ? (
              <img 
                src={getActiveCenterBranding().logo!} 
                alt={getActiveCenterBranding().name} 
                className="h-14 mx-auto object-contain rounded-xl max-w-[200px] mb-2"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="inline-flex w-14 h-14 bg-amber-400 rounded-2xl items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-400/20 mb-2 uppercase">
                {getActiveCenterBranding().name.split(" ").map(w => w[0]).join("").slice(0, 2) || "AA"}
              </div>
            )}
            <h2 className="text-2xl font-black text-white font-display tracking-tight">{getActiveCenterBranding().name}</h2>
            <p className="text-sm font-bold text-amber-400 tracking-wide">
              {forgotPasswordMode ? "Secure Password Recovery Desk" : "discovering abacus genius"}
            </p>
          </div>

          {forgotPasswordMode ? (
            // FORGOT PASSWORD DESK
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-left">
              <div className="text-sm text-slate-300 font-medium text-center pb-2">
                Enter your registered Email ID and set your new password. The system database will immediately overwrite it upon validation.
              </div>

              {forgotError && (
                <div className="bg-rose-950/50 border border-rose-800 text-rose-300 p-3.5 rounded-xl text-xs font-semibold leading-relaxed animate-shake">
                  <span className="block font-black text-rose-200">Reset Failed</span>
                  {forgotError}
                </div>
              )}

              {forgotSuccessMessage && (
                <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-300 p-3.5 rounded-xl text-xs font-semibold leading-relaxed">
                  <span className="block font-black text-emerald-200">Reset Successful</span>
                  {forgotSuccessMessage}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Registered Email ID</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl py-3 pl-10 pr-3 text-xs font-semibold text-white focus:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl py-3 pl-10 pr-3 text-xs font-semibold text-white focus:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl py-3 pl-10 pr-3 text-xs font-semibold text-white focus:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotSubmitting}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3.5 rounded-xl shadow-lg hover:shadow-amber-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {forgotSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Over-write Account Password</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setForgotPasswordMode(false);
                  setForgotError(null);
                  setForgotSuccessMessage(null);
                }}
                className="w-full bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs py-2 rounded-xl transition-all"
              >
                ← Back to Portal Login
              </button>
            </form>
          ) : (
            // STANDARD PORTAL LOGIN
            <>
              {loginError && (
                <div className="bg-rose-950/50 border border-rose-800 text-rose-300 p-3.5 rounded-xl text-xs font-semibold leading-relaxed animate-shake">
                  <span className="block font-black text-rose-200">Access Denied</span>
                  {loginError}
                </div>
              )}

              <form onSubmit={handleCentralLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Registered Email ID</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="name@gmail.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl py-3 pl-10 pr-3 text-xs font-semibold text-white focus:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Secret Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl py-3 pl-10 pr-3 text-xs font-semibold text-white focus:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 w-3.5 h-3.5"
                    />
                    <span>Remember Me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordMode(true);
                      setForgotError(null);
                      setForgotSuccessMessage(null);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loginSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs py-3.5 rounded-xl shadow-lg hover:shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loginSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  <span>Verify and Sign In</span>
                </button>
              </form>
            </>
          )}
        </div>

        <div className="mt-8 text-center text-[11px] text-slate-500 font-medium">
          My Abacus Academy • Protected Area • Authorized Personnel Only
        </div>
      </div>
    );
  }

  const activeCenter = centers.find(c => c.id === currentUser?.id || c.email?.toLowerCase() === currentUser?.email?.toLowerCase());
  const hasTeacherPrivilege = currentUser && (currentUser.role === "Manager + Teacher" || (currentUser.role === "Center Admin" && activeCenter?.alsoWorksAsTeacher));

  const headerStudentObj = currentRole === "Student" ? students.find(s => s.id === currentUser?.id || s.email?.toLowerCase() === currentUser?.email?.toLowerCase()) : null;
  const headerStudentNotifs = headerStudentObj?.notifications || [];
  const unreadNotificationsCount = currentRole === "Student"
    ? headerStudentNotifs.filter((n: any) => !n.read).length
    : (activeLeadNotification ? 1 : 0);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col text-gray-800 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Professional Minimal Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 print:hidden sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          
          {/* Logo & Academy Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            {getActiveCenterBranding().logo ? (
              <img 
                src={getActiveCenterBranding().logo!} 
                alt={getActiveCenterBranding().name} 
                className="h-9 object-contain rounded-lg max-w-[120px] shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8.5 h-8.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md shrink-0 uppercase">
                {getActiveCenterBranding().name.split(" ").map(w => w[0]).join("").slice(0, 2) || "AA"}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black font-display leading-tight tracking-tight text-white flex items-center gap-1.5 truncate">
                <span className="truncate">{getActiveCenterBranding().name}</span>
                <span className="hidden xs:inline-block text-[8px] px-1.5 py-0.5 bg-indigo-950 border border-indigo-900/60 text-indigo-300 rounded-full font-mono uppercase font-black shrink-0">ERP</span>
              </h1>
              <p className="hidden md:block text-[9px] text-slate-400 font-mono tracking-wide">discovering Abacus Genius!</p>
            </div>
          </div>

          {/* Minimal Controls */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Database Real-time Health Indicator */}
            <DatabaseHealthBadge
              status={dbHealthStatus}
              dbMode={dbModeStr}
              lastSyncTime={lastSyncTime}
              pendingCount={pendingSyncCount}
              onManualSync={async () => {
                await processPendingQueue();
                await loadData(0, true);
                await fetchDbStatus();
              }}
            />

            {/* Install App Button (For all users) */}
            <button
              onClick={handleInstallPwa}
              className="flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-2.5 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 shadow-sm border border-indigo-500 cursor-pointer shrink-0"
              id="pwa-install-header-btn"
              title="Install App on phone/tablet!"
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">Install App</span>
              {deferredPrompt && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-ping"></span>
              )}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotificationsDropdown(!showNotificationsDropdown);
                  setShowMenuDropdown(false);
                }}
                className={`relative p-2 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 border ${
                  showNotificationsDropdown 
                    ? "bg-indigo-600 border-indigo-500 text-white" 
                    : "text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 border-slate-800"
                }`}
                title="Academy Notifications"
              >
                <Bell className="w-4 h-4 shrink-0" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse border border-slate-900">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <>
                  <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowNotificationsDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-72 bg-slate-950/95 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 text-left text-xs animate-scale-up backdrop-blur-md">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                      <span className="font-extrabold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <span>🔔 Alerts</span>
                        {unreadNotificationsCount > 0 && (
                          <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-1 py-0.5 rounded text-[8px] font-bold">New</span>
                        )}
                      </span>
                      {currentRole === "Student" && headerStudentNotifs.length > 0 && (
                        <button
                          onClick={() => {
                            handleClearStudentNotifs();
                            setShowNotificationsDropdown(false);
                          }}
                          className="text-[9px] text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 text-slate-300">
                      {unreadNotificationsCount === 0 ? (
                        <div className="py-5 text-center text-slate-500 italic flex flex-col items-center gap-1">
                          <span className="text-lg">✨</span>
                          <span>No unread notifications</span>
                        </div>
                      ) : (
                        <>
                          {/* If currentRole is Student, list student specific notifications */}
                          {currentRole === "Student" && headerStudentNotifs.map((notif: any) => (
                            <div key={notif.id} className="p-2 bg-slate-900 border border-slate-800/80 rounded-xl space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <strong className="text-slate-100 font-bold leading-tight">{notif.title}</strong>
                                <span className="text-[8px] text-slate-500 font-mono shrink-0">{notif.date}</span>
                              </div>
                              <p className="text-slate-400 text-[10.5px] leading-relaxed">{notif.message}</p>
                            </div>
                          ))}

                          {/* If Admin/Teacher, list active CRM notifications or system alerts */}
                          {currentRole !== "Student" && (
                            <>
                              {activeLeadNotification && (
                                <div className="p-2.5 bg-indigo-950/50 border border-indigo-900/60 rounded-xl space-y-1">
                                  <div className="flex items-center gap-1 text-indigo-400 font-black text-[8px] uppercase tracking-wider">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>New Lead Alert</span>
                                  </div>
                                  <strong className="text-white font-bold block">{activeLeadNotification.name}</strong>
                                  <p className="text-slate-300 text-[10.5px] leading-relaxed">
                                    Parent {activeLeadNotification.parentName} inquired from {activeLeadNotification.source}. Preferred slot: {activeLeadNotification.remarks?.match(/(?:Preferred Demo Slot:|Preferred Demo:)\s*([^.]+)/i)?.[1]?.trim() || "trial"}.
                                  </p>
                                  <button
                                    onClick={() => {
                                      setCenterSubTab("CRM");
                                      setActiveLeadNotification(null);
                                      setShowNotificationsDropdown(false);
                                    }}
                                    className="text-[10px] text-indigo-400 font-black hover:text-indigo-300 underline pt-1 block cursor-pointer"
                                  >
                                    Open CRM Inbox
                                  </button>
                                </div>
                              )}
                              
                              <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-emerald-500">✓</span>
                                  <strong className="text-slate-200 font-bold leading-tight">Database Synced</strong>
                                </div>
                                <p className="text-slate-400 text-[10.5px] leading-relaxed">All student performance portfolios and standinds are secure and live.</p>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Circle Photo (Direct open profile modal on click) */}
            <button
              onClick={handleOpenProfileModal}
              className="shrink-0 rounded-full border border-slate-800 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/20 transition-all active:scale-95 cursor-pointer focus:outline-none"
              title="Edit Profile"
            >
              {currentUser.photo ? (
                <img 
                  src={currentUser.photo} 
                  className="w-8.5 h-8.5 rounded-full object-cover" 
                  referrerPolicy="no-referrer" 
                  alt="Profile" 
                />
              ) : (
                <div className="w-8.5 h-8.5 rounded-full bg-slate-850 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase border border-slate-850">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
            </button>

            {/* Menu ⚙️ Wheel Trigger */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowMenuDropdown(!showMenuDropdown);
                  setShowNotificationsDropdown(false);
                }}
                className={`p-2 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 border ${
                  showMenuDropdown 
                    ? "bg-indigo-600 border-indigo-500 text-white" 
                    : "text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 border-slate-800"
                }`}
                title="Workspace Actions & Settings"
              >
                <Settings className={`w-4 h-4 shrink-0 ${showMenuDropdown ? "animate-spin" : ""}`} />
              </button>

              {showMenuDropdown && (
                <>
                  <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowMenuDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 text-left text-xs animate-scale-up space-y-3.5">
                    
                    {/* User Info Header */}
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-800">
                      {currentUser.photo ? (
                        <img src={currentUser.photo} className="w-8 h-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" alt="Profile" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{currentRole} Workspace</div>
                        <h4 className="text-slate-100 font-bold truncate leading-snug">{currentUser.name}</h4>
                        <p className="text-[9.5px] text-slate-500 truncate font-mono">{currentUser.email}</p>
                      </div>
                    </div>

                    {/* Quick Actions List (Contextual based on logged role) */}
                    <div className="space-y-1.5">
                      <span className="text-[8.5px] text-slate-500 uppercase tracking-widest font-black block font-mono">Quick Actions</span>
                      <div className="grid grid-cols-1 gap-1">
                        {getQuickActions().map((action, idx) => (
                          <button
                            key={idx}
                            onClick={action.onClick}
                            className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-850 px-2.5 py-1.5 rounded-xl text-left transition-colors font-semibold w-full cursor-pointer"
                          >
                            <span>{action.icon}</span>
                            <span className="truncate">{action.label}</span>
                          </button>
                        ))}
                        
                        <button
                          onClick={() => {
                            handleOpenProfileModal();
                            setShowMenuDropdown(false);
                          }}
                          className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-850 px-2.5 py-1.5 rounded-xl text-left transition-colors font-semibold w-full cursor-pointer"
                        >
                          <span>👤</span>
                          <span>My Profile Details</span>
                        </button>
                      </div>
                    </div>

                    {/* Multi-role Switcher */}
                    {(() => {
                      const selectable = getSelectableRoles();
                      if (selectable.length > 1) {
                        return (
                          <div className="space-y-1.5 pt-1.5 border-t border-slate-850">
                            <span className="text-[8.5px] text-slate-500 uppercase tracking-widest font-black block font-mono">Switch Workspace</span>
                            <select
                              value={currentRole}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                setCurrentRole(val);
                                setShowMenuDropdown(false);
                              }}
                              className="w-full bg-slate-900 text-indigo-300 border border-slate-850 hover:border-indigo-800/80 rounded-xl py-1.5 px-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer transition-all"
                            >
                              {selectable.map((r) => (
                                <option key={r} value={r} className="bg-slate-950 text-white font-semibold">
                                  {r === "Center Admin" ? "🏢 Center Admin Dashboard" :
                                   r === "Student" ? "🎓 Student Learning Dashboard" :
                                   r === "Teacher" ? "💼 Teacher Studio" :
                                   `💼 ${r} View`}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Manual Sync Trigger */}
                    <div className="pt-2 border-t border-slate-850 space-y-1.5">
                      <button
                        onClick={async () => {
                          setShowMenuDropdown(false);
                          try {
                            await loadData();
                            alert("Dashboard successfully synced with single source of truth!");
                          } catch (err) {
                            alert("Failed to sync data: " + String(err));
                          }
                        }}
                        className="flex items-center justify-between bg-slate-850 hover:bg-slate-800 text-indigo-300 hover:text-white w-full px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                          <span>Sync Data</span>
                        </div>
                        <span className="text-[7.5px] bg-slate-950 px-1 py-0.5 rounded text-slate-400 font-mono font-bold">LIVE</span>
                      </button>
                    </div>

                    {/* Log Out */}
                    <div className="pt-1.5 border-t border-slate-850">
                      <button
                        onClick={() => {
                          setShowMenuDropdown(false);
                          handleCentralLogout();
                        }}
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-950/10 px-2.5 py-1.5 rounded-xl text-left transition-colors font-bold w-full cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>Log Out</span>
                      </button>
                    </div>

                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Main SaaS Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0">
        
        {/* Multi-Role Tabs Navigation (For Center Admin and Manager + Teacher) */}
        {hasTeacherPrivilege && (
          <div className="bg-white border-2 border-slate-150 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-display">
                  Multi-Workspace Dashboard Switching
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  As a {currentRole === "Center Admin" ? "Venture/Academy owner" : "branch manager"}, you can toggle between center administration and trainer classrooms.
                </p>
              </div>
            </div>
            
            <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 border border-slate-200 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setActiveDashboardTab("admin")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeDashboardTab === "admin"
                    ? "bg-white text-indigo-950 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-indigo-900"
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>🏢 Center Management</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveDashboardTab("teacher")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeDashboardTab === "teacher"
                    ? "bg-white text-indigo-950 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-indigo-900"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>🎓 Teacher Tab</span>
              </button>
            </div>
          </div>
        )}

        {/* Render View Based on Logged In Role */}
        <div className="fade-in-transition">
          {currentRole === "Super Admin" && (
            <SuperAdminView
              centers={centers}
              onAddCenter={handleAddCenter}
              students={students}
              teachers={teachers}
              teacherTrainees={teacherTrainees}
              leads={leads}
              fees={fees}
              expenses={expenses}
              attendance={attendance}
              homework={homework}
              studentFeePlans={studentFeePlans}
              onUpdateStudentFeePlan={handleUpdateStudentFeePlan}
              activityLogs={activityLogs}
              materialProducts={materialProducts}
              materialOrders={materialOrders}
              shippingSettings={shippingSettings}
              onRefreshData={loadData}
            />
          )}

          {currentRole === "Center Admin" && (
            activeDashboardTab === "admin" ? (
              <CenterAdminView
                teachers={teachers}
                students={students}
                fees={fees}
                expenses={expenses}
                onAddTeacher={handleAddTeacher}
                onAddStudent={handleAddStudent}
                onEditStudent={handleEditStudent}
                onDeleteStudent={handleDeleteStudent}
                onAddExpense={handleAddExpense}
                onPayFee={handlePayFee}
                onAddFee={handleAddFee}
                onDeleteFee={handleDeleteFee}
                onUnpayFee={handleUnpayFee}
                onUpdateFee={handleUpdateFee}
                centers={centers}
                leads={leads}
                onAddLead={handleAddLead}
                currentUser={currentUser}
                subTab={centerSubTab}
                onSubTabChange={setCenterSubTab}
                onToggleDashboardTab={setActiveDashboardTab}
                onRefreshData={loadData}
                studentFeePlans={studentFeePlans}
                courses={courses}
                promotionRequests={promotionRequests}
                materials={materials}
                activityLogs={activityLogs}
                practiceSubmissions={practiceSubmissions}
                homework={homework}
                timingChangeRequests={timingChangeRequests}
                materialProducts={materialProducts}
                materialOrders={materialOrders}
                shippingSettings={shippingSettings}
              />
            ) : (
              <TeacherView
                teachers={teachers}
                students={students}
                fees={fees}
                attendance={attendance}
                homework={homework}
                exams={exams}
                onMarkAttendance={handleMarkAttendance}
                onPayFee={handlePayFee}
                onAddStudent={handleAddStudent}
                centers={centers}
                leads={leads}
                onAddLead={handleAddLead}
                onRefreshData={loadData}
                currentUser={currentUser}
                onToggleDashboardTab={setActiveDashboardTab}
                timingChangeRequests={timingChangeRequests}
                materialProducts={materialProducts}
                materialOrders={materialOrders}
                shippingSettings={shippingSettings}
              />
            )
          )}

          {currentRole === "Teacher" && (
            <TeacherView
              teachers={teachers}
              students={students}
              fees={fees}
              attendance={attendance}
              homework={homework}
              exams={exams}
              onMarkAttendance={handleMarkAttendance}
              onPayFee={handlePayFee}
              onAddStudent={handleAddStudent}
              centers={centers}
              leads={leads}
              onAddLead={handleAddLead}
              onRefreshData={loadData}
              currentUser={currentUser}
              timingChangeRequests={timingChangeRequests}
              materialProducts={materialProducts}
              materialOrders={materialOrders}
              shippingSettings={shippingSettings}
            />
          )}

          {currentRole === "Manager + Teacher" && (
            activeDashboardTab === "admin" ? (
              <CenterAdminView
                teachers={teachers}
                students={students}
                fees={fees}
                expenses={expenses}
                onAddTeacher={handleAddTeacher}
                onAddStudent={handleAddStudent}
                onEditStudent={handleEditStudent}
                onDeleteStudent={handleDeleteStudent}
                onAddExpense={handleAddExpense}
                onPayFee={handlePayFee}
                onAddFee={handleAddFee}
                onDeleteFee={handleDeleteFee}
                onUnpayFee={handleUnpayFee}
                onUpdateFee={handleUpdateFee}
                centers={centers}
                leads={leads}
                onAddLead={handleAddLead}
                currentUser={currentUser}
                subTab={centerSubTab}
                onSubTabChange={setCenterSubTab}
                onToggleDashboardTab={setActiveDashboardTab}
                onRefreshData={loadData}
                studentFeePlans={studentFeePlans}
                courses={courses}
                promotionRequests={promotionRequests}
                materials={materials}
                activityLogs={activityLogs}
                practiceSubmissions={practiceSubmissions}
                homework={homework}
                timingChangeRequests={timingChangeRequests}
                materialProducts={materialProducts}
                materialOrders={materialOrders}
                shippingSettings={shippingSettings}
              />
            ) : (
              <TeacherView
                teachers={teachers}
                students={students}
                fees={fees}
                attendance={attendance}
                homework={homework}
                exams={exams}
                onMarkAttendance={handleMarkAttendance}
                onPayFee={handlePayFee}
                onAddStudent={handleAddStudent}
                centers={centers}
                leads={leads}
                onAddLead={handleAddLead}
                onRefreshData={loadData}
                currentUser={currentUser}
                onToggleDashboardTab={setActiveDashboardTab}
                timingChangeRequests={timingChangeRequests}
                materialProducts={materialProducts}
                materialOrders={materialOrders}
                shippingSettings={shippingSettings}
              />
            )
          )}

          {currentRole === "Student" && (
            <StudentPortalView
              students={students}
              onRefreshData={loadData}
              centers={centers}
              currentUser={currentUser}
              attendance={attendance}
            />
          )}

          {currentRole === "Marketing / Sales Staff" && (
            <CrmView leads={leads} onAddLead={handleAddLead} teachers={teachers} centers={centers} currentUser={currentUser} currentRole={currentRole} />
          )}

          {currentRole === "Abacus Content Engine" && (
            <PracticeGeneratorView />
          )}

          {currentRole === "Developer Blueprint" && (
            <DeveloperBlueprintView />
          )}
        </div>

      </main>

      {/* Shared Footer Frame (Hidden on Print) */}
      <footer className="bg-white border-t border-gray-150 py-8 text-center text-xs text-gray-400 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div>My Abacus Academy • Built for Abacus Academies & Cognitive Training Schools</div>
          <div className="font-medium text-slate-400">
            powered by <a href="https://mhitendra.in" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">mhitendra.in</a>
          </div>
        </div>
      </footer>

      {/* Real-time Floating Lead Notification Alert */}
      {activeLeadNotification && (() => {
        const isCenterAdmin = currentRole === "Center Admin";
        const isSalesOrMarketing = currentRole === "Marketing / Sales Staff";
        const isSuperAdmin = currentRole === "Super Admin";
        const isTeacherWithAccess = currentRole === "Teacher" && !!currentUser?.permitLeadAccess;
        const isAuthorizedRole = isSuperAdmin || isCenterAdmin || isSalesOrMarketing || isTeacherWithAccess;
        const isAssociatedCenter = isSuperAdmin || (currentUser?.centerId && activeLeadNotification.centerId === currentUser.centerId);
        return isAuthorizedRole && isAssociatedCenter;
      })() && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full bg-slate-900 text-white rounded-3xl p-5 border border-amber-400 shadow-2xl animate-fade-in">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-mono">
                New Lead Alert
              </span>
            </div>
            <button
              onClick={() => setActiveLeadNotification(null)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-black p-1 bg-slate-800 hover:bg-slate-700 rounded-full"
            >
              ✕
            </button>
          </div>

          <div className="py-4 space-y-2.5">
            <div>
              <h4 className="font-black text-white text-sm font-display leading-tight">{activeLeadNotification.name}</h4>
              <p className="text-[11px] text-slate-300 font-semibold mt-0.5">
                Parent: {activeLeadNotification.parentName}
              </p>
            </div>

            <div className="bg-slate-950/60 p-2.5 border border-slate-800 rounded-xl space-y-1 text-[11px] text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>Phone:</span>
                <span className="text-slate-200 font-bold">{activeLeadNotification.parentMobile}</span>
              </div>
              <div className="flex justify-between">
                <span>Source:</span>
                <span className="text-amber-400 font-black text-[10px] px-1.5 py-0.2 bg-amber-950/40 border border-amber-900/30 rounded">
                  {activeLeadNotification.source}
                </span>
              </div>
              {/* Parse Preferred Demo Slot */}
              {(() => {
                const match = activeLeadNotification.remarks?.match(/(?:Preferred Demo Slot:|Preferred Demo:)\s*([^.]+)/i);
                const prefTime = match && match[1] ? match[1].trim() : "";
                if (prefTime) {
                  return (
                    <div className="flex flex-col gap-0.5 mt-1 border-t border-slate-800 pt-1 text-[10px]">
                      <span className="text-slate-500 uppercase tracking-wider text-[8px] font-bold">Preferred Slot</span>
                      <span className="text-indigo-400 font-black">{prefTime}</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                setActiveLeadNotification(null);
                const origRole = currentUser?.role;
                if (origRole === "Center Admin" || origRole === "Manager + Teacher") {
                  setCurrentRole(origRole);
                  setActiveDashboardTab("admin");
                  setCenterSubTab("CRM");
                } else if (currentRole === "Center Admin" || currentRole === "Manager + Teacher") {
                  setActiveDashboardTab("admin");
                  setCenterSubTab("CRM");
                } else {
                  // Fallback for other roles (like Student or generic Teacher) to switch role context
                  setCurrentRole("Marketing / Sales Staff");
                  if (currentUser) {
                    localStorage.setItem("erp_logged_in_user", JSON.stringify({
                      ...currentUser,
                      role: "Marketing / Sales Staff"
                    }));
                  }
                }
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-2 rounded-xl text-center transition-all cursor-pointer shadow-md"
            >
              CRM Inbox
            </button>
            <a
              href={`https://wa.me/${activeLeadNotification.parentMobile.replace(/[\s-+]/g, "")}?text=${encodeURIComponent(
                (() => {
                  const pName = activeLeadNotification.parentName || "Parent";
                  const cName = activeLeadNotification.name || "Student";
                  const slot = activeLeadNotification.demoRescheduleDate
                    ? `${activeLeadNotification.demoRescheduleDate}${activeLeadNotification.demoRescheduleTime ? ` at ${activeLeadNotification.demoRescheduleTime}` : ""}`
                    : (activeLeadNotification.remarks?.match(/(?:Preferred Demo Slot:|Preferred Demo:)\s*([^|.\n]+)/i)?.[1]?.trim() || "");
                  if (slot) {
                    return `Hello ${pName}, greetings from ${getAcademyName()}! Thank you for scheduling a Free Abacus Demo Class for ${cName}.\n\n🗓️ Scheduled Demo Slot: ${slot}\n\nPlease reply 'YES' or confirm if this time works for you so we can send the class join link & details!`;
                  }
                  return `Hello ${pName}, greetings from ${getAcademyName()}! Thank you for registering ${cName} for our Abacus Demo Class. Please let us know your preferred date & time for the free trial session!`;
                })()
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-center flex items-center justify-center transition-all"
              title="WhatsApp Parent Instantly"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* Profile Modal (Interactive photo upload + name / password edit) */}
      {profileModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex justify-center items-center p-4" id="profile-settings-modal">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5 text-left animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 font-display">My Profile & Security Settings</h3>
              <p className="text-xs text-gray-500">Update your account display information, avatar photo, and password.</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Profile Image upload section */}
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="relative shrink-0">
                  {profilePhoto ? (
                    <img src={profilePhoto} className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-md" referrerPolicy="no-referrer" alt="Avatar preview" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 font-black text-xl flex items-center justify-center border-2 border-indigo-200 uppercase">
                      {profileName ? profileName.charAt(0) : currentUser.name.charAt(0)}
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 w-6 h-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md transition-all">
                    <Camera className="w-3.5 h-3.5" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoChange} />
                  </label>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-700">Display Profile Picture</div>
                  <div className="text-[10px] text-gray-400">PNG, JPG up to 2MB. Stored persistently in database.</div>
                  {profilePhoto && (
                    <button
                      type="button"
                      onClick={() => setProfilePhoto("")}
                      className="text-[10px] text-rose-600 hover:underline font-bold"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>

              {/* Email (Read only) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Registered Email ID</label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-500 cursor-not-allowed font-mono"
                />
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Display Name / Owner Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              {/* Security Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Secret Access Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="Set new secret password"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 pl-10 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none placeholder-gray-400 font-mono"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Timezone Preference */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Preferred Timezone</label>
                <select
                  value={profileTimezone}
                  onChange={(e) => setProfileTimezone(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none cursor-pointer"
                >
                  <option value="local">Browser / System Local Time</option>
                  <option value="IST">India Standard Time (IST - Asia/Kolkata)</option>
                  <option value="EST">Eastern Standard Time (EST - America/New_York)</option>
                  <option value="GST">Gulf Standard Time (GST - Asia/Dubai)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  {profileSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PWA (Progressive Web App) Installation Modal */}
      {showPwaModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-fade-in" id="pwa-install-modal">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-6 text-left text-slate-850">
            <button
              type="button"
              onClick={() => setShowPwaModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-xs font-black p-1 bg-slate-100 hover:bg-slate-200 rounded-full"
            >
              ✕
            </button>

            {/* Header / Branding */}
            <div className="flex flex-col items-center text-center space-y-3 pb-2 border-b border-slate-100">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
                <img
                  src="/icon.svg"
                  alt="ABACUS Logo"
                  className="w-20 h-20 rounded-2xl shadow-lg relative border-2 border-indigo-100 object-cover mx-auto"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 font-display uppercase tracking-tight">
                  ABACUS Mobile App
                </h3>
                <p className="text-xs text-indigo-600 font-bold font-mono tracking-wider">
                  Progressive Web App (PWA)
                </p>
              </div>
            </div>

            {/* Core PWA Features list */}
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 bg-indigo-50/40 p-2.5 rounded-xl border border-indigo-100/30">
                <span className="text-base">📱</span>
                <div>
                  <strong className="text-slate-900 block font-semibold">Home Screen Launcher</strong>
                  <span className="text-slate-500 text-[11px] leading-relaxed">Adds a high-quality abacus bead icon right on your phone's desktop or application list.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-indigo-50/40 p-2.5 rounded-xl border border-indigo-100/30">
                <span className="text-base">🚀</span>
                <div>
                  <strong className="text-slate-900 block font-semibold">Native-Like App Experience</strong>
                  <span className="text-slate-500 text-[11px] leading-relaxed">Hides search bars, browser controls, and tabs for an immersive fullscreen view.</span>
                </div>
              </div>
            </div>

            {/* Mobile-specific Custom Instructions */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">How to Install on your Device:</h4>
              
              {/* Android/Chrome instructions */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full flex items-center justify-center">A</span>
                  <span className="font-extrabold text-slate-800">Android / Chrome / Desktop</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal pl-7">
                  Click the <strong className="text-indigo-600">Install Now</strong> button below. Alternatively, tap your browser's options menu (three dots) and select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.
                </p>
              </div>

              {/* iOS Safari instructions */}
              <div className="space-y-2 text-xs border-t border-slate-200/60 pt-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-pink-100 text-pink-700 text-[10px] font-bold rounded-full flex items-center justify-center">i</span>
                  <span className="font-extrabold text-slate-800">Apple iOS (iPhone / iPad)</span>
                </div>
                <div className="text-[11px] text-slate-500 leading-normal pl-7 space-y-1">
                  <p>Apple devices require Safari and a quick manual step:</p>
                  <ol className="list-decimal list-inside space-y-1 mt-1 font-semibold text-slate-700">
                    <li>Tap the <strong className="text-indigo-600">Share</strong> button (box with an up arrow) in Safari.</li>
                    <li>Scroll down the action sheet and select <strong className="text-indigo-600">"Add to Home Screen"</strong>.</li>
                    <li>Tap <strong className="text-indigo-600">"Add"</strong> in the top right to confirm!</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPwaModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95 cursor-pointer"
              >
                Close Window
              </button>
              {deferredPrompt ? (
                <button
                  type="button"
                  onClick={() => {
                    handleInstallPwa();
                    setShowPwaModal(false);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install Now</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    alert("To install, use your browser's share or menu button and tap 'Add to Home Screen'!");
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Ready to Add</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
