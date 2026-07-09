import React, { useState, useEffect } from "react";
import { Student, AttendanceRecord, HomeworkRecord, ExamRecord, Teacher, FeeRecord, Center, CRMLead } from "../types";
import { Sparkles, CalendarCheck, BookOpen, GraduationCap, CheckCircle2, FileText, Award, HelpCircle, Loader2, Target, Trophy, Send, TrendingUp, Key, UserPlus, RefreshCw, LogOut, ChevronRight, Search, AlertTriangle, Clock, ArrowUpRight, Check, Star, Users, MapPin, MessageSquare } from "lucide-react";
import CrmView from "./CrmView";
import ConceptWorksheetManager from "./ConceptWorksheetManager";
import PracticeGeneratorView from "./PracticeGeneratorView";

interface TeacherViewProps {
  teachers?: Teacher[];
  students: Student[];
  fees?: FeeRecord[];
  attendance: AttendanceRecord[];
  homework: HomeworkRecord[];
  exams: ExamRecord[];
  onMarkAttendance: (records: any[]) => void;
  onPayFee: (feeId: string) => void;
  onAddStudent: (payload: any) => Promise<void>;
  centers?: Center[];
  leads?: CRMLead[];
  onAddLead?: (lead: Partial<CRMLead>) => void;
  onRefreshData?: () => Promise<void>;
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
  onRefreshData
}: TeacherViewProps) {
  // Teacher credentials state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("teacher_is_logged_in") === "true";
  });
  const [loggedInTeacherId, setLoggedInTeacherId] = useState<string>(() => {
    return localStorage.getItem("teacher_logged_in_id") || "T001";
  });

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Match the active logged in instructor
  const currentTeacher = (teachers.find(t => t.id === loggedInTeacherId) || teachers[0] || { id: "T001", centerId: "C001", name: "Sunitha Rao", email: "sunitha@geniplus.com", role: "Trainer" }) as Teacher;
  const teacherStudents = students.filter(s => s.teacherId === currentTeacher.id);

  // Academy student list and top student calculations
  const academyStudents = students.filter(s => s.centerId === currentTeacher.centerId);
  const getAcademyTopStudent = () => {
    if (!academyStudents || academyStudents.length === 0) return null;
    const sorted = [...academyStudents].sort((a, b) => b.currentLevel - a.currentLevel);
    return sorted[0];
  };
  const academyTopStudent = getAcademyTopStudent();
  const academyName = centers.find(c => c.id === currentTeacher.centerId)?.name || "My Abacus Academy Center";

  // Practice & Accuracy Manager States
  const [practiceAssignments, setPracticeAssignments] = useState<any[]>([]);
  const [practiceSubmissions, setPracticeSubmissions] = useState<any[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Form states for assigning a new practice drill
  const [assignScope, setAssignScope] = useState<"student" | "level" | "batch">("student");
  const [assignStudent, setAssignStudent] = useState(teacherStudents[0]?.id || "");
  const [assignLevel, setAssignLevel] = useState<number>(1);
  const [assignBatch, setAssignBatch] = useState<string>("Sat 10:00 AM");
  const [assignTitle, setAssignTitle] = useState("Daily Abacus Speed Challenge");
  const [assignType, setAssignType] = useState<"Addition" | "Subtraction" | "Multiplication" | "Division">("Addition");
  const [assignSums, setAssignSums] = useState(30);
  const [assignDigits, setAssignDigits] = useState(1);
  const [assignRows, setAssignRows] = useState(4);
  const [assignFocus, setAssignFocus] = useState("Keep fingers close to the beam. Maintain visual speed rhythm.");
  const [assignDueDate, setAssignDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // tomorrow
    return d.toISOString().split("T")[0];
  });

  // Student Enrollment Form States
  const [enrollName, setEnrollName] = useState("");
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrollParentName, setEnrollParentName] = useState("");
  const [enrollParentMobile, setEnrollParentMobile] = useState("");
  const [enrollLevel, setEnrollLevel] = useState(1);
  const [enrollBatch, setEnrollBatch] = useState("Sat 10:00 AM");
  const [enrollAge, setEnrollAge] = useState(8);
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Student Batch Update States
  const [batchTargetStudent, setBatchTargetStudent] = useState("");
  const [batchTargetSchedule, setBatchTargetSchedule] = useState("Sat 10:00 AM");
  const [batchLoading, setBatchLoading] = useState(false);

  // Student Level Update States
  const [levelTargetStudent, setLevelTargetStudent] = useState("");
  const [levelTargetNum, setLevelTargetNum] = useState(1);
  const [levelLoading, setLevelLoading] = useState(false);

  // List of all active batches across this center to register or select from
  const [allBatches, setAllBatches] = useState<string[]>(["Sat 10:00 AM", "Sun 11:30 AM", "Sat 2:00 PM", "Wed 5:00 PM"]);
  const [newBatchName, setNewBatchName] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "worksheets">("dashboard");

  // Synchronize assignStudent with dynamic roster changes
  useEffect(() => {
    if (teacherStudents.length > 0) {
      setAssignStudent(teacherStudents[0].id);
      setProgressStudent(teacherStudents[0].id);
      setBatchTargetStudent(teacherStudents[0].id);
      setLevelTargetStudent(teacherStudents[0].id);
    }
  }, [loggedInTeacherId, students]);

  // Student Search & Level Timeline tracking states
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("All");
  const [selectedRosterFilter, setSelectedRosterFilter] = useState<"All" | "My Students">("My Students");
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<"All" | "On Track" | "Near Completion" | "Red Zone">("All");

  const getStudentMilestones = (s: Student) => {
    const today = new Date("2026-07-08"); // Consistent local date
    const join = new Date(s.joiningDate);
    const msDiff = today.getTime() - join.getTime();
    const totalWeeks = Math.max(0, Math.floor(msDiff / (7 * 24 * 60 * 60 * 1000)));
    
    // Each level normally takes 3 months (12 weeks)
    const completedLevels = s.currentLevel - 1;
    const previousLevelsWeeksCount = completedLevels * 12;
    const weeksInCurrentLevel = Math.max(0, totalWeeks - previousLevelsWeeksCount);
    
    // Level start date
    const currentLevelStart = new Date(join);
    currentLevelStart.setDate(currentLevelStart.getDate() + (previousLevelsWeeksCount * 7));
    
    // Exam target date is 12 weeks from level start
    const examWeekDate = new Date(currentLevelStart);
    examWeekDate.setDate(examWeekDate.getDate() + (12 * 7));
    
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
    
    return {
      totalWeeks,
      weeksInCurrentLevel,
      currentLevelStart: currentLevelStart.toISOString().split("T")[0],
      examWeekDate: examWeekDate.toISOString().split("T")[0],
      zone,
      paidCount: paidInvoices.length,
      unpaidCount: unpaidInvoices.length,
      lastPaidMonth: lastPaidLevelFee ? lastPaidLevelFee.month : "None",
      lastPaidDate: lastPaidLevelFee ? lastPaidLevelFee.paidDate : "—",
      unpaidAmount: unpaidInvoices.reduce((sum, f) => sum + (f.amount - f.discount), 0)
    };
  };

  // Extract unique batches dynamically
  const uniqueBatches = Array.from(new Set(teacherStudents.map(s => s.batch || "Sat 10:00 AM")));
  // Unique levels
  const uniqueLevels = [1, 2, 3, 4, 5, 6, 7, 8];

  const fetchTeacherPracticeData = async () => {
    try {
      const res = await fetch("/api/erp/data");
      const json = await res.json();
      if (json.success) {
        setPracticeAssignments(json.data.practiceAssignments || []);
        setPracticeSubmissions(json.data.practiceSubmissions || []);
      }
    } catch (e) {
      console.error("Failed fetching teacher practice data", e);
    }
  };

  useEffect(() => {
    fetchTeacherPracticeData();
  }, [students]);

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
      const matching = teacherStudents.filter(s => s.batch === assignBatch);
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
          type: assignType
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
  const [attStatuses, setAttStatuses] = useState<Record<string, "Present" | "Absent">>({});
  const [attendanceLoggedToday, setAttendanceLoggedToday] = useState(false);

  useEffect(() => {
    const initial: Record<string, "Present" | "Absent"> = {};
    teacherStudents.forEach(s => {
      initial[s.id] = "Present";
    });
    setAttStatuses(initial);
  }, [loggedInTeacherId, students]);

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
        batch: enrollBatch,
        age: Number(enrollAge),
        teacherId: currentTeacher.id,
        centerId: currentTeacher.centerId || "C001"
      });
      alert(`Success! Enrolled ${enrollName} in Level ${enrollLevel} (${enrollBatch}) under your roster.`);
      setEnrollName("");
      setEnrollEmail("");
      setEnrollParentName("");
      setEnrollParentMobile("");
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
        body: JSON.stringify({ studentId: batchTargetStudent, batch: batchTargetSchedule })
      });
      const data = await res.json();
      if (data.success) {
        alert("Batch assigned successfully!");
        setBatchTargetStudent("");
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
      const res = await fetch("/api/erp/update-student-level", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: levelTargetStudent, level: levelTargetNum })
      });
      const data = await res.json();
      if (data.success) {
        alert("Course learning level updated successfully!");
        setLevelTargetStudent("");
      } else {
        alert("Failed to update level: " + data.error);
      }
    } catch (err: any) {
      alert("Error updating course level: " + err.message);
    } finally {
      setLevelLoading(false);
    }
  };

  const handleAddBatchName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newBatchName.trim();
    if (!clean) return;
    if (allBatches.includes(clean)) {
      alert("Batch schedule already exists.");
      return;
    }
    setAllBatches(prev => [...prev, clean]);
    alert(`Batch schedule "${clean}" is now registered as an available option!`);
    setNewBatchName("");
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
    setAttStatuses(prev => ({
      ...prev,
      [studentId]: prev[studentId] === "Present" ? "Absent" : "Present"
    }));
  };

  const handleSubmitAttendance = () => {
    const payload = teacherStudents.map(s => ({
      studentId: s.id,
      status: attStatuses[s.id],
      level: s.currentLevel,
      batch: s.batch
    }));
    onMarkAttendance(payload);
    setAttendanceLoggedToday(true);
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
      const res = await fetch("/api/erp/send-student-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          title: "Tuition Fee Outstanding Reminder",
          message: `Dear Parent, please note that ₹${amount} is outstanding for Level ${currentLevel} tuition fees. Kindly pay via UPI / Bank and submit proof.`,
          type: "payment"
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Success! In-app notification reminder sent to ${studentName}'s parent dashboard.`);
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

  if (!isLoggedIn) {
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

        <div className="border-t border-slate-100 pt-5 text-left">
          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2.5">Demo Teacher Profiles (1-Click Login)</span>
          <div className="grid grid-cols-1 gap-2">
            {[
              { name: "Sunitha Rao", email: "sunitha@geniplus.com" },
              { name: "Meera Nair", email: "meera@geniplus.com" },
              { name: "Deepa Hegde", email: "deepa@geniplus.com" }
            ].map(teacher => (
              <button
                key={teacher.email}
                onClick={() => {
                  setEmailInput(teacher.email);
                  setPasswordInput("password123");
                }}
                className="w-full bg-slate-50 hover:bg-indigo-50 hover:border-indigo-150 border border-slate-200 rounded-xl p-2.5 text-left text-xs font-semibold text-slate-700 flex justify-between items-center transition-all group"
              >
                <div>
                  <div className="text-indigo-950 group-hover:text-indigo-600 font-bold">{teacher.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{teacher.email}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="teacher-view">
      
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
        <button
          onClick={handleTeacherLogout}
          className="bg-indigo-800 hover:bg-rose-700 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-200 flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out / Lock Portal</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs inside Teacher Portal */}
      <div className="flex border-b border-slate-200 gap-2 print:hidden mb-4">
        <button
          onClick={() => setActiveSubTab("dashboard")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all rounded-t-2xl border-t-2 border-x-2 outline-none ${
            activeSubTab === "dashboard"
              ? "bg-white border-slate-200 border-b-transparent text-indigo-600 font-extrabold shadow-sm"
              : "bg-slate-50/50 border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Classroom & Attendance Dashboard</span>
        </button>
        <button
          onClick={() => setActiveSubTab("worksheets")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all rounded-t-2xl border-t-2 border-x-2 outline-none ${
            activeSubTab === "worksheets"
              ? "bg-white border-slate-200 border-b-transparent text-indigo-600 font-extrabold shadow-sm"
              : "bg-slate-50/50 border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Printable Worksheet Generator</span>
        </button>
      </div>

      {activeSubTab === "dashboard" && (
        <div className="space-y-8">

          {/* Teacher & Academy Metrics Highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs col-span-2">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Academy Top Performer ⭐</div>
          {academyTopStudent ? (
            <div className="flex items-center gap-2.5 mt-1">
              <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center font-black text-xs shrink-0 animate-bounce">
                L{academyTopStudent.currentLevel}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black text-indigo-950 truncate">{academyTopStudent.studentName}</div>
                <div className="text-[10px] text-slate-400 truncate">Outstanding milestones inside {academyName}</div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-2 italic">No active top student recorded in this center.</div>
          )}
        </div>
      </div>

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
            {students.filter(s => {
              if (s.teacherId !== currentTeacher.id) return false;
              const milestones = getStudentMilestones(s);
              return milestones.zone === "Red Zone";
            }).length > 0 && (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-xl text-xs font-bold animate-pulse">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  {students.filter(s => {
                    if (s.teacherId !== currentTeacher.id) return false;
                    const milestones = getStudentMilestones(s);
                    return milestones.zone === "Red Zone";
                  }).length} Students in Red Zone (Overdue)
                </span>
              </div>
            )}
            <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-mono font-bold uppercase">
              Filtered: {
                students.filter(s => {
                  if (selectedRosterFilter === "My Students" && s.teacherId !== currentTeacher.id) {
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
              } of {students.length}
            </span>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold">
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
              <option value="My Students">My Students Only ({teacherStudents.length})</option>
              <option value="All">All Center Students ({students.length})</option>
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
              {Array.from(new Set(students.map(s => s.batch || "Sat 10:00 AM"))).map(b => (
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
        {students.filter(s => {
          if (selectedRosterFilter === "My Students" && s.teacherId !== currentTeacher.id) {
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
            <div className="text-xs font-bold">No students match your active filters or search phrase.</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Try resetting the filters or typing a different keyword.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.filter(s => {
              if (selectedRosterFilter === "My Students" && s.teacherId !== currentTeacher.id) {
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
                  className={`relative rounded-2xl border-2 p-5 flex flex-col justify-between transition-all hover:shadow-md ${
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
                        <h4 className="text-sm font-extrabold text-indigo-950 font-display mt-1.5">
                          {student.studentName}
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

                    <div className="text-[11px] text-slate-500 space-y-1 mt-3">
                      <div className="flex justify-between">
                        <span>Current Level:</span>
                        <span className="font-bold text-slate-800">Level {student.currentLevel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Batch Time:</span>
                        <span className="font-bold text-slate-800">{student.batch}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Started Level:</span>
                        <span className="font-mono text-slate-700">{stats.currentLevelStart}</span>
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
                              const messageText = `Dear Parent, this is My Abacus Academy. Please note that Level ${student.currentLevel} tuition fee of ₹${stats.unpaidAmount} is currently due for ${student.studentName}. Kindly make payment via UPI ID or use your student dashboard to scan the QR code. Thank you!`;
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
        <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-indigo-600" />
                  Daily Batch Attendance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Assigned Instructor: <strong>{currentTeacher.name}</strong></p>
              </div>
              <div className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg px-2.5 py-1">
                Date: {new Date().toISOString().split("T")[0]}
              </div>
            </div>

            <div className="space-y-3">
              {teacherStudents.map(student => (
                <div key={student.id} className="flex justify-between items-center border border-gray-100 bg-gray-50 rounded-xl p-3">
                  <div>
                    <div className="text-sm font-bold text-gray-900 font-display">{student.studentName}</div>
                    <div className="text-xs text-gray-500 flex gap-2 mt-1">
                      <span>Level {student.currentLevel}</span>
                      <span>•</span>
                      <span>{student.batch}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-400">{student.id}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleAttendance(student.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      attStatuses[student.id] === "Present"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                    id={`att-toggle-${student.id}`}
                  >
                    {attStatuses[student.id]}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-400">
              {attendanceLoggedToday ? "✓ Daily attendance synced with database" : "Please confirm and submit attendance"}
            </div>
            <button
              onClick={handleSubmitAttendance}
              disabled={attendanceLoggedToday}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                attendanceLoggedToday
                  ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
              }`}
              id="submit-attendance-btn"
            >
              {attendanceLoggedToday ? "Attendance Submitted" : "Submit Attendance Logs"}
            </button>
          </div>
        </div>

        {/* Academic Records summary (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
          <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            Active Academic Records
          </h3>
          <p className="text-xs text-slate-500 mb-6">Track historical milestones, homework completions, and exam grades for your class.</p>

          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Latest Homework Assignment
              </div>
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Aarav Rajesh:</span>
                  <span className="text-emerald-600 font-semibold">Completed (Score A)</span>
                </div>
                <div className="flex justify-between">
                  <span>Ananya Pillai:</span>
                  <span className="text-emerald-600 font-semibold">Completed (Score B+)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                Latest Exam Scores
              </div>
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Aarav Rajesh:</span>
                  <span className="font-semibold text-gray-800">85/100 (Level 2 Unit Test)</span>
                </div>
                <div className="flex justify-between">
                  <span>Ananya Pillai:</span>
                  <span className="font-semibold text-gray-800">92/100 (Level 3 Monthly Exam)</span>
                </div>
              </div>
            </div>
          </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Card 1: Fast Track Enrollment Form (5 cols) */}
          <form onSubmit={handleEnrollStudent} className="lg:col-span-5 bg-slate-50/50 rounded-2xl p-5 border border-slate-150 space-y-4">
            <h4 className="text-xs font-black text-indigo-950 font-display uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              1. Fast-Track Student Enrollment
            </h4>

            <div className="grid grid-cols-1 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Student Name</label>
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
                  <label className="block font-bold text-slate-500 mb-1">Age</label>
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
                  <label className="block font-bold text-slate-500 mb-1">Parent Mobile</label>
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
                <label className="block font-bold text-slate-500 mb-1">Parent / Guardian Name</label>
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
                <label className="block font-bold text-slate-500 mb-1">Student Personal Email (Login ID)</label>
                <input
                  type="email"
                  placeholder="neil@gmail.com (Optional)"
                  value={enrollEmail}
                  onChange={(e) => setEnrollEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Admitted Level</label>
                  <select
                    value={enrollLevel}
                    onChange={(e) => setEnrollLevel(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(l => (
                      <option key={l} value={l}>Level {l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">Timetable Batch</label>
                  <select
                    value={enrollBatch}
                    onChange={(e) => setEnrollBatch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    {allBatches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Select Student</label>
                  <select
                    value={batchTargetStudent}
                    onChange={(e) => setBatchTargetStudent(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none"
                  >
                    <option value="">-- Choose Student --</option>
                    {teacherStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.studentName} ({s.batch})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">New Timetable Batch</label>
                  <select
                    value={batchTargetSchedule}
                    onChange={(e) => setBatchTargetSchedule(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none"
                  >
                    {allBatches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Select Student</label>
                  <select
                    value={levelTargetStudent}
                    onChange={(e) => setLevelTargetStudent(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none"
                  >
                    <option value="">-- Choose Student --</option>
                    {teacherStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.studentName} (Lvl {s.currentLevel})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">New Course Learning Level</label>
                  <select
                    value={levelTargetNum}
                    onChange={(e) => setLevelTargetNum(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(l => (
                      <option key={l} value={l}>Level {l} (Arithmetic)</option>
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
                  <span>Confirm Course Level Promotion</span>
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

          </div>

        </div>
      </div>

      {/* Reusable Digital Practice Concept Worksheet Manager for Level 1 */}
      <ConceptWorksheetManager
        currentTeacher={currentTeacher}
        students={students}
        onRefreshData={onRefreshData}
      />

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
                const accuracy = Math.round((sub.correctCount / sub.totalCount) * 100) || 0;
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
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-2">
                        <span>Level {sub.level}</span>
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
                        {sub.correctCount} <span className="text-xs text-slate-400">/ {sub.totalCount} correct</span>
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
                    const count = teacherStudents.filter(s => s.batch === b).length;
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
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(l => (
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
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(l => (
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
          <CrmView leads={leads} onAddLead={onAddLead} />
        </div>
      )}

        </div>
      )}

      {activeSubTab === "worksheets" && (
        <div className="space-y-4 animate-fade-in">
          <PracticeGeneratorView />
        </div>
      )}

    </div>
  );
}
