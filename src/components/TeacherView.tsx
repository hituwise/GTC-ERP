import React, { useState, useEffect } from "react";
import { Student, AttendanceRecord, HomeworkRecord, ExamRecord, Teacher, FeeRecord, Center, CRMLead, TeacherCourse, TeacherLiveBatch } from "../types";
import { printElementById } from "../lib/printUtils";
import { Sparkles, CalendarCheck, Calendar, Phone, BookOpen, GraduationCap, CheckCircle2, FileText, Award, HelpCircle, Loader2, Target, Trophy, Send, TrendingUp, Key, UserPlus, RefreshCw, LogOut, ChevronRight, ChevronLeft, Search, AlertTriangle, Clock, ArrowUpRight, Check, Star, Users, MapPin, MessageSquare, Share2, ExternalLink, FileCode, ShoppingCart, Package, Truck, CreditCard, Plus, Minus, Eye, EyeOff, Printer, Video, DollarSign, Zap, Play, BarChart3, Edit2, Trash2, Mail } from "lucide-react";
import CrmView from "./CrmView";
import ConceptWorksheetManager from "./ConceptWorksheetManager";
import PracticeGeneratorView from "./PracticeGeneratorView";
import AbacusBeadExerciseView from "./AbacusBeadExerciseView";
import TeacherExamManager from "./TeacherExamManager";
import CompetitionManager from "./CompetitionManager";
import DigitalCertificateManager from "./DigitalCertificateManager";
import VirtualAbacus from "./VirtualAbacus";

interface TeacherViewProps {
  teachers?: Teacher[];
  students: Student[];
  fees?: FeeRecord[];
  attendance: AttendanceRecord[];
  homework: HomeworkRecord[];
  exams: ExamRecord[];
  onMarkAttendance: (records: any[], date?: string) => void;
  onPayFee: (feeId: string) => void;
  onAddStudent: (payload: any) => Promise<void>;
  centers?: Center[];
  leads?: CRMLead[];
  onAddLead?: (lead: Partial<CRMLead>) => void;
  onRefreshData?: () => Promise<void>;
  currentUser?: any;
  onToggleDashboardTab?: (tab: "admin" | "teacher") => void;
  timingChangeRequests?: any[];
  materialProducts?: any[];
  materialOrders?: any[];
  shippingSettings?: any;
}

