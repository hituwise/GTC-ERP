import React, { useState, useEffect } from "react";
import { Center, Teacher, Student, CRMLead, AttendanceRecord, FeeRecord, ExpenseRecord, HomeworkRecord, ExamRecord, StudentPracticeAssignment, StudentPracticeSubmission, AcademyLeaderboardEntry } from "./types";
import SuperAdminView from "./components/SuperAdminView";
import CenterAdminView from "./components/CenterAdminView";
import TeacherView from "./components/TeacherView";
import CrmView from "./components/CrmView";
import PracticeGeneratorView from "./components/PracticeGeneratorView";
import DeveloperBlueprintView from "./components/DeveloperBlueprintView";
import StudentPortalView from "./components/StudentPortalView";
import { LayoutDashboard, Users, GraduationCap, PhoneCall, Sparkles, Database, Shield, BookOpen, UserCheck, Settings, RefreshCw, LogIn, Trophy, LogOut, Lock, Mail, User, Camera, Clipboard, Check } from "lucide-react";

export default function App() {
  // Master SaaS User Roles Switcher
  type Role = "Super Admin" | "Center Admin" | "Teacher" | "Marketing / Sales Staff" | "Abacus Content Engine" | "Developer Blueprint" | "Student";

  // Unified Centralized Authentication State
  interface LoggedInUser {
    role: Role;
    email: string;
    id?: string;
    name: string;
    photo?: string;
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

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Profile & Security states
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
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

  const [loading, setLoading] = useState(true);

  // Fetch initial mock datasets from the Express/Vite backend database
  const loadData = async () => {
    try {
      const res = await fetch("/api/erp/data");
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setCenters(d.centers);
        setTeachers(d.teachers);
        setStudents(d.students);
        setLeads(d.leads);
        setAttendance(d.attendance);
        setFees(d.fees);
        setExpenses(d.expenses);
        setHomework(d.homework);
        setExams(d.exams);
        setPracticeAssignments(d.practiceAssignments || []);
        setPracticeSubmissions(d.practiceSubmissions || []);
        setLeaderboard(d.leaderboard || []);
      }
    } catch (err) {
      console.error("Failed to fetch initial multi-tenant datasets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      }
    } catch (e) {
      console.error("Failed adding teacher", e);
    }
  };

  const handleAddStudent = async (payload: Partial<Student>) => {
    try {
      const res = await fetch("/api/erp/add-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setStudents(prev => [...prev, data.student]);
      }
    } catch (e) {
      console.error("Failed adding student", e);
    }
  };

  const handleAddLead = async (payload: Partial<CRMLead>) => {
    try {
      const res = await fetch("/api/erp/add-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => [...prev, data.lead]);
      }
    } catch (e) {
      console.error("Failed adding CRM lead", e);
    }
  };

  const handleMarkAttendance = async (records: any[]) => {
    try {
      const res = await fetch("/api/erp/add-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records })
      });
      const data = await res.json();
      if (data.success) {
        // Sync local
        const today = new Date().toISOString().split("T")[0];
        setAttendance(prev => {
          const filtered = prev.filter(a => !(a.date === today && records.some(r => r.studentId === a.studentId)));
          const newRecs = records.map(r => ({
            studentId: r.studentId,
            date: today,
            status: r.status as "Present" | "Absent",
            level: r.level,
            batch: r.batch
          }));
          return [...filtered, ...newRecs];
        });
      }
    } catch (e) {
      console.error("Failed logging attendance", e);
    }
  };

  const handlePayFee = async (feeId: string) => {
    try {
      const res = await fetch("/api/erp/pay-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeId })
      });
      const data = await res.json();
      if (data.success) {
        setFees(prev =>
          prev.map(f => f.id === feeId ? { ...f, status: "Paid", paidDate: new Date().toISOString().split("T")[0] } : f)
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
        return data.fee;
      }
    } catch (e) {
      console.error("Failed adding fee invoice", e);
    }
  };

  const handleDeleteFee = async (feeId: string) => {
    try {
      const res = await fetch("/api/erp/delete-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeId })
      });
      const data = await res.json();
      if (data.success) {
        setFees(prev => prev.filter(f => f.id !== feeId));
      }
    } catch (e) {
      console.error("Failed deleting fee invoice", e);
    }
  };

  const handleOpenProfileModal = () => {
    if (!currentUser) return;
    setProfileName(currentUser.name);
    setProfilePhoto(currentUser.photo || "");
    
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
          photo: profilePhoto
        })
      });
      const data = await res.json();
      if (data.success) {
        // Update current logged in state
        const updated = {
          ...currentUser,
          name: profileName,
          photo: profilePhoto
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

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size exceeds 2MB limit. Please upload a smaller image.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
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

  const handleCentralLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSubmitting(true);

    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword;

    setTimeout(() => {
      let matchedUser: LoggedInUser | null = null;

      // 1. Check Super Admin (genipluskids@gmail.com)
      if (email === "genipluskids@gmail.com" && password === "geniplus@2026") {
        matchedUser = {
          role: "Super Admin",
          email: "genipluskids@gmail.com",
          name: "Geniplus Owner",
          id: "SUPER_01"
        };
      } else if (email === "admin@geniplus.com" && password === "password123") {
        matchedUser = {
          role: "Super Admin",
          email: "admin@geniplus.com",
          name: "Super Admin (Demo)",
          id: "SUPER_00"
        };
      }
      // 2. Check Center Admins
      else {
        const foundCenter = centers.find(c => c.email.toLowerCase() === email);
        if (foundCenter && password === "password123") {
          matchedUser = {
            role: "Center Admin",
            email: foundCenter.email,
            name: foundCenter.ownerName,
            id: foundCenter.id
          };
        }
      }

      // 3. Check Teachers
      if (!matchedUser) {
        const foundTeacher = teachers.find(t => t.email.toLowerCase() === email);
        if (foundTeacher && (password === foundTeacher.password || password === "password123")) {
          matchedUser = {
            role: "Teacher",
            email: foundTeacher.email,
            name: foundTeacher.name,
            id: foundTeacher.id
          };
        }
      }

      // 4. Check Students
      if (!matchedUser) {
        const foundStudent = students.find(s => s.email.toLowerCase() === email);
        if (foundStudent && (password === foundStudent.password || password === "password123")) {
          matchedUser = {
            role: "Student",
            email: foundStudent.email,
            name: foundStudent.studentName,
            id: foundStudent.id
          };
        }
      }

      // 5. Check other roles
      if (!matchedUser) {
        if (email === "marketing@geniplus.com" && password === "password123") {
          matchedUser = {
            role: "Marketing / Sales Staff",
            email: "marketing@geniplus.com",
            name: "Senior Marketer",
            id: "M001"
          };
        } else if (email === "generator@geniplus.com" && password === "password123") {
          matchedUser = {
            role: "Abacus Content Engine",
            email: "generator@geniplus.com",
            name: "Content Engine Expert",
            id: "G001"
          };
        } else if (email === "developer@geniplus.com" && password === "password123") {
          matchedUser = {
            role: "Developer Blueprint",
            email: "developer@geniplus.com",
            name: "Dev Blueprint Architect",
            id: "D001"
          };
        }
      }

      if (matchedUser) {
        setCurrentUser(matchedUser);
        setCurrentRole(matchedUser.role);
        localStorage.setItem("erp_logged_in_user", JSON.stringify(matchedUser));

        // Sync old localized view logins to avoid double logins inside views:
        if (matchedUser.role === "Super Admin") {
          localStorage.setItem("superadmin_is_logged_in", "true");
        } else if (matchedUser.role === "Center Admin") {
          localStorage.setItem("centeradmin_is_logged_in", "true");
        } else if (matchedUser.role === "Teacher") {
          localStorage.setItem("teacher_is_logged_in", "true");
          localStorage.setItem("teacher_logged_in_id", matchedUser.id || "T001");
        } else if (matchedUser.role === "Student") {
          localStorage.setItem("student_is_logged_in", "true");
          localStorage.setItem("student_logged_in_id", matchedUser.id || "S001");
        }

        setLoginEmail("");
        setLoginPassword("");
      } else {
        setLoginError("Invalid email or password. Please verify and try again.");
      }
      setLoginSubmitting(false);
    }, 450);
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="text-sm font-semibold text-gray-500 font-display">Initializing My Abacus Academy Cloud ERP...</span>
      </div>
    );
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
            <div className="inline-flex w-14 h-14 bg-amber-400 rounded-2xl items-center justify-center font-black text-slate-950 text-2xl shadow-lg shadow-amber-400/20 mb-2">
              G+
            </div>
            <h2 className="text-2xl font-black text-white font-display tracking-tight">My Abacus Academy</h2>
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

                <div className="text-right">
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

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col text-gray-800 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Professional Signed In Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 print:hidden sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center font-black text-slate-950 text-xl shadow-md shrink-0">
              G+
            </div>
            <div>
              <h1 className="text-lg font-black font-display leading-tight tracking-tight text-white flex items-center gap-2">
                Geniplus <span className="text-[10px] px-2 py-0.5 bg-indigo-900 text-indigo-300 rounded-full font-mono uppercase font-semibold">ERP Console</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">Multi-Tenant Cloud SaaS • Bangalore East Division</p>
            </div>
          </div>

          {/* User Session Info & Log Out */}
          <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
            <div className="flex items-center gap-3">
              {currentUser.photo ? (
                <img src={currentUser.photo} className="w-9 h-9 rounded-full object-cover border border-indigo-500/50 shadow-sm shrink-0" referrerPolicy="no-referrer" alt="Profile" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-400 flex items-center justify-center font-bold text-sm shadow-inner uppercase shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <div className="text-left sm:text-right hidden xs:block">
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{currentRole} Workspace</div>
                <div className="text-xs font-bold text-slate-200">
                  {currentUser.name} <span className="text-[10px] text-slate-500 font-mono">({currentUser.email})</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenProfileModal}
                className="flex items-center gap-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 hover:text-indigo-200 px-3.5 py-2 rounded-xl text-xs font-extrabold border border-indigo-900 transition-all active:scale-95"
                id="profile-btn"
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span>My Profile</span>
              </button>

              <button
                onClick={handleCentralLogout}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-extrabold border border-slate-700 transition-all active:scale-95"
                id="logout-btn"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main SaaS Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0">
        
        {/* Render View Based on Logged In Role */}
        <div className="fade-in-transition">
          {currentRole === "Super Admin" && (
            <SuperAdminView centers={centers} onAddCenter={handleAddCenter} students={students} teachers={teachers} />
          )}

          {currentRole === "Center Admin" && (
            <CenterAdminView
              teachers={teachers}
              students={students}
              fees={fees}
              expenses={expenses}
              onAddTeacher={handleAddTeacher}
              onAddStudent={handleAddStudent}
              onAddExpense={handleAddExpense}
              onPayFee={handlePayFee}
              onAddFee={handleAddFee}
              onDeleteFee={handleDeleteFee}
              centers={centers}
              leads={leads}
              onAddLead={handleAddLead}
              currentUser={currentUser}
            />
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
            />
          )}

          {currentRole === "Student" && (
            <StudentPortalView
              students={students}
              onRefreshData={loadData}
              centers={centers}
            />
          )}

          {currentRole === "Marketing / Sales Staff" && (
            <CrmView leads={leads} onAddLead={handleAddLead} />
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
          <div className="font-mono text-[10px]">Cloud Run Sandbox • Full-Stack Express-Vite Architecture • Google Sheets DB Blueprint • Google Gemini v3.5 Integrations</div>
        </div>
      </footer>

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

    </div>
  );
}
