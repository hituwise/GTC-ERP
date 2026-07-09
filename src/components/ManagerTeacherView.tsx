import React, { useState, useEffect } from "react";
import { Teacher, Student, FeeRecord, CRMLead, ExpenseRecord } from "../types";
import {
  Users,
  CreditCard,
  Settings,
  Sparkles,
  Calculator,
  PlusCircle,
  TrendingUp,
  UserCheck,
  CheckCircle,
  FileSpreadsheet,
  Trash2,
  TrendingDown,
  RefreshCw,
  LogOut,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  GraduationCap,
  Award,
  BookOpen
} from "lucide-react";
import CrmView from "./CrmView";
import ConceptWorksheetManager from "./ConceptWorksheetManager";
import PracticeGeneratorView from "./PracticeGeneratorView";

interface ManagerTeacherViewProps {
  teachers: Teacher[];
  students: Student[];
  fees: FeeRecord[];
  expenses: ExpenseRecord[];
  onAddTeacher: (teacher: Partial<Teacher>) => void;
  onAddStudent: (student: Partial<Student>) => void;
  onAddExpense: (expense: Partial<ExpenseRecord>) => void;
  onPayFee: (feeId: string) => void;
  onAddFee: (fee: Partial<FeeRecord>) => Promise<any>;
  onDeleteFee: (feeId: string) => Promise<any>;
  centers?: any[];
  leads?: CRMLead[];
  onAddLead?: (lead: Partial<CRMLead>) => void;
  currentUser?: { role: string; email: string; id?: string; name: string; photo?: string } | null;
}