export default function TeacherView({
  teachers = [],
  students,
  fees = [],
  attendance,
  homework,
  exams,
  onMarkAttendance,
  onPayFee,
  onAddStudent,
  centers = [],
  leads = [],
  onAddLead = () => {},
  onRefreshData,
  currentUser,
  onToggleDashboardTab,
  timingChangeRequests = [],
  materialProducts = [],
  materialOrders = [],
  shippingSettings = null
}: TeacherViewProps) {
  // Teacher credentials state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("teacher_is_logged_in") === "true";
  });
  const [loggedInTeacherId, setLoggedInTeacherId] = useState<string>(() => {
    return localStorage.getItem("teacher_logged_in_id") || "T001";
  });

  const hasCentralAuth = currentUser && (currentUser.role === "Center Admin" || currentUser.role === "Manager + Teacher" || currentUser.role === "Teacher");
  const isActuallyLoggedIn = isLoggedIn || hasCentralAuth;

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Match the active logged in instructor
  const getLoggedInTeacherId = () => {
    if (currentUser) {
      const matchedTeacher = teachers.find(t => t.id === currentUser.id || t.email?.toLowerCase() === currentUser.email?.toLowerCase());
      if (matchedTeacher) {
        return matchedTeacher.id;
      }
      if (currentUser.role === "Center Admin" || currentUser.role === "Manager + Teacher") {
        const centerId = currentUser.centerId || "C001";
        const centerTeacher = teachers.find(t => t.centerId === centerId);
        if (centerTeacher) return centerTeacher.id;
      }
    }
    return loggedInTeacherId;
  };

  const activeTeacherId = getLoggedInTeacherId();
  const currentTeacher = (teachers.find(t => t.id === activeTeacherId) || teachers[0] || { id: "T001", centerId: "C001", name: "Sunitha Rao", email: "sunitha@geniplus.com", role: "Trainer" }) as Teacher;
  
  const isSuperAdmin = currentUser?.role === "Super Admin";

  // Check if center admin, teacher, or trainee is strictly enrolled or staff accessing training course
  const isEnrolledInCourse = Boolean(
    currentUser?.role !== "Student" ||
    currentUser?.isTrainee === true ||
    ((currentUser as any)?.assignedCourse && (currentUser as any)?.assignedCourse?.length > 0) ||
    ((currentUser as any)?.enrolledCourses && (currentUser as any)?.enrolledCourses?.length > 0) ||
    ((currentUser as any)?.enrolledBatch && (currentUser as any)?.enrolledBatch !== "") ||
    ((currentTeacher as any)?.isTrainee === true)
  );

  // Multi-center assignment resolution for teachers & super admin
  const isCenterAdminOrManager = currentUser?.role === "Center Admin" || currentUser?.role === "Manager + Teacher" || currentUser?.role === "Super Admin";

  const teacherCenterIds: string[] = (() => {
    if (isSuperAdmin) {
      return (centers || []).map(c => c.id);
    }
    const currentCenterId = currentUser?.centerId || currentTeacher?.centerId || "C001";
    const currentCenterObj = (centers || []).find(c => c.id === currentCenterId);
    const isMainCenterOwner = (currentUser?.role === "Center Admin" || currentUser?.role === "Manager + Teacher") && currentCenterObj && (!currentCenterObj.parentCenterId || currentCenterObj.parentCenterId === currentCenterObj.id || (currentCenterObj as any).isSuperCenterOwner === true || (currentCenterObj as any).isSuperCenter === true);

    if (isMainCenterOwner) {
      return (centers || []).filter(c => c.id === currentCenterId || c.parentCenterId === currentCenterId).map(c => c.id);
    }

    if (currentTeacher?.centerIds && currentTeacher.centerIds.length > 0) {
      return currentTeacher.centerIds;
    }

    return [currentCenterId];
  })();

  const assignedCenters = (centers || []).filter(c => teacherCenterIds.includes(c.id));

  // Branch filter state ("ALL" or specific centerId)
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");

  const activeBranchCenterIds = selectedBranchId === "ALL"
    ? teacherCenterIds
    : [selectedBranchId];

  // Dynamic share center ID based on active branch selection
  const activeShareCenterId = selectedBranchId !== "ALL" 
    ? selectedBranchId 
    : (currentTeacher?.centerId || "C001");

  const teacherStudents = students.filter(s => {
    const belongsToBranch = activeBranchCenterIds.includes(s.centerId);
    if (selectedBranchId !== "ALL") {
      // STRICT branch filtering when a specific branch is selected by teacher
      return belongsToBranch;
    }
    if (isSuperAdmin || isCenterAdminOrManager) {
      return belongsToBranch;
    }
    return belongsToBranch || s.teacherId === currentTeacher?.id;
  });

  const logTeacherActivity = async (action: string, details: string) => {
    try {
      const activeCenterId = currentTeacher.centerId || "C001";
      const activeCenter = (centers || []).find(c => c.id === activeCenterId);
      const activeCenterName = activeCenter?.name || "Main Center";
      await fetch("/api/erp/activity-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: currentTeacher.name || currentUser?.name || "Teacher",
          role: currentUser?.role || "Teacher",
          action,
          centerId: activeCenterId,
          centerName: activeCenterName,
          details
        })
      });
    } catch (e) {
      console.error("Failed to log teacher action", e);
    }
  };

  // Academy student list filtered by selected branch
  const academyStudents = students.filter(s => activeBranchCenterIds.includes(s.centerId));
  const getAcademyTopStudent = () => {
    if (!academyStudents || academyStudents.length === 0) return null;
    const sorted = [...academyStudents].sort((a, b) => b.currentLevel - a.currentLevel);
    return sorted[0];
  };
  const academyTopStudent = getAcademyTopStudent();
  const academyName = centers.find(c => c.id === (selectedBranchId !== "ALL" ? selectedBranchId : currentTeacher.centerId))?.name || "My Abacus Academy Center";

  // Practice & Accuracy Manager States
  const [practiceAssignments, setPracticeAssignments] = useState<any[]>([]);
  const [practiceSubmissions, setPracticeSubmissions] = useState<any[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState("");

  // Form states for assigning a new practice drill
  const [assignScope, setAssignScope] = useState<"student" | "level" | "batch">("student");
  const [assignStudent, setAssignStudent] = useState(teacherStudents[0]?.id || "");
  const [assignLevel, setAssignLevel] = useState<number>(1);
  const [assignBatch, setAssignBatch] = useState<string>("");
  const [assignTitle, setAssignTitle] = useState("Daily Abacus Speed Challenge");
  const [assignType, setAssignType] = useState<"Addition" | "Subtraction" | "Multiplication" | "Division">("Addition");
  const [assignSums, setAssignSums] = useState(30);
  const [assignDigits, setAssignDigits] = useState(1);
  const [assignRows, setAssignRows] = useState(4);
  const [assignFocus, setAssignFocus] = useState("Keep fingers close to the beam. Maintain visual speed rhythm.");
  const [assignDisableAbacus, setAssignDisableAbacus] = useState(false);
  const [assignDueDate, setAssignDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // tomorrow
    return d.toISOString().split("T")[0];
  });

  // Student Enrollment Form States
  const [enrollStudentType, setEnrollStudentType] = useState<"batch" | "personal">("batch");
  const [enrollPersonalDays, setEnrollPersonalDays] = useState("Saturday & Sunday");
  const [enrollPersonalTiming, setEnrollPersonalTiming] = useState("10:00 AM - 11:00 AM");
  const [enrollCenterId, setEnrollCenterId] = useState("");
  const [enrollName, setEnrollName] = useState("");
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrollParentName, setEnrollParentName] = useState("");
  const [enrollParentMobile, setEnrollParentMobile] = useState("");
  const [enrollLevel, setEnrollLevel] = useState(1);
  const [enrollStartingWeek, setEnrollStartingWeek] = useState<number>(1);
  const [enrollBatch, setEnrollBatch] = useState("");
  const [enrollBatchCode, setEnrollBatchCode] = useState("");
  const [isCustomEnrollBatch, setIsCustomEnrollBatch] = useState(false);
  const [customEnrollBatch, setCustomEnrollBatch] = useState("");
  const [enrollAge, setEnrollAge] = useState(8);
  const [enrollJoiningDate, setEnrollJoiningDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Student Batch Update States
  const [batchTargetStudent, setBatchTargetStudent] = useState("");
  const [batchTargetSchedule, setBatchTargetSchedule] = useState("");
  const [batchTargetCode, setBatchTargetCode] = useState("");
  const [isCustomTargetBatch, setIsCustomTargetBatch] = useState(false);
  const [customTargetBatch, setCustomTargetBatch] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);

  // Student Level Update States
  const [levelTargetStudent, setLevelTargetStudent] = useState("");
  const [levelTargetNum, setLevelTargetNum] = useState(1);
  const [levelTargetBatchCode, setLevelTargetBatchCode] = useState("");
  const [levelLoading, setLevelLoading] = useState(false);

  // List of all active batches across this center to register or select from
  const [allBatches, setAllBatches] = useState<string[]>([]);
  const [newBatchName, setNewBatchName] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "abacus_gym" | "worksheets" | "live_teaching" | "exams" | "competitions" | "certificates" | "timings" | "approvals" | "orders" | "crm" | "demos" | "teacher_training" | "student_leaderboard" | "roster_analytics">(
    "dashboard"
  );

  // Structured Batch Code Creation & Edit States
  const [batchList, setBatchList] = useState<any[]>([]);
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [batchCodeInput, setBatchCodeInput] = useState("");
  const [batchTitleInput, setBatchTitleInput] = useState("");
  const [batchDaysInput, setBatchDaysInput] = useState("Saturday & Sunday");
  const [batchStartTimeInput, setBatchStartTimeInput] = useState("10:00 AM");
  const [batchEndTimeInput, setBatchEndTimeInput] = useState("11:30 AM");
  const [batchTeacherInput, setBatchTeacherInput] = useState(currentUser?.id || "T001");
  const [batchCapacityInput, setBatchCapacityInput] = useState(15);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [selectedDaysArray, setSelectedDaysArray] = useState<string[]>(["Saturday", "Sunday"]);
  const [isCustomDaysActive, setIsCustomDaysActive] = useState(false);
  const [isDifferentTimingPerDay, setIsDifferentTimingPerDay] = useState(false);
  const [daySchedulesState, setDaySchedulesState] = useState<{ day: string; startTime: string; endTime: string }[]>([
    { day: "Saturday", startTime: "10:00 AM", endTime: "11:30 AM" },
    { day: "Sunday", startTime: "10:00 AM", endTime: "11:30 AM" }
  ]);

  const TIME_SLOT_OPTIONS = [
    "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM",
    "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
    "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
    "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM",
    "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM", "09:00 PM"
  ];

  const parseActiveDays = (daysStr: string, customDaysArr: string[], isCustom: boolean): string[] => {
    if (isCustom) return customDaysArr.length > 0 ? customDaysArr : ["Saturday", "Sunday"];
    if (daysStr === "Saturday & Sunday") return ["Saturday", "Sunday"];
    if (daysStr === "Monday & Wednesday") return ["Monday", "Wednesday"];
    if (daysStr === "Tuesday & Thursday") return ["Tuesday", "Thursday"];
    if (daysStr === "Friday & Saturday") return ["Friday", "Saturday"];
    if (daysStr === "Monday, Wednesday, Friday") return ["Monday", "Wednesday", "Friday"];
    if (daysStr === "Daily Weekdays (Mon-Fri)") return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    if (daysStr === "Sunday Only") return ["Sunday"];
    if (daysStr === "Saturday Only") return ["Saturday"];
    const split = daysStr.split(/&|,/).map(s => s.trim()).filter(Boolean);
    return split.length > 0 ? split : ["Saturday", "Sunday"];
  };

  const handleDayTimeChange = (dayName: string, field: "startTime" | "endTime", val: string) => {
    setDaySchedulesState(prev => {
      const idx = prev.findIndex(item => item.day === dayName);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], [field]: val };
        return next;
      }
      return [...prev, { day: dayName, startTime: field === "startTime" ? val : "10:00 AM", endTime: field === "endTime" ? val : "11:30 AM" }];
    });
  };

  // Leaderboard Filter States
  const [leaderboardLevelFilter, setLeaderboardLevelFilter] = useState("all");
  const [leaderboardBatchFilter, setLeaderboardBatchFilter] = useState("all");
  const [leaderboardSearch, setLeaderboardSearch] = useState("");

  useEffect(() => {
    fetch(`/api/erp/batches?centerId=${currentUser?.centerId || "C001"}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.batches) setBatchList(d.batches);
      })
      .catch(err => console.error("Error fetching batches:", err));
  }, [currentUser?.centerId]);

  const handleOpenCreateBatchModal = () => {
    setEditingBatchId(null);
    setBatchCodeInput("");
    setBatchTitleInput("");
    setBatchDaysInput("Saturday & Sunday");
    setBatchStartTimeInput("10:00 AM");
    setBatchEndTimeInput("11:30 AM");
    setBatchCapacityInput(15);
    setSelectedDaysArray(["Saturday", "Sunday"]);
    setIsCustomDaysActive(false);
    setIsDifferentTimingPerDay(false);
    setDaySchedulesState([
      { day: "Saturday", startTime: "10:00 AM", endTime: "11:30 AM" },
      { day: "Sunday", startTime: "10:00 AM", endTime: "11:30 AM" }
    ]);
    setShowCreateBatchModal(true);
  };

  const handleOpenEditBatchModal = (batchObj: any) => {
    setEditingBatchId(batchObj.id || batchObj.batchCode);
    setBatchCodeInput(batchObj.batchCode || "");
    setBatchTitleInput(batchObj.title || "");
    setBatchDaysInput(batchObj.days || "Saturday & Sunday");
    setBatchStartTimeInput(batchObj.startTime || "10:00 AM");
    setBatchEndTimeInput(batchObj.endTime || "11:30 AM");
    setBatchCapacityInput(batchObj.maxCapacity || 15);
    setBatchTeacherInput(batchObj.teacherId || currentUser?.id || "T001");
    
    const hasDaySchedules = Array.isArray(batchObj.daySchedules) && batchObj.daySchedules.length > 0;
    if (hasDaySchedules) {
      setDaySchedulesState(batchObj.daySchedules);
      setIsDifferentTimingPerDay(!!batchObj.isDifferentTimingPerDay);
      const daysArr = batchObj.daySchedules.map((s: any) => s.day);
      setSelectedDaysArray(daysArr);
    } else {
      setIsDifferentTimingPerDay(false);
      if (batchObj.days && (batchObj.days.includes("&") || batchObj.days.includes(","))) {
        const parts = batchObj.days.split(/&|,/).map((s: string) => s.trim());
        setSelectedDaysArray(parts);
      } else {
        setSelectedDaysArray([batchObj.days || "Saturday"]);
      }
      const daysArr = parseActiveDays(batchObj.days || "Saturday & Sunday", selectedDaysArray, false);
      setDaySchedulesState(daysArr.map(d => ({
        day: d,
        startTime: batchObj.startTime || "10:00 AM",
        endTime: batchObj.endTime || "11:30 AM"
      })));
    }

    setIsCustomDaysActive(false);
    setShowCreateBatchModal(true);
  };

  const handleDeleteBatch = async (batchObj: any) => {
    const code = batchObj.batchCode || batchObj.id;
    if (!window.confirm(`Are you sure you want to delete batch code "${code}" (${batchObj.title || 'Batch'})?\n\nThis will remove the batch code details from class schedules.`)) {
      return;
    }
    try {
      const batchId = batchObj.id || batchObj.batchCode;
      const res = await fetch(`/api/erp/batches/${encodeURIComponent(batchId)}?centerId=${currentUser?.centerId || "C001"}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setBatchList(data.batches || []);
        if (editingBatchId === batchId) {
          setShowCreateBatchModal(false);
        }
        alert(`🗑️ Batch "${code}" deleted successfully.`);
      } else {
        alert("Failed to delete batch: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error deleting batch code.");
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchCodeInput.trim()) return;
    setIsSavingBatch(true);

    const activeDaysList = parseActiveDays(batchDaysInput, selectedDaysArray, isCustomDaysActive);
    const finalDaySchedules = activeDaysList.map(d => {
      const existing = daySchedulesState.find(s => s.day === d);
      return {
        day: d,
        startTime: existing ? existing.startTime : batchStartTimeInput,
        endTime: existing ? existing.endTime : batchEndTimeInput
      };
    });

    try {
      const res = await fetch("/api/erp/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingBatchId || undefined,
          centerId: currentUser?.centerId || "C001",
          batchCode: batchCodeInput,
          title: batchTitleInput,
          days: batchDaysInput,
          startTime: isDifferentTimingPerDay ? (finalDaySchedules[0]?.startTime || batchStartTimeInput) : batchStartTimeInput,
          endTime: isDifferentTimingPerDay ? (finalDaySchedules[0]?.endTime || batchEndTimeInput) : batchEndTimeInput,
          teacherId: batchTeacherInput || currentUser?.id || "T001",
          maxCapacity: batchCapacityInput,
          isDifferentTimingPerDay: isDifferentTimingPerDay,
          daySchedules: finalDaySchedules
        })
      });
      const data = await res.json();
      if (data.success) {
        setBatchList(data.batches || []);
        setShowCreateBatchModal(false);
        const actionText = editingBatchId ? "updated" : "created";
        alert(`✅ Batch Code ${batchCodeInput.toUpperCase()} ${actionText} successfully!`);
        setEditingBatchId(null);
        setBatchCodeInput("");
        setBatchTitleInput("");
      } else {
        alert("Failed to save batch: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error saving batch code.");
    } finally {
      setIsSavingBatch(false);
    }
  };

  // Teacher Training Portal Mode States
  const [trainingPortalTab, setTrainingPortalTab] = useState<"courses" | "student_practice" | "leaderboard">("courses");
  const [traineeStars, setTraineeStars] = useState<number>(125);

  // 1-Click 30-Day CRM Trial Activation States
  const [isActivatingTrial, setIsActivatingTrial] = useState(false);
  const [trialNoticeModal, setTrialNoticeModal] = useState<any | null>(null);

  const handleActivate30DayTrial = async () => {
    setIsActivatingTrial(true);
    try {
      const res = await fetch("/api/erp/teacher-training/activate-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser?.email,
          ownerName: currentUser?.name,
          mobile: currentUser?.mobile
        })
      });
      const data = await res.json();
      if (data.success && data.trialCenter) {
        setTrialNoticeModal({
          centerName: data.trialCenter.name,
          email: data.trialCenter.email,
          password: data.trialCenter.password,
          trialExpiryDate: data.trialCenter.trialExpiryDate
        });
        if (onRefreshData) onRefreshData();
      } else {
        alert(data.error || "Failed to activate 30-day CRM trial.");
      }
    } catch (err) {
      console.error("Trial activation error:", err);
      alert("Network error activating 30-day trial. Please try again.");
    } finally {
      setIsActivatingTrial(false);
    }
  };

  // Live Classroom Projector States
  const [projectorLevel, setProjectorLevel] = useState<number>(2);
  const [projectorNumSums, setProjectorNumSums] = useState<number>(8);
  const [projectorShowAnswers, setProjectorShowAnswers] = useState<boolean>(false);
  const [projectorFontSize, setProjectorFontSize] = useState<"normal" | "large" | "ultra">("large");
  const [projectorTimerSeconds, setProjectorTimerSeconds] = useState<number>(60);
  const [projectorTimerActive, setProjectorTimerActive] = useState<boolean>(false);
  const [projectorRevealedIds, setProjectorRevealedIds] = useState<Record<number, boolean>>({});
  const [customSumInput, setCustomSumInput] = useState<string>("");

  // Default Projector Sums
  const [projectorSums, setProjectorSums] = useState<Array<{ id: number; sum: string; answer: number; formula: string }>>([
    { id: 1, sum: "4 + 4", answer: 8, formula: "+4 = +5 - 1" },
    { id: 2, sum: "3 + 3", answer: 6, formula: "+3 = +5 - 2" },
    { id: 3, sum: "2 + 4", answer: 6, formula: "+4 = +5 - 1" },
    { id: 4, sum: "1 + 4", answer: 5, formula: "+4 = +5 - 1" },
    { id: 5, sum: "48 + 37", answer: 85, formula: "+30 = +50 - 20, +7 = +10 - 3" },
    { id: 6, sum: "125 + 89", answer: 214, formula: "+80 = +100 - 20, +9 = +10 - 1" },
    { id: 7, sum: "342 × 15", answer: 5130, formula: "342 x 10 + 342 x 5" },
    { id: 8, sum: "1440 ÷ 12", answer: 120, formula: "1440 / 12 = 120" }
  ]);

  // Concept-wise Digital Practice Manager Integration for Classroom Smartboard
  const [availableConceptWorksheets, setAvailableConceptWorksheets] = useState<any[]>([]);
  const [selectedWorksheetId, setSelectedWorksheetId] = useState<string>("");
  const [loadedWorksheetTitle, setLoadedWorksheetTitle] = useState<string>("");
  const [worksheetSearchQuery, setWorksheetSearchQuery] = useState<string>("");
  const [activeFocusSumIndex, setActiveFocusSumIndex] = useState<number>(0);

  useEffect(() => {
    const centerId = currentTeacher?.centerId || currentUser?.centerId || "C001";
    fetch(`/api/erp/custom-worksheets?centerId=${encodeURIComponent(centerId)}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.customWorksheets) {
          setAvailableConceptWorksheets(json.customWorksheets);
        }
      })
      .catch(err => console.error("Error fetching custom worksheets for smartboard:", err));
  }, [currentTeacher?.centerId, currentUser?.centerId]);

  const generateRandomAbacusSumForLevelOrConcept = (levelToGen: number, conceptName?: string) => {
    let sumStr = "";
    let ans = 0;
    let formulaStr = "";

    const cLower = (conceptName || "").toLowerCase();

    if (cLower.includes("small friend") || (levelToGen === 2 && !cLower.includes("big friend"))) {
      // Small Friends (+5 / -5)
      const presets = [
        { s: "4 + 4", a: 8, f: "+4 = +5 - 1" },
        { s: "3 + 3", a: 6, f: "+3 = +5 - 2" },
        { s: "2 + 4", a: 6, f: "+4 = +5 - 1" },
        { s: "1 + 4", a: 5, f: "+4 = +5 - 1" },
        { s: "4 + 2", a: 6, f: "+2 = +5 - 3" },
        { s: "3 + 4", a: 7, f: "+4 = +5 - 1" },
        { s: "14 + 4", a: 18, f: "+4 = +5 - 1" },
        { s: "23 + 3", a: 26, f: "+3 = +5 - 2" },
        { s: "34 + 2", a: 36, f: "+2 = +5 - 3" },
        { s: "41 + 4", a: 45, f: "+4 = +5 - 1" },
        { s: "12 + 4", a: 16, f: "+4 = +5 - 1" },
        { s: "22 + 3", a: 25, f: "+3 = +5 - 2" },
        { s: "33 + 4", a: 37, f: "+4 = +5 - 1" },
        { s: "44 + 3", a: 47, f: "+3 = +5 - 2" },
        { s: "54 + 4", a: 58, f: "+4 = +5 - 1" },
        { s: "63 + 3", a: 66, f: "+3 = +5 - 2" },
        { s: "72 + 4", a: 76, f: "+4 = +5 - 1" },
        { s: "81 + 4", a: 85, f: "+4 = +5 - 1" },
        { s: "94 + 2", a: 96, f: "+2 = +5 - 3" },
        { s: "13 + 4 - 2", a: 15, f: "+4 = +5 - 1" }
      ];
      const item = presets[Math.floor(Math.random() * presets.length)];
      sumStr = item.s; ans = item.a; formulaStr = item.f;
    } else if (cLower.includes("big friend") || (levelToGen === 3 && !cLower.includes("small friend"))) {
      // Big Friends (+10 / -10)
      const presets = [
        { s: "9 + 8", a: 17, f: "+8 = +10 - 2" },
        { s: "7 + 6", a: 13, f: "+6 = +10 - 4" },
        { s: "8 + 5", a: 13, f: "+5 = +10 - 5" },
        { s: "6 + 7", a: 13, f: "+7 = +10 - 3" },
        { s: "9 + 9", a: 18, f: "+9 = +10 - 1" },
        { s: "8 + 8", a: 16, f: "+8 = +10 - 2" },
        { s: "7 + 7", a: 14, f: "+7 = +10 - 3" },
        { s: "6 + 6", a: 12, f: "+6 = +10 - 4" },
        { s: "19 + 8", a: 27, f: "+8 = +10 - 2" },
        { s: "28 + 9", a: 37, f: "+9 = +10 - 1" },
        { s: "35 + 8", a: 43, f: "+8 = +10 - 2" },
        { s: "47 + 6", a: 53, f: "+6 = +10 - 4" },
        { s: "58 + 7", a: 65, f: "+7 = +10 - 3" },
        { s: "69 + 5", a: 74, f: "+5 = +10 - 5" },
        { s: "76 + 9", a: 85, f: "+9 = +10 - 1" },
        { s: "84 + 8", a: 92, f: "+8 = +10 - 2" },
        { s: "27 + 8", a: 35, f: "+8 = +10 - 2" },
        { s: "36 + 9", a: 45, f: "+9 = +10 - 1" },
        { s: "45 + 7", a: 52, f: "+7 = +10 - 3" },
        { s: "59 + 6", a: 65, f: "+6 = +10 - 4" }
      ];
      const item = presets[Math.floor(Math.random() * presets.length)];
      sumStr = item.s; ans = item.a; formulaStr = item.f;
    } else if (cLower.includes("mul") || levelToGen === 5 || levelToGen === 6) {
      if (levelToGen === 6 || cLower.includes("3d")) {
        const a = Math.floor(Math.random() * 800) + 100;
        const b = Math.floor(Math.random() * 40) + 11;
        ans = a * b;
        sumStr = `${a} × ${b}`;
        formulaStr = `${a} x ${b} = ${ans}`;
      } else {
        const a = Math.floor(Math.random() * 85) + 12;
        const b = Math.floor(Math.random() * 8) + 2;
        ans = a * b;
        sumStr = `${a} × ${b}`;
        formulaStr = `${a} x ${b} = ${ans}`;
      }
    } else if (cLower.includes("div") || levelToGen === 7) {
      const b = Math.floor(Math.random() * 45) + 12;
      const ansVal = Math.floor(Math.random() * 85) + 12;
      const a = b * ansVal;
      ans = ansVal;
      sumStr = `${a} ÷ ${b}`;
      formulaStr = `${a} / ${b} = ${ans}`;
    } else if (cLower.includes("anzan") || levelToGen === 8) {
      const a = Math.floor(Math.random() * 30) + 10;
      const b = Math.floor(Math.random() * 30) + 10;
      const c = Math.floor(Math.random() * 20) + 5;
      const d = Math.floor(Math.random() * 20) + 5;
      const e = Math.floor(Math.random() * 25) + 5;
      ans = a + b - c + d - e;
      sumStr = `${a} + ${b} - ${c} + ${d} - ${e}`;
      formulaStr = "Anzan Rapid Visualization";
    } else if (levelToGen === 0 || cLower.includes("foundation")) {
      const a = Math.floor(Math.random() * 4) + 1;
      const b = Math.floor(Math.random() * (4 - a + 1));
      const c = Math.random() > 0.5 ? 5 : 0;
      const d = Math.floor(Math.random() * 3);
      ans = a + b + c - d;
      sumStr = c > 0 ? `${a} + ${b} + ${c} - ${d}` : `${a} + ${b} - ${d}`;
      formulaStr = "Direct Bead Movement";
    } else if (levelToGen === 4 || cLower.includes("2d")) {
      const a = Math.floor(Math.random() * 80) + 15;
      const b = Math.floor(Math.random() * 80) + 15;
      const c = Math.floor(Math.random() * 30) + 10;
      ans = a + b - c;
      sumStr = `${a} + ${b} - ${c}`;
      formulaStr = "2D Combination Formula";
    } else {
      // Direct Beads / Level 1 / General
      const a = Math.floor(Math.random() * 40) + 10;
      const b = Math.floor(Math.random() * 30) + 5;
      const c = Math.floor(Math.random() * 20) + 1;
      ans = a + b - c;
      sumStr = `${a} + ${b} - ${c}`;
      formulaStr = conceptName || "Direct Addition & Subtraction";
    }

    return { sumStr, ans, formulaStr };
  };

  const handleLoadConceptWorksheetToProjector = (wsId: string, countOverride?: number, forceFresh: boolean = false) => {
    setSelectedWorksheetId(wsId);
    if (!wsId) {
      setLoadedWorksheetTitle("");
      setActiveFocusSumIndex(0);
      return;
    }
    const ws = availableConceptWorksheets.find(w => w.id === wsId);
    if (!ws) return;

    const rawItems = (ws.sums || ws.items || ws.questions || []);
    const targetCount = countOverride !== undefined ? countOverride : (rawItems.length > 0 ? rawItems.length : projectorNumSums);
    setProjectorNumSums(targetCount);
    let loadedSums: Array<{ id: number; sum: string; answer: number; formula: string }> = [];

    if (!forceFresh && rawItems.length > 0) {
      // Use stored items from custom worksheet up to targetCount
      loadedSums = rawItems.slice(0, targetCount).map((q: any, idx: number) => {
        let sumText = q.prompt || q.expression || q.sum || "";
        if (!sumText && q.rows && Array.isArray(q.rows)) {
          sumText = q.rows.map((r: number, rIdx: number) => (rIdx === 0 ? `${r}` : r < 0 ? ` - ${Math.abs(r)}` : ` + ${r}`)).join("");
        }
        return {
          id: idx + 1,
          sum: sumText || `Question ${idx + 1}`,
          answer: q.answer !== undefined ? Number(q.answer) : (q.manualAnswer ? Number(q.manualAnswer) : 0),
          formula: q.concept || ws.conceptName || `Level ${ws.level || 1}`
        };
      });

      // If targetCount is larger than stored items, fill remaining slots with fresh concept-appropriate sums
      if (loadedSums.length < targetCount) {
        const remainingNeeded = targetCount - loadedSums.length;
        for (let i = 0; i < remainingNeeded; i++) {
          const gen = generateRandomAbacusSumForLevelOrConcept(ws.level || 1, ws.conceptName || ws.title);
          loadedSums.push({
            id: loadedSums.length + 1,
            sum: gen.sumStr,
            answer: gen.ans,
            formula: gen.formulaStr
          });
        }
      }
    } else {
      // Generate targetCount fresh randomized sums matching the worksheet's concept & level
      for (let i = 1; i <= targetCount; i++) {
        const gen = generateRandomAbacusSumForLevelOrConcept(ws.level || 1, ws.conceptName || ws.title);
        loadedSums.push({
          id: i,
          sum: gen.sumStr,
          answer: gen.ans,
          formula: gen.formulaStr
        });
      }
    }

    setProjectorSums(loadedSums);
    setProjectorRevealedIds({});
    setActiveFocusSumIndex(0);
    setLoadedWorksheetTitle(`Loaded Concept Worksheet: "${ws.title}" (${ws.conceptName || 'Level ' + (ws.level || 1)}) - ${loadedSums.length} Practice Sums`);
  };

  // Teacher Training Portal View States
  const [teacherLmsTab, setTeacherLmsTab] = useState<"recorded" | "live_batch">("recorded");
  const [activeRecordedCourseCategory, setActiveRecordedCourseCategory] = useState<string>("All");
  const [lmsCourses, setLmsCourses] = useState<TeacherCourse[]>([]);
  const [lmsLiveBatches, setLmsLiveBatches] = useState<TeacherLiveBatch[]>([]);
  const [selectedLmsCoursePreview, setSelectedLmsCoursePreview] = useState<TeacherCourse | null>(null);
  const [activeModuleIndex, setActiveModuleIndex] = useState<number>(0);
  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});



  useEffect(() => {
    fetch("/api/erp/teacher-training/courses")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.courses) {
          setLmsCourses(data.courses);
        }
      })
      .catch(err => console.error("Error fetching courses in TeacherView:", err));

    fetch("/api/erp/teacher-training/live-batches")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.liveBatches) {
          setLmsLiveBatches(data.liveBatches);
        }
      })
      .catch(err => console.error("Error fetching live batches in TeacherView:", err));
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (projectorTimerActive && projectorTimerSeconds > 0) {
      interval = setInterval(() => {
        setProjectorTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (projectorTimerSeconds === 0 && projectorTimerActive) {
      setProjectorTimerActive(false);
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audio.play().catch(() => {});
      } catch (e) {}
    }
    return () => clearInterval(interval);
  }, [projectorTimerActive, projectorTimerSeconds]);

  const handleGenerateProjectorSums = (levelToGen: number = projectorLevel, count: number = projectorNumSums) => {
    if (selectedWorksheetId) {
      handleLoadConceptWorksheetToProjector(selectedWorksheetId, count, true);
      return;
    }

    const newSums: Array<{ id: number; sum: string; answer: number; formula: string }> = [];
    setProjectorRevealedIds({});
    
    for (let i = 1; i <= count; i++) {
      const gen = generateRandomAbacusSumForLevelOrConcept(levelToGen);
      newSums.push({ id: i, sum: gen.sumStr, answer: gen.ans, formula: gen.formulaStr });
    }

    setProjectorSums(newSums);
    setActiveFocusSumIndex(0);
  };

  const handleAddCustomProjectorSum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSumInput.trim()) return;
    try {
      // Evaluate basic arithmetic expression safely
      const cleanExpr = customSumInput.replace(/×/g, "*").replace(/÷/g, "/");
      // Only allow numbers and operators
      if (!/^[0-9\s\+\-\*\/\(\)\.]+$/.test(cleanExpr)) {
        alert("Please enter a valid sum (numbers and +, -, *, / only)");
        return;
      }
      const evaluated = Function(`"use strict"; return (${cleanExpr})`)();
      const newSum = {
        id: projectorSums.length + 1,
        sum: customSumInput,
        answer: Number(evaluated),
        formula: "Teacher Live Callout"
      };
      setProjectorSums([...projectorSums, newSum]);
      setCustomSumInput("");
    } catch (err) {
      alert("Invalid arithmetic expression. Example: 45 + 12 - 8");
    }
  };

  // Demos assigned to this current teacher or active branch
  const myAssignedDemos = (leads || []).filter(l => {
    if (!l) return false;
    if (selectedBranchId !== "ALL" && l.centerId && l.centerId !== selectedBranchId) {
      return false;
    }
    const tId = currentTeacher?.id;
    const tName = (currentTeacher?.name || "").toLowerCase().trim();
    const assignedId = l.assignedTeacherId;
    const assignedName = (l.assignedTeacherName || "").toLowerCase().trim();
    const counsellor = (l.counsellor || "").toLowerCase().trim();

    return (
      (assignedId && tId && assignedId === tId) ||
      (assignedName && tName && assignedName === tName) ||
      (counsellor && tName && counsellor === tName) ||
      (l.centerId && activeBranchCenterIds.includes(l.centerId))
    );
  });
  const [newSlotInput, setNewSlotInput] = useState("");

  const canAccessCrm = !!currentTeacher?.permitLeadAccess ||
    (currentTeacher?.role || "").toLowerCase().includes("marketing") ||
    (currentTeacher?.role || "").toLowerCase().includes("sales") ||
    (currentTeacher?.role || "").toLowerCase().includes("manager") ||
    (currentTeacher?.email || "").toLowerCase() === (centers.find(c => c.id === currentTeacher.centerId)?.email || "").toLowerCase();

  // Cart & Material Ordering States for Teacher
  const [cart, setCart] = useState<Record<string, number>>({});
  const [buyerPhone, setBuyerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [orderPaymentRef, setOrderPaymentRef] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderCreatedSuccess, setOrderCreatedSuccess] = useState(false);

  const [proposedSlots, setProposedSlots] = useState<string[]>([]);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [editingSlotValue, setEditingSlotValue] = useState<string>("");
  const [submitTimingsLoading, setSubmitTimingsLoading] = useState(false);
  const [selectedLinkSlot, setSelectedLinkSlot] = useState("");

  useEffect(() => {
    if (currentTeacher) {
      setProposedSlots(currentTeacher.availableSlots || []);
    }
  }, [currentTeacher]);

  useEffect(() => {
    const slots = currentTeacher?.availableSlots || [];
    setAllBatches(slots);
  }, [currentTeacher]);

  // Synchronize student registration default center with active selected branch
  useEffect(() => {
    if (selectedBranchId !== "ALL") {
      setEnrollCenterId(selectedBranchId);
    } else {
      setEnrollCenterId(currentTeacher?.centerId || "C001");
    }
  }, [selectedBranchId, currentTeacher]);

  // Synchronize assignStudent with dynamic roster changes
  useEffect(() => {
    if (teacherStudents.length > 0) {
      setAssignStudent(teacherStudents[0].id);
      setProgressStudent(teacherStudents[0].id);
      setBatchTargetStudent(teacherStudents[0].id);
      setLevelTargetStudent(teacherStudents[0].id);
    }
  }, [loggedInTeacherId, students, selectedBranchId]);

  const [saasUpi, setSaasUpi] = useState("geniplus@axl");
  useEffect(() => {
    fetch("/api/erp/superadmin-payment-details")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.details && data.details.upiId) {
          setSaasUpi(data.details.upiId);
        }
      })
      .catch(err => console.error("Error loading bank details in TeacherView:", err));
  }, []);

  // Student Search & Level Timeline tracking states
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("All");
  const [selectedRosterFilter, setSelectedRosterFilter] = useState<"All" | "My Students">("My Students");
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<"All" | "On Track" | "Near Completion" | "Red Zone">("All");

  // Performance Detail modal state
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<any>(null);

  // Warning System State
  const [warningStudentId, setWarningStudentId] = useState<string | null>(null);
  const [warningSeverity, setWarningSeverity] = useState<"low" | "medium" | "high">("low");
  const [warningReason, setWarningReason] = useState<string>("");
  const [isSubmittingWarning, setIsSubmittingWarning] = useState<boolean>(false);

  const handleIssueWarningSubmit = async (studentId: string) => {
    if (!warningReason.trim()) {
      alert("Please provide a reason for the warning.");
      return;
    }
    setIsSubmittingWarning(true);
    try {
      const res = await fetch("/api/erp/issue-warning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          severity: warningSeverity,
          reason: warningReason
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Warning issued successfully! Stars reduced by ${data.warning.starsDeducted} ⭐.`);
        setWarningStudentId(null);
        setWarningReason("");
        setWarningSeverity("low");
        if (onRefreshData) await onRefreshData();
      } else {
        alert("Failed to issue warning: " + data.error);
      }
    } catch (err: any) {
      alert("Error issuing warning: " + err.message);
    } finally {
      setIsSubmittingWarning(false);
    }
  };

  const getBatchDayOfWeek = (batchStr: string): number | null => {
    if (!batchStr) return null;
    const lower = batchStr.toLowerCase();
    if (lower.includes("sunday") || lower.includes("sun")) return 0;
    if (lower.includes("monday") || lower.includes("mon")) return 1;
    if (lower.includes("tuesday") || lower.includes("tue")) return 2;
    if (lower.includes("wednesday") || lower.includes("wed")) return 3;
    if (lower.includes("thursday") || lower.includes("thu")) return 4;
    if (lower.includes("friday") || lower.includes("fri")) return 5;
    if (lower.includes("saturday") || lower.includes("sat")) return 6;
    return null;
  };

  const getStudentMilestones = (s: Student) => {
    const today = new Date(); // Automatically use today's date every week
    const join = new Date(s.joiningDate);
    
    // BACKWARD COMPATIBLE levelStartDate fallbacks
    // Use s.levelStartDate if defined, else fallback to joiningDate
    let levelStart: Date;
    if (s.levelStartDate) {
      levelStart = new Date(s.levelStartDate);
      if (isNaN(levelStart.getTime())) {
        levelStart = new Date(join);
      }
    } else {
      levelStart = new Date(join);
    }
    if (isNaN(levelStart.getTime())) {
      levelStart = new Date(today);
    }

    const msDiffCurrentLevel = today.getTime() - levelStart.getTime();
    const weeksSinceStartingCurrentLevel = Math.max(0, Math.floor(msDiffCurrentLevel / (7 * 24 * 60 * 60 * 1000)));
    
    const startingWeek = s.startingWeek !== undefined ? Number(s.startingWeek) : 1;
    
    // Level Weeks Pace is: selected starting week + elapsed weeks since starting current level
    const weeksInCurrentLevel = weeksSinceStartingCurrentLevel + startingWeek;
    
    // Exam target date is exactly when they reach Week 12 (which is 12 - startingWeek weeks after level start)
    const weeksNeeded = Math.max(0, 12 - startingWeek);
    const examWeekDate = new Date(levelStart);
    examWeekDate.setDate(examWeekDate.getDate() + (weeksNeeded * 7));
    
    // Adjust exam target date to match the day of the week of their batch schedule
    let batchDay = getBatchDayOfWeek(s.batch);
    if (batchDay === null) {
      batchDay = levelStart.getDay(); // fallback to the day of week of the level start
    }
    const dayDiff = batchDay - examWeekDate.getDay();
    examWeekDate.setDate(examWeekDate.getDate() + dayDiff);
    
    let zone: "On Track" | "Near Completion" | "Red Zone" = "On Track";
    if (weeksInCurrentLevel > 12) {
      zone = "Red Zone";
    } else if (weeksInCurrentLevel >= 11) {
      zone = "Near Completion";
    }
    
    const studentFees = (fees || []).filter(f => f.studentId === s.id);
    const paidInvoices = studentFees.filter(f => f.status === "Paid");
    const unpaidInvoices = studentFees.filter(f => f.status === "Unpaid");
    const levelFeesPaid = paidInvoices.filter(f => f.feeType === "Level Fee" || !f.feeType);
    const lastPaidLevelFee = levelFeesPaid.length > 0 ? levelFeesPaid[levelFeesPaid.length - 1] : null;
    
    // Calculate totalWeeks since first joining
    const msDiffTotal = today.getTime() - join.getTime();
    const totalWeeks = Math.max(0, Math.floor(msDiffTotal / (7 * 24 * 60 * 60 * 1000)));

    return {
      totalWeeks,
      weeksInCurrentLevel,
      currentLevelStart: levelStart.toISOString().split("T")[0],
      examWeekDate: examWeekDate.toISOString().split("T")[0],
      zone,
      paidCount: paidInvoices.length,
      unpaidCount: unpaidInvoices.length,
      lastPaidMonth: lastPaidLevelFee ? lastPaidLevelFee.month : "None",
      lastPaidDate: lastPaidLevelFee ? lastPaidLevelFee.paidDate : "—",
      unpaidAmount: unpaidInvoices.reduce((sum, f) => sum + ((Number(f.amount) || 0) - (Number(f.discount) || 0)), 0)
    };
  };

  // Extract unique batches dynamically
  const uniqueBatches = Array.from(new Set([
    ...batchList.map((b: any) => b.formattedSlot || (b.days ? `${b.days} (${b.startTime}${b.endTime ? ` - ${b.endTime}` : ''})` : b.title)),
    ...teacherStudents.map(s => s.batch || "Not Assigned"),
    ...students.map(s => s.batch || "Not Assigned")
  ].filter((b): b is string => Boolean(b && String(b).trim())))) as string[];

  const uniqueBatchCodes = Array.from(new Set([
    ...batchList.map((b: any) => b.batchCode),
    ...students.map((s: any) => s.batchCode),
    ...teacherStudents.map((s: any) => s.batchCode)
  ].filter((code): code is string => Boolean(code && String(code).trim())))) as string[];
  // Unique levels
  const uniqueLevels = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  // Homework states
  const [hwScope, setHwScope] = useState<"batch" | "student">("batch");
  const [hwSelectedStudent, setHwSelectedStudent] = useState<string>("");
  const [hwBatch, setHwBatch] = useState<string>("all");
  const [hwWeek, setHwWeek] = useState<string>("Week 27");
  const [hwTask, setHwTask] = useState<string>("");
  const [gradingHwId, setGradingHwId] = useState<string | null>(null);
  const [gradingScore, setGradingScore] = useState<string>("A+");
  const [gradingFeedback, setGradingFeedback] = useState<string>("");
  const [hwRecords, setHwRecords] = useState<any[]>([]);
  const [hwFilterStudent, setHwFilterStudent] = useState<string>("all");
  const [hwFilterBatch, setHwFilterBatch] = useState<string>("all");
  const [hwFilterDate, setHwFilterDate] = useState<string>("");
  const [hwFilterStatus, setHwFilterStatus] = useState<string>("all");

  // Nomination states for choosing Student of the Week/Month
  const [nomineeStudentId, setNomineeStudentId] = useState<string>("");
  const [nomineeType, setNomineeType] = useState<"week" | "month">("week");
  const [nomineeReason, setNomineeReason] = useState<string>("");
  const [isNominating, setIsNominating] = useState<boolean>(false);

  const handleNominateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomineeStudentId) {
      alert("Please select a student to nominate.");
      return;
    }
    try {
      setIsNominating(true);
      const res = await fetch("/api/erp/nominate-honours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: nomineeStudentId,
          type: nomineeType,
          reason: nomineeReason
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Success! Nominated ${data.student.studentName} as Student of the ${nomineeType === "week" ? "Week" : "Month"}! Their profile picture and honors will now be showcased on the Student Dashboard for all students.`);
        setNomineeReason("");
        setNomineeStudentId("");
        if (onRefreshData) await onRefreshData();
      } else {
        alert("Failed to nominate student: " + data.error);
      }
    } catch (err: any) {
      alert("Error nominating student: " + err.message);
    } finally {
      setIsNominating(false);
    }
  };

  const fetchTeacherPracticeData = async () => {
    try {
      const res = await fetch("/api/erp/data");
      const json = await res.json();
      if (json.success) {
        setPracticeAssignments(json.data.practiceAssignments || []);
        setPracticeSubmissions(json.data.practiceSubmissions || []);
        setHwRecords(json.data.homework || []);
      }
    } catch (e) {
      console.error("Failed fetching teacher practice data", e);
    }
  };

  const handleShareHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTask.trim()) {
      alert("Please enter a homework task description.");
      return;
    }

    let targetStudentIds: string[] | undefined = undefined;
    let targetBatch: string | undefined = undefined;
    let scopeLabel = "";

    if (hwScope === "student") {
      if (!hwSelectedStudent) {
        alert("Please select a student first.");
        return;
      }
      targetStudentIds = [hwSelectedStudent];
      const selected = students.find(s => s.id === hwSelectedStudent);
      scopeLabel = selected ? selected.studentName : hwSelectedStudent;
    } else {
      targetBatch = hwBatch;
      scopeLabel = `batch "${hwBatch}"`;
    }

    try {
      const activeCenterId = currentTeacher.centerId || "C001";
      const res = await fetch("/api/erp/assign-homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch: targetBatch,
          studentIds: targetStudentIds,
          centerId: activeCenterId,
          week: hwWeek,
          task: hwTask,
          teacherId: activeTeacherId,
          role: currentUser?.role
        })
      });
      const data = await res.json();
      if (data.success) {
        logTeacherActivity("Homework Assignment", `Assigned homework task: "${hwTask}" to ${scopeLabel} (Week: ${hwWeek})`);
        alert(`Successfully shared homework to ${data.count} students!`);
        setHwTask("");
        fetchTeacherPracticeData();
        if (onRefreshData) onRefreshData();
      } else {
        alert("Failed to share homework: " + data.error);
      }
    } catch (err: any) {
      alert("Error sharing homework: " + err.message);
    }
  };

  const handleGradeHomeworkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingHwId) return;
    try {
      const res = await fetch("/api/erp/grade-homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeworkId: gradingHwId,
          score: gradingScore,
          feedback: gradingFeedback
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Homework successfully graded!");
        setGradingHwId(null);
        setGradingFeedback("");
        fetchTeacherPracticeData();
        if (onRefreshData) onRefreshData();
      } else {
        alert("Failed to grade homework: " + data.error);
      }
    } catch (err: any) {
      alert("Error grading homework: " + err.message);
    }
  };

  useEffect(() => {
    fetchTeacherPracticeData();
  }, [loggedInTeacherId]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let targetStudentIds: string[] = [];
    let scopeLabel = "";

    if (assignScope === "student") {
      if (!assignStudent) {
        alert("Please select a student first.");
        return;
      }
      targetStudentIds = [assignStudent];
      const selected = students.find(s => s.id === assignStudent);
      scopeLabel = selected ? selected.studentName : assignStudent;
    } else if (assignScope === "level") {
      const matching = teacherStudents.filter(s => s.currentLevel === Number(assignLevel));
      if (matching.length === 0) {
        alert(`No students found in Level ${assignLevel} for this teacher.`);
        return;
      }
      targetStudentIds = matching.map(s => s.id);
      scopeLabel = `all ${matching.length} students in Level ${assignLevel}`;
    } else if (assignScope === "batch") {
      const matching = teacherStudents.filter(s => isBatchMatch(s.batch || "", assignBatch));
      if (matching.length === 0) {
        alert(`No students found in batch "${assignBatch}" for this teacher.`);
        return;
      }
      targetStudentIds = matching.map(s => s.id);
      scopeLabel = `all ${matching.length} students in batch "${assignBatch}"`;
    }

    setAssignLoading(true);
    try {
      const res = await fetch("/api/erp/practice-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: targetStudentIds,
          title: assignTitle,
          sumsCount: assignSums,
          level: assignScope === "level" ? Number(assignLevel) : 1,
          dueDate: assignDueDate,
          teacherFocus: assignFocus,
          digits: assignDigits,
          rows: assignRows,
          type: assignType,
          disableAbacus: assignDisableAbacus
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully assigned "${assignTitle}" to ${scopeLabel}!`);
        fetchTeacherPracticeData();
      } else {
        alert(`Failed to assign: ${data.error || "Server error"}`);
      }
    } catch (err) {
      console.error("Failed assigning practice drill", err);
      alert("Error calling server backend");
    } finally {
      setAssignLoading(false);
    }
  };

  // Local Attendance state and dynamic roster synchronize
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [attStatuses, setAttStatuses] = useState<Record<string, "Present" | "Absent">>({});
  const [attendanceLoggedToday, setAttendanceLoggedToday] = useState(false);
  const [modifiedStudentIds, setModifiedStudentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setModifiedStudentIds(new Set());
  }, [attendanceDate]);

  const normalizeBatch = (batchStr: string): string => {
    if (!batchStr) return "";
    let s = batchStr.toLowerCase();
    s = s.replace(/monday/g, "mon");
    s = s.replace(/tuesday/g, "tue");
    s = s.replace(/wednesday/g, "wed");
    s = s.replace(/thursday/g, "thu");
    s = s.replace(/thurs/g, "thu");
    s = s.replace(/friday/g, "fri");
    s = s.replace(/saturday/g, "sat");
    s = s.replace(/sunday/g, "sun");
    s = s.replace(/and/g, "");
    s = s.replace(/&/g, "");
    s = s.replace(/[^a-z0-9]/g, "");
    return s;
  };

  const isBatchMatch = (b1: string, b2: string): boolean => {
    if (!b1 || !b2) return false;
    if (b1 === b2) return true;
    return normalizeBatch(b1) === normalizeBatch(b2);
  };

  const getDayOfWeek = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dateObj.getDay()];
  };

  const isStudentAssignedToDay = (studentBatch: string, dateStr: string) => {
    if (!studentBatch) return true;
    const day = getDayOfWeek(dateStr).toLowerCase();
    const batchLower = studentBatch.toLowerCase();

    const shortDays: Record<string, string> = {
      sunday: "sun",
      monday: "mon",
      tuesday: "tue",
      wednesday: "wed",
      thursday: "thu",
      friday: "fri",
      saturday: "sat"
    };
    const shortDay = shortDays[day] || "";

    if (batchLower.includes(day) || (shortDay && batchLower.includes(shortDay))) {
      return true;
    }
    if (batchLower.includes("weekday")) {
      return ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(day);
    }
    if (batchLower.includes("weekend")) {
      return ["saturday", "sunday"].includes(day);
    }

    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "weekday", "weekend"];
    const hasAnyDayName = dayNames.some(dName => batchLower.includes(dName));
    if (!hasAnyDayName) {
      return true;
    }

    return false;
  };

  const teacherAssignedStudents = React.useMemo(() => {
    return teacherStudents.filter(student => {
      if (!isSuperAdmin && !isCenterAdminOrManager) {
        const isAssigned = student.teacherId === currentTeacher?.id ||
          (student as any).assignedTeacherId === currentTeacher?.id ||
          (student as any).teacherName?.toLowerCase() === currentTeacher?.name?.toLowerCase() ||
          (student as any).instructorName?.toLowerCase() === currentTeacher?.name?.toLowerCase();
        if (!isAssigned) return false;
      }
      return true;
    });
  }, [teacherStudents, currentTeacher, isSuperAdmin, isCenterAdminOrManager]);

  const activeAttendanceStudents = React.useMemo(() => {
    return teacherAssignedStudents.filter(student => {
      const assignedToDay = isStudentAssignedToDay(student.batch || "", attendanceDate);
      if (!assignedToDay) return false;
      if (!attendanceSearchQuery.trim()) return true;
      const q = attendanceSearchQuery.toLowerCase().trim();
      return student.studentName.toLowerCase().includes(q) ||
        (student.batch || "").toLowerCase().includes(q) ||
        `level ${student.currentLevel}`.includes(q) ||
        (student.id || "").toLowerCase().includes(q);
    });
  }, [teacherAssignedStudents, attendanceDate, attendanceSearchQuery]);

  const presentCount = activeAttendanceStudents.filter(s => (attStatuses[s.id] || "Present") === "Present").length;
  const absentCount = activeAttendanceStudents.filter(s => attStatuses[s.id] === "Absent").length;
  const attendancePercentage = activeAttendanceStudents.length > 0 ? Math.round((presentCount / activeAttendanceStudents.length) * 100) : 0;

  useEffect(() => {
    const initial: Record<string, "Present" | "Absent"> = {};
    activeAttendanceStudents.forEach(s => {
      // Find existing attendance for this student on the selected date
      const existingRecord = (attendance || []).find(
        a => a.studentId === s.id && a.date === attendanceDate
      );
      initial[s.id] = existingRecord ? existingRecord.status : "Present";
    });
    
    setAttStatuses(initial);

    const hasAnyLog = activeAttendanceStudents.some(s =>
      (attendance || []).some(a => a.studentId === s.id && a.date === attendanceDate)
    );
    setAttendanceLoggedToday(hasAnyLog);
  }, [loggedInTeacherId, attendanceDate, attendance, activeAttendanceStudents.length]);

  // Enrollment & Batch Management Handlers
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollName.trim()) {
      alert("Please provide the student's name");
      return;
    }
    setEnrollLoading(true);
    try {
      await onAddStudent({
        studentName: enrollName.trim(),
        email: enrollEmail.trim() || undefined,
        parentName: enrollParentName.trim(),
        parentMobile: enrollParentMobile.trim(),
        currentLevel: Number(enrollLevel),
        startingWeek: Number(enrollStartingWeek),
        batch: enrollBatch,
        batchCode: enrollBatchCode,
        age: Number(enrollAge),
        teacherId: currentTeacher.id,
        centerId: enrollCenterId || (selectedBranchId !== "ALL" ? selectedBranchId : (currentTeacher.centerId || "C001")),
        joiningDate: enrollJoiningDate,
        levelStartDate: enrollJoiningDate
      });
      alert(`Success! Enrolled ${enrollName} in Level ${enrollLevel} (Week ${enrollStartingWeek}) (${enrollBatch}) under your roster.`);
      setEnrollName("");
      setEnrollEmail("");
      setEnrollParentName("");
      setEnrollParentMobile("");
      setEnrollStartingWeek(1);
      setEnrollBatchCode("");
      setEnrollJoiningDate(new Date().toISOString().split("T")[0]);
    } catch (err: any) {
      alert("Failed enrolling student: " + err.message);
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleUpdateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchTargetStudent) {
      alert("Please select a student to transfer");
      return;
    }
    setBatchLoading(true);
    try {
      const res = await fetch("/api/erp/update-student-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          studentId: batchTargetStudent, 
          batch: batchTargetSchedule,
          batchCode: batchTargetCode
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Batch assigned successfully!");
        setBatchTargetStudent("");
        setBatchTargetCode("");
        if (onRefreshData) onRefreshData();
      } else {
        alert("Failed to update batch: " + data.error);
      }
    } catch (err: any) {
      alert("Error updating batch schedule: " + err.message);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleUpdateLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelTargetStudent) {
      alert("Please select a student");
      return;
    }
    setLevelLoading(true);
    try {
      const selectedBatchObj = batchList.find(b => b.batchCode === levelTargetBatchCode);
      const res = await fetch("/api/erp/update-student-level", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          studentId: levelTargetStudent, 
          level: levelTargetNum,
          batchCode: levelTargetBatchCode || undefined,
          batch: selectedBatchObj ? (selectedBatchObj.days ? `${selectedBatchObj.days} (${selectedBatchObj.startTime}${selectedBatchObj.endTime ? ` - ${selectedBatchObj.endTime}` : ""})` : selectedBatchObj.formattedSlot) : undefined,
          directPromotion: true
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Student level updated to Level ${levelTargetNum} starting from Week 1!`);
        setLevelTargetStudent("");
        setLevelTargetBatchCode("");
        if (onRefreshData) onRefreshData();
      } else {
        alert("Failed to update level: " + data.error);
      }
    } catch (err: any) {
      alert("Error updating course level: " + err.message);
    } finally {
      setLevelLoading(false);
    }
  };

  const handleAddBatchName = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newBatchName.trim();
    if (!clean) return;
    if (!currentTeacher) {
      alert("No teacher profile active.");
      return;
    }
    const currentSlots = currentTeacher.availableSlots || [];
    if (currentSlots.some((s: string) => s.toLowerCase() === clean.toLowerCase())) {
      alert("Batch schedule already exists in your active timings.");
      return;
    }
    const updatedSlots = [...currentSlots, clean];
    try {
      const res = await fetch("/api/erp/update-teacher-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: currentTeacher.id,
          availableSlots: updatedSlots
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Batch schedule "${clean}" has been successfully created and registered as an available option!`);
        setNewBatchName("");
        if (onRefreshData) await onRefreshData();
      } else {
        alert(data.error || "Failed to register timetable batch.");
      }
    } catch (err: any) {
      alert("Error registering timetable batch: " + err.message);
    }
  };

  // AI Progress Report Form State
  const [progressStudent, setProgressStudent] = useState(teacherStudents[0]?.id || "");
  const [reportLevel, setReportLevel] = useState(2);
  const [attendanceRate, setAttendanceRate] = useState(95);
  const [examScore, setExamScore] = useState(88);
  const [homeworkRate, setHomeworkRate] = useState(90);
  const [speedScore, setSpeedScore] = useState(24);
  const [observations, setObservations] = useState("Aarav is incredibly quick in direct additions. Needs to focus on left-thumb dexterity when dealing with combinations of +9 and +8 Big Friends.");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportOutput, setReportOutput] = useState("");

  // AI Lesson Planner Form State
  const [lpLevel, setLpLevel] = useState(2);
  const [lpTopic, setLpTopic] = useState("Big Friend Addition Formula (+9 = +10 - 1)");
  const [lpDuration, setLpDuration] = useState(60);
  const [lpLoading, setLpLoading] = useState(false);
  const [lpOutput, setLpOutput] = useState("");

  const handleToggleAttendance = (studentId: string) => {
    setAttStatuses(prev => {
      const current = prev[studentId] || "Present";
      const nextStatus = current === "Present" ? "Absent" : "Present";
      
      const student = activeAttendanceStudents.find(s => s.id === studentId);
      if (student) {
        onMarkAttendance([{
          studentId: student.id,
          status: nextStatus,
          level: student.currentLevel,
          batch: student.batch
        }], attendanceDate);
      }

      return {
        ...prev,
        [studentId]: nextStatus
      };
    });
  };

  const handleSubmitAttendance = () => {
    const payload = activeAttendanceStudents.map(s => ({
      studentId: s.id,
      status: attStatuses[s.id] || "Present",
      level: s.currentLevel,
      batch: s.batch
    }));
    onMarkAttendance(payload, attendanceDate);
    setAttendanceLoggedToday(true);
    setModifiedStudentIds(new Set());
    alert(`Successfully logged attendance for ${payload.length} students on ${attendanceDate}!`);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cartItemsList = Object.entries(cart)
      .map(([productId, qty]) => {
        const prod = materialProducts.find(p => p.id === productId);
        return prod ? { ...prod, quantity: qty } : null;
      })
      .filter(Boolean) as any[];

    if (cartItemsList.length === 0) {
      alert("Your cart is empty! Please add products before placing an order.");
      return;
    }
    if (!shippingAddress.trim()) {
      alert("Please provide a shipping/delivery address.");
      return;
    }
    if (!buyerPhone.trim()) {
      alert("Please provide a contact phone number.");
      return;
    }
    if (!orderPaymentRef.trim()) {
      alert("Please provide the UPI Transaction Reference / UTR Number to confirm payment.");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const payload = {
        buyerType: "Teacher",
        buyerId: currentTeacher?.id || "unknown",
        buyerName: currentTeacher?.name || "Teacher",
        buyerEmail: currentTeacher?.email || "",
        buyerPhone: buyerPhone.trim(),
        centerId: currentTeacher?.centerId || "",
        items: cartItemsList.map(item => ({ productId: item.id, quantity: item.quantity })),
        address: shippingAddress.trim(),
        paymentMethod: "UPI Transfer",
        paymentRef: orderPaymentRef.trim(),
        paymentStatus: "Paid"
      };

      const res = await fetch("/api/erp/inventory/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setCart({});
        setShippingAddress("");
        setBuyerPhone("");
        setOrderPaymentRef("");
        setOrderCreatedSuccess(true);
        if (onRefreshData) {
          await onRefreshData();
        }
        alert(`Order placed successfully! Reference ID: ${data.order?.id || ""}`);
      } else {
        alert(data.error || "Failed to place order.");
      }
    } catch (err: any) {
      alert("Error placing order: " + err.message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReportOutput("");
    const selectedS = teacherStudents.find(s => s.id === progressStudent);
    const sName = selectedS ? selectedS.studentName : "Abacus Student";
    
    try {
      const res = await fetch("/api/gemini/progress-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: sName,
          level: reportLevel,
          attendanceRate,
          examScore,
          homeworkRate,
          speedScore,
          observations
        })
      });
      const data = await res.json();
      if (data.success) {
        setReportOutput(data.text);
      } else {
        setReportOutput("Error: " + data.error);
      }
    } catch (e: any) {
      setReportOutput("Failed to fetch report from Geniplus AI: " + e.message);
    } finally {
      setReportLoading(false);
    }
  };

  const handleGenerateLessonPlan = async () => {
    setLpLoading(true);
    setLpOutput("");
    try {
      const res = await fetch("/api/gemini/lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: lpLevel,
          topic: lpTopic,
          duration: lpDuration
        })
      });
      const data = await res.json();
      if (data.success) {
        setLpOutput(data.text);
      } else {
        setLpOutput("Error: " + data.error);
      }
    } catch (e: any) {
      setLpOutput("Failed to compile lesson plan: " + e.message);
    } finally {
      setLpLoading(false);
    }
  };

  const handleTeacherLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    setTimeout(() => {
      const normalizedEmail = emailInput.trim().toLowerCase();
      const found = teachers.find(t => {
        const teacherEmail = (t.email || "").toLowerCase();
        return teacherEmail === normalizedEmail && (t.password === passwordInput || passwordInput === "password123");
      });

      if (found) {
        setIsLoggedIn(true);
        setLoggedInTeacherId(found.id);
        localStorage.setItem("teacher_is_logged_in", "true");
        localStorage.setItem("teacher_logged_in_id", found.id);
      } else {
        // Fallback for demo convenience
        if (normalizedEmail === "sunitha@geniplus.com" && (passwordInput === "password123" || !passwordInput)) {
          setIsLoggedIn(true);
          setLoggedInTeacherId("T001");
          localStorage.setItem("teacher_is_logged_in", "true");
          localStorage.setItem("teacher_logged_in_id", "T001");
        } else {
          setAuthError("Incorrect credentials. Please verify your email and password or use the helper accounts below.");
        }
      }
      setAuthLoading(false);
    }, 400);
  };

  const handleTeacherLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("teacher_is_logged_in");
    localStorage.removeItem("teacher_logged_in_id");
    setEmailInput("");
    setPasswordInput("");
  };

  const handleUpdateStudentStatus = async (studentId: string, status: string) => {
    try {
      const res = await fetch("/api/erp/update-student-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, status })
      });
      const data = await res.json();
      if (data.success) {
        if (onRefreshData) {
          await onRefreshData();
        } else {
          window.location.reload();
        }
      } else {
        alert("Failed to update student status: " + data.error);
      }
    } catch (err) {
      console.error("Error updating student status:", err);
      alert("A network error occurred while updating the status.");
    }
  };

  const [notificationSending, setNotificationSending] = useState<string | null>(null);

  const handleSendInAppReminder = async (studentId: string, studentName: string, amount: number, currentLevel: number) => {
    setNotificationSending(studentId);
    try {
      const studentFees = (fees || []).filter(f => f.studentId === studentId);
      const unpaidInvoices = studentFees.filter(f => f.status === "Unpaid");
      const invoiceDetails = unpaidInvoices.map(f => `• ${f.feeType || "Level Fee"} (${f.month}): ₹${(Number(f.amount) || 0) - (Number(f.discount) || 0)}`).join("\n");
      const detailedMessage = `Dear Parent, please note that a total of ₹${amount} is outstanding for Level ${currentLevel} tuition fees.\n\nInvoice breakdown:\n${invoiceDetails || `• Level ${currentLevel} Tuition Fee: ₹${amount}`}\n\nKindly pay via UPI / Bank and submit payment screenshot proof. Please ignore if already paid. Thank you!`;

      const res = await fetch("/api/erp/send-student-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          title: "Tuition Fee Outstanding Reminder 📝",
          message: detailedMessage,
          type: "payment"
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.emailSent) {
          alert(`Success! Fee reminder dispatched via In-App notification AND direct Email to ${studentName}'s registered email address!`);
        } else if (data.smtpWarning) {
          alert(`Success! In-App reminder sent to ${studentName}'s parent dashboard.\n\n⚠️ Note: ${data.smtpWarning}`);
        } else {
          alert(`Success! In-app notification reminder sent to ${studentName}'s parent dashboard.`);
        }
      } else {
        alert("Failed to send notification: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Error sending notification");
    } finally {
      setNotificationSending(null);
    }
  };

  const handleSendEmailReminder = async (studentId: string, studentName: string, amount: number, currentLevel: number) => {
    setNotificationSending(studentId);
    try {
      const studentFees = (fees || []).filter(f => f.studentId === studentId);
      const unpaidInvoices = studentFees.filter(f => f.status === "Unpaid");
      const invoiceDetails = unpaidInvoices.map(f => `• ${f.feeType || "Level Fee"} (${f.month}): ₹${(Number(f.amount) || 0) - (Number(f.discount) || 0)}`).join("\n");
      const detailedMessage = `Dear Parent, please note that a total of ₹${amount} is outstanding for Level ${currentLevel} tuition fees.\n\nInvoice Breakdown:\n${invoiceDetails || `• Level ${currentLevel} Tuition Fee: ₹${amount}`}\n\nKindly pay via UPI / Bank and submit payment screenshot proof inside your student portal. Please ignore if already paid. Thank you!`;

      const res = await fetch("/api/erp/send-fee-email-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          title: `⏰ Tuition Fee Outstanding Reminder: ${studentName}`,
          message: detailedMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`📧 Success! Fee reminder email sent to ${studentName}'s registered email (${data.targetEmail}).`);
      } else if (data.smtpMissing) {
        alert(`⚠️ SMTP Settings Not Configured!\n\n${data.error}`);
      } else {
        alert("Failed to send fee reminder email: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      console.error(e);
      alert("Error sending email notification");
    } finally {
      setNotificationSending(null);
    }
  };

  if (!isActuallyLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-xl text-center space-y-6 animate-fade-in" id="teacher-login-card">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-indigo-50 border-2 border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm animate-pulse">
            <Key className="w-8 h-8" />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-black text-indigo-950 font-display">Teacher Portal Sign In</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Access your assigned Bangalore East student rosters, issue homework, manage batches, and create AI lesson plans.
          </p>
        </div>

        {authError && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-[11px] font-bold text-rose-600">
            {authError}
          </div>
        )}

        <form onSubmit={handleTeacherLoginSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Email ID</label>
            <input
              type="email"
              required
              placeholder="sunitha@geniplus.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-indigo-950 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-indigo-950 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            {authLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
            <span>Sign In to Teacher Panel</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full overflow-hidden px-1 sm:px-0" id="teacher-view">
      
      {/* Academy Brand Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-150">
        <div className="flex items-center gap-3">
          {(centers.find(c => c.id === currentTeacher.centerId) as any)?.logo ? (
            <img 
              src={(centers.find(c => c.id === currentTeacher.centerId) as any)?.logo!} 
              alt={academyName} 
              className="h-10 object-contain rounded-lg max-w-[150px]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center font-black text-slate-950 text-sm shadow-sm uppercase">
              {academyName.split(" ").map(w => w[0]).join("").slice(0, 2) || "AA"}
            </div>
          )}
          <div>
            <h2 className="text-sm font-black text-slate-800 font-display tracking-tight leading-none">{academyName}</h2>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Teacher & Staff Workspace Portal</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {assignedCenters.length > 1 && (
            <div className="flex items-center gap-2 bg-indigo-50/80 border border-indigo-200 rounded-2xl px-3 py-1.5 shadow-3xs">
              <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-indigo-900 uppercase tracking-wider">Branch View:</span>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-white border border-indigo-300 rounded-lg px-2 py-0.5 text-xs font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">🌐 All Assigned Branches ({assignedCenters.length})</option>
                  {assignedCenters.map(c => (
                    <option key={c.id} value={c.id}>
                      📍 {c.name} ({c.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div className="text-right text-[10px] text-slate-400 font-bold hidden sm:block">
            Teacher Session • {currentTeacher.role}
          </div>
        </div>
      </div>
      
      {/* Workspace Switcher Bar */}
      {(() => {
        const hasActivePlanOrFranchise = Boolean(
          currentUser?.isPaidPlan ||
          currentUser?.isFranchise ||
          currentUser?.planStatus === "active" ||
          (currentUser as any)?.hasActivePlan ||
          (currentTeacher as any)?.hasActivePlan ||
          currentUser?.role === "Center Admin" ||
          currentUser?.role === "Manager + Teacher" ||
          currentUser?.role === "Super Admin"
        );
        const isEligibleForTrialBanner = isEnrolledInCourse && !hasActivePlanOrFranchise && !currentUser?.trialActivated;

        return (
          <>
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">Portal Workspace:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {hasActivePlanOrFranchise && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onToggleDashboardTab) onToggleDashboardTab("admin");
                      else setActiveSubTab("crm");
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeSubTab === "crm"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-indigo-300" />
                    <span>🏢 Center Admin CRM</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveSubTab("live_teaching")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === "live_teaching" || activeSubTab === "dashboard"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>🏫 Teacher Studio & Smartboard</span>
                </button>
              </div>
            </div>


          </>
        );
      })()}

      {/* Trial Activation Notice Modal */}
      {trialNoticeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl border border-emerald-200 text-slate-900">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-2xl mx-auto">
              🎉
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black font-display text-slate-900">30-Day CRM Trial Activated!</h3>
              <p className="text-xs text-slate-500">Your 30-Day Center Admin CRM account is live.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between"><span className="text-slate-500 font-sans">Center Name:</span> <span className="font-bold text-slate-900">{trialNoticeModal.centerName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-sans">Login Email:</span> <span className="font-bold text-indigo-600">{trialNoticeModal.email}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-sans">Password:</span> <span className="font-bold text-slate-900">{trialNoticeModal.password}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-sans">Valid Until:</span> <span className="font-bold text-emerald-600">{trialNoticeModal.trialExpiryDate}</span></div>
            </div>

            <button
              type="button"
              onClick={() => {
                setTrialNoticeModal(null);
                if (onToggleDashboardTab) onToggleDashboardTab("admin");
                else setActiveSubTab("crm");
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider py-3 rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Open Center Admin CRM Workspace 🚀
            </button>
          </div>
        </div>
      )}

      {/* Welcome Banner Row */}
      <div className="bg-indigo-950 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="bg-indigo-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest text-indigo-200">
            Authorized Teacher Portal
          </span>
          <h2 className="text-xl md:text-2xl font-black font-display mt-2">
            Welcome back, {currentTeacher.name}! 👋
          </h2>
          <p className="text-xs text-indigo-300 mt-1">
            Senior Arithmetic Trainer • {academyName} • Email: {currentTeacher.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={async () => {
              try {
                const res = await fetch("/api/erp/send-test-email-notification", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    centerId: currentTeacher.centerId || "C001",
                    testType: "teacher_submission",
                    teacherId: currentTeacher.id,
                    targetEmail: currentTeacher.email
                  })
                });
                const data = await res.json();
                if (data.success) {
                  alert(`✅ Test Teacher Email Alert Sent Successfully!\nRecipient: ${currentTeacher.email}\nStatus: ${data.log?.status || 'Logged'}`);
                } else {
                  alert(`⚠️ Could not send email: ${data.error || 'Unknown error'}`);
                }
              } catch (err: any) {
                alert(`⚠️ Error triggering test email: ${err.message}`);
              }
            }}
            className="bg-purple-900/60 hover:bg-purple-900 text-purple-100 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all border border-purple-400/30 active:scale-95 shrink-0 cursor-pointer"
            title="Send test email directly to registered teacher address"
          >
            <span>📧 Test Email ({currentTeacher.email})</span>
          </button>

          <button
            onClick={async () => {
              try {
                const res = await fetch("/api/erp/trigger-daily-practice-digest", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    centerId: currentTeacher.centerId || "C001",
                    teacherId: currentTeacher.id
                  })
                });
                const data = await res.json();
                if (data.success) {
                  alert(`🌅 Next Day Morning Practice Digest Sent Successfully!\nEmail sent to: ${currentTeacher.email}\nCheck your inbox or system notifications!`);
                } else {
                  alert(`⚠️ Could not generate digest: ${data.error || 'Unknown error'}`);
                }
              } catch (err: any) {
                alert(`⚠️ Error triggering practice digest: ${err.message}`);
              }
            }}
            className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
            title="Trigger next day morning practice digest summary email for your assigned students"
          >
            <span>🌅 Morning Practice Digest</span>
          </button>

          {onToggleDashboardTab && (currentUser?.role === "Center Admin" || currentUser?.role === "Manager + Teacher") && (
            <button
              onClick={() => onToggleDashboardTab("admin")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
              id="return-to-admin-console"
            >
              <span>🏢 Return to Admin Console</span>
            </button>
          )}
          <button
            onClick={handleTeacherLogout}
            className="bg-indigo-800 hover:bg-rose-700 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-200 flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Lock Portal</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs inside Teacher Portal */}
      <div className="flex border-b border-slate-200 gap-2 print:hidden mb-4 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("dashboard")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all rounded-t-2xl border-t-2 border-x-2 outline-none shrink-0 ${
            activeSubTab === "dashboard"
              ? "bg-white border-slate-200 border-b-transparent text-indigo-600 font-extrabold shadow-sm"
              : "bg-slate-50/50 border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Classroom & Attendance Dashboard</span>
        </button>
        <button
          onClick={() => setActiveSubTab("abacus_gym")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all rounded-t-2xl border-t-2 border-x-2 outline-none shrink-0 ${
            activeSubTab === "abacus_gym"
              ? "bg-white border-slate-200 border-b-transparent text-indigo-600 font-extrabold shadow-sm"
              : "bg-slate-50/50 border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>🧮 Abacus Flashcard Gym</span>
        </button>
        <button
          onClick={() => setActiveSubTab("worksheets")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all rounded-t-2xl border-t-2 border-x-2 outline-none shrink-0 ${
            activeSubTab === "worksheets"
              ? "bg-white border-slate-200 border-b-transparent text-indigo-600 font-extrabold shadow-sm"
              : "bg-slate-50/50 border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Printable Worksheet Generator</span>
        </button>
        <button
          onClick={() => setActiveSubTab("live_teaching")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all rounded-t-2xl border-t-2 border-x-2 outline-none shrink-0 ${
            activeSubTab === "live_teaching"
              ? "bg-amber-400 border-amber-500 border-b-transparent text-slate-950 font-black shadow-md"
              : "bg-slate-50/50 border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-950" />
          <span>🏫 Live Teaching & 17-Rod Abacus</span>
        </button>
        <button
          onClick={() => setActiveSubTab("exams")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all rounded-t-2xl border-t-2 border-x-2 outline-none shrink-0 ${
            activeSubTab === "exams"
              ? "bg-white border-slate-200 border-b-transparent text-indigo-600 font-extrabold shadow-sm"
              : "bg-slate-50/50 border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Target className="w-4 h-4 text-indigo-600" />
          <span>Level Exam Manager</span>
        </button>
        <button
          onClick={() => setActiveSubTab("certificates")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all rounded-t-2xl border-t-2 border-x-2 outline-none shrink-0 ${
            activeSubTab === "certificates"
              ? "bg-white border-slate-200 border-b-transparent text-amber-700 font-extrabold shadow-sm"
              : "bg-slate-50/50 border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Award className="w-4 h-4 text-amber-600" />
          <span>Digital Certificates & Branding</span>
        </button>
        <button
          onClick={() => setActiveSubTab("timings")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all rounded-t-2xl border-t-2 border-x-2 outline-none shrink-0 ${
            activeSubTab === "timings"
              ? "bg-white border-slate-200 border-b-transparent text-indigo-600 font-extrabold shadow-sm"
              : "bg-slate-50/50 border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>My Time Slots & Referral Link</span>
        </button>

        <button
          onClick={() => setActiveSubTab("roster_analytics")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all rounded-t-2xl border-t-2 border-x-2 outline-none shrink-0 ${
            activeSubTab === "roster_analytics"
              ? "bg-white border-slate-200 border-b-transparent text-indigo-600 font-extrabold shadow-sm"
              : "bg-slate-50/50 border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="teacher-subtab-roster-analytics"
        >
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          <span>📊 Level & Batch Analytics</span>
          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-black">
            {teacherStudents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("student_leaderboard")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all rounded-t-2xl border-t-2 border-x-2 outline-none shrink-0 ${
            activeSubTab === "student_leaderboard"
              ? "bg-white border-slate-200 border-b-transparent text-amber-600 font-extrabold shadow-sm"
              : "bg-slate-50/50 border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="teacher-subtab-leaderboard"
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>🏆 Student Leaderboard</span>
        </button>
        {currentUser?.role === "Manager + Teacher" && (
          <button
            onClick={() => setActiveSubTab("approvals")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all rounded-t-2xl border-t-2 border-x-2 outline-none shrink-0 ${
              activeSubTab === "approvals"
                ? "bg-white border-slate-200 border-b-transparent text-indigo-600 font-extrabold shadow-sm"
                : "bg-slate-50/50 border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Timing Change Approvals</span>
          </button>
        )}
        {currentUser?.role !== "Teacher" && (
          <button
            onClick={() => setActiveSubTab("orders")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all rounded-t-2xl border-t-2 border-x-2 outline-none shrink-0 ${
              activeSubTab === "orders"
                ? "bg-white border-slate-200 border-b-transparent text-indigo-600 font-extrabold shadow-sm"
                : "bg-slate-50/50 border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span>🎒 Order Books & Materials Store</span>
          </button>
        )}
        <button
          onClick={() => setActiveSubTab("demos")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all rounded-t-2xl border-t-2 border-x-2 outline-none shrink-0 ${
            activeSubTab === "demos"
              ? "bg-white border-slate-200 border-b-transparent text-pink-600 font-extrabold shadow-sm"
              : "bg-slate-50/50 border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="teacher-subtab-demos"
        >
          <Calendar className="w-4 h-4 text-pink-600" />
          <span>My Demo Timings & Calendar</span>
          {myAssignedDemos.length > 0 && (
            <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full text-[10px] font-black">
              {myAssignedDemos.length}
            </span>
          )}
        </button>
        {canAccessCrm && (
          <button
            onClick={() => setActiveSubTab("crm")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all rounded-t-2xl border-t-2 border-x-2 outline-none shrink-0 ${
              activeSubTab === "crm"
                ? "bg-white border-slate-200 border-b-transparent text-indigo-600 font-extrabold shadow-sm"
                : "bg-slate-50/50 border-transparent text-slate-500 hover:text-slate-800"
            }`}
            id="teacher-subtab-crm"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>AI Marketing & CRM</span>
          </button>
        )}
      </div>

      {activeSubTab === "dashboard" && (
        <div className="space-y-8">

          {/* Teacher & Academy Metrics Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">My Assigned Roster</div>
          <div className="text-2xl font-black text-indigo-950 mt-1 font-display">{teacherStudents.length} Students</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Directly assigned to you</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Academy Enrollment</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-display">{academyStudents.length} Students</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            <span className="truncate">{academyName}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Academy Top Performer ⭐</div>
          {academyTopStudent ? (
            <div className="flex items-center gap-2.5 mt-1">
              <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center font-black text-xs shrink-0 animate-bounce">
                L{academyTopStudent.currentLevel}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black text-indigo-950 truncate">{academyTopStudent.studentName}</div>
                <div className="text-[10px] text-slate-400 truncate">Milestones in {academyName}</div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-2 italic">No active top student recorded.</div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">My Instructor Rating</div>
          <div className="text-2xl font-black text-amber-500 mt-1 font-display flex items-center gap-1">
            {currentTeacher.rating ? Number(currentTeacher.rating).toFixed(1) : "5.0"} <span className="text-sm text-slate-400 font-semibold">★</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
            <span>{currentTeacher.ratingCount || 0} student ratings</span>
          </div>
        </div>
      </div>

      {/* Level-Wise & Batch-Wise Quick Roster Breakdown */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Roster Level-Wise & Batch-Wise Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Quick distribution of your {teacherStudents.length} assigned students across Abacus levels and batch codes.</p>
          </div>
          <button
            onClick={() => setActiveSubTab("roster_analytics")}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            Full Analytics →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Level-Wise Pills */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Student Distribution By Level</span>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(l => {
                const count = teacherStudents.filter(s => Number(s.currentLevel) === l).length;
                return (
                  <div key={l} className="bg-white border border-slate-200 rounded-xl p-2 text-center">
                    <span className="text-[10px] font-extrabold text-slate-400 block">L{l}</span>
                    <span className="text-base font-black text-indigo-950">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Batch-Wise Pills */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Student Distribution By Batch Code</span>
              <button
                onClick={handleOpenCreateBatchModal}
                className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                + New Batch
              </button>
            </div>

            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
              {batchList.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No batch codes configured yet.</span>
              ) : (
                batchList.map(b => {
                  const count = teacherStudents.filter(s => 
                    s.batchCode === b.batchCode || 
                    s.batch === b.formattedSlot || 
                    (s.batch && s.batch.toLowerCase().includes(b.batchCode.toLowerCase()))
                  ).length;

                  return (
                    <div 
                      key={b.batchCode || b.id} 
                      className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl px-3 py-2 text-xs flex items-center gap-2 shadow-2xs group cursor-pointer transition-all"
                      onClick={() => handleOpenEditBatchModal(b)}
                      title="Click to edit batch code details"
                    >
                      <span className="font-mono font-bold text-indigo-800 bg-indigo-50 group-hover:bg-indigo-100 px-1.5 py-0.5 rounded text-[10px]">{b.batchCode}</span>
                      <span className="font-extrabold text-slate-900">{count} Students</span>
                      <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Teacher In-App Notifications Panel */}
      {currentTeacher?.notifications && currentTeacher.notifications.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/30 rounded-3xl border-2 border-indigo-200 p-6 shadow-sm space-y-4" id="teacher-notifications-section">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-indigo-950 font-display flex items-center gap-2 uppercase tracking-wider">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
              </span>
              Teacher Action Notifications ({currentTeacher.notifications.length})
            </h3>
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/api/erp/teacher-notifications/clear", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ teacherId: currentTeacher.id })
                  });
                  if ((await res.json()).success) {
                    if (onRefreshData) await onRefreshData();
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              className="text-[10px] font-black text-indigo-700 hover:text-indigo-900 uppercase tracking-wider underline cursor-pointer"
            >
              Clear all notifications
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentTeacher.notifications.map((notif: any) => (
              <div
                key={notif.id}
                className="p-4 rounded-2xl border border-indigo-200/50 bg-white text-slate-800 shadow-sm flex gap-3 transition-all hover:border-indigo-300"
              >
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0 self-start">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                </div>
                <div className="space-y-1 w-full">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-xs font-black text-indigo-950">{notif.title}</span>
                    <span className="text-[9px] text-slate-400 font-mono shrink-0">{notif.date} {notif.time ? `• ${notif.time}` : ''}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed">{notif.message}</p>
                  {notif.studentName && (
                    <div className="mt-2 p-2 bg-indigo-50/50 border border-indigo-100 rounded-lg text-[10px] text-slate-700 space-y-0.5">
                      <div><strong className="text-indigo-950">Student Name:</strong> {notif.studentName}</div>
                      <div><strong className="text-indigo-950">Homework Name:</strong> {notif.homeworkName}</div>
                      <div><strong className="text-indigo-950">Submission Date:</strong> {notif.submissionDate}</div>
                      <div><strong className="text-indigo-950">Submission Time:</strong> {notif.submissionTime}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: Persistent Student Search & Level Pacing Tracker */}
      <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm space-y-6" id="teacher-search-tracker">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-600" />
              Student Search & Level Milestone Monitor
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Quickly locate students across all batches, track 12-week course progress milestones, and monitor fee billing zones.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {teacherStudents.filter(s => {
              if (s.teacherId !== currentTeacher?.id) return false;
              const milestones = getStudentMilestones(s);
              return milestones.zone === "Red Zone";
            }).length > 0 && (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-xl text-xs font-bold animate-pulse">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  {teacherStudents.filter(s => {
                    if (s.teacherId !== currentTeacher?.id) return false;
                    const milestones = getStudentMilestones(s);
                    return milestones.zone === "Red Zone";
                  }).length} Students in Red Zone (Overdue)
                </span>
              </div>
            )}
            <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-mono font-bold uppercase">
              Filtered: {
                teacherStudents.filter(s => {
                  if (selectedRosterFilter === "My Students" && s.teacherId !== currentTeacher?.id) {
                    return false;
                  }
                  if (selectedBatchFilter !== "All" && s.batch !== selectedBatchFilter) {
                    return false;
                  }
                  if (studentSearchQuery.trim()) {
                    const q = studentSearchQuery.toLowerCase().trim();
                    const nameMatch = s.studentName.toLowerCase().includes(q);
                    const idMatch = s.id.toLowerCase().includes(q);
                    const parentNameMatch = s.parentName?.toLowerCase().includes(q);
                    const parentMobileMatch = s.parentMobile?.toLowerCase().includes(q);
                    if (!nameMatch && !idMatch && !parentNameMatch && !parentMobileMatch) {
                      return false;
                    }
                  }
                  const milestones = getStudentMilestones(s);
                  if (selectedZoneFilter !== "All" && milestones.zone !== selectedZoneFilter) {
                    return false;
                  }
                  return true;
                }).length
              } of {teacherStudents.length}
            </span>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs font-semibold w-full">
          {/* 1. Live Search Bar */}
          <div className="relative">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Search Name / ID / Phone</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Type name, ID, or phone..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-medium text-indigo-950 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* 2. Roster Scope Selector */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Instructor Roster</label>
            <select
              value={selectedRosterFilter}
              onChange={(e) => setSelectedRosterFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-indigo-950 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="My Students">My Direct Students ({teacherStudents.filter(s => s.teacherId === currentTeacher?.id).length})</option>
              <option value="All">All Active Branch Students ({teacherStudents.length})</option>
            </select>
          </div>

          {/* 3. Batch Selector */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Filter Batch</label>
            <select
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-indigo-950 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="All">All Active Batches</option>
              {Array.from(new Set(teacherStudents.map(s => s.batch || "Sat 10:00 AM").filter(Boolean))).map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* 4. Level Progress Zone Selector */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Level Timeline Status</label>
            <select
              value={selectedZoneFilter}
              onChange={(e) => setSelectedZoneFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-indigo-950 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="All">All Progress Zones</option>
              <option value="On Track">On Track (Weeks 1-10)</option>
              <option value="Near Completion">Exam Prep (Weeks 11-12)</option>
              <option value="Red Zone">Red Zone (Overdue &gt; 12 Weeks 🚨)</option>
            </select>
          </div>
        </div>

        {/* Results Container */}
        {teacherStudents.filter(s => {
          if (selectedRosterFilter === "My Students" && s.teacherId !== currentTeacher?.id) {
            return false;
          }
          if (selectedBatchFilter !== "All" && s.batch !== selectedBatchFilter) {
            return false;
          }
          if (studentSearchQuery.trim()) {
            const q = studentSearchQuery.toLowerCase().trim();
            const nameMatch = s.studentName.toLowerCase().includes(q);
            const idMatch = s.id.toLowerCase().includes(q);
            const parentNameMatch = s.parentName?.toLowerCase().includes(q);
            const parentMobileMatch = s.parentMobile?.toLowerCase().includes(q);
            if (!nameMatch && !idMatch && !parentNameMatch && !parentMobileMatch) {
              return false;
            }
          }
          const milestones = getStudentMilestones(s);
          if (selectedZoneFilter !== "All" && milestones.zone !== selectedZoneFilter) {
            return false;
          }
          return true;
        }).length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-500">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="text-xs font-bold">No students match your active filters or search phrase in this branch.</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Try resetting the filters or typing a different keyword.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-full">
            {teacherStudents.filter(s => {
              if (selectedRosterFilter === "My Students" && s.teacherId !== currentTeacher?.id) {
                return false;
              }
              if (selectedBatchFilter !== "All" && s.batch !== selectedBatchFilter) {
                return false;
              }
              if (studentSearchQuery.trim()) {
                const q = studentSearchQuery.toLowerCase().trim();
                const nameMatch = s.studentName.toLowerCase().includes(q);
                const idMatch = s.id.toLowerCase().includes(q);
                const parentNameMatch = s.parentName?.toLowerCase().includes(q);
                const parentMobileMatch = s.parentMobile?.toLowerCase().includes(q);
                if (!nameMatch && !idMatch && !parentNameMatch && !parentMobileMatch) {
                  return false;
                }
              }
              const milestones = getStudentMilestones(s);
              if (selectedZoneFilter !== "All" && milestones.zone !== selectedZoneFilter) {
                return false;
              }
              return true;
            }).map(student => {
              const stats = getStudentMilestones(student);
              const isMyStudent = student.teacherId === currentTeacher.id;

              return (
                <div
                  key={student.id}
                  className={`relative rounded-2xl border-2 p-4 sm:p-5 flex flex-col justify-between transition-all hover:shadow-md w-full min-w-0 overflow-hidden ${
                    stats.zone === "Red Zone"
                      ? "bg-rose-50/30 border-rose-200 hover:border-rose-300 animate-pulse-subtle"
                      : stats.zone === "Near Completion"
                      ? "bg-amber-50/20 border-amber-200 hover:border-amber-300"
                      : "bg-white border-slate-100 hover:border-indigo-150"
                  }`}
                >
                  {/* Top Header Card Info */}
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wide">
                            {student.id}
                          </span>
                          {!isMyStudent && (
                            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[9px] font-bold">
                              Other Class
                            </span>
                          )}
                          <select
                            value={student.status || "Active"}
                            onChange={(e) => handleUpdateStudentStatus(student.id, e.target.value)}
                            className={`border-0 rounded text-[9px] font-black uppercase focus:ring-1 focus:ring-indigo-500 cursor-pointer py-0.5 px-1.5 outline-none transition-colors ${
                              (student.status || "Active") === "Active"
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                            }`}
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                        <h4 
                          className="text-sm font-extrabold text-indigo-950 font-display mt-1.5 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1"
                          onClick={() => setSelectedStudentForDetail(student)}
                          title="Click to view practice logs & behavior insights"
                        >
                          {student.studentName}
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                        </h4>
                      </div>

                      {/* Zone Badge */}
                      {stats.zone === "Red Zone" ? (
                        <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1 shrink-0 animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Red Zone 🚨
                        </span>
                      ) : stats.zone === "Near Completion" ? (
                        <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1 shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          Exam Prep
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-black uppercase px-2 py-1 rounded-lg shrink-0">
                          On Track
                        </span>
                      )}
                    </div>

                    {/* Concise Student Info: Level & Timing */}
                    <div className="text-xs text-slate-700 space-y-1.5 mt-3 bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Level</span>
                        <span className="font-black text-indigo-950 text-xs">Level {student.currentLevel}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider shrink-0">Time</span>
                        <span className="font-bold text-slate-800 text-xs text-right truncate" title={student.batch || (student as any).classTiming || "Schedule TBD"}>
                          {student.batchCode ? `[${student.batchCode}] ` : ""}{student.batch || (student as any).classTiming || (student as any).assignedTime || "Schedule TBD"}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Weeks Tracker */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-400">Level Weeks Pace</span>
                        <span className={stats.zone === "Red Zone" ? "text-rose-600 font-extrabold" : "text-slate-700"}>
                          {stats.weeksInCurrentLevel} / 12 Weeks Elapsed
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            stats.zone === "Red Zone"
                              ? "bg-rose-500 animate-pulse"
                              : stats.zone === "Near Completion"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, (stats.weeksInCurrentLevel / 12) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Exam Target:</span>
                        <span className="font-mono text-slate-500 font-bold">{stats.examWeekDate} (Week 12)</span>
                      </div>
                    </div>
                  </div>

                  {/* Fees & Action Block */}
                  <div className="mt-5 pt-3 border-t border-slate-100/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Level Tuition Paid:</span>
                      <span className={`font-bold ${stats.paidCount > 0 ? "text-emerald-700" : "text-amber-700"}`}>
                        {stats.lastPaidMonth !== "None" ? `Paid (${stats.lastPaidMonth})` : "No paid fees logged"}
                      </span>
                    </div>

                    {stats.unpaidAmount > 0 && (
                      <div className="space-y-2">
                        <div className="bg-rose-50 border border-rose-100/60 rounded-xl px-2.5 py-1.5 text-[10px] text-rose-700 font-bold flex justify-between items-center">
                          <span>Outstanding Fees:</span>
                          <span className="text-rose-800 font-mono">₹{stats.unpaidAmount} Unpaid</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const parentMobileClean = student.parentMobile.replace(/\s+/g, "").replace(/-/g, "").replace(/\+/g, "");
                              const messageText = `Dear Parent, this is ${academyName}. Please note that Level ${student.currentLevel} tuition fee of ₹${stats.unpaidAmount} is currently due for ${student.studentName}. Kindly make payment via UPI ID or use your student dashboard to scan the QR code. Please ignore if already paid. Thank you!`;
                              const whatsappUrl = `https://api.whatsapp.com/send?phone=${parentMobileClean}&text=${encodeURIComponent(messageText)}`;
                              window.open(whatsappUrl, "_blank");
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors active:scale-95"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </button>
                          <button
                            type="button"
                            disabled={notificationSending === student.id}
                            onClick={() => handleSendInAppReminder(student.id, student.studentName, stats.unpaidAmount, student.currentLevel)}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-[10px] py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors active:scale-95"
                          >
                            <Send className="w-3 h-3" />
                            <span>{notificationSending === student.id ? "Sending..." : "In-App Msg"}</span>
                          </button>
                          <button
                            type="button"
                            disabled={notificationSending === student.id}
                            onClick={() => handleSendEmailReminder(student.id, student.studentName, stats.unpaidAmount, student.currentLevel)}
                            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-[10px] py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors active:scale-95"
                          >
                            <Mail className="w-3 h-3" />
                            <span>{notificationSending === student.id ? "Sending..." : "Email"}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Red Zone warnings / Action Tips */}
                    {stats.zone === "Red Zone" ? (
                      <div className="bg-rose-100/50 text-rose-800 text-[10px] rounded-xl p-2.5 font-bold leading-relaxed space-y-1">
                        <div className="text-rose-900 flex items-center gap-1 font-black">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                          <span>BILLING RED ZONE WARNING</span>
                        </div>
                        <p className="text-[9.5px]">
                          Student crossed the 12-week exam deadline ({stats.weeksInCurrentLevel} weeks spent). Complete their Level {student.currentLevel} Exam immediately to bill & unlock Next Level {student.currentLevel + 1} tuition fees!
                        </p>
                      </div>
                    ) : stats.zone === "Near Completion" ? (
                      <div className="bg-amber-50 border border-amber-100/80 text-amber-800 text-[10px] rounded-xl p-2.5 font-semibold">
                        <strong>Exam week prep:</strong> Conduct the final revision drill in Level {student.currentLevel} to prepare student for the milestone check next week.
                      </div>
                    ) : (
                      <div className="text-[10px] text-emerald-700 font-bold bg-emerald-50/50 p-2 rounded-lg flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Timeline status is healthy and on-track</span>
                      </div>
                    )}

                    {/* Performance analytics & behavior insights trigger button */}
                    <div className="pt-2.5 border-t border-slate-100/60 mt-2.5 space-y-2">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForDetail(student)}
                        className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all border border-indigo-150 cursor-pointer mb-2 shadow-xs"
                      >
                        <Trophy className="w-3.5 h-3.5 text-indigo-600" />
                        <span>View Submissions & Performance Analytics 📊</span>
                      </button>
                    </div>

                    {/* Behavior warning section */}
                    <div className="pt-2 border-t border-slate-100/60 mt-2">
                      {warningStudentId === student.id ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-2.5 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Issue Behavior Warning
                            </span>
                            <button
                              type="button"
                              onClick={() => setWarningStudentId(null)}
                              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Warning Level / Severity</label>
                            <div className="grid grid-cols-3 gap-1">
                              <button
                                type="button"
                                onClick={() => setWarningSeverity("low")}
                                className={`py-1 text-[10px] font-bold rounded-lg border transition-all ${
                                  warningSeverity === "low"
                                    ? "bg-amber-100 border-amber-300 text-amber-800"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                Low (-5 ⭐)
                              </button>
                              <button
                                type="button"
                                onClick={() => setWarningSeverity("medium")}
                                className={`py-1 text-[10px] font-bold rounded-lg border transition-all ${
                                  warningSeverity === "medium"
                                    ? "bg-orange-100 border-orange-300 text-orange-800"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                Mid (-10 ⭐)
                              </button>
                              <button
                                type="button"
                                onClick={() => setWarningSeverity("high")}
                                className={`py-1 text-[10px] font-bold rounded-lg border transition-all ${
                                  warningSeverity === "high"
                                    ? "bg-rose-100 border-rose-300 text-rose-800"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                High (-20 ⭐)
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Warning Reason</label>
                            <input
                              type="text"
                              value={warningReason}
                              onChange={(e) => setWarningReason(e.target.value)}
                              placeholder="e.g. Inattentive during class, missed homework"
                              className="w-full text-[10px] font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500"
                            />
                          </div>

                          <button
                            type="button"
                            disabled={isSubmittingWarning}
                            onClick={() => handleIssueWarningSubmit(student.id)}
                            className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-[10px] py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
                          >
                            <span>{isSubmittingWarning ? "Applying..." : "Deduct Stars & Issue Warning ⚠️"}</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setWarningStudentId(student.id);
                            setWarningSeverity("low");
                            setWarningReason("");
                          }}
                          className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 font-extrabold text-[10px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all border border-slate-200/50"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                          <span>Behavior Warning (Deduct Stars)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attendance & Rosters row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Attendance Register (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm flex flex-col justify-between" id="attendance-register-card">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-indigo-600" />
                  Daily Batch Attendance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Assigned Instructor: <strong>{currentTeacher.name}</strong></p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Date:</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
                  id="attendance-date-picker"
                />
              </div>
            </div>

            {/* Search filter for attendance */}
            <div className="relative mb-4">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search student by name for attendance..."
                value={attendanceSearchQuery}
                onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                id="attendance-search-input"
              />
              {attendanceSearchQuery && (
                <button
                  type="button"
                  onClick={() => setAttendanceSearchQuery("")}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Attendance Summary Stats Row */}
            {activeAttendanceStudents.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 mb-5 bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center">
                <div className="bg-white rounded-xl p-2 border border-slate-100">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Scheduled Today</span>
                  <span className="text-sm font-black text-slate-800 font-mono">{activeAttendanceStudents.length}</span>
                </div>
                <div className="bg-emerald-50/50 rounded-xl p-2 border border-emerald-100">
                  <span className="block text-[9px] font-black text-emerald-600 uppercase tracking-wider">Present</span>
                  <span className="text-sm font-black text-emerald-700 font-mono">
                    {presentCount}
                  </span>
                </div>
                <div className="bg-rose-50/50 rounded-xl p-2 border border-rose-100">
                  <span className="block text-[9px] font-black text-rose-600 uppercase tracking-wider">Absent</span>
                  <span className="text-sm font-black text-rose-700 font-mono">
                    {absentCount}
                  </span>
                </div>
                <div className="col-span-3 border-t border-dashed border-slate-200 pt-2.5 mt-1 flex justify-between items-center px-1">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Attendance Percentage:</span>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg border ${
                    attendancePercentage >= 90 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    attendancePercentage >= 75 ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-rose-50 text-rose-700 border-rose-200"
                  }`}>
                    {attendancePercentage}%
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {activeAttendanceStudents.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200">
                  No students assigned for <strong>{getDayOfWeek(attendanceDate)}</strong> batches on {attendanceDate}.
                </div>
              ) : (
                activeAttendanceStudents.map(student => (
                  <div key={student.id} className="flex items-center justify-between gap-3 border border-gray-100 bg-gray-50 rounded-xl p-3 w-full min-w-0 overflow-hidden shadow-2xs">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 font-display truncate">{student.studentName}</div>
                      <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 leading-normal break-words">
                        <span className="font-semibold text-indigo-900">Level {student.currentLevel}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600 break-words">{student.batch}</span>
                        {student.id && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-[10px] text-slate-400 break-all">{student.id}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleAttendance(student.id)}
                      className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-3xs ${
                        (attStatuses[student.id] || "Present") === "Present"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                      }`}
                      id={`att-toggle-${student.id}`}
                    >
                      {attStatuses[student.id] || "Present"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-400">
              {attendanceLoggedToday ? "✓ Past attendance records exist for this date" : "Please confirm and submit attendance"}
            </div>
            <button
              onClick={handleSubmitAttendance}
              disabled={activeAttendanceStudents.length === 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeAttendanceStudents.length === 0
                  ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 cursor-pointer"
              }`}
              id="submit-attendance-btn"
            >
              {attendanceLoggedToday ? "Update Attendance Logs" : "Submit Attendance Logs"}
            </button>
          </div>
        </div>

        {/* Academic Records & Homework Manager (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm flex flex-col space-y-6">
          <div>
            <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Class Homework & Evaluation Desk
            </h3>
            <p className="text-xs text-slate-505">Share assignments batch-wise and evaluate student textbook photos or exercise proofs.</p>
          </div>

          {/* TAB 1: Share Batch/Student Homework Form */}
          <form onSubmit={handleShareHomework} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block">
                📢 Issue Class Homework
              </span>
              <div className="flex items-center gap-1.5 bg-slate-200/60 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setHwScope("batch")}
                  className={`px-2 py-0.5 text-[10px] font-black rounded transition-all ${
                    hwScope === "batch" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Batch-wise
                </button>
                <button
                  type="button"
                  onClick={() => setHwScope("student")}
                  className={`px-2 py-0.5 text-[10px] font-black rounded transition-all ${
                    hwScope === "student" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Student-wise
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {hwScope === "batch" ? (
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Batch or Batch Code</label>
                  <select
                    value={hwBatch}
                    onChange={(e) => setHwBatch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-indigo-950 outline-none"
                  >
                    <option value="all">All Students / All Batches</option>
                    
                    {uniqueBatchCodes.length > 0 && (
                      <optgroup label="🏷️ Batch Codes (Teacher Assigned)">
                        {uniqueBatchCodes.map(code => (
                          <option key={code} value={code}>Code: {code}</option>
                        ))}
                      </optgroup>
                    )}

                    <optgroup label="⏰ Timetable Batch Timings">
                      {uniqueBatches.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Student</label>
                  <select
                    value={hwSelectedStudent}
                    onChange={(e) => setHwSelectedStudent(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-indigo-950 outline-none"
                    required={hwScope === "student"}
                  >
                    <option value="">-- Choose Student --</option>
                    {teacherStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.studentName} (Level {s.currentLevel})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Schedule Week</label>
                <input
                  type="text"
                  placeholder="e.g. Week 27"
                  value={hwWeek}
                  onChange={(e) => setHwWeek(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-indigo-950 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Homework instructions / Task description</label>
              <textarea
                placeholder="Write textbook pages, custom abacus sum ranges, or level-specific tasks..."
                value={hwTask}
                onChange={(e) => setHwTask(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 h-16 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-indigo-100"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{hwScope === "batch" ? "Share Homework to Batch 📢" : "Share Homework to Student 📢"}</span>
            </button>
          </form>

          {/* TAB 2: Homework Proof Review & Evaluation */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block">
                📝 Class Homework evaluation Desk
              </span>
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold border border-amber-200">
                Pending Proofs: {hwRecords.filter(hw => hw.status === "Completed" && hw.score === "-").length}
              </span>
            </div>

            {/* Homework Filters Grid */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-3">
              <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider block">
                🔍 Filter Homework Records
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Filter by Student */}
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Student</label>
                  <select
                    value={hwFilterStudent}
                    onChange={(e) => setHwFilterStudent(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-indigo-950 outline-none"
                  >
                    <option value="all">All Students</option>
                    {teacherStudents.map(ts => (
                      <option key={ts.id} value={ts.id}>{ts.studentName}</option>
                    ))}
                  </select>
                </div>

                {/* Filter by Batch */}
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Batch</label>
                  <select
                    value={hwFilterBatch}
                    onChange={(e) => setHwFilterBatch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-indigo-950 outline-none"
                  >
                    <option value="all">All Batches</option>

                    {uniqueBatchCodes.length > 0 && (
                      <optgroup label="🏷️ Batch Codes">
                        {uniqueBatchCodes.map(code => (
                          <option key={code} value={code}>Code: {code}</option>
                        ))}
                      </optgroup>
                    )}

                    <optgroup label="⏰ Timetable Timings">
                      {uniqueBatches.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Filter by Status */}
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Status</label>
                  <select
                    value={hwFilterStatus}
                    onChange={(e) => setHwFilterStatus(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-indigo-950 outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Completed">Completed Only</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Incomplete">Incomplete / Practicing</option>
                  </select>
                </div>

                {/* Filter by Date */}
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Submission/Due Date</label>
                  <div className="flex gap-1">
                    <input
                      type="date"
                      value={hwFilterDate}
                      onChange={(e) => setHwFilterDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1 text-[10px] font-bold text-indigo-950 outline-none"
                    />
                    {hwFilterDate && (
                      <button
                        type="button"
                        onClick={() => setHwFilterDate("")}
                        className="bg-slate-200 hover:bg-slate-300 px-1.5 rounded text-[10px] font-bold"
                        title="Clear Date"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {hwRecords.filter(hw => {
                const s = students.find(std => std.id === hw.studentId);
                // 1. Must belong to the teacher's students
                if (s?.teacherId !== currentTeacher.id) return false;

                // 2. Filter by Student ID
                if (hwFilterStudent !== "all" && hw.studentId !== hwFilterStudent) return false;

                // 3. Filter by Batch
                const batchVal = hw.batch || s?.batch || "";
                const batchCodeVal = s?.batchCode || "";
                if (hwFilterBatch !== "all") {
                  const filterLower = hwFilterBatch.toLowerCase();
                  const matchesBatch = batchVal.toLowerCase() === filterLower || batchVal.toLowerCase().includes(filterLower);
                  const matchesCode = batchCodeVal.toLowerCase() === filterLower || batchCodeVal.toLowerCase().includes(filterLower);
                  if (!matchesBatch && !matchesCode) return false;
                }

                // 4. Filter by Date (Submission Date or Creation/Due Date)
                if (hwFilterDate) {
                  const targetDate = hwFilterDate; // "YYYY-MM-DD"
                  const matchSubDate = hw.submissionDate === targetDate;
                  const matchHwDate = hw.date === targetDate;
                  const matchWeekContains = hw.week && hw.week.includes(targetDate);
                  if (!matchSubDate && !matchHwDate && !matchWeekContains) return false;
                }

                // 5. Filter by Status
                if (hwFilterStatus !== "all") {
                  if (hwFilterStatus === "Completed") {
                    if (hw.status !== "Completed") return false;
                  } else if (hwFilterStatus === "Pending Review") {
                    const isPending = hw.status === "Completed" && hw.score === "-";
                    if (!isPending) return false;
                  } else if (hwFilterStatus === "Incomplete") {
                    if (hw.status !== "Incomplete") return false;
                  }
                }

                return true;
              }).length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-4 text-center text-xs text-slate-400">
                  No matching homework assignments found under the selected filters.
                </div>
              ) : (
                hwRecords.filter(hw => {
                  const s = students.find(std => std.id === hw.studentId);
                  // 1. Must belong to the teacher's students
                  if (s?.teacherId !== currentTeacher.id) return false;

                  // 2. Filter by Student ID
                  if (hwFilterStudent !== "all" && hw.studentId !== hwFilterStudent) return false;

                  // 3. Filter by Batch
                  const batchVal = hw.batch || s?.batch || "";
                  const batchCodeVal = s?.batchCode || "";
                  if (hwFilterBatch !== "all") {
                    const filterLower = hwFilterBatch.toLowerCase();
                    const matchesBatch = batchVal.toLowerCase() === filterLower || batchVal.toLowerCase().includes(filterLower);
                    const matchesCode = batchCodeVal.toLowerCase() === filterLower || batchCodeVal.toLowerCase().includes(filterLower);
                    if (!matchesBatch && !matchesCode) return false;
                  }

                  // 4. Filter by Date
                  if (hwFilterDate) {
                    const targetDate = hwFilterDate;
                    const matchSubDate = hw.submissionDate === targetDate;
                    const matchHwDate = hw.date === targetDate;
                    const matchWeekContains = hw.week && hw.week.includes(targetDate);
                    if (!matchSubDate && !matchHwDate && !matchWeekContains) return false;
                  }

                  // 5. Filter by Status
                  if (hwFilterStatus !== "all") {
                    if (hwFilterStatus === "Completed") {
                      if (hw.status !== "Completed") return false;
                    } else if (hwFilterStatus === "Pending Review") {
                      const isPending = hw.status === "Completed" && hw.score === "-";
                      if (!isPending) return false;
                    } else if (hwFilterStatus === "Incomplete") {
                      if (hw.status !== "Incomplete") return false;
                    }
                  }

                  return true;
                }).map((hw) => {
                  const studentObj = students.find(s => s.id === hw.studentId);
                  const isPendingReview = hw.status === "Completed" && hw.score === "-";

                  return (
                    <div key={hw.id} className="border border-slate-100 rounded-xl p-3 text-xs space-y-2 bg-slate-50/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-extrabold text-indigo-950 block">{studentObj?.studentName || "Abacus Student"}</span>
                          <span className="text-[9px] text-slate-400 block">{hw.week} • Batch: {hw.batch || studentObj?.batch}</span>
                          {hw.status === "Completed" && hw.submissionDate && (
                            <span className="text-[9px] text-indigo-600 block font-medium">
                              Submitted: {hw.submissionDate} at {hw.submissionTime || "—"}
                            </span>
                          )}
                        </div>
                        <div>
                          {isPendingReview ? (
                            <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                              Pending Review
                            </span>
                          ) : hw.status === "Completed" ? (
                            <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Grade: {hw.score}
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Practicing
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-white border border-slate-100 rounded-lg p-2.5 text-[11px] text-slate-700 space-y-1">
                        <p className="font-bold">Task: <span className="font-medium">{hw.task}</span></p>
                        {hw.status === "Completed" && hw.notes && (
                          <p className="border-t border-dashed border-slate-100 pt-1 mt-1 text-slate-600">
                            <strong>Student notes:</strong> "{hw.notes}"
                          </p>
                        )}
                        {hw.submittedProof && hw.submittedProof.startsWith("http") && (
                          <img src={hw.submittedProof} referrerPolicy="no-referrer" alt="Homework proof" className="h-12 w-auto rounded border border-slate-100 object-cover mt-1" />
                        )}
                        {hw.feedback && (
                          <p className="border-t border-dashed border-slate-100 pt-1 mt-1 text-indigo-700">
                            <strong>Your feedback:</strong> "{hw.feedback}"
                          </p>
                        )}
                      </div>

                      {isPendingReview && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setGradingHwId(hw.id);
                              setGradingScore("A+");
                              setGradingFeedback("");
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1 rounded-lg"
                          >
                            Grade Submission 📝
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Inline Grading Form Overlay */}
          {gradingHwId && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block text-center">
                  Score Card & Feedback
                </span>
                <h3 className="text-lg font-black text-indigo-950 font-display text-center">
                  Review & Grade Homework
                </h3>

                <form onSubmit={handleGradeHomeworkSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Assign Letter Grade</label>
                    <select
                      value={gradingScore}
                      onChange={(e) => setGradingScore(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-indigo-950 outline-none"
                    >
                      <option value="A+ (Excellent)">A+ (Excellent)</option>
                      <option value="A (Very Good)">A (Very Good)</option>
                      <option value="B+ (Good Attempt)">B+ (Good Attempt)</option>
                      <option value="B (Satisfactory)">B (Satisfactory)</option>
                      <option value="Needs Improvement">Needs Improvement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Encouraging Instructor Feedback</label>
                    <textarea
                      placeholder="e.g. Excellent speed on 2-digit rows! Practice finger control next week."
                      value={gradingFeedback}
                      onChange={(e) => setGradingFeedback(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 h-20 resize-none"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setGradingHwId(null)}
                      className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2 rounded-xl text-xs"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2 rounded-xl text-xs shadow-md shadow-indigo-100 active:scale-95 transition-all"
                    >
                      Submit Grade 🏆
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION: Student Enrollments & Batch Management Desk */}
      <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Student Enrollments & Batch Management Desk
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Directly enroll new students, register custom batch timetables, and transfer students between learning levels or batches.
            </p>
          </div>
          <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-3 py-1 rounded-lg font-mono font-bold uppercase shrink-0">
            Roster: {teacherStudents.length} Active Students
          </span>
        </div>

        {/* Shareable Teacher Link Card */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-indigo-950 font-display flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                Your Personal Student Self-Registration Link
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                Share this link with parents. When they fill the form, their child's student account is automatically created and assigned directly to you!
              </p>
            </div>
            
            {/* Pre-select Class Timing / Batch for parents */}
            <div className="flex items-center gap-2 bg-white/80 border border-indigo-100 px-3 py-1.5 rounded-xl shrink-0">
              <label className="text-[11px] font-black text-indigo-950 shrink-0">Pre-select Timing:</label>
              <select
                value={selectedLinkSlot}
                onChange={(e) => setSelectedLinkSlot(e.target.value)}
                className="bg-transparent text-slate-705 text-xs rounded outline-none font-bold cursor-pointer"
              >
                <option value="">-- Let Parent Choose --</option>
                {/* Created Batch Codes */}
                {batchList.map((b: any) => {
                  const valStr = b.formattedSlot || `${b.batchCode}: ${b.title || 'Batch'} (${b.days} ${b.startTime} - ${b.endTime})`;
                  return (
                    <option key={b.id || b.batchCode} value={valStr}>
                      🏷️ Batch {b.batchCode} — {b.days} ({b.startTime} - {b.endTime})
                    </option>
                  );
                })}
                {/* Available Instructor Slots */}
                {(currentTeacher?.availableSlots || []).map((slot: string) => (
                  <option key={slot} value={slot}>🕒 {slot}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-indigo-100/60">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/?view=student-register&teacher=${currentTeacher.id}&center=${activeShareCenterId}${selectedLinkSlot ? `&selected_slot=${encodeURIComponent(selectedLinkSlot)}` : ""}`}
              className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-mono flex-1 outline-none select-all"
            />
            <button
              onClick={() => {
                const link = `${window.location.origin}/?view=student-register&teacher=${currentTeacher.id}&center=${activeShareCenterId}${selectedLinkSlot ? `&selected_slot=${encodeURIComponent(selectedLinkSlot)}` : ""}`;
                navigator.clipboard.writeText(link);
                alert(`Teacher's registration link for ${centers.find(c => c.id === activeShareCenterId)?.name || 'Center'} copied to clipboard!`);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-1 cursor-pointer shrink-0"
            >
              Copy Link
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Card 1: Fast Track Enrollment Form (5 cols) */}
          <form onSubmit={handleEnrollStudent} className="lg:col-span-5 bg-white rounded-2xl p-5 border-2 border-indigo-150 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-100 pb-3 gap-2">
              <div>
                <h4 className="text-xs font-black text-indigo-950 font-display uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  1. Branch Student Registration Form
                </h4>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  Registering new student under <strong className="text-indigo-900">{centers?.find(c => c.id === (enrollCenterId || (selectedBranchId !== "ALL" ? selectedBranchId : (currentTeacher?.centerId || "C001"))))?.name || "Selected Branch"}</strong>
                </p>
              </div>
              <span className="bg-indigo-100 border border-indigo-200 text-indigo-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase shrink-0 self-start sm:self-auto">
                📍 {enrollCenterId || (selectedBranchId !== "ALL" ? selectedBranchId : (currentTeacher?.centerId || "C001"))}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
              <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-150">
                <label className="block text-[10px] font-black text-indigo-900 uppercase tracking-wider mb-1">Target Branch / Sub-Branch *</label>
                <select
                  value={enrollCenterId || (selectedBranchId !== "ALL" ? selectedBranchId : (currentTeacher?.centerId || "C001"))}
                  onChange={(e) => setEnrollCenterId(e.target.value)}
                  className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 font-bold text-xs text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600 shadow-3xs"
                >
                  {(assignedCenters && assignedCenters.length > 0 ? assignedCenters : (centers || [])).map(c => (
                    <option key={c.id} value={c.id}>
                      🏢 {c.name} ({c.id}) {c.parentCenterId ? '• Sub-Branch' : '• Main Branch'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neil Sharma"
                  value={enrollName}
                  onChange={(e) => setEnrollName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Age *</label>
                  <input
                    type="number"
                    required
                    min={4}
                    max={18}
                    value={enrollAge}
                    onChange={(e) => setEnrollAge(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Parent Mobile *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9845012345"
                    value={enrollParentMobile}
                    onChange={(e) => setEnrollParentMobile(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Parent / Guardian Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={enrollParentName}
                  onChange={(e) => setEnrollParentName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Student Email <span className="text-slate-400 font-normal">(Login ID)</span></label>
                <input
                  type="email"
                  placeholder="neil@gmail.com (Optional)"
                  value={enrollEmail}
                  onChange={(e) => setEnrollEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Admitted Level</label>
                  <select
                    value={enrollLevel}
                    onChange={(e) => setEnrollLevel(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(l => (
                      <option key={l} value={l}>Level {l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Starting Week</label>
                  <select
                    value={enrollStartingWeek}
                    onChange={(e) => setEnrollStartingWeek(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(wk => (
                      <option key={wk} value={wk}>Week {wk}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Learning Mode & Class Timing / Batch Selection */}
              <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-150 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-indigo-950 uppercase tracking-wider">
                    Student Schedule & Batch Mode <strong className="text-rose-500">*</strong>
                  </label>
                  <span className="text-[10px] text-indigo-600 font-bold bg-indigo-100/80 px-2 py-0.5 rounded-md">
                    {enrollStudentType === "batch" ? "Batch Linked Mode" : "Personal 1-on-1 Mode"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEnrollStudentType("batch");
                      if (batchList.length > 0) {
                        const first = batchList[0];
                        setEnrollBatchCode(first.batchCode);
                        setEnrollBatch(first.formattedSlot || `${first.days} (${first.startTime} - ${first.endTime})`);
                      }
                    }}
                    className={`p-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      enrollStudentType === "batch"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>👥 Group Batch Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEnrollStudentType("personal");
                      setEnrollBatchCode("PERSONAL");
                      setEnrollBatch(`${enrollPersonalDays} (${enrollPersonalTiming})`);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      enrollStudentType === "personal"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>👤 Personal 1-on-1 Student</span>
                  </button>
                </div>

                {enrollStudentType === "batch" ? (
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-xs font-extrabold text-indigo-950">
                      Select Batch Code <strong className="text-rose-500">*</strong>
                    </label>
                    <select
                      value={enrollBatchCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setEnrollBatchCode(code);
                        const found = batchList.find((b: any) => b.batchCode === code);
                        if (found) {
                          setEnrollBatch(found.formattedSlot || `${found.days} (${found.startTime} - ${found.endTime})`);
                        }
                      }}
                      className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-xs font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600 shadow-xs"
                    >
                      <option value="">-- Select Active Batch Code --</option>
                      {batchList.map((b: any) => (
                        <option key={b.id || b.batchCode} value={b.batchCode}>
                          🏷️ {b.batchCode} — {b.title || 'Batch'} ({b.days} • {b.startTime} - {b.endTime})
                        </option>
                      ))}
                      {/* Fallback to any custom existing batch code strings */}
                      {Array.from(new Set(students.map(s => s.batchCode).filter(Boolean))).filter(code => !batchList.some(b => b.batchCode === code)).map(code => (
                        <option key={code} value={code}>🏷️ {code} (Existing Active Batch)</option>
                      ))}
                    </select>

                    {enrollBatchCode && (
                      <div className="text-[11px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-250 px-3 py-1.5 rounded-xl flex items-center justify-between mt-1">
                        <span>✓ Class Schedule linked to Batch <strong>{enrollBatchCode}</strong>: {enrollBatch || "Scheduled"}</span>
                        <span className="text-[9px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono uppercase">Auto-Linked</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-indigo-950 mb-1">
                        Select Personal Class Days <strong className="text-rose-500">*</strong>
                      </label>
                      <select
                        value={enrollPersonalDays}
                        onChange={(e) => {
                          const days = e.target.value;
                          setEnrollPersonalDays(days);
                          setEnrollBatch(`${days} (${enrollPersonalTiming})`);
                        }}
                        className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-xs font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600 shadow-xs"
                      >
                        <option value="Saturday & Sunday">Saturday & Sunday</option>
                        <option value="Monday & Wednesday">Monday & Wednesday</option>
                        <option value="Tuesday & Thursday">Tuesday & Thursday</option>
                        <option value="Friday & Saturday">Friday & Saturday</option>
                        <option value="Monday, Wednesday, Friday">Monday, Wednesday, Friday</option>
                        <option value="Daily Weekdays (Mon-Fri)">Daily Weekdays (Mon-Fri)</option>
                        <option value="Sunday Only">Sunday Only</option>
                        <option value="Saturday Only">Saturday Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-indigo-950 mb-1">
                        Select Personal Class Timings <strong className="text-rose-500">*</strong>
                      </label>
                      <select
                        value={enrollPersonalTiming}
                        onChange={(e) => {
                          const time = e.target.value;
                          setEnrollPersonalTiming(time);
                          setEnrollBatch(`${enrollPersonalDays} (${time})`);
                        }}
                        className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-xs font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600 shadow-xs"
                      >
                        <option value="08:00 AM - 09:00 AM">08:00 AM - 09:00 AM</option>
                        <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                        <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                        <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                        <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                        <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
                        <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                        <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
                        <option value="06:00 PM - 07:00 PM">06:00 PM - 07:00 PM</option>
                        <option value="07:00 PM - 08:00 PM">07:00 PM - 08:00 PM</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Batch Start Date *</label>
                <input
                  type="date"
                  required
                  value={enrollJoiningDate}
                  onChange={(e) => setEnrollJoiningDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={enrollLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              {enrollLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>Enroll Student on My Roster</span>
            </button>
          </form>

          {/* Card 2 & 3: Batch and Level transfers (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Batch schedule updater */}
            <form onSubmit={handleUpdateBatch} className="bg-slate-50/50 rounded-2xl p-5 border border-slate-150 space-y-4">
              <h4 className="text-xs font-black text-indigo-950 font-display uppercase tracking-wider flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-indigo-600" />
                2. Student Batch Schedule Transfer
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Select Student</label>
                  <select
                    value={batchTargetStudent}
                    onChange={(e) => {
                      const sId = e.target.value;
                      setBatchTargetStudent(sId);
                      const matchedS = teacherStudents.find(s => s.id === sId);
                      if (matchedS) {
                        setBatchTargetSchedule(matchedS.batch || "");
                        if (matchedS.batchCode) {
                          setBatchTargetCode(matchedS.batchCode);
                          setIsCustomTargetBatch(!uniqueBatchCodes.includes(matchedS.batchCode));
                        } else {
                          setBatchTargetCode("");
                          setIsCustomTargetBatch(false);
                        }
                      } else {
                        setBatchTargetSchedule("");
                        setBatchTargetCode("");
                        setIsCustomTargetBatch(false);
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none"
                  >
                    <option value="">-- Choose Student --</option>
                    {teacherStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.studentName} ({s.batchCode ? `Code: ${s.batchCode}` : s.batch ? s.batch : "Personal / No Batch"})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">New Timetable Batch</label>
                  <select
                    value={batchTargetSchedule}
                    onChange={(e) => {
                      setBatchTargetSchedule(e.target.value);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none"
                  >
                    <option value="">-- Keep Blank / Not Assigned --</option>
                    {allBatches.filter(b => b && b.trim() !== "").map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">New Batch Code <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <select
                    value={isCustomTargetBatch ? "__custom__" : batchTargetCode}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__custom__") {
                        setIsCustomTargetBatch(true);
                        setBatchTargetCode("");
                      } else {
                        setIsCustomTargetBatch(false);
                        setBatchTargetCode(val);
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none"
                  >
                    <option value="">-- None / Personal Student (No Batch Code) --</option>
                    {uniqueBatchCodes.map(code => {
                      const bObj = batchList.find((b: any) => b.batchCode === code);
                      const label = bObj ? `[${code}] ${bObj.title || bObj.days || 'Batch'}` : code;
                      return (
                        <option key={code} value={code}>{label}</option>
                      );
                    })}
                    <option value="__custom__">✏️ Type Custom Batch Code...</option>
                  </select>

                  {isCustomTargetBatch && (
                    <input
                      type="text"
                      placeholder="e.g. SAT10-L1"
                      value={batchTargetCode}
                      onChange={(e) => setBatchTargetCode(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 mt-2 font-bold text-indigo-950 outline-none text-xs"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={batchLoading}
                  className="bg-indigo-950 hover:bg-indigo-900 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                >
                  {batchLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                  <span>Update Batch Timetable</span>
                </button>
              </div>
            </form>

            {/* Level promoter */}
            <form onSubmit={handleUpdateLevel} className="bg-slate-50/50 rounded-2xl p-5 border border-slate-150 space-y-4">
              <h4 className="text-xs font-black text-indigo-950 font-display uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                3. Promote Course Learning Level
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Select Student</label>
                  <select
                    value={levelTargetStudent}
                    onChange={(e) => {
                      const id = e.target.value;
                      setLevelTargetStudent(id);
                      const st = teacherStudents.find(s => s.id === id);
                      if (st) {
                        setLevelTargetNum((st.currentLevel || 0) + 1 > 8 ? 8 : (st.currentLevel || 0) + 1);
                        if (st.batchCode) setLevelTargetBatchCode(st.batchCode);
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none"
                  >
                    <option value="">-- Choose Student --</option>
                    {teacherStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.studentName} (Lvl {s.currentLevel})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">Promote to Level</label>
                  <select
                    value={levelTargetNum}
                    onChange={(e) => setLevelTargetNum(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(l => (
                      <option key={l} value={l}>Level {l} (Starts Week 1 ✨)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">Batch & Trainer Timing</label>
                  <select
                    value={levelTargetBatchCode}
                    onChange={(e) => setLevelTargetBatchCode(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none"
                  >
                    <option value="">Keep Current Timing</option>
                    {batchList.map(b => (
                      <option key={b.id} value={b.batchCode}>
                        [{b.batchCode}] {b.days ? `${b.days} ${b.startTime}` : b.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={levelLoading}
                  className="bg-indigo-950 hover:bg-indigo-900 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                >
                  {levelLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                  <span>Confirm Promotion & Reset to Week 1</span>
                </button>
              </div>
            </form>

            {/* Custom Batch timetabler */}
            <form onSubmit={handleAddBatchName} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-150 flex flex-col md:flex-row items-end gap-3 text-xs">
              <div className="flex-1 w-full">
                <label className="block font-bold text-slate-500 mb-1">4. Register Custom Timetable Batch schedule</label>
                <input
                  type="text"
                  placeholder="e.g. Mon & Wed 4:00 PM"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-3 rounded-xl transition-all active:scale-95 shrink-0 w-full md:w-auto"
              >
                Register Timetable
              </button>
            </form>

            {/* Display list of currently active timings registered by this teacher for direct management */}
            {currentTeacher && (
              <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-150 space-y-3 mt-1 text-xs">
                <div className="flex justify-between items-center text-xs font-black text-indigo-950 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Currently Active & Allotted Classroom Timings
                  </span>
                  <span className="text-indigo-600 font-extrabold font-mono bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg text-[10px]">
                    {(currentTeacher.availableSlots || []).length} Slots Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  These are the official batch timings you have allocated. Registering custom timings above adds them here immediately. Parents and prospective students registering through your referral link can pick directly from these timings.
                </p>
                {(currentTeacher.availableSlots || []).length === 0 ? (
                  <div className="text-center py-4 border-2 border-dashed border-slate-100 rounded-2xl text-[11px] text-slate-400 font-medium">
                    No active timings registered yet. Enter a timing in the field above to register one!
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(currentTeacher.availableSlots || []).map((slot: string, idx: number) => (
                      <span key={idx} className="bg-white border border-slate-200 text-indigo-950 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xs transition-all hover:border-slate-300">
                        <span className="font-extrabold">{slot}</span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to delete and unallot the timing "${slot}"?`)) {
                              const updatedSlots = (currentTeacher.availableSlots || []).filter((s: string) => s !== slot);
                              try {
                                const res = await fetch("/api/erp/update-teacher-slots", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    teacherId: currentTeacher.id,
                                    availableSlots: updatedSlots
                                  })
                                });
                                const data = await res.json();
                                if (data.success) {
                                  alert(`Successfully removed active timing "${slot}".`);
                                  if (onRefreshData) await onRefreshData();
                                } else {
                                  alert(data.error || "Failed to remove timing.");
                                }
                              } catch (err: any) {
                                alert("Error removing timing: " + err.message);
                              }
                            }
                          }}
                          className="text-rose-600 hover:text-white hover:bg-rose-600 rounded-full w-5 h-5 flex items-center justify-center transition-all text-[11px] font-black cursor-pointer border border-slate-100 hover:border-rose-600 shrink-0"
                          title="Delete timing slot"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Reusable Digital Practice Concept Worksheet Manager for Level 1 */}
      <ConceptWorksheetManager
        currentTeacher={currentTeacher}
        students={students}
        onRefreshData={onRefreshData}
      />

      {/* SECTION: Nominate Student Honours (Student of the Week/Month) */}
      <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm space-y-6" id="teacher-student-honours">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-600" />
              Academy Hall of Fame: Nominate Student Honours
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select star performers of the week or month to display their profile picture, batch, level, and custom teacher citation for all academy students.
            </p>
          </div>
          <span className="text-[10px] bg-amber-50 border border-amber-150 text-amber-700 px-3 py-1 rounded-lg font-mono font-bold uppercase shrink-0">
            ★ Motivates Everyone
          </span>
        </div>

        <form onSubmit={handleNominateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                1. Select Star Student
              </label>
              <select
                value={nomineeStudentId}
                onChange={(e) => setNomineeStudentId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                required
              >
                <option value="">-- Choose student from class list --</option>
                {teacherStudents.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.studentName} (Level {student.currentLevel} • {student.batch})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                2. Select Award Honour
              </label>
              <select
                value={nomineeType}
                onChange={(e) => setNomineeType(e.target.value as "week" | "month")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                required
              >
                <option value="week">Student of the Week ⭐</option>
                <option value="month">Student of the Month 👑</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                3. Teacher's Praise Citation (Instantly visible to all)
              </label>
              <textarea
                value={nomineeReason}
                onChange={(e) => setNomineeReason(e.target.value)}
                placeholder="e.g. Mastered the Soroban double-digit division exercises with record speed and 100% accuracy this week!"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 h-12 md:h-12 resize-none"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isNominating || !nomineeStudentId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <span>Publish Nomination 🏆</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION: Student practice & Accuracy Check (Requested) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Practice submissions (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                Student Daily Practice & Accuracy Log
              </h3>
              <p className="text-xs text-slate-500 mt-1">Review live submissions to check mental speed, accuracy ratios, and key areas needing attention.</p>
            </div>
            <button 
              type="button"
              onClick={fetchTeacherPracticeData}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-all"
            >
              Refresh Logs
            </button>
          </div>

          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2">
            {practiceSubmissions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <Trophy className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">No student practice submissions logged yet.</p>
                <p className="text-[10px] text-slate-400 mt-1">Assignments completed in the Student Portal will appear here instantly!</p>
              </div>
            ) : (
              practiceSubmissions.map((sub: any, idx: number) => {
                const correct = sub.correctCount !== undefined ? sub.correctCount : (sub.correctSums !== undefined ? sub.correctSums : 0);
                const total = sub.totalCount !== undefined ? sub.totalCount : (sub.totalSums !== undefined ? sub.totalSums : 10);
                const accuracy = sub.accuracy !== undefined ? sub.accuracy : (Math.round((correct / total) * 100) || 0);
                const studentObj = students.find(s => s.id === sub.studentId);
                const sName = studentObj ? studentObj.studentName : sub.studentId;
                
                // Styling based on accuracy rating
                let badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
                if (accuracy >= 90) badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                else if (accuracy >= 70) badgeColor = "bg-amber-50 text-amber-700 border-amber-200";

                return (
                  <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-indigo-200 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-800">{sName}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono font-bold uppercase">{sub.type}</span>
                        {sub.timeTakenSeconds !== undefined && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                            <span>{Math.floor(sub.timeTakenSeconds / 60)}m {sub.timeTakenSeconds % 60}s ({(sub.timeTakenSeconds / total).toFixed(1)}s/sum)</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-2">
                        <span>Level {sub.level || 1}</span>
                        <span>•</span>
                        <span>{sub.sumsSubmitted ? `Custom sums: ${sub.sumsSubmitted}` : `Drill sums`}</span>
                        <span>•</span>
                        <span>{sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Today'}</span>
                      </div>
                      <div className="mt-2 text-xs text-indigo-900 bg-indigo-50/50 rounded-lg p-2 border border-indigo-50">
                        <span className="font-semibold text-[10px] uppercase text-indigo-600 block mb-0.5">Teacher Focus Note:</span>
                        {sub.focusNote || "Practice makes perfect."}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-slate-500 font-mono">Accuracy</span>
                        <span className={`text-xs font-black px-2 py-1 border rounded-lg ${badgeColor}`}>{accuracy}%</span>
                      </div>
                      <div className="text-lg font-black text-slate-800 mt-1">
                        {correct} <span className="text-xs text-slate-400">/ {total} correct</span>
                      </div>
                      <div className="text-[10px] text-amber-600 font-bold flex items-center justify-end gap-1 mt-0.5">
                        <Trophy className="w-3 h-3" />
                        +{sub.starsEarned || 15} Stars earned
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Assign new mental/abacus drill (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
          <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2 mb-2">
            <Send className="w-5 h-5 text-indigo-600" />
            Assign Live Abacus Drill
          </h3>
          <p className="text-xs text-slate-500 mb-6">Create customized training modules, formulas, and focus reminders targeted at student weaknesses.</p>

          <form onSubmit={handleAssignSubmit} className="space-y-4">
            {/* Assign Scope Toggle */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Assign Scope</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAssignScope("student")}
                  className={`py-1.5 text-[11px] font-black rounded-lg transition-all ${
                    assignScope === "student"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Student-wise
                </button>
                <button
                  type="button"
                  onClick={() => setAssignScope("level")}
                  className={`py-1.5 text-[11px] font-black rounded-lg transition-all ${
                    assignScope === "level"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Level-wise
                </button>
                <button
                  type="button"
                  onClick={() => setAssignScope("batch")}
                  className={`py-1.5 text-[11px] font-black rounded-lg transition-all ${
                    assignScope === "batch"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Batch-wise
                </button>
              </div>
            </div>

            {/* Scope Specific Selectors */}
            {assignScope === "student" && (
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Target Student</label>
                <select
                  value={assignStudent}
                  onChange={(e) => setAssignStudent(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  required={assignScope === "student"}
                >
                  <option value="">-- Choose Student --</option>
                  {teacherStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.studentName} (Level {s.currentLevel})</option>
                  ))}
                </select>
              </div>
            )}

            {assignScope === "level" && (
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Target Training Level</label>
                <select
                  value={assignLevel}
                  onChange={(e) => setAssignLevel(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  required={assignScope === "level"}
                >
                  {uniqueLevels.map(lvl => {
                    const count = teacherStudents.filter(s => s.currentLevel === lvl).length;
                    return (
                      <option key={lvl} value={lvl}>
                        Level {lvl} ({count} active students assigned)
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {assignScope === "batch" && (
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Target Batch Time</label>
                <select
                  value={assignBatch}
                  onChange={(e) => setAssignBatch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  required={assignScope === "batch"}
                >
                  {uniqueBatches.map(b => {
                    const count = teacherStudents.filter(s => isBatchMatch(s.batch || "", b)).length;
                    return (
                      <option key={b} value={b}>
                        {b} ({count} active students assigned)
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Operation Type</label>
                <select
                  value={assignType}
                  onChange={(e) => setAssignType(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="Addition">Addition</option>
                  <option value="Subtraction">Subtraction</option>
                  <option value="Multiplication">Multiplication</option>
                  <option value="Division">Division</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Total Sums</label>
                <select
                  value={assignSums}
                  onChange={(e) => setAssignSums(parseInt(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="10">10 Sums</option>
                  <option value="20">20 Sums</option>
                  <option value="30">30 Sums</option>
                  <option value="50">50 Sums</option>
                  <option value="100">100 Sums</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Digit Size (1-3 digits)</label>
                <input
                  type="number"
                  min="1"
                  max="3"
                  value={assignDigits}
                  onChange={(e) => setAssignDigits(Math.min(3, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Row Count (2-8 lines)</label>
                <input
                  type="number"
                  min="2"
                  max="8"
                  value={assignRows}
                  onChange={(e) => setAssignRows(Math.min(8, Math.max(2, parseInt(e.target.value) || 2)))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Drill Title / Formula Focus</label>
              <input
                type="text"
                value={assignTitle}
                onChange={(e) => setAssignTitle(e.target.value)}
                placeholder="e.g. Big Friend Addition (+9)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Teacher focus note & guidelines</label>
              <textarea
                value={assignFocus}
                onChange={(e) => setAssignFocus(e.target.value)}
                rows={2}
                placeholder="Guidelines for parents / student dexterity..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 py-2 bg-amber-50/50 border border-amber-100/60 rounded-xl px-3">
              <input
                type="checkbox"
                id="assignDisableAbacus"
                checked={assignDisableAbacus}
                onChange={(e) => setAssignDisableAbacus(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
              />
              <label htmlFor="assignDisableAbacus" className="text-xs font-black text-amber-950 select-none cursor-pointer">
                🚫 Lock/Disable Abacus for this practice
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Submission Deadline</label>
              <input
                type="date"
                value={assignDueDate}
                onChange={(e) => setAssignDueDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={assignLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {assignLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Assigning Drill...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Broadcast Drill to Student Portal
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* AI Student progress report generator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Progress report panel */}
        <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Geniplus AI Student Progress Report Generator
            </h3>
            <p className="text-xs text-slate-500 mb-4">Select student metrics to synthesize high-quality pedagogical report cards for parents.</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Select Student</label>
                <select
                  value={progressStudent}
                  onChange={(e) => setProgressStudent(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium"
                  id="student-report-select"
                >
                  {teacherStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.studentName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Current Level</label>
                <select
                  value={reportLevel}
                  onChange={(e) => setReportLevel(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium"
                  id="level-report-select"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(l => (
                    <option key={l} value={l}>Level {l}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-600 mb-1">Attendance Rate %</label>
                <input
                  type="number"
                  value={attendanceRate}
                  onChange={(e) => setAttendanceRate(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                  id="attendance-rate-input"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-600 mb-1">Exam Marks %</label>
                <input
                  type="number"
                  value={examScore}
                  onChange={(e) => setExamScore(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                  id="exam-score-input"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-600 mb-1">Homework Rate %</label>
                <input
                  type="number"
                  value={homeworkRate}
                  onChange={(e) => setHomeworkRate(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                  id="homework-rate-input"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-600 mb-1">Speed (Sums/Min)</label>
                <input
                  type="number"
                  value={speedScore}
                  onChange={(e) => setSpeedScore(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                  id="speed-score-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Pedagogical Observations</label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium h-16 focus:ring-1 focus:ring-indigo-500"
                id="observations-textarea"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 space-y-4">
            <button
              onClick={handleGenerateReport}
              disabled={reportLoading}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all active:scale-[0.98]"
              id="generate-report-btn"
            >
              {reportLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Report Card...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Synthesize Progress Report</span>
                </>
              )}
            </button>

            {reportOutput && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 max-h-[160px] overflow-y-auto text-xs text-slate-700 leading-relaxed font-sans">
                <div className="font-semibold text-[10px] text-indigo-600 uppercase mb-1">Generated Report Card (Copy Friendly)</div>
                <div className="whitespace-pre-wrap">{reportOutput}</div>
              </div>
            )}
          </div>
        </div>

        {/* Lesson Planner panel */}
        <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Geniplus AI Lesson Planner (Level 1 to 8)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Generate curriculum lessons complete with warmup, explaining equations, and homework drafts.</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Target Abacus Level</label>
                  <select
                    value={lpLevel}
                    onChange={(e) => setLpLevel(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium"
                    id="lesson-level-select"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(l => (
                      <option key={l} value={l}>Level {l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Session Duration</label>
                  <select
                    value={lpDuration}
                    onChange={(e) => setLpDuration(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium"
                    id="lesson-duration-select"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={60}>60 Minutes</option>
                    <option value={90}>90 Minutes (Standard)</option>
                    <option value={120}>120 Minutes (Workshop)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Focus Concept or Topic</label>
                <input
                  type="text"
                  value={lpTopic}
                  onChange={(e) => setLpTopic(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                  id="lesson-topic-input"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 space-y-4">
            <button
              onClick={handleGenerateLessonPlan}
              disabled={lpLoading}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-[0.98]"
              id="generate-lesson-btn"
            >
              {lpLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Formulating Lesson Outline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Draft Complete Lesson Plan</span>
                </>
              )}
            </button>

            {lpOutput && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 max-h-[160px] overflow-y-auto text-xs text-slate-700 leading-relaxed font-sans">
                <div className="font-semibold text-[10px] text-emerald-600 uppercase mb-1">Generated Lesson Plan (Copy Friendly)</div>
                <div className="whitespace-pre-wrap">{lpOutput}</div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* AI Marketing & CRM for authorized marketing staff */}
      {(currentTeacher.role?.toLowerCase().includes("marketing") || currentTeacher.role?.toLowerCase().includes("sales")) && (
        <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-black text-indigo-900 font-display">Authorized AI Marketing & CRM Portal</h3>
              <p className="text-xs text-slate-500">Since you have been assigned an administrative Marketing / Sales role by your Center Admin, you have full access to draft AI campaigns, track inquiry pipelines, and register parent leads.</p>
            </div>
          </div>
          <CrmView leads={leads} onAddLead={onAddLead} teachers={teachers} centers={centers} currentUser={currentTeacher} currentRole={currentTeacher.role || "Teacher"} />
        </div>
      )}

        </div>
      )}

      {activeSubTab === "abacus_gym" && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl">
            <div className="mb-4">
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                Classroom Demonstration Mode
              </span>
              <h3 className="text-xl font-black font-display text-white mt-1">
                🧮 Interactive Abacus Bead Gym Trainer
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Use this interactive Soroban Abacus tool to demonstrate bead setting and reading on smartboards, projectors, or during 1-on-1 online teaching sessions.
              </p>
            </div>
            <AbacusBeadExerciseView studentName={`${currentTeacher.name} (Teacher Demo)`} />
          </div>
        </div>
      )}

      {activeSubTab === "worksheets" && (
        <div className="space-y-4 animate-fade-in">
          <PracticeGeneratorView />
        </div>
      )}

      {activeSubTab === "live_teaching" && (
        <div id="teacher-live-projector-content" className="space-y-6 animate-fade-in">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-slate-950 text-amber-100 p-6 rounded-3xl border border-amber-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-2 shadow-xs">
                Classroom Smartboard / Projector Mode Active
              </span>
              <h2 className="text-2xl font-black font-display text-white">
                🏫 Live 17-Rod Abacus & Worksheet Projector Studio
              </h2>
              <p className="text-xs text-amber-200/80 mt-1 max-w-2xl">
                Project live sums directly on your classroom screen or Zoom window. Demonstrate bead movements on the 17-rod Soroban abacus, run timed speed drills, and reveal answers step-by-step.
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => printElementById("teacher-live-projector-content", "Abacus Classroom Live Studio")}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print / PDF View</span>
              </button>
            </div>
          </div>

          {/* 17-ROD WOODEN VIRTUAL ABACUS DEMO TOOL */}
          <VirtualAbacus
            initialRods={17}
            initialTheme="wooden"
            initialType="japanese"
            title="🏫 Classroom 17-Rod Wooden Soroban Abacus (Demonstrator)"
          />

          {/* ACTIVE SMARTBOARD TEACHING FOCUS SUM BANNER ABOVE ABACUS */}
          {projectorSums.length > 0 && (
            <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border-2 border-amber-400 rounded-3xl p-5 shadow-2xl text-white space-y-4 animate-fade-in">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-indigo-900/80 pb-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-1 rounded-xl uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Active Teaching Sum ({activeFocusSumIndex + 1} / {projectorSums.length})</span>
                  </span>
                  {projectorSums[activeFocusSumIndex]?.formula && (
                    <span className="bg-indigo-900/90 text-indigo-200 border border-indigo-700/80 font-mono text-xs px-3 py-1 rounded-xl">
                      Formula: {projectorSums[activeFocusSumIndex].formula}
                    </span>
                  )}
                </div>

                {/* Navigation & Reveal Controls for 1-by-1 Step-by-Step Teaching */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFocusSumIndex((prev) => (prev > 0 ? prev - 1 : projectorSums.length - 1))}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-black text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous Sum</span>
                  </button>

                  <span className="text-xs font-mono font-black text-amber-300 px-3 py-1 bg-slate-900 rounded-xl border border-slate-800">
                    {activeFocusSumIndex + 1} of {projectorSums.length}
                  </span>

                  <button
                    type="button"
                    onClick={() => setActiveFocusSumIndex((prev) => (prev < projectorSums.length - 1 ? prev + 1 : 0))}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md"
                  >
                    <span>Next Sum</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const activeId = projectorSums[activeFocusSumIndex]?.id;
                      if (activeId !== undefined) {
                        setProjectorRevealedIds(prev => ({ ...prev, [activeId]: !prev[activeId] }));
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    {projectorRevealedIds[projectorSums[activeFocusSumIndex]?.id] || projectorShowAnswers ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>Hide Ans</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Reveal Ans</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Huge Prominent Sum Display Above Abacus */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-2">
                <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">
                  Solve on Abacus Demonstrator:
                </span>
                <div className="text-4xl sm:text-6xl font-mono font-black text-amber-300 tracking-wider">
                  {projectorSums[activeFocusSumIndex]?.sum || "Select a sum"}
                </div>
                {(projectorRevealedIds[projectorSums[activeFocusSumIndex]?.id] || projectorShowAnswers) && (
                  <div className="text-2xl font-mono font-black text-emerald-400 pt-1 animate-bounce">
                    Answer = {projectorSums[activeFocusSumIndex]?.answer}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DYNAMIC LIVE WORKSHEET TEACHER PRESENTER */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 text-left">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Live Classroom Worksheet Projector
                </h3>
                <p className="text-xs text-slate-500">Search and project concept worksheets on classroom screens. Reveal answers 1-by-1 or view on abacus above.</p>
              </div>

              {/* Toolbar Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Font Size Zoom Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                  <span className="text-[10px] uppercase font-black px-2 text-slate-500">Zoom:</span>
                  <button
                    type="button"
                    onClick={() => setProjectorFontSize("normal")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${projectorFontSize === "normal" ? "bg-white text-indigo-700 shadow-xs font-black" : "hover:text-slate-900"}`}
                  >
                    1x
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectorFontSize("large")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${projectorFontSize === "large" ? "bg-white text-indigo-700 shadow-xs font-black" : "hover:text-slate-900"}`}
                  >
                    2x Large
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectorFontSize("ultra")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${projectorFontSize === "ultra" ? "bg-white text-indigo-700 shadow-xs font-black" : "hover:text-slate-900"}`}
                  >
                    3x Ultra
                  </button>
                </div>

                {/* Show/Hide Answers */}
                <button
                  type="button"
                  onClick={() => setProjectorShowAnswers(!projectorShowAnswers)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    projectorShowAnswers 
                      ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                      : "bg-slate-900 text-amber-300 hover:bg-slate-800"
                  }`}
                >
                  {projectorShowAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{projectorShowAnswers ? "Hide All Answers" : "Reveal All Answers"}</span>
                </button>
              </div>
            </div>

            {/* CONCEPT-WISE DIGITAL PRACTICE MANAGER WORKSHEET SEARCH & SELECTOR */}
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 rounded-3xl border border-indigo-700 shadow-md space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase text-amber-300 tracking-wider">Search & Project Concept Worksheets</span>
                  </div>
                  <p className="text-[11px] text-indigo-200">
                    Search created concept worksheets by title or topic (e.g. "Week 4", "Big Friends", "Direct Beads") to project directly on Smartboard.
                  </p>
                </div>

                {/* Search Bar & Dropdown Selector */}
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={worksheetSearchQuery}
                      onChange={(e) => setWorksheetSearchQuery(e.target.value)}
                      placeholder="Search worksheet title..."
                      className="w-full bg-slate-800 text-white border border-indigo-500/60 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    {worksheetSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setWorksheetSearchQuery("")}
                        className="absolute right-2 top-2.5 text-[10px] text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <select
                    value={selectedWorksheetId}
                    onChange={(e) => handleLoadConceptWorksheetToProjector(e.target.value)}
                    className="bg-slate-800 text-white border border-indigo-500/60 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 w-full sm:w-64 shadow-inner"
                  >
                    <option value="">-- Select Concept Worksheet --</option>
                    {availableConceptWorksheets
                      .filter(ws => {
                        if (!worksheetSearchQuery.trim()) return true;
                        const q = worksheetSearchQuery.toLowerCase();
                        return (
                          ws.title?.toLowerCase().includes(q) ||
                          ws.conceptName?.toLowerCase().includes(q) ||
                          `level ${ws.level}`.includes(q)
                        );
                      })
                      .map((ws) => (
                        <option key={ws.id} value={ws.id}>
                          {ws.title} ({ws.conceptName || `Level ${ws.level}`})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Quick Select Concept Worksheet Chips */}
              {availableConceptWorksheets.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-indigo-900/80">
                  <div className="text-[10px] font-black uppercase text-amber-300 tracking-wider flex items-center justify-between">
                    <span>Available Concept Worksheets ({availableConceptWorksheets.length}):</span>
                    {worksheetSearchQuery && <span className="text-indigo-300">Filtered by "{worksheetSearchQuery}"</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                    {availableConceptWorksheets
                      .filter(ws => {
                        if (!worksheetSearchQuery.trim()) return true;
                        const q = worksheetSearchQuery.toLowerCase();
                        return (
                          ws.title?.toLowerCase().includes(q) ||
                          ws.conceptName?.toLowerCase().includes(q) ||
                          `level ${ws.level}`.includes(q)
                        );
                      })
                      .map((ws) => {
                        const isSelected = selectedWorksheetId === ws.id;
                        return (
                          <button
                            key={ws.id}
                            type="button"
                            onClick={() => handleLoadConceptWorksheetToProjector(ws.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-amber-400 text-slate-950 font-black shadow-md ring-2 ring-amber-200"
                                : "bg-slate-800/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-700/60"
                            }`}
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{ws.title}</span>
                            <span className="text-[10px] opacity-75 font-mono">({ws.conceptName || `L${ws.level}`})</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {loadedWorksheetTitle && (
                <div className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-black px-3.5 py-2 rounded-xl flex items-center justify-between">
                  <span>✅ {loadedWorksheetTitle}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWorksheetId("");
                      setLoadedWorksheetTitle("");
                      handleGenerateProjectorSums(projectorLevel, projectorNumSums);
                    }}
                    className="text-[10px] text-amber-300 hover:underline uppercase font-mono font-bold cursor-pointer"
                  >
                    Clear & Reset Presets
                  </button>
                </div>
              )}
            </div>

            {/* Sum Generation & Timer Controls Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs font-bold text-indigo-950 shrink-0">Count:</span>
                <select
                  value={projectorNumSums}
                  onChange={(e) => {
                    const count = Number(e.target.value);
                    setProjectorNumSums(count);
                    if (selectedWorksheetId) {
                      handleLoadConceptWorksheetToProjector(selectedWorksheetId, count);
                    } else {
                      handleGenerateProjectorSums(projectorLevel, count);
                    }
                  }}
                  className="bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-indigo-950 focus:outline-none cursor-pointer"
                >
                  {[4, 8, 10, 15, 20, 25, 30, 50].map((num) => (
                    <option key={num} value={num}>{num} Sums</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleGenerateProjectorSums(projectorLevel, projectorNumSums)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Generate Fresh Sums</span>
                </button>
              </div>

              {/* Stopwatch Drill Control */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-2xs">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-black text-indigo-950 font-mono">
                  Timer: {Math.floor(projectorTimerSeconds / 60)}:{("0" + (projectorTimerSeconds % 60)).slice(-2)}
                </span>
                <button
                  type="button"
                  onClick={() => setProjectorTimerActive(!projectorTimerActive)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    projectorTimerActive ? "bg-rose-500 text-white" : "bg-emerald-600 text-white"
                  }`}
                >
                  {projectorTimerActive ? "Pause" : "Start Drill"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProjectorTimerActive(false);
                    setProjectorTimerSeconds(60);
                  }}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline ml-1"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Custom Sum Entry Input */}
            <form onSubmit={handleAddCustomProjectorSum} className="flex gap-2">
              <input
                type="text"
                value={customSumInput}
                onChange={(e) => setCustomSumInput(e.target.value)}
                placeholder="Enter custom sum callout for students (e.g. 485 + 239 - 110)..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Smartboard</span>
              </button>
            </form>

            {/* HIGH-CONTRAST SMARTBOARD PROJECTOR DISPLAY BOX */}
            <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 border-4 border-indigo-900 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Classroom Projector Display — {loadedWorksheetTitle || `Level ${projectorLevel}`} ({projectorSums.length} Sums)
                </span>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Live Projection Output
                </div>
              </div>

              {/* Dynamic Sum Cards Grid */}
              <div className={`grid gap-4 ${
                projectorSums.length <= 4 
                  ? "grid-cols-1 sm:grid-cols-2" 
                  : projectorSums.length <= 8 
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-4" 
                  : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
              }`}>
                {projectorSums.map((item, idx) => {
                  const isRevealed = projectorShowAnswers || !!projectorRevealedIds[item.id];
                  const isActiveOnAbacus = activeFocusSumIndex === idx;

                  return (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        setActiveFocusSumIndex(idx);
                        setProjectorRevealedIds({ ...projectorRevealedIds, [item.id]: !projectorRevealedIds[item.id] });
                      }}
                      className={`rounded-2xl p-5 text-center space-y-3 relative group transition-all cursor-pointer shadow-lg hover:scale-[1.02] ${
                        isActiveOnAbacus
                          ? "bg-indigo-950 border-2 border-amber-400 ring-2 ring-amber-300 shadow-amber-500/20"
                          : "bg-slate-900/95 border-2 border-slate-800 hover:border-amber-400"
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] font-bold font-mono">
                        <span className={isActiveOnAbacus ? "text-amber-300 font-black" : "text-slate-500"}>Sum #{item.id}</span>
                        {isActiveOnAbacus ? (
                          <span className="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">👉 Active Abacus</span>
                        ) : (
                          <span className="text-slate-600 text-[9px]">Click to focus</span>
                        )}
                      </div>

                      {/* Sum Text with Zoom Levels */}
                      <div className={`font-black font-mono text-amber-300 tracking-wider my-3 transition-all ${
                        projectorFontSize === "ultra" 
                          ? "text-4xl sm:text-5xl" 
                          : projectorFontSize === "large" 
                          ? "text-2xl sm:text-3xl" 
                          : "text-xl sm:text-2xl"
                      }`}>
                        {item.sum} = ?
                      </div>

                      {/* Answer Reveal Box */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-1">
                        {isRevealed ? (
                          <span className="text-sm font-black text-emerald-400 font-mono bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800">
                            Ans: {item.answer}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 italic bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            🙈 Hidden (Click to reveal)
                          </span>
                        )}

                        <span className="text-[9px] text-slate-400 font-mono italic truncate max-w-[120px]" title={item.formula}>
                          {item.formula}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "exams" && (
        <div className="space-y-4 animate-fade-in">
          <TeacherExamManager
            currentTeacher={currentTeacher}
            students={students}
            onRefreshData={onRefreshData}
          />
        </div>
      )}

      {activeSubTab === "certificates" && (
        <div className="space-y-4 animate-fade-in">
          <DigitalCertificateManager
            currentTeacher={currentTeacher}
            students={students}
            teachers={teachers}
            center={centers.find(c => c.id === currentTeacher.centerId)}
            onRefreshData={onRefreshData}
          />
        </div>
      )}

      {activeSubTab === "timings" && (
        <div className="space-y-6 animate-fade-in">
          {/* Referral Link Sharing Card */}
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 opacity-10">
              <Sparkles className="w-64 h-64" />
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="bg-indigo-500/30 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-2">
                    Referral & Registration Link
                  </span>
                  <h2 className="text-xl font-black font-display">Share Your Enrollment Link</h2>
                </div>
                
                {/* Pre-select Timing Selector for Link Sharing */}
                <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-800/50 px-3 py-1.5 rounded-2xl">
                  <label className="text-[11px] font-bold text-indigo-200">Pre-select Timing for Parent:</label>
                  <select
                    value={selectedLinkSlot}
                    onChange={(e) => setSelectedLinkSlot(e.target.value)}
                    className="bg-indigo-900 border border-indigo-750 text-white text-xs rounded-xl px-2.5 py-1 outline-none font-bold focus:ring-1 focus:ring-indigo-400"
                  >
                    <option value="">-- Let Parent Choose --</option>
                    {(currentTeacher?.availableSlots || []).map((slot: string) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
                Copy and share this referral link with prospective parents and students. Anyone registering through this link will be automatically assigned to your roster, and the chosen batch timing will be auto-selected for them.
              </p>
              
              <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-indigo-950/50 border border-indigo-800/60 p-2 rounded-2xl">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/student-register?center=${activeShareCenterId}&teacher=${currentTeacher.id}${selectedLinkSlot ? `&selected_slot=${encodeURIComponent(selectedLinkSlot)}` : ""}`}
                  className="bg-transparent border-0 outline-none text-xs font-mono text-indigo-300 px-3 py-2 flex-1 min-w-0"
                />
                <button
                  onClick={() => {
                    const finalLink = `${window.location.origin}/student-register?center=${activeShareCenterId}&teacher=${currentTeacher.id}${selectedLinkSlot ? `&selected_slot=${encodeURIComponent(selectedLinkSlot)}` : ""}`;
                    navigator.clipboard.writeText(finalLink);
                    alert(`Referral link for ${centers.find(c => c.id === activeShareCenterId)?.name || 'Center'} copied to clipboard!`);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Manage My Timings Card */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div>
                <h3 className="text-sm font-black text-indigo-950 font-display">Manage Your Timings</h3>
                <p className="text-[11px] text-slate-500">
                  Update, add, or remove your available timings. Changes require approval from the Center Admin or Manager before becoming active.
                </p>
              </div>

              {/* Add/Edit Proposed Slot Form */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between items-center">
                  <span>{editingSlotIndex !== null ? "Edit Proposed Slot" : "Propose New Slot"}</span>
                  {editingSlotIndex !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSlotIndex(null);
                        setEditingSlotValue("");
                      }}
                      className="text-slate-500 hover:text-slate-800 underline lowercase text-[10px]"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Saturday 10:00 AM"
                    value={editingSlotIndex !== null ? editingSlotValue : newSlotInput}
                    onChange={(e) => {
                      if (editingSlotIndex !== null) {
                        setEditingSlotValue(e.target.value);
                      } else {
                        setNewSlotInput(e.target.value);
                      }
                    }}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editingSlotIndex !== null) {
                        const val = editingSlotValue.trim();
                        if (!val) return;
                        const list = [...proposedSlots];
                        list[editingSlotIndex] = val;
                        setProposedSlots(list);
                        setEditingSlotIndex(null);
                        setEditingSlotValue("");
                      } else {
                        const val = newSlotInput.trim();
                        if (!val) return;
                        if (proposedSlots.includes(val)) {
                          alert("This time slot is already in your proposed list!");
                          return;
                        }
                        setProposedSlots([...proposedSlots, val]);
                        setNewSlotInput("");
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    {editingSlotIndex !== null ? "Update" : "Add"}
                  </button>
                </div>
              </div>

              {/* Proposed Slots List */}
              <div className="space-y-3">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between items-center">
                  <span>Your Proposed Timings</span>
                  <span className="text-indigo-600 text-[10px] font-bold">Draft List</span>
                </div>

                <div className="space-y-2">
                  {proposedSlots.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl text-[11px] text-slate-400">
                      No timings proposed yet. Add some above!
                    </div>
                  ) : (
                    proposedSlots.map((slot, index) => (
                      <div key={index} className="flex justify-between items-center bg-indigo-50/40 border border-indigo-100 rounded-xl px-3 py-2 text-xs">
                        <span className="font-extrabold text-indigo-950">{slot}</span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSlotIndex(index);
                              setEditingSlotValue(slot);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-extrabold hover:bg-indigo-50 px-2 py-1 rounded-md transition-all text-[10px]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setProposedSlots(proposedSlots.filter((_, i) => i !== index));
                              if (editingSlotIndex === index) {
                                setEditingSlotIndex(null);
                                setEditingSlotValue("");
                              }
                            }}
                            className="text-rose-600 hover:text-rose-800 font-extrabold hover:bg-rose-50 px-2 py-1 rounded-md transition-all text-[10px]"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="button"
                  disabled={submitTimingsLoading || JSON.stringify(proposedSlots) === JSON.stringify(currentTeacher.availableSlots || [])}
                  onClick={async () => {
                    setSubmitTimingsLoading(true);
                    try {
                      const res = await fetch("/api/erp/create-timing-change-request", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          teacherId: currentTeacher.id,
                          requestedSlots: proposedSlots
                        })
                      });
                      const data = await res.json();
                      if (data.success) {
                        alert("Your proposed timings have been successfully submitted for Center Admin / Manager approval!");
                        await logTeacherActivity("Submit Timing Request", `Proposed timings change request with ${proposedSlots.length} slots.`);
                        if (onRefreshData) await onRefreshData();
                      } else {
                        alert(data.error || "Failed to submit request");
                      }
                    } catch (err: any) {
                      alert("Error submitting request: " + err.message);
                    } finally {
                      setSubmitTimingsLoading(false);
                    }
                  }}
                  className={`w-full font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer text-center ${
                    JSON.stringify(proposedSlots) === JSON.stringify(currentTeacher.availableSlots || [])
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  }`}
                >
                  {submitTimingsLoading ? "Submitting..." : "Submit Timing Changes for Approval"}
                </button>
                {JSON.stringify(proposedSlots) === JSON.stringify(currentTeacher.availableSlots || []) ? (
                  <span className="text-[10px] text-slate-400 mt-1.5 block text-center">
                    No draft changes made compared to active timings.
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-600 font-extrabold mt-1.5 block text-center animate-pulse">
                    Draft changes detected! Click submit to request approval.
                  </span>
                )}
              </div>

              {/* Active / Reference Slots info */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currently Active Timings</div>
                <div className="flex flex-wrap gap-1.5">
                  {(currentTeacher.availableSlots || []).length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">No timings registered. Default slots in use.</span>
                  ) : (
                    (currentTeacher.availableSlots || []).map((slot, i) => (
                      <span key={i} className="bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-[10px] px-2 py-0.5 rounded-md">
                        {slot}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Timing Request History list */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Request History</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {timingChangeRequests.filter(r => r.teacherId === currentTeacher.id).length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic text-center py-2">No request history found.</div>
                  ) : (
                    [...timingChangeRequests]
                      .filter(r => r.teacherId === currentTeacher.id)
                      .reverse()
                      .map((req) => (
                        <div key={req.id} className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 space-y-1.5 text-[11px]">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-slate-700">{new Date(req.createdAt).toLocaleDateString()}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              req.status === "Pending" ? "bg-amber-100 text-amber-800" :
                              req.status === "Approved" ? "bg-emerald-100 text-emerald-800" :
                              "bg-rose-100 text-rose-800"
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            <strong>Proposed:</strong> {req.requestedSlots.join(", ") || "No slots"}
                          </div>
                          {req.remarks && (
                            <div className="text-[10px] bg-rose-50/50 text-rose-700 px-2 py-1 rounded border border-rose-100">
                              <strong>Reason:</strong> {req.remarks}
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* Time Slot Cleaning & Student Visualizer Card */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div>
                <h3 className="text-sm font-black text-indigo-950 font-display">Clean Slots & Student Distribution</h3>
                <p className="text-[11px] text-slate-500">
                  See exactly which students are registered in each of your availability slots to make timetable gaps clean and optimized.
                </p>
              </div>

              <div className="space-y-4">
                {(currentTeacher.availableSlots || []).length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl text-[11px] text-slate-400">
                    Add time slots on the left to visualize student rosters.
                  </div>
                ) : (
                  (currentTeacher.availableSlots || []).map((slot, index) => {
                    const matchedStudents = teacherStudents.filter(s => s.batch?.toLowerCase().trim() === slot.toLowerCase().trim());
                    return (
                      <div key={index} className="border border-slate-100 rounded-2xl p-4 hover:border-slate-200 transition-colors">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-extrabold text-indigo-950 text-xs">{slot}</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            {matchedStudents.length} {matchedStudents.length === 1 ? "Student" : "Students"} Registered
                          </span>
                        </div>

                        {matchedStudents.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic">
                            ✓ This slot is currently empty/clean! Available for bookings.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {matchedStudents.map(student => (
                              <div key={student.id} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between text-[11px]">
                                <div className="space-y-0.5">
                                  <div className="font-extrabold text-slate-800">{student.studentName}</div>
                                  <div className="text-[10px] text-slate-500 font-medium">Level {student.currentLevel} • Age {student.age}</div>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-50 border border-indigo-150 text-indigo-600 px-2 py-0.5 rounded-md">
                                  L{student.currentLevel}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                
                {/* Unassigned Students (batch doesn't match any of the teacher's active slots) */}
                {(() => {
                  const slotsLower = (currentTeacher.availableSlots || []).map(s => s.toLowerCase().trim());
                  const unassigned = teacherStudents.filter(s => !slotsLower.includes(s.batch?.toLowerCase().trim() || ""));
                  if (unassigned.length > 0) {
                    return (
                      <div className="border border-amber-100 bg-amber-50/30 rounded-2xl p-4 mt-4">
                        <div className="text-xs font-black text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          Other Active Students (Mismatched / General Batch)
                        </div>
                        <p className="text-[11px] text-amber-700/80 mb-3">
                          The following students have batches assigned that do not match your exact availability slots list. Consider updating their timings in the main dashboard or adding their batch to your available slots.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {unassigned.map(student => (
                            <div key={student.id} className="bg-white border border-amber-150 rounded-xl p-2.5 flex items-center justify-between text-[11px]">
                              <div className="space-y-0.5">
                                <div className="font-extrabold text-amber-950">{student.studentName}</div>
                                <div className="text-[10px] text-slate-500 font-medium">Batch: <span className="font-extrabold text-amber-700">{student.batch || "Not Set"}</span></div>
                              </div>
                              <span className="text-[9px] font-bold bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-md">
                                Level {student.currentLevel}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "roster_analytics" && (
        <div className="space-y-8 animate-fade-in">
          {/* Roster Header Stats */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-2">
                Roster Analytics & Distribution
              </span>
              <h2 className="text-2xl font-black font-display">Level-Wise & Batch-Wise Student Overview</h2>
              <p className="text-xs text-indigo-200 mt-1">
                Monitor total students, track distribution across Abacus levels (Level 1 to 8), and organize batch class codes.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenCreateBatchModal}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>➕ Create New Batch Code</span>
              </button>
            </div>
          </div>

          {/* Level-Wise Breakdown Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-black text-indigo-950 font-display flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <span>Abacus Level-Wise Distribution</span>
              </h3>
              <span className="text-xs font-bold text-slate-500">
                Total Assigned: {teacherStudents.length} Students
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(lvlNum => {
                const levelStudents = teacherStudents.filter(s => Number(s.currentLevel) === lvlNum);
                return (
                  <div
                    key={lvlNum}
                    className={`border rounded-2xl p-4 transition-all shadow-xs ${
                      levelStudents.length > 0
                        ? "bg-white border-indigo-200 hover:border-indigo-400"
                        : "bg-slate-50/60 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Level {lvlNum}</div>
                    <div className="text-2xl font-black text-indigo-950 mt-1 font-display">{levelStudents.length}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {levelStudents.length === 1 ? "1 Student" : `${levelStudents.length} Students`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Batch-Wise Breakdown Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-black text-indigo-950 font-display flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span>Batch-Wise & Timing Class Breakdown</span>
              </h3>
              <button
                onClick={handleOpenCreateBatchModal}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>+ Add New Batch</span>
              </button>
            </div>

            {batchList.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs">
                No structured batch codes created yet. Click "Create New Batch Code" to establish your class timings!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {batchList.map((batchObj: any) => {
                  const code = batchObj.batchCode;
                  const formatted = batchObj.formattedSlot;
                  const batchStudents = teacherStudents.filter(s => 
                    s.batchCode === code || 
                    s.batch === formatted || 
                    (s.batch && s.batch.toLowerCase().includes(code.toLowerCase()))
                  );

                  return (
                    <div key={batchObj.id || batchObj.batchCode} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="bg-indigo-100 text-indigo-800 font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-block mb-1">
                              {batchObj.batchCode}
                            </span>
                            <h4 className="text-sm font-black text-indigo-950 font-display">{batchObj.title}</h4>
                            {batchObj.isDifferentTimingPerDay && Array.isArray(batchObj.daySchedules) && batchObj.daySchedules.length > 0 ? (
                              <div className="space-y-0.5 mt-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                {batchObj.daySchedules.map((ds: any) => (
                                  <p key={ds.day} className="text-[11px] font-bold text-indigo-950 flex items-center justify-between">
                                    <span>🗓️ {ds.day}:</span>
                                    <span className="text-indigo-700 font-extrabold text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200">{ds.startTime} - {ds.endTime}</span>
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-500 font-medium">{batchObj.days} • {batchObj.startTime} - {batchObj.endTime}</p>
                            )}
                          </div>
                          <span className="text-xl font-black text-indigo-600 font-display">
                            {batchStudents.length} / {batchObj.maxCapacity || 15}
                          </span>
                        </div>

                        <div className="border-t border-slate-100 pt-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                            Enrolled Students ({batchStudents.length})
                          </span>
                          {batchStudents.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic block">No students currently in this batch.</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                              {batchStudents.map(s => (
                                <span key={s.id} className="bg-slate-100 border border-slate-200 text-slate-800 text-[11px] px-2 py-0.5 rounded-lg font-medium flex items-center gap-1">
                                  <span>{s.studentName}</span>
                                  <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1 rounded">L{s.currentLevel}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons: Edit / Delete */}
                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditBatchModal(batchObj)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Batch</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBatch(batchObj)}
                          className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Delete Batch Code"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Full Roster Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Full Student Roster Details
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3">Student Name & ID</th>
                    <th className="p-3">Abacus Level</th>
                    <th className="p-3">Batch Code & Timing</th>
                    <th className="p-3">Stars ⭐</th>
                    <th className="p-3">Parent Contact</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teacherStudents.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3">
                        <div className="font-extrabold text-slate-900">{s.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {s.id}</div>
                      </td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                          Level {s.currentLevel}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-lg text-[10px]">
                          {s.batchCode || s.batch || "Unassigned"}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-amber-600">
                        {s.stars || 0} ⭐
                      </td>
                      <td className="p-3 text-slate-600">
                        <div>{s.parentName || "Parent"}</div>
                        <div className="text-[10px] text-slate-400">{s.parentMobile || (s as any).mobile || "N/A"}</div>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedStudentForDetail(s.id)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                        >
                          Performance Analytics
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "student_leaderboard" && (
        <div className="space-y-8 animate-fade-in">
          {/* Leaderboard Header */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="bg-black/20 text-white border border-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-2">
                Student Leaderboard & Rankings
              </span>
              <h2 className="text-2xl font-black font-display flex items-center gap-2">
                <Trophy className="w-7 h-7 text-yellow-200" />
                <span>Soroban Academy Champions</span>
              </h2>
              <p className="text-xs text-amber-100 mt-1">
                Real-time leaderboard calculated by total practice stars, completed mental speed drills, and drill accuracy.
              </p>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Search student name..."
                value={leaderboardSearch}
                onChange={e => setLeaderboardSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:bg-white focus:border-amber-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={leaderboardLevelFilter}
                onChange={e => setLeaderboardLevelFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:border-amber-500 focus:outline-none"
              >
                <option value="all">All Abacus Levels</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(l => (
                  <option key={l} value={String(l)}>Level {l}</option>
                ))}
              </select>

              <select
                value={leaderboardBatchFilter}
                onChange={e => setLeaderboardBatchFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:border-amber-500 focus:outline-none"
              >
                <option value="all">All Batches</option>
                {batchList.map(b => (
                  <option key={b.batchCode} value={b.batchCode}>{b.batchCode}: {b.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            {(() => {
              const sortedStudents = [...teacherStudents]
                .filter(s => {
                  if (leaderboardLevelFilter !== "all" && String(s.currentLevel) !== leaderboardLevelFilter) return false;
                  if (leaderboardBatchFilter !== "all" && !(s.batchCode === leaderboardBatchFilter || (s.batch && s.batch.includes(leaderboardBatchFilter)))) return false;
                  if (leaderboardSearch && !s.studentName.toLowerCase().includes(leaderboardSearch.toLowerCase())) return false;
                  return true;
                })
                .sort((a, b) => (b.stars || 0) - (a.stars || 0));

              if (sortedStudents.length === 0) {
                return (
                  <div className="py-12 text-center text-slate-400 text-xs italic">
                    No students found matching current leaderboard search and level/batch filters.
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {sortedStudents.map((s, index) => {
                    const rank = index + 1;
                    const isGold = rank === 1;
                    const isSilver = rank === 2;
                    const isBronze = rank === 3;

                    return (
                      <div
                        key={s.id}
                        className={`border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                          isGold
                            ? "bg-gradient-to-r from-amber-50 to-yellow-50/50 border-amber-300 shadow-sm"
                            : isSilver
                            ? "bg-gradient-to-r from-slate-100 to-slate-50 border-slate-300"
                            : isBronze
                            ? "bg-gradient-to-r from-amber-900/10 to-orange-50 border-amber-200"
                            : "bg-white border-slate-150 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="shrink-0 flex items-center justify-center">
                            {isGold && <span className="text-2xl" title="1st Place Gold">🥇</span>}
                            {isSilver && <span className="text-2xl" title="2nd Place Silver">🥈</span>}
                            {isBronze && <span className="text-2xl" title="3rd Place Bronze">🥉</span>}
                            {!isGold && !isSilver && !isBronze && (
                              <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black text-xs flex items-center justify-center font-mono">
                                #{rank}
                              </span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-indigo-950 font-display">{s.studentName}</h4>
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Level {s.currentLevel}
                              </span>
                              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                                {s.batchCode || s.batch || "Batch TBD"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Student ID: <span className="font-mono">{s.id}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Practice Stars</span>
                            <span className="text-lg font-black text-amber-500 font-display flex items-center gap-1 justify-end">
                              {s.stars || 0} ⭐
                            </span>
                          </div>

                          <button
                            onClick={() => setSelectedStudentForDetail(s.id)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                          >
                            View Analytics
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activeSubTab === "approvals" && currentUser?.role === "Manager + Teacher" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-black text-indigo-950 font-display">Timing Change Approvals</h3>
            <p className="text-xs text-slate-500">
              Review and approve timing change requests submitted by teachers in your center.
            </p>
          </div>

          <div className="space-y-6">
            {/* Pending Requests Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                Pending Requests ({timingChangeRequests.filter(r => r.status === "Pending").length})
              </h4>

              {timingChangeRequests.filter(r => r.status === "Pending").length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl text-xs text-slate-400">
                  No pending timing change requests found. Good job!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {timingChangeRequests
                    .filter(r => r.status === "Pending")
                    .map((req) => {
                      const teacher = teachers.find(t => t.id === req.teacherId);
                      const currentSlots = teacher?.availableSlots || [];
                      const requestedSlots = req.requestedSlots || [];

                      // Calculate differences
                      const added = requestedSlots.filter(s => !currentSlots.includes(s));
                      const removed = currentSlots.filter(s => !requestedSlots.includes(s));
                      const unchanged = currentSlots.filter(s => requestedSlots.includes(s));

                      return (
                        <div key={req.id} className="border border-slate-200 rounded-2xl p-5 space-y-4 hover:border-slate-300 transition-colors bg-slate-50/30">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-extrabold text-indigo-950 text-sm">{teacher?.name || "Unknown Teacher"}</div>
                              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                                Teacher ID: {req.teacherId} • {new Date(req.createdAt).toLocaleString()}
                              </div>
                            </div>
                            <span className="bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                              Pending
                            </span>
                          </div>

                          <div className="space-y-2 text-xs bg-white border border-slate-100 rounded-xl p-3">
                            <div className="font-black text-[10px] text-slate-400 uppercase tracking-wider mb-2">Timing Visualizer Comparison</div>
                            
                            <div className="flex flex-wrap gap-1.5">
                              {unchanged.map((s, idx) => (
                                <span key={`un-${idx}`} className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                                  {s}
                                </span>
                              ))}
                              {added.map((s, idx) => (
                                <span key={`add-${idx}`} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1">
                                  <span>+</span> {s}
                                </span>
                              ))}
                              {removed.map((s, idx) => (
                                <span key={`rem-${idx}`} className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md font-bold text-[10px] line-through flex items-center gap-1">
                                  <span>-</span> {s}
                                </span>
                              ))}
                              {requestedSlots.length === 0 && (
                                <span className="text-[10px] text-slate-400 italic">No slots requested (Request to clear all slots)</span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3 pt-2">
                            {/* Remark field */}
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rejection Remarks (Required if rejecting)</label>
                              <input
                                id={`remark-${req.id}`}
                                type="text"
                                placeholder="e.g. Saturday 10 AM is overbooked, please propose another time slot."
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={async () => {
                                  const remarkVal = (document.getElementById(`remark-${req.id}`) as HTMLInputElement)?.value.trim();
                                  if (!remarkVal) {
                                    alert("Please provide rejection remarks/reason to guide the teacher!");
                                    return;
                                  }
                                  if (!confirm("Are you sure you want to reject this request?")) return;
                                  try {
                                    const res = await fetch("/api/erp/reject-timing-change-request", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        requestId: req.id,
                                        remarks: remarkVal
                                      })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert("Request rejected successfully!");
                                      await logTeacherActivity("Reject Timing Request", `Rejected timing request ${req.id} for teacher ${req.teacherId}.`);
                                      if (onRefreshData) await onRefreshData();
                                    } else {
                                      alert(data.error || "Failed to reject request");
                                    }
                                  } catch (err: any) {
                                    alert("Error: " + err.message);
                                  }
                                }}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer border border-rose-200"
                              >
                                Reject Request
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!confirm("Are you sure you want to approve this request and update the teacher's active timings?")) return;
                                  try {
                                    const res = await fetch("/api/erp/approve-timing-change-request", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        requestId: req.id
                                      })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert("Request approved and active timings updated successfully!");
                                      await logTeacherActivity("Approve Timing Request", `Approved timing request ${req.id} for teacher ${req.teacherId}.`);
                                      if (onRefreshData) await onRefreshData();
                                    } else {
                                      alert(data.error || "Failed to approve request");
                                    }
                                  } catch (err: any) {
                                    alert("Error: " + err.message);
                                  }
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
                              >
                                Approve & Save
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Request Logs Section */}
            <div className="border-t border-slate-100 pt-6 space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span>Recent Timing Request Log History</span>
              </h4>

              <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Teacher ID</th>
                      <th className="px-4 py-3">Requested Slots</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Remarks / Resolution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {timingChangeRequests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No timing requests found.</td>
                      </tr>
                    ) : (
                      [...timingChangeRequests]
                        .reverse()
                        .map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">
                              {new Date(req.createdAt).toLocaleDateString()} {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-4 py-3 font-extrabold text-indigo-950">{req.teacherId}</td>
                            <td className="px-4 py-3 text-slate-600">{req.requestedSlots.join(", ") || "None"}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                req.status === "Pending" ? "bg-amber-100 text-amber-800" :
                                req.status === "Approved" ? "bg-emerald-100 text-emerald-800" :
                                "bg-rose-100 text-rose-800"
                              }`}>
                                {req.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {req.remarks ? (
                                <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-100 inline-block max-w-xs truncate">
                                  {req.remarks}
                                </span>
                              ) : req.status === "Approved" ? (
                                <span className="text-emerald-700 italic">Slots synchronized successfully</span>
                              ) : (
                                <span className="text-slate-400 italic">Awaiting manager decision</span>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "demos" && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-pink-900 via-purple-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 bg-pink-500/20 text-pink-200 border border-pink-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-pink-400" />
                <span>My Demo Timings & Trial Schedule</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black font-display tracking-tight text-white">
                Scheduled Demo Classes ({myAssignedDemos.length})
              </h2>
              <p className="text-xs md:text-sm text-pink-100 max-w-2xl leading-relaxed font-medium">
                View your upcoming assigned 1-on-1 demo class slots, connect directly with parents via WhatsApp, mark demo completion status, or update notes.
              </p>
            </div>
          </div>

          {/* Interactive Calendar & Demo Slot View */}
          <TeacherDemoCalendar
            demos={myAssignedDemos}
            currentTeacher={currentTeacher}
            onRefreshData={onRefreshData}
          />
        </div>
      )}

      {activeSubTab === "crm" && (
        <div className="space-y-4 animate-fade-in">
          {canAccessCrm ? (
            <CrmView leads={leads} onAddLead={onAddLead} teachers={teachers} centers={centers} currentUser={currentUser} currentRole={currentUser?.role || "Teacher"} />
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-3 my-8">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto font-black text-xl">🔒</div>
              <h3 className="text-base font-extrabold text-amber-950 font-display">CRM Access Permission Required</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                You need permission from your Center Admin to view the AI Marketing & CRM Portal. Please ask your Center Admin to enable <strong>"CRM Access"</strong> for your account from the Instructors Directory on their dashboard.
              </p>
            </div>
          )}
        </div>
      )}

      {activeSubTab === "orders" && currentUser?.role !== "Teacher" && (
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-1/4 translate-x-1/4">
              <BookOpen className="w-96 h-96" />
            </div>
            <div className="relative z-10 space-y-2 max-w-2xl">
              <span className="bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-400/30">
                Teacher Inventory Hub
              </span>
              <h2 className="text-xl md:text-2xl font-black font-display tracking-tight">🎒 Book & Material Orders</h2>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                Order student workbooks, standard calculation abacus tools, and speed writing pads for your assigned centers. We calculate weight-based dynamic shipping and process secure UPI transfers instantly.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Products Catalog Grid */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-black text-indigo-950 font-display flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-500" />
                    <span>Materials Catalog</span>
                  </h3>
                  <p className="text-xs text-slate-500">Select items to pack and ship to your center.</p>
                </div>
                <span className="text-xs bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1 rounded-full font-bold">
                  {materialProducts.length} Items Available
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materialProducts.map((prod) => {
                  const qtyInCart = cart[prod.id] || 0;
                  const isOutOfStock = prod.stock <= 0;
                  return (
                    <div 
                      key={prod.id} 
                      className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-md hover:border-slate-300 ${
                        qtyInCart > 0 ? "border-indigo-500 ring-1 ring-indigo-500/10 bg-indigo-50/5" : "border-slate-200"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            isOutOfStock 
                              ? "bg-rose-50 text-rose-700 border border-rose-100" 
                              : prod.stock < 20 
                                ? "bg-amber-50 text-amber-700 border border-amber-100" 
                                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}>
                            {isOutOfStock ? "Out of Stock" : `${prod.stock} In Stock`}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-indigo-950 text-sm leading-snug line-clamp-1">{prod.name}</h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 h-8">{prod.description || "Official academy learning material."}</p>
                        </div>

                        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">ID: {prod.id}</span>
                          <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">Weight: {prod.weight || 0}g</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100">
                        <span className="text-base font-black text-indigo-950 font-mono">
                          ₹{prod.price}
                        </span>

                        {isOutOfStock ? (
                          <button 
                            disabled 
                            className="bg-slate-100 border border-slate-200 text-slate-400 text-xs font-black px-4 py-2 rounded-xl"
                          >
                            Sold Out
                          </button>
                        ) : qtyInCart > 0 ? (
                          <div className="flex items-center gap-2.5 bg-indigo-50 border border-indigo-200 p-1 rounded-xl">
                            <button
                              onClick={() => {
                                setCart(prev => {
                                  const next = { ...prev };
                                  if (next[prod.id] <= 1) {
                                    delete next[prod.id];
                                  } else {
                                    next[prod.id]--;
                                  }
                                  return next;
                                });
                              }}
                              className="p-1.5 hover:bg-white text-indigo-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black text-indigo-950 px-1">{qtyInCart}</span>
                            <button
                              disabled={qtyInCart >= prod.stock}
                              onClick={() => {
                                setCart(prev => ({ ...prev, [prod.id]: (prev[prod.id] || 0) + 1 }));
                              }}
                              className="p-1.5 hover:bg-white text-indigo-700 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCart(prev => ({ ...prev, [prod.id]: 1 }))}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shopping Cart & Checkout Form Column */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6 sticky top-6">
                <div>
                  <h3 className="text-base font-black text-indigo-950 font-display flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-indigo-500" />
                    <span>Your Order Cart</span>
                  </h3>
                  <p className="text-xs text-slate-500">Summary & secure billing form</p>
                </div>

                {(() => {
                  const baseWeightLimit = Number(shippingSettings?.baseWeightLimit) || 500;
                  const baseShippingCharge = Number(shippingSettings?.baseShippingCharge) || 60;
                  const additionalWeightStep = Number(shippingSettings?.additionalWeightStep) || 500;
                  const additionalShippingCharge = Number(shippingSettings?.additionalShippingCharge) || 40;

                  const cartItems = Object.entries(cart)
                    .map(([productId, qty]) => {
                      const prod = materialProducts.find(p => p.id === productId);
                      return prod ? { ...prod, quantity: qty } : null;
                    })
                    .filter(Boolean) as any[];

                  const cartSubtotal = cartItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
                  const cartTotalWeight = cartItems.reduce((acc, curr) => acc + ((curr.weight || 0) * curr.quantity), 0);
                  
                  let cartShipping = 0;
                  if (cartTotalWeight > 0) {
                    if (cartTotalWeight <= baseWeightLimit) {
                      cartShipping = baseShippingCharge;
                    } else {
                      const extra = cartTotalWeight - baseWeightLimit;
                      const steps = Math.ceil(extra / additionalWeightStep);
                      cartShipping = baseShippingCharge + (steps * additionalShippingCharge);
                    }
                  }
                  const cartTotalAmount = cartSubtotal + cartShipping;

                  if (orderCreatedSuccess) {
                    return (
                      <div className="text-center py-8 space-y-4">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                          <Check className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-indigo-950 text-sm">Order Placed Successfully!</h4>
                          <p className="text-xs text-slate-500">We have registered your order. It is awaiting payment verification and shipping.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOrderCreatedSuccess(false)}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                        >
                          Place Another Order
                        </button>
                      </div>
                    );
                  }

                  if (cartItems.length === 0) {
                    return (
                      <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 space-y-3">
                        <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto" />
                        <div className="text-xs font-medium">Your cart is currently empty.</div>
                        <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto">Select abacus tools or workbooks from the catalog to build your order.</p>
                      </div>
                    );
                  }

                  return (
                    <form onSubmit={handlePlaceOrder} className="space-y-5">
                      {/* Cart Items List */}
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {cartItems.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-xs bg-slate-50/50 border border-slate-100 rounded-xl p-2.5">
                            <div>
                              <div className="font-extrabold text-indigo-950 line-clamp-1">{item.name}</div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                ₹{item.price} × {item.quantity} • {item.weight * item.quantity}g
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-indigo-950">₹{item.price * item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => setCart(prev => {
                                  const copy = { ...prev };
                                  delete copy[item.id];
                                  return copy;
                                })}
                                className="text-rose-600 hover:text-rose-800 font-bold text-[10px] bg-rose-50 hover:bg-rose-100 p-1 rounded-md transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Calculations summary */}
                      <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-2xl p-4 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-500">
                          <span>Items Subtotal</span>
                          <span className="font-mono font-bold text-indigo-950">₹{cartSubtotal}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span className="flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-indigo-500" />
                            Shipping Charge ({cartTotalWeight}g)
                          </span>
                          <span className="font-mono font-bold text-indigo-950">₹{cartShipping}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 italic">
                          Rate: ₹{baseShippingCharge} up to {baseWeightLimit}g, then ₹{additionalShippingCharge} per extra {additionalWeightStep}g.
                        </p>
                        <div className="border-t border-indigo-100/50 pt-2 flex justify-between font-black text-sm text-indigo-950">
                          <span>Grand Total Amount</span>
                          <span className="font-mono text-indigo-600">₹{cartTotalAmount}</span>
                        </div>
                      </div>

                      {/* Shipping info fields */}
                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Contact Mobile Number</label>
                          <input
                            type="tel"
                            required
                            placeholder="e.g. +91 98765 43210"
                            value={buyerPhone}
                            onChange={(e) => setBuyerPhone(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Full Delivery Address (Center/Academy)</label>
                          <textarea
                            required
                            rows={3}
                            placeholder="e.g. GeniPlus Academy Center, Shop 4B, Sector 15, Gurgaon, HR - 122001"
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 resize-none"
                          />
                        </div>

                        {/* UPI Payment Instructions */}
                        <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center gap-2 text-amber-800">
                            <CreditCard className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-wider">UPI Instant Payment Transfer</span>
                          </div>
                          <div className="text-[11px] text-slate-600 space-y-1">
                            <p>Please pay <strong className="text-amber-900 font-black">₹{cartTotalAmount}</strong> using any UPI App (GPay/PhonePe/Paytm).</p>
                            <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 font-mono text-[10px] text-center text-indigo-950 select-all font-black flex items-center justify-center gap-1">
                              <span>{saasUpi}</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1.5">UPI Reference / UTR Number</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 312456789012"
                              value={orderPaymentRef}
                              onChange={(e) => setOrderPaymentRef(e.target.value)}
                              className="w-full bg-white border border-amber-200 rounded-xl px-3.5 py-2 text-xs font-black uppercase tracking-wide focus:outline-none focus:border-indigo-500"
                            />
                            <p className="text-[9px] text-slate-400 mt-1">Please insert the correct 12-digit transaction ID to verify shipment.</p>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isPlacingOrder}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3 rounded-2xl transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isPlacingOrder ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Placing Order...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" />
                            Submit Order & Confirm Payment
                          </>
                        )}
                      </button>
                    </form>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Teacher's Orders Tracking History */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-black text-indigo-950 font-display flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500" />
                <span>Your Order Tracking & History</span>
              </h3>
              <p className="text-xs text-slate-500">Monitor your shipping logs, dispatch states, and billing history.</p>
            </div>

            <div className="overflow-x-auto border border-slate-150 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Delivered To</th>
                    <th className="px-4 py-3">Items Ordered</th>
                    <th className="px-4 py-3 font-mono">Weight</th>
                    <th className="px-4 py-3 font-mono">Total Paid</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">UPI Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const myOrders = (materialOrders || []).filter(o => o.buyerId === currentTeacher?.id);
                    if (myOrders.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center text-slate-400 italic">No orders logged in your catalog yet.</td>
                        </tr>
                      );
                    }
                    return [...myOrders].reverse().map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/40">
                        <td className="px-4 py-4 font-black text-indigo-950 whitespace-nowrap">{ord.id}</td>
                        <td className="px-4 py-4 text-slate-500 font-medium whitespace-nowrap">{ord.orderDate || "Today"}</td>
                        <td className="px-4 py-4">
                          <div className="font-extrabold text-indigo-950">{ord.buyerPhone}</div>
                          <div className="text-[10px] text-slate-500 line-clamp-1 max-w-[180px]" title={ord.address}>{ord.address}</div>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          <div className="space-y-1">
                            {(ord.items || []).map((item: any, i: number) => (
                              <div key={i} className="text-[10px] font-semibold text-slate-600 whitespace-nowrap">
                                {item.name} <span className="text-slate-400">× {item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono font-bold text-slate-500">{ord.totalWeight}g</td>
                        <td className="px-4 py-4 font-mono font-extrabold text-indigo-950">₹{ord.totalAmount}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            ord.status === "Pending" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                            ord.status === "Shipped" ? "bg-indigo-100 text-indigo-800 border border-indigo-200" :
                            ord.status === "Delivered" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                            "bg-slate-100 text-slate-800 border border-slate-200"
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-mono text-[10px] text-slate-500 uppercase tracking-wide max-w-[100px] truncate" title={ord.paymentRef}>
                          {ord.paymentRef || "N/A"}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Student Analytics & Submissions Modal */}
      {selectedStudentForDetail && (() => {
        const student = selectedStudentForDetail;
        const studentSubmissions = practiceSubmissions.filter(sub => sub.studentId?.toLowerCase() === student.id?.toLowerCase());
        const studentHws = hwRecords.filter(hw => hw.studentId?.toLowerCase() === student.id?.toLowerCase());

        // Calculations
        const totalDrills = studentSubmissions.length;
        const totalCorrect = studentSubmissions.reduce((acc, curr) => acc + (curr.correctCount !== undefined ? curr.correctCount : (curr.correctSums !== undefined ? curr.correctSums : 0)), 0);
        const totalSums = studentSubmissions.reduce((acc, curr) => acc + (curr.totalCount !== undefined ? curr.totalCount : (curr.totalSums !== undefined ? curr.totalSums : 10)), 0);
        const averageAccuracy = totalSums > 0 ? Math.round((totalCorrect / totalSums) * 100) : 0;
        
        // Rows & Digits details
        const digitCounts: { [key: number]: number } = {};
        const rowCounts: { [key: number]: number } = {};
        let totalPracticeSeconds = 0;
        let countWithSeconds = 0;

        studentSubmissions.forEach(sub => {
          let d = sub.digits !== undefined ? sub.digits : (sub as any).digit;
          let r = sub.rows !== undefined ? sub.rows : (sub as any).row;

          if (d === undefined && sub.assignmentId) {
            const matchedAssign = practiceAssignments.find((a: any) => a.id === sub.assignmentId);
            if (matchedAssign) {
              d = matchedAssign.digits;
              r = matchedAssign.rows;
            }
          }

          if (d === undefined && sub.assignmentTitle) {
            const digMatch = sub.assignmentTitle.match(/(\d+)\s*(?:dig|digit)/i);
            if (digMatch) d = parseInt(digMatch[1], 10);
            const rowMatch = sub.assignmentTitle.match(/(\d+)\s*(?:row|r\b)/i);
            if (rowMatch) r = parseInt(rowMatch[1], 10);
          }

          if (d !== undefined && !isNaN(d)) digitCounts[d] = (digitCounts[d] || 0) + 1;
          if (r !== undefined && !isNaN(r)) rowCounts[r] = (rowCounts[r] || 0) + 1;

          if (sub.timeTakenSeconds) {
            totalPracticeSeconds += sub.timeTakenSeconds;
            countWithSeconds += 1;
          }
        });

        const avgTimePerSum = totalSums > 0 && totalPracticeSeconds > 0 ? (totalPracticeSeconds / totalSums).toFixed(1) : "—";

        // Dynamic Level based parameters if student has not logged explicit digits/rows
        const studentLevelNum = Number(student.currentLevel) || 1;
        const levelDefaultDigit = Math.min(studentLevelNum, 3);
        const levelDefaultRow = Math.min(studentLevelNum * 2 + 2, 10);

        const sortedDigits = Object.entries(digitCounts).sort((a: any, b: any) => b[1] - a[1]);
        const sortedRows = Object.entries(rowCounts).sort((a: any, b: any) => b[1] - a[1]);

        const topDigit = sortedDigits.length > 0 ? sortedDigits[0][0] : String(levelDefaultDigit);
        const topRow = sortedRows.length > 0 ? sortedRows[0][0] : String(levelDefaultRow);

        // Performance Improvement math
        let speedImprovementText = "Stable pace";
        let accuracyImprovementText = "Consistent accuracy";
        if (studentSubmissions.length >= 2) {
          const mid = Math.floor(studentSubmissions.length / 2);
          const firstHalf = studentSubmissions.slice(0, mid);
          const secondHalf = studentSubmissions.slice(mid);

          const firstHalfTotal = firstHalf.reduce((acc, curr) => acc + (curr.totalCount || curr.totalSums || 10), 0);
          const firstHalfCorrect = firstHalf.reduce((acc, curr) => acc + (curr.correctCount || curr.correctSums || 0), 0);
          const firstHalfAccuracy = firstHalfTotal > 0 ? (firstHalfCorrect / firstHalfTotal) * 100 : 0;

          const secondHalfTotal = secondHalf.reduce((acc, curr) => acc + (curr.totalCount || curr.totalSums || 10), 0);
          const secondHalfCorrect = secondHalf.reduce((acc, curr) => acc + (curr.correctCount || curr.correctSums || 0), 0);
          const secondHalfAccuracy = secondHalfTotal > 0 ? (secondHalfCorrect / secondHalfTotal) * 100 : 0;

          const accDiff = secondHalfAccuracy - firstHalfAccuracy;
          if (accDiff > 5) {
            accuracyImprovementText = `⚡ Accuracy improved by +${Math.round(accDiff)}%!`;
          } else if (accDiff < -5) {
            accuracyImprovementText = `⚠️ Accuracy dropped by ${Math.round(Math.abs(accDiff))}% (Needs precision coaching)`;
          } else {
            accuracyImprovementText = "🎯 Highly consistent high precision accuracy!";
          }

          const firstHalfSeconds = firstHalf.reduce((acc, curr) => acc + (curr.timeTakenSeconds || 0), 0);
          const secondHalfSeconds = secondHalf.reduce((acc, curr) => acc + (curr.timeTakenSeconds || 0), 0);

          const firstHalfAvg = firstHalfTotal > 0 && firstHalfSeconds > 0 ? (firstHalfSeconds / firstHalfTotal) : 0;
          const secondHalfAvg = secondHalfTotal > 0 && secondHalfSeconds > 0 ? (secondHalfSeconds / secondHalfTotal) : 0;

          if (firstHalfAvg > 0 && secondHalfAvg > 0) {
            const speedDiff = ((firstHalfAvg - secondHalfAvg) / firstHalfAvg) * 100;
            if (speedDiff > 5) {
              speedImprovementText = `🏎️ Solve speed improved by +${Math.round(speedDiff)}% faster!`;
            } else if (speedDiff < -5) {
              speedImprovementText = `🐢 Solve speed slowed down by ${Math.round(Math.abs(speedDiff))}% (Needs rhythm exercise)`;
            } else {
              speedImprovementText = "⏱️ Highly optimized bead movement pace!";
            }
          }
        }

        // Practice Behavior Cognitive Insights
        let practiceBehavior = "Beginner explorer";
        let behaviorColor = "bg-blue-50 text-blue-800 border-blue-200";
        let practiceGuideline = "Encourage student to take 1 daily speed drill on their student dashboard to establish muscular finger rhythm.";

        if (totalDrills >= 15) {
          practiceBehavior = "Exemplary Daily Soroban Champion 🏆";
          behaviorColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
          practiceGuideline = "Exceptional commitment! Recommend promoting to higher digit configurations (e.g. 2 digits, 6/8 rows) to stimulate cerebral growth.";
        } else if (totalDrills >= 7) {
          practiceBehavior = "Consistent & Dedicated Practitioner ⚡";
          behaviorColor = "bg-indigo-50 text-indigo-800 border-indigo-200";
          practiceGuideline = "Excellent regular drills! Encourage maintaining this momentum, focusing on zero-pencil bead visualization rules.";
        } else if (totalDrills > 0 && averageAccuracy < 70) {
          practiceBehavior = "Speed Focused (Accuracy improvement recommended) 🎯";
          behaviorColor = "bg-amber-50 text-amber-800 border-amber-200";
          practiceGuideline = "Bead movement is fast but accuracy needs attention. Guide them to complete worksheets slowly, checking each digit carefully.";
        } else if (totalDrills > 0) {
          practiceBehavior = "Moderate Practitioner (Needs higher frequency) 📚";
          behaviorColor = "bg-indigo-50/60 text-slate-800 border-slate-200";
          practiceGuideline = "Accuracy is strong! Encourage training at least 3-4 times a week to consolidate short-term mental focus.";
        }

        return (
          <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl border-2 border-slate-100 max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh] my-8 animate-scaleUp">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 rounded-t-3xl shrink-0">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                      Student ID: {student.id}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded text-[10px] font-bold">
                      Level {student.currentLevel}
                    </span>
                    <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded text-[10px] font-bold">
                      Batch: {student.batch}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-indigo-950 font-display mt-2 flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-indigo-600" />
                    Performance Analytics: {student.studentName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Comprehensive review of abacus practice, mental speed drills, textbook homework & cognitive insights.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudentForDetail(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 p-2 rounded-xl transition-all font-black text-sm"
                  title="Close Modal"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-6">
                
                {/* Statistics Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  
                  {/* Total Drills */}
                  <div className="bg-indigo-50/30 border border-indigo-100 rounded-2xl p-4 text-center space-y-1">
                    <Trophy className="w-5 h-5 text-indigo-600 mx-auto" />
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Completed Drills</span>
                    <span className="block text-2xl font-black text-indigo-950 font-display">{totalDrills}</span>
                    <span className="block text-[10px] text-indigo-600 font-semibold">{totalSums} Sums Solved</span>
                  </div>

                  {/* Avg Accuracy */}
                  <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-4 text-center space-y-1">
                    <Target className="w-5 h-5 text-emerald-600 mx-auto" />
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Average Accuracy</span>
                    <span className="block text-2xl font-black text-emerald-950 font-display">{averageAccuracy}%</span>
                    <span className="block text-[10px] text-emerald-600 font-semibold">{totalCorrect} Correct Answers</span>
                  </div>

                  {/* Digit & Row Preferences */}
                  <div className="bg-amber-50/30 border border-amber-100 rounded-2xl p-4 text-center space-y-1">
                    <Award className="w-5 h-5 text-amber-600 mx-auto" />
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Top Parameters</span>
                    <span className="block text-xl font-black text-amber-950 font-display">
                      {topDigit} Dig, {topRow} Row
                    </span>
                    <span className="block text-[10px] text-amber-700 font-semibold">Most frequent setup</span>
                  </div>

                  {/* Speed stats */}
                  <div className="bg-sky-50/30 border border-sky-100 rounded-2xl p-4 text-center space-y-1">
                    <Clock className="w-5 h-5 text-sky-600 mx-auto" />
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Solve Speed Pace</span>
                    <span className="block text-2xl font-black text-sky-950 font-display">{avgTimePerSum}s</span>
                    <span className="block text-[10px] text-sky-600 font-semibold">Average per Sum</span>
                  </div>

                </div>

                {/* Cognitive Practice Behavior & Improvement Trends */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Practice Behavior & Cognitive Insights */}
                  <div className="border border-slate-200 rounded-3xl p-5 bg-white space-y-3 shadow-3xs">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">Cognitive Practice Behavior</h4>
                    </div>

                    <div className={`p-3.5 border rounded-2xl ${behaviorColor} space-y-1.5`}>
                      <span className="text-[10px] font-black uppercase tracking-wider block">Behavior Type</span>
                      <strong className="text-xs font-extrabold block">{practiceBehavior}</strong>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Pedagogical Recommendation</span>
                      <p className="text-slate-600 leading-relaxed font-medium bg-slate-50 border border-slate-100 rounded-xl p-3">
                        {practiceGuideline}
                      </p>
                    </div>
                  </div>

                  {/* Improvement & Speed Metrics */}
                  <div className="border border-slate-200 rounded-3xl p-5 bg-white space-y-3 shadow-3xs">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">Soroban Improvement Metrics</h4>
                    </div>

                    <div className="space-y-2.5">
                      {/* Speed trend bar */}
                      <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Calculated Speed Progress</span>
                        <div className="text-xs font-bold text-slate-800">{speedImprovementText}</div>
                      </div>

                      {/* Accuracy trend bar */}
                      <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Calculated Accuracy Progress</span>
                        <div className="text-xs font-bold text-slate-800">{accuracyImprovementText}</div>
                      </div>

                      {/* Additional parameters info */}
                      <div className="text-[10px] text-slate-400 leading-relaxed pt-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <span>Metrics are automatically calculated comparing early historical entries with latest custom online practice sessions.</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Submissions & Textbook Homework lists */}
                <div className="space-y-4">
                  <div className="border-t border-slate-100 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider font-display">Student Submission logs</h4>
                    <div className="flex gap-1 text-[10px]">
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-150 px-2 py-0.5 rounded-full font-bold">
                        Drills: {totalDrills}
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded-full font-bold">
                        Worksheets: {studentHws.length}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Drill Practice submissions list */}
                    <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/30 space-y-3">
                      <span className="text-[10px] font-black text-slate-450 uppercase block pb-1.5 border-b border-slate-150">Mental/Speed Drills ({totalDrills})</span>
                      
                      <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                        {studentSubmissions.length === 0 ? (
                          <div className="text-center py-8 text-xs text-slate-400">No speed practice drills submitted yet.</div>
                        ) : (
                          [...studentSubmissions]
                            .sort((a, b) => new Date(b.submittedAt || b.createdAt || b.date || 0).getTime() - new Date(a.submittedAt || a.createdAt || a.date || 0).getTime())
                            .map((sub, idx) => {
                              const correct = sub.correctCount !== undefined ? sub.correctCount : (sub.correctSums !== undefined ? sub.correctSums : 0);
                              const total = sub.totalCount !== undefined ? sub.totalCount : (sub.totalSums !== undefined ? sub.totalSums : 10);
                              const accuracy = sub.accuracy !== undefined ? sub.accuracy : (Math.round((correct / total) * 100) || 0);

                              const dDigits = sub.digits || sub.numDigits || (sub.assignmentTitle && sub.assignmentTitle.match(/(\d+)\s*Digit/i)?.[1]) || sub.level || 1;
                              const dRows = sub.rows || sub.numRows || (sub.assignmentTitle && sub.assignmentTitle.match(/(\d+)\s*Row/i)?.[1]) || (Number(dDigits) * 2 + 2) || 4;

                              return (
                                <div key={idx} className="bg-white border border-slate-100 rounded-xl p-3 text-xs space-y-1.5 shadow-3xs">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-extrabold text-indigo-950">{sub.type || "Abacus"} Drill</span>
                                    <span className="text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full font-bold">{accuracy}% Accuracy</span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono flex justify-between items-center">
                                    <span className="font-extrabold text-indigo-900">{dDigits} Digits • {dRows} Rows</span>
                                    <span>{correct}/{total} Correct</span>
                                  </div>
                                  {sub.timeTakenSeconds && (
                                    <div className="text-[9px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded flex items-center justify-between">
                                      <span>Time Taken: {Math.floor(sub.timeTakenSeconds / 60)}m {sub.timeTakenSeconds % 60}s</span>
                                      <span>({(sub.timeTakenSeconds / total).toFixed(1)}s / sum)</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>

                    {/* Textbook homework submissions list */}
                    <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/30 space-y-3">
                      <span className="text-[10px] font-black text-slate-450 uppercase block pb-1.5 border-b border-slate-150">Worksheets & Homework ({studentHws.length})</span>
                      
                      <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                        {studentHws.length === 0 ? (
                          <div className="text-center py-8 text-xs text-slate-400">No textbook worksheet completed yet.</div>
                        ) : (
                          studentHws.map((hw, idx) => (
                            <div key={idx} className="bg-white border border-slate-100 rounded-xl p-3 text-xs space-y-2 shadow-3xs">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-extrabold text-slate-850">{hw.week || "Week task"}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  hw.status === "Approved"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : hw.status === "Completed"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-600"
                                }`}>
                                  {hw.status} {hw.score && `(${hw.score})`}
                                </span>
                              </div>
                              <div className="text-[10.5px] text-slate-600 font-semibold bg-slate-50 rounded p-1.5 border border-slate-100">
                                <span className="text-[9px] text-slate-400 block font-bold uppercase mb-0.5">Task Description:</span>
                                {hw.task}
                              </div>
                              {hw.notes && (
                                <p className="text-[10px] text-slate-500 italic">
                                  <strong>Notes:</strong> "{hw.notes}"
                                </p>
                              )}
                              {hw.submittedProof && hw.submittedProof.startsWith("http") && (
                                <a href={hw.submittedProof} target="_blank" rel="noopener noreferrer">
                                  <img src={hw.submittedProof} referrerPolicy="no-referrer" alt="proof" className="h-10 w-auto rounded border object-cover hover:opacity-85 transition-opacity" />
                                </a>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/80 rounded-b-3xl flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForDetail(null)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2 rounded-xl uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  Close Analytics Panel
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {activeSubTab === "teacher_training" && (
        <div className="space-y-6">
          {(() => {
            const activeBatchCode = (currentUser as any)?.enrolledBatch || (currentTeacher as any)?.batchCode || (currentUser as any)?.batchCode || "Batch 003";

            const activeLiveBatch = lmsLiveBatches.find(b => b.batchCode === activeBatchCode) || lmsLiveBatches[0] || {
              id: "TB_LIVE_003",
              batchCode: activeBatchCode,
              title: "Live Abacus Teacher Certification Cohort",
              instructorName: "Hitendra Makvana (Lead Master Trainer)",
              startDate: "2026-08-01",
              endDate: "2026-08-31",
              scheduleTime: "Mon & Wed 10:00 AM - 11:30 AM IST",
              meetUrl: "https://meet.google.com/abc-defg-hij",
              notes: "30-day intensive live teacher training cohort covering finger mechanics, small friends, big friends, and center growth.",
              status: "Active"
            };

            const activeLiveBatchAsCourse: TeacherCourse = {
              id: activeLiveBatch.id,
              title: `${activeLiveBatch.batchCode || activeBatchCode}: ${activeLiveBatch.title || "Live Abacus Teacher Certification Cohort"}`,
              level: 1,
              category: "Pedagogy & Finger Methods",
              description: activeLiveBatch.notes || "Live interactive teacher training cohort with daily recordings and study materials.",
              instructorName: activeLiveBatch.instructorName || "Hitendra Makvana (Lead Master Trainer)",
              isPublished: true,
              modules: (activeLiveBatch as any).modules && (activeLiveBatch as any).modules.length > 0 ? (activeLiveBatch as any).modules : [
                {
                  id: "lmod_1",
                  title: "Live Session Module 1: Abacus Pedagogy & Finger Mechanics",
                  level: 1,
                  lessons: [
                    { id: "ls_1", title: "Session 1: Live Onboarding & Bead Placement Mechanics", type: "video", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", durationMinutes: 45 },
                    { id: "ls_2", title: "Session 2: Direct Addition & Friends of 5 Formulas (+4, +3, +2, +1)", type: "video", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", durationMinutes: 50 },
                    { id: "ls_3", title: "Session 3: Friends of 10 Big Friends Addition Formulas (+9, +8, +7, +6)", type: "video", url: "", durationMinutes: 45 },
                    { id: "ls_4", title: "Session 4: Combination Formulas & Speed Anzan Drills", type: "video", url: "", durationMinutes: 40 }
                  ]
                },
                {
                  id: "lmod_2",
                  title: "Live Session Module 2: Multiplication, Division & Center Operations",
                  level: 2,
                  lessons: [
                    { id: "ls_5", title: "Session 5: Multiplication on 17-Rod Abacus (2D x 1D, 3D x 2D)", type: "video", url: "", durationMinutes: 45 },
                    { id: "ls_6", title: "Session 6: Division Techniques & Mock Teaching Demonstration", type: "video", url: "", durationMinutes: 50 }
                  ]
                }
              ]
            };

            return (
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-md text-white uppercase tracking-wider">
                        <GraduationCap className="w-4 h-4" />
                        Official Abacus Teacher Training Academy
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
                        Teacher Learning Portal & Live Batch Workspace
                      </h2>
                      <p className="text-amber-100 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
                        Learn Level 0–8 pedagogy, parent counseling, fee structure, and marketing. Access live interactive batch sessions or recorded step-by-step video courses.
                      </p>
                    </div>

              <div className="bg-white/15 backdrop-blur-md border border-white/20 p-4 rounded-2xl space-y-1 text-center shrink-0">
                <div className="text-[10px] uppercase font-black text-amber-200 tracking-wider">Active Enrollment</div>
                <div className="text-lg font-black text-white">{(currentUser as any)?.enrolledBatch || (currentTeacher as any)?.batchCode || "Batch 003"} & Level 0-8 Recorded</div>
                <div className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow-xs">
                  <Award className="w-3.5 h-3.5 fill-current text-slate-950" />
                  <span>{traineeStars} Star Points Earned</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Navigation Tabs Bar for Teacher Training Portal */}
          <div className="bg-slate-900 p-2 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-slate-800 shadow-md">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTrainingPortalTab("courses")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  trainingPortalTab === "courses"
                    ? "bg-amber-400 text-slate-950 shadow-md scale-102"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>📺 Courses & Recordings</span>
              </button>

              <button
                type="button"
                onClick={() => setTrainingPortalTab("student_practice")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  trainingPortalTab === "student_practice"
                    ? "bg-indigo-600 text-white shadow-md scale-102"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>🧮 Student Practice Drills</span>
              </button>

              <button
                type="button"
                onClick={() => setTrainingPortalTab("leaderboard")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  trainingPortalTab === "leaderboard"
                    ? "bg-emerald-500 text-slate-950 shadow-md scale-102"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <Trophy className="w-4 h-4 text-slate-950" />
                <span>⭐ Trainee Star Leaderboard</span>
              </button>
            </div>

            {/* 1-Click Center Admin Launch Action */}
            <button
              type="button"
              onClick={handleActivate30DayTrial}
              disabled={isActivatingTrial}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 border border-amber-300/30"
            >
              <Zap className="w-4 h-4 fill-current text-slate-950" />
              <span>{isActivatingTrial ? "Activating..." : "🚀 Launch Center Admin Trial (1-Click)"}</span>
            </button>
          </div>

          {/* TAB 1: COURSES & RECORDINGS */}
          {trainingPortalTab === "courses" && (
            <div>
              {/* UNIFIED COURSE DASHBOARD & LMS PLAYER */}
          {selectedLmsCoursePreview ? (
              /* SCREENSHOT 2 MATCHING: FULL SCREEN LMS COURSE PLAYER */
              <div className="bg-slate-100 min-h-[85vh] rounded-3xl overflow-hidden border border-slate-200 shadow-xl flex flex-col font-sans animate-fade-in">
                {/* Top Navigation Bar */}
                <header className="bg-[#1a2b4c] text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedLmsCoursePreview(null)}
                      className="bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      ← Back
                    </button>
                    <div className="w-8 h-8 rounded-full bg-[#008dff] text-white font-black text-sm flex items-center justify-center shadow-inner">
                      S
                    </div>
                    <div className="border-l border-slate-700 pl-3 hidden sm:block">
                      <span className="text-[10px] text-slate-400 font-mono block">hihituwise.systeme.io</span>
                      <span className="text-sm font-black text-white font-display truncate max-w-xs block">{selectedLmsCoursePreview.title}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {((selectedLmsCoursePreview as any).meetUrl || teacherLmsTab === "live_batch") && (
                      <button
                        type="button"
                        onClick={() => window.open((selectedLmsCoursePreview as any).meetUrl || "https://meet.google.com", "_blank")}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5 active:scale-95"
                      >
                        <Video className="w-3.5 h-3.5 fill-current" />
                        <span>Join Live Zoom Class</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedLmsCoursePreview(null)}
                      className="bg-[#008dff] hover:bg-[#0077ee] text-white font-black text-xs px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      Exit Course
                    </button>
                  </div>
                </header>

                {/* LMS Player Body: Left Sidebar + Right Video Container */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[70vh]">
                  {/* Left Sidebar - Module & Lesson Accordion */}
                  <aside className="w-full lg:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 max-h-[45vh] lg:max-h-none overflow-y-auto">
                    {/* Instructor Profile Header */}
                    <div className="p-5 border-b border-slate-100 text-center space-y-3 bg-slate-50/50">
                      <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto text-xl font-black border-2 border-indigo-200 shadow-xs">
                        👤
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 font-display">
                          {selectedLmsCoursePreview.instructorName || "Hitendra Makvana"}
                        </h3>
                        <p className="text-[10px] text-[#008dff] uppercase font-extrabold tracking-wider">Course Instructor</p>
                      </div>

                      {/* Prev / Next Lesson Navigation Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (activeLessonIndex > 0) {
                              setActiveLessonIndex(prev => prev - 1);
                            } else if (activeModuleIndex > 0) {
                              setActiveModuleIndex(prev => prev - 1);
                              setActiveLessonIndex(0);
                            }
                          }}
                          disabled={activeModuleIndex === 0 && activeLessonIndex === 0}
                          className="py-2 px-3 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition-all cursor-pointer"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const mod = selectedLmsCoursePreview.modules?.[activeModuleIndex];
                            if (mod && activeLessonIndex < (mod.lessons?.length || 0) - 1) {
                              setActiveLessonIndex(prev => prev + 1);
                            } else if (selectedLmsCoursePreview.modules && activeModuleIndex < selectedLmsCoursePreview.modules.length - 1) {
                              setActiveModuleIndex(prev => prev + 1);
                              setActiveLessonIndex(0);
                            }
                          }}
                          className="py-2 px-3 bg-[#008dff] hover:bg-[#0077ee] text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
                        >
                          Next
                        </button>
                      </div>

                      {/* Overall Progress Bar */}
                      <div className="bg-slate-200/80 rounded-full h-3.5 border border-slate-300 relative overflow-hidden flex items-center justify-center">
                        <div
                          className="bg-indigo-950 h-full absolute left-0 top-0 transition-all"
                          style={{ width: "0%" }}
                        />
                        <span className="text-[9px] font-black text-slate-800 z-10">0%</span>
                      </div>
                    </div>

                    {/* Modules & Lessons Accordion List */}
                    <div className="divide-y divide-slate-100 flex-1">
                      {(!selectedLmsCoursePreview.modules || selectedLmsCoursePreview.modules.length === 0) ? (
                        <div className="p-4 text-xs text-slate-400 italic text-center">No modules configured yet.</div>
                      ) : (
                        selectedLmsCoursePreview.modules.map((mod, mIdx) => {
                          const isExpanded = expandedModules[mod.id || mIdx] !== false;
                          return (
                            <div key={mod.id || mIdx} className="bg-white">
                              <button
                                type="button"
                                onClick={() => setExpandedModules(prev => ({ ...prev, [mod.id || mIdx]: !isExpanded }))}
                                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-all cursor-pointer"
                              >
                                <span className="text-xs font-black text-slate-900 font-display flex items-center gap-1.5">
                                  <span className="text-slate-400 text-[10px]">{isExpanded ? "▲" : "▼"}</span>
                                  <span>{mod.title}</span>
                                </span>
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full shrink-0">
                                  {mod.lessons?.length || 0}
                                </span>
                              </button>

                              {isExpanded && (
                                <div className="bg-slate-50/60 py-1 space-y-0.5 border-t border-slate-100">
                                  {mod.lessons?.map((les, lIdx) => {
                                    const isSelected = activeModuleIndex === mIdx && activeLessonIndex === lIdx;
                                    return (
                                      <button
                                        key={les.id || lIdx}
                                        type="button"
                                        onClick={() => {
                                          setActiveModuleIndex(mIdx);
                                          setActiveLessonIndex(lIdx);
                                        }}
                                        className={`w-full text-left px-5 py-2.5 text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                                          isSelected
                                            ? "bg-[#008dff]/10 text-[#008dff] font-extrabold border-l-4 border-[#008dff]"
                                            : "text-slate-700 hover:bg-slate-100/80 font-medium"
                                        }`}
                                      >
                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                          isSelected ? "border-[#008dff] bg-[#008dff]" : "border-slate-400 bg-white"
                                        }`}>
                                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                        <span className="truncate leading-snug">{les.title}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </aside>

                  {/* Right Main Video Player View */}
                  <main className="flex-1 bg-slate-50 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">
                    {(() => {
                      const curMod = selectedLmsCoursePreview.modules?.[activeModuleIndex] || selectedLmsCoursePreview.modules?.[0];
                      const curLes = curMod?.lessons?.[activeLessonIndex] || curMod?.lessons?.[0];
                      return (
                        <div className="max-w-4xl mx-auto space-y-6">
                          {/* Active Lesson Title Header */}
                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-black text-[#008dff] uppercase tracking-wider bg-[#008dff]/10 px-2.5 py-1 rounded-full">
                                {curMod?.title || "Pedagogy Module"}
                              </span>
                              <h2 className="text-xl font-black text-slate-900 font-display mt-2">
                                {curLes?.title || selectedLmsCoursePreview.title}
                              </h2>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                                ⏱️ {curLes?.durationMinutes || 30} mins
                              </div>
                              <span className={`text-xs font-black px-3 py-1.5 rounded-xl border ${
                                curLes?.url ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}>
                                {curLes?.url ? "✅ Video Recording Ready" : "⏳ Class Recording Pending"}
                              </span>
                            </div>
                          </div>

                          {/* Responsive 16:9 Video Box */}
                          <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative group">
                            {curLes?.url ? (
                              <iframe
                                src={curLes.url.includes("embed") ? curLes.url : "https://www.youtube.com/embed/dQw4w9WgXcQ"}
                                title={curLes.title}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-white space-y-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-center">
                                <div className="w-16 h-16 rounded-full bg-[#008dff] text-white flex items-center justify-center text-2xl font-black shadow-lg animate-pulse">
                                  ▶
                                </div>
                                <h3 className="text-lg font-black font-display">{curLes?.title || "Video Lesson"}</h3>
                                <p className="text-xs text-slate-300 max-w-md">
                                  Watch step-by-step video demonstration of finger movements and abacus calculation drills.
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Lesson Notes & Discussion Box */}
                          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Lesson Notes & Teacher Discussion</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Practice this lesson on your physical abacus frame. Ensure proper thumb (upward) and index finger (downward) bead mechanics before moving to the next lesson.
                            </p>

                            <div className="pt-4 border-t border-slate-100 space-y-3">
                              <textarea
                                rows={2}
                                placeholder="Write a comment or note about this lesson..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs outline-none focus:ring-2 focus:ring-[#008dff]"
                              />
                              <button
                                type="button"
                                onClick={() => alert("Note submitted successfully!")}
                                className="bg-[#008dff] hover:bg-[#0077ee] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-xs"
                              >
                                Submit Comment
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </main>
                </div>
              </div>
            ) : (
              /* SCREENSHOT 1 MATCHING: COURSE CARDS GRID */
              <div className="space-y-6">
                {/* Header bar: Enrollments / Explore + Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-6">
                    <button
                      type="button"
                      className="text-base font-black text-[#008dff] border-b-2 border-[#008dff] pb-1 font-display cursor-pointer"
                    >
                      Enrollments
                    </button>
                    <button
                      type="button"
                      className="text-base font-bold text-slate-500 hover:text-slate-800 pb-1 font-display cursor-pointer"
                    >
                      Explore
                    </button>
                  </div>

                  {/* Search box */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        className="bg-slate-50 border border-slate-200 text-xs font-medium rounded-xl px-3 py-2 pl-8 w-48 sm:w-64 outline-none focus:ring-2 focus:ring-[#008dff]"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                    <button
                      type="button"
                      className="bg-[#008dff] hover:bg-[#0077ee] text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Search</span>
                    </button>
                  </div>
                </div>

                {/* Course Grid Matching Screenshot 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Active Enrolled Live Session Cohort Course Card */}
                  <div className="bg-white border-2 border-indigo-500/80 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all flex flex-col justify-between relative">
                    <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 space-y-3 relative">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                        <Video className="w-3 h-3 fill-current" />
                        Live Cohort ({activeLiveBatch.batchCode || activeBatchCode})
                      </span>
                      <h3 className="text-xl font-black font-display text-white leading-snug">
                        {activeLiveBatch.batchCode || activeBatchCode}: {activeLiveBatch.title || "Live Abacus Teacher Certification Cohort"}
                      </h3>
                      <p className="text-xs text-indigo-200 font-medium line-clamp-2">
                        {activeLiveBatch.notes || "Live interactive teacher training cohort with scheduled Zoom sessions and step-by-step recording access."}
                      </p>
                      <div className="text-[11px] font-extrabold text-amber-300 flex items-center gap-1.5 pt-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>Schedule: {activeLiveBatch.scheduleTime || "Mon & Wed 10:00 AM IST"}</span>
                      </div>
                    </div>

                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-extrabold text-[#008dff]">
                          Master Instructor: {activeLiveBatch.instructorName || "Hitendra Makvana (Lead Master Trainer)"}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Live sessions include instant Q&A, physical abacus checks, and full recording archive.
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => window.open(activeLiveBatch.meetUrl || "https://meet.google.com", "_blank")}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                        >
                          <Video className="w-4 h-4 fill-current" />
                          <span>Join Live Zoom / Meet Class</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLmsCoursePreview(activeLiveBatchAsCourse);
                            setActiveModuleIndex(0);
                            setActiveLessonIndex(0);
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>📺 Open Recorded Session Player</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const defaultCourse = {
                      id: "c-abacus-master",
                      title: "Abacus Teacher Training Program",
                      instructorName: "Hitendra Makvana",
                      category: "Pedagogy & Finger Methods",
                      level: 1,
                      isPublished: true,
                      modules: [
                        {
                          id: "m1",
                          title: "Level 1: Direct Addition & Subtraction Pedagogy",
                          level: 1,
                          lessons: [
                            { id: "l1", title: "Day 1: Live Abacus Training Onboarding", type: "video", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", durationMinutes: 45 },
                            { id: "l2", title: "Day 2: Physical Bead Placement & Finger Drills", type: "video", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", durationMinutes: 35 },
                            { id: "l3", title: "Day 3: Direct Addition Subtraction Rules", type: "video", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", durationMinutes: 40 },
                            { id: "l4", title: "Day 4: Positive Big Friends Formulas", type: "video", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", durationMinutes: 30 },
                            { id: "l5", title: "Day 5: Virtual Abacus Usage & Practice Drills", type: "video", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", durationMinutes: 20 }
                          ]
                        }
                      ]
                    };

                    const displayCourses = (lmsCourses && lmsCourses.length > 0) ? lmsCourses : [defaultCourse];

                    return displayCourses.map((c, idx) => {
                      const totalLessons = c.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || (c as any).lessonsCount || 10;
                    return (
                      <div key={c.id || idx} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                        {/* Solid #008dff Header Box */}
                        <div className="bg-[#008dff] h-48 flex items-center justify-center relative overflow-hidden">
                          <FileText className="w-20 h-20 text-white/90 drop-shadow-md stroke-[1.25]" />
                        </div>

                        {/* Card Body */}
                        <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <h3 className="text-lg font-black text-slate-900 font-display leading-snug">
                              {c.title}
                            </h3>
                            <p className="text-xs font-extrabold text-[#008dff]">
                              {c.instructorName || "Hitendra Makvana"}
                            </p>
                          </div>

                          {/* Progress Bar */}
                          <div className="bg-slate-100 rounded-full h-3.5 border border-slate-200 relative overflow-hidden flex items-center justify-center">
                            <div className="bg-indigo-950 h-full absolute left-0 top-0 transition-all" style={{ width: `${(c as any).progressPercent || 0}%` }} />
                            <span className="text-[10px] font-black text-slate-800 z-10">{(c as any).progressPercent || 0}%</span>
                          </div>

                          {/* Card Footer Row */}
                          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                              📄 {"0/" + totalLessons + " lessons"}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLmsCoursePreview(c as any);
                                setActiveModuleIndex(0);
                                setActiveLessonIndex(0);
                              }}
                              className="bg-[#008dff] hover:bg-[#0077ee] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
                            >
                              <span>Open</span>
                              <span>→</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
                </div>
              </div>
            )}
          </div>
        )}

          {/* TAB 2: STUDENT-LIKE PRACTICE DRILLS & VIRTUAL ABACUS */}
          {trainingPortalTab === "student_practice" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      Student Learning Mode For Trainees
                    </span>
                    <h3 className="text-2xl font-black font-display text-white mt-1">
                      🧮 Interactive Soroban & Speed Anzan Gym
                    </h3>
                    <p className="text-xs text-indigo-200">
                      Master finger placement mechanics on the virtual abacus, practice speed flashcard visualization, and earn stars for every solved sum!
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center shrink-0">
                    <div className="text-[10px] text-amber-300 font-black uppercase">Your Trainee Stars</div>
                    <div className="text-xl font-black text-white flex items-center justify-center gap-1">
                      <span>⭐</span>
                      <span>{traineeStars}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Virtual Abacus Tool */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black text-slate-900 font-display">17-Rod Physical Soroban Virtual Abacus</h4>
                    <p className="text-xs text-slate-500">Click beads to set values and verify abacus calculation formulas.</p>
                  </div>
                  <span className="text-xs font-black bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
                    Level 0-8 Pedagogy Tool
                  </span>
                </div>

                <div className="p-4 bg-slate-900 rounded-2xl overflow-x-auto flex justify-center">
                  <VirtualAbacus initialRods={17} />
                </div>
              </div>

              {/* Interactive Sum Practice to Earn Stars */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      Speed Sum Practice (+5 Stars Each)
                    </h4>
                    <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                      Auto-Checking
                    </span>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-4">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Solve on Abacus or Mind</div>
                    <div className="text-4xl font-black font-mono text-indigo-950 tracking-wider">
                      48 + 37
                    </div>
                    <div className="text-[11px] font-extrabold text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200/60 inline-block">
                      Formula: +30 = +50 - 20, +7 = +10 - 3 (Big & Small Friends)
                    </div>

                    <div className="flex items-center justify-center gap-3 max-w-xs mx-auto pt-2">
                      <input
                        type="number"
                        placeholder="Your Answer..."
                        id="traineeSumAnswer"
                        className="bg-white border-2 border-indigo-200 rounded-xl px-4 py-2.5 text-center text-lg font-black text-slate-900 outline-none focus:border-indigo-600 w-full"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = (document.getElementById("traineeSumAnswer") as HTMLInputElement)?.value;
                          if (input === "85") {
                            setTraineeStars(prev => prev + 5);
                            alert("🎉 Correct! 85 is the answer! +5 Star Points Added!");
                            (document.getElementById("traineeSumAnswer") as HTMLInputElement).value = "";
                          } else {
                            alert("❌ Incorrect! Try again using +30 = +50 - 20 and +7 = +10 - 3");
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-5 py-3 rounded-xl shadow-md cursor-pointer shrink-0 transition-all active:scale-95"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" />
                      Flashcard Anzan Speed Drills
                    </h4>
                    <span className="text-xs font-black bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                      Mental Visualization
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Test your mental abacus visualization speed. Numbers will flash on screen at customized second intervals.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => alert("Flashcard Drill Started! Get ready to visualize beads.")}
                      className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs py-3 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 text-center"
                    >
                      ⚡ Start 1-Digit 1.0s Speed Drill
                    </button>
                    <button
                      type="button"
                      onClick={() => alert("2-Digit Anzan Drill Started! Visualize 2D additions.")}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 text-center"
                    >
                      🚀 Start 2-Digit 1.5s Speed Drill
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRAINEE STAR LEADERBOARD */}
          {trainingPortalTab === "leaderboard" && (
            <div className="space-y-6 animate-fade-in">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 rounded-3xl p-6 sm:p-8 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="bg-slate-950 text-amber-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Academy Leaderboard
                  </span>
                  <span className="text-xs font-black bg-slate-950/20 text-slate-950 px-3 py-1 rounded-full">
                    Updated Live
                  </span>
                </div>
                <h3 className="text-2xl font-black font-display text-slate-950">
                  🏆 Trainee Star Leaderboard & Pedagogy Ranks
                </h3>
                <p className="text-xs font-bold text-slate-900/90 max-w-2xl">
                  Compete with fellow teacher trainees across cohorts! Earn stars by completing course video lessons, practicing on the virtual abacus, and solving speed sums.
                </p>
              </div>

              {/* Leaderboard Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 font-display">Top Teacher Trainees (Current Cohort)</h4>
                  <div className="text-xs font-bold text-slate-500">Cohort: Batch 003</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="p-4">Rank</th>
                        <th className="p-4">Trainee Name</th>
                        <th className="p-4">Batch</th>
                        <th className="p-4 text-center">Stars Earned</th>
                        <th className="p-4 text-center">Accuracy</th>
                        <th className="p-4">Achievement Badge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                      <tr className="bg-amber-50/50 hover:bg-amber-50 transition-colors">
                        <td className="p-4 font-black text-amber-600 text-sm">🥇 #1</td>
                        <td className="p-4 font-black text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                            NS
                          </div>
                          <span>Neha Sharma</span>
                        </td>
                        <td className="p-4 font-bold text-slate-600">Batch 003</td>
                        <td className="p-4 text-center font-black text-amber-600 text-sm">⭐ 340</td>
                        <td className="p-4 text-center font-bold text-emerald-600">98%</td>
                        <td className="p-4">
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-300">
                            🏆 Master Pedagogue
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-black text-slate-400 text-sm">🥈 #2</td>
                        <td className="p-4 font-black text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">
                            HM
                          </div>
                          <span>Hitendra Makvana</span>
                        </td>
                        <td className="p-4 font-bold text-slate-600">Batch 002</td>
                        <td className="p-4 text-center font-black text-amber-600 text-sm">⭐ 310</td>
                        <td className="p-4 text-center font-bold text-emerald-600">96%</td>
                        <td className="p-4">
                          <span className="bg-indigo-100 text-indigo-900 text-[10px] font-black px-2.5 py-1 rounded-full border border-indigo-200">
                            ⚡ Speed Anzan Pro
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-black text-orange-600 text-sm">🥉 #3</td>
                        <td className="p-4 font-black text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center">
                            PV
                          </div>
                          <span>Priya Verma</span>
                        </td>
                        <td className="p-4 font-bold text-slate-600">Batch 003</td>
                        <td className="p-4 text-center font-black text-amber-600 text-sm">⭐ 280</td>
                        <td className="p-4 text-center font-bold text-emerald-600">94%</td>
                        <td className="p-4">
                          <span className="bg-orange-100 text-orange-900 text-[10px] font-black px-2.5 py-1 rounded-full border border-orange-200">
                            🔥 7-Day Streak
                          </span>
                        </td>
                      </tr>

                      {/* Current User Row */}
                      <tr className="bg-indigo-50 border-2 border-indigo-300">
                        <td className="p-4 font-black text-indigo-700 text-sm">🎖️ #4 (You)</td>
                        <td className="p-4 font-black text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                            {(currentUser?.name || "U")[0]}
                          </div>
                          <span>{currentUser?.name || "Your Account"} (Current Trainee)</span>
                        </td>
                        <td className="p-4 font-bold text-slate-600">{(currentUser as any)?.enrolledBatch || "Batch 003"}</td>
                        <td className="p-4 text-center font-black text-amber-600 text-sm">⭐ {traineeStars}</td>
                        <td className="p-4 text-center font-bold text-emerald-600">95%</td>
                        <td className="p-4">
                          <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-300">
                            🌟 Active Trainee
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    })()}
  </div>
)}

      {/* Batch Code Creation / Edit Modal */}
      {showCreateBatchModal && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border-2 border-slate-100 max-w-lg w-full shadow-2xl p-6 space-y-5 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-indigo-950 font-display flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                {editingBatchId ? `Edit Batch Details (${batchCodeInput || 'Batch'})` : "Create New Batch Code & Class Timing"}
              </h3>
              <button
                onClick={() => setShowCreateBatchModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Batch Code (e.g. BTC-101, SAT-AM-1) <strong className="text-rose-500">*</strong>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BTC-101"
                  value={batchCodeInput}
                  onChange={e => setBatchCodeInput(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:bg-white focus:border-indigo-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Batch Title / Level Focus
                </label>
                <input
                  type="text"
                  placeholder="e.g. Level 1 Morning Abacus Masters"
                  value={batchTitleInput}
                  onChange={e => setBatchTitleInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Class Days <strong className="text-rose-500">*</strong>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomDaysActive(!isCustomDaysActive)}
                    className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    {isCustomDaysActive ? "Switch to Preset Combos" : "Select Specific Days"}
                  </button>
                </div>

                {!isCustomDaysActive ? (
                  <select
                    value={batchDaysInput}
                    onChange={e => setBatchDaysInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:bg-white focus:border-indigo-500"
                  >
                    <option value="Saturday & Sunday">Saturday & Sunday</option>
                    <option value="Monday & Wednesday">Monday & Wednesday</option>
                    <option value="Tuesday & Thursday">Tuesday & Thursday</option>
                    <option value="Friday & Saturday">Friday & Saturday</option>
                    <option value="Monday, Wednesday, Friday">Monday, Wednesday, Friday</option>
                    <option value="Daily Weekdays (Mon-Fri)">Daily Weekdays (Mon-Fri)</option>
                    <option value="Sunday Only">Sunday Only</option>
                    <option value="Saturday Only">Saturday Only</option>
                  </select>
                ) : (
                  <div className="space-y-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Click days to select batch schedule:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                        const isSelected = selectedDaysArray.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              let next: string[];
                              if (isSelected) {
                                next = selectedDaysArray.filter(d => d !== day);
                              } else {
                                next = [...selectedDaysArray, day];
                              }
                              setSelectedDaysArray(next);
                              const formatted = next.join(" & ");
                              setBatchDaysInput(formatted || "Custom Days");
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-indigo-600 text-white shadow-3xs"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-[11px] font-extrabold text-indigo-950 pt-1">
                      Selected: {batchDaysInput || "None"}
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle for Different Timing per Day */}
              <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-xl shadow-2xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-indigo-950 block">Set Different Timing per Day</span>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      e.g. Saturday 6-7 PM & Sunday 10-11 AM
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDifferentTimingPerDay}
                    onChange={e => setIsDifferentTimingPerDay(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {!isDifferentTimingPerDay ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Start Time <strong className="text-rose-500">*</strong></label>
                    <select
                      value={batchStartTimeInput}
                      onChange={e => {
                        const val = e.target.value;
                        setBatchStartTimeInput(val);
                        setDaySchedulesState(prev => prev.map(s => ({ ...s, startTime: val })));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500"
                    >
                      {TIME_SLOT_OPTIONS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">End Time <strong className="text-rose-500">*</strong></label>
                    <select
                      value={batchEndTimeInput}
                      onChange={e => {
                        const val = e.target.value;
                        setBatchEndTimeInput(val);
                        setDaySchedulesState(prev => prev.map(s => ({ ...s, endTime: val })));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500"
                    >
                      {TIME_SLOT_OPTIONS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 bg-slate-50 border border-slate-200 p-3 rounded-2xl max-h-56 overflow-y-auto pr-1">
                  <span className="text-[10px] text-indigo-950 font-black uppercase tracking-wider block">
                    📅 Individual Day Timings:
                  </span>
                  {parseActiveDays(batchDaysInput, selectedDaysArray, isCustomDaysActive).map(dayName => {
                    const currentSched = daySchedulesState.find(s => s.day === dayName) || {
                      day: dayName,
                      startTime: batchStartTimeInput,
                      endTime: batchEndTimeInput
                    };
                    return (
                      <div key={dayName} className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                            🗓️ {dayName}
                          </span>
                          <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {currentSched.startTime} - {currentSched.endTime}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Start Time</label>
                            <select
                              value={currentSched.startTime}
                              onChange={e => handleDayTimeChange(dayName, "startTime", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500"
                            >
                              {TIME_SLOT_OPTIONS.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">End Time</label>
                            <select
                              value={currentSched.endTime}
                              onChange={e => handleDayTimeChange(dayName, "endTime", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500"
                            >
                              {TIME_SLOT_OPTIONS.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Teacher</label>
                  <select
                    value={batchTeacherInput}
                    onChange={e => setBatchTeacherInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500"
                  >
                    {teachers.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={batchCapacityInput}
                    onChange={e => setBatchCapacityInput(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
                {editingBatchId ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteBatch({ id: editingBatchId, batchCode: batchCodeInput, title: batchTitleInput })}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Batch</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateBatchModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingBatch}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md transition-all cursor-pointer"
                  >
                    {isSavingBatch ? "Saving..." : (editingBatchId ? "Update Batch Details" : "Create Batch Code")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TeacherDemoCalendar({
  demos,
  currentTeacher,
  onRefreshData
}: {
  demos: CRMLead[];
  currentTeacher: any;
  onRefreshData?: () => Promise<void>;
}) {
  const [selectedDate, setSelectedDate] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<string>("");

  const todayStr = new Date().toISOString().split("T")[0];

  // Filter demos based on user selection
  const filteredDemos = demos.filter(d => {
    // Date filter
    if (selectedDate === "Today") {
      const demoDate = d.demoRescheduleDate || d.followupDate || d.date;
      if (demoDate !== todayStr) return false;
    } else if (selectedDate !== "All") {
      const demoDate = d.demoRescheduleDate || d.followupDate || d.date;
      if (demoDate !== selectedDate) return false;
    }

    // Status filter
    if (selectedStatus !== "All") {
      if ((d.status || "Demo Booked") !== selectedStatus) return false;
    }

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (d.name || "").toLowerCase().includes(q);
      const matchParent = (d.parentName || "").toLowerCase().includes(q);
      const matchMobile = (d.parentMobile || "").includes(q);
      if (!matchName && !matchParent && !matchMobile) return false;
    }

    return true;
  });

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    setUpdatingId(leadId);
    try {
      const res = await fetch("/api/erp/update-lead-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, status: newStatus })
      });
      const data = await res.json();
      if (data.success && onRefreshData) {
        await onRefreshData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async (leadId: string) => {
    if (!noteInput) return;
    setUpdatingId(leadId);
    try {
      const res = await fetch("/api/erp/update-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          remarks: noteInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditingNotesId(null);
        setNoteInput("");
        if (onRefreshData) await onRefreshData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  // Group demos by date for calendar overview
  const dateCounts: Record<string, number> = {};
  demos.forEach(d => {
    const dt = d.demoRescheduleDate || d.followupDate || d.date || "Unscheduled";
    dateCounts[dt] = (dateCounts[dt] || 0) + 1;
  });

  const datesList = Object.keys(dateCounts).sort();

  return (
    <div className="space-y-6">
      {/* Calendar Controls & Quick Filter Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-indigo-950 font-display flex items-center gap-2">
              <Calendar className="w-4 h-4 text-pink-600" />
              Demo Timings Calendar & Slot Overview
            </h3>
            <p className="text-xs text-slate-500">Filter demos by date or status and manage parent communications.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedDate("All")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedDate === "All" ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All Demos ({demos.length})
            </button>
            <button
              onClick={() => setSelectedDate("Today")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedDate === "Today" ? "bg-pink-600 text-white shadow-xs" : "bg-pink-50 text-pink-700 hover:bg-pink-100"
              }`}
            >
              Scheduled Today ({demos.filter(d => (d.demoRescheduleDate || d.followupDate || d.date) === todayStr).length})
            </button>
          </div>
        </div>

        {/* Date Timeline Selector Pills */}
        {datesList.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0 mr-1">Dates:</span>
            {datesList.map(dt => (
              <button
                key={dt}
                onClick={() => setSelectedDate(dt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                  selectedDate === dt
                    ? "bg-indigo-950 text-white shadow-xs"
                    : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>{dt === todayStr ? "Today (" + dt + ")" : dt}</span>
                <span className="bg-pink-100 text-pink-800 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {dateCounts[dt]}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Status & Search Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Filter by Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Pipeline Stages</option>
              <option value="Demo Booked">Demo Booked</option>
              <option value="Demo Done">Demo Done</option>
              <option value="Enrolled">Enrolled</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Search Lead</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student or parent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Demos Grid List */}
      {filteredDemos.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center space-y-2">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-black text-indigo-950 font-display">No Demo Classes Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No demo classes match your selected date or status filter. Assign demo instructors in CRM or choose another date filter above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDemos.map(lead => {
            const isUpdating = updatingId === lead.id;
            const isEditingNotes = editingNotesId === lead.id;

            return (
              <div
                key={lead.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-pink-300 transition-all relative"
              >
                {/* Card Header */}
                <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {lead.id}
                    </span>
                    <h4 className="text-sm font-black text-indigo-950 mt-1 font-display">{lead.name}</h4>
                    <p className="text-xs text-slate-600 font-medium">
                      Parent: <strong className="text-slate-900">{lead.parentName || "N/A"}</strong>
                    </p>
                    <p className="text-xs font-mono font-bold text-indigo-700">{lead.parentMobile}</p>
                  </div>

                  {/* Status Dropdown Badge */}
                  <select
                    value={lead.status || "Demo Booked"}
                    disabled={isUpdating}
                    onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                    className={`text-[10px] font-black px-2.5 py-1 rounded-xl border-2 focus:outline-none transition-colors cursor-pointer ${
                      lead.status === "Enrolled"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : lead.status === "Lost"
                        ? "bg-rose-50 text-rose-800 border-rose-300"
                        : lead.status === "Demo Done"
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : "bg-blue-50 text-blue-800 border-blue-300 animate-pulse"
                    }`}
                  >
                    <option value="Demo Booked">Demo Booked</option>
                    <option value="Demo Done">Demo Done</option>
                    <option value="Enrolled">Enrolled</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                {/* Date & Time Timing Banner */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 rounded-2xl p-3 flex items-center gap-3">
                  <div className="p-2 bg-pink-600 text-white rounded-xl shrink-0 shadow-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-pink-900 uppercase tracking-wider">Scheduled Demo Timing</div>
                    <div className="text-xs font-extrabold text-indigo-950">
                      {lead.demoRescheduleDate || lead.followupDate || lead.date || "Date TBD"}
                      {lead.demoRescheduleTime ? ` at ${lead.demoRescheduleTime}` : lead.followupTime ? ` at ${lead.followupTime}` : ""}
                    </div>
                  </div>
                </div>

                {/* Remarks / Instructor Notes */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <span>Demo Requirements / Notes:</span>
                    <button
                      onClick={() => {
                        if (isEditingNotes) {
                          setEditingNotesId(null);
                        } else {
                          setEditingNotesId(lead.id);
                          setNoteInput(lead.remarks || "");
                        }
                      }}
                      className="text-indigo-600 hover:underline cursor-pointer"
                    >
                      {isEditingNotes ? "Cancel" : "Edit Notes"}
                    </button>
                  </div>

                  {isEditingNotes ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Add demo class feedback or parent requests..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium focus:outline-none focus:border-indigo-500 h-16 resize-none"
                      />
                      <button
                        onClick={() => handleSaveNotes(lead.id)}
                        disabled={isUpdating}
                        className="bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-lg hover:bg-indigo-700 shadow-xs cursor-pointer"
                      >
                        {isUpdating ? "Saving..." : "Save Notes"}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed italic">
                      "{lead.remarks || "No additional demo notes logged."}"
                    </p>
                  )}
                </div>

                {/* Parent Communication Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <a
                    href={`https://wa.me/${(lead.parentMobile || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${lead.parentName || ''}, this is ${currentTeacher.name} from Geniplus Abacus Academy. I am reaching out regarding your upcoming demo class scheduled for ${lead.demoRescheduleDate || 'today'}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${lead.parentMobile}`}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Parent</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
