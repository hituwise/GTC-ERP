import React, { useState, useEffect } from "react";
import { Center, Teacher, Student, CRMLead, AttendanceRecord, FeeRecord, ExpenseRecord, HomeworkRecord, ExamRecord, StudentPracticeAssignment, StudentPracticeSubmission, AcademyLeaderboardEntry } from "./types";
import SuperAdminView from "./components/SuperAdminView";
import CenterAdminView from "./components/CenterAdminView";
import TeacherView from "./components/TeacherView";
import CrmView from "./components/CrmView";
import PracticeGeneratorView from "./components/PracticeGeneratorView";
import DeveloperBlueprintView from "./components/DeveloperBlueprintView";
import StudentPortalView from "./components/StudentPortalView";
import { LayoutDashboard, Users, GraduationCap, PhoneCall, Sparkles, Database, Shield, BookOpen, UserCheck, Settings, RefreshCw, LogIn, Trophy } from "lucide-react";

export default function App() {
  // Master SaaS User Roles Switcher
  type Role = "Super Admin" | "Center Admin" | "Teacher" | "Marketing / Sales Staff" | "Abacus Content Engine" | "Developer Blueprint" | "Student";
  const [currentRole, setCurrentRole] = useState<Role>("Center Admin");

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="text-sm font-semibold text-gray-500 font-display">Initializing Geniplus Academy Cloud ERP...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col text-gray-800 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Multi-Tenant Role Switcher Frame (Hidden on PDF/Print) */}
      <div className="bg-indigo-950 text-white border-b border-indigo-900 print:hidden sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center font-black text-indigo-950 text-xl shadow-md shrink-0">
              G+
            </div>
            <div>
              <h1 className="text-lg font-black font-display leading-tight tracking-tight text-white flex items-center gap-2">
                Geniplus <span className="text-[10px] px-2 py-0.5 bg-indigo-800 text-indigo-300 rounded-full font-mono uppercase font-semibold">Academy ERP</span>
              </h1>
              <p className="text-[10px] text-indigo-200 font-mono">Multi-Tenant Cloud SaaS • Powered by Google Sheets & Gemini</p>
            </div>
          </div>

          {/* Role Switching Panel */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-indigo-200 mr-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              Toggle User Role Preview:
            </span>
            {[
              { id: "Super Admin", label: "Super Admin (Geniplus)", icon: Shield, color: "bg-rose-500" },
              { id: "Center Admin", label: "Center Admin", icon: LayoutDashboard, color: "bg-indigo-400" },
              { id: "Teacher", label: "Teacher", icon: GraduationCap, color: "bg-emerald-400" },
              { id: "Student", label: "Student Portal", icon: Trophy, color: "bg-amber-400" },
              { id: "Marketing / Sales Staff", label: "Marketing CRM", icon: PhoneCall, color: "bg-amber-400" },
              { id: "Abacus Content Engine", label: "Worksheet Generator", icon: BookOpen, color: "bg-purple-400" },
              { id: "Developer Blueprint", label: "GAS & Schema Blueprint", icon: Database, color: "bg-teal-400" }
            ].map((role) => {
              const Icon = role.icon;
              const isSelected = currentRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setCurrentRole(role.id as Role)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all active:scale-95 outline-none ${
                    isSelected
                      ? "bg-amber-400 text-indigo-950 border-amber-300 shadow-lg shadow-amber-950/20"
                      : "bg-indigo-900 text-indigo-100 border-indigo-800 hover:bg-indigo-855 hover:text-white"
                  }`}
                  id={`role-btn-${role.id}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${role.color}`} />
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{role.id}</span>
                </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Main SaaS Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0">
                {/* Dynamic Header describing what you are seeing */}
        <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div className="flex gap-4 items-start">
            <div className="p-3.5 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 mt-1 shrink-0">
              {currentRole === "Super Admin" && <Shield className="w-6 h-6" />}
              {currentRole === "Center Admin" && <LayoutDashboard className="w-6 h-6" />}
              {currentRole === "Teacher" && <GraduationCap className="w-6 h-6" />}
              {currentRole === "Student" && <Trophy className="w-6 h-6" />}
              {currentRole === "Marketing / Sales Staff" && <PhoneCall className="w-6 h-6" />}
              {currentRole === "Abacus Content Engine" && <BookOpen className="w-6 h-6" />}
              {currentRole === "Developer Blueprint" && <Database className="w-6 h-6" />}
            </div>
            <div>
              <div className="text-xs font-black font-mono text-indigo-600 uppercase tracking-wider">Viewing Role Context</div>
              <h2 className="text-xl font-black text-indigo-900 font-display tracking-tight mt-0.5">{currentRole} Context Dashboard</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                {currentRole === "Super Admin" && "System owner dashboard tracking global SaaS performance. View center registrations, ARR streams, and broadcast announcements to all heads."}
                {currentRole === "Center Admin" && "Local academy admin dashboard. Enroll students, onboard tutors, manage fees collection ledgers, and log operational expenses (rent, salary) with live P&L generation."}
                {currentRole === "Teacher" && "Batch instructor portal. Take attendance for assigned Saturday/Sunday batches, log exam scores, and utilize AI Progress Report & AI Lesson Planners."}
                {currentRole === "Student" && "Interactive student training portal. Complete assigned daily abacus speed drills, launch custom online practice configurations, and see academy rankings!"}
                {currentRole === "Marketing / Sales Staff" && "CRM pipeline controller. Manage new admissions leads, and consult AI Marketing Copy assistants, Objection scripts, and Parent counsellors."}
                {currentRole === "Abacus Content Engine" && "Interactive worksheet engine. Instantly generate printable Level 1 to 8 abacus practice tasks using zero-negative subtraction and localized translations."}
                {currentRole === "Developer Blueprint" && "Google Sheets relational database structures, table schemas, validation rules, and direct production-ready Apps Script backend code."}
              </p>
            </div>
          </div>

          <div className="bg-indigo-50 border-2 border-indigo-100 rounded-3xl p-4 shrink-0 flex items-center gap-3 shadow-xs">
            <div className="text-right">
              <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Tenant Partition</div>
              <div className="text-xs font-black text-indigo-950 font-display">
                {currentRole === "Super Admin" ? "All Centers" : "Geniplus Bangalore East"}
              </div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Render View Based on Switcher Role */}
        <div className="fade-in-transition">
          {currentRole === "Super Admin" && (
            <SuperAdminView centers={centers} onAddCenter={handleAddCenter} />
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
            />
          )}

          {currentRole === "Student" && (
            <StudentPortalView
              students={students}
              onRefreshData={loadData}
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
          <div>Geniplus Academy ERP • Built for Abacus Academies & Cognitive Training Schools</div>
          <div className="font-mono text-[10px]">Cloud Run Sandbox • Full-Stack Express-Vite Architecture • Google Sheets DB Blueprint • Google Gemini v3.5 Integrations</div>
        </div>
      </footer>

    </div>
  );
}