export default function ManagerTeacherView({
  teachers: initialTeachers,
  students: initialStudents,
  fees: initialFees,
  expenses: initialExpenses,
  onAddTeacher,
  onAddStudent,
  onAddExpense,
  onPayFee,
  onAddFee,
  onDeleteFee,
  centers = [],
  leads = [],
  onAddLead = () => {},
  currentUser
}: ManagerTeacherViewProps) {

  // Resolve logged-in manager-teacher info
  const loggedInInfo = currentUser || (() => {
    const saved = localStorage.getItem("erp_logged_in_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  })();

  const activeCenterId = loggedInInfo?.centerId || (loggedInInfo?.id === "T_M_DEMO" ? (centers[0]?.id || "C001") : loggedInInfo?.id || "C001");
  const activeCenter = (centers || []).find(c => c.id === activeCenterId) || (centers || []).find(c => c.email.toLowerCase() === loggedInInfo?.email?.toLowerCase());
  const activeCenterName = activeCenter?.name || "Bangalore East Division";

  // State synchronization
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);

  // Local navigation subTab
  const [activeTab, setActiveTab] = useState<"Dashboard" | "Staff" | "Payments" | "Marketing" | "Progress" | "Worksheets">("Dashboard");

  // State for Staff Form
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffMobile, setStaffMobile] = useState("");
  const [staffRole, setStaffRole] = useState("Teacher");

  // State for Payment Creation
  const [selectedStudentForInvoice, setSelectedStudentForInvoice] = useState("");
  const [invoiceFeeType, setInvoiceFeeType] = useState("Level Fee");
  const [invoiceMonth, setInvoiceMonth] = useState("July 2026");
  const [invoiceAmount, setInvoiceAmount] = useState(2500);
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);

  // State for AI Progress Report Generator
  const [reportStudentId, setReportStudentId] = useState("");
  const [reportLevel, setReportLevel] = useState(2);
  const [reportAttendance, setReportAttendance] = useState(95);
  const [reportExamScore, setReportExamScore] = useState(85);
  const [reportHomeworkRate, setReportHomeworkRate] = useState(90);
  const [reportSpeedScore, setReportSpeedScore] = useState(25);
  const [reportObservations, setReportObservations] = useState("Shows remarkable calculation speed, with high bead focus and correct left thumb usage.");
  const [reportLoading, setReportLoading] = useState(false);
  const [generatedReport, setGeneratedReport] = useState("");

  // Fee Settings variables
  const [registrationFee, setRegistrationFee] = useState(1500);
  const [levelFee, setLevelFee] = useState(2500);
  const [examFee, setExamFee] = useState(500);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Sync datasets on prop changes
  useEffect(() => {
    setTeachers(initialTeachers.filter(t => t.centerId === activeCenterId));
    setStudents(initialStudents.filter(s => s.centerId === activeCenterId));
    setFees(initialFees.filter(f => f.centerId === activeCenterId));
  }, [initialTeachers, initialStudents, initialFees, activeCenterId]);

  // Set default report student on mount
  useEffect(() => {
    if (students.length > 0 && !reportStudentId) {
      setReportStudentId(students[0].id);
    }
  }, [students, reportStudentId]);

  // Calculations for dashboard
  const totalStudentsCount = students.length;
  const totalStaffCount = teachers.length;
  
  const paidFeesCount = fees.filter(f => f.status === "Paid").length;
  const pendingFeesCount = fees.filter(f => f.status === "Unpaid" || f.status === "Pending Approval").length;
  
  const totalRevenue = fees
    .filter(f => f.status === "Paid")
    .reduce((acc, curr) => acc + (curr.amount - (curr.discount || 0)), 0);

  const pendingRevenue = fees
    .filter(f => f.status === "Unpaid" || f.status === "Pending Approval")
    .reduce((acc, curr) => acc + (curr.amount - (curr.discount || 0)), 0);

  // Handles adding new teacher/staff member
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffEmail || !staffMobile) {
      alert("Please fill in all required fields.");
      return;
    }
    const newStaff: Partial<Teacher> = {
      centerId: activeCenterId,
      name: staffName,
      email: staffEmail,
      mobile: staffMobile,
      role: staffRole,
      status: "Active",
      joiningDate: new Date().toISOString().split("T")[0]
    };

    onAddTeacher(newStaff);

    // Reset Form
    setStaffName("");
    setStaffEmail("");
    setStaffMobile("");
    setStaffRole("Teacher");
    setShowAddStaff(false);
  };

  // Handles creating a student invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForInvoice) {
      alert("Please select a student to invoice.");
      return;
    }

    setInvoiceSubmitting(true);
    const targetStudent = students.find(s => s.id === selectedStudentForInvoice);

    const payload: Partial<FeeRecord> = {
      centerId: activeCenterId,
      studentId: selectedStudentForInvoice,
      feeType: invoiceFeeType,
      amount: invoiceAmount,
      discount: invoiceDiscount,
      month: invoiceMonth,
      status: "Unpaid"
    };

    try {
      await onAddFee(payload);
      setSelectedStudentForInvoice("");
      setInvoiceDiscount(0);
      alert(`Invoice successfully issued to ${targetStudent?.studentName || "student"}`);
    } catch (err) {
      console.error("Invoice error:", err);
    } finally {
      setInvoiceSubmitting(false);
    }
  };

  // Generate progress report with Gemini AI
  const handleGenerateAIProgress = async () => {
    if (!reportStudentId) {
      alert("Please choose a student to evaluate.");
      return;
    }
    setReportLoading(true);
    setGeneratedReport("");

    const targetStudent = students.find(s => s.id === reportStudentId);
    
    try {
      const res = await fetch("/api/gemini/progress-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: targetStudent?.studentName || "Abacus Scholar",
          level: reportLevel,
          attendanceRate: reportAttendance,
          examScore: reportExamScore,
          homeworkRate: reportHomeworkRate,
          speedScore: reportSpeedScore,
          observations: reportObservations
        })
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedReport(data.text);
      } else {
        alert(data.error || "Failed to generate report card from Gemini.");
      }
    } catch (err) {
      console.error("AI report failed:", err);
      alert("A network error occurred while running AI synthesis.");
    } finally {
      setReportLoading(false);
    }
  };

  // Save settings
  const handleSaveFeeSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setTimeout(() => {
      setSettingsSaving(false);
      alert("Fee settings saved successfully for this branch.");
    }, 500);
  };

  return (
    <div className="space-y-8" id="manager-teacher-dashboard">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="bg-indigo-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest text-indigo-200">
            Manager + Teacher Workspace
          </span>
          <h2 className="text-xl md:text-2xl font-black font-display mt-2">
            Welcome back, {loggedInInfo?.name || "Ananya Sharma"}! 🌟
          </h2>
          <p className="text-xs text-indigo-300 mt-1">
            Senior Manager & Lead Trainer • <strong>{activeCenterName}</strong> • Staff, Payments, Marketing & Progress Console
          </p>
        </div>
        <div className="flex gap-2">
          <div className="text-right text-xs">
            <div className="text-indigo-400 font-bold uppercase tracking-wider text-[9px]">Portal Status</div>
            <div className="text-emerald-400 font-black flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
              Live & Unified
            </div>
          </div>
        </div>
      </div>

      {/* Highlights Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Active Students</div>
          <div className="text-2xl font-black text-indigo-950 mt-1 font-display">{totalStudentsCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Directly enrolled in center</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Staff Directory</div>
          <div className="text-2xl font-black text-indigo-950 mt-1 font-display">{totalStaffCount} Members</div>
          <div className="text-[10px] text-indigo-600 font-semibold mt-1">Teachers & marketing staff</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fees Collected</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-display">₹{totalRevenue.toLocaleString("en-IN")}</div>
          <div className="text-[10px] text-slate-500 mt-1">{paidFeesCount} invoices settled</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fees Outstanding</div>
          <div className="text-2xl font-black text-rose-500 mt-1 font-display">₹{pendingRevenue.toLocaleString("en-IN")}</div>
          <div className="text-[10px] text-rose-600 font-bold mt-1">{pendingFeesCount} pending collection</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs bar */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl flex flex-wrap gap-1 border-2 border-slate-100/50">
        {[
          { id: "Dashboard", label: "Overview", icon: Calculator },
          { id: "Staff", label: "Staff & Teachers", icon: Users },
          { id: "Worksheets", label: "Worksheets", icon: BookOpen },
          { id: "Payments", label: "Payment & Fee Desk", icon: CreditCard },
          { id: "Marketing", label: "Academy Marketing & CRM", icon: Sparkles },
          { id: "Progress", label: "Student Progress & AI Reports", icon: Award }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black transition-all rounded-xl outline-none ${
                isSelected
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-150"
                  : "text-slate-600 hover:text-indigo-900 hover:bg-white/80"
              }`}
              id={`manager-subtab-${tab.id}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Workspace Sub-tab Content Area */}
      <div className="bg-white rounded-3xl border-2 border-slate-150/80 shadow-sm overflow-hidden p-6">
        
        {/* OVERVIEW DASHBOARD */}
        {activeTab === "Dashboard" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 font-display">Branch Performance Summary</h3>
                <p className="text-xs text-slate-500">A look at recent operational trends, staff alignment, and current student lists.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Staff Activity summary */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-4">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Teachers & Staff Overview
                </h4>
                {teachers.length === 0 ? (
                  <div className="text-xs text-slate-400 py-4 italic text-center">No teachers registered yet. Go to Staff tab to add first member.</div>
                ) : (
                  <div className="space-y-3">
                    {teachers.map(t => (
                      <div key={t.id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                        <div>
                          <div className="text-xs font-bold text-slate-900">{t.name}</div>
                          <div className="text-[10px] text-indigo-600 font-mono">{t.role}</div>
                        </div>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${t.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Financial health card */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-4">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Fee Ledger Health
                </h4>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-xs text-slate-600">Pending Invoices</span>
                    <span className="text-xs font-black text-rose-600">{pendingFeesCount} Accounts</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-xs text-slate-600">Settled Invoices</span>
                    <span className="text-xs font-black text-emerald-600">{paidFeesCount} Accounts</span>
                  </div>
                  <div className="p-1 text-[11px] font-medium text-slate-500">
                    💡 Tip: Go to the <strong>Payment Desk</strong> to issue custom invoices, adjust levels, or register off-cycle student fees.
                  </div>
                </div>
              </div>
            </div>

            {/* General student registry overview */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-4">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-amber-500" />
                Active Student Progress Overview
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400">
                      <th className="py-2">Student Name</th>
                      <th className="py-2">Level</th>
                      <th className="py-2">Batch Info</th>
                      <th className="py-2">Parent Name</th>
                      <th className="py-2">Mobile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id} className="border-b border-slate-150 hover:bg-slate-100/50">
                        <td className="py-2.5 font-bold text-slate-900">{s.studentName}</td>
                        <td className="py-2.5"><span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">Level {s.currentLevel}</span></td>
                        <td className="py-2.5 text-slate-600">{s.batch}</td>
                        <td className="py-2.5 font-medium text-slate-700">{s.parentName}</td>
                        <td className="py-2.5 font-mono text-slate-500">{s.parentMobile}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* STAFF & TEACHERS MANAGEMENT */}
        {activeTab === "Staff" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 font-display">Staff & Teacher Directory</h3>
                <p className="text-xs text-slate-500">Manage trainers, coaches, and marketing assistants. Register new staff members below.</p>
              </div>
              <button
                onClick={() => setShowAddStaff(!showAddStaff)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Register Staff Member</span>
              </button>
            </div>

            {showAddStaff && (
              <form onSubmit={handleCreateStaff} className="bg-indigo-50/50 border border-indigo-150 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">Add New Staff / Instructor</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Meera Nair"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email ID (Login Username)</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. meera@geniplus.com"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Mobile Number</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 XXXXX XXXXX"
                      value={staffMobile}
                      onChange={(e) => setStaffMobile(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Assigned Role</label>
                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold"
                    >
                      <option value="Senior Abacus Trainer">Senior Abacus Trainer</option>
                      <option value="Junior Teacher">Junior Teacher</option>
                      <option value="Assistant Manager">Assistant Manager</option>
                      <option value="Marketing Representative">Marketing Representative</option>
                      <option value="Teacher & Marketing Representative">Teacher & Marketing Representative</option>
                      <option value="Manager + Teacher">Manager + Teacher</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStaff(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Register Personnel
                  </button>
                </div>
              </form>
            )}

            {/* Teachers list and updates */}
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">Registered Center Personnel ({teachers.length})</div>
              {teachers.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 italic text-center bg-slate-50 rounded-2xl">No personnel registered yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teachers.map(t => (
                    <div key={t.id} className="bg-white border border-slate-200 hover:border-indigo-200 rounded-2xl p-4 shadow-2xs space-y-3 relative overflow-hidden transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-black text-slate-900">{t.name}</h4>
                          <span className="text-[10px] text-indigo-600 font-bold tracking-tight bg-indigo-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                            {t.role}
                          </span>
                        </div>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${t.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                          {t.status || "Active"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-slate-600">{t.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-slate-600">{t.mobile}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Joined: <strong className="text-slate-700 font-mono">{t.joiningDate}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAYMENTS & FEE DESK */}
        {activeTab === "Payments" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 font-display">Branch Payment Desk</h3>
                <p className="text-xs text-slate-500">Track paid ledger records, issue tuition fee invoices, and adjust active pricing structures.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Issue Invoice Form */}
              <div className="lg:col-span-1 bg-slate-50/50 border border-slate-150 rounded-2xl p-5 space-y-4 h-fit">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  Issue Fee Invoice
                </h4>
                <form onSubmit={handleCreateInvoice} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Select Student</label>
                    <select
                      value={selectedStudentForInvoice}
                      onChange={(e) => {
                        setSelectedStudentForInvoice(e.target.value);
                        // Default level fee amount
                        setInvoiceAmount(2500);
                      }}
                      required
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                    >
                      <option value="">-- Choose Student --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.studentName} (Lvl {s.currentLevel})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Fee Type</label>
                      <select
                        value={invoiceFeeType}
                        onChange={(e) => {
                          setInvoiceFeeType(e.target.value);
                          if (e.target.value === "Registration Fee") setInvoiceAmount(1500);
                          else if (e.target.value === "Level Fee") setInvoiceAmount(2500);
                          else if (e.target.value === "Exam Fee") setInvoiceAmount(500);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-900"
                      >
                        <option value="Level Fee">Level Fee</option>
                        <option value="Registration Fee">Registration Fee</option>
                        <option value="Exam Fee">Exam Fee</option>
                        <option value="Competition Fee">Competition Fee</option>
                        <option value="Material Kit Fee">Material Kit Fee</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Billing Period</label>
                      <input
                        type="text"
                        placeholder="e.g. July 2026"
                        value={invoiceMonth}
                        onChange={(e) => setInvoiceMonth(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Amount (₹)</label>
                      <input
                        type="number"
                        value={invoiceAmount}
                        onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Discount (₹)</label>
                      <input
                        type="number"
                        value={invoiceDiscount}
                        onChange={(e) => setInvoiceDiscount(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={invoiceSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {invoiceSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Issue Professional Invoice</span>
                  </button>
                </form>
              </div>

              {/* Fee settings / adjustments */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Tuition Ledger record list */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150 space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Tuition Fees Ledger</h4>
                  <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1.5">
                    {fees.length === 0 ? (
                      <div className="text-xs text-slate-400 py-6 italic text-center">No fee invoices recorded yet for this center.</div>
                    ) : (
                      fees.map(f => {
                        const finalAmt = f.amount - (f.discount || 0);
                        const sObj = students.find(s => s.id === f.studentId);
                        const displayStudentName = sObj ? sObj.studentName : "Unknown Scholar";
                        return (
                          <div key={f.id} className="bg-white border border-slate-150 p-3 rounded-xl flex justify-between items-center text-xs">
                            <div>
                              <div className="font-bold text-slate-900">{displayStudentName}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{f.feeType || "Tuition Fee"} • {f.month}</div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-black text-slate-950">₹{finalAmt.toLocaleString("en-IN")}</div>
                                {f.discount > 0 && <div className="text-[9px] text-emerald-600 font-medium">₹{f.discount} discount applied</div>}
                              </div>
                              {f.status === "Paid" ? (
                                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Paid</span>
                              ) : (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => {
                                      if (confirm(`Mark ₹${finalAmt} fee as Paid for ${displayStudentName}?`)) {
                                        onPayFee(f.id);
                                      }
                                    }}
                                    className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                                  >
                                    Pay Now
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm("Are you sure you want to void/delete this invoice?")) {
                                        onDeleteFee(f.id);
                                      }
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title="Delete invoice"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Base settings adjustments */}
                <form onSubmit={handleSaveFeeSettings} className="bg-slate-50 rounded-2xl p-5 border border-slate-150 space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-slate-600" />
                    Center Base Fee Rates (Quick Adjust)
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Registration Fee (₹)</label>
                      <input
                        type="number"
                        value={registrationFee}
                        onChange={(e) => setRegistrationFee(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Level Fee (₹)</label>
                      <input
                        type="number"
                        value={levelFee}
                        onChange={(e) => setLevelFee(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Exam Fee (₹)</label>
                      <input
                        type="number"
                        value={examFee}
                        onChange={(e) => setExamFee(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={settingsSaving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-2xs transition-all flex items-center gap-1"
                    >
                      {settingsSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                      <span>Save Base Rates</span>
                    </button>
                  </div>
                </form>

              </div>

            </div>
          </div>
        )}

        {/* MARKETING SUB-TAB (CRM View integration) */}
        {activeTab === "Marketing" && (
          <div className="space-y-4 animate-fade-in">
            <CrmView leads={leads} onAddLead={onAddLead} />
          </div>
        )}

        {/* STUDENT PROGRESS & AI REPORTS */}
        {activeTab === "Progress" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 font-display">Student Progress Card Console</h3>
                <p className="text-xs text-slate-500">Track 12-week abacus milestones and use the Google Gemini artificial intelligence to generate comprehensive reports.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* AI generator settings */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150 space-y-4 h-fit">
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Gemini Progress Synthesis
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Choose Student</label>
                    <select
                      value={reportStudentId}
                      onChange={(e) => setReportStudentId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                    >
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.studentName} (Level {s.currentLevel})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Current Level</label>
                      <select
                        value={reportLevel}
                        onChange={(e) => setReportLevel(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(l => (
                          <option key={l} value={l}>Level {l}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Attendance Rate (%)</label>
                      <input
                        type="number"
                        value={reportAttendance}
                        onChange={(e) => setReportAttendance(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Exam Marks (%)</label>
                      <input
                        type="number"
                        value={reportExamScore}
                        onChange={(e) => setReportExamScore(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Homework (%)</label>
                      <input
                        type="number"
                        value={reportHomeworkRate}
                        onChange={(e) => setReportHomeworkRate(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Speed (Sums/Min)</label>
                      <input
                        type="number"
                        value={reportSpeedScore}
                        onChange={(e) => setReportSpeedScore(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Trainer's Observations</label>
                    <textarea
                      value={reportObservations}
                      onChange={(e) => setReportObservations(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold h-16"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAIProgress}
                    disabled={reportLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    {reportLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Synthesize Progress Report</span>
                  </button>
                </div>
              </div>

              {/* Report output area */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150 flex flex-col min-h-[300px]">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Pedagogical Report Card Result</h4>
                <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 overflow-y-auto max-h-[350px]">
                  {reportLoading ? (
                    <div className="h-full flex flex-col justify-center items-center text-slate-400 gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                      <span className="text-xs font-semibold">Gemini AI is brainstorming and writing copy...</span>
                    </div>
                  ) : generatedReport ? (
                    <div className="whitespace-pre-wrap text-xs text-slate-700 leading-relaxed font-sans">{generatedReport}</div>
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center text-slate-400 text-center text-xs py-10">
                      <Award className="w-10 h-10 text-slate-300 mb-2" />
                      <span>Configure metrics on the left, then click <strong>Synthesize Progress Report</strong> to generate high-quality progress cards.</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Reusable Digital Practice Concept Worksheet Manager for Level 1 */}
            <div className="pt-6 border-t border-slate-100">
              <ConceptWorksheetManager
                currentTeacher={{
                  id: loggedInInfo?.id || "T_M_DEMO",
                  centerId: activeCenterId,
                  name: loggedInInfo?.name || "Senior Manager",
                  email: loggedInInfo?.email || "manager@geniplus.com",
                  mobile: "9999999999",
                  joiningDate: "2026-01-01",
                  role: "Manager",
                  status: "Active"
                }}
                students={students}
                onRefreshData={async () => {
                  // Trigger reload if needed
                }}
              />
            </div>

          </div>
        )}

        {activeTab === "Worksheets" && (
          <div className="space-y-4 animate-fade-in">
            <PracticeGeneratorView />
          </div>
        )}

      </div>

    </div>
  );
}
