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
  BookOpen,
  Landmark,
  Search,
  Filter,
  X
} from "lucide-react";
import CrmView from "./CrmView";
import ConceptWorksheetManager from "./ConceptWorksheetManager";
import PracticeGeneratorView from "./PracticeGeneratorView";
import TeacherView from "./TeacherView";
import DigitalCertificateManager from "./DigitalCertificateManager";
import { getCurrentMonthYear, getUpcomingBillingMonths } from "./CenterAdminView";

interface ManagerTeacherViewProps {
  teachers: Teacher[];
  students: Student[];
  fees: FeeRecord[];
  expenses: ExpenseRecord[];
  attendance?: any[];
  homework?: any[];
  exams?: any[];
  onMarkAttendance?: (attendance: any, date?: string) => void;
  onAddTeacher: (teacher: Partial<Teacher>) => void;
  onAddStudent: (student: Partial<Student>) => Promise<any>;
  onEditStudent?: (student: Partial<Student>) => void;
  onDeleteStudent?: (studentId: string) => void;
  onAddExpense: (expense: Partial<ExpenseRecord>) => void;
  onPayFee: (feeId: string) => void;
  onAddFee: (fee: Partial<FeeRecord>) => Promise<any>;
  onDeleteFee: (feeId: string) => Promise<any>;
  centers?: any[];
  leads?: CRMLead[];
  onAddLead?: (lead: Partial<CRMLead>) => void;
  onRefreshData?: () => Promise<any>;
  currentUser?: { role: string; email: string; id?: string; name: string; photo?: string } | null;
}

export default function ManagerTeacherView({
  teachers: initialTeachers,
  students: initialStudents,
  fees: initialFees,
  expenses: initialExpenses,
  attendance = [],
  homework = [],
  exams = [],
  onMarkAttendance = () => {},
  onAddTeacher,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onAddExpense,
  onPayFee,
  onAddFee,
  onDeleteFee,
  centers = [],
  leads = [],
  onAddLead = () => {},
  onRefreshData = async () => {},
  currentUser
}: ManagerTeacherViewProps) {

  // Toggle between Manager & Admin HQ vs. Trainer Classroom consoles
  const [workspaceMode, setWorkspaceMode] = useState<"admin" | "teacher">("admin");

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

  const getCenterId = () => {
    if (loggedInInfo?.centerId) return loggedInInfo.centerId;
    if (loggedInInfo?.id && loggedInInfo.id.startsWith("T")) {
      const teacherObj = (initialTeachers || []).find(t => t.id === loggedInInfo.id || t.email?.toLowerCase() === loggedInInfo.email?.toLowerCase());
      if (teacherObj?.centerId) return teacherObj.centerId;
    }
    return loggedInInfo?.id === "T_M_DEMO" ? (centers[0]?.id || "C001") : loggedInInfo?.id || "C001";
  };
  const activeCenterId = getCenterId();
  const activeCenter = (centers || []).find(c => c.id === activeCenterId) || (centers || []).find(c => c.email.toLowerCase() === loggedInInfo?.email?.toLowerCase());
  const activeCenterName = activeCenter?.name || "Bangalore East Division";

  // Branch selection state ("ALL" or specific center ID)
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");

  // Multi-center list for this manager (active center + any sub-centers)
  const connectedCenters = React.useMemo(() => {
    if (!centers || centers.length === 0) return [{ id: activeCenterId, name: activeCenterName }];
    const parentObj = centers.find(c => c.id === activeCenterId);
    return centers.filter(c => 
      c.id === activeCenterId || 
      c.parentCenterId === activeCenterId || 
      (parentObj?.parentCenterId && c.id === parentObj.parentCenterId)
    );
  }, [centers, activeCenterId, activeCenterName]);

  const activeBranchIds = selectedBranchId === "ALL"
    ? connectedCenters.map(c => c.id)
    : [selectedBranchId];

  // State synchronization
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);

  // Local navigation subTab
  const [activeTab, setActiveTab] = useState<"Dashboard" | "Students" | "Staff" | "Payments" | "FeeSetup" | "Expenses" | "PnL" | "Marketing" | "Progress" | "Worksheets" | "Certificates">("Dashboard");

  // State for Staff Form & Multi-Center Assignment
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffMobile, setStaffMobile] = useState("");
  const [staffRole, setStaffRole] = useState("Teacher");
  const [staffSignature, setStaffSignature] = useState("");
  const [staffCenterIds, setStaffCenterIds] = useState<string[]>([activeCenterId]);

  // State for Payment Creation
  const [selectedStudentForInvoice, setSelectedStudentForInvoice] = useState("");
  const [invoiceFeeType, setInvoiceFeeType] = useState("Level Fee");
  const [invoiceMonth, setInvoiceMonth] = useState(() => getCurrentMonthYear());
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
  const [registrationFeeInput, setRegistrationFeeInput] = useState(1500);
  const [levelFeeInput, setLevelFeeInput] = useState(2500);
  const [examFeeInput, setExamFeeInput] = useState(500);
  const [extraFeesInput, setExtraFeesInput] = useState<any[]>([]);
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraAmount, setNewExtraAmount] = useState<number | "">("");
  const [structureSaving, setStructureSaving] = useState(false);
  const [feeStructure, setFeeStructure] = useState<any>(null);

  // Fee Search / Filter States
  const [mgrInvoiceStudentSearch, setMgrInvoiceStudentSearch] = useState("");
  const [mgrFeeSearch, setMgrFeeSearch] = useState("");

  // Student Registry management states
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [sCenterId, setSCenterId] = useState("");
  const [sName, setSName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sParent, setSParent] = useState("");
  const [sMobile, setSMobile] = useState("");
  const [sAge, setSAge] = useState(8);
  const [sSchool, setSSchool] = useState("");
  const [sLevel, setSLevel] = useState(1);
  const [sBatch, setSBatch] = useState("");
  const [customBatchVal, setCustomBatchVal] = useState("");
  const [sTeacherId, setSTeacherId] = useState("");

  // Student Editing States
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editSName, setEditSName] = useState("");
  const [editSParent, setEditSParent] = useState("");
  const [editSMobile, setEditSMobile] = useState("");
  const [editSAge, setEditSAge] = useState(8);
  const [editSSchool, setEditSSchool] = useState("");
  const [editSLevel, setEditSLevel] = useState(1);
  const [editSBatch, setEditSBatch] = useState("");
  const [editSTeacherId, setEditSTeacherId] = useState("");
  const [editSEmail, setEditSEmail] = useState("");
  const [editSStatus, setEditSStatus] = useState("Active");

  // Operating Expense management states
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expName, setExpName] = useState("");
  const [expAmount, setExpAmount] = useState(0);
  const [expCategory, setExpCategory] = useState("Rent");
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);

  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  // Fee structure loader
  const loadFeeStructure = async () => {
    try {
      const res = await fetch(`/api/erp/fee-structure/${activeCenterId}`);
      const data = await res.json();
      if (data.success && data.feeStructure) {
        setFeeStructure(data.feeStructure);
        setRegistrationFeeInput(data.feeStructure.registrationFee);
        setLevelFeeInput(data.feeStructure.levelFee);
        setExamFeeInput(data.feeStructure.examFee);
        setExtraFeesInput(data.feeStructure.extraFees || []);
      }
    } catch (err) {
      console.error("Error loading fee structure:", err);
    }
  };

  useEffect(() => {
    loadFeeStructure();
  }, [activeCenterId]);

  // Sync datasets on prop & branch filter changes
  useEffect(() => {
    setTeachers(initialTeachers.filter(t => 
      activeBranchIds.includes(t.centerId) || 
      (t.centerIds && t.centerIds.some(cid => activeBranchIds.includes(cid)))
    ));
    setStudents(initialStudents.filter(s => activeBranchIds.includes(s.centerId)));
    setFees(initialFees.filter(f => activeBranchIds.includes(f.centerId)));
    setExpenses((initialExpenses || []).filter(e => activeBranchIds.includes(e.centerId)));
  }, [initialTeachers, initialStudents, initialFees, initialExpenses, activeBranchIds]);

  // Set default report student on mount
  useEffect(() => {
    if (students.length > 0 && !reportStudentId) {
      setReportStudentId(students[0].id);
    }
  }, [students, reportStudentId]);

  // Set default invoice student when students are loaded
  useEffect(() => {
    if (students.length > 0 && !selectedStudentForInvoice) {
      setSelectedStudentForInvoice(students[0].id);
    }
  }, [students, selectedStudentForInvoice]);

  const handleSaveFeeStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    setStructureSaving(true);
    try {
      const res = await fetch("/api/erp/fee-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: activeCenterId,
          registrationFee: Number(registrationFeeInput),
          levelFee: Number(levelFeeInput),
          examFee: Number(examFeeInput),
          extraFees: extraFeesInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeeStructure(data.feeStructure);
        alert("Success! Your custom fee structure has been updated and applied to the center.");
      } else {
        alert("Failed to save fee structure: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setStructureSaving(false);
    }
  };

  const handleAddExtraFeeItem = () => {
    if (!newExtraName.trim() || !newExtraAmount) {
      alert("Please specify a valid name and amount for the extra-curricular fee item.");
      return;
    }
    const newId = `X-${Date.now()}`;
    setExtraFeesInput(prev => [...prev, { id: newId, name: newExtraName.trim(), amount: Number(newExtraAmount) }]);
    setNewExtraName("");
    setNewExtraAmount("");
  };

  const handleRemoveExtraFeeItem = (id: string) => {
    setExtraFeesInput(prev => prev.filter(item => item.id !== id));
  };

  const handleCreateStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName || !sParent || !sMobile) {
      alert("Please fill in required student fields.");
      return;
    }
    const newStudent: Partial<Student> = {
      centerId: sCenterId || activeCenterId,
      studentName: sName.trim(),
      parentName: sParent.trim(),
      parentMobile: sMobile.trim(),
      age: Number(sAge),
      school: sSchool.trim(),
      currentLevel: Number(sLevel),
      batch: (sBatch === "Custom" ? customBatchVal : sBatch).trim(),
      teacherId: sTeacherId || (teachers[0]?.id || ""),
      email: sEmail.trim() || undefined,
      status: "Active",
      joiningDate: new Date().toISOString().split("T")[0]
    };
    try {
      const result = await onAddStudent(newStudent);
      if (result) {
        alert(`Success! Student ${sName.trim()} registered successfully.`);
        setSName("");
        setSParent("");
        setSMobile("");
        setSEmail("");
        setSSchool("");
        setSAge(8);
        setSLevel(1);
        setSBatch("");
        setCustomBatchVal("");
        setSTeacherId("");
        setShowAddStudent(false);
      }
    } catch (err: any) {
      alert("Failed adding student: " + (err?.message || err));
    }
  };

  const startEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditSName(student.studentName || "");
    setEditSParent(student.parentName || "");
    setEditSMobile(student.parentMobile || "");
    setEditSAge(student.age || 8);
    setEditSSchool(student.school || "");
    setEditSLevel(student.currentLevel !== undefined && student.currentLevel !== null ? student.currentLevel : 1);
    setEditSBatch(student.batch || "");
    setEditSTeacherId(student.teacherId || "");
    setEditSEmail(student.email || "");
    setEditSStatus(student.status || "Active");
  };

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const payload: Partial<Student> = {
      id: editingStudent.id,
      studentName: editSName.trim(),
      parentName: editSParent.trim(),
      parentMobile: editSMobile.trim(),
      age: Number(editSAge),
      school: editSSchool.trim(),
      currentLevel: Number(editSLevel),
      batch: editSBatch.trim(),
      teacherId: editSTeacherId,
      email: editSEmail.trim(),
      status: editSStatus
    };
    if (onEditStudent) {
      onEditStudent(payload);
    }
    setEditingStudent(null);
    if (onRefreshData) onRefreshData();
  };

  const handleLocalDeleteStudent = (studentId: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete student ${name}? This action cannot be undone.`)) {
      if (onDeleteStudent) {
        onDeleteStudent(studentId);
      }
      if (onRefreshData) onRefreshData();
    }
  };

  const handleAssignTeacher = async (studentId: string, teacherId: string) => {
    try {
      const res = await fetch("/api/erp/update-student-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, teacherId })
      });
      const data = await res.json();
      if (data.success) {
        if (onRefreshData) onRefreshData();
      } else {
        alert("Failed to assign teacher: " + data.error);
      }
    } catch (err: any) {
      alert("Error assigning teacher: " + err.message);
    }
  };

  const handleAssignTeacherRole = async (teacherId: string, role: string) => {
    try {
      const res = await fetch("/api/erp/update-teacher-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, role })
      });
      const data = await res.json();
      if (data.success) {
        setTeachers(prev => prev.map(t => t.id === teacherId ? { ...t, role } : t));
        alert(`Success! Updated designation/role for the selected instructor.`);
      } else {
        alert("Failed to update teacher role: " + data.error);
      }
    } catch (e) {
      console.error("Failed updating teacher role", e);
    }
  };

  const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
    if (!confirm(`Are you absolutely sure you want to remove ${teacherName} from your academy's staff roster?`)) {
      return;
    }
    try {
      const res = await fetch("/api/erp/delete-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId })
      });
      const data = await res.json();
      if (data.success) {
        setTeachers(prev => prev.filter(t => t.id !== teacherId));
        alert("Teacher removed successfully.");
      } else {
        alert("Failed to remove teacher: " + data.error);
      }
    } catch (e) {
      console.error("Failed deleting teacher", e);
    }
  };

  const handleCreateExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expName || expAmount <= 0) {
      alert("Please enter a valid expense description and positive amount.");
      return;
    }
    setExpenseSubmitting(true);
    
    const payload = {
      centerId: activeCenterId,
      category: expCategory,
      amount: expAmount,
      date: new Date().toISOString().split("T")[0],
      description: expName
    };
    
    onAddExpense(payload);

    const newE: ExpenseRecord = {
      id: `E_M_${Date.now()}`,
      centerId: activeCenterId,
      category: expCategory,
      amount: expAmount,
      date: new Date().toISOString().split("T")[0],
      description: expName
    };
    
    setExpenses(prev => [...prev, newE]);
    setExpName("");
    setExpAmount(0);
    setExpCategory("Rent");
    setShowAddExpense(false);
    setExpenseSubmitting(false);
    if (onRefreshData) onRefreshData();
  };

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
    .reduce((acc, curr) => acc + ((Number(curr.amount) || 0) - (Number(curr.discount) || 0)), 0);

  const pendingRevenue = fees
    .filter(f => f.status === "Unpaid" || f.status === "Pending Approval")
    .reduce((acc, curr) => acc + ((Number(curr.amount) || 0) - (Number(curr.discount) || 0)), 0);

  // Handles adding new teacher/staff member
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffEmail || !staffMobile) {
      alert("Please fill in all required fields.");
      return;
    }
    const resolvedCenterIds = staffCenterIds.length > 0 ? staffCenterIds : [activeCenterId];
    const newStaff: Partial<Teacher> = {
      centerId: resolvedCenterIds[0] || activeCenterId,
      centerIds: resolvedCenterIds,
      name: staffName,
      email: staffEmail,
      mobile: staffMobile,
      role: staffRole,
      status: "Active",
      joiningDate: new Date().toISOString().split("T")[0],
      signatureUrl: staffSignature,
      signature: staffSignature
    };

    onAddTeacher(newStaff);

    // Reset Form
    setStaffName("");
    setStaffEmail("");
    setStaffMobile("");
    setStaffRole("Teacher");
    setStaffSignature("");
    setStaffCenterIds([activeCenterId]);
    setShowAddStaff(false);
  };

  const handleTeacherSignatureUpload = (teacherId: string, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Str = e.target?.result as string;
      try {
        const res = await fetch("/api/erp/update-teacher", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teacherId,
            signatureUrl: base64Str,
            signature: base64Str
          })
        });
        const data = await res.json();
        if (data.success) {
          setTeachers(prev => prev.map(t => t.id === teacherId ? { ...t, signatureUrl: base64Str, signature: base64Str } : t));
          alert("✅ Teacher signature photo updated successfully!");
          if (onRefreshData) onRefreshData();
        } else {
          alert(data.error || "Failed updating teacher signature.");
        }
      } catch (err) {
        console.error(err);
        alert("Error uploading teacher signature photo.");
      }
    };
    reader.readAsDataURL(file);
  };

  // Approve pending student registration
  const handleApproveStudent = async (student: Student) => {
    if (!confirm(`Approve registration for ${student.studentName}? This will activate their account and send welcome login details via email.`)) {
      return;
    }
    try {
      const res = await fetch("/api/erp/update-student-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, status: "Active" })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Student ${student.studentName} has been approved and activated! Welcome email dispatched.`);
        if (onRefreshData) await onRefreshData();
      } else {
        alert(`Failed to approve student: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error approving student: ${err.message}`);
    }
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
      setInvoiceMonth(getCurrentMonthYear());
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
    setStructureSaving(true);
    setTimeout(() => {
      setStructureSaving(false);
      alert("Fee settings saved successfully for this branch.");
    }, 500);
  };

  if (workspaceMode === "teacher") {
    return (
      <div className="space-y-6">
        <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-3 text-white">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider text-indigo-100">
              Trainer Classroom Mode
            </span>
            <span className="text-xs text-slate-300">
              You are currently viewing student registers, lesson logs, homework, and classroom diagnostics.
            </span>
          </div>
          <button
            onClick={() => setWorkspaceMode("admin")}
            className="bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-black px-4 py-2 rounded-xl border border-slate-700 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Switch to Manager Admin Console</span>
          </button>
        </div>
        
        <TeacherView
          teachers={initialTeachers}
          students={initialStudents}
          fees={initialFees}
          attendance={attendance}
          homework={homework}
          exams={exams}
          onMarkAttendance={onMarkAttendance}
          onPayFee={onPayFee}
          onAddStudent={async (payload) => { onAddStudent(payload); }}
          centers={centers}
          leads={leads}
          onAddLead={onAddLead}
          onRefreshData={onRefreshData}
        />
      </div>
    );
  }

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

      {/* Console Mode Switcher & Multi-Branch Selector */}
      <div className="bg-indigo-50/80 border-2 border-indigo-150/80 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-sm shadow-indigo-150">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 font-display">Console Workspace Switcher</h4>
            <p className="text-xs text-slate-500 mt-0.5">As a <strong>Manager + Lead Trainer</strong>, switch between student records/lessons, sub-centers, and admin tools.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Switcher Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-indigo-200 rounded-2xl px-3 py-1.5 shadow-2xs">
            <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider">Branch:</span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent font-extrabold text-xs text-indigo-950 outline-none cursor-pointer"
            >
              <option value="ALL">🌐 All Assigned Branches ({connectedCenters.length})</option>
              {connectedCenters.map(c => (
                <option key={c.id} value={c.id}>
                  📍 {c.name} ({c.id}) {c.parentCenterId ? '• Sub-Branch' : '• Main Branch'}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
            <button
              onClick={() => setWorkspaceMode("admin")}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                workspaceMode === "admin"
                  ? "bg-white text-indigo-950 shadow-sm"
                  : "text-slate-500 hover:text-indigo-900"
              }`}
            >
              Manager Admin Console
            </button>
            <button
              onClick={() => setWorkspaceMode("teacher")}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                workspaceMode === "teacher"
                  ? "bg-white text-indigo-950 shadow-sm"
                  : "text-slate-500 hover:text-indigo-900"
              }`}
            >
              Trainer Classroom Mode
            </button>
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
          { id: "Students", label: "Students Registry", icon: Users },
          { id: "Staff", label: "Staff & Teachers", icon: Users },
          { id: "Worksheets", label: "Practice Worksheets", icon: BookOpen },
          { id: "Payments", label: "Payment & Fee Desk", icon: CreditCard },
          { id: "FeeSetup", label: "Fee Configuration", icon: Settings },
          { id: "Expenses", label: "Operating Expenses", icon: Landmark },
          { id: "PnL", label: "Interactive Center P&L", icon: TrendingUp },
          { id: "Marketing", label: "Academy Marketing & CRM", icon: Sparkles },
          { id: "Progress", label: "Student Progress & AI Reports", icon: Award },
          { id: "Certificates", label: "Digital Certificates", icon: Award }
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

        {/* STUDENTS REGISTRY SUB-TAB */}
        {activeTab === "Students" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 font-display">Students Master Registry</h3>
                <p className="text-xs text-slate-500 mt-1">Enrolled database for your active branch. Manage classes, update milestone levels, reassign coaches, or edit contacts.</p>
              </div>
              <button
                onClick={() => setShowAddStudent(!showAddStudent)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 self-start cursor-pointer shadow-sm shadow-indigo-100"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{showAddStudent ? "Close Form" : "Register New Student"}</span>
              </button>
            </div>

            {/* REGISTER NEW STUDENT FORM */}
            {showAddStudent && (
              <form onSubmit={handleCreateStudentSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Register New Student Record</h4>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Branch / Sub-Branch *</label>
                  <select
                    value={sCenterId || activeCenterId}
                    onChange={(e) => setSCenterId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none"
                  >
                    {(centers && centers.length > 0 ? centers : [{ id: activeCenterId, name: "Active Branch" }]).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id}) {c.parentCenterId ? '• Sub-Branch' : '• Main Branch'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Student Name *</label>
                    <input
                      type="text"
                      required
                      value={sName}
                      onChange={(e) => setSName(e.target.value)}
                      placeholder="Enter student's full name"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Parent Name *</label>
                    <input
                      type="text"
                      required
                      value={sParent}
                      onChange={(e) => setSParent(e.target.value)}
                      placeholder="Father's or Mother's Name"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Parent Mobile (WhatsApp) *</label>
                    <input
                      type="tel"
                      required
                      value={sMobile}
                      onChange={(e) => setSMobile(e.target.value)}
                      placeholder="10 digit mobile number"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Parent Email (Optional)</label>
                    <input
                      type="email"
                      value={sEmail}
                      onChange={(e) => setSEmail(e.target.value)}
                      placeholder="parent@example.com"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Student Age</label>
                    <input
                      type="number"
                      value={sAge}
                      onChange={(e) => setSAge(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">School Name</label>
                    <input
                      type="text"
                      value={sSchool}
                      onChange={(e) => setSSchool(e.target.value)}
                      placeholder="e.g. DPS Bangalore"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Initial Level</label>
                    <select
                      value={sLevel}
                      onChange={(e) => setSLevel(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(lvl => (
                        <option key={lvl} value={lvl}>Level {lvl}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Batch Schedule</label>
                    <select
                      value={sBatch}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSBatch(val);
                        if (val !== "Custom") {
                          setCustomBatchVal(val);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                    >
                      <option value="">-- Keep Blank / To Be Decided --</option>
                      {Array.from(new Set(teachers.flatMap((t: any) => (t.availableSlots || []) as string[])))
                        .filter((b: any) => b && b.trim() !== "")
                        .map((b: any) => (
                          <option key={b} value={b}>{b}</option>
                        ))
                      }
                      <option value="Custom">-- Custom / Type Manual Schedule --</option>
                    </select>
                    {sBatch === "Custom" && (
                      <input
                        type="text"
                        required
                        value={customBatchVal}
                        onChange={(e) => setCustomBatchVal(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium mt-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g. Mon 04:00 PM"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Assign Primary Teacher / Coach</label>
                    <select
                      value={sTeacherId}
                      onChange={(e) => setSTeacherId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                    >
                      <option value="">-- Choose Instructor --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-200">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2 rounded-xl transition-all shadow-sm"
                  >
                    Confirm & Enroll Student
                  </button>
                </div>
              </form>
            )}

            {/* STUDENTS LIST DATATABLE */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                      <th className="p-3">UID</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Current Level</th>
                      <th className="p-3">Batch Schedule</th>
                      <th className="p-3">Parent Details</th>
                      <th className="p-3">Assigned Teacher</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 italic">No student records registered for this center.</td>
                      </tr>
                    ) : (
                      students.map(s => (
                        <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="p-3 font-mono text-gray-400 font-bold">{s.id}</td>
                          <td className="p-3 font-bold text-slate-900">
                            <div>{s.studentName}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{s.school} (Age {s.age})</div>
                          </td>
                          <td className="p-3">
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 font-extrabold text-[10px] px-2 py-0.5 rounded-md">
                              Level {s.currentLevel}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">{s.batch}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{s.parentName}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{s.parentMobile}</div>
                          </td>
                          <td className="p-3">
                            <select
                              value={s.teacherId || ""}
                              onChange={(e) => handleAssignTeacher(s.id, e.target.value)}
                              className="bg-slate-50 hover:bg-white border border-slate-200 rounded-lg py-1 px-2 text-[11px] font-semibold text-slate-800 outline-none"
                            >
                              <option value="">-- Unassigned --</option>
                              {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
                              ))}
                            </select>
                          </td>
                           <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              s.status === "Pending Approval"
                                ? "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse font-mono"
                                : s.status === "Inactive"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}>
                              {s.status || "Active"}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                            {s.status === "Pending Approval" && (
                              <button
                                type="button"
                                onClick={() => handleApproveStudent(s)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm animate-bounce"
                                title="Approve Registration & Assign Fees"
                              >
                                Approve & Activate
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => startEditStudent(s)}
                              className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLocalDeleteStudent(s.id, s.studentName)}
                              className="bg-rose-50 hover:bg-rose-100 border border-rose-150 text-rose-700 font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FLOATING MODAL OVERLAY TO EDIT STUDENT */}
            {editingStudent && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white border-2 border-slate-200 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wider font-display">Edit Student Milestone Profile</h3>
                    <button
                      type="button"
                      onClick={() => setEditingStudent(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleUpdateStudent} className="space-y-4 text-left">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Student Name</label>
                        <input
                          type="text"
                          required
                          value={editSName}
                          onChange={(e) => setEditSName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Primary Parent Name</label>
                        <input
                          type="text"
                          required
                          value={editSParent}
                          onChange={(e) => setEditSParent(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Parent Contact Mobile</label>
                        <input
                          type="text"
                          required
                          value={editSMobile}
                          onChange={(e) => setEditSMobile(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Email</label>
                        <input
                          type="email"
                          value={editSEmail}
                          onChange={(e) => setEditSEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Age</label>
                        <input
                          type="number"
                          required
                          value={editSAge}
                          onChange={(e) => setEditSAge(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Abacus Level</label>
                        <select
                          value={editSLevel}
                          onChange={(e) => setEditSLevel(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold"
                        >
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(lvl => (
                            <option key={lvl} value={lvl}>Level {lvl}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Status</label>
                        <select
                          value={editSStatus}
                          onChange={(e) => setEditSStatus(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Batch Schedule</label>
                        <input
                          type="text"
                          value={editSBatch}
                          onChange={(e) => setEditSBatch(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Assigned Instructor</label>
                        <select
                          value={editSTeacherId}
                          onChange={(e) => setEditSTeacherId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold"
                        >
                          <option value="">-- Select Instructor --</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">School Name</label>
                      <input
                        type="text"
                        value={editSSchool}
                        onChange={(e) => setEditSSchool(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setEditingStudent(null)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-4 py-2 rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2 rounded-xl transition-all shadow-sm"
                      >
                        Save Profile Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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

                {/* Multi-Center Assignment Checkboxes */}
                {connectedCenters && connectedCenters.length > 1 && (
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-indigo-900 tracking-wider">Assigned Centers / Sub-Branches (Multi-Center Access)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {connectedCenters.map(c => {
                        const checked = staffCenterIds.includes(c.id);
                        return (
                          <label key={c.id} className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setStaffCenterIds(prev => [...prev, c.id]);
                                } else {
                                  setStaffCenterIds(prev => prev.filter(id => id !== c.id));
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{c.name} ({c.id})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Teacher Signature Photo (For Certificates)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setStaffSignature(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold"
                  />
                  {staffSignature && (
                    <div className="mt-2 p-2 bg-white border border-slate-200 rounded-lg inline-block">
                      <span className="text-[10px] text-slate-400 block mb-1 font-bold">Signature Preview:</span>
                      <img src={staffSignature} alt="Signature Preview" className="h-8 w-auto object-contain" />
                    </div>
                  )}
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
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <select
                              value={t.role || ""}
                              onChange={(e) => handleAssignTeacherRole(t.id, e.target.value)}
                              className="bg-indigo-50 border border-indigo-100 hover:border-indigo-200 text-indigo-700 font-bold text-[10px] px-2 py-0.5 rounded-md outline-none"
                            >
                              <option value="Senior Abacus Trainer">Senior Abacus Trainer</option>
                              <option value="Junior Teacher">Junior Teacher</option>
                              <option value="Head Coach">Head Coach</option>
                              <option value="Marketing & Sales Staff">Marketing & Sales Staff</option>
                              <option value="Teacher & Marketing Representative">Teacher & Marketing Representative</option>
                              <option value="Manager + Teacher">Manager + Teacher</option>
                            </select>
                          </div>
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

                        {/* Teacher Signature Photo Management */}
                        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-slate-600">Certificate Signature Photo:</span>
                          {(t.signatureUrl || t.signature) ? (
                            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
                              <img src={t.signatureUrl || t.signature} alt="Signature" className="h-7 w-auto object-contain" />
                              <label className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer bg-white px-2 py-1 rounded border border-indigo-100">
                                Change
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleTeacherSignatureUpload(t.id, file);
                                  }}
                                />
                              </label>
                            </div>
                          ) : (
                            <label className="flex items-center justify-center gap-1.5 p-2 bg-indigo-50/70 hover:bg-indigo-100/70 border border-dashed border-indigo-200 text-indigo-700 text-[10px] font-black rounded-xl cursor-pointer transition-all">
                              <span>✍️ Upload Signature Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleTeacherSignatureUpload(t.id, file);
                                }}
                              />
                            </label>
                          )}
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteTeacher(t.id, t.name)}
                            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 text-[10px] font-black"
                            title="Remove staff member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Staff</span>
                          </button>
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-700">Select Student</label>
                      {mgrInvoiceStudentSearch && (
                        <button type="button" onClick={() => setMgrInvoiceStudentSearch("")} className="text-[9px] text-indigo-600 font-bold hover:underline">Clear</button>
                      )}
                    </div>
                    <div className="relative mb-1">
                      <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Filter student..."
                        value={mgrInvoiceStudentSearch}
                        onChange={(e) => setMgrInvoiceStudentSearch(e.target.value)}
                        className="w-full pl-6 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-800 focus:outline-none"
                      />
                    </div>
                    <select
                      value={selectedStudentForInvoice}
                      onChange={(e) => {
                        const sId = e.target.value;
                        setSelectedStudentForInvoice(sId);
                        const studentFees = fees.filter(f => f.studentId === sId);
                        if (studentFees.length > 0) {
                          const lastFee = [...studentFees].sort((a, b) => {
                            const dateA = a.createdAt || a.issueDate || a.dueDate || "";
                            const dateB = b.createdAt || b.issueDate || b.dueDate || "";
                            return dateB.localeCompare(dateA);
                          })[0];
                          if (lastFee) {
                            if (Number(lastFee.amount) > 0) setInvoiceAmount(Number(lastFee.amount));
                            if (lastFee.discount !== undefined) setInvoiceDiscount(Number(lastFee.discount) || 0);
                          }
                        } else {
                          setInvoiceAmount(2500);
                          setInvoiceDiscount(0);
                        }
                      }}
                      required
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                    >
                      <option value="">-- Choose Student ({
                        students.filter(s => {
                          if (!mgrInvoiceStudentSearch.trim()) return true;
                          const q = mgrInvoiceStudentSearch.toLowerCase().trim();
                          return s.studentName.toLowerCase().includes(q) ||
                            (s.parentMobile || "").includes(q) ||
                            `lvl ${s.currentLevel}`.includes(q) ||
                            (s.batch || "").toLowerCase().includes(q);
                        }).length
                      } found) --</option>
                      {students
                        .filter(s => {
                          if (!mgrInvoiceStudentSearch.trim()) return true;
                          const q = mgrInvoiceStudentSearch.toLowerCase().trim();
                          return s.studentName.toLowerCase().includes(q) ||
                            (s.parentMobile || "").includes(q) ||
                            `lvl ${s.currentLevel}`.includes(q) ||
                            (s.batch || "").toLowerCase().includes(q);
                        })
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.studentName} (Lvl {s.currentLevel} • {s.batch || "No Batch"})</option>
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
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Billing Period / Month <span className="text-[10px] font-normal text-indigo-600">(Auto-set from current date)</span>
                      </label>
                      <input
                        type="text"
                        placeholder={`e.g. ${getCurrentMonthYear()}`}
                        value={invoiceMonth}
                        onChange={(e) => setInvoiceMonth(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Tuition Fees Ledger</h4>
                    <div className="relative">
                      <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search student, fee, month..."
                        value={mgrFeeSearch}
                        onChange={(e) => setMgrFeeSearch(e.target.value)}
                        className="pl-7 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-800 focus:outline-none w-full sm:w-48"
                      />
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1.5">
                    {(() => {
                      const filteredMgrFees = fees.filter(f => {
                        if (!mgrFeeSearch.trim()) return true;
                        const q = mgrFeeSearch.toLowerCase().trim();
                        const sObj = students.find(s => s.id === f.studentId);
                        const displayStudentName = sObj ? sObj.studentName : "";
                        return displayStudentName.toLowerCase().includes(q) ||
                          (f.feeType || "").toLowerCase().includes(q) ||
                          (f.month || "").toLowerCase().includes(q) ||
                          (f.status || "").toLowerCase().includes(q) ||
                          f.id.toLowerCase().includes(q);
                      });

                      if (filteredMgrFees.length === 0) {
                        return (
                          <div className="text-xs text-slate-400 py-6 italic text-center">
                            {fees.length === 0 ? "No fee invoices recorded yet for this center." : "No fee invoices match your search filter."}
                          </div>
                        );
                      }

                      return filteredMgrFees.map(f => {
                        const finalAmt = (Number(f.amount) || 0) - (Number(f.discount) || 0);
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
                                    onClick={async () => {
                                      if (confirm("Are you sure you want to void/delete this invoice?")) {
                                        try {
                                          await onDeleteFee(f.id);
                                          setFees(prev => prev.filter(item => item.id !== f.id));
                                        } catch (err: any) {
                                          alert("Failed to delete invoice: " + (err.message || "Error"));
                                        }
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
                      });
                    })()}
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
                        value={registrationFeeInput}
                        onChange={(e) => setRegistrationFeeInput(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Level Fee (₹)</label>
                      <input
                        type="number"
                        value={levelFeeInput}
                        onChange={(e) => setLevelFeeInput(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Exam Fee (₹)</label>
                      <input
                        type="number"
                        value={examFeeInput}
                        onChange={(e) => setExamFeeInput(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={structureSaving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-2xs transition-all flex items-center gap-1"
                    >
                      {structureSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                      <span>Save Base Rates</span>
                    </button>
                  </div>
                </form>

              </div>

            </div>
          </div>
        )}

        {/* FEE CONFIGURATION */}
        {activeTab === "FeeSetup" && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 font-display">Branch Fee Configuration</h3>
              <p className="text-xs text-slate-500">Configure base pricing policies, level materials charges, exam fees, and general recurring tuition fees.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-50/50 border border-slate-150 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-indigo-600" />
                  Define Standard Center Pricing
                </h4>
                <form onSubmit={handleSaveFeeStructure} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">One-Time Registration Fee (₹)</label>
                      <input
                        type="number"
                        required
                        value={registrationFeeInput}
                        onChange={(e) => setRegistrationFeeInput(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Monthly Tuition Base (₹)</label>
                      <input
                        type="number"
                        required
                        value={levelFeeInput}
                        onChange={(e) => setLevelFeeInput(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Level Exam & Convocation (₹)</label>
                      <input
                        type="number"
                        required
                        value={examFeeInput}
                        onChange={(e) => setExamFeeInput(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">Branch Fee Policies</label>
                    <div className="bg-white p-3 rounded-xl border border-slate-150 space-y-2 text-xs text-slate-600">
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 shrink-0" />
                        <span>Monthly tuition invoices are issued on the 1st of every month with a grace period of 7 days.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 shrink-0" />
                        <span>A custom material kit (abacus tool, notebooks, milestone badges) is charged at ₹1,200 upon initial entry.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 shrink-0" />
                        <span>Extra workshop rates, visual abacus drills, and local contests can be added as custom items during invoice creation.</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-200">
                    <button
                      type="submit"
                      disabled={structureSaving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                    >
                      {structureSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Save Base Rates & Policies</span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150 space-y-4 h-fit">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Branch Fee Setup Guide</h4>
                <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                  <p>In Abacus Venture/Academy centers, maintaining standardized fee policies ensures high operational compliance and standard student kits distribution.</p>
                  <p className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-800 text-[11px]">
                    <strong>Note:</strong> Modifying these settings will immediately update the default values loaded into the Invoice Issuance form under the Payments tab. It does not retroactively change already sent invoices.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OPERATING EXPENSES */}
        {activeTab === "Expenses" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 font-display">Operating Expenses Ledger</h3>
                <p className="text-xs text-slate-500">Record branch overheads, rental deposits, utility charges, trainer salaries, and material sourcing.</p>
              </div>
              <div className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
                Total Branch Expenses: <strong className="text-rose-600 text-sm font-mono">₹{expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0).toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Record Expense Form */}
              <div className="lg:col-span-1 bg-slate-50/50 border border-slate-150 rounded-2xl p-5 space-y-4 h-fit">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-rose-600" />
                  Record New Expense
                </h4>
                <form onSubmit={handleCreateExpenseSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Item / Service Name *</label>
                    <input
                      type="text"
                      required
                      value={expName}
                      onChange={(e) => setExpName(e.target.value)}
                      placeholder="e.g. Monthly Rent, Printer Paper"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                      <input
                        type="number"
                        required
                        value={expAmount}
                        onChange={(e) => setExpAmount(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Billing Date</label>
                      <input
                        type="text"
                        readOnly
                        value={new Date().toISOString().split("T")[0]}
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-500 outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Operational Category</label>
                    <select
                      value={expCategory}
                      onChange={(e) => setExpCategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                    >
                      <option value="Rent & Utilities">Rent & Utilities</option>
                      <option value="Salaries & Incentives">Salaries & Incentives</option>
                      <option value="Marketing & Promotion">Marketing & Promotion</option>
                      <option value="Learning Kit Materials">Learning Kit Materials</option>
                      <option value="Miscellaneous">Miscellaneous</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2 rounded-xl transition-all shadow-xs"
                  >
                    Post Expense Entry
                  </button>
                </form>
              </div>

              {/* Expenses List */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                        <th className="p-3">Expense Date</th>
                        <th className="p-3">Particulars</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 italic">No business expenses recorded for this center.</td>
                        </tr>
                      ) : (
                        expenses.map(exp => (
                          <tr key={exp.id} className="border-b border-slate-150 hover:bg-slate-50/50">
                            <td className="p-3 font-mono text-slate-500 font-bold">{exp.date}</td>
                            <td className="p-3 font-bold text-slate-800">{exp.item}</td>
                            <td className="p-3">
                              <span className="bg-slate-100 text-slate-600 border border-slate-200 font-bold text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded">
                                {exp.category}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-black text-rose-600">₹{exp.amount.toLocaleString("en-IN")}</td>
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

        {/* INTERACTIVE CENTER P&L */}
        {activeTab === "PnL" && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 font-display">Interactive Profit & Loss Diagnostics</h3>
              <p className="text-xs text-slate-500">Analyze real-time gross receipts against operational costs. Assess branch sustainability margins and profit distribution.</p>
            </div>

            {/* PNL summary blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-1 shadow-xs">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Gross Fee Collections</span>
                <h4 className="text-2xl font-black text-emerald-950 font-display">₹{totalRevenue.toLocaleString("en-IN")}</h4>
                <p className="text-[10px] text-emerald-700 font-bold mt-1">Based on {paidFeesCount} cleared invoice payments</p>
              </div>

              <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl space-y-1 shadow-xs">
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Operating Expenditures</span>
                <h4 className="text-2xl font-black text-rose-950 font-display">₹{expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0).toLocaleString("en-IN")}</h4>
                <p className="text-[10px] text-rose-700 font-bold mt-1">Total recorded overheads & salaries</p>
              </div>

              {(() => {
                const totalExp = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
                const netProfit = totalRevenue - totalExp;
                const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
                return (
                  <div className={`p-5 rounded-2xl border space-y-1 shadow-xs ${netProfit >= 0 ? "bg-indigo-50 border-indigo-200" : "bg-amber-50 border-amber-200"}`}>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${netProfit >= 0 ? "text-indigo-600" : "text-amber-700"}`}>Net Branch Surplus</span>
                    <h4 className={`text-2xl font-black font-display ${netProfit >= 0 ? "text-indigo-950" : "text-amber-900"}`}>
                      ₹{netProfit.toLocaleString("en-IN")}
                    </h4>
                    <p className={`text-[10px] font-bold mt-1 ${netProfit >= 0 ? "text-indigo-700" : "text-amber-800"}`}>
                      Profit Margin: <span className="font-mono">{profitMargin.toFixed(1)}%</span>
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* EXPENSE BREAKDOWN VS INCOME GAUGE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Revenue to Expense Distribution Ratio</h4>
                {(() => {
                  const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
                  const netProfit = totalRevenue - totalExp;
                  const expPercent = totalRevenue > 0 ? Math.min(100, (totalExp / totalRevenue) * 100) : 0;
                  const profitPercent = Math.max(0, 100 - expPercent);
                  return (
                    <div className="space-y-4">
                      <div className="h-6 w-full rounded-full bg-rose-200 overflow-hidden flex text-[10px] font-bold text-white shadow-inner">
                        <div
                          style={{ width: `${profitPercent}%` }}
                          className="bg-indigo-600 flex items-center justify-center transition-all duration-500"
                        >
                          {profitPercent > 15 ? `Net Profit ${profitPercent.toFixed(0)}%` : ""}
                        </div>
                        <div
                          style={{ width: `${expPercent}%` }}
                          className="bg-rose-500 flex items-center justify-center transition-all duration-500"
                        >
                          {expPercent > 15 ? `Costs ${expPercent.toFixed(0)}%` : ""}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-indigo-600 rounded-sm inline-block" />
                          <span>Tuition Retained Capital: ₹{netProfit > 0 ? netProfit.toLocaleString("en-IN") : "0"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-rose-500 rounded-sm inline-block" />
                          <span>Operating Overhead Cash: ₹{totalExp.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Operational Advisory based on data */}
              <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Branch Advisory Insights</h4>
                {(() => {
                  const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
                  const netProfit = totalRevenue - totalExp;
                  const leadsCount = leads.length;
                  const studentCount = students.length;

                  let adviceTitle = "Healthy Operations Margin";
                  let adviceMsg = "Your branch is operating with a favorable profit margin. Consider deploying extra capital to run local abacus trial workshops or schools promotion.";
                  
                  if (netProfit < 0) {
                    adviceTitle = "Immediate Cost Consolidation Advised";
                    adviceMsg = "Operating expenses are exceeding gross collections. We highly recommend reviewing marketing budgets, utility expenses, or issuing remaining outstanding invoices (₹" + pendingRevenue.toLocaleString("en-IN") + " is currently pending collection!).";
                  } else if (leadsCount < 3) {
                    adviceTitle = "Low Enrollment Funnel Pipeline";
                    adviceMsg = "You currently have less than 3 active marketing leads. Boost outreach campaigns or run abacus weekend demo slots to scale up conversions.";
                  } else if (studentCount < 5) {
                    adviceTitle = "Scale Classroom Registrations";
                    adviceMsg = "The branch is functioning under target density. Try organizing standard trial challenges in nearby residential associations to build quick momentum.";
                  }

                  return (
                    <div className="space-y-2 text-xs">
                      <div className="bg-white p-3 border border-slate-200 rounded-xl">
                        <div className="font-extrabold text-indigo-950 text-[13px] flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>{adviceTitle}</span>
                        </div>
                        <p className="text-slate-500 mt-1 leading-relaxed text-[11px]">{adviceMsg}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* MARKETING SUB-TAB (CRM View integration) */}
        {activeTab === "Marketing" && (
          <div className="space-y-4 animate-fade-in">
            <CrmView leads={leads} onAddLead={onAddLead} teachers={teachers} centers={centers} currentUser={loggedInInfo} currentRole={loggedInInfo?.role || "Manager + Teacher"} />
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
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(l => (
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

        {activeTab === "Certificates" && (
          <div className="space-y-4 animate-fade-in">
            <DigitalCertificateManager
              currentTeacher={{
                id: loggedInInfo?.id || "ADMIN",
                centerId: activeCenterId,
                name: loggedInInfo?.name || "Center Admin",
                email: loggedInInfo?.email || "",
                mobile: "",
                joiningDate: "",
                role: "Center Admin",
                status: "Active"
              }}
              students={students}
              center={activeCenter}
              teachers={teachers}
              onRefreshData={onRefreshData}
            />
          </div>
        )}

      </div>

    </div>
  );
}
